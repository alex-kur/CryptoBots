import { IIndicatorSettings, Indicator } from "./indicator";
import { SimpleMovingAverageIndicator } from "./moving-averages/simple-moving-average.indicator";

export interface IBollingerBandsSettings extends IIndicatorSettings {
	readonly multiplier: number;
}

export class BollingerBandsIndicator extends Indicator<IBollingerBandsSettings> {
	private _upperValue?: number;
	private _averageValue?: number;
	private _lowerValue?: number;
	
	public constructor(settings: IBollingerBandsSettings) {
		super(settings);
	}

	public get upperValue(): number | undefined {
		return this._upperValue;
	}

	public get averageValue(): number | undefined {
		return this._averageValue;
	}

	public get lowerValue(): number | undefined {
		return this._lowerValue;
	}

	protected updateValue(): void {
		const data = this.candlesticksInPeriod.map(this.priceGetter);
		this._averageValue = SimpleMovingAverageIndicator.calculateValue(data);
		const standardDeviation = this.calculateStandardDeviation(this._averageValue);
		this._upperValue = this._averageValue + standardDeviation * this.settings.multiplier;
		this._lowerValue = this._averageValue - standardDeviation * this.settings.multiplier;
	}

	private calculateStandardDeviation(averageValue: number): number {
		const sum = this.candlesticksInPeriod.reduce((sum, cs) => sum + Math.pow(cs.closePrice - averageValue, 2), 0);
		const result = Math.sqrt(sum / (this.settings.period - 1));
		return result;
	}
}