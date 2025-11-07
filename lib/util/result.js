/**
 * Rust/Go-style error handling utility for JavaScript
 *
 * Instead of try-catch blocks, use this utility to get [error, result] tuples
 * similar to Go's error handling pattern.
 *
 * @example
 * ```js
 * import { catchError } from '#lib/result.js';
 *
 * // With async functions
 * const [err, data] = await catchError(fetchUserData(userId));
 * if (err) {
 *   console.error('Failed to fetch user:', err);
 *   return;
 * }
 * console.log('User data:', data);
 *
 * // With sync functions
 * const [parseErr, parsed] = catchError(() => JSON.parse(jsonString));
 * if (parseErr) {
 *   console.error('Failed to parse JSON:', parseErr);
 *   return;
 * }
 *
 * // Chaining operations
 * const [err1, user] = await catchError(getUser(id));
 * if (err1) return handleError(err1);
 *
 * const [err2, updated] = await catchError(updateUser(user));
 * if (err2) return handleError(err2);
 * ```
 */

/**
 * Wraps a promise or function and returns [error, result] tuple
 * Returns [error, null] if an error occurs, or [null, result] on success
 *
 * @template T
 * @param {Promise<T> | (() => T) | (() => Promise<T>)} promiseOrFn - Promise or function to execute
 * @returns {Promise<[Error | null, T | null]>} Tuple of [error, result]
 */
export async function catchError(promiseOrFn) {
  try {
    // If it's a function, execute it
    const result = typeof promiseOrFn === 'function'
      ? await promiseOrFn()
      : await promiseOrFn;

    return [null, result];
  } catch (error) {
    // Ensure error is an Error object
    const err = error instanceof Error ? error : new Error(String(error));
    return [err, null];
  }
}

/**
 * Synchronous version of catchError for non-async operations
 *
 * @template T
 * @param {() => T} fn - Synchronous function to execute
 * @returns {[Error | null, T | null]} Tuple of [error, result]
 */
export function catchErrorSync(fn) {
  try {
    const result = fn();
    return [null, result];
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    return [err, null];
  }
}

/**
 * Result type wrapper - more Rust-like with explicit Ok/Err variants
 *
 * @example
 * ```js
 * // Async operations
 * const result = await Result.from(fetchData());
 *
 * // Sync operations
 * const parseResult = Result.fromSync(() => JSON.parse(jsonString));
 *
 * if (result.isOk()) {
 *   console.log(result.unwrap());
 * } else {
 *   console.error(result.unwrapErr());
 * }
 *
 * // Or using match
 * result.match({
 *   ok: (data) => console.log('Success:', data),
 *   err: (error) => console.error('Error:', error)
 * });
 * ```
 */
export class Result {
  constructor(isOk, value) {
    this._isOk = isOk;
    this._value = value;
  }

  /**
   * Creates a Result from a promise or async function
   * @template T
   * @param {Promise<T> | (() => Promise<T>)} promiseOrFn
   * @returns {Promise<Result>}
   */
  static async from(promiseOrFn) {
    const [err, result] = await catchError(promiseOrFn);
    return err ? Result.err(err) : Result.ok(result);
  }

  /**
   * Creates a Result from a synchronous function
   * @template T
   * @param {() => T} fn - Synchronous function to execute
   * @returns {Result}
   */
  static fromSync(fn) {
    const [err, result] = catchErrorSync(fn);
    return err ? Result.err(err) : Result.ok(result);
  }

  /**
   * Creates a successful Result
   * @template T
   * @param {T} value
   * @returns {Result}
   */
  static ok(value) {
    return new Result(true, value);
  }

  /**
   * Creates an error Result
   * @param {Error} error
   * @returns {Result}
   */
  static err(error) {
    return new Result(false, error);
  }

  /**
   * Check if Result is Ok
   * @returns {boolean}
   */
  isOk() {
    return this._isOk;
  }

  /**
   * Check if Result is Err
   * @returns {boolean}
   */
  isErr() {
    return !this._isOk;
  }

  /**
   * Unwrap the value, throws if Err
   * @template T
   * @returns {T}
   * @throws {Error}
   */
  unwrap() {
    if (!this._isOk) {
      throw new Error(`Called unwrap on an Err value: ${this._value.message}`);
    }
    return this._value;
  }

  /**
   * Unwrap the error, throws if Ok
   * @returns {Error}
   * @throws {Error}
   */
  unwrapErr() {
    if (this._isOk) {
      throw new Error('Called unwrapErr on an Ok value');
    }
    return this._value;
  }

  /**
   * Unwrap or return default value
   * @template T
   * @param {T} defaultValue
   * @returns {T}
   */
  unwrapOr(defaultValue) {
    return this._isOk ? this._value : defaultValue;
  }

  /**
   * Match on Ok/Err variants
   * @template U
   * @param {{ ok: (value: any) => U, err: (error: Error) => U }} handlers
   * @returns {U}
   */
  match(handlers) {
    return this._isOk
      ? handlers.ok(this._value)
      : handlers.err(this._value);
  }

  /**
   * Map the Ok value, leave Err unchanged
   * @template U
   * @param {(value: any) => U} fn
   * @returns {Result}
   */
  map(fn) {
    return this._isOk
      ? Result.ok(fn(this._value))
      : this;
  }

  /**
   * Map the Err value, leave Ok unchanged
   * @param {(error: Error) => Error} fn
   * @returns {Result}
   */
  mapErr(fn) {
    return this._isOk
      ? this
      : Result.err(fn(this._value));
  }
}

export default {
  catchError,
  catchErrorSync,
  Result
};
