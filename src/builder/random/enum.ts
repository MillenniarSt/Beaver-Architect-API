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
import { ConstantRandom, Random, Seed } from "./random";

export type Align = 'start' | 'center' | 'end' | 'fill'
export type RepetitionMode = 'none' | 'block' | 'every'

/* Abstract */

export type RandomEnumValue<T extends string[]> = { id: T[number], weight: number }

export class ConstantEnum<T extends string[] = any[]> extends ConstantRandom<T[number]> {

    constructor(readonly type: string, public value: T[number]) {
        super()
    }

    static fromJson(json: any, type: string): ConstantEnum {
        return new ConstantEnum(type, json)
    }
}

export class RandomEnum<T extends string[] = any[]> extends Random<T[number]> {

    constructor(readonly type: string, public choices: RandomEnumValue<T>[]) {
        super()
    }

    static fromJson(json: any, type: string): RandomEnum {
        return new RandomEnum(type, json)
    }

    edit(data: any): void {
        this.choices = data ?? this.choices
    }

    seeded(seed: Seed): T[number] {
        const randomWeight = seed.next() * this.choices.reduce((acc, choice) => acc + choice.weight, 0)
        let cumulative = 0
        for (const choice of this.choices) {
            cumulative += choice.weight
            if (randomWeight < cumulative) {
                return choice.id
            }
        }

        throw new ListEmptyError('RandomEnum/choices')
    }

    toData() {
        return this.choices
    }
}

export class ConstantSquareEnum<T extends string[] = any[]> extends ConstantRandom<[T[number], T[number]]> {

    constructor(readonly type: string, public value: [T[number], T[number]]) {
        super()
    }

    static fromJson(json: any, type: string): ConstantSquareEnum {
        return new ConstantSquareEnum(type, json)
    }
}

export type RandomSquareEnumValue<T extends string[]> = { id: [T[number], T[number]], weight: number }

export class RandomSquareEnum<T extends string[] = any[]> extends Random<[T[number], T[number]]> {

    constructor(readonly type: string, public choices: RandomSquareEnumValue<T>[]) {
        super()
    }

    static fromJson(json: any, type: string): RandomSquareEnum {
        return new RandomSquareEnum(type, json)
    }

    edit(data: any): void {
        this.choices = data ?? this.choices
    }

    seeded(seed: Seed): [T[number], T[number]] {
        const randomWeight = seed.next() * this.choices.reduce((acc, choice) => acc + choice.weight, 0)
        let cumulative = 0
        for (const choice of this.choices) {
            cumulative += choice.weight
            if (randomWeight < cumulative) {
                return choice.id
            }
        }

        throw new ListEmptyError('RandomEnum/choices')
    }

    toData(): {} {
        return this.choices
    }
}