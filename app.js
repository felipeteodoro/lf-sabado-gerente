// Chave do localStorage com o endpoint de sincronização.
// Declarada aqui (topo) porque init() dispara a hidratação em setTimeout(0)
// e precisa dela já inicializada - se fosse declarada depois, daria
// ReferenceError (TDZ) quando o timer dispara antes do fim do script.
const LF_SYNC_ENDPOINT_KEY = 'lfSyncEndpoint';

// Controle de concorrência do sync (ver lfSyncFlush / lfSyncEnviarGolsPendentes).
// Gols em envio: a reconciliação espera eles acabarem pra não duplicar.
let lfSyncGolsEmVoo = 0;
let lfSyncFlushEmAndamento = null;
let lfSyncReconciliacaoEmAndamento = null;

let jogadoresData = [
    { id: 1, nome: "Râneer", posicao: "linha", presente: false, foto: "fotos/raneer_v2.jpg" },
    { id: 2, nome: "Alex Vie.", posicao: "linha", presente: false, foto: "fotos/alex_vie_v2.jpg" },
    { id: 3, nome: "Kaique Fer.", posicao: "linha", presente: false, foto: "fotos/kaique_fer_v2.jpg" },
    { id: 4, nome: "Eduardo Bol.", posicao: "linha", presente: false, foto: "fotos/eduardo_bol_v2.jpg" },
    { id: 5, nome: "Michel", posicao: "goleiro", presente: false, foto: "fotos/michel_v2.jpg" },
    { id: 6, nome: "Kaique Mar.", posicao: "linha", presente: false, foto: "fotos/kaique_mar_v2.jpg" },
    { id: 7, nome: "Pé de Pano", posicao: "linha", presente: false, foto: "fotos/pe_de_pano_v2.jpg" },
    { id: 8, nome: "Vitorino", posicao: "goleiro", presente: false, foto: "fotos/vitorino_v2.jpg" },
    { id: 9, nome: "Christiano", posicao: "goleiro", presente: false, foto: "fotos/christiano_v2.jpg" },
    { id: 10, nome: "Lucas Vas.", posicao: "linha", presente: false, foto: "fotos/lucas_vas_v2.jpg" },
    { id: 11, nome: "Tchobba", posicao: "linha", presente: false, foto: "fotos/tchobba_v2.jpg" },
    { id: 12, nome: "Lucas Ven.", posicao: "linha", presente: false, foto: "fotos/lucas_ven_v2.jpg" },
    { id: 13, nome: "Solidão", posicao: "linha", presente: false, foto: "fotos/solidao_v2.jpg" },
    { id: 14, nome: "Eliel Sch.", posicao: "linha", presente: false, foto: "fotos/eliel_sch_v2.jpg" },
    { id: 15, nome: "Wesley", posicao: "linha", presente: false, foto: "fotos/wesley_v2.jpg" },
    { id: 16, nome: "Jorge", posicao: "linha", presente: false, foto: "fotos/jorge_v2.jpg" },
    { id: 17, nome: "Braz", posicao: "linha", presente: false, foto: "fotos/braz_v2.jpg" },
    { id: 18, nome: "Túlio", posicao: "linha", presente: false, foto: "fotos/tulio_v2.jpg" },
    { id: 19, nome: "Paulo", posicao: "linha", presente: false, foto: "fotos/paulo_v2.jpg" },
    { id: 20, nome: "Teta", posicao: "linha", presente: false, foto: "fotos/teta_v2.jpg" },
    { id: 21, nome: "Daniel Par.", posicao: "linha", presente: false, foto: "fotos/daniel_par_v2.jpg" },
    { id: 22, nome: "Felipe Teo.", posicao: "linha", presente: false, foto: "fotos/felipe_teo_v2.jpg" },
    { id: 23, nome: "Anderson Ant.", posicao: "linha", presente: false, foto: "fotos/anderson_ant_v2.jpg" },
    { id: 24, nome: "Caio Doidin", posicao: "linha", presente: false, foto: "fotos/caio_doidin_v2.jpg" },
    { id: 25, nome: "Daniel Con.", posicao: "linha", presente: false, foto: "fotos/daniel_con_v2.jpg" },
    { id: 26, nome: "Eduardo Fer.", posicao: "linha", presente: false, foto: "fotos/eduardo_fer_v2.jpg" },
    { id: 27, nome: "Eduardo Bor.", posicao: "linha", presente: false, foto: "fotos/eduardo_bor_v2.jpg" },
    { id: 28, nome: "Felipe Fre.", posicao: "linha", presente: false, foto: "fotos/felipe_fre_v2.jpg" },
    { id: 29, nome: "Felipe Sha.", posicao: "linha", presente: false, foto: "fotos/felipe_sha_v2.jpg" },
    { id: 30, nome: "Gabriel Nag.", posicao: "linha", presente: false, foto: "fotos/gabriel_nag_v2.jpg" },
    { id: 31, nome: "Guilherme Fra.", posicao: "linha", presente: false, foto: "fotos/guilherme_fra_v2.jpg" },
    { id: 32, nome: "Guilherme Pir.", posicao: "linha", presente: false, foto: "fotos/guilherme_pir_v2.jpg" },
    { id: 33, nome: "Mike", posicao: "linha", presente: false, foto: "fotos/mike_v2.jpg" },
    { id: 34, nome: "Wilker Pim", posicao: "linha", presente: false, foto: "fotos/wilker_pim_v2.jpg" },
    { id: 35, nome: "Willian", posicao: "linha", presente: false, foto: "fotos/willian_v2.jpg" },
    { id: 36, nome: "Zaqueu", posicao: "linha", presente: false, foto: "fotos/zaqueu_v2.jpg" },
    { id: 37, nome: "Robson", posicao: "goleiro", presente: false, foto: "fotos/robson_v2.jpg" },
    { id: 38, nome: "Rubens", posicao: "goleiro", presente: false, foto: "fotos/rubens_v2.jpg" },
    { id: 39, nome: "Erick", posicao: "linha", presente: false, foto: "fotos/erick_v2.jpg" },
    { id: 40, nome: "Fernando", posicao: "linha", presente: false, foto: "fotos/fernando_v2.jpg" },
    { id: 41, nome: "Fábio", posicao: "linha", presente: false, foto: "fotos/fabio_v2.jpg" },
    { id: 42, nome: "Vitor Hug.", posicao: "linha", presente: false, foto: "fotos/vitor_hug_v2.jpg" },
    { id: 43, nome: "Mattheus", posicao: "linha", presente: false, foto: "fotos/mattheus_v2.jpg" },
    { id: 44, nome: "Wesley Teo.", posicao: "linha", presente: false, foto: "fotos/wesley_teo_v2.jpg" },
    { id: 45, nome: "Miné", posicao: "linha", presente: false, foto: "fotos/mine_v2.jpg" },
    { id: 46, nome: "Túlio Mor.", posicao: "linha", presente: false, foto: "fotos/tulio_mor_v2.jpg" },
    { id: 47, nome: "Yuri Vit.", posicao: "linha", presente: false, foto: "fotos/yuri_vit_v2.jpg" },
    { id: 48, nome: "Marcelo Mam.", posicao: "goleiro", presente: false, foto: "fotos/marcelo_mam_v2.jpg" },
    { id: 49, nome: "Lucas Sil.", posicao: "linha", presente: false, foto: "fotos/lucas_sil_v2.jpg" },
    { id: 50, nome: "Richard", posicao: "linha", presente: false, foto: "fotos/richard_v2.jpg" },
    { id: 54, nome: "Leandro Bar.", posicao: "linha", presente: false, foto: "fotos/leandro_bar_v2.jpg" },
    { id: 55, nome: "Arthur Lin.", posicao: "linha", presente: false, foto: "fotos/arthur_lin_v2.jpg" },
    { id: 56, nome: "Heitor", posicao: "linha", presente: false, foto: "fotos/heitor_v2.jpg" }
];

let timesSorteadosGlobal = [];

const TEMPO_TOTAL = 420; 
let tempoRestante = TEMPO_TOTAL;
let cronometroRodando = false;
let intervaloCronometro;

let golsPartidaAtual = 0;
let golsJogadorPartida = {};
let golsFeedPartida = [];

let wakeLock = null;

async function manterTelaAtiva() {
    if ('wakeLock' in navigator) {
        try {
            wakeLock = await navigator.wakeLock.request('screen');
        } catch (err) {
            console.log('Wake Lock erro:', err);
        }
    }
}

function liberarTela() {
    if (wakeLock !== null) {
        wakeLock.release().then(() => wakeLock = null);
    }
}

document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
        salvarBackup();
    } else if (document.visibilityState === 'visible' && cronometroRodando) {
        manterTelaAtiva();
    }
});

// Mostrar/esconder por id (elemento ausente = nada a fazer). Um lugar só
// pro padrão que se repetia em todo handler.
function mostrar(id) {
    document.getElementById(id)?.classList.remove('hidden');
}

function esconder(id) {
    document.getElementById(id)?.classList.add('hidden');
}

function abrirModal(id) {
    const el = document.getElementById(id);
    el?.classList.remove('hidden');
    el?.classList.add('flex');
}

