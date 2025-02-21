import { TSchema } from "@sinclair/typebox";

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
      parameters.push({
        name: name,
        in: pName,
        //@ts-ignore
        description: schema?.description || undefined,
        required: query.required?.includes(name),
        schema: schema,
      });
    }
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

type APIDocs = {
  description?: string;
  summary?: string;
  tags?: string[];
  operationId?: string;
};

export function pathDocBuilder(options: APIDocs) {
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

type StoreRouteOptions = {
  apiDocs: APIDocs;
  requestSchema: RequestSchema;
  responseSchema: any
}

export class OpenAPIBuilder {
  private _map: Map<string, StoreRouteOptions>;
  private _separator = ':#';
  constructor() {
    this._map = new Map()
  }
  private $$routeDocBuilder(method: string, path: string) {
    let requestSchema: any = {};
    let apiDocs: APIDocs = {};
    let responseSchema: any = {};
    return {
      apiDocs(doc: APIDocs) {
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
          method,
          path: Utils.convertUrlParamIntoOpenAPIParam(path),
          schema: builder.$build(),
        };
      },
    };
  }
  private $$buildKey(method: string, path: string) {
    return `${method}${this._separator}${path}`;
  }
  private $$decodeKey(key: string) {
    return key.split(this._separator);
  }
  setRoute(method: string, path: string, docs: StoreRouteOptions) {
    this._map.set(this.$$buildKey(method, path), docs);
  }
  $entries() {
    return this._map.entries();
  }
  $toArray() {
    return this._map.entries().toArray();
  }
  fromBuilder(prefix: string, obj: OpenAPIBuilder) {
    for (const [path, doc] of obj.$entries()) {
      const [method, routePath] = path.split(this._separator);
      this._map.set(this.$$buildKey(method, prefix + routePath), doc);
    }
  }

  private $$generateDocs(docMap: Map<string, Map<string, Record<string, unknown>>>) {
    let map = new Map<string, Record<string, unknown>>();
    for (const [path, methodInfo] of docMap.entries()) {
      const routeData: Record<string, unknown> = {};
      for (const [method, routeDoc] of methodInfo.entries()) {
        routeData[method] = routeDoc;
      }
      map.set(path, routeData);
    }
    return Object.fromEntries(map.entries())
  }
  $build() {
    const map = new Map<string, Map<string, Record<string, unknown>>>();
    for (const [routeKey, doc] of this.$toArray()) {
      const [method, path] = this.$$decodeKey(routeKey);
      const builder = this.$$routeDocBuilder(method, path).apiDocs(doc.apiDocs)
        .schema(doc.requestSchema, doc.responseSchema);
      const result = builder.$build();
      if (map.has(result.path)) {
        map.get(result.path)?.set(method, result.schema);
      } else {
        const m = new Map<string, Record<string, unknown>>();
        m.set(method, result.schema);
        map.set(result.path, m)
      }
    }
    return this.$$generateDocs(map);
  }
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
