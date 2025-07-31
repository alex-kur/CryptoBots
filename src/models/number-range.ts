export class NumberRange {
	public constructor(private _min?: number, private _max?: number){}

	public get min(): number | undefined {
		return this._min;
	}

	public get max(): number | undefined {
		return this._max;
	}

	public get minOrDefault(): number {
		return this._min || 0;
	}

	public get maxOrDefault(): number {
		return this._max || 0;
	}

	public updateIfValueOutOfRange(v: number) {
		this._min = Math.min(this._min || v, v);
		this._max = Math.max(this._max || v, v);
	}
}