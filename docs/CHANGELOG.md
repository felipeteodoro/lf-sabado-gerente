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
- Busca no modal de gol agora ignora acentos (`Rane` → `Râneer`, `Fabio` → `Fábio`)

## [1.0.0] — 2026-09-05 (commit `d819ec1`)

### Added
- PWA inicial: sorteio de times, cronômetro de partida, marcação de gols, relatórios pro WhatsApp
- Persistência anti-zumbi via `localStorage`
- Service Worker pra offline-first
- UI glassmorphism, mobile-first
