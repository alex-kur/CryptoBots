import { Candlestick } from "../../models/candlestick";
import { NumberRange } from "../../models/number-range";
import { DateUtils } from "../../utils/date.utils";

export enum PeriodKind {
	Days = "days",
	Hours = "hours"
}

export enum MovingAverageKind {
	//Simple moving average
	SMA = "SMA",
	//Exponential moving average
	EMA = "EMA",
	//Volume weighted moving average
	VWMA = "VWMA"
}

export interface IMovingAverageSettings {
	readonly period: number;
	readonly periodKind: PeriodKind;
}

export abstract class MovingAverageIndicator {
	private readonly _candlesticksInPeriod: Candlestick[] = [];
	private dayOpenPrice?: number;
	private dailyVolume: number = 0;
	private dailyPriceRange: NumberRange = new NumberRange();
	private _value?: number;
	private previousCandlestick?: Candlestick;
	
	public constructor(protected readonly settings: IMovingAverageSettings) {
	}

	public get value(): number | undefined {
		return this._value;
	}

	protected get candlesticksInPeriod(): readonly Candlestick[] {
		return this._candlesticksInPeriod;
	}

	public process(candlestick: Candlestick) {
		if (!this.previousCandlestick) {
			this.previousCandlestick = candlestick;

			if (this.settings.periodKind === PeriodKind.Days) {
				this.dayOpenPrice = candlestick.openPrice;
				this.dailyVolume = candlestick.volume;
				this.dailyPriceRange.updateIfValueOutOfRange(candlestick.lowPrice);
				this.dailyPriceRange.updateIfValueOutOfRange(candlestick.highPrice);
			}
			else
				this._candlesticksInPeriod.push(candlestick);

			return;
		}

		if (DateUtils.compareDateAndHours(this.previousCandlestick.openTime, candlestick.openTime) > 0)
			throw new Error(`MovingAverage: current candlestick.openDate > previos candlestick.openDate`);
		else if (DateUtils.compareDateAndHours(this.previousCandlestick.openTime, candlestick.openTime) === 0)
			throw new Error(`MovingAverage: current candlestick already processed`);
		
		if (this.settings.periodKind === PeriodKind.Days) {
			if (this.previousCandlestick.openTime.getUTCDate() === candlestick.openTime.getUTCDate()) {
				this.dailyVolume += candlestick.volume;
				this.dailyPriceRange.updateIfValueOutOfRange(candlestick.lowPrice);
				this.dailyPriceRange.updateIfValueOutOfRange(candlestick.highPrice);
			}
			else {
				this._candlesticksInPeriod.push(new Candlestick(
					DateUtils.getStartOfDay(this.previousCandlestick.openTime),
					this.dayOpenPrice!,
					this.dailyPriceRange.max!,
					this.dailyPriceRange.min!,
					this.previousCandlestick.closePrice,
					this.dailyVolume,
					this.previousCandlestick.closeTime)
				);

				this.dayOpenPrice = candlestick.openPrice;
				this.dailyVolume = candlestick.volume;
				this.dailyPriceRange = new NumberRange();
				this.dailyPriceRange.updateIfValueOutOfRange(candlestick.lowPrice);
				this.dailyPriceRange.updateIfValueOutOfRange(candlestick.highPrice);
			}
		}
		else
			this._candlesticksInPeriod.push(candlestick);

		this.previousCandlestick = candlestick;

		if (this._candlesticksInPeriod.length < this.settings.period)
			return;

		if (this._candlesticksInPeriod.length > this.settings.period)
			this._candlesticksInPeriod.shift();

		this._value = this.calculateValue();
	}

	protected abstract calculateValue(): number;
}