import { getRequestContext } from '@cloudflare/next-on-pages';

/**
 * 获取 Cloudflare D1 数据库实例
 * 在 Cloudflare Pages (Edge Runtime) 下从 requestContext 获取，本地开发时降级兼容
 */
export function getDB() {
  try {
    const { env } = getRequestContext();
    if (env && env.DB) {
      return env.DB;
    }
  } catch (e) {
    // 忽略非 Edge 环境报错
  }

  if (process.env.DB) {
    return process.env.DB;
  }

  throw new Error('D1 数据库绑定未找到，请确认 wrangler.toml 已绑定 binding = "DB"');
}
