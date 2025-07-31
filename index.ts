import { Command } from "commander";
import { CoinPair } from "./src/models/coin-pair";
import { ExchangeSimulatorService } from "./src/services/exchange-simulator.service";
import { BalanceStrategy } from "./src/trading-strategies/balance.strategy";
import { AssetsAllocationStrategy } from "./src/trading-strategies/assets-allocation.strategy";
import { TradingStrategyKind } from "./src/trading-strategies/trading-strategy-kind";
import { TradingStarategy } from "./src/trading-strategies/trading-strategy";
import { GridStrategy } from "./src/trading-strategies/grid.strategy";

process.env.TZ = "UTC";
const program = new Command();

program
	.name("run-backtest.cmd")
	.description("Testing crypto trading strategies on historical data")
	.version("1.0.0");

program
	.command("balance")
	.description("Maintains the base coins cost at 50% of the total portfolio cost")
	.requiredOption("--for <coins>", "Base coin or coin pair. Example: BTC or BTC-USDT")
	.action(options => runBacktest(TradingStrategyKind.Balance, options.for));

program
	.command("assets-allocation")
	.description("Buy and sell base coin according to the settings based on the moving average")
	.requiredOption("--for <coins>", "Base coin or coin pair. Example: BTC or BTC-USDT")
	.action(options => runBacktest(TradingStrategyKind.AssetsAllocation, options.for));

program
	.command("grid")
	.description("Creates a grid of buy & sell orders")
	.requiredOption("--for <coins>", "Base coin or coin pair. Example: BTC or BTC-USDT")
	.action(options => runBacktest(TradingStrategyKind.Grid, options.for));

program.parse();

async function runBacktest(tradingStrategyKind: TradingStrategyKind, coins: string) {
	const coinPair = CoinPair.parse(coins);
	const exchange = new ExchangeSimulatorService(coinPair);
	let strategy: TradingStarategy;

	switch (tradingStrategyKind) {
		case TradingStrategyKind.Balance:
			strategy = new BalanceStrategy(exchange);
			break;
		case TradingStrategyKind.AssetsAllocation:
			strategy = new AssetsAllocationStrategy(exchange);
			break;
		case TradingStrategyKind.Grid:
			strategy = new GridStrategy(exchange);
			break;
	}

	await exchange.run();
	strategy.printReport();
}
