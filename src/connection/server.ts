import { WebSocketServer, WebSocket } from "ws"
import chalk from 'chalk'
import { v4 } from "uuid"
import { ArchitectSide, ClientSide, Side } from "./sides.js"

export type WebSocketMessage = {
    path: string,
    id?: string,
    data: {}
}

export type WebSocketResponse = {
    id: string,
    data?: {},
    err?: WebSocketError
}

export type WebSocketError = {
    name: string,
    message: string,
    stack: string,
    errno: string,
    syscall: string
}

export type OnMessage = Map<string, (data: any, sender: Side, id?: string) => void>

export type ServerOnMessage = Map<string, (data: any, client: ClientSide, id?: string) => void>
export type ArchitectOnMessage = Map<string, (data: any, client: ArchitectSide, id?: string) => void>

/*export type WsServerActions = {
    respond: (data?: {}, err?: WebSocketError) => void,
    send: (path: string, data?: {}) => void,
    sendAll: (path: string, data?: {}) => void
}

export type WsActions = {
    respond: (data?: {}, err?: WebSocketError) => void,
    send: (path: string, data?: {}) => void
}*/

export class Server {

    private _wss: WebSocketServer | null = null

    private clients: ClientSide[] = []

    open(port: number, onMessage: ServerOnMessage) {
        this._wss = new WebSocketServer({ port })

        console.log(`[ Socket ] |  OPEN  | WebSocketServer open on port ${port}`)

        this.wss.on('connection', (ws) => {
            console.log(`[ Socket ] |  JOIN  | Client Connected on port ${port}`)

            const client = new ClientSide(ws)
            this.clients.push(client)

            ws.on('message', (data) => {
                try {
                    const message = JSON.parse(data.toString())

                    if (message.path) {
                        try {
                            const f = onMessage.get(message.path)
                            if (f) {
                                f(message.data, client, message.id)
                            } else {
                                console.error(`[ Socket ] |  GET   | Invalid Message Path : ${message.path}`)
                            }
                        } catch (error) {
                            client.respond(message.id ?? null, { path: message.path, data: message.data }, toSocketError(error))
                        }
                    } else {
                        if (message.err) {
                            console.error(`[ Socket ] |  GET   | Response Error : ${message.err.stack}`)
                        }
                        client.onResponse(message)
                    }
                } catch (error) {
                    console.error(`[ Socket ] |  GET   | Invalid Message`)
                    client.send('error', toSocketError(error))
                }
            })
        })
    }

    sendAll(path: string, data?: {}) {
        this.clients.forEach((client) => {
            client.send(path, data)
        })
    }

    get wss(): WebSocketServer {
        return this._wss!
    }
}

export function toSocketError(err: any): WebSocketError {
    return {
        name: err.name,
        message: err.message,
        stack: err.stack,
        errno: err.errno,
        syscall: err.syscall
    }
}