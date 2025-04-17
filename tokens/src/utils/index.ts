export * from "./config";
export * from "./flow";
export * from "./actions";
export * from "./context";

export function logTimeWrapper(fn: (...args: unknown[]) => Promise<unknown>) {
    return async (...args: unknown[]) => {
        console.time(`Function Call [${fn.name}]`);
        const result = await fn(...args);
        console.timeEnd(`Function Call [${fn.name}]`);
        return result;
    };
}
