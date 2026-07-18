export const ASSETS = [
  { name: 'NVIDIA', spot: 'NVDABUSDT', perp: 'NVDAUSDT', underlying: 'NVDAB' },
  { name: 'Tesla', spot: 'TSLABUSDT', perp: 'TSLAUSDT', underlying: 'TSLAB' },
  { name: 'SpaceX', spot: 'SPCXBUSDT', perp: 'SPCXUSDT', underlying: 'SPCXB' },
  { name: 'Strategy', spot: 'MSTRBUSDT', perp: 'MSTRUSDT', underlying: 'MSTRB' },
  { name: 'Meta', spot: 'METABUSDT', perp: 'METAUSDT', underlying: 'METAB' },
  { name: 'Coinbase', spot: 'COINBUSDT', perp: 'COINUSDT', underlying: 'COINB' }
]

// These are transparent research assumptions, not claims about a user's tier.
// Override them with environment variables when actual fee schedules are known.
export const COSTS = {
  spotTakerBps: Number(process.env.SPOT_TAKER_BPS ?? 0),
  futuresTakerBps: Number(process.env.FUTURES_TAKER_BPS ?? 5),
  safetySlippageBps: Number(process.env.SAFETY_SLIPPAGE_BPS ?? 2),
  directStockSmallOrderFeeUsd: 0.35,
  directStockLargeOrderSpreadBps: 10,
  directStockSmallOrderCutoffUsd: 350
}

export const BINANCE_SPOT_URL = 'https://api.binance.com'
export const BINANCE_FUTURES_URL = 'https://fapi.binance.com'
export const VENUS_URL = 'https://api.venus.io'
