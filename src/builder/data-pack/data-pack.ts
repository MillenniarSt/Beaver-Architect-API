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
import { DataStyle } from "./data.js"

export const loadedDataPacks = new Map<string, DataPack>()

export class DataPack extends AbstractBuilder {

    constructor(readonly pack: string, name: string) {
        super(name)
    }

    dataStyles = new Map<DataTypes, Map<string, DataStyle>>()

    getStructure(folder: string) {
        return [
            {
                type: 'folder',
                label: 'Schematics',
                children: [
                    {
                        type: 'schematic',
                        label: 'Schematic',
                        id: 'schematic.json'
                    }
                ]
            }
        ]
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

    SCHEMATICS = 'schematics',
    MODELS = 'models',

    GADGETS = 'gadgets',
    WINDOWS = 'windows',
    DOORS = 'doors',
    WALLS = 'walls',
    FLOORS = 'floors',
    ROOFS = 'roofs',

    ROOMS = 'rooms',
    LAYERS = 'layers'
}