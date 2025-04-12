//             _____
//         ___/     \___        |  |
//      ##/  _.- _.-    \##  -  |  |                       -
//      ##\#=_  '    _=#/##  |  |  |  /---\  |      |      |   ===\  |  __
//      ##   \\#####//   ##  |  |  |  |___/  |===\  |===\  |   ___|  |==/
//      ##       |       ##  |  |  |  |      |   |  |   |  |  /   |  |
//      ##       |       ##  |  \= \= \====  |   |  |   |  |  \___/  |
//      ##\___   |   ___/
//      ##    \__|__/

import type { Component } from "../../engineer/data-pack/component/component";
import { GenerationStyle, StyleRules } from "../../engineer/data-pack/style/rule";
import type { ResourceReference } from "../../engineer/engineer";
import type { Geo3 } from "../../world/geo";
import { Builder, BuilderResult } from "../builder";
import { Option } from "../option";
import type { Seed } from "../random/random";

export class ComponentBuilder<G extends Geo3 = Geo3> extends Builder<G, {
    ref: Option<ResourceReference<Component>>
}> {

    static readonly type = 'component'

    constructor(
        ref: Option<ResourceReference<Component>>,
        readonly style: StyleRules
    ) {
        super({
            ref: ref
        })
    }

    static fromJson(json: any): ComponentBuilder {
        return new ComponentBuilder(
            Option.fromJson(json.options.ref),
            StyleRules.fromJson(json.style)
        )
    }

    protected buildChildren(context: G, style: GenerationStyle, parameters: GenerationStyle, seed: Seed): BuilderResult[] {
        const component = this.options.ref.get(style, parameters, seed).get()
        return [component.builder.build(context, style, parameters, seed)]
    }

    protected additionalJson(): Record<string, any> {
        return {
            style: this.style.toJson()
        }
    }
}