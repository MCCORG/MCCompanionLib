export declare const DEFAULT_BASE_URL: string;

export declare class MCCompanionError extends Error {
  name: "MCCompanionError";
  status: number;
  code?: string;
  path?: string;
  retryAfter?: number | null;
}

export interface MCCompanionOptions {
  baseUrl?: string;
  timeout?: number;
  retries?: number;
  userAgent?: string;
  requestsPerMinute?: number;
}

export interface RequestOptions {
  query?: Record<string, string | number | boolean | null | undefined>;
  signal?: AbortSignal;
}

export interface JavaAccount {
  platform: "java";
  username: string;
  uuid: string;
  skinUrl?: string;
  headUrl?: string;
  [key: string]: unknown;
}

export interface BedrockAccount {
  platform: "bedrock";
  gamertag: string;
  xuid: string;
  floodgateuid?: string;
  skinUrl?: string;
  [key: string]: unknown;
}

export interface CombinedLookup {
  java: JavaAccount | null;
  bedrock: BedrockAccount | null;
  linked: boolean;
}

export declare class MCCompanion {
  constructor(options?: MCCompanionOptions);
  readonly options: Required<MCCompanionOptions>;

  request<T = unknown>(path: string, options?: RequestOptions): Promise<T>;

  java(identifier: string, options?: RequestOptions): Promise<JavaAccount>;
  bedrock(identifier: string, options?: RequestOptions): Promise<BedrockAccount>;
  lookup(identifier: string, options?: RequestOptions): Promise<CombinedLookup>;

  metrics<T = unknown>(options?: RequestOptions): Promise<T>;
  leaderboards<T = unknown>(options?: RequestOptions): Promise<T>;
  featuredServers<T = unknown>(options?: RequestOptions): Promise<T>;
  featuredPacks<T = unknown>(options?: RequestOptions): Promise<T>;
  featuredPack<T = unknown>(slug: string, options?: RequestOptions): Promise<T>;
  skinGallery<T = unknown>(options?: RequestOptions): Promise<T>;
  topSkins<T = unknown>(options?: RequestOptions): Promise<T>;
  skin<T = unknown>(id: string | number, options?: RequestOptions): Promise<T>;
  skinsByUser<T = unknown>(username: string, options?: RequestOptions): Promise<T>;
  profile<T = unknown>(username: string, options?: RequestOptions): Promise<T>;
  version(options?: RequestOptions): Promise<{ version: string; updated_at: string }>;
  health(options?: RequestOptions): Promise<{ status: string; time: string; uptimeSeconds: number }>;
}

declare const client: MCCompanion;
export default client;
