let counter = 0;

/**
 * Timestamp + monotonic counter, so IDs generated within the same
 * millisecond (e.g. two dispatches in one render) never collide.
 */
export function nextId(prefix: string): string {
  counter += 1;
  return `${prefix}-${Date.now()}-${counter}`;
}
