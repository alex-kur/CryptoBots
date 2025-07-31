import { format } from "date-fns";
import { TypedEventEmitter } from "../events/typed-event-emitter";
import { Logger } from "../logger/logger";
import { Balance } from "../models/balance";
import { Candlestick } from "../models/candlestick";
import { CoinPair } from "../models/coin-pair";
import { Order, OrderKind } from "../models/order";
import { CandlesticksDataProvider } from "../providers/candlesticks.data-provider";

export class ExchangeSimulatorService {
	private readonly dataProvider: CandlesticksDataProvider;
	private readonly balance: Balance = new Balance();
	private readonly exchangeFeePercent: number = 0.1;
	private readonly orders: Order[] = [];
	private currentCandlestick: Candlestick | undefined;

	public constructor(public readonly coinPair: CoinPair) {
		this.dataProvider = new CandlesticksDataProvider(coinPair);
	}

	public async run() {
		let isInitialized = await this.dataProvider.init();

		if (!isInitialized)
			return;

		Logger.info("\nExchange simulator runned");
		this.currentCandlestick = this.dataProvider.next();

		while (this.currentCandlestick) {
			TypedEventEmitter.emit("new-hour-started", this.currentCandlestick.openPrice, this.currentCandlestick.openTime);
			this.processOrders(this.currentCandlestick);
			TypedEventEmitter.emit("current-hour-ended", this.currentCandlestick);
			this.currentCandlestick = this.dataProvider.next();
		}

		this.cancelAllOrders();
		Logger.info("Exchange simulator stopped\n");
	}

	public get baseCoinsOnBalance(): number {
		return this.balance.getBalanceOf(this.coinPair.baseCoin) || 0;
	}

	public get baseCoinsInOrders(): number {
		return this.orders
			.filter(o => o.kind === OrderKind.Sell)
			.reduce((sum, o) => sum + o.count, 0);
	}

	public get totalBaseCoins(): number {
		return this.baseCoinsOnBalance + this.baseCoinsInOrders;
	}

	public get quotedCoinsOnBalance(): number {
		return this.balance.getBalanceOf(this.coinPair.quotedCoin) || 0;
	}

	public get quotedCoinsInOrders(): number {
		return this.orders
			.filter(o => o.kind === OrderKind.Buy)
			.reduce((sum, o) => sum + o.count * o.price, 0);
	}

	public get totalQuotedCoins(): number {
		return this.quotedCoinsOnBalance + this.quotedCoinsInOrders;
	}

	public addOrder(order: Order) {
		if (this.currentCandlestick) {
			if(order.kind === OrderKind.Buy && order.price > this.currentCandlestick.openPrice)
				throw new Error("Can't place a buy order at price higher than the current price.");

			if (order.kind === OrderKind.Sell && order.price < this.currentCandlestick.openPrice)
				throw new Error("Can't place a sell order at price lower than the current price.");
		}
		
		switch (order.kind) {
			case OrderKind.Buy:
				const sellOrder = this.orders.find(o => o.kind === OrderKind.Sell && o.price <= order.price);

				if (sellOrder)
					throw new Error("Already placed sell order but trying to add buy order where buy price >= sell price");

				this.balance.take(this.coinPair.quotedCoin, order.price * order.count);
				break;
			case OrderKind.Sell:
				const buyOrder = this.orders.find(o => o.kind === OrderKind.Buy && o.price >= order.price);
				
				if (buyOrder)
					throw new Error("Already placed buy order but trying to add sell order where sell price <= buy price");

				this.balance.take(this.coinPair.baseCoin, order.count);
				break;
		}

		this.orders.push(order);
	}

	public cancelAllOrders() {
		if (!this.orders.length)
			return;

		do {
			let order = this.orders.pop()!;

			switch (order.kind) {
				case OrderKind.Buy:
					this.balance.put(this.coinPair.quotedCoin, order.price * order.count);
					break;
				case OrderKind.Sell:
					this.balance.put(this.coinPair.baseCoin, order.count);
					break;
			}
		}
		while (this.orders.length);
	}

	private processOrders(candlestick: Candlestick) {
		if (!this.orders.length)
			return;
		
		const ordersFilter = (o: Order) => 
			(o.kind === OrderKind.Buy && o.price > candlestick.lowPrice) ||
			(o.kind === OrderKind.Sell && o.price < candlestick.highPrice);

		let orderToExecute = this.orders.find(ordersFilter);
		const executedOrders: Order[] = [];

		while (orderToExecute) {
			this.executeOrder(orderToExecute, candlestick);
			executedOrders.push(orderToExecute);
			orderToExecute = this.orders.find(ordersFilter);
		}

		if (executedOrders.length)
			TypedEventEmitter.emit("orders-executed", executedOrders);
	}

	private executeOrder(order: Order, candlestick: Candlestick) {
		switch (order.kind) {
			case OrderKind.Buy:
				this.balance.put(this.coinPair.baseCoin, order.count - order.count * this.exchangeFeePercent / 100);
				Logger.info(`${format(candlestick.openTime, "yyyy-MM-dd HH:mm")}: ${Logger.green("Bought")} ${order.count} ${this.coinPair.baseCoin} at price ${order.price} ${this.coinPair.quotedCoin} (Total cost: ${order.price * order.count} ${this.coinPair.quotedCoin})`);
				break;
			case OrderKind.Sell:
				const totalCost = order.count * order.price;
				this.balance.put(this.coinPair.quotedCoin, totalCost - totalCost * this.exchangeFeePercent / 100);
				Logger.info(`${format(candlestick.openTime, "yyyy-MM-dd HH:mm")}: ${Logger.red("Sold")} ${order.count} ${this.coinPair.baseCoin} at price ${order.price} ${this.coinPair.quotedCoin} (Total cost: ${order.price * order.count} ${this.coinPair.quotedCoin})`);
				break;
		}

		this.orders.splice(this.orders.indexOf(order), 1);
	}
}