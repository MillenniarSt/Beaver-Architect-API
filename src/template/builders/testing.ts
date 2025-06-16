//             _____
//         ___/     \___        |  |
//      ##/  _.- _.-    \##  -  |  |                       -
//      ##\#=_  '    _=#/##  |  |  |  /---\  |      |      |   ===\  |  __
//      ##   \\#####//   ##  |  |  |  |___/  |===\  |===\  |   ___|  |==/
//      ##       |       ##  |  |  |  |      |   |  |   |  |  /   |  |
//      ##       |       ##  |  \= \= \====  |   |  |   |  |  \___/  |
//      ##\___   |   ___/
//      ##    \__|__/

import { MaterialBuilder } from "../../builder/generic/material.js";
import { Option } from "../../builder/option.js";
import { ConstantSquareEnum } from "../../builder/random/enum.js";
import { RandomNumber } from "../../builder/random/number.js";
import type { Random } from "../../builder/random/random.js";
import { ConstantVec2 } from "../../builder/random/vec/vec2.js";
import { GridRectBuilder } from "../../builder/surface/rect.js";
import { PlaneToPrismBuilder } from "../../builder/surface/to-prism.js";
import { RandomRegistry } from "../../register/random.js";
import { Vec2 } from "../../world/vector.js";

/**
 * Use Template Styles in [ ex. '../styles/minecraft.ts' ] for the Build
 */

export const templateTestBuilders = {

    gridPrisms: (cell?: Random<Vec2>, gap?: Random<Vec2>, height?: Random<number>) => new GridRectBuilder(
        new PlaneToPrismBuilder(
            new MaterialBuilder(Option.style('primary')),
            {
                height: Option.random(height ?? new RandomNumber(2, 6))
            }
        ),
        {
            cell: Option.random(cell ?? new ConstantVec2(Vec2.UNIT)),
            gap: Option.random(gap ?? new ConstantVec2(Vec2.UNIT)),
            alignment: Option.random(new ConstantSquareEnum(RandomRegistry.SQUARE_ALIGN.id, ['start', 'start']))
        }
    )
}