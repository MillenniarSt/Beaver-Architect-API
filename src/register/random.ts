//             _____
//         ___/     \___        |  |
//      ##/  _.- _.-    \##  -  |  |                       -
//      ##\#=_  '    _=#/##  |  |  |  /---\  |      |      |   ===\  |  __
//      ##   \\#####//   ##  |  |  |  |___/  |===\  |===\  |   ___|  |==/
//      ##       |       ##  |  |  |  |      |   |  |   |  |  /   |  |
//      ##       |       ##  |  \= \= \====  |   |  |   |  |  \___/  |
//      ##\___   |   ___/
//      ##    \__|__/

import { ConstantBoolean, RandomBoolean } from "../builder/random/boolean";
import { RandomCompoundArray, RandomCompoundObject } from "../builder/random/compound";
import { ConstantEnum, ConstantSquareEnum, RandomEnum, RandomSquareEnum, type Align, type RepetitionMode } from "../builder/random/enum";
import { ConstantNumber, RandomNumber, RandomStepNumber } from "../builder/random/number";
import type { Random, Seed } from "../builder/random/random";
import { ConstantVec2, RandomVec2 } from "../builder/random/vec/vec2";
import { ConstantVec3, RandomVec3 } from "../builder/random/vec/vec3";
import { ConstantVec4, RandomQuaternion, RandomVec4 } from "../builder/random/vec/vec4";
import { KeyNotRegistered } from "../connection/errors";
import { parseRecord, type JsonFormat } from "../util/util";
import { Vec2, Vec3, Vec4 } from "../world/vector";
import { ObjectRegister, Register, Registry, RegistryObject } from "./register";

export const RANDOM_TYPES = new Register<RandomTypeRegistry>('random_types')
export const RANDOMS = new ObjectRegister<Random, RandomRegistry<any>>('randoms')

export type RandomRegistryFromJson = 
        { id: string, template: 'clone', data: { random: string, allowed?: JsonFormat[] } } |
        { id: string, template: 'c_enum' | 'enum', data: { defaultValue: string, allowed: string[] } } |
        { id: string, template: 'compound_object', data: { randoms: Record<string, string> } } |
        { id: string, template: 'compound_array', data: { randoms: string[] } }

export class RandomRegistry<T extends {} = any> extends RegistryObject<Random<T>> {

    // Boolean
    static readonly C_BOOLEAN = RANDOMS.register(new RandomRegistry<boolean>('c_boolean', ConstantBoolean.fromJson, (v) => new ConstantBoolean(v ?? false)))
    static readonly BOOLEAN = RANDOMS.register(new RandomRegistry<boolean>('boolean', RandomBoolean.fromJson, (v) => new RandomBoolean(v !== undefined ? (v ? 1 : 0) : 0.5)))

    // Number
    static readonly C_NUMBER = RANDOMS.register(new RandomRegistry<number>('c_number', ConstantNumber.fromJson, (v) => new ConstantNumber(v ?? 1)))
    static readonly NUMBER = RANDOMS.register(new RandomRegistry<number>('number', RandomNumber.fromJson, (v) => v ? new RandomNumber(v, v) : new RandomNumber(1, 10)))
    static readonly NUMBER_STEP = RANDOMS.register(new RandomRegistry<number>('number_step', RandomStepNumber.fromJson, (v) => v ? new RandomStepNumber(v, v, 1) : new RandomStepNumber(1, 10, 1)))

    // Vec2
    static readonly C_VEC2 = RANDOMS.register(new RandomRegistry('c_vec2', ConstantVec2.fromJson, (v) => new ConstantVec2(v ?? Vec2.UNIT)))
    static readonly VEC2 = RANDOMS.register(new RandomRegistry('vec2', RandomVec2.fromJson, (v) => new RandomVec2(RandomRegistry.NUMBER.generate(v ? v.x : undefined), RandomRegistry.NUMBER.generate(v ? v.y : undefined))))

    // Vec3
    static readonly C_VEC3 = RANDOMS.register(new RandomRegistry('c_vec3', ConstantVec3.fromJson, (v) => new ConstantVec3(v ?? Vec3.UNIT)))
    static readonly VEC3 = RANDOMS.register(new RandomRegistry('vec3', RandomVec3.fromJson, (v) => new RandomVec3(RandomRegistry.NUMBER.generate(v ? v.x : undefined), RandomRegistry.NUMBER.generate(v ? v.y : undefined), RandomRegistry.NUMBER.generate(v ? v.z : undefined))))

