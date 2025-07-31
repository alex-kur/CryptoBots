export class Candlestick {
	public constructor(public readonly openTime: Date,
					   public readonly openPrice: number,
					   public readonly highPrice: number,
					   public readonly lowPrice: number,
					   public readonly closePrice: number,
					   public readonly volume: number,
					   public readonly closeTime: Date) {}

	public get direction(): CandlestickDirection {
		return this.openPrice <= this.closePrice ? CandlestickDirection.Up : CandlestickDirection.Down;
	}
}

export enum CandlestickDirection {
	Up = 1,
	Down = 2
}