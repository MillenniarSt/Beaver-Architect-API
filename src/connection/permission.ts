//             _____
//         ___/     \___        |  |
//      ##/  _.- _.-    \##  -  |  |                       -
//      ##\#=_  '    _=#/##  |  |  |  /---\  |      |      |   ===\  |  __
//      ##   \\#####//   ##  |  |  |  |___/  |===\  |===\  |   ___|  |==/
//      ##       |       ##  |  |  |  |      |   |  |   |  |  /   |  |
//      ##       |       ##  |  \= \= \====  |   |  |   |  |  \___/  |
//      ##\___   |   ___/
//      ##    \__|__/

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

    static visitor(): Permission[] {
        return [PERMISSIONS.ACCESS_DEPENDENCIES, PERMISSIONS.ACCESS_DATAPACK]
    }

    static editor(): Permission[] {
        return [...Permission.visitor(), PERMISSIONS.MANAGE_DEPENDENCIES, PERMISSIONS.MANAGE_STYLE, PERMISSIONS.MANAGE_STRUCTURE_ENGINEER]
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

const ACCESS_DEPENDENCIES = new Permission('access_dependencies')
const MANAGE_DEPENDENCIES = new Permission('manage_dependencies', [ACCESS_DEPENDENCIES])

const MANAGE_ARCHITECT_FILE = new Permission('access_architect_file')

const ACCESS_DATAPACK = new Permission('access_datapack')
const MANAGE_STYLE = new Permission('manage_style', [ACCESS_DATAPACK])
const MANAGE_COMPONENT = new Permission('manage_component', [ACCESS_DATAPACK])
const MANAGE_STRUCTURE_ENGINEER = new Permission('manage_structure_engineer', [ACCESS_DATAPACK])

const READ_ALL_FILE = new Permission('read_all_file')
const WRITE_ALL_FILE = new Permission('write_all_file', [READ_ALL_FILE])

const MANAGE_USER = new Permission('manage_user')

const STOP_SERVER = new Permission('stop_server')

export const PERMISSIONS = {
    ACCESS_DEPENDENCIES: ACCESS_DEPENDENCIES,
    MANAGE_DEPENDENCIES: MANAGE_DEPENDENCIES,

    MANAGE_ARCHITECT_FILE: MANAGE_ARCHITECT_FILE,

    ACCESS_DATAPACK: ACCESS_DATAPACK,
    MANAGE_STYLE: MANAGE_STYLE,
    MANAGE_COMPONENT: MANAGE_COMPONENT,
    MANAGE_STRUCTURE_ENGINEER: MANAGE_STRUCTURE_ENGINEER,

    READ_ALL_FILE: READ_ALL_FILE,
    WRITE_ALL_FILE: WRITE_ALL_FILE,

    MANAGE_USER: MANAGE_USER,

    STOP_SERVER: STOP_SERVER
}

export const ALL_PERMISSIONS = new Permission('all', Object.entries(PERMISSIONS).map(([id, permission]) => permission))