    // Vec4
    static readonly C_VEC4 = RANDOMS.register(new RandomRegistry('c_vec4', ConstantVec4.fromJson, (v) => new ConstantVec4(v ?? Vec4.UNIT)))
    static readonly VEC4 = RANDOMS.register(new RandomRegistry('vec4', RandomVec4.fromJson, (v) => new RandomVec4(RandomRegistry.NUMBER.generate(v ? v.a : undefined), RandomRegistry.NUMBER.generate(v ? v.b : undefined), RandomRegistry.NUMBER.generate(v ? v.c : undefined), RandomRegistry.NUMBER.generate(v ? v.d : undefined))))
    static readonly QUATERNION = RANDOMS.register(new RandomRegistry('quaternion', RandomQuaternion.fromJson, (v) => new RandomQuaternion(RandomRegistry.NUMBER.generate(v ? v.a : undefined), RandomRegistry.C_VEC3.generate(v ? new Vec3(v.b, v.c, v.d) : undefined))))

    // Align
    static readonly C_ALIGN = RANDOMS.register(new RandomRegistry<Align>('c_align', ConstantEnum.fromJson, (v, type) => new ConstantEnum(type, v ?? 'center'), ['start', 'center', 'end', 'fill']))
    static readonly ALIGN = RANDOMS.register(new RandomRegistry<Align>('align', RandomEnum.fromJson, (v, type) => new RandomEnum(type, [{ id: v ?? 'center', weight: 1 }]), ['start', 'center', 'end', 'fill']))
    static readonly C_SQUARE_ALIGN = RANDOMS.register(new RandomRegistry<[Align, Align]>('c_square_align', RandomCompoundArray.fromJson, (v, type) => new RandomCompoundArray(type, [RandomRegistry.C_ALIGN.generate(v ? v[0] : undefined), RandomRegistry.C_ALIGN.generate(v ? v[0] : undefined)])))
    static readonly SQUARE_ALIGN = RANDOMS.register(new RandomRegistry<[Align, Align]>('square_align', RandomCompoundArray.fromJson, (v, type) => new RandomCompoundArray(type, [RandomRegistry.ALIGN.generate(v ? v[0] : undefined), RandomRegistry.ALIGN.generate(v ? v[0] : undefined)])))

    // Repetition
    static readonly C_REPETITION = RANDOMS.register(new RandomRegistry<RepetitionMode>('c_repetition', ConstantEnum.fromJson, (v, type) => new ConstantEnum(type, v ?? 'block'), ['none', 'block', 'every']))
    static readonly REPETITION = RANDOMS.register(new RandomRegistry<RepetitionMode>('repetition', RandomEnum.fromJson, (v, type) => new RandomEnum(type, [{ id: v ?? 'block', weight: 1 }]), ['none', 'block', 'every']))
    
    constructor(
        readonly id: string,
        readonly randomFromJson: (json: any, type: string) => Random<T>,
        readonly randomGenerate: (value: T | undefined, type: string) => Random<T>,
        readonly allowed?: T[]
    ) {
        super()
    }

    static fromJson(json: RandomRegistryFromJson): RandomRegistry {
        switch(json.template) {
            case 'clone':
                const random = RANDOMS.get(json.data.random)
                return new RandomRegistry(json.id, random.randomFromJson, random.randomGenerate, json.data.allowed === null ? undefined : (json.data.allowed ?? random.allowed))
            case 'c_enum':
                return new RandomRegistry(json.id, ConstantEnum.fromJson, (v, type) => new ConstantEnum(type, v ?? json.data.defaultValue), json.data.allowed)
            case 'enum':
                return new RandomRegistry(json.id, RandomEnum.fromJson, (v, type) => new RandomEnum(type, [{ id: v ?? json.data.defaultValue, weight: 1 }]), json.data.allowed)
            case 'compound_object':
                return new RandomRegistry(json.id, RandomCompoundObject.fromJson, (v, type) => new RandomCompoundObject(type, parseRecord(json.data.randoms, (random, key) => RANDOMS.get(random).generate(v ? v[key] : undefined))))
            case 'compound_array':
                return new RandomRegistry(json.id, RandomCompoundArray.fromJson, (v, type) => new RandomCompoundArray(type, json.data.randoms.map((random, i) => RANDOMS.get(random).generate(v ? v[i] : undefined))))
            default:
                throw new KeyNotRegistered((json as any).template, 'Randoms', 'template')
        }
    }

