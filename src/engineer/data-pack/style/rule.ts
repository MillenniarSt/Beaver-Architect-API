import type { Material } from "../../../builder/material"
import { Random, type Seed } from "../../../builder/random/random"
import { InternalServerError } from "../../../connection/errors"
import { RANDOM_TYPES, RandomTypeRegistry } from "../../../register/random"
import { itemsOfMap, mapFromJson, mapToEntries, mapToJson, type ToJson } from "../../../util/util"
import { StyleDependency, type WithDependency } from "./dependency"

export abstract class StyleRule<T extends {} = {}> implements ToJson {

    constructor(
        readonly type: RandomTypeRegistry<T>,
        public fixed: boolean = false
    ) { }

    static fromJson<T extends {} = {}>(json: any): StyleRule<T> {
        return json.random ? DefinedStyleRule.fromJson(json) : AbstractStyleRule.fromJson(json)
    }

    abstract get random(): Random<T> | null

    isAbstract(): boolean {
        return this.random === null
    }

    getGenerationRandom(seed: Seed): Random<T> | null {
        return this.fixed ? (this.random ? this.type.toConstant(this.random, seed) : null) : this.random
    }

    toJson() {
        return {
            type: this.type.id,
            random: this.random?.toJson(),
            fixed: this.fixed
        }
    }
}

export class DefinedStyleRule<T extends {} = {}> extends StyleRule<T> {

    constructor(
        type: RandomTypeRegistry<T>,
        readonly random: Random<T>,
        fixed: boolean = false
    ) {
        super(type, fixed)
    }

    static fromJson<T extends {} = {}>(json: any): StyleRule<T> {
        const type = RANDOM_TYPES.get(json.type)
        return new DefinedStyleRule(type, type.randomFromJson(json.random), json.constant)
    }
}

export class AbstractStyleRule<T extends {} = {}> extends StyleRule<T> {

    constructor(
        type: RandomTypeRegistry<T>,
        fixed: boolean = false
    ) {
        super(type, fixed)
    }

    get random(): null {
        return null
    }

    static fromJson<T extends {} = {}>(json: any): AbstractStyleRule<T> {
        return new AbstractStyleRule(RANDOM_TYPES.get(json.type), json.constant)
    }

    generateDefined(): DefinedStyleRule<T> {
        return new DefinedStyleRule(this.type, this.type.constant.generate(this.type.defaultValue), this.fixed)
    }
}

export class StyleRules implements ToJson, WithDependency {

    constructor(
        readonly rules: Map<string, StyleRule> = new Map()
    ) { }

    has(id: string): boolean {
        return this.rules.has(id)
    }

    get(id: string): StyleRule | undefined {
        return this.rules.get(id)
    }

    getAll(): [string, StyleRule][] {
        return mapToEntries(this.rules)
    }

    set(id: string, rule: StyleRule) {
        this.rules.set(id, rule)
    }

    join(rules: StyleRules) {
        rules.rules.forEach((rule, id) => this.set(id, rule))
    }

    delete(id: string): boolean {
        return this.rules.delete(id)
    }

    isAbstract(): boolean {
        const rules = itemsOfMap(this.rules)
        for(let i = 0; i < rules.length; i++) {
            if(rules[i].isAbstract())
                return true
        }
        return false
    }

    getStyleDependency(): StyleDependency {
        return new StyleDependency(Object.fromEntries(mapToEntries(this.rules).filter(([key, rule]) => rule.isAbstract()).map(([key, rule]) => [key, rule.type])))
    }

    toGenerationStyle(seed: Seed): GenerationStyle {
        return new GenerationStyle(Object.fromEntries(mapToEntries(this.rules).map(([key, rule]) => {
            const random = rule.getGenerationRandom(seed)
            if(!random)
                throw new RandomNotDefined(key)
            return [key, random]
        })))
    }

    static fromJson(json: any): StyleRules {
        return new StyleRules(mapFromJson(json.rules, StyleRule.fromJson))
    }

    toJson(): {} {
        return {
            rules: mapToJson(this.rules)
        }
    }
}

export class GenerationStyle {

    constructor(
        readonly randoms: Record<string, Random>,
        readonly materials: Record<string, Material> = {}
    ) { }
}

export class RandomNotDefined extends InternalServerError {

    constructor(readonly id: string) {
        super(`Can not get random from rule [${id}]: it is abstract`)
    }
}