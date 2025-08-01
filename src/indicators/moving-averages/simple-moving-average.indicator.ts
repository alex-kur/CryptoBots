import { IMovingAverageSettings, MovingAverageIndicator } from "./moving-average.indicator";

export class SimpleMovingAverageIndicator extends MovingAverageIndicator {
	public constructor(settings: IMovingAverageSettings) {
		super(settings);
	}

	protected updateValue() {
		const data = this.candlesticksInPeriod.map(this.priceGetter);
		this._value = SimpleMovingAverageIndicator.calculateValue(data);
	}

	public static calculateValue(data: readonly number[]): number {
		this.validateData(data);
		const weight = 1 / data.length;
		const result = data.reduce((sum, d) => sum + d * weight, 0);
		return result;
	}
}