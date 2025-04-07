//             _____
//         ___/     \___        |  |
//      ##/  _.- _.-    \##  -  |  |                       -
//      ##\#=_  '    _=#/##  |  |  |  /---\  |      |      |   ===\  |  __
//      ##   \\#####//   ##  |  |  |  |___/  |===\  |===\  |   ___|  |==/
//      ##       |       ##  |  |  |  |      |   |  |   |  |  /   |  |
//      ##       |       ##  |  \= \= \====  |   |  |   |  |  \___/  |
//      ##\___   |   ___/
//      ##    \__|__/

import { Builder, type BuilderChild } from "./builder.js"
import type { Option } from "./option.js"

// Json Utils

const namedBuilders: Map<string, (json: any) => Builder> = new Map()

export function JsonBuilder(fromJson: (json: any) => Builder) {
    return function (constructor: { new (...args: any): Builder }) {
        namedBuilders.set(constructor.name, fromJson)
    }
}

export function SingleChildBuilder<O extends Record<string, Option>>(optionsFromJson: (json: any) => O) {
    return function (constructor: { new (child: Builder, options: O): Builder }) {
        namedBuilders.set(constructor.name, (json) => new constructor(
            builderFromJson(json.children[0].builder),
            optionsFromJson(json.options)
        ))
    }
}

export function MultiChildBuilder<O extends Record<string, Option> = {}>(childOptionsFromJson?: (json: any) => O) {
    return function (constructor: { new (children: { builder: Builder, options: O }[]): Builder }) {
        namedBuilders.set(constructor.name, (json) => new constructor(
            childrenFromJson(json, childOptionsFromJson)
        ))
    }
}

export function MultiChildOptionBuilder<O extends Record<string, Option>, Oc extends Record<string, Option> = {}>(optionsFromJson: (json: any) => O, childOptionsFromJson?: (json: any) => Oc) {
    return function (constructor: { new (children: { builder: Builder, options: Oc }[], options: O): Builder }) {
        namedBuilders.set(constructor.name, (json) => new constructor(
            childrenFromJson(json, childOptionsFromJson),
            optionsFromJson(json.options)
        ))
    }
}

export function builderFromJson(json: any): Builder {
    const factory = namedBuilders.get(json.name)
    if(!factory) {
        throw Error(`No Builder registered for name: ${json.name}`)
    }
    return factory(json)
}

export function childrenFromJson<O extends Record<string, Option>>(json: any, childOptionsFromJson: (json: any) => O = (json) => { return {} as O }): BuilderChild<Builder, O>[] {
    return json.children.map((child: any) => { return {
        builder: builderFromJson(child.builder),
        options: childOptionsFromJson(child.options)
    } })
}