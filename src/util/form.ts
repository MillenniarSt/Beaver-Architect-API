// ID -> Label | Label -> ID

export function idToLabel(id: string): string {
    return id.charAt(0).toLocaleUpperCase() + id.substring(1).replace('_', ' ')
}

export function identifierToLabel(identifier: string): string {
    return identifier.charAt(0).toLocaleUpperCase() + identifier.substring(1).replace('.', ' ')
}

export function fileToLabel(file: string): string {
    file = file.substring(file.lastIndexOf('\\') + 1)
    file = file.substring(file.lastIndexOf('/') + 1)
    return file.charAt(0).toLocaleUpperCase() + file.substring(1, file.lastIndexOf('.')).replace('_', ' ')
}

export function labelToId(label: string): string {
    return label.trim().toLowerCase().replace(' ', '_')
}

export function labelToIdentifier(label: string): string {
    return label.trim().toLowerCase().replace(' ', '.')
}

export function labelToFile(label: string, extension: string = 'json', dir?: string): string {
    return `${dir ? dir : ''}${label.trim().toLowerCase().replace(' ', '_')}.${extension}`
}

// Form

export class Form {

    constructor(
        public inputs: Record<string, FormDataInput>
    ) { }

    update(id: string, value: any) {
        this.inputs[id].update(value, true)
    }

    toJson() {
        return {
            inputs: Object.entries(this.inputs).map(([key, input]) => Object.defineProperty(input, 'id', { value: key }))
        }
    }
}

export type FormData = {
    inputs: FormDataInputRegistered[]
}

export type FormOutput<V = any> = {
    id: string,
    value: V,
    isValid: boolean
}

export function formEdit(output: FormOutput, id: string, edit: (value: any) => void, validate: boolean = true) {
    if (output.id === id && !(validate && !output.isValid)) {
        edit(output.value)
    }
}

// Form Inputs

export type FormDataInputRegistered = (
    | CheckboxInputData
    | TextInputData
    | ColorPickerInputData
    | ListboxInputData
    | NumberInputData
    | SelectInputData
    | NumberLimitationInputData
)

export type FormDataInput<T extends string = string, V extends {} | null = any, O extends {} | undefined = any, D extends {} = any, S extends {} = RequiredValidator> = {
    type: T,
    value?: V,
    options?: O,
    display?: D,
    validators?: S,
    disabled?: boolean,

    update(value: V, isValid: boolean): V | undefined
}

export type CheckboxInputData = FormDataInput<'checkbox', boolean, undefined, {
    label?: string
    variant?: 'filled' | 'outlined'
}>

export type TextInputData = FormDataInput<'text', string, undefined, {
    label?: string
    placeholder?: string
    variantLabel?: 'in' | 'over' | 'on'
}>

export type ColorPickerInputData = FormDataInput<'color_picker', string, {
    format?: 'rgb' | 'hsb'
}, {
    label?: string
    inline?: boolean
}>

export type ListboxInputData = FormDataInput<'listbox', string | null, {
    nullable?: boolean
    multiple?: boolean
    items: {
        label: string
        code: string
    }[]
}, {
    label?: string
    checkmark?: boolean
    filter?: boolean
}>

export type NumberInputData = FormDataInput<'number', number, undefined, {
    label?: string
    placeholder?: string
    variantLabel?: 'in' | 'over' | 'on',
    prefix?: string
    suffix?: string
}, NumberValidator>

export type SelectInputData = FormDataInput<'select', string | null, {
    nullable?: boolean
    editable?: boolean
    items: {
        label: string
        code: string
    }[]
}, {
    label?: string
    placeholder?: string
    variantLabel?: 'in' | 'over' | 'on'
    variant?: 'filled' | 'outlined'
    filter?: boolean
}>

export type NumberLimitationInputData = FormDataInput<'number-limitation', {
    n: number,
    min?: number,
    max?: number
}, undefined, {
    label?: string
    placeholder?: string
    variantLabel?: 'in' | 'over' | 'on',
    prefix?: string
    suffix?: string
}, NumberValidator>

// Form Validators

export type RequiredValidator = {
    required?: boolean
}

export type NumberValidator = {
    greater?: number
    greaterEquals?: number
    lessEquals?: number
    less?: number
}