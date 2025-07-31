import fs from "fs";
import { format } from "date-fns";
import { Candlestick } from "../models/candlestick";
import { CoinPair } from "../models/coin-pair";
import { DataDownloaderService } from "../services/data-downloader.service";
import { Utils } from "../utils/utils";
import { JSONUtils } from "../utils/json.utils";
import { SavedDataValidator } from "../validation/saved-data.validator";
import { Logger } from "../logger/logger";

export class CandlesticksDataProvider {
	private readonly downloaderService = new DataDownloaderService();
	private readonly dataValidator = new SavedDataValidator();
	
	private fileNames: readonly string[] = [];
	private currentFileIndex = 0;
	private monthCandlesticks: Candlestick[] = [];
	private isInitialized: boolean = false;
	
	public constructor(public readonly coinPair: CoinPair) {
	}

	private get isLastFile(): boolean {
		return this.currentFileIndex === this.fileNames.length - 1;
	}

	public async init(): Promise<boolean> {
		await this.downloaderService.downloadCandlesticks(this.coinPair);
		const isSavedDataValid = this.dataValidator.isSavedDataValid(this.coinPair);

		if (!isSavedDataValid)
			return false;
		
		this.fileNames = Utils.getDataFileNamesOf(this.coinPair);
		this.monthCandlesticks = JSONUtils.parse(fs.readFileSync(`${Utils.getDataFolderPathFor(this.coinPair)}/${this.fileNames[this.currentFileIndex]}`, "utf-8"));
		//REMOVE
		this.isInitialized = true;
		return true;
	}

	public next(): Candlestick | undefined {
		if (!this.isInitialized)
			throw new Error("Data provider is not initialized");

		const result = this.shift();

		if (result)
			Logger.process(format(result.openTime, "yyyy-MM-dd"));

		return result;
	}

	private shift(): Candlestick | undefined {
		let result = this.monthCandlesticks.shift();

		if (result || this.isLastFile)
			return result;

		this.currentFileIndex++;
		this.monthCandlesticks = JSONUtils.parse(fs.readFileSync(`${Utils.getDataFolderPathFor(this.coinPair)}/${this.fileNames[this.currentFileIndex]}`, "utf-8"));
		return this.monthCandlesticks.shift();
	}
}