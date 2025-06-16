export type BufferFormat = boolean | number | string | BufferFormat[] | { [key: string]: BufferFormat }

export abstract class BufferScheme<T extends BufferFormat  = BufferFormat> {

    abstract sizeOf(value: T): number

    abstract read(buffer: Buffer<ArrayBufferLike>, offset: number): { size: number, value: T }

    abstract write(buffer: Buffer<ArrayBufferLike>, offset: number, value: T): number

    readAll(buffer: Buffer<ArrayBufferLike>): T {
        return this.read(buffer, 0).value
    }

    writeAll(value: T): Buffer<ArrayBufferLike> {
        let buffer = Buffer.alloc(this.sizeOf(value))
        this.write(buffer, 0, value)
        return buffer
    }
}

export abstract class BufferSizedScheme<T extends BufferFormat  = BufferFormat> extends BufferScheme<T> {

    abstract get size(): number

    sizeOf(value: T): number {
        return this.size
    }

    read(buffer: Buffer<ArrayBufferLike>, offset: number): { size: number, value: T } {
        return { size: this.size, value: this.readValue(buffer, offset) }
    }

    write(buffer: Buffer<ArrayBufferLike>, offset: number, value: T): number {
        this.writeValue(buffer, offset, value)
        return this.size
    }

    abstract readValue(buffer: Buffer<ArrayBufferLike>, offset: number): T

    abstract writeValue(buffer: Buffer<ArrayBufferLike>, offset: number, value: T): void
}

export class BufferBooleanScheme extends BufferSizedScheme<boolean> {

    get size(): number {
        return 1
    }

    readValue(buffer: Buffer<ArrayBufferLike>, offset: number): boolean {
        return buffer.readUInt8(offset) !== 0
    }

    writeValue(buffer: Buffer<ArrayBufferLike>, offset: number, value: boolean): void {
        buffer.writeUInt8(value ? 1 : 0, offset)
    }
}

export class BufferByteScheme extends BufferSizedScheme<number> {

    get size(): number {
        return 1
    }

    readValue(buffer: Buffer<ArrayBufferLike>, offset: number): number {
        return buffer.readUInt8(offset)
    }

    writeValue(buffer: Buffer<ArrayBufferLike>, offset: number, value: number): void {
        buffer.writeUInt8(value, offset)
    }
}

export class BufferShortScheme extends BufferSizedScheme<number> {

    get size(): number {
        return 2
    }

    readValue(buffer: Buffer<ArrayBufferLike>, offset: number): number {
        return buffer.readInt16BE(offset)
    }

    writeValue(buffer: Buffer<ArrayBufferLike>, offset: number, value: number): void {
        buffer.writeInt16BE(value, offset)
    }
}

export class BufferIntScheme extends BufferSizedScheme<number> {

    get size(): number {
        return 4
    }

    readValue(buffer: Buffer<ArrayBufferLike>, offset: number): number {
        return buffer.readInt32BE(offset)
    }

    writeValue(buffer: Buffer<ArrayBufferLike>, offset: number, value: number): void {
        buffer.writeInt32BE(value, offset)
    }
}

export class BufferStringScheme extends BufferScheme<string> {

    sizeOf(value: string): number {
        return 2 + value.length
    }

    read(buffer: Buffer<ArrayBufferLike>, offset: number): { size: number, value: string } {
        const length = buffer.readUInt16BE(offset)
        return { size: 2 + length, value: buffer.toString('utf-8', offset + 2, offset + length + 2) }
    }

    write(buffer: Buffer<ArrayBufferLike>, offset: number, value: string): number {
        buffer.writeUint16BE(value.length, offset)
        buffer.write(value, offset + 2, 'utf-8')
        return 2 + value.length
    }
}

export class BufferListScheme<T extends BufferFormat  = BufferFormat> extends BufferScheme<T[]> {

    constructor(
        readonly itemScheme: BufferScheme<T>
    ) {
        super()
    }

    sizeOf(value: T[]): number {
        if(this.itemScheme instanceof BufferSizedScheme) {
            return 4 + (value.length * this.itemScheme.size)
        }

        let size = 4
        value.forEach((v) => size += this.itemScheme.sizeOf(v))
        return size
    }

    read(buffer: Buffer<ArrayBufferLike>, offset: number): { size: number, value: T[] } {
        const length = buffer.readUInt32BE(offset)
        let list: T[] = new Array(length)
        let size = 4
        for (let i = 0; i < length; i++) {
            let item = this.itemScheme.read(buffer, offset + size)
            list[i] = item.value
            size += item.size
        }
        return { size: size, value: list }
    }

    write(buffer: Buffer<ArrayBufferLike>, offset: number, value: T[]): number {
        buffer.writeUInt32BE(value.length, offset)
        let size = 4
        for (let i = 0; i < value.length; i++) {
            size += this.itemScheme.write(buffer, offset + size, value[i])
        }
        return size
    }
}

