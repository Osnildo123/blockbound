// Receitas da Fornalha (Ingrediente -> Resultado)
const SMELTING_RECIPES = {
    [BLOCKS.IRON_ORE]: { result: BLOCKS.IRON_INGOT, cookTime: 8.0 },
    [BLOCKS.GOLD_ORE]: { result: BLOCKS.GOLD_ORE, cookTime: 8.0 },
    [BLOCKS.SAND]: { result: BLOCKS.GLASS, cookTime: 4.0 },
    [BLOCKS.COBBLE]: { result: BLOCKS.STONE, count: 1, cookTime: 3.5 },
    [BLOCKS.STONE]: { result: BLOCKS.STONE, count: 1, cookTime: 3.5 },
    [BLOCKS.RAW_MEAT]: { result: BLOCKS.COOKED_MEAT, cookTime: 5.0 },
    [BLOCKS.WOOD]: { result: BLOCKS.PLANK, count: 4, cookTime: 3.0 }
};

// Tempo de queima dos combustíveis (em segundos)
const FUEL_BURN_TIMES = {
    [BLOCKS.COAL_ORE]: 80.0,
    [BLOCKS.WOOD]: 15.0,
    [BLOCKS.PLANK]: 10.0,
    [BLOCKS.CRAFTING_TABLE]: 15.0,
    [BLOCKS.CHEST]: 15.0
};

const THREE = window.THREE;

function lerpAngle(a, b, t) {
    let diff = (b - a) % (Math.PI * 2);
    if (diff < -Math.PI) diff += Math.PI * 2;
    if (diff > Math.PI) diff -= Math.PI * 2;
    return a + diff * t;
}

import { BLOCKS, BLOCK_TILES, BLOCK_PARTICLE_COLORS, isTransparentBlock, ATLAS_TEXTURE, ATLAS_CANVAS, BLOCK_ICONS } from './config/constants.js';
import { SaveSystem } from './core/SaveSystem.js';
import { SoundEngine } from './core/SoundEngine.js';
import { NetworkManager } from './core/NetworkManager.js';
import { SimplexNoise } from './world/SimplexNoise.js';
import { ParticleSystem } from './world/ParticleSystem.js';
import { WeatherSystem } from './world/WeatherSystem.js';
import { FirstPersonHand } from './entities/FirstPersonHand.js';
import { VoxelMob } from './entities/VoxelMob.js';
import { VoxelFish } from './entities/VoxelFish.js';
import { ArrowProjectile } from './entities/ArrowProjectile.js';
import { AppState, renderStartScreen } from './main.js';
import { DroppedItem } from './entities/DroppedItem.js';

export class MinecraftEngine {

    // Adiciona um ponto de água na fila para ser processado
    triggerWaterFlow(x, y, z, dist = 0) {
        if (!this.waterQueue) this.waterQueue = [];
        this.waterQueue.push({ x: Math.floor(x), y: Math.floor(y), z: Math.floor(z), dist });
    }

    // Marca apenas os chunks afetados para reconstrução única
    markChunkForRebuild(x, z, set) {
        const cx = Math.floor(x / this.chunkSize);
        const cz = Math.floor(z / this.chunkSize);
        set.add(`${cx},${cz}`);

        const localX = ((x % this.chunkSize) + this.chunkSize) % this.chunkSize;
        const localZ = ((z % this.chunkSize) + this.chunkSize) % this.chunkSize;

        if (localX === 0) set.add(`${cx - 1},${cz}`);
        if (localX === 15) set.add(`${cx + 1},${cz}`);
        if (localZ === 0) set.add(`${cx},${cz - 1}`);
        if (localZ === 15) set.add(`${cx},${cz + 1}`);
    }

    // ALGORITMO DE FLUXO DE ÁGUA OTIMIZADO (SEM QUEDAS DE FPS)
    updateWaterFlow(delta) {
        if (!this.waterQueue || this.waterQueue.length === 0) return;

        this.waterFlowTimer += delta;
        if (this.waterFlowTimer < 0.08) return; // Ritmo suave
        this.waterFlowTimer = 0;

        // Limita a 10 blocos processados por tick para evitar picos de CPU/GPU
        const maxBatchSize = 10;
        const currentBatch = this.waterQueue.splice(0, maxBatchSize);

        const maxHorizontalSpread = 4;
        const chunksToRebuild = new Set(); // Evita reconstruções duplicadas

        for (let node of currentBatch) {
            const { x, y, z, dist } = node;

            if (this.getBlock(x, y, z) !== BLOCKS.WATER) continue;

            const blockBelow = this.getBlock(x, y - 1, z);

            // 1. GRAVIDADE
            if (y > 1 && blockBelow === BLOCKS.AIR) {
                this.setBlockModified(x, y - 1, z, BLOCKS.WATER);
                this.markChunkForRebuild(x, z, chunksToRebuild);

                this.waterQueue.push({ x, y: y - 1, z, dist: 0 });
                continue; 
            }

            // 2. ESPALHAMENTO HORIZONTAL
            if (dist < maxHorizontalSpread && blockBelow !== BLOCKS.AIR && blockBelow !== BLOCKS.WATER) {
                const neighbors = [
                    { x: x + 1, y, z },
                    { x: x - 1, y, z },
                    { x, y, z: z + 1 },
                    { x, y, z: z - 1 }
                ];

                for (let n of neighbors) {
                    if (this.getBlock(n.x, n.y, n.z) === BLOCKS.AIR) {
                        this.setBlockModified(n.x, n.y, n.z, BLOCKS.WATER);
                        this.markChunkForRebuild(n.x, n.z, chunksToRebuild);
                        this.waterQueue.push({ x: n.x, y: n.y, z: n.z, dist: dist + 1 });
                    }
                }
            }
        }

        // RECONSTRÓI CADA CHUNK AFETADO APENAS UMA ÚNICA VEZ
        for (let key of chunksToRebuild) {
            const [rcx, rcz] = key.split(',').map(Number);
            this.rebuildSingleChunk(rcx, rcz);
        }
    }

    generateRuinStructure(rx, ry, rz) {

        // Itens Raros dentro do Baú das Ruínas
        if (!this.chestData.has(chestKey)) {
            const loot = Array(27).fill(null);
            loot[0] = { id: BLOCKS.IRON_INGOT, count: 3 + Math.floor(Math.random() * 5) };
            loot[1] = { id: BLOCKS.ELEMENTAL_CORE, count: 1 };
            loot[2] = { id: BLOCKS.BUCKET, count: 1 }; // <-- BALDE ADICIONADO AQUI!
            if (Math.random() < 0.5) loot[3] = { id: BLOCKS.SWORD, count: 1 };
            this.chestData.set(chestKey, loot);
        }


        // Padrão de Ruína Metálica Pós-Apocalíptica (Bunker/Torre Caída 5x5)
        const ruinWidth = 5;
        const ruinHeight = 4;

        for (let x = -2; x <= 2; x++) {
            for (let z = -2; z <= 2; z++) {
                const wx = rx + x;
                const wz = rz + z;

                // Fundação e Chão de Pedra/Ferro
                this.worldData.set(`${wx},${ry},${wz}`, (Math.random() < 0.4) ? BLOCKS.IRON_ORE : BLOCKS.COBBLE);

                // Paredes em Ruínas com Aberturas
                for (let h = 1; h <= ruinHeight; h++) {
                    const blockKey = `${wx},${ry + h},${wz}`;
                    
                    // Paredes externas (com falhas procedurais)
                    if (Math.abs(x) === 2 || Math.abs(z) === 2) {
                        const wallNoise = this.getSeededRandom(wx, ry + h, wz);
                        if (wallNoise > 0.35) {
                            const mat = (wallNoise > 0.75) ? BLOCKS.IRON_ORE : ((wallNoise > 0.5) ? BLOCKS.BEDROCK : BLOCKS.COBBLE);
                            this.worldData.set(blockKey, mat);
                        } else {
                            this.worldData.set(blockKey, BLOCKS.AIR);
                        }
                    } else {
                        // Interior Oco
                        this.worldData.set(blockKey, BLOCKS.AIR);
                    }
                }
            }
        }

        // Adiciona um Baú de Espólio no Centro da Ruína
        const chestKey = `${rx},${ry + 1},${rz}`;
        this.worldData.set(chestKey, BLOCKS.CHEST);
        
        // Itens Raros dentro do Baú das Ruínas
        if (!this.chestData.has(chestKey)) {
            const loot = Array(27).fill(null);
            loot[0] = { id: BLOCKS.IRON_INGOT, count: 3 + Math.floor(Math.random() * 5) };
            loot[1] = { id: BLOCKS.ELEMENTAL_CORE, count: 1 };
            if (Math.random() < 0.5) loot[2] = { id: BLOCKS.SWORD, count: 1 };
            if (Math.random() < 0.4) loot[3] = { id: BLOCKS.GOLD_ORE, count: 4 };
            this.chestData.set(chestKey, loot);
        }

        // Iluminação Futurista Ruída (Totem no canto)
        this.worldData.set(`${rx - 1},${ry + 1},${rz - 1}`, BLOCKS.TOTEM);
        this.applyBlockLight(rx - 1, ry + 1, rz - 1, BLOCKS.TOTEM);
    }

    // ============================================================
    // MÉTODOS DE RECEITAS E COMBUSTÍVEIS DA FORNALHA
    // ============================================================

    getSmeltingRecipe(itemId) {
        if (!itemId) return null;
        const recipes = {
            [BLOCKS.IRON_ORE]: { result: BLOCKS.IRON_INGOT, cookTime: 8.0 },
            [BLOCKS.GOLD_ORE]: { result: 56, cookTime: 8.0 },
            [BLOCKS.SAND]: { result: BLOCKS.GLASS, cookTime: 4.0 },
            [BLOCKS.COBBLE]: { result: BLOCKS.STONE, count: 1, cookTime: 3.5 },
            [BLOCKS.STONE]: { result: BLOCKS.STONE, count: 1, cookTime: 3.5 },
            [BLOCKS.RAW_MEAT]: { result: BLOCKS.COOKED_MEAT, cookTime: 5.0 },
            [BLOCKS.WOOD]: { result: BLOCKS.PLANK, count: 4, cookTime: 3.0 }
        };
        return recipes[itemId] || null;
    }

    getFuelBurnTime(itemId) {
        if (!itemId) return 0;
        const fuels = {
            [BLOCKS.COAL_ORE]: 80.0,
            [BLOCKS.WOOD]: 15.0,
            [BLOCKS.PLANK]: 10.0,
            [BLOCKS.CRAFTING_TABLE]: 15.0,
            [BLOCKS.CHEST]: 15.0,
            [BLOCKS.DOOR]: 10.0
        };
        return fuels[itemId] || 0;
    }

    // ============================================================
    // LOOP PRINCIPAL DA FORNALHA
    // ============================================================

    updateFurnaces(delta) {
        if (!this.furnaceData) return;
        if (!this.placedFurnaceLights) this.placedFurnaceLights = new Map();

        for (let [key, furnace] of this.furnaceData.entries()) {
            const input = furnace.slots[0];
            const fuel = furnace.slots[1];
            const output = furnace.slots[2];

            const recipe = input ? this.getSmeltingRecipe(input.id) : null;

            // 1. Reduz o tempo de queima atual
            if (furnace.burnTime > 0) {
                furnace.burnTime -= delta;
            }

            // 2. Consome novo combustível se o fogo apagar
            if (furnace.burnTime <= 0 && recipe) {
                const burnTime = fuel ? this.getFuelBurnTime(fuel.id) : 0;
                const canOutput = !output || (output.id === recipe.result && output.count < 64);

                if (burnTime > 0 && canOutput) {
                    furnace.burnTime = burnTime;
                    furnace.maxBurnTime = burnTime;

                    fuel.count--;
                    if (fuel.count <= 0) furnace.slots[1] = null;
                }
            }

            // 3. Avança o processo de cozimento
            if (furnace.burnTime > 0 && recipe) {
                const canOutput = !output || (output.id === recipe.result && output.count < 64);

                if (canOutput) {
                    furnace.cookProgress += delta;

                    // Item finalizado
                    if (furnace.cookProgress >= recipe.cookTime) {
                        furnace.cookProgress = 0;

                        input.count--;
                        if (input.count <= 0) furnace.slots[0] = null;

                        if (!furnace.slots[2]) {
                            furnace.slots[2] = { id: recipe.result, count: recipe.count || 1 };
                        } else {
                            furnace.slots[2].count += (recipe.count || 1);
                        }
                    }
                } else {
                    furnace.cookProgress = 0;
                }

                // --- EFEITOS VISUAIS ---
                const [fx, fy, fz] = key.split(',').map(Number);

                if (!this.placedFurnaceLights.has(key)) {
                    const fLight = new THREE.PointLight(0xff6600, 2.3, 14);
                    fLight.position.set(fx + 0.5, fy + 0.5, fz + 0.5);
                    this.scene.add(fLight);
                    this.placedFurnaceLights.set(key, fLight);
                }

                if (Math.random() < 0.35 && this.particleSystem) {
                    const pColor = Math.random() < 0.5 ? 0xff4500 : 0x555555;
                    this.particleSystem.createBlockBreakParticles(fx + 0.5, fy + 0.9, fz + 0.5, pColor);
                }

            } else {
                // Arrefecimento quando apagada
                furnace.cookProgress = Math.max(0, furnace.cookProgress - delta * 2);

                if (this.placedFurnaceLights.has(key)) {
                    this.scene.remove(this.placedFurnaceLights.get(key));
                    this.placedFurnaceLights.delete(key);
                }
            }

            if (this.activeFurnaceKey === key) {
                this.updateFurnaceUI();
            }
        }
    }

    enterFullscreen() {
        const elem = document.documentElement;
        if (!document.fullscreenElement && !document.webkitFullscreenElement) {
            if (elem.requestFullscreen) {
                elem.requestFullscreen().catch(() => {});
            } else if (elem.webkitRequestFullscreen) {
                elem.webkitRequestFullscreen();
            }
        }
    }

    triggerExplosionEffects(x, y, z) {
        try {
            const ctx = new (window.AudioContext || window.AudioContext)();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(140, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(20, ctx.currentTime + 0.8);
            gain.gain.setValueAtTime(1.0, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.8);
            osc.connect(gain); gain.connect(ctx.destination);
            osc.start(); osc.stop(ctx.currentTime + 0.8);

            const bufferSize = ctx.sampleRate * 0.8;
            const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
            const noise = ctx.createBufferSource();
            noise.buffer = buffer;
            const noiseGain = ctx.createGain();
            noiseGain.gain.setValueAtTime(0.8, ctx.currentTime);
            noiseGain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.8);
            noise.connect(noiseGain); noiseGain.connect(ctx.destination);
            noise.start();
        } catch(e) {}

        if (this.particleSystem) {
            for (let i = 0; i < 14; i++) {
                this.particleSystem.createBlockBreakParticles(
                    x + (Math.random() - 0.5) * 2,
                    y + 0.5 + (Math.random() - 0.5) * 2,
                    z + (Math.random() - 0.5) * 2,
                    Math.random() < 0.5 ? 0xff4500 : 0x555555
                );
            }
        }
    }

    getSeededRandom(x, y, z) {
        let seed = this.activeWorld ? this.activeWorld.seed : 12345;
        let val = Math.sin(x * 12.9898 + y * 4.1414 + z * 78.233 + seed * 13.5453) * 43758.5453;
        return Math.abs(val - Math.floor(val));
    }

    loadHostWorld(seed, modifiedBlocks) {
        console.log("🌎 A recalcular terreno e biomas com a Seed do Host:", seed);
        if (this.activeWorld) {
            this.activeWorld.seed = seed;
        }

        this.noise = new SimplexNoise(seed);

        for (let [key, group] of this.chunks.entries()) {
            this.scene.remove(group);
            group.traverse((child) => {
                if (child.geometry) child.geometry.dispose();
            });
        }
        this.chunks.clear();
        this.populatedChunks.clear();
        this.worldData.clear();

        if (this.mobs) {
            this.mobs.forEach(mob => {
                if (mob.mesh) this.scene.remove(mob.mesh);
            });
        }
        this.mobs = [];

        if (this.fishes) {
            this.fishes.forEach(fish => {
                if (fish.mesh) this.scene.remove(fish.mesh);
            });
        }
        this.fishes = [];

        if (modifiedBlocks && Array.isArray(modifiedBlocks)) {
            modifiedBlocks.forEach(([key, value]) => {
                this.worldData.set(key, value);
                this.modifiedBlocks.set(key, value);
            });
        }

        this.updateChunks();
        this.initClouds(seed);
        this.spawnFishes(seed);

        const highestY = this.getHighestBlockY(this.position.x, this.position.z);
        this.position.y = highestY + 4.0;
        this.velocity.set(0, 0, 0);
        this.camera.position.copy(this.position);
    }

    constructor() {
        this.isRunning = true;
        this.isPaused = false;
        this.activeProfile = AppState.activeProfile;
        this.activeWorld = AppState.activeWorld;

        // Sistema de simulação de fluidos
        this.waterQueue = []; 
        this.waterFlowTimer = 0;

        this.settings = SaveSystem.getSettings();

        this.noise = new SimplexNoise(this.activeWorld ? this.activeWorld.seed : Math.random());
        this.sound = new SoundEngine();
        this.chunkSize = 16;
        this.renderDistance = this.settings.renderDistance || 5;
        this.chunks = new Map();
        this.worldData = new Map();
        this.modifiedBlocks = new Map();
        this.chestData = new Map();
        this.doorMeshes = new Map();
        this.populatedChunks = new Set();
        this.placedTorchLights = new Map();
        this.placedTotemLights = new Map();

        this.mobs = [];
        this.fishes = [];
        this.arrows = [];
        this.remotePlayers = new Map();
        this.droppedItems = [];

        this.network = new NetworkManager(this);

        this.stepCooldown = 0;
        this.raycastCooldown = 0;
        this.autoSaveTimer = 15.0;
        this.netSendTimer = 0;
        this.worldSyncTimer = 0;
        this.cachedTarget = null;
        this.dayTime = this.activeWorld ? (this.activeWorld.dayTime || 0.25) : 0.25;
        this.nightSpawnTimer = 0;
        this.activeChestKey = null;

        this.seasonIndex = 0;
        this.seasons = ['Primavera', 'Verão', 'Outono', 'Inverno'];
        this.currentWeather = 'Limpo';
        this.weatherTimer = 0;

        this.miningTimer = 0;
        this.miningCooldown = 0;
        this.currentMiningKey = null;

        this.crafting3x3Slots = Array(9).fill(null);
        this.craft3x3Result = null;

        this.lastWPressTime = 0;
        this.isSprinting = false;

        this.breathTimer = 10.0;

        this.hp = this.activeWorld ? (this.activeWorld.hp || 100) : 100;
        this.hunger = this.activeWorld ? (this.activeWorld.hunger || 100) : 100;

        this.furnaceData = new Map(); // Guarda o estado (combustível, item, tempo) de cada fornalha no mundo
        this.activeFurnaceKey = null;

        if (this.activeWorld && this.activeWorld.hotbar) {
            this.hotbarSlots = this.activeWorld.hotbar;
            this.inventorySlots = this.activeWorld.inventory;
        } else {
            this.hotbarSlots = [
                { id: BLOCKS.SWORD, count: 1 },
                { id: BLOCKS.AXE, count: 1 },
                { id: BLOCKS.PICKAXE, count: 1 },
                { id: BLOCKS.BOW, count: 1 },
                { id: BLOCKS.FLINT_STEEL, count: 1 },
                { id: BLOCKS.CHEST, count: 4 },
                { id: BLOCKS.DOOR, count: 4 },
                { id: BLOCKS.GLASS, count: 16 },
                { id: BLOCKS.COOKED_MEAT, count: 5 }
            ];
            this.inventorySlots = Array(27).fill(null);
        }

        this.craftingSlots = [null, null, null, null];
        this.selectedSlot = 0;
        this.draggedSlot = null;

        this.initGraphics();
        this.initClouds();
        this.particleSystem = new ParticleSystem(this.scene);
        this.weatherSystem = new WeatherSystem(this.scene);
        this.initPhysics();
        this.initInputs();
        this.initUI();

        this.playerHand = new FirstPersonHand(this.camera);

        if (this.activeWorld && this.activeWorld.modifiedBlocks) {
            for (let entry of this.activeWorld.modifiedBlocks) {
                this.modifiedBlocks.set(entry[0], entry[1]);
                this.worldData.set(entry[0], entry[1]);
                const [bx, by, bz] = entry[0].split(',').map(Number);
                this.applyBlockLight(bx, by, bz, entry[1]);
            }
        }

        if (this.activeWorld && this.activeWorld.chests) {
            for (let entry of this.activeWorld.chests) {
                this.chestData.set(entry[0], entry[1]);
            }
        }

        if (this.activeWorld && this.activeWorld.playerPos) {
            this.position.copy(this.activeWorld.playerPos);
            this.camera.position.copy(this.position);
        } else {
            this.findSafeSpawn();
        }

        if (!this.network.netConn) {
            this.spawnInitialMobs();
        }
        this.spawnFishes();

        for (let [key, type] of this.worldData.entries()) {
            if (type === BLOCKS.DOOR) {
                const [dx, dy, dz] = key.split(',').map(Number);
                this.createDoorMesh(dx, dy, dz);
            }
        }

        this.enterFullscreen();
        this.animate(performance.now());
    }

