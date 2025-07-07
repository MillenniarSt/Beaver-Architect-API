import { BLOCK_INSTRUCTIONS, VarTypeRegistry } from "../../register/instruction";
import type { JsonFormat } from "../../util/util";
import { ConstantBlockInstruction, OperatorBlockInstruction, SimpleOperatorBlockInstruction } from "../abstract";
import { BlockInstruction, VarType } from "../instruction";
import type { ExecutionVariable, ManualContext, WriteCppVariable } from "../manual";

export class ByteInstruction extends ConstantBlockInstruction<number> {

    get type(): string { return 'byte' }

    outputType(): VarType { return new VarType(VarTypeRegistry.BYTE) }

    static fromJson(json: any): ByteInstruction {
        return new ByteInstruction(json)
    }
}

export class ShortInstruction extends ConstantBlockInstruction<number> {

    get type(): string { return 'short' }

    outputType(): VarType { return new VarType(VarTypeRegistry.SHORT) }

    static fromJson(json: any): ShortInstruction {
        return new ShortInstruction(json)
    }
}

export class IntInstruction extends ConstantBlockInstruction<number> {

    get type(): string { return 'int' }

    outputType(): VarType { return new VarType(VarTypeRegistry.INT) }

    static fromJson(json: any): IntInstruction {
        return new IntInstruction(json)
    }
}

export class LongInstruction extends ConstantBlockInstruction<number> {

    get type(): string { return 'long' }

    outputType(): VarType { return new VarType(VarTypeRegistry.LONG) }

    static fromJson(json: any): LongInstruction {
        return new LongInstruction(json)
    }
}

export class FloatInstruction extends ConstantBlockInstruction<number> {

    get type(): string { return 'float' }

    outputType(): VarType { return new VarType(VarTypeRegistry.FLOAT) }

    static fromJson(json: any): FloatInstruction {
        return new FloatInstruction(json)
    }
}

export class DoubleInstruction extends ConstantBlockInstruction<number> {

    get type(): string { return 'double' }

    outputType(): VarType { return new VarType(VarTypeRegistry.DOUBLE) }

    static fromJson(json: any): DoubleInstruction {
        return new DoubleInstruction(json)
    }
}

abstract class NumberOperatorBlockInstruction extends SimpleOperatorBlockInstruction<number, number> {

    outputType(context: ManualContext): VarType {
        return this.inputs[0].outputType(context).joinNumber(this.inputs[1].outputType(context))
    }
}

abstract class NumberComparatorBlockInstruction extends SimpleOperatorBlockInstruction<boolean, number> {

    outputType(context: ManualContext): VarType {
        return new VarType(VarTypeRegistry.BOOLEAN)
    }
}

export class AdditionInstruction extends NumberOperatorBlockInstruction {

    get type(): string { return 'addition' }

    static fromJson(json: any): AdditionInstruction {
        return new AdditionInstruction(BLOCK_INSTRUCTIONS.fromJson(json[0]), BLOCK_INSTRUCTIONS.fromJson(json[1]))
    }

    get operatorCpp(): string {
        return '+'
    }

    operateInputs(input1: number, input2: number): number {
        return input1 + input2
    }
}

export class SubtractionInstruction extends NumberOperatorBlockInstruction {

    get type(): string { return 'subtraction' }

    static fromJson(json: any): SubtractionInstruction {
        return new SubtractionInstruction(BLOCK_INSTRUCTIONS.fromJson(json[0]), BLOCK_INSTRUCTIONS.fromJson(json[1]))
    }

    get operatorCpp(): string {
        return '-'
    }

    operateInputs(input1: number, input2: number): number {
        return input1 - input2
    }
}

export class MultiplicationInstruction extends NumberOperatorBlockInstruction {

    get type(): string { return 'multiplication' }

    static fromJson(json: any): MultiplicationInstruction {
        return new MultiplicationInstruction(BLOCK_INSTRUCTIONS.fromJson(json[0]), BLOCK_INSTRUCTIONS.fromJson(json[1]))
    }

    get operatorCpp(): string {
        return '*'
    }

    operateInputs(input1: number, input2: number): number {
        return input1 * input2
    }
}

export class DivisionInstruction extends NumberOperatorBlockInstruction {

    get type(): string { return 'division' }

    static fromJson(json: any): DivisionInstruction {
        return new DivisionInstruction(BLOCK_INSTRUCTIONS.fromJson(json[0]), BLOCK_INSTRUCTIONS.fromJson(json[1]))
    }

