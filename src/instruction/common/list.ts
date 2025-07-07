import { BLOCK_INSTRUCTIONS, VarTypeRegistry } from "../../register/instruction";
import type { JsonFormat } from "../../util/util";
import { BlockInstruction, ConstantBlockInstruction, LinearInstruction, MethodAttributeInstruction, VarType } from "../instruction";
import type { ExecutionVariable, ManualContext, WriteCppVariable } from "../manual";

export class ListInstruction<T extends {} = any> extends ConstantBlockInstruction<T[]> {

    get type(): string { return 'list' }

    constructor(value: T[], readonly generic: VarType) {
        super(value)
    }

    static fromJson(json: any): ListInstruction {
        return new ListInstruction(json.list, VarType.fromJson(json.generic))
    }

    outputType(context: ManualContext): VarType {
        return new VarType(VarTypeRegistry.VECTOR, [this.generic])
    }

    toData(): JsonFormat {
        return {
            list: this.value,
            generic: this.generic.toJson()
        }
    }
}

export class ListPushInstruction<T extends {} = any> extends MethodAttributeInstruction<T[], [BlockInstruction<T>]> {

    get type(): string { return 'push_list' }

    constructor(name: string, value: BlockInstruction<T>) {
        super(name, [value])
    }

    static fromJson(json: any): ListPushInstruction {
        return new ListPushInstruction(json.name, BLOCK_INSTRUCTIONS.fromJson(json.args[0]))
    }

    get attributeNameCpp(): string {
        return 'push_back'
    }

    execute(context: ManualContext<ExecutionVariable>): void | {} {
        this.getObject(context).push(this.args[0].execute(context))
    }
}