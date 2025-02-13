import { Builder } from "../../builder/builder.js";
import { EmptyBuilder } from "../../builder/generic/empty.js";
import { ToFacesPrismBuilder } from "../../builder/object/prism/to-faces.js";
import { GridAxisAlignment, GridRectBuilder } from "../../builder/surface/rect.js";
import { SurfaceToPrismBuilder } from "../../builder/surface/to-prism.js";
import { MaterialReference } from "../../engineer/data-pack/style/material.js";
import { NumberOption, ObjectOption, Vec2Option } from "../../util/option.js";
import { RandomList, RandomNumber, RandomVec2 } from "../../util/random.js";

/**
 * Use Styles in '../styles/testing.ts' for the Build
 */

export const templateTestBuilders = {

    gridPrisms: (cell?: RandomVec2, gap?: RandomVec2, height?: RandomNumber) => new GridRectBuilder(
        new SurfaceToPrismBuilder(
            new EmptyBuilder(new RandomList([MaterialReference.ref('primary')])),
            {
                height: new NumberOption(height ?? new RandomNumber(2, 6))
            }
        ),
        {
            cell: new Vec2Option(cell ?? RandomVec2.constant(1)),
            gap: new Vec2Option(gap ?? RandomVec2.constant(1)),
            alignment: new ObjectOption(RandomList.constant([GridAxisAlignment.START, GridAxisAlignment.START]))
        }
    ),

    borderPrism: (height?: RandomNumber) => new SurfaceToPrismBuilder(
        new ToFacesPrismBuilder({
            base: new SurfaceToPrismBuilder(new EmptyBuilder(new RandomList([MaterialReference.ref('primary')]))),
            ceil: new SurfaceToPrismBuilder(new EmptyBuilder(new RandomList([MaterialReference.ref('primary')]))),
        }),
        {
            height: new NumberOption(height ?? RandomNumber.constant(6))
        }
    )
}