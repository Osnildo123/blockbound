import { SaveSystem } from './core/SaveSystem.js';
import { MinecraftEngine } from './Engine.js';
import { lobbyManager } from './core/LobbyManager.js';

// 🛑 BLOQUEIA O MENU DO BOTÃO DIREITO DO NAVEGADOR EM TODA A PÁGINA 🛑
document.addEventListener('contextmenu', event => event.preventDefault());

export const AppState = {
    activeProfile: null,
    activeWorld: null
};

// Injeção de Estilos no Estilo Minecraft Clássico
function injectMinecraftStyles() {
    if (document.getElementById('mc-menu-styles')) return;

    const style = document.createElement('style');
    style.id = 'mc-menu-styles';
    style.innerHTML = `
        @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');

        /* Fonte Pixelizada Global */
        #start-screen, #public-servers-screen, #dialog-modal, #pause-menu {
            font-family: 'Press Start 2P', monospace !important;
            user-select: none;
        }

        /* Fundo do Menu Inicial com Padrão de Terra */
        #start-screen {
            background-color: #4d2e1e !important;
            background-image: 
                linear-gradient(45deg, #3b2216 25%, transparent 25%), 
                linear-gradient(-45deg, #3b2216 25%, transparent 25%),
                linear-gradient(45deg, transparent 75%, #3b2216 75%),
                linear-gradient(-45deg, transparent 75%, #3b2216 75%) !important;
            background-size: 16px 16px !important;
            background-position: 0 0, 0 8px, 8px -8px, -8px 0px !important;
            z-index: 100 !important;
        }

        /* Modais e Janelas de Diálogo em Camadas Superiores */
        #public-servers-screen {
            z-index: 1500 !important;
        }

        #dialog-modal {
            z-index: 2000 !important;
            background: rgba(0, 0, 0, 0.75) !important;
        }

        /* Overlay do Menu ESC */
        #pause-menu {
            background: rgba(0, 0, 0, 0.75) !important;
            justify-content: center !important;
            align-items: center !important;
            z-index: 1500 !important;
        }

        /* Painéis de Pausa e Definições */
        #pause-main-box, #pause-settings-box {
            background: rgba(30, 30, 30, 0.95) !important;
            border: 4px solid #555 !important;
            outline: 4px solid #000 !important;
            padding: 25px !important;
            box-shadow: 0 0 25px rgba(0, 0, 0, 0.9) !important;
            color: #fff !important;
            border-radius: 0px !important;
        }

        /* Títulos do Menu ESC */
        #pause-menu h2, #pause-menu h3 {
            font-size: 18px !important;
            color: #ddd !important;
            text-align: center !important;
            text-shadow: 3px 3px 0px #000, -1px -1px 0px #222 !important;
            letter-spacing: 1px !important;
            margin-bottom: 15px !important;
        }

        /* Botões de Pedra 3D */
        #start-screen button, 
        #public-servers-screen button, 
        #dialog-modal button,
        #pause-menu button,
        .server-item button,
        .btn-small {
            font-family: 'Press Start 2P', monospace !important;
            font-size: 10px !important;
            background: linear-gradient(to bottom, #999 0%, #666 100%) !important;
            border: 3px solid !important;
            border-color: #fff #333 #333 #fff !important;
            color: #e0e0e0 !important;
            text-shadow: 2px 2px 0px #000 !important;
            padding: 10px 12px !important;
            cursor: pointer !important;
            box-shadow: inset -2px -2px 0px #222, inset 2px 2px 0px #bbb !important;
            border-radius: 0px !important;
            transition: none !important;
        }

        /* Efeito Hover Azul nos Botões */
        #start-screen button:hover, 
        #public-servers-screen button:hover, 
        #dialog-modal button:hover,
        #pause-menu button:hover,
        .server-item button:hover,
        .btn-small:hover {
            background: linear-gradient(to bottom, #6c88b5 0%, #405885 100%) !important;
            border-color: #a0c0f0 #203050 #203050 #a0c0f0 !important;
            color: #ffffa0 !important;
        }

        /* Efeito de Pressionar o Botão */
        #start-screen button:active, 
        #public-servers-screen button:active, 
        #dialog-modal button:active,
        #pause-menu button:active {
            border-color: #333 #fff #fff #333 !important;
            background: #444 !important;
            box-shadow: none !important;
        }

        /* Sliders de Configuração */
        #pause-menu input[type="range"] {
            accent-color: #55aa55 !important;
            cursor: pointer !important;
        }

        /* Rótulos e Texto */
        #pause-menu label, #pause-menu span {
            font-size: 9px !important;
            color: #aaa !important;
            text-shadow: 1px 1px 0px #000 !important;
        }

        /* Dropdowns e Campos de Texto */
        #profile-select, #dialog-input {
            font-family: 'Press Start 2P', monospace !important;
            font-size: 10px !important;
            background: #000 !important;
            border: 2px solid #a0a0a0 !important;
            color: #fff !important;
            padding: 8px !important;
            outline: none !important;
            border-radius: 0px !important;
        }

        /* Títulos do Menu Inicial */
        #start-screen h1 {
            font-size: 32px !important;
            color: #ddd !important;
            text-shadow: 4px 4px 0px #000, -2px -2px 0px #222 !important;
            letter-spacing: 2px !important;
            margin-bottom: 5px !important;
        }

        #start-screen p {
            font-size: 10px !important;
            color: #ffff55 !important;
            text-shadow: 2px 2px 0px #333 !important;
            transform: rotate(-2deg) !important;
            margin-bottom: 20px !important;
        }

        /* Card dos Mundos Guardados */
        .world-card {
            border-radius: 0px !important;
            border: 2px solid #555 !important;
            font-family: 'Press Start 2P', monospace !important;
        }

        .world-card.active {
            border-color: #ffff55 !important;
            background: #4a5568 !important;
        }
    `;
    document.head.appendChild(style);
}

