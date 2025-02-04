import { GenerationStyle } from "../engineer/data-pack/style/style.js";
import { Vec2, Vec3, Vec4 } from "../world/vector.js";
import { Random, RandomList, RandomNumber, RandomVec2, RandomVec3, RandomVec4, Seed } from "./random.js";

export abstract class Option<T = any> {

    protected random: Random<T> | undefined
    protected ref: string | undefined

    constructor(data: Random<T> | string) {
        if(typeof data === 'string') {
            this.ref = data
        } else {
            this.random = data
        }
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
}

export class NumberOption extends Option<number> {

    static fromJson(json: any): NumberOption {
        return new NumberOption(json.random ? RandomNumber.fromJson(json.random) : json.ref)
    }
}

export class Vec2Option extends Option<Vec2> {

    static fromJson(json: any): Vec2Option {
        return new Vec2Option(json.random ? RandomVec2.fromJson(json.random) : json.ref)
    }
}

export class Vec3Option extends Option<Vec3> {

    static fromJson(json: any): Vec3Option {
        return new Vec3Option(json.random ? RandomVec3.fromJson(json.random) : json.ref)
    }
}

export class Vec4Option extends Option<Vec4> {

    static fromJson(json: any): Vec4Option {
        return new Vec4Option(json.random ? RandomVec4.fromJson(json.random) : json.ref)
    }
}

export class ObjectOption<T = any> extends Option<T | undefined> {

    static fromJson<T>(json: any, itemFromJson?: (json: any) => T, itemToJson?: (item: T) => any): ObjectOption<T> {
        return new ObjectOption(json.random ? RandomList.fromJson(json.random, itemFromJson, itemToJson) : json.ref)
    }
}