import { EmptyBuilder } from "../builder/generic/empty"
import { Permission, PermissionLevel } from "../connection/permission"
import { StructureEngineer, StructureReference } from "../engineer/data-pack/structure/structure"
import { StyleDependency } from "../engineer/data-pack/style/dependency"
import { getProject } from "../instance"
import { AbstractCommand, Command, CommandArgs, CommandParent } from "./commander"

export const commands: AbstractCommand[] = [
    new CommandParent('new', [
        new Command('structure', new CommandArgs(['ref']), PermissionLevel.of(Permission.WRITE_FILE), (commander, args) => {
            const ref = new StructureReference(args[0])
            const structure = new StructureEngineer(ref, StyleDependency.empty(), new EmptyBuilder())
            getProject(ref.pack).dataPack.engineers.structures.set(structure.reference.location, structure)
            structure.save()
            commander.info(`Created new structure engineer '${ref.toString()}'`)
        })
    ]),

    new Command('stop', CommandArgs.empty(), PermissionLevel.of(Permission.STOP_SERVER), (commander) => {
        commander.close()
        process.exit()
    })
]