import { IMovingAverageSettings, MovingAverageIndicator } from "./moving-average.indicator";

export class VolumeWeightedMovingAverageIndicator extends MovingAverageIndicator {
	public constructor(settings: IMovingAverageSettings) {
		super(settings);
	}

	public static calculateValue(data: readonly number[], volumes: readonly number[]): number {
		this.validateData(data);

		if (data.length !== volumes.length)
			throw new Error("data.length !== volume.length");

		const volumeWeightedSum = data.reduce((sum, d, i) => sum + d * volumes[i], 0);
		const volumesSum = volumes.reduce((sum, v) => sum + v, 0);
		const result = volumeWeightedSum / volumesSum;
		return result;
	}


	protected calculateValueImpl(): number {
		const volumes = this.candlesticks.map(cs => cs.volume);
		return VolumeWeightedMovingAverageIndicator.calculateValue(this.prices, volumes);
	}
}