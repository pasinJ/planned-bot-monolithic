# Technical Analysis Module

- [Technical Analysis Module](#technical-analysis-module)
    - [`ta.crossover`](#tacrossover)
    - [`ta.crossunder`](#tacrossunder)
    - [`ta.falling`](#tafalling)
    - [`ta.rising`](#tarising)
    - [`ta.highest`](#tahighest)
    - [`ta.lowest`](#talowest)
    - [`ta.trend.sma`](#tatrendsma)
    - [`ta.trend.ema`](#tatrendema)
    - [`ta.trend.wma`](#tatrendwma)
    - [`ta.trend.vwma`](#tatrendvwma)
    - [`ta.trend.supertrend`](#tatrendsupertrend)
    - [`ta.trend.psar`](#tatrendpsar)
    - [`ta.volume.obv`](#tavolumeobv)
    - [`ta.volume.pvt`](#tavolumepvt)
    - [`ta.volume.mfi`](#tavolumemfi)
    - [`ta.volume.ad`](#tavolumead)
    - [`ta.volume.wad`](#tavolumewad)
    - [`ta.volume.emv`](#tavolumeemv)
    - [`ta.volume.vwap`](#tavolumevwap)
    - [`ta.momentum.momentum`](#tamomentummomentum)
    - [`ta.momentum.macd`](#tamomentummacd)
    - [`ta.momentum.rsi`](#tamomentumrsi)
    - [`ta.momentum.adx`](#tamomentumadx)
    - [`ta.momentum.roc`](#tamomentumroc)
    - [`ta.momentum.stoch`](#tamomentumstoch)
    - [`ta.momentum.stochRsi`](#tamomentumstochrsi)
    - [`ta.volatility.bb`](#tavolatilitybb)
    - [`ta.volatility.bbw`](#tavolatilitybbw)
    - [`ta.volatility.kc`](#tavolatilitykc)
    - [`ta.volatility.atr`](#tavolatilityatr)

### `ta.crossover`
Check if the first array cross over the second array (or value) at the last value<br/>
**Signature:** `(values: readonly number[], crossoverWith: number | readonly number[]) => boolean`<br/>
**Arguments:**
- `values`: An array of number with length more than 1
- `crossoverWith`: Number or array of numbers to compare with the first argument

### `ta.crossunder`
Check if the first array cross under the second array (or value) at the last value<br/>
**Signature:** `(values: readonly number[], crossunderWith: number | readonly number[]) => boolean`<br/>
**Arguments:**
- `values`: An array of number with length more than 1
- `crossunderWith`: Number or array of numbers to compare with the first argument

### `ta.falling`
Check if the `source` array is now falling (continuously decrease) for `period` values long<br/>
**Signature:** `(source: readonly number[], period: number) => boolean`<br/>
**Arguments:**
- `source`: An array of number
- `period`: Expected number of continuously decrease period

### `ta.rising`
Check if the `source` array is now rising (continuously increase) for `period` values long<br/>
**Signature:** `(source: readonly number[], period: number) => boolean`<br/>
**Arguments:**
- `source`: An array of number
- `period`: Expected number of continuously increase period

### `ta.highest`
Get highest value of the given number of `period` values back. `undefined` will be returned if the `source` array is empty.<br/>
**Signature:** `(source: readonly number[], period: number) => number | undefined`<br/>
**Arguments:**
- `source`: An array of number
- `period`: Number of period to check

### `ta.lowest`
Get lowest value of the given number of `period` values back. `undefined` will be returned if the `source` array is empty.<br/>
**Signature:** `(source: readonly number[], period: number) => number | undefined`<br/>
**Arguments:**
- `source`: An array of number
- `period`: Number of period to check

### `ta.trend.sma`
Simple moving average<br/>
**Signature:** `(source: readonly number[], period: number) => Promise<readonly number[]>`<br/>
**Arguments:**
- `source`: Series of values to process
- `period`: Number of bars

### `ta.trend.ema`
Exponential moving average<br/>
**Signature:** `(source: readonly number[], period: number) => Promise<readonly number[]>`<br/>
**Arguments:**
- `source`: Series of values to process
- `period`: Number of bars

### `ta.trend.wma`
Weighted moving average<br/>
**Signature:** `(source: readonly number[], period: number) => Promise<readonly number[]>`<br/>
**Arguments:**
- `source`: Series of values to process
- `period`: Number of bars

### `ta.trend.vwma`
Volume-weighted moving average<br/>
**Signature:** `(source: readonly number[], period: number) => Promise<readonly number[]>`<br/>
**Arguments:**
- `source`: Series of values to process
- `period`: Number of bars

### `ta.trend.supertrend`
Supertrend<br/>
**Signature:** `(fator: number, atrPeriod: number>) => Promise<DeepReadonly<{ supertrend: number[]; direction: number[] }>>`<br/>
**Arguments:**
- `factor`: Multiplier for ATR
- `atrPeriod`: Period of ATR

### `ta.trend.psar`
Parabolic SAR<br/>
**Signature:** `(step: number, max: number) => Promise<readonly number[]>`<br/>
**Arguments:**
- `step`: Acceleration increment step
- `max`: Maximum acceleration

### `ta.volume.obv`
On balance volume<br/>
**Signature:** `() => Promise<readonly number[]>`<br/>
**Arguments:** -

### `ta.volume.pvt`
Price-volume trend<br/>
**Signature:** `() => readonly number[]`<br/>
**Arguments:** -

### `ta.volume.mfi`
Money flow index<br/>
**Signature:** `(period: number) => Promise<readonly number[]>`<br/>
**Arguments:**
- `period`: Number of bars

### `ta.volume.ad`
Accumulation/Distribution line<br/>
**Signature:** `() => Promise<readonly number[]>`<br/>
**Arguments:** -

### `ta.volume.wad`
Williams Accumulation/Distribution<br/>
**Signature:** `() => Promise<readonly number[]>`<br/>
**Arguments:** -

### `ta.volume.emv`
Ease of movement<br/>
**Signature:** `() => Promise<readonly number[]>`<br/>
**Arguments:** -

### `ta.volume.vwap`
Volume weighted average price<br/>
**Signature:** `(period: number) => Promise<readonly number[]>`<br/>
**Arguments:**
- `period`: Number of bars

### `ta.momentum.momentum`
Momentum<br/>
**Signature:** `(source: readonly number[], period: number) => Promise<readonly number[]>`<br/>
**Arguments:**
- `source`: Series of values to process
- `period`: Period of value to compare

### `ta.momentum.macd`
Moving average Convergence/Divergence<br/>
**Signature:** `(source: readonly number[], shortPeriod: number, longPeriod: number, signalPeriod: number) => Promise<DeepReadonly<{ macd: number[]; signal: number[]; histogram: number[] }>>`<br/>
**Arguments:**
- `source`: Series of values to process
- `shortPeriod`: Period of short EMA
- `longPeriod`: Period of long EMA
- `signalPeriod`: Period of signal

### `ta.momentum.rsi`
Relative strength index<br/>
**Signature:** `(source: readonly number[], period: number) => Promise<readonly number[]>`<br/>
**Arguments:**
- `source`: Series of values to process
- `period`: Number of bars

### `ta.momentum.adx`
Average direction index<br/>
**Signature:** `(period: number) => Promise<readonly number[]>`<br/>
**Arguments:**
- `period`: Number of bars

### `ta.momentum.roc`
Rate of change<br/>
**Signature:** `(source: readonly number[], period: number) => Promise<readonly number[]>`<br/>
**Arguments:**
- `source`: Series of values to process
- `period`: Number of bars

### `ta.momentum.stoch`
Stochastic Oscillator <br/>
**Signature:** `(kPeriod: number, kSlow: number, dPeriod: number) => Promise<DeepReadonly<{ stoch: number[]; stochMa: number[] }>>`<br/>
**Arguments:**
- `kPeriod`: Period of moving average of %K
- `kSlow`: Period of slow oscillating %K
- `dPeriod`: Period of %D

### `ta.momentum.stochRsi`
Stochastic RSI<br/>
**Signature:** `(source: readonly number[], period: number) => Promise<readonly number[]>`<br/>
**Arguments:**
- `source`: Series of values to process
- `period`: Number of bars

### `ta.volatility.bb`
Bollinger Band<br/>
**Signature:** `(source: readonly number[], period: number, stddev: number) => Promise<DeepReadonly<{ upper: number[]; middle: number[]; lower: number[] }>>`<br/>
**Arguments:**
- `source`: Series of values to process
- `period`: Number of bars
- `stddev`: Standard deviation factor

### `ta.volatility.bbw`
Bollinger Bands Width<br/>
**Signature:** `(bb: DeepReadonly<{ upper: number[]; middle: number[]; lower: number[] }>) => readonly number[]`<br/>
**Arguments:**
- `bb`: Bollinger Band values

### `ta.volatility.kc`
Keltner Channel<br/>
**Signature:** `(period: number, stddev: number) => Promise<DeepReadonly<{ upper: number[]; middle: number[]; lower: number[] }>>`<br/>
**Arguments:**
- `period`: Number of bars
- `stddev`: Standard deviation factor

### `ta.volatility.atr`
Average True Range<br/>
**Signature:** `(period: number) => Promise<readonly number[]>`<br/>
**Arguments:**
- `period`: Number of bars
