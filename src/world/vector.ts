//             _____
//         ___/     \___        |  |
//      ##/  _.- _.-    \##  -  |  |                       -
//      ##\#=_  '    _=#/##  |  |  |  /---\  |      |      |   ===\  |  __
//      ##   \\#####//   ##  |  |  |  |___/  |===\  |===\  |   ___|  |==/
//      ##       |       ##  |  |  |  |      |   |  |   |  |  /   |  |
//      ##       |       ##  |  \= \= \====  |   |  |   |  |  \___/  |
//      ##\___   |   ___/
//      ##    \__|__/

export class Vec2 {

    static readonly ZERO = new Vec2(0, 0)
    static readonly UNIT = new Vec2(1, 1)

    constructor(readonly x: number, readonly y: number) { }

    length(): number {
        return Math.sqrt(this.x ** 2 + this.y ** 2)
    }

    distanceTo(vec: Vec2): number {
        return Math.sqrt(Math.pow(this.x - vec.x, 2) + Math.pow(this.y - vec.y, 2))
    }

    cross(vector: Vec2): number {
        return this.x * vector.y - this.y * vector.x
    }

    add(vec: Vec2): Vec2 {
        return new Vec2(this.x + vec.x, this.y + vec.y)
    }

    subtract(vec: Vec2): Vec2 {
        return new Vec2(this.x - vec.x, this.y - vec.y)
    }

    multiplyScalar(scalar: number): Vec2 {
        return new Vec2(this.x * scalar, this.y * scalar)
    }

    dot(vec: Vec2): number {
        return this.x * vec.x + this.y * vec.y
    }

    normalize(): Vec2 {
        const length = Math.sqrt(this.x ** 2 + this.y ** 2)
        return new Vec2(this.x / length, this.y / length)
    }

    min(vec: Vec2): Vec2 {
        return new Vec2(Math.min(this.x, vec.x), Math.min(this.y, vec.y))
    }

    max(vec: Vec2): Vec2 {
        return new Vec2(Math.max(this.x, vec.x), Math.max(this.y, vec.y))
    }

    range(min: Vec2, max: Vec2): Vec2 {
        return new Vec2(Math.max(min.x, Math.min(this.x, max.x)), Math.max(min.y, Math.min(this.y, max.y)))
    }

    isGreater(vec: Vec2): boolean {
        return this.x > vec.x && this.y > vec.y
    }

    isGreaterEquals(vec: Vec2): boolean {
        return this.x >= vec.x && this.y >= vec.y
    }

    equals(vec: Vec2): boolean {
        return this.x === vec.x && this.y === vec.y
    }

    isLessEquals(vec: Vec2): boolean {
        return this.x <= vec.x && this.y <= vec.y
    }

    isLess(vec: Vec2): boolean {
        return this.x < vec.x && this.y < vec.y
    }

    angleBetween(vec1: Vec2, vec2: Vec2): number {
        const v1 = vec1.subtract(this)
        const v2 = vec2.subtract(this)

        const dotProduct = v1.dot(v2)
        const lengths = v1.length() * v2.length()

        let cosTheta = dotProduct / lengths

        cosTheta = Math.min(1, Math.max(-1, cosTheta))

        return Math.acos(cosTheta)
    }

    static fromJson(json: any): Vec2 {
        return new Vec2(json[0], json[1])
    }

    toJson(): number[] {
        return [this.x, this.y]
    }
}

export class Vec3 {

    static readonly ZERO = new Vec3(0, 0, 0)
    static readonly UNIT = new Vec3(1, 1, 1)

    constructor(readonly x: number, readonly y: number, readonly z: number) { }

    length(): number {
        return Math.sqrt(this.x ** 2 + this.y ** 2 + this.z ** 2)
    }

    distanceTo(vec: Vec3): number {
        return Math.sqrt(Math.pow(this.x - vec.x, 2) + Math.pow(this.y - vec.y, 2) + Math.pow(this.z - vec.z, 2))
    }

    cross(vector: Vec3): Vec3 {
        return new Vec3(
            this.y * vector.z - this.z * vector.y,
            this.z * vector.x - this.x * vector.z,
            this.x * vector.y - this.y * vector.x
        )
    }

    add(vec: Vec3): Vec3 {
        return new Vec3(this.x + vec.x, this.y + vec.y, this.z + vec.z)
    }

    subtract(vec: Vec3): Vec3 {
        return new Vec3(this.x - vec.x, this.y - vec.y, this.z - vec.z)
    }

    multiplyScalar(scalar: number): Vec3 {
        return new Vec3(this.x * scalar, this.y * scalar, this.z * scalar)
    }

