# Trades Module

- [Trades Module](#trades-module)
    - [`trades.openingTrades`](#tradesopeningtrades)
    - [`trades.closedTrades`](#tradesclosedtrades)
    - [`trades.winTrades`](#tradeswintrades)
    - [`trades.lossTrades`](#tradeslosstrades)
    - [`trades.evenTrades`](#tradeseventrades)

### `trades.openingTrades`
An array of current opening trades.<br/>
**Type:** `readonly OpeningTrade[]`

### `trades.closedTrades`
An array of current closed trades.<br/>
**Type:** `readonly ClosedTrade[]`

### `trades.winTrades`
An array of current winning trades (net return > 0).<br/>
**Type:** `readonly ClosedTrade[]`

### `trades.lossTrades`
An array of current losing trades (net return < 0).<br/>
**Type:** `readonly ClosedTrade[]`

### `trades.evenTrades`
An array of current break-even trades (net return = 0).<br/>
**Type:** `readonly ClosedTrade[]`
