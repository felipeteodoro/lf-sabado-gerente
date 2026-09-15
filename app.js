let jogadoresData = [
    { id: 1, nome: "Râneer", posicao: "linha", presente: false, foto: "fotos/raneer.jpg" },
    { id: 2, nome: "Alex Vie.", posicao: "linha", presente: false, foto: "fotos/alex_vie.jpg" },
    { id: 3, nome: "Kaique Fer.", posicao: "linha", presente: false, foto: "fotos/kaique_fer.jpg" },
    { id: 4, nome: "Eduardo Bol.", posicao: "linha", presente: false, foto: "fotos/eduardo_bol.jpg" },
    { id: 5, nome: "Michel", posicao: "goleiro", presente: false, foto: "fotos/michel.jpg" },
    { id: 6, nome: "Kaique Mar.", posicao: "linha", presente: false, foto: "fotos/kaique_mar.jpg" },
    { id: 7, nome: "Pé de Pano", posicao: "linha", presente: false, foto: "fotos/pe_de_pano.jpg" },
    { id: 8, nome: "Vitorino", posicao: "goleiro", presente: false, foto: "fotos/vitorino.jpg" },
    { id: 9, nome: "Christiano", posicao: "goleiro", presente: false, foto: "fotos/christiano.jpg" },
    { id: 10, nome: "Lucas Vas.", posicao: "linha", presente: false, foto: "fotos/lucas_vas.jpg" },
    { id: 11, nome: "Tchobba", posicao: "linha", presente: false, foto: "fotos/tchobba.jpg" },
    { id: 12, nome: "Lucas Ven.", posicao: "linha", presente: false, foto: "fotos/lucas_ven.jpg" },
    { id: 13, nome: "Solidão", posicao: "linha", presente: false, foto: "fotos/solidao.jpg" },
    { id: 14, nome: "Eliel Sch.", posicao: "linha", presente: false, foto: "fotos/eliel_sch.jpg" },
    { id: 15, nome: "Wesley", posicao: "linha", presente: false, foto: "fotos/wesley.jpg" },
    { id: 16, nome: "Jorge", posicao: "linha", presente: false, foto: "fotos/jorge.jpg" },
    { id: 17, nome: "Braz", posicao: "linha", presente: false, foto: "fotos/braz.jpg" },
    { id: 18, nome: "Tulio", posicao: "linha", presente: false, foto: "fotos/tulio.jpg" },
    { id: 19, nome: "Paulo", posicao: "linha", presente: false, foto: "fotos/paulo.jpg" },
    { id: 20, nome: "Teta", posicao: "linha", presente: false, foto: "fotos/teta.jpg" },
    { id: 21, nome: "Daniel Par.", posicao: "linha", presente: false, foto: "fotos/daniel_par.jpg" },
    { id: 22, nome: "Felipe Teo.", posicao: "linha", presente: false, foto: "fotos/felipe_teo.jpg" },
    { id: 23, nome: "Anderson Ant.", posicao: "linha", presente: false, foto: "fotos/anderson_ant.jpg" },
    { id: 24, nome: "Caio Doidin", posicao: "linha", presente: false, foto: "fotos/caio_doidin.jpg" },
    { id: 25, nome: "Daniel Con.", posicao: "linha", presente: false, foto: "fotos/daniel_con.jpg" },
    { id: 26, nome: "Eduardo Fer.", posicao: "linha", presente: false, foto: "fotos/eduardo_fer.jpg" },
    { id: 27, nome: "Eduardo Bor.", posicao: "linha", presente: false, foto: "fotos/eduardo_bor.jpg" },
    { id: 28, nome: "Felipe Fre.", posicao: "linha", presente: false, foto: "fotos/felipe_fre.jpg" },
    { id: 29, nome: "Felipe Sha.", posicao: "linha", presente: false, foto: "fotos/felipe_sha.jpg" },
    { id: 30, nome: "Gabriel Nag.", posicao: "linha", presente: false, foto: "fotos/gabriel_nag.jpg" },
    { id: 31, nome: "Guilherme Fra.", posicao: "linha", presente: false, foto: "fotos/guilherme_fra.jpg" },
    { id: 32, nome: "Guilherme Pir.", posicao: "linha", presente: false, foto: "fotos/guilherme_pir.jpg" },
    { id: 33, nome: "Mike", posicao: "linha", presente: false, foto: "fotos/mike.jpg" },
    { id: 34, nome: "Wilker Pim", posicao: "linha", presente: false, foto: "fotos/wilker_pim.jpg" },
    { id: 35, nome: "Willian", posicao: "linha", presente: false, foto: "fotos/willian.jpg" },
    { id: 36, nome: "Zaqueu", posicao: "linha", presente: false, foto: "fotos/zaqueu.jpg" },
    { id: 37, nome: "Robson", posicao: "goleiro", presente: false, foto: "fotos/robson.jpg" },
    { id: 38, nome: "Rubens", posicao: "goleiro", presente: false, foto: "fotos/rubens.jpg" },
    { id: 39, nome: "Erick", posicao: "linha", presente: false, foto: "fotos/erick.jpg" },
    { id: 40, nome: "Fernando", posicao: "linha", presente: false, foto: "fotos/fernando.jpg" },
    { id: 41, nome: "Fábio", posicao: "linha", presente: false, foto: "fotos/fabio.jpg" },
    { id: 42, nome: "Vitor Hug.", posicao: "linha", presente: false, foto: "fotos/vitor_hug.jpg" },
    { id: 43, nome: "Mattheus", posicao: "linha", presente: false, foto: "fotos/mattheus.jpg" },
    { id: 44, nome: "Wesley Teo.", posicao: "linha", presente: false, foto: "fotos/wesley_teo.jpg" },
    { id: 45, nome: "Miné", posicao: "linha", presente: false, foto: "fotos/mine.jpg" }
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

function getAvatarUrl(nome) {
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(nome)}&background=141416&color=8ba360&bold=true`;
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
    if (backup) {
        const dados = JSON.parse(backup);
        jogadoresData = dados.jogadoresData || jogadoresData;
        timesSorteadosGlobal = dados.timesSorteadosGlobal || [];
        tempoRestante = dados.tempoRestante !== undefined ? dados.tempoRestante : TEMPO_TOTAL;
        golsPartidaAtual = dados.golsPartidaAtual || 0;
        golsJogadorPartida = dados.golsJogadorPartida || {};
        golsFeedPartida = dados.golsFeedPartida || [];
        renderGolsPartida();
        
        if (timesSorteadosGlobal.length > 0) {
            document.getElementById('btn-sortear')?.classList.add('hidden');
            document.getElementById('lista-jogadores-section')?.classList.add('hidden');
            document.getElementById('resultado-section')?.classList.remove('hidden');
            renderTimes(timesSorteadosGlobal);
        }
        
        cronometroRodando = false; 
        const btnCronometro = document.getElementById('btn-cronometro');
        if (btnCronometro) {
            btnCronometro.innerHTML = '<i class="fa-solid fa-play mr-2 text-2xl opacity-80"></i> Retomar';
            btnCronometro.className = 'w-full max-w-[320px] bg-amber-600/80 backdrop-blur-sm text-white border border-amber-500/50 py-3.5 rounded-lg font-teko text-3xl uppercase tracking-wider active:scale-95 transition-all flex justify-center items-center shadow-lg';
            if(tempoRestante === TEMPO_TOTAL) {
                btnCronometro.innerHTML = '<i class="fa-solid fa-play mr-3 text-2xl opacity-80"></i> Iniciar';
                btnCronometro.className = 'w-full max-w-[320px] btn-primary py-3.5 rounded-lg font-teko text-3xl uppercase tracking-wider active:scale-95 transition-all flex justify-center items-center shadow-lg';
            }
        }
    }

    const totalJogadores = document.getElementById('total-jogadores');
    if(totalJogadores) totalJogadores.innerText = jogadoresData.length;
    
    renderLista();
    atualizarContador();
    atualizarDisplayCronometro();
    renderArtilharia();
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
    document.getElementById('tab-sorteio')?.classList.add('hidden');
    document.getElementById('tab-partida')?.classList.add('hidden');
    document.getElementById('tab-artilharia')?.classList.add('hidden');
    
    document.querySelectorAll('nav button').forEach(btn => {
        btn.classList.remove('text-brand');
        btn.classList.add('text-zinc-500');
    });

    document.getElementById(`tab-${aba}`)?.classList.remove('hidden');
    document.getElementById(`nav-${aba}`)?.classList.remove('text-zinc-500');
    document.getElementById(`nav-${aba}`)?.classList.add('text-brand');

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
            <img src="${jogador.foto}" onerror="this.onerror=null; this.src=getAvatarUrl('${jogador.nome}')" alt="${jogador.nome}" class="w-10 h-10 object-cover rounded-md mr-3 border border-white/10 bg-black/50">
            <div class="flex flex-col flex-1 overflow-hidden">
                <span class="font-bold text-sm leading-tight truncate text-white">${jogador.nome}</span>
                <span class="position-badge border px-1.5 py-[1px] rounded mt-1 w-max ${badgeColor}">${badgeText}</span>
            </div>
            <div class="ml-2 shrink-0">
                <div class="w-5 h-5 rounded border flex items-center justify-center transition-colors ${jogador.presente ? 'border-[var(--c-brand-light)] bg-[var(--c-brand)]' : 'border-white/10 bg-black/40'}">
                    ${jogador.presente ? '<i class="fa-solid fa-check text-white drop-shadow-md text-xs"></i>' : ''}
                </div>
            </div>
        `;
        container.appendChild(card);
    });
}

