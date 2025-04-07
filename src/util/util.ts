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

// Map

export function mapToEntries<K, V>(map: Map<K, V>): [K, V][] {
    return Array.from(map.entries())
}

export function itemsOfMap<T>(map: Map<any, T>): T[] {
    return mapToEntries(map).map(([key, value]) => value)
}

export function mapToRecord<T, V>(map: Map<string, T>, transformItem: (item: T) => V): Record<string, V> {
    return Object.fromEntries(mapToEntries(map).map(([key, item]) => [key, transformItem(item)]))
}

export function mapToJson<T extends ToJson>(map: Map<string, T>): Record<string, {}> {
    return Object.fromEntries(mapToEntries(map).map(([key, item]) => [key, item.toJson()]))
}

export function mapFromJson<T>(json: any, itemFromJson: (json: any) => T): Map<string, T> {
    return new Map(Object.entries(json).map(([key, item]) => [key, itemFromJson(item)]))
}

// Record

export function recordToJson<T extends ToJson>(record: Record<string, T>): Record<string, {}> {
    return Object.fromEntries(Object.entries(record).map(([key, item]) => [key, item.toJson()]))
}

export function recordFromJson<T>(json: any, itemFromJson: (json: any) => T): Record<string, T> {
    return Object.fromEntries(Object.entries(json).map(([key, item]) => [key, itemFromJson(item)]))
}

// List

export function joinBiLists<T>(biList: T[][]): T[] {
    let list: T[] = []
    biList.forEach((singleList) => list.push(...singleList))
    return list
}