import { Token } from "./token"

type Factory<R, TArgs extends any[] = any[]> = (...factoryArgs: TArgs) => R
type Constructor<R, TArgs extends any[] = any[]> = new (...ctorArgs: TArgs) => R
// container
type Injected<R, TArgs extends any[] = any[]> = R | Factory<R, TArgs> | Constructor<R, TArgs>

const enum ItemType {
  value, factory, class
}

interface Item<R, TArgs extends any[] = any[]> {
  injected?: Injected<R, TArgs>
  cache?: R
  singleton?: boolean
  type?: ItemType
}

function getType(token: Token<any, any> | symbol): symbol {
  return typeof token === "symbol" ? token : token.type
}

function stringifyToken(token: Token<any, any> | symbol): string {
  return typeof token === "symbol" ? token.toString() : `Token(${token.type.toString()})`
}

export class Bind<R, TArgs extends any[] = any[]> {
  constructor(private readonly _target: Item<R, TArgs>) { }

  toClass<TClz extends Constructor<R>>(Clz: TClz): this {
    this._target.injected = Clz
    this._target.type = ItemType.class
    return this
  }

  toFactory(factory: Factory<R, TArgs>): this {
    this._target.injected = factory
    this._target.type = ItemType.factory
    return this
  }

  toValue(value: R): this {
    if (typeof value === "undefined") {
      throw new Error("cannot bind a value to undefined")
    }
    this._target.injected = value
    this._target.type = ItemType.value
    return this
  }

  asSingleton(): this {
    this._target.singleton = true
    return this
  }
}

export class Container {
  private registry = new Map<symbol, Item<any>>()
  private readonly snapshots: typeof this.registry[] = []
  private _frozen = false

  froze(): void {
    this._frozen = true
  }

  public get frozen(): boolean {
    return this._frozen
  }

  bind<R, TArgs extends any[] = any[]>(token: Token<R, TArgs> | symbol): Bind<R, TArgs> {
    if (this.frozen) {
      throw new Error("Container is frozen")
    }
    return new Bind<R, TArgs>(this.createItem<R, TArgs>(token))
  }

  remove(token: Token<any, any> | symbol): this {
    if (this.frozen) {
      throw new Error("Container is frozen")
    }
    if (this.registry.get(getType(token)) === undefined) {
      return this
    }
    this.registry.delete(getType(token))
    return this
  }

  has(token: Token<any, any> | symbol): boolean {
    return this.registry.get(getType(token)) !== undefined
  }

  get<R, TArgs extends any[] = any[]>(
    token: Token<R, TArgs> | symbol,
    ...injectedArgs: TArgs
  ): R {
    const item = this.registry.get(getType(token))

    if (item === undefined || item.injected === undefined || item.type === undefined) {
      throw new Error(`Nothing bound to ${stringifyToken(token)}`)
    }
    if (item.type === ItemType.value) {
      return item.injected satisfies R
    } else if (item.type === ItemType.factory) {
      const factory = item.injected satisfies Factory<R, TArgs>
      if (item.singleton) {
        return (item.cache = item.cache ?? factory(...injectedArgs))
      } else {
        return factory(...injectedArgs)
      }
    } else {
      const Ctor = item.injected satisfies Constructor<R, TArgs>
      if (item.singleton) {
        return (item.cache = item.cache ?? new Ctor(...injectedArgs))
      } else {
        return new Ctor(...injectedArgs)
      }
    }
  }

  tryGet<R, TArgs extends any[] = any[]>(
    token: Token<R, TArgs> | symbol,
    ...injectedArgs: TArgs
  ): R | undefined {
    return this.has(token) ? this.get(token, ...injectedArgs) : undefined
  }

  snapshot(): Container {
    this.snapshots.push(new Map(this.registry))
    return this
  }

  restore(): Container {
    this.registry = this.snapshots.pop() ?? this.registry
    return this
  }

  /* Item related */
  private createItem<R, TArgs extends any[] = any[]>(token: Token<R, TArgs> | symbol): Item<R> {
    const item = {}
    this.registry.set(getType(token), item)
    return item
  }
}
