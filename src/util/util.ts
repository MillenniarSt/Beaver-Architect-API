//             _____
//         ___/     \___        |  |
//      ##/  _.- _.-    \##  -  |  |                       -
//      ##\#=_  '    _=#/##  |  |  |  /---\  |      |      |   ===\  |  __
//      ##   \\#####//   ##  |  |  |  |___/  |===\  |===\  |   ___|  |==/
//      ##       |       ##  |  |  |  |      |   |  |   |  |  /   |  |
//      ##       |       ##  |  \= \= \====  |   |  |   |  |  \___/  |
//      ##\___   |   ___/
//      ##    \__|__/

export type JsonFormat = undefined | null | boolean | number | string | JsonFormat[] | { [key: string]: JsonFormat }

export interface ToJson {

    toJson(): JsonFormat
}

export interface FromJson {

    fromJson(json: JsonFormat): Object
}

export interface Equals {

    equals(other: Equals): boolean
}

export interface ToKey {

    toKey(): string
}

export function ensureJson(data: { toJson?: () => JsonFormat }): JsonFormat {
    return data.toJson ? data.toJson() : data as JsonFormat
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

export function mapToJson<T extends ToJson>(map: Map<string, T>): Record<string, JsonFormat> {
    return Object.fromEntries(mapToEntries(map).map(([key, item]) => [key, item.toJson()]))
}

export function mapFromJson<T>(json: Record<string, JsonFormat>, itemFromJson: (json: JsonFormat) => T): Map<string, T> {
    return new Map(Object.entries(json).map(([key, item]) => [key, itemFromJson(item)]))
}

export function recordToMap<T>(record: Record<string, T>): Map<string, T> {
    return new Map(Object.entries(record))
}

// Record

export function parseRecord<T, R>(record: Record<string, T>, parse: (value: T, key: string) => R): Record<string, R> {
    return Object.fromEntries(Object.entries(record).map(([key, value]) => [key, parse(value, key)]))
}

export function recordToJson<T extends ToJson>(record: Record<string, T>): Record<string, JsonFormat> {
    return Object.fromEntries(Object.entries(record).map(([key, item]) => [key, item.toJson()]))
}

export function recordFromJson<T>(json: Record<string, JsonFormat>, itemFromJson: (json: JsonFormat) => T): Record<string, T> {
    return Object.fromEntries(Object.entries(json).map(([key, item]) => [key, itemFromJson(item)]))
}

// List

export function joinBiLists<T>(biList: T[][]): T[] {
    let list: T[] = []
    biList.forEach((singleList) => list.push(...singleList))
    return list
}

export function listEquals(list1: any[], list2: any[]): boolean {
    if (list1.length !== list2.length) {
        return false
    }
    for (let i = 0; i < list1.length; i++) {
        if (list1[i] !== list2[i]) {
            return false
        }
    }
    return true
}