//             _____
//         ___/     \___        |  |
//      ##/  _.- _.-    \##  -  |  |                       -
//      ##\#=_  '    _=#/##  |  |  |  /---\  |      |      |   ===\  |  __
//      ##   \\#####//   ##  |  |  |  |___/  |===\  |===\  |   ___|  |==/
//      ##       |       ##  |  |  |  |      |   |  |   |  |  /   |  |
//      ##       |       ##  |  \= \= \====  |   |  |   |  |  \___/  |
//      ##\___   |   ___/
//      ##    \__|__/

import { RegistryChild } from "../../register/register";

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

export abstract class Random<T extends {} = any> extends RegistryChild {

	abstract edit(data: any): void

	abstract seeded(seed: Seed): T

	abstract toCppGetter(): string
}

export abstract class ConstantRandom<T extends {} = any> extends Random<T> {

	abstract get value(): T

	abstract set value(newValue: T)

	edit(data: T | undefined) {
		this.value = data ?? this.value
	}

	seeded(seed: Seed): T {
		return this.value
	}

	toData(): {} {
		return this.value
	}
}