    takePlayerDamage(damage, sourceName = "Ataque", knockbackDir = null) {
        const agora = performance.now();

        if (this.lastDamageTime && (agora - this.lastDamageTime < 1000)) {
            return;
        }
        this.lastDamageTime = agora;

        const isDrowning = sourceName.toLowerCase().includes('afogamento') || sourceName.toLowerCase().includes('água');
        const finalDamage = isDrowning ? Math.max(damage, 15) : damage;

        this.hp = Math.max(0, this.hp - finalDamage);
        if (this.sound) this.sound.playBreak();
        if (typeof this.triggerDamageFlash === 'function') this.triggerDamageFlash();
        this.notify(`💥 Dano de ${sourceName}! -${finalDamage} HP`);

        if (knockbackDir && !isDrowning) {
            this.velocity.x += knockbackDir.x * 12.0;
            this.velocity.y += 5.0;
            this.velocity.z += knockbackDir.z * 12.0;
            this.isGrounded = false;
        }

        if (this.hp <= 0) {
            this.notify(`☠️ Foste morto por ${sourceName}! A reaparecer...`);
            this.findSafeSpawn();
            this.hp = 100;
            this.hunger = 100;
            if (typeof this.air !== 'undefined') this.air = 100;
        }
        this.updateUI();
    }

