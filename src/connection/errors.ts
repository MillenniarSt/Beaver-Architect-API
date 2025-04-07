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

export class PermissionDenided extends InternalServerError {

    constructor(readonly side: Side, readonly permission: Permission) {
        super(`${side.identfier} has not the permission '${permission.id}'`)
    }
}

export class IdNotExists extends InternalServerError {

    constructor(readonly id: string, ...context: string[]) {
        super(`Id [${id}] does not exists in ${context.join('/')}`)
    }
}

export class IdAlreadyExists extends InternalServerError {

    constructor(readonly id: string, ...context: string[]) {
        super(`Id [${id}] already exists in ${context.join('/')}`)
    }
}

export class NameNotRegistered extends InternalServerError {

    constructor(readonly name: string, ...context: string[]) {
        super(`Name '${name}' is not registered in ${context.join('/')}`)
    }
}

export class ListEmptyError extends InternalServerError {

    constructor(readonly list: string) {
        super(`Can not get an item from the list '${list}': it is empty`)
    }
}