# LF Sábado Gerente — Guia para AI Agents

Você é um agent de coding (Copilot em code review, Codespaces ou edição inline) lendo este arquivo. Seja qual for o seu modelo, este guia existe pra você não perder tempo descobrindo o que já está documentado e para evitar decisões que já foram tomadas.

## TL;DR

- **O que é**: PWA de gestão de futebol amador (substitui o "caderninho" da pelada de sábado)
- **Stack**: HTML5 semântico + Tailwind CSS (CDN) + JavaScript vanilla ES6+ — **zero build step, zero dependência de pacote**
- **Estado**: vive em `localStorage` (backup "anti-zumbi") — **não há backend**
- **Deploy**: GitHub Pages a partir de `main`
- **Mobile-first**: projetado pra rodar em celular à beira da quadra, com sol e pressa

## Estrutura do projeto

```
index.html          # Markup principal (3 tabs: Sorteio / Partida / Artilharia)
app.js              # Toda a lógica (~870 linhas, vanilla JS, sem módulos)
style.css           # Ajustes finos sobre Tailwind
manifest.json       # PWA manifest
sw.js               # Service worker (cache-first, offline-first)
fotos/              # Fotos dos jogadores (fallback via getAvatarUrl)
```

Não tem `package.json`, não tem bundler, não tem testes automatizados além dos que o contributor escrever. **Adicionar uma dependência nova é uma decisão grande** — pense duas vezes.

## Convenções do código

- **Variáveis globais de estado** ficam no topo do `app.js` (ex: `jogadoresData`, `cronometroRodando`, `golsPartidaAtual`, `golsJogadorPartida`, `golsFeedPartida`). Adicione novas globais aqui, não dentro de funções.
- **Funções de render** seguem o padrão `renderNomeDaCoisa()` e manipulam DOM direto (innerHTML + appendChild). Não há framework reativo — mantenha a consistência.
- **Classes Tailwind inline** são usadas livremente. Estilos customizados via CSS ficam em `style.css`.
- **Persistência**: tudo que importa vai em `salvarBackup()` e é lido em `carregarBackup()`. **Se um PR adicionar estado novo, ele precisa ir aqui também** ou não sobrevive a reload.

## Regras de negócio — não chute, leia

- **Auto-End da partida** termina automaticamente em qualquer uma (ver `registrarGol()` e `toggleCronometro()`):
  - Cronômetro zera
  - Um jogador marca 2 gols
  - Partida atinge 3 gols no total
- **Sorteio cego**: Fisher-Yates com double shuffle; goleiros separados antes. Em `realizarSorteio()`.
- **Atrasados**: jogador que chega depois do sorteio entra na fila, não no time. UI em "Adicionar Atrasado".
- **Modelo de jogador**: `id`, `nome`, `posicao` ('goleiro'|'linha'), `presente`, `foto`. Foto tem fallback pra avatar gerado por inicial via `getAvatarUrl`.

## Bugs conhecidos / armadilhas

- **Busca no modal de gol** usa `normalizarTexto()` (NFD + strip diacríticos). Não troque por `.toLowerCase()` direto — quebra "Rane" → "Râneer".
- **Minuto do gol** é derivado de `TEMPO_TOTAL - tempoRestante`, com clamp `00:00–07:00` em `minutoGolAtual()`. Não remova o clamp — o timer passa do zero às vezes.
- **`localStorage` quota**: backup é JSON serializado de toda a estrutura. ~5MB de limite; sem risco hoje mas evite guardar histórico completo de partidas.
- **Reset à meia-noite** em `verificarResetDiario()` limpa `artilhariaPelada` e `backupPelada`. Não confunda com reset de teste.

## O que **não** aceitar em PR

- **Não** introduzir React/Vue/Svelte. Não tem build step nem intenção de ter.
- **Não** mexer em `sw.js` pra adicionar cache novo sem testar offline de verdade — quebra o PWA.
- **Não** mover lógica pra arquivos novos sem motivo forte. O autor mantém tudo num `app.js` por simplicidade.
- **Não** aceitar commits em `fotos/` alteradas de outras pessoas — são fotos pessoais.
- **Não** aceitar features empilhadas em um único PR. Cada feature/bugfix = uma branch nova a partir de `upstream/main`.

## Como rodar / testar

```bash
# Abrir no browser local (sem servidor):
open index.html

# Ou servir local:
python3 -m http.server 8080
# então http://localhost:8080
```

Não há test runner instalado. Pra validar interações de DOM, use Chrome headless ou similar — descreva o que testou na descrição do PR.

## Como contribuir (PRs)

1. Sincronize sua branch com `main` do upstream **antes** de começar:
   ```bash
   git fetch upstream main
   git checkout -b feat/nome-da-coisa upstream/main
   ```
2. Commits em PT-BR ou inglês, mensagem curta descrevendo o "porquê".
3. PR com: o que faz, por que, como testar. Screenshot/GIF ajuda em mudanças visuais.
4. **Cada PR = uma branch nova a partir do `upstream/main`**. Não empilhe features.

## Sobre este guia

Este arquivo (`.github/copilot-instructions.md`) é auto-aplicado pelo GitHub Copilot em code review e edição inline. Mantemos cópia simétrica em `docs/agents-guide.md` (entrada pra outros agents) e, opcionalmente, `AGENTS.md` na raiz (convenção do Hermes Agent). O conteúdo **deve** ser idêntico entre eles. Se você atualizar um, atualize os outros.
