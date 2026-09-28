export async function getCloudflareApi() {
  try {
    const cloudflare = await import(/* webpackIgnore: true */ 'cloudflare:workers');
    return cloudflare.env.API;
  } catch {
    return undefined;
  }
}
