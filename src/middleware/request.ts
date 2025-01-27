import { TSchema, Type as T } from "@sinclair/typebox";
import { Context, Env } from "hono";
import { RouterSchemaDef, BuildRouterSchema } from "./schema";
import { BlankEnv } from "hono/types";
import { SchemaOptions } from "@sinclair/typebox";

declare module "@sinclair/typebox" {
  interface SchemaOptions {
    errMessage?: string; // Add custom error message property
  }
}

export type HonoRequestOptions<
  Path extends string,
  E extends Env,
  Schema extends RouterSchemaDef,
> = {
  /**
   * Request validation schema
   */
  schema?: Schema;
  /**
   * Open API compliant document
   */
  apiDocs?: {
    summary?: string;
    description?: string;
    tag?: string[];
  };
  handler: (c: Context<E, Path, BuildRouterSchema<Schema>>) => Response;
};

function get<P extends string, Schema extends RouterSchemaDef>(
  path: P,
  handlerOptions: HonoRequestOptions<P, BlankEnv, Schema>,
) {
  // return handlerOptions.handler.call(c)
}

get("/hello", {
  schema: {
    body: T.Object({
      name: T.String({ errMessage: "User name is required" }),
    }),
  },
  handler: (c) => {
    const { name } = c.req.valid("json");
    return c.json({ message: "Hello" }, 200);
  },
});
