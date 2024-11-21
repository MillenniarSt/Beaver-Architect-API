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

import { AbstractBuilder } from "../builder.js"

export const loadedDataPacks = new Map<string, DataPack>()

export class DataPack extends AbstractBuilder {

    constructor(readonly pack: string, name: string) {
        super(name)
    }

    load(): void {
        //TODO
    }
}

export enum DataTypes {

    DATA_PACK = 'data_pack',
    WORLD = 'world',
    TERRAIN = 'terrain',
    BIOMES = 'biomes',
    STRUCTURES = 'structures',

    STYLES = 'data_pack\\styles',
    SCHEMATICS = 'data_pack\\schematics',

    ROOMS = 'structures\\rooms',
    LAYERS = 'structures\\layers'
}