    dot(vec: Vec3): number {
        return this.x * vec.x + this.y * vec.y + this.z * vec.z
    }

    normalize(): Vec3 {
        const length = Math.sqrt(this.x ** 2 + this.y ** 2 + this.z ** 2)
        return new Vec3(this.x / length, this.y / length, this.z / length)
    }

    toVec2(): Vec2 {
        return new Vec2(this.x, this.y)
    }

    min(vec: Vec3): Vec3 {
        return new Vec3(Math.min(this.x, vec.x), Math.min(this.y, vec.y), Math.min(this.z, vec.z))
    }

    max(vec: Vec3): Vec3 {
        return new Vec3(Math.max(this.x, vec.x), Math.max(this.y, vec.y), Math.max(this.z, vec.z))
    }

    range(min: Vec3, max: Vec3): Vec3 {
        return new Vec3(Math.max(min.x, Math.min(this.x, max.x)), Math.max(min.y, Math.min(this.y, max.y)), Math.max(min.z, Math.min(this.z, max.z)))
    }

    isGreater(vec: Vec3): boolean {
        return this.x > vec.x && this.y > vec.y && this.z > vec.z
    }

    isGreaterEquals(vec: Vec3): boolean {
        return this.x >= vec.x && this.y >= vec.y && this.z >= vec.z
    }

    equals(vec: Vec3): boolean {
        return this.x === vec.x && this.y === vec.y && this.z === vec.z
    }

    isLessEquals(vec: Vec3): boolean {
        return this.x <= vec.x && this.y <= vec.y && this.z <= vec.z
    }

    isLess(vec: Vec3): boolean {
        return this.x < vec.x && this.y < vec.y && this.z < vec.z
    }

    static fromJson(json: any): Vec3 {
        return new Vec3(json[0], json[1], json[2])
    }

    toJson(): number[] {
        return [this.x, this.y, this.z]
    }
}

export class Vec4 {

    static readonly ZERO = new Vec4(0, 0, 0, 0)
    static readonly UNIT = new Vec4(1, 1, 1, 1)

    constructor(readonly a: number, readonly b: number, readonly c: number, readonly d: number) { }

    length(): number {
        return Math.sqrt(this.a ** 2 + this.b ** 2 + this.c ** 2 + this.d ** 2)
    }

    add(vec: Vec4): Vec4 {
        return new Vec4(this.a + vec.a, this.b + vec.b, this.c + vec.c, this.c + vec.d)
    }

    subtract(vec: Vec4): Vec4 {
        return new Vec4(this.a - vec.a, this.b - vec.b, this.c - vec.c, this.c - vec.d)
    }

    multiplyScalar(scalar: number): Vec4 {
        return new Vec4(this.a * scalar, this.b * scalar, this.c * scalar, this.d * scalar)
    }

    min(vec: Vec4): Vec4 {
        return new Vec4(Math.min(this.a, vec.a), Math.min(this.b, vec.b), Math.min(this.c, vec.c), Math.min(this.d, vec.d))
    }

    max(vec: Vec4): Vec4 {
        return new Vec4(Math.max(this.a, vec.a), Math.max(this.b, vec.b), Math.max(this.c, vec.c), Math.max(this.d, vec.d))
    }

    range(min: Vec4, max: Vec4): Vec4 {
        return new Vec4(Math.max(min.a, Math.min(this.a, max.a)), Math.max(min.b, Math.min(this.b, max.b)), Math.max(min.c, Math.min(this.c, max.c)), Math.max(min.d, Math.min(this.d, max.d)))
    }

    isGreater(vec: Vec4): boolean {
        return this.a > vec.a && this.b > vec.b && this.c > vec.c && this.d > vec.d
    }

    isGreaterEquals(vec: Vec4): boolean {
        return this.a >= vec.a && this.b >= vec.b && this.c >= vec.c && this.d >= vec.d
    }

    equals(vec: Vec4): boolean {
        return this.a === vec.a && this.b === vec.b && this.c === vec.c && this.d === vec.d
    }

    isLessEquals(vec: Vec4): boolean {
        return this.a <= vec.a && this.b <= vec.b && this.c <= vec.c && this.d <= vec.d
    }

    isLess(vec: Vec4): boolean {
        return this.a < vec.a && this.b < vec.b && this.c < vec.c && this.d < vec.d
    }

    static fromJson(json: any): Vec4 {
        return new Vec4(json[0], json[1], json[2], json[3])
    }

    toJson(): number[] {
        return [this.a, this.b, this.c, this.d]
    }
}