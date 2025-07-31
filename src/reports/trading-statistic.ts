import { CoinPair } from "../models/coin-pair";
import { NumberRange } from "../models/number-range";

export class TradingStatistic {
	public readonly assetsNetWorthRange: NumberRange = new NumberRange();
	public readonly baseCoinBalanceRange: NumberRange = new NumberRange();
	public readonly quotedCoinBalanceRange: NumberRange = new NumberRange();
	public lastProcessedPrice?: number;
	public lastProcessedDate?: Date;
	public finalBaseCoinsBalance: number = 0;
	public finalQuotedCoinsBalance: number = 0;
	
	private _executedOrdersCount: number = 0;
	private _firstProcessedPrice?: number;
	private _startedAt?: Date;

	public constructor(public readonly coinPair: CoinPair) {
	}

	public get executedOrdersCount(): number {
		return this._executedOrdersCount;
	}

	public get firstProcessedPrice(): number | undefined {
		return this._firstProcessedPrice;
	}

	public set firstProcessedPrice(v: number) {
		if (this._firstProcessedPrice !== undefined)
			throw new Error("Attempt to set Statistic.firstProcessedPrice twice");

		this._firstProcessedPrice = v;
	}

	public get startedAt(): Date | undefined {
		return this._startedAt;
	}

	public set startedAt(v: Date) {
		if (this._startedAt !== undefined)
			throw new Error("Attempt to set Statistic.startedAt twice");

		this._startedAt = v;
	}

	public addExecutedOrderCount(count: number) {
		this._executedOrdersCount += count;
	}
}