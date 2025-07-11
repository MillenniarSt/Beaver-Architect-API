//             _____
//         ___/     \___        |  |
//      ##/  _.- _.-    \##  -  |  |                       -
//      ##\#=_  '    _=#/##  |  |  |  /---\  |      |      |   ===\  |  __
//      ##   \\#####//   ##  |  |  |  |___/  |===\  |===\  |   ___|  |==/
//      ##       |       ##  |  |  |  |      |   |  |   |  |  /   |  |
//      ##       |       ##  |  \= \= \====  |   |  |   |  |  \___/  |
//      ##\___   |   ___/
//      ##    \__|__/

import { BuilderChild, BuilderMultipleChild, BuilderSingleChild, OneChildBuilder, StandardBuilder, type Builder } from "../builder/builder";
import { EmptyBuilder } from "../builder/generic/empty";
import { MaterialBuilder } from "../builder/generic/material";
import { FLEX_PRISM_STRUCTURE, FlexPrismBuilder } from "../builder/object/prism/flex";
import { STACK_PRISM_STRUCTURE, StackPrismBuilder } from "../builder/object/prism/stack";
import { TO_FACES_PRISM_STRUCTURE, ToFacesPrismBuilder } from "../builder/object/prism/to-faces";
import { TO_FACES_RECT_STRUCTURE, ToFacesRectBuilder } from "../builder/object/rect/to-faces";
import { Option } from "../builder/option";
import { GRID_RECT_STRUCTURE, GridRectBuilder } from "../builder/surface/rect";
import { PlaneToPrismBuilder } from "../builder/surface/to-prism";
import { parseRecord } from "../util/util";
import type { Geo3 } from "../world/geo";
import { GeoRegistry } from "./geo";
import type { RandomTypeRegistry } from "./random";
import { ObjectRegister, RegistryObject } from "./register";

export class BuilderRegister extends ObjectRegister<Builder, BuilderRegistry> {

    fromJson<G extends Geo3>(json: any, parentGeo: GeoRegistry<G>): Builder<G> {
        return this.get(json.type).fromJson(json.data, parentGeo)
    }
}

export const BUILDERS = new BuilderRegister('builders')

export class BuilderRegistry<B extends Builder = any> extends RegistryObject<B> {

    static readonly EMPTY = BUILDERS.register(new BuilderRegistry('empty', EmptyBuilder.fromJson, () => EmptyBuilder.VOID))

    static readonly MATERIAL = BUILDERS.register(new BuilderRegistry('material', MaterialBuilder.fromJson, (geo) => new MaterialBuilder(Option.random(MaterialBuilder.materialRandomTypeFromGeo(geo).constant.generate()))))


    static readonly GRID_RECT = BUILDERS.register(new BuilderRegistry('grid_rect', BuilderRegistry.oneChildFromJson(GRID_RECT_STRUCTURE, GridRectBuilder.fromData), () => new GridRectBuilder(EmptyBuilder.VOID)))
    static readonly PLANE_TO_PRISM = BUILDERS.register(new BuilderRegistry('plane_to_prism', BuilderRegistry.oneChildFromJson(GRID_RECT_STRUCTURE, PlaneToPrismBuilder.fromData), () => new PlaneToPrismBuilder(EmptyBuilder.VOID)))


    static readonly FLEX_PRISM = BUILDERS.register(new BuilderRegistry<FlexPrismBuilder>('flex_prism', BuilderRegistry.standardFromJson(FLEX_PRISM_STRUCTURE, FlexPrismBuilder.fromData), () => new FlexPrismBuilder(new BuilderMultipleChild([]))))
    static readonly STACK_PRISM = BUILDERS.register(new BuilderRegistry<StackPrismBuilder>('stack_prism', BuilderRegistry.standardFromJson(STACK_PRISM_STRUCTURE, StackPrismBuilder.fromData), () => new StackPrismBuilder(new BuilderMultipleChild([]))))
    static readonly TO_FACES_PRISM = BUILDERS.register(new BuilderRegistry<ToFacesPrismBuilder>('to_faces_prism', BuilderRegistry.standardFromJson(TO_FACES_PRISM_STRUCTURE, ToFacesPrismBuilder.fromData), () => new ToFacesPrismBuilder({})))
    
    static readonly TO_FACES_RECT = BUILDERS.register(new BuilderRegistry<ToFacesRectBuilder>('to_faces_rect', BuilderRegistry.standardFromJson(TO_FACES_RECT_STRUCTURE, ToFacesRectBuilder.fromData), () => new ToFacesRectBuilder({})))

    constructor(
        readonly id: string,
        readonly fromJson: (json: any, parentGeo: GeoRegistry) => B,
        readonly generate: (geo: GeoRegistry) => B
    ) {
        super()
    }

    static standardFromJson<B extends StandardBuilder>(structure: { geo: GeoRegistry<Geo3>, children: Record<string, { options: Record<string, RandomTypeRegistry>, multiple: boolean }>, options: Record<string, RandomTypeRegistry> }, fromData: (children: Record<string, BuilderChild>, options: Record<string, Option>) => B): (json: any) => B {
        return (json) => fromData(
            parseRecord(structure.children, (child, key) => child.multiple ?
                new BuilderMultipleChild(json.children[key].map((entry: any) => { return { builder: BUILDERS.fromJson(entry.builder, structure.geo), options: parseRecord(structure.children[key].options, (type, key) => Option.fromJson(json.options[key], type)) } })) :
                new BuilderSingleChild(BUILDERS.fromJson(json.children[key].builder, structure.geo), parseRecord(structure.children[key].options, (type, key) => Option.fromJson(json.options[key], type)))
            ),
            parseRecord(structure.options, (type, key) => Option.fromJson(json.options[key], type))
        )
    }

    static oneChildFromJson<B extends OneChildBuilder>(structure: { geo: GeoRegistry<Geo3>, options: Record<string, RandomTypeRegistry> }, fromData: (child: Builder<any>, options: Record<string, Option>) => B): (json: any) => B {
        return (json) => fromData(
            BUILDERS.fromJson(json.child.builder, structure.geo),
            parseRecord(structure.options, (type, key) => Option.fromJson(json.options[key], type))
        )
    }

    toJson(): {} {
        return {
            id: this.id
        }
    }
}