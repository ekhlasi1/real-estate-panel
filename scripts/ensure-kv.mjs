import { readFile, writeFile } from "node:fs/promises";

const accountId = process.env.CLOUDFLARE_ACCOUNT_ID || process.env.CF_ACCOUNT_ID;
const apiToken = process.env.CLOUDFLARE_API_TOKEN || process.env.CF_API_TOKEN;
const namespaceTitle = process.env.KV_NAMESPACE_TITLE || "real-estate-panel-kv";
const configPath = process.env.WRANGLER_CONFIG || "wrangler.toml";

if (!accountId || !apiToken) {
  throw new Error(
    "Missing CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN. Add them as deployment secrets."
  );
}

const headers = {
  Authorization: `Bearer ${apiToken}`,
  "Content-Type": "application/json",
};

async function cloudflare(path, options = {}) {
  const response = await fetch(`https://api.cloudflare.com/client/v4${path}`, {
    ...options,
    headers: { ...headers, ...(options.headers || {}) },
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok || body.success !== true) {
    const message = body.errors?.map(error => error.message).join(", ") || response.statusText;
    throw new Error(`Cloudflare API request failed: ${message}`);
  }
  return body.result;
}

const namespaces = await cloudflare(
  `/accounts/${encodeURIComponent(accountId)}/storage/kv/namespaces?per_page=1000`
);
let namespace = namespaces.find(item => item.title === namespaceTitle);

if (!namespace) {
  namespace = await cloudflare(
    `/accounts/${encodeURIComponent(accountId)}/storage/kv/namespaces`,
    { method: "POST", body: JSON.stringify({ title: namespaceTitle }) }
  );
  console.log(`Created KV namespace: ${namespaceTitle} (${namespace.id})`);
} else {
  console.log(`Using existing KV namespace: ${namespaceTitle} (${namespace.id})`);
}

let config = await readFile(configPath, "utf8");
const bindingPattern = /(binding\s*=\s*["']KV["'][\s\S]*?id\s*=\s*["'])[^"']+(["'])/;
if (!bindingPattern.test(config)) {
  throw new Error(`Could not find the KV binding in ${configPath}`);
}
config = config.replace(bindingPattern, `$1${namespace.id}$2`);
await writeFile(configPath, config);
console.log(`Updated ${configPath} with KV namespace ${namespace.id}`);
