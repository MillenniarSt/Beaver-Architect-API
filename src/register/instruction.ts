import type { CppInclude } from "../exporter/cpp";
import { GetAccessorInstruction, LinearMethodAccessorInstruction, MethodAccessorInstruction, SetAccessorInstruction } from "../instruction/common/accessor";
import { ForInstruction, IfInstruction, WhileInstruction } from "../instruction/common/flow_control";
import { AndInstruction, BooleanInstruction, NotInstruction, OrInstruction } from "../instruction/common/logic";
import { AdditionInstruction, ByteInstruction, DivisionInstruction, DoubleInstruction, FloatInstruction, GreaterEqualInstruction, GreaterInstruction, IntInstruction, LessEqualInstruction, LessInstruction, LongInstruction, MultiplicationInstruction, PowInstruction, ShortInstruction, SqrtInstruction, SubtractionInstruction } from "../instruction/common/math";
import { EqualsInstruction, NotEqualsInstruction, ReturnInstruction, TernaryOperatorInstruction } from "../instruction/common/misc";
import { StringInstruction } from "../instruction/common/string";
import { GetVarInstruction, NewVarInstruction, SetVarInstruction } from "../instruction/common/variables";
import { NewVec2Instruction, VEC2_TYPE, Vec2Instruction } from "../instruction/geo/vector";
import { VarType, type BlockInstruction, type LinearInstruction } from "../instruction/instruction";
import { Vec2 } from "../world/vector";
import { ObjectRegister, Register, Registry, RegistryObject } from "./register";

export const VAR_TYPES = new Register<VarTypeRegistry>('var_types')

export const SET_ACCESSORS = new Register<SetAccessor>('set_accessors')
export const GET_ACCESSORS = new Register<GetAccessor>('get_accessors')
export const METHOD_ACCESSORS = new Register<MethodAccessor>('method_accessors')

export const LINEAR_INSTRUCTIONS = new ObjectRegister<LinearInstruction, LinearInstructionRegistry>('linear_instructions')
export const BLOCK_INSTRUCTIONS = new ObjectRegister<BlockInstruction, BlockInstructionRegistry>('block_instructions')

export class VarTypeRegistry extends Registry {

    static readonly BOOLEAN = VAR_TYPES.register(new VarTypeRegistry('bool'))

    static readonly BYTE = VAR_TYPES.register(new VarTypeRegistry('byte'))
    static readonly SHORT = VAR_TYPES.register(new VarTypeRegistry('short'))
    static readonly INT = VAR_TYPES.register(new VarTypeRegistry('int'))
    static readonly LONG = VAR_TYPES.register(new VarTypeRegistry('long'))
    static readonly FLOAT = VAR_TYPES.register(new VarTypeRegistry('float'))
    static readonly DOUBLE = VAR_TYPES.register(new VarTypeRegistry('double'))

    static readonly STRING = VAR_TYPES.register(new VarTypeRegistry('string'))

    static readonly VECTOR = VAR_TYPES.register(new VarTypeRegistry('vector'))

    constructor(
        readonly id: string,
        readonly codeCpp: string = id
    ) {
        super()
    }

    get(...generics: VarType[]): VarType {
        return new VarType(this, generics)
    }

    array(length: number, ...generics: VarType[]): VarType {
        return new VarType(this, generics, length)
    }

    toJson(): {} {
        return {
            id: this.id,
            codeCpp: this.codeCpp
        }
    }
}

export class LinearInstructionRegistry<Inputs extends BlockInstruction[] = any> extends RegistryObject<LinearInstruction<Inputs>> {

    static readonly NEW_VAR = LINEAR_INSTRUCTIONS.register(new LinearInstructionRegistry('new_var', NewVarInstruction.fromJson))
    static readonly SET_VAR = LINEAR_INSTRUCTIONS.register(new LinearInstructionRegistry('set_var', SetVarInstruction.fromJson))

