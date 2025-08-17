import { Candlestick } from "../models/candlestick";
import { IDateValuePair } from "../models/date-value-pair";
import { DateUtils } from "../utils/date.utils";

export enum CandlestickPeriod {
	OneHour = "1H",
	TwoHours = "2H",
	FourHours = "4H",
	SixHours = "6H",
	TwelveHours = "12H",
	OneDay = "1D",
	OneWeek = "1W",
	OneMonth = "1M"
}

export interface IIndicatorSettings {
	readonly length: number;
	readonly candlestickPeriod: CandlestickPeriod;
}

export abstract class Indicator<TSettings extends IIndicatorSettings, TValue> {
	private static readonly valuesLimit = 1000;
	
	private readonly _candlesticks: Candlestick[] = [];
	private readonly _values: IDateValuePair<TValue>[] = [];
	private lastProcessedCandlestick?: Candlestick;

	public constructor(protected readonly settings: TSettings) {
	}

	protected static validateData(data: readonly number[]) {
		if (!data || !data.length)
			throw new Error("Data is empty");

		if (data.length === 1)
			throw new Error("Data count must be > 1");
	}

	public get currentValue(): TValue | undefined {
		return this._values.length ? this._values[this._values.length - 1].value : undefined;
	}

	public get values(): readonly IDateValuePair<TValue>[] {
		return this._values;
	}

	protected get prices(): readonly number[] {
		return this._candlesticks.map(cs => cs.closePrice);
	}

	protected get candlesticks(): readonly Candlestick[] {
		return this._candlesticks;
	}

	public process(newCandlestick: Candlestick): TValue | undefined {
		if (!this.lastProcessedCandlestick) {
			this._candlesticks.push(newCandlestick);
			this.lastProcessedCandlestick = newCandlestick;
			return;
		}

		if (DateUtils.compareDateAndHours(this.lastProcessedCandlestick.openTime, newCandlestick.openTime) > 0)
			throw new Error(`Previos candlestick.openDate > current candlestick.openDate`);
		else if (DateUtils.compareDateAndHours(this.lastProcessedCandlestick.openTime, newCandlestick.openTime) === 0)
			throw new Error(`Candlestick already processed`);

		if (this.shouldMergeCandlesticks(newCandlestick)) {
			const currentCandlestick = this._candlesticks.pop()!;
			this._values.pop();
			this._candlesticks.push(
				new Candlestick(currentCandlestick.openTime,
								currentCandlestick.openPrice,
								Math.max(currentCandlestick.highPrice, newCandlestick.highPrice),
								Math.min(currentCandlestick.lowPrice, newCandlestick.lowPrice),
								newCandlestick.closePrice,
								currentCandlestick.volume + newCandlestick.volume,
								newCandlestick.closeTime)
			);
		}
		else {
			this._candlesticks.push(newCandlestick);
		}

		this.lastProcessedCandlestick = newCandlestick;

		if (this._candlesticks.length < this.settings.length)
			return;

		if (this._candlesticks.length > this.settings.length)
			this._candlesticks.shift();

		const value = this.calculateValueImpl();
		this._values.push({value: value, timestamp: this._candlesticks[this._candlesticks.length - 1].openTime});

		if (this.values.length > Indicator.valuesLimit)
			this._values.shift();

		return value;
	}

	protected abstract calculateValueImpl(): TValue;

	private shouldMergeCandlesticks(newCandlestick: Candlestick): boolean {
		const currentCandlestick = this._candlesticks[this._candlesticks.length - 1];
		
		//I assume that the gap in data can be maximum 2 days.
		switch(this.settings.candlestickPeriod) {
			case CandlestickPeriod.OneHour:
			case CandlestickPeriod.TwoHours:
			case CandlestickPeriod.FourHours:
			case CandlestickPeriod.SixHours:
			case CandlestickPeriod.TwelveHours:
				const hoursPeriod = Number(this.settings.candlestickPeriod.toString().replace("H", ""));
				return Math.floor(newCandlestick.openTime.getUTCHours() / hoursPeriod) === Math.floor(currentCandlestick.openTime.getUTCHours() / hoursPeriod)
					&& newCandlestick.openTime.getUTCDate() === currentCandlestick.openTime.getUTCDate();
			case CandlestickPeriod.OneDay:
				return newCandlestick.openTime.getUTCDate() === currentCandlestick.openTime.getUTCDate();
			case CandlestickPeriod.OneWeek:
				return newCandlestick.openTime.getUTCDay() >= currentCandlestick.closeTime.getUTCDay();
			case CandlestickPeriod.OneMonth:
				return newCandlestick.openTime.getUTCMonth() === currentCandlestick.openTime.getUTCMonth();
		}
	}
}