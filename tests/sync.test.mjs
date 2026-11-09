// Testes da camada de sincronização (lfSync*) — PR feat/sync-backend
// Zero dependências: usa node:test (built-in) + vm para rodar o app.js real
// com localStorage/fetch/DOM mockados. Rodar com: node --test tests/
//
// O que garante:
// 1. Sync DESLIGADO → nenhum fetch, artilharia 100% localStorage (comportamento original)
// 2. Sync LIGADO + online → gol vai pro servidor E pro localStorage (os dois caminhos)
// 3. Sync LIGADO + offline → gol fica na fila no localStorage, nada se perde
// 4. Volta a conexão → fila esvazia pro servidor
// 5. Hidratação → artilharia do servidor só SUBE os totais, nunca desce
// 6. Config → rejeita endpoint não-https

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const APP_JS = readFileSync(path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'app.js'), 'utf8');

// --- Mocks mínimos ----------------------------------------------------

// Elemento DOM "que absorve tudo": qualquer propriedade lida devolve outro
// elemento absorvente; qualquer setter aceita. Suficiente pro app.js bootar.
function makeEl() {
  const base = {
    classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } },
    style: {},
    appendChild(child) { return child; },
    remove() {},
    addEventListener() {},
    insertAdjacentHTML() {},
    focus() {},
    click() {},
    querySelectorAll() { return []; },
    querySelector() { return null; },
    innerHTML: '', innerText: '', textContent: '', value: '', className: '',
  };
  return new Proxy(base, {
    get(target, prop) {
      if (prop in target) return target[prop];
      return makeEl();
    },
    set(target, prop, value) { target[prop] = value; return true; },
  });
}

function makeStorage(initial = {}) {
  const store = new Map(Object.entries(initial));
  return {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => store.set(k, String(v)),
    removeItem: (k) => store.delete(k),
    clear: () => store.clear(),
    _dump: () => Object.fromEntries(store),
  };
}

// Carrega o app.js real num contexto fresco. Retorna o "world" com as
// funções globais (registrarGol, lfSync*, etc) e os mocks pra inspeção.
// Estado do dia já marcado → boot não dispara o reset à meia-noite
// (limparia artilhariaPelada/backupPelada e invalidaria o cenário do teste)
const HOJE = { dataPelada: new Date().toDateString() };

function carregarApp({ fetchImpl, storageInitial = {} } = {}) {
  const storage = makeStorage({ ...HOJE, ...storageInitial });
  const fetchCalls = [];
  const windowHandlers = {};
  const world = {
    console: { log() {}, error() {}, warn() {}, info() {} },
    alert: (msg) => { world._alerts.push(String(msg)); },
    prompt: () => null,
    confirm: (msg) => (world._confirmAnswer !== false),
    fetch: async (url, opts) => {
      fetchCalls.push({ url: String(url), opts });
      return fetchImpl ? fetchImpl(String(url), opts) : new Response('{}');
    },
    // Executa o callback sincronamente. O app.js usa setTimeout no
    // finalizarPartidaTempo (alert 'Fim de Jogo') e no boot (hidratacao).
    // Com no-op, o auto-finalize nunca dispara e o teste nao ve o alert.
    setTimeout: (fn) => { fn(); return 0; },
    setInterval: () => 0,
    clearInterval() {},
    localStorage: storage,
    navigator: {},
    document: {
      getElementById: () => makeEl(),
      createElement: () => makeEl(),
      addEventListener() {},
      body: makeEl(),
      visibilityState: 'visible',
      referrer: '',
    },
    _alerts: [],
    _confirmAnswer: true,
  };
  world.window = {
    addEventListener: (ev, fn) => { (windowHandlers[ev] ||= []).push(fn); },
    scrollTo() {},
    matchMedia: () => ({ matches: false, addEventListener() {}, removeEventListener() {} }),
    navigator: { standalone: false },
  };
  const context = vm.createContext(world);
  vm.runInContext(APP_JS, context, { filename: 'app.js' });
  return { world, storage, fetchCalls, windowHandlers };
}

const ESTADO_OK = (artilharia = []) => ({
  ok: true,
  partida: null,
  jogadores: [],
  gols: [],
  artilharia,
  // Hidratação do boot usa a do dia; por padrão os testes tratam como mesma
  artilharia_hoje: artilharia,
});

const jsonResp = (obj) => ({
  ok: true,
  json: async () => obj,
});

// --- Testes -----------------------------------------------------------

test('sync desligado: registrar gol NÃO faz fetch e artilharia fica no localStorage', async () => {
  const { world, storage, fetchCalls } = carregarApp();

  // Sem lfSyncEndpoint configurado → sync inativo
  assert.equal(storage.getItem('lfSyncEndpoint'), null);
  assert.equal(world.lfSyncAtivo(), false);

  world.registrarGol(22, 'Felipe Teo.');

  // Nenhum request saiu do aparelho
  assert.equal(fetchCalls.length, 0);

  // Fallback localStorage: artilharia registrada como sempre foi
  const artilharia = JSON.parse(storage.getItem('artilhariaPelada'));
  assert.equal(artilharia[22].gols, 1);
  assert.equal(artilharia[22].nome, 'Felipe Teo.');

  // Backup anti-zumbi também segue salvando
  const backup = JSON.parse(storage.getItem('backupPelada'));
  assert.equal(backup.golsPartidaAtual, 1);
  assert.ok(Array.isArray(backup.golsFeedPartida));
  assert.equal(backup.golsFeedPartida.length, 1);
});

test('sync ligado + online: gol vai pro servidor E pro localStorage', async () => {
  const { world, storage, fetchCalls } = carregarApp({
    storageInitial: { lfSyncEndpoint: 'https://lf.exemplo.dev' },
    fetchImpl: async (url) => {
      if (url.endsWith('/partidas')) return jsonResp({ ok: true, partida: { id: 7 } });
      return jsonResp({ ok: true });
    },
  });

  assert.equal(world.lfSyncAtivo(), true);

  await world.lfSyncRegistrarGol(22, 'Felipe Teo.', '03:12');

  // Criou a partida no servidor e memorizou o id
  assert.equal(storage.getItem('lfSyncPartidaId'), '7');
  const urls = fetchCalls.map((c) => c.url);
  assert.ok(urls.some((u) => u.endsWith('/partidas')), 'deve chamar POST /partidas');
  assert.ok(urls.some((u) => u.endsWith('/gols')), 'deve chamar POST /gols');
  assert.ok(urls.some((u) => u.endsWith('/jogadores')), 'deve chamar POST /jogadores');

  // Payload do gol com o id da partida criada
  const gol = fetchCalls.find((c) => c.url.endsWith('/gols'));
  const body = JSON.parse(gol.opts.body);
  assert.equal(body.partida_id, 7);
  assert.equal(body.jogador_id, '22');
  assert.equal(body.minuto, '03:12');

  // E o localStorage continua sendo fonte da verdade offline
  const artilharia = JSON.parse(storage.getItem('artilhariaPelada')) || {};
  world.registrarGol(22, 'Felipe Teo.');
  const depois = JSON.parse(storage.getItem('artilhariaPelada'));
  assert.equal(depois[22].gols, 1);
});

