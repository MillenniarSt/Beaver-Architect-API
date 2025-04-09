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
import type { Geo3 } from "../../world/geo";
import { Builder } from "../builder";
import { Option } from "../option";

export class ComponentBuilder<G extends Geo3 = Geo3> extends Builder<G, {
    ref: Option<string>
} & Record<string, Option>> {

    static readonly type = 'component'

    constructor(
        ref: Option<string>
    ) {
        super({
            ref: ref
        })
    }

    
}