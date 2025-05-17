import { InternalServerError, KeyNotRegistered } from "../connection/errors"
import { CloseLine2, CurvedLine2, GeneralLine2, Line2 } from "../world/bi-geo/line"
import { GeneralPlane2, Plane2, Rect2 } from "../world/bi-geo/plane"
import type { Geo, Geo2, Geo3 } from "../world/geo"
import { CloseLine3, GeneralLine3, Line3 } from "../world/geo/line"
import { GeneralObject3, Object3, Prism, Rect3 } from "../world/geo/object"
import { GeneralSurface, Plane3, Surface } from "../world/geo/surface"
import { Vec2, Vec3 } from "../world/vector"
import { Register, Registry, RegistryObject } from "./register"

export const GEO_FORMS = new Register<GeoForm>('geo_forms')
export const GEOS = new Register<GeoRegistry>('geos')

export class GeoForm<G extends Geo = Geo> extends Registry {

    static readonly LINE2 = GEO_FORMS.register(new GeoForm('line2', Line2.fromUniversalJson))
    static readonly PLANE = GEO_FORMS.register(new GeoForm('plane', Plane2.fromUniversalJson))
    static readonly LINE3 = GEO_FORMS.register(new GeoForm('line3', Line3.fromUniversalJson))
    static readonly SURFACE = GEO_FORMS.register(new GeoForm('surface', Surface.fromUniversalJson))
    static readonly OBJECT = GEO_FORMS.register(new GeoForm('object', Object3.fromUniversalJson))

    constructor(
        readonly id: string,
        readonly fromJson: (json: any) => G
    ) {
        super()
    }

    toJson(): {} {
        return {
            id: this.id
        }
    }
}

export class GeoRegistry<G extends Geo = Geo> extends RegistryObject<G> {

    // Line2
    static readonly CLOSED_LINE2 = GEOS.register(new GeoRegistry('closed_line2', [], CloseLine2.fromJson, () => new CloseLine2([Vec2.ZERO, Vec2.UNIT, new Vec2(0, 1)])))
    static readonly CURVED_LINE2 = GEOS.register(new GeoRegistry('curved_line2', [], CurvedLine2.fromJson, () => new CurvedLine2([{ vec: new Vec2(0, 1), rotation: 0 }, { vec: new Vec2(1, 1), rotation: 0 }])))

    // Plane
    static readonly RECT2 = GEOS.register(new GeoRegistry('rect2', [], Rect2.fromJson, () => new Rect2(Vec2.ZERO, Vec2.UNIT)))

    // Line3
    static readonly CLOSED_LINE3 = GEOS.register(new GeoRegistry('closed_line3', [], CloseLine3.fromJson, () => new CloseLine3([Vec3.ZERO, Vec3.UNIT, new Vec3(0, 1, 0)])))

    // Surface
    static readonly PLANE3 = GEOS.register(new GeoRegistry('plane3', [], Plane3.fromJson, () => new Plane3(GeoRegistry.RECT2.generate(), 0)))

    // Object
    static readonly RECT3 = GEOS.register(new GeoRegistry('rect3', [], Rect3.fromJson, () => new Rect3(Vec3.ZERO, Vec3.UNIT)))
    static readonly PRISM = GEOS.register(new GeoRegistry('prism', [GeoRegistry.RECT3], Prism.fromJson, () => new Prism(GeoRegistry.PLANE3.generate(), 1)))

    // Form
    static readonly LINE2: GeoRegistry<Line2> = GEOS.register(new GeoRegistry('line2', [
        GeoRegistry.CLOSED_LINE2, GeoRegistry.CURVED_LINE2
    ], GeneralLine2.fromJson, () => new GeneralLine2([Vec2.ZERO, Vec2.UNIT])))
    static readonly PLANE2: GeoRegistry<Plane2> = GEOS.register(new GeoRegistry('plane2', [
        GeoRegistry.RECT2
    ], GeneralPlane2.fromJson, () => new GeneralPlane2(GeoRegistry.CLOSED_LINE2.generate())))
    static readonly LINE3: GeoRegistry<Line3> = GEOS.register(new GeoRegistry('line3', [
        GeoRegistry.CLOSED_LINE3
    ], GeneralLine3.fromJson, () => new GeneralLine3([Vec3.ZERO, Vec3.UNIT])))
    static readonly SURFACE: GeoRegistry<Surface> = GEOS.register(new GeoRegistry('surface', [
        GeoRegistry.PLANE3
    ], GeneralSurface.fromJson, () => new GeneralSurface([Vec3.ZERO, Vec3.UNIT, new Vec3(0, 1, 0)], [[0, 1, 2]])))
    static readonly OBJECT: GeoRegistry<Object3> = GEOS.register(new GeoRegistry('object3', [
        GeoRegistry.PRISM
    ], GeneralObject3.fromJson, () => new GeneralObject3([Vec3.ZERO, Vec3.UNIT, new Vec3(0, 1, 0), new Vec3(0, 1, 1)], [[0, 1, 2], [1, 2, 3], [2, 3, 0], [3, 0, 1]])))

    // Geo
    static readonly ANY_BI_GEO: GeoRegistry<Geo2> = GEOS.register(new GeoRegistry<Geo2>('any_bi_geo', [GeoRegistry.LINE2, GeoRegistry.PLANE2], null, GeoRegistry.RECT2.generate))
    static readonly ANY_GEO: GeoRegistry<Geo3> = GEOS.register(new GeoRegistry<Geo3>('any_geo', [GeoRegistry.LINE3, GeoRegistry.SURFACE, GeoRegistry.OBJECT], null, GeoRegistry.RECT3.generate))

    static readonly ANY: GeoRegistry<Geo> = GEOS.register(new GeoRegistry<Geo>('any', [GeoRegistry.ANY_BI_GEO, GeoRegistry.ANY_GEO], null, GeoRegistry.ANY_GEO.generate))

    readonly objectFromJson: (json: any) => G

    constructor(
        readonly id: string,
        readonly children: GeoRegistry[],
        geoFromJson: ((json: any) => G) | null,
        readonly generate: () => G
    ) {
        super()
        this.objectFromJson = geoFromJson ?? GeoRegistry.invalidObjectFromJson
    }

    protected static invalidObjectFromJson<G extends Geo>(): G {
        throw new InternalServerError('Can not get a Geo from an abstract GeoRegistry')
    }

    fromTypedJson(json: { data: any, type: string }): G {
        return this.fromJson(json.data, json.type)
    }

    fromJson(json: any, type: string): G {
        const geo = this.fromJsonOrNull(json, type)
        if (!geo) {
            throw new KeyNotRegistered(type, 'GeoRegistry', this.id)
        }
        return geo
    }

    fromJsonOrNull(json: any, type: string): G | null {
        if (this.id === type && this.objectFromJson) {
            return this.objectFromJson(json)
        }

        for (let i = 0; i < this.children.length; i++) {
            const geo = this.children[i].fromJsonOrNull(json, type)
            if (geo) {
                return geo as G
            }
        }

        return null
    }

    isChild(type: GeoRegistry): boolean {
        return type.isParent(this)
    }

    isParent(type: GeoRegistry): boolean {
        if (this === type) {
            return true
        }

        for (let i = 0; i < this.children.length; i++) {
            if (this.children[i].isParent(type)) {
                return true
            }
        }

        return false
    }

    toJson(): {} {
        return {
            id: this.id,
            children: this.children.map((child) => child.id)
        }
    }
}