test('sync ligado + offline: gol entra na fila do localStorage e nada se perde', async () => {
  const { world, storage, fetchCalls } = carregarApp({
    storageInitial: { lfSyncEndpoint: 'https://lf.exemplo.dev' },
    fetchImpl: async () => { throw new TypeError('Failed to fetch'); }, // sem rede
  });

  // Partida não consegue ser criada (offline) — não deve explodir
  await world.lfSyncRegistrarGol(22, 'Felipe Teo.', '02:45');

  // O caminho de fila: lfSyncEnviar enfileira quando fetch falha
  await world.lfSyncEnviar('/gols', { partida_id: 7, jogador_id: '22', minuto: '02:45' });

  const fila = JSON.parse(storage.getItem('lfSyncFila'));
  // O jogador vai antes do gol (FK) e também espera na fila
  assert.deepEqual(fila.map((f) => f.path), ['/jogadores', '/gols']);

  // Registrar gol offline não bloqueia o app (artilharia local segue viva)
  world.registrarGol(22, 'Felipe Teo.');
  const artilharia = JSON.parse(storage.getItem('artilhariaPelada'));
  assert.equal(artilharia[22].gols, 1);
});

test('conexão volta: lfSyncFlush esvazia a fila pro servidor', async () => {
  const filaInicial = {
    lfSyncEndpoint: 'https://lf.exemplo.dev',
    lfSyncFila: JSON.stringify([
      { path: '/gols', body: { partida_id: 7, jogador_id: '22', minuto: '02:45' } },
      { path: '/gols', body: { partida_id: 7, jogador_id: '1', minuto: '05:10' } },
    ]),
  };
  const { world, storage, fetchCalls } = carregarApp({
    storageInitial: filaInicial,
    fetchImpl: async () => jsonResp({ ok: true }),
  });

  await world.lfSyncFlush();

  // O boot do app com sync ativo dispara 1 fetch de hidratação (/estado);
  // os 2 da fila vêm depois dele
  const urls = fetchCalls.map((c) => c.url);
  const gols = urls.filter((u) => u.endsWith('/gols'));
  assert.equal(gols.length, 2, 'os 2 gols enfileirados devem sair');
  const fila = JSON.parse(storage.getItem('lfSyncFila'));
  assert.equal(fila.length, 0, 'fila deve esvaziar após flush');
});

test('flush parcial: itens que falham de novo permanecem na fila', async () => {
  const { world, storage, fetchCalls } = carregarApp({
    storageInitial: {
      lfSyncEndpoint: 'https://lf.exemplo.dev',
      lfSyncFila: JSON.stringify([
        { path: '/gols', body: { partida_id: 7, jogador_id: '22' } },
        { path: '/gols', body: { partida_id: 7, jogador_id: '1' } },
      ]),
    },
    fetchImpl: async (url, opts) => {
      const body = JSON.parse(opts.body);
      if (body.jogador_id === '1') throw new TypeError('Failed to fetch');
      return jsonResp({ ok: true });
    },
  });

  await world.lfSyncFlush();

  const fila = JSON.parse(storage.getItem('lfSyncFila'));
  assert.equal(fila.length, 1);
  assert.equal(fila[0].body.jogador_id, '1');
});

test('hidratação: artilharia do servidor só SOBE os totais, nunca desce', async () => {
  const { world, storage } = carregarApp({
    storageInitial: {
      lfSyncEndpoint: 'https://lf.exemplo.dev',
      // Local: Râneer (id 1) tem 2 gols; Felipe (22) tem 5 (mais que o servidor)
      artilhariaPelada: JSON.stringify({
        1: { nome: 'Râneer', gols: 2, foto: '' },
        22: { nome: 'Felipe Teo.', gols: 5, foto: '' },
      }),
    },
    fetchImpl: async () => jsonResp(ESTADO_OK([
      { id: '1', nome: 'Râneer', posicao: 'linha', gols: 9 },  // servidor tem MAIS
      { id: '22', nome: 'Felipe Teo.', posicao: 'linha', gols: 3 }, // servidor tem MENOS
    ])),
  });

  await world.lfSyncCarregarArtilharia();

  const artilharia = JSON.parse(storage.getItem('artilhariaPelada'));
  assert.equal(artilharia[1].gols, 9, 'servidor com mais gols deve prevalecer');
  assert.equal(artilharia[22].gols, 5, 'local com mais gols deve prevalecer');
});

test('hidratação com diacríticos: nome do jogador preservado', async () => {
  const { world, storage } = carregarApp({
    storageInitial: { lfSyncEndpoint: 'https://lf.exemplo.dev' },
    fetchImpl: async () => jsonResp(ESTADO_OK([
      { id: '1', nome: 'Râneer', posicao: 'linha', gols: 4 },
    ])),
  });

  await world.lfSyncCarregarArtilharia();
  const artilharia = JSON.parse(storage.getItem('artilhariaPelada'));
  assert.equal(artilharia[1].nome, 'Râneer');
});

test('config: rejeita endpoint http:// (PWA é https, mixed content é bloqueado)', () => {
  const { world, storage } = carregarApp();

  const aceitou = world.lfSyncConfigurar('http://192.168.31.221:8887');
  assert.equal(aceitou, false, 'http:// deve ser rejeitado');
  assert.equal(storage.getItem('lfSyncEndpoint'), null, 'endpoint não deve ser salvo');
  assert.equal(world.lfSyncAtivo(), false);

  const aceitouHttps = world.lfSyncConfigurar('https://lf.exemplo.dev');
  assert.equal(aceitouHttps, true);
  assert.equal(world.lfSyncAtivo(), true);

  // Vazio desliga
  world.lfSyncConfigurar('');
  assert.equal(world.lfSyncAtivo(), false);
});

// --- Vista Hoje/Geral (PR artilharia-hoje-geral) ----------------------

test('vista hoje (padrão): renderiza do localStorage, sem tocar no servidor', async () => {
  const { world, storage } = carregarApp({
    storageInitial: {
      artilhariaPelada: JSON.stringify({ 1: { nome: 'Râneer', gols: 3, foto: '' } }),
    },
  });

  assert.equal(await world.lfSyncArtilhariaGeral(), null, 'sem endpoint, geral indisponível');
  // E o localStorage segue sendo a fonte
  const artilharia = JSON.parse(storage.getItem('artilhariaPelada'));
  assert.equal(artilharia[1].gols, 3);
});

test('vista geral: dados vêm do servidor, Zerar não afeta o geral', async () => {
  const { world, storage } = carregarApp({
    storageInitial: {
      lfSyncEndpoint: 'https://lf.exemplo.dev',
      artilhariaPelada: JSON.stringify({ 1: { nome: 'Râneer', gols: 2, foto: '' } }),
    },
    fetchImpl: async () => jsonResp(ESTADO_OK([
      { id: '1', nome: 'Râneer', posicao: 'linha', gols: 18 },
      { id: '22', nome: 'Felipe Sha.', posicao: 'linha', gols: 16 },
      { id: '9', nome: 'Christiano', posicao: 'goleiro', gols: 0 },
    ])),
  });

  const geral = await world.lfSyncArtilhariaGeral();
  assert.equal(geral.length, 2, 'jogadores com 0 gols ficam de fora do geral');
  assert.equal(geral[0].nome, 'Râneer');
  assert.equal(geral[0].gols, 18);

  // Cache: segunda chamada não refaz o fetch (contado no fetchCalls do boot)
  const { fetchCalls } = { fetchCalls: [] }; // proxy já contou; só valida o cache
  const deNovo = await world.lfSyncArtilhariaGeral();
  assert.equal(deNovo, geral, 'segunda leitura usa o cache');

  // Zerar afeta só o dia (localStorage), o geral vem do servidor e não muda
  world.zerarArtilharia();
  assert.equal(storage.getItem('artilhariaPelada'), null);
  const geralAposZerar = await world.lfSyncArtilhariaGeral();
  assert.equal(geralAposZerar[0].gols, 18, 'geral intacto após Zerar');
});

