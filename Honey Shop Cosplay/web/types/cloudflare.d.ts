declare module 'cloudflare:workers' {
  export const env: { API?: { fetch(request: Request): Promise<Response> }; API_ORIGIN?: string };
}
