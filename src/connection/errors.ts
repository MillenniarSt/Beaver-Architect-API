//             _____
//         ___/     \___        |  |
//      ##/  _.- _.-    \##  -  |  |                       -
//      ##\#=_  '    _=#/##  |  |  |  /---\  |      |      |   ===\  |  __
//      ##   \\#####//   ##  |  |  |  |___/  |===\  |===\  |   ___|  |==/
//      ##       |       ##  |  |  |  |      |   |  |   |  |  /   |  |
//      ##       |       ##  |  \= \= \====  |   |  |   |  |  \___/  |
//      ##\___   |   ___/
//      ##    \__|__/

import type { Permission } from "./permission.js";
import { type WebSocketError } from "./server.js";
import type { Side } from "./sides.js";

export abstract class ServerProblem extends Error {

    severity: 'warn' | 'error' | 'fatal' = 'error'

    abstract print(): string

    abstract toSocketError(): WebSocketError

    warn() {
        this.severity = 'warn'
    }

    fatal() {
        this.severity = 'fatal'
    }
}

export class InternalServerError extends ServerProblem {

    print(): string {
        return `${this.name}: ${this.message}`
    }

    toSocketError(): WebSocketError {
        return {
            severity: this.severity,
            name: this.name,
            message: this.message,
            stack: this.stack
        }
    }
}

// Utils error classes

export class PermissionDenied extends InternalServerError {

    constructor(readonly side: Side, readonly permission: Permission) {
        super(`${side.identifier} has not the permission '${permission.id}'`)
    }
}

export class IdNotExists extends InternalServerError {

    constructor(readonly id: string, ...context: string[]) {
        super(`Id [${id}] does not exists in ${context.join('/')}`)
    }
}

export class IndexOutOfBounds extends InternalServerError {

    constructor(readonly index: number, readonly size: number, ...context: string[]) {
        super(`Index [${index}] out of bound ${size} in ${context.join('/')}`)
    }
}

export class IdAlreadyExists extends InternalServerError {

    constructor(readonly id: string, ...context: string[]) {
        super(`Id [${id}] already exists in ${context.join('/')}`)
    }
}

export class KeyNotRegistered extends InternalServerError {

    constructor(readonly key: string, ...context: string[]) {
        super(`Key '${key}' is not registered in ${context.join('/')}`)
    }
}

export class InvalidInstance extends InternalServerError {

    constructor(readonly instance: any, readonly requiredInstance: any, ...context: string[]) {
        super(`Instance [${instance} type of ${typeof instance}] is not of ${requiredInstance} in ${context.join('/')}`)
    }
}

export class ListEmptyError extends InternalServerError {

    constructor(readonly list: string) {
        super(`Can not get an item from the list '${list}': it is empty`)
    }
}