//             _____
//         ___/     \___        |  |
//      ##/  _.- _.-    \##  -  |  |                       -
//      ##\#=_  '    _=#/##  |  |  |  /---\  |      |      |   ===\  |  __
//      ##   \\#####//   ##  |  |  |  |___/  |===\  |===\  |   ___|  |==/
//      ##       |       ##  |  |  |  |      |   |  |   |  |  /   |  |
//      ##       |       ##  |  \= \= \====  |   |  |   |  |  \___/  |
//      ##\___   |   ___/
//      ##    \__|__/

import { GEO_FORMS } from "../register/geo.js"
import { RegistryChild } from "../register/register.js"
import { Direction, Rotation2, Rotation3 } from "./quaternion.js"
import { Vec2, Vec3 } from "./vector.js"

export abstract class Geo extends RegistryChild {

    abstract get form(): string

    toUniversalJson() {
        return {
            form: this.form,
            data: this.toUniversalData()
        }
    }

    writeUniversalBuffer(buffer: Buffer, offset: number): number {
        return GEO_FORMS.bufferScheme.write(buffer, offset, { key: this.form, value: this.toUniversalData() })
    }

    abstract toUniversalData(): {}
}

export abstract class Geo2 extends Geo {

    abstract get vertices(): Vec2[]

    abstract get pivot(): Vec2

    abstract move(vec: Vec2): Geo2

    abstract rotate(rotation: Rotation2): Geo2

    abstract rotateAround(angle: number): Geo2

    // abstract scale(vec: Vec2): Geo2
}

export abstract class Geo3 extends Geo {

    abstract get vertices(): Vec3[]

    abstract get pivot(): Vec3

    abstract move(vec: Vec3): Geo3

    abstract rotate(rotation: Rotation3): Geo3

    abstract rotateAround(direction: Direction): Geo3

    // abstract scale(vec: Vec3): Geo3
}