export class ValidateResult {

	public errors: Record<string, string[]> = {};

	public result: any;

	public add(place : string, message : string) {
		if (!(place in this.errors)) this.errors[place] = [];
		this.errors[place].push(message);
	}

	public isValid() : boolean
	{
		return Object.keys(this.errors).length == 0;
	}

	constructor(data: {errors: Record<string, string[]>, result: any} = null) {
		if (data) {
			this.errors = data.errors;
			this.result = data.result;
		}
	}

	public merge(validateResult : ValidateResult) {
		this.result = validateResult.result;
		for(const place in validateResult.errors) {
			for(const message of validateResult.errors[place]) {
				this.add(place, message);
			}
		}
	}
}