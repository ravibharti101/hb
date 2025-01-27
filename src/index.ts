import { Context, Hono } from "hono";
import { Type as T, Static } from "@sinclair/typebox";
import { tbValidator } from "./middleware/validator";
import { BuildRouterSchema, RouterSchemaDef } from "./middleware/schema";
import { reqValidator } from "./middleware/reqValidator";
import { BlankEnv, Env } from "hono/types";
import { $ReqCtx } from "./middleware/schema";

const app = new Hono();

app.get("/", (c) => {
  return c.text("Hello Hono!");
});

const reqSchema = {
  param: T.Object({
    name: T.Number(),
  }),
  body: T.Object({
    name: T.String(),
  }),
  //other field schema
} satisfies RouterSchemaDef;

// type Rq

// function rqHandler()

app.post(
  "/hello/:name",
  tbValidator("param", reqSchema.param),
  tbValidator("json", reqSchema.body),
  (c) => {
    return c.json({
      _meta: "Using tbValidator",
      param: c.req.valid("param"),
      body: c.req.valid("json"),
    });
  },
);

function rqHandler(c: $ReqCtx<typeof reqSchema>) {
  return c.json({
    _meta: "Using reqValidator",
    param: c.req.valid("param"),
    body: c.req.valid("json"),
  });
}

app.post("/hi/:name", ...reqValidator(reqSchema), rqHandler);

export default app;
