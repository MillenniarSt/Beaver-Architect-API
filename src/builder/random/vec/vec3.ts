//             _____
//         ___/     \___        |  |
//      ##/  _.- _.-    \##  -  |  |                       -
//      ##\#=_  '    _=#/##  |  |  |  /---\  |      |      |   ===\  |  __
//      ##   \\#####//   ##  |  |  |  |___/  |===\  |===\  |   ___|  |==/
//      ##       |       ##  |  |  |  |      |   |  |   |  |  /   |  |
//      ##       |       ##  |  \= \= \====  |   |  |   |  |  \___/  |
//      ##\___   |   ___/
//      ##    \__|__/

import { RandomTypeRegistry } from "../../../register/random";
import { Vec3 } from "../../../world/vector";
import { ConstantRandom, Random, Seed } from "../random";

export class ConstantVec3 extends ConstantRandom<Vec3> {

    get type(): string {
        return 'c_vec3'
    }

    constructor(
        public value: Vec3
    ) {
        super()
    }

    static fromJson(json: any): ConstantVec3 {
        return new ConstantVec3(Vec3.fromJson(json))
    }

    toData(): {} {
        return this.value.toJson()
    }
}

export class RandomVec3 extends Random<Vec3> {
    
    get type(): string {
        return 'vec3'
    }

    constructor(
        public x: Random<number>,
        public y: Random<number>,
        public z: Random<number>
    ) {
        super()
    }

    static fromJson(json: any): RandomVec3 {
        return new RandomVec3(RandomTypeRegistry.NUMBER.randomFromJson(json.x), RandomTypeRegistry.NUMBER.randomFromJson(json.y), RandomTypeRegistry.NUMBER.randomFromJson(json.z))
    }

    edit(data: any): void {
        
    }

    seeded(seed: Seed): Vec3 {
        return new Vec3(this.x.seeded(seed), this.y.seeded(seed), this.z.seeded(seed))
    }

    toData(): {} {
        return {
            x: this.x.toJson(),
            y: this.y.toJson(),
            z: this.z.toJson()
        }
    }
}