    static readonly SET_ACCESSOR = LINEAR_INSTRUCTIONS.register(new LinearInstructionRegistry('set_accessor', SetAccessorInstruction.fromJson))
    static readonly METHOD_ACCESSOR = LINEAR_INSTRUCTIONS.register(new LinearInstructionRegistry('method_accessor', LinearMethodAccessorInstruction.fromJson))

    static readonly IF = LINEAR_INSTRUCTIONS.register(new LinearInstructionRegistry('if', IfInstruction.fromJson))
    static readonly FOR = LINEAR_INSTRUCTIONS.register(new LinearInstructionRegistry('for', ForInstruction.fromJson))
    static readonly WHILE = LINEAR_INSTRUCTIONS.register(new LinearInstructionRegistry('while', WhileInstruction.fromJson))

    static readonly RETURN = LINEAR_INSTRUCTIONS.register(new LinearInstructionRegistry('return', ReturnInstruction.fromJson))

    constructor(
        readonly id: string,
        readonly fromData: (json: any, id: string) => LinearInstruction<Inputs>
    ) {
        super()
    }

    fromJson(json: any): LinearInstruction<Inputs> {
        return this.fromData(json.data, this.id)
    }

    toJson(): {} {
        return {
            id: this.id
        }
    }
}

export class BlockInstructionRegistry<Output extends {} = any, Inputs extends BlockInstruction[] = any> extends RegistryObject<BlockInstruction<Output, Inputs>> {

    static readonly GET_VAR = BLOCK_INSTRUCTIONS.register(new BlockInstructionRegistry('get_var', GetVarInstruction.fromJson))

    static readonly GET_ACCESSOR = BLOCK_INSTRUCTIONS.register(new BlockInstructionRegistry('get_accessor', GetAccessorInstruction.fromJson))
    static readonly METHOD_ACCESSOR = BLOCK_INSTRUCTIONS.register(new BlockInstructionRegistry('method_accessor', MethodAccessorInstruction.fromJson))

    static readonly BYTE = BLOCK_INSTRUCTIONS.register(new BlockInstructionRegistry('byte', ByteInstruction.fromJson))
    static readonly SHORT = BLOCK_INSTRUCTIONS.register(new BlockInstructionRegistry('short', ShortInstruction.fromJson))
    static readonly INT = BLOCK_INSTRUCTIONS.register(new BlockInstructionRegistry('int', IntInstruction.fromJson))
    static readonly LONG = BLOCK_INSTRUCTIONS.register(new BlockInstructionRegistry('long', LongInstruction.fromJson))
    static readonly FLOAT = BLOCK_INSTRUCTIONS.register(new BlockInstructionRegistry('float', FloatInstruction.fromJson))
    static readonly DOUBLE = BLOCK_INSTRUCTIONS.register(new BlockInstructionRegistry('double', DoubleInstruction.fromJson))
    static readonly ADDITION = BLOCK_INSTRUCTIONS.register(new BlockInstructionRegistry('addition', AdditionInstruction.fromJson))
    static readonly SUBTRACTION = BLOCK_INSTRUCTIONS.register(new BlockInstructionRegistry('subtraction', SubtractionInstruction.fromJson))
    static readonly MULTIPLICATION = BLOCK_INSTRUCTIONS.register(new BlockInstructionRegistry('multiplication', MultiplicationInstruction.fromJson))
    static readonly DIVISION = BLOCK_INSTRUCTIONS.register(new BlockInstructionRegistry('division', DivisionInstruction.fromJson))
    static readonly POW = BLOCK_INSTRUCTIONS.register(new BlockInstructionRegistry('pow', PowInstruction.fromJson))
    static readonly SQRT = BLOCK_INSTRUCTIONS.register(new BlockInstructionRegistry('sqrt', SqrtInstruction.fromJson))
    static readonly LESS = BLOCK_INSTRUCTIONS.register(new BlockInstructionRegistry('less', LessInstruction.fromJson))
    static readonly LESS_EQUAL = BLOCK_INSTRUCTIONS.register(new BlockInstructionRegistry('less_equal', LessEqualInstruction.fromJson))
    static readonly GREATER_EQUAL = BLOCK_INSTRUCTIONS.register(new BlockInstructionRegistry('greater_equal', GreaterEqualInstruction.fromJson))
    static readonly GREATER = BLOCK_INSTRUCTIONS.register(new BlockInstructionRegistry('greater', GreaterInstruction.fromJson))

