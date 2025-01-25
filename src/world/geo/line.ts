import { Vec3 } from "../vector.js"

export class Line3 {

    constructor(readonly parts: Line3Part[]) { }

    setPoint(index: number, vec: Vec3): Line3 {
        const parts = [...this.parts]
        if(index < parts.length) {
            parts[index].getControls()[0] = vec
        }
        if(index > 0) {
            const controls = parts[index -1].getControls()
            controls[controls.length -1] = vec
        }
        return new Line3(parts)
    } 

    containsPoint(point: Vec3): boolean {
        for(let i = 0; i < this.parts.length - 1; i++) {
            if(this.parts[i].containsPoint(point)) {
                return true
            }
        }
        return false
    }

    static fromJson(json: number[][][]): Line3 {
        return new Line3(json.map((part) => Line3Part.fromJson(part)))
    }

    toJson(): number[][][] {
        return this.parts.map((part) => part.toJson())
    }
}

export class CloseLine3 extends Line3 {

    setPoint(index: number, vec: Vec3): CloseLine3 {
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
        return new CloseLine3(parts)
    }
}

export abstract class Line3Part {

    static fromJson(json: number[][]): Line3Part {
        if (json.length === 2) {
            return new Segment3(Vec3.fromJson(json[0]), Vec3.fromJson(json[1]))
        } else {
            return new BezierCurve3(json.map((v) => Vec3.fromJson(v)))
        }
    }

    abstract containsPoint(point: Vec3): boolean

    abstract intersectsRay(origin: Vec3, direction: Vec3): boolean

    abstract getControls(): Vec3[]

    toJson(): number[][] {
        return this.getControls().map((vec) => vec.toJson())
    }
}

export class Segment3 extends Line3Part {

    constructor(readonly start: Vec3, readonly end: Vec3) {
        super()
    }

    containsPoint(point: Vec3): boolean {
        const d1 = this.start.distanceTo(point)
        const d2 = this.end.distanceTo(point)
        const lineLength = this.start.distanceTo(this.end)

        return Math.abs(d1 + d2 - lineLength) < 1e-6
    }

    intersectsRay(origin: Vec3, direction: Vec3): boolean {
        const segmentDirection = this.end.subtract(this.start)
        const segmentToOrigin = origin.subtract(this.start)

        const crossDir = segmentDirection.cross(direction)
        const crossOrigin = segmentToOrigin.cross(direction)

        if (crossDir.length() < 1e-6) {
            return false;
        }

        const t = crossOrigin.dot(crossDir) / crossDir.dot(crossDir)
        const u = segmentToOrigin.cross(segmentDirection).dot(direction) / crossDir.dot(crossDir)

        return u >= 0 && u <= 1 && t >= 0
    }

    getControls(): Vec3[] {
        return [this.start, this.end]
    }
}

export class BezierCurve3 extends Line3Part {

    constructor(readonly controls: Vec3[], private precision: number = 50) {
        super()
        if (controls.length < 2) {
            throw new Error("A Bezier curve must have at least two control points")
        }
    }

    containsPoint(point: Vec3): boolean {
        const threshold = 0.01
        const points = this.getPoints()
        for (const p of points) {
            if (p.distanceTo(point) <= threshold) {
                return true
            }
        }
        return false
    }

    intersectsRay(origin: Vec3, direction: Vec3): boolean {
        const points = this.getPoints()
        for (let i = 0; i < points.length - 1; i++) {
            const segmentStart = points[i]
            const segmentEnd = points[i + 1]
            if (this.rayIntersectsSegment(origin, direction, segmentStart, segmentEnd)) {
                return true
            }
        }
        return false
    }

    getControls(): Vec3[] {
        return this.controls
    }

    getPoints(): Vec3[] {
        const points: Vec3[] = []
        for (let t = 0; t <= 1; t += 1 / this.precision) {
            points.push(this.interpolate(t))
        }
        return points
    }

    private interpolate(t: number): Vec3 {
        let result = new Vec3(0, 0, 0)
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
        return coeff;
    }

    private rayIntersectsSegment(origin: Vec3, direction: Vec3, start: Vec3, end: Vec3): boolean {
        const segmentDirection = end.subtract(start)
        const segmentToOrigin = origin.subtract(start)

        const crossDir = segmentDirection.cross(direction)
        const crossOrigin = segmentToOrigin.cross(direction)

        if (crossDir.length() < 1e-6) {
            return false
        }

        const t = crossOrigin.dot(crossDir) / crossDir.dot(crossDir)
        const u = segmentToOrigin.cross(segmentDirection).dot(direction) / crossDir.dot(crossDir)

        return u >= 0 && u <= 1 && t >= 0
    }
}