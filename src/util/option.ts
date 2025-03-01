//             _____
//         ___/     \___        |  |
//      ##/  _.- _.-    \##  -  |  |                       -
//      ##\#=_  '    _=#/##  |  |  |  /---\  |      |      |   ===\  |  __
//      ##   \\#####//   ##  |  |  |  |___/  |===\  |===\  |   ___|  |==/
//      ##       |       ##  |  |  |  |      |   |  |   |  |  /   |  |
//      ##       |       ##  |  \= \= \====  |   |  |   |  |  \___/  |
//      ##\___   |   ___/
//      ##    \__|__/

import { GenerationStyle } from "../engineer/data-pack/style/style.js";
import { Vec2, Vec3, Vec4 } from "../world/vector.js";
import { Random, RandomBoolean, RandomList, RandomNumber, RandomVec2, RandomVec3, RandomVec4, Seed } from "./random.js";

export const namedOptions: Map<string, (json: any) => Option> = new Map()

export function NamedOption(fromJson: (json: any) => Option) {
    return function (constructor: { new(...args: any): Option }) {
        namedOptions.set(constructor.name, fromJson)
    }
}

export abstract class Option<T = any> {

    protected random: Random<T> | undefined
    protected ref: string | undefined

    constructor(data: Random<T> | string) {
        if (typeof data === 'string') {
            this.ref = data
        } else {
            this.random = data
        }
    }

    static fromJson(json: any): Option {
        const factory = namedOptions.get(json.name)
        if (!factory) {
            throw Error(`No Option registered for name: ${json.name}`)
        }
        return factory(json)
    }

    // TODO add Form

    isRef(): boolean {
        return this.ref !== undefined
    }

    setRandom(random: Random<T>) {
        this.random = random
        this.ref = undefined
    }

    setRef(ref: string) {
        this.random = undefined
        this.ref = ref
    }

    getDefined(): Random<T> | undefined {
        return this.random
    }

    getRef(): string | undefined {
        return this.ref
    }

    get(style: GenerationStyle, seed: Seed): T {
        return this.random ? this.random.seeded(seed) : style.options[this.ref!].seeded(seed)
    }

    toJson() {
        return {
            random: this.random?.toJson(),
            ref: this.ref
        }
    }

    toNamedJson() {
        return {
            name: this.constructor.name,
            random: this.random?.toJson(),
            ref: this.ref
        }
    }
}

@NamedOption(BooleanOption.fromJson)
export class BooleanOption extends Option<boolean> {

    static fromJson(json: any): BooleanOption {
        return new BooleanOption(json.random ? RandomBoolean.fromJson(json.random) : json.ref)
    }
}

@NamedOption(NumberOption.fromJson)
export class NumberOption extends Option<number> {

    static fromJson(json: any): NumberOption {
        return new NumberOption(json.random ? RandomNumber.fromJson(json.random) : json.ref)
    }
}

@NamedOption(Vec2Option.fromJson)
export class Vec2Option extends Option<Vec2> {

    static fromJson(json: any): Vec2Option {
        return new Vec2Option(json.random ? RandomVec2.fromJson(json.random) : json.ref)
    }
}

@NamedOption(Vec3Option.fromJson)
export class Vec3Option extends Option<Vec3> {

    static fromJson(json: any): Vec3Option {
        return new Vec3Option(json.random ? RandomVec3.fromJson(json.random) : json.ref)
    }
}

@NamedOption(Vec4Option.fromJson)
export class Vec4Option extends Option<Vec4> {

    static fromJson(json: any): Vec4Option {
        return new Vec4Option(json.random ? RandomVec4.fromJson(json.random) : json.ref)
    }
}

@NamedOption(ObjectOption.fromJson)
export class ObjectOption<T = any> extends Option<T | undefined> {

    static fromJson<T>(json: any, itemFromJson?: (json: any) => T, itemToJson?: (item: T) => any): ObjectOption<T> {
        return new ObjectOption(json.random ? RandomList.fromJson(json.random, itemFromJson, itemToJson) : json.ref)
    }
}