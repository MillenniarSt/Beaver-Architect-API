import { BuilderChild, BuilderMultipleChild, BuilderSingleChild, type Builder } from "../builder/builder";
import { EmptyBuilder } from "../builder/generic/empty";
import { Option } from "../builder/option";
import { SurfaceToPrismBuilder } from "../builder/surface/to-prism";
import { parseRecord } from "../util/util";
import { GeoRegistry } from "./geo";
import { RandomTypeRegistry } from "./random";
import { Register, RegistryObject } from "./register";

export const BUILDERS = new Register<BuilderRegistry<any>>('builders')

export type BuilderTypeOption = { type: RandomTypeRegistry }
export type BuilderTypeChild = { geo: GeoRegistry, options: Record<string, BuilderTypeOption>, multiple: boolean }

export class BuilderRegistry<B extends Builder> extends RegistryObject<B> {

    static readonly EMPTY = BUILDERS.register(new BuilderRegistry('empty', GeoRegistry.ANY, {}, {}, EmptyBuilder.fromData, () => EmptyBuilder.VOID))

    static readonly GRID_RECT = BUILDERS.register(new BuilderRegistry('grid_rect', GeoRegistry.RECT2, {
        child: { geo: GeoRegistry.RECT2, options: {}, multiple: false }
    }, {
        alignment: { type: RandomTypeRegistry.SQUARE_ALIGN },
        cell: { type: RandomTypeRegistry.VEC2 },
        gap: { type: RandomTypeRegistry.VEC2 },
        padding: { type: RandomTypeRegistry.VEC4 }
    }, EmptyBuilder.fromData, () => EmptyBuilder.VOID))
    static readonly TO_PRISM = BUILDERS.register(new BuilderRegistry('to_prism', GeoRegistry.SURFACE, {
        child: { geo: GeoRegistry.PRISM, options: {}, multiple: false }
    }, {
        height: { type: RandomTypeRegistry.NUMBER }
    }, SurfaceToPrismBuilder.fromData as any, () => new SurfaceToPrismBuilder(EmptyBuilder.VOID)))

    constructor(
        readonly id: string,
        readonly geo: GeoRegistry,
        readonly children: Record<string, BuilderTypeChild>,
        readonly options: Record<string, BuilderTypeOption>,
        readonly fromData: (children: Record<string, BuilderChild>, options: Record<string, Option>) => B,
        readonly generate: () => B
    ) {
        super()
    }

    get objectFromJson(): (json: any, type: string) => B {
        return (json) => this.fromData(
            parseRecord(this.children, (child, key) => child.multiple ?
                new BuilderMultipleChild(json.children[key].map((entry: any) => { return { builder: this.fromJson(entry.builder), options: parseRecord(this.options, (option, key) => Option.fromJson(json.options[key], option.type)) } })) :
                new BuilderSingleChild(this.fromJson(json.children[key].builder), parseRecord(this.options, (option, key) => Option.fromJson(json.options[key], option.type)))
            ),
            parseRecord(this.options, (option, key) => Option.fromJson(json.options[key], option.type))
        )
    }

    toJson(): {} {
        return {
            id: this.id,
            geo: this.geo.id,
            children: parseRecord(this.children, (child) => { return { geo: child.geo.id, options: parseRecord(child.options, (option) => { return { type: option.type.id } }), multiple: child.multiple } }),
            options: parseRecord(this.options, (option) => { return { type: option.type.id } })
        }
    }
}