import { Spot } from '@binance/connector'
import { UMFutures } from '@binance/futures-connector'
import {
  BINANCE_FUTURES_URL,
  BINANCE_SPOT_URL,
  VENUS_URL
} from './config.js'

export const spotClient = new Spot('', '', {
  baseURL: BINANCE_SPOT_URL,
  timeout: 15_000
})

export const futuresClient = new UMFutures('', '', {
  baseURL: BINANCE_FUTURES_URL,
  timeout: 15_000
})

export async function fetchJson(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: { accept: 'application/json', ...options.headers },
    signal: AbortSignal.timeout(15_000)
  })
  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}: ${url}`)
  }
  return response.json()
}

export async function venusMarkets(underlyingSymbol) {
  const url = new URL('/markets', VENUS_URL)
  url.searchParams.set('chainId', '56')
  url.searchParams.set('underlyingSymbol', underlyingSymbol)
  url.searchParams.set('limit', '50')
  return fetchJson(url)
}

