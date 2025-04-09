//             _____
//         ___/     \___        |  |
//      ##/  _.- _.-    \##  -  |  |                       -
//      ##\#=_  '    _=#/##  |  |  |  /---\  |      |      |   ===\  |  __
//      ##   \\#####//   ##  |  |  |  |___/  |===\  |===\  |   ___|  |==/
//      ##       |       ##  |  |  |  |      |   |  |   |  |  /   |  |
//      ##       |       ##  |  \= \= \====  |   |  |   |  |  \___/  |
//      ##\___   |   ___/
//      ##    \__|__/

import { NameNotRegistered } from "../../connection/errors";
import type { ToJson } from "../../util/util";

export class Seed {

	public seed: number

	constructor(seed: number = Math.floor(Math.random() * 2147483647)) {
		this.seed = seed % 2147483647
		if (this.seed <= 0) {
			this.seed += 2147483646
		}
	}

	next(): number {
		this.seed = (this.seed * 16807) % 2147483647
		return (this.seed - 1) / 2147483646
	}
}

export const namedRandom: Map<string, RandomFunction> = new Map()

export function NamedRandom() {
	return function (constructor: RandomFunction) {
		namedRandom.set(constructor.name, constructor)
	}
}

export interface RandomFunction extends Function {

	new(...args: any[]): Random

	fromJson(json: any): Random
}

export abstract class Random<T = any> implements ToJson {

	static fromJson(json: any): Random {
		const factory = namedRandom.get(json.name)?.fromJson
		if (!factory) {
			throw new NameNotRegistered(json.name, 'Random')
		}
		return factory(json.data)
	}

	abstract get type(): string

	abstract seeded(seed: Seed): T

	abstract toConstant(seed: Seed): ConstantRandom<T>

	abstract toJson(): {}

	toNamedJson() {
        return {
            name: this.constructor.name,
            data: this.toJson()
        }
    }
}

export abstract class ConstantRandom<T = any> extends Random<T> {

	static fromJson(json: any): ConstantRandom {
		return Random.fromJson(json) as ConstantRandom
	}

	abstract get value(): T

	seeded(seed: Seed): T {
		return this.value
	}

	toConstant(seed: Seed): ConstantRandom<T> {
		return this
	}
}