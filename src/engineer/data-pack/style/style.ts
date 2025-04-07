//             _____
//         ___/     \___        |  |
//      ##/  _.- _.-    \##  -  |  |                       -
//      ##\#=_  '    _=#/##  |  |  |  /---\  |      |      |   ===\  |  __
//      ##   \\#####//   ##  |  |  |  |___/  |===\  |===\  |   ___|  |==/
//      ##       |       ##  |  |  |  |      |   |  |   |  |  /   |  |
//      ##       |       ##  |  \= \= \====  |   |  |   |  |  \___/  |
//      ##\___   |   ___/
//      ##    \__|__/

import { BuilderDirective, ListUpdate, ObjectUpdate, VarUpdate, type ListUpdateObject } from "../../../connection/directives/update.js";
import { ClientDirector } from "../../../connection/director.js";
import { Engineer, ResourceReference } from "../../engineer.js";
import { getProject } from "../../../instance.js";
import { Random, randomTypes } from "../../../builder/random/random.js";
import { StyleDependency } from "./dependency.js";
import { IdAlreadyExists, IdNotExists, InternalServerError } from "../../../connection/errors.js";
import { mapFromJson, mapToJson, recordToJson, type ToJson } from "../../../util/util.js";
import type { Seed } from "../../../util/random.js";

export type StyleUpdate = {
    isAbstract?: boolean
    implementations?: ListUpdateObject<{
        pack?: string,
        location: string
    }>[]
    values?: ListUpdateObject<{
        type: string,
        random: any,
        generationConstant: boolean
    }>[]
}

export const styleUpdate = new ObjectUpdate<StyleUpdate>({
    isAbstract: new VarUpdate(),
    implementations: new ListUpdate(new VarUpdate()),
    values: new ListUpdate(new VarUpdate())
})

export class StyleReference extends ResourceReference<Style> {

    get folder(): string {
        return 'data_pack\\styles'
    }

    protected _get(): Style | undefined {
        return getProject(this.pack).dataPack.styles.get(this.location)
    }
}

export type StyleChanges = { isAbstract?: boolean }
export type MaterialChanges = { id?: string }

export class Style extends Engineer<Style> {

    constructor(
        ref: ResourceReference<Style>,
        public isAbstract: boolean = false,
        readonly implementations: ResourceReference<Style>[] = [],
        readonly values: Map<string, StyleValue> = new Map()
    ) {
        super(ref)
    }

    toGenerationStyle(seed: Seed): GenerationStyle {
        return new GenerationStyle(Object.fromEntries(this.completeValues.filter(([key, value]) => !randomTypes[value.type].isPostGeneration).map(([key, item]) => {
            const random = item.getGenerationRandom(seed)
            if(!random)
                throw new RandomNotDefined(this.reference, key)
            return [key, random]
        })))
    }

    toPostGenerationStyle(): PostGenerationStyle {
        return new PostGenerationStyle(Object.fromEntries(this.completeValues.filter(([key, value]) => randomTypes[value.type].isPostGeneration).map(([key, item]) => {
            if(!item.random)
                throw new RandomNotDefined(this.reference, key)
            return [key, item]
        })))
    }

    buildDependency(): StyleDependency {
        return new StyleDependency(Object.fromEntries(this.completeValues.filter(([key, value]) => value.random === null).map(([key, value]) => [key, value.type])))
    }

