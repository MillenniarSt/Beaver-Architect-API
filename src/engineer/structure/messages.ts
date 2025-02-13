import { EmptyBuilder } from "../../builder/generic/empty.js";
import { ServerOnMessage } from "../../connection/server.js";
import { getProject } from "../../instance.js";
import { StructureEngineer, StructureReference } from "./structure.js";

export function registerEnStructureMessages(onMessage: ServerOnMessage) {
    onMessage.set('data-pack/structures/create', (data, client, id) => {
        const structure = new StructureEngineer(new StructureReference(data.ref), new EmptyBuilder())
        getProject(data.identifier).dataPack.engineers.structures.set(structure.reference.location, structure)
        structure.save()
        client.respond(id, {})
    })

    onMessage.set('data-pack/structures/get', (data, client, id) => {
        const structure = new StructureReference(data.ref).get()
        client.respond(id, {})
    })
}