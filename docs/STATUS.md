# STATUS — Decisões em aberto

Lista de coisas **decididas parcialmente** ou **conhecidas como dívida técnica**. Atualize quando resolver/achar uma nova.

## Aberto

- **Modelo de AI usado pra gerar o projeto**: o autor (Râneer Almeida) iniciou o projeto com assistência de AI, mas não documentou qual. Considerar adicionar uma nota no README ("Assistido por...") se ele decidir.
- **Reset de artilharia por dia vs. por semana**: hoje é diária (`verificarResetDiario`). Alguns grupos preferem semanal. Decisão do autor.
- **Persistência cross-device**: tudo é `localStorage` por device. Não há sync. Possível evolução: exportar/importar JSON; backend opcional (projeto é PWA estática, então backend seria repo separado).
- **Histórico de partidas**: o estado de partida atual vive em `backupPelada`, mas histórico de partidas passadas (escalações, gols por jogo) não é guardado. Decidir se vale guardar.
- **Service Worker versioning**: `sw.js` tem cache fixo. Estratégia de invalidação pode quebrar o app após deploy se a versão não for bumpada.

## Decidido

- **Stack**: vanilla JS + Tailwind via CDN. Sem build step. **Não introduzir framework**.
- **Estado**: 100% client-side via `localStorage`. Sem backend.
- **Mobile-first**: UI projetada pra celular à beira da quadra.
- **Branching**: cada PR = branch nova a partir de `upstream/main` limpo.
- **Busca de gol**: normalização NFD (acentos opcionais, maiúsculas OK).

## Mudanças recentes (resumo)

- **feat**: feed de gols da partida mostra autor + minuto do gol
- **fix**: busca no modal de gol ignora acentos (`Rane` → `Râneer`)
- **docs**: arquivos de orientação pra AI agents (`docs/agents-guide.md`, `.github/copilot-instructions.md`)
