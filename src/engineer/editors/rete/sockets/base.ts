import { ReteSocket } from "../rete.js"

export class ReteMultipleSocket extends ReteSocket {

    static readonly UNDEFINED = new ReteSocket('undefined')

    constructor(
        id: string,
        readonly index: number = 0
    ) {
        super(id)
    }

    static fromJson(json: any): ReteMultipleSocket {
        const key = json.split('#')
        return new ReteMultipleSocket(key[0], key[1])
    }

    equals(other: ReteMultipleSocket): boolean {
        return this.id === other.id && this.index === other.index
    }

    toKey(): string {
        return `${this.id}#${this.index}`
    }
}

export class RetePortSocket extends ReteSocket {

    static readonly UNDEFINED = new RetePortSocket('undefined', 'undefined')

    constructor(
        id: string,
        readonly port: string
    ) {
        super(id)
    }

    static fromJson(json: any): RetePortSocket {
        const key = json.split('#')
        return new RetePortSocket(key[0], key[1])
    }

    equals(other: RetePortSocket): boolean {
        return this.id === other.id && this.port === other.port
    }

    toKey(): string {
        return `${this.id}#${this.port}`
    }
}

export class ReteMultiplePortSocket extends RetePortSocket {

    static readonly UNDEFINED = new ReteMultiplePortSocket('undefined', 'undefined', -1)

    constructor(
        id: string,
        port: string,
        readonly index: number = 0
    ) {
        super(id, port)
    }

    static fromJson(json: any): ReteMultiplePortSocket {
        const key = json.split('#')
        return new ReteMultiplePortSocket(key[0], key[1], key[2])
    }

    equals(other: ReteMultiplePortSocket): boolean {
        return this.id === other.id && this.port === other.port && this.index === other.index
    }

    toKey(): string {
        return `${this.id}#${this.port}#${this.index}`
    }
}