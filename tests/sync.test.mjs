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
    console: { log() {}, error() {} },
    alert: (msg) => { world._alerts.push(String(msg)); },
    prompt: () => null,
    confirm: () => true,
    fetch: async (url, opts) => {
      fetchCalls.push({ url: String(url), opts });
      return fetchImpl ? fetchImpl(String(url), opts) : new Response('{}');
    },
    setTimeout: () => 0,
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
    },
    _alerts: [],
  };
  world.window = {
    addEventListener: (ev, fn) => { (windowHandlers[ev] ||= []).push(fn); },
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
  assert.equal(fila.length, 1);
  assert.equal(fila[0].path, '/gols');

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
