//             _____
//         ___/     \___        |  |
//      ##/  _.- _.-    \##  -  |  |                       -
//      ##\#=_  '    _=#/##  |  |  |  /---\  |      |      |   ===\  |  __
//      ##   \\#####//   ##  |  |  |  |___/  |===\  |===\  |   ___|  |==/
//      ##       |       ##  |  |  |  |      |   |  |   |  |  /   |  |
//      ##       |       ##  |  \= \= \====  |   |  |   |  |  \___/  |
//      ##\___   |   ___/
//      ##    \__|__/

import { RANDOMS } from "../../register/random";
import { type JsonFormat } from "../../util/util";
import { Random, Seed } from "./random";

export class RandomCompoundObject<T extends Record<string, {}> = Record<string, {}>> extends Random<T> {

    constructor(readonly type: string, public randoms: { [V in keyof T]: Random<T[V]> }) {
        super()
    }

    static fromJson(json: any, type: string): RandomCompoundObject {
        return new RandomCompoundObject(type, Object.fromEntries(Object.entries(json).map(([key, random]: [string, any]) => [key, RANDOMS.fromJson(random)])))
    }

    edit(data: any): void {
        Object.entries(data).forEach(([key, value]) => {
            const random = this.randoms[key]
            if (random) {
                random.edit(value)
            }
        })
    }

    seeded(seed: Seed): T {
        return Object.fromEntries(Object.entries(this.randoms).map(([key, random]) => [key, random.seeded(seed)])) as T
    }

    toData(): JsonFormat {
        return Object.fromEntries(Object.entries(this.randoms).map(([key, random]) => [key, random.toJson()]))
    }
}

export class RandomCompoundArray<T extends {}[] = {}[]> extends Random<T> {

    constructor(readonly type: string, public randoms: { [V in keyof T]: Random<T[V]> }) {
        super()
    }

    static fromJson<T extends {}[]>(json: any, type: string): RandomCompoundArray<T> {
        return new RandomCompoundArray(type, json.map((random: any) => RANDOMS.fromJson(random)))
    }

    edit(data: any): void {
        this.randoms.forEach((random, i) => {
            if (data[i] !== undefined) {
                random.edit(data[i])
            }
        })
    }

    seeded(seed: Seed): T {
        return this.randoms.map((random) => random.seeded(seed)) as T
    }

    toData(): JsonFormat {
        return this.randoms.map((random) => random.toJson())
    }
}