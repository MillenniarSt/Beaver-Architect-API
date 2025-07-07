import type { JsonFormat } from "../util/util"
import { BlockInstruction } from "./instruction"
import type { ExecutionVariable, ManualContext, WriteCppVariable } from "./manual"

export abstract class ConstantBlockInstruction<Output extends {} = any> extends BlockInstruction<Output, []> {

    constructor(public value: Output) {
        super([])
    }

    getConstantValue(): Output {
        return this.value
    }

    execute(): Output {
        return this.value
    }

    writeCpp(): string {
        return `${this.value}`
    }

    toData(): JsonFormat {
        return this.value
    }
}

export abstract class OperatorBlockInstruction<Output extends {} = any, Input extends {} = any> extends BlockInstruction<Output, [BlockInstruction<Input>, BlockInstruction<Input>]> {

    constructor(first: BlockInstruction<Input>, second: BlockInstruction<Input>) {
        super([first, second])
    }

    abstract operateInputs(input1: Input, input2: Input): Output

    abstract writeConstantCpp(constant: Output): string

    abstract writeOperationCpp(context: ManualContext<WriteCppVariable>): string

    execute(context: ManualContext<ExecutionVariable>): Output {
        return this.operateInputs(this.inputs[0].execute(context), this.inputs[1].execute(context))
    }

    getConstantValue(context: ManualContext<WriteCppVariable>): Output | undefined {
        const const1 = this.inputs[0].getConstantValue(context)
        const const2 = this.inputs[1].getConstantValue(context)

        if (const1 !== undefined && const2 !== undefined) {
            return this.operateInputs(const1, const2)
        }
    }

    writeCpp(context: ManualContext<WriteCppVariable>): string {
        const constant = this.getConstantValue(context)
        if (constant !== undefined) {
            return this.writeConstantCpp(constant)
        }

        return this.writeOperationCpp(context)
    }

    toData(): JsonFormat {
        return [this.inputs[0].toJson(), this.inputs[1].toJson()]
    }
}

export abstract class SimpleOperatorBlockInstruction<Output extends {} = any, Input extends {} = any> extends OperatorBlockInstruction<Output, Input> {

    abstract get operatorCpp(): string

    writeConstantCpp(constant: Output): string {
        return `${constant}`
    }

    writeOperationCpp(context: ManualContext<WriteCppVariable>): string {
        return `(${this.inputs[0].writeCpp(context)} ${this.operatorCpp} ${this.inputs[1].writeCpp(context)})`
    }
}