    static readonly BOOLEAN = BLOCK_INSTRUCTIONS.register(new BlockInstructionRegistry('boolean', BooleanInstruction.fromJson))
    static readonly AND = BLOCK_INSTRUCTIONS.register(new BlockInstructionRegistry('and', AndInstruction.fromJson))
    static readonly OR = BLOCK_INSTRUCTIONS.register(new BlockInstructionRegistry('or', OrInstruction.fromJson))
    static readonly NOT = BLOCK_INSTRUCTIONS.register(new BlockInstructionRegistry('not', NotInstruction.fromJson))

    static readonly EQUALS = BLOCK_INSTRUCTIONS.register(new BlockInstructionRegistry('equals', EqualsInstruction.fromJson))
    static readonly NOT_EQUALS = BLOCK_INSTRUCTIONS.register(new BlockInstructionRegistry('not_equals', NotEqualsInstruction.fromJson))
    static readonly TERNARY_OPERATOR = BLOCK_INSTRUCTIONS.register(new BlockInstructionRegistry('ternary_operator', TernaryOperatorInstruction.fromJson))

    static readonly STRING = BLOCK_INSTRUCTIONS.register(new BlockInstructionRegistry('string', StringInstruction.fromJson))

    static readonly VEC2 = BLOCK_INSTRUCTIONS.register(new BlockInstructionRegistry('vec2', Vec2Instruction.fromJson))
    static readonly NEW_VEC2 = BLOCK_INSTRUCTIONS.register(new BlockInstructionRegistry('new_vec2', NewVec2Instruction.fromJson))

    constructor(
        readonly id: string,
        readonly fromData: (json: any, id: string) => BlockInstruction<Output, Inputs>
    ) {
        super()
    }

    fromJson(json: any): BlockInstruction<Output, Inputs> {
        return this.fromData(json.data, this.id)
    }

    toJson(): {} {
        return {
            id: this.id
        }
    }
}

export class SetAccessor<Object extends { [key: string]: any } = {}, Value extends Object[keyof Object] = any> extends Registry {

    constructor(
        readonly id: string,
        readonly valueType: VarType,
        readonly set: (object: Object, value: Value) => void,
        readonly cppEncoder: string[],
        readonly includes: string[] = []
    ) {
        super()
    }

    static standard<Object extends { [key: string]: any }, Key extends keyof Object>(group: string, accessor: Key, valueType: VarType, cppEncoder?: string[], includes?: string[]): SetAccessor<Object, Object[Key]> {
        return new SetAccessor(`${group}.${accessor as string}`, valueType, (object, value) => object[accessor] = value, cppEncoder ?? [`$0.${accessor as string} = $1`], includes)
    }

    writeCpp(object: string, value: string): string[] {
        return this.cppEncoder.map((line) => line.replaceAll('$0', object).replaceAll('$1', value))
    }

    toJson(): {} {
        return {
            id: this.id,
            valueType: this.valueType.toJson(),
            cppEncoder: this.cppEncoder,
            includes: this.includes
        }
    }
}

export class GetAccessor<Object extends { [key: string]: any } = any, Value extends Object[keyof Object] = any> extends Registry {

    // Vec2
    static readonly VEC2_X: GetAccessor<Vec2, number> = GET_ACCESSORS.register(GetAccessor.standard('vec2', 'x', VarTypeRegistry.DOUBLE.get(), '$0[0]'))
    static readonly VEC2_Y: GetAccessor<Vec2, number> = GET_ACCESSORS.register(GetAccessor.standard('vec2', 'y', VarTypeRegistry.DOUBLE.get(), '$0[1]'))

    constructor(
        readonly id: string,
        readonly valueType: VarType,
        readonly get: (object: Object) => Value,
        readonly cppEncoder: string,
        readonly includes: string[] = []
    ) {
        super()
    }

