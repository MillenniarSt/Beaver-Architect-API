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
import { Builder, BuilderResult, BuilderType } from "../builder";
import { builderFromJson } from "../collective";
import { Option } from "../option";
import type { Seed } from "../random/random";

export class ArchitectBuilder<G extends Geo3 = any> extends Builder<G, {}> {
    
    public get type(): BuilderType {
        return this._type;
    }

    constructor(
        private readonly _type: BuilderType,
        readonly child: Builder,
        architectOptions: Record<string, Option>
    ) {
        super({}, architectOptions)
    }

    static fromJson(json: any): ArchitectBuilder {
        return new ArchitectBuilder(json.type, builderFromJson(json.child), recordFromJson(json.architectOpt, Option.fromJson))
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