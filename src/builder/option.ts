//             _____
//         ___/     \___        |  |
//      ##/  _.- _.-    \##  -  |  |                       -
//      ##\#=_  '    _=#/##  |  |  |  /---\  |      |      |   ===\  |  __
//      ##   \\#####//   ##  |  |  |  |___/  |===\  |===\  |   ___|  |==/
//      ##       |       ##  |  |  |  |      |   |  |   |  |  /   |  |
//      ##       |       ##  |  \= \= \====  |   |  |   |  |  \___/  |
//      ##\___   |   ___/
//      ##    \__|__/

import { IdNotExists, InternalServerError } from "../connection/errors.js";
import type { GenerationStyle } from "../engineer/data-pack/style/rule.js";
import { RandomTypeRegistry } from "../register/random.js";
import type { ToJson } from "../util/util.js";
import { Random, Seed } from "./random/random.js";

export class Option<T extends {} = {}> implements ToJson {

    protected constructor(
        protected random: Random<T> | undefined,
        protected styleRef: string | undefined,
        protected paramRef: string | undefined
    ) { }

    static random<T extends {} = {}>(random: Random<T>): Option<T> {
        return new Option(random, undefined, undefined)
    }

    static style<T extends {} = {}>(ref: string): Option<T> {
        return new Option(undefined, ref, undefined)
    }

    static param<T extends {} = {}>(ref: string): Option<T> {
        return new Option(undefined, undefined, ref)
    }

    static fromJson<T extends {} = {}>(json: any, type: RandomTypeRegistry<T>): Option<T> {
        return new Option(json.random ? type.randomFromJson(json.random) : undefined, json.styleRef, json.paramRef)
    }

    isDefined(): boolean {
        return this.random !== undefined
    }

    isParamRef(): boolean {
        return this.paramRef !== undefined
    }

    isStyleRef(): boolean {
        return this.styleRef !== undefined
    }

    setRandom(random: Random<T>) {
        this.random = random
        this.paramRef = undefined
        this.styleRef = undefined
    }

    setParamRef(paramRef: string) {
        this.paramRef = paramRef
        this.random = undefined
        this.styleRef = undefined
    }

    setStyleRef(ref: string) {
        this.styleRef = ref
        this.random = undefined
        this.paramRef = undefined
    }

    getDefined(): Random<T> | undefined {
        return this.random
    }

    getStyleRef(): string | undefined {
        return this.styleRef
    }

    getParamRef(): string | undefined {
        return this.paramRef
    }

    get(style: GenerationStyle, parameters: GenerationStyle, seed: Seed): T {
        return this.getRandom(style, parameters).seeded(seed)
    }

    getRandom(style: GenerationStyle, parameters: GenerationStyle): Random<T> {
        if(this.random) {
            return this.random
        } else if(this.styleRef) {
            const random = style.randoms[this.styleRef]
            if(!random) {
                throw new IdNotExists(this.styleRef, 'Option', 'Style')
            }
            return random
        } else if(this.paramRef) {
            const random = parameters.randoms[this.paramRef]
            if(!random) {
                throw new IdNotExists(this.paramRef, 'Option', 'Parameters')
            }
            return random
        }
        throw new InternalServerError('Option broken: all of the references are undefined')
    }

    toJson() {
        return {
            random: this.random?.toJson(),
            paramRef: this.paramRef,
            styleRef: this.styleRef
        }
    }

    toCppGetter(): string {
        if(this.random) {
            return `${this.random.toCppGetter()}`
        } else if(this.styleRef) {
            return `style[${this.styleRef}](seed)`
        } else if(this.paramRef) {
            return `style[${this.paramRef}](seed)`
        }
        throw new InternalServerError('Option broken: all of the references are undefined')
    }
}