import { Context, Hono, MiddlewareHandler } from "hono";
import { Type as T, Static } from "@sinclair/typebox";
import { tbValidator } from "./middleware/validator";
import { BuildRouterSchema, RouterSchemaDef } from "./middleware/schema";
import { reqValidator } from "./middleware/reqValidator";
import { BlankEnv, Env, Next } from "hono/types";
import { $ReqCtx } from "./middleware/schema";
import { HonoManager } from "./middleware/spec";

const app = new Hono();

app.get("/", (c) => {
  return c.text("Hello Hono!");
});

const reqSchema = {
  param: T.Object({
    name: T.String({ description: 'User name', errMessage: 'User name is required', minLength: 3 }),
  }),
  body: T.Object({
    name: T.String(),
  }),
  //other field schema
} satisfies RouterSchemaDef;

// type Rq

// function rqHandler()

// const combineMiddleware = (middlewares: MiddlewareHandler[]): MiddlewareHandler => {
//   return middlewares.reduce((a, b) => {
//     return async (c: Context, next: Next) => {
//       //@ts-ignore
//       return await a(c, async () => await b(c, next))
//     }
//   })
// }

// app.post(
//   "/hello/:name",
//   combineMiddleware(
//     [
//       tbValidator('param', reqSchema.param),
//       combineMiddleware([
//         tbValidator('json', reqSchema.body),
//       ]
//       )
//     ]
//   ),
//   (c) => {
//     return c.json({
//       _meta: "Using tbValidator",
//       param: c.req.valid("param"),
//       body: c.req.valid("json"),
//     });
//   },
// );


const hm = new HonoManager(app);
hm.get('/user/:id', {
  accessScope: ['auth:user'],
  schema: {
    query: T.Object({ name: T.String({}) }),
    param: T.Object({ id: T.Number() }),
    json: T.Object({ user: T.String() })
  },
  async handler(c) {
    const { name } = c.req.valid('query');
    const { id } = c.req.valid('param');
    const user = c.get('user')
    return c.json({ message: "Hello", name, id, user });
  },
});


hm.post(
  "/hello/:name",
  {
    schema: reqSchema,
    handler(c) {
      return c.json({
        _meta: "Using tbValidator",
        param: c.req.valid("param"),
        body: c.req.valid("json"),
      });
    },
  }
);

10200


export default app;
