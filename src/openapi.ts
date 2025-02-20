import { TSchema } from "@sinclair/typebox";

type RouterDocs = {
  summary: string;
  description?: string;
  tags?: string[];
};

export type RequestSchema = {
  /**
   * The schema for the request parameters
   */
  param?: TSchema;
  /**
   * The schema for the request body
   */
  body?: TSchema;
  /**
   * The schema for the request query
   */
  query?: TSchema;
  /**
   * The schema for the request headers
   */
  header?: TSchema;
  form?: TSchema;
};

type Parameter = {
  name: string;
  in: string;
  description?: string;
  required: boolean;
  schema: any;
};

export const Utils = {
  $resolveObject(pName: string, query: TSchema) {
    const parameters: Parameter[] = [];
    for (const [name, schema] of Object.entries(query.properties)) {
      console.log(name, schema);
      parameters.push({
        name: name,
        in: pName,
        //@ts-ignore
        description: schema?.description || undefined,
        required: query.required?.includes(name),
        schema: schema,
      });
    }
    console.log("Length:", parameters.length);
    return parameters;
  },
  resolveParameter(pName: string, query: TSchema) {
    const parameters: Parameter[] = [];
    if ("object" === query.type) {
      parameters.push(...Utils.$resolveObject(pName, query));
    }
    return parameters;
    //skip other types
  },
  resolveRequestBody(schema: TSchema) {
    const requestBody: RequestBody = {
      description: schema.description,
    };
    if ("object" === schema.type) {
      requestBody.content = {
        "application/json": {
          schema: schema,
        },
      };
      if (schema?.required?.length > 0) {
        requestBody.required = true;
      }
    }
    return requestBody;
  },
  convertUrlParamIntoOpenAPIParam(path: string) {
    return path.replace(/\/:([^\/]+)/g, "/{$1}");
  },
};

type BuilderOptions = {
  description?: string;
  summary?: string;
  tags?: string[];
  operationId?: string;
};

export function pathDocBuilder(options: BuilderOptions) {
  const parameters: Parameter[] = [];
  let requestBody: RequestBody = {};
  let responseSchema: ResponseType;
  return {
    request(schema: RequestSchema) {
      if (schema.body) {
        requestBody = Utils.resolveRequestBody(schema.body);
      }
      if (schema.param) {
        parameters.push(...Utils.resolveParameter("param", schema.param));
      }
      if (schema.query) {
        console.log("Query:", schema.query);
        parameters.push(...Utils.resolveParameter("query", schema.query));
      }
      if (schema.header) {
        parameters.push(...Utils.resolveParameter("header", schema.header));
      }
      return this;
    },
    response(schema: any) {
      //Handle response schema generation
      return this;
    },
    $build() {
      return {
        ...options,
        parameters,
        requestBody,
      };
    },
  };
}

export function routeDocBuilder(method: string, path: string) {
  let requestSchema: any = {};
  let apiDocs: BuilderOptions = {};
  let responseSchema: any = {};
  return {
    apiDocs(doc: BuilderOptions) {
      apiDocs = doc;
      return this;
    },
    schema(request: RequestSchema, response: any) {
      requestSchema = request;
      responseSchema = response;
      return this;
    },
    $build() {
      const builder = pathDocBuilder(apiDocs)
        .request(requestSchema)
        .response(responseSchema);
      return {
        path: Utils.convertUrlParamIntoOpenAPIParam(path),
        [method]: builder.$build(),
      };
    },
  };
}

type RequestBody = {
  description?: string;
  content?: Content;
  required?: boolean;
};

type Content = {
  "application/json"?: {
    schema: any;
  };
  "application/xml"?: {
    schema: any;
  };
};

type ResponseType = {
  default: {
    description: string;
    content: {
      [key: string]: any;
    };
  };
  [key: string]: {
    description: string;
  };
};
