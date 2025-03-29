import { idToLabel } from "../util/form"

export class Permission {

    constructor(
        readonly id: string,
        public name: string = idToLabel(id)
    ) { }

    static visitator(): Permission[] {
        return [PERMISSIONS.READ_FILE]
    }

    static editor(): Permission[] {
        return [...Permission.visitator(), PERMISSIONS.WRITE_FILE]
    }

    static admin(): Permission[] {
        return [...Permission.editor()]
    }

    static owner(): Permission[] {
        return [...Permission.admin(), PERMISSIONS.STOP_SERVER, PERMISSIONS.ALL]
    }
}

export class PermissionLevel {

    constructor(
        readonly permissions: Permission[]
    ) { }

    static of(permission: Permission): PermissionLevel {
        return new PermissionLevel([permission])
    }

    hasPermission(permission: Permission): boolean {
        return this.permissions.includes(permission)
    }

    hasPermissions(level: PermissionLevel): boolean {
        if(level.hasPermission(PERMISSIONS.ALL)) {
            return true
        }
        for(let i = 0; i < level.permissions.length; i++) {
            if(!this.permissions.includes(level.permissions[i])) {
                return false
            }
        }
        return true
    }

    printPermissions(): string {
        return this.permissions.map((permission) => permission.id).join(' ')
    }
}

export const PERMISSIONS = {
    READ_FILE: new Permission('read_file'),
    WRITE_FILE: new Permission('write_file'),

    STOP_SERVER: new Permission('stop_server'),

    ALL: new Permission('all')
}