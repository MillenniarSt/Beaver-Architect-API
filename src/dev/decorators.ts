enum Mode {
    DEBUG, DEV, TEST, RELEASE
}

const MODE: Mode = Mode.DEBUG

export function CauseError(note?: string) {
    return (target: any, propertyKey?: string | symbol, descriptorOrIndex?: number | PropertyDescriptor) => {
        const location = propertyKey ? `${target.constructor.name}.${String(propertyKey)}` : target.name
        console.error(`Called or used a code than will cause errors [${location}]${note ? `: ${note}` : ''}`)
    }
}

export function TODO(note?: string) {
    return (target: any, propertyKey?: string | symbol, descriptorOrIndex?: number | PropertyDescriptor) => {
        const location = propertyKey ? `${target.constructor.name}.${String(propertyKey)}` : target.name
        console.warn(`Called or used a TODO code [${location}]${note ? `: ${note}` : ''}`)
    }
}

export function NotTested(note?: string) {
    return (target: any, propertyKey?: string | symbol, descriptorOrIndex?: number | PropertyDescriptor) => {
        const location = propertyKey ? `${target.constructor.name}.${String(propertyKey)}` : target.name
        console.warn(`Called or used a NOT tested code (it can cause errors) [${location}]${note ? `: ${note}` : ''}`)
    }
}

export function UnSafe(note?: string) {
    return (target: any, propertyKey?: string | symbol, descriptorOrIndex?: number | PropertyDescriptor) => {
        if (MODE <= Mode.DEBUG) {
            const location = propertyKey ? `${target.constructor.name}.${String(propertyKey)}` : target.name
            console.warn(`Called or used UNSAFE code [${location}]${note ? `: ${note}` : ''}`)
        }
    }
}