import { EmptyBuilder } from "../builder/generic/empty"
import { PERMISSIONS } from "../connection/permission"
import { server } from "../connection/server"
import { StructureEngineer, StructureReference } from "../engineer/data-pack/structure/structure"
import { StyleDependency } from "../engineer/data-pack/style/dependency"
import { Style, StyleReference } from "../engineer/data-pack/style/style"
import { close, getProject } from "../instance"
import { AbstractCommand, Command, CommandArgs, CommandParent } from "./commander"

export const commands: AbstractCommand[] = [
    new CommandParent('new', [
        new Command('style', new CommandArgs(['ref']), (commander, args) => {
            commander.side.ensurePermission(PERMISSIONS.MANAGE_STYLE)
            const ref = new StyleReference(args[0])
            const style = new Style(ref)
            getProject(ref.pack).dataPack.styles.set(style.reference.location, style)
            style.save()
            commander.info(`Created new style '${ref.toString()}'`)
        }),
        new Command('structure', new CommandArgs(['ref']), (commander, args) => {
            commander.side.ensurePermission(PERMISSIONS.MANAGE_STRUCTURE_ENGINEER)
            const ref = new StructureReference(args[0])
            const structure = new StructureEngineer(ref, StyleDependency.empty(), new EmptyBuilder())
            getProject(ref.pack).dataPack.structures.set(structure.reference.location, structure)
            structure.save()
            commander.info(`Created new structure engineer '${ref.toString()}'`)
        })
    ]),

    new CommandParent('client', [
        new Command('list', CommandArgs.empty(), (commander, args) => {
            if(server.clients.length === 0) {
                commander.info('No clients connected')
            } else {
                commander.info(`Connected clients: ${server.clients.map((client) => client.identfier).join(', ')}`)
            }
        }),
        new Command('close', new CommandArgs(['id']), (commander, args) => {
            commander.side.ensurePermission(PERMISSIONS.MANAGE_USER)
            const client = server.clients.find((client) => client.identfier === args[0])
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