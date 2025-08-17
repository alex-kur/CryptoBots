import { IIndicatorSettings, Indicator } from "./indicator";
import { SimpleMovingAverageIndicator } from "./moving-averages/simple-moving-average.indicator";

export interface IBollingerBandsSettings extends IIndicatorSettings {
	readonly multiplier: number;
}

export interface IBollingerBandsValue {
	readonly upperValue: number;
	readonly averageValue: number;
	readonly lowerValue: number;
}

export class BollingerBandsIndicator extends Indicator<IBollingerBandsSettings, IBollingerBandsValue> {
	public constructor(settings: IBollingerBandsSettings) {
		super(settings);
	}

	public static calculateValue(data: readonly number[], multiplier: number): IBollingerBandsValue {
		this.validateData(data);
		const averageValue = SimpleMovingAverageIndicator.calculateValue(data);
		const standardDeviation = this.calculateStandardDeviation(data, averageValue);
		const upperValue = averageValue + standardDeviation * multiplier;
		const lowerValue = averageValue - standardDeviation * multiplier;
		return {upperValue: upperValue, averageValue: averageValue, lowerValue: lowerValue};
	}

	private static calculateStandardDeviation(data: readonly number[], averageValue: number): number {
		const sum = data.reduce((sum, d) => sum + Math.pow(d - averageValue, 2), 0);
		const result = Math.sqrt(sum / (data.length - 1));
		return result;
	}

	protected calculateValueImpl(): IBollingerBandsValue {
		return BollingerBandsIndicator.calculateValue(this.prices, this.settings.multiplier);
	}
}