import { ConstantRandom, Random, Seed } from "./random"

export class ConstantBoolean extends ConstantRandom<boolean> {

    get type(): string {
        return 'C_boolean'
    }
    
    constructor(public value: boolean) {
        super()
    }

    static fromJson(json: any): ConstantBoolean {
        return new ConstantBoolean(json)
    }
}

export class RandomBoolean extends Random<boolean> {

    get type(): string {
        return 'boolean'
    }
    
    constructor(public probability: number) {
        super()
    }

    static fromJson(json: any): RandomBoolean {
        return new RandomBoolean(json)
    }

    edit(data: any): void {
        this.probability = data ?? this.probability
    }

    seeded(seed: Seed): boolean {
        return seed.next() < this.probability
    }

    toData(): {} {
        return this.probability
    }
}