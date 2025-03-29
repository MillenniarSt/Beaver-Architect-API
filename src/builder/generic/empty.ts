//             _____
//         ___/     \___        |  |
//      ##/  _.- _.-    \##  -  |  |                       -
//      ##\#=_  '    _=#/##  |  |  |  /---\  |      |      |   ===\  |  __
//      ##   \\#####//   ##  |  |  |  |___/  |===\  |===\  |   ___|  |==/
//      ##       |       ##  |  |  |  |      |   |  |   |  |  /   |  |
//      ##       |       ##  |  \= \= \====  |   |  |   |  |  \___/  |
//      ##\___   |   ___/
//      ##    \__|__/

import { MaterialReference } from "../../engineer/data-pack/style/material.js";
import { GenerationStyle } from "../../engineer/data-pack/style/style.js";
import { NodeTypedBuilder } from "../../engineer/editors/rete/nodes/builder.js";
import { RandomList, Seed } from "../../util/random.js";
import { type Geo3 } from "../../world/geo.js";
import { GeneralObject3 } from "../../world/geo/object.js";
import { Builder, BuilderResult } from "../builder.js";
import { JsonBuilder } from "../collective.js";

@NodeTypedBuilder({
    label: 'Empty',
    object: GeneralObject3,
    get: (getChild, getChildren, getOption, materials) => new EmptyBuilder(materials)
})
@JsonBuilder(EmptyBuilder.fromJson)
export class EmptyBuilder<G extends Geo3 = any> extends Builder<G, {}, {}> {

    constructor(materials: RandomList<MaterialReference> = new RandomList()) {
        super({}, materials)
    }

    static fromJson(json: any): EmptyBuilder {
        return new EmptyBuilder(RandomList.fromJson(json.materials, MaterialReference.fromJson))
    }

    get children(): [] {
        return []
    }

    protected buildChildren(context: any, style: GenerationStyle, seed: Seed): BuilderResult[] {
        return []
    }
}