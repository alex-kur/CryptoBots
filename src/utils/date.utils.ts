export class DateUtils {
	public static isMonthStart(date: Date): boolean {
		return date.getUTCDate() === 1 &&
			   date.getUTCHours() === 0 &&
			   date.getUTCMinutes() === 0 &&
			   date.getUTCSeconds() === 0;
	}

	public static isMonthEnd(date: Date): boolean {
		const month = date.getUTCMonth();
		const nextDate = new Date(date.getTime());
		nextDate.setSeconds(nextDate.getUTCSeconds() + 1);
		return nextDate.getUTCMonth() !== month;
	}

	public static compareDateOnly(date1: Date, date2: Date) {
		date1 = new Date(date1.getUTCFullYear(), date1.getUTCMonth(), date1.getUTCDate(), 0, 0, 0, 0);
		date2 = new Date(date2.getUTCFullYear(), date2.getUTCMonth(), date2.getUTCDate(), 0, 0, 0, 0);

		return date1.getTime() - date2.getTime();
	}

	public static compareDateAndHours(date1: Date, date2: Date) {
		date1 = new Date(date1.getUTCFullYear(), date1.getUTCMonth(), date1.getUTCDate(), date1.getHours(), 0, 0, 0);
		date2 = new Date(date2.getUTCFullYear(), date2.getUTCMonth(), date2.getUTCDate(), date2.getHours(), 0, 0, 0);

		return date1.getTime() - date2.getTime();
	}

	public static getStartOfDay(date: Date): Date {
		return new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 0, 0, 0, 0);
	}
}