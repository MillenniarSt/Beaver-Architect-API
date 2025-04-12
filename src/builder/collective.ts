//             _____
//         ___/     \___        |  |
//      ##/  _.- _.-    \##  -  |  |                       -
//      ##\#=_  '    _=#/##  |  |  |  /---\  |      |      |   ===\  |  __
//      ##   \\#####//   ##  |  |  |  |___/  |===\  |===\  |   ___|  |==/
//      ##       |       ##  |  |  |  |      |   |  |   |  |  /   |  |
//      ##       |       ##  |  \= \= \====  |   |  |   |  |  \___/  |
//      ##\___   |   ___/
//      ##    \__|__/

import { parseRecord, recordFromJson } from "../util/util";
import type { Builder, BuilderChild, BuilderFunction } from "./builder";
import { EmptyBuilder } from "./generic/empty";
import { FlexPrismBuilder } from "./object/prism/flex";
import { StackPrismBuilder } from "./object/prism/stack";
import { ToFacesPrismBuilder } from "./object/prism/to-faces";
import { Option } from "./option";
import { GridRectBuilder } from "./surface/rect";
import { SurfaceToPrismBuilder } from "./surface/to-prism";

const builderTypes: Record<string, BuilderType> = {}

export class BuilderType<B extends Builder = Builder> {

    constructor(
        readonly id: string,
        readonly fromJson: (json: any) => B,
        readonly generate: () => B
    ) { }

    static get(type: string): BuilderType {
        return builderTypes[type]
    }

    static register(builderType: BuilderType) {
        builderTypes[builderType.id] = builderType
    }

    static registerFunct<B extends Builder>(builderFunct: BuilderFunction<B>, generate: () => B) {
        BuilderType.register(new BuilderType(builderFunct.type, builderFunct.fromJson, generate))
    }
}

export function builderFromJson(json: any): Builder {
    return BuilderType.get(json.type).fromJson(json)
}

export function optionsFromJson(json: Record<string, any>): Record<string, Option> {
    return recordFromJson(json.options, Option.fromJson)
}

export function childrenFromJson(json: { builder: any, options: any }[]): BuilderChild<Builder>[] {
    return json.map((child) => {
        return {
            builder: builderFromJson(child.builder),
            options: optionsFromJson(child.options)
        }
    })
}

BuilderType.registerFunct(EmptyBuilder, () => EmptyBuilder.VOID)

BuilderType.registerFunct(GridRectBuilder, () => new GridRectBuilder(EmptyBuilder.VOID))
BuilderType.registerFunct(SurfaceToPrismBuilder, () => new SurfaceToPrismBuilder(EmptyBuilder.VOID))

BuilderType.registerFunct(FlexPrismBuilder, () => new FlexPrismBuilder([]))
BuilderType.registerFunct(StackPrismBuilder, () => new StackPrismBuilder([]))
BuilderType.registerFunct(ToFacesPrismBuilder, () => new ToFacesPrismBuilder({}))