import { MaterialBuilder } from "../../builder/generic/material";
import { Option } from "../../builder/option";
import { ChunkGenerator, ChunkGeneratorTask, Terrain } from "../../project/terrain";
import { Rect3 } from "../../world/geo/object";
import { Vec3 } from "../../world/vector";

/**
 * Use Template Styles in [ ex. '../styles/minecraft.ts' ] for the Build
 */

export const templateTestTerrains = {

    flat: (height: number) => new Terrain(new ChunkGenerator([
        new ChunkGeneratorTask(new MaterialBuilder(Option.style('primary')))
    ]), new Vec3(16, height, 16), new Rect3(new Vec3(-512, -512, -512), new Vec3(512, 512, 512)))
}