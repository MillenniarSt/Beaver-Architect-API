//             _____
//         ___/     \___        |  |
//      ##/  _.- _.-    \##  -  |  |                       -
//      ##\#=_  '    _=#/##  |  |  |  /---\  |      |      |   ===\  |  __
//      ##   \\#####//   ##  |  |  |  |___/  |===\  |===\  |   ___|  |==/
//      ##       |       ##  |  |  |  |      |   |  |   |  |  /   |  |
//      ##       |       ##  |  \= \= \====  |   |  |   |  |  \___/  |
//      ##\___   |   ___/
//      ##    \__|__/

import { EmptyBuilder } from "../builder/generic/empty"
import { Director } from "../connection/director"
import { PERMISSIONS } from "../connection/permission"
import { server } from "../connection/server"
import { Component, ComponentReference } from "../engineer/data-pack/component/component"
import { StructureEngineer, StructureReference } from "../engineer/data-pack/structure/structure"
import { Style, StyleReference } from "../engineer/data-pack/style/style"
import { close } from "../instance"
import { GeoRegistry } from "../register/geo"
import { AbstractCommand, Command, CommandArgs, CommandParent } from "./commander"

export const commands: AbstractCommand[] = [
    new Command('help', CommandArgs.empty(), (commander) => {
        commander.info(`Commands: ${commander.commands.entries().toArray().map(([key, command]) => key).join(', ')}`)
    }),

    new CommandParent('new', [
        new Command('style', new CommandArgs(['ref']), (commander, args) => {
            commander.side.ensurePermission(PERMISSIONS.MANAGE_STYLE)
            const ref = new StyleReference(args[0])
            const style = new Style(ref)
            Style.create(new Director(commander.side), style)
            commander.info(`Created new style '${ref.toString()}'`)
        }),
        new Command('component', new CommandArgs(['ref']), (commander, args) => {
            commander.side.ensurePermission(PERMISSIONS.MANAGE_COMPONENT)
            const ref = new ComponentReference(args[0])
            const component = new Component(ref, GeoRegistry.RECT2, EmptyBuilder.VOID)
            Component.create(new Director(commander.side), component)
            commander.info(`Created new component '${ref.toString()}'`)
        })
    ]),

    new CommandParent('client', [
        new Command('list', CommandArgs.empty(), (commander, args) => {
            if(server.clients.length === 0) {
                commander.info('No clients connected')
            } else {
                commander.info(`Connected clients: ${server.clients.map((client) => client.identifier).join(', ')}`)
            }
        }),
        new Command('close', new CommandArgs(['id']), (commander, args) => {
            commander.side.ensurePermission(PERMISSIONS.MANAGE_USER)
            const client = server.clients.find((client) => client.identifier === args[0])
            if(client) {
                client.socket.close()
                commander.info(`Disonnected client ${args[0]}`)
            } else {
                commander.error(`Can not find client with id ${args[0]}`)
            }
        }),
    ]),

    new Command('stop', CommandArgs.empty(), (commander) => {
        commander.side.ensurePermission(PERMISSIONS.STOP_SERVER)
        close()
    })
]