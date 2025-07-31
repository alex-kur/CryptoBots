import { Candlestick } from "../models/candlestick";
import { Order } from "../models/order";

export type EventTypes = {
	"new-hour-started": [openPrice: number, date: Date];
	"orders-executed": [order: Order[]];
	"current-hour-ended": [candlestick: Candlestick];
}