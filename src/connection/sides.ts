import { v4 } from "uuid"
import { WebSocket } from "ws"
import { WebSocketError, WebSocketResponse } from "./server.js"

export abstract class Side {

    protected waitingRequests: Map<string, (data: any) => void> = new Map()

    constructor(
        readonly socket: WebSocket
    ) { }

    send(path: string, data?: {}) {
        this.socket.send(JSON.stringify({ path, data: data ?? {} }))
    }

    request(path: string, data?: {}): Promise<any> {
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

export class ClientSide extends Side {

    
}

export class ArchitectSide extends Side {

}