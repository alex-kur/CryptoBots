import fs from "fs";
import { Constants } from "../constants/constants";
import { CoinPair } from "../models/coin-pair";

export class Utils {
	public static delay(sec: number): Promise<void> {
        return new Promise((resolve, reject) => setTimeout(() => resolve(), sec * 1000));
	}

	public static getDataFolderPathFor(coinPair: CoinPair): string {
		return `${Constants.DataFolderName}/${coinPair.toString("-")}`;
	}

	public static getDataFileNamesOf(coinPair: CoinPair): readonly string[] {
		return fs
			.readdirSync(Utils.getDataFolderPathFor(coinPair))
			.filter(fn => Constants.DataFileNamePattern.test(fn))
			.sort();
	}

	public static removeFileExtension(fileName: string): string {
		return fileName.includes(".")
			? fileName.substring(0, fileName.indexOf("."))
			: fileName;
	}

	public static getDateFromDataFileName(fileName: string): Date {
		const dateStr = Utils.removeFileExtension(fileName);
		const splitedDateStr = dateStr.split("-");
		return new Date(+splitedDateStr[0], +splitedDateStr[1] - 1, 1, 0, 0, 0, 0);
	}
}