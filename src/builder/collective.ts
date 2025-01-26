import { Builder } from "./builder.js"

const namedBuilders: Map<string, (json: any) => Builder> = new Map()

export function NamedBuilder(fromJson: (json: any) => Builder) {
    return function (constructor: { new (...args: any): Builder }) {
        namedBuilders.set(constructor.name, fromJson)
    }
}

export function builderFromJson(json: any): Builder {
    const factory = namedBuilders.get(json.name)
    if(!factory) {
        throw Error(`No Builder registered for name: ${json.name}`)
    }
    return factory(json)
}