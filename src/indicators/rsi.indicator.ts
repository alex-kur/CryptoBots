import { IIndicatorSettings, Indicator } from "./indicator";
import { ExponentialMovingAverageIndicator } from "./moving-averages/exponential-moving-average.indicator";

export interface IRSISettings extends IIndicatorSettings {
}

export class RSIIndicator extends Indicator<IRSISettings> {
	private _value?: number;
	
	public constructor(settings: IRSISettings) {
		super(settings);
	}

	public get value(): number | undefined {
		return this._value;
	}
	
	protected updateValue() {
		const positivePriceChanges: number[] = [];
		const negativePriceChanges: number[] = [];

		for (let i = 1; i < this.candlesticksInPeriod.length; i++) {
			const previousPrice = this.priceGetter(this.candlesticksInPeriod[i - 1]);
			const currentPrice = this.priceGetter(this.candlesticksInPeriod[i]);
			
			if (currentPrice > previousPrice) {
				positivePriceChanges.push(currentPrice - previousPrice);
				negativePriceChanges.push(0);
			}
			else if (currentPrice < previousPrice) {
				positivePriceChanges.push(0);
				negativePriceChanges.push(previousPrice - currentPrice);
			}
			else {
				positivePriceChanges.push(0);
				negativePriceChanges.push(0);
			}
		}

		const emaU = ExponentialMovingAverageIndicator.calculateValue(positivePriceChanges);
		const emaD = ExponentialMovingAverageIndicator.calculateValue(negativePriceChanges);

		if (emaD === 0) {
			this._value = 100;
			return;
		}

		const relativeStrength = emaU / emaD;
		this._value = 100 - 100 / (1 + relativeStrength);
	}
}