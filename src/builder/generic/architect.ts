//             _____
//         ___/     \___        |  |
//      ##/  _.- _.-    \##  -  |  |                       -
//      ##\#=_  '    _=#/##  |  |  |  /---\  |      |      |   ===\  |  __
//      ##   \\#####//   ##  |  |  |  |___/  |===\  |===\  |   ___|  |==/
//      ##       |       ##  |  |  |  |      |   |  |   |  |  /   |  |
//      ##       |       ##  |  \= \= \====  |   |  |   |  |  \___/  |
//      ##\___   |   ___/
//      ##    \__|__/

import type { GenerationStyle } from "../../engineer/data-pack/style/rule";
import { recordFromJson, recordToJson } from "../../util/util";
import type { Geo3 } from "../../world/geo";
import { Builder, BuilderResult, OneChildBuilder, type OneChildBuilderChildren } from "../builder";
import { Option } from "../option";
import type { Seed } from "../random/random";

export class ArchitectBuilder<G extends Geo3 = any> extends OneChildBuilder<G, G, {}> {

    constructor(
        readonly type: string,
        child: Builder<G>,
        architectOptions: Record<string, Option>
    ) {
        super(child, {}, architectOptions)
    }

    static fromData(children: OneChildBuilderChildren, options: {}, architectOptions: Record<string, Option>): ArchitectBuilder {
        return new ArchitectBuilder(children.child.builder, architectOptions)
    }

    protected buildChildren(context: Geo3, style: GenerationStyle, parameters: GenerationStyle, seed: Seed): BuilderResult[] {
        return [this.child.build(context, style, parameters, seed)]
    }

    protected additionalJson(): Record<string, any> {
        return {
            child: this.child.toJson(),
            architectOpt: recordToJson(this.architectOptions)
        }
    }
}