function togglePresenca(id) {
    const jogador = jogadoresData.find(j => j.id === id);
    if (jogador) {
        const estavaPresente = jogador.presente;
        jogador.presente = !jogador.presente;
        
        if (timesSorteadosGlobal.length > 0) {
            if (!estavaPresente && jogador.presente) {
                alocarJogadorAtrasado(jogador);
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

function adicionarPlayer() {
    let nomeInput = prompt("Digite o nome do jogador convidado:\n(Ou deixe em branco para ser automático)");
    if (nomeInput === null) return;

    let nomeFinal = nomeInput.trim();
    if (nomeFinal === "") {
        const qtdPlayers = jogadoresData.filter(j => j.nome.startsWith('Player')).length;
        nomeFinal = `Player ${qtdPlayers + 1}`;
    }
    
    const ehLinha = confirm(`O ${nomeFinal} é Jogador de Linha ou Goleiro?\n\n✅ Clique em [OK] se for LINHA.\n❌ Clique em [Cancelar] se for GOLEIRO.`);
    const posicaoFinal = ehLinha ? "linha" : "goleiro";
    
    const novoId = Math.max(0, ...jogadoresData.map(j => j.id)) + 1;

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

    document.getElementById('btn-sortear')?.classList.add('hidden');
    document.getElementById('lista-jogadores-section')?.classList.add('hidden');
    document.getElementById('resultado-section')?.classList.add('hidden');
    document.getElementById('loading-sorteio')?.classList.remove('hidden');

    setTimeout(() => {
        document.getElementById('loading-sorteio')?.classList.add('hidden');
        document.getElementById('resultado-section')?.classList.remove('hidden');
        document.getElementById('lista-jogadores-section')?.classList.remove('hidden');
        
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
                    <img src="${j.foto}" onerror="this.onerror=null; this.src=getAvatarUrl('${j.nome}')" class="w-8 h-8 object-cover rounded-md border border-white/10 bg-black/50 shrink-0 shadow-md">
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
        document.getElementById('resultado-section')?.classList.add('hidden');
        document.getElementById('btn-sortear')?.classList.remove('hidden');
        document.getElementById('lista-jogadores-section')?.classList.remove('hidden');
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
                <img src="${j.foto}" onerror="this.onerror=null; this.src=getAvatarUrl('${j.nome}')" class="w-8 h-8 object-cover rounded-md bg-black/80 border border-white/10">
                ${j.nome}
            `;
            btn.onclick = () => efetivarSubSorteio(j.id);
            lista.appendChild(btn);
        });
    }

    document.getElementById('modal-sub-sorteio')?.classList.remove('hidden');
    document.getElementById('modal-sub-sorteio')?.classList.add('flex');
}

function efetivarSubSorteio(jogadorEntrandoId) {
    const timeAlvo = timesSorteadosGlobal[modalSorteioTimeIndex];
    const jogadorEntrando = jogadoresData.find(j => j.id === jogadorEntrandoId);

    let timeDoEntrando = null;
    let indexNoTimeDoEntrando = -1;

    timesSorteadosGlobal.forEach(t => {
        const idx = t.jogadores.findIndex(j => j.id === jogadorEntrandoId);
        if (idx !== -1) {
            timeDoEntrando = t;
            indexNoTimeDoEntrando = idx;
        }
    });

    if (modalSorteioJogadorSaindoId !== null) {
        const indexSaindo = timeAlvo.jogadores.findIndex(j => j.id === modalSorteioJogadorSaindoId);
        const jogadorSaindo = timeAlvo.jogadores[indexSaindo];

        timeAlvo.jogadores[indexSaindo] = jogadorEntrando;

        if (timeDoEntrando !== null) {
            timeDoEntrando.jogadores[indexNoTimeDoEntrando] = jogadorSaindo;
        }
    } else {
        timeAlvo.jogadores.push(jogadorEntrando);
        if (timeDoEntrando !== null) {
            timeDoEntrando.jogadores.splice(indexNoTimeDoEntrando, 1);
        }
    }

    fecharModalSubSorteio();
    renomearTimesSequencialmente();
    renderTimes(timesSorteadosGlobal);
    salvarBackup();
}

function fecharModalSubSorteio() {
    document.getElementById('modal-sub-sorteio')?.classList.add('hidden');
    document.getElementById('modal-sub-sorteio')?.classList.remove('flex');
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

    [...golsFeedPartida].reverse().forEach(gol => {
        const item = document.createElement('div');
        item.className = 'flex items-center gap-3 bg-black/40 border border-white/5 rounded p-2.5';
        item.innerHTML = `
            <img src="${gol.foto}" onerror="this.onerror=null; this.src=getAvatarUrl('${gol.nome}')" class="w-9 h-9 object-cover rounded-md bg-black/80 border border-white/10 shrink-0">
            <span class="font-bold text-white truncate flex-grow">${gol.nome}</span>
            <span class="led-text text-brand text-lg tabular-nums shrink-0">${gol.minuto}'</span>
        `;
        feed.appendChild(item);
    });
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
    document.getElementById('modal-gol')?.classList.remove('hidden');
    document.getElementById('modal-gol')?.classList.add('flex');
    
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
            <img src="${j.foto}" onerror="this.onerror=null; this.src=getAvatarUrl('${j.nome}')" class="w-8 h-8 object-cover rounded-md bg-black/80 border border-white/10">
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
    document.getElementById('modal-gol')?.classList.add('hidden');
    document.getElementById('modal-gol')?.classList.remove('flex');
}

// Vista atual da tab Artilharia ('hoje' = localStorage | 'geral' = servidor)
let vistaArtilhariaAtual = 'hoje';
let artilhariaGeralCache = null;

function registrarGol(jogadorId, jogadorNome) {
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
    lfSyncRegistrarGol(jogadorId, jogadorNome, minutoGolAtual());
    lfSyncInvalidarCacheGeral();

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

// Render comum das duas vistas: array de {nome, gols, foto?}
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

        const div = document.createElement('div');
        div.className = "glass-panel p-4 flex items-center justify-between";
        div.innerHTML = `
            <div class="flex items-center gap-4">
                <span class="font-black text-zinc-500 w-4">${colocacao}º</span>
                <img src="${jogador.foto}" onerror="this.onerror=null; this.src=getAvatarUrl('${jogador.nome}')" class="w-12 h-12 object-cover rounded-md border border-white/10 bg-black/50 shadow-md">
                <span class="font-bold text-white text-lg">${jogador.nome}</span>
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
    let texto = "⚽ *SORTEIO DOS TIMES* ⚽\n\n";
    timesSorteadosGlobal.forEach(time => {
        texto += `*${time.nome.toUpperCase()}*\n`;
        time.jogadores.forEach(j => {
            const pos = j.posicao === 'goleiro' ? '🧤' : '🏃';
            texto += `${pos} ${j.nome}\n`;
        });
        texto += "\n";
    });
    navigator.clipboard.writeText(texto.trim()).then(() => {
        alert("Escalação copiada! Agora é só colar no grupo do WhatsApp.");
    }).catch(err => {
        console.error("Erro ao copiar: ", err);
        alert("Não foi possível copiar automaticamente.");
    });
}

function copiarArtilharia() {
    let artilharia = JSON.parse(localStorage.getItem('artilhariaPelada'));
    if (!artilharia || Object.keys(artilharia).length === 0) {
        alert("Nenhum gol registrado para copiar.");
        return;
    }
    
    let arrayArtilheiros = Object.values(artilharia).sort((a, b) => b.gols - a.gols);
    let posicoes = [...new Set(arrayArtilheiros.map(j => j.gols))];

    let texto = "🏆 *RANKING DO SÁBADO* 🏆\n\n";
    
    arrayArtilheiros.forEach((jogador) => {
        let colocacao = posicoes.indexOf(jogador.gols) + 1;
        let medalhaEmoji = '';
        
        if (colocacao === 1) medalhaEmoji = '🥇';
        else if (colocacao === 2) medalhaEmoji = '🥈';
        else if (colocacao === 3) medalhaEmoji = '🥉';
        else medalhaEmoji = '⚽';

        texto += `${medalhaEmoji} ${jogador.nome} - ${jogador.gols} gol(s)\n`;
    });

    navigator.clipboard.writeText(texto.trim()).then(() => {
        alert("Artilharia copiada! Agora é só colar no grupo do WhatsApp.");
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
// SINCRONIZAÇÃO OPCIONAL COM BACKEND (LF Gerente API)
// Liga/desliga nas Configurações do app. Desligado por padrão —
// sem endpoint configurado, o app funciona 100% como antes.
// localStorage continua sendo a fonte da verdade offline.
// ============================================================
const LF_SYNC_ENDPOINT_KEY = 'lfSyncEndpoint';
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
    if (!lfSyncAtivo()) return;
    const url = localStorage.getItem(LF_SYNC_ENDPOINT_KEY);
    try {
        await fetch(url + path, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
    } catch (err) {
        // Offline: enfileira pra sincronizar depois
        lfSyncFila.push({ path, body });
        localStorage.setItem('lfSyncFila', JSON.stringify(lfSyncFila));
    }
}

async function lfSyncFlush() {
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

window.addEventListener('online', lfSyncFlush);

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
            lfSyncCarregarArtilharia();
        } else {
            alert('Sync desligado. O app continua 100% offline como antes.');
        }
    }
}

// Envia gol ao backend; cria a partida no servidor se ainda não existe
async function lfSyncRegistrarGol(jogadorId, jogadorNome, minuto) {
    if (!lfSyncAtivo()) return;
    const url = localStorage.getItem(LF_SYNC_ENDPOINT_KEY);
    let partidaId = localStorage.getItem('lfSyncPartidaId');
    try {
        if (!partidaId) {
            const resp = await fetch(url + '/partidas', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
            const dados = await resp.json();
            if (!dados.ok) return;
            partidaId = String(dados.partida.id);
            localStorage.setItem('lfSyncPartidaId', partidaId);
        }
        await lfSyncEnviar('/gols', { partida_id: Number(partidaId), jogador_id: String(jogadorId), time: 'time1', minuto });
        // Garante que o jogador existe no servidor (id numérico do app)
        await lfSyncEnviar('/jogadores', { id: String(jogadorId), nome: jogadorNome });
    } catch (err) {
        // Offline: a fila do lfSyncEnviar cobre; criação de partida tenta de novo no próximo gol
    }
}

// Ao abrir o app com sync ativo, puxa a artilharia acumulada do servidor
lfSyncCarregarArtilharia();

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
                return { nome: a.nome, gols: a.gols, foto: a.foto || (jogador ? jogador.foto : '') };
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
