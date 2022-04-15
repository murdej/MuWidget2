export class MuUIDs {
	public static counters : Counters = {
		id: 0,
		name: 0
	}

	public static prefix = "_Mu_";

	public static next(k : keyof Counters) : string
	{
		MuUIDs.counters[k]++;
		return MuUIDs.prefix + MuUIDs.counters[k].toString();
	}

}

type Counters = {
	id: number,
	name: number
}