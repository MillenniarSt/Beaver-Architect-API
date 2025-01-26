import { Vec2 } from "../vector.js"

export class Line2 {

    constructor(readonly parts: Line2Part[]) { }

    static fromPoints(points: Vec2[]): Line2 {
        let segments: Segment2[] = []
        for(let i = 0; i < points.length -2; i++) {
            segments.push(new Segment2(points[i], points[i + 1]))
        }
        return new Line2(segments)
    }

    setPoint(index: number, vec: Vec2): Line2 {
        const parts = [...this.parts]
        if(index < parts.length) {
            parts[index].getControls()[0] = vec
        }
        if(index > 0) {
            const controls = parts[index -1].getControls()
            controls[controls.length -1] = vec
        }
        return new Line2(parts)
    } 

    containsPoint(point: Vec2): boolean {
        for(let i = 0; i < this.parts.length - 1; i++) {
            if(this.parts[i].containsPoint(point)) {
                return true
            }
        }
        return false
    }

    static fromJson(json: number[][][]): Line2 {
        return new Line2(json.map((part) => Line2Part.fromJson(part)))
    }

    toJson(): number[][][] {
        return this.parts.map((part) => part.toJson())
    }
}

export class CloseLine2 extends Line2 {

    static fromJson(json: number[][][]): CloseLine2 {
        return new CloseLine2(json.map((part) => Line2Part.fromJson(part)))
    }

    static fromPoints(points: Vec2[]): CloseLine2 {
        return new CloseLine2(points.map((point, index, points) => new Segment2(point, index === points.length -1 ? points[0] : points[index + 1])))
    }

    setPoint(index: number, vec: Vec2): CloseLine2 {
        const parts = [...this.parts]
        if(index < parts.length) {
            parts[index].getControls()[0] = vec
        }
        if(index > 0) {
            const controls = parts[index -1].getControls()
            controls[controls.length -1] = vec
        }
        if(index === parts.length) {
            parts[0].getControls()[0] = vec
        } else if(index === 0) {
            const controls = parts[parts.length -1].getControls()
            controls[controls.length -1] = vec
        }
        return new CloseLine2(parts)
    }

    getVertices(): Vec2[] {
        const vertices: Vec2[] = [];
        this.parts.forEach(part => {
            const controls = part.getControls()
            if (vertices.length === 0 || !vertices[vertices.length - 1].equals(controls[0])) {
                vertices.push(controls[0])
            }
            vertices.push(controls[controls.length -1])
        });
        return vertices;
    }

    getTriangles(): number[][] {
        const vertices = this.getVertices();
        const triangles: number[][] = [];
        for (let i = 1; i < vertices.length - 1; i++) {
            triangles.push([0, i, i + 1]);
        }
        return triangles;
    }
}

export abstract class Line2Part {

    static fromJson(json: number[][]): Line2Part {
        if (json.length === 2) {
            return new Segment2(Vec2.fromJson(json[0]), Vec2.fromJson(json[1]))
        } else {
            return new BezierCurve2(json.map((v) => Vec2.fromJson(v)))
        }
    }

    abstract containsPoint(point: Vec2): boolean

    abstract intersectsRay(point: Vec2): boolean

    abstract getControls(): Vec2[]

    isSegment(): boolean {
        return false
    }

    toJson(): number[][] {
        return this.getControls().map((vec) => vec.toJson())
    }
}

export class Segment2 extends Line2Part {

    constructor(public start: Vec2, public end: Vec2) {
        super()
    }

    containsPoint(point: Vec2): boolean {
        const d1 = this.start.distanceTo(point)
        const d2 = this.end.distanceTo(point)
        const lineLength = this.start.distanceTo(this.end)

        return Math.abs(d1 + d2 - lineLength) < 1e-6
    }

    intersectsRay(point: Vec2): boolean {
        const minY = Math.min(this.start.y, this.end.y)
        const maxY = Math.max(this.start.y, this.end.y)

        if (point.y < minY || point.y > maxY) return false

        const slope = (this.end.x - this.start.x) / (this.end.y - this.start.y)
        const xIntersect = this.start.x + slope * (point.y - this.start.y)

        return xIntersect > point.x
    }

    getControls(): Vec2[] {
        return [this.start, this.end]
    }

    isSegment(): boolean {
        return true
    }
}

export class BezierCurve2 extends Line2Part {

    constructor(readonly controls: Vec2[], private precision: number = 50) {
        super()
        if (controls.length < 2) {
            throw new Error("A Bezier curve must have at least two control points")
        }
    }

    containsPoint(point: Vec2): boolean {
        const threshold = 0.01
        const points = this.getPoints()
        for (const p of points) {
            if (p.distanceTo(point) <= threshold) {
                return true
            }
        }
        return false
    }

    intersectsRay(origin: Vec2): boolean {
        const points = this.getPoints()
        for (let i = 0; i < points.length - 1; i++) {
            const segmentStart = points[i]
            const segmentEnd = points[i + 1]
            if (this.rayIntersectsSegment(origin, segmentStart, segmentEnd)) {
                return true
            }
        }
        return false
    }

    getControls(): Vec2[] {
        return this.controls
    }

    getPoints(): Vec2[] {
        const points: Vec2[] = [];
        for (let t = 0; t <= 1; t += 1 / this.precision) {
            points.push(this.interpolate(t))
        }
        return points
    }

    private interpolate(t: number): Vec2 {
        let result = new Vec2(0, 0)
        const n = this.controls.length - 1
        for (let i = 0; i <= n; i++) {
            const binomial = this.binomialCoefficient(n, i)
            const factor = binomial * Math.pow(1 - t, n - i) * Math.pow(t, i)
            result = result.add(this.controls[i].multiplyScalar(factor))
        }
        return result
    }

    private binomialCoefficient(n: number, k: number): number {
        if (k === 0 || k === n) return 1
        let coeff = 1
        for (let i = 1; i <= k; i++) {
            coeff = (coeff * (n - i + 1)) / i
        }
        return coeff
    }

    private rayIntersectsSegment(origin: Vec2, start: Vec2, end: Vec2): boolean {
        const slope = (end.y - start.y) / (end.x - start.x)
        const yAtOriginX = start.y + slope * (origin.x - start.x)
        return origin.y <= yAtOriginX && origin.y >= Math.min(start.y, end.y) && origin.y <= Math.max(start.y, end.y)
    }
}