# Deploy

Onde cada coisa roda e como subir mudança sem quebrar nada.

## Topologia

| Camada | Onde | Papel |
|---|---|---|
| Fonte (PWA) | Mac `~/projects/lf-sabado-gerente` | editar, testar, commit, push pro fork |
| Fonte (API) | VM200 `/srv/apps/lf-gerente-api/` | `server.js`, `lf-gerente.db`, `public/fotos` |
| Preview | VM200 `/srv/apps/lf-sabado-gerente` | `python3 -m http.server :9002` |
| Dev | VM200 `/srv/apps/lf-sabado-gerente-dev` | `python3 -m http.server :9003` |
| API | VM200 `:8887` | systemd `lf-gerente.service` |
| DNS público | Cloudflare tunnel `homelab-jellyfin` | 3 hostnames |

| Hostname | Aponta pra | Quem usa |
|---|---|---|
| `https://raneeralmeida.github.io/lf-sabado-gerente/` | GitHub Pages | oficial, produção |
| `https://lf-test.felipeteodoro.dev` | `192.168.31.221:9002` | preview de branch, revisão do Râneer |
| `https://lf-dev.felipeteodoro.dev` | `192.168.31.221:9003` | dev da branch `dev/felipe-testes` |
| `https://lf.felipeteodoro.dev` | `192.168.31.221:8887` | API (dados + fotos) |

Os PWAs (9002/9003) são **frontend só** — apontam pra API `lf.felipeteodoro.dev` no sync.
A API é uma instância única; não existe "preview da API".

---

## Fluxo: Mac → homelab

**O Mac é a máquina de dev. O homelab é o alvo de deploy.** Não suba servidor de preview
long-lived no Mac — quando ele dorme, o link morre e quem precisa ver não consegue.

### 1. Commit + push no Mac

```bash
cd ~/projects/lf-sabado-gerente
node --test tests/*.test.mjs      # sempre antes de commitar
git push -f origin <branch>
```

### 2. Empacotar e enviar

O `apps@` da VM200 **não tem `git` nem `rsync`**. Só existe tar + scp:

```bash
cd ~/projects
COPYFILE_DISABLE=1 tar --no-xattrs --exclude='._*' --exclude='.DS_Store' \
    -czf /tmp/lf-pwa.tar.gz lf-sabado-gerente
scp /tmp/lf-pwa.tar.gz apps@192.168.31.221:/srv/apps/
```

> **Pitfall — `._*` files.** Sem `COPYFILE_DISABLE=1` e `--exclude='._*'`, o macOS empacota
> metadata AppleDouble. Extraído no Linux, o `._lf-sabado-gerente` aparece na pasta e o
> próximo `mv` pega o diretório errado. Foi exatamente isso que apagou os dois deploys de
> preview em 19/10.

### 3. Extrair na VM200

```bash
ssh apps@192.168.31.221 'cd /srv/apps && tar -xzf lf-pwa.tar.gz && rm lf-pwa.tar.gz'
```

### 4. Reiniciar o servidor

> **Pitfall — cwd `(deleted)`.** `rm -rf` do diretório enquanto o `python3 -m http.server`
> roda **não** invalida o server. O kernel mantém o inode vivo e o processo continua
> servindo o conteúdo antigo. Sintoma: você抽出 a versão nova, o origin responde 200, mas o
> conteúdo é o velho. Diagnóstico: `ls -la /proc/<pid>/cwd` mostra `(... deleted)`.

> **Pitfall — `pkill -f` mata a própria sessão.** `ssh host 'pkill -f "http.server 9002" && ...'`
> funciona no primeiro comando e **derruba a conexão no segundo**: o `sh -c` do lado remoto
> tem a string `http.server 9002` no próprio argv, então o `pkill` se matou. Use
> `pgrep` + `kill` por PID, ou rode o `pkill` num SSH separado sem outros comandos encadeados.

Sequência segura:

```bash
# num SSH isolado, sem nada depois:
ssh apps@192.168.31.221 'for p in $(pgrep -f "http.server 9002"); do kill -9 $p; done'

# confirma que morreu antes de subir o novo
ssh apps@192.168.31.221 'ss -tlnp | grep 9002 || echo livre'

# sobe (deixe em background persistente)
ssh apps@192.168.31.221 'cd /srv/apps/lf-sabado-gerente && python3 -m http.server 9002 --bind 0.0.0.0'
```

> **Pitfall — bind.** O default do `http.server` é `127.0.0.1`, que **recusa** conexão do
> cloudflared (que entra pelo IP de LAN `192.168.31.221`, não loopback). Sempre `--bind 0.0.0.0`.

---

## Cache: por que o app não atualiza

Duas camadas, e as duas precisam de bump:

| Onde | O quê | Efeito |
|---|---|---|
| `app.js` | `const FOTOS_VERSION = '48'` | cache-buster das fotos |
| `sw.js` | `const CACHE_NAME = 'lf-turma-sabado-v48'` | cache do Service Worker |
| `index.html` | `<script src="app.js?v=48">` | edge cache do Cloudflare |

