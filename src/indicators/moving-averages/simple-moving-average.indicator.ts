import { IMovingAverageSettings, MovingAverageIndicator } from "./moving-average.indicator";

export class SimpleMovingAverageIndicator extends MovingAverageIndicator {
	private readonly valueWeight: number;
	
	public constructor(settings: IMovingAverageSettings) {
		super(settings);
		this.valueWeight = 1 / this.settings.period;
	}

	protected updateValue() {
		this._value = this.candlesticksInPeriod.reduce((sum, cs) => sum + cs.closePrice * this.valueWeight, 0);
	}
}