    get completeValues(): [string, StyleValue][] {
        let entries: [string, StyleValue][] = []
        this.implementations.forEach((implementation) => {
            entries.push(...implementation.get().completeValues)
        })
        entries.push(...Object.entries(this.values))
        return entries
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

    implementationsOfValue(id: string, includeSelf: boolean = false): ResourceReference<Style>[] {
        let implementations: ResourceReference<Style>[] = []
        if (this.values.has(id) && includeSelf) {
            implementations.push(this.reference as ResourceReference<Style>)
        }
        this.implementations.forEach((implementation) => implementations.push(...implementation.get().implementationsOfValue(id, true)))
        return implementations
    }

    edit(director: ClientDirector, changes: StyleChanges): StyleChanges {
        const undoChanges: StyleChanges = {}
        if (changes.isAbstract !== undefined) {
            undoChanges.isAbstract = this.isAbstract
            this.isAbstract = changes.isAbstract
            this.update(director, { isAbstract: changes.isAbstract })
        }

        this.saveDirector(director)
        return undoChanges
    }

    pushImplementation(director: ClientDirector, implementation: ResourceReference<Style>) {
        if (this.containsImplementation(implementation)) {
            throw new IdAlreadyExists(implementation.toString(), this.constructor.name, 'implementations', this.reference.toString()).warn()
        } else if (implementation.get().containsImplementation(this.reference as ResourceReference<Style>)) {
            throw new InternalServerError(`Can not push implementation ${implementation}: it contains ${this.reference.toString()}`).warn()
        } else {
            implementation.get().completeValues.forEach(([id, value]) => {
                if (value.isAbstract() && !this.values.has(id)) {
                    this.pushValue(director, id, new StyleValue(value.type, randomTypes[value.type].defaultRandom(), value.generationConstant))
                }
            })
            this.implementations.push(implementation)

            this.update(director, {
                implementations: [{
                    id: implementation.toString(),
                    mode: 'push',
                    data: { pack: implementation.relativePack, location: implementation.location }
                }]
            })
            this.saveDirector(director)
        }
    }

    deleteImplementation(director: ClientDirector, implementation: ResourceReference<Style>) {
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

    getValue(id: string): StyleValue {
        const value = this.values.get(id)
        if (!value) {
            throw new IdNotExists(id, this.constructor.name, 'values')
        }
        return value
    }

    pushValue(director: ClientDirector, id: string, value: StyleValue) {
        if (this.values.has(id)) {
            throw new IdAlreadyExists(id, this.constructor.name, 'values', this.reference.toString())
        } else {
            this.values.set(id, value)
            this.update(director, {
                values: [{
                    id: id,
                    mode: 'push',
                    data: value.toJson()
                }]
            })
            this.saveDirector(director)
        }
    }

    deleteValue(director: ClientDirector, id: string): StyleValue {
        const value = this.getValue(id)
        this.values.delete(id)
        this.update(director, {
            values: [{
                id: id,
                mode: 'delete'
            }]
        })
        this.saveDirector(director)
        return value
    }

    update(director: ClientDirector, update: StyleUpdate) {
        director.addDirective(BuilderDirective.update('data-pack/styles/update', this.reference, styleUpdate, update))
    }

    static loadFromRef(ref: ResourceReference<Style>): Style {
        const data = getProject(ref.pack).read(ref.path)
        return new Style(ref,
            data.isAbstract,
            data.implementations.map((implementation: string) => new StyleReference(implementation)),
            mapFromJson(data.values, StyleValue.fromJson)
        )
    }

    toJson(): {} {
        return {
            isAbstract: this.isAbstract,
            implementations: this.implementations.map((implementation) => implementation.toJson()),
            values: mapToJson(this.values)
        }
    }
}

export class StyleValue<T = any> implements ToJson {

    constructor(
        readonly type: string,
        readonly random: Random<T> | null,
        public generationConstant: boolean
    ) { }

    static fromJson<T = any>(json: any): StyleValue<T> {
        return new StyleValue(json.type, json.random ? Random.fromJson(json.random) : null, json.generationConstant)
    }

    isAbstract(): boolean {
        return this.random === null
    }

    getGenerationRandom(seed: Seed): Random<T> | null {
        return this.generationConstant ? this.random?.toConstant(seed) ?? null : this.random
    }

    toJson() {
        return {
            type: this.type,
            random: this.random?.toNamedJson(),
            generationConstant: this.generationConstant
        }
    }
}

export class GenerationStyle {

    constructor(
        readonly randoms: Record<string, Random>
    ) { }
}

export class PostGenerationStyle implements ToJson {

    constructor(
        readonly values: Record<string, StyleValue>
    ) { }

    toJson(): {} {
        return {
            values: recordToJson(this.values)
        }
    }
}

export class RandomNotDefined extends InternalServerError {

    constructor(readonly styleRef: ResourceReference<Style>, readonly id: string) {
        super(`Can not get random from style ${styleRef.toString()} [${id}]: it is abstract`)
    }
}