test('invalidar cache do geral: próximo gol re-busca o geral do servidor', async () => {
  let chamadas = 0;
  const { world } = carregarApp({
    storageInitial: { lfSyncEndpoint: 'https://lf.exemplo.dev' },
    fetchImpl: async () => {
      chamadas++;
      return jsonResp(ESTADO_OK([{ id: '1', nome: 'Râneer', posicao: 'linha', gols: chamadas }]));
    },
  });

  await world.lfSyncArtilhariaGeral(); // 1º fetch (boot hidrata + 1ª chamada)
  const antes = (await world.lfSyncArtilhariaGeral()).find(a => a.nome === 'Râneer').gols;

  world.lfSyncInvalidarCacheGeral(); // gol novo → cache fora
  const depois = (await world.lfSyncArtilhariaGeral()).find(a => a.nome === 'Râneer').gols;

  assert.ok(depois > antes, 'após invalidar, re-busca do servidor (valor muda)');
});

// --- Presenças: sorteio registra quem compareceu -----------------------

const JOGADORES_SORTEIO = [
  { id: 1, nome: 'Râneer', posicao: 'linha', presente: true },
  { id: 2, nome: 'Alex', posicao: 'linha', presente: true },
  { id: 5, nome: 'Michel', posicao: 'goleiro', presente: true },
  { id: 8, nome: 'Vitorino', posicao: 'goleiro', presente: true },
  { id: 7, nome: 'Pé de Pano', posicao: 'linha', presente: true },
];

test('sorteio com sync ativo envia presencas dos sorteados ao servidor', async () => {
  const { world, fetchCalls } = carregarApp({
    storageInitial: { lfSyncEndpoint: 'https://lf.example.com' },
  });
  // boot dispara hidratação; zera a contagem pra olhar só o sorteio
  fetchCalls.length = 0;

  world.sortearImparcial(JOGADORES_SORTEIO);
  await new Promise((r) => setTimeout(r, 0)); // lfSyncEnviar é async

  const presenca = fetchCalls.find((c) => String(c.url).endsWith('/presencas'));
  assert.ok(presenca, 'POST /presencas disparado');
  const body = JSON.parse(presenca.opts.body);
  assert.equal(body.jogadores_ids.length, 5, 'todos os sorteados marcados');
  assert.equal(new Set(body.jogadores_ids).size, 5, 'IDs únicos');
});

test('sorteio com sync desligado NÃO envia presencas', async () => {
  const { world, fetchCalls } = carregarApp();
  fetchCalls.length = 0;

  world.sortearImparcial(JOGADORES_SORTEIO);
  await new Promise((r) => setTimeout(r, 0));

  const presenca = fetchCalls.find((c) => String(c.url).endsWith('/presencas'));
  assert.equal(presenca, undefined, 'nenhum POST /presencas');
});

test('atrasado confirmado depois do sorteio ganha presenca no servidor', async () => {
  // Simula sorteio já feito via backupPelada (o boot hidrata timesSorteadosGlobal)
  const backup = {
    dataPelada: new Date().toDateString(),
    timesSorteadosGlobal: [
      { nome: 'Time 1', jogadores: [{ id: 1, nome: 'Râneer', posicao: 'linha' }] },
      { nome: 'Time 2', jogadores: [{ id: 5, nome: 'Michel', posicao: 'goleiro' }] },
    ],
  };
  const { world, fetchCalls } = carregarApp({
    storageInitial: {
      lfSyncEndpoint: 'https://lf.example.com',
      backupPelada: JSON.stringify(backup),
    },
  });
  // jogadoresData default do app.js: todos presente:false — id 2 (Alex) tá fora dos times acima
  fetchCalls.length = 0;

  world.togglePresenca(2);
  await new Promise((r) => setTimeout(r, 0));

  const presenca = fetchCalls.find((c) => String(c.url).endsWith('/presencas'));
  assert.ok(presenca, 'POST /presencas disparado no toggle');
  const body = JSON.parse(presenca.opts.body);
  assert.deepEqual(body.jogadores_ids, [2], 'só o atrasado confirmado');
});

test('toggle ANTES do sorteio (times vazios) nao envia nada', async () => {
  const { world, fetchCalls } = carregarApp({
    storageInitial: { lfSyncEndpoint: 'https://lf.example.com' },
  });
  fetchCalls.length = 0;

  world.togglePresenca(3); // default: ausente, sem times formados
  await new Promise((r) => setTimeout(r, 0));

  const presenca = fetchCalls.find((c) => String(c.url).endsWith('/presencas'));
  assert.equal(presenca, undefined, 'sem sorteio = sem POST (sorteio enviara todos)');
});


// --- Lista de atletas: Raneer pediu Marcelo Mam., Leandro Bar., Arthur Lin. ----

test('jogadoresData inclui Marcelo Mam., Leandro Bar., Arthur Lin.', async () => {
  const { world } = carregarApp();
  // vm sandboxes `let` no contexto mas a funcao carregarApp retorna o array
  // atribuido via hidratacao em carregarBackup — vamos pelo fetch mockado
  // do /estado que o boot usa para hidratar jogadoresData.
  const ids = world._lastHydratedJogadores?.map(j => j.id) || [];
  const nomes = world._lastHydratedJogadores?.map(j => j.nome) || [];
  // fallback: o array original esta em app.js — checa direto via leitura
  const fs = await import('node:fs');
  const src = fs.readFileSync('app.js', 'utf8');
  const match = src.match(/let jogadoresData = \[([\s\S]*?)\];/);
  assert.ok(match, 'array jogadoresData presente em app.js');
  const linhas = match[1].split('\n').filter(l => l.includes('id:'));
  for (const n of ['Marcelo Mam.', 'Leandro Bar.', 'Arthur Lin.']) {
    assert.ok(linhas.some(l => l.includes(`nome: "${n}"`)), `${n} esta na lista`);
  }
});


// --- PR #28: artilharia geral mostra partidas/presenças/média ---------

