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
import type { StyleDependency, WithDependency } from './data-pack/style/dependency.js'
import { InternalServerError } from '../connection/errors.js'

export abstract class Engineer<Resource extends Engineer<Resource> = any> implements WithDependency {

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

    saveDirector(director: ClientDirector) {
        director.addDirective(new SaveDirective([this.reference]))
    }

    abstract update(director: ClientDirector, update: {}): void

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

    protected abstract _get(): E | undefined

    get(): E {
        const builder = this._get()
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
        return this.toString()
    }

    toString(): string {
        if (getProject().identifier === this.pack) {
            return this.location
        } else {
            return `${this.pack}:${this.location}`
        }
    }
}

export class ResourceNotExists extends InternalServerError {

    constructor(readonly resource: ResourceReference) {
        super(`Can not get resource '${resource.toString()}': it does not exist`)
    }
}