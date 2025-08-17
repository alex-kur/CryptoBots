import { ExponentialMovingAverageIndicator } from "./exponential-moving-average.indicator";
import { IMovingAverageSettings, MovingAverageIndicator, MovingAverageKind } from "./moving-average.indicator";
import { SimpleMovingAverageIndicator } from "./simple-moving-average.indicator";
import { VolumeWeightedMovingAverageIndicator } from "./volume-weighted-moving-average.indicator";

export class MovingAverageFactory {
	public static create(kind: MovingAverageKind, settings: IMovingAverageSettings): MovingAverageIndicator {
		switch(kind) {
			case MovingAverageKind.Simple:
				return new SimpleMovingAverageIndicator(settings);
			case MovingAverageKind.Exponential:
				return new ExponentialMovingAverageIndicator(settings);
			case MovingAverageKind.VolumeWeighted:
				return new VolumeWeightedMovingAverageIndicator(settings);
		}
	}
}