test('cache do geral propaga partidas/presencas vindos do servidor', async () => {
  const { world } = carregarApp({
    storageInitial: { lfSyncEndpoint: 'https://lf.exemplo.dev' },
    fetchImpl: async () => jsonResp(ESTADO_OK([
      { id: '4', nome: 'Eduardo Bolívia', posicao: 'linha', gols: 23, partidas: 6, presencas: 7 },
      { id: '29', nome: 'Felipe Sha.', posicao: 'linha', gols: 20, partidas: 5, presencas: 5 },
    ])),
  });

  const geral = await world.lfSyncArtilhariaGeral();
  const edu = geral.find(a => a.nome === 'Eduardo Bolívia');
  assert.equal(edu.partidas, 6);
  assert.equal(edu.presencas, 7);
  // média esperada: 23 / 7 = 3.29
  const eduMedia = (edu.gols / edu.presencas).toFixed(2);
  assert.equal(eduMedia, '3.29');

  const feli = geral.find(a => a.nome === 'Felipe Sha.');
  assert.equal(feli.partidas, 5);
  assert.equal(feli.presencas, 5);
});

test('cache do geral sem partidas/presencas no servidor: campos null', async () => {
  // Caso de retrocompatibilidade: servidor antigo devolve só {id,nome,gols,foto}
  const { world } = carregarApp({
    storageInitial: { lfSyncEndpoint: 'https://lf.exemplo.dev' },
    fetchImpl: async () => jsonResp(ESTADO_OK([
      { id: '1', nome: 'Râneer', posicao: 'linha', gols: 9 },
    ])),
  });
  const geral = await world.lfSyncArtilhariaGeral();
  assert.equal(geral[0].partidas, null, 'servidor sem campo -> null no cliente');
  assert.equal(geral[0].presencas, null);
});


// --- PR feat/validacao-id: hidratacao posicao+foto do servidor ----

// FIXME(R-2026-10-20): testes abaixo estao skipados porque o mock de setTimeout
// no helper `carregarApp` retorna 0 sem executar o callback async. A funcao
// `lfSyncHidratarJogadores` esta corretamente implementada no app.js (verificada
// via debug - muta `jogadoresData` corretamente quando executada em browser
// real). Pra rodar esses testes, ajustar o mock pra executar callbacks async
// (e.g., `setTimeout: (fn, t) => fn()` no test runner).
// Antes eram test.skip: o fixture punha o jogador em `artilharia`, mas a
// hidratação lê `jogadores`, e o Michel já é goleiro no jogadoresData.
const ESTADO_JOGADORES = (jogadores) => ({ ...ESTADO_OK([]), jogadores });

test('hidratar jogadores: posicao do servidor sobrescreve local', async () => {
  const { world, storage } = carregarApp({
    storageInitial: { lfSyncEndpoint: 'https://lf.exemplo.dev' },
    fetchImpl: async () => jsonResp(ESTADO_JOGADORES([
      { id: '1', nome: 'Râneer', posicao: 'goleiro', foto: 'https://lf.felipeteodoro.dev/fotos/raneer_v2.jpg' },
    ])),
  });
  // Râneer é 'linha' no jogadoresData hardcoded; o boot já hidrata
  await esperarBoot();
  await world.lfSyncHidratarJogadores();
  world.salvarBackup();
  const depois = JSON.parse(storage.getItem('backupPelada')).jogadoresData.find((j) => j.id === 1);
  assert.equal(depois.posicao, 'goleiro', 'posicao hidratada do servidor');
  assert.equal(depois.foto, 'fotos/raneer_v2.jpg', 'foto vira caminho local com o basename do servidor');
});

test('hidratar jogadores: NAO sobrescreve o campo presente (state local)', async () => {
  const { world, storage } = carregarApp({
    storageInitial: { lfSyncEndpoint: 'https://lf.exemplo.dev' },
    fetchImpl: async () => jsonResp(ESTADO_JOGADORES([
      { id: '1', nome: 'Râneer', posicao: 'goleiro', foto: null, presente: true },
    ])),
  });
  await world.lfSyncHidratarJogadores();
  world.salvarBackup();
  const depois = JSON.parse(storage.getItem('backupPelada')).jogadoresData.find((j) => j.id === 1);
  assert.equal(depois.presente, false, 'presente continua o local');
  assert.equal(depois.foto, 'fotos/raneer_v2.jpg', 'foto null no servidor não apaga a local');
});

test('hidratar jogadores: nada mudou -> retorna false', async () => {
  const { world } = carregarApp({
    storageInitial: { lfSyncEndpoint: 'https://lf.exemplo.dev' },
    fetchImpl: async () => jsonResp(ESTADO_JOGADORES([
      { id: '1', nome: 'Râneer', posicao: 'linha', foto: 'https://x/fotos/raneer_v2.jpg' },
    ])),
  });
  assert.equal(await world.lfSyncHidratarJogadores(), false);
});

test('hidratar jogadores: ignora ids nao numericos (slugs legados)', async () => {
  const { world, storage } = carregarApp({
    storageInitial: { lfSyncEndpoint: 'https://lf.exemplo.dev' },
    fetchImpl: async () => jsonResp({
      ok: true,
      jogadores: [
        { id: 'carlos-fernando', nome: 'Carlos Fernando', posicao: 'linha', foto: null },
        { id: '5', nome: 'Michel', posicao: 'goleiro', foto: 'https://example.dev/fotos/michel_v2.jpg' },
      ],
      artilharia: [],
      artilharia_hoje: [],
    }),
  });
  // Nao lanca erro mesmo com slug no payload
  const mudou = await world.lfSyncHidratarJogadores();
  assert.ok(typeof mudou === 'boolean', 'retornou boolean sem throw');
});

test('hidratar jogadores: sync off retorna sem fazer nada', async () => {
  const { world, fetchCalls } = carregarApp();
  // Sem lfSyncEndpoint
  const r = await world.lfSyncHidratarJogadores();
  assert.equal(r, undefined, 'sem sync, retorna undefined');
  assert.equal(fetchCalls.length, 0, 'nenhum fetch feito');
});

// --- PR feat/gol-remover: remover gol da partida (UI + servidor) ----

test('remover gol: otimista no local + DELETE no servidor, dbId preenchido', async () => {
  const { world, storage, fetchCalls } = carregarApp({
    storageInitial: { lfSyncEndpoint: 'https://lf.exemplo.dev' },
    fetchImpl: async (url) => {
      if (url.endsWith('/partidas')) return jsonResp({ ok: true, partida: { id: 7 } });
      if (url.endsWith('/gols')) return jsonResp({ ok: true, gol: { id: 999 } });
      if (url.includes('/gols/999')) return jsonResp({ ok: true });
      return jsonResp({ ok: true });
    },
  });
  // Garante que o sync tá ativo
  assert.equal(world.lfSyncAtivo(), true);

  // Registra 1 gol pra criar um item no feed
  world.registrarGol(22, 'Felipe Teo.');
  // Dispara o sync pendente (microtask)
  await new Promise(r => setTimeout(r, 0));
  // O backup (localStorage) deve ter 1 gol com dbId=999 (preenchido pelo servidor)
  const backupAntes = JSON.parse(storage.getItem('backupPelada'));
  assert.equal(backupAntes.golsFeedPartida.length, 1);
  assert.equal(backupAntes.golsFeedPartida[0].dbId, 999, 'servidor devolveu id e o PWA guardou no item');

  // Garante que artilharia local tem 1 gol
  const artilharia = JSON.parse(storage.getItem('artilhariaPelada'));
  assert.equal(artilharia[22].gols, 1);

  // Remove o gol
  await world.removerGol(0);

  // localStorage zerou
  const depois = JSON.parse(storage.getItem('artilhariaPelada')) || {};
  assert.equal(depois[22] ? depois[22].gols : 0, 0, 'artilharia decrementou');
  // Backup zerou
  const backupDepois = JSON.parse(storage.getItem('backupPelada'));
  assert.equal(backupDepois.golsFeedPartida.length, 0, 'feed zerou');
  assert.equal(backupDepois.golsPartidaAtual, 0);
  // DELETE foi chamado com o id certo
  const del = fetchCalls.find(c => c.url.includes('/gols/999'));
  assert.ok(del, 'DELETE /gols/999 foi chamado');
  assert.equal(del.opts.method, 'DELETE');
});

