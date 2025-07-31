export class Logger {
	public static info(message: string) {
		this.process("");
		console.info(message);
	}

	public static warning(message: string) {
		this.process("");
		console.warn(`Warn: ${message}`);
	}

	public static error(message: string) {
		this.process("");
		console.error(`Error: ${message}`);
	}

	public static trace(error: any) {
		this.process("");
		console.error("", error);
	}

	public static process(message: string) {
		if (process.env.NODE_ENV === "development")
			return;

		process.stdout.clearLine(0);
  		process.stdout.cursorTo(0);
		process.stdout.write(message);
	}

	public static red = (s: string): string => `\x1b[31m${s}\x1b[0m`;
	public static green = (s: string): string => `\x1b[32m${s}\x1b[0m`;
}