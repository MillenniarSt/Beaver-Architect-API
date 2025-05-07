//             _____
//         ___/     \___        |  |
//      ##/  _.- _.-    \##  -  |  |                       -
//      ##\#=_  '    _=#/##  |  |  |  /---\  |      |      |   ===\  |  __
//      ##   \\#####//   ##  |  |  |  |___/  |===\  |===\  |   ___|  |==/
//      ##       |       ##  |  |  |  |      |   |  |   |  |  /   |  |
//      ##       |       ##  |  \= \= \====  |   |  |   |  |  \___/  |
//      ##\___   |   ___/
//      ##    \__|__/

import { CurvedLine2 } from "../../world/bi-geo/line"
import { Vec2 } from "../../world/vector"
import { ConstantRandom, Random, Seed } from "./random"

export class ConstantNumber extends ConstantRandom<number> {

    get type(): string {
        return 'c_number'
    }
    
    constructor(public value: number) {
        super()
    }

    static fromJson(json: any): ConstantNumber {
        return new ConstantNumber(json)
    }
}

export class RandomNumber extends Random<number> {

    get type(): string {
        return 'number'
    }
    
    constructor(public min: number, public max: number, public curve: CurvedLine2 = new CurvedLine2([{ vec: new Vec2(0, 1), rotation: 0 }, { vec: new Vec2(1, 1), rotation: 0 }])) {
        super()
    }

    static fromJson(json: any): RandomNumber {
        return new RandomNumber(json.min, json.max, CurvedLine2.fromJson(json.curve))
    }

    edit(data: any): void {
        this.min = data.min ?? this.min
        this.max = data.max ?? this.max
        this.curve = data.curve ? CurvedLine2.fromJson(data.curve) : this.curve
    }

    seeded(seed: Seed): number {
        return seed.next() * (this.max - this.min) + this.min
    }

    toData(): {} {
        return {
            min: this.min,
            max: this.max,
            curve: this.curve.toData()
        }
    }
}

export class RandomStepNumber extends RandomNumber {

    get type(): string {
        return 'number_step'
    }
    
    constructor(min: number, max: number, public step: number = 1, curve?: CurvedLine2) {
        super(min, max, curve)
    }

    static fromJson(json: any): RandomStepNumber {
        return new RandomStepNumber(json.min, json.max, json.step, CurvedLine2.fromJson(json.curve))
    }

    edit(data: any): void {
        super.edit(data)
        this.step = data.step ?? this.step
    }

    seeded(seed: Seed): number {
        const dif = this.max - this.min
        return (Math.floor(seed.next() * (Math.floor(dif / this.step) + (dif % this.step === 0 ? 1 : 0))) * this.step) + this.min
    }

    toData(): {} {
        return {
            min: this.min,
            max: this.max,
            step: this.step,
            curve: this.curve.toData()
        }
    }
}