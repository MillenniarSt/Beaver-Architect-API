//             _____
//         ___/     \___        |  |
//      ##/  _.- _.-    \##  -  |  |                       -
//      ##\#=_  '    _=#/##  |  |  |  /---\  |      |      |   ===\  |  __
//      ##   \\#####//   ##  |  |  |  |___/  |===\  |===\  |   ___|  |==/
//      ##       |       ##  |  |  |  |      |   |  |   |  |  /   |  |
//      ##       |       ##  |  \= \= \====  |   |  |   |  |  \___/  |
//      ##\___   |   ___/
//      ##    \__|__/

import { ListEmptyError } from "../../connection/errors";
import { ConstantRandom, NamedRandom, Random, Seed } from "./random";

export type RandomEnumValue<T extends string[]> = { id: T[number], weight: number }

@NamedRandom()
export class ConstantEnum<T extends string[] = string[]> extends ConstantRandom<T[number]> {

    readonly type = 'enum'

    constructor(public value: T[number]) {
        super()
    }

    static fromJson(json: any): ConstantEnum {
        return new ConstantEnum(json)
    }

    toJson(): {} {
        return this.value
    }
}

@NamedRandom()
export class RandomEnum<T extends string[] = string[]> extends Random<T[number]> {

    readonly type = 'enum'

    constructor(public choices: RandomEnumValue<T>[]) {
        super()
    }

    static fromJson(json: any): RandomEnum {
        return new RandomEnum(json.choices)
    }

    toConstant(seed: Seed): ConstantEnum<T> {
        return new ConstantEnum(this.seeded(seed))
    }

    seeded(seed: Seed): T[number] {
        const randomWeight = seed.next() * this.choices.reduce((acc, chioce) => acc + chioce.weight, 0)
        let cumulative = 0
        for (const chioce of this.choices) {
            cumulative += chioce.weight
            if (randomWeight < cumulative) {
                return chioce.id
            }
        }

        throw new ListEmptyError('RandomEnum/choices')
    }

    toJson(): {} {
        return this.choices
    }
}

@NamedRandom()
export class ConstantSquareEnum<T extends string[] = string[]> extends ConstantRandom<[T[number], T[number]]> {

    readonly type = 'square_enum'

    constructor(public value: [T[number], T[number]]) {
        super()
    }

    static fromJson(json: any): ConstantEnum {
        return new ConstantEnum(json)
    }

    toJson(): {} {
        return this.value
    }
}

export type RandomSquareEnumValue<T extends string[]> = { id: [T[number], T[number]], weight: number }

@NamedRandom()
export class RandomSquareEnum<T extends string[] = string[]> extends Random<[T[number], T[number]]> {

    readonly type = 'square_enum'

    constructor(public choices: RandomSquareEnumValue<T>[]) {
        super()
    }

    static fromJson(json: any): RandomEnum {
        return new RandomEnum(json.choices)
    }

    toConstant(seed: Seed): ConstantSquareEnum<T> {
        return new ConstantSquareEnum(this.seeded(seed))
    }

    seeded(seed: Seed): [T[number], T[number]] {
        const randomWeight = seed.next() * this.choices.reduce((acc, chioce) => acc + chioce.weight, 0)
        let cumulative = 0
        for (const chioce of this.choices) {
            cumulative += chioce.weight
            if (randomWeight < cumulative) {
                return chioce.id
            }
        }

        throw new ListEmptyError('RandomEnum/choices')
    }

    toJson(): {} {
        return this.choices
    }
}