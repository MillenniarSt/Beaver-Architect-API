//             _____
//         ___/     \___        |  |
//      ##/  _.- _.-    \##  -  |  |                       -
//      ##\#=_  '    _=#/##  |  |  |  /---\  |      |      |   ===\  |  __
//      ##   \\#####//   ##  |  |  |  |___/  |===\  |===\  |   ___|  |==/
//      ##       |       ##  |  |  |  |      |   |  |   |  |  /   |  |
//      ##       |       ##  |  \= \= \====  |   |  |   |  |  \___/  |
//      ##\___   |   ___/
//      ##    \__|__/

import { ConstantEnum } from "../../builder/random/enum.js";
import { Style, StyleReference, StyleRule } from "../../engineer/data-pack/style/style.js";

export const templateTestStyles: Record<string, (...args: any) => Style> = {
    simple: () => new Style(new StyleReference('style-test'), false, [], new Map([
        ['primary', new StyleRule('string', new ConstantEnum('minecraft:stone'))]
    ]))
}