test('remover gol: se servidor falhar, restaura snapshot do estado', async () => {
  const { world, storage } = carregarApp({
    storageInitial: { lfSyncEndpoint: 'https://lf.exemplo.dev' },
    fetchImpl: async (url) => {
      if (url.endsWith('/partidas')) return jsonResp({ ok: true, partida: { id: 7 } });
      if (url.endsWith('/gols')) return jsonResp({ ok: true, gol: { id: 555 } });
      if (url.includes('/gols/555')) return { ok: false, status: 500, json: async () => ({ ok: false }) };
      return jsonResp({ ok: true });
    },
  });
  // Registra gol
  world.registrarGol(22, 'Felipe Teo.');
  await new Promise(r => setTimeout(r, 0));
  const backupAntes = JSON.parse(storage.getItem('backupPelada'));
  assert.equal(backupAntes.golsFeedPartida[0].dbId, 555);

  // Tenta remover (servidor vai dar 500 -> restaurar)
  await world.removerGol(0);

  // Estado restaurado: feed ainda tem o gol
  const backupDepois = JSON.parse(storage.getItem('backupPelada'));
  assert.equal(backupDepois.golsFeedPartida.length, 1, 'feed restaurado');
  assert.equal(backupDepois.golsFeedPartida[0].nome, 'Felipe Teo.');
  // artilharia restaurada
  const art = JSON.parse(storage.getItem('artilhariaPelada'));
  assert.equal(art[22].gols, 1, 'artilharia restaurada');
  // alerta foi disparado
  assert.ok(world._alerts.some(a => /restaurando/i.test(a)), 'alerta de restauracao disparado');
});

test('registrar gol: confirmacao cancelada NAO marca o gol', async () => {
  // R-2026-10-25: a confirmacao "Marcar gol para X?" protege contra
  // gol marcado no atleta errado. Cancelar = nada acontece.
  const { world, storage } = carregarApp();
  world.salvarBackup(); // garante o baseline do backup
  world._confirmAnswer = false;
  world.registrarGol(22, 'Felipe Teo.');
  const backup = JSON.parse(storage.getItem('backupPelada'));
  assert.equal(backup.golsFeedPartida.length, 0, 'nenhum gol no feed');
  assert.equal(backup.golsPartidaAtual, 0, 'contador nao incrementou');
  const art = JSON.parse(storage.getItem('artilhariaPelada') || '{}');
  assert.equal(art[22] ? art[22].gols : 0, 0, 'artilharia nao mudou');
});

test('registrar gol: confirmacao aceita marca o gol normalmente', async () => {
  const { world, storage } = carregarApp();
  world.registrarGol(22, 'Felipe Teo.');
  const backup = JSON.parse(storage.getItem('backupPelada'));
  assert.equal(backup.golsFeedPartida.length, 1, 'gol no feed');
  assert.equal(backup.golsPartidaAtual, 1);
});

test('auto-finalize: partida encerra com 2 gols do mesmo atleta', async () => {
  // R-2026-10-25: volta a regra original (2 do mesmo OU 3 no total).
  const { world, storage } = carregarApp();
  world.registrarGol(22, 'Felipe Teo.');
  world.registrarGol(22, 'Felipe Teo.');
  // finalizarPartidaTempo dispara alert "Fim de Jogo" e preparaNovoJogo
  assert.ok(
    world._alerts.some(a => /Fim de Jogo/i.test(a)),
    'partida finalizou com 2 gols do mesmo atleta'
  );
});

test('auto-finalize: partida encerra com 3 gols no total', async () => {
  const { world } = carregarApp();
  world.registrarGol(22, 'Felipe Teo.');
  world.registrarGol(23, 'Alex Vie.');
  world.registrarGol(24, 'Braz');
  assert.ok(
    world._alerts.some(a => /Fim de Jogo/i.test(a)),
    'partida finalizou com 3 gols no total'
  );
});

test('editar posicao: modal abre, salva e envia PATCH no servidor', async () => {
  const { world, storage, fetchCalls } = carregarApp({
    storageInitial: { lfSyncEndpoint: 'https://lf.exemplo.dev' },
    fetchImpl: async () => jsonResp({ ok: true }),
  });
  // Abre o modal pro Michel (id 5, linha por padrao)
  world.abrirModalEditarPosicao(5);
  // Marca goleiro no radio
  const radio = world.document.getElementById('posicao-goleiro');
  radio.checked = true;
  await world.salvarNovaPosicao();

  const backup = JSON.parse(storage.getItem('backupPelada'));
  const michel = backup.jogadoresData.find(j => j.id == 5);
  assert.equal(michel.posicao, 'goleiro', 'posicao atualizada localmente');

  const patch = fetchCalls.find(c => c.opts && c.opts.method === 'PATCH');
  assert.ok(patch, 'PATCH foi enviado');
  assert.ok(patch.url.includes('/jogadores/5'), 'PATCH na rota correta: ' + patch.url);
  const body = JSON.parse(patch.opts.body);
  assert.equal(body.posicao, 'goleiro', 'corpo do PATCH com posicao');
});

test('editar posicao: servidor recusa -> reverte posicao local', async () => {
  const { world, storage } = carregarApp({
    storageInitial: { lfSyncEndpoint: 'https://lf.exemplo.dev' },
    fetchImpl: async () => ({ ok: false, status: 500, json: async () => ({ ok: false }) }),
  });
  // Usa o id 22 (Felipe Teo.), que comeca como 'linha' no hardcoded.
  // (O id 5 - Michel - ja e 'goleiro' no hardcoded desde v51.)
  world.abrirModalEditarPosicao(22);
  world.document.getElementById('posicao-goleiro').checked = true;
  await world.salvarNovaPosicao();
  const backup = JSON.parse(storage.getItem('backupPelada'));
  const felipe = backup.jogadoresData.find(j => j.id == 22);
  assert.equal(felipe.posicao, 'linha', 'posicao revertida apos falha do servidor');
  assert.ok(world._alerts.some(a => /Restaurando/i.test(a)), 'alerta de restauracao disparado');
});

// --- Gols pendentes (caso 2026-11-07: gols marcados sem sync nunca subiam) ---

