# Testes

Zero dependências: `node:test` (built-in do Node 18+) roda o `app.js` real
num contexto `vm` com `localStorage`/`fetch`/DOM mockados.

```bash
node --test tests/sync.test.mjs
```

Não há package.json por design (repo sem build step) — o runner é o próprio Node.
