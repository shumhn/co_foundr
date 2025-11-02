export async function rpcWithRetry<T>(fn: () => Promise<T>, retries = 3, baseDelayMs = 500): Promise<T> {
  let attempt = 0;
  let lastErr: any;
  while (attempt < retries) {
    try {
      return await fn();
    } catch (e: any) {
      const msg = e?.message || '';
      const code = e?.code ?? e?.error?.code;
      const isRateLimit = code === -32429 || msg.includes('429') || /rate limited/i.test(msg);
      if (!isRateLimit) throw e;
      lastErr = e;
      const delay = baseDelayMs * Math.pow(2, attempt) + Math.floor(Math.random() * 200);
      await new Promise((res) => setTimeout(res, delay));
      attempt += 1;
    }
  }
  throw lastErr;
}
