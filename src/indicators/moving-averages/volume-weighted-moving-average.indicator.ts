import { IMovingAverageSettings, MovingAverageIndicator } from "./moving-average.indicator";

export class VolumeWeightedMovingAverageIndicator extends MovingAverageIndicator {
	public constructor(settings: IMovingAverageSettings) {
		super(settings);
	}

	protected calculateValue(): number {
		const volumeWeightedSum = this.candlesticksInPeriod.reduce((sum, cs) => sum + cs.closePrice * cs.volume, 0);
		const volumeSum = this.candlesticksInPeriod.reduce((sum, cs) => sum + cs.volume, 0);
		return volumeWeightedSum / volumeSum;
	}
}