// Helper Profissional de Diálogo (Substitui prompt / alert)
export function showDialog({ title, message, showInput = false, defaultValue = '', onOk, onCancel }) {
    const modal = document.getElementById('dialog-modal');
    const titleEl = document.getElementById('dialog-title');
    const msgEl = document.getElementById('dialog-message');
    const inputEl = document.getElementById('dialog-input');
    const btnOk = document.getElementById('dialog-btn-ok');
    const btnCancel = document.getElementById('dialog-btn-cancel');

    if (!modal) return;

    titleEl.innerText = title || 'MENSAGEM';
    msgEl.innerText = message || '';
    inputEl.style.display = showInput ? 'block' : 'none';
    inputEl.value = defaultValue;
    btnCancel.style.display = onCancel ? 'block' : 'none';

    modal.style.display = 'flex';
    if (showInput) inputEl.focus();

    btnOk.onclick = () => {
        modal.style.display = 'none';
        if (onOk) onOk(showInput ? inputEl.value.trim() : true);
    };

    btnCancel.onclick = () => {
        modal.style.display = 'none';
        if (onCancel) onCancel();
    };
}

export function renderStartScreen() {
    injectMinecraftStyles();
    renderProfiles();
    renderWorlds();
}

function renderProfiles() {
    const select = document.getElementById('profile-select');
    if (!select) return;
    select.innerHTML = '';

    let profiles = SaveSystem.getProfiles();

    if (profiles.length === 0) {
        const defaultProf = SaveSystem.createProfile('Sobrevivente');
        AppState.activeProfile = defaultProf;
        profiles = [defaultProf];
    } else if (!AppState.activeProfile) {
        AppState.activeProfile = profiles[0];
    }

    profiles.forEach(p => {
        const opt = document.createElement('option');
        opt.value = p.id;
        opt.innerText = p.name;
        if (AppState.activeProfile && AppState.activeProfile.id === p.id) {
            opt.selected = true;
        }
        select.appendChild(opt);
    });

    select.onchange = (e) => {
        const pid = e.target.value;
        AppState.activeProfile = profiles.find(p => p.id === pid);
        AppState.activeWorld = null;
        renderWorlds();
    };
}

