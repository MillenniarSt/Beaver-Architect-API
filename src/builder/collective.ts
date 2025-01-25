import { Builder } from "./builder.js"

export const namedBuilders: Map<string, (json: any) => Builder> = new Map()

export function NamedBuilder() {
    return function (constructor: { new (data: any): Builder }) {
        namedBuilders.set(constructor.name, (json: any) => new constructor(json))
    }
}

export function builderFromJson(json: any): Builder {
    const factory = namedBuilders.get(json.name)
    if(!factory) {
        throw Error(`No Builder registered for name: ${json.name}`)
    }
    return factory(json)
}