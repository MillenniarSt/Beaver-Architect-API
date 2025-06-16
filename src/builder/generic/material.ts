//             _____
//         ___/     \___        |  |
//      ##/  _.- _.-    \##  -  |  |                       -
//      ##\#=_  '    _=#/##  |  |  |  /---\  |      |      |   ===\  |  __
//      ##   \\#####//   ##  |  |  |  |___/  |===\  |===\  |   ___|  |==/
//      ##       |       ##  |  |  |  |      |   |  |   |  |  /   |  |
//      ##       |       ##  |  \= \= \====  |   |  |   |  |  \___/  |
//      ##\___   |   ___/
//      ##    \__|__/

import { Seed } from "../random/random.js";
import { type Geo3 } from "../../world/geo.js";
import { Builder, BuilderResult, BuilderStructure } from "../builder.js";
import type { GenerationStyle } from "../../engineer/data-pack/style/rule.js";
import { Option } from "../option.js";
import type { JsonFormat } from "../../util/util.js";
import { GeoRegistry } from "../../register/geo.js";
import { RandomTypeRegistry } from "../../register/random.js";

export type MaterialBuilderOptions = {
    material: Option<JsonFormat & {}>
}

export class MaterialBuilder<G extends Geo3 = any> extends Builder<G, {}, MaterialBuilderOptions> {

    get type(): string {
        return 'material'
    }

    constructor(
        material: Option<JsonFormat & {}>
    ) {
        super({}, { material })
    }

    static fromJson<G extends Geo3>(json: any, geoParent: GeoRegistry): MaterialBuilder<G> {
        return new MaterialBuilder(Option.fromJson(json.material, MaterialBuilder.materialRandomTypeFromGeo(geoParent)))
    }

    getStructure(parentGeo: GeoRegistry): BuilderStructure {
        return new BuilderStructure(parentGeo, {}, { material: MaterialBuilder.materialRandomTypeFromGeo(parentGeo) })
    }

    build(context: G, style: GenerationStyle, parameters: GenerationStyle, seed: Seed): BuilderResult<G> {
        const material = this.options.material.getRandom(style, parameters)
        return new BuilderResult(
            context,
            [],
            { random: material.type, data: material.toData() }
        )
    }

    static materialRandomTypeFromGeo(geo: GeoRegistry): RandomTypeRegistry {
        if(geo.isChild(GeoRegistry.LINE3)) {
            return RandomTypeRegistry.LINE3_MATERIAL
        } else if(geo.isChild(GeoRegistry.SURFACE)) {
            return RandomTypeRegistry.SURFACE_MATERIAL
        }
        return RandomTypeRegistry.OBJECT_MATERIAL
    }

    toData(): JsonFormat {
        return {
            material: this.options.material.toJson()
        }
    }
}