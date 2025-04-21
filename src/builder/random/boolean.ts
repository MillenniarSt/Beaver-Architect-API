import { ConstantRandom, NamedRandom, Random, Seed } from "./random"

@NamedRandom()
export class ConstantBoolean extends ConstantRandom<boolean> {

    readonly type = 'boolean'
    
    constructor(public value: boolean) {
        super()
    }

    static fromJson(json: any): ConstantBoolean {
        return new ConstantBoolean(json)
    }

    toJson(): {} {
        return this.value
    }
}

@NamedRandom()
export class RandomBoolean extends Random<boolean> {

    readonly type = 'boolean'
    
    constructor(public probability: number) {
        super()
    }

    static fromJson(json: any): RandomBoolean {
        return new RandomBoolean(json)
    }

    seeded(seed: Seed): boolean {
        return seed.next() < this.probability
    }

    toConstant(seed: Seed): ConstantRandom<boolean> {
        return new ConstantBoolean(this.seeded(seed))
    }

    toJson(): {} {
        return this.probability
    }
}