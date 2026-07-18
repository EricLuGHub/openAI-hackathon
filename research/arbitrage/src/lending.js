import { ASSETS } from './config.js'
import { venusMarkets } from './clients.js'

function simplify(market) {
  return {
    symbol: market.symbol,
    underlyingSymbol: market.underlyingSymbol,
    address: market.address,
    isListed: market.isListed,
    isBorrowable: market.isBorrowable,
    canBeCollateral: market.canBeCollateral,
    supplyApyPercent: Number(market.totalSupplyApyDecimal ?? market.supplyApyDecimal ?? 0) * 100,
    borrowApyPercent: Number(market.totalBorrowApyDecimal ?? market.borrowApyDecimal ?? 0) * 100,
    suppliedUsd: Number(market.totalSupplyUnderlyingCents ?? 0) / 100,
    borrowedUsd: Number(market.totalBorrowCents ?? 0) / 100,
    availableLiquidityUsd: Number(market.liquidityCents ?? 0) / 100,
    collateralFactor: Number(market.collateralFactorMantissa ?? 0) / 1e18,
    liquidationThreshold: Number(market.liquidationThresholdMantissa ?? 0) / 1e18
  }
}

export async function analyzeLending() {
  const collateral = []
  for (const asset of ASSETS) {
    const response = await venusMarkets(asset.underlying)
    for (const market of response.result ?? []) collateral.push(simplify(market))
  }

  const stablecoins = []
  for (const symbol of ['USDT', 'USDC', 'lisUSD']) {
    const response = await venusMarkets(symbol)
    for (const market of response.result ?? []) {
      if (market.isListed) stablecoins.push(simplify(market))
    }
  }

  return {
    observedAt: new Date().toISOString(),
    collateral,
    stablecoins,
    conclusionRule: 'A hedged carry route requires collateral yield plus incentives and funding received to exceed stablecoin borrowing APY, trading costs, and liquidation risk.'
  }
}

if (process.argv[1]?.endsWith('lending.js')) {
  console.log(JSON.stringify(await analyzeLending(), null, 2))
}

