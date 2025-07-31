import { Logger } from "../logger/logger";
import { Candlestick } from "../models/candlestick";
import { Order, OrderKind } from "../models/order";
import { ExchangeSimulatorService } from "../services/exchange-simulator.service";
import { AppConfig } from "../utils/app-config";
import { ITradingStrategySettings, TradingStarategy } from "./trading-strategy";

export interface IGridStrategySettings extends ITradingStrategySettings {
	readonly minPrice: number;
	readonly maxPrice: number;
	readonly gridSize: number;
}

export class GridStrategy extends TradingStarategy {
	private readonly priceStep: number;
	private isAnyOrderExecuted: boolean = false;
	
	public constructor(exchange: ExchangeSimulatorService) {
		super(exchange);
		this.priceStep = (this.settings.maxPrice - this.settings.minPrice) / (this.settings.gridSize - 1);
	}
	
	public get settings(): IGridStrategySettings {
		return AppConfig.gridStrategySettings;
	}

	protected get strategyName(): string {
		return "Grid";
	}

	protected onNewHourStartedImpl(openPrice: number, date: Date): void {
		if (this.statistic.executedOrdersCount === 0)
			this.rebalance(openPrice);
		else if (this.isAnyOrderExecuted)
			this.recreateOrdersGrid(openPrice);
	}

	protected onOrdersExecutedImpl(orders: Order[]): void {
		this.isAnyOrderExecuted = true;
	}
	
	protected onCurrentHourEndedImpl(candlestick: Candlestick): void {
	}

	private rebalance(openPrice: number) {
		this.exchange.cancelAllOrders();

		if (openPrice < this.settings.minPrice || openPrice > this.settings.maxPrice)
			return;

		const currentBaseCoinsCost = this.exchange.totalBaseCoins * openPrice;
		const totalNetWorth = this.exchange.totalQuotedCoins + currentBaseCoinsCost;
		const currentBaseCoinsPercent = currentBaseCoinsCost / totalNetWorth * 100;
		const targetBaseCoinsPercent = 100 - (openPrice - this.settings.minPrice) / (this.settings.maxPrice - this.settings.minPrice) * 100;
		const targetBaseCoinsCount = totalNetWorth * targetBaseCoinsPercent / 100 / openPrice;

		if (currentBaseCoinsPercent < targetBaseCoinsPercent) {
			const buyCount = targetBaseCoinsCount - this.exchange.totalBaseCoins;
			this.exchange.addOrder(new Order(OrderKind.Buy, openPrice, buyCount));
		}
		else if(currentBaseCoinsPercent > targetBaseCoinsPercent) {
			const sellCount = this.exchange.totalBaseCoins - targetBaseCoinsCount;
			this.exchange.addOrder(new Order(OrderKind.Sell, openPrice, sellCount));
		}
	}

	private recreateOrdersGrid(currentPrice: number) {
		this.exchange.cancelAllOrders();
		//Logger.info(`Recreated orders grid (price ${currentPrice.toFixed(2)}):`);

		const closestLevel = Math.round((currentPrice - this.settings.minPrice) / this.priceStep);

		if (this.exchange.quotedCoinsOnBalance > 0) {
			let buyLevel = closestLevel - 1;

			while (buyLevel >= 0) {
				const buyPrice = this.settings.minPrice + this.priceStep * buyLevel;
				const buyCount = this.exchange.quotedCoinsOnBalance / (buyLevel + 1) / buyPrice;
				this.exchange.addOrder(new Order(OrderKind.Buy, buyPrice, buyCount));
				//Logger.info(`\t-Buy ${buyCount}${this.exchange.coinPair.baseCoin} for ${buyPrice.toFixed(2)}${this.exchange.coinPair.quotedCoin} (Level ${buyLevel})`);
				buyLevel--;
			}
		}

		if (this.exchange.baseCoinsOnBalance > 0) {
			let sellLevel = closestLevel + 1;

			while (sellLevel < this.settings.gridSize) {
				const sellPrice = this.settings.minPrice + this.priceStep * sellLevel;
				const sellCount = this.exchange.baseCoinsOnBalance / (this.settings.gridSize - sellLevel);
				this.exchange.addOrder(new Order(OrderKind.Sell, sellPrice, sellCount));
				//Logger.info(`\t-Sell ${sellCount}${this.exchange.coinPair.baseCoin} for ${sellPrice.toFixed(2)}${this.exchange.coinPair.quotedCoin} (Level ${sellLevel})`);
				sellLevel++;
			}
		}

		this.isAnyOrderExecuted = false;
	}
}