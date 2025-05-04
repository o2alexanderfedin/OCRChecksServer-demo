# Setting Up MISTRAL_API_KEY for Cloudflare Workers

## 🔐 Storing the Secret Using Wrangler

### 1. Install Wrangler

```bash
npm install -g wrangler
```

### 2. Navigate to Your Project Directory

```bash
cd /path/to/your/worker
```

### 3. Set the Secret

```bash
npx wrangler secret put MISTRAL_API_KEY
```

> You'll be prompted to enter the value for `MISTRAL_API_KEY`. Wrangler will securely store it for your Worker.

---

## 🧪 Accessing the Secret in Your Worker

```javascript
export default {
  async fetch(request, env, ctx) {
    const apiKey = env.MISTRAL_API_KEY;
    // Use apiKey as needed
  },
};
```

---

## 🧪 Local Development

Create a `.dev.vars` file in your project root:

```
MISTRAL_API_KEY=your_api_key_here
```

> This will be used when running `wrangler dev` or `wrangler pages dev`.

> 💡 Ensure that `.dev.vars` is added to `.gitignore`.

---

## 🔗 References

- [Cloudflare Docs – Secrets](https://developers.cloudflare.com/workers/configuration/secrets/)
- [Cloudflare Docs – Local Dev Env](https://developers.cloudflare.com/workers/local-development/environment-variables/)
