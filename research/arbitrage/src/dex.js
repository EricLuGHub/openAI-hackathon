import { ASSETS } from './config.js'
import { fetchJson, venusMarkets } from './clients.js'
import { round } from './math.js'

export async function analyzeDex(indicatedCexMidByUnderlying) {
  const results = []
  for (const asset of ASSETS) {
    const venus = await venusMarkets(asset.underlying)
    const tokenAddress = venus.result?.[0]?.underlyingAddress
    if (!tokenAddress) {
      results.push({ asset: asset.name, status: 'No verified token address found through Venus.' })
      continue
    }
    const pairs = await fetchJson(`https://api.dexscreener.com/token-pairs/v1/bsc/${tokenAddress}`)
    const cexMid = indicatedCexMidByUnderlying[asset.underlying]
    const relevant = pairs
      .filter(pair => Number(pair.liquidity?.usd ?? 0) > 0 && Number.isFinite(Number(pair.priceUsd)))
      .sort((a, b) => Number(b.liquidity?.usd ?? 0) - Number(a.liquidity?.usd ?? 0))
      .slice(0, 10)
      .map(pair => {
        const dexPrice = Number(pair.priceUsd)
        return {
          dex: pair.dexId,
          pairAddress: pair.pairAddress,
          pair: `${pair.baseToken.symbol}/${pair.quoteToken.symbol}`,
          priceUsd: dexPrice,
          liquidityUsd: Number(pair.liquidity?.usd ?? 0),
          volume24hUsd: Number(pair.volume?.h24 ?? 0),
          priceDifferenceToCexMidBps: cexMid ? round((dexPrice / cexMid - 1) * 10_000, 2) : null,
          url: pair.url
        }
      })
    results.push({
      asset: asset.name,
      underlying: asset.underlying,
      tokenAddress,
      cexMid,
      pairs: relevant,
      evidenceQuality: 'DEX Screener supplies indicative last prices and liquidity, not an executable size-specific quote.'
    })
  }
  return results
}