// Servidor fake com estado: conta os gols recebidos no dia, pra a
// reconciliação poder rodar várias vezes (boot + chamada do teste).
function servidorFake({ hoje = {}, partida = { id: 27 }, partidaHoje = 31 } = {}) {
  const golsHoje = { ...hoje }; // { '1': 2 }
  const recebidos = [];
  let proximoGolId = 1000;
  const fetchImpl = async (url, opts) => {
    if (url.endsWith('/estado')) {
      return jsonResp({
        ok: true, partida, jogadores: [], gols: [], artilharia: [],
        artilharia_hoje: Object.entries(golsHoje).map(([id, gols]) => ({ id, nome: 'x', gols })),
      });
    }
    if (url.endsWith('/gols') && opts && opts.method === 'POST') {
      const body = JSON.parse(opts.body);
      recebidos.push(body);
      golsHoje[body.jogador_id] = (golsHoje[body.jogador_id] || 0) + 1;
      return jsonResp({ ok: true, partida_id: partidaHoje, gol: { id: proximoGolId++ } });
    }
    if (url.endsWith('/partidas')) return jsonResp({ ok: true, partida: { id: partidaHoje } });
    return jsonResp({ ok: true });
  };
  return { fetchImpl, recebidos, golsHoje };
}

// O boot dispara lfSyncSincronizarTudo() sem await — deixa ele terminar.
const esperarBoot = async () => {
  for (let i = 0; i < 30; i++) await new Promise((r) => setImmediate(r));
};

test('gols pendentes: boot sobe só a diferença local - servidor do dia', async () => {
  const srv = servidorFake({ hoje: { '1': 1 } });
  const { storage } = carregarApp({
    storageInitial: {
      lfSyncEndpoint: 'https://lf.exemplo.dev',
      artilhariaPelada: JSON.stringify({
        1: { nome: 'Râneer', gols: 3, foto: '' },
        22: { nome: 'Felipe Teo.', gols: 2, foto: '' },
      }),
    },
    fetchImpl: srv.fetchImpl,
  });
  await esperarBoot();

  assert.equal(srv.recebidos.length, 4, '2 do Râneer + 2 do Felipe');
  assert.equal(srv.recebidos.filter((g) => g.jogador_id === '1').length, 2);
  assert.equal(srv.recebidos.filter((g) => g.jogador_id === '22').length, 2);
  assert.ok(srv.recebidos.every((g) => g.minuto === null), 'minuto reconstruído = null');
  // Partida que o servidor usou fica memorizada (não manda a velha de novo)
  assert.equal(storage.getItem('lfSyncPartidaId'), '31');
});

test('gols pendentes: rodar de novo não duplica (idempotente)', async () => {
  const srv = servidorFake();
  const { world } = carregarApp({
    storageInitial: {
      lfSyncEndpoint: 'https://lf.exemplo.dev',
      artilhariaPelada: JSON.stringify({ 1: { nome: 'Râneer', gols: 2, foto: '' } }),
    },
    fetchImpl: srv.fetchImpl,
  });
  await esperarBoot();
  const r = await world.lfSyncEnviarGolsPendentes();
  await world.lfSyncSincronizarTudo();

  assert.equal(srv.recebidos.length, 2);
  assert.equal(r.enviados, 0);
});

test('gols pendentes: servidor com mais gols que o local não envia nada', async () => {
  const srv = servidorFake({ hoje: { '1': 5 } });
  carregarApp({
    storageInitial: {
      lfSyncEndpoint: 'https://lf.exemplo.dev',
      artilhariaPelada: JSON.stringify({ 1: { nome: 'Râneer', gols: 2, foto: '' } }),
    },
    fetchImpl: srv.fetchImpl,
  });
  await esperarBoot();
  assert.equal(srv.recebidos.length, 0);
});

test('gols pendentes: com gol em envio, não reconcilia (evita duplicar)', async () => {
  const srv = servidorFake();
  let liberarGol;
  const golTravado = new Promise((r) => { liberarGol = r; });
  const { world, storage } = carregarApp({
    storageInitial: { lfSyncEndpoint: 'https://lf.exemplo.dev', lfSyncPartidaId: '31' },
    fetchImpl: async (url, opts) => {
      if (url.endsWith('/gols')) await golTravado; // POST do gol "na rede"
      return srv.fetchImpl(url, opts);
    },
  });
  await esperarBoot();

  world.registrarGol(22, 'Felipe Teo.'); // local = 1, POST pendurado
  const r = await world.lfSyncEnviarGolsPendentes();
  assert.equal(r.enviados, 0);
  assert.equal(r.reason, 'gol-em-voo');

  liberarGol();
  await esperarBoot();
  assert.equal(srv.recebidos.length, 1, 'só o gol original chegou');
  assert.equal(JSON.parse(storage.getItem('artilhariaPelada'))[22].gols, 1);
});

test('gols pendentes: gol reconciliado ganha dbId no feed (lixeira apaga no servidor)', async () => {
  const srv = servidorFake();
  const { world, storage } = carregarApp({
    storageInitial: { lfSyncEndpoint: 'https://lf.exemplo.dev' },
    fetchImpl: async (url, opts) => {
      // Simula o POST do gol falhando na hora (sem sinal na quadra)
      if (url.endsWith('/gols') && world._semRede) throw new TypeError('Failed to fetch');
      return srv.fetchImpl(url, opts);
    },
  });
  await esperarBoot();
  world._semRede = true;
  world.registrarGol(22, 'Felipe Teo.');
  await esperarBoot();
  assert.equal(srv.recebidos.length, 0);
  const feed = () => JSON.parse(storage.getItem('backupPelada')).golsFeedPartida;
  assert.equal(feed()[0].dbId, null);

  world._semRede = false;
  const r = await world.lfSyncEnviarGolsPendentes();
  assert.equal(r.enviados, 1);
  assert.equal(feed()[0].dbId, 1000);
});

test('botão Sync: além de configurar, sobe os gols de hoje e avisa quantos', async () => {
  const srv = servidorFake();
  const { world } = carregarApp({
    storageInitial: {
      // Sync desligado durante a pelada: 3 gols só no aparelho
      artilhariaPelada: JSON.stringify({ 1: { nome: 'Râneer', gols: 3, foto: '' } }),
    },
    fetchImpl: srv.fetchImpl,
  });
  await esperarBoot();
  assert.equal(srv.recebidos.length, 0, 'sync off: nada sai');

  world.prompt = () => 'https://lf.exemplo.dev';
  world.lfSyncToggleConfig();
  await esperarBoot();

  assert.equal(srv.recebidos.length, 3);
  assert.ok(world._alerts.some((a) => /3 gol\(s\) de hoje/.test(a)), 'avisa quantos subiram');
});

test('boot com sync ativo esvazia a fila sozinho (sem esperar evento online)', async () => {
  const srv = servidorFake();
  const { storage, fetchCalls } = carregarApp({
    storageInitial: {
      lfSyncEndpoint: 'https://lf.exemplo.dev',
      lfSyncFila: JSON.stringify([{ path: '/presencas', body: { jogadores_ids: [1, 22] } }]),
    },
    fetchImpl: srv.fetchImpl,
  });
  await esperarBoot();
  assert.equal(fetchCalls.filter((c) => c.url.endsWith('/presencas')).length, 1);
  assert.equal(JSON.parse(storage.getItem('lfSyncFila')).length, 0);
});

test('flush concorrente (boot + online) não manda a fila em dobro', async () => {
  const srv = servidorFake();
  const { world, fetchCalls } = carregarApp({
    storageInitial: {
      lfSyncEndpoint: 'https://lf.exemplo.dev',
      lfSyncFila: JSON.stringify([{ path: '/presencas', body: { jogadores_ids: [1] } }]),
    },
    fetchImpl: srv.fetchImpl,
  });
  await Promise.all([world.lfSyncFlush(), world.lfSyncFlush()]);
  await esperarBoot();
  assert.equal(fetchCalls.filter((c) => c.url.endsWith('/presencas')).length, 1);
});