    fromJson(json: any): Random<T> {
        return this.randomFromJson(json.data, this.id)
    }

    generate(value?: T): Random<T> {
        return this.randomGenerate(value, this.id)
    }

    toJson(): {} {
        return {
            id: this.id,
            allowed: this.allowed
        }
    }
}

export type RandomTypeRegistryFromJson = { id: string, constant: string, randoms: string[] }

export class RandomTypeRegistry<T extends {} = any> extends Registry {

    static readonly BOOLEAN = RANDOM_TYPES.register(RandomTypeRegistry.simple('boolean', RandomRegistry.C_BOOLEAN, [RandomRegistry.BOOLEAN]))
    static readonly NUMBER = RANDOM_TYPES.register(RandomTypeRegistry.simple('number', RandomRegistry.C_NUMBER, [RandomRegistry.NUMBER]))
    static readonly VEC2 = RANDOM_TYPES.register(RandomTypeRegistry.simple('vec2', RandomRegistry.C_VEC2, [RandomRegistry.VEC2]))
    static readonly VEC3 = RANDOM_TYPES.register(RandomTypeRegistry.simple('vec3', RandomRegistry.C_VEC3, [RandomRegistry.VEC3]))
    static readonly VEC4 = RANDOM_TYPES.register(RandomTypeRegistry.simple('vec4', RandomRegistry.C_VEC4, [RandomRegistry.VEC4]))
    static readonly ALIGN = RANDOM_TYPES.register(RandomTypeRegistry.simple<Align>('align', RandomRegistry.C_ALIGN, [RandomRegistry.ALIGN]))
    static readonly SQUARE_ALIGN = RANDOM_TYPES.register(RandomTypeRegistry.simple<[Align, Align]>('square_align', RandomRegistry.C_SQUARE_ALIGN, [RandomRegistry.SQUARE_ALIGN]))
    static readonly REPETITION = RANDOM_TYPES.register(RandomTypeRegistry.simple<RepetitionMode>('repetition', RandomRegistry.C_REPETITION, [RandomRegistry.REPETITION]))

    /**
     * Architect must fill them
     */
    static readonly LINE3_MATERIAL = RANDOM_TYPES.register(new RandomTypeRegistry('line3_material', 'constant', {}))
    static readonly SURFACE_MATERIAL = RANDOM_TYPES.register(new RandomTypeRegistry('surface_material', 'constant', {}))
    static readonly OBJECT_MATERIAL = RANDOM_TYPES.register(new RandomTypeRegistry('object_material', 'constant', {}))

    constructor(
        readonly id: string,
        readonly constantId: string,
        readonly randoms: Record<string, RandomRegistry<T>>
    ) {
        super()
    }

    static simple<T extends {}>(id: string, constant: RandomRegistry<T>, randoms: RandomRegistry<T>[]): RandomTypeRegistry<T> {
        randoms.push(constant)
        return new RandomTypeRegistry(id, constant.id, Object.fromEntries(randoms.map((random) => [random.id, random])))
    }

    static fromJson(json: RandomTypeRegistryFromJson): RandomTypeRegistry {
        return RandomTypeRegistry.simple(json.id, RANDOMS.get(json.constant), json.randoms.map((random) => RANDOMS.get(random)))
    }

    get constant(): RandomRegistry<T> {
        return this.randoms[this.constantId]
    }

    getRandom(key: string): RandomRegistry<T> {
        const random = this.randoms[key]
        if (!random)
            throw new KeyNotRegistered(key, 'RandomType', 'randoms')

        return random
    }

    toConstant(random: Random<T>, seed: Seed): Random<T> {
        return this.constant.generate(random.seeded(seed))
    }

    randomFromJson(json: any): Random<T> {
        return this.getRandom(json.type).fromJson(json)
    }

    toJson(): {} {
        return {
            id: this.id,
            constantId: this.constantId,
            randoms: Object.keys(this.randoms)
        }
    }
}