function renderWorlds() {
    const container = document.getElementById('world-list');
    if (!container) return;
    container.innerHTML = '';

    if (!AppState.activeProfile) {
        container.innerHTML = '<div style="padding:10px; color:#aaa; font-size:10px;">Crie um perfil primeiro.</div>';
        return;
    }

    const worlds = SaveSystem.getWorlds(AppState.activeProfile.id);
    if (worlds.length === 0) {
        container.innerHTML = '<div style="padding:10px; color:#aaa; font-size:9px; text-align:center;">Nenhum mundo guardado neste perfil.</div>';
        AppState.activeWorld = null;
        return;
    }

    if (!AppState.activeWorld || !worlds.find(w => w.id === AppState.activeWorld.id)) {
        AppState.activeWorld = worlds[0];
    }

    worlds.forEach(w => {
        const isSelected = AppState.activeWorld && AppState.activeWorld.id === w.id;
        const card = document.createElement('div');
        card.className = `world-card ${isSelected ? 'active' : ''}`;
        card.style.cssText = `
            display: flex; justify-content: space-between; align-items: center;
            background: ${isSelected ? '#333' : '#1a1a1a'};
            color: #fff; padding: 10px; margin-bottom: 6px; cursor: pointer;
        `;

        card.innerHTML = `
            <div>
                <div style="font-weight:bold; font-size:10px;">${w.name}</div>
                <div style="font-size:8px; color:#aaa; margin-top:4px;">Modificado: ${w.lastPlayed || 'Recentemente'}</div>
            </div>
            <button class="btn-small btn-del" style="padding:4px 8px !important; font-size:8px !important;">✕</button>
        `;

        card.onclick = (e) => {
            if (e.target.classList.contains('btn-del')) return;
            AppState.activeWorld = w;
            renderWorlds();
        };

        const delBtn = card.querySelector('.btn-del');
        delBtn.onclick = (e) => {
            e.stopPropagation();
            showDialog({
                title: 'ELIMINAR MUNDO',
                message: `Deseja realmente eliminar o mundo "${w.name}"?`,
                onCancel: () => {},
                onOk: () => {
                    SaveSystem.deleteWorld(AppState.activeProfile.id, w.id);
                    if (AppState.activeWorld && AppState.activeWorld.id === w.id) {
                        AppState.activeWorld = null;
                    }
                    renderWorlds();
                }
            });
        };

        container.appendChild(card);
    });
}

function loadPublicServers() {
    const container = document.getElementById('server-list-container');
    if (!container) return;
    container.innerHTML = '<div class="server-item-empty" style="font-size:10px;">🔍 Buscando salas ativas...</div>';

    lobbyManager.listenPublicRooms(
        (rooms) => {
            container.innerHTML = '';

            if (rooms.length === 0) {
                container.innerHTML = '<div class="server-item-empty" style="font-size:9px; color:#aaa; padding:15px; text-align:center;">Nenhuma sala pública aberta no momento. Crie uma sala para começar!</div>';
                return;
            }

            rooms.forEach(room => {
                const item = document.createElement('div');
                item.className = 'server-item';
                item.style.cssText = "display: flex; justify-content: space-between; align-items: center; background: #111; border: 2px solid #444; padding: 10px; margin-bottom: 6px;";
                item.innerHTML = `
                    <div class="server-info">
                        <span class="server-title" style="font-size:10px; color:#fff; display:block;">${room.roomName} ${room.hasPassword ? '🔒' : ''}</span>
                        <span class="server-host" style="font-size:8px; color:#aaa; margin-top:4px; display:block;">Host: ${room.hostName}</span>
                    </div>
                    <button class="btn-small" style="font-size:9px !important;">ENTRAR (${room.players}/${room.maxPlayers})</button>
                `;

                item.querySelector('button').onclick = () => {
                    window.gameEngine = new MinecraftEngine();

                    window.gameEngine.promptRoomPassword = (callback) => {
                        showDialog({
                            title: 'SENHA DA SALA',
                            message: 'Esta sala é protegida por senha:',
                            showInput: true,
                            onOk: (pass) => callback(pass),
                            onCancel: () => {
                                callback('');
                                if (window.gameEngine) window.gameEngine.destroy();
                                const startScreen = document.getElementById('start-screen');
                                if (startScreen) startScreen.style.display = 'flex';
                                const publicScreen = document.getElementById('public-servers-screen');
                                if (publicScreen) publicScreen.style.display = 'flex';
                            }
                        });
                    };

                    window.gameEngine.network.joinGame(room.peerId);
                };

                container.appendChild(item);
            });
        },
        (errMsg) => {
            container.innerHTML = `<div class="server-item-empty" style="color: #ff5555; font-size:9px;">⚠️ Erro ao conectar ao Firebase:<br><small>${errMsg}</small></div>`;
        }
    );
}

