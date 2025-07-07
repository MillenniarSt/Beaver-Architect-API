import { BLOCK_INSTRUCTIONS, VarTypeRegistry } from "../../register/instruction";
import type { JsonFormat } from "../../util/util";
import { SimpleOperatorBlockInstruction } from "../abstract";
import { BlockInstruction, LinearInstruction, VarType } from "../instruction";
import type { ExecutionVariable, ManualContext, WriteCppVariable } from "../manual";

export class EqualsInstruction extends SimpleOperatorBlockInstruction<boolean, any> {

    get type(): string { return 'equals' }

    static fromJson(json: any): EqualsInstruction {
        return new EqualsInstruction(BLOCK_INSTRUCTIONS.fromJson(json[0]), BLOCK_INSTRUCTIONS.fromJson(json[1]))
    }

    outputType(context: ManualContext): VarType {
        return new VarType(VarTypeRegistry.BOOLEAN)
    }

    get operatorCpp(): string {
        return '=='
    }

    operateInputs(input1: any, input2: any): boolean {
        return input1 === input2
    }
}

export class NotEqualsInstruction extends SimpleOperatorBlockInstruction<boolean, any> {

    get type(): string { return 'not_equals' }

    static fromJson(json: any): NotEqualsInstruction {
        return new NotEqualsInstruction(BLOCK_INSTRUCTIONS.fromJson(json[0]), BLOCK_INSTRUCTIONS.fromJson(json[1]))
    }

    outputType(context: ManualContext): VarType {
        return new VarType(VarTypeRegistry.BOOLEAN)
    }

    get operatorCpp(): string {
        return '!='
    }

    operateInputs(input1: any, input2: any): boolean {
        return input1 !== input2
    }
}

export class ReturnInstruction<T extends {} = any> extends LinearInstruction<[BlockInstruction<T>]> {

    get type(): string { return 'return' }

    constructor(
        returnValue: BlockInstruction<T>
    ) {
        super([returnValue])
    }

    static fromJson(json: any): ReturnInstruction {
        return new ReturnInstruction(BLOCK_INSTRUCTIONS.fromJson(json))
    }

    execute(context: ManualContext<ExecutionVariable>): void | {} {
        return this.inputs[0].execute(context)
    }

    writeCpp(context: ManualContext<WriteCppVariable>): string[] {
        return [`return ${this.inputs[0].writeCpp(context)}`]
    }

    toData(): JsonFormat {
        return this.inputs[0].toJson()
    }
}

export class TernaryOperatorInstruction<T extends {} = any> extends BlockInstruction<T, [BlockInstruction<boolean>, BlockInstruction<T>, BlockInstruction<T>]> {

    get type(): string { return 'ternary_operator' }

    constructor(
        condition: BlockInstruction<boolean>,
        first: BlockInstruction<T>,
        second: BlockInstruction<T>
    ) {
        super([condition, first, second])
    }

    static fromJson(json: any): TernaryOperatorInstruction {
        return new TernaryOperatorInstruction(BLOCK_INSTRUCTIONS.fromJson(json[0]), BLOCK_INSTRUCTIONS.fromJson(json[1]), BLOCK_INSTRUCTIONS.fromJson(json[2]))
    }

    outputType(context: ManualContext): VarType {
        return this.inputs[1].outputType(context).join(this.inputs[2].outputType(context))
    }

    execute(context: ManualContext<ExecutionVariable>): T {
        return this.inputs[0].execute(context) ? this.inputs[1].execute(context) : this.inputs[2].execute(context)
    }

    getConstantValue(context: ManualContext<WriteCppVariable>): T | undefined {
        const constantCondition = this.inputs[0].getConstantValue(context)
        if(constantCondition !== undefined) {
            if(constantCondition) {
                return this.inputs[1].getConstantValue(context)
            } else {
                return this.inputs[2].getConstantValue(context)
            }
        }
    }

    writeCpp(context: ManualContext<WriteCppVariable>): string {
        const constantCondition = this.inputs[0].getConstantValue(context)
        if(constantCondition !== undefined) {
            if(constantCondition) {
                return this.inputs[1].writeCpp(context)
            } else {
                return this.inputs[2].writeCpp(context)
            }
        }

        return `${this.inputs[0].writeCpp(context)} ? ${this.inputs[1].writeCpp(context)} : ${this.inputs[2].writeCpp(context)}`
    }

    toData(): JsonFormat {
        return [this.inputs[0].toJson(), this.inputs[1].toJson(), this.inputs[2].toJson()]
    }
}