// --- Refatoração do sync (auditoria ub-mode): uma leitura de /estado,
// reconciliação partida em função pura + envio, caminhos de falha ---

test('boot com sync ativo lê /estado UMA vez (hidratação + reconciliação + artilharia)', async () => {
  const srv = servidorFake();
  const { fetchCalls } = carregarApp({
    storageInitial: { lfSyncEndpoint: 'https://lf.exemplo.dev' },
    fetchImpl: srv.fetchImpl,
  });
  await esperarBoot();
  assert.equal(fetchCalls.filter((c) => c.url.endsWith('/estado')).length, 1);
});

test('depois de enviar gol, a próxima leitura busca /estado de novo', async () => {
  const srv = servidorFake();
  const { world, fetchCalls } = carregarApp({
    storageInitial: { lfSyncEndpoint: 'https://lf.exemplo.dev', lfSyncPartidaId: '31' },
    fetchImpl: srv.fetchImpl,
  });
  await esperarBoot();
  await world.lfSyncRegistrarGol(22, 'Felipe Teo.', '01:00');
  await world.lfSyncCarregarArtilharia();
  assert.equal(fetchCalls.filter((c) => c.url.endsWith('/estado')).length, 2);
});

test('golsFaltandoNoServidor: só a diferença positiva, por id em string', () => {
  const { world } = carregarApp();
  const faltam = world.golsFaltandoNoServidor(
    { 1: { nome: 'Râneer', gols: 3 }, 22: { nome: 'Felipe Teo.', gols: 1 }, 4: { nome: 'Edu', gols: 2 } },
    [{ id: '1', gols: 1 }, { id: '4', gols: 5 }],
  );
  assert.deepEqual(JSON.parse(JSON.stringify(faltam)), [
    { id: '1', nome: 'Râneer', faltam: 2 },
    { id: '22', nome: 'Felipe Teo.', faltam: 1 },
  ]);
  assert.deepEqual(JSON.parse(JSON.stringify(world.golsFaltandoNoServidor({}, undefined))), []);
  assert.deepEqual(JSON.parse(JSON.stringify(world.golsFaltandoNoServidor({ 1: { nome: 'X' } }, []))), []);
});

test('gols pendentes: jogador é enviado ANTES dos gols dele (FK)', async () => {
  const srv = servidorFake();
  const { fetchCalls } = carregarApp({
    storageInitial: {
      lfSyncEndpoint: 'https://lf.exemplo.dev',
      artilhariaPelada: JSON.stringify({ 57: { nome: 'Thiago', gols: 1, foto: '' } }),
    },
    fetchImpl: srv.fetchImpl,
  });
  await esperarBoot();
  const urls = fetchCalls.map((c) => c.url);
  const iJog = urls.findIndex((u) => u.endsWith('/jogadores'));
  const iGol = urls.findIndex((u) => u.endsWith('/gols'));
  assert.ok(iJog >= 0 && iGol > iJog, 'POST /jogadores antes do POST /gols');
  const jog = JSON.parse(fetchCalls[iJog].opts.body);
  assert.deepEqual(jog, { id: '57', nome: 'Thiago' });
});

test('gols pendentes: /estado com ok:false não envia nada', async () => {
  const { world } = carregarApp({
    storageInitial: {
      lfSyncEndpoint: 'https://lf.exemplo.dev',
      artilhariaPelada: JSON.stringify({ 1: { nome: 'Râneer', gols: 2, foto: '' } }),
    },
    fetchImpl: async (url) => (url.endsWith('/estado') ? jsonResp({ ok: false }) : jsonResp({ ok: true })),
  });
  await esperarBoot();
  const r = await world.lfSyncEnviarGolsPendentes();
  assert.equal(r.ok, false);
  assert.equal(r.enviados, 0);
});

test('gols pendentes: POST /gols com erro HTTP para e conta só os que subiram', async () => {
  const srv = servidorFake();
  let golsAceitos = 1;
  const { world } = carregarApp({
    storageInitial: {
      lfSyncEndpoint: 'https://lf.exemplo.dev',
      lfSyncPartidaId: '31',
      artilhariaPelada: JSON.stringify({ 1: { nome: 'Râneer', gols: 3, foto: '' } }),
    },
    fetchImpl: async (url, opts) => {
      if (url.endsWith('/gols') && opts && opts.method === 'POST') {
        if (golsAceitos-- <= 0) return { ok: false, status: 500, json: async () => ({ ok: false }) };
      }
      return srv.fetchImpl(url, opts);
    },
  });
  await esperarBoot();
  assert.equal(srv.recebidos.length, 1, 'parou no primeiro erro');
  const r = await world.lfSyncEnviarGolsPendentes();
  assert.equal(r.ok, false);
  assert.equal(r.enviados, 0);
});

test('gols pendentes: sem partida conhecida, cria uma; se falhar, não envia gol', async () => {
  const { world, fetchCalls } = carregarApp({
    storageInitial: {
      lfSyncEndpoint: 'https://lf.exemplo.dev',
      artilhariaPelada: JSON.stringify({ 1: { nome: 'Râneer', gols: 1, foto: '' } }),
    },
    fetchImpl: async (url) => {
      if (url.endsWith('/estado')) return jsonResp({ ...ESTADO_OK([]), partida: null });
      if (url.endsWith('/partidas')) return jsonResp({ ok: false });
      return jsonResp({ ok: true });
    },
  });
  await esperarBoot();
  const r = await world.lfSyncEnviarGolsPendentes();
  assert.equal(r.ok, false);
  assert.ok(fetchCalls.some((c) => c.url.endsWith('/partidas')), 'tentou criar a partida');
  assert.ok(!fetchCalls.some((c) => c.url.endsWith('/gols')), 'nenhum gol sem partida');
});

test('lfSyncEnviar: erro HTTP devolve status e corpo, sem enfileirar', async () => {
  const { world, storage } = carregarApp({
    storageInitial: { lfSyncEndpoint: 'https://lf.exemplo.dev' },
    fetchImpl: async () => ({ ok: false, status: 400, text: async () => 'ruim', json: async () => ({}) }),
  });
  await esperarBoot();
  const r = await world.lfSyncEnviar('/presencas', { jogadores_ids: [1] });
  assert.deepEqual(JSON.parse(JSON.stringify(r)), { ok: false, status: 400, body: 'ruim' });
  assert.equal(JSON.parse(storage.getItem('lfSyncFila') || '[]').length, 0);
});

test('lfSyncEnviar: sync desligado não faz fetch', async () => {
  const { world, fetchCalls } = carregarApp();
  const r = await world.lfSyncEnviar('/presencas', {});
  assert.equal(r.reason, 'sync-off');
  assert.equal(fetchCalls.length, 0);
});

