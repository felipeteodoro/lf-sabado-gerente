# CHANGELOG

Mudanças notáveis do projeto, em ordem inversa. (Inspirado em Keep a Changelog, mas enxuto.)

## [Unreleased]

### Added
- Feed de gols da partida na aba Partida — mostra autor e minuto de cada gol, mais recente primeiro
- Documentação pra AI agents:
  - `docs/agents-guide.md` — entrada única, lida por qualquer agent
  - `.github/copilot-instructions.md` — auto-aplicada pelo GitHub Copilot em code review
  - `docs/STATUS.md` — decisões em aberto e dívidas técnicas

### Fixed
- Segurança: nome de jogador (que vem do servidor, `POST /jogadores` é aberto) era interpolado cru em `innerHTML` e no `onerror` do avatar — um nome com `<tag>` rodava script em todo celular com sync, e um apóstrofo (`D'Ávila`) quebrava o avatar. Agora tudo passa por `escaparHtml()` e o avatar lê o nome de `data-nome` (`htmlAvatar()`)
- Sync: gols marcados com o sync desligado ou sem sinal nunca chegavam no servidor (caso 2026-11-07). Agora o app reconcilia a artilharia do dia (local − servidor) ao abrir, quando a conexão volta e ao tocar em Sync; a fila offline também é esvaziada ao abrir o app, e flushes concorrentes não duplicam envios
- Busca no modal de gol agora ignora acentos (`Rane` → `Râneer`, `Fabio` → `Fábio`)

## [1.0.0] — 2026-09-05 (commit `d819ec1`)

### Added
- PWA inicial: sorteio de times, cronômetro de partida, marcação de gols, relatórios pro WhatsApp
- Persistência anti-zumbi via `localStorage`
- Service Worker pra offline-first
- UI glassmorphism, mobile-first
