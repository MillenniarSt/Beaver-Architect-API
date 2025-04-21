//             _____
//         ___/     \___        |  |
//      ##/  _.- _.-    \##  -  |  |                       -
//      ##\#=_  '    _=#/##  |  |  |  /---\  |      |      |   ===\  |  __
//      ##   \\#####//   ##  |  |  |  |___/  |===\  |===\  |   ___|  |==/
//      ##       |       ##  |  |  |  |      |   |  |   |  |  /   |  |
//      ##       |       ##  |  \= \= \====  |   |  |   |  |  \___/  |
//      ##\___   |   ___/
//      ##    \__|__/

import path from 'path'
import { ClientDirector, Director } from '../connection/director.js'
import { SaveDirective } from '../connection/directives/save.js'
import { idToLabel } from '../util/form.js'
import { getProject } from '../instance.js'
import type { StyleDependency, WithDependency } from './data-pack/style/dependency.js'
import { InternalServerError } from '../connection/errors.js'
import { AbstractUpdateDirective, ListUpdate, Update, type ListUpdateObject } from '../connection/directives/update.js'

export abstract class Engineer<Resource extends Engineer<Resource> = any, U = {}> implements WithDependency {

    constructor(
        readonly reference: ResourceReference<Resource>
    ) { }

    get pack(): string {
        return this.reference.pack
    }

    get name(): string {
        return this.reference.name
    }

    save() {
        getProject(this.reference.pack).write(this.reference.path, this.toJson())
    }

    async init(): Promise<void> { }

    abstract toJson(): {}

    saveDirector(director: Director) {
        director.addDirective(new SaveDirective([this.reference]))
    }

    protected abstract get updatePath(): string

    protected abstract get updateInstance(): Update<U>

    update(director: Director, update: U): void {
        director.addDirective(EngineerDirective.update(this.updatePath, this.reference, this.updateInstance, update))
    }

    delete(director: Director): void {
        this.reference.getMap().delete(this.reference.location)
        getProject(this.reference.pack).removeAndClean(this.reference.relativePath, this.reference.folder)
        director.addDirective(EngineerDirective.delete(this.updatePath, this.reference, this.updateInstance))
    }

    abstract getStyleDependency(): StyleDependency
}

export type ReferenceData = { pack?: string, location: string } | string

export abstract class ResourceReference<E extends Engineer = Engineer> {

    readonly pack: string
    readonly location: string

    constructor(ref: ReferenceData) {
        if (typeof ref === 'string') {
            if (ref.includes(':')) {
                const unpack = ref.split(':')
                this.pack = unpack[0]
                this.location = unpack[1]
            } else {
                this.pack = getProject().identifier
                this.location = ref
            }
        } else {
            this.pack = ref.pack ?? getProject().identifier
            this.location = ref.location
        }
    }

    abstract get folder(): string

    abstract getMap(): Map<string, E>

    exists(): boolean {
        return this.getMap().has(this.location)
    }

    get(): E {
        const builder = this.getMap().get(this.location)
        if (builder) {
            return builder
        } else {
            throw new ResourceNotExists(this)
        }
    }

    get relativePack(): string | undefined {
        return this.pack === getProject().identifier ? undefined : this.pack
    }

    get path(): string {
        if (getProject().identifier === this.pack) {
            return path.join(this.relativePath)
        } else {
            return path.join('dependencies', this.pack, this.relativePath)
        }
    }

    get relativePath(): string {
        return path.join(this.folder, `${this.location}.json`)
    }

    get name(): string {
        return idToLabel(this.location)
    }

    getEditorPath(extension: string) {
        if (getProject().identifier === this.pack) {
            return path.join(this.folder, `${this.location}.${extension}.json`)
        } else {
            return path.join('dependencies', this.pack, this.folder, `${this.location}.${extension}.json`)
        }
    }

    equals(resource: ResourceReference<E>): boolean {
        return this.pack === resource.pack && this.location === resource.location
    }

    toJson(): string {
        return this.toString()
    }

    toString(): string {
        return `${this.pack}:${this.location}`
    }
}

export class ResourceNotExists extends InternalServerError {

    constructor(readonly resource: ResourceReference) {
        super(`Can not get resource '${resource.toString()}': it does not exist`)
    }
}

export class EngineerDirective<T> extends AbstractUpdateDirective<ListUpdateObject<T>[]> {

    constructor(
        path: string,
        update: Update<T>,
        protected data: ListUpdateObject<T>[] | undefined
    ) {
        super(path, new ListUpdate(update))
    }

    static update<T>(path: string, ref: ResourceReference<any>, update: Update<T>, data?: T): EngineerDirective<T> {
        return new EngineerDirective(path, update, [{ id: ref.toString(), data: data }])
    }

    static push<T>(path: string, ref: ResourceReference<any>, update: Update<T>): EngineerDirective<T> {
        return new EngineerDirective(path, update, [{ id: ref.toString(), mode: 'push' }])
    }

    static delete<T>(path: string, ref: ResourceReference<any>, update: Update<T>): EngineerDirective<T> {
        return new EngineerDirective(path, update, [{ id: ref.toString(), mode: 'delete' }])
    }

    async override(directive: EngineerDirective<T>): Promise<void> {
        this.data = await this.update.update(this.data, directive.data)
    }
}