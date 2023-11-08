# Orders Module

- [Orders](#orders)
    - [`orders.enterMarket`](#ordersentermarket)
    - [`orders.enterLimit`](#ordersenterlimit)
    - [`orders.enterStopMarket`](#ordersenterstopmarket)
    - [`orders.enterStopLimit`](#ordersenterstoplimit)
    - [`orders.exitMarket`](#ordersexitmarket)
    - [`orders.exitLimit`](#ordersexitlimit)
    - [`orders.exitStopMarket`](#ordersexitstopmarket)
    - [`orders.exitStopLimit`](#ordersexitstoplimit)
    - [`orders.cancelOrder`](#orderscancelorder)
    - [`orders.cancelAllOrders`](#orderscancelallorders)
    - [`orders.getPendingOrders`](#ordersgetpendingorders)
    - [`orders.getSubmittedOrders`](#ordersgetsubmittedorders)
    - [`orders.getOpeningOrders`](#ordersgetopeningorders)
    - [`orders.getTriggeredOrders`](#ordersgettriggeredorders)
    - [`orders.getFilledOrders`](#ordersgetfilledorders)
    - [`orders.getCanceledOrders`](#ordersgetcanceledorders)
    - [`orders.getRejectedOrders`](#ordersgetrejectedorders)

### `orders.enterMarket`
Enter a trading position with a market order.<br/>
**Signature:** `(request: { quantity: number; }) => PendingOrderRequest`<br/>
**Arguments:**
- `request.quantity`: Quantity of asset to buy

### `orders.enterLimit`
Enter a trading position with a limit order.<br/>
**Signature:** `(request: { quantity: number; limitPrice: number; }) => PendingOrderRequest`<br/>
**Arguments:**
- `request.quantity`: Quantity of asset to buy
- `request.limitPrice`: Limit price of order

### `orders.enterStopMarket`
Enter a trading position with a stop market order.<br/>
**Signature:** `(request: { quantity: number; stopPrice: number; }) => PendingOrderRequest`<br/>
**Arguments:**
- `request.quantity`: Quantity of asset to buy
- `request.stopPrice`: Stop price of order

### `orders.enterStopLimit`
Enter a trading position with a stop limit order.<br/>
**Signature:** `(request: { quantity: number; stopPrice: number; limitPrice: number; }) => PendingOrderRequest`<br/>
**Arguments:**
- `request.quantity`: Quantity of asset to buy
- `request.stopPrice`: Stop price of order
- `request.limitPrice`: Limit price of order

### `orders.exitMarket`
Exit a trading position with a market order.<br/>
**Signature:** `(request: { quantity: number; }) => PendingOrderRequest`<br/>
**Arguments:**
- `request.quantity`: Quantity of asset to sell

### `orders.exitLimit`
Exit a trading position with a limit order.<br/>
**Signature:** `(request: { quantity: number; limitPrice: number; }) => PendingOrderRequest`<br/>
**Arguments:**
- `request.quantity`: Quantity of asset to sell
- `request.limitPrice`: Limit price of order

### `orders.exitStopMarket`
Exit a trading position with a limit order.<br/>
**Signature:** `(request: { quantity: number; stopPrice: number; }) => PendingOrderRequest`<br/>
**Arguments:**
- `request.quantity`: Quantity of asset to sell
- `request.stopPrice`: Stop price of order

### `orders.exitStopLimit`
Exit a trading position with a limit order.<br/>
**Signature:** `(request: { quantity: number; stopPrice: number; limitPrice: number; }) => PendingOrderRequest`<br/>
**Arguments:**
- `request.quantity`: Quantity of asset to sell
- `request.stopPrice`: Stop price of order
- `request.limitPrice`: Limit price of order

### `orders.cancelOrder`
Cancel a pending or opening order by referencing their ID.<br/>
**Signature:** `(orderId: OrderId) => PendingOrderRequest`<br/>
**Arguments:**
- `orderId`: Order ID to be canceled

### `orders.cancelAllOrders`
Cancel multiple pending and opening orders.<br/>
**Signature:** `(request?: { type?: readonly ("ENTRY" | "EXIT" | "CANCEL")[]; status?: "PENDING" | "OPENING" | "TRIGGERED" | "ALL"; }) => PendingOrderRequest`<br/>
**Arguments:**
- `request?.type`: Type of orders to be canceled
- `request?.status`: Status of orders to be canceled

### `orders.getPendingOrders`
A function which returns an array of pending order requests.<br/>
**Signature:** `() => readonly PendingOrderRequest[]`<br/>
**Arguments:** -<br/>

### `orders.getSubmittedOrders`
A function which returns an array of submitted orders.<br/>
**Signature:** `() => readonly SubmittedOrder[]`<br/>
**Arguments:** -<br/>

### `orders.getOpeningOrders`
A function which returns an array of opening orders.<br/>
**Signature:** `() => readonly OpeningOrder[]`<br/>
**Arguments:** -<br/>

### `orders.getTriggeredOrders`
A function which returns an array of triggered orders.<br/>
**Signature:** `() => readonly TriggeredOrder[]`<br/>
**Arguments:** -<br/>

### `orders.getFilledOrders`
A function which returns an array of filled orders.<br/>
**Signature:** `() => readonly FilledOrder[]`<br/>
**Arguments:** -<br/>

### `orders.getCanceledOrders`
A function which returns an array of canceled orders.<br/>
**Signature:** `() => readonly CanceledOrder[]`<br/>
**Arguments:** -<br/>

### `orders.getRejectedOrders`
A function which returns an array of rejected orders.<br/>
**Signature:** `() => readonly RejectedOrder[]`<br/>
**Arguments:** -<br/>

