# STATUS — Decisões em aberto

Dívida técnica e decisões parciais. Atualize quando resolver.

## Decidido (e já implementado — não reabra sem motivo)

- **Stack**: vanilla JS + Tailwind via CDN. Sem build step, sem `package.json`, sem framework.
- **Offline-first**: sem rede, tudo funciona. O que falhar enfileira no `localStorage` e
  flusha no evento `online`.
- **Mobile-first**: UI projetada pra celular à beira da quadra.
- **Sync é opt-in**: desligado por padrão. Sem endpoint configurado, o app **não faz nenhum
  fetch** e é idêntico ao que era antes do backend existir. Com endpoint, entra a camada de
  sync (`lfSync*` em `app.js`).
- **Servidor é autoridade no nome**: `/jogadores` e `/import` usam `ON CONFLICT DO NOTHING`
  / `INSERT OR IGNORE`. Um app com lista local desatualizada não sobrescreve rename feito
  no DB.
- **Versionamento de cache em 3 lugares**: `FOTOS_VERSION` (app.js), `CACHE_NAME` (sw.js),
  `?v=` no `index.html`. Os 3 precisam do mesmo número — ver `docs/deploy.md`.
- **Busca de gol**: normalização NFD (acentos opcionais, maiúsculas OK).
- **Branching**: cada PR = branch nova a partir de `upstream/main` limpo.

## Aberto

### Dívida técnica

- **`server.js` da API não está neste repo.** Vive em `/srv/apps/lf-gerente-api/` na VM200,
  fora do GitHub. Se a VM for reinstalada, tudo que foi patchado se perde. Deveria ter repo
  próprio (ou `api/` neste repo). **É o item mais importante da lista.**
- **Preview sem systemd.** `python3 -m http.server` em sessão SSH: morre quando a sessão cai,
  não sobrevive a reboot, e `rm -rf` do diretório deixa o processo servindo inode deletado
  (já causou 502 silencioso). Deveria ser um `lf-pwa-preview.service` com `Restart=always`.
- **Fotos duplicadas.** `solidao.jpg` + `solidao_v2.jpg`, `paulo.jpg` + `paulo_v2.jpg`, etc.
  `fotos/logo.png` tem 644KB. Sem `.gitignore` no repo.
- **7 IDs slug legados** convivem com os numéricos: `vitim`, `marcelim`, `dudu`,
  `carlos-fernando`, `fernando-amigo`, `fransergio-r`, `amigo-felipe-s`. Nenhum tem gol.
  Sugestão: confirmar com o autor se são apelidos de jogadores já existentes (ex. `marcelim`
  → Marcelo Mam. id 48) e migrar. `POST /jogadores` já **rejeita slug novo** (400), então a
  dívida não cresce.
- **`jogadores.id` é TEXT, não INTEGER.** Consequência: `gols.jogador_id` é TEXT e mandar int
  direto em SQL quebra o FK. O endpoint já coerce. Migrar pra INTEGER exigiria renomear os
  7 slugs.
- **Sem autenticação na API.** Endpoints abertos na internet. Aceitável pra grupo de amigos
  num PWA, mas vale registrar como risco.
- **`/import` aceita payload arbitrário.** Não valida shape nem tamanho.

### Decisões de produto

- **Reset de artilharia por dia vs. por semana**: hoje é diária (`verificarResetDiario`).
  Alguns grupos preferem semanal. Decisão do autor.
- **Partidas fora do sábado**: sábado é o jogo principal, mas há peladas em outros dias
  (26/09, 17/10, 19/10...). O app trata toda partida igual. A lista de presence e a cobrança do
  futi são só de sábado — vale explicitar essa regra ou suportar os dois fluxos?
- **Modelo de AI usado pra gerar o projeto**: o autor iniciou com assistência de AI mas não
  documentou qual. Considerar nota no README.

## Mudanças recentes

- **fix**: fotos não carregavam — 6 templates com `\${fotoUrl(...)}` escapado (virava string
  literal na URL, `<img>` dava 404 e caía no fallback). Junto: trio de cache em `docs/deploy.md`.
- **feat**: `POST /jogadores` rejeita slug novo (400) — trava a dívida de ID no futuro.
- **fix**: `POST /gols` coerce `jogador_id`/`partida_id` pra string (FK quebrava com int).
- **fix**: `INSERT INTO partidas` com aspas duplas em `'ativa'` — SQL inválido, quebrava
  qualquer gol em partida não-atual.
- **feat**: artilharia Hoje/Geral, sync opt-in, validação de ID na hidratação.
- **fix**: busca no modal de gol ignora acentos (`Rane` → `Râneer`).
- **docs**: `docs/api.md` (API que não tinha doc) e `docs/deploy.md` (topologia + pitfalls).