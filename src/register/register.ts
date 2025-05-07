import { KeyNotRegistered } from "../connection/errors"
import type { MessageFunction, OnMessage, ServerOnMessage } from "../connection/server"
import type { Side } from "../connection/sides"
import type { ToJson } from "../util/util"

export const boxes: Record<string, Register> = {}

export class Register<T extends Registry = Registry> implements ToJson {

    protected readonly registries: Record<string, T> = {}

    constructor(
        readonly box: string
    ) {}

    register<t extends T>(registry: t): t {
        if(this.registries[registry.id] !== undefined) {
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
        if(!registry) {
            throw new KeyNotRegistered(id, 'Registries', this.box)
        }
        return registry
    }

    getAll(): T[] {
        return Object.values(this.registries)
    }

    toJson() {
        return this.getAll().map((registry) => registry.toJson())
    }
}

export abstract class Registry implements ToJson {

    abstract get id(): string

    abstract toJson(): {}
}

export abstract class RegistryObject<T extends RegistryChild = RegistryChild> extends Registry {

    abstract get objectFromJson(): (json: any, type: string) => T

    abstract get generate(): () => T

    fromJson(json: { type: string, data: {} }): T {
        return this.objectFromJson(json.data, json.type)
    }
}

export abstract class RegistryChild implements ToJson {

    abstract get type(): string

    abstract toData(): {}

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
type MessagesStructure = {
    'get-all': MessageFunction<Side, { box: string }>
    'get': MessageFunction<Side, { box: string, id: string }>
}

export function registerRegisterMessages(onMessage: OnMessage) {
    Object.entries(registerMessages()).forEach(([key, f]) => onMessage.set(`register/${key}`, f))
}

function registerMessages(): MessagesStructure {
    return {
        'get-all': (data, side, id) => side.respond(id, boxes[data.box].toJson()),
        'get': (data, side, id) => side.respond(id, boxes[data.box].get(data.id).toJson())
    }
}