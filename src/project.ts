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

export class Project {

    identifier: string

    name: string
    authors: string
    description: string
    info: string

    architect: string

    type: ProjectType
    builder: string | undefined

    /**
     * @param identifier should be no.space.with.dots
     */
    constructor(identifier: string, name: string, authors: string, description: string, info: string, architect: string, type: ProjectType) {
        this.identifier = identifier
        this.name = name
        this.authors = authors
        this.description = description
        this.info = info
        this.architect = architect
        this.type = type
        this.builder = undefined
    }
}

export enum ProjectType {

    WORLD = 'world',
    STRUCTURE = 'structure',
    TERRAIN = 'terrain',
    BIOME = 'biome',
    DATA_PACK = 'data_pack'
}