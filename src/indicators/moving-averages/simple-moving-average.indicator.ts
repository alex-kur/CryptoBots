import { IMovingAverageSettings, MovingAverageIndicator } from "./moving-average.indicator";

export class SimpleMovingAverageIndicator extends MovingAverageIndicator {
	public constructor(settings: IMovingAverageSettings) {
		super(settings);
	}

	public static calculateValue(data: readonly number[]): number {
		this.validateData(data);
		const weight = 1 / data.length;
		const result = data.reduce((sum, d) => sum + d * weight, 0);
		return result;
	}

	protected calculateValueImpl(): number {
		return SimpleMovingAverageIndicator.calculateValue(this.prices);
	}
}