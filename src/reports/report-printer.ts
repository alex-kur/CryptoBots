import { format } from "date-fns";
import { Logger } from "../logger/logger";
import { CoinPair } from "../models/coin-pair";
import { TradingStatistic } from "./trading-statistic";
import { AppConfig } from "../utils/app-config";
import { JSONUtils } from "../utils/json.utils";

export class ReportPrinter {
	public static print(startegyName: string, settings: any, statistic: TradingStatistic) {
		Logger.info(`Settings: ${JSONUtils.stringify(settings)}\n`);
		Logger.info(`--------------------Report of ${startegyName} trading strategy--------------------`);
		Logger.info(`Date range: ${format(statistic.startedAt!, "yyyy-MM-dd HH:mm")} -> ${format(statistic.lastProcessedDate!, "yyyy-MM-dd HH:mm")}`);
		Logger.info(`Executed orders count: ${statistic.executedOrdersCount}`);
		this.printBalanceTable(statistic);
		const finalNetWorth = statistic.finalQuotedCoinsBalance + statistic.finalBaseCoinsBalance * statistic.lastProcessedPrice!;
		Logger.info(`Assets net worth: Final=${finalNetWorth.toFixed(2)}; Min=${statistic.assetsNetWorthRange.minOrDefault.toFixed(2)}; Max=${statistic.assetsNetWorthRange.maxOrDefault.toFixed(2)}`);
		this.printProfitReport(statistic, finalNetWorth, "Profit");
		this.printBuyAndHoldStrategyReport(statistic);
	}

	private static printBalanceTable(statistic: TradingStatistic) {
		const tableData: {coin: string, initialBalance: number, finalBalance: number, minBalance: number, maxBalance: number}[] = [
			{
				coin: statistic.coinPair.quotedCoin,
			 	initialBalance: this.getInitialQuotedCoinsBalance(statistic.coinPair),
			 	finalBalance: statistic.finalQuotedCoinsBalance,
				minBalance: statistic.quotedCoinBalanceRange.minOrDefault,
				maxBalance: statistic.quotedCoinBalanceRange.maxOrDefault
			},
			{
				coin: statistic.coinPair.baseCoin,
			 	initialBalance: this.getInitialBaseCoinsBalance(statistic.coinPair),
			 	finalBalance: statistic.finalBaseCoinsBalance,
				minBalance: statistic.baseCoinBalanceRange.minOrDefault,
				maxBalance: statistic.baseCoinBalanceRange.maxOrDefault
			}
		];

		console.table(tableData);
	}

	private static printProfitReport(statistic: TradingStatistic, currentNetWorth: number, profitSign: string) {
		const initialNetWorth = this.getInitialQuotedCoinsBalance(statistic.coinPair) + this.getInitialBaseCoinsBalance(statistic.coinPair) * statistic.firstProcessedPrice!;
		const valueProfit = currentNetWorth - initialNetWorth;
		const percentProfit = 100 * currentNetWorth / initialNetWorth - 100;
		const getProfitStr = (mark: string = "") => `${profitSign}: ${mark}${percentProfit.toFixed(2)}%; (${mark}${valueProfit.toFixed(2)} ${statistic.coinPair.quotedCoin})`;

		valueProfit > 0
			? Logger.info(Logger.green(getProfitStr("+")))
			: Logger.info(Logger.red(getProfitStr()));
	}

	private static printBuyAndHoldStrategyReport(statistic: TradingStatistic) {
		const currentNetWorth = (this.getInitialQuotedCoinsBalance(statistic.coinPair) / statistic.firstProcessedPrice! + this.getInitialBaseCoinsBalance(statistic.coinPair)) * statistic.lastProcessedPrice!;
		this.printProfitReport(statistic, currentNetWorth, "Buy&Hold strategy profit");
	}

	private static getInitialQuotedCoinsBalance(coinPair: CoinPair): number {
		return AppConfig.initialBalance.get(coinPair.quotedCoin) || 0;
	}

	private static getInitialBaseCoinsBalance(coinPair: CoinPair): number {
		return AppConfig.initialBalance.get(coinPair.baseCoin) || 0;
	}
}