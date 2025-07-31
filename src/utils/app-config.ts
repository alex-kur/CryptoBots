import fs from "fs";
import { JSONUtils } from "../utils/json.utils";
import { IBalanceStrategySettings } from "../trading-strategies/balance.strategy";
import { IAssetsAllocationStrategySettings } from "../trading-strategies/assets-allocation.strategy";
import { IGridStrategySettings } from "../trading-strategies/grid.strategy";

export class AppConfig {
	private static configFileData: any;
	
	static {
		AppConfig.configFileData = JSONUtils.parseConfig(fs.readFileSync("config.json", "utf-8"));
	}

	private constructor() {
	}

	public static get initialBalance(): ReadonlyMap<string, number> {
		return this.configFileData.initialBalance;
	}

	public static get balancerStrategySettings(): IBalanceStrategySettings {
		return this.configFileData.balancerStrategySettings;
	}

	public static get assetsAllocationStrategySettings(): IAssetsAllocationStrategySettings {
		return this.configFileData.assetsAllocationStrategySettings;
	}

	public static get gridStrategySettings(): IGridStrategySettings {
		return this.configFileData.gridStrategySettings;
	}
}