    get operatorCpp(): string {
        return '/'
    }

    operateInputs(input1: number, input2: number): number {
        return input1 / input2
    }
}

export class PowInstruction extends OperatorBlockInstruction<number, number> {

    get type(): string { return 'pow' }

    static fromJson(json: any): PowInstruction {
        return new PowInstruction(BLOCK_INSTRUCTIONS.fromJson(json[0]), BLOCK_INSTRUCTIONS.fromJson(json[1]))
    }

    outputType(context: ManualContext): VarType {
        return VarTypeRegistry.DOUBLE.get()
    }

    operateInputs(input1: number, input2: number): number {
        return Math.pow(input1, input2)
    }

    writeConstantCpp(constant: number): string {
        return `${constant}`
    }

    writeOperationCpp(context: ManualContext<WriteCppVariable>): string {
        return `std::pow(${this.inputs[0].writeCpp(context)}, ${this.inputs[1].writeCpp(context)})`
    }

    selfCppIncludes(): string[] {
        return ['<cmath>']
    }
}

export class SqrtInstruction extends BlockInstruction<number, [BlockInstruction<number>]> {

    get type(): string { return 'sqrt' }

    constructor(value: BlockInstruction<number>) {
        super([value])
    }

    static fromJson(json: any): SqrtInstruction {
        return new SqrtInstruction(BLOCK_INSTRUCTIONS.fromJson(json))
    }

    outputType(context: ManualContext): VarType {
        return VarTypeRegistry.DOUBLE.get()
    }

    execute(context: ManualContext<ExecutionVariable>): number {
        return Math.sqrt(this.inputs[0].execute(context))
    }

    getConstantValue(context: ManualContext<WriteCppVariable>): number | undefined {
        const constantValue = this.inputs[0].getConstantValue(context)
        if(constantValue !== undefined) {
            return Math.sqrt(constantValue)
        }
    }

    writeCpp(context: ManualContext<WriteCppVariable>): string {
        const constantValue = this.getConstantValue(context)
        if(constantValue) {
            return `${constantValue}`
        }
        return `std::sqrt(${this.inputs[0].writeCpp(context)})`
    }

    selfCppIncludes(): string[] {
        return ['<cmath>']
    }

    toData(): JsonFormat {
        return this.inputs[0].toJson()
    }
}

export class LessInstruction extends NumberComparatorBlockInstruction {

    get type(): string { return 'less' }

    static fromJson(json: any): LessInstruction {
        return new LessInstruction(BLOCK_INSTRUCTIONS.fromJson(json[0]), BLOCK_INSTRUCTIONS.fromJson(json[1]))
    }

    get operatorCpp(): string {
        return '<'
    }

    operateInputs(input1: number, input2: number): boolean {
        return input1 < input2
    }
}

export class LessEqualInstruction extends NumberComparatorBlockInstruction {

    get type(): string { return 'less_equal' }

    static fromJson(json: any): LessEqualInstruction {
        return new LessEqualInstruction(BLOCK_INSTRUCTIONS.fromJson(json[0]), BLOCK_INSTRUCTIONS.fromJson(json[1]))
    }

    get operatorCpp(): string {
        return '<='
    }

    operateInputs(input1: number, input2: number): boolean {
        return input1 <= input2
    }
}

export class GreaterInstruction extends NumberComparatorBlockInstruction {

    get type(): string { return 'less_greater' }

    static fromJson(json: any): GreaterInstruction {
        return new GreaterInstruction(BLOCK_INSTRUCTIONS.fromJson(json[0]), BLOCK_INSTRUCTIONS.fromJson(json[1]))
    }

    get operatorCpp(): string {
        return '>'
    }

    operateInputs(input1: number, input2: number): boolean {
        return input1 > input2
    }
}

export class GreaterEqualInstruction extends NumberComparatorBlockInstruction {

    get type(): string { return 'greater_equal' }

    static fromJson(json: any): GreaterEqualInstruction {
        return new GreaterEqualInstruction(BLOCK_INSTRUCTIONS.fromJson(json[0]), BLOCK_INSTRUCTIONS.fromJson(json[1]))
    }

    get operatorCpp(): string {
        return '>='
    }

    operateInputs(input1: number, input2: number): boolean {
        return input1 >= input2
    }
}