O Cloudflare edge cacheia `app.js` por ~4h e **o token de write não tem escopo
`cache:purge`** — não dá pra purgar. A saída é mudar a URL (`?v=N`), não o conteúdo. Por isso
o `index.html` referencia `app.js?v=N`: se você deployar `app.js` novo e não bumpar o `?v=`,
o edge entrega o velho com 200 e você acha que o deploy falhou.

Ordem ao bumpar: `FOTOS_VERSION` em `app.js` → `CACHE_NAME` em `sw.js` → `?v=` no
`index.html`. Os três precisam do mesmo número.

> **Pitfall — `sed` com ponto.** `sed 's/const FOTOS_VERSION = .38.;/.../'` casa `.` como
> regex "qualquer caractere" e vai happily transformar `48` em `40-dev`. Use um padrão
> específico ou edite o arquivo direto.

---

## Cloudflare

Hostname novo exige **duas** escritas — o ingress sozinho dá NXDOMAIN.

```bash
export CF_TOKEN="<cfut_...>"       # Tunnel:Edit + DNS:Edit
export ACCOUNT_ID="6567d113f3338fd35e490ea6b52323ce"
export ZONE_ID="a6c61da88a11f986b1f2fff8060e2e30"
export TUNNEL_ID="48f46cac-4991-4afa-8f6e-4c6e33018373"

# (a) ingress — leia, adicione a entrada, re-PUT preservando o resto
curl -s ".../cfd_tunnel/$TUNNEL_ID/configurations" -H "Authorization: Bearer $CF_TOKEN"
curl -X PUT ".../cfd_tunnel/$TUNNEL_ID/configurations" \
     -H "Authorization: Bearer $CF_TOKEN" -H 'Content-Type: application/json' -d @payload.json

# (b) CNAME
curl -X POST ".../zones/$ZONE_ID/dns_records" \
     -H "Authorization: Bearer $CF_TOKEN" -H 'Content-Type: application/json' \
     -d '{"type":"CNAME","name":"lf-dev","content":"48f46cac-....cfargotunnel.com","proxied":true}'
```

A entrada nova vai **antes** do catch-all `http_status:404`.

**Reload do cloudflared:** `systemctl reload` não existe nesse serviço — use `restart`:

```bash
sshpass -p '<senha>' ssh root@192.168.31.220 \
  "qm guest exec 200 -- bash -c 'systemctl restart cloudflared'"
```

> **Pitfall — `qm guest exec`.** Em KVM **não** usa o separador `--` que o `pct exec` (LXC)
> usa. A sintaxe é `qm guest exec <vmid> -- bash -c "..."`. Sem o `--`, o Proxmox responde
> `400 unable to parse option`.

O tunnel em modo run faz poll da API e reaplica em ~1s; o restart é só pra destravar config
preso.

---

## Validar

```bash
# DNS pode demorar 30s-5min pra propagar localmente
dig @1.1.1.1 +short lf-dev.felipeteodoro.dev

# bypassa o cache de DNS local e o edge
curl -sI -m 15 --resolve lf-dev.felipeteodoro.dev:443:172.67.137.179 https://lf-dev.felipeteodoro.dev/
```

Se der **502** com o origin respondendo 200 na LAN, o problema é o tunnel (ingress errado
ou cloudflared parado), não o servidor.

Validação visual é obrigatória antes de dizer que deployou — subir o server e olhar o
conteúdo real não prova que o browser mostra o certo. Use Playwright com print e
`--host-resolver-rules` pra contornar DNS/cache local, e confira o `FOTOS_VERSION` que
voltou no `app.js`.

---

## API: deploy

O `server.js` roda em `/srv/apps/lf-gerente-api/` na VM200 e **não está neste repo**. Deploy:

```bash
# testar o script contra o DB antes de aplicar qualquer coisa
scp patch.js apps@192.168.31.221:/srv/apps/lf-gerente-api/
ssh apps@192.168.31.221 'cd /srv/apps/lf-gerente-api && node patch.js && rm patch.js'

# reiniciar
sshpass -p '<senha>' ssh root@192.168.31.220 \
  "qm guest exec 200 -- bash -c 'systemctl restart lf-gerente && systemctl is-active lf-gerente'"
```

Sempre `cp server.js server.js.bak` antes de patchar. Depois de restart, **re-teste cada
endpoint que você tocou** — um patch de string pode introduzir bug de SQL sem o processo
morrer (Express não valida SQL em startup).

---

## Débida conhecida

- `python3 -m http.server` sem systemd: morre quando a sessão SSH cai, não sobrevive a reboot.
  O certo é um `lf-pwa-preview.service` com `Restart=always`.
- `server.js` fora do git: se a VM200 for reinstalada, os patches somem. Ele deveria estar
  num repo próprio.
- Fotos duplicadas (`foto.jpg` e `foto_v2.jpg` na mesma pessoa) inflando o repo.