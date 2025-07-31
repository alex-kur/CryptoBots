import { compareAsc } from "date-fns";
import { TypedEventEmitter } from "../events/typed-event-emitter";
import { Order } from "../models/order";
import { ExchangeSimulatorService } from "../services/exchange-simulator.service";
import { TradingStatistic } from "../reports/trading-statistic";
import { Candlestick } from "../models/candlestick";
import { ReportPrinter } from "../reports/report-printer";

export interface ITradingStrategySettings {
	readonly startDate?: Date;
	readonly endDate?: Date;
}

export abstract class TradingStarategy {
	private _isFirstPriceProcessing: boolean = true;
	protected readonly statistic: TradingStatistic;
	
	protected constructor(protected readonly exchange: ExchangeSimulatorService) {
		if (!exchange.quotedCoinsOnBalance && !exchange.baseCoinsOnBalance)
			throw new Error("Initial balance is 0");

		this.statistic = new TradingStatistic(exchange.coinPair);
		TypedEventEmitter.on("new-hour-started", this.onNewHourStarted);
		TypedEventEmitter.on("orders-executed", this.onOrdersExecuted);
		TypedEventEmitter.on("current-hour-ended", this.onCurrentHourEnded);
	}

	public abstract get settings(): ITradingStrategySettings;
	protected abstract get strategyName(): string;

	protected abstract onNewHourStartedImpl(openPrice: number, date: Date): void;
	protected abstract onOrdersExecutedImpl(orders: Order[]): void;
	protected abstract onCurrentHourEndedImpl(candlestick: Candlestick): void;

	public printReport() {
		this.statistic.finalQuotedCoinsBalance = this.exchange.totalQuotedCoins;
		this.statistic.finalBaseCoinsBalance = this.exchange.totalBaseCoins;
		ReportPrinter.print(this.strategyName, this.settings, this.statistic);
	}

	private onNewHourStarted = (openPrice: number, date: Date) => {
		if (this.settings.startDate && compareAsc(this.settings.startDate, date) > 0)
			return;
				
		if (this.settings.endDate && compareAsc(this.settings.endDate, date) < 0) {
			this.exchange.cancelAllOrders();
			TypedEventEmitter.off("new-hour-started", this.onNewHourStarted);
			TypedEventEmitter.off("orders-executed", this.onOrdersExecuted);
			TypedEventEmitter.off("current-hour-ended", this.onCurrentHourEnded);
			return;
		}

		if (this._isFirstPriceProcessing) {
			this.statistic.startedAt = date;
			this.statistic.firstProcessedPrice = openPrice;
			this._isFirstPriceProcessing = false;
		}

		this.statistic.lastProcessedDate = date;
		this.statistic.lastProcessedPrice = openPrice;
		this.onNewHourStartedImpl(openPrice, date);
	}

	private onOrdersExecuted = (orders: Order[]) => {
		this.statistic.addExecutedOrderCount(orders.length);
		this.statistic.baseCoinBalanceRange.updateIfValueOutOfRange(this.exchange.totalBaseCoins);
		this.statistic.quotedCoinBalanceRange.updateIfValueOutOfRange(this.exchange.totalQuotedCoins);
		this.onOrdersExecutedImpl(orders);
	}

	private onCurrentHourEnded = (candlestick: Candlestick) => {
		this.updateAssetsNetWorth(candlestick.closePrice);
		this.onCurrentHourEndedImpl(candlestick);
	}

	private updateAssetsNetWorth(price: number) {
		const netWorth = this.exchange.totalQuotedCoins + this.exchange.totalBaseCoins * price;
		this.statistic.assetsNetWorthRange.updateIfValueOutOfRange(netWorth);
	}
}