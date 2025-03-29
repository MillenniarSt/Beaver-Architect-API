//             _____
//         ___/     \___        |  |
//      ##/  _.- _.-    \##  -  |  |                       -
//      ##\#=_  '    _=#/##  |  |  |  /---\  |      |      |   ===\  |  __
//      ##   \\#####//   ##  |  |  |  |___/  |===\  |===\  |   ___|  |==/
//      ##       |       ##  |  |  |  |      |   |  |   |  |  /   |  |
//      ##       |       ##  |  \= \= \====  |   |  |   |  |  \___/  |
//      ##\___   |   ___/
//      ##    \__|__/

import { v4 } from "uuid"
import { WebSocket } from "ws"
import { type WebSocketError, type WebSocketResponse } from "./server.js"
import { Editor } from "../engineer/editor.js"
import { ResourceReference } from "../engineer/engineer.js"
import type { PermissionLevel } from "./permission.js"

export abstract class Side {

    constructor(
        readonly permissions: PermissionLevel
    ) { }

    abstract get identfier(): string

    abstract send(path: string, data?: {} | null): void

    abstract sendChannel(channel: string, data?: {} | null): void

    abstract request(path: string, data?: {} | null): Promise<any>

    abstract respond(id: string | undefined | null, data: {}, err?: WebSocketError): void

    abstract onResponse(res: WebSocketResponse): void

    abstract openChannel(id: string, data: any, onMessage: (data: {} | null) => void): Promise<(data: {} | null) => void>

    abstract isRunningChannel(id: string): boolean

    abstract closeChannel(id: string): void
}

export abstract class SocketSide extends Side {

    protected waitingRequests: Map<string, (data: any) => void> = new Map()
    protected channels: Map<string, (data: {} | null) => void> = new Map()

    constructor(readonly socket: WebSocket, permissions: PermissionLevel) {
        super(permissions)
    }

    send(path: string, data?: {} | null) {
        this.socket.send(JSON.stringify({ path, data: data ?? {} }))
    }

    sendChannel(channel: string, data?: {} | null) {
        this.socket.send(JSON.stringify({ channel, data: data ?? {} }))
    }

    request(path: string, data?: {} | null): Promise<any> {
        return new Promise((resolve) => {
            const id = v4()
            this.waitingRequests.set(id, resolve)
            this.socket.send(JSON.stringify({ path: path, id: id, data: data ?? {} }))
        })
    }

    respond(id: string | undefined | null, data: {}, err?: WebSocketError) {
        if (id === undefined) {
            console.error(`[ Socket ] |  RES   | Trying to respond without a response id`)
        } else {
            this.socket.send(JSON.stringify({ id: id, data: data, err: err }))
        }
    }

    onResponse(res: any) {
        if (res.channel) {
            const f = this.channels.get(res.channel)
            if (f) {
                f(res.data)
            } else {
                console.error(`Invalid Channel ID: ${res.channel}`)
            }
        } else if (res.id) {
            const f = this.waitingRequests.get(res.id)
            if (f) {
                f(res.data)
                this.waitingRequests.delete(res.id)
            } else {
                console.error(`Invalid Response ID: ${res.id}`)
            }
        } else {
            console.warn(`Message is not a Response: ${res}`)
        }
    }

    async openChannel<T extends {} | null>(id: string, data: any, onMessage: (data: T) => void): Promise<(data: {} | null) => void> {
        await this.request('open-channel', { id, data })
        this.channels.set(id, onMessage as (data: {} | null) => void)
        return (data) => {
            this.sendChannel(id, data)
        }
    }

    isRunningChannel(id: string): boolean {
        return this.channels.has(id)
    }

    closeChannel(id: string): void {
        this.send('close-channel', id)
        this.channels.delete(id)
    }
}

export type ClientHistoryDo = {
    undo: () => Promise<void>
    redo: () => Promise<void>
}

export class ClientSide extends SocketSide {

    protected history: ClientHistoryDo[] = []
    protected historyIndex = 0

    get identfier(): string {
        return 'TODO client' // TODO
    }

    do(update: ClientHistoryDo) {
        if (this.historyIndex < this.history.length) {
            this.history = this.history.slice(0, this.historyIndex + 1)
        }
        this.history.push(update)
        this.historyIndex++
    }

    async undo() {
        if (this.historyIndex > 0) {
            this.historyIndex--
            await this.history[this.historyIndex].undo()
        }
    }

    async redo() {
        if (this.historyIndex < this.history.length) {
            await this.history[this.historyIndex].redo()
            this.historyIndex++
        }
    }

    info(message: string) {
        this.send('message', { severity: 'info', summary: 'Info', detail: message })
    }

    warn(message: string) {
        this.send('message', { severity: 'warn', summary: 'Warn', detail: message })
    }

    error(message: string) {
        this.send('message', { severity: 'error', summary: 'Error', detail: message })
    }

    protected editors: Map<string, Editor> = new Map()

    openEditor(ref: ResourceReference, extension: string): Editor {
        let editor = this.getEditor(ref, extension)
        if(!editor) {
            editor = Editor.get(ref, extension)
            this.editors.set(this.getUniqueEditorId(ref, extension), editor)
        }
        return editor
    }

    getEditor(ref: ResourceReference, extension: string): Editor | undefined {
        return this.editors.get(this.getUniqueEditorId(ref, extension))
    }

    closeEditor(ref: ResourceReference, extension: string) {
        this.editors.delete(this.getUniqueEditorId(ref, extension))
    }

    protected getUniqueEditorId(ref: ResourceReference, extension: string): string {
        return `${ref.toString()}$${extension}`
    }
}

export class ArchitectSide extends SocketSide {

    get identfier(): string {
        return 'architect'
    }
}

export class ServerSide extends Side {

    get identfier(): string {
        return 'server'
    }

    send(path: string, data?: {} | null): void {
        console.warn('A Server Side can not send data')
    }

    async request(path: string, data?: {} | null): Promise<any> {
        console.warn('A Server Side can not receive Requests')
    }

    sendChannel(channel: string, data?: {} | null): void {
        console.warn('A Server Side can not send data to Channels')
    }

    respond(id: string | undefined | null, data: {}, err?: WebSocketError): void {
        console.warn('A Server Side can not respond')
    }

    onResponse(res: WebSocketResponse): void { }

    async openChannel(id: string, onMessage: (data: {} | null) => void): Promise<(data: {} | null) => void> {
        console.warn('A Server Side can not open Channels')
        return (data) => { }
    }

    isRunningChannel(id: string): boolean {
        return false
    }

    closeChannel(id: string): void {
        console.warn('A Server Side can not close Channels')
    }
}