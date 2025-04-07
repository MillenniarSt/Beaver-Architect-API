import { Vec3 } from "../../../world/vector";
import { ConstantRandom, NamedRandom, Random, Seed } from "../random";

@NamedRandom()
export class ConstantVec3 extends ConstantRandom<Vec3> {

    readonly type = 'vec3'

    constructor(
        public value: Vec3
    ) {
        super()
    }

    static fromJson(json: any): ConstantVec3 {
        return new ConstantVec3(Vec3.fromJson(json))
    }

    toJson(): {} {
        return this.value.toJson()
    }
}

@NamedRandom()
export class RandomVec3 extends Random<Vec3> {
    
    readonly type = 'vec3'

    constructor(
        public x: Random<number>,
        public y: Random<number>,
        public z: Random<number>
    ) {
        super()
    }

    static fromJson(json: any): RandomVec3 {
        return new RandomVec3(Random.fromJson(json.x), Random.fromJson(json.y), Random.fromJson(json.z))
    }

    toConstant(seed: Seed): ConstantRandom<Vec3> {
        return new ConstantVec3(this.seeded(seed))
    }

    seeded(seed: Seed): Vec3 {
        return new Vec3(this.x.seeded(seed), this.y.seeded(seed), this.z.seeded(seed))
    }

    toJson(): {} {
        return {
            x: this.x.toNamedJson(),
            y: this.y.toNamedJson(),
            z: this.z.toNamedJson()
        }
    }
}