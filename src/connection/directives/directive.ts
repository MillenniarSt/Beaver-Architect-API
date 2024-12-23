export abstract class Directive {

    abstract get path(): string

    abstract send(): void

    abstract override(directive: Directive): Promise<void>
}