export class BufferFixedListScheme<T extends BufferFormat  = BufferFormat> extends BufferScheme<T[]> {

    constructor(
        readonly itemScheme: BufferScheme<T>,
        readonly length: number
    ) {
        super()
    }

    sizeOf(value: T[]): number {
        if(this.itemScheme instanceof BufferSizedScheme) {
            return this.length * this.itemScheme.size
        }

        let size = 0
        for (let i = 0; i < this.length; i++) {
            size += this.itemScheme.sizeOf(value[i])
        }
        return size
    }

    read(buffer: Buffer<ArrayBufferLike>, offset: number): { size: number, value: T[] } {
        let list: T[] = new Array(this.length)
        let size = 0
        for (let i = 0; i < this.length; i++) {
            let item = this.itemScheme.read(buffer, offset + size)
            list[i] = item.value
            size += item.size
        }
        return { size: size, value: list }
    }

    write(buffer: Buffer<ArrayBufferLike>, offset: number, value: T[]): number {
        let size = 0
        for (let i = 0; i < this.length; i++) {
            size += this.itemScheme.write(buffer, offset + size, value[i])
        }
        return size
    }
}

export class BufferObjectScheme<T extends Record<string, BufferFormat> = Record<string, BufferFormat>> extends BufferScheme<T> {

    constructor(
        readonly scheme: [keyof T, BufferScheme<T[keyof T]>][]
    ) {
        super()
    }

    sizeOf(value: T): number {
        let size = 0
        for (let i = 0; i < this.scheme.length; i++) {
            size += this.scheme[i][1].sizeOf(value[this.scheme[i][0]])
        }
        return size
    }

    read(buffer: Buffer<ArrayBufferLike>, offset: number): { size: number, value: T } {
        let object: Record<string, any> = {}
        let size = 0
        for (let i = 0; i < this.scheme.length; i++) {
            let entry = this.scheme[i][1].read(buffer, offset + size)
            object[this.scheme[i][0] as string] = entry.value
            size += entry.size
        }
        return { size: size, value: object as T }
    }

    write(buffer: Buffer<ArrayBufferLike>, offset: number, value: T): number {
        let size = 0
        for (let i = 0; i < this.scheme.length; i++) {
            size += this.scheme[i][1].write(buffer, offset + size, value[this.scheme[i][0]])
        }
        return size
    }
}

export class BufferRecordScheme<T extends BufferFormat = BufferFormat> extends BufferScheme<Record<string, T>> {

    constructor(
        readonly valueScheme: BufferScheme<T>,
        readonly keyScheme: BufferScheme<string> = new BufferStringScheme()
    ) {
        super()
    }

    sizeOf(value: Record<string, T>): number {
        const entries = Object.entries(value)
        let size = 4
        entries.forEach(([k, v]) => size += this.keyScheme.sizeOf(k) + this.valueScheme.sizeOf(v))
        return size
    }

    read(buffer: Buffer<ArrayBufferLike>, offset: number): { size: number, value: Record<string, T> } {
        const length = buffer.readUInt32BE(offset)
        let record: Record<string, T> = {}
        let size = 4
        for (let i = 0; i < length; i++) {
            let key = this.keyScheme.read(buffer, offset + size)
            size += key.size
            let value = this.valueScheme.read(buffer, offset + size)
            record[key.value] = value.value
            size += value.size
        }
        return { size: size, value: record }
    }

    write(buffer: Buffer<ArrayBufferLike>, offset: number, value: Record<string, T>): number {
        const entries = Object.entries(value)
        buffer.writeUInt32BE(entries.length, offset)
        let size = 4
        for (let i = 0; i < entries.length; i++) {
            size += this.keyScheme.write(buffer, offset + size, entries[i][0])
            size += this.valueScheme.write(buffer, offset + size, entries[i][1])
        }
        return size
    }
}

export class BufferKeyScheme<T extends BufferFormat = BufferFormat> extends BufferScheme<{ key: string, value: T }> {

    constructor(
        readonly schemes: Record<string, BufferScheme<T>>,
        readonly keyScheme: BufferScheme<string> = new BufferStringScheme()
    ) {
        super()
    }

    sizeOf(value: { key: string, value: T }): number {
        return this.keyScheme.sizeOf(value.key) + this.schemes[value.key].sizeOf(value.value)
    }

    read(buffer: Buffer<ArrayBufferLike>, offset: number): { size: number; value: { key: string; value: T } } {
        const key = this.keyScheme.read(buffer, offset)
        const value = this.schemes[key.value].read(buffer, offset + key.size)
        return { size: key.size + value.size, value: { key: key.value, value: value.value } }
    }

    write(buffer: Buffer<ArrayBufferLike>, offset: number, value: { key: string; value: T }): number {
        let keySize = this.keyScheme.write(buffer, offset, value.key)
        let valueSize = this.schemes[value.key].write(buffer, offset + keySize, value.value)
        return keySize + valueSize
    }
}