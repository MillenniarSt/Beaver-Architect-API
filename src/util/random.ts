import { Vec2, Vec3, Vec4 } from "../world/vector.js"

export class Seed {

    public seed: number

    constructor(seed: number = Math.floor(Math.random() * 2147483647)) {
      this.seed = seed % 2147483647
      if (this.seed <= 0) {
        this.seed += 2147483646
      }
    }
  
    next(): number {
      this.seed = (this.seed * 16807) % 2147483647
      return (this.seed - 1) / 2147483646
    }
}

export interface Random<T = any> {

    random(): T

    seeded(seed: Seed): T

    toJson(): {}
}

export class RandomNumber implements Random<number> {
    
    constructor(public min: number, public max: number) { }

    static constant(value: number): RandomNumber {
        return new RandomNumber(value, value)
    }

    static fromJson(json: any): RandomNumber {
        return new RandomNumber(json.min, json.max)
    }

    random(): number {
        return Math.random() * (this.max - this.min) + this.min
    }

    seeded(seed: Seed): number {
        return seed.next() * (this.max - this.min) + this.min
    }

    toJson(): {} {
        return {
            min: this.min,
            max: this.max
        }
    }
}

export class RandomInteger extends RandomNumber {

    random(): number {
        return Math.floor(Math.random() * (this.max - this.min)) + this.min
    }

    seeded(seed: Seed): number {
        return Math.floor(seed.next() * (this.max - this.min)) + this.min
    }
}

export class RandomVec2 implements Random<Vec2> {
    
    constructor(public x: RandomNumber, public y: RandomNumber) { }

    static constant(x: number, y: number = x): RandomVec2 {
        return new RandomVec2(RandomNumber.constant(x), RandomNumber.constant(y))
    }

    static regular(min: number, max: number): RandomVec2 {
        return new RandomVec2(new RandomNumber(min, max), new RandomNumber(min, max))
    }

    static fromJson(json: any): RandomVec2 {
        return new RandomVec2(RandomNumber.fromJson(json.x), RandomNumber.fromJson(json.y))
    }

    random(): Vec2 {
        return new Vec2(this.x.random(), this.y.random())
    }

    seeded(seed: Seed): Vec2 {
        return new Vec2(this.x.seeded(seed), this.y.seeded(seed))
    }

    toJson(): {} {
        return {
            x: this.x.toJson(),
            y: this.y.toJson()
        }
    }
}

export class RandomVec3 implements Random<Vec3> {
    
    constructor(public x: RandomNumber, public y: RandomNumber, public z: RandomNumber) { }

    static constant(x: number, y: number = x, z: number = x): RandomVec3 {
        return new RandomVec3(RandomNumber.constant(x), RandomNumber.constant(y), RandomNumber.constant(z))
    }

    static regular(min: number, max: number): RandomVec3 {
        return new RandomVec3(new RandomNumber(min, max), new RandomNumber(min, max), new RandomNumber(min, max))
    }

    static fromJson(json: any): RandomVec3 {
        return new RandomVec3(RandomNumber.fromJson(json.x), RandomNumber.fromJson(json.y), RandomNumber.fromJson(json.z))
    }

    random(): Vec3 {
        return new Vec3(this.x.random(), this.y.random(), this.z.random())
    }

    seeded(seed: Seed): Vec3 {
        return new Vec3(this.x.seeded(seed), this.y.seeded(seed), this.z.seeded(seed))
    }

    toJson(): {} {
        return {
            x: this.x.toJson(),
            y: this.y.toJson(),
            z: this.z.toJson()
        }
    }
}

export class RandomVec4 implements Random<Vec4> {
    
    constructor(public a: RandomNumber, public b: RandomNumber, public c: RandomNumber, public d: RandomNumber) { }

    static constant(a: number, b: number = a, c: number = a, d: number = a): RandomVec4 {
        return new RandomVec4(RandomNumber.constant(a), RandomNumber.constant(b), RandomNumber.constant(c), RandomNumber.constant(d))
    }

    static regular(min: number, max: number): RandomVec4 {
        return new RandomVec4(new RandomNumber(min, max), new RandomNumber(min, max), new RandomNumber(min, max), new RandomNumber(min, max))
    }

    static fromJson(json: any): RandomVec4 {
        return new RandomVec4(RandomNumber.fromJson(json.a), RandomNumber.fromJson(json.b), RandomNumber.fromJson(json.c), RandomNumber.fromJson(json.d))
    }

    random(): Vec4 {
        return new Vec4(this.a.random(), this.b.random(), this.c.random(), this.d.random())
    }

    seeded(seed: Seed): Vec4 {
        return new Vec4(this.a.seeded(seed), this.b.seeded(seed), this.c.seeded(seed), this.d.seeded(seed))
    }

    toJson(): {} {
        return {
            a: this.a.toJson(),
            b: this.b.toJson(),
            c: this.c.toJson(),
            d: this.d.toJson(),
        }
    }
}

export class RandomList<T = any> implements Random<T | undefined> {

    constructor(
        readonly list: T[] = [], 
        readonly getter: RandomInteger = new RandomInteger(0, list.length -1), 
        public itemToJson: (item: T) => any = (item) => item
    ) {
        this.getter.min = 0
        this.getter.max = this.list.length -1
    }

    static constant<T>(item: T, itemToJson?: (item: T) => any): RandomList<T> {
        return new RandomList([item], RandomInteger.constant(0), itemToJson)
    }

    static fromJson<T>(json: any, itemFromJson: (json: any) => T = (json) => json, itemToJson: (item: T) => any = (item) => item): RandomList<T> {
        return new RandomList(json.list.map((item: any) => itemFromJson(item)), RandomInteger.fromJson(json.getter), itemToJson)
    }

    push(item: T) {
        this.list.push(item)
        this.ensureGetter()
    }

    remove(index: number) {
        this.list.splice(index, 1)
        this.ensureGetter()
    }

    ensureGetter() {
        this.getter.max = this.list.length -1
    }

    random(): T | undefined {
        if(this.list.length === 0) {
            return undefined
        }
        return this.list[this.getter.random()]
    }

    seeded(seed: Seed): T | undefined {
        if(this.list.length === 0) {
            return undefined
        }
        return this.list[this.getter.seeded(seed)]
    }

    toJson(itemToJson: (item: T) => any = this.itemToJson): {} {
        return {
            list: this.list.map((item: any) => itemToJson(item)),
            getter: this.getter.toJson()
        }
    }
}