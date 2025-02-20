//             _____
//         ___/     \___        |  |
//      ##/  _.- _.-    \##  -  |  |                       -
//      ##\#=_  '    _=#/##  |  |  |  /---\  |      |      |   ===\  |  __
//      ##   \\#####//   ##  |  |  |  |___/  |===\  |===\  |   ___|  |==/
//      ##       |       ##  |  |  |  |      |   |  |   |  |  /   |  |
//      ##       |       ##  |  \= \= \====  |   |  |   |  |  \___/  |
//      ##\___   |   ___/
//      ##    \__|__/

import { MaterialReference } from "../engineer/data-pack/style/material.js"
import { Option } from "../util/option.js"
import { RandomList } from "../util/random.js"
import { Builder, BuilderChild } from "./builder.js"

// Json Utils

const namedBuilders: Map<string, (json: any) => Builder> = new Map()

export function JsonBuilder(fromJson: (json: any) => Builder) {
    return function (constructor: { new (...args: any): Builder }) {
        namedBuilders.set(constructor.name, fromJson)
    }
}

export function SingleChildBuilder<O extends Record<string, Option>>(optionsFromJson: (json: any) => O) {
    return function (constructor: { new (child: Builder, options: O, materials: RandomList<MaterialReference>): Builder }) {
        namedBuilders.set(constructor.name, (json) => new constructor(
            builderFromJson(json.children[0].builder),
            optionsFromJson(json.options),
            materialsFromJson(json.materials)
        ))
    }
}

export function MultiChildBuilder<O extends Record<string, Option> = {}>(childOptionsFromJson?: (json: any) => O) {
    return function (constructor: { new (children: { builder: Builder, options: O }[], materials: RandomList<MaterialReference>): Builder }) {
        namedBuilders.set(constructor.name, (json) => new constructor(
            childrenFromJson(json, childOptionsFromJson),
            materialsFromJson(json)
        ))
    }
}

export function MultiChildOptionBuilder<O extends Record<string, Option>, Oc extends Record<string, Option> = {}>(optionsFromJson: (json: any) => O, childOptionsFromJson?: (json: any) => Oc) {
    return function (constructor: { new (children: { builder: Builder, options: Oc }[], options: O, materials: RandomList<MaterialReference>): Builder }) {
        namedBuilders.set(constructor.name, (json) => new constructor(
            childrenFromJson(json, childOptionsFromJson),
            optionsFromJson(json.options),
            materialsFromJson(json)
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

export function materialsFromJson(json: any): RandomList<MaterialReference> {
    return RandomList.fromJson(json.materials, MaterialReference.fromJson)
}