//             _____
//         ___/     \___        |  |
//      ##/  _.- _.-    \##  -  |  |                       -
//      ##\#=_  '    _=#/##  |  |  |  /---\  |      |      |   ===\  |  __
//      ##   \\#####//   ##  |  |  |  |___/  |===\  |===\  |   ___|  |==/
//      ##       |       ##  |  |  |  |      |   |  |   |  |  /   |  |
//      ##       |       ##  |  \= \= \====  |   |  |   |  |  \___/  |
//      ##\___   |   ___/
//      ##    \__|__/

import { KeyNotRegistered } from "../connection/errors"
import type { MessageFunction, OnMessage } from "../connection/server"
import type { Side } from "../connection/sides"
import type { JsonFormat, ToJson } from "../util/util"

export const boxes: Record<string, Register<any>> = {}

export class Register<T extends Registry = Registry> implements ToJson {

    protected readonly registries: Record<string, T> = {}

    constructor(
        readonly box: string
    ) { }

    register<t extends T>(registry: t): t {
        if (this.registries[registry.id] !== undefined) {
            console.warn(`Overwritten registry ${registry.id} in register ${this.box}`)
        }
        this.registries[registry.id] = registry
        return registry
    }

    registerAll(...registries: T[]): T[] {
        registries.forEach((registry) => this.register(registry))
        return registries
    }

    get(id: string): T {
        const registry = this.registries[id]
        if (!registry) {
            throw new KeyNotRegistered(id, 'Registries', this.box)
        }
        return registry
    }

    getAll(): T[] {
        return Object.values(this.registries)
    }

    messages(): RegisterMessagesStructure {
        return {
            'get-all': (data, side, id) => side.respond(id, this.toJson()),
            'get': (data, side, id) => side.respond(id, this.get(data.id).toJson())
        }
    }

    toJson() {
        return this.getAll().map((registry) => registry.toJson())
    }
}

export class ObjectRegister<C extends RegistryChild, T extends RegistryObject<C> = RegistryObject<C>> extends Register<T> {

    fromJson(json: { type: string, data: JsonFormat }, ...args: any[]): C {
        return this.get(json.type).fromJson(json.data, args)
    }
}

export abstract class Registry implements ToJson {

    abstract get id(): string

    abstract toJson(): {}
}

export abstract class RegistryObject<T extends RegistryChild = RegistryChild> extends Registry {

    //abstract generate(...args: any[]): T

    abstract fromJson(json: any, ...args: any[]): T
}

export abstract class RegistryChild implements ToJson {

    abstract get type(): string

    abstract toData(): JsonFormat

    toJson() {
        return {
            type: this.type,
            data: this.toData()
        }
    }
}

/**
 * Sum up messages paths and their data types required
 */
export type RegisterMessagesStructure = {
    'get-all': MessageFunction<Side, {}>
    'get': MessageFunction<Side, { id: string }>
}

export function registerRegisterMessages(onMessage: OnMessage) {
    Object.values(boxes).forEach((register) => Object.entries(register.messages()).forEach(([key, f]) => onMessage.set(`register/${register.box}/${key}`, f)))
}