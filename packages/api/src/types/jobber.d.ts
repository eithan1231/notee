type DataRequest = {
  type: "http" | "schedule" | "mqtt";
  headers: Record<string, string>;
  query: Record<string, string>;
  queries: Record<string, string[]>;
  path: string;
  method: string;
  body: string;
  bodyLength: number;
};

type StoreItem<ValueType = string> = {
  key: string;
  value: ValueType;
  expiry: number | null;
  created: number;
  modified: number;
};

declare class JobberHandlerRequest {
  constructor(data: DataRequest);
  type(): DataRequest["type"];

  /**
   * Gets schedule name.
   *
   * Valid for all request types.
   */
  name(): string | null;

  /**
   * Gets HTTP request header.
   *
   * Only valid when request type is http
   */
  header(name: string): string | null;

  /**
   * Gets HTTP request query.
   *
   * Only valid when request type is http
   */
  query(name: string): string | null;

  /**
   * Gets HTTP request queries.
   *
   * Only valid when request type is http
   */
  queries(name: string): string[] | null;

  /**
   * Gets HTTP request method.
   *
   * Only valid when request type is http
   */
  method(): string;

  /**
   * Gets HTTP request path.
   *
   * Only valid when request type is http
   */
  path(): string;

  /**
   * Gets MQTT topic.
   *
   * Only valid when request type is mqtt
   */
  topic(): string;

  /**
   * Gets HTTP request body.
   *
   * Only valid when request type is http or mqtt
   */
  json<T>(): T;

  /**
   * Gets HTTP request body as text.
   *
   * Only valid when request type is http or mqtt
   */
  text(): string;

  /**
   * Gets HTTP request body as buffer.
   *
   * Only valid when request type is http or mqtt
   */
  data(): Buffer;

  /**
   * Gets HTTP request object.
   *
   * Only valid when request type is http
   */
  getHttpRequest(): Request;
}

declare class JobberHandlerResponse {
  constructor(request: JobberHandlerRequest);

  /**
   * Sets HTTP response header.
   *
   * Only valid when request type is http
   */
  header(name: string, value: string): this;

  /**
   * Sets HTTP response status.
   *
   * Only valid when request type is http
   */
  status(status: number): this;

  /**
   * Redirects to a different path.
   *
   * Only valid when request type is http
   */
  redirect(path: string, status?: number): this;

  /**
   * Appends JSON object to the response body
   *
   * Only valid when request type is http
   */
  json(data: any, status?: number): this;

  /**
   * Appends text to the response body
   *
   * Only valid when request type is http
   */
  text(data: string, status?: number): this;

  /**
   * Appends a chunk to the respones body
   *
   * Only valid when request type is http
   */
  chunk(data: Buffer): this;

  /**
   * Publishes a message to an MQTT topic.
   *
   * Only valid when request type is mqtt
   */
  publish(topic: string, body: string | Buffer | any): this;
}

declare class JobberHandlerContext {
  public async setStore(
    key: string,
    value: string,
    option?: { ttl?: number }
  ): Promise<StoreItem>;
  public async setStoreJson<T = unknown>(
    key: string,
    value: T,
    option?: { ttl?: number }
  ): Promise<void>;
  public async getStore(key: string): Promise<StoreItem | null>;
  public async getStoreJson<T = unknown>(key: string): Promise<T | null>;
  public async deleteStore(key: string): Promise<StoreItem | null>;
  public async deleteStoreJson(key: string): Promise<void>;
}
