export function assertNever(value: never): never {
  throw new Error(`Caso sin cubrir en una unión discriminada: ${JSON.stringify(value)}`);
}
