import { IIndicatorSettings, Indicator } from "../indicator";

export enum MovingAverageKind {
	Simple = "Simple",
	Exponential = "Exponential",
	VolumeWeighted = "VolumeWeighted"
}

export interface IMovingAverageSettings extends IIndicatorSettings {}

export abstract class MovingAverageIndicator extends Indicator<IMovingAverageSettings, number> { }