test('botão Sync: cancelar não muda nada; vazio desliga; barra final é removida', async () => {
  const { world, storage } = carregarApp({ storageInitial: { lfSyncEndpoint: 'https://lf.exemplo.dev' } });
  world.prompt = () => null;
  world.lfSyncToggleConfig();
  assert.equal(storage.getItem('lfSyncEndpoint'), 'https://lf.exemplo.dev', 'cancelar mantém');

  world.prompt = () => '  https://outro.dev///  ';
  world.lfSyncToggleConfig();
  assert.equal(storage.getItem('lfSyncEndpoint'), 'https://outro.dev');

  world.prompt = () => '';
  world.lfSyncToggleConfig();
  assert.equal(storage.getItem('lfSyncEndpoint'), null, 'vazio desliga');
  assert.ok(world._alerts.some((a) => /desligado/i.test(a)));
});

test('mesclarArtilhariaDoDia: só sobe, ignora slug, foto do jogador local', () => {
  const { world } = carregarApp();
  const r = world.mesclarArtilhariaDoDia(
    { 1: { nome: 'Râneer', gols: 5, foto: 'a' }, 22: { nome: 'Felipe Teo.', gols: 1, foto: 'b' } },
    [{ id: '1', nome: 'Râneer', gols: 2 }, { id: '22', nome: 'Felipe Teo.', gols: 3 }, { id: 'slug-velho', nome: 'X', gols: 9 }, { id: '45', nome: 'Miné', gols: 1 }],
    [{ id: 45, foto: 'fotos/mine_v2.jpg' }],
  );
  assert.equal(r[1].gols, 5, 'local maior fica');
  assert.equal(r[22].gols, 3, 'servidor maior sobe');
  assert.equal(r[45].foto, 'fotos/mine_v2.jpg');
  assert.equal(r['slug-velho'], undefined);
  assert.deepEqual(Object.keys(world.mesclarArtilhariaDoDia({}, undefined, [])), []);
});

test('aplicarJogadorDoServidor: posição e foto mudam; presente nunca', () => {
  const { world } = carregarApp();
  const local = { id: 1, posicao: 'linha', foto: 'fotos/a.jpg', presente: true };
  assert.equal(world.aplicarJogadorDoServidor(local, { posicao: 'linha', foto: 'https://x/fotos/a.jpg', presente: false }), false);
  assert.equal(world.aplicarJogadorDoServidor(local, { posicao: 'goleiro', foto: null }), true);
  assert.equal(local.posicao, 'goleiro');
  assert.equal(local.foto, 'fotos/a.jpg', 'foto null não apaga');
  assert.equal(world.aplicarJogadorDoServidor(local, { posicao: 'goleiro', foto: 'https://x/fotos/b.jpg' }), true);
  assert.equal(local.foto, 'fotos/b.jpg');
  assert.equal(local.presente, true);
});

test('lfSyncAvisarGolsEnviados: avisa sucesso e falha, cala com gol em voo', () => {
  const { world } = carregarApp();
  world.lfSyncAvisarGolsEnviados({ ok: true, enviados: 0 });
  world.lfSyncAvisarGolsEnviados({ ok: false, enviados: 0, reason: 'gol-em-voo' });
  assert.equal(world._alerts.length, 0);
  world.lfSyncAvisarGolsEnviados({ ok: true, enviados: 2 });
  world.lfSyncAvisarGolsEnviados({ ok: false, enviados: 0 });
  assert.match(world._alerts[0], /^2 gol\(s\)/);
  assert.match(world._alerts[1], /Não foi possível/);
});

test('lfSyncRemoverGol: sem dbId ou sem sync não chama o servidor', async () => {
  const off = carregarApp();
  assert.equal(await off.world.lfSyncRemoverGol(5), true);
  assert.equal(off.fetchCalls.length, 0);
  const on = carregarApp({ storageInitial: { lfSyncEndpoint: 'https://lf.exemplo.dev' }, fetchImpl: servidorFake().fetchImpl });
  await esperarBoot();
  const antes = on.fetchCalls.length;
  assert.equal(await on.world.lfSyncRemoverGol(null), true);
  assert.equal(on.fetchCalls.length, antes);
});

test('lfSyncRemoverGol: DELETE ok/erro/offline e invalida o /estado', async () => {
  let modo = 'ok';
  const srv = servidorFake();
  const { world, fetchCalls } = carregarApp({
    storageInitial: { lfSyncEndpoint: 'https://lf.exemplo.dev' },
    fetchImpl: async (url, opts) => {
      if (opts && opts.method === 'DELETE') {
        if (modo === 'offline') throw new TypeError('Failed to fetch');
        return { ok: modo === 'ok', json: async () => ({ ok: true }) };
      }
      return srv.fetchImpl(url, opts);
    },
  });
  await esperarBoot();
  assert.equal(await world.lfSyncRemoverGol(77), true);
  assert.ok(fetchCalls.some((c) => c.url.endsWith('/gols/77') && c.opts.method === 'DELETE'));
  await world.lfSyncCarregarArtilharia();
  assert.equal(fetchCalls.filter((c) => c.url.endsWith('/estado')).length, 2, 'releu depois do DELETE');
  modo = 'erro';
  assert.equal(await world.lfSyncRemoverGol(78), false);
  modo = 'offline';
  assert.equal(await world.lfSyncRemoverGol(79), false);
});

test('lfSyncVincularDbId: sem item correspondente ou sem gol, não mexe no feed', async () => {
  const { world, storage } = carregarApp({
    storageInitial: {
      backupPelada: JSON.stringify({
        jogadoresData: [], timesSorteadosGlobal: [], tempoRestante: 420, golsPartidaAtual: 1, golsJogadorPartida: {},
        golsFeedPartida: [{ id: 22, dbId: 5, nome: 'Felipe Teo.', foto: '', minuto: '01:00' }],
      }),
    },
  });
  world.lfSyncVincularDbId(22, { gol: { id: 9 } }); // já tem dbId
  world.lfSyncVincularDbId(1, { gol: { id: 9 } });  // jogador fora do feed
  world.lfSyncVincularDbId(22, { ok: true });        // resposta sem gol
  world.salvarBackup();
  assert.equal(JSON.parse(storage.getItem('backupPelada')).golsFeedPartida[0].dbId, 5);
});

test('vista geral: só quem tem gol, foto do servidor com fallback na local', async () => {
  const { world } = carregarApp({
    storageInitial: { lfSyncEndpoint: 'https://lf.exemplo.dev' },
    fetchImpl: async () => jsonResp(ESTADO_OK([
      { id: '1', nome: 'Râneer', gols: 4, foto: null, partidas: 2, presencas: 3 },
      { id: '22', nome: 'Felipe Teo.', gols: 0, foto: 'https://x/fotos/f.jpg' },
      { id: '45', nome: 'Miné', gols: 8, foto: 'https://x/fotos/mine.jpg' },
    ])),
  });
  await esperarBoot();
  const geral = JSON.parse(JSON.stringify(await world.lfSyncArtilhariaGeral()));
  assert.deepEqual(geral.map((g) => g.nome), ['Râneer', 'Miné']);
  assert.equal(geral[0].foto, 'fotos/raneer_v2.jpg', 'sem foto no servidor usa a local');
  assert.equal(geral[1].foto, 'https://x/fotos/mine.jpg');
  assert.equal(geral[1].partidas, null);
  assert.equal(geral[0].presencas, 3);
});
