export interface ToJson {

    toJson(): {}
}

export interface FromJson {

    mapFromJson(json: any): Object
}

export interface Equals {

    equals(other: Equals): boolean
}

export interface ToKey {

    toKey(): string
}

export function itemsOfMap<T>(map: Map<string, T>): T[] {
    let items: T[] = []
    map.forEach((item) => items.push(item))
    return items
}

export function mapToJson<T extends ToJson>(map: Map<string, T>): Record<string, {}> {
    return Object.fromEntries(Object.entries(Array.of(map.values()).map(([key, item]) => [key, item.toJson()])))
}

export function mapFromJson<T>(json: any, itemFromJson: (json: any) => T): Map<string, T> {
    return new Map(Object.entries(json).map(([key, item]) => [key, itemFromJson(item)]))
}

export function joinBiLists<T>(biList: T[][]): T[] {
    let list: T[] = []
    biList.forEach((singleList) => list.push(...singleList))
    return list
}