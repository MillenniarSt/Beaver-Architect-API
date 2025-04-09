//             _____
//         ___/     \___        |  |
//      ##/  _.- _.-    \##  -  |  |                       -
//      ##\#=_  '    _=#/##  |  |  |  /---\  |      |      |   ===\  |  __
//      ##   \\#####//   ##  |  |  |  |___/  |===\  |===\  |   ___|  |==/
//      ##       |       ##  |  |  |  |      |   |  |   |  |  /   |  |
//      ##       |       ##  |  \= \= \====  |   |  |   |  |  \___/  |
//      ##\___   |   ___/
//      ##    \__|__/

import { EmptyBuilder } from "../../builder/generic/empty.js";
import { ToFacesPrismBuilder } from "../../builder/object/prism/to-faces.js";
import { Option } from "../../builder/option.js";
import { ConstantSquareEnum } from "../../builder/random/enum.js";
import { ConstantNumber, RandomNumber } from "../../builder/random/number.js";
import { ConstantVec2, type RandomVec2 } from "../../builder/random/vec/vec2.js";
import { GridAxisAlignment, GridAxisAlignmentValue, GridRectBuilder } from "../../builder/surface/rect.js";
import { SurfaceToPrismBuilder } from "../../builder/surface/to-prism.js";
import { Vec2 } from "../../world/vector.js";

/**
 * Use Styles in '../styles/testing.ts' for the Build
 */

export const templateTestBuilders = {

    gridPrisms: (cell?: RandomVec2, gap?: RandomVec2, height?: RandomNumber) => new GridRectBuilder(
        new SurfaceToPrismBuilder(
            new EmptyBuilder(new RandomList([MaterialReference.ref('primary')])),
            {
                height: Option.random(height ?? new RandomNumber(2, 6))
            }
        ),
        {
            cell: Option.random(cell ?? new ConstantVec2(Vec2.UNIT)),
            gap: Option.random(gap ?? new ConstantVec2(Vec2.UNIT)),
            alignment: Option.random(new ConstantSquareEnum<GridAxisAlignmentValue[]>([GridAxisAlignment.START, GridAxisAlignment.START]))
        }
    ),

    borderPrism: (height?: RandomNumber) => new SurfaceToPrismBuilder(
        new ToFacesPrismBuilder({
            base: new SurfaceToPrismBuilder(new EmptyBuilder(new RandomList([MaterialReference.ref('primary')]))),
            ceil: new SurfaceToPrismBuilder(new EmptyBuilder(new RandomList([MaterialReference.ref('primary')]))),
        }),
        {
            height: Option.random(height ?? new ConstantNumber(6))
        }
    )
}