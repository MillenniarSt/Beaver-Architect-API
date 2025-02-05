//             _____
//         ___/     \___        |  |
//      ##/  _.- _.-    \##  -  |  |                       -
//      ##\#=_  '    _=#/##  |  |  |  /---\  |      |      |   ===\  |  __
//      ##   \\#####//   ##  |  |  |  |___/  |===\  |===\  |   ___|  |==/
//      ##       |       ##  |  |  |  |      |   |  |   |  |  /   |  |
//      ##       |       ##  |  \= \= \====  |   |  |   |  |  \___/  |
//      ##\___   |   ___/
//      ##    \__|__/

export class RelativeNumber {

    protected constructor(
        readonly defined?: number,
        readonly weight?: number,
        readonly min?: number,
        readonly max?: number,
    ) { }

    static constant(value: number): RelativeNumber {
        return new RelativeNumber(value)
    }

    static weighted(weight: number, min?: number, max?: number): RelativeNumber {
        return new RelativeNumber(undefined, weight, min, max)
    }

    static fromJson(json: any): RelativeNumber {
        return new RelativeNumber(json.defined, json.weight, json.min, json.max)
    }

    get(context: number): number {
        if (this.defined !== undefined) {
            return this.defined
        }
        if (this.weight !== undefined) {
            return Math.max(this.min ?? 0, Math.min(this.max ?? 1, context * this.weight))
        }
        throw new Error("RelativeNumber is not defined or weighted")
    }

    toJson(): any {
        return {
            defined: this.defined,
            weight: this.weight,
            min: this.min,
            max: this.max,
        }
    }
}