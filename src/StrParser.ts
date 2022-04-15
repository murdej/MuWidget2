
export class StrParser
{
	protected str : string;

	public position : number = 0;

	public lastMark : StrParserMark|null = null;

	public debugMode : boolean = false;

	constructor(str : string) {
		this.str = str;
	}

	public findNext(chunk : string|string[], skipChunk : boolean = false) : StrParserMark|null
	{
		if (typeof chunk === "string") chunk = [chunk];
		// let firstPos : number|null = null;
		let firstPos : number|null = null;
		let firstChunk : string|null = null;
		let firstChunkNum : number = 0;
		let i = 0;
		for(const ch of chunk)
		{
			const pos = this.str.indexOf(ch, this.position);
			if (pos > 0 && (firstPos === null || pos < firstPos))
			{
				firstPos = pos;
				firstChunk = ch;
				firstChunkNum = i;
			}
			i++;
		}
		if (firstChunk)
		{
			if (skipChunk) firstPos += firstChunk.length;
			this.position = firstPos;
			this.lastMark = {
				chunk: firstChunk,
				chunkNum: firstChunkNum,
				position: firstPos
			};
			this._onEndChunk = false;
			this.debug("findNext(" + chunk.join('", "') + ") > '" + firstChunk + "', " + this.position);
			return this.lastMark;
		} else {
			this.debug("findNext(" + chunk.join('", "') + ") not found " + this.position);
			return null;
		}
	}

	public substring(start : StrParserMark|number|null = null, stop : StrParserMark|number|null = null) : string
	{
		if (start === null) start = this.position;
		else if (typeof start !== "number") start = start.position;

		if (stop === null) stop = this.str.length;
		else if (typeof stop !== "number") stop = stop.position;

		const res = this.str.substring(start, stop);
		this.debug("substr " + start + ":" + stop + " > " + res);
		return res;
	}

	public moverel(mov : number) : StrParserMark
	{
		const newPos = this.position + mov;
		this.position = Math.min(this.str.length, Math.max(0, newPos));
		return { position: this.position };
	}

	public pos()
	{
		return { position: this.position };
	}

	protected _onEndChunk = false;
	public toEndChunk()
	{
		const l = this._onEndChunk ? 0 : (this.lastMark?.chunk?.length || 0);
		this.moverel(l);
		this._onEndChunk = true;
		this.debug("toEndChunk +" + l.toString());
	}

	protected debug(msg : any)
	{
		if (this.debugMode)
		{
			console.log(msg + "\n		%c" + this.str.substring(0, this.position) + "%c" + this.str.substring(this.position), "background: green; color: white", "color: blue");
		}
	}

	public isEnd() : boolean
	{
		return this.position >= this.str.length;
	}
}

export type StrParserMark = {
	chunk? : string,
	chunkNum? : number,
	position : number
}