function initApp() {
    renderStartScreen();

    // 1. Novo Perfil
    const btnNewProfile = document.getElementById('btn-new-profile');
    if (btnNewProfile) {
        btnNewProfile.onclick = () => {
            showDialog({
                title: 'NOVO PERFIL',
                message: 'Introduza o seu nome de jogador:',
                showInput: true,
                defaultValue: 'Jogador',
                onOk: (name) => {
                    if (name) {
                        const prof = SaveSystem.createProfile(name);
                        AppState.activeProfile = prof;
                        AppState.activeWorld = null;
                        renderStartScreen();
                    }
                }
            });
        };
    }

    // 2. Novo Mundo
    const btnNewWorld = document.getElementById('btn-new-world');
    if (btnNewWorld) {
        btnNewWorld.onclick = () => {
            if (!AppState.activeProfile) {
                showDialog({ title: 'AVISO', message: 'Crie um perfil primeiro!' });
                return;
            }
            showDialog({
                title: 'NOVO MUNDO',
                message: 'Nome do mundo:',
                showInput: true,
                defaultValue: 'Mundo de Sobrevivência',
                onOk: (name) => {
                    if (name) {
                        const world = SaveSystem.createWorld(AppState.activeProfile.id, name);
                        AppState.activeWorld = world;
                        renderWorlds();
                    }
                }
            });
        };
    }

    // 3. Opções
    const btnOptions = document.getElementById('btn-options');
    if (btnOptions) {
        btnOptions.onclick = () => {
            showDialog({ title: 'OPÇÕES', message: 'As configurações de jogo e gráficos podem ser alteradas dentro da partida pressionando a tecla ESC.' });
        };
    }

    // 4. Criar Sala Pública (Com opção de senha opcional)
    const btnCreatePublic = document.getElementById('btn-create-public');
    if (btnCreatePublic) {
        btnCreatePublic.onclick = () => {
            if (!AppState.activeWorld) {
                showDialog({ title: 'AVISO', message: 'Crie ou selecione um mundo primeiro!' });
                return;
            }

            showDialog({
                title: 'CRIAR SALA PÚBLICA',
                message: 'Defina uma Senha (ou deixe em branco para sala aberta):',
                showInput: true,
                defaultValue: '',
                onOk: (password) => {
                    document.getElementById('start-screen').style.display = 'none';
                    window.gameEngine = new MinecraftEngine();

                    window.gameEngine.promptRoomPassword = (callback) => {
                        showDialog({
                            title: 'SENHA DA SALA',
                            message: 'Esta sala é protegida por senha:',
                            showInput: true,
                            onOk: (pass) => callback(pass),
                            onCancel: () => callback('')
                        });
                    };

                    window.gameEngine.network.hostGame(true, password);
                }
            });
        };
    }

    // 5. Ver Salas Públicas
    const btnPublicServers = document.getElementById('btn-public-servers');
    if (btnPublicServers) {
        btnPublicServers.onclick = () => {
            document.getElementById('public-servers-screen').style.display = 'flex';
            loadPublicServers();
        };
    }

    // Esconde os botões de LAN
    const btnCreatePrivate = document.getElementById('btn-create-private');
    if (btnCreatePrivate) btnCreatePrivate.style.display = 'none';

    const btnJoinPrivate = document.getElementById('btn-join-private');
    if (btnJoinPrivate) btnJoinPrivate.style.display = 'none';

    // Controles da janela modal de salas
    const btnClosePublic = document.getElementById('btn-close-public-servers');
    if (btnClosePublic) {
        btnClosePublic.onclick = () => {
            document.getElementById('public-servers-screen').style.display = 'none';
        };
    }

    const btnRefreshPublic = document.getElementById('btn-refresh-servers');
    if (btnRefreshPublic) {
        btnRefreshPublic.onclick = () => {
            loadPublicServers();
        };
    }
}

