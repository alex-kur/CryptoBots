import { IMovingAverageSettings, MovingAverageIndicator, MovingAverageKind } from "../indicators/moving-averages/moving-average.indicator";
import { MovingAverageFactory } from "../indicators/moving-averages/moving-average.factory";
import { Logger } from "../logger/logger";
import { Candlestick } from "../models/candlestick";
import { Order, OrderKind } from "../models/order";
import { ExchangeSimulatorService } from "../services/exchange-simulator.service";
import { AppConfig } from "../utils/app-config";
import { TradingStarategy, ITradingStrategySettings } from "./trading-strategy";

export interface IAssetsAllocationStrategySettings extends ITradingStrategySettings {
	readonly useMaxMAValue: boolean;
	readonly movingAverageKind: MovingAverageKind;
	readonly movingAverageSettings: IMovingAverageSettings;
	readonly allocationSettings: IAllocationSettings[];
}

interface IAllocationSettings {
	deviationFromMAPercent: number;
	targetBaseCoinsPercent: number;
}

export class AssetsAllocationStrategy extends TradingStarategy {
	private readonly movingAverage: MovingAverageIndicator;
	private readonly getMaValue: () => number | undefined;
	private currentAllocationSettings?: IAllocationSettings;
	private maMaxValue?: number;
	
	public constructor(exchange: ExchangeSimulatorService) {
		super(exchange);
		this.movingAverage = MovingAverageFactory.create(this.settings.movingAverageKind, this.settings.movingAverageSettings);

			this.getMaValue = this.settings.useMaxMAValue
				? () => this.maMaxValue
				: () => this.movingAverage.currentValue;
	}

	public get settings(): IAssetsAllocationStrategySettings {
		return AppConfig.assetsAllocationStrategySettings;
	}

	protected get strategyName(): string {
		return "Assets Allocation";
	}

	protected onNewHourStartedImpl(openPrice: number, date: Date): void {
		this.rebalanceIfNeeded(openPrice);
	}

	protected onOrdersExecutedImpl(orders: Order[]): void {
		Logger.info(`Deviation from MA settings: ${this.currentAllocationSettings!.deviationFromMAPercent.toString()}%`);
	}

	protected onCurrentHourEndedImpl(candlestick: Candlestick): void {
		this.movingAverage.process(candlestick);
		
		if (this.movingAverage.currentValue)
			this.maMaxValue = Math.max(this.maMaxValue || 0, this.movingAverage.currentValue);
	}

	private rebalanceIfNeeded(openPrice: number) {
		const maValue = this.getMaValue();
		
		if (!maValue)
			return;

		this.exchange.cancelAllOrders();
		const currentDeviationFromMaPercent = (openPrice - maValue) * 100 / maValue;

		if (currentDeviationFromMaPercent === 0)
			return;

		const targetAllocationSettings = this.getClosestAllocationSettings(currentDeviationFromMaPercent);
		const currentBaseCoinsCost = this.exchange.totalBaseCoins * openPrice;
		const totalNetWorth = this.exchange.totalQuotedCoins + currentBaseCoinsCost;
		const currentBaseCoinsPercent = currentBaseCoinsCost / totalNetWorth * 100;
		const targetBaseCoinsCount = totalNetWorth * targetAllocationSettings.targetBaseCoinsPercent / 100 / openPrice;

		//First time rebalance
		if (!this.currentAllocationSettings) {
			if (currentBaseCoinsPercent < targetAllocationSettings.targetBaseCoinsPercent) {
				//Buy
				const buyCount =  targetBaseCoinsCount - this.exchange.totalBaseCoins;
				this.exchange.addOrder(new Order(OrderKind.Buy, openPrice, buyCount));
			}
			else if(currentBaseCoinsPercent > targetAllocationSettings.targetBaseCoinsPercent) {
				//Sell
				const sellCount = this.exchange.totalBaseCoins - targetBaseCoinsCount;
				this.exchange.addOrder(new Order(OrderKind.Sell, openPrice, sellCount));
			}

			this.currentAllocationSettings = targetAllocationSettings;
		}

		if (this.currentAllocationSettings.deviationFromMAPercent === targetAllocationSettings.deviationFromMAPercent)
			return;

		if (targetAllocationSettings.deviationFromMAPercent > this.currentAllocationSettings.deviationFromMAPercent &&
			targetAllocationSettings.deviationFromMAPercent >= 0)
		{
			//Sell
			if (this.exchange.totalBaseCoins > targetBaseCoinsCount) {
				const sellCount = this.exchange.totalBaseCoins - targetBaseCoinsCount;
				this.exchange.addOrder(new Order(OrderKind.Sell, openPrice, sellCount));
			}

			this.currentAllocationSettings = targetAllocationSettings;
		}
		else if (targetAllocationSettings.deviationFromMAPercent < this.currentAllocationSettings.deviationFromMAPercent &&
				 targetAllocationSettings.deviationFromMAPercent <= 0)
		{
			//Buy
			if (this.exchange.totalBaseCoins < targetBaseCoinsCount) {
				const buyCount = targetBaseCoinsCount - this.exchange.totalBaseCoins;
				this.exchange.addOrder(new Order(OrderKind.Buy, openPrice, buyCount));
			}
			
			this.currentAllocationSettings = targetAllocationSettings;
		}
	}

	private getClosestAllocationSettings(deviationFromMAPercent: number): IAllocationSettings {
		return this.settings.allocationSettings.reduce((previous, current) => {
			const diffWithPrevious = Math.abs(previous.deviationFromMAPercent - deviationFromMAPercent);
			const diffWithCurrent = Math.abs(current.deviationFromMAPercent - deviationFromMAPercent);

			if (diffWithPrevious > diffWithCurrent)
				return current;
			else if(diffWithPrevious === diffWithCurrent)
				return previous.targetBaseCoinsPercent > 0 ? current : previous;
			else
				return previous;
		});
	}
}