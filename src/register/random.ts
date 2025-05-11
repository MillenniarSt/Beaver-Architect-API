import { ConstantBoolean, RandomBoolean } from "../builder/random/boolean";
import { ConstantEnum, ConstantSquareEnum, RandomEnum, RandomSquareEnum, type Align, type RepetitionMode } from "../builder/random/enum";
import { ConstantNumber, RandomNumber, RandomStepNumber } from "../builder/random/number";
import type { Random, Seed } from "../builder/random/random";
import { ConstantVec2, RandomVec2 } from "../builder/random/vec/vec2";
import { ConstantVec3, RandomVec3 } from "../builder/random/vec/vec3";
import { ConstantVec4, RandomQuaternion, RandomVec4 } from "../builder/random/vec/vec4";
import { KeyNotRegistered } from "../connection/errors";
import { ensureJson } from "../util/util";
import { Vec2, Vec3, Vec4 } from "../world/vector";
import { Register, Registry, RegistryObject } from "./register";

export const RANDOM_TYPES = new Register<RandomTypeRegistry<any>>('random_types')
export const RANDOMS = new Register<RandomRegistry<any>>('randoms')

export class RandomRegistry<T extends {} = {}> extends RegistryObject<Random<T>> {

    // Boolean
    static readonly C_BOOLEAN = RANDOMS.register(new RandomRegistry('c_boolean', ConstantBoolean.fromJson, (v) => new ConstantBoolean(v)))
    static readonly BOOLEAN = RANDOMS.register(new RandomRegistry('boolean', RandomBoolean.fromJson, (v) => new RandomBoolean(v ? 1 : 0)))

    // Number
    static readonly C_NUMBER = RANDOMS.register(new RandomRegistry('c_number', ConstantNumber.fromJson, (v) => new ConstantNumber(v)))
    static readonly NUMBER = RANDOMS.register(new RandomRegistry('number', RandomNumber.fromJson, (v) => new RandomNumber(v, v)))
    static readonly NUMBER_STEP = RANDOMS.register(new RandomRegistry('number_step', RandomStepNumber.fromJson, (v) => new RandomStepNumber(v, v, 1)))

    // Vec2
    static readonly C_VEC2 = RANDOMS.register(new RandomRegistry('c_vec2', ConstantVec2.fromJson, (v) => new ConstantVec2(v)))
    static readonly VEC2 = RANDOMS.register(new RandomRegistry('vec2', RandomVec2.fromJson, (v) => new RandomVec2(RandomRegistry.NUMBER.generate(v.x), RandomRegistry.NUMBER.generate(v.y))))

    // Vec3
    static readonly C_VEC3 = RANDOMS.register(new RandomRegistry('c_vec3', ConstantVec3.fromJson, (v) => new ConstantVec3(v ?? Vec3.UNIT)))
    static readonly VEC3 = RANDOMS.register(new RandomRegistry('vec3', RandomVec3.fromJson, (v) => new RandomVec3(RandomRegistry.NUMBER.generate(v.x), RandomRegistry.NUMBER.generate(v.y), RandomRegistry.NUMBER.generate(v.z))))

    // Vec4
    static readonly C_VEC4 = RANDOMS.register(new RandomRegistry('c_vec4', ConstantVec4.fromJson, (v) => new ConstantVec4(v ?? Vec4.UNIT)))
    static readonly VEC4 = RANDOMS.register(new RandomRegistry('vec4', RandomVec4.fromJson, (v) => new RandomVec4(RandomRegistry.NUMBER.generate(v.a), RandomRegistry.NUMBER.generate(v.b), RandomRegistry.NUMBER.generate(v.c), RandomRegistry.NUMBER.generate(v.d))))
    static readonly QUATERNION = RANDOMS.register(new RandomRegistry('quaternion', RandomQuaternion.fromJson, (v) => new RandomQuaternion(RandomRegistry.NUMBER.generate(v.a), RandomRegistry.C_VEC3.generate(new Vec3(v.b, v.c, v.d)))))

