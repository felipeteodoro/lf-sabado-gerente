# API — Gerente LF Sábado

Backend opcional que persiste o histórico de artilharia do PWA. Express + SQLite, sem
autenticação. **O PWA funciona 100% sem ele** — o sync é opt-in e desligado por padrão.

- **BaseURL pública:** `https://lf.felipeteodoro.dev`
- **Porta local (VM200):** `8887` (`PORT` env override)
- **Stack:** Node 24+ / Express / better-sqlite3
- **Serviço systemd:** `lf-gerente.service` na VM200

---

## Schema

Quatro tabelas. Todas com FK ativa (`PRAGMA foreign_keys = ON`).

```sql
CREATE TABLE jogadores (
    id        TEXT PRIMARY KEY,           -- numérico OU slug legado (ver "IDs" abaixo)
    nome      TEXT NOT NULL,
    posicao   TEXT NOT NULL DEFAULT 'linha' CHECK(posicao IN ('goleiro','linha')),
    foto      TEXT,                       -- URL absoluta ou null
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE partidas (
    id        INTEGER PRIMARY KEY AUTOINCREMENT,
    data      TEXT NOT NULL DEFAULT (date('now','localtime')),  -- YYYY-MM-DD
    status    TEXT NOT NULL DEFAULT 'ativa' CHECK(status IN ('ativa','encerrada')),
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE gols (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    partida_id INTEGER NOT NULL REFERENCES partidas(id),
    jogador_id TEXT    NOT NULL REFERENCES jogadores(id),
    time       TEXT    NOT NULL DEFAULT 'time1' CHECK(time IN ('time1','time2')),
    minuto     TEXT,                      -- livre: '02:23', '45', null
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE presencas (
    data       TEXT NOT NULL,             -- YYYY-MM-DD
    jogador_id TEXT NOT NULL REFERENCES jogadores(id),
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    PRIMARY KEY (data, jogador_id)        -- idempotente por dia
);
```

### IDs — a pegadinha

`jogadores.id` é **TEXT**, não INTEGER. Isso é deliberado: existem **7 slugs legados**
(`vitim`, `marcelim`, `dudu`, `carlos-fernando`, `fernando-amigo`, `fransergio-r`,
`amigo-felipe-s`) que coexistem com os IDs numéricos.

Consequência prática: **`gols.jogador_id` é TEXT e o `better-sqlite3` falha o FK se você
mandar `11` (int) em vez de `"11"` (string)** — erro `FOREIGN KEY constraint failed`.
O endpoint `/gols` faz `String()` no input, então o curl com int funciona. Se você escrever
SQL direto, use string.

**Novos cadastros são obrigatoriamente numéricos** — `POST /jogadores` rejeita slug novo
com 400. Slugs antigos continuam aceitos (read-only) para o app não quebrar o sync.

---

## Endpoints

### `GET /health`

```json
{ "ok": true, "ts": 1792599004282 }
```

### `GET /estado`

Snapshot completo pro boot/hidratação do app. **É o endpoint mais usado** (1 por carga).

```json
{
  "ok": true,
  "partida": { "id": 24, "data": "2026-10-19", "status": "ativa", "created_at": "..." },
  "jogadores": [ { "id": "1", "nome": "Râneer", "posicao": "linha", "foto": "https://...", "created_at": "..." } ],
  "gols": [],
  "artilharia": [ { "id": "4", "nome": "Eduardo Bol.", "gols": 33, "partidas": 9, "presencas": 11, "media_gols": 3.0, "foto": "..." } ],
  "artilharia_hoje": [ /* mesmo shape, só gols da partida de hoje */ ]
}
```

Chave de gotcha: o acumulado geral é **`artilharia`**, não `artilharia_geral`. O de hoje é
`artilharia_hoje`.

### `POST /jogadores`

```bash
curl -X POST https://lf.felipeteodoro.dev/jogadores \
  -H 'Content-Type: application/json' \
  -d '{"id":"60","nome":"Zé Novo","posicao":"linha","foto":null}'
```

- `id` + `nome` obrigatórios
- `id` novo precisa ser numérico (slug novo → 400)
- Upsert com `ON CONFLICT(id) DO NOTHING` — **o servidor é autoridade no nome**. Um app com
  lista local desatualizada não sobrescreve um rename feito no DB.
- `foto` só preenche se o campo ainda estiver vazio.

Resposta: `{ "ok": true }`

### `DELETE /jogadores/:id`

Retorna 500 se o jogador tiver gols/presenças (FK). Apague os filhos primeiro.

### `POST /partidas`

```bash
-d '{"data":"2026-10-25"}'   # opcional, default = hoje
```

### `POST /partidas/:id/encerrar`

Marca como `encerrada`. Não há delete de partida.

### `POST /presencas`

```bash
-d '{"jogador_id":"49","data":"2026-10-19"}'
```

Idempotente por `(data, jogador_id)` — reenviar o mesmo dia não duplica.

### `GET /presencas`

Todos os registros. `GET /presencas/:data` filtra por `YYYY-MM-DD`.

### `POST /gols`

```bash
curl -X POST https://lf.felipeteodoro.dev/gols \
  -H 'Content-Type: application/json' \
  -d '{"jogador_id":"49","partida_id":24,"time":"time1","minuto":"06:00"}'
```

- `jogador_id` e `partida_id` obrigatórios. Ambos são coercedos pra string internamente.
- **Guarda de data:** se a `partida_id` enviada não for de hoje, o gol cai na partida ativa
  de hoje (criando uma se preciso). Isso existe porque a partida de sábado anterior
  costuma ficar com `status='ativa'` e engolia os gols do dia seguinte.
- `time` só aceita `time1`/`time2`; qualquer outro vira `time1`.
- `minuto` é texto livre (`'02:23'`, `'45'`, `null`).

Resposta inclui o gol criado:

```json
{ "ok": true, "partida_id": 24, "gol": { "id": 481, "partida_id": 24, "jogador_id": "49", "time": "time1", "minuto": "06:00", "created_at": "..." } }
```

### `DELETE /gols/:id`

Remove o gol. É o caminho correto — **não existe** `POST /gols/delete`.

### `POST /import`

Backup/restore do app. Aceita o payload do `localStorage`. Usa `INSERT OR IGNORE`, então
**nunca sobrescreve** dado existente no servidor — é a rede de segurança contra um app com
estado velho sobrescrever o DB.

### `GET /fotos/*`

`express.static` com `maxAge: '7d'`. CORS liberado. As fotos no PWA apontam pra
`https://lf.felipeteodoro.dev/fotos/<slug>.jpg` (cross-origin do GitHub Pages).

---

## Onde o código mora

**Este repo (`lf-sabado-gerente`) é só o PWA — o `server.js` não está aqui.** A API roda em
`/srv/apps/lf-gerente-api/server.js` na VM200, fora do versionamento do GitHub. Se você tá
lendo isso procurando o código da API no repo, ele não está aqui (e isso é uma dívida
conhecida — ver `docs/STATUS.md`).