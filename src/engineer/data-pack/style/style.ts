//             _____
//         ___/     \___        |  |
//      ##/  _.- _.-    \##  -  |  |                       -
//      ##\#=_  '    _=#/##  |  |  |  /---\  |      |      |   ===\  |  __
//      ##   \\#####//   ##  |  |  |  |___/  |===\  |===\  |   ___|  |==/
//      ##       |       ##  |  |  |  |      |   |  |   |  |  /   |  |
//      ##       |       ##  |  \= \= \====  |   |  |   |  |  \___/  |
//      ##\___   |   ___/
//      ##    \__|__/

import { ListUpdate, ObjectUpdate, Update, VarUpdate, type ListUpdateObject } from "../../../connection/directives/update.js";
import { Director } from "../../../connection/director.js";
import { Engineer, EngineerDirective, ResourceReference } from "../../engineer.js";
import { getProject } from "../../../instance.js";
import { Seed } from "../../../builder/random/random.js";
import { StyleDependency } from "./dependency.js";
import { IdAlreadyExists, IdNotExists, InternalServerError } from "../../../connection/errors.js";
import { StyleRules, GenerationStyle, StyleRule, DefinedStyleRule, AbstractStyleRule } from "./rule.js";
import type { StyleRuleChanges } from "./messages.js";
import { RANDOM_TYPES } from "../../../register/random.js";
import type { JsonFormat } from "../../../util/util.js";

export type StyleUpdate = {
    isAbstract?: boolean
    implementations?: ListUpdateObject<void>[]
    rules?: ListUpdateObject<{
        type?: string,
        random?: JsonFormat,
        fixed?: boolean,
        fromImplementations?: string[]
    }>[]
}

export const styleUpdate = new ObjectUpdate<StyleUpdate>({
    isAbstract: new VarUpdate(),
    implementations: new ListUpdate(new VarUpdate()),
    rules: new ListUpdate(new VarUpdate())
})

export class StyleReference extends ResourceReference<Style> {

    get folder(): string {
        return 'data_pack\\styles'
    }

    getMap(): Map<string, Style> {
        return getProject(this.pack).dataPack.styles
    }
}

export type StyleChanges = { isAbstract?: boolean }

export class Style extends Engineer<Style, StyleUpdate> {

    constructor(
        ref: ResourceReference<Style>,
        public isAbstract: boolean = false,
        readonly implementations: ResourceReference<Style>[] = [],
        readonly rules: StyleRules = new StyleRules()
    ) {
        super(ref)
    }

    toGenerationStyle(seed: Seed): GenerationStyle {
        if (this.rules.isAbstract())
            throw new AbstractStyleNotPermitted(this.reference)
        return this.rules.toGenerationStyle(seed)
    }

    getStyleDependency(): StyleDependency {
        return this.getAllRules().getStyleDependency()
    }

    get completeRules(): [string, StyleRule][] {
        let entries: [string, StyleRule][] = []
        this.implementations.forEach((implementation) => {
            entries.push(...implementation.get().completeRules)
        })
        entries.push(...this.rules.getAll())
        return entries
    }

    getAllRules(): StyleRules {
        return new StyleRules(new Map(this.completeRules))
    }

    containsImplementation(implementation: ResourceReference<Style>): boolean {
        if (implementation.equals(this.reference as ResourceReference<Style>)) {
            return true
        }
        for (let i = 0; i < this.implementations.length; i++) {
            if (this.implementations[i].get().containsImplementation(this.implementations[i])) {
                return true
            }
        }
        return false
    }

    implementationsOfRule(id: string, includeSelf: boolean = false): ResourceReference<Style>[] {
        let implementations: ResourceReference<Style>[] = []
        if (this.rules.has(id) && includeSelf) {
            implementations.push(this.reference as ResourceReference<Style>)
        }
        this.implementations.forEach((implementation) => implementations.push(...implementation.get().implementationsOfRule(id, true)))
        return implementations
    }

    isRuleDependency(id: string): boolean {
        return this.implementationsOfRule(id).length > 0
    }

    edit(director: Director, changes: StyleChanges): StyleChanges {
        const undoChanges: StyleChanges = {}
        if (changes.isAbstract !== undefined && changes.isAbstract !== this.isAbstract) {
            if (this.isAbstract) {
                this.rules.getAll().forEach(([id, rule]) => {
                    if (rule instanceof AbstractStyleRule) {
                        this.pushRule(director, id, rule.generateDefined())
                    }
                })
            }
            undoChanges.isAbstract = this.isAbstract
            this.isAbstract = changes.isAbstract
            this.update(director, { isAbstract: changes.isAbstract })
        }

        this.saveDirector(director)
        return undoChanges
    }

    pushImplementation(director: Director, implementation: ResourceReference<Style>) {
        if (this.containsImplementation(implementation)) {
            throw new IdAlreadyExists(implementation.toString(), this.constructor.name, 'implementations', this.reference.toString()).warn()
        } else if (implementation.get().containsImplementation(this.reference as ResourceReference<Style>)) {
            throw new InternalServerError(`Can not push implementation ${implementation}: it contains ${this.reference.toString()}`).warn()
        } else {
            if (!this.isAbstract) {
                implementation.get().completeRules.forEach(([id, rule]) => {
                    if (rule instanceof AbstractStyleRule && !this.rules.has(id)) {
                        this.pushRule(director, id, rule.generateDefined())
                    }
                })
            }
            this.implementations.push(implementation)

            this.update(director, {
                implementations: [{
                    id: implementation.toString(),
                    mode: 'push'
                }]
            })
            this.saveDirector(director)
        }
    }

