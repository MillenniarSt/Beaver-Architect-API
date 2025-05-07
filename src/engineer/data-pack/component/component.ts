//             _____
//         ___/     \___        |  |
//      ##/  _.- _.-    \##  -  |  |                       -
//      ##\#=_  '    _=#/##  |  |  |  /---\  |      |      |   ===\  |  __
//      ##   \\#####//   ##  |  |  |  |___/  |===\  |===\  |   ___|  |==/
//      ##       |       ##  |  |  |  |      |   |  |   |  |  /   |  |
//      ##       |       ##  |  \= \= \====  |   |  |   |  |  \___/  |
//      ##\___   |   ___/
//      ##    \__|__/

import { Builder } from "../../../builder/builder"
import { EmptyBuilder } from "../../../builder/generic/empty"
import { ListUpdate, ObjectUpdate, VarUpdate, type ListUpdateObject, type Update } from "../../../connection/directives/update"
import type { ClientDirector, Director } from "../../../connection/director"
import { IdAlreadyExists, IdNotExists } from "../../../connection/errors"
import { getProject } from "../../../instance"
import { BUILDERS } from "../../../register/builder"
import { GEOS, type GeoRegistry } from "../../../register/geo"
import { RANDOM_TYPES } from "../../../register/random"
import { Engineer, EngineerDirective, ResourceReference } from "../../engineer"
import { StyleDependency } from "../style/dependency"
import { AbstractStyleRule, DefinedStyleRule, StyleRule, StyleRules } from "../style/rule"
import type { ComponentRuleChanges } from "./messages"

export type ComponentUpdate = {
    rules?: ListUpdateObject<{
        type?: string,
        random?: any,
        fixed?: boolean
    }>[]
}

export const componentUpdate = new ObjectUpdate<ComponentUpdate>({
    rules: new ListUpdate(new VarUpdate())
})

export class ComponentReference extends ResourceReference<Component> {

    get folder(): string {
        return 'data_pack\\components'
    }

    getMap(): Map<string, Component> {
        return getProject(this.pack).dataPack.components
    }
}

export class Component extends Engineer<Component, ComponentUpdate> {

    constructor(
        ref: ResourceReference<Component>,
        protected _baseGeo: GeoRegistry,
        readonly builder: Builder = EmptyBuilder.VOID,
        readonly parameters: StyleRules = new StyleRules()
    ) {
        super(ref)
    }

    get baseGeo(): GeoRegistry {
        return this._baseGeo
    }

    protected get updatePath(): string {
        return 'data-pack/component/update'
    }

    protected get updateInstance(): Update<ComponentUpdate> {
        return componentUpdate
    }

    getStyleDependency(): StyleDependency {
        return this.parameters.getStyleDependency()
    }

    static create(director: ClientDirector, component: Component): void {
        getProject(component.reference.pack).dataPack.components.set(component.reference.location, component)
        component.save()
        director.addDirective(EngineerDirective.push(component.updatePath, component.reference, component.updateInstance))
    }

    static loadFromRef(ref: ResourceReference<Component>): Component {
        const data = getProject(ref.pack).read(ref.path)
        return new Component(ref,
            GEOS.get(data.baseGeo),
            BUILDERS.get(data.builder.type).fromJson(data.builder),
            StyleRules.fromJson(data.parameters)
        )
    }

    hasRule(id: string): boolean {
        return this.parameters.has(id)
    }

    getRule(id: string): StyleRule {
        const rule = this.parameters.get(id)
        if (!rule) {
            throw new IdNotExists(id, this.constructor.name, 'rules')
        }
        return rule
    }

    pushRule(director: Director, id: string, rule: StyleRule) {
        if (this.hasRule(id)) {
            throw new IdAlreadyExists(id, this.constructor.name, 'rules', this.reference.toString())
        }
        this.parameters.set(id, rule)
        this.update(director, {
            rules: [{
                id: id,
                mode: 'push',
                data: { type: rule.type.id, random: rule.random?.toJson() ?? null, fixed: rule.fixed }
            }]
        })
        this.saveDirector(director)
    }

    deleteRule(director: Director, id: string): StyleRule {
        const rule = this.getRule(id)
        this.parameters.delete(id)
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

    editRule(director: Director, id: string, changes: ComponentRuleChanges): ComponentRuleChanges {
        const rule = this.getRule(id)
        const undoChanges: ComponentRuleChanges = {
            isAbstract: changes.isAbstract ? rule.isAbstract() : undefined,
            type: changes.type ? rule.type.id : undefined,
            fixed: changes.fixed ? rule.fixed : undefined,
            random: changes.random ? rule.random?.type : undefined
        }

        let newRule: StyleRule
        if (changes.isAbstract !== undefined ? changes.isAbstract : rule.isAbstract()) {
            newRule = new AbstractStyleRule(changes.type ? RANDOM_TYPES.get(changes.type) : rule.type, changes.fixed ?? rule.fixed)
        } else if (!changes.random && (!changes.type || changes.type === rule.type.id) && rule.random) {
            newRule = new DefinedStyleRule(changes.type ? RANDOM_TYPES.get(changes.type) : rule.type, rule.random, changes.fixed ?? rule.fixed)
        } else {
            const randomType = changes.type ? RANDOM_TYPES.get(changes.type) : rule.type
            newRule = new DefinedStyleRule(randomType, changes.random ? randomType.getRandom(changes.random).generate() : randomType.constant.generate(), changes.fixed ?? rule.fixed)
        }
        this.parameters.set(id, newRule)
        this.update(director, {
            rules: [{
                id: id,
                data: {
                    type: newRule.type.id,
                    random: newRule.random?.toJson() ?? null,
                    fixed: newRule.fixed
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

    toJson(): {} {
        return {
            builder: this.builder.toJson(),
            baseGeo: this.baseGeo.id,
            parameters: this.parameters.toJson()
        }
    }
}