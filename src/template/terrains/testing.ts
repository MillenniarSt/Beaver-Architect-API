import type { Builder } from "../../builder/builder";
import { MaterialBuilder } from "../../builder/generic/material";
import { ToFacesPrismBuilder } from "../../builder/object/prism/to-faces";
import { ToFacesRectBuilder } from "../../builder/object/rect/to-faces";
import { Option } from "../../builder/option";
import { ConstantSquareEnum } from "../../builder/random/enum";
import { ConstantNumber, RandomNumber } from "../../builder/random/number";
import type { Random } from "../../builder/random/random";
import { ConstantVec2 } from "../../builder/random/vec/vec2";
import { GridRectBuilder } from "../../builder/surface/rect";
import { PlaneToPrismBuilder } from "../../builder/surface/to-prism";
import { ChunkGenerator, ChunkGeneratorTask, Terrain } from "../../project/terrain";
import { RandomRegistry } from "../../register/random";
import { Rect3 } from "../../world/geo/object";
import { Vec2, Vec3 } from "../../world/vector";

/**
 * Use Template Styles in [ ex. '../styles/minecraft.ts' ] for the Build
 */

export const templateTestTerrains = {
    flat: (height: number) => new Terrain(new ChunkGenerator([
        new ChunkGeneratorTask(new MaterialBuilder(Option.style('primary')))
    ]), new Vec3(16, height, 16)),
    gridPrisms: (cell?: Random<Vec2>, gap?: Random<Vec2>, height?: Random<number>) => new Terrain(new ChunkGenerator([
        new ChunkGeneratorTask(new ToFacesRectBuilder({
            bottom: new PlaneToPrismBuilder(
                new MaterialBuilder(Option.style('primary')),
                {
                    height: Option.random(height ?? new ConstantNumber(3))
                }
            )
            /*bottom: new GridRectBuilder(
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
            )*/
        }))
    ]), new Vec3(16, 384, 16))
}