    // Enum
    static readonly C_ENUM = RANDOMS.register(new RandomRegistry('c_enum', ConstantEnum.fromJson, (v) => new ConstantEnum(v)))
    static readonly ENUM = RANDOMS.register(new RandomRegistry('enum', RandomEnum.fromJson, (v) => new RandomEnum([{ id: v, weight: 1 }])))
    static readonly C_SQUARE_ENUM = RANDOMS.register(new RandomRegistry('c_square_enum', ConstantSquareEnum.fromJson, (v) => new ConstantSquareEnum(v)))
    static readonly SQUARE_ENUM = RANDOMS.register(new RandomRegistry('square_enum', RandomSquareEnum.fromJson, (v) => new RandomSquareEnum([{ id: v, weight: 1 }])))

    constructor(
        readonly id: string,
        readonly objectFromJson: (json: any) => Random<T>,
        readonly generate: (value: T) => Random<T>
    ) {
        super()
    }

    toJson(): {} {
        return {
            id: this.id
        }
    }
}

export type RandomTypeRegistryFromJson = { id: string, constant: string, randoms: string[], defaultValue: any, allowed: any[] }

export class RandomTypeRegistry<T extends {} = any> extends Registry {

    static readonly BOOLEAN = RANDOM_TYPES.register(new RandomTypeRegistry('boolean', RandomRegistry.C_BOOLEAN, [RandomRegistry.BOOLEAN], false))
    static readonly NUMBER = RANDOM_TYPES.register(new RandomTypeRegistry('number', RandomRegistry.C_NUMBER, [RandomRegistry.NUMBER], 1))
    static readonly VEC2 = RANDOM_TYPES.register(new RandomTypeRegistry('vec2', RandomRegistry.C_VEC2, [RandomRegistry.VEC2], Vec2.UNIT))
    static readonly VEC3 = RANDOM_TYPES.register(new RandomTypeRegistry('vec3', RandomRegistry.C_VEC3, [RandomRegistry.VEC3], Vec3.UNIT))
    static readonly VEC4 = RANDOM_TYPES.register(new RandomTypeRegistry('vec4', RandomRegistry.C_VEC4, [RandomRegistry.VEC4], Vec4.UNIT))
    static readonly ALIGN = RANDOM_TYPES.register(new RandomTypeRegistry<Align>('align', RandomRegistry.C_ENUM, [RandomRegistry.ENUM], 'center', ['start', 'center', 'end', 'fill']))
    static readonly SQUARE_ALIGN = RANDOM_TYPES.register(new RandomTypeRegistry<[Align, Align]>('square_align', RandomRegistry.C_SQUARE_ENUM, [RandomRegistry.SQUARE_ENUM], ['center', 'center']))
    static readonly REPETITION = RANDOM_TYPES.register(new RandomTypeRegistry<RepetitionMode>('repetition', RandomRegistry.C_ENUM, [RandomRegistry.ENUM], 'block'))

    readonly constantId: string
    readonly randoms: Record<string, RandomRegistry<T>>

    constructor(
        readonly id: string,
        constant: RandomRegistry<T>,
        randoms: RandomRegistry<T>[],
        public defaultValue: T,
        readonly allowed?: T[]
    ) {
        super()
        this.constantId = constant.id
        randoms.push(constant)
        this.randoms = Object.fromEntries(randoms.map((random) => [random.id, random]))
    }

    static fromJson(json: RandomTypeRegistryFromJson): RandomTypeRegistry {
        return new RandomTypeRegistry(json.id, RANDOMS.get(json.constant), json.randoms.map((random) => RANDOMS.get(random)), json.defaultValue, json.allowed)
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
            randoms: Object.keys(this.randoms),
            allowed: this.allowed?.map((allowed) => ensureJson(allowed))
        }
    }
}