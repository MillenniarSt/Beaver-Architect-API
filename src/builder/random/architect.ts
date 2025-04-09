//             _____
//         ___/     \___        |  |
//      ##/  _.- _.-    \##  -  |  |                       -
//      ##\#=_  '    _=#/##  |  |  |  /---\  |      |      |   ===\  |  __
//      ##   \\#####//   ##  |  |  |  |___/  |===\  |===\  |   ___|  |==/
//      ##       |       ##  |  |  |  |      |   |  |   |  |  /   |  |
//      ##       |       ##  |  \= \= \====  |   |  |   |  |  \___/  |
//      ##\___   |   ___/
//      ##    \__|__/

import { ConstantRandom, Random, Seed } from "./random";

export class ArchitectConstant<T = any> extends ConstantRandom<T> {

    constructor(
        readonly type: string,
        readonly constant: ConstantRandom<T>
    ) {
        super()
    }

    static fromJson(json: any): ArchitectConstant {
        return new ArchitectConstant(json.type, ConstantRandom.fromJson(json.constant))
    }

    get value(): T {
        return this.constant.value
    }

    toJson(): {} {
        return {
            type: this.type,
            constant: this.constant.toNamedJson()
        }
    }
}

export class ArchitectRandom<T = any> extends Random<T> {

    constructor(
        readonly type: string,
        readonly random: Random<T>
    ) {
        super()
    }

    static fromJson(json: any): ArchitectRandom {
        return new ArchitectRandom(json.type, json.value)
    }

    toConstant(seed: Seed): ConstantRandom<T> {
        return new ArchitectConstant(this.type, this.random.toConstant(seed))
    }

    seeded(seed: Seed): T {
        return this.random.seeded(seed)
    }

    toJson(): {} {
        return {
            type: this.type,
            random: this.random.toNamedJson()
        }
    }
}