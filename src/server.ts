import { WebSocketServer, WebSocket } from "ws"
import chalk from 'chalk'
import { v4 } from "uuid"

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

export type ServerOnMessage = Map<string, (data: any, ws: WsServerActions) => void>

export type OnMessage = Map<string, (data: any, ws: WsActions) => void>

export type WsServerActions = {
    respond: (data?: {}, err?: WebSocketError) => void,
    send: (path: string, data?: {}) => void,
    sendAll: (path: string, data?: {}) => void
}

export type WsActions = {
    respond: (data?: {}, err?: WebSocketError) => void,
    send: (path: string, data?: {}) => void
}

export class Server {

    private _wss: WebSocketServer | null = null

    private waitingRequests: Map<string, (data: any) => void> = new Map()

    open(port: number, onMessage: ServerOnMessage) {
        this._wss = new WebSocketServer({ port })

        console.log(`[ Socket ] |  OPEN  | WebSocketServer open on port ${port}`)

        this.wss.on('connection', (ws) => {
            console.log(`[ Socket ] |  JOIN  | Client Connected on port ${port}`)

            const respond = (id: string | undefined | null, data?: {}, err?: WebSocketError) => {
                if (id === undefined) {
                    console.log(chalk.red(`[ Socket ] |  RES   | ERR | Trying to respond without a response id`))
                } else {
                    ws.send(JSON.stringify({ id: id, data: data ?? {}, err: err }))
                }
            }

            ws.on('message', (data) => {
                try {
                    const message = JSON.parse(data.toString())

                    if (message.path) {
                        try {
                            const f = onMessage.get(message.path)
                            if (f) {
                                f(message.data, {
                                    respond: (data, err) => respond(message.id, data, err),
                                    send: (path, data) => this.send(ws, path, data),
                                    sendAll: (path, data) => this.sendAll(path, data)
                                })
                            } else {
                                console.log(chalk.redBright(`[ Socket ] |  GET   | ERR | Invalid Message Path : ${message.path}`))
                            }
                        } catch (error) {
                            respond(message.id ?? null, { path: message.path, data: message.data }, toSocketError(error))
                        }
                    } else {
                        if (message.err) {
                            console.log(chalk.redBright(`[ Socket ] |  GET   | ERR | Response Error : ${message.err.stack}`))
                        }
                        this.onResponse(message)
                    }
                } catch (error) {
                    console.log(chalk.redBright(`[ Socket ] |  GET   | ERR | Invalid Message`))
                    respond(null, {}, toSocketError(error))
                }
            })
        })
    }

    sendAll(path: string, data?: {}) {
        this.wss.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({ path, data }))
            }
        })
    }

    send(ws: WebSocket, path: string, data?: {}) {
        ws.send(JSON.stringify({ path, data: data ?? {} }))
    }

    private onResponse(res: WebSocketResponse) {
        const f = this.waitingRequests.get(res.id)
        if (f) {
            f(res.data)
            this.waitingRequests.delete(res.id)
        } else {
            console.log(chalk.redBright(`[ Socket ] |  GET   | ERR | Invalid Response ID: ${res.id}`))
        }
    }

    get wss(): WebSocketServer {
        return this._wss!
    }
}

export class Connection {

    private ws: WebSocket | null = null

    private waitingRequests: Map<string, (value: any) => void> = new Map()

    connectLocal(port: number, onMessage: OnMessage): Promise<void> {
        return this.connect(`ws://localhost:${port}`, onMessage)
    }

    connect(url: string, onMessage: OnMessage): Promise<void> {
        return new Promise((resolve) => {
            this.ws = new WebSocket(url)

            this.ws.onopen = () => {
                console.log(`Project Server Connected to WebSocketServer ${url}`)
                resolve()
            }

            this.ws.onmessage = (event) => {
                try {
                    const message = JSON.parse(event.data.toString())

                    if (message.path) {
                        try {
                            const f = onMessage.get(message.path)
                            if (f) {
                                f(message.data, {
                                    respond: (data, err) => this.respond(message.id, data, err),
                                    send: (path, data) => this.send(path, data)
                                })
                            } else {
                                console.log(chalk.redBright(`[ Socket ] |  GET   | ERR | Invalid Message Path : ${message.path}`))
                            }
                        } catch (error) {
                            this.respond(message.id ?? null, { path: message.path, data: message.data }, toSocketError(error))
                        }
                    } else {
                        if (message.err) {
                            console.log(chalk.redBright(`[ Socket ] |  GET   | ERR | Response Error : ${message.err.stack}`))
                        }
                        this.onResponse(message)
                    }
                } catch (error) {
                    console.log(chalk.redBright(`[ Socket ] |  GET   | ERR | Invalid Message`))
                }
            }

            this.ws.onclose = () => {
                console.warn('Connection WebSocket closed, trying to reconnect in 3s')
                setTimeout(() => this.connect(url, onMessage), 3000)
            }

            this.ws.onerror = (error) => {
                console.error('WebSocket Error: ', error)
            }
        })
    }

    disconnect() {
        this.ws!.close()
    }

    send(path: string, data?: {}) {
        this.ws!.send(JSON.stringify({ path, data: data ?? {} }))
    }

    request(path: string, data?: {}): Promise<any> {
        return new Promise((resolve) => {
            const id = v4()
            this.waitingRequests.set(id, resolve)
            this.ws!.send(JSON.stringify({ path: path, id: id, data: data ?? {} }))
        })
    }

    private respond = (id: string | undefined | null, data?: {}, err?: WebSocketError) => {
        if (id === undefined) {
            console.log(chalk.red(`[ Socket ] |  RES   | ERR | Trying to respond without a response id`))
        } else {
            this.ws!.send(JSON.stringify({ id: id, data: data ?? {}, err: err }))
        }
    }

    private onResponse(res: WebSocketResponse) {
        const f = this.waitingRequests.get(res.id)
        if (f) {
            f(res.data)
            this.waitingRequests.delete(res.id)
        } else {
            console.log(chalk.redBright(`[ Socket ] |  GET   | ERR | Invalid Response ID: ${res.id}`))
        }
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