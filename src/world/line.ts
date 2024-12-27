//             _____
//         ___/     \___        |  |
//      ##/  _.- _.-    \##  -  |  |                       -
//      ##\#=_  '    _=#/##  |  |  |  /---\  |      |      |   ===\  |  __
//      ##   \\#####//   ##  |  |  |  |___/  |===\  |===\  |   ___|  |==/
//      ##       |       ##  |  |  |  |      |   |  |   |  |  /   |  |
//      ##       |       ##  |  \= \= \====  |   |  |   |  |  \___/  |
//      ##\___   |   ___/
//      ##    \__|__/
//

import { Pos2D } from "./world2D.js"
import { Pos3D } from "./world3D.js"

export class BasicLine<P extends Pos2D> {

    constructor(public start: P, public end: P) { }

    get length(): number {
        return this.start.distance(this.end)
    }

    to3d(y: number): BasicLine<Pos3D> {
        return new BasicLine<Pos3D>(new Pos3D(this.start.x, this.start.z, y), new Pos3D(this.end.x, this.end.z, y))
    }
}

//TODO
export class BasicCurvedLine<P extends Pos2D> extends BasicLine<P> {

    constructor(start: P, end: P) {
        super(start, end)
    }

    get length(): number {
        return 0
    }
}

export type PointsToLine<P extends Pos2D> = (start: P, end: P) => BasicLine<P>

export class Line<P extends Pos2D> {

    constructor(public lines: BasicLine<P>[]) { }

    static fromPoints<P extends Pos2D>(poss: P[], PointsToLine: PointsToLine<P> = (start, end) => new BasicLine(start, end)): Line<P> {
        let lines: BasicLine<P>[] = []
        for(let i = 0; i < poss.length -1; i++) {
            lines.push(PointsToLine(poss[i], poss[i + 1]))
        }
        return new Line<P>(lines)
    }

    get length() {
        let length = 0
        this.lines.forEach(line => {
            length += line.length
        })
        return length
    }

    get start() {
        return this.lines[0].start
    }

    get end() {
        return this.lines[this.lines.length -1].end
    }

    to3d(y: number): Line<Pos3D> {
        return new Line<Pos3D>(this.lines.map((line) => line.to3d(y)))
    }
}