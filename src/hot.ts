export type Hotable = object | Function

const proxies: Map<Hotable, Hotable> = new Map()
const replacements: Map<Hotable, Hotable> = new Map()

function isPlainObject(obj: any): obj is object {
    return typeof obj === "object" && obj?.constructor === Object
}

function isClass(obj: any): obj is ({ new(...arg: any): any }) {
    return typeof obj === "function" && obj.prototype && obj.prototype[Symbol.hasInstance] === undefined
}

function isMethodClass(obj: any): obj is Function {
    return typeof obj === "function" && !obj.prototype
}

function isFunction(obj: any): obj is Function {
    return typeof obj === "function" && !isClass(obj)
}

const functionHandler: ProxyHandler<Function> = {
    apply(target, thisArg, argArray) {
        const replacement = replacements.get(target) as Function
        const result = Reflect.apply(replacement, thisArg, argArray)
        return hotModule(result)
    },
}

const classHandler: ProxyHandler<{ new(...arg: any): any }> = {
    // always construct from the base object, but proxy its properties
    construct(target, argArray) {
        const replacement = replacements.get(target) as Function
        const instance = Reflect.construct(target, argArray)
        Object.setPrototypeOf(instance, replacement.prototype)
        return hotModule(instance)
    },
    get(target, p, receiver) {
        // instanceof should match base class
        if (p === Symbol.hasInstance) {
            return Reflect.get(target, p, receiver)
        }

        // extending class should inherit from base class
        if (p === "prototype") {
            return Reflect.get(target, p, receiver)
        }

        // idk need to check
        if (p === "constructor") {
            return Reflect.get(target, p, receiver)
        }

        const replacement = replacements.get(target)!
        const accessed = Reflect.get(replacement, p, receiver)
        return accessed
    }
}

const proxyHandler: ProxyHandler<object> = {
    get(target, p, receiver) {
        const maybeReplacedClass = (replacements.get(target.constructor) ?? (target.constructor)) as Function
        const baseClassAccessed = Reflect.get(maybeReplacedClass.prototype, p)

        if (baseClassAccessed === null) {
            return null
        }

        if (isMethodClass(baseClassAccessed)) {
            const bound = baseClassAccessed.bind(target)
            return hotModule(bound)
        }

        const replacement = replacements.get(target)!
        const replacementAccessed = Reflect.get(replacement, p, receiver)

        if (typeof replacementAccessed === "object") {
            return hotModule(replacementAccessed)
        }

        return replacementAccessed
    }
}

export function hotModule<T extends (Hotable)>(m: T): T {
    if (proxies.has(m)) {
        return proxies.get(m) as T
    }
    if (typeof m !== "object" && typeof m !== "function") {
        // cannot proxy
        return m
    }
    hotReplace(m, m)
    const handler = isPlainObject(m) ? proxyHandler
        : isClass(m) ? classHandler
            : isFunction(m) || isMethodClass(m) ? functionHandler
                : proxyHandler
    const p = new Proxy<T>(m, handler)
    proxies.set(m, p)
    return p
}

export function hotReplace<T extends Hotable>(m: T, replacement: any): void {
    replacements.set(m, replacement)
}