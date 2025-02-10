import { Context, Hono } from 'hono'
import { Env, BlankEnv, MiddlewareHandler, Next } from 'hono/types';
import { Static, TSchema, Type } from '@sinclair/typebox'
import { createMiddleware } from 'hono/factory';
import { BuildRouterSchema } from './schema';
import { reqValidator } from './reqValidator';

export type ReqSchema = {
    query?: TSchema;
    param?: TSchema;
    body?: TSchema;
    header?: TSchema;
    form?: TSchema;
    cookie?: TSchema;
}

const combineMiddleware = (middlewares: MiddlewareHandler[]): MiddlewareHandler => {
    return middlewares.reduce((a, b) => {
        return async (c: Context, next: Next) => {
            console.log("Running", a);
            //@ts-ignore
            return await a(c, async () => await b(c, next))
        }
    });
}

type AccessScope = 'auth:user' | 'auth:user:admin' | 'auth:admin:moderator' | 'auth:admin:maintainer' | 'auth:api-key' | 'public';
type MdlOrder = 'before:validation' | 'after:validation';
type RouterDef<P extends string = '', Schema extends ReqSchema = {}> = {
    middleware?: { priority?: MdlOrder, fn: MiddlewareHandler<BlankEnv, P, {}> }[],
    accessScope?: AccessScope[];
    schema?: Schema;
    handler: (c: Schema extends undefined ? Context<BlankEnv, P, {}> : Context<{
        Variables: {
            user: TokenPayload
        }
    }, P, BuildRouterSchema<Schema>>) => Response | Promise<Response>;
}


type AuthOptions = {
    scope: AccessScope[];
}

type TokenPayload = {
    id: string;
    email: string;
    firstName: string;
    lastName: string | null;
    role: 'user' | 'admin' | 'admin:moderator' | 'admin:maintainer';
    scope: 'verify' | 'access' | 'refresh' | 'debug';
    company?: {
        id: number;
        dwhId: string | null;
        role: "gp-support" | null;
    };
}

function verifyAndToken<TokenPayload>(token: string) {
    return { id: 'u123', role: 'user' } as unknown as TokenPayload;
}


function resolveReqScope(token?: string, apiKey?: string): { scope: AccessScope | 'unknown', user?: any } {
    if (!token && !apiKey) return { scope: 'public', user: null };
    try {
        if (token && !apiKey) {
            const userInfo = verifyAndToken<TokenPayload>(token);
            if ('user' === userInfo.role) {
                return { scope: 'auth:user', user: userInfo };
            } else if ('admin' === userInfo.role) {
                return { scope: 'auth:user:admin', user: userInfo };
            } else if ('admin:moderator' === userInfo.role) {
                return { scope: 'auth:admin:moderator', user: userInfo };
            } else if ('admin:maintainer' === userInfo.role) {
                return { scope: 'auth:admin:maintainer', user: userInfo };
            } else {
                return { scope: 'unknown', user: userInfo };
            }
        } else if (apiKey && !token) {
            return { scope: 'auth:api-key', user: null };
        } else if (token && apiKey) {
            return resolveReqScope(token, undefined);
        } else {
            return { scope: 'unknown', user: null };
        }
    } catch (error) {
        return { scope: 'public', user: null };
    }
}

async function handleScopeAccess(c: Context, expected: AccessScope[], current: AccessScope, user: any, next: Next) {
    if (expected.some(exp => exp === current)) {
        if (user) {
            c.set('user', user);
        }
        return await next();
    } else {
        return c.json({ message: 'Invalid access' }, 401);
    }
}


const authMiddleware = (options: AuthOptions) => createMiddleware(async (c, next) => {
    try {
        const jwtToken = c.req.header('authorization')?.split(' ')[1]!;
        const apiKey = c.req.header('x-gp-api-key') || c.req.query('api-key');
        const req = resolveReqScope(jwtToken, apiKey);
        switch (req.scope) {
            case 'public':
                return await next();
            case 'unknown':
                return c.json({ message: "Invalid access" }, 401);
            case 'auth:user':
            case 'auth:user:admin':
            case 'auth:api-key':
            case 'auth:admin:moderator':
            case 'auth:admin:maintainer':
                return await handleScopeAccess(c, options.scope, req.scope, req.user, next);
            default:
                const msg = `Invalid request access for ${req.scope satisfies never}`;
                console.log(msg);
                return c.json({ message: "Unauthorized" }, 401);
        }
    } catch (error) {
        return c.json({ message: "Unauthorized" }, 401);
    }
})



export class HonoManager {
    protected _app: Hono;
    constructor(app: Hono) {
        this._app = app;
    }
    get<P extends string = '/', S extends ReqSchema = {}>(path: P, routeDef: RouterDef<P, S>) {
        try {
            const scope = routeDef.accessScope || ['auth:user'];
            const middleware: MiddlewareHandler[] = [];
            if (scope.length > 0) {
                middleware.push(authMiddleware({ scope }));
            }
            if (routeDef.schema) {
                middleware.push(...reqValidator(routeDef.schema));
            }
            //@ts-ignore
            this._app.get(path, ...middleware, routeDef.handler);
        } catch (error) {
            console.log(error);
        }
        return this;
    }
    post<P extends string = '/', S extends ReqSchema = {}>(path: P, routeDef: RouterDef<P, S>) {
        try {
            const scope = routeDef.accessScope || ['auth:user'];
            const middleware: MiddlewareHandler[] = [];
            if (scope.length > 0) {
                middleware.push(authMiddleware({ scope }));
            }
            if (routeDef.schema) {
                middleware.push(...reqValidator(routeDef.schema));
            }
            //@ts-ignore
            this._app.post(path, ...middleware, routeDef.handler);
        } catch (error) {
            console.log(error);
        }
        return this;
    }
    put<P extends string = '/', S extends ReqSchema = {}>(path: P, routeDef: RouterDef<P, S>) {
        try {
            const scope = routeDef.accessScope || ['auth:user'];
            const middleware: MiddlewareHandler[] = [];
            if (scope.length > 0) {
                middleware.push(authMiddleware({ scope }));
            }
            if (routeDef.schema) {
                middleware.push(...reqValidator(routeDef.schema));
            }
            //@ts-ignore
            this._app.put(path, ...middleware, routeDef.handler);
        } catch (error) {
            console.log(error);
        }
        return this;
    }
    patch<P extends string = '/', S extends ReqSchema = {}>(path: P, routeDef: RouterDef<P, S>) {
        try {
            const scope = routeDef.accessScope || ['auth:user'];
            const middleware: MiddlewareHandler[] = [];
            if (scope.length > 0) {
                middleware.push(authMiddleware({ scope }));
            }
            if (routeDef.schema) {
                middleware.push(...reqValidator(routeDef.schema));
            }
            //@ts-ignore
            this._app.patch(path, ...middleware, routeDef.handler);
        } catch (error) {
            console.log(error);
        }
        return this;
    }
    delete<P extends string = '/', S extends ReqSchema = {}>(path: P, routeDef: RouterDef<P, S>) {
        try {
            const scope = routeDef.accessScope || ['auth:user'];
            const middleware: MiddlewareHandler[] = [];
            if (scope.length > 0) {
                middleware.push(authMiddleware({ scope }));
            }
            if (routeDef.schema) {
                middleware.push(...reqValidator(routeDef.schema));
            }
            //@ts-ignore
            this._app.delete(path, ...middleware, routeDef.handler);
        } catch (error) {
            console.log(error);
        }
        return this;
    }
}


// const app = new Hono();

