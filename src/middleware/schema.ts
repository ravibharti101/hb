import { Static, TSchema } from "@sinclair/typebox";
import { Context, Env } from "hono";
import { BlankEnv, BlankSchema } from "hono/types";
/**
 * Hono Route validation schema definition
 * @description use this type as `satisfies` and generate type using `BuildRouterSchema` utility
 *@example
 import { Type as T } from '@sinclair/typebox'
 const reqSchema = {
    body: T.Object({
        name: T.Number(),
    }),
    //other field schema
} satisfies RouterSchemaDef;
 *
 */
export type RouterSchemaDef = {
  query?: TSchema;
  param?: TSchema;
  body?: TSchema;
  header?: TSchema;
  form?: TSchema;
  cookie?: TSchema;
};

type $ParamType<T extends unknown | undefined> = T extends undefined
  ? {}
  : T extends TSchema
    ? {
        in: {
          param: Static<T>;
        };
        out: {
          param: Static<T>;
        };
      }
    : {};
type $QueryType<T extends unknown | undefined> = T extends undefined
  ? {}
  : T extends TSchema
    ? {
        in: {
          query: Static<T>;
        };
        out: {
          query: Static<T>;
        };
      }
    : {};
type $HeaderType<T extends unknown | undefined> = T extends undefined
  ? {}
  : T extends TSchema
    ? {
        in: {
          header: Static<T>;
        };
        out: {
          header: Static<T>;
        };
      }
    : {};
type $JsonType<T extends unknown | undefined> = T extends undefined
  ? {}
  : T extends TSchema
    ? {
        in: {
          json: Static<T>;
        };
        out: {
          json: Static<T>;
        };
      }
    : {};
type $CookieType<T extends unknown | undefined> = T extends undefined
  ? {}
  : T extends TSchema
    ? {
        in: {
          cookie: Static<T>;
        };
        out: {
          cookie: Static<T>;
        };
      }
    : {};
type $FormType<T extends unknown | undefined> = T extends undefined
  ? {}
  : T extends TSchema
    ? {
        in: {
          form: Static<T>;
        };
        out: {
          form: Static<T>;
        };
      }
    : {};

//? improved
type $SchemaType<
  K extends keyof RouterSchemaDef,
  T extends unknown | undefined,
> = T extends undefined
  ? {}
  : T extends TSchema
    ? {
        in: {
          [Key in K]: Static<T>;
        };
        out: {
          [Key in K]: Static<T>;
        };
      }
    : {};

type Merge<T extends object[]> = T extends [infer F, ...infer R]
  ? F & (R extends object[] ? Merge<R> : never)
  : unknown;

/**
 * Build router schema from router schema object
 * @example
 //schema definition
 * const reqSchema = {
    body: T.Object({
        name: T.Number(),
    })
} satisfies RouterSchemaDef;

//Generate type from schema
type Schema = BuildRouterSchema<typeof reqSchema>;
 *
 */
export type BuildRouterSchema<T extends RouterSchemaDef> = Merge<
  [
    $SchemaType<"param", T["param"]>,
    $QueryType<T["query"]>,
    $JsonType<T["body"]>,
    $HeaderType<T["header"]>,
    $FormType<T["form"]>,
    $CookieType<T["cookie"]>,
  ]
>;

export type $ReqCtx<
  S extends RouterSchemaDef,
  E extends Env = BlankEnv,
  P extends string = "/",
> = Context<E, P, BuildRouterSchema<S>>;
