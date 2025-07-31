import { AppConfig } from "../utils/app-config";

export class Balance {
	private readonly balance: Map<string, number>;

    public constructor() {
		this.balance = new Map<string, number>(AppConfig.initialBalance);
	}

	public getBalanceOf(ticker: string): number | undefined {
		return this.balance.get(ticker);
	}

	public take(ticker: string, count: number): number {
		if (count < 0)
			throw new Error(`Balance.take(${count}): Count can't be < 0`);
		
		let balance = this.balance.get(ticker);

		if (!balance)
			throw new Error(`There are no ${ticker} on the balance`);

		if (Math.abs(balance - count) < 0.0001) {
			this.balance.set(ticker, 0);
			return balance;
		}

		if (balance < count)
			throw new Error(`Not enough ${ticker} on balance. Balance: ${balance}, requested: ${count}`);

		balance -= count;
		this.balance.set(ticker, balance);
		return count;
	}

	public put(ticker: string, count: number): number {
		if (count < 0)
			throw new Error(`Balance.put(${count}): Count can't be < 0`);
		
		let balance = this.balance.get(ticker) || 0;
		balance += count;
		this.balance.set(ticker, balance);
		return count;
	}
}