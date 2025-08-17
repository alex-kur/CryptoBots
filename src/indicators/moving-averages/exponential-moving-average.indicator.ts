import { IMovingAverageSettings, MovingAverageIndicator } from "./moving-average.indicator";

export class ExponentialMovingAverageIndicator extends MovingAverageIndicator {
	public constructor(settings: IMovingAverageSettings) {
		super(settings);
	}

	public static calculateValue(data: readonly number[]): number {
		this.validateData(data);
		const alpha = 2 / (data.length + 1);
		const result = this.calculateValueRecursively(data, data.length - 1, alpha);
		return result;
	}

	private static calculateValueRecursively(data: readonly number[], index: number, alpha: number): number {
		if (index === 0)
			return data[0];

		const result = alpha * data[index] + (1 - alpha) * this.calculateValueRecursively(data, index - 1, alpha);
		return result;
	}

	protected calculateValueImpl(): number {
		return ExponentialMovingAverageIndicator.calculateValue(this.prices);
	}
}