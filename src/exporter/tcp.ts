import type { Terrain } from "../project/terrain";
import net, { Server, Socket } from 'net'
import type { Seed } from "../builder/random/random";
import { BufferFixedListScheme, BufferIntScheme, type BufferFormat, type BufferScheme } from "../util/buffer";
import { Vec3 } from "../world/vector";
import type { GenerationStyle } from "../engineer/data-pack/style/rule";
import type { Style } from "../engineer/data-pack/style/style";
import { getArchitectSide } from "../instance";
import type { ArchitectSide } from "../connection/sides";
import { BuilderFlatResult } from "../builder/builder";

type TcpMessage<T extends BufferFormat = any> = { scheme: BufferScheme<T>, handler: (data: T) => Promise<Buffer | void> }

export abstract class TcpExporter {

    protected server?: Server

    protected architect?: Socket
    protected clients: Socket[] = []

    protected messageIndex: number = 0
    protected waitingRequests: Map<number, (buffer: Buffer) => void> = new Map()

    constructor(
        readonly port: number
    ) { }

    open(): Promise<boolean> {
        console.log(`[TCP ${this.port}] Opening TCP Terrain Export on port ${this.port}`)

        return new Promise((resolve) => {
            this.server = net.createServer((socket) => {
                console.log(`[TCP ${this.port}] Client connected from ${socket.remoteAddress}:${socket.remotePort}, waiting for identification`)
                let identity: number = -1
                setTimeout(() => {
                    if (this.server && identity === -1) {
                        console.error(`[TCP ${this.port}] Can not identify ${socket.remoteAddress}:${socket.remotePort} [time of 5s expired]`)
                        socket.destroy({ name: 'Invalid Identification', message: 'Can not identify socket in 5s' })
                    }
                }, 5000)

                let messageLength: number = -1
                let receivedBytes: number
                let receivedBuffer: Buffer<ArrayBuffer>

                socket.on('data', (data) => {
                    try {
                        if (messageLength === -1) {
                            messageLength = data.readUInt32BE(0)
                            receivedBytes = 0
                            receivedBuffer = Buffer.alloc(messageLength)
                        }

                        data.copy(receivedBuffer, receivedBytes)
                        receivedBytes += data.length

                        if (receivedBytes >= messageLength) {
                            if (identity === -1) {
                                identity = this.setIdentity(socket, receivedBuffer.readUInt8(4), receivedBuffer.readInt32BE(5))
                            } else {
                                this.onMessage(socket, receivedBuffer.readUInt8(4), receivedBuffer.readInt32BE(5), receivedBuffer.subarray(9))
                            }
                            messageLength = -1
                        }
                    } catch (err) {
                        console.error(`[TCP ${this.port}] Error parsing socket data: ${err}`)
                    }
                })

                socket.on('end', () => {
                    console.info(`[TCP ${this.port}] Client disconnected from ${socket.remoteAddress}:${socket.remotePort}`)
                    switch (identity) {
                        case 0:
                            this.clients.splice(this.clients.findIndex((client) => client === socket), 1)
                            break
                        case 1:
                            this.architect = undefined
                            break
                    }
                })
                socket.on('error', (err) => console.error(`[TCP ${this.port}] Client error from ${socket.remoteAddress}:${socket.remotePort}: ${err}`))
            })

            this.server.listen(this.port, () => {
                console.info(`[TCP ${this.port}] Opened TCP Terrain Export on port ${this.port}`)
                this.requestArchitectToJoin().then((err) => {
                    if (err !== undefined) {
                        console.error(`[TCP ${this.port}] Architect connection refused: ${err}`)
                    }
                    resolve(err === undefined)
                })
            })
        })
    }

    protected setIdentity(socket: Socket, identity: number, messageIndex: number): number {
        switch (identity) {
            case 0:
                this.clients.push(socket)
                console.info(`[TCP ${this.port}] Client ${socket.remoteAddress}:${socket.remotePort} connected as client`)
                break
            case 1:
                if (this.architect) {
                    socket.destroy({ name: 'New Architect', message: 'Connected new architect' })
                }
                this.architect = socket
                console.info(`[TCP ${this.port}] Client ${socket.remoteAddress}:${socket.remotePort} connected as architect`)
                break
            default:
                console.error(`[TCP ${this.port}] Invalid identification for ${socket.remoteAddress}:${socket.remotePort} [code ${identity}]`)
                identity = -1
        }
        if (identity !== -1) {
            this.respond(socket, messageIndex, Buffer.from([1]))
        } else {
            this.respond(socket, messageIndex, Buffer.from([0]))
        }
        return identity
    }

