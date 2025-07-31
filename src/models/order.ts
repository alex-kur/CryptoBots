export class Order {
	public constructor(public readonly kind: OrderKind,
					   public readonly price: number,
					   public readonly count: number) {

		if (price <= 0)
			throw new Error("Order.price can't be <= 0");

		if (count <= 0)
			throw new Error("Order.count can't be <= 0");
	}
}

export enum OrderKind {
	Buy = 1,
	Sell = 2
}