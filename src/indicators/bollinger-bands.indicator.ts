import { IIndicatorSettings, Indicator } from "./indicator";

export interface IBollingerBandsSettings extends IIndicatorSettings {
	readonly multiplier: number;
}

export class BollingerBandsIndicator extends Indicator<IBollingerBandsSettings> {
	private readonly valueWeight: number;
	
	private _upperValue?: number;
	private _averageValue?: number;
	private _lowerValue?: number;
	
	public constructor(settings: IBollingerBandsSettings) {
		super(settings);
		this.valueWeight = 1 / this.settings.period;
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
		this._averageValue = this.candlesticksInPeriod.reduce((sum, cs) => sum + cs.closePrice * this.valueWeight, 0);
		const standardDeviation = this.calculateStandardDeviation(this._averageValue);
		this._upperValue = this._averageValue + standardDeviation * this.settings.multiplier;
		this._lowerValue = this._averageValue - standardDeviation * this.settings.multiplier;
	}

	private calculateStandardDeviation(averageValue: number): number {
		const sum = this.candlesticksInPeriod.reduce((sum, cs) => sum + Math.pow(cs.closePrice - averageValue, 2), 0);
		return Math.sqrt(sum / (this.settings.period - 1));
	}
}