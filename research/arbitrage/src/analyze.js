import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { ASSETS, COSTS } from './config.js'
import { analyzeDex } from './dex.js'
import { analyzeDirectStockRoute } from './direct-stock.js'
import { analyzeLending } from './lending.js'
import { analyzeLiveBasis } from './live-basis.js'
import { makeMarkdown } from './report.js'
import { analyzeWeekendBasis } from './weekend-basis.js'

const here = path.dirname(fileURLToPath(import.meta.url))
const outputDirectory = path.resolve(here, '../output')

const liveBasis = await analyzeLiveBasis()
const cexMidByUnderlying = Object.fromEntries(ASSETS.map(asset => {
  const observation = liveBasis.find(item => item.symbols.spot === asset.spot)
  const mid = observation ? (observation.top.spotBid + observation.top.spotAsk) / 2 : null
  return [asset.underlying, mid]
}))

const [weekendBasis, lending, dex] = await Promise.all([
  analyzeWeekendBasis(),
  analyzeLending(),
  analyzeDex(cexMidByUnderlying)
])

const report = {
  generatedAt: new Date().toISOString(),
  assumptions: COSTS,
  directStock: analyzeDirectStockRoute(),
  liveBasis,
  weekendBasis,
  dex,
  lending,
  overallConclusion: 'The harness found price differences, but none is proven risk-free and executable end-to-end. Direct conversion lacks a supported public API; the live spot/perpetual gaps did not clear modeled round-trip costs; DEX observations are indicative rather than size-specific quotes; weekend gaps carry fill and convergence risk; and current Venus bStock collateral markets return 0% supply APY before dividends while stablecoin borrowing costs are positive.'
}

await fs.mkdir(outputDirectory, { recursive: true })
await fs.writeFile(path.join(outputDirectory, 'latest.json'), `${JSON.stringify(report, null, 2)}\n`)
await fs.writeFile(path.join(outputDirectory, 'latest.md'), makeMarkdown(report))
console.log(makeMarkdown(report))
