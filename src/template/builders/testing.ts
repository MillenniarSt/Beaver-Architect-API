//             _____
//         ___/     \___        |  |
//      ##/  _.- _.-    \##  -  |  |                       -
//      ##\#=_  '    _=#/##  |  |  |  /---\  |      |      |   ===\  |  __
//      ##   \\#####//   ##  |  |  |  |___/  |===\  |===\  |   ___|  |==/
//      ##       |       ##  |  |  |  |      |   |  |   |  |  /   |  |
//      ##       |       ##  |  \= \= \====  |   |  |   |  |  \___/  |
//      ##\___   |   ___/
//      ##    \__|__/

import { ArchitectBuilder } from "../../builder/generic/architect.js";
import { EmptyBuilder } from "../../builder/generic/empty.js";
import { RepetitionMode, StackPrismBuilder, type RepetitionModeValue } from "../../builder/object/prism/stack.js";
import { ToFacesPrismBuilder } from "../../builder/object/prism/to-faces.js";
import { Option } from "../../builder/option.js";
import { ConstantEnum, ConstantSquareEnum } from "../../builder/random/enum.js";
import { ConstantNumber, RandomNumber } from "../../builder/random/number.js";
import type { Random } from "../../builder/random/random.js";
import { ConstantVec2, type RandomVec2 } from "../../builder/random/vec/vec2.js";
import { GridAxisAlignment, type GridAxisAlignmentValue, GridRectBuilder } from "../../builder/surface/rect.js";
import { SurfaceToPrismBuilder } from "../../builder/surface/to-prism.js";
import { Vec2 } from "../../world/vector.js";

/**
 * Use Template Styles in [ ex. '../styles/minecraft.ts' ] for the Build
 */
const materialRandomType: string = 'block'
const materialBuilderType: string = 'material'

export const templateTestBuilders = {

    gridPrisms: (cell?: Random<Vec2>, gap?: Random<Vec2>, height?: Random<number>) => new GridRectBuilder(
        new SurfaceToPrismBuilder(
            new ArchitectBuilder(materialBuilderType, EmptyBuilder.VOID, { [materialRandomType]: Option.style('primary') }),
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

    flatBlock: (height?: Random<number>, childHeight?: Random<number>) => new SurfaceToPrismBuilder(
        new StackPrismBuilder(
            [{ 
                builder: new ArchitectBuilder(materialBuilderType, EmptyBuilder.VOID, { [materialRandomType]: Option.style('primary') }), 
                options: { height: Option.random(childHeight ?? new ConstantNumber(3)) } 
            }],
            {
                repeat: Option.random(new ConstantEnum<RepetitionModeValue[]>(RepetitionMode.BLOCK))
            }
        ),
        {
            height: Option.random(height ?? new ConstantNumber(20))
        }
    ),

    borderPrism: (height?: Random<number>) => new SurfaceToPrismBuilder(
        new ToFacesPrismBuilder({
            base: new SurfaceToPrismBuilder(new ArchitectBuilder(materialBuilderType, EmptyBuilder.VOID, { [materialRandomType]: Option.style('primary') })),
            ceil: new SurfaceToPrismBuilder(new ArchitectBuilder(materialBuilderType, EmptyBuilder.VOID, { [materialRandomType]: Option.style('primary') })),
        }),
        {
            height: Option.random(height ?? new ConstantNumber(6))
        }
    )
}