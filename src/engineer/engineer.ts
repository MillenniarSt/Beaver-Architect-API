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
import { ClientDirector } from '../connection/director.js'
import { SaveDirective } from '../connection/directives/save.js'
import { idToLabel } from '../util/form.js'
import { getProject } from '../instance.js'
import type { StyleDependency } from './data-pack/style/dependency.js'

export abstract class Engineer<Resource extends Engineer<Resource> = any> {

    protected _dependency: StyleDependency

    constructor(
        readonly reference: ResourceReference<Resource>
    ) {
        this._dependency = this.buildDependency()
    }

    get pack(): string {
        return this.reference.pack
    }

    get name(): string {
        return this.reference.name
    }

    get dependency(): StyleDependency {
        return this._dependency
    }

    save() {
        getProject(this.reference.pack).write(this.reference.path, this.toJson())
    }

    async init(): Promise<void> { }

    abstract toJson(): {}

    saveDirector(director: ClientDirector) {
        director.addDirective(new SaveDirective([this.reference]))
    }

    abstract update(director: ClientDirector, update: {}): void

    repair() {
        this._dependency = this.buildDependency()
    }

    abstract buildDependency(): StyleDependency
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

    protected abstract _get(): E | undefined

    get(): E {
        const builder = this._get()
        if (builder) {
            return builder
        } else {
            throw new Error(`Can not access to Resource '${this.toString()}', it not exists or it is not registered`)
        }
    }

    get relativePack(): string | undefined {
        return this.pack === getProject().identifier ? undefined : this.pack
    }

    get path(): string {
        if (getProject().identifier === this.pack) {
            return path.join(this.folder, `${this.location}.json`)
        } else {
            return path.join('dependencies', this.pack, this.folder, `${this.location}.json`)
        }
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
        if (getProject().identifier === this.pack) {
            return this.location
        } else {
            return `${this.pack}:${this.location}`
        }
    }

    toString(): string {
        return this.toJson()
    }
}