    protected onMessage(socket: Socket, messageId: number, messageIndex: number, data: Buffer) {
        if (messageId === 0) {
            const resolveRequest = this.waitingRequests.get(messageIndex)
            if (resolveRequest) {
                resolveRequest(data)
                this.waitingRequests.delete(messageIndex)
            } else {
                console.warn(`[TCP ${this.port}] No waiting request for message index ${messageIndex}`)
            }
        } else {
            const message = this.messageHandlers[messageId]
            if (message) {
                try {
                    message.handler(message.scheme.readAll(data)).then((response) => {
                        if (response !== undefined) {
                            this.respond(socket, messageIndex, response)
                        }
                    })
                } catch (err) {
                    console.error(`[TCP ${this.port}] Error executing handler of message ${messageId}: ${err}`)
                }
            } else {
                console.warn(`[TCP ${this.port}] Invalid message id [${messageId}]`)
            }
        }
    }

    protected writeTo(socket: Socket, messageId: number, messageIndex: number, buffer: Buffer) {
        if (!socket) {
            console.error(`[TCP ${this.port}] Can not write data to an undefined socket`)
            return
        }

        const bufferToSend = Buffer.alloc(9 + buffer.length)
        bufferToSend.writeUInt32BE(bufferToSend.length, 0)
        bufferToSend.writeUInt8(messageId, 4)
        bufferToSend.writeInt32BE(messageIndex, 5)
        buffer.copy(bufferToSend, 9)
        socket.write(bufferToSend)
    }

    protected respond(socket: Socket, messageIndex: number, buffer: Buffer) {
        this.writeTo(socket, 0, messageIndex, buffer)
    }

    send(socket: Socket, messageId: number, buffer: Buffer) {
        this.messageIndex++
        this.writeTo(socket, messageId, this.messageIndex - 1, buffer)
    }

    request(socket: Socket, messageId: number, buffer: Buffer): Promise<Buffer> {
        return new Promise((resolve) => {
            this.messageIndex++
            this.writeTo(socket, messageId, this.messageIndex - 1, buffer)
            this.waitingRequests.set(this.messageIndex - 1, resolve)
        })
    }

    requestArchitectToJoin(side: ArchitectSide = getArchitectSide()): Promise<string | undefined> {
        return side.request('exporter/tcp', this.architectJoinMessage)
    }

    protected abstract get architectJoinMessage(): { type: string, port: number }

    close(): Promise<boolean> {
        return new Promise((resolve) => {
            this.server?.close((err) => {
                if (err) {
                    console.error(`[TCP ${this.port}] Fail to close server: ${err}`)
                    resolve(false)
                } else {
                    console.info(`[TCP ${this.port}] Closed server`)
                    this.server = undefined
                    resolve(true)
                }
            })
        })
    }

    get isOpen(): boolean {
        return this.server !== undefined
    }

    protected abstract messageHandlers: Record<number, TcpMessage>
}

export type TcpTerrainExporterMessages = {
    1: TcpMessage<number[]>     // Generate chunk at x, y, z
}

export class TcpTerrainExporter extends TcpExporter {

    readonly generationStyle: GenerationStyle

    constructor(
        port: number,
        readonly terrain: Terrain,
        readonly style: Style,
        readonly seed: Seed
    ) {
        super(port)
        this.generationStyle = style.toGenerationStyle(seed)
    }

    protected get architectJoinMessage() {
        return { type: 'terrain', port: this.port, seed: this.seed.seed }
    }

    protected messageHandlers: TcpTerrainExporterMessages = {
        1: {
            scheme: new BufferFixedListScheme(new BufferIntScheme(), 3),
            handler: (data) => this.buildChunk(Vec3.fromJson(data))
        }
    }

    buildChunk(pos: Vec3): Promise<Buffer> {
        let result = this.terrain.buildChunk(pos, this.generationStyle, this.seed)
        return this.request(this.architect!, 1, BuilderFlatResult.materialsBufferScheme.writeAll(result.materialsToBufferFormat()))
    }
}