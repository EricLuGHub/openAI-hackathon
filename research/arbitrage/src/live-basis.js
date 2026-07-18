import { ASSETS, COSTS } from './config.js'
import { futuresClient, spotClient } from './clients.js'
import { D, bps, round, walkBook } from './math.js'

async function getDepth(asset, limit = 100) {
  const [spot, perp, premium] = await Promise.all([
    spotClient.depth(asset.spot, { limit }).then(r => r.data),
    futuresClient.getDepth(asset.perp, limit).then(r => r.data),
    futuresClient.getPremiumIndex(asset.perp).then(r => r.data)
  ])
  return { spot, perp, premium }
}

function analyzeDirection({ buyLevels, sellLevels, notional, label, fundingRate }) {
  const buy = walkBook(buyLevels, notional)
  const sell = walkBook(sellLevels, notional)
  if (!buy.filled || !sell.filled) {
    return { label, notional, executableAtDepth: false, buy, sell }
  }

  const quantity = Math.min(buy.baseQuantity, sell.baseQuantity)
  const buyCost = D(quantity).mul(buy.averagePrice)
  const sellProceeds = D(quantity).mul(sell.averagePrice)
  const grossBps = sellProceeds.div(buyCost).minus(1).mul(10_000)
  const entryCosts = D(COSTS.spotTakerBps)
    .plus(COSTS.futuresTakerBps)
    .plus(COSTS.safetySlippageBps)
  const roundTripCosts = D(COSTS.spotTakerBps)
    .plus(COSTS.futuresTakerBps)
    .mul(2)
    .plus(D(COSTS.safetySlippageBps).mul(2))

  return {
    label,
    notional,
    executableAtDepth: true,
    quantity: round(quantity, 8),
    averageBuy: round(buy.averagePrice, 6),
    averageSell: round(sell.averagePrice, 6),
    grossBps: round(grossBps.toNumber(), 3),
    assumedOneWayCostsBps: entryCosts.toNumber(),
    entryNetBps: round(grossBps.minus(entryCosts).toNumber(), 3),
    assumedRoundTripCostsBps: roundTripCosts.toNumber(),
    convergenceNetBpsBeforeFunding: round(grossBps.minus(roundTripCosts).toNumber(), 3),
    fundingRatePerIntervalBps: round(D(fundingRate || 0).mul(10_000).toNumber(), 4),
    caveat: 'Exit costs and future funding are not included.'
  }
}

export async function analyzeLiveBasis(notionals = [100, 1_000, 10_000]) {
  const observations = []
  for (const asset of ASSETS) {
    const { spot, perp, premium } = await getDepth(asset)
    const top = {
      spotBid: Number(spot.bids[0][0]),
      spotAsk: Number(spot.asks[0][0]),
      perpBid: Number(perp.bids[0][0]),
      perpAsk: Number(perp.asks[0][0]),
      spotToPerpGrossBps: round(bps(perp.bids[0][0], spot.asks[0][0]).toNumber(), 3),
      perpToSpotGrossBps: round(bps(spot.bids[0][0], perp.asks[0][0]).toNumber(), 3)
    }
    const routes = []
    for (const notional of notionals) {
      routes.push(analyzeDirection({
        buyLevels: spot.asks,
        sellLevels: perp.bids,
        notional,
        label: 'buy bStock / short perpetual',
        fundingRate: premium.lastFundingRate
      }))
      routes.push(analyzeDirection({
        buyLevels: perp.asks,
        sellLevels: spot.bids,
        notional,
        label: 'buy perpetual / sell bStock inventory',
        fundingRate: premium.lastFundingRate
      }))
    }
    observations.push({
      asset: asset.name,
      symbols: { spot: asset.spot, perpetual: asset.perp },
      observedAt: new Date().toISOString(),
      top,
      markPrice: Number(premium.markPrice),
      indexPrice: Number(premium.indexPrice),
      fundingRate: Number(premium.lastFundingRate),
      routes
    })
  }
  return observations
}

if (process.argv[1]?.endsWith('live-basis.js')) {
  console.log(JSON.stringify(await analyzeLiveBasis(), null, 2))
}
