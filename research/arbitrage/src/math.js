import Decimal from 'decimal.js'

export const D = value => new Decimal(value)

export function bps(numerator, denominator) {
  return D(numerator).div(denominator).minus(1).mul(10_000)
}

export function walkBook(levels, requestedNotionalUsd) {
  let remaining = D(requestedNotionalUsd)
  let base = D(0)
  let quote = D(0)

  for (const [rawPrice, rawQuantity] of levels) {
    const price = D(rawPrice)
    const availableBase = D(rawQuantity)
    const availableQuote = availableBase.mul(price)
    const usedQuote = Decimal.min(remaining, availableQuote)
    const usedBase = usedQuote.div(price)
    quote = quote.plus(usedQuote)
    base = base.plus(usedBase)
    remaining = remaining.minus(usedQuote)
    if (remaining.lte(0)) break
  }

  return {
    filled: remaining.lte('0.00000001'),
    requestedNotionalUsd: D(requestedNotionalUsd).toNumber(),
    filledNotionalUsd: quote.toNumber(),
    baseQuantity: base.toNumber(),
    averagePrice: base.eq(0) ? null : quote.div(base).toNumber()
  }
}

export function round(value, places = 4) {
  if (value === null || value === undefined || !Number.isFinite(Number(value))) return null
  return Number(Number(value).toFixed(places))
}

