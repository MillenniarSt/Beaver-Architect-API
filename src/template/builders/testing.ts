import { EmptyBuilder } from "../../builder/generic/empty.js";
import { ToFacesPrismBuilder } from "../../builder/object/prism/to-faces.js";
import { GridAxisAlignment, GridRectBuilder } from "../../builder/surface/rect.js";
import { SurfaceToPrismBuilder } from "../../builder/surface/to-prism.js";
import { MaterialReference } from "../../engineer/data-pack/style/material.js";
import { Option } from "../../util/option.js";
import { RandomList, RandomNumber, RandomVec2 } from "../../builder/random/random.js";

/**
 * Use Styles in '../styles/testing.ts' for the Build
 */

export const templateTestBuilders = {

    gridPrisms: (cell?: RandomVec2, gap?: RandomVec2, height?: RandomNumber) => new GridRectBuilder(
        new SurfaceToPrismBuilder(
            new EmptyBuilder(new RandomList([MaterialReference.ref('primary')])),
            {
                height: new Option(height ?? new RandomNumber(2, 6))
            }
        ),
        {
            cell: new Option(cell ?? RandomVec2.constant(1)),
            gap: new Option(gap ?? RandomVec2.constant(1)),
            alignment: new Option(RandomList.constant([GridAxisAlignment.START, GridAxisAlignment.START]))
        }
    ),

    borderPrism: (height?: RandomNumber) => new SurfaceToPrismBuilder(
        new ToFacesPrismBuilder({
            base: new SurfaceToPrismBuilder(new EmptyBuilder(new RandomList([MaterialReference.ref('primary')]))),
            ceil: new SurfaceToPrismBuilder(new EmptyBuilder(new RandomList([MaterialReference.ref('primary')]))),
        }),
        {
            height: new Option(height ?? RandomNumber.constant(6))
        }
    )
}