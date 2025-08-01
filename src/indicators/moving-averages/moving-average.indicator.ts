import { IIndicatorSettings, Indicator } from "../indicator";

export enum MovingAverageKind {
	//Simple moving average
	SMA = "SMA",
	//Exponential moving average
	EMA = "EMA",
	//Volume weighted moving average
	VWMA = "VWMA"
}

export interface IMovingAverageSettings extends IIndicatorSettings {
}

export abstract class MovingAverageIndicator extends Indicator<IMovingAverageSettings> {
	protected _value?: number;
	
	public constructor(settings: IMovingAverageSettings) {
		super(settings);
	}

	public get value(): number | undefined {
		return this._value;
	}
}