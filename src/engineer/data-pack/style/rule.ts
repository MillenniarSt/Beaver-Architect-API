import { Random, type Seed } from "../../../builder/random/random"
import { RandomType } from "../../../builder/random/type"
import { InternalServerError } from "../../../connection/errors"
import { itemsOfMap, mapFromJson, mapToEntries, mapToJson, type ToJson } from "../../../util/util"
import { StyleDependency, type WithDependency } from "./dependency"

export abstract class StyleRule<T = any> implements ToJson {

    constructor(
        readonly type: string,
        readonly constant: boolean = false
    ) { }

    static fromJson<T = any>(json: any): StyleRule<T> {
        return json.random ? DefinedStyleRule.fromJson(json) : AbstractStyleRule.fromJson(json)
    }

    abstract get random(): Random<T> | null

    isAbstract(): boolean {
        return this.random === null
    }

    getGenerationRandom(seed: Seed): Random<T> | null {
        return this.constant ? this.random?.toConstant(seed) ?? null : this.random
    }

    toJson() {
        return {
            type: this.type,
            random: this.random?.toNamedJson(),
            constant: this.constant
        }
    }
}

export class DefinedStyleRule<T = any> extends StyleRule<T> {

    constructor(
        type: string,
        readonly random: Random<T>,
        constant: boolean = false
    ) {
        super(type, constant)
    }

    static fromJson<T = any>(json: any): StyleRule<T> {
        return new DefinedStyleRule(json.type, Random.fromJson(json.random), json.constant)
    }
}

export class AbstractStyleRule<T = any> extends StyleRule<T> {

    constructor(
        type: string,
        constant: boolean = false
    ) {
        super(type, constant)
    }

    get random(): null {
        return null
    }

    static fromJson<T = any>(json: any): AbstractStyleRule<T> {
        return new AbstractStyleRule(json.type, json.constant)
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

    filter(architect: boolean): StyleRules {
        return new StyleRules(new Map(mapToEntries(this.rules).filter(([key, rule]) => RandomType.get(rule.type).isArchitect === architect)))
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
        readonly randoms: Record<string, Random>
    ) { }
}

export class RandomNotDefined extends InternalServerError {

    constructor(readonly id: string) {
        super(`Can not get random from rule [${id}]: it is abstract`)
    }
}