/*
 * This file is part of the MuWidget package.
 *
 * (c) Vít Peprníček <vit.peprnicek@gmail.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

export class Arrays {
	static diff<T>(a1: T[], a2: T[]): T[] {
		return a1.filter(item => !a2.includes(item))
	}

	static intersect<T>(arr1: T[], arr2: T[]): T[] {
		return arr1.filter(value => arr2.includes(value));
	}


	static groupBy<T,TI extends string|number|symbol>(all: T[], getByField: (item:T) => TI): Record<TI, T[]> {
		//@ts-ignore
		const res: Record<TI, T[]> = {};
		for(const item of all) {
			const k = getByField(item);
			if (!(k in res)) res[k] = [];
			res[k].push(item);
		}
		return res;
	}

	static ToObject<TI, TK extends KeyTypes>(data: TI[], key: TK|((item: TI)=>TK), val: null|string|((item: TI)=>TK) = null): Record<TK, TI|any> {
		const res: Record<TK, TI|any> = {};
		for(const item of data) {
			const k = typeof key === "string"
				? item[key]
				: key(item);

			if (val === null) res[k] = item;
			else if (typeof item === "string") res[k] = item[key];
			else res[k] = key(item);
		}
		return res;
	}

	static unique<T>(items: T[]): T[] {
		return Array.from(new Set(items));
	}
}

export type KeyTypes = string|number|symbol;
