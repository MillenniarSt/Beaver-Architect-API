import { EmptyBuilder } from "../../../builder/generic/empty.js";
import { type ServerOnMessage } from "../../../connection/server.js";
import { getProject } from "../../../instance.js";
import { StyleDependency } from "../style/dependency.js";
import { StructureEngineer, StructureReference } from "./structure.js";

export function registerEnStructureMessages(onMessage: ServerOnMessage) {
    onMessage.set('data-pack/structures/create', (data, client, id) => {
        const ref = new StructureReference(data.ref)
        const structure = new StructureEngineer(ref, StyleDependency.empty(), new EmptyBuilder())
        getProject(ref.pack).dataPack.engineers.structures.set(structure.reference.location, structure)
        structure.save()
        client.respond(id, {})
    })

    onMessage.set('data-pack/structures/get', (data, client, id) => {
        const structure = new StructureReference(data.ref).get()
        client.respond(id, structure.toJson())
    })
}