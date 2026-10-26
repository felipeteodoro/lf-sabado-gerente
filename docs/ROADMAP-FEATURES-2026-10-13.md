# LF Sábado Gerente — Roadmap de Features (debate + análise técnica)

**Status:** Propostas. Aguardando análise do @199278060421245 (Felipe).
**Estado atual (2026-10-13):** App funcionando, 53 atletas, ranking oficial bate com a planilha do Râneer, 10 partidas validadas, 187 presenças, CORS ok, fotos ok. PR #40 aberto com Richard + Túlio.
**Autor das sugestões:** Râneer Almeida (Kometa Radler).
**Autor da análise técnica:** Hermes.

---

## Resumo executivo

Râneer enviou 7 sugestões de evolução do app. Avaliei cada uma quanto a:
- **Viabilidade técnica** (FÁCIL / MÉDIO / DIFÍCIL)
- **Esforço estimado** (em horas)
- **Risco de regressão** no que já funciona
- **Dependências externas** (decisões de produto, schema do DB, etc)

**Recomendação:** começar pelas FÁCIL/MÉDIO sem dependência de decisão de produto. As DIFÍCEIS (especialmente a #7 — admin/user) ficam pra depois de debate.

| # | Feature | Viab. | Esforço | Risco | Decisão pendente |
|---|---|---|---|---|---|
| 1 | Layout do Ranking | FÁCIL | 30-60 min | Baixo | Nenhuma |
| 2 | Import WhatsApp + dicionário | MÉDIO | 4-6h | Médio | Schema DB (`apelidos` JSON), formato da lista |
| 3 | Atrasados pós-sorteio | FÁCIL | 2-3h | Baixo | Nenhuma |
| 4 | Timeline + desfazer gol | FÁCIL | 3-4h | Baixo | Nenhuma |
| 5 | Toggle linha/goleiro | FÁCIL | 2-3h | Baixo | Nenhuma |
| 6 | Wake Lock (tela sempre acesa) | MÉDIO | 1-2h | Médio | Compatibilidade Safari iOS |
| 7 | Admin / Usuário (perfis) | DIFÍCIL | 8-12h | Alto | **Autenticação (token/senha/PIN?)** |

**Total estimado se fizer TUDO:** ~22-32h, 6 PRs.

---

## Feature 1 — Novo Layout da Tela de Estatísticas (Ranking)

**Solicitação do Râneer:**
- Cabeçalho fixo no topo da lista (Pos | Foto | Nome | Gols)
- Remover numeração duplicada à direita (a partir do 4º colocado)
- Remover ícones de medalha 🥇🥈🥉
- Stats embaixo do nome, em vez de siglas (`6J · 5x · 3.29/j`)
  - Linha 1: "10 presenças"
  - Linha 2: "14 gols"
  - Linha 3: "1.40 gols/jogo"

**Análise técnica:**

| Item | Detalhe |
|---|---|
| **Viabilidade** | FÁCIL — CSS + 1 função JS |
| **Arquivos** | `app.js` (função `renderListaArtilheiros`), `style.css` (sticky header) |
| **Risco** | Baixo. Pura mudança visual. |
| **Esforço** | 30-60 min |
| **Aceitação** | [testável] Cabeçalho `Pos | Foto | Atleta | Gols` aparece sticky ao rolar. [testável] Stats aparecem como 3 linhas verticais com label. [testável] Sem medalhas. [subjetivo] Visual mais limpo. |
| **Pré-requisito** | Nenhum |
| **PR** | `feat/ranking-layout` (1 commit, bump SW) |

**Ordem sugerida:** 1º (baseia o visual dos outros cards).

---

## Feature 2 — Importação Inteligente da Lista do WhatsApp

**Solicitação do Râneer:**
- Área pra colar texto da lista de presença do WhatsApp
- App lê o texto e marca check automático nos nomes
- DB precisa de campo `apelidos_conhecidos` por jogador
- Match cruzando string da lista com apelidos permitidos

**Análise técnica:**

| Item | Detalhe |
|---|---|
| **Viabilidade** | MÉDIO — backend novo + UI nova + schema DB |
| **Arquivos** | `server.js` (campo apelidos + endpoint), `app.js` (UI colar texto), `app.js` (matching) |
| **Risco** | Médio. Schema novo + matching pode ter falsos positivos/negativos. |
| **Esforço** | 4-6h (2 PRs: backend + PWA) |
| **Aceitação** | [testável] Colar "Tchobba, Raneer, Lé" marca 3 atletas. [testável] Nome não reconhecido fica em vermelho. [testável] Apelido cadastrado no DB matcha mesmo com grafia diferente. [subjetivo] UI intuitiva. |
| **Pré-requisito** | Râneer enviar lista real de apelidos que ele usa |

**Decisões pendentes (CRÍTICAS — sem elas não dá pra implementar):**

1. **Onde mora o dicionário?**
   - (A) DB: coluna `apelidos` TEXT JSON na tabela `jogadores` (`["Tchobba","Tchob"]`)
   - (B) PWA localStorage
   - **Recomendação: A** (DB é fonte de verdade do projeto)

2. **Match:**
   - (A) Exato + normalização de acentos/caixa
   - (B) Fuzzy com Levenshtein ≤ 2
   - **Recomendação: A** (previsível, evita falsos positivos)

3. **Nomes não reconhecidos:**
   - (A) Destacar em vermelho pra revisão manual
   - (B) Criar "rascunho" de atleta novo
   - **Recomendação: A** (não cadastra automático, mantém controle do Râneer)

4. **Onde fica a UI de colar texto?**
   - (A) Botão "Colar lista do WhatsApp" no painel do Sorteio
   - (B) Aba separada "Importar"
   - **Recomendação: A** (contexto natural)

5. **Apelidos reais pra popular o dicionário:**
   - Râneer precisa mandar a lista. Ex: "Tchobba" = "Eduardo Tchobba" ou apelido? "Kaique M." = "Kaique Mar." abreviação? "Léo" = "Leandro Bar."? Etc.

**Schema proposto (se for Opção A):**
```sql
ALTER TABLE jogadores ADD COLUMN apelidos TEXT DEFAULT '[]';
-- Exemplo: UPDATE jogadores SET apelidos='["Tchobba","Tchob"]' WHERE id='11';
```

**Ordem sugerida:** 4º (depois do layout, atrasados e timeline).

---

## Feature 3 — Inclusão de Atrasados Pós-Sorteio

**Solicitação do Râneer:**
- Se alguém chegar depois que o sorteio já foi feito, deve haver opção para selecionar manualmente dentro da partida
- Garante que entra no jogo e que presença fica salva no DB daquele sábado

**Análise técnica:**

| Item | Detalhe |
|---|---|
| **Viabilidade** | FÁCIL — UI nova + endpoint que já existe |
| **Arquivos** | `app.js` (UI no painel do Sorteio) |
| **Risco** | Baixo. Feature aditiva. |
| **Esforço** | 2-3h |
| **Aceitação** | [testável] Botão "+ Adicionar jogador à partida ativa" aparece após o sorteio. [testável] Ao selecionar, jogador entra na contagem de presenças do dia. [testável] `POST /presencas` é chamado. |
| **Pré-requisito** | Endpoint `/presencas` precisa estar funcionando (segundo skill `lf-sabado-gerente`, PR #21 já tem isso, mas com bug atual) |

**Pré-trabalho sugerido:**
- Validar se `POST /presencas` atual funciona e se o bug do PR #21 está resolvido
- Se não, PR pequeno só pra corrigir o bug antes desta feature

**Ordem sugerida:** 3º.

---

## Feature 4 — Timeline de Gols + Botão Desfazer

**Solicitação do Râneer:**
- Manter botão atual de registrar gol
- Adicionar lista sequencial embaixo (timeline)
- Cada item: Nome do jogador, minuto, em qual jogo (Partida 1, 2...)
- Ícone de lixeira pra apagar cada gol
- DELETE ajusta o DB na hora

**Análise técnica:**

| Item | Detalhe |
|---|---|
| **Viabilidade** | FÁCIL — endpoint `DELETE /gols/:id` JÁ EXISTE (skill confirma) |
| **Arquivos** | `app.js` (modificar `renderFeedGols` para incluir botão lixeira) |
| **Risco** | Baixo. |
| **Esforço** | 3-4h |
| **Aceitação** | [testável] Lista cronológica aparece embaixo do feed de gols. [testável] Ícone lixeira visível em cada item. [testável] Click no lixeira chama `DELETE /gols/:id`. [testável] Após delete, ranking e feed atualizam. [testável] Backups anteriores respeitados. |
| **Pré-requisito** | Nenhum. Endpoint existe. |
| **PR** | `feat/gol-timeline-delete` (1 commit, bump SW) |

**Ordem sugerida:** 2º (depois do layout). Ensina o padrão de DELETE que vai ser útil em outras telas.

---

## Feature 5 — Toggle Permanente de Posição (Linha/Goleiro)

**Solicitação do Râneer:**
- Botão de edição no perfil ou ao lado do nome do atleta
- Mudar entre "Goleiro" e "Linha"
- Mudança permanente no DB
- Ajuda o app no balanceamento de 1 goleiro por time

**Análise técnica:**

| Item | Detalhe |
|---|---|
| **Viabilidade** | FÁCIL — endpoint `POST /jogadores` JÁ atualiza posição |
| **Arquivos** | `app.js` (UI no card do atleta), `style.css` (estilo do botão) |
| **Risco** | Baixo. |
| **Esforço** | 2-3h |
| **Aceitação** | [testável] Botão "Trocar posição" visível em cada atleta. [testável] Click muda no DB. [testável] Próximo sorteio respeita a nova posição. [testável] Sync entre PWA e servidor. |
| **Pré-requisito** | Nenhum. |
| **PR** | `feat/posicao-toggle` (1 commit, bump SW) |

**Ordem sugerida:** 3º (paralelo com atrasados).

---

## Feature 6 — Tela Sempre Ativa (Wake Lock)

**Solicitação do Râneer:**
- Implementar Wake Lock nativo via API do navegador
- Impedir tela de apagar/bloquear enquanto cronômetro roda

**Análise técnica:**

| Item | Detalhe |
|---|---|
| **Viabilidade** | MÉDIO — API nativa, mas com ressalvas |
| **Arquivos** | `app.js` (toggle no cronômetro) |
| **Risco** | Médio. Compatibilidade cross-browser. |
| **Esforço** | 1-2h |
| **Aceitação** | [testável] Chrome Android: tela fica acesa durante o cronômetro. [testável] Toggle on/off no painel. [testável] Wake Lock liberado quando cronômetro pausa. [testável] Aviso de "navegador não suporta" se feature ausente. |
| **Pré-requisito** | Nenhum. |

**Detalhes técnicos:**

- API: `navigator.wakeLock.request('screen')` retorna um `WakeLockSentinel` que deve ser `release()` quando não precisar mais
- Compatibilidade:
  - Chrome/Edge Android: ✅ nativo
  - Chrome Desktop: ✅
  - Safari iOS: ⚠️ não suporta (precisa fallback/aviso)
  - Safari macOS: ❌
- **Sugestão:** toggle explícito "Manter tela acesa" no cronômetro (não default on, porque drena bateria)

**Ordem sugerida:** 5º (feature isolada, não bloqueia outras).

---

## Feature 7 — Perfis de Acesso (Admin / Usuário)

**Solicitação do Râneer:**

**Perfil Admin:**
- Acesso total e exclusivo
- Marcar/editar lista de presença
- Realizar sorteio
- Soltar cronômetro
- Marcar gols
- Alterar posições

**Perfil Usuário:**
- Apenas visualização
- Ver Ranking Geral
- Ver times sorteados do dia
- **Tela do sorteio zera à meia-noite** (indisponível no restante da semana)

**Análise técnica:**

| Item | Detalhe |
|---|---|
| **Viabilidade** | DIFÍCIL — maior feature, exige decisões de produto |
| **Arquivos** | `server.js` (auth + middleware), `app.js` (tela de login + UI condicional), `index.html` (UI condicional) |
| **Risco** | Alto. Mudança grande de UX, exige migração. |
| **Esforço** | 8-12h |
| **Aceitação** | [testável] Login com token funciona. [testável] Admin vê botões de ação. [testável] Usuário vê só visualização. [testável] Às 00:00, tela do sorteio do usuário zera visualmente. [testável] Backend rejeita POSTs de usuário comum. |
| **Pré-requisito** | **Decisões de produto (CRÍTICAS)** |

**Decisões pendentes (BLOQUEIA implementação):**

1. **Autenticação:**
   - (A) Token único (senha fixa compartilhada entre admins)
   - (B) Login individual (cada admin tem user/senha)
   - (C) PIN curto (4-6 dígitos)
   - (D) Nenhuma (PWA público, qualquer um pode ser admin local)
   - **Recomendação começar: A** (mais simples, evolui pra B se precisar)

2. **Onde o token fica?**
   - (A) localStorage do PWA (simples mas compartilhado entre todos no mesmo celular)
   - (B) JWT no backend
   - **Recomendação: B** (mais seguro, sobrevive reinstall do PWA)

3. **"Zerar à meia-noite" pra usuário:**
   - (A) Frontend força reset visual do estado local
   - (B) Backend retorna `null` no `partida` após meia-noite
   - **Recomendação: B** (servidor é autoridade)

4. **Quem instala é admin por default?**
   - (A) Sim, primeiro login é admin
   - (B) Não, primeiro login é usuário, admin tem que ser criado por outro admin
   - **Recomendação: A** (Râneer é o owner, faz sentido)

**Schema proposto (se for Opção A com token):**
```sql
CREATE TABLE IF NOT EXISTS admins (
  token_hash TEXT PRIMARY KEY,
  nome TEXT,
  created_at TEXT
);
```

**Ordem sugerida:** 6º e último. Decidir primeiro todas as opções de autenticação.

---

## Ordem de execução sugerida

1. **PR 1: Feature 1 (Layout Ranking)** — 30-60 min, base visual
2. **PR 2: Feature 4 (Timeline + Desfazer Gol)** — 3-4h, ensina padrão DELETE
3. **PR 3: Feature 5 (Toggle Posição)** — 2-3h, expande UI
4. **PR 4: Feature 3 (Atrasados)** — 2-3h, complementa
5. **PR 5: Feature 6 (Wake Lock)** — 1-2h, feature isolada
6. **PR 6: Feature 2 (Import WhatsApp)** — 4-6h, depende de decisão de schema
7. **PR 7: Feature 7 (Admin/User)** — 8-12h, depende de decisão de auth

**Total:** ~22-32h, 6-7 PRs.

---

## Decisões que o @199278060421245 (Felipe) precisa tomar

**Bloqueantes (não dá pra começar sem):**
- [ ] Feature 2: confirmar schema `apelidos` no DB
- [ ] Feature 7: confirmar estratégia de autenticação (token único? PIN? outro?)

**Não-bloqueantes (podem ser decididas durante a implementação):**
- [ ] Feature 6: comportamento no Safari iOS (sem suporte nativo a Wake Lock)
- [ ] Feature 1: cores exatas do novo layout
- [ ] Feature 2: lista de apelidos reais do Râneer (popular dicionário)
- [ ] Feature 7: reset à meia-noite é no front ou no back?

**Pré-trabalho (validar antes de PR):**
- [ ] Validar que `POST /presencas` (PR #21) funciona — feature 3 depende disso
- [ ] Validar que `DELETE /gols/:id` (já existe) funciona — feature 4 depende disso

---

## Riscos globais do roadmap

| Risco | Probabilidade | Impacto | Mitigação |
|---|---|---|---|
| Quebrar app que tá funcionando | Baixa | Alto | Cada PR pequeno + Playwright validation + Felipe valida antes de merge |
| Decisão de auth travar feature 7 | Média | Médio | Decidir antes de começar a feature |
| Safari iOS quebrar Wake Lock | Alta | Baixo | Feature é aditiva, com fallback de aviso |
| Matching fuzzy errar nome | Média | Médio | Começar com match exato + normalização |
| Bumps de SW acumularem (cache) | Baixa | Médio | Padrão P-9: cada PR bumpa CACHE_NAME |

---

## Como esse documento evolui

- Status "Proposta" → "Em debate" → "Aprovado" → "Em implementação" → "Pronto"
- Cada feature ganha issue próprio no GitHub se aprovada
- PRs vinculam à issue correspondente

**Próximo passo:** esperar retorno do Felipe sobre as decisões bloqueantes. Quando chegar, a gente prioriza e começa pelo PR 1 (Layout).
