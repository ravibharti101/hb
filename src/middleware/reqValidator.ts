import { Env, MiddlewareHandler } from "hono/types";
import { tbValidator } from "./validator";
import { BuildRouterSchema, RouterSchemaDef } from "./schema";


export function reqValidator<S extends RouterSchemaDef, E extends Env, P extends string>(schema: S): MiddlewareHandler<E, P, BuildRouterSchema<typeof schema>>[] {
    const handlers: MiddlewareHandler<E, P, BuildRouterSchema<typeof schema>>[] = [];
    // return tbValidator()
    if (schema.header) {
        //@ts-ignore
        handlers.push(tbValidator('header', schema.header))
    }
    if (schema.param) {
        //@ts-ignore
        handlers.push(tbValidator('param', schema.param))
    }
    if (schema.query) {
        //@ts-ignore
        handlers.push(tbValidator('query', schema.query))
    }
    if (schema.cookie) {
        //@ts-ignore
        handlers.push(tbValidator('cookie', schema.cookie))
    }
    if (schema.body) {
        //@ts-ignore
        handlers.push(tbValidator('json', schema.body))
    }
    if (schema.form) {
        //@ts-ignore
        handlers.push(tbValidator('form', schema.form))
    }
    //@ts-ignore
    return handlers;
}