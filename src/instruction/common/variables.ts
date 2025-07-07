import { BLOCK_INSTRUCTIONS } from "../../register/instruction";
import type { JsonFormat } from "../../util/util";
import { BlockInstruction, LinearInstruction, VarType } from "../instruction";
import { ExecutionVariable, WriteCppVariable, type ManualContext } from "../manual";

export class NewVarInstruction extends LinearInstruction<[BlockInstruction]> {

    get type(): string {
        return 'new_var'
    }

    constructor(public name: string, init: BlockInstruction) {
        super([init])
    }

    static fromJson(json: any): NewVarInstruction {
        return new NewVarInstruction(json.name, BLOCK_INSTRUCTIONS.fromJson(json.init))
    }

    execute(context: ManualContext<ExecutionVariable>): {} | void {
        context.addVar(this.name, new ExecutionVariable(this.inputs[0].outputType(context), this.inputs[0].execute(context)))
    }

    writeCpp(context: ManualContext<WriteCppVariable>): string[] {
        const varType = this.inputs[0].outputType(context)
        context.addVar(this.name, new WriteCppVariable(this.inputs[0].outputType(context), this.inputs[0].getConstantValue(context)))
        return [`${varType.writeCpp()} ${this.name} = ${this.inputs[0].writeCpp(context)}`]
    }

    toData(): JsonFormat {
        return {
            name: this.name,
            init: this.inputs[0].toJson()
        }
    }
}

export class SetVarInstruction extends LinearInstruction<[BlockInstruction]> {

    get type(): string {
        return 'set_var'
    }

    constructor(public name: string, value: BlockInstruction) {
        super([value])
    }

    static fromJson(json: any): SetVarInstruction {
        return new SetVarInstruction(json.name, BLOCK_INSTRUCTIONS.fromJson(json.value))
    }

    execute(context: ManualContext<ExecutionVariable>): {} | void {
        context.getVar(this.name).set(this.inputs[0].outputType(context), this.inputs[0].execute(context))
    }

    writeCpp(context: ManualContext<WriteCppVariable>): string[] {
        const constantValue = this.inputs[0].getConstantValue(context)
        if (constantValue !== undefined) {
            context.getVar(this.name).setConstant(this.inputs[0].outputType(context), constantValue)
        } else {
            context.getVar(this.name).setNotConstant()
        }
        return [`${this.name} = ${this.inputs[0].writeCpp(context)}`]
    }

    toData(): JsonFormat {
        return {
            name: this.name,
            value: this.inputs[0].toJson()
        }
    }
}

export class GetVarInstruction<T extends {} = any> extends BlockInstruction<T, []> {

    get type(): string { return 'get_var' }

    outputType(context: ManualContext): VarType {
        return context.getVar(this.name).type
    }

    constructor(public name: string) {
        super([])
    }

    static fromJson(json: any): GetVarInstruction {
        return new GetVarInstruction(json)
    }

    execute(context: ManualContext<ExecutionVariable>): T {
        return context.getVar(this.name).value as T
    }

    getConstantValue(context: ManualContext<WriteCppVariable>): T | undefined {
        return context.getVar(this.name).constantValue as T
    }

    writeCpp(context: ManualContext<WriteCppVariable>): string {
        return `${this.name}`
    }

    toData(): JsonFormat {
        return this.name
    }
}