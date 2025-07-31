import fs from "fs";
import { format, compareAsc } from "date-fns";
import { BinanceApiService } from "../api-services/binance.api-service";
import { CoinPair } from "../models/coin-pair";
import { Constants } from "../constants/constants";
import { Candlestick } from "../models/candlestick";
import { Logger } from "../logger/logger";
import { Utils } from "../utils/utils";
import { DateUtils } from "../utils/date.utils";
import { JSONUtils } from "../utils/json.utils";

export class DataDownloaderService {
	private readonly binanceApi: BinanceApiService = new BinanceApiService();

	public async downloadCandlesticks(coinPair: CoinPair): Promise<void> {
		Logger.process(`Downloading ${coinPair.toString("-")} data...`);
		const dataFolderPath = this.getOrCreateDataFolder(coinPair);
		const fileNames = Utils.getDataFileNamesOf(coinPair);
		let lastCandlesticks: Candlestick[] = [];
		let startDate: Date | undefined;

		if (fileNames.length) {
			try {
				lastCandlesticks = JSONUtils.parse(fs.readFileSync(`${dataFolderPath}/${fileNames[fileNames.length - 1]}`, "utf-8"));
			}
			catch(e) {
				Logger.trace(e);
				return Promise.reject();
			}

			startDate = lastCandlesticks[lastCandlesticks.length - 1].openTime;
		}

		const todayDate = new Date();
		let haveErrors = false;
		const isAllDowloaded = () => startDate && DateUtils.compareDateAndHours(startDate, todayDate) >= 0;

		while (!isAllDowloaded()) {
			if (startDate)
				Logger.process(`Downloading ${coinPair.toString("-")} data for ${format(startDate, "yyyy-MM")}...`);

			let newCandlesticks: Candlestick[];

			try {
				newCandlesticks = await this.binanceApi.getCandlesticks(coinPair, startDate);
			}
			catch(e: any) {
				Logger.trace(e);
				haveErrors = true;
				break;
			}

			if (!newCandlesticks.length) {
				Logger.error(`Binance hasn't returned data since ${startDate ? "the beginning" : format(startDate!, "yyyy-MM-dd")}`);
				haveErrors = true;
				break;
			}

			lastCandlesticks = this.mergeAndSaveData(coinPair, lastCandlesticks, newCandlesticks);
			startDate = lastCandlesticks[lastCandlesticks.length - 1].openTime;

			//Because Binance has request limit per minute
			if (!isAllDowloaded())
				await Utils.delay(10);
		}

		if (haveErrors)
			return Promise.reject();
		else
			Logger.info(`Downloading ${coinPair.toString("-")} data: ${Logger.green("Done")}`);
	}

	private getOrCreateDataFolder(coinPair: CoinPair): string {
		if (!fs.existsSync(Constants.DataFolderName))
			fs.mkdirSync("data");

		const coinPairFolderPath = Utils.getDataFolderPathFor(coinPair);

		if (!fs.existsSync(coinPairFolderPath))
			fs.mkdirSync(coinPairFolderPath);

		return coinPairFolderPath;
	}

	private mergeAndSaveData(coinPair: CoinPair,
							 lastCandlesticks: readonly Candlestick[],
							 newCandlesticks: readonly Candlestick[]): Candlestick[] {
		let monthCandleSticks = [...lastCandlesticks];

		if (monthCandleSticks.length &&
			compareAsc(monthCandleSticks[monthCandleSticks.length - 1].openTime, newCandlesticks[0].openTime) === 0)
			monthCandleSticks.pop();

		let processingMonthStartAtIndex = 0;
		let isAllProcessed = false;

		while (!isAllProcessed) {
			const processingMonth = monthCandleSticks.length
				? monthCandleSticks[0].openTime.getUTCMonth()
				: newCandlesticks[processingMonthStartAtIndex].openTime.getUTCMonth();

			const nextMonthStartAtIndex = newCandlesticks
				.findIndex((c, i) => c.openTime.getUTCMonth() !== processingMonth && i > processingMonthStartAtIndex);

			if (nextMonthStartAtIndex > 0) {
				monthCandleSticks.push(...newCandlesticks.slice(processingMonthStartAtIndex, nextMonthStartAtIndex));
				processingMonthStartAtIndex = nextMonthStartAtIndex;
			}
			else if (nextMonthStartAtIndex === -1) {
				monthCandleSticks.push(...newCandlesticks.slice(processingMonthStartAtIndex, newCandlesticks.length));
				isAllProcessed = true;
			}

			const currentFileName = format(monthCandleSticks[0].openTime, "yyyy-MM") + ".json";
			fs.writeFileSync(`${Utils.getDataFolderPathFor(coinPair)}/${currentFileName}`, JSONUtils.stringify(monthCandleSticks));

			if (!isAllProcessed)
				monthCandleSticks = [];
		}

		return monthCandleSticks;
	}
}