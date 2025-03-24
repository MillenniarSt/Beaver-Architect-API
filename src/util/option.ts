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

export class Option<T = any> {

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
        return new Option(typeof json === 'string' ? json : Random.fromJson(json))
    }

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
        return this.ref ?? this.random!.toNamedJson()
    }
}