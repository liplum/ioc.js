// tokens
// eslint-disable-next-line @typescript-eslint/no-unused-vars, no-unused-vars
// @ts-ignore
export interface Token<T, U extends any[]> {
  type: symbol
}
/**
 * Create a token. If two tokens have the same name, they are identical.
 * ```js
 * Symbol.for(name)
 * ```
 * @param name the token name
 * @returns A token.
 */
export function token<R, TArgs extends any[] = any[]>(name: string): Token<R, TArgs> {
  return { type: Symbol.for(name) } satisfies Token<R, TArgs>
}

/**
 * Create a unique token. Even if two tokens have the same name, they are still different.
 * ```js
 * Symbol(name)
 * ```
 * @param name the token name
 * @returns A unique token even if two tokens have the same name.
 */
export function uniqueToken<R, TArgs extends any[] = any[]>(name: string): Token<R, TArgs> {
  return { type: Symbol(name) } satisfies Token<R, TArgs>
}
