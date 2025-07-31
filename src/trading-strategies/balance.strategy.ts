import { differenceInCalendarMonths } from "date-fns";
import { Candlestick } from "../models/candlestick";
import { Order, OrderKind } from "../models/order";
import { ExchangeSimulatorService } from "../services/exchange-simulator.service";
import { AppConfig } from "../utils/app-config";
import { TradingStarategy, ITradingStrategySettings } from "./trading-strategy";

export interface IBalanceStrategySettings extends ITradingStrategySettings {
	readonly maxPermissibleImbalancePercent: number;
	readonly rebalanceFrequencyInMonth?: number;
}

export class BalanceStrategy extends TradingStarategy {
	private lastRebalanceDate?: Date;
	
	public constructor(exchange: ExchangeSimulatorService) {
		super(exchange);
	}

	public get settings(): IBalanceStrategySettings {
		return AppConfig.balancerStrategySettings;
	}

	protected get strategyName(): string {
		return "Balance";
	}

	protected onNewHourStartedImpl(openPrice: number, date: Date) {
		this.rebalanceIfNeeded(openPrice, date);
	}

	protected onOrdersExecutedImpl(orders: Order[]): void {
	}

	protected onCurrentHourEndedImpl(candlestick: Candlestick): void {
	}

	private rebalanceIfNeeded(currentPrice: number, openDate: Date) {
		const baseCoinsCost = this.exchange.totalBaseCoins * currentPrice;
		const totalNetWorth = this.exchange.totalQuotedCoins + baseCoinsCost;
		const baseCoinsPercent = baseCoinsCost / totalNetWorth * 100;

		if (Math.abs(baseCoinsPercent - 50) * 2 < this.settings.maxPermissibleImbalancePercent ||
			(!!this.settings.rebalanceFrequencyInMonth && !!this.lastRebalanceDate 
			 && differenceInCalendarMonths(openDate, this.lastRebalanceDate) < this.settings.rebalanceFrequencyInMonth))
			return;

		this.exchange.cancelAllOrders();

		if (baseCoinsPercent < 50) {
			const buyCount = (this.exchange.totalQuotedCoins - baseCoinsCost) / 2 / currentPrice;
			this.exchange.addOrder(new Order(OrderKind.Buy, currentPrice, buyCount));
		}
		else {
			const sellCount = (baseCoinsCost - this.exchange.totalQuotedCoins) / 2 / currentPrice;
			this.exchange.addOrder(new Order(OrderKind.Sell, currentPrice, sellCount));
		}

		this.lastRebalanceDate = openDate;
	}
}