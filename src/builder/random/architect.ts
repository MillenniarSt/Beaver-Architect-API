import { ConstantRandom, Random, Seed } from "./random";

export class ArchitectConstant extends ConstantRandom {

    constructor(
        readonly type: string,
        readonly value: any
    ) {
        super()
    }

    static fromJson(json: any): ArchitectConstant {
        return new ArchitectConstant(json.type, json.value)
    }

    toJson(): {} {
        return {
            type: this.type,
            value: this.value
        }
    }
}

export class ArchitectRandom extends Random {

    constructor(
        readonly type: string,
        readonly random: Random
    ) {
        super()
    }

    static fromJson(json: any): ArchitectRandom {
        return new ArchitectRandom(json.type, json.value)
    }

    toConstant(seed: Seed): ConstantRandom<any> {
        return new ArchitectConstant(this.type, this.random.seeded(seed))
    }

    seeded(seed: Seed) {
        return this.random.seeded(seed)
    }

    toJson(): {} {
        return {
            type: this.type,
            random: this.random.toNamedJson()
        }
    }
}