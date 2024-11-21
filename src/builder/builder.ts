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
import { DataTypes, loadedDataPacks } from "./data-pack/data-pack.js"
import { project } from '../project.js'
import { displayName } from '../util.js'

export abstract class AbstractBuilder {

    constructor(public name: string) { }
}

export abstract class Builder extends AbstractBuilder {

    constructor(private reference: ResourceReference<Builder>) {
        super(reference.name)
    }

    get getReference(): ResourceReference<Builder> {
        return this.reference
    }

    set setReference(reference: ResourceReference<Builder>) {
        this.reference = reference
    }

    save() {
        project.write(this.reference.path, this.toJson())
    }

    abstract toJson(): {}
}

export class ResourceReference<D extends Builder> {

    constructor(readonly pack: string, readonly folder: DataTypes, readonly location: string) { }

    static project<D extends Builder>(folder: DataTypes, location: string): ResourceReference<D> {
        return new ResourceReference(project.identifier, folder, location)
    }

    static fromString<D extends Builder>(string: string, folder: DataTypes): ResourceReference<D> {
        if(string.includes(':')) {
            const unpack = string.split(':')
            return new ResourceReference<D>(unpack[0], folder, unpack[1])
        } else {
            return new ResourceReference<D>(project.identifier, folder, string)
        }
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