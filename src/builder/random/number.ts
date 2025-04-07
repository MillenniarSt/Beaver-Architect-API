import { ConstantRandom, NamedRandom, Random, Seed } from "./random"

@NamedRandom()
export class ConstantNumber extends ConstantRandom<number> {

    readonly type = 'number'
    
    constructor(public value: number) {
        super()
    }

    static fromJson(json: any): ConstantNumber {
        return new ConstantNumber(json)
    }

    toJson(): {} {
        return this.value
    }
}

@NamedRandom()
export class RandomNumber extends Random<number> {

    readonly type = 'number'
    
    constructor(public min: number, public max: number) {
        super()
    }

    static fromJson(json: any): RandomNumber {
        return new RandomNumber(json.min, json.max)
    }

    seeded(seed: Seed): number {
        return seed.next() * (this.max - this.min) + this.min
    }

    toConstant(seed: Seed): ConstantRandom<number> {
        return new ConstantNumber(this.seeded(seed))
    }

    toJson(): {} {
        return {
            min: this.min,
            max: this.max
        }
    }
}

@NamedRandom()
export class RandomStepNumber extends RandomNumber {
    
    constructor(min: number, max: number, public step: number = 1) {
        super(min, max)
    }

    static fromJson(json: any): RandomStepNumber {
        return new RandomStepNumber(json.min, json.max, json.step)
    }

    seeded(seed: Seed): number {
        const dif = this.max - this.min
        return (Math.floor(seed.next() * (Math.floor(dif / this.step) + (dif % this.step === 0 ? 1 : 0))) * this.step) + this.min
    }

    toJson(): {} {
        return {
            min: this.min,
            max: this.max,
            step: this.step
        }
    }
}