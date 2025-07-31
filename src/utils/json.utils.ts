export class JSONUtils {
	private static readonly isoDateFormat = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z$/;
	private static readonly mapTypeName = "Map";

	public static parseConfig<T>(text: string): T {
		text = text.replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, "").trim();
		return JSON.parse(text, JSONUtils.reviver);
	}

	public static parse<T>(text: string): T {
		return JSON.parse(text, JSONUtils.reviver);
	}

	public static stringify<T>(value: T, space?: string): string {
		return JSON.stringify(value, JSONUtils.replacer, space);
	}
	
	private static replacer(key: string, value: any): any {
		if(value instanceof Map)
    		return { dataType: JSONUtils.mapTypeName, value: Array.from(value.entries()) };
    	
		return value;
	}
	
	private static reviver(key: string, value: any): any {
  		if (typeof value === 'string' && !!value && JSONUtils.isoDateFormat.test(value))
			return new Date(value);
		else if(typeof value === 'object' && !!value && value.dataType === JSONUtils.mapTypeName)
      		return new Map(value.value);
  		
		return value;
	}
}