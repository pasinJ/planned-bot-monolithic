# Klines Module

- [Klines Module](#klines-module)
    - [`klines.openTimestamp`](#klinesopentimestamp)
    - [`klines.closeTimestamp`](#klinesclosetimestamp)
    - [`klines.open`](#klinesopen)
    - [`klines.close`](#klinesclose)
    - [`klines.high`](#klineshigh)
    - [`klines.low`](#klineslow)
    - [`klines.volume`](#klinesvolume)
    - [`klines.quoteAssetVolume`](#klinesquoteassetvolume)
    - [`klines.takerBuyBaseAssetVolume`](#klinestakerbuybaseassetvolume)
    - [`klines.takerBuyQuoteAssetVolume`](#klinestakerbuyquoteassetvolume)
    - [`klines.numTrades`](#klinesnumtrades)
    - [`klines.raw`](#klinesraw)
    - [`klines.getAllOpen`](#klinesgetallopen)
    - [`klines.getAllHigh`](#klinesgetallhigh)
    - [`klines.getAllLow`](#klinesgetalllow)
    - [`klines.getAllClose`](#klinesgetallclose)
    - [`klines.getAllVolume`](#klinesgetallvolume)
    - [`klines.getAllQuoteAssetVolume`](#klinesgetallquoteassetvolume)
    - [`klines.getAllTakerBuyBaseAssetVolume`](#klinesgetalltakerbuybaseassetvolume)
    - [`klines.getAllTakerBuyQuoteAssetVolume`](#klinesgetalltakerbuyquoteassetvolume)
    - [`klines.getAllNumTrades`](#klinesgetallnumtrades)
    - [`klines.getAllRaw`](#klinesgetallraw)

### `klines.openTimestamp`
Open timestamp of the last closed kline.<br/>
**Type:** `Date`

### `klines.closeTimestamp`
Close timestamp of the last closed kline.<br/>
**Type:** `Date`

### `klines.open`
Open price of the last closed kline.<br/>
**Type:** `number`

### `klines.close`
Close price of the last closed kline.<br/>
**Type:** `number`

### `klines.high`
High price of the last closed kline.<br/>
**Type:** `number`

### `klines.low`
Low price of the last closed kline.<br/>
**Type:** `number`

### `klines.volume`
Volume of the last closed kline.<br/>
**Type:** `number`

### `klines.quoteAssetVolume`
Quote asset volume of the last closed kline.<br/>
**Type:** `number`

### `klines.takerBuyBaseAssetVolume`
Taker buy base asset volume of the last closed kline.<br/>
**Type:** `number`

### `klines.takerBuyQuoteAssetVolume`
Taker buy quote asset volume of the last closed kline.<br/>
**Type:** `number`

### `klines.numTrades`
Number of trades of the last closed kline.<br/>
**Type:** `number`

### `klines.raw`
Kline object of the last closed kline.<br/>
**Type:** `Kline`

### `klines.getAllOpen`
A function which returns an array of open prices from oldest to earliest order. The last element of the array will be the last closed kline. Number of elements in the array will be less than or equal to `MaxNumKlines` value.<br/>
**Signature:** `() => readonly number[]`<br/>
**Arguments:** -<br/>

### `klines.getAllHigh`
A function which returns an array of high prices from oldest to earliest order. The last element of the array will be the last closed kline. Number of elements in the array will be less than or equal to `MaxNumKlines` value.<br/>
**Signature:** `() => readonly number[]`<br/>
**Arguments:** -<br/>

### `klines.getAllLow`
A function which returns an array of low prices from oldest to earliest order. The last element of the array will be the last closed kline. Number of elements in the array will be less than or equal to `MaxNumKlines` value.<br/>
**Signature:** `() => readonly number[]`<br/>
**Arguments:** -<br/>

### `klines.getAllClose`
A function which returns an array of close prices from oldest to earliest order. The last element of the array will be the last closed kline. Number of elements in the array will be less than or equal to `MaxNumKlines` value.<br/>
**Signature:** `() => readonly number[]`<br/>
**Arguments:** -<br/>

### `klines.getAllVolume`
A function which returns an array of volume from oldest to earliest order. The last element of the array will be the last closed kline. Number of elements in the array will be less than or equal to `MaxNumKlines` value.<br/>
**Signature:** `() => readonly number[]`<br/>
**Arguments:** -<br/>

### `klines.getAllQuoteAssetVolume`
A function which returns an array of quote asset volume from oldest to earliest order. The last element of the array will be the last closed kline. Number of elements in the array will be less than or equal to `MaxNumKlines` value.<br/>
**Signature:** `() => readonly number[]`<br/>
**Arguments:** -<br/>

### `klines.getAllTakerBuyBaseAssetVolume`
A function which returns an array of taker buy base asset volume from oldest to earliest order. The last element of the array will be the last closed kline. Number of elements in the array will be less than or equal to `MaxNumKlines` value.<br/>
**Signature:** `() => readonly number[]`<br/>
**Arguments:** -<br/>

### `klines.getAllTakerBuyQuoteAssetVolume`
A function which returns an array of taker buy quote asset volume from oldest to earliest order. The last element of the array will be the last closed kline. Number of elements in the array will be less than or equal to `MaxNumKlines` value.<br/>
**Signature:** `() => readonly number[]`<br/>
**Arguments:** -<br/>

### `klines.getAllNumTrades`
A function which returns an array of number of trades from oldest to earliest order. The last element of the array will be the last closed kline. Number of elements in the array will be less than or equal to `MaxNumKlines` value.<br/>
**Signature:** `() => readonly number[]`<br/>
**Arguments:** -<br/>

### `klines.getAllRaw`
A function which returns an array of Kline objects from oldest to earliest order. The last element of the array will be the last closed kline. Number of elements in the array will be less than or equal to `MaxNumKlines` value.<br/>
**Signature:** `() => readonly Kline[]`<br/>
**Arguments:** -<br/>

