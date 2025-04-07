import { NameNotRegistered } from "../../connection/errors";
import type { ToJson } from "../../util/util";
import { Vec2, Vec3, Vec4 } from "../../world/vector";
import { ConstantEnum } from "./enum";
import { ConstantNumber } from "./number";
import { ConstantVec2 } from "./vec/vec2";
import { ConstantVec3 } from "./vec/vec3";
import { ConstantVec4 } from "./vec/vec4";

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

export class RandomType<T = any> {

	constructor(
		readonly id: string,
		readonly defaultRandom: () => Random<T>
	) { }
}

export const randomTypes: Record<string, RandomType> = {
	number: new RandomType('number', () => new ConstantNumber(1)),
	string: new RandomType('string', () => new ConstantEnum('?')),
	vec2: new RandomType('vec2', () => new ConstantVec2(Vec2.UNIT)),
	vec3: new RandomType('vec3', () => new ConstantVec3(Vec3.UNIT)),
	vec4: new RandomType('vec4', () => new ConstantVec4(Vec4.UNIT))
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

	abstract get value(): T

	seeded(seed: Seed): T {
		return this.value
	}

	toConstant(seed: Seed): ConstantRandom<T> {
		return this
	}
}