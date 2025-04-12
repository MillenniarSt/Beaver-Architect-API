//             _____
//         ___/     \___        |  |
//      ##/  _.- _.-    \##  -  |  |                       -
//      ##\#=_  '    _=#/##  |  |  |  /---\  |      |      |   ===\  |  __
//      ##   \\#####//   ##  |  |  |  |___/  |===\  |===\  |   ___|  |==/
//      ##       |       ##  |  |  |  |      |   |  |   |  |  /   |  |
//      ##       |       ##  |  \= \= \====  |   |  |   |  |  \___/  |
//      ##\___   |   ___/
//      ##    \__|__/

import { ConstantEnum, RandomEnum } from "../../builder/random/enum.js";
import { DefinedStyleRule, StyleRules } from "../../engineer/data-pack/style/rule.js";
import { Style, StyleReference } from "../../engineer/data-pack/style/style.js";

export const templateMinecraftStyles: Record<string, (...args: any) => Style> = {
    simple: () => new Style(new StyleReference('minecraft_style_test'), false, [], new StyleRules(new Map([
        ['primary', new DefinedStyleRule('block', new RandomEnum([
            { id: 'minecraft:stone', weight: 2 },
            { id: 'minecraft:andesite', weight: 3 },
            { id: 'minecraft:cobblestone', weight: 2 }
        ]))],
        ['secondary', new DefinedStyleRule('block', new ConstantEnum('minecraft:spruce_planks'))]
    ])))
}