function fecharModal(id) {
    const el = document.getElementById(id);
    el?.classList.add('hidden');
    el?.classList.remove('flex');
}

function getAvatarUrl(nome) {
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(nome)}&background=141416&color=8ba360&bold=true`;
}

// Cache-buster nas URLs de foto. Bumpa junto com o sw.js pra forçar
// o navegador a re-baixar a foto (quebra qualquer cache HTTP do Chrome
// que tenha prendado uma resposta 404 antiga).
const FOTOS_VERSION = '55';
function fotoUrl(path) {
    if (!path) return path;
    return path + '?v=' + FOTOS_VERSION;
}

function salvarBackup() {
    const backup = {
        jogadoresData,
        timesSorteadosGlobal,
        tempoRestante,
        golsPartidaAtual,
        golsJogadorPartida,
        golsFeedPartida
    };
    localStorage.setItem('backupPelada', JSON.stringify(backup));
}

function init() {
    verificarLimpezaMeiaNoite();

    const backup = localStorage.getItem('backupPelada');
    if (backup) restaurarBackup(JSON.parse(backup));

    const totalJogadores = document.getElementById('total-jogadores');
    if(totalJogadores) totalJogadores.innerText = jogadoresData.length;
    
    renderLista();
    atualizarContador();
    atualizarDisplayCronometro();
    renderArtilharia();

    // R-2026-10-20: hidrata jogadores do servidor (posicao, foto) sem sobrescrever
    // a presenca (que eh local e reflete o checklist da UI).
    // Chamado via setTimeout(0) porque LF_SYNC_ENDPOINT_KEY (const) ainda
    // nao foi inicializada neste ponto do codigo (TDZ). setTimeout empilha
    // a chamada pra depois do script acabar de rodar.
    setTimeout(hidratarJogadoresNoBoot, 0);
}

// Estado salvo do dia (reload / app fechado no meio da pelada)
function restaurarBackup(dados) {
    jogadoresData = dados.jogadoresData || jogadoresData;
    timesSorteadosGlobal = dados.timesSorteadosGlobal || [];
    tempoRestante = dados.tempoRestante !== undefined ? dados.tempoRestante : TEMPO_TOTAL;
    golsPartidaAtual = dados.golsPartidaAtual || 0;
    golsJogadorPartida = dados.golsJogadorPartida || {};
    golsFeedPartida = dados.golsFeedPartida || [];
    renderGolsPartida();

    if (timesSorteadosGlobal.length > 0) {
        esconder('btn-sortear');
        esconder('lista-jogadores-section');
        mostrar('resultado-section');
        renderTimes(timesSorteadosGlobal);
    }

    // Reabrir o app nunca deixa o cronômetro rodando sozinho
    cronometroRodando = false;
    atualizarBotaoCronometroParado();
}

function atualizarBotaoCronometroParado() {
    const btn = document.getElementById('btn-cronometro');
    if (!btn) return;
    if (tempoRestante === TEMPO_TOTAL) {
        btn.innerHTML = '<i class="fa-solid fa-play mr-3 text-2xl opacity-80"></i> Iniciar';
        btn.className = 'w-full max-w-[320px] btn-primary py-3.5 rounded-lg font-teko text-3xl uppercase tracking-wider active:scale-95 transition-all flex justify-center items-center shadow-lg';
    } else {
        btn.innerHTML = '<i class="fa-solid fa-play mr-2 text-2xl opacity-80"></i> Retomar';
        btn.className = 'w-full max-w-[320px] bg-amber-600/80 backdrop-blur-sm text-white border border-amber-500/50 py-3.5 rounded-lg font-teko text-3xl uppercase tracking-wider active:scale-95 transition-all flex justify-center items-center shadow-lg';
    }
}

// R-2026-10-20: hidrata jogadores do servidor (posicao, foto) sem sobrescrever
// a presenca. Roda via setTimeout(0) no init: LF_SYNC_ENDPOINT_KEY e o
// estado do sync precisam estar inicializados (TDZ).
function hidratarJogadoresNoBoot() {
    if (!lfSyncAtivo()) {
        console.info('[hidratar] sync desativado (sem endpoint) - Michel/Lucas vao usar valores hardcoded');
        return;
    }
    console.info('[hidratar] iniciando hidratacao...');
    lfSyncHidratarJogadores().then((atualizou) => {
        console.info('[hidratar] ok, atualizou=' + !!atualizou);
        if (atualizou) {
            renderLista();
            renderArtilharia();
            salvarBackup();
        }
    }).catch(err => {
        console.warn('[hidratar] falhou:', err && err.message ? err.message : err);
    });
}

function verificarLimpezaMeiaNoite() {
    const dataSalva = localStorage.getItem('dataPelada');
    const dataHoje = new Date().toDateString(); 
    
    if (dataSalva !== dataHoje) {
        localStorage.removeItem('artilhariaPelada');
        localStorage.removeItem('backupPelada'); 
        localStorage.setItem('dataPelada', dataHoje);
    }
}

function mudarAba(aba) {
    esconder('tab-sorteio');
    esconder('tab-partida');
    esconder('tab-artilharia');
    
    document.querySelectorAll('nav button').forEach(btn => {
        btn.classList.remove('text-brand');
        btn.classList.add('text-zinc-500');
    });

    mostrar(`tab-${aba}`);
    document.getElementById(`nav-${aba}`)?.classList.replace('text-zinc-500', 'text-brand');

    if (aba === 'artilharia') renderArtilharia();
}

function renderLista() {
    jogadoresData.sort((a, b) => a.nome.localeCompare(b.nome));
    const container = document.getElementById('lista-jogadores');
    if(!container) return;
    
    container.innerHTML = '';

    jogadoresData.forEach(jogador => {
        const card = document.createElement('div');
        card.className = `player-card glass-panel flex items-center p-3 cursor-pointer border ${jogador.presente ? 'selected' : 'border-white/5'}`;
        card.onclick = () => togglePresenca(jogador.id);
        
        const badgeColor = jogador.posicao === 'goleiro' ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' : 'bg-white/5 text-zinc-400 border-white/10';
        const badgeText = jogador.posicao === 'goleiro' ? 'Goleiro' : 'Linha';

        card.innerHTML = `
            <img src="${fotoUrl(jogador.foto)}" onerror="this.onerror=null; this.src=getAvatarUrl('${jogador.nome}')" alt="${jogador.nome}" class="w-10 h-10 object-cover rounded-md mr-3 border border-white/10 bg-black/50">
            <div class="flex flex-col flex-1 overflow-hidden">
                <span class="font-bold text-sm leading-tight truncate text-white">${jogador.nome}</span>
                <button type="button" data-edit-posicao="${jogador.id}" class="position-badge border px-1.5 py-[1px] rounded mt-1 w-max ${badgeColor} hover:opacity-80 transition-opacity inline-flex items-center gap-1" title="Alterar posicao (linha/goleiro)">
                    ${badgeText}<i class="fa-solid fa-gear text-[9px] opacity-60"></i>
                </button>
            </div>
            <div class="ml-2 shrink-0">
                <div class="w-5 h-5 rounded border flex items-center justify-center transition-colors ${jogador.presente ? 'border-[var(--c-brand-light)] bg-[var(--c-brand)]' : 'border-white/10 bg-black/40'}">
                    ${jogador.presente ? '<i class="fa-solid fa-check text-white drop-shadow-md text-xs"></i>' : ''}
                </div>
            </div>
        `;
        container.appendChild(card);
    });

    // Botao ⚙️ do badge de posicao: abre o editor linha/goleiro.
    // stopPropagation evita que o click chegue no card e altere a presenca.
    container.querySelectorAll('[data-edit-posicao]').forEach(btn => {
        btn.addEventListener('click', (ev) => {
            ev.stopPropagation();
            abrirModalEditarPosicao(Number(btn.dataset.editPosicao));
        });
    });
}

// === EDITAR POSICAO (linha/goleiro) ===
let jogadorEditandoPosicao = null;

function abrirModalEditarPosicao(id) {
    const jogador = jogadoresData.find(j => j.id == id);
    if (!jogador) return;
    jogadorEditandoPosicao = jogador;
    const modal = document.getElementById('modal-editar-posicao');
    if (!modal) return;
    const radioLinha = document.getElementById('posicao-linha');
    const radioGoleiro = document.getElementById('posicao-goleiro');
    if (radioLinha) radioLinha.checked = jogador.posicao !== 'goleiro';
    if (radioGoleiro) radioGoleiro.checked = jogador.posicao === 'goleiro';
    const nomeEl = document.getElementById('nome-atleta-editar-posicao');
    if (nomeEl) nomeEl.textContent = jogador.nome;
    modal.classList.remove('hidden');
}

function fecharModalEditarPosicao() {
    const modal = document.getElementById('modal-editar-posicao');
    if (modal) modal.classList.add('hidden');
    jogadorEditandoPosicao = null;
}

async function salvarNovaPosicao() {
    const jogador = jogadorEditandoPosicao;
    if (!jogador) return;
    const goleiroEl = document.getElementById('posicao-goleiro');
    const novaPosicao = (goleiroEl && goleiroEl.checked) ? 'goleiro' : 'linha';
    const anterior = jogador.posicao;

    // Otimista: aplica local, so reverte se o servidor recusar.
    jogador.posicao = novaPosicao;
    renderLista();
    salvarBackup();
    fecharModalEditarPosicao();

    if (!lfSyncAtivo()) return;
    const r = await lfSyncEnviarPatch('/jogadores/' + jogador.id, { posicao: novaPosicao });
    if (!r.ok) {
        jogador.posicao = anterior;
        renderLista();
        salvarBackup();
        alert('Não foi possível salvar a posição no servidor. Restaurando.');
    }
}

function togglePresenca(id) {
    const jogador = jogadoresData.find(j => j.id === id);
    if (jogador) {
        const estavaPresente = jogador.presente;
        jogador.presente = !jogador.presente;
        
        if (timesSorteadosGlobal.length > 0) {
            if (!estavaPresente && jogador.presente) {
                alocarJogadorAtrasado(jogador);
                // Atrasado confirmado depois do sorteio também conta presença no dia
                lfSyncEnviar('/presencas', { jogadores_ids: [jogador.id] });
            } else if (estavaPresente && !jogador.presente) {
                removerJogadorSorteado(jogador.id);
            }
        }

        renderLista();
        atualizarContador();
        salvarBackup();
    }
}

function selecionarTodos() {
    const todosPresentes = jogadoresData.every(j => j.presente);
    jogadoresData.forEach(j => j.presente = !todosPresentes);
    
    if (timesSorteadosGlobal.length > 0) {
        alert("Atenção: O sorteio já foi feito. Alterar todos agora não reorganiza automaticamente. Use os botões de troca no painel de times.");
    }
    
    renderLista();
    atualizarContador();
    salvarBackup();
}

function atualizarContador() {
    const presentes = jogadoresData.filter(j => j.presente).length;
    const contador = document.getElementById('contador-presentes');
    if(contador) contador.innerText = presentes;
}

// Pura: nome digitado (sem espaços nas pontas) ou "Player N" se vazio.
// Nunca devolve vazio, então não precisa de checagem depois.
function nomeConvidado(entrada, jogadores) {
    const nome = entrada.trim();
    if (nome) return nome;
    return `Player ${jogadores.filter(j => j.nome.startsWith('Player')).length + 1}`;
}

// Pura: maior id numérico + 1 (R-2026-10-20: o backend exige id numérico;
// slugs legados ficam de fora do max).
function proximoIdJogador(jogadores) {
    const ids = jogadores.map(j => Number(j.id)).filter(Number.isFinite);
    return Math.max(0, ...ids) + 1;
}

function adicionarPlayer() {
    let nomeInput = prompt("Digite o nome do jogador convidado:\n(Ou deixe em branco para ser automático)");
    if (nomeInput === null) return;

    const nomeFinal = nomeConvidado(nomeInput, jogadoresData);

    const ehLinha = confirm(`O ${nomeFinal} é Jogador de Linha ou Goleiro?\n\n✅ Clique em [OK] se for LINHA.\n❌ Clique em [Cancelar] se for GOLEIRO.`);
    const posicaoFinal = ehLinha ? "linha" : "goleiro";

    const novoId = proximoIdJogador(jogadoresData);

    const novoJogador = {
        id: novoId,
        nome: nomeFinal,
        posicao: posicaoFinal,
        presente: true,
        foto: ""
    };

    jogadoresData.push(novoJogador);

    if (timesSorteadosGlobal.length > 0) {
        alocarJogadorAtrasado(novoJogador);
    }

    const totalJogadores = document.getElementById('total-jogadores');
    if(totalJogadores) totalJogadores.innerText = jogadoresData.length;

    renderLista();
    atualizarContador();
    salvarBackup();

    // R-2026-10-20: envia pro backend se sync ativo. Antes ficava só local
    // e o servidor nunca ficava sabendo (gerava inconsistencia entre
    // localStorage e o servidor /estado).
    if (lfSyncAtivo()) {
        lfSyncEnviar('/jogadores', { id: String(novoId), nome: nomeFinal, posicao: posicaoFinal })
            .then((r) => {
                if (r && r.status === 400) {
                    // Backend rejeitou (slug ou outro motivo). Rollback local.
                    const idx = jogadoresData.findIndex(j => j.id === novoId);
                    if (idx !== -1) jogadoresData.splice(idx, 1);
                    renderLista();
                    atualizarContador();
                    salvarBackup();
                    alert('Servidor rejeitou o cadastro: ' + r.body);
                }
            });
    }
}

function alocarJogadorAtrasado(jogador) {
    if (timesSorteadosGlobal.length === 0) return;
    let ultimoTime = timesSorteadosGlobal[timesSorteadosGlobal.length - 1];

    if (ultimoTime.jogadores.length < 5) {
        if (!ultimoTime.jogadores.find(j => j.id === jogador.id)) {
            ultimoTime.jogadores.push(jogador);
        }
    } else {
        timesSorteadosGlobal.push({ nome: `Time`, jogadores: [jogador] });
    }
    
    renomearTimesSequencialmente();
    renderTimes(timesSorteadosGlobal);
}

function removerJogadorSorteado(id) {
    timesSorteadosGlobal.forEach(time => {
        time.jogadores = time.jogadores.filter(j => j.id !== id);
    });
    renomearTimesSequencialmente();
    renderTimes(timesSorteadosGlobal);
}

function renomearTimesSequencialmente() {
    timesSorteadosGlobal = timesSorteadosGlobal.filter(t => t.jogadores.length > 0);
    timesSorteadosGlobal.forEach((t, index) => {
        t.nome = `Time ${index + 1}`;
    });
}

function shuffle(array) {
    let currentIndex = array.length, randomIndex;
    while (currentIndex > 0) {
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;
        [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
    }
    return array;
}

function iniciarSorteio() {
    const presentes = jogadoresData.filter(j => j.presente);
    if (presentes.length < 5) {
        alert("Selecione pelo menos 5 jogadores para formar um time.");
        return;
    }

    esconder('btn-sortear');
    esconder('lista-jogadores-section');
    esconder('resultado-section');
    mostrar('loading-sorteio');

    setTimeout(() => {
        esconder('loading-sorteio');
        mostrar('resultado-section');
        mostrar('lista-jogadores-section');
        
        sortearImparcial(presentes);
    }, 2500);
}

function sortearImparcial(presentes) {
    let goleiros = shuffle(shuffle(presentes.filter(j => j.posicao === 'goleiro')));
    let linhas = shuffle(shuffle(presentes.filter(j => j.posicao === 'linha')));
    
    let numTimesTotal = Math.floor(presentes.length / 5);
    let times = [];

    for (let i = 0; i < numTimesTotal; i++) {
        times.push({ nome: `Time`, jogadores: [] });
    }

    for (let i = 0; i < numTimesTotal; i++) {
        if (goleiros.length > 0) {
            times[i].jogadores.push(goleiros.pop());
        }
    }

    let restanteMisto = shuffle(shuffle(linhas.concat(goleiros)));

    for (let jogador of restanteMisto) {
        let timesDisponiveis = shuffle(times.filter(t => t.jogadores.length < 5));
        if (timesDisponiveis.length === 0) break; 
        timesDisponiveis[0].jogadores.push(jogador);
    }

    let idsAlocados = new Set(times.flatMap(t => t.jogadores.map(j => j.id)));
    let restoGeral = shuffle(presentes.filter(p => !idsAlocados.has(p.id)));

    if (restoGeral.length > 0) {
        times.push({ nome: `Time`, jogadores: restoGeral });
    }

    timesSorteadosGlobal = times;
    renomearTimesSequencialmente();
    renderTimes(timesSorteadosGlobal);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    salvarBackup();

    // Sync: registra no servidor quem compareceu (IDs de quem foi sorteado)
    lfSyncEnviar('/presencas', { jogadores_ids: times.flatMap(t => t.jogadores.map(j => j.id)) });
}

function renderTimes(times) {
    const container = document.getElementById('times-container');
    if(!container) return;
    container.innerHTML = '';

    times.forEach(time => {
        const timeDiv = document.createElement('div');
        timeDiv.className = `glass-panel overflow-hidden`;
        
        const header = document.createElement('div');
        header.className = `px-4 py-2 flex justify-between items-center bg-black/40 border-b border-white/5`;
        header.innerHTML = `
            <span class="font-teko text-2xl uppercase tracking-widest text-brand mt-1 drop-shadow-md">${time.nome}</span>
            <div class="flex items-center gap-3">
                <span class="text-xs font-bold px-2 py-1 bg-white/5 rounded text-zinc-300 border border-white/5">${time.jogadores.length}/5</span>
                ${time.jogadores.length < 5 ? `<button onclick="abrirModalSubSorteio(${times.indexOf(time)})" class="btn-config-time text-brand hover:text-white bg-white/5 border border-white/10 hover:bg-[var(--c-brand)] rounded px-2 py-1 text-xs transition-colors shadow-lg" title="Adicionar jogador à vaga"><i class="fa-solid fa-plus opacity-80"></i></button>` : ''}
            </div>
        `;
        timeDiv.appendChild(header);

        const ul = document.createElement('ul');
        ul.className = 'divide-y divide-white/5';
        
        time.jogadores.forEach(j => {
            const li = document.createElement('li');
            li.className = 'px-4 py-3 flex items-center justify-between gap-3';
            
            const iconePosicao = j.posicao === 'goleiro' 
                ? '<i class="fa-solid fa-hands-holding text-amber-500 w-4 text-center opacity-80"></i>' 
                : '<i class="fa-solid fa-shoe-prints text-zinc-500 w-4 text-center opacity-80"></i>';

            li.innerHTML = `
                <div class="flex items-center gap-3 flex-1 overflow-hidden">
                    ${iconePosicao}
                    <img src="${fotoUrl(j.foto)}" onerror="this.onerror=null; this.src=getAvatarUrl('${j.nome}')" class="w-8 h-8 object-cover rounded-md border border-white/10 bg-black/50 shrink-0 shadow-md">
                    <span class="font-bold text-white truncate">${j.nome}</span>
                </div>
                <div class="flex gap-1 shrink-0 btn-config-time">
                    <button onclick="abrirModalSubSorteio(${times.indexOf(time)}, ${j.id})" class="text-zinc-400 hover:text-brand p-2 transition-colors drop-shadow-md" title="Trocar de lugar"><i class="fa-solid fa-right-left"></i></button>
                    <button onclick="removerJogadorDoTimeSorteado(${times.indexOf(time)}, ${j.id})" class="text-zinc-500 hover:text-red-500 p-2 transition-colors drop-shadow-md" title="Remover deste time"><i class="fa-solid fa-xmark"></i></button>
                </div>
            `;
            ul.appendChild(li);
        });

        timeDiv.appendChild(ul);
        container.appendChild(timeDiv);
    });
}

function desfazerSorteio() {
    if(confirm("Tem certeza que deseja apagar os times formados e voltar ao sorteio?")) {
        timesSorteadosGlobal = [];
        esconder('resultado-section');
        mostrar('btn-sortear');
        mostrar('lista-jogadores-section');
        salvarBackup();
    }
}

let modalSorteioTimeIndex = null;
let modalSorteioJogadorSaindoId = null;

function removerJogadorDoTimeSorteado(timeIndex, jogadorId) {
    if(confirm("Deseja apenas remover este jogador do time (ele ficará livre para ser adicionado em outra vaga)?")) {
        timesSorteadosGlobal[timeIndex].jogadores = timesSorteadosGlobal[timeIndex].jogadores.filter(j => j.id !== jogadorId);
        renomearTimesSequencialmente();
        renderTimes(timesSorteadosGlobal);
        salvarBackup();
    }
}

function abrirModalSubSorteio(timeIndex, jogadorSaindoId = null) {
    modalSorteioTimeIndex = timeIndex;
    modalSorteioJogadorSaindoId = jogadorSaindoId;

    const timeData = timesSorteadosGlobal[timeIndex];
    const titulo = document.getElementById('titulo-modal-sub-sorteio');

    if (jogadorSaindoId !== null) {
        const jogadorSaindo = timeData.jogadores.find(j => j.id === jogadorSaindoId);
        titulo.innerText = `Trocar: ${jogadorSaindo.nome}`;
    } else {
        titulo.innerText = `Adicionar em: ${timeData.nome}`;
    }

    const lista = document.getElementById('modal-sub-sorteio-lista');
    lista.innerHTML = '';

    const presentes = jogadoresData.filter(j => j.presente);
    const jogadoresOutros = presentes.filter(p => !timeData.jogadores.find(j => j.id === p.id)).sort((a, b) => a.nome.localeCompare(b.nome));

    if (jogadoresOutros.length === 0) {
        lista.innerHTML = '<p class="text-zinc-500 font-bold text-center p-4">Nenhum outro atleta disponível.</p>';
    } else {
        jogadoresOutros.forEach(j => {
            const btn = document.createElement('button');
            btn.className = "w-full text-left p-3 mb-2 bg-black/40 hover:bg-white/10 rounded border border-white/5 hover:border-[var(--c-brand-light)] font-bold text-white transition-colors flex items-center gap-3";
            btn.innerHTML = `
                <img src="${fotoUrl(j.foto)}" onerror="this.onerror=null; this.src=getAvatarUrl('${j.nome}')" class="w-8 h-8 object-cover rounded-md bg-black/80 border border-white/10">
                ${j.nome}
            `;
            btn.onclick = () => efetivarSubSorteio(j.id);
            lista.appendChild(btn);
        });
    }

    abrirModal('modal-sub-sorteio');
}

function efetivarSubSorteio(jogadorEntrandoId) {
    const jogadorEntrando = jogadoresData.find(j => j.id === jogadorEntrandoId);
    trocarJogadorEntreTimes(timesSorteadosGlobal, modalSorteioTimeIndex, modalSorteioJogadorSaindoId, jogadorEntrando);
    fecharModalSubSorteio();
    renomearTimesSequencialmente();
    renderTimes(timesSorteadosGlobal);
    salvarBackup();
}

// Coloca `entrando` no time `timeIndex`. Com `saindoId`, troca: quem sai vai
// pro lugar de onde o outro veio (ou só sai, se ele veio de fora). Sem
// `saindoId`, ocupa uma vaga e deixa o time de origem.
function trocarJogadorEntreTimes(times, timeIndex, saindoId, entrando) {
    const alvo = times[timeIndex];
    const origem = times.find(t => t.jogadores.some(j => j.id === entrando.id));
    const idxOrigem = origem ? origem.jogadores.findIndex(j => j.id === entrando.id) : -1;
    if (saindoId !== null) {
        const idxSaindo = alvo.jogadores.findIndex(j => j.id === saindoId);
        const saindo = alvo.jogadores[idxSaindo];
        alvo.jogadores[idxSaindo] = entrando;
        if (origem) origem.jogadores[idxOrigem] = saindo;
    } else {
        alvo.jogadores.push(entrando);
        if (origem) origem.jogadores.splice(idxOrigem, 1);
    }
}

function fecharModalSubSorteio() {
    fecharModal('modal-sub-sorteio');
}

function atualizarDisplayCronometro() {
    const min = Math.floor(tempoRestante / 60).toString().padStart(2, '0');
    const sec = (tempoRestante % 60).toString().padStart(2, '0');
    const display = document.getElementById('cronometro-display');
    if(display) display.innerText = `${min}:${sec}`;
}

function toggleCronometro() {
    if (!cronometroRodando && timesSorteadosGlobal.length === 0) {
        alert("Atenção: Sorteie os times primeiro antes de soltar o cronômetro!");
        mudarAba('sorteio');
        return;
    }

    const btn = document.getElementById('btn-cronometro');
    
    if (cronometroRodando) {
        clearInterval(intervaloCronometro);
        cronometroRodando = false;
        liberarTela(); 
        salvarBackup();
        
        btn.innerHTML = '<i class="fa-solid fa-play mr-2 text-2xl opacity-80"></i> Retomar';
        btn.className = 'w-full max-w-[320px] bg-amber-600/80 backdrop-blur-md text-white border border-amber-500/50 py-3.5 rounded-lg font-teko text-3xl uppercase tracking-wider active:scale-95 transition-all flex justify-center items-center shadow-lg';
    } else {
        cronometroRodando = true;
        manterTelaAtiva(); 
        salvarBackup();
        
        btn.innerHTML = '<i class="fa-solid fa-pause mr-2 text-2xl opacity-80"></i> Pausar';
        btn.className = 'w-full max-w-[320px] bg-red-600/80 backdrop-blur-md text-white border border-red-500/50 py-3.5 rounded-lg font-teko text-3xl uppercase tracking-wider active:scale-95 transition-all flex justify-center items-center shadow-lg';
        
        intervaloCronometro = setInterval(() => {
            tempoRestante--;
            atualizarDisplayCronometro();
            
            if (tempoRestante <= 0) {
                finalizarPartidaTempo("Fim de Jogo");
            }
        }, 1000);
    }
}

function finalizarPartidaTempo(mensagem) {
    clearInterval(intervaloCronometro);
    cronometroRodando = false;
    liberarTela(); 
    salvarBackup();
    
    setTimeout(() => {
        alert(mensagem);
        prepararNovoJogo();
    }, 300);
}

function zerarCronometroManualmente() {
    if (cronometroRodando) {
        alert("Pause o cronômetro antes de reiniciar o tempo!");
        return;
    }
    if(confirm("Deseja reiniciar o cronômetro para o próximo jogo?")) {
        prepararNovoJogo();
    }
}

function prepararNovoJogo() {
    tempoRestante = TEMPO_TOTAL;
    
    golsPartidaAtual = 0;
    golsJogadorPartida = {};
    golsFeedPartida = [];
    renderGolsPartida();
    
    atualizarDisplayCronometro();
    
    const btn = document.getElementById('btn-cronometro');
    if(btn) {
        btn.innerHTML = '<i class="fa-solid fa-play mr-3 text-2xl opacity-80"></i> Iniciar';
        btn.className = 'w-full max-w-[320px] btn-primary py-3.5 rounded-lg font-teko text-3xl uppercase tracking-wider active:scale-95 transition-all flex justify-center items-center shadow-lg';
    }
    
    salvarBackup();
}

function minutoGolAtual() {
    const decorrido = Math.min(TEMPO_TOTAL, Math.max(0, TEMPO_TOTAL - tempoRestante));
    const totalSegundos = Math.floor(decorrido);
    const min = Math.floor(totalSegundos / 60);
    const seg = totalSegundos % 60;
    return `${String(min).padStart(2, '0')}:${String(seg).padStart(2, '0')}`;
}

function renderGolsPartida() {
    const painel = document.getElementById('painel-gols-partida');
    const feed = document.getElementById('feed-gols-partida');
    if (!painel || !feed) return;

    if (golsFeedPartida.length === 0) {
        painel.classList.add('hidden');
        feed.innerHTML = '';
        return;
    }

    painel.classList.remove('hidden');
    feed.innerHTML = '';

    [...golsFeedPartida].reverse().forEach((gol, idx) => {
        // idx reverso: o último gol é idx=0. Mapear para o índice real do array.
        const realIdx = golsFeedPartida.length - 1 - idx;
        const item = document.createElement('div');
        item.className = 'flex items-center gap-3 bg-black/40 border border-white/5 rounded p-2.5';
        item.innerHTML = `
            <img src="${fotoUrl(gol.foto)}" onerror="this.onerror=null; this.src=getAvatarUrl('${gol.nome}')" class="w-9 h-9 object-cover rounded-md bg-black/80 border border-white/10 shrink-0">
            <span class="font-bold text-white truncate flex-grow">${gol.nome}</span>
            <span class="led-text text-brand text-lg tabular-nums shrink-0">${gol.minuto}'</span>
            <button type="button" data-remove-gol="${realIdx}" class="ml-2 text-zinc-500 hover:text-red-400 transition-colors shrink-0" title="Remover gol" aria-label="Remover gol de ${gol.nome}">
                <i class="fa-solid fa-trash-can text-base"></i>
            </button>
        `;
        feed.appendChild(item);
    });
    // Liga os botões de remover (delegação simples)
    feed.querySelectorAll('[data-remove-gol]').forEach(btn => {
        btn.addEventListener('click', () => removerGol(Number(btn.dataset.removeGol)));
    });
}

// Remove um gol da partida atual (UI + servidor + contadores)
// Tem confirmação, é otimista (some da UI na hora), e restaura se o servidor falhar.
async function removerGol(index) {
    const gol = golsFeedPartida[index];
    if (!gol) return;
    if (!confirm(`Remover o gol de ${gol.nome} aos ${gol.minuto}?`)) return;

    // Otimista: tira local já; se o servidor recusar, volta tudo como estava
    const antes = fotografarPartida();
    golsFeedPartida.splice(index, 1);
    golsPartidaAtual = Math.max(0, golsPartidaAtual - 1);
    golsJogadorPartida = descontarGol(golsJogadorPartida, gol.id, (n) => n, (n) => n - 1);
    const artilharia = JSON.parse(localStorage.getItem('artilhariaPelada')) || {};
    localStorage.setItem('artilhariaPelada', JSON.stringify(
        descontarGol(artilharia, gol.id, (a) => a.gols, (a) => ({ ...a, gols: a.gols - 1 }))
    ));
    renderGolsPartida();
    salvarBackup();
    lfSyncInvalidarCacheGeral();

    if (!await lfSyncRemoverGol(gol.dbId)) {
        alert('Não foi possível remover o gol no servidor. Restaurando.');
        restaurarFotoDaPartida(antes);
    }
}

// Pura: devolve uma cópia com um gol a menos para `id`; quem chega a 0 sai.
// `gols(v)` lê a contagem do valor e `menos(v)` devolve o valor com -1.
function descontarGol(mapa, id, gols, menos) {
    const copia = { ...mapa };
    if (!(gols(copia[id] ?? 0) > 0)) return copia;
    copia[id] = menos(copia[id]);
    if (gols(copia[id]) === 0) delete copia[id];
    return copia;
}

function fotografarPartida() {
    return {
        feed: JSON.parse(JSON.stringify(golsFeedPartida)),
        golsPartida: golsPartidaAtual,
        golsJogador: { ...golsJogadorPartida },
        artilharia: localStorage.getItem('artilhariaPelada'),
    };
}

function restaurarFotoDaPartida(foto) {
    golsFeedPartida = foto.feed;
    golsPartidaAtual = foto.golsPartida;
    golsJogadorPartida = foto.golsJogador;
    localStorage.setItem('artilhariaPelada', foto.artilharia);
    renderGolsPartida();
    salvarBackup();
}

function abrirModalGol() {
    if (!cronometroRodando && tempoRestante === TEMPO_TOTAL) {
        alert("Inicie o cronômetro antes de registrar um gol!");
        return;
    }
    
    if (tempoRestante <= 0) return; 

    if (golsPartidaAtual >= 3) {
        alert("O limite máximo de 3 gols por partida já foi atingido!");
        return;
    }

    const todosJogadores = [...jogadoresData].sort((a, b) => a.nome.localeCompare(b.nome));
    renderListaJogadoresModal(todosJogadores);

    document.getElementById('busca-jogador-gol').value = '';
    abrirModal('modal-gol');
    
    setTimeout(() => document.getElementById('busca-jogador-gol')?.focus(), 100);
}

function renderListaJogadoresModal(lista) {
    const listaModal = document.getElementById('modal-jogadores-lista');
    listaModal.innerHTML = '';

    if(lista.length === 0) {
        listaModal.innerHTML = '<p class="text-zinc-500 font-bold text-center p-4">Nenhum atleta encontrado.</p>';
        return;
    }

    lista.forEach(j => {
        const btn = document.createElement('button');
        btn.className = "jogador-item-modal w-full text-left p-3 mb-2 bg-black/40 hover:bg-white/10 rounded border border-white/5 hover:border-[var(--c-brand-light)] font-bold text-white transition-colors flex items-center gap-3";
        btn.innerHTML = `
            <img src="${fotoUrl(j.foto)}" onerror="this.onerror=null; this.src=getAvatarUrl('${j.nome}')" class="w-8 h-8 object-cover rounded-md bg-black/80 border border-white/10">
            <span class="nome-jogador">${j.nome}</span>
        `;
        btn.onclick = () => registrarGol(j.id, j.nome);
        listaModal.appendChild(btn);
    });
}

function normalizarTexto(str) {
    return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

function filtrarJogadoresGol() {
    const termo = normalizarTexto(document.getElementById('busca-jogador-gol').value);
    const itens = document.querySelectorAll('.jogador-item-modal');
    
    itens.forEach(item => {
        const nome = normalizarTexto(item.querySelector('.nome-jogador').innerText);
        if (nome.includes(termo)) {
            item.style.display = 'flex';
        } else {
            item.style.display = 'none';
        }
    });
}

function fecharModalGol() {
    fecharModal('modal-gol');
}

// Vista atual da tab Artilharia ('hoje' = localStorage | 'geral' = servidor)
let vistaArtilhariaAtual = 'hoje';
let artilhariaGeralCache = null;

function registrarGol(jogadorId, jogadorNome) {
    // R-2026-10-25: confirma o atleta ANTES de registrar. Mata o gol marcado
    // no jogador errado (a maior fonte de erro na artilharia). Cancelar = nada
    // acontece (nem local, nem servidor).
    if (!confirm(`Marcar gol para ${jogadorNome}?`)) return;

    let golsAtuaisDesteJogador = golsJogadorPartida[jogadorId] || 0;

    if (golsAtuaisDesteJogador >= 2) {
        alert(`O atleta ${jogadorNome} já atingiu o limite de 2 gols nesta partida!`);
        return;
    }

    golsPartidaAtual++;
    golsJogadorPartida[jogadorId] = golsAtuaisDesteJogador + 1;
    
    const jogador = jogadoresData.find(j => j.id === jogadorId);
    golsFeedPartida.push({
        id: jogadorId,
        dbId: null,  // preenchido quando o sync confirma o id do gol no servidor
        nome: jogadorNome,
        foto: jogador ? jogador.foto : '',
        minuto: minutoGolAtual()
    });
    renderGolsPartida();
    
    let artilharia = JSON.parse(localStorage.getItem('artilhariaPelada')) || {};
    
    if (artilharia[jogadorId]) {
        artilharia[jogadorId].gols++;
    } else {
        artilharia[jogadorId] = { nome: jogadorNome, gols: 1, foto: jogadoresData.find(j => j.id === jogadorId).foto };
    }
    
    localStorage.setItem('artilhariaPelada', JSON.stringify(artilharia));
    fecharModalGol();
    salvarBackup();
    lfSyncRegistrarGol(jogadorId, jogadorNome, minutoGolAtual(), golsFeedPartida.length - 1);
    lfSyncInvalidarCacheGeral();

    // R-2026-10-25: volta o auto-finalizar (regra original do app).
    // A partida encerra em 2 gols do mesmo atleta OU 3 gols no total.
    // A confirmacao acima (confirm "Marcar gol para X?") e a lixeira no feed
    // (PR #41) resolvem o risco de perder o estado por erro de marcacao.
    if (golsJogadorPartida[jogadorId] >= 2) {
        finalizarPartidaTempo("Fim de Jogo");
    } else if (golsPartidaAtual >= 3) {
        finalizarPartidaTempo("Fim de Jogo");
    }
}

function renderArtilharia() {
    const container = document.getElementById('lista-artilheiros');
    if(!container) return;
    container.innerHTML = '';
    
    // Vista "Geral": render assíncrono do acumulado do servidor
    if (vistaArtilhariaAtual === 'geral') {
        lfSyncArtilhariaGeral().then(dados => {
            if (!dados) {
                container.innerHTML = '<p class="text-center text-zinc-600 font-bold uppercase tracking-widest py-10">Artilharia geral precisa do Sync ativo.<br><span class="normal-case">Configure na aba Sync acima.</span></p>';
                return;
            }
            if (dados.length === 0) {
                container.innerHTML = '<p class="text-center text-zinc-600 font-bold uppercase tracking-widest py-10">Nenhum gol marcado ainda.</p>';
                return;
            }
            renderListaArtilheiros(dados);
        });
        return;
    }

    let artilharia = JSON.parse(localStorage.getItem('artilhariaPelada'));
    if (!artilharia || Object.keys(artilharia).length === 0) {
        container.innerHTML = '<p class="text-center text-zinc-600 font-bold uppercase tracking-widest py-10">Nenhum gol marcado ainda.</p>';
        return;
    }

    renderListaArtilheiros(Object.values(artilharia).sort((a, b) => b.gols - a.gols));
}

// Render comum das duas vistas: array de {nome, gols, foto?, partidas?, presencas?}
// partidas/presencas são opcionais: só vêm na vista Geral (do servidor).
function renderListaArtilheiros(arrayArtilheiros) {
    const container = document.getElementById('lista-artilheiros');
    if(!container) return;
    let posicoes = [...new Set(arrayArtilheiros.map(j => j.gols))];

    arrayArtilheiros.forEach((jogador) => {
        let colocacao = posicoes.indexOf(jogador.gols) + 1;
        
        let medalha = '';
        if (colocacao === 1) medalha = '<i class="fa-solid fa-medal text-yellow-500 text-2xl drop-shadow-md"></i>';
        else if (colocacao === 2) medalha = '<i class="fa-solid fa-medal text-zinc-300 text-2xl drop-shadow-md"></i>';
        else if (colocacao === 3) medalha = '<i class="fa-solid fa-medal text-amber-600 text-2xl drop-shadow-md"></i>';
        else medalha = '<span class="text-zinc-600 font-teko text-2xl mr-2">' + colocacao + 'º</span>';

        // Estatísticas históricas: só renderiza na vista Geral, onde
        // partidas/presencas vêm do servidor. Hoje não tem esse dado.
        let stats = '';
        if (jogador.partidas != null && jogador.presencas != null) {
            const media = jogador.presencas > 0
                ? (jogador.gols / jogador.presencas).toFixed(2)
                : '0.00';
            stats = `<span class="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-0.5">`
                  + `${jogador.partidas}J · ${jogador.presencas}x · ${media}/j`
                  + `</span>`;
        }

        const div = document.createElement('div');
        div.className = "glass-panel p-4 flex items-center justify-between";
        div.innerHTML = `
            <div class="flex items-center gap-4">
                <span class="font-black text-zinc-500 w-4">${colocacao}º</span>
                <img src="${fotoUrl(jogador.foto)}" onerror="this.onerror=null; this.src=getAvatarUrl('${jogador.nome}')" class="w-12 h-12 object-cover rounded-md border border-white/10 bg-black/50 shadow-md">
                <div class="flex flex-col">
                    <span class="font-bold text-white text-lg leading-tight">${jogador.nome}</span>
                    ${stats}
                </div>
            </div>
            <div class="flex items-center gap-3">
                ${medalha}
                <div class="bg-[var(--c-brand)] border border-white/10 text-white font-teko w-10 h-10 rounded text-center leading-[40px] text-[32px] shadow-[0_0_15px_rgba(139,163,96,0.2)]">
                    ${jogador.gols}
                </div>
            </div>
        `;
        container.appendChild(div);
    });
}

function zerarArtilharia() {
    if(confirm("Tem certeza que deseja zerar toda a artilharia deste sábado? Isso não pode ser desfeito.")) {
        localStorage.removeItem('artilhariaPelada');
        renderArtilharia();
    }
}

function copiarParaWhatsApp() {
    if (timesSorteadosGlobal.length === 0) return;
    copiarTexto(textoEscalacao(timesSorteadosGlobal), "Escalação copiada! Agora é só colar no grupo do WhatsApp.");
}

// Pura: escalação pro WhatsApp, luva pro goleiro.
function textoEscalacao(times) {
    const blocos = times.map(time => [
        `*${time.nome.toUpperCase()}*`,
        ...time.jogadores.map(j => `${j.posicao === 'goleiro' ? '🧤' : '🏃'} ${j.nome}`),
    ].join('\n'));
    return "⚽ *SORTEIO DOS TIMES* ⚽\n\n" + blocos.join('\n\n');
}

function copiarArtilharia() {
    const texto = textoArtilharia(JSON.parse(localStorage.getItem('artilhariaPelada')));
    if (!texto) {
        alert("Nenhum gol registrado para copiar.");
        return;
    }
    copiarTexto(texto, "Artilharia copiada! Agora é só colar no grupo do WhatsApp.");
}

// Pura: ranking do dia pro WhatsApp. Empate divide a colocação (e a medalha).
function textoArtilharia(artilharia) {
    const artilheiros = Object.values(artilharia || {}).sort((a, b) => b.gols - a.gols);
    if (artilheiros.length === 0) return null;
    const posicoes = [...new Set(artilheiros.map(j => j.gols))];
    const medalhas = ['🥇', '🥈', '🥉'];
    const linhas = artilheiros.map(j => `${medalhas[posicoes.indexOf(j.gols)] || '⚽'} ${j.nome} - ${j.gols} gol(s)`);
    return "🏆 *RANKING DO SÁBADO* 🏆\n\n" + linhas.join('\n');
}

function copiarTexto(texto, mensagemOk) {
    navigator.clipboard.writeText(texto).then(() => {
        alert(mensagemOk);
    }).catch(err => {
        console.error("Erro ao copiar: ", err);
        alert("Não foi possível copiar automaticamente.");
    });
}

// === TELA DE ABERTURA A PROVA DE FALHAS ===
// Garante que a tela de abertura vai sumir de qualquer jeito após 2.5s
setTimeout(() => {
    const splash = document.getElementById('splash-screen');
    if (splash) {
        splash.style.opacity = '0';
        setTimeout(() => {
            splash.remove();
            document.body.classList.remove('overflow-hidden');
        }, 500); 
    }
}, 2000);

// Inicia o app direto, sem esperar as imagens carregarem
init();

// ============================================================
// BANNER DE INSTALAÇÃO (PWA)
// Mostra "Instalar App Oficial" no topo enquanto o usuário não
// instalou (nem criou atalho) — como no design original do projeto.
// ============================================================
let deferredInstallPrompt = null;

function instaladoOuAtalho() {
    return window.matchMedia('(display-mode: standalone)').matches
        || window.navigator.standalone === true          // iOS Safari
        || window.matchMedia('(display-mode: standalone-ios)').matches
        || document.referrer.includes('android-app://');  // aberto pelo atalho/instalado
}

function mostrarBannerInstall() {
    const banner = document.getElementById('install-banner');
    if (!banner || instaladoOuAtalho()) return;
    banner.classList.remove('hidden');
}

function fecharBannerInstall() {
    const banner = document.getElementById('install-banner');
    if (banner) banner.classList.add('hidden');
    // Não guarda "não mostrar mais": quem acessa por link sempre vê —
    // era a intenção desde o começo do projeto.
}

window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredInstallPrompt = e;
    mostrarBannerInstall();
});

document.getElementById('btn-install')?.addEventListener('click', async () => {
    if (deferredInstallPrompt) {
        // Android/Chrome: fluxo nativo de instalação
        deferredInstallPrompt.prompt();
        const escolha = await deferredInstallPrompt.userChoice;
        if (escolha.outcome === 'accepted') fecharBannerInstall();
        deferredInstallPrompt = null;
    } else {
        // iOS Safari não tem beforeinstallprompt: instrui o Adicionar à Tela de Início
        alert('No iPhone: toque no botão Compartilhar (quadrado com seta pra cima) e depois em "Adicionar à Tela de Início".');
    }
});

// Fallback: se o navegador não disparar beforeinstallprompt (iOS, alguns browsers),
// o banner aparece mesmo assim após o splash — usuário não-instalado sempre vê.
setTimeout(mostrarBannerInstall, 2600);

// ============================================================
// SINCRONIZAÇÃO OPCIONAL COM BACKEND (LF Gerente API)
// Liga/desliga nas Configurações do app. Desligado por padrão —
// sem endpoint configurado, o app funciona 100% como antes.
// localStorage continua sendo a fonte da verdade offline.
// ============================================================
let lfSyncFila = JSON.parse(localStorage.getItem('lfSyncFila') || '[]');

function lfSyncAtivo() {
    const url = localStorage.getItem(LF_SYNC_ENDPOINT_KEY);
    return !!url && url.startsWith('https://');
}

function lfSyncConfigurar(url) {
    if (url && !url.startsWith('https://')) {
        alert('O endpoint de sincronização precisa ser https://');
        return false;
    }
    if (url) localStorage.setItem(LF_SYNC_ENDPOINT_KEY, url);
    else localStorage.removeItem(LF_SYNC_ENDPOINT_KEY);
    return true;
}

async function lfSyncEnviar(path, body) {
    if (!lfSyncAtivo()) return { ok: false, reason: 'sync-off' };
    const url = localStorage.getItem(LF_SYNC_ENDPOINT_KEY);
    try {
        const resp = await fetch(url + path, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
        if (!resp.ok) {
            // R-2026-10-20: loga e propaga o erro - antes engolia silenciosamente
            const texto = await resp.text().catch(() => '');
            console.warn('[lfSyncEnviar] ' + path + ' -> HTTP ' + resp.status + ': ' + texto);
            return { ok: false, status: resp.status, body: texto };
        }
        return { ok: true, resp };
    } catch (err) {
        // Offline: enfileira pra sincronizar depois
        console.warn('[lfSyncEnviar] ' + path + ' offline, enfileirando:', err && err.message);
        lfSyncFila.push({ path, body });
        localStorage.setItem('lfSyncFila', JSON.stringify(lfSyncFila));
        return { ok: false, reason: 'offline', queued: true };
    }
}

// PATCH no servidor (editar jogador existente). Retorna {ok, status, body}.
async function lfSyncEnviarPatch(path, body) {
    if (!lfSyncAtivo()) return { ok: false, reason: 'sync-off' };
    const url = localStorage.getItem(LF_SYNC_ENDPOINT_KEY);
    try {
        const resp = await fetch(url + path, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
        if (!resp.ok) {
            const texto = await resp.text().catch(() => '');
            console.warn('[lfSyncEnviarPatch] ' + path + ' -> HTTP ' + resp.status + ': ' + texto);
            return { ok: false, status: resp.status, body: texto };
        }
        return { ok: true };
    } catch (err) {
        console.warn('[lfSyncEnviarPatch] ' + path + ' offline:', err && err.message);
        return { ok: false, reason: 'offline' };
    }
}

// Dois flushes ao mesmo tempo (boot + evento online) mandariam a fila em
// dobro — quem chega durante um flush espera o que já está rodando.
function lfSyncFlush() {
    if (!lfSyncFlushEmAndamento) {
        lfSyncFlushEmAndamento = lfSyncFlushExecutar()
            .finally(() => { lfSyncFlushEmAndamento = null; });
    }
    return lfSyncFlushEmAndamento;
}

async function lfSyncFlushExecutar() {
    if (!lfSyncAtivo() || lfSyncFila.length === 0) return;
    const url = localStorage.getItem(LF_SYNC_ENDPOINT_KEY);
    const restantes = [];
    for (const item of lfSyncFila) {
        try {
            await fetch(url + item.path, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(item.body)
            });
        } catch (err) {
            restantes.push(item);
        }
    }
    lfSyncFila = restantes;
    localStorage.setItem('lfSyncFila', JSON.stringify(lfSyncFila));
}

// Hidrata a artilharia acumulada do servidor ao abrir o app
async function lfSyncCarregarArtilharia() {
    if (!lfSyncAtivo()) return;
    const url = localStorage.getItem(LF_SYNC_ENDPOINT_KEY);
    try {
        const resp = await fetch(url + '/estado');
        const dados = await resp.json();
        if (!dados.ok) return;
        const local = JSON.parse(localStorage.getItem('artilhariaPelada')) || {};
        // Hidrata com a artilharia DO DIA (artilharia_hoje), não a global —
        // a vista "Geral" já é servida à parte em lfSyncArtilhariaGeral().
        for (const a of (dados.artilharia_hoje || [])) {
            const idNum = parseInt(a.id, 10);
            if (!idNum || isNaN(idNum)) continue;
            const existente = local[idNum];
            if (!existente || existente.gols < a.gols) {
                const jogador = jogadoresData.find(j => j.id === idNum);
                local[idNum] = { nome: a.nome, gols: a.gols, foto: jogador ? jogador.foto : '' };
            }
        }
        localStorage.setItem('artilhariaPelada', JSON.stringify(local));
        renderArtilharia();
    } catch (err) {
        // Offline: segue com o localStorage local, sem erro
    }
}

// Reconciliação do dia: envia ao servidor os gols que ESTE aparelho tem em
// artilhariaPelada e o servidor não tem em artilharia_hoje.
// Caso real (2026-11-07): gols marcados com o sync desligado (ou sem sinal)
// nunca subiam — o POST /gols falhava em silêncio e o botão Sync só baixava.
// Por diferença de contagem → idempotente: rodar de novo não duplica.
// Gols reconstruídos assim vão com minuto null (só a contagem é confiável).
function lfSyncEnviarGolsPendentes() {
    if (!lfSyncReconciliacaoEmAndamento) {
        lfSyncReconciliacaoEmAndamento = lfSyncEnviarGolsPendentesExecutar()
            .finally(() => { lfSyncReconciliacaoEmAndamento = null; });
    }
    return lfSyncReconciliacaoEmAndamento;
}

async function lfSyncEnviarGolsPendentesExecutar() {
    if (!lfSyncAtivo()) return { ok: false, enviados: 0, reason: 'sync-off' };
    // Gol sendo enviado agora ainda não aparece no servidor: contar a
    // diferença neste momento duplicaria ele. Fica pra próxima rodada.
    if (lfSyncGolsEmVoo > 0) return { ok: false, enviados: 0, reason: 'gol-em-voo' };
    const url = localStorage.getItem(LF_SYNC_ENDPOINT_KEY);
    let enviados = 0;
    // Foto do local ANTES de ler o servidor: um gol marcado durante o fetch
    // fica fora da foto e nunca é contado em dobro (no máximo sobe na próxima).
    const local = JSON.parse(localStorage.getItem('artilhariaPelada')) || {};
    try {
        const resp = await fetch(url + '/estado');
        const dados = await resp.json();
        if (!dados || !dados.ok) return { ok: false, enviados: 0 };

        const noServidor = {};
        for (const a of (dados.artilharia_hoje || [])) noServidor[String(a.id)] = a.gols || 0;

        let partidaId = localStorage.getItem('lfSyncPartidaId')
            || (dados.partida && dados.partida.id ? String(dados.partida.id) : null);

        for (const [id, item] of Object.entries(local)) {
            const faltam = ((item && item.gols) || 0) - (noServidor[String(id)] || 0);
            if (faltam <= 0) continue;
            // Jogador antes dos gols (FK gols.jogador_id). Server é autoridade
            // no nome: /jogadores ignora se já existe.
            await lfSyncEnviar('/jogadores', { id: String(id), nome: item.nome });
            for (let i = 0; i < faltam; i++) {
                if (!partidaId) {
                    const rp = await fetch(url + '/partidas', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
                    const dp = await rp.json();
                    if (!dp || !dp.ok) return { ok: false, enviados };
                    partidaId = String(dp.partida.id);
                    localStorage.setItem('lfSyncPartidaId', partidaId);
                }
                const rg = await fetch(url + '/gols', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ partida_id: Number(partidaId), jogador_id: String(id), time: 'time1', minuto: null })
                });
                const dg = await rg.json().catch(() => null);
                if (!rg.ok || !dg || !dg.ok) return { ok: false, enviados };
                enviados++;
                lfSyncGuardarPartidaDoServidor(dg);
                lfSyncVincularDbId(id, dg);
            }
        }
        if (enviados > 0) lfSyncInvalidarCacheGeral();
        return { ok: true, enviados };
    } catch (err) {
        // Offline: tenta de novo no próximo boot / evento online / botão Sync
        console.warn('[lfSyncEnviarGolsPendentes] falhou:', err && err.message);
        return { ok: false, enviados };
    }
}

// O servidor reencaminha o gol pra partida de HOJE quando a lfSyncPartidaId
// local é de outro dia — guarda a que ele usou pra não mandar a velha sempre.
function lfSyncGuardarPartidaDoServidor(dadosGol) {
    if (dadosGol && dadosGol.partida_id) {
        localStorage.setItem('lfSyncPartidaId', String(dadosGol.partida_id));
    }
}

// Gol reconciliado: liga o id do servidor ao primeiro item do feed da partida
// atual desse jogador que ainda não tem dbId (permite a lixeira apagar no servidor).
function lfSyncVincularDbId(jogadorId, dadosGol) {
    if (!dadosGol || !dadosGol.gol || typeof golsFeedPartida === 'undefined') return;
    const item = golsFeedPartida.find(g => String(g.id) === String(jogadorId) && (g.dbId === null || g.dbId === undefined));
    if (!item) return;
    item.dbId = dadosGol.gol.id;
    if (typeof salvarBackup === 'function') salvarBackup();
}

// Boot / volta da conexão: fila primeiro, depois a reconciliação do dia,
// por fim a hidratação (que só SOBE os totais locais).
async function lfSyncSincronizarTudo() {
    if (!lfSyncAtivo()) return;
    await lfSyncFlush();
    await lfSyncEnviarGolsPendentes();
    await lfSyncCarregarArtilharia();
}

window.addEventListener('online', lfSyncSincronizarTudo);

// === Config do sync via prompt simples (sem dependência de UI nova) ===
function lfSyncToggleConfig() {
    const atual = localStorage.getItem(LF_SYNC_ENDPOINT_KEY) || 'https://lf.felipeteodoro.dev';
    const url = prompt(
        'Sincronização de artilharia com servidor próprio.\n\n' +
        'Público (Cloudflare Tunnel): https://lf.felipeteodoro.dev\n' +
        'Local (sem internet):       http://192.168.31.221:8887\n\n' +
        'Cole a URL https:// do servidor (vazio = desligar):',
        atual
    );
    if (url === null) return; // cancelou
    const limpo = url.trim().replace(/\/+$/, '');
    if (lfSyncConfigurar(limpo)) {
        if (lfSyncAtivo()) {
            alert('Sync ativado: ' + limpo);
            // O botão Sync também SOBE os gols de hoje que não chegaram no
            // servidor (antes só baixava — gols marcados offline se perdiam).
            lfSyncFlush()
                .then(() => lfSyncEnviarGolsPendentes())
                .then((r) => {
                    if (r && r.enviados > 0) {
                        alert(r.enviados + ' gol(s) de hoje que não estavam no servidor foram enviados.');
                    } else if (r && !r.ok && r.reason !== 'gol-em-voo') {
                        alert('Não foi possível enviar os gols de hoje agora. O app tenta de novo quando a conexão voltar.');
                    }
                    return lfSyncCarregarArtilharia();
                });
        } else {
            alert('Sync desligado. O app continua 100% offline como antes.');
        }
    }
}

// Envia gol ao backend; cria a partida no servidor se ainda não existe
// feedIndex: índice no array golsFeedPartida (pra guardar o id do servidor no item)
async function lfSyncRegistrarGol(jogadorId, jogadorNome, minuto, feedIndex) {
    if (!lfSyncAtivo()) return;
    const url = localStorage.getItem(LF_SYNC_ENDPOINT_KEY);
    let partidaId = localStorage.getItem('lfSyncPartidaId');
    lfSyncGolsEmVoo++;
    try {
        if (!partidaId) {
            const resp = await fetch(url + '/partidas', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
            const dados = await resp.json();
            if (!dados.ok) return;
            partidaId = String(dados.partida.id);
            localStorage.setItem('lfSyncPartidaId', partidaId);
        }
        const respGol = await fetch(url + '/gols', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ partida_id: Number(partidaId), jogador_id: String(jogadorId), time: 'time1', minuto })
        });
        const dadosGol = await respGol.json().catch(() => null);
        lfSyncGuardarPartidaDoServidor(dadosGol);
        // Se o servidor retornou o id do gol, guarda no array local pra permitir remoção depois
        if (dadosGol && dadosGol.ok && dadosGol.gol && typeof feedIndex === 'number' && golsFeedPartida[feedIndex]) {
            golsFeedPartida[feedIndex].dbId = dadosGol.gol.id;
            // Re-salva o backup pra persistir o dbId (importante pra remoção após restart)
            if (typeof salvarBackup === 'function') salvarBackup();
        }
        // Garante que o jogador existe no servidor (id numérico do app)
        await lfSyncEnviar('/jogadores', { id: String(jogadorId), nome: jogadorNome });
    } catch (err) {
        // Offline: o gol NÃO entra na fila (a fila não sabe o dia certo dele).
        // Quem cobre é lfSyncEnviarGolsPendentes, no boot / online / botão Sync.
    } finally {
        lfSyncGolsEmVoo--;
    }
}

// DELETE /gols/:id no servidor. Retorna true se OK, false se falhou.
// Se dbId for null (gol nunca foi sincronizado), retorna true sem chamar o servidor.
async function lfSyncRemoverGol(dbId) {
    if (dbId === null || dbId === undefined) return true; // sem id -> nada a remover no servidor
    if (!lfSyncAtivo()) return true; // sem sync, remoção é só local
    const url = localStorage.getItem(LF_SYNC_ENDPOINT_KEY);
    try {
        const resp = await fetch(url + '/gols/' + dbId, { method: 'DELETE' });
        return resp.ok;
    } catch (err) {
        return false;
    }
}

// Ao abrir o app com sync ativo: esvazia a fila, sobe gols de hoje que
// faltam no servidor e puxa a artilharia do dia
lfSyncSincronizarTudo();

// ============================================================
// VISTA ARtilHARIA: HOJE vs GERAL (estado declarado antes de registrarGol)
// "Hoje" = artilhariaPelada do localStorage (reset à meia-noite, como sempre foi)
// "Geral" = acumulado do servidor (via sync) — intocável pela UI,
//           o botão Zerar continua zerando só o dia
function alternarVistaArtilharia(vista) {
    vistaArtilhariaAtual = vista;
    const btnHoje = document.getElementById('btn-artilharia-hoje');
    const btnGeral = document.getElementById('btn-artilharia-geral');
    if (btnHoje && btnGeral) {
        const ativo = 'text-xs uppercase tracking-wider px-5 py-2 font-bold bg-[var(--c-brand)] text-white';
        const inativo = 'text-xs uppercase tracking-wider px-5 py-2 font-bold bg-black/40 text-zinc-400 hover:bg-white/10';
        btnHoje.className = vista === 'hoje' ? ativo : inativo;
        btnGeral.className = vista === 'geral' ? ativo : inativo;
    }
    renderArtilharia();
}

// Busca o acumulado do servidor (cache simples pra não bater a API a cada render)
// R-2026-10-20: hidrata posicao e foto do servidor no jogadoresData local.
// NAO sobrescreve `presente` (state local da UI) - so campos autoritativos do servidor.
// Idempotente: pode ser chamado varias vezes no boot.
// So roda se o servidor retornou dados validos.
async function lfSyncHidratarJogadores() {
    if (!lfSyncAtivo()) return;
    const url = localStorage.getItem(LF_SYNC_ENDPOINT_KEY);
    const resp = await fetch(url + '/estado');
    const dados = await resp.json();
    if (!dados.ok || !Array.isArray(dados.jogadores)) return;
    let atualizou = false;
    for (const srv of dados.jogadores) {
        const idNum = parseInt(srv.id, 10);
        if (!Number.isFinite(idNum)) continue;
        const local = jogadoresData.find(j => j.id === idNum);
        if (!local) continue;
        if (local.posicao !== srv.posicao) { local.posicao = srv.posicao; atualizou = true; }
        if (srv.foto) {
            const basename = srv.foto.split('/').pop();
            const localBasename = (local.foto || '').split('/').pop();
            if (basename !== localBasename) { local.foto = 'fotos/' + basename; atualizou = true; }
        }
    }
    return atualizou;
}

async function lfSyncArtilhariaGeral() {
    if (!lfSyncAtivo()) return null;
    if (artilhariaGeralCache) return artilhariaGeralCache;
    const url = localStorage.getItem(LF_SYNC_ENDPOINT_KEY);
    try {
        const resp = await fetch(url + '/estado');
        const dados = await resp.json();
        if (!dados.ok) return null;
        artilhariaGeralCache = (dados.artilharia || [])
            .filter(a => a.gols > 0)
            .map(a => {
                // Foto: prioriza a.foto do servidor; fallback no jogador local
                const idNum = parseInt(a.id, 10);
                const jogador = jogadoresData.find(j => j.id === idNum);
                return {
                    nome: a.nome,
                    gols: a.gols,
                    foto: a.foto || (jogador ? jogador.foto : ''),
                    // Estatísticas históricas (só renderizadas na vista Geral)
                    partidas: a.partidas ?? null,
                    presencas: a.presencas ?? null,
                };
            });
        return artilhariaGeralCache;
    } catch (err) {
        return null;
    }
}

// Invalida o cache quando um gol novo pode ter mudado o geral
function lfSyncInvalidarCacheGeral() {
    artilhariaGeralCache = null;
    if (vistaArtilhariaAtual === 'geral') renderArtilharia();
}

// Teclado virtual (iOS/Android): o modal é fixo e alinhado embaixo, então o
// teclado cobria o campo de busca. Mede o espaço ocupado pelo teclado via
// visualViewport e expõe em --kb; os modais usam isso como padding-bottom.
(function () {
    const vv = window.visualViewport;
    const root = document.documentElement;

    function atualizarTeclado() {
        if (!vv) return;
        const kb = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
        root.style.setProperty('--kb', kb + 'px');
    }

    if (vv) {
        vv.addEventListener('resize', atualizarTeclado);
        vv.addEventListener('scroll', atualizarTeclado);
    }

    document.addEventListener('focusin', function (e) {
        const el = e.target;
        if (!el || !el.matches || !el.matches('input[type="text"], input:not([type]), textarea')) return;
        setTimeout(function () {
            el.scrollIntoView({ block: 'center', behavior: 'smooth' });
        }, 300);
    });

    document.addEventListener('focusout', function () {
        setTimeout(function () {
            if (!document.activeElement || document.activeElement === document.body) {
                root.style.setProperty('--kb', '0px');
            }
        }, 100);
    });
})();
