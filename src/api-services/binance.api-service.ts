import { format } from "date-fns";
import { Logger } from "../logger/logger";
import { CoinPair } from "../models/coin-pair";
import { Candlestick } from "../models/candlestick";

export class BinanceApiService {
	private readonly binanceApiUrl: string = "https://www.binance.com/api/v3";

	public async getCandlesticks(coinPair: CoinPair, startDate?: Date): Promise<Candlestick[]> {
		//Doc link: https://developers.binance.com/docs/binance-spot-api-docs/rest-api/market-data-endpoints
		//URL sample: https://www.binance.com/api/v3/klines?symbol=BTCUSDT&interval=5m&startTime=0&limit=1000
		
		Logger.process(`Getting ${coinPair.toString("/")} historical prices from ${startDate ? format(startDate, "yyyy-MM") : ""}...`);

		const params = new URLSearchParams();
		params.append("symbol", coinPair.toString());
		params.append("interval", "1h");
		params.append("startTime", startDate ? startDate.getTime().toString() : "0");
		params.append("limit", "1000");

		const response = await this.executeGetRequest<Array<any[]>>("klines", params);
		const result = response.map(r =>new Candlestick(new Date(r[0]!), Number(r[1]!), Number(r[2]!), Number(r[3]!), Number(r[4]!), Number(r[5]!), new Date(r[6]!)));
		return result;
	}

	private async executeGetRequest<T>(methodName: string, params: URLSearchParams): Promise<T> {
		const requestUrl = `${this.binanceApiUrl}/${methodName}?${params.toString()}`;
		const response = await fetch(requestUrl, {method: "GET"});
		return response.json() as Promise<T>;
	}
}