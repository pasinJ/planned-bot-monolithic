<div align="center">
  <img width="76" src="./docs/icon.png?sanitize=true">
  <h1>Planned</h1>
</div>

Planned is a **crypto trading bot system** that will allow you to develop trading strategies and execute them automatically in a real-time market.

The main purpose of this system isn't to provide you with out-of-the-box smart fancy strategies that take your money and make you rich. It's just a tool that provides you a way to develop your strategies through <u>backtesting</u> and <u>forward testing</u> then it will execute them as you **"planned"**.

Crypto trading is a high-risk investment. You should know what you are doing and why, not just do it however someone tells you that is the way to do it (at least test them first).

## Features
(This project is in developing mode)
- [x] [Backtesting strategies with market history](./docs/backtesting.md)
  - [x] Web interface
  - [x] No number of strategies limitation
  - [x] No backtesting range limitation
  - [x] Backtesting asynchronously on server-side (on [isolated-vm](https://github.com/laverdet/isolated-vm))
  - [x] Support multiple languages
    - [x] JavaScript
    - [x] TypeScript
    - [ ] More...
  - [x] Built-in indicators
    - [x] MACD
    - [x] RSI
    - [x] Supertrend
    - [x] Stochastic Oscillator
    - [x] [More...](./docs/technicalAnalysisModule.md#technical-analysis-module)
- [ ] Forward testing strategies with real-time market
- [ ] Live trading with real-time market
- [ ] Support multiple exchanges
  - [x] Binance
  - [ ] More...
- [ ] Support multiple trading categories
  - [x] Spot trading
  - [ ] Margin trading
  - [ ] Futures trading
- [ ] Many more...

## Installation
### Docker
(This was tested on Docker desktop version 4.25.0)
#### HTTP
  ``` console
  foo@bar:~$ git clone git@github.com:pasinJ/planned-bot-monolithic.git
  foo@bar:~$ cd ./planned-bot-monolithic/infra/docker
  foo@bar:~$ docker compose up -d frontend
  ```
  - Visit http://localhost
#### HTTPS with a self-signed certificate
  - Note: Generating a self-signed certificate could take a long time.
  ``` console
  foo@bar:~$ git clone git@github.com:pasinJ/planned-bot-monolithic.git
  foo@bar:~$ cd ./planned-bot-monolithic/infra/docker
  foo@bar:~$ docker compose -f https.docker-compose.yml up -d frontend
  ```
  - Visit https://localhost
  - Ignore invalid certificate authority warning `Advanced > Proceed to ...` <br/> (This message is shown because we are using a self-signed certificate)

## Configurations
You can check what configuration parameters you can use in the following files. [More information](./docs/configurations.md)
- **Docker deployment configuration**
  - /planned-bot-monolithic/infra/docker/.env.template
- **Frontend configuration**
  - /planned-bot-monolithic/apps/web/env/.env.template
- **Backend configuration**
  - /planned-bot-monolithic/apps/api/env/.env.template

## Strategy Executor API
For security reasons, the system will execute a strategy in a JavaScript environment that is completely isolated from others (using [isolated-vm](https://github.com/laverdet/isolated-vm) library). The environment does not allow executing code to access any extraneous resource or use any unspecified modules. The following are modules that you can use in your strategy:
- [Klines Module](./docs/klinesModule.md): Access current kline and an array of klines in the past
- [Strategy Module](./docs/strategyModule.md): Access strategy your properties and current stats
- [Orders Module](./docs/ordersModule.md): Access and manage your orders
- [Trades Module](./docs/tradesModule.md): Access list of trades
- [Technical Analysis Module](./docs/technicalAnalysisModule.md): Provide built-in helper functions and techical indicators
- [System Module](./docs/systemModule.md): Access executor information
- **Console Module**: JavaScript console for logging and debugging
- [Lodash Module](https://lodash.com/docs/4.17.15): Provide utility functions for you to create your customized strategy

## Setup
- (Optional) **Setup git hooks** <br/>
  There are `.git-hooks` directories in the root and each sub-project. They contain scripts for `commit-msg` and `pre-commit` hooks that will be executed before each git commit. They will verify the committing message (against [Conventional Commits specification](https://www.conventionalcommits.org/en/v1.0.0/#summary)) and run unit tests in each sub-project when there are changes in those projects in the commit.
  ``` console
  foo@bar:~$ cd /planned-bot-monolithic
  foo@bar:~/planned-bot-monolithic$ git config core.hooksPath .git-hooks
  ```
- (Optional) **Set VSCode as your git editor**:
  ``` console
  foo@bar:~/planned-bot-monolithic$ git config --global core.editor "code --wait"
  ```

## Credits
- This project uses [TradingView Lightweight Charts™](https://github.com/tradingview/lightweight-charts) for creating interactive charts.

## License
Licensed under the [GNU Affero General Public License v3.0](./LICENSE).

## Note
This project is a personal side project. Apart from developing a crypto trading bot system for personal usage, the primary goal is to apply the skills and concepts I have learned into a real-world application scenario. This system should be complicated enough so I can practice the ways to use those skills and concepts practically.

The concepts that I am interested in are
- **Functional programming**
- **Type-driven design**
- **Domain-driven design** (DDD)
- **Test-driven development** (TDD)
- **Clean code** - Can we make a code base that reads like a book?
- **Modular monolithic architecture** - I plan to eventually migrate to microservices architecture (with event-driven architecture) because it is also one of the concepts I want to learn. However, before over-complicating things with microservices, this should teach me about good decoupling and cohesion design.
- **Cloud services** - I will put this system into cloud services at some point using automatic deployment scripts.