import { StyleDependency } from "../../engineer/data-pack/style/dependency.js";
import { Material } from "../../engineer/data-pack/style/material.js";
import { Style, StyleReference } from "../../engineer/data-pack/style/style.js";
import { RandomList } from "../../util/random.js";

export const templateTestStyles: Record<string, (...args: any) => Style> = {
    simple: () => new Style(new StyleReference('style-test'), new StyleDependency([], []), false, [], new Map([
        ['primary', new Material(new RandomList([{ id: 'minecraft:stone' }]), 'BaseMaterial')]
    ]))
}