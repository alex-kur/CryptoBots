import fs from "fs";
import { format, add, compareAsc } from "date-fns";
import { CoinPair } from "../models/coin-pair";
import { Utils } from "../utils/utils";
import { Logger } from "../logger/logger";
import { Candlestick } from "../models/candlestick";
import { DateUtils } from "../utils/date.utils";
import { JSONUtils } from "../utils/json.utils";

export class SavedDataValidator {
	public constructor(private readonly isWarningsVisible: boolean = false) {
	}

	public isSavedDataValid(coinPair: CoinPair): boolean {
		Logger.process(`${coinPair.toString("-")} data validation...`);
		const coinPairFolderPath = Utils.getDataFolderPathFor(coinPair);
		
		if (!fs.existsSync(coinPairFolderPath)) {
			Logger.error(`Data for ${coinPair.toString("-")} does not exist`);
			return false;
		}

		const fileNames = Utils.getDataFileNamesOf(coinPair);

		if (!fileNames.length) {
			Logger.error(`Data for ${coinPair.toString("-")} does not exist`);
			return false;
		}

		let haveErrors = false;

		for (let i = 0; i < fileNames.length; i++) {
			if (i > 0)
				haveErrors = !this.isFilesSequenceValid(fileNames[i-1], fileNames[i]) || haveErrors;
			
			let candlesticks: Candlestick[];

			try {
				candlesticks = JSONUtils.parse(fs.readFileSync(`${coinPairFolderPath}/${fileNames[i]}`, "utf-8"));
			}
			catch(e) {
				haveErrors = true;
				Logger.trace(e);
				continue;
			}

			haveErrors = !this.isCandlesticksSequenceValid(candlesticks, fileNames[i], i === 0, i === fileNames.length - 1) || haveErrors;
		}

		if (!haveErrors)
			Logger.info(`${coinPair.toString("-")} data validation: ${Logger.green("Passed")}`);

		return !haveErrors;
	}

	private isFilesSequenceValid(previousFileName: string, currentFileName: string): boolean {
		const previousFileDate = Utils.getDateFromDataFileName(previousFileName);
		let expectedFileDate = add(previousFileDate, {months: 1});
		const currentFileDate = Utils.getDateFromDataFileName(currentFileName);

		if (DateUtils.compareDateOnly(expectedFileDate, currentFileDate) === 0)
			return true;

		Logger.error(`File sequence violation: ${format(previousFileDate, "yyyy-MM")} is followed by ${format(currentFileDate, "yyyy-MM")}`);
		return false;
	}

	private isCandlesticksSequenceValid(candlesticks: readonly Candlestick[],
										fileName: string,
										isFirstSequence: boolean,
										isLastSequence: boolean): boolean {
		let haveErrors = false;
		
		if (!isFirstSequence && !DateUtils.isMonthStart(candlesticks[0].openTime)) {
			Logger.error(`${fileName} contains data not from the beginning of the month`);
			haveErrors = true;
		}

		if (!isLastSequence && !DateUtils.isMonthEnd(candlesticks[candlesticks.length - 1].closeTime)) {
			Logger.error(`${fileName} contains data not up to the end of the month`);
			haveErrors = true;
		}

		const fileDate = Utils.getDateFromDataFileName(fileName);

		for (let i = 0; i < candlesticks.length; i++) {
			if (candlesticks[i].openTime.getUTCFullYear() !== fileDate.getUTCFullYear() ||
				candlesticks[i].openTime.getUTCMonth() !== fileDate.getUTCMonth()) {
				Logger.error(`${fileName} contains data for ${format(candlesticks[i].openPrice, "yyyy-MM-dd")}`);
				haveErrors = true;
			}

			if (i === 0)
				continue;

			const previousCandlestickDate = candlesticks[i-1].openTime;
			const expectedCandlestickDate = add(previousCandlestickDate, {hours: 1});
			const currentCandlestickDate = candlesticks[i].openTime;
			const compareResult = compareAsc(expectedCandlestickDate, currentCandlestickDate);

			if (compareResult > 0) {
				Logger.error(`Data sequence violation: ${format(previousCandlestickDate, "yyyy-MM-dd HH:mm")} is followed by ${format(currentCandlestickDate, "yyyy-MM-dd HH:mm")}`);
				haveErrors = true;
			}
			else if(compareResult < 0 && this.isWarningsVisible) {
				Logger.warning(`Data sequence violation: ${format(previousCandlestickDate, "yyyy-MM-dd HH:mm")} is followed by ${format(currentCandlestickDate, "yyyy-MM-dd HH:mm")}`);
			}
		}

		return !haveErrors;
	}
}