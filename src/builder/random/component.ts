import { ListEmptyError } from "../../connection/errors";
import { ComponentReference, type Component } from "../../engineer/data-pack/component/component";
import type { StyleDependency, WithDependency } from "../../engineer/data-pack/style/dependency";
import type { ResourceReference } from "../../engineer/engineer";
import { ConstantRandom, Random, Seed } from "./random";

export class ConstantComponent extends ConstantRandom<ResourceReference<Component>> implements WithDependency {

    get type(): string {
        return 'component'
    }

    constructor(
        public value: ResourceReference<Component>
    ) {
        super()
    }

    static fromJson(json: any): ConstantComponent {
        return new ConstantComponent(new ComponentReference(json))
    }

    getStyleDependency(): StyleDependency {
        return this.value.get().getStyleDependency()
    }

    toJson(): {} {
        return this.value.toJson()
    }
}

export type RandomComponentValue = { ref: ResourceReference<Component>, weight: number }

export class RandomComponent extends Random<ResourceReference<Component>> {

    get type(): string {
        return 'component'
    }

    constructor(
        public choices: RandomComponentValue[]
    ) {
        super()
    }

    static fromJson(json: any): RandomComponent {
        return new RandomComponent(json.map((choice: { ref: string, weight: number }) => {
            return { ref: new ComponentReference(choice.ref), weight: choice.weight }
        }))
    }

    toConstant(seed: Seed): ConstantComponent {
        return new ConstantComponent(this.seeded(seed))
    }

    seeded(seed: Seed): ResourceReference<Component> {
        const randomWeight = seed.next() * this.choices.reduce((acc, chioce) => acc + chioce.weight, 0)
        let cumulative = 0
        for (const chioce of this.choices) {
            cumulative += chioce.weight
            if (randomWeight < cumulative) {
                return chioce.ref
            }
        }

        throw new ListEmptyError('RandomComponent/choices')
    }

    toJson(): {} {
        return this.choices.map((choice) => {
            return { ref: choice.ref.toJson(), weight: choice.weight }
        })
    }
}