if (document.readyState === 'loading') {
    window.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}

// ==========================================
// BASE DE DADOS DO DIÁRIO DE DESENVOLVIMENTO
// ==========================================
const devLogData = [
    {
        version: "v1.1.1 - Hotfix de Sincronização de Portas",
        date: "25 de Setembro de 2026",
        changes: [
            "🎯 Correção da precisão angular para portas colocadas por clientes no modo multiplayer.",
            "📐 Implementado alinhamento magnético à grelha (0°, 90°, 180°, 270°) e ajuste do vetor de câmara.",
            "🛑 Bloqueado o reenvio em ciclo (loop) de pacotes de rotação do Hospedador para os clientes."
        ]
    },
    {
        version: "v1.1.0 - The Ocean & Doors Update",
        date: "25 de Setembro de 2026",
        changes: [
            "🚪 Sistema de portas com física real de bloqueio e colisão AABB.",
            "🔄 Orientação das portas salva na memória global para persistência em reconstruções de chunks.",
            "🌐 Sincronização 'Late-Join' do estado e rotação das portas para novos jogadores no servidor.",
            "🐢 Adicionada biodiversidade marinha: Tartarugas, Baiacus e Bacalhaus.",
            "🐟 Corrigido o bug de rotação dos peixes com interpolação angular suave.",
            "⏱️ Melhorada a IA aquática com sistema de cooldown para evitar colisões em paredes."
        ]
    },
    {
        version: "v1.0.0 - Lançamento Inicial",
        date: "Setembro de 2026",
        changes: [
            "🌍 Lançamento do sistema base de geração Voxel.",
            "🏃 Física, colisão e movimentação do jogador implementadas.",
            "🌐 Multiplayer via WebRTC (Host/Client) a funcionar com chat e sincronização.",
            "🎒 Sistema de inventário e blocos interativos."
        ]
    }
];

// ==========================================
// LÓGICA DE INTERFACE DO DEV LOG
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    const btnDevLog = document.getElementById('btn-devlog');             // Botão do Menu Inicial
    const btnCloseDevLog = document.getElementById('btn-close-devlog');   // Botão Vermelho de Voltar
    const btnCloseDevLogX = document.getElementById('btn-close-devlog-x');// O 'X' no canto da janela
    const devLogScreen = document.getElementById('devlog-screen');        // O ecrã escuro de fundo
    const devLogContent = document.getElementById('devlog-content');      // A área de texto com scroll

    if (btnDevLog && devLogScreen && devLogContent) {
        
        // ABRIR O DEV LOG
        btnDevLog.addEventListener('click', () => {
            devLogContent.innerHTML = ''; // Limpa a tela
            
            // Desenha as atualizações da base de dados
            devLogData.forEach(log => {
                const entry = document.createElement('div');
                entry.className = 'devlog-entry';
                
                let listHTML = '';
                log.changes.forEach(change => {
                    listHTML += `<li>${change}</li>`;
                });

                entry.innerHTML = `
                    <div class="devlog-version">${log.version}</div>
                    <div class="devlog-date">${log.date}</div>
                    <ul class="devlog-list">${listHTML}</ul>
                `;
                devLogContent.appendChild(entry);
            });

            // Mostra a janela com display flex para centrar
            devLogScreen.style.display = 'flex'; 
        });

        // FECHAR PELO BOTÃO VERMELHO
        if (btnCloseDevLog) {
            btnCloseDevLog.addEventListener('click', () => {
                devLogScreen.style.display = 'none';
            });
        }

        // FECHAR PELO 'X' NO CANTO DA JANELA
        if (btnCloseDevLogX) {
            btnCloseDevLogX.addEventListener('click', () => {
                devLogScreen.style.display = 'none';
            });
        }
        
        // BÓNUS: FECHAR CLICANDO FORA DA JANELA (No fundo escuro)
        devLogScreen.addEventListener('click', (e) => {
            if (e.target === devLogScreen) {
                devLogScreen.style.display = 'none';
            }
        });
    }
});