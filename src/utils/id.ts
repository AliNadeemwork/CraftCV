/** Short, collision-resistant id good enough for local single-user data. */
export function uid(prefix = ''): string {
  const rand = Math.random().toString(36).slice(2, 8);
  const time = Date.now().toString(36).slice(-4);
  return `${prefix}${prefix ? '_' : ''}${time}${rand}`;
}