    initChatUI() {
        if (document.getElementById('chat-container')) return;

        const chatBox = document.createElement('div');
        chatBox.id = 'chat-container';
        chatBox.style.cssText = `
            position: absolute; bottom: 80px; left: 20px; width: 340px; height: 180px;
            display: flex; flex-direction: column; justify-content: space-between;
            pointer-events: none; z-index: 1000; font-family: monospace;
        `;

        const msgList = document.createElement('div');
        msgList.id = 'chat-messages';
        msgList.style.cssText = `
            flex-1; overflow-y: auto; display: flex; flex-direction: column;
            gap: 4px; text-shadow: 1px 1px 2px #000; color: #fff; font-size: 14px;
        `;

        const chatInput = document.createElement('input');
        chatInput.id = 'chat-input';
        chatInput.type = 'text';
        chatInput.placeholder = 'Pressiona Enter para falar...';
        chatInput.style.cssText = `
            width: 100%; background: rgba(0, 0, 0, 0.6); border: 1px solid #777;
            color: #fff; padding: 6px 10px; border-radius: 4px; display: none;
            pointer-events: auto; outline: none; font-family: monospace;
        `;

        chatBox.appendChild(msgList);
        chatBox.appendChild(chatInput);
        document.body.appendChild(chatBox);

        chatInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                const text = chatInput.value.trim();
                if (text.length > 0) {
                    const myName = this.activeProfile ? this.activeProfile.name : 'Jogador';
                    this.receiveChatMessage(myName, text);
                    this.network.sendChatMessage(text);
                }
                chatInput.value = '';
                chatInput.style.display = 'none';
                if (this.controls) this.controls.lock();
            } else if (e.key === 'Escape') {
                chatInput.style.display = 'none';
                if (this.controls) this.controls.lock();
            }
        });
    }

    openChat() {
        const input = document.getElementById('chat-input');
        if (input) {
            input.style.display = 'block';
            input.focus();
            if (this.controls) this.controls.unlock();
        }
    }

    receiveChatMessage(sender, text) {
        const msgList = document.getElementById('chat-messages');
        if (!msgList) return;

        const line = document.createElement('div');
        line.innerHTML = `<b style="color: #48bb78;">&lt;${sender}&gt;</b> ${text}`;
        msgList.appendChild(line);
        msgList.scrollTop = msgList.scrollHeight;

        setTimeout(() => {
            line.style.transition = 'opacity 1s';
            line.style.opacity = '0.4';
        }, 10000);
    }

    spawnDroppedItem(x, y, z, type, count = 1, isFromNetwork = false) {
        if (!this.droppedItems) this.droppedItems = [];
        const item = new DroppedItem(x, y, z, type, count, this);
        this.droppedItems.push(item);

        if (!isFromNetwork && this.network) {
            this.network.sendSpawnItem(x, y, z, type, count);
        }
    }

    spawnDroppedItemFromNetwork(x, y, z, type, count = 1) {
        this.spawnDroppedItem(x, y, z, type, count, true);
    }

    spawnArrowFromNetwork(x, y, z, dx, dy, dz, shooterId) {
        const dir = new THREE.Vector3(dx, dy, dz);
        this.arrows.push(new ArrowProjectile(x, y, z, dir, shooterId, this));
        this.sound.playPlace();
    }

    toggleDoorFromNetwork(doorKey, isOpen) {
        if (this.doorMeshes.has(doorKey)) {
            const d = this.doorMeshes.get(doorKey);
            d.isOpen = isOpen;
            d.targetRot = isOpen ? -Math.PI / 2 : 0;
            this.sound.playPlace();
        }
    }

    syncRemoteMobs(mobsData) {
        const currentIds = new Set(mobsData.map(m => m.id));

        for (let i = this.mobs.length - 1; i >= 0; i--) {
            if (!currentIds.has(this.mobs[i].id)) {
                this.scene.remove(this.mobs[i].mesh);
                this.mobs.splice(i, 1);
            }
        }

        for (let data of mobsData) {
            let mob = this.mobs.find(m => m.id === data.id);
            if (!mob) {
                mob = new VoxelMob(data.type, data.x, data.y, data.z, this, data.id);
                this.mobs.push(mob);
                this.scene.add(mob.mesh);
            }
            mob.targetPos = mob.targetPos || new THREE.Vector3();
            mob.targetPos.set(data.x, data.y, data.z);
            mob.rotY = data.rotY;
            mob.hp = data.hp;
            mob.fuseTimer = data.fuseTimer || 0;
        }
    }

    applyBlockLight(x, y, z, type) {
        const key = `${x},${y},${z}`;

        if (this.placedTorchLights.has(key)) {
            this.scene.remove(this.placedTorchLights.get(key));
            this.placedTorchLights.delete(key);
        }
        if (this.placedTotemLights.has(key)) {
            this.scene.remove(this.placedTotemLights.get(key));
            this.placedTotemLights.delete(key);
        }

        if (type === BLOCKS.TORCH) {
            const tLight = new THREE.PointLight(0xffaa44, 2.0, 18);
            tLight.position.set(x + 0.5, y + 0.5, z + 0.5);
            this.scene.add(tLight);
            this.placedTorchLights.set(key, tLight);
        } else if (type === BLOCKS.CAMPFIRE) {
            const tLight = new THREE.PointLight(0xff6600, 2.2, 18);
            tLight.position.set(x + 0.5, y + 0.5, z + 0.5);
            this.scene.add(tLight);
            this.placedTorchLights.set(key, tLight);
        } else if (type === BLOCKS.TOTEM) {
            const tLight = new THREE.PointLight(0x00ffff, 2.5, 24);
            tLight.position.set(x + 0.5, y + 0.5, z + 0.5);
            this.scene.add(tLight);
            this.placedTotemLights.set(key, tLight);
        }
    }

    createNameTag(text) {
        const canvas = document.createElement('canvas');
        canvas.width = 256; canvas.height = 64;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.fillRect(0, 0, 256, 64);
        ctx.font = 'bold 28px "Courier New", monospace';
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, 128, 32);

        const tex = new THREE.CanvasTexture(canvas);
        tex.magFilter = THREE.NearestFilter;
        const mat = new THREE.SpriteMaterial({ map: tex, transparent: true });
        const sprite = new THREE.Sprite(mat);
        sprite.scale.set(1.8, 0.45, 1.0);
        sprite.position.set(0, 2.15, 0);
        return sprite;
    }

    createSteveMesh(name = 'Steve', peerId = null) {
        const steveGroup = new THREE.Group();
        const skinMat = new THREE.MeshStandardMaterial({ color: 0xb17154, roughness: 0.8 });
        const hairMat = new THREE.MeshStandardMaterial({ color: 0x3b2219, roughness: 0.8 });
        const shirtMat = new THREE.MeshStandardMaterial({ color: 0x008c9e, roughness: 0.8 });
        const pantsMat = new THREE.MeshStandardMaterial({ color: 0x2e2d88, roughness: 0.8 });
        const shoeMat = new THREE.MeshStandardMaterial({ color: 0x4a4a4a, roughness: 0.8 });
        const eyeWhiteMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.8 });
        const pupilMat = new THREE.MeshStandardMaterial({ color: 0x4c3585, roughness: 0.8 });
        const mouthMat = new THREE.MeshStandardMaterial({ color: 0x6e3e2e, roughness: 0.8 });

        const headGroup = new THREE.Group();
        headGroup.position.set(0, 1.72, 0);

        const headBase = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.46, 0.46), skinMat);
        headGroup.add(headBase);

        const hairTop = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.16, 0.48), hairMat);
        hairTop.position.set(0, 0.17, 0);
        headGroup.add(hairTop);

        const hairBack = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.48, 0.16), hairMat);
        hairBack.position.set(0, 0, -0.16);
        headGroup.add(hairBack);

        const hairSideL = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.32, 0.48), hairMat);
        hairSideL.position.set(-0.21, 0.08, 0);
        headGroup.add(hairSideL);

        const hairSideR = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.32, 0.48), hairMat);
        hairSideR.position.set(0.21, 0.08, 0);
        headGroup.add(hairSideR);

        const eyeL = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.07, 0.02), eyeWhiteMat);
        eyeL.position.set(-0.11, -0.02, 0.24);
        headGroup.add(eyeL);

        const pupilL = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.07, 0.03), pupilMat);
        pupilL.position.set(-0.08, -0.02, 0.245);
        headGroup.add(pupilL);

        const eyeR = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.07, 0.02), eyeWhiteMat);
        eyeR.position.set(0.11, -0.02, 0.24);
        headGroup.add(eyeR);

        const pupilR = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.07, 0.03), pupilMat);
        pupilR.position.set(0.14, -0.02, 0.245);
        headGroup.add(pupilR);

        const mouth = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.06, 0.02), mouthMat);
        mouth.position.set(0, -0.13, 0.24);
        headGroup.add(mouth);

        steveGroup.add(headGroup);

        const torsoGroup = new THREE.Group();
        torsoGroup.position.set(0, 1.11, 0);

        const torso = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.72, 0.24), shirtMat);
        torsoGroup.add(torso);

        const neckCut = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.18, 0.02), skinMat);
        neckCut.position.set(0, 0.28, 0.121);
        torsoGroup.add(neckCut);

        steveGroup.add(torsoGroup);

        const armGeoSleeve = new THREE.BoxGeometry(0.22, 0.24, 0.22);
        const armGeoSkin = new THREE.BoxGeometry(0.20, 0.48, 0.20);

        const armLGroup = new THREE.Group();
        armLGroup.position.set(-0.36, 1.11, 0);
        const sleeveL = new THREE.Mesh(armGeoSleeve, shirtMat);
        sleeveL.position.y = 0.24;
        const skinL = new THREE.Mesh(armGeoSkin, skinMat);
        skinL.position.y = -0.12;
        armLGroup.add(sleeveL);
        armLGroup.add(skinL);
        steveGroup.add(armLGroup);

        const armRGroup = new THREE.Group();
        armRGroup.position.set(0.36, 1.11, 0);
        const sleeveR = new THREE.Mesh(armGeoSleeve, shirtMat);
        sleeveR.position.y = 0.24;
        const skinR = new THREE.Mesh(armGeoSkin, skinMat);
        skinR.position.y = -0.12;
        armRGroup.add(sleeveR);
        armRGroup.add(skinR);
        steveGroup.add(armRGroup);

        const legPantsGeo = new THREE.BoxGeometry(0.22, 0.60, 0.22);
        const legShoeGeo = new THREE.BoxGeometry(0.23, 0.14, 0.23);

        const legLGroup = new THREE.Group();
        legLGroup.position.set(-0.12, 0.37, 0);
        const pantsL = new THREE.Mesh(legPantsGeo, pantsMat);
        pantsL.position.y = 0.07;
        const shoeL = new THREE.Mesh(legShoeGeo, shoeMat);
        shoeL.position.y = -0.30;
        legLGroup.add(pantsL);
        legLGroup.add(shoeL);
        steveGroup.add(legLGroup);

        const legRGroup = new THREE.Group();
        legRGroup.position.set(0.12, 0.37, 0);
        const pantsR = new THREE.Mesh(legPantsGeo, pantsMat);
        pantsR.position.y = 0.07;
        const shoeR = new THREE.Mesh(legShoeGeo, shoeMat);
        shoeR.position.y = -0.30;
        legRGroup.add(pantsR);
        legRGroup.add(shoeR);
        steveGroup.add(legRGroup);

        steveGroup.traverse(child => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });

        const nameTag = this.createNameTag(name);
        steveGroup.add(nameTag);

        steveGroup.userData = { 
            isPlayerMesh: true, 
            peerId: peerId,
            limbs: {
                armL: armLGroup,
                armR: armRGroup,
                legL: legLGroup,
                legR: legRGroup
            },
            walkAnimTimer: 0
        };

        return steveGroup;
    }

    hasLineOfSight(from, to) {
        const dir = new THREE.Vector3().subVectors(to, from);
        const dist = dir.length();
        if (dist < 0.1) return true;
        dir.normalize();
        const steps = Math.ceil(dist * 3);
        const stepSize = dist / steps;
        const curr = from.clone();
        for (let i = 1; i < steps; i++) {
            curr.addScaledVector(dir, stepSize);
            if (this.checkSolid(Math.floor(curr.x), Math.floor(curr.y), Math.floor(curr.z))) {
                return false;
            }
        }
        return true;
    }

    spawnRemotePlayer(id, name) {
        if (this.remotePlayers.has(id)) return;

        const group = this.createSteveMesh(name, id);
        this.scene.add(group);
        this.remotePlayers.set(id, { group, targetPos: new THREE.Vector3(), rotY: 0, name: name });
    }

    updateRemotePlayer(id, x, y, z, rotY, name) {
        if (!this.remotePlayers.has(id)) {
            this.spawnRemotePlayer(id, name || 'Outro Jogador');
        }
        const rp = this.remotePlayers.get(id);
        rp.targetPos.set(x, y - 1.62, z);
        rp.rotY = rotY; 
    }

    removeRemotePlayer(id) {
        if (this.remotePlayers.has(id)) {
            const rp = this.remotePlayers.get(id);
            this.scene.remove(rp.group);
            this.remotePlayers.delete(id);
        }
    }

    triggerDamageFlash() {
        const vignette = document.getElementById('damage-vignette');
        if (vignette) {
            vignette.style.display = 'block';
            vignette.style.opacity = '1.0';
            setTimeout(() => {
                vignette.style.opacity = '0.0';
                setTimeout(() => { vignette.style.display = 'none'; }, 150);
            }, 180);
        }
    }

    spawnFishes(seed = null) {
        if (this.fishes) {
            this.fishes.forEach(fish => {
                if (fish.mesh) this.scene.remove(fish.mesh);
                if (fish.group) this.scene.remove(fish.group);
            });
        }
        this.fishes = [];

        let s = seed || (this.activeWorld ? this.activeWorld.seed : 12345);
        const random = () => {
            let x = Math.sin(s++) * 10000;
            return Math.abs(x - Math.floor(x));
        };

        const types = ['clown', 'salmon', 'blue', 'cod', 'pufferfish', 'turtle'];
        const waterSpots = [];

        // Procura por posições reais com água num raio expandido do mapa
        for (let attempt = 0; attempt < 600; attempt++) {
            const rx = Math.floor((random() - 0.5) * 240);
            const rz = Math.floor((random() - 0.5) * 240);

            // Verifica o nível d'água (Y entre 5 e 10)
            for (let ry = 5; ry <= 10; ry++) {
                if (this.getBlock(rx, ry, rz) === BLOCKS.WATER) {
                    waterSpots.push({ x: rx + 0.5, y: ry + 0.5, z: rz + 0.5 });
                    break;
                }
            }

            // Para assim que encontrar 30 posições válidas em lagos
            if (waterSpots.length >= 30) break;
        }

        // Spawna os peixes e tartarugas diretamente dentro da água dos lagos encontrados
        for (let i = 0; i < waterSpots.length; i++) {
            const pos = waterSpots[i];
            const type = types[Math.floor(random() * types.length)];
            this.fishes.push(new VoxelFish(type, pos.x, pos.y, pos.z, this.scene));
        }
    }

    setBlockModified(x, y, z, type, forceRot = null, isRemote = false) {
        const ix = Math.floor(x), iy = Math.floor(y), iz = Math.floor(z);
        const key = `${ix},${iy},${iz}`;
        
        this.worldData.set(key, type);
        this.modifiedBlocks.set(key, type);
        this.applyBlockLight(ix, iy, iz, type);

        let doorRot = forceRot; 
        
        const isDoor = (type === 8 || (typeof BLOCKS !== 'undefined' && type === BLOCKS.DOOR));

        if (isDoor && !isRemote) {
            const dir = new THREE.Vector3();
            this.camera.getWorldDirection(dir);
            const angle = Math.atan2(dir.x, dir.z) + (Math.PI / 2);
            doorRot = Math.round(angle / (Math.PI / 2)) * (Math.PI / 2);
        }

        if (isDoor) {
            if (!window.DoorRotationMemory) window.DoorRotationMemory = new Map();
            window.DoorRotationMemory.set(key, doorRot);
        }

        if (!isRemote) {
            this.network.sendBlock(ix, iy, iz, type, doorRot);
        }
    }

    saveGameState() {
        if (!this.activeProfile || !this.activeWorld) return;

        const modifiedBlocksArr = Array.from(this.modifiedBlocks.entries());
        const chestsArr = Array.from(this.chestData.entries());

        const savedData = {
            ...this.activeWorld,
            lastPlayed: new Date().toLocaleDateString('pt-PT') + ' ' + new Date().toLocaleTimeString('pt-PT', {hour: '2-digit', minute:'2-digit'}),
            playerPos: { x: this.position.x, y: this.position.y, z: this.position.z },
            hp: this.hp,
            hunger: this.hunger,
            dayTime: this.dayTime,
            hotbar: this.hotbarSlots,
            inventory: this.inventorySlots,
            modifiedBlocks: modifiedBlocksArr,
            chests: chestsArr
        };

        try {
            SaveSystem.saveWorld(this.activeProfile.id, savedData);
            this.notify("💾 Progresso guardado em Cache!");
        } catch(err) {
            console.error("Erro ao guardar:", err);
            this.notify("⚠️ Erro ao guardar no navegador!");
        }
    }

    applySettings(newSettings) {
        this.settings = newSettings;
        this.renderDistance = newSettings.renderDistance;

        const brightFactor = (newSettings.brightness || 100) / 100;
        this.renderer.toneMappingExposure = brightFactor * 1.0;
        if (this.ambientLight) this.ambientLight.intensity = 0.50 * brightFactor;

        const shadowFactor = (newSettings.shadows || 100) / 100;
        if (newSettings.shadows === 0) {
            this.renderer.shadowMap.enabled = false;
            if (this.sun) this.sun.castShadow = false;
        } else {
            this.renderer.shadowMap.enabled = true;
            if (this.sun) {
                this.sun.castShadow = true;
                this.sun.intensity = 1.15 * shadowFactor;
            }
        }

        this.notify("⚙️ Opções atualizadas!");
    }

    initGraphics() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x7ec0ee);

        this.scene.fog = new THREE.Fog(0x7ec0ee, 45, 80);

        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.05, 500);
        this.scene.add(this.camera);

        this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

        const brightFactor = (this.settings.brightness || 100) / 100;
        this.renderer.toneMappingExposure = brightFactor * 1.0;

        const shadowFactor = (this.settings.shadows || 100) / 100;
        if (this.settings.shadows === 0) {
            this.renderer.shadowMap.enabled = false;
        } else {
            this.renderer.shadowMap.enabled = true;
            this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        }

        document.getElementById('canvas-container').appendChild(this.renderer.domElement);

        this.controls = new THREE.PointerLockControls(this.camera, document.body);

        this.controls.addEventListener('unlock', () => {
            if (!this.isRunning) return;
            const furnaceEl = document.getElementById('furnace-screen');
            
            const isGuiOpen = document.getElementById('inventory-screen').style.display === 'flex' || 
                             document.getElementById('chest-screen').style.display === 'flex' || 
                             document.getElementById('crafting-table-screen').style.display === 'flex' || 
                             (furnaceEl && furnaceEl.style.display === 'flex') ||
                             document.getElementById('start-screen').style.display !== 'none' ||
                             document.getElementById('pause-menu').style.display === 'flex' ||
                             (document.getElementById('chat-input') && document.getElementById('chat-input').style.display === 'block');
            
            if (!isGuiOpen) {
                const isLAN = this.network && (this.network.isHost || (this.network.netConn && this.network.netConn.open));
                if (!isLAN) {
                    this.isPaused = true;
                }
                document.getElementById('pause-menu').style.display = 'flex';
                document.getElementById('pause-main-box').style.display = 'flex';
                document.getElementById('pause-settings-box').style.display = 'none';
            }
        });

        this.controls.addEventListener('lock', () => {
            this.isPaused = false;
            document.getElementById('pause-menu').style.display = 'none';
        });

        document.getElementById('btn-save').onclick = () => {
            this.saveGameState();
        };

        document.getElementById('btn-pause-settings').onclick = () => {
            document.getElementById('pause-main-box').style.display = 'none';
            document.getElementById('pause-settings-box').style.display = 'flex';

            const currentSettings = SaveSystem.getSettings();
            document.getElementById('pause-slider-brightness').value = currentSettings.brightness || 100;
            document.getElementById('pause-label-brightness').innerText = (currentSettings.brightness || 100) + '%';

            document.getElementById('pause-slider-render-dist').value = currentSettings.renderDistance || 5;
            document.getElementById('pause-label-render-dist').innerText = (currentSettings.renderDistance || 5) + ' Chunks';

            document.getElementById('pause-slider-shadows').value = currentSettings.shadows !== undefined ? currentSettings.shadows : 100;
            document.getElementById('pause-label-shadows').innerText = (currentSettings.shadows !== undefined ? currentSettings.shadows : 100) + '%';
        };

        document.getElementById('pause-slider-brightness').oninput = (e) => {
            document.getElementById('pause-label-brightness').innerText = e.target.value + '%';
        };

        document.getElementById('pause-slider-render-dist').oninput = (e) => {
            document.getElementById('pause-label-render-dist').innerText = e.target.value + ' Chunks';
        };

        document.getElementById('pause-slider-shadows').oninput = (e) => {
            document.getElementById('pause-label-shadows').innerText = e.target.value + '%';
        };

        document.getElementById('btn-pause-cancel-settings').onclick = () => {
            document.getElementById('pause-settings-box').style.display = 'none';
            document.getElementById('pause-main-box').style.display = 'flex';
        };

        document.getElementById('btn-pause-save-settings').onclick = () => {
            const newSet = {
                brightness: parseInt(document.getElementById('pause-slider-brightness').value),
                renderDistance: parseInt(document.getElementById('pause-slider-render-dist').value),
                shadows: parseInt(document.getElementById('pause-slider-shadows').value)
            };
            SaveSystem.saveSettings(newSet);
            this.applySettings(newSet);
            document.getElementById('pause-settings-box').style.display = 'none';
            document.getElementById('pause-main-box').style.display = 'flex';
        };

        document.getElementById('btn-resume').onclick = () => {
            this.isPaused = false;
            document.getElementById('pause-menu').style.display = 'none';
            this.enterFullscreen();
            this.controls.lock();
        };

        document.getElementById('btn-main-menu').onclick = () => {
            this.destroy();
        };

        this.ambientLight = new THREE.AmbientLight(0xffffff, 0.50 * brightFactor);
        this.scene.add(this.ambientLight);

        this.sun = new THREE.DirectionalLight(0xfffaed, 1.15 * shadowFactor);
        this.sun.position.set(60, 120, 40);
        this.sun.castShadow = (this.settings.shadows > 0);

        this.sun.shadow.mapSize.width = 2048;
        this.sun.shadow.mapSize.height = 2048;
        this.sun.shadow.camera.near = 0.5;
        this.sun.shadow.camera.far = 300;
        const d = 55;
        this.sun.shadow.camera.left = -d;
        this.sun.shadow.camera.right = d;
        this.sun.shadow.camera.top = d;
        this.sun.shadow.camera.bottom = -d;
        this.sun.shadow.bias = -0.0004;
        this.sun.shadow.normalBias = 0.02;

        this.scene.add(this.sun);

        this.atlasMaterial = new THREE.MeshStandardMaterial({
            map: ATLAS_TEXTURE,
            side: THREE.FrontSide,
            alphaTest: 0.5,
            roughness: 0.85,
            metalness: 0.0,
            vertexColors: true
        });

        this.plantMaterial = new THREE.MeshStandardMaterial({
            map: ATLAS_TEXTURE,
            side: THREE.DoubleSide,
            alphaTest: 0.5,
            roughness: 0.85,
            metalness: 0.0,
            vertexColors: true
        });

        this.waterMaterial = new THREE.MeshStandardMaterial({
            map: ATLAS_TEXTURE,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.65,
            roughness: 0.1,
            metalness: 0.0,
            depthWrite: false,
            vertexColors: true
        });

        // ==========================================================
        // SHADER: EFEITO DE CACHOEIRA (ÁGUA A DESCER)
        // ==========================================================
        this.waterMaterial.onBeforeCompile = (shader) => {
            shader.uniforms.uTime = { value: 0 };
            this.waterShader = shader;

            shader.fragmentShader = `
                uniform float uTime;
            ` + shader.fragmentShader;

            shader.fragmentShader = shader.fragmentShader.replace(
                '#include <map_fragment>',
                `
                #ifdef USE_MAP
                    vec2 waterUv = vUv;
                    
                    float tileY = floor(waterUv.y * 8.0);
                    float localV = fract(waterUv.y * 8.0);
                    
                    // SINAL DE SOMA (+) FAZ A ÁGUA DESCER:
                    localV = fract(localV + (uTime * 1.5));
                    
                    waterUv.y = (tileY + localV) / 8.0;

                    vec4 sampledDiffuseColor = texture2D( map, waterUv );
                    diffuseColor *= sampledDiffuseColor;
                #endif
                `
            );
        };

        const boxGeo = new THREE.BoxGeometry(1.002, 1.002, 1.002);
        const edgesGeo = new THREE.EdgesGeometry(boxGeo);
        const outlineMat = new THREE.LineBasicMaterial({ color: 0x000000, linewidth: 2 });
        this.targetOutline = new THREE.LineSegments(edgesGeo, outlineMat);
        this.targetOutline.visible = false;
        this.scene.add(this.targetOutline);

        window.addEventListener('resize', () => this.onWindowResize());
        document.addEventListener('fullscreenchange', () => this.onWindowResize());
        document.addEventListener('webkitfullscreenchange', () => this.onWindowResize());
    }

    destroy() {
        this.isRunning = false;
        this.saveGameState();

        if (this.controls) {
            try { this.controls.unlock(); } catch(e) {}
        }

        if (this.renderer && this.renderer.domElement) {
            const container = document.getElementById('canvas-container');
            container.innerHTML = '';
            this.renderer.dispose();
        }

        document.getElementById('pause-menu').style.display = 'none';
        document.getElementById('ui-layer').style.display = 'none';
        document.getElementById('crosshair').style.display = 'none';
        document.getElementById('f3-overlay').style.display = 'none';
        document.getElementById('inventory-screen').style.display = 'none';
        document.getElementById('chest-screen').style.display = 'none';
        document.getElementById('crafting-table-screen').style.display = 'none';
        document.getElementById('underwater-overlay').style.display = 'none';
        document.getElementById('player-list-overlay').style.display = 'none';

        document.getElementById('start-screen').style.display = 'flex';
        renderStartScreen();
    }

    initClouds(seed = null) {
        if (this.cloudsGroup) {
            this.scene.remove(this.cloudsGroup);
        }
        
        this.cloudsGroup = new THREE.Group();
        const cloudMat = new THREE.MeshLambertMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.85
        });

        let s = seed || (this.activeWorld ? this.activeWorld.seed : 12345);
        const random = () => {
            let x = Math.sin(s++) * 10000;
            return Math.abs(x - Math.floor(x));
        };

        for (let i = 0; i < 18; i++) {
            const cluster = new THREE.Group();
            const cx = (random() - 0.5) * 350;
            const cy = 48 + random() * 6;
            const cz = (random() - 0.5) * 350;

            const puffCount = 6 + Math.floor(random() * 5);
            for (let p = 0; p < puffCount; p++) {
                const w = 8 + random() * 10;
                const h = 3 + random() * 3;
                const d = 8 + random() * 10;
                const puffGeo = new THREE.BoxGeometry(w, h, d);
                const puff = new THREE.Mesh(puffGeo, cloudMat);
                puff.position.set(
                    (random() - 0.5) * 16,
                    (random() - 0.5) * 2,
                    (random() - 0.5) * 16
                );
                cluster.add(puff);
            }
            cluster.position.set(cx, cy, cz);
            this.cloudsGroup.add(cluster);
        }
        this.scene.add(this.cloudsGroup);
    }

    updateClouds(delta) {
        this.cloudsGroup.position.x += 1.5 * delta;
        if (this.cloudsGroup.position.x > 150) this.cloudsGroup.position.x = -150;
    }

    createDoorMesh(x, y, z, facingRot, isOpenParam) {
        const key = `${x},${y},${z}`;
        if (this.doorMeshes.has(key)) return;

        const THREE_REF = window.THREE || (typeof THREE !== 'undefined' ? THREE : null);
        if (!THREE_REF) return;

        if (!window.DoorRotationMemory) window.DoorRotationMemory = new Map();

        let rot = 0;
        let open = false;

        if (typeof facingRot === 'number') {
            rot = facingRot;
            open = !!isOpenParam;
            window.DoorRotationMemory.set(key, rot);
        } else if (typeof facingRot === 'boolean') {
            open = facingRot;
            rot = window.DoorRotationMemory.get(key) || 0;
        } else {
            rot = window.DoorRotationMemory.get(key) || 0;
            open = !!isOpenParam;
        }

        const parentGroup = new THREE_REF.Group();
        parentGroup.position.set(x + 0.5, y, z + 0.5);
        parentGroup.rotation.y = rot;

        const doorGroup = new THREE_REF.Group();
        doorGroup.position.set(-0.44, 0, 0.48);

        const doorGeo = new THREE_REF.BoxGeometry(0.12, 2.0, 0.96);
        const uMin = 6 * (16 / 128);
        const vMin = 1.0 - ((3 + 1) * (16 / 128));
        const uvs = doorGeo.attributes.uv;
        for (let i = 0; i < uvs.count; i++) {
            let u = uvs.getX(i);
            let v = uvs.getY(i);
            uvs.setXY(i, uMin + u * (16 / 128), vMin + v * (16 / 128));
        }

        const doorMat = new THREE_REF.MeshStandardMaterial({
            map: typeof ATLAS_TEXTURE !== 'undefined' ? ATLAS_TEXTURE : null,
            roughness: 0.85,
            metalness: 0.0
        });

        const mesh = new THREE_REF.Mesh(doorGeo, doorMat);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        mesh.position.set(0.06, 1.0, -0.48);

        doorGroup.add(mesh);
        
        doorGroup.rotation.y = open ? Math.PI / 2 : 0;

        parentGroup.add(doorGroup);
        this.scene.add(parentGroup);

        this.doorMeshes.set(key, { 
            parentGroup: parentGroup, 
            group: doorGroup,         
            mesh: mesh,
            isOpen: open, 
            targetRot: open ? Math.PI / 2 : 0 
        });
    }

    exportDoorsForNewPlayer() {
        const doorsData = [];
        if (this.doorMeshes) {
            for (let [key, data] of this.doorMeshes.entries()) {
                const coords = key.split(',');
                doorsData.push({
                    x: parseInt(coords[0]),
                    y: parseInt(coords[1]),
                    z: parseInt(coords[2]),
                    rot: window.DoorRotationMemory ? window.DoorRotationMemory.get(key) || 0 : 0,
                    isOpen: data.isOpen
                });
            }
        }
        return doorsData;
    }

    importDoorsFromHost(doorsData) {
        if (!doorsData || doorsData.length === 0) return;
        if (!window.DoorRotationMemory) window.DoorRotationMemory = new Map();
        
        doorsData.forEach(door => {
            const key = `${door.x},${door.y},${door.z}`;
            window.DoorRotationMemory.set(key, door.rot);
            this.createDoorMesh(door.x, door.y, door.z, door.rot, door.isOpen);
        });
    }

    removeDoorMesh(x, y, z) {
        const key = `${x},${y},${z}`;
        if (this.doorMeshes.has(key)) {
            const d = this.doorMeshes.get(key);
            const root = d.parentGroup || d.group;
            this.scene.remove(root);
            root.traverse((child) => {
                if (child.geometry) child.geometry.dispose();
            });
            this.doorMeshes.delete(key);
        }
    }

    initPhysics() {
        this.position = new THREE.Vector3(0.5, 20, 0.5);
        this.velocity = new THREE.Vector3();
        this.isGrounded = false;
        this.playerRadius = 0.25;
        this.camera.position.copy(this.position);
    }

    getHighestBlockY(x, z) {
        const wx = Math.floor(x);
        const wz = Math.floor(z);
        for (let y = 38; y >= 0; y--) {
            const b = this.getBlock(wx, y, wz);
            if (b !== BLOCKS.AIR && b !== BLOCKS.WATER && !BLOCK_TILES[b]?.plant) return y;
        }
        const elevNoise = this.noise.noise2D(wx * 0.015, wz * 0.015) * 12 +
                          this.noise.noise2D(wx * 0.04, wz * 0.04) * 4;
        return Math.floor(14 + elevNoise);
    }

    findSafeSpawn() {
        const px = Math.floor(this.position.x / this.chunkSize);
        const pz = Math.floor(this.position.z / this.chunkSize);

        for (let x = -this.renderDistance; x <= this.renderDistance; x++) {
            for (let z = -this.renderDistance; z <= this.renderDistance; z++) {
                this.populateChunkData(px + x, pz + z);
                this.generateChunk(px + x, pz + z);
            }
        }

        for (let x = -5; x <= 5; x++) {
            for (let z = -5; z <= 5; z++) {
                for (let y = 10; y <= 38; y++) {
                    const type = this.getBlock(x, y, z);
                    if (type === BLOCKS.WOOD || type === BLOCKS.LEAVES) {
                        this.worldData.set(`${x},${y},${z}`, BLOCKS.AIR);
                    }
                }
            }
        }

        const highestY = this.getHighestBlockY(0, 0);
        this.position.set(0.5, highestY + 4.0, 0.5);
        this.velocity.set(0, 0, 0);
        this.camera.position.copy(this.position);
    }

    spawnInitialMobs(seed = null) {
        let s = seed || (this.activeWorld ? this.activeWorld.seed : 12345);
        const random = () => {
            let x = Math.sin(s++) * 10000;
            return Math.abs(x - Math.floor(x));
        };

        const types = ['cow', 'pig', 'sheep', 'chicken'];
        for (let i = 0; i < 7; i++) {
            const rx = (random() - 0.5) * 35;
            const rz = (random() - 0.5) * 35;
            const ry = this.getHighestBlockY(rx, rz) + 1;
            const type = types[Math.floor(random() * types.length)];
            const mob = new VoxelMob(type, rx, ry, rz, this);
            this.mobs.push(mob);
            this.scene.add(mob.mesh);
        }
    }

    spawnNightMobs(delta) {
        const isClientLAN = this.network && !this.network.isHost && this.network.netConn && this.network.netConn.open;
        if (isClientLAN) return;

        const isNightTime = (this.dayTime >= 0.72 || this.dayTime < 0.22);
        if (isNightTime) {
            this.nightSpawnTimer -= delta;
            const hostileCount = this.mobs.filter(m => m.isHostile).length;

            if (this.nightSpawnTimer <= 0 && hostileCount < 6) {
                this.nightSpawnTimer = 5.0;

                for (let attempt = 0; attempt < 10; attempt++) {
                    const angle = Math.random() * Math.PI * 2;
                    const dist = 24 + Math.random() * 22;
                    const rx = this.position.x + Math.sin(angle) * dist;
                    const rz = this.position.z + Math.cos(angle) * dist;
                    const ry = this.getHighestBlockY(rx, rz);

                    if (ry <= 11) continue;

                    const spawnVec = new THREE.Vector3(rx, ry + 1, rz);
                    let tooCloseToAnyPlayer = spawnVec.distanceTo(this.position) < 22;

                    if (!tooCloseToAnyPlayer && this.remotePlayers) {
                        for (let rp of this.remotePlayers.values()) {
                            const pPos = rp.targetPos || rp.group.position;
                            if (pPos && spawnVec.distanceTo(pPos) < 22) {
                                tooCloseToAnyPlayer = true;
                                break;
                            }
                        }
                    }

                    if (!tooCloseToAnyPlayer) {
                        const randType = Math.random();
                        const type = randType < 0.4 ? 'creeper' : (randType < 0.7 ? 'spider' : 'skeleton');
                        const mob = new VoxelMob(type, rx, ry + 1, rz, this);
                        this.mobs.push(mob);
                        this.scene.add(mob.mesh);
                        this.notify(`⚠️ Inimigo noturno detetado ao longe: ${type.toUpperCase()}`);
                        break;
                    }
                }
            }
        }
    }

    togglePlayerList(show) {
        const overlay = document.getElementById('player-list-overlay');
        if (!overlay) return;

        if (show) {
            this.updatePlayerListUI();
            overlay.style.display = 'flex';
        } else {
            overlay.style.display = 'none';
        }
    }

    updatePlayerListUI() {
        const container = document.getElementById('player-list-container');
        const countEl = document.getElementById('player-count');
        if (!container) return;

        container.innerHTML = '';
        let totalPlayers = 1;

        const myName = (this.activeProfile ? this.activeProfile.name : 'Jogador') + (this.network.isHost ? ' (Host)' : '');
        const myRow = document.createElement('div');
        myRow.className = `player-list-row ${this.network.isHost ? 'host' : 'client'}`;
        myRow.innerHTML = `<span>🟢 ${myName}</span><span>0ms</span>`;
        container.appendChild(myRow);

        for (let [id, rp] of this.remotePlayers.entries()) {
            totalPlayers++;
            const row = document.createElement('div');
            row.className = 'player-list-row client';
            row.innerHTML = `<span>🔵 ${rp.name || ('Jogador ' + totalPlayers)}</span><span>LAN</span>`;
            container.appendChild(row);
        }

        if (countEl) countEl.innerText = totalPlayers;
    }

    initInputs() {
        this.keys = {};
        this.mouseDownPrimary = false;

        document.addEventListener('mousemove', (e) => {
            if (this.controls && this.controls.isLocked) {
                if (Math.abs(e.movementY) > 120 || Math.abs(e.movementX) > 120) {
                    e.stopImmediatePropagation();
                    return;
                }
            }
        }, true);

        document.addEventListener('keydown', (e) => {
            const chatInput = document.getElementById('chat-input');
            const isChatActive = chatInput && chatInput.style.display === 'block';

            if (isChatActive) {
                return;
            }

            // Permite fechar a Fornalha, Baú, Bancada ou Inventário pressionando ESC
            if (e.code === 'Escape') {
                const furnaceEl = document.getElementById('furnace-screen');
                const isGuiOpen = document.getElementById('inventory-screen').style.display === 'flex' || 
                                 document.getElementById('chest-screen').style.display === 'flex' || 
                                 document.getElementById('crafting-table-screen').style.display === 'flex' || 
                                 (furnaceEl && furnaceEl.style.display === 'flex');
                if (isGuiOpen) {
                    this.toggleInventory();
                    return;
                }
            }

            if (e.code === 'KeyT') {
                e.preventDefault();
                this.openChat();
                return;
            }

            if (e.code === 'Tab') {
                e.preventDefault();
                this.togglePlayerList(true);
                return;
            }

            this.keys[e.code] = true;

            if (e.code === 'KeyW' && !e.repeat) {
                const now = performance.now();
                if (now - this.lastWPressTime < 300) {
                    this.isSprinting = true;
                }
                this.lastWPressTime = now;
            }

            if (e.code === 'F3') {
                e.preventDefault();
                const f3 = document.getElementById('f3-overlay');
                f3.style.display = f3.style.display === 'block' ? 'none' : 'block';
            }
            if (e.code === 'KeyE') this.toggleInventory();
            if (e.code.startsWith('Digit')) {
                const idx = parseInt(e.code.replace('Digit', '')) - 1;
                if (idx >= 0 && idx < 9) this.selectSlot(idx);
            }
        });

        document.addEventListener('keyup', (e) => {
            if (e.code === 'Tab') {
                e.preventDefault();
                this.togglePlayerList(false);
                return;
            }

            this.keys[e.code] = false;
            if (e.code === 'KeyW') {
                this.isSprinting = false;
            }
        });

        document.addEventListener('mousedown', (e) => {
            const furnaceEl = document.getElementById('furnace-screen'); // <-- NOVA VARIÁVEL
            
            const isGuiOpen = document.getElementById('inventory-screen').style.display === 'flex' || 
                             document.getElementById('chest-screen').style.display === 'flex' || 
                             document.getElementById('crafting-table-screen').style.display === 'flex' || 
                             (furnaceEl && furnaceEl.style.display === 'flex') || // <-- FORNALHA ADICIONADA AQUI
                             document.getElementById('start-screen').style.display !== 'none' ||
                             document.getElementById('pause-menu').style.display === 'flex' ||
                             (document.getElementById('chat-input') && document.getElementById('chat-input').style.display === 'block');
            
            if (!isGuiOpen && !this.controls.isLocked) {
                this.enterFullscreen();
                this.controls.lock();
            }

            if (this.controls.isLocked) {
                if (e.button === 0) {
                    this.mouseDownPrimary = true;
                    this.handlePrimaryAction(true);
                }
                if (e.button === 2) this.handleSecondaryAction();
                if (e.button === 1) this.pickBlock();
            }
        });

        document.addEventListener('mouseup', (e) => {
            if (e.button === 0) {
                this.mouseDownPrimary = false;
                this.miningTimer = 0;
                this.currentMiningKey = null;
            }
        });

        document.addEventListener('mousemove', (e) => {
            const floatItem = document.getElementById('floating-item');
            if (this.draggedSlot) {
                floatItem.style.left = `${e.clientX}px`;
                floatItem.style.top = `${e.clientY}px`;
            }
        });

        // <-- FORNALHA ADICIONADA NA LISTA ABAIXO PARA PODER ATIRAR ITENS FORA DA JANELA
        ['inventory-screen', 'chest-screen', 'crafting-table-screen', 'furnace-screen'].forEach(id => {
            const screenEl = document.getElementById(id);
            if (screenEl) {
                screenEl.addEventListener('click', (e) => {
                    if (e.target === screenEl) {
                        this.dropDraggedItem();
                    }
                });
            }
        });
    }

    initUI() {
        const uiLayer = document.getElementById('ui-layer');
        if (uiLayer) uiLayer.style.display = 'flex';

        const crosshair = document.getElementById('crosshair');
        if (crosshair) crosshair.style.display = 'block';

        const hotbarEl = document.getElementById('hotbar');
        if (hotbarEl) {
            hotbarEl.innerHTML = '';
            for (let i = 0; i < 9; i++) {
                const slot = document.createElement('div');
                slot.className = `slot ${i === 0 ? 'active' : ''}`;
                slot.id = `slot-${i}`;
                slot.innerHTML = `<span class="slot-num">${i+1}</span><div class="slot-icon"></div><span class="slot-count"></span>`;
                slot.addEventListener('mousedown', (e) => {
                    e.preventDefault();
                    this.handleSlotClickUnified('hotbar', i, e.button === 2);
                });
                slot.addEventListener('contextmenu', (e) => e.preventDefault());
                hotbarEl.appendChild(slot);
            }
        }

        const invGrid = document.getElementById('inv-grid');
        if (invGrid) {
            invGrid.innerHTML = '';
            for (let i = 0; i < 27; i++) {
                const slot = document.createElement('div');
                slot.className = 'gui-slot';
                slot.id = `inv-${i}`;
                slot.innerHTML = `<div class="slot-icon"></div><span class="slot-count"></span>`;
                slot.addEventListener('mousedown', (e) => {
                    e.preventDefault();
                    this.handleSlotClickUnified('inv', i, e.button === 2);
                });
                slot.addEventListener('contextmenu', (e) => e.preventDefault());
                invGrid.appendChild(slot);
            }
        }

        const invHotbarGrid = document.getElementById('inv-hotbar-grid');
        if (invHotbarGrid) {
            invHotbarGrid.innerHTML = '';
            for (let i = 0; i < 9; i++) {
                const slot = document.createElement('div');
                slot.className = 'gui-slot';
                slot.id = `gui-hotbar-${i}`;
                slot.innerHTML = `<div class="slot-icon"></div><span class="slot-count"></span>`;
                slot.addEventListener('mousedown', (e) => {
                    e.preventDefault();
                    this.handleSlotClickUnified('hotbar', i, e.button === 2);
                });
                slot.addEventListener('contextmenu', (e) => e.preventDefault());
                invHotbarGrid.appendChild(slot);
            }
        }

        for (let i = 0; i < 4; i++) {
            const craftEl = document.getElementById(`craft-${i}`);
            if (craftEl) {
                craftEl.addEventListener('mousedown', (e) => {
                    e.preventDefault();
                    this.handleSlotClickUnified('craft', i, e.button === 2);
                });
                craftEl.addEventListener('contextmenu', (e) => e.preventDefault());
            }
        }
        const craftResEl = document.getElementById('craft-result');
        if (craftResEl) {
            craftResEl.onclick = () => this.takeCraftResult();
        }

        this.initChatUI();
        this.updateUI();
    }

    openCraftingTableGUI() {
        const grid = document.getElementById('craft3x3-grid');
        grid.innerHTML = '';
        for (let i = 0; i < 9; i++) {
            const slot = document.createElement('div');
            slot.className = 'gui-slot';
            slot.id = `craft3x3-slot-${i}`;
            slot.innerHTML = `<div class="slot-icon"></div><span class="slot-count"></span>`;
            
            slot.addEventListener('mousedown', (e) => {
                e.preventDefault();
                this.handleSlotClickUnified('craft3x3', i, e.button === 2);
            });
            slot.addEventListener('contextmenu', (e) => e.preventDefault());
            grid.appendChild(slot);
        }

        const invGrid = document.getElementById('craft3x3-inv-grid');
        invGrid.innerHTML = '';
        for (let i = 0; i < 27; i++) {
            const slot = document.createElement('div');
            slot.className = 'gui-slot';
            slot.id = `craft3x3-inv-${i}`;
            slot.innerHTML = `<div class="slot-icon"></div><span class="slot-count"></span>`;
            slot.addEventListener('mousedown', (e) => {
                e.preventDefault();
                this.handleSlotClickUnified('inv', i, e.button === 2);
            });
            slot.addEventListener('contextmenu', (e) => e.preventDefault());
            invGrid.appendChild(slot);
        }

        document.getElementById('craft3x3-result').onclick = () => this.takeCraft3x3Result();

        this.updateCraftingTableUI();
        document.getElementById('crafting-table-screen').style.display = 'flex';
        this.controls.unlock();
    }

    checkCrafting3x3() {
        const items = this.crafting3x3Slots.filter(s => s !== null);
        if (items.length === 0) {
            this.craft3x3Result = null;
            return;
        }

        // DECLARAÇÃO DO IDS NO TOPO (Evita o ReferenceError)
        const ids = items.map(i => i.id);

        // RECEITA 1: 1 Tronco de Madeira -> 4 Tábuas
        if (items.length === 1 && items[0].id === BLOCKS.WOOD) {
            this.craft3x3Result = { id: BLOCKS.PLANK, count: 4 };
            return;
        }

        // RECEITA 2: 2 Tábuas -> 4 Tochas
        if (items.length === 2 && items.every(i => i.id === BLOCKS.PLANK)) {
            this.craft3x3Result = { id: BLOCKS.TORCH, count: 4 };
            return;
        }

        // RECEITA 3: 4 Tábuas -> Bancada de Trabalho
        if (items.length === 4 && items.every(i => i.id === BLOCKS.PLANK)) {
            this.craft3x3Result = { id: BLOCKS.CRAFTING_TABLE, count: 1 };
            return;
        }

        // RECEITA 4: 4 Pedregulhos -> 4 Pedras Polidas
        if (items.length === 4 && items.every(i => i.id === BLOCKS.COBBLE)) {
            this.craft3x3Result = { id: BLOCKS.STONE, count: 4 };
            return;
        }

        // RECEITA 5: 8 Tábuas ao redor -> Baú
        if (items.length === 8 && ids.every(id => id === BLOCKS.PLANK) && !this.crafting3x3Slots[4]) {
            this.craft3x3Result = { id: BLOCKS.CHEST, count: 1 };
            return;
        }

        // RECEITA DA FORNALHA: 8 Pedregulhos ao redor -> 1 Fornalha
        if (items.length === 8 && ids.every(id => id === BLOCKS.COBBLE) && !this.crafting3x3Slots[4]) {
            this.craft3x3Result = { id: BLOCKS.FURNACE, count: 1 };
            return;
        }

        // RECEITA 6: Picareta de Diamante
        if (this.crafting3x3Slots[0]?.id === BLOCKS.DIAMOND_ORE &&
            this.crafting3x3Slots[1]?.id === BLOCKS.DIAMOND_ORE &&
            this.crafting3x3Slots[2]?.id === BLOCKS.DIAMOND_ORE &&
            this.crafting3x3Slots[4]?.id === BLOCKS.PLANK &&
            this.crafting3x3Slots[7]?.id === BLOCKS.PLANK && items.length === 5) {
            this.craft3x3Result = { id: BLOCKS.DIAMOND_PICKAXE, count: 1 };
            return;
        }

        // RECEITA 7: Espada de Diamante
        if (this.crafting3x3Slots[1]?.id === BLOCKS.DIAMOND_ORE &&
            this.crafting3x3Slots[4]?.id === BLOCKS.DIAMOND_ORE &&
            this.crafting3x3Slots[7]?.id === BLOCKS.PLANK && items.length === 3) {
            this.craft3x3Result = { id: BLOCKS.DIAMOND_SWORD, count: 1 };
            return;
        }

        this.craft3x3Result = null;

        // RECEITA: 3 Barras de Ferro -> 1 Balde
        if (items.length === 3 && ids.every(id => id === BLOCKS.IRON_INGOT)) {
            this.craft3x3Result = { id: BLOCKS.BUCKET, count: 1 };
            return;
        }
    }

    takeCraft3x3Result() {
        if (!this.craft3x3Result) return;

        const result = this.craft3x3Result;
        const floatItem = document.getElementById('floating-item');

        if (!this.draggedSlot) {
            this.draggedSlot = { type: 'result', index: -1, item: { id: result.id, count: result.count } };
        } else if (this.draggedSlot.item.id === result.id && (this.draggedSlot.item.count + result.count) <= 64) {
            this.draggedSlot.item.count += result.count;
        } else {
            return;
        }

        for (let i = 0; i < 9; i++) {
            if (this.crafting3x3Slots[i]) {
                this.crafting3x3Slots[i].count--;
                if (this.crafting3x3Slots[i].count <= 0) {
                    this.crafting3x3Slots[i] = null;
                }
            }
        }

        if (floatItem) {
            floatItem.style.backgroundImage = `url(${BLOCK_ICONS[this.draggedSlot.item.id]})`;
            floatItem.style.display = 'block';
        }

        this.checkCrafting3x3();
        this.updateCraftingTableUI();
        if (this.sound) this.sound.playPlace();
    }

    updateCraftingTableUI() {
        for (let i = 0; i < 9; i++) {
            const slot = document.getElementById(`craft3x3-slot-${i}`);
            if (!slot) continue;
            const item = this.crafting3x3Slots[i];
            const iconEl = slot.querySelector('.slot-icon');
            const countEl = slot.querySelector('.slot-count');

            if (item && item.count > 0 && BLOCK_ICONS[item.id]) {
                if (iconEl) iconEl.style.backgroundImage = `url(${BLOCK_ICONS[item.id]})`;
                else slot.style.backgroundImage = `url(${BLOCK_ICONS[item.id]})`;
                if (countEl) countEl.innerText = item.count > 1 ? item.count : '';
            } else {
                if (iconEl) iconEl.style.backgroundImage = 'none';
                else slot.style.backgroundImage = 'none';
                if (countEl) countEl.innerText = '';
            }
        }

        const resSlot = document.getElementById('craft3x3-result');
        if (resSlot) {
            if (this.craft3x3Result && BLOCK_ICONS[this.craft3x3Result.id]) {
                resSlot.style.backgroundImage = `url(${BLOCK_ICONS[this.craft3x3Result.id]})`;
                resSlot.style.backgroundSize = 'cover';
            } else {
                resSlot.style.backgroundImage = 'none';
            }
        }

        for (let i = 0; i < 27; i++) {
            const slot = document.getElementById(`craft3x3-inv-${i}`);
            if (!slot) continue;
            const item = this.inventorySlots[i];
            const iconEl = slot.querySelector('.slot-icon');
            const countEl = slot.querySelector('.slot-count');

            if (item && item.count > 0 && BLOCK_ICONS[item.id]) {
                if (iconEl) iconEl.style.backgroundImage = `url(${BLOCK_ICONS[item.id]})`;
                if (countEl) countEl.innerText = item.count;
            } else {
                if (iconEl) iconEl.style.backgroundImage = 'none';
                if (countEl) countEl.innerText = '';
            }
        }
        this.updateUI();
    }

    checkCrafting() {
        const items = this.craftingSlots.filter(s => s !== null);
        if (items.length === 0) {
            this.craftResult = null;
            return;
        }

        const ids = items.map(i => i.id);

        if (items.length === 1 && items[0].id === BLOCKS.WOOD) {
            this.craftResult = { id: BLOCKS.PLANK, count: 4 };
            return;
        }

        if (items.length === 2 && items.every(i => i.id === BLOCKS.PLANK)) {
            this.craftResult = { id: BLOCKS.TORCH, count: 4 };
            return;
        }

        if (items.length === 4 && items.every(i => i.id === BLOCKS.PLANK)) {
            this.craftResult = { id: BLOCKS.CRAFTING_TABLE, count: 1 };
            return;
        }

        if (items.length === 4 && items.every(i => i.id === BLOCKS.COBBLE)) {
            this.craftResult = { id: BLOCKS.STONE, count: 4 };
            return;
        }

        if (items.length === 2 && ids.includes(BLOCKS.IRON_ORE) && (ids.includes(BLOCKS.COBBLE) || ids.includes(BLOCKS.COAL_ORE))) {
            this.craftResult = { id: BLOCKS.FLINT_STEEL, count: 1 };
            return;
        }

        this.craftResult = null;
    }

    takeCraftResult() {
        if (!this.craftResult) return;

        const result = this.craftResult;
        const floatItem = document.getElementById('floating-item');

        if (!this.draggedSlot) {
            this.draggedSlot = { type: 'result', index: -1, item: { id: result.id, count: result.count } };
        } else if (this.draggedSlot.item.id === result.id && (this.draggedSlot.item.count + result.count) <= 64) {
            this.draggedSlot.item.count += result.count;
        } else {
            return;
        }

        for (let i = 0; i < 4; i++) {
            if (this.craftingSlots[i]) {
                this.craftingSlots[i].count--;
                if (this.craftingSlots[i].count <= 0) {
                    this.craftingSlots[i] = null;
                }
            }
        }

        if (floatItem) {
            floatItem.style.backgroundImage = `url(${BLOCK_ICONS[this.draggedSlot.item.id]})`;
            floatItem.style.display = 'block';
        }

        this.checkCrafting();
        this.updateUI();
        if (this.sound) this.sound.playPlace();
    }

    getSourceList(type) {
        if (type === 'chest') return this.chestData.get(this.activeChestKey);
        if (type === 'furnace') return this.furnaceData.get(this.activeFurnaceKey)?.slots; // <-- OBRIGATÓRIO AQUI
        if (type === 'hotbar') return this.hotbarSlots;
        if (type === 'inv') return this.inventorySlots;
        if (type === 'craft') return this.craftingSlots;
        if (type === 'craft3x3') return this.crafting3x3Slots;
        return null;
    }

    handleSlotClick(type, index) {
        this.handleSlotClickUnified(type, index, false);
    }

    handleSlotClickUnified(listType, index, isRightClick = false) {
        // Bloqueia a colocação de itens no slot de resultado da Fornalha (Slot 2)
        if (listType === 'furnace' && index === 2 && this.draggedSlot !== null) return;

        const targetList = this.getSourceList(listType);
        if (!targetList) return;

        const floatItem = document.getElementById('floating-item');

        if (this.draggedSlot === null) {
            const item = targetList[index];
            if (item && item.count > 0) {
                if (isRightClick) {
                    this.draggedSlot = { type: listType, index, item: { id: item.id, count: 1 } };
                    item.count--;
                    if (item.count <= 0) targetList[index] = null;
                } else {
                    this.draggedSlot = { type: listType, index, item: { ...item } };
                    targetList[index] = null;
                }

                if (floatItem) {
                    floatItem.style.zIndex = "9999"; // Força a ficar na frente
                    floatItem.style.backgroundImage = `url(${BLOCK_ICONS[this.draggedSlot.item.id]})`;
                    floatItem.style.display = 'block';
                }
            }
        } else {
            const targetItem = targetList[index];
            const held = this.draggedSlot.item;

            if (isRightClick) {
                if (!targetItem) {
                    targetList[index] = { id: held.id, count: 1 };
                    held.count--;
                } else if (targetItem.id === held.id && targetItem.count < 64) {
                    targetItem.count++;
                    held.count--;
                }
                if (held.count <= 0) {
                    this.draggedSlot = null;
                    if (floatItem) floatItem.style.display = 'none';
                }
            } else {
                if (!targetItem) {
                    targetList[index] = held;
                    this.draggedSlot = null;
                    if (floatItem) floatItem.style.display = 'none';
                } else if (targetItem.id === held.id) {
                    const space = 64 - targetItem.count;
                    const add = Math.min(space, held.count);
                    targetItem.count += add;
                    held.count -= add;

                    if (held.count <= 0) {
                        this.draggedSlot = null;
                        if (floatItem) floatItem.style.display = 'none';
                    }
                } else {
                    const sourceList = this.getSourceList(this.draggedSlot.type);
                    if (sourceList) {
                        const temp = targetList[index];
                        targetList[index] = held;
                        sourceList[this.draggedSlot.index] = temp;
                        this.draggedSlot = null;
                        if (floatItem) floatItem.style.display = 'none';
                    } else {
                        const temp = targetList[index];
                        targetList[index] = held;
                        this.draggedSlot = { type: listType, index, item: temp };
                        if (floatItem) {
                            floatItem.style.zIndex = "9999";
                            floatItem.style.backgroundImage = `url(${BLOCK_ICONS[temp.id]})`;
                        }
                    }
                }
            }
        }

        if (listType === 'craft' || this.draggedSlot?.type === 'craft') this.checkCrafting();
        if (listType === 'craft3x3' || this.draggedSlot?.type === 'craft3x3') this.checkCrafting3x3();

        if (this.activeChestKey && (listType === 'chest' || this.draggedSlot?.type === 'chest')) {
            this.network.sendChestUpdate(this.activeChestKey, this.chestData.get(this.activeChestKey));
        }

        this.updateUI();
        if (this.activeChestKey) this.updateChestUI();
        if (this.activeFurnaceKey) this.updateFurnaceUI();
        this.updateCraftingTableUI();
    }

    selectSlot(idx) {
        this.selectedSlot = idx;
        document.querySelectorAll('.slot').forEach((s, i) => s.classList.toggle('active', i === idx));
    }

    updateUI() {
        const heartsEl = document.getElementById('hearts-display');
        if (heartsEl) {
            const heartsCount = Math.max(0, Math.ceil(this.hp / 10));
            heartsEl.innerText = '❤️'.repeat(heartsCount);
        }

        const hungerEl = document.getElementById('hunger-display');
        if (hungerEl) {
            const hungerCount = Math.max(0, Math.ceil(this.hunger / 10));
            hungerEl.innerText = '🍖'.repeat(hungerCount);
        }

        const hungerValEl = document.getElementById('hunger-val');
        if (hungerValEl) hungerValEl.innerText = `${Math.round(this.hunger)}%`;

        const breathEl = document.getElementById('breath-display');
        if (breathEl) {
            const breathCount = Math.max(0, Math.ceil(this.breathTimer));
            breathEl.innerText = '🫧'.repeat(breathCount);
        }

        const breathValEl = document.getElementById('breath-val');
        if (breathValEl) breathValEl.innerText = `${Math.round((this.breathTimer / 10.0) * 100)}%`;

        for (let i = 0; i < 9; i++) {
            const slot = document.getElementById(`slot-${i}`);
            const guiHotbarSlot = document.getElementById(`gui-hotbar-${i}`);
            const item = this.hotbarSlots[i];

            if (slot) {
                const iconEl = slot.querySelector('.slot-icon');
                const countEl = slot.querySelector('.slot-count');

                if (item && item.count > 0 && BLOCK_ICONS[item.id]) {
                    if (iconEl) iconEl.style.backgroundImage = `url(${BLOCK_ICONS[item.id]})`;
                    if (countEl) countEl.innerText = item.count;
                } else {
                    if (iconEl) iconEl.style.backgroundImage = 'none';
                    if (countEl) countEl.innerText = '';
                }
            }

            if (guiHotbarSlot) {
                const iconEl = guiHotbarSlot.querySelector('.slot-icon');
                const countEl = guiHotbarSlot.querySelector('.slot-count');

                if (item && item.count > 0 && BLOCK_ICONS[item.id]) {
                    if (iconEl) iconEl.style.backgroundImage = `url(${BLOCK_ICONS[item.id]})`;
                    if (countEl) countEl.innerText = item.count;
                } else {
                    if (iconEl) iconEl.style.backgroundImage = 'none';
                    if (countEl) countEl.innerText = '';
                }
            }
        }

        for (let i = 0; i < 27; i++) {
            const slot = document.getElementById(`inv-${i}`);
            if (!slot) continue;
            const item = this.inventorySlots[i];
            const iconEl = slot.querySelector('.slot-icon');
            const countEl = slot.querySelector('.slot-count');

            if (item && item.count > 0 && BLOCK_ICONS[item.id]) {
                if (iconEl) iconEl.style.backgroundImage = `url(${BLOCK_ICONS[item.id]})`;
                if (countEl) countEl.innerText = item.count;
            } else {
                if (iconEl) iconEl.style.backgroundImage = 'none';
                if (countEl) countEl.innerText = '';
            }
        }

        for (let i = 0; i < 4; i++) {
            const slot = document.getElementById(`craft-${i}`);
            if (!slot) continue;
            const item = this.craftingSlots[i];
            const iconEl = slot.querySelector('.slot-icon');
            const countEl = slot.querySelector('.slot-count');

            if (item && item.count > 0 && BLOCK_ICONS[item.id]) {
                if (iconEl) iconEl.style.backgroundImage = `url(${BLOCK_ICONS[item.id]})`;
                else slot.style.backgroundImage = `url(${BLOCK_ICONS[item.id]})`;
                if (countEl) countEl.innerText = item.count > 1 ? item.count : '';
                slot.style.backgroundSize = 'cover';
            } else {
                if (iconEl) iconEl.style.backgroundImage = 'none';
                else slot.style.backgroundImage = 'none';
                if (countEl) countEl.innerText = '';
            }
        }

        const resSlot = document.getElementById('craft-result');
        if (resSlot) {
            if (this.craftResult && BLOCK_ICONS[this.craftResult.id]) {
                resSlot.style.backgroundImage = `url(${BLOCK_ICONS[this.craftResult.id]})`;
                resSlot.style.backgroundSize = 'cover';
            } else {
                resSlot.style.backgroundImage = 'none';
            }
        }
    }

    notify(msg) {
        const container = document.getElementById('notifications');
        if (!container) return;
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.innerText = msg;
        container.appendChild(toast);
        setTimeout(() => toast.remove(), 2500);
    }

    getBlock(x, y, z) {
        return this.worldData.get(`${Math.floor(x)},${Math.floor(y)},${Math.floor(z)}`) || BLOCKS.AIR;
    }

    getBlockHardness(type, activeItem) {
        if (type === BLOCKS.BEDROCK) return Infinity;
        if (type === BLOCKS.LEAVES || type === BLOCKS.TALL_GRASS || type === BLOCKS.RED_FLOWER || type === BLOCKS.YELLOW_FLOWER) return 0.05;
        if (type === BLOCKS.DIRT || type === BLOCKS.GRASS || type === BLOCKS.SAND || type === BLOCKS.SNOW) return 0.12;

        const toolInfo = activeItem ? BLOCK_TILES[activeItem.id] : null;

        if (type === BLOCKS.WOOD || type === BLOCKS.PLANK || type === BLOCKS.DOOR || type === BLOCKS.CHEST || type === BLOCKS.CRAFTING_TABLE) {
            const speed = (toolInfo && toolInfo.toolType === 'axe') ? toolInfo.toolSpeed : 1.0;
            return 0.8 / speed;
        }

        if (type === BLOCKS.STONE || type === BLOCKS.COBBLE || type === BLOCKS.COAL_ORE || 
            type === BLOCKS.IRON_ORE || type === BLOCKS.GOLD_ORE || type === BLOCKS.DIAMOND_ORE || type === BLOCKS.ICE) {
            const speed = (toolInfo && toolInfo.toolType === 'pickaxe') ? toolInfo.toolSpeed : 1.0;
            return 1.4 / speed;
        }

        return 0.30;
    }

    populateChunkData(cx, cz) {
        const chunkKey = `${cx},${cz}`;
        if (this.populatedChunks.has(chunkKey)) return;
        this.populatedChunks.add(chunkKey);

        const size = this.chunkSize;
        const SEA_LEVEL = 11; // Nível fixo do lago

        for (let x = 0; x < size; x++) {
            for (let z = 0; z < size; z++) {
                const wx = cx * size + x;
                const wz = cz * size + z;

                const tempNoise = this.noise.noise2D(wx * 0.003, wz * 0.003);
                const humidityNoise = this.noise.noise2D(wx * 0.005 + 500, wz * 0.005 + 500);

                const isSnowBiome = (tempNoise < -0.25);
                const isDesertBiome = (tempNoise > 0.35);
                const isForestBiome = (!isSnowBiome && !isDesertBiome && humidityNoise > 0.15);

                // --- RELEVO CONTINENTAL (PREDOMINÂNCIA DE TERRA FIRME) ---
                const elevNoise = this.noise.noise2D(wx * 0.012, wz * 0.012) * 8 +
                                  this.noise.noise2D(wx * 0.03, wz * 0.03) * 3;

                // Força o terreno base a ficar SEMPRE acima do nível do mar (mínimo Y = 13)
                let baseLandHeight = Math.max(13, Math.floor(16 + elevNoise));

                // --- BACIAS DE LAGOS RAROS E PONTUAIS ---
                const lakeNoise = this.noise.noise2D(wx * 0.009 + 250, wz * 0.009 + 250);
                
                // Apenas bacias profundas (ruído < -0.48) esculpem um lago no solo
                if (lakeNoise < -0.48) {
                    const depth = (lakeNoise + 0.48) * 16; 
                    baseLandHeight = Math.max(3, Math.floor(baseLandHeight + depth));
                }

                const h = baseLandHeight;

                // Bedrock na base
                this.worldData.set(`${wx},0,${wz}`, BLOCKS.BEDROCK);

                const maxGenY = Math.max(h, SEA_LEVEL);

                for (let y = 1; y <= maxGenY; y++) {
                    const blockKey = `${wx},${y},${wz}`;
                    if (!this.worldData.has(blockKey)) {

                        // ============================================================
                        // 1. CAVERNAS SUBTERRÂNEAS (100% SECAS)
                        // ============================================================
                        const caveRegion = this.noise.noise2D(wx * 0.008, wz * 0.008);
                        const hasCaveNetwork = (caveRegion > 0.32);

                        if (hasCaveNetwork && y > 1 && y <= 28) {
                            const scale = 0.038;

                            const n1 = this.noise.noise3D 
                                ? this.noise.noise3D(wx * scale, y * (scale * 1.3), wz * scale) 
                                : this.noise.noise2D(wx * scale + y * 0.05, wz * scale + y * 0.05);

                            const n2 = this.noise.noise3D 
                                ? this.noise.noise3D((wx + 314.1) * scale, (y + 159.2) * (scale * 1.3), (wz + 265.35) * scale) 
                                : this.noise.noise2D((wx + 314.1) * scale - y * 0.05, wz * scale + 100);

                            const tunnelDensity = Math.abs(n1) + Math.abs(n2);
                            const isSpaghettiCave = tunnelDensity < 0.072;

                            const cheeseNoise = this.noise.noise3D 
                                ? this.noise.noise3D(wx * 0.025, y * 0.03, wz * 0.025) 
                                : this.noise.noise2D(wx * 0.025 + y * 0.03, wz * 0.025);

                            const isCheeseCave = (y > 2 && y < 12 && cheeseNoise > 0.55);
                            const isCaveEntrance = (tunnelDensity < 0.025 && y <= 20);

                            if ((y < h - 5 || isCaveEntrance) && (isSpaghettiCave || isCheeseCave)) {
                                this.worldData.set(blockKey, BLOCKS.AIR);
                                continue;
                            }
                        }

                        // ============================================================
                        // 2. TERRENO SÓLIDO OU ÁGUA
                        // ============================================================
                        if (y <= h) {
                            let type = BLOCKS.STONE;

                            if (y === h) {
                                if (isSnowBiome) type = (h < SEA_LEVEL) ? BLOCKS.ICE : BLOCKS.SNOW;
                                else if (isDesertBiome) type = BLOCKS.SAND;
                                else type = (h < SEA_LEVEL) ? BLOCKS.SAND : BLOCKS.GRASS;
                            } else if (y > h - 3) {
                                if (isDesertBiome) type = BLOCKS.SAND;
                                else type = (h < SEA_LEVEL) ? BLOCKS.SAND : BLOCKS.DIRT;
                            }

                            // Veios de Minérios
                            if (type === BLOCKS.STONE && y > 1 && y < h - 2) {
                                const oreSeed = this.getSeededRandom(wx, y, wz);
                                const veinCluster = this.noise.noise2D(wx * 0.12, y * 0.12 + wz * 0.12);

                                if (veinCluster > 0.38) {
                                    if (y <= 8 && oreSeed < 0.20) type = BLOCKS.ELEMENTAL_CORE;
                                    else if (y <= 12 && oreSeed < 0.35) type = BLOCKS.DIAMOND_ORE;
                                    else if (y <= 18 && oreSeed < 0.50) type = BLOCKS.GOLD_ORE;
                                    else if (y <= 28 && oreSeed < 0.70) type = BLOCKS.IRON_ORE;
                                    else if (y <= 34) type = BLOCKS.COAL_ORE;
                                }
                            }

                            this.worldData.set(blockKey, type);
                        } 
                        else if (y <= SEA_LEVEL) {
                            // ÁGUA: Apenas preenche o oco dentro da bacia do lago
                            this.worldData.set(blockKey, isSnowBiome ? BLOCKS.ICE : BLOCKS.WATER);
                        }
                    }
                }

                // ============================================================
                // 3. VEGETAÇÃO NA TERRA SECAM
                // ============================================================
                const distToSpawn = Math.sqrt(wx * wx + wz * wz);
                const allowGen = distToSpawn > 5.5;

                if (h >= SEA_LEVEL && allowGen && !this.worldData.has(`${wx},${h+1},${wz}`)) {
                    if (isDesertBiome) {
                        if (this.getSeededRandom(wx, h, wz) < 0.02) {
                            for (let ch = 1; ch <= 3; ch++) this.worldData.set(`${wx},${h+ch},${wz}`, BLOCKS.CACTUS);
                        }
                    } else if (!isSnowBiome) {
                        const rand = this.getSeededRandom(wx, h, wz);
                        const treeChance = isForestBiome ? 0.08 : 0.018;

                        if (rand < treeChance) {
                            for (let th = 1; th <= 5; th++) this.worldData.set(`${wx},${h+th},${wz}`, BLOCKS.WOOD);
                            for (let lx = -2; lx <= 2; lx++) {
                                for (let lz = -2; lz <= 2; lz++) {
                                    for (let ly = 3; ly <= 4; ly++) {
                                        if (Math.abs(lx) === 2 && Math.abs(lz) === 2) continue;
                                        const k = `${wx+lx},${h+ly},${wz+lz}`;
                                        if (!this.worldData.has(k)) this.worldData.set(k, BLOCKS.LEAVES);
                                    }
                                }
                            }
                        } else if (rand < 0.12) {
                            this.worldData.set(`${wx},${h+1},${wz}`, BLOCKS.TALL_GRASS);
                        } else if (rand < 0.16) {
                            this.worldData.set(`${wx},${h+1},${wz}`, BLOCKS.RED_FLOWER);
                        }
                    }
                }
            }
        }

        // ============================================================
        // 4. SPAWN DE RUÍNAS METÁLICAS
        // ============================================================
        const ruinChance = this.getSeededRandom(cx * 43.12, 888, cz * 91.23);
        const distFromSpawnChunk = Math.sqrt(cx * cx + cz * cz);

        if (ruinChance < 0.006 && distFromSpawnChunk > 6.0) {
            const rx = cx * size + 8;
            const rz = cz * size + 8;
            const ry = this.getHighestBlockY(rx, rz);

            if (ry > SEA_LEVEL + 1) {
                this.generateRuinStructure(rx, ry, rz);
            }
        }
    }

    generateChunkGeometry(cx, cz) {
        for (let dx = -1; dx <= 1; dx++) {
            for (let dz = -1; dz <= 1; dz++) {
                this.populateChunkData(cx + dx, cz + dz);
            }
        }

        const size = this.chunkSize;
        
        const posS = []; const normS = []; const uvsS = []; const colS = []; const indS = [];
        let idxS = 0;

        const posP = []; const normP = []; const uvsP = []; const colP = []; const indP = [];
        let idxP = 0;

        const posW = []; const normW = []; const uvsW = []; const colW = []; const indW = [];
        let idxW = 0;

        const faces = [
            { dir: [1, 0, 0], corners: [[1,0,1],[1,0,0],[1,1,0],[1,1,1]], tileKey: 'side' },
            { dir: [-1, 0, 0], corners: [[0,0,0],[0,0,1],[0,1,1],[0,1,0]], tileKey: 'side' },
            { dir: [0, 1, 0], corners: [[0,1,1],[1,1,1],[1,1,0],[0,1,0]], tileKey: 'top' },
            { dir: [0, -1, 0], corners: [[0,0,0],[1,0,0],[1,0,1],[0,0,1]], tileKey: 'bottom' },
            { dir: [0, 0, 1], corners: [[0,0,1],[1,0,1],[1,1,1],[0,1,1]], tileKey: 'front' }, // <-- MUDADO PARA 'front'
            { dir: [0, 0, -1], corners: [[1,0,0],[0,0,0],[0,1,0],[1,1,0]], tileKey: 'side' }
        ];

        for (let x = 0; x < size; x++) {
            for (let z = 0; z < size; z++) {
                const wx = cx * size + x;
                const wz = cz * size + z;

                for (let y = 0; y <= 38; y++) {
                    const type = this.getBlock(wx, y, wz);
                    if (type === BLOCKS.AIR || type === BLOCKS.DOOR) continue;

                    const bInfo = BLOCK_TILES[type];
                    const isWater = (type === BLOCKS.WATER);

                    if (bInfo.plant) {
                        const tileCoord = bInfo.top;
                        const uMin = tileCoord[0] * (16 / 128);
                        const vMin = 1.0 - ((tileCoord[1] + 1) * (16 / 128));
                        const uMax = uMin + (16 / 128);
                        const vMax = vMin + (16 / 128);

                        posP.push(wx+0.1, y, wz+0.1,  wx+0.9, y, wz+0.9,  wx+0.9, y+1, wz+0.9,  wx+0.1, y+1, wz+0.1);
                        uvsP.push(uMin, vMin, uMax, vMin, uMax, vMax, uMin, vMax);
                        for (let k=0; k<4; k++) { normP.push(0, 1, 0); colP.push(1, 1, 1); }
                        indP.push(idxP, idxP+1, idxP+2, idxP, idxP+2, idxP+3);
                        idxP += 4;

                        posP.push(wx+0.1, y, wz+0.9,  wx+0.9, y, wz+0.1,  wx+0.9, y+1, wz+0.1,  wx+0.1, y+1, wz+0.9);
                        uvsP.push(uMin, vMin, uMax, vMin, uMax, vMax, uMin, vMax);
                        for (let k=0; k<4; k++) { normP.push(0, 1, 0); colP.push(1, 1, 1); }
                        indP.push(idxP, idxP+1, idxP+2, idxP, idxP+2, idxP+3);
                        idxP += 4;

                        posP.push(wx+0.5, y, wz+0.0,  wx+0.5, y, wz+1.0,  wx+0.5, y+1, wz+1.0,  wx+0.5, y+1, wz+0.0);
                        uvsP.push(uMin, vMin, uMax, vMin, uMax, vMax, uMin, vMax);
                        for (let k=0; k<4; k++) { normP.push(0, 1, 0); colP.push(1, 1, 1); }
                        indP.push(idxP, idxP+1, idxP+2, idxP, idxP+2, idxP+3);
                        idxP += 4;

                        continue;
                    }

                    const targetPos = isWater ? posW : posS;
                    const targetNorm = isWater ? normW : normS;
                    const targetUvs = isWater ? uvsW : uvsS;
                    const targetCol = isWater ? colW : colS;
                    const targetInd = isWater ? indW : indS;

                    for (let f of faces) {
                        const nx = wx + f.dir[0];
                        const ny = y + f.dir[1];
                        const nz = wz + f.dir[2];
                        const neighbor = this.getBlock(nx, ny, nz);

                        let isNeighborTransparent = false;
                        if (isWater) {
                            isNeighborTransparent = (neighbor === BLOCKS.AIR);
                        } else {
                            isNeighborTransparent = isTransparentBlock(neighbor);
                        }

                        if (isNeighborTransparent) {
                            const currentIdx = isWater ? idxW : idxS;
                            for (let c of f.corners) {
                                targetPos.push(wx + c[0], y + c[1], wz + c[2]);
                                targetNorm.push(...f.dir);

                                const aoVal = isWater ? 1.0 : (0.82 + (c[1] * 0.18));
                                targetCol.push(aoVal, aoVal, aoVal);
                            }

                            // Substitua a linha antiga do tileCoord por esta:
                            const tileCoord = (f.tileKey === 'front' && bInfo.front) 
                                ? bInfo.front 
                                : (bInfo[f.tileKey] || bInfo.side || bInfo.top);
                            const uMin = tileCoord[0] * (16 / 128);
                            const vMin = 1.0 - ((tileCoord[1] + 1) * (16 / 128));
                            const uMax = uMin + (16 / 128);
                            const vMax = vMin + (16 / 128);

                            targetUvs.push(uMin, vMin, uMax, vMin, uMax, vMax, uMin, vMax);
                            targetInd.push(currentIdx, currentIdx + 1, currentIdx + 2, currentIdx, currentIdx + 2, currentIdx + 3);

                            if (isWater) idxW += 4;
                            else idxS += 4;
                        }
                    }
                }
            }
        }

        const solidGeo = new THREE.BufferGeometry();
        solidGeo.setAttribute('position', new THREE.Float32BufferAttribute(posS, 3));
        solidGeo.setAttribute('normal', new THREE.Float32BufferAttribute(normS, 3));
        solidGeo.setAttribute('uv', new THREE.Float32BufferAttribute(uvsS, 2));
        solidGeo.setAttribute('color', new THREE.Float32BufferAttribute(colS, 3));
        solidGeo.setIndex(indS);

        const plantGeo = new THREE.BufferGeometry();
        plantGeo.setAttribute('position', new THREE.Float32BufferAttribute(posP, 3));
        plantGeo.setAttribute('normal', new THREE.Float32BufferAttribute(normP, 3));
        plantGeo.setAttribute('uv', new THREE.Float32BufferAttribute(uvsP, 2));
        plantGeo.setAttribute('color', new THREE.Float32BufferAttribute(colP, 3));
        plantGeo.setIndex(indP);

        const waterGeo = new THREE.BufferGeometry();
        waterGeo.setAttribute('position', new THREE.Float32BufferAttribute(posW, 3));
        waterGeo.setAttribute('normal', new THREE.Float32BufferAttribute(normW, 3));
        waterGeo.setAttribute('uv', new THREE.Float32BufferAttribute(uvsW, 2));
        waterGeo.setAttribute('color', new THREE.Float32BufferAttribute(colW, 3));
        waterGeo.setIndex(indW);

        return { solidGeo, plantGeo, waterGeo };
    }

    generateChunk(cx, cz) {
        const key = `${cx},${cz}`;
        if (this.chunks.has(key)) return;

        const { solidGeo, plantGeo, waterGeo } = this.generateChunkGeometry(cx, cz);
        
        const chunkGroup = new THREE.Group();

        if (solidGeo.attributes.position.count > 0) {
            const solidMesh = new THREE.Mesh(solidGeo, this.atlasMaterial);
            solidMesh.castShadow = true; solidMesh.receiveShadow = true;
            solidMesh.frustumCulled = false;
            chunkGroup.add(solidMesh);
        }

        if (plantGeo.attributes.position.count > 0) {
            const plantMesh = new THREE.Mesh(plantGeo, this.plantMaterial);
            plantMesh.castShadow = true; plantMesh.receiveShadow = true;
            plantMesh.frustumCulled = false;
            chunkGroup.add(plantMesh);
        }

        if (waterGeo.attributes.position.count > 0) {
            const waterMesh = new THREE.Mesh(waterGeo, this.waterMaterial);
            waterMesh.receiveShadow = true;
            waterMesh.frustumCulled = false;
            chunkGroup.add(waterMesh);
        }

        this.scene.add(chunkGroup);
        this.chunks.set(key, chunkGroup);
    }

    rebuildChunkAtBlock(x, y, z) {
        const cx = Math.floor(x / this.chunkSize);
        const cz = Math.floor(z / this.chunkSize);

        const localX = ((x % this.chunkSize) + this.chunkSize) % this.chunkSize;
        const localZ = ((z % this.chunkSize) + this.chunkSize) % this.chunkSize;

        const chunksToRebuild = new Set();
        chunksToRebuild.add(`${cx},${cz}`);

        if (localX === 0) {
            chunksToRebuild.add(`${cx - 1},${cz}`);
            if (localZ === 0) chunksToRebuild.add(`${cx - 1},${cz - 1}`);
            if (localZ === 15) chunksToRebuild.add(`${cx - 1},${cz + 1}`);
        }
        if (localX === 15) {
            chunksToRebuild.add(`${cx + 1},${cz}`);
            if (localZ === 0) chunksToRebuild.add(`${cx + 1},${cz - 1}`);
            if (localZ === 15) chunksToRebuild.add(`${cx + 1},${cz + 1}`);
        }
        if (localZ === 0) chunksToRebuild.add(`${cx},${cz - 1}`);
        if (localZ === 15) chunksToRebuild.add(`${cx},${cz + 1}`);

        for (let key of chunksToRebuild) {
            const [rcx, rcz] = key.split(',').map(Number);
            this.rebuildSingleChunk(rcx, rcz);
        }
    }

    rebuildSingleChunk(cx, cz) {
        const key = `${cx},${cz}`;
        if (this.chunks.has(key)) {
            const oldGroup = this.chunks.get(key);
            this.scene.remove(oldGroup);
            oldGroup.traverse((child) => {
                if (child.geometry) child.geometry.dispose();
            });
            this.chunks.delete(key);
        }
        this.generateChunk(cx, cz);
    }

    updateChunks() {
        const px = Math.floor(this.position.x / this.chunkSize);
        const pz = Math.floor(this.position.z / this.chunkSize);

        for (let [key, group] of this.chunks.entries()) {
            const [cx, cz] = key.split(',').map(Number);
            if (Math.abs(cx - px) > this.renderDistance + 1 || Math.abs(cz - pz) > this.renderDistance + 1) {
                this.scene.remove(group);
                group.traverse((child) => {
                    if (child.geometry) child.geometry.dispose();
                });
                this.chunks.delete(key);
            }
        }

        for (let x = -this.renderDistance; x <= this.renderDistance; x++) {
            for (let z = -this.renderDistance; z <= this.renderDistance; z++) {
                this.generateChunk(px + x, pz + z);
            }
        }
    }

    getTargetBlock() {
        try {
            const raycaster = new THREE.Raycaster();
            raycaster.setFromCamera(new THREE.Vector2(0, 0), this.camera);

            const remotePlayerMeshes = [];
            for (let [id, rp] of this.remotePlayers.entries()) {
                remotePlayerMeshes.push(rp.group);
            }
            const pvhits = raycaster.intersectObjects(remotePlayerMeshes, true);
            if (pvhits.length > 0 && pvhits[0].distance <= 4.0) {
                let topObj = pvhits[0].object;
                while (topObj && !topObj.userData.isPlayerMesh && topObj.parent) topObj = topObj.parent;
                if (topObj && topObj.userData.isPlayerMesh) {
                    return { remotePlayerId: topObj.userData.peerId };
                }
            }

            const mobMeshes = this.mobs.map(m => m.mesh).filter(m => m !== undefined);
            if (mobMeshes.length > 0) {
                const mobHits = raycaster.intersectObjects(mobMeshes, true);
                if (mobHits.length > 0 && mobHits[0].distance <= 4.0) {
                    let topObj = mobHits[0].object;
                    while (topObj && !topObj.userData.mobInstance && topObj.parent) {
                        topObj = topObj.parent;
                    }
                    if (topObj && topObj.userData.mobInstance) {
                        return { mob: topObj.userData.mobInstance };
                    }
                }
            }

            const allMeshes = [];
            for (let group of this.chunks.values()) {
                group.children.forEach(child => {
                    allMeshes.push(child);
                });
            }

            for (let [key, doorObj] of this.doorMeshes.entries()) {
                doorObj.group.traverse(child => {
                    if (child.isMesh) {
                        child.userData.doorKey = key;
                        allMeshes.push(child);
                    }
                });
            }

            const intersects = raycaster.intersectObjects(allMeshes, false);

            if (intersects.length > 0 && intersects[0].distance <= 5.5) {
                const hit = intersects[0];

                if (hit.object.userData && hit.object.userData.doorKey) {
                    const key = hit.object.userData.doorKey;
                    const [bx, by, bz] = key.split(',').map(Number);
                    return {
                        breakPos: new THREE.Vector3(bx, by, bz),
                        placePos: new THREE.Vector3(bx, by, bz),
                        face: hit.face,
                        isDoor: true,
                        doorKey: key
                    };
                }

                if (hit && hit.face && hit.face.normal) {
                    const norm = hit.face.normal;
                    const pBreak = hit.point.clone().sub(norm.clone().multiplyScalar(0.05));
                    const pPlace = hit.point.clone().add(norm.clone().multiplyScalar(0.05));

                    const bx = Math.floor(pBreak.x);
                    const by = Math.floor(pBreak.y);
                    const bz = Math.floor(pBreak.z);

                    return {
                        breakPos: new THREE.Vector3(bx, by, bz),
                        placePos: new THREE.Vector3(Math.floor(pPlace.x), Math.floor(pPlace.y), Math.floor(pPlace.z)),
                        face: hit.face
                    };
                }
            }
        } catch (e) {}
        return null;
    }

    // ============================================================
    // OTIMIZAÇÃO DE BLOCOS RECEBIDOS PELA REDE (CLIENTE LAN)
    // ============================================================

    applyRemoteBlock(x, y, z, blockType, rotY = null) {
        this.setBlockModified(x, y, z, blockType, rotY, true);

        // Em vez de reconstruir o chunk imediatamente para cada pacote de rede,
        // marca o chunk na fila para reconstruir uma única vez no final do frame
        if (!this.pendingRemoteChunks) this.pendingRemoteChunks = new Set();
        this.markChunkForRebuild(x, z, this.pendingRemoteChunks);

        const isDoor = (blockType === 8 || (typeof BLOCKS !== 'undefined' && blockType === BLOCKS.DOOR));
        if (isDoor && rotY !== null && rotY !== undefined) {
            const key = `${Math.floor(x)},${Math.floor(y)},${Math.floor(z)}`;
            if (this.doorMeshes && this.doorMeshes.has(key)) {
                const oldDoor = this.doorMeshes.get(key);
                if (oldDoor.mesh) this.scene.remove(oldDoor.mesh);
                if (oldDoor.group) this.scene.remove(oldDoor.group);
                this.doorMeshes.delete(key);
            }
            this.createDoorMesh(x, y, z, rotY, false);
        }
    }

    processPendingRemoteRebuilds() {
        if (!this.pendingRemoteChunks || this.pendingRemoteChunks.size === 0) return;

        for (let key of this.pendingRemoteChunks) {
            const [rcx, rcz] = key.split(',').map(Number);
            this.rebuildSingleChunk(rcx, rcz);
        }
        this.pendingRemoteChunks.clear();
    }

    executeBlockBreak(target) {
        const bx = target.breakPos.x, by = target.breakPos.y, bz = target.breakPos.z;
        const type = this.getBlock(bx, by, bz);

        if (type !== BLOCKS.AIR && type !== BLOCKS.WATER && !BLOCK_TILES[type]?.unbreakable) {
            if (type === BLOCKS.DOOR) {
                this.removeDoorMesh(bx, by, bz);
            }

            // [NOVO] Se destruir uma Fornalha ou Baú, dropa todos os itens guardados no chão
            const key = `${bx},${by},${bz}`;
            if (type === BLOCKS.FURNACE && this.furnaceData.has(key)) {
                const fData = this.furnaceData.get(key);
                fData.slots.forEach(slot => {
                    if (slot && slot.count > 0) {
                        this.spawnDroppedItem(bx + 0.5, by + 0.5, bz + 0.5, slot.id, slot.count);
                    }
                });
                this.furnaceData.delete(key);
            }

            if (type === BLOCKS.CHEST && this.chestData.has(key)) {
                const cSlots = this.chestData.get(key);
                cSlots.forEach(slot => {
                    if (slot && slot.count > 0) {
                        this.spawnDroppedItem(bx + 0.5, by + 0.5, bz + 0.5, slot.id, slot.count);
                    }
                });
                this.chestData.delete(key);
            }

            const pColor = BLOCK_PARTICLE_COLORS[type] || 0x8b5a2b;
            this.particleSystem.createBlockBreakParticles(bx + 0.5, by + 0.5, bz + 0.5, pColor);

            this.setBlockModified(bx, by, bz, BLOCKS.AIR);
            this.sound.playBreak();

            let dropType = (type === BLOCKS.STONE) ? BLOCKS.COBBLE : type;
            this.spawnDroppedItem(bx + 0.5, by + 0.3, bz + 0.5, dropType, 1);
            this.notify(`Coletou: ${BLOCK_TILES[dropType]?.name || 'Item'}`);

            this.rebuildChunkAtBlock(bx, by, bz);
            this.miningCooldown = 0.20;
            this.miningTimer = 0;
            this.currentMiningKey = null;

            // Se houver água ao lado do bloco destruído, a água começa a fluir para o espaço aberto
            const adjacentCoords = [
                [bx + 1, by, bz], [bx - 1, by, bz],
                [bx, by + 1, bz], [bx, by - 1, bz],
                [bx, by, bz + 1], [bx, by, bz - 1]
            ];
            for (let [ax, ay, az] of adjacentCoords) {
                if (this.getBlock(ax, ay, az) === BLOCKS.WATER) {
                    this.triggerWaterFlow(ax, ay, az, 0);
                }
            }
        }
    }

    handlePrimaryAction(isInitialClick = false) {
        const item = this.hotbarSlots[this.selectedSlot];

        if (isInitialClick) {
            this.playerHand.swing();

            if (item && item.id === BLOCKS.BOW) {
                const dir = new THREE.Vector3();
                this.camera.getWorldDirection(dir);
                const myId = this.network.myPeerId;
                this.spawnArrowFromNetwork(this.position.x, this.position.y - 0.2, this.position.z, dir.x, dir.y, dir.z, myId);
                this.network.sendShootArrow(this.position.x, this.position.y - 0.2, this.position.z, dir.x, dir.y, dir.z, myId);
                this.notify("🏹 Disparou uma Flecha!");
                return;
            }

            const target = this.getTargetBlock();

            if (target && target.remotePlayerId) {
                const damage = (item && BLOCK_TILES[item.id]?.toolType === 'sword') ? BLOCK_TILES[item.id].toolDamage : 2;
                const dir = new THREE.Vector3();
                this.camera.getWorldDirection(dir);
                dir.y = 0;
                dir.normalize();

                this.network.sendHitPlayer(target.remotePlayerId, damage, { x: dir.x, z: dir.z });
                this.particleSystem.createMobHitParticles(this.position.x, this.position.y, this.position.z);
                this.notify("⚔️ Atacou outro jogador!");
                return;
            }

            if (target && target.mob) {
                const damage = (item && BLOCK_TILES[item.id]?.toolType === 'sword') ? BLOCK_TILES[item.id].toolDamage : 2;
                this.network.sendHitMob(target.mob.id, damage);
                if (item && BLOCK_TILES[item.id]?.toolType === 'sword') {
                    this.notify("⚔️ Ataque crítico com a Espada!");
                }
                return;
            }

            if (target && target.breakPos) {
                const type = this.getBlock(target.breakPos.x, target.breakPos.y, target.breakPos.z);
                const reqTime = this.getBlockHardness(type, item);
                if (reqTime <= 0.10) {
                    this.executeBlockBreak(target);
                    return;
                }
            }
        }
    }

    updateMining(delta) {
        if (this.miningCooldown > 0) {
            this.miningCooldown -= delta;
            return;
        }

        if (!this.mouseDownPrimary) return;

        const target = this.getTargetBlock();
        if (target && target.breakPos) {
            const key = `${target.breakPos.x},${target.breakPos.y},${target.breakPos.z}`;
            const type = this.getBlock(target.breakPos.x, target.breakPos.y, target.breakPos.z);
            const activeItem = this.hotbarSlots[this.selectedSlot];

            if (type === BLOCKS.AIR || type === BLOCKS.WATER) return;

            if (this.currentMiningKey !== key) {
                this.currentMiningKey = key;
                this.miningTimer = 0;
            }

            const reqTime = this.getBlockHardness(type, activeItem);
            this.miningTimer += delta;

            if (Math.random() < 0.25) {
                const pColor = BLOCK_PARTICLE_COLORS[type] || 0x8b5a2b;
                this.particleSystem.createBlockBreakParticles(target.breakPos.x + 0.5, target.breakPos.y + 0.5, target.breakPos.z + 0.5, pColor);
            }

            if (this.miningTimer >= reqTime) {
                this.executeBlockBreak(target);
            }
        } else {
            this.miningTimer = 0;
            this.currentMiningKey = null;
        }
    }

    handleSecondaryAction() {
        const item = this.hotbarSlots[this.selectedSlot];
        const target = this.getTargetBlock();

        // 1. Comida
        if (item && BLOCK_TILES[item.id]?.food) {
            const info = BLOCK_TILES[item.id];
            this.hunger = Math.min(100, this.hunger + info.healHunger);
            if (info.healHP) this.hp = Math.min(100, this.hp + info.healHP);
            item.count--;
            if (item.count <= 0) this.hotbarSlots[this.selectedSlot] = null;
            if (this.sound) this.sound.playEat();
            this.updateUI();
            this.notify(`Comeu ${info.name}! Fome: ${Math.round(this.hunger)}%`);
            return;
        }

        // ============================================================
        // SISTEMA DE BALDE: RECOLHER E DESPEJAR ÁGUA
        // ============================================================
        
        // A) RECOLHER ÁGUA COM BALDE VAZIO
        if (item && item.id === BLOCKS.BUCKET && target && target.breakPos) {
            const bx = target.breakPos.x, by = target.breakPos.y, bz = target.breakPos.z;
            const targetType = this.getBlock(bx, by, bz);

            if (targetType === BLOCKS.WATER) {
                // Remove o bloco de água do mapa
                this.setBlockModified(bx, by, bz, BLOCKS.AIR);
                this.rebuildChunkAtBlock(bx, by, bz);

                // Transforma 1 balde vazio em Balde com Água
                item.count--;
                if (item.count <= 0) {
                    this.hotbarSlots[this.selectedSlot] = { id: BLOCKS.WATER_BUCKET, count: 1 };
                } else {
                    this.addToInventory(BLOCKS.WATER_BUCKET, 1);
                }

                if (this.sound) this.sound.playPlace();
                this.notify("🪣 Recolheu Água para o Balde!");
                this.updateUI();
                return;
            }
        }

        // B) DESPEJAR ÁGUA COM BALDE CHEIO (OU COM O PRÓPRIO BLOCO DE ÁGUA)
        if (item && (item.id === BLOCKS.WATER_BUCKET || item.id === BLOCKS.WATER) && target && target.placePos) {
            const px = target.placePos.x, py = target.placePos.y, pz = target.placePos.z;

            // Coloca o bloco de água no mapa
            this.setBlockModified(px, py, pz, BLOCKS.WATER);
            this.rebuildChunkAtBlock(px, py, pz);

            // ACTIVAR A SIMULAÇÃO DE CASCATA
            this.triggerWaterFlow(px, py, pz, 0);

            if (item.id === BLOCKS.WATER_BUCKET) {
                this.hotbarSlots[this.selectedSlot] = { id: BLOCKS.BUCKET, count: 1 };
            } else {
                item.count--;
                if (item.count <= 0) this.hotbarSlots[this.selectedSlot] = null;
            }

            if (this.sound) this.sound.playPlace();
            this.notify("💧 Colocou Água no mapa!");
            this.updateUI();
            return;
        }

        // 2. Interação com Portas
        if (target && target.isDoor) {
            if (this.doorMeshes.has(target.doorKey)) {
                const d = this.doorMeshes.get(target.doorKey);
                const newState = !d.isOpen;
                d.isOpen = newState;
                d.targetRot = newState ? Math.PI / 2 : 0;
                
                this.network.sendToggleDoor(target.doorKey, newState);
                if (this.sound) this.sound.playPlace();
                this.notify(newState ? "🚪 Porta aberta" : "🚪 Porta fechada");
            }
            return;
        }

        // 3. Interação com Blocos Funcionais (Fornalha, Baú, Fogueira, etc.)
        if (target && target.breakPos) {
            const bx = target.breakPos.x, by = target.breakPos.y, bz = target.breakPos.z;
            const targetType = this.getBlock(bx, by, bz);
            const doorKey = `${bx},${by},${bz}`;

            if (item && item.id === BLOCKS.FLINT_STEEL) {
                const px = target.placePos.x, py = target.placePos.y, pz = target.placePos.z;
                this.setBlockModified(px, py, pz, BLOCKS.CAMPFIRE);
                if (this.sound) this.sound.playPlace();
                this.notify("🔥 Acendeu uma Fogueira com o Isqueiro!");
                this.rebuildChunkAtBlock(px, py, pz);
                return;
            }

            if (targetType === BLOCKS.CHEST) {
                this.openChestGUI(doorKey);
                return;
            }

            if (targetType === BLOCKS.CRAFTING_TABLE) {
                this.openCraftingTableGUI();
                return;
            }

            if (targetType === BLOCKS.FURNACE) {
                this.openFurnaceGUI(doorKey);
                return;
            }

            if (targetType === BLOCKS.CAMPFIRE && item && item.id === BLOCKS.RAW_MEAT) {
                item.count--;
                if (item.count <= 0) this.hotbarSlots[this.selectedSlot] = null;
                this.addToInventory(BLOCKS.COOKED_MEAT, 1);
                if (this.sound) this.sound.playPlace();
                this.updateUI();
                this.notify("Assou a Carne na Fogueira! +1 Carne Assada");
                return;
            }
        }

        // 4. Colocar o Bloco normal no Mundo
        this.placeBlock();
    }

    openChestGUI(chestKey) {
        this.activeChestKey = chestKey;
        if (!this.chestData.has(chestKey)) {
            this.chestData.set(chestKey, Array(27).fill(null));
        }

        const chestGrid = document.getElementById('chest-grid');
        chestGrid.innerHTML = '';
        for (let i = 0; i < 27; i++) {
            const slot = document.createElement('div');
            slot.className = 'gui-slot';
            slot.id = `cslot-${i}`;
            slot.innerHTML = `<div class="slot-icon"></div><span class="slot-count"></span>`;
            slot.addEventListener('mousedown', (e) => {
                e.preventDefault();
                this.handleSlotClickUnified('chest', i, e.button === 2);
            });
            slot.addEventListener('contextmenu', (e) => e.preventDefault());
            chestGrid.appendChild(slot);
        }

        const chestInvGrid = document.getElementById('chest-inv-grid');
        chestInvGrid.innerHTML = '';
        for (let i = 0; i < 27; i++) {
            const slot = document.createElement('div');
            slot.className = 'gui-slot';
            slot.id = `cinv-${i}`;
            slot.innerHTML = `<div class="slot-icon"></div><span class="slot-count"></span>`;
            slot.addEventListener('mousedown', (e) => {
                e.preventDefault();
                this.handleSlotClickUnified('inv', i, e.button === 2);
            });
            slot.addEventListener('contextmenu', (e) => e.preventDefault());
            chestInvGrid.appendChild(slot);
        }

        this.updateChestUI();
        document.getElementById('chest-screen').style.display = 'flex';
        this.controls.unlock();
    }

    handleSlotClick(type, index) {
        this.handleSlotClickUnified(type, index, false);
    }

    updateChestUI() {
        if (this.activeChestKey && this.chestData.has(this.activeChestKey)) {
            const chestSlots = this.chestData.get(this.activeChestKey);
            for (let i = 0; i < 27; i++) {
                const slot = document.getElementById(`cslot-${i}`);
                if (!slot) continue;
                const item = chestSlots[i];
                const iconEl = slot.querySelector('.slot-icon');
                const countEl = slot.querySelector('.slot-count');

                if (item && item.count > 0 && BLOCK_ICONS[item.id]) {
                    iconEl.style.backgroundImage = `url(${BLOCK_ICONS[item.id]})`;
                    countEl.innerText = item.count;
                } else {
                    iconEl.style.backgroundImage = 'none';
                    countEl.innerText = '';
                }
            }

            for (let i = 0; i < 27; i++) {
                const slot = document.getElementById(`cinv-${i}`);
                if (!slot) continue;
                const item = this.inventorySlots[i];
                const iconEl = slot.querySelector('.slot-icon');
                const countEl = slot.querySelector('.slot-count');

                if (item && item.count > 0 && BLOCK_ICONS[item.id]) {
                    iconEl.style.backgroundImage = `url(${BLOCK_ICONS[item.id]})`;
                    countEl.innerText = item.count;
                } else {
                    iconEl.style.backgroundImage = 'none';
                    countEl.innerText = '';
                }
            }
        }
        this.updateUI();
    }

    addToInventory(typeId, count = 1) {
        const maxStack = 64;
        let remaining = count;

        for (let i = 0; i < this.hotbarSlots.length; i++) {
            let s = this.hotbarSlots[i];
            if (s && s.id === typeId && s.count < maxStack) {
                const space = maxStack - s.count;
                const add = Math.min(space, remaining);
                s.count += add;
                remaining -= add;
                if (remaining <= 0) { this.updateUI(); return; }
            }
        }

        for (let i = 0; i < this.inventorySlots.length; i++) {
            let s = this.inventorySlots[i];
            if (s && s.id === typeId && s.count < maxStack) {
                const space = maxStack - s.count;
                const add = Math.min(space, remaining);
                s.count += add;
                remaining -= add;
                if (remaining <= 0) { this.updateUI(); return; }
            }
        }

        let emptyH = this.hotbarSlots.findIndex(s => s === null);
        if (emptyH !== -1) {
            const add = Math.min(maxStack, remaining);
            this.hotbarSlots[emptyH] = { id: typeId, count: add };
            remaining -= add;
            if (remaining <= 0) { this.updateUI(); return; }
        }

        let emptyI = this.inventorySlots.findIndex(s => s === null);
        if (emptyI !== -1) {
            const add = Math.min(maxStack, remaining);
            this.inventorySlots[emptyI] = { id: typeId, count: add };
            remaining -= add;
            if (remaining <= 0) { this.updateUI(); return; }
        }

        if (remaining > 0) {
            this.spawnDroppedItem(this.position.x, this.position.y, this.position.z, typeId, remaining);
        }

        this.updateUI();
    }

    placeBlock() {
        const target = this.getTargetBlock();
        const item = this.hotbarSlots[this.selectedSlot];
        if (target && target.placePos && item && item.count > 0) {
            if (BLOCK_TILES[item.id]?.isTool) return;

            const px = target.placePos.x, py = target.placePos.y, pz = target.placePos.z;

            const pMinX = this.position.x - this.playerRadius, pMaxX = this.position.x + this.playerRadius;
            const pMinY = this.position.y - 1.62, pMaxY = this.position.y + 0.18;
            const pMinZ = this.position.z - this.playerRadius, pMaxZ = this.position.z + this.playerRadius;

            if (px + 1 > pMinX && px < pMaxX && py + 1 > pMinY && py < pMaxY && pz + 1 > pMinZ && pz < pMaxZ) {
                return;
            }

            this.setBlockModified(px, py, pz, item.id);

            if (item.id === BLOCKS.DOOR) {
                const THREE_REF = window.THREE || (typeof THREE !== 'undefined' ? THREE : null);
                let doorRotation = 0;

                if (THREE_REF && this.camera) {
                    if (this.scene) this.scene.updateMatrixWorld(true);
                    const dir = new THREE_REF.Vector3();
                    this.camera.getWorldDirection(dir);
                    const rawAngle = Math.atan2(dir.x, dir.z);
                    doorRotation = Math.round(rawAngle / (Math.PI / 2)) * (Math.PI / 2) + (Math.PI / 2);
                }

                if (!window.DoorRotationMemory) window.DoorRotationMemory = new Map();
                window.DoorRotationMemory.set(`${px},${py},${pz}`, doorRotation);

                this.createDoorMesh(px, py, pz, doorRotation, false);
            }

            item.count--;
            if (this.sound) this.sound.playPlace();
            this.updateUI();

            this.rebuildChunkAtBlock(px, py, pz);
        }
    }

    pickBlock() {
        const target = this.getTargetBlock();
        if (target && target.breakPos) {
            const type = this.getBlock(target.breakPos.x, target.breakPos.y, target.breakPos.z);
            if (type !== BLOCKS.AIR) {
                // Se focar na água, dá um Balde de Água ou o bloco de Água
                const pickedId = (type === BLOCKS.WATER) ? BLOCKS.WATER_BUCKET : type;
                this.hotbarSlots[this.selectedSlot] = { id: pickedId, count: 64 };
                this.updateUI();
            }
        }
    }

    dropDraggedItem() {
        if (this.draggedSlot && this.draggedSlot.item) {
            const dir = new THREE.Vector3();
            this.camera.getWorldDirection(dir);
            
            this.spawnDroppedItem(
                this.position.x + dir.x * 1.5,
                this.position.y,
                this.position.z + dir.z * 1.5,
                this.draggedSlot.item.id,
                this.draggedSlot.item.count
            );

            this.notify(`🗑️ Descartou ${this.draggedSlot.item.count}x item(ns)`);

            this.draggedSlot = null;
            const floatItem = document.getElementById('floating-item');
            if (floatItem) floatItem.style.display = 'none';

            this.updateUI();
            if (this.activeChestKey) this.updateChestUI();
            this.updateCraftingTableUI();
        }
    }

    returnDraggedItemToInventory() {
        if (this.draggedSlot && this.draggedSlot.item) {
            this.addToInventory(this.draggedSlot.item.id, this.draggedSlot.item.count);
            this.draggedSlot = null;
            const floatItem = document.getElementById('floating-item');
            if (floatItem) floatItem.style.display = 'none';
        }
    }

    toggleInventory() {
        const inv = document.getElementById('inventory-screen');
        const chest = document.getElementById('chest-screen');
        const craftTable = document.getElementById('crafting-table-screen');
        const furnace = document.getElementById('furnace-screen');

        const isOpen = inv.style.display === 'flex' || chest.style.display === 'flex' || 
                       craftTable.style.display === 'flex' || (furnace && furnace.style.display === 'flex');

        if (isOpen) {
            this.returnDraggedItemToInventory();
            inv.style.display = 'none';
            chest.style.display = 'none';
            craftTable.style.display = 'none';
            if (furnace) furnace.style.display = 'none';
            this.activeChestKey = null;
            this.activeFurnaceKey = null;
            this.controls.lock();
        } else {
            inv.style.display = 'flex';
            this.controls.unlock();
        }
    }

    checkSolid(x, y, z) {
        const b = this.getBlock(x, y, z);
        if (b === BLOCKS.DOOR) return false;
        return b !== BLOCKS.AIR && b !== BLOCKS.WATER && !BLOCK_TILES[b]?.plant;
    }

    checkAABBCollision(pos) {
        const r = this.playerRadius;
        const eps = 0.001;
        const minX = Math.floor(pos.x - r + eps);
        const maxX = Math.floor(pos.x + r - eps);
        const minY = Math.floor(pos.y - 1.62 + eps);
        const maxY = Math.floor(pos.y + 0.18 - eps);
        const minZ = Math.floor(pos.z - r + eps);
        const maxZ = Math.floor(pos.z + r - eps);

        for (let x = minX; x <= maxX; x++) {
            for (let y = minY; y <= maxY; y++) {
                for (let z = minZ; z <= maxZ; z++) {
                    if (this.checkSolid(x, y, z)) return true;
                }
            }
        }
        return false;
    }

    updateDayNight(delta) {
        const isClientLAN = this.network && !this.network.isHost && this.network.netConn && this.network.netConn.open;

        if (!isClientLAN) {
            // REDUZA ESTE VALOR PARA O TEMPO PASSAR MAIS DEVAGAR:
            // 0.0015 = ~11 minutos por dia (Atual)
            // 0.0008 = ~21 minutos por dia (Padrão do Minecraft clássico)
            // 0.0005 = ~33 minutos por dia
            this.dayTime += delta * 0.0008; 

            if (this.dayTime > 1.0) {
                this.dayTime -= 1.0;
                this.weatherTimer++;
                if (this.weatherTimer % 3 === 0) {
                    this.seasonIndex = (this.seasonIndex + 1) % 4;
                }
            }

            // ... (resto do código do método updateDayNight)

            const season = this.seasons[this.seasonIndex];
            if (season === 'Inverno') {
                this.currentWeather = 'Neve';
            } else if (season === 'Outono' && Math.sin(this.dayTime * Math.PI * 2) > 0.5) {
                this.currentWeather = 'Tempestade';
            } else if (season === 'Primavera' && Math.sin(this.dayTime * Math.PI * 2) > 0.7) {
                this.currentWeather = 'Chuva';
            } else {
                this.currentWeather = 'Limpo';
            }
        }

        const season = this.seasons[this.seasonIndex];
        document.getElementById('season-val').innerText = season;
        document.getElementById('weather-val').innerText = this.currentWeather;

        const angle = this.dayTime * Math.PI * 2;
        this.sun.position.x = Math.cos(angle) * 120;
        this.sun.position.y = Math.sin(angle) * 120;
        this.sun.position.z = 40;

        const sunElevation = Math.sin(angle);

        const daySky = new THREE.Color(0x7ec0ee);
        const sunsetSky = new THREE.Color(0xf97316);
        const nightSky = new THREE.Color(0x0a0f24);

        let currentSky = new THREE.Color();
        let ambientInt = 0.1;
        let sunInt = 0.0;
        let phaseName = "Dia";

        if (sunElevation > 0.2) {
            const factor = Math.min(1.0, (sunElevation - 0.2) / 0.8);
            currentSky.copy(sunsetSky).lerp(daySky, factor);
            ambientInt = THREE.MathUtils.lerp(0.35, 0.55, factor);
            sunInt = THREE.MathUtils.lerp(0.5, 1.15, factor);
            phaseName = "Dia";
        } else if (sunElevation >= -0.2) {
            const factor = (sunElevation + 0.2) / 0.4;
            currentSky.copy(nightSky).lerp(sunsetSky, factor);
            ambientInt = THREE.MathUtils.lerp(0.12, 0.35, factor);
            sunInt = THREE.MathUtils.lerp(0.1, 0.5, factor);
            phaseName = sunElevation > 0 ? "Tarde" : "Madrugada";
        } else {
            currentSky.copy(nightSky);
            ambientInt = 0.10;
            sunInt = 0.02;
            phaseName = "Noite";
        }

        if (this.currentWeather === 'Tempestade' && Math.random() < 0.008) {
            ambientInt = 2.2;
        }

        const brightFactor = (this.settings.brightness || 100) / 100;
        this.ambientLight.intensity = THREE.MathUtils.lerp(this.ambientLight.intensity, ambientInt * brightFactor, 0.08);
        this.sun.intensity = THREE.MathUtils.lerp(this.sun.intensity, sunInt * ((this.settings.shadows || 100) / 100), 0.08);

        this.scene.background.lerp(currentSky, 0.05);
        this.scene.fog.color.lerp(currentSky, 0.05);

        document.getElementById('phase-val').innerText = phaseName;
        
        const hours = Math.floor((this.dayTime * 24 + 6) % 24);
        const mins = Math.floor(((this.dayTime * 24 * 60) % 60));
        document.getElementById('time-val').innerText = `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
    }

    updateHungerAndHealth(delta, isWalking) {
        const depletionRate = isWalking ? (this.isSprinting ? 0.6 : 0.35) : 0.15;
        this.hunger = Math.max(0, this.hunger - delta * depletionRate);

        if (this.hunger <= 0) {
            this.hp = Math.max(0, this.hp - delta * 3.0);
            if (this.hp <= 0) {
                this.notify("Morreu de fome! A reaparecer...");
                this.hp = 100;
                this.hunger = 100;
                this.findSafeSpawn();
            }
        }
        this.updateUI();
    }

    updatePhysics(delta) {
        const furnaceEl = document.getElementById('furnace-screen');
        const isGuiOpen = document.getElementById('inventory-screen').style.display === 'flex' || 
                         document.getElementById('chest-screen').style.display === 'flex' || 
                         document.getElementById('crafting-table-screen').style.display === 'flex' || 
                         (furnaceEl && furnaceEl.style.display === 'flex') || // <--- ADICIONA ISTO
                         document.getElementById('start-screen').style.display !== 'none' ||
                         document.getElementById('pause-menu').style.display === 'flex' ||
                         (document.getElementById('chat-input') && document.getElementById('chat-input').style.display === 'block');
                         
// ... o resto do código da física continua normal ...

        if (isNaN(this.position.x) || isNaN(this.position.y) || isNaN(this.position.z)) {
            this.findSafeSpawn();
            this.velocity.set(0, 0, 0);
            return;
        }

        if (this.position.y < 1.62) {
            this.position.y = 1.62;
            this.velocity.y = 0;
            this.isGrounded = true;
        }

        this.autoSaveTimer -= delta;
        if (this.autoSaveTimer <= 0) {
            this.autoSaveTimer = 15.0;
            this.saveGameState();
        }

        const headBlock = this.getBlock(this.position.x, this.position.y - 0.2, this.position.z);
        const feetBlock = this.getBlock(this.position.x, this.position.y - 1.4, this.position.z);
        const isSubmerged = (headBlock === BLOCKS.WATER || feetBlock === BLOCKS.WATER);

        const underwaterOverlay = document.getElementById('underwater-overlay');
        if (underwaterOverlay) underwaterOverlay.style.display = isSubmerged ? 'block' : 'none';

        if (isSubmerged) {
            this.breathTimer = Math.max(0, this.breathTimer - delta);
            if (this.breathTimer <= 0) {
                this.takePlayerDamage(delta * 12.0, "Afogamento");
            }

            this.velocity.y -= 4.0 * delta;
            this.velocity.x *= 0.85;
            this.velocity.z *= 0.85;
            this.velocity.y *= 0.85;

            if (!isGuiOpen) {
                if (this.keys['ShiftLeft'] || this.keys['ShiftRight'] || this.keys['KeyC']) {
                    this.velocity.y = -5.5;
                } else if (this.keys['Space']) {
                    this.velocity.y = 4.5;
                }
            }
        } else {
            this.breathTimer = Math.min(10.0, this.breathTimer + delta * 4.0);
            if (!this.isGrounded) {
                this.velocity.y -= 25.0 * delta;
            }
        }

        const checkDoorCollision = (pos) => {
            if (!this.doorMeshes) return false;
            
            const minX = Math.floor(pos.x - this.playerRadius);
            const maxX = Math.floor(pos.x + this.playerRadius);
            const minZ = Math.floor(pos.z - this.playerRadius);
            const maxZ = Math.floor(pos.z + this.playerRadius);
            const minY = Math.floor(pos.y - 1.62);
            const maxY = Math.floor(pos.y + 0.18);

            for (let x = minX; x <= maxX; x++) {
                for (let y = minY; y <= maxY; y++) {
                    for (let z = minZ; z <= maxZ; z++) {
                        const key1 = `${x},${y},${z}`;
                        const key2 = `${x},${y-1},${z}`;
                        
                        if (this.doorMeshes.has(key1)) {
                            if (!this.doorMeshes.get(key1).isOpen) return true;
                        }
                        if (this.doorMeshes.has(key2)) {
                            if (!this.doorMeshes.get(key2).isOpen) return true;
                        }
                    }
                }
            }
            return false;
        };

        const dy = this.velocity.y * delta;
        if (Math.abs(dy) > 0.00001) {
            this.position.y += dy;

            if (this.checkAABBCollision(this.position) || checkDoorCollision(this.position)) {
                if (dy < 0) {
                    const feetY = this.position.y - 1.62 + 0.001;
                    const solidY = Math.floor(feetY);
                    this.position.y = (solidY + 1) + 1.62;
                    this.velocity.y = 0;
                    this.isGrounded = true;
                } else if (dy > 0) {
                    const headY = this.position.y + 0.18 - 0.001;
                    const solidY = Math.floor(headY);
                    this.position.y = solidY - 0.18;
                    this.velocity.y = 0;
                }
            }
        }

        if (this.isGrounded && !this.keys['Space']) {
            const testGrounded = this.position.clone();
            testGrounded.y -= 0.02;
            if (!this.checkAABBCollision(testGrounded) && !checkDoorCollision(testGrounded)) {
                this.isGrounded = false;
            }
        }

        if (!isGuiOpen) {
            this.raycastCooldown -= delta;
            if (this.raycastCooldown <= 0) {
                this.cachedTarget = this.getTargetBlock();
                this.raycastCooldown = 0.05;
            }

            if (this.cachedTarget && this.cachedTarget.breakPos) {
                this.targetOutline.position.set(this.cachedTarget.breakPos.x + 0.5, this.cachedTarget.breakPos.y + 0.5, this.cachedTarget.breakPos.z + 0.5);
                this.targetOutline.visible = true;
                const type = this.getBlock(this.cachedTarget.breakPos.x, this.cachedTarget.breakPos.y, this.cachedTarget.breakPos.z);
                document.getElementById('target-val').innerText = BLOCK_TILES[type] ? BLOCK_TILES[type].name : 'Nenhum';
            } else {
                this.targetOutline.visible = false;
                document.getElementById('target-val').innerText = 'Nenhum';
            }
        } else {
            this.targetOutline.visible = false;
            document.getElementById('target-val').innerText = 'Nenhum';
        }

        this.velocity.x -= this.velocity.x * 10.0 * delta;
        this.velocity.z -= this.velocity.z * 10.0 * delta;

        if (!isGuiOpen) {
            const speed = isSubmerged ? 2.5 : (this.isSprinting ? 7.2 : 4.3);

            const targetFov = this.isSprinting ? 85 : 75;
            this.camera.fov = THREE.MathUtils.lerp(this.camera.fov, targetFov, 0.1);
            this.camera.updateProjectionMatrix();

            const forward = new THREE.Vector3();
            this.camera.getWorldDirection(forward);
            forward.y = 0;
            if (forward.lengthSq() > 0.0001) forward.normalize();
            else forward.set(0, 0, -1);

            const right = new THREE.Vector3();
            right.crossVectors(forward, new THREE.Vector3(0, 1, 0));
            if (right.lengthSq() > 0.0001) right.normalize();
            else right.set(1, 0, 0);

            const moveDir = new THREE.Vector3();
            if (this.keys['KeyW']) moveDir.add(forward);
            if (this.keys['KeyS']) moveDir.sub(forward);
            if (this.keys['KeyD']) moveDir.add(right);
            if (this.keys['KeyA']) moveDir.sub(right);

            const isWalking = moveDir.lengthSq() > 0.0001;
            if (isWalking) {
                moveDir.normalize();
                this.velocity.x += moveDir.x * speed * delta * 10;
                this.velocity.z += moveDir.z * speed * delta * 10;
            }

            const activeItem = this.hotbarSlots[this.selectedSlot];
            this.playerHand.update(activeItem ? activeItem.id : null, delta);
            this.updateHungerAndHealth(delta, isWalking);

            if (Math.abs(this.velocity.x) > 0.0001) {
                this.position.x += this.velocity.x * delta;
                if (this.checkAABBCollision(this.position) || checkDoorCollision(this.position)) {
                    let stepped = false;
                    if (this.isGrounded) {
                        for (let step = 0.1; step <= 0.55; step += 0.1) {
                            this.position.y += step;
                            if (!this.checkAABBCollision(this.position) && !checkDoorCollision(this.position)) {
                                stepped = true;
                                break;
                            }
                            this.position.y -= step;
                        }
                    }
                    if (!stepped) {
                        this.position.x -= this.velocity.x * delta;
                        this.velocity.x = 0;
                    }
                }
            }

            if (Math.abs(this.velocity.z) > 0.0001) {
                this.position.z += this.velocity.z * delta;
                if (this.checkAABBCollision(this.position) || checkDoorCollision(this.position)) {
                    let stepped = false;
                    if (this.isGrounded) {
                        for (let step = 0.1; step <= 0.55; step += 0.1) {
                            this.position.y += step;
                            if (!this.checkAABBCollision(this.position) && !checkDoorCollision(this.position)) {
                                stepped = true;
                                break;
                            }
                            this.position.y -= step;
                        }
                    }
                    if (!stepped) {
                        this.position.z -= this.velocity.z * delta;
                        this.velocity.z = 0;
                    }
                }
            }

            if (this.keys['Space'] && this.isGrounded && !isSubmerged) {
                this.velocity.y = 8.2;
                this.position.y += 0.05;
                this.isGrounded = false;
            }

            this.stepCooldown -= delta;
            if (isWalking && this.isGrounded && this.stepCooldown <= 0) {
                this.sound.playStep();
                this.stepCooldown = this.isSprinting ? 0.24 : 0.38;
            }
        }

        this.camera.position.copy(this.position);

        this.netSendTimer -= delta;
        if (this.netSendTimer <= 0) {
            this.netSendTimer = 0.05;

            const dir = new THREE.Vector3();
            this.camera.getWorldDirection(dir);
            const yaw = Math.atan2(dir.x, dir.z);

            this.network.sendPos(this.position.x, this.position.y, this.position.z, yaw);

            if (this.network.isHost) {
                const mobsData = this.mobs.map(m => {
                    const pos = m.mesh ? m.mesh.position : (m.position || new THREE.Vector3());
                    const rot = m.mesh ? m.mesh.rotation.y : m.rotation;
                    return { id: m.id, type: m.type, x: pos.x, y: pos.y, z: pos.z, rotY: rot, hp: m.hp, fuseTimer: m.fuseTimer || 0 };
                });
                this.network.sendMobsSync(mobsData);
            }
        }

        this.worldSyncTimer -= delta;
        if (this.worldSyncTimer <= 0) {
            this.worldSyncTimer = 1.0;
            if (this.network.isHost) {
                this.network.sendWorldSync(this.dayTime, this.seasonIndex, this.currentWeather);
            }
        }

        document.getElementById('pos-val').innerText = `${this.position.x.toFixed(1)} / ${this.position.y.toFixed(1)} / ${this.position.z.toFixed(1)}`;
    }

    animate(timestamp) {
        if (!this.isRunning) return;
        requestAnimationFrame((t) => this.animate(t));

        const delta = Math.min((timestamp - (this.lastTime || timestamp)) / 1000, 0.1);
        this.lastTime = timestamp;

        // --- ATUALIZA A ANIMAÇÃO DA ÁGUA NA PLACA DE VÍDEO ---
        this.waterTime = (this.waterTime || 0) + delta;
        if (this.waterShader) {
            this.waterShader.uniforms.uTime.value = this.waterTime;
        }

        const isLAN = this.network && (this.network.isHost || (this.network.netConn && this.network.netConn.open));
        const isClientLAN = this.network && !this.network.isHost && this.network.netConn && this.network.netConn.open;

        if (!isLAN && (this.isPaused || document.getElementById('pause-menu').style.display === 'flex')) {
            return;
        }

        try {
            this.updatePhysics(delta);
            this.updateDayNight(delta);
            this.updateClouds(delta);
            this.updateChunks();
            this.updateMining(delta);
            this.particleSystem.update(delta);
            this.weatherSystem.update(delta, this.position, this.currentWeather);
            this.updateFurnaces(delta);
            this.updateWaterFlow(delta);
            this.processPendingRemoteRebuilds(); // <-- ATUALIZA OS CHUNKS DO CLIENTE DE FORMA AGRUPADA

            if (this.doorMeshes) {
                for (let d of this.doorMeshes.values()) {
                    const target = d.targetRot || 0;
                    if (d.doorGroup) {
                        d.doorGroup.rotation.y += (target - d.doorGroup.rotation.y) * 0.2;
                    }
                }
            }

            this.spawnNightMobs(delta);

            this.mobs.forEach(mob => {
                if (isClientLAN) {
                    if (mob.targetPos) {
                        const pos = mob.mesh ? mob.mesh.position : mob.position;
                        if (pos) pos.lerp(mob.targetPos, 0.3);
                        if (mob.mesh) mob.mesh.rotation.y = lerpAngle(mob.mesh.rotation.y, mob.rotY !== undefined ? mob.rotY : mob.rotation, 0.3);
                        if (mob.velocity) mob.velocity.set(0, 0, 0);
                    }
                    mob.update(delta);
                } else {
                    mob.update(delta);
                    mob.targetPos = mob.targetPos || new THREE.Vector3();
                    const pos = mob.mesh ? mob.mesh.position : mob.position;
                    if (pos) mob.targetPos.copy(pos);
                }
            });

            this.fishes.forEach(fish => fish.update(delta, this));

            if (this.droppedItems) {
                for (let i = this.droppedItems.length - 1; i >= 0; i--) {
                    if (this.droppedItems[i].update(delta)) {
                        this.droppedItems.splice(i, 1);
                    }
                }
            }

            for (let [id, rp] of this.remotePlayers.entries()) {
                const isMoving = rp.group.position.distanceTo(rp.targetPos) > 0.05;

                rp.group.position.lerp(rp.targetPos, 0.2);
                rp.group.rotation.y = lerpAngle(rp.group.rotation.y, rp.rotY, 0.2);

                const limbs = rp.group.userData.limbs;
                if (limbs) {
                    if (isMoving) {
                        rp.group.userData.walkAnimTimer += delta * 10.0;
                        const swing = Math.sin(rp.group.userData.walkAnimTimer) * 0.7;
                        limbs.armL.rotation.x = -swing;
                        limbs.armR.rotation.x = swing;
                        limbs.legL.rotation.x = swing;
                        limbs.legR.rotation.x = -swing;
                    } else {
                        limbs.armL.rotation.x = THREE.MathUtils.lerp(limbs.armL.rotation.x, 0, 0.2);
                        limbs.armR.rotation.x = THREE.MathUtils.lerp(limbs.armR.rotation.x, 0, 0.2);
                        limbs.legL.rotation.x = THREE.MathUtils.lerp(limbs.legL.rotation.x, 0, 0.2);
                        limbs.legR.rotation.x = THREE.MathUtils.lerp(limbs.legR.rotation.x, 0, 0.2);
                    }
                }
            }

            for (let [key, door] of this.doorMeshes.entries()) {
                door.group.rotation.y = THREE.MathUtils.lerp(door.group.rotation.y, door.targetRot, 0.2);
            }

            if (this.arrows && this.arrows.length > 0) {
                for (let i = this.arrows.length - 1; i >= 0; i--) {
                    const arrow = this.arrows[i];
                    if (arrow && typeof arrow.update === 'function') {
                        if (arrow.update(delta)) {
                            this.arrows.splice(i, 1);
                        }
                    } else {
                        this.arrows.splice(i, 1);
                    }
                }
            }
        } catch (e) {
            console.error("Erro no loop de animação:", e);
        }

        if (delta > 0) {
            document.getElementById('fps-val').innerText = Math.round(1 / delta);
        }
        this.renderer.render(this.scene, this.camera);
    }

    openFurnaceGUI(furnaceKey) {
        this.activeFurnaceKey = furnaceKey;

        if (!this.furnaceData.has(furnaceKey)) {
            this.furnaceData.set(furnaceKey, {
                slots: [null, null, null],
                burnTime: 0,
                maxBurnTime: 1,
                cookProgress: 0
            });
        }

        let screen = document.getElementById('furnace-screen');
        if (screen) screen.remove();

        screen = document.createElement('div');
        screen.id = 'furnace-screen';
        // Usamos position: fixed e 100vw/100vh para centralizar perfeitamente no navegador
        screen.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
            background: rgba(0,0,0,0.75); display: flex; justify-content: center;
            align-items: center; z-index: 1200; font-family: 'Press Start 2P', monospace;
            pointer-events: auto;
        `;
        
        screen.innerHTML = `
            <div style="background: #c6c6c6; border: 4px solid #000; padding: 20px; color: #333; width: 380px; box-shadow: inset -4px -4px 0px 0px #555, inset 4px 4px 0px 0px #fff; image-rendering: pixelated;">
                <h3 style="margin-top:0; text-align:left; font-size:16px; font-weight:normal; margin-bottom:20px;">Fornalha</h3>
                
                <div style="display:flex; justify-content:center; align-items:center; gap: 30px; margin-bottom: 20px;">
                    <div style="display:flex; flex-direction:column; gap:10px; align-items:center;">
                        <div id="furnace-slot-0" style="background: #8b8b8b; border: 2px solid #373737; width: 36px; height: 36px; position: relative; cursor: pointer; box-shadow: inset 2px 2px 0px 0px #111;"></div>
                        <div id="furnace-flame" style="font-size:20px; height:24px; display:flex; align-items:center; justify-content:center; text-shadow: 1px 1px 0 #000;">🔥</div>
                        <div id="furnace-slot-1" style="background: #8b8b8b; border: 2px solid #373737; width: 36px; height: 36px; position: relative; cursor: pointer; box-shadow: inset 2px 2px 0px 0px #111;"></div>
                    </div>
                    <div id="furnace-progress" style="font-size:24px; color:#555;">➔</div>
                    <div id="furnace-slot-2" style="background: #8b8b8b; border: 2px solid #373737; width: 44px; height: 44px; position: relative; cursor: pointer; box-shadow: inset 2px 2px 0px 0px #111;"></div>
                </div>

                <hr style="border-top: 2px solid #555; border-bottom: 2px solid #fff; margin-bottom: 10px;">
                
                <div id="furnace-inv-grid" style="display:grid; grid-template-columns: repeat(9, 1fr); gap:4px; margin-bottom: 8px;"></div>
                <div id="furnace-hotbar-grid" style="display:grid; grid-template-columns: repeat(9, 1fr); gap:4px;"></div>
            </div>
        `;
        
        // Anexa diretamente ao document.body para garantir centralização total
        document.body.appendChild(screen);

        screen.addEventListener('click', (e) => {
            if (e.target === screen) this.dropDraggedItem();
        });

        [0, 1, 2].forEach(i => {
            const slot = document.getElementById(`furnace-slot-${i}`);
            slot.innerHTML = '<div class="slot-icon" style="width:100%; height:100%; background-size:contain; background-repeat:no-repeat; background-position:center; pointer-events:none;"></div><span class="slot-count" style="position:absolute; bottom:2px; right:2px; font-size:12px; color:white; text-shadow:1px 1px 0 #000; pointer-events:none;"></span>';
            slot.onmousedown = (e) => { e.preventDefault(); this.handleSlotClickUnified('furnace', i, e.button === 2); };
            slot.oncontextmenu = (e) => e.preventDefault();
        });

        const invGrid = document.getElementById('furnace-inv-grid');
        for (let i = 0; i < 27; i++) {
            const slot = document.createElement('div');
            slot.style.cssText = 'background: #8b8b8b; border: 2px solid #373737; width: 34px; height: 34px; position: relative; cursor: pointer; box-shadow: inset 2px 2px 0px 0px #111;';
            slot.id = `furnace-inv-${i}`;
            slot.innerHTML = '<div class="slot-icon" style="width:100%; height:100%; background-size:contain; background-repeat:no-repeat; background-position:center; pointer-events:none;"></div><span class="slot-count" style="position:absolute; bottom:2px; right:2px; font-size:10px; color:white; text-shadow:1px 1px 0 #000; pointer-events:none;"></span>';
            slot.onmousedown = (e) => { e.preventDefault(); this.handleSlotClickUnified('inv', i, e.button === 2); };
            slot.oncontextmenu = (e) => e.preventDefault();
            invGrid.appendChild(slot);
        }

        const hotbarGrid = document.getElementById('furnace-hotbar-grid');
        for (let i = 0; i < 9; i++) {
            const slot = document.createElement('div');
            slot.style.cssText = 'background: #8b8b8b; border: 2px solid #373737; width: 34px; height: 34px; position: relative; cursor: pointer; box-shadow: inset 2px 2px 0px 0px #111;';
            slot.id = `furnace-hotbar-${i}`;
            slot.innerHTML = '<div class="slot-icon" style="width:100%; height:100%; background-size:contain; background-repeat:no-repeat; background-position:center; pointer-events:none;"></div><span class="slot-count" style="position:absolute; bottom:2px; right:2px; font-size:10px; color:white; text-shadow:1px 1px 0 #000; pointer-events:none;"></span>';
            slot.onmousedown = (e) => { e.preventDefault(); this.handleSlotClickUnified('hotbar', i, e.button === 2); };
            slot.oncontextmenu = (e) => e.preventDefault();
            hotbarGrid.appendChild(slot);
        }

        this.updateFurnaceUI();
        screen.style.display = 'flex';
        this.controls.unlock();
    }

    updateFurnaceUI() {
        if (!this.activeFurnaceKey || !this.furnaceData.has(this.activeFurnaceKey)) return;

        const furnace = this.furnaceData.get(this.activeFurnaceKey);

        // Atualiza os 3 slots da fornalha
        for (let i = 0; i < 3; i++) {
            const slot = document.getElementById(`furnace-slot-${i}`);
            if (!slot) continue;
            const item = furnace.slots[i];
            const iconEl = slot.querySelector('.slot-icon');
            const countEl = slot.querySelector('.slot-count');

            if (item && item.count > 0 && BLOCK_ICONS[item.id]) {
                if (iconEl) iconEl.style.backgroundImage = `url(${BLOCK_ICONS[item.id]})`;
                if (countEl) countEl.innerText = item.count > 1 ? item.count : '';
            } else {
                if (iconEl) iconEl.style.backgroundImage = 'none';
                if (countEl) countEl.innerText = '';
            }
        }

        // Indicador de chama acesa / apagada
        const flameEl = document.getElementById('furnace-flame');
        if (flameEl) {
            flameEl.style.opacity = furnace.burnTime > 0 ? '1.0' : '0.2';
        }

        // Indicador de seta de progresso
        const progressEl = document.getElementById('furnace-progress');
        if (progressEl) {
            const input = furnace.slots[0];
            const recipe = input ? this.getSmeltingRecipe(input.id) : null;
            if (recipe && furnace.cookProgress > 0) {
                const percent = Math.round((furnace.cookProgress / recipe.cookTime) * 100);
                progressEl.style.color = '#55ff55';
                progressEl.innerText = `➔ ${percent}%`;
            } else {
                progressEl.style.color = '#aaa';
                progressEl.innerText = '➔';
            }
        }

        // Atualiza o inventário inferior
        for (let i = 0; i < 27; i++) {
            const slot = document.getElementById(`furnace-inv-${i}`);
            if (!slot) continue;
            const item = this.inventorySlots[i];
            const iconEl = slot.querySelector('.slot-icon');
            const countEl = slot.querySelector('.slot-count');

            if (item && item.count > 0 && BLOCK_ICONS[item.id]) {
                if (iconEl) iconEl.style.backgroundImage = `url(${BLOCK_ICONS[item.id]})`;
                if (countEl) countEl.innerText = item.count;
            } else {
                if (iconEl) iconEl.style.backgroundImage = 'none';
                if (countEl) countEl.innerText = '';
            }
        }

        // Atualiza a hotbar inferior na janela da fornalha
        for (let i = 0; i < 9; i++) {
            const slot = document.getElementById(`furnace-hotbar-${i}`);
            if (!slot) continue;
            const item = this.hotbarSlots[i];
            const iconEl = slot.querySelector('.slot-icon');
            const countEl = slot.querySelector('.slot-count');

            if (item && item.count > 0 && BLOCK_ICONS[item.id]) {
                if (iconEl) iconEl.style.backgroundImage = `url(${BLOCK_ICONS[item.id]})`;
                if (countEl) countEl.innerText = item.count;
            } else {
                if (iconEl) iconEl.style.backgroundImage = 'none';
                if (countEl) countEl.innerText = '';
            }
        }

        this.updateUI();
    }

    onWindowResize() {
        if (!this.camera || !this.renderer) return;

        const updateSize = () => {
            const width = window.innerWidth;
            const height = window.innerHeight;
            this.camera.aspect = width / height;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(width, height);
        };

        updateSize();
        setTimeout(updateSize, 100);
        setTimeout(updateSize, 300);
    }
}