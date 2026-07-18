import { round } from './math.js'

function bestLiveRoute(item) {
  return item.routes
    .filter(route => route.executableAtDepth)
    .sort((a, b) => b.convergenceNetBpsBeforeFunding - a.convergenceNetBpsBeforeFunding)[0]
}

export function makeMarkdown(report) {
  const lines = [
    '# bStock Arbitrage Evidence Report',
    '',
    `Generated: ${report.generatedAt}`,
    '',
    'Read-only public-data research. No orders were placed.',
    '',
    '## 1. bStock versus Binance direct stock',
    '',
    `**Verdict:** ${report.directStock.verdict}`,
    '',
    ...report.directStock.missingEvidence.map(item => `- ${item}`),
    '',
    '## 2. bStock versus matching perpetual',
    '',
    '| Asset | Best tested direction/size | Gross bps | Convergence net bps* | Verdict |',
    '|---|---:|---:|---:|---|'
  ]

  for (const item of report.liveBasis) {
    const best = bestLiveRoute(item)
    const verdict = best?.convergenceNetBpsBeforeFunding > 0 ? 'Potential basis capture; convergence/funding still uncertain' : 'No positive round trip after assumptions'
    lines.push(`| ${item.asset} | ${best?.label ?? 'n/a'} / $${best?.notional ?? 0} | ${best?.grossBps ?? 'n/a'} | ${best?.convergenceNetBpsBeforeFunding ?? 'n/a'} | ${verdict} |`)
  }
  lines.push('', `*Assumes ${report.assumptions.spotTakerBps} bps bStock spot, ${report.assumptions.futuresTakerBps} bps futures per trade, and ${report.assumptions.safetySlippageBps} bps safety slippage per side. Future funding is excluded.`)

  lines.push('', '## 3. Binance versus BNB Chain DEXs', '')
  for (const item of report.dex) {
    const pair = item.pairs?.[0]
    lines.push(`- **${item.asset}:** ${pair ? `${pair.dex} ${pair.pair} indicates ${pair.priceDifferenceToCexMidBps} bps versus the Binance midpoint with $${round(pair.liquidityUsd, 0)} reported liquidity` : (item.status ?? 'no finite USD-priced DEX pair returned')}. This is not an executable quote.`)
  }

  lines.push('', '## 4. Weekend/overnight basis', '')
  for (const item of report.weekendBasis) {
    lines.push(`- **${item.asset}:** largest aligned 5-minute close basis was ${item.maximumObservedAbsoluteCloseBasisBps} bps at ${item.maximumObservedAt}; ${item.weekendSamples} weekend samples were available.`)
  }

  lines.push('', '## 5. Lending and funding carry', '')
  for (const item of report.lending.collateral) {
    lines.push(`- **${item.underlyingSymbol}:** ${round(item.supplyApyPercent, 4)}% supply APY, $${round(item.suppliedUsd, 0)} supplied, $${round(item.borrowedUsd, 0)} borrowed, collateral factor ${round(item.collateralFactor * 100, 1)}%.`)
  }
  const stable = [...report.lending.stablecoins].sort((a, b) => a.borrowApyPercent - b.borrowApyPercent)[0]
  if (stable) lines.push(`- Cheapest returned listed stablecoin borrow market: **${stable.underlyingSymbol} at ${round(stable.borrowApyPercent, 4)}% APY** (${stable.symbol}).`)

  lines.push('', '## Overall', '', report.overallConclusion, '')
  return lines.join('\n')
}
