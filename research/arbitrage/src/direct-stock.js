import { COSTS } from './config.js'

export function analyzeDirectStockRoute() {
  return {
    status: 'not-testable-with-official-public-api',
    conversionClaim: 'Binance states eligible users can convert direct-stock positions and corresponding bStocks 1:1 with no conversion fee.',
    missingEvidence: [
      'No direct-stock quote endpoint appears in the official Binance developer catalog.',
      'No stock-to-bStock conversion endpoint appears in the official Binance SDK catalog.',
      'Eligibility and conversion availability are account- and jurisdiction-dependent.'
    ],
    documentedCosts: COSTS,
    minimumGrossSpreadExamplesBps: {
      at100UsdIgnoringTradingExit: 35,
      at350UsdIgnoringTradingExit: 10,
      above350UsdIgnoringTradingExit: 10
    },
    verdict: 'Potentially the closest route to conversion arbitrage, but no concrete executable opportunity can be proven from supported public interfaces.'
  }
}

