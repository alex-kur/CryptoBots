import { IIndicatorSettings, Indicator } from "./indicator";
import { ExponentialMovingAverageIndicator } from "./moving-averages/exponential-moving-average.indicator";

export interface IRSISettings extends IIndicatorSettings {
}

export class RSIIndicator extends Indicator<IRSISettings, number> {
	public constructor(settings: IRSISettings) {
		super(settings);
	}
	
	public static calculateValue(data: readonly number[]): number {
		this.validateData(data);
		
		const up: number[] = [];
		const down: number[] = [];

		for (let i = 1; i < data.length; i++) {
			const current = data[i];
			const previous = data[i - 1];
			
			if (current > previous) {
				up.push(current - previous);
				down.push(0);
			}
			else if (current < previous) {
				up.push(0);
				down.push(previous - current);
			}
			else {
				up.push(0);
				down.push(0);
			}
		}

		const upEma = ExponentialMovingAverageIndicator.calculateValue(up);
		const downEma = ExponentialMovingAverageIndicator.calculateValue(down);

		if (downEma === 0)
			return 100;

		const relativeStrength = upEma / downEma;
		const result = 100 - 100 / (1 + relativeStrength);
		return result;
	}

	protected calculateValueImpl(): number {
		return RSIIndicator.calculateValue(this.prices);
	}
}