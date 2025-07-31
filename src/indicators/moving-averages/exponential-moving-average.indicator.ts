import { IMovingAverageSettings, MovingAverageIndicator } from "./moving-average.indicator";

export class ExponentialMovingAverageIndicator extends MovingAverageIndicator {
	private readonly alpha: number;
	
	public constructor(settings: IMovingAverageSettings) {
		super(settings);
		this.alpha = 2 / (settings.period + 1);
	}

	protected calculateValue(): number {
		return this.calculateValueImpl(this.candlesticksInPeriod.length - 1);
	}

	private calculateValueImpl(index: number): number {
		if (index === 0)
			return this.candlesticksInPeriod[0].closePrice;

		return this.alpha * this.candlesticksInPeriod[index].closePrice + (1 - this.alpha) * this.calculateValueImpl(index - 1);
	}
}