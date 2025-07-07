import { BLOCK_INSTRUCTIONS, VarTypeRegistry } from "../../register/instruction";
import type { JsonFormat } from "../../util/util";
import { ConstantBlockInstruction, SimpleOperatorBlockInstruction } from "../abstract";
import { BlockInstruction, VarType } from "../instruction";
import type { ExecutionVariable, ManualContext, WriteCppVariable } from "../manual";

export class BooleanInstruction extends ConstantBlockInstruction<boolean> {

    get type(): string { return 'boolean' }

    static fromJson(json: any): BooleanInstruction {
        return new BooleanInstruction(json)
    }

    outputType(context: ManualContext): VarType {
        return new VarType(VarTypeRegistry.BOOLEAN)
    }
}

abstract class BooleanOperatorInstruction extends SimpleOperatorBlockInstruction<boolean, boolean> {

    outputType(context: ManualContext): VarType {
        return new VarType(VarTypeRegistry.BOOLEAN)
    }
}

export class AndInstruction extends BooleanOperatorInstruction {

    get type(): string { return 'and' }

    static fromJson(json: any): AndInstruction {
        return new AndInstruction(BLOCK_INSTRUCTIONS.fromJson(json[0]), BLOCK_INSTRUCTIONS.fromJson(json[1]))
    }

    get operatorCpp(): string {
        return '&&'
    }

    operateInputs(input1: boolean, input2: boolean): boolean {
        return input1 && input2
    }
}

export class OrInstruction extends BooleanOperatorInstruction {

    get type(): string { return 'or' }

    static fromJson(json: any): OrInstruction {
        return new OrInstruction(BLOCK_INSTRUCTIONS.fromJson(json[0]), BLOCK_INSTRUCTIONS.fromJson(json[1]))
    }

    get operatorCpp(): string {
        return '||'
    }

    operateInputs(input1: boolean, input2: boolean): boolean {
        return input1 || input2
    }
}

export class NotInstruction extends BlockInstruction<boolean, [BlockInstruction<boolean>]> {

    get type(): string { return 'not' }

    constructor(
        value: BlockInstruction<boolean>
    ) {
        super([value])
    }

    static fromJson(json: any): NotInstruction {
        return new NotInstruction(BLOCK_INSTRUCTIONS.fromJson(json))
    }

    outputType(context: ManualContext): VarType {
        return new VarType(VarTypeRegistry.BOOLEAN)
    }

    execute(context: ManualContext<ExecutionVariable>): boolean {
        return !this.inputs[0].execute(context)
    }

    getConstantValue(context: ManualContext<WriteCppVariable>): boolean | undefined {
        const constantValue = this.inputs[0].getConstantValue(context)
        return constantValue !== undefined ? !constantValue : undefined
    }

    writeCpp(context: ManualContext<WriteCppVariable>): string {
        return `!${this.inputs[0].writeCpp(context)}`
    }

    toData(): JsonFormat {
        return this.inputs[0].toJson()
    }
}