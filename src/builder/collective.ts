import type { Builder } from "./builder";

export class BuilderType<B extends Builder = Builder> {

    constructor(
        readonly id: string,
        readonly fromJson: (json: any) => B,
        readonly generate: () => B
    ) { }
}

export const builderTypes: Record<string, BuilderType> = {

}