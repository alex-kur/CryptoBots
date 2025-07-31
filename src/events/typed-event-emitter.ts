import { EventEmitter } from "events";
import { EventTypes } from "./event-types";

export class TypedEventEmitter {
	private static readonly eventEmitter: EventEmitter = new EventEmitter();

	public static emit<TEventName extends keyof EventTypes & string>(eventName: TEventName,
																	 ...eventArg: EventTypes[TEventName]) {
		this.eventEmitter.emit(eventName, ...eventArg);
	}
	
	public static on<TEventName extends keyof EventTypes & string>(eventName: TEventName,
																   handler: (...eventArg: EventTypes[TEventName]) => void) {
		this.eventEmitter.on(eventName, handler);
	}

	public static off<TEventName extends keyof EventTypes & string>(eventName: TEventName,
																	handler: (...eventArg: EventTypes[TEventName]) => void) {
		this.eventEmitter.off(eventName, handler);
	}
}