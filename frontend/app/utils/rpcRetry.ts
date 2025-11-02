export async function rpcWithRetry<T>(fn: () => Promise<T>, retries = 5, baseDelayMs = 1200): Promise<T> {
  let attempt = 0;
  let lastErr: any;
  while (attempt < retries) {
    try {
      return await fn();
    } catch (e: any) {
      const msg = e?.message || '';
      const code = e?.code ?? e?.error?.code;
      const isRateLimit = code === -32429 || code === 429 || /429/.test(msg) || /rate limited/i.test(msg) || /Too many requests/i.test(msg);
      if (!isRateLimit) throw e;
      lastErr = e;
      const delay = baseDelayMs * Math.pow(2, attempt) + Math.floor(Math.random() * 250);
      // eslint-disable-next-line no-console
      console.warn(`RPC 429: retrying in ${delay}ms (attempt ${attempt + 1}/${retries})`);
      await new Promise((res) => setTimeout(res, delay));
      attempt += 1;
    }
  }
  throw lastErr;
}
