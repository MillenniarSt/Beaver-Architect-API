//             _____
//         ___/     \___        |  |
//      ##/  _.- _.-    \##  -  |  |                       -
//      ##\#=_  '    _=#/##  |  |  |  /---\  |      |      |   ===\  |  __
//      ##   \\#####//   ##  |  |  |  |___/  |===\  |===\  |   ___|  |==/
//      ##       |       ##  |  |  |  |      |   |  |   |  |  /   |  |
//      ##       |       ##  |  \= \= \====  |   |  |   |  |  \___/  |
//      ##\___   |   ___/
//      ##    \__|__/

import { PermissionLevel } from "./permission"

export type PublicUserData = {
    name: string
    image?: string
    banner?: string
    bio: string
}

export class User {

    constructor(
        readonly id: string,
        readonly publicData: PublicUserData,
        readonly permissions: PermissionLevel
    ) { }

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