//             _____
//         ___/     \___        |  |
//      ##/  _.- _.-    \##  -  |  |                       -
//      ##\#=_  '    _=#/##  |  |  |  /---\  |      |      |   ===\  |  __
//      ##   \\#####//   ##  |  |  |  |___/  |===\  |===\  |   ___|  |==/
//      ##       |       ##  |  |  |  |      |   |  |   |  |  /   |  |
//      ##       |       ##  |  \= \= \====  |   |  |   |  |  \___/  |
//      ##\___   |   ___/
//      ##    \__|__/
//

import { v4 } from "uuid"
import { WebSocket } from "ws"
import { WebSocketError, WebSocketResponse } from "./server.js"
import { ClientDirector } from "./director.js"

export abstract class Side {

    protected waitingRequests: Map<string, (data: any) => void> = new Map()

    constructor(
        readonly socket: WebSocket
    ) { }

    send(path: string, data?: {} | null) {
        this.socket.send(JSON.stringify({ path, data: data ?? {} }))
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

    onResponse(res: WebSocketResponse) {
        const f = this.waitingRequests.get(res.id)
        if (f) {
            f(res.data)
            this.waitingRequests.delete(res.id)
        } else {
            console.error(`[ Socket ] |  GET   | Invalid Response ID: ${res.id}`)
        }
    }
}

export type ClientHistoryDo = {
    undo: () => Promise<void>
    redo: () => Promise<void>
}

export class ClientSide extends Side {

    protected history: ClientHistoryDo[] = []
    protected historyIndex = 0

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
}

export class ArchitectSide extends Side {

}