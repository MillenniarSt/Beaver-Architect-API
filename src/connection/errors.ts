import type { Permission } from "./permission.js";
import { type WebSocketError } from "./server.js";
import type { Side } from "./sides.js";

export abstract class ServerProblem extends Error {

    abstract toSocketError(): WebSocketError
}

export class InternalServerWarn extends ServerProblem {

    toSocketError(): WebSocketError {
        return {
            severity: 'warn',
            name: this.name,
            message: this.message,
            stack: this.stack
        }
    }
}

export class InternalServerError extends ServerProblem {

    toSocketError(): WebSocketError {
        return {
            severity: 'error',
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