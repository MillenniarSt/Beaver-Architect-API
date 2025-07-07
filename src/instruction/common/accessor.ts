import { BLOCK_INSTRUCTIONS, GET_ACCESSORS, GetAccessor, METHOD_ACCESSORS, MethodAccessor, SET_ACCESSORS, SetAccessor } from "../../register/instruction";
import type { JsonFormat } from "../../util/util";
import { BlockInstruction, LinearInstruction, VarType } from "../instruction";
import type { ExecutionVariable, ManualContext, WriteCppVariable } from "../manual";

export class SetAccessorInstruction<Object extends Record<string, any> = any, Value extends Object[keyof Object] = any> extends LinearInstruction<[BlockInstruction<Object>, BlockInstruction<Value>]> {

    get type(): string { return 'set_accessor' }

    constructor(readonly accessor: SetAccessor<Object, Value>, object: BlockInstruction<Object>, value: BlockInstruction<Value>) {
        super([object, value])
    }

    static fromJson(json: any): SetAccessorInstruction {
        return new SetAccessorInstruction<any, any>(SET_ACCESSORS.get(json.accessor), BLOCK_INSTRUCTIONS.fromJson(json.object), BLOCK_INSTRUCTIONS.fromJson(json.value))
    }

    execute(context: ManualContext<ExecutionVariable>): void | {} {
        this.accessor.set(this.inputs[0].execute(context), this.inputs[1].execute(context))
    }

    writeCpp(context: ManualContext<WriteCppVariable>): string[] {
        return this.accessor.writeCpp(this.inputs[0].writeCpp(context), this.inputs[1].writeCpp(context))
    }

    selfCppIncludes(): string[] {
        return this.accessor.includes
    }

    toData(): JsonFormat {
        return {
            accessor: this.accessor.id,
            object: this.inputs[0].toJson(),
            value: this.inputs[1].toJson()
        }
    }
}

export class GetAccessorInstruction<Object extends Record<string, any> = any, Value extends Object[keyof Object] = any> extends BlockInstruction<Value, [BlockInstruction<Object>]> {

    get type(): string { return 'get_accessor' }

    constructor(readonly accessor: GetAccessor<Object, Value>, object: BlockInstruction<Object>) {
        super([object])
    }

    static fromJson(json: any): GetAccessorInstruction {
        return new GetAccessorInstruction<any, any>(GET_ACCESSORS.get(json.accessor), BLOCK_INSTRUCTIONS.fromJson(json.object))
    }

    outputType(context: ManualContext): VarType {
        return this.accessor.valueType
    }

    execute(context: ManualContext<ExecutionVariable>): Value {
        return this.accessor.get(this.inputs[0].execute(context))
    }

    getConstantValue(context: ManualContext<WriteCppVariable>): Value | undefined {
        const constantObject = this.inputs[0].getConstantValue(context)
        if(constantObject !== undefined) {
            return this.accessor.get(constantObject)
        }
    }

    writeCpp(context: ManualContext<WriteCppVariable>): string {
        return this.accessor.writeCpp(this.inputs[0].writeCpp(context))
    }

    selfCppIncludes(): string[] {
        return this.accessor.includes
    }

    toData(): JsonFormat {
        return {
            accessor: this.accessor.id,
            object: this.inputs[0].toJson()
        }
    }
}

export class LinearMethodAccessorInstruction<Object extends Record<string, any> = any, Args extends any[] = any[]> extends LinearInstruction<[BlockInstruction<Object>, ...{ [K in keyof Args]: BlockInstruction<Args[K]> }]> {

    get type(): string { return 'method_accessor' }

    constructor(readonly accessor: MethodAccessor<Object, any, Args>, object: BlockInstruction<Object>, args: { [K in keyof Args]: BlockInstruction<Args[K]> }) {
        super([object, ...args])
    }

    static fromJson(json: any): LinearMethodAccessorInstruction {
        return new LinearMethodAccessorInstruction<any, any[]>(METHOD_ACCESSORS.get(json.accessor), BLOCK_INSTRUCTIONS.fromJson(json.object), json.args.map((arg: any) => BLOCK_INSTRUCTIONS.fromJson(arg)))
    }

    execute(context: ManualContext<ExecutionVariable>): void | {} {
        this.accessor.call(this.inputs[0].execute(context), this.inputs.slice(1).map((arg) => arg.execute(context)) as Args)
    }

    writeCpp(context: ManualContext<WriteCppVariable>): string[] {
        return [this.accessor.writeCpp(this.inputs[0].writeCpp(context), this.inputs.slice(1).map((arg) => arg.writeCpp(context)) as { [I in keyof Args]: string })]
    }

    selfCppIncludes(): string[] {
        return this.accessor.includes
    }

    toData(): JsonFormat {
        return {
            accessor: this.accessor.id,
            object: this.inputs[0].toJson(),
            args: this.inputs.slice(1).map((arg) => arg.toJson())
        }
    }
}

export class MethodAccessorInstruction<Object extends Record<string, any> = any, Return extends {} = any, Args extends any[] = any[]> extends BlockInstruction<Return, [BlockInstruction<Object>, ...{ [K in keyof Args]: BlockInstruction<Args[K]> }]> {

    get type(): string { return 'method_accessor' }

    constructor(readonly accessor: MethodAccessor<Object, Return, Args>, object: BlockInstruction<Object>, args: { [K in keyof Args]: BlockInstruction<Args[K]> }) {
        super([object, ...args])
    }

    static fromJson(json: any): MethodAccessorInstruction {
        return new MethodAccessorInstruction<any, any, any[]>(METHOD_ACCESSORS.get(json.accessor), BLOCK_INSTRUCTIONS.fromJson(json.object), json.args.map((arg: any) => BLOCK_INSTRUCTIONS.fromJson(arg)))
    }

    outputType(context: ManualContext): VarType {
        return this.accessor.returnType
    }

    execute(context: ManualContext<ExecutionVariable>): Return {
        return this.accessor.call(this.inputs[0].execute(context), this.inputs.slice(1).map((arg) => arg.execute(context)) as Args)
    }

    getConstantValue(context: ManualContext<WriteCppVariable>): Return | undefined {
        const constantObject = this.inputs[0].getConstantValue(context)
        if(constantObject !== undefined) {
            const constantArgs = []
            for(let i = 1; i < this.inputs.length; i++) {
                const constantArg = this.inputs[i].getConstantValue(context)
                if(constantArg !== undefined) {
                    constantArgs.push(constantArg)
                } else {
                    return undefined
                }
            }
        }
    }

    writeCpp(context: ManualContext<WriteCppVariable>): string {
        return this.accessor.writeCpp(this.inputs[0].writeCpp(context), this.inputs.slice(1).map((arg) => arg.writeCpp(context)) as { [I in keyof Args]: string })
    }

    selfCppIncludes(): string[] {
        return this.accessor.includes
    }

    toData(): JsonFormat {
        return {
            accessor: this.accessor.id,
            object: this.inputs[0].toJson(),
            args: this.inputs.slice(1).map((arg) => arg.toJson())
        }
    }
}