    deleteImplementation(director: Director, implementation: ResourceReference<Style>) {
        const index = this.implementations.findIndex((imp) => imp.equals(implementation))
        if (index >= 0) {
            this.implementations.splice(index, 1)

            this.update(director, {
                implementations: [{
                    id: implementation.toString(),
                    mode: 'delete'
                }]
            })
            this.saveDirector(director)
        } else {
            throw new IdNotExists(implementation.toString(), this.constructor.name, 'implementations', this.reference.toString())
        }
    }

    hasRule(id: string): boolean {
        return this.rules.has(id)
    }

    getRule(id: string): StyleRule {
        const rule = this.rules.get(id)
        if (!rule) {
            throw new IdNotExists(id, this.constructor.name, 'rules')
        }
        return rule
    }

    pushRule(director: Director, id: string, rule: StyleRule) {
        if (this.hasRule(id)) {
            throw new IdAlreadyExists(id, this.constructor.name, 'rules', this.reference.toString())
        }
        this.rules.set(id, rule)
        this.update(director, {
            rules: [{
                id: id,
                mode: 'push',
                data: { type: rule.type.id, random: rule.random?.toJson() ?? null, fixed: rule.fixed, fromImplementations: this.implementationsOfRule(id).map((ref) => ref.toString()) }
            }]
        })
        this.saveDirector(director)
    }

    deleteRule(director: Director, id: string): StyleRule {
        const rule = this.getRule(id)
        if (this.isRuleDependency(id)) {
            throw new Error('Can not delete a Dependency Style Rule')
        }
        this.rules.delete(id)
        this.update(director, {
            rules: [{
                id: id,
                mode: 'delete'
            }]
        })
        this.saveDirector(director)
        return rule
    }

    renameRule(director: Director, id: string, newId: string) {
        const rule = this.getRule(id)
        if (this.hasRule(id)) {
            throw new IdAlreadyExists(id, this.constructor.name, 'rules', this.reference.toString())
        }
        this.deleteRule(director, id)
        this.pushRule(director, newId, rule)
    }

    editRule(director: Director, id: string, changes: StyleRuleChanges): StyleRuleChanges {
        const rule = this.getRule(id)
        const undoChanges: StyleRuleChanges = {
            isAbstract: changes.isAbstract ? rule.isAbstract() : undefined,
            type: changes.type ? rule.type.id : undefined,
            fixed: changes.fixed ? rule.fixed : undefined,
            random: changes.random ? rule.random?.type : undefined
        }

        let newRule: StyleRule
        if ((changes.isAbstract !== undefined ? changes.isAbstract : rule.isAbstract()) && this.isAbstract) {
            newRule = new AbstractStyleRule(changes.type ? RANDOM_TYPES.get(changes.type) : rule.type, changes.fixed ?? rule.fixed)
        } else if (!changes.random && (!changes.type || changes.type === rule.type.id) && rule.random) {
            newRule = new DefinedStyleRule(changes.type ? RANDOM_TYPES.get(changes.type) : rule.type, rule.random, changes.fixed ?? rule.fixed)
        } else {
            const randomType = changes.type ? RANDOM_TYPES.get(changes.type) : rule.type
            const value = rule.random?.seeded(new Seed()) ?? randomType.defaultValue
            newRule = new DefinedStyleRule(randomType, changes.random ? randomType.getRandom(changes.random).generate(value) : randomType.constant.generate(value), changes.fixed ?? rule.fixed)
        }
        this.rules.set(id, newRule)
        this.update(director, {
            rules: [{
                id: id,
                data: {
                    type: newRule.type.id,
                    random: newRule.random?.toJson() ?? null,
                    fixed: newRule.fixed,
                    fromImplementations: this.implementationsOfRule(id).map((ref) => ref.toJson())
                }
            }]
        })
        this.saveDirector(director)

        return undoChanges
    }

    editRuleRandom(director: Director, id: string, data: any): any {
        const rule = this.getRule(id)
        if (rule.random) {
            let oldData = rule.random.toJson()
            rule.random.edit(data)
            this.update(director, {
                rules: [{
                    id: id,
                    data: {
                        random: rule.random.toJson()
                    }
                }]
            })
            this.saveDirector(director)
            return oldData
        } else {
            throw new Error(`Can not edit random of Style Rule ${data.id}: it is an abstract`)
        }
    }

    protected get updatePath(): string {
        return 'data-pack/style/update'
    }

    protected get updateInstance(): Update<{}> {
        return styleUpdate
    }

    static create(director: Director, style: Style): void {
        getProject(style.reference.pack).dataPack.styles.set(style.reference.location, style)
        style.save()
        director.addDirective(EngineerDirective.push(style.updatePath, style.reference, style.updateInstance))
    }

    static loadFromRef(ref: ResourceReference<Style>): Style {
        const data = getProject(ref.pack).read(ref.path)
        return new Style(ref,
            data.isAbstract,
            data.implementations.map((implementation: string) => new StyleReference(implementation)),
            StyleRules.fromJson(data.rules)
        )
    }

    toJson(): {} {
        return {
            isAbstract: this.isAbstract,
            implementations: this.implementations.map((implementation) => implementation.toJson()),
            rules: this.rules.toJson()
        }
    }
}

export class AbstractStyleNotPermitted extends InternalServerError {

    constructor(readonly styleRef: ResourceReference<Style>) {
        super(`Can not use style ${styleRef.toString()} as defined: it is abstract`)
    }
}