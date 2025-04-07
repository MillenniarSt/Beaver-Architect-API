import { idToLabel } from "../util/form"
import { joinBiLists, type ToJson } from "../util/util"

export class Permission {

    constructor(
        readonly id: string,
        readonly grant: Permission[] = [],
        public name: string = idToLabel(id)
    ) { }

    grantedPermissions(): Permission[] {
        return this.grant.concat(joinBiLists(this.grant.map((granted) => granted.grantedPermissions())))
    }

    static visitator(): Permission[] {
        return [PERMISSIONS.ACCESS_DEPENDENCES, PERMISSIONS.ACCESS_DATAPACK]
    }

    static editor(): Permission[] {
        return [...Permission.visitator(), PERMISSIONS.MANAGE_DEPENDENCES, PERMISSIONS.MANAGE_STYLE, PERMISSIONS.MANAGE_STRUCTURE_ENGINEER]
    }

    static admin(): Permission[] {
        return [...Permission.editor(), PERMISSIONS.MANAGE_ARCHITECT_FILE]
    }

    static owner(): Permission[] {
        return [ALL_PERMISSIONS]
    }
}

export class PermissionLevel implements ToJson {

    protected permissions: Set<Permission> = new Set()

    constructor(
        permissions: Permission[]
    ) {
        permissions.forEach((permission) => {
            this.permissions.add(permission)
            permission.grantedPermissions().forEach((granted) => this.permissions.add(granted))
        })
    }

    static fromJson(json: any): PermissionLevel {
        return new PermissionLevel(json.map((permission: string) => (PERMISSIONS as Record<string, Permission>)[permission]))
    }

    static of(permission: Permission): PermissionLevel {
        return new PermissionLevel([permission])
    }

    hasPermission(permission: Permission): boolean {
        return this.permissions.has(permission)
    }

    hasPermissions(level: PermissionLevel): boolean {
        return this.permissions.isSubsetOf(level.permissions)
    }

    toJson() {
        return this.permissions.values().map((permission) => permission.id)
    }
}

const ACCESS_DEPENDENCES = new Permission('access_dependences')
const MANAGE_DEPENDENCES = new Permission('manage_dependences', [ACCESS_DEPENDENCES])

const MANAGE_ARCHITECT_FILE = new Permission('access_architect_file')

const ACCESS_DATAPACK = new Permission('access_datapack')
const MANAGE_STYLE = new Permission('manage_style', [ACCESS_DATAPACK])
const MANAGE_STRUCTURE_ENGINEER = new Permission('manage_structure_engineer', [ACCESS_DATAPACK])

const READ_ALL_FILE = new Permission('read_all_file')
const WRITE_ALL_FILE = new Permission('write_all_file', [READ_ALL_FILE])

const MANAGE_USER = new Permission('manage_user')

const STOP_SERVER = new Permission('stop_server')

export const PERMISSIONS = {
    ACCESS_DEPENDENCES: ACCESS_DEPENDENCES,
    MANAGE_DEPENDENCES: MANAGE_DEPENDENCES,

    MANAGE_ARCHITECT_FILE: MANAGE_ARCHITECT_FILE,

    ACCESS_DATAPACK: ACCESS_DATAPACK,
    MANAGE_STYLE: MANAGE_STYLE,
    MANAGE_STRUCTURE_ENGINEER: MANAGE_STRUCTURE_ENGINEER,

    READ_ALL_FILE: READ_ALL_FILE,
    WRITE_ALL_FILE: WRITE_ALL_FILE,

    MANAGE_USER: MANAGE_USER,

    STOP_SERVER: STOP_SERVER
}

export const ALL_PERMISSIONS = new Permission('all', Object.entries(PERMISSIONS).map(([id, permission]) => permission))