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
import { Vec2, Vec3, Vec4 } from "../../world/vector";
import { ConstantBoolean, RandomBoolean } from "./boolean";
import { ConstantEnum, ConstantSquareEnum, RandomEnum, RandomSquareEnum } from "./enum";
import { ConstantNumber, RandomNumber, RandomStepNumber } from "./number";
import type { ConstantRandom, Random } from "./random";
import { ConstantVec2, RandomVec2 } from "./vec/vec2";
import { ConstantVec3, RandomVec3 } from "./vec/vec3";
import { ConstantVec4, RandomQuaternion, RandomVec4 } from "./vec/vec4";

const randomTypes: Record<string, RandomType> = {}

export class RandomType<T = any> {

    constructor(
        readonly id: string,
        readonly constant: () => ConstantRandom<T>,
        readonly randoms: Record<string, () => Random<T>>,
        readonly isArchitect: boolean
    ) { }

    static get(type: string): RandomType {
        const randomType = randomTypes[type]
        if(!randomType)
            throw new NameNotRegistered(type, 'RandomType')
        return randomType
    }

    static register<T>(id: string, constant: () => ConstantRandom<T>, randoms: Record<string, () => Random<T>>, isArchitectGeneration: boolean = false) {
        randomTypes[id] = new RandomType<T>(id, constant, randoms, isArchitectGeneration)
    }

    getRandom(key: string): Random<T> {
        if(key === 'constant') {
            return this.constant()
        }

        const random = this.randoms[key]
        if(!random)
            throw new NameNotRegistered(key, 'RandomType', 'randoms')

        return random()
    }
}

RandomType.register('boolean', () => new ConstantBoolean(false), {
    generic: () => new RandomBoolean(0.5)
})
RandomType.register('number', () => new ConstantNumber(1), {
    generic: () => new RandomNumber(0, 10),
    step: () => new RandomStepNumber(0, 10)
})
RandomType.register('string', () => new ConstantEnum('undefined'), {
    generic: () => new RandomEnum([{ id: 'undefined', weight: 1 }])
})
RandomType.register('square_enum', () => new ConstantSquareEnum(['undefined', 'undefined']), {
    generic: () => new RandomSquareEnum([{ id: ['undefined', 'undefined'], weight: 1 }])
})
RandomType.register('vec2', () => new ConstantVec2(Vec2.UNIT), {
    generic: () => new RandomVec2(new RandomNumber(0, 10), new RandomNumber(0, 10))
})
RandomType.register('vec3', () => new ConstantVec3(Vec3.UNIT), {
    generic: () => new RandomVec3(new RandomNumber(0, 10), new RandomNumber(0, 10), new RandomNumber(0, 10))
})
RandomType.register('vec4', () => new ConstantVec4(Vec4.UNIT), {
    generic: () => new RandomVec4(new RandomNumber(0, 10), new RandomNumber(0, 10), new RandomNumber(0, 10), new RandomNumber(0, 10)),
    quaternion: () => new RandomQuaternion(new RandomNumber(0, Math.PI * 2), new RandomVec3(new RandomNumber(-1, 1), new RandomNumber(-1, 1), new RandomNumber(-1, 1)))
})