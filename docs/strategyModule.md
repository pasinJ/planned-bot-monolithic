# Strategy Module

- [Strategy Module](#strategy-module)
    - [`strategy.name`](#strategyname)
    - [`strategy.symbol`](#strategysymbol)
    - [`strategy.timeframe`](#strategytimeframe)
    - [`strategy.takerFeeRate`](#strategytakerfeerate)
    - [`strategy.makerFeeRate`](#strategymakerfeerate)
    - [`strategy.capitalCurrency`](#strategycapitalcurrency)
    - [`strategy.initialCapital`](#strategyinitialcapital)
    - [`strategy.totalCapital`](#strategytotalcapital)
    - [`strategy.inOrdersCapital`](#strategyinorderscapital)
    - [`strategy.availableCapital`](#strategyavailablecapital)
    - [`strategy.assetCurrency`](#strategyassetcurrency)
    - [`strategy.totalAssetQuantity`](#strategytotalassetquantity)
    - [`strategy.inOrdersAssetQuantity`](#strategyinordersassetquantity)
    - [`strategy.availableAssetQuantity`](#strategyavailableassetquantity)
    - [`strategy.openReturn`](#strategyopenreturn)
    - [`strategy.netReturn`](#strategynetreturn)
    - [`strategy.netProfit`](#strategynetprofit)
    - [`strategy.netLoss`](#strategynetloss)
    - [`strategy.equity`](#strategyequity)
    - [`strategy.maxDrawdown`](#strategymaxdrawdown)
    - [`strategy.maxRunup`](#strategymaxrunup)
    - [`strategy.totalFees`](#strategytotalfees)

### `strategy.name`
Strategy name.<br/>
**Type:** `string`

### `strategy.symbol`
Symbol object.<br/>
**Type:** `Symbol`
<table>
    <tr>
        <th>Property</th>
        <th>Type</th>
        <th>Description</th>
    </tr>
    <tr>
        <td><code>strategy.symbol.name</code></td>
        <td><code>string</code></td>
        <td>Symbol name</td>
    </tr>
    <tr>
        <td><code>strategy.symbol.exchange</code></td>
        <td><code>string</code></td>
        <td>Exchange name</td>
    </tr>
    <tr>
        <td><code>strategy.symbol.baseAsset</code></td>
        <td><code>string</code></td>
        <td>
            <a href="./notes.md/#base-asset-vs-quote-asset">More information</a>
        </td>
    </tr>
    <tr>
        <td><code>strategy.symbol.baseAssetPrecision</code></td>
        <td><code>number</code></td>
        <td>Precision of base asset</td>
    </tr>
    <tr>
        <td><code>strategy.symbol.quoteAsset</code></td>
        <td><code>string</code></td>
        <td>
            <a href="./notes.md/#base-asset-vs-quote-asset">More information</a>
        </td>
    </tr>
    <tr>
        <td><code>strategy.symbol.quoteAssetPrecision</code></td>
        <td><code>number</code></td>
        <td>Precision of quote asset</td>
    </tr>
    <tr>
        <td><code>strategy.symbol.orderTypes</code></td>
        <td><code>readonly string[]</code></td>
        <td>An array of supported order types</td>
    </tr>
</table>

### `strategy.timeframe`
Timeframe.<br/>
**Type:** `Timeframe`

### `strategy.takerFeeRate`
Taker fee rate for MARKET and STOP_MARKET orders.<br/>
**Type:** `number`

### `strategy.makerFeeRate`
Maker fee rate for LIMIT and STOP_LIMIT orders.<br/>
**Type:** `number`

### `strategy.capitalCurrency`
Capital currency. Either base or quote asset.<br/>
**Type:** `string`

### `strategy.initialCapital`
Amount of initial capital.<br/>
**Type:** `number`

### `strategy.totalCapital`
Total current amount of capital.<br/>
**Type:** `number`

### `strategy.inOrdersCapital`
Total amount of capital that is in opening orders.<br/>
**Type:** `number`

### `strategy.availableCapital`
Total amount of capital that can be put in a new order.<br/>
**Type:** `number`

### `strategy.assetCurrency`
Asset currency. Either base or quote asset.<br/>
**Type:** `string`

### `strategy.totalAssetQuantity`
Total amount of holding asset.<br/>
**Type:** `number`

### `strategy.inOrdersAssetQuantity`
Total amount of holding asset that is in opening orders.<br/>
**Type:** `number`

### `strategy.availableAssetQuantity`
Total amount of holding asset that can be put in a new order.<br/>
**Type:** `number`

### `strategy.openReturn`
Total current unrealized return (profit and loss) of all opening trades in capital currency. (Losses are expressed as negative values.)<br/>
**Type:** `number`

### `strategy.netReturn`
Total current return (profit and loss) of all closed trades in capital currency. (Losses are expressed as negative values.)<br/>
**Type:** `number`

### `strategy.netProfit`
Total current profit of all winning trades in capital currency. (Losses are expressed as negative values.)<br/>
**Type:** `number`

### `strategy.netLoss`
Total current loss of all losing trades in capital currency. (Losses are expressed as negative values.)<br/>
**Type:** `number`

### `strategy.equity`
Current equity in capital currency (initialCapital + netReturn + openReturn)<br/>
**Type:** `number`

### `strategy.maxDrawdown`
Maximum equity drawdown value in capital currency up until now<br/>
**Type:** `number`

### `strategy.maxRunup`
Maximum equity run-up value in capital currency up until now<br/>

### `strategy.totalFees`
Sum of entry and exit fees.<br/>
**Type:** `TotalFees`
| Property            | Type     | Description                                         |
| ------------------- | -------- | --------------------------------------------------- |
| `inCapitalCurrency` | `number` | Total amount of capital that was used to pay as fee |
| `inAssetCurrency`   | `number` | Total amount of asset that was used to pay as fee   |
