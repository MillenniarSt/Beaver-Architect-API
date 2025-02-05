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

export abstract class Engineer {

    constructor(protected _reference: ResourceReference<Engineer>) { }

    get pack(): string {
        return this.reference.pack
    }

    get name(): string {
        return this.reference.name
    }

    get reference(): ResourceReference<Engineer> {
        return this._reference
    }

    setReference(director: ClientDirector, reference: ResourceReference<Engineer>) {
        this._reference = reference
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
}

export type ReferenceData = { pack?: string, location: string } | string

export abstract class ResourceReference<E extends Engineer> {

    readonly pack: string
    readonly location: string

    constructor(ref: ReferenceData) {
        if(typeof ref === 'string') {
            if(ref.includes(':')) {
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
        if(builder) {
            return builder
        } else {
            throw new Error(`Can not access to Builder '${this.toString()}', it not exists or it is not registered`)
        }
    }

    get relativePack(): string | undefined {
        return this.pack === getProject().identifier ? undefined : this.pack
    }

    get path(): string {
        if(getProject().identifier === this.pack) {
            return path.join(this.folder, `${this.location}.json`)
        } else {
            return path.join('dependencies', this.pack, this.folder, `${this.location}.json`)
        }
    }

    get name(): string {
        return idToLabel(this.location)
    }

    equals(resource: ResourceReference<E>): boolean {
        return this.pack === resource.pack && this.location === resource.location
    }

    toJson(): string {
        if(getProject().identifier === this.pack) {
            return this.location
        } else {
            return `${this.pack}:${this.location}`
        }
    }

    toString(): string {
        return this.toJson()
    }
}