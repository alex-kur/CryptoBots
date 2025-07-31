export class CoinPair {
	public constructor(/**BTC*/public readonly baseCoin: string,
					   /**USDT*/public readonly quotedCoin: string = "USDT") {}

	public toString(delimiter: string = ""): string {
		return `${this.baseCoin}${delimiter}${this.quotedCoin}`;
	}

	public static parse(v: string): CoinPair {
		const coins = v.split(/[-\/]/);

		if (coins.length === 0 || coins.length > 2)
			throw new Error(`Invalid coin pair: ${v}`);

		return coins.length === 1
			? new CoinPair(coins[0])
			: new CoinPair(coins[0], coins[1]);
	}
}