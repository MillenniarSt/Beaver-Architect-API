//          _____
//      ___/     \___
//    |/  _.- _.-    \|
//   ||\\=_  '    _=//||
//   ||   \\\===///   ||
//   ||       |       ||
//   ||       |       ||
//   ||\___   |   ___/||
//         \__|__/
//
//      By Millenniar
//

import path from 'path'
import { project } from '../project.js'
import { displayName } from '../util.js'

export abstract class AbstractBuilder {

    abstract get pack(): string

    abstract get name(): string

    async init(): Promise<void> { }
}

export abstract class Builder extends AbstractBuilder {

    constructor(protected _reference: ResourceReference<Builder>) {
        super()
    }

    get pack(): string {
        return this.reference.pack
    }

    get name(): string {
        return this.reference.name
    }

    get reference(): ResourceReference<Builder> {
        return this._reference
    }

    set setReference(reference: ResourceReference<Builder>) {
        this._reference = reference
    }

    save() {
        project.write(this.reference.path, this.toJson())
    }

    abstract toJson(): {}
}

export type ReferenceData = { pack?: string, location: string } | string

export abstract class ResourceReference<B extends Builder> {

    readonly pack: string
    readonly location: string

    constructor(ref: ReferenceData) {
        if(typeof ref === 'string') {
            if(ref.includes(':')) {
                const unpack = ref.split(':')
                this.pack = unpack[0]
                this.location = unpack[1]
            } else {
                this.pack = project.identifier
                this.location = ref
            }
        } else {
            this.pack = ref.pack ?? project.identifier
            this.location = ref.location
        }
    }

    abstract get folder(): string

    abstract get(): B

    get relativePack(): string | undefined {
        return this.pack === project.identifier ? undefined : this.pack
    }

    get path(): string {
        if(project.identifier === this.pack) {
            return path.join(this.folder, `${this.location}.json`)
        } else {
            return path.join('dependencies', this.pack, this.folder, `${this.location}.json`)
        }
    }

    get name(): string {
        return displayName(this.location)
    }

    equals(resource: ResourceReference<B>): boolean {
        return this.pack === resource.pack && this.location === resource.location
    }

    toJson(): string {
        if(project.identifier === this.pack) {
            return this.location
        } else {
            return `${this.pack}:${this.location}`
        }
    }

    toString(): string {
        return this.toJson()
    }
}