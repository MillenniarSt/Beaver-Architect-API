import { InternalServerError } from "../connection/errors";
import { VAR_TYPES, VarTypeRegistry } from "../register/instruction";
import { RegistryChild } from "../register/register";
import { type JsonFormat, type ToJson } from "../util/util";
import { VarIncompatibleTypes, type ExecutionVariable, type ManualContext, type WriteCppVariable } from "./manual";

export class VarType implements ToJson {

    private static readonly NUMBERS: VarTypeRegistry[] = [VarTypeRegistry.BYTE, VarTypeRegistry.SHORT, VarTypeRegistry.INT, VarTypeRegistry.LONG, VarTypeRegistry.FLOAT, VarTypeRegistry.DOUBLE]

    constructor(
        readonly type: VarTypeRegistry,
        readonly generics: VarType[] = [],
        readonly arrayLength: number = -1
    ) { }

    static fromJson(json: any): VarType {
        return new VarType(VAR_TYPES.get(json.type), json.generics.map((generic: any) => VarType.fromJson(generic)), json.arrayLength)
    }

    join(varType: VarType): VarType {
        if (this.is(varType)) {
            return this
        } else if (this.isNumber() && varType.isNumber()) {
            return this.joinNumber(varType)
        }
        throw new VarIncompatibleTypes(this, varType)
    }

    joinNumber(varType: VarType): VarType {
        return new VarType(VarType.NUMBERS[Math.max(VarType.NUMBERS.indexOf(this.type), VarType.NUMBERS.indexOf(varType.type))])
    }

    is(varType: VarType): boolean {
        if(this.type !== varType.type || this.generics.length !== varType.generics.length || this.arrayLength !== varType.arrayLength) {
            return false
        }
        for(let i = 0; i < this.generics.length; i++) {
            if(!this.generics[i].is(varType.generics[i])) {
                return false
            }
        }
        return true
    }

    isCompatible(varType: VarType): boolean {
        return this.is(varType) || (this.isNumber() && varType.isNumber())
    }

    isNumber(): boolean {
        return VarType.NUMBERS.includes(this.type) && this.arrayLength === -1
    }

    writeCpp(): string {
        if (this.generics.length > 0) {
            return `${this.type}<${this.generics.map((generic) => generic.writeCpp()).join(', ')}>${this.arrayLength === -1 ? '' : `[${this.arrayLength}]`}`
        }
        return this.type.codeCpp
    }

    toJson(): JsonFormat {
        return {
            type: this.type.id,
            generics: this.generics.map((generic) => generic.toJson()),
            arrayLength: this.arrayLength
        }
    }
}

export abstract class Instruction<Output = any, Inputs extends BlockInstruction[] = any> extends RegistryChild {

    constructor(protected inputs: Inputs) {
        super()
    }

    abstract outputType(context: ManualContext): VarType | null

    abstract execute(context: ManualContext<ExecutionVariable>): Output

    abstract writeCpp(context: ManualContext<WriteCppVariable>): string | string[]

    abstract cppIncludes(): string[]

    selfCppIncludes(): string[] {
        return []
    }
}

export abstract class LinearInstruction<Inputs extends BlockInstruction[] = any> extends Instruction<{} | void, Inputs> {

    constructor(inputs: Inputs, protected children: LinearInstruction[][] = []) {
        super(inputs)
    }

    outputType(context: ManualContext): VarType | null {
        return null
    }

    abstract writeCpp(context: ManualContext<WriteCppVariable>): string[]

    protected executeInSubScope(context: ManualContext<ExecutionVariable>, instructions: LinearInstruction[]): {} | void {
        context = context.clone()
        this.executeBlock(context, instructions)
    }

    protected executeBlock(context: ManualContext<ExecutionVariable>, instructions: LinearInstruction[]): {} | void {
        for (let i = 0; i < instructions.length; i++) {
            let returnValue = instructions[i].execute(context)
            if (returnValue !== undefined) {
                return returnValue
            }
        }
    }

    cppIncludes(): string[] {
        const set = new Set(this.selfCppIncludes())
        this.inputs.forEach((input) => input.cppIncludes().map((include) => set.add(include)))
        this.children.forEach((child) => child.forEach((instruction) => instruction.cppIncludes().map((include) => set.add(include))))
        return [...set]
    }
}

export abstract class BlockInstruction<Output extends {} = any, Inputs extends BlockInstruction[] = any> extends Instruction<Output, Inputs> {

    abstract outputType(context: ManualContext): VarType

    abstract getConstantValue(context: ManualContext<WriteCppVariable>): Output | undefined

    abstract writeCpp(context: ManualContext<WriteCppVariable>): string

    cppIncludes(): string[] {
        const set = new Set(this.selfCppIncludes())
        this.inputs.forEach((input) => input.cppIncludes().map((include) => set.add(include)))
        return [...set]
    }
}