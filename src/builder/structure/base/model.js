//          _____
//      ___/     \___
//    |/  _.- _.-    \|
//   ||\\=_  '    _=//||
//   ||   \\\===///   ||
//   ||       |       ||
//   ||       |       ||
//    |\___   |   ___/|
//         \__|__/
//
//      By Millenniar
//

const fs = require("fs");
const path = require("path");
const { Rotation3D, Pos3D } = require("../../../world/world3D");

class Model {

    // On Config
    // Map {
    //   shematic-id: single   - "shematic-location"
    //                multiple - ["shematic-location-1", "shematic-location-2"]
    // }
    // On Object
    // Map {
    //   shematic-id: [shematic-1, shematic-2]
    // }
    schematics;
    
    // On Config
    // List of parts or a part
    // On Object
    // List of parts
    parts;

    constructor(dir, json) {
        this.schematics = {};
        json.schematics.forEach((value, key) => {
            this.schematics.set(key, value instanceof List ? 
                value.map((schematic) => JSON.parse(fs.readFileSync(path.join(dir, schematic)))) : 
                [JSON.parse(fs.readFileSync(path.join(dir, value)))]
            );
        });
        this.parts = json.parts instanceof List ? json.parts.map((part) => new ModelPart(part)) : [new ModelPart(json.parts)];
    }
}

class ModelPart {

    // - [x, y, z]
    // - {top: n, right: n, bottom: n, left: n}
    pos;

    // On Config
    // - {x: n, y: n, z: n}
    // On Object
    // Rotation3D
    rotation;

    // string of the shematic-id from the model
    schematic;

    constructor(json) {
        this.pos = Pos3D.fromJson(json.pos);
        this.rotation = new Rotation3D(json.rotation.x ?? 0, json.rotation.y ?? 0, json.rotation.z ?? 0);
        this.schematic = json.schematic;
    }
}

module.exports = { Model, ModelPart };