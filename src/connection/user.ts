//             _____
//         ___/     \___        |  |
//      ##/  _.- _.-    \##  -  |  |                       -
//      ##\#=_  '    _=#/##  |  |  |  /---\  |      |      |   ===\  |  __
//      ##   \\#####//   ##  |  |  |  |___/  |===\  |===\  |   ___|  |==/
//      ##       |       ##  |  |  |  |      |   |  |   |  |  /   |  |
//      ##       |       ##  |  \= \= \====  |   |  |   |  |  \___/  |
//      ##\___   |   ___/
//      ##    \__|__/

import { Permission, PermissionLevel } from "./permission"

export type PublicUserData = {
    name: string
    image?: string
    banner?: string
    bio: string
}

export abstract class AbstractUser {

    constructor(
        readonly id: string,
        readonly publicData: PublicUserData
    ) { }

    abstract get permissions(): PermissionLevel
}

export class LocalUser extends AbstractUser{

    private static readonly PERMISSIONS = new PermissionLevel(Permission.owner())

    constructor(
        id: string,
        publicData: PublicUserData
    ) {
        super(id, publicData)
    }

    get permissions(): PermissionLevel {
        return LocalUser.PERMISSIONS
    }

    static fromJson(json: any): LocalUser {
        return new LocalUser(json.id, json.publicData)
    }

    toJson() {
        return {
            id: this.id,
            publicData: this.publicData
        }
    }
}

export class User extends AbstractUser{

    constructor(
        id: string,
        publicData: PublicUserData,
        readonly permissions: PermissionLevel
    ) {
        super(id, publicData)
    }

    static fromJson(json: any): User {
        return new User(json.id, json.publicData, PermissionLevel.fromJson(json.permissions))
    }

    toJson() {
        return {
            id: this.id,
            publicData: this.publicData,
            permissions: this.permissions.toJson()
        }
    }
}