    static standard<Object extends { [key: string]: any }, Key extends keyof Object>(group: string, accessor: Key, valueType: VarType, cppEncoder?: string, includes?: string[]): GetAccessor<Object, Object[Key]> {
        return new GetAccessor(`${group}.${accessor as string}`, valueType, (object) => object[accessor], cppEncoder ?? `$0.${accessor as string}`, includes)
    }

    writeCpp(object: string): string {
        return this.cppEncoder.replaceAll('$0', object)
    }

    toJson(): {} {
        return {
            id: this.id,
            valueType: this.valueType.toJson(),
            cppEncoder: this.cppEncoder,
            includes: this.includes
        }
    }
}

export class MethodAccessor<Object extends { [key: string]: any } = any, Return extends {} = any, Args extends any[] = any> extends Registry {

    // Vec2
    static readonly VEC2_ADD: MethodAccessor<Vec2, Vec2, [Vec2]> = METHOD_ACCESSORS.register(MethodAccessor.standard('vec2', 'add', VEC2_TYPE, [VEC2_TYPE], '{$0[0] + $1[0], $0[1] + $1[1]}'))
    static readonly VEC2_SUBTRACT: MethodAccessor<Vec2, Vec2, [Vec2]> = METHOD_ACCESSORS.register(MethodAccessor.standard('vec2', 'subtract', VEC2_TYPE, [VEC2_TYPE], '{$0[0] - $1[0], $0[1] - $1[1]}'))
    static readonly VEC2_SCALE: MethodAccessor<Vec2, Vec2, [number]> = METHOD_ACCESSORS.register(MethodAccessor.standard('vec2', 'scale', VEC2_TYPE, [VarTypeRegistry.DOUBLE.get()], '{$0[0] * $1, $0[1] * $1}'))
    static readonly VEC2_DISTANCE: MethodAccessor<Vec2, number, [Vec2]> = METHOD_ACCESSORS.register(MethodAccessor.standard('vec2', 'distance', VarTypeRegistry.DOUBLE.get(), [VEC2_TYPE], 'std::sqrt(std::pow($0[0] - $1[0], 2) + std::pow($0[1] - $1[1], 2))', ['<cmath>']))
    static readonly VEC2_LENGTH: MethodAccessor<Vec2, number, []> = METHOD_ACCESSORS.register(MethodAccessor.standard('vec2', 'length', VarTypeRegistry.DOUBLE.get(), [], 'std::sqrt(std::pow($0[0], 2) + std::pow($0[1], 2))', ['<cmath>']))

    constructor(
        readonly id: string,
        readonly returnType: VarType,
        readonly argsTypes: { [I in keyof Args]: VarType },
        readonly call: (object: Object, args: Args) => Return,
        readonly cppEncoder: string,
        readonly includes: string[] = []
    ) {
        super()
    }

    static standard<Object extends { [key: string]: any }, Return extends {}, Args extends any[]>(group: string, accessor: keyof Object, returnType: VarType, argsTypes: { [I in keyof Args]: VarType }, cppEncoder?: string, includes?: string[]): MethodAccessor<Object, Return, Args> {
        return new MethodAccessor(`${group}.${accessor as string}`, returnType, argsTypes, (object, args) => (object[accessor] as (...args: Args) => Return)(...args), cppEncoder ?? `$0.${accessor as string}(${argsTypes.map((type, i) => `$${i + 1}`).join(', ')})`, includes)
    }

    writeCpp(object: string, args: { [I in keyof Args]: string }): string {
        let encode = this.cppEncoder.replaceAll('$0', object)
        args.forEach((arg, i) => encode = encode.replaceAll(`$${i + 1}`, arg))
        return encode
    }

    toJson(): {} {
        return {
            id: this.id,
            returnType: this.returnType.toJson(),
            argsTypes: this.argsTypes.map((argType) => argType.toJson()),
            cppEncoder: this.cppEncoder,
            includes: this.includes
        }
    }
}