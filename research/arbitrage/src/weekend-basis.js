import { ASSETS } from './config.js'
import { futuresClient, spotClient } from './clients.js'
import { D, round } from './math.js'

function keyedKlines(rows) {
  return new Map(rows.map(row => [Number(row[0]), Number(row[4])]))
}

export async function analyzeWeekendBasis({ interval = '5m', limit = 1000 } = {}) {
  const results = []
  for (const asset of ASSETS) {
    const [spotRows, perpRows, fundingResponse] = await Promise.all([
      spotClient.klines(asset.spot, interval, { limit }).then(r => r.data),
      futuresClient.getKlines(asset.perp, interval, undefined, undefined, limit).then(r => r.data),
      futuresClient.getFundingRate(asset.perp, undefined, undefined, 100).then(r => r.data)
    ])
    const spot = keyedKlines(spotRows)
    const samples = []
    for (const row of perpRows) {
      const timestamp = Number(row[0])
      const spotClose = spot.get(timestamp)
      if (!spotClose) continue
      const perpClose = Number(row[4])
      samples.push({
        timestamp,
        time: new Date(timestamp).toISOString(),
        spotClose,
        perpClose,
        signedBps: D(perpClose).div(spotClose).minus(1).mul(10_000).toNumber(),
        isWeekendUtc: [0, 6].includes(new Date(timestamp).getUTCDay())
      })
    }
    const ranked = [...samples].sort((a, b) => Math.abs(b.signedBps) - Math.abs(a.signedBps))
    const weekend = samples.filter(s => s.isWeekendUtc)
    const fundingSum = fundingResponse.reduce((sum, item) => sum.plus(item.fundingRate), D(0))
    results.push({
      asset: asset.name,
      interval,
      alignedSamples: samples.length,
      weekendSamples: weekend.length,
      maximumObservedAbsoluteCloseBasisBps: round(ranked[0]?.signedBps, 3),
      maximumObservedAt: ranked[0]?.time ?? null,
      latestSignedCloseBasisBps: round(samples.at(-1)?.signedBps, 3),
      fundingPaymentsObserved: fundingResponse.length,
      cumulativeFundingForReturnedWindowBps: round(fundingSum.mul(10_000).toNumber(), 4),
      largestFive: ranked.slice(0, 5).map(x => ({ ...x, signedBps: round(x.signedBps, 3) })),
      evidenceQuality: 'Kline closes are historical evidence, not executable bid/ask quotes.'
    })
  }
  return results
}

if (process.argv[1]?.endsWith('weekend-basis.js')) {
  console.log(JSON.stringify(await analyzeWeekendBasis(), null, 2))
}

