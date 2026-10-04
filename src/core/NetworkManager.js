import { lobbyManager } from './LobbyManager.js';
import { showDialog } from '../main.js';

export class NetworkManager {
    constructor(game) {
        this.game = game;
        this.peer = null;
        this.netConn = null;
        this.isHost = false;
        this.myPeerId = null;
        this.roomPassword = null;
    }

    hostGame(isPublic = true, password = null) {
        this.isHost = true;
        this.roomPassword = password ? password.trim() : null;
        this.peer = new window.Peer();

        this.peer.on('open', (id) => {
            this.myPeerId = id;
            console.log('Host criado com Peer ID:', id);

            if (isPublic) {
                const roomName = this.game.activeWorld ? this.game.activeWorld.name : 'Sobrevivência Pública';
                const hostName = this.game.activeProfile ? this.game.activeProfile.name : 'Host';
                lobbyManager.registerPublicRoom(id, roomName, hostName, 8, !!this.roomPassword);
                if (this.game.notify) {
                    this.game.notify(this.roomPassword ? "🔒 Sala Pública com Senha anunciada!" : "🌐 Sala Pública anunciada no Lobby!");
                }
            }
        });

        this.peer.on('connection', (conn) => {
            this.netConn = conn;
            this.setupConnectionListeners(conn);

            const sendAuthReq = () => {
                conn.send({
                    type: 'AUTH_REQ',
                    hasPassword: !!this.roomPassword
                });
            };

            if (conn.open) {
                sendAuthReq();
            } else {
                conn.on('open', sendAuthReq);
            }
        });
    }

    joinGame(hostPeerId) {
        this.isHost = false;
        this.peer = new window.Peer();

        this.peer.on('open', (id) => {
            this.myPeerId = id;
            this.netConn = this.peer.connect(hostPeerId);
            this.setupConnectionListeners(this.netConn);
        });
    }

    setupConnectionListeners(conn) {
        conn.on('data', (data) => {
            this.handleNetworkData(data);
        });

        const handleDisconnect = () => {
            if (conn && conn.peer && typeof this.game.removeRemotePlayer === 'function') {
                this.game.removeRemotePlayer(conn.peer);
            }
            if (this.game.notify) this.game.notify("Conexão encerrada.");
        };

        conn.on('close', handleDisconnect);
        conn.on('error', handleDisconnect);
    }

    handleNetworkData(data) {
        if (!data) return;

        if (data.type === 'LEAVE_PLAYER') {
            if (typeof this.game.removeRemotePlayer === 'function') {
                this.game.removeRemotePlayer(data.id);
            }
        }
        else if (data.type === 'AUTH_REQ') {
            if (data.hasPassword) {
                if (typeof this.game.promptRoomPassword === 'function') {
                    this.game.promptRoomPassword((enteredPass) => {
                        this.netConn.send({ type: 'AUTH_RESP', password: enteredPass });
                    });
                } else {
                    this.netConn.send({ type: 'AUTH_RESP', password: '' });
                }
            } else {
                this.netConn.send({ type: 'AUTH_RESP', password: '' });
            }
        }
        else if (data.type === 'AUTH_RESP') {
            if (this.isHost) {
                if (!this.roomPassword || this.roomPassword === data.password) {
                    const seedToSend = (this.game.activeWorld && this.game.activeWorld.seed) 
                        ? this.game.activeWorld.seed 
                        : 12345;

                    let doorsData = [];
                    if (typeof this.game.exportDoorsForNewPlayer === 'function') {
                        doorsData = this.game.exportDoorsForNewPlayer();
                    } let torchesData = [];
                    if (typeof this.game.exportTorchesForNewPlayer === 'function') {
                        torchesData = this.game.exportTorchesForNewPlayer();
                    }
                    
                    else if (this.game.doorMeshes) {
                        for (let [key, doorObj] of this.game.doorMeshes.entries()) {
                            const coords = key.split(',');
                            doorsData.push({
                                x: parseInt(coords[0]),
                                y: parseInt(coords[1]),
                                z: parseInt(coords[2]),
                                rot: window.DoorRotationMemory ? (window.DoorRotationMemory.get(key) || 0) : 0,
                                isOpen: !!doorObj.isOpen
                            });
                        }
                    }

                    this.netConn.send({
                        type: 'WORLD_INIT',
                        seed: seedToSend,
                        modifiedBlocks: Array.from(this.game.modifiedBlocks.entries()),
                        doors: doorsData,
                        torches: torchesData
                    });
                } else {
                    this.netConn.send({ type: 'AUTH_FAIL', reason: '🔒 Senha incorreta da sala!' });
                }
            }
        }
        else if (data.type === 'AUTH_FAIL') {
            const startScreen = document.getElementById('start-screen');
            if (startScreen) startScreen.style.display = 'flex';

            const publicScreen = document.getElementById('public-servers-screen');
            if (publicScreen) publicScreen.style.display = 'flex';

            showDialog({
                title: 'ACESSO RECUSADO',
                message: data.reason || 'Senha incorreta.',
                onOk: () => {
                    if (typeof this.game.destroy === 'function') {
                        this.game.destroy();
                    }
                }
            });
        }
        else if (data.type === 'WORLD_INIT') {
            const startScreen = document.getElementById('start-screen');
            if (startScreen) startScreen.style.display = 'none';

            const publicScreen = document.getElementById('public-servers-screen');
            if (publicScreen) publicScreen.style.display = 'none';

            const dialogModal = document.getElementById('dialog-modal');
            if (dialogModal) dialogModal.style.display = 'none';

            if (data.doors && Array.isArray(data.doors)) {
                if (!window.DoorRotationMemory) window.DoorRotationMemory = new Map();
                data.doors.forEach(door => {
                    const key = `${door.x},${door.y},${door.z}`;
                    window.DoorRotationMemory.set(key, door.rot);
                });
            }

            if (typeof this.game.loadHostWorld === 'function') {
                this.game.loadHostWorld(data.seed, data.modifiedBlocks);
            }

            if (data.doors && Array.isArray(data.doors)) {
            if (typeof this.game.importDoorsFromHost === 'function') {
                this.game.importDoorsFromHost(data.doors);
            }
            }
            if (data.torches && Array.isArray(data.torches)) {
                if (typeof this.game.importTorchesFromHost === 'function') {
                    this.game.importTorchesFromHost(data.torches);
                }
            }
        } 
        else if (data.type === 'CHAT_MSG') {
            if (typeof this.game.receiveChatMessage === 'function') {
                this.game.receiveChatMessage(data.sender, data.text);
            }
        }
        else if (data.type === 'POS') {
            if (typeof this.game.updateRemotePlayer === 'function') {
                this.game.updateRemotePlayer(data.id, data.x, data.y, data.z, data.rotY, data.name, data.armor);
            }
        } 
        else if (data.type === 'BLOCK') {
            const key = `${data.x},${data.y},${data.z}`;
            const isDoor = (data.blockType === 8 || (typeof BLOCKS !== 'undefined' && data.blockType === BLOCKS.DOOR));

            if (isDoor && data.rotY !== null && data.rotY !== undefined) {
                if (!window.DoorRotationMemory) window.DoorRotationMemory = new Map();
                window.DoorRotationMemory.set(key, data.rotY);
            }

            if (typeof this.game.applyRemoteBlock === 'function') {
                this.game.applyRemoteBlock(data.x, data.y, data.z, data.blockType, data.rotY);
            } else {
                this.game.worldData.set(key, data.blockType);
                this.game.modifiedBlocks.set(key, data.blockType);
                this.game.rebuildChunkAtBlock(data.x, data.y, data.z);
                if (typeof this.game.applyBlockLight === 'function') {
                    this.game.applyBlockLight(data.x, data.y, data.z, data.blockType);
                }
            }

            if (data.blockType === 0) {
                if (this.game.doorMeshes && this.game.doorMeshes.has(key)) {
                    const doorData = this.game.doorMeshes.get(key);
                    if (doorData.mesh) this.game.scene.remove(doorData.mesh);
                    if (doorData.group) this.game.scene.remove(doorData.group);
                    this.game.doorMeshes.delete(key);
                }
            } else if (isDoor && data.rotY !== null && data.rotY !== undefined) {
                if (typeof this.game.createDoorMesh === 'function') {
                    if (this.game.doorMeshes && this.game.doorMeshes.has(key)) {
                        const oldDoor = this.game.doorMeshes.get(key);
                        if (oldDoor.mesh) this.game.scene.remove(oldDoor.mesh);
                        if (oldDoor.group) this.game.scene.remove(oldDoor.group);
                        this.game.doorMeshes.delete(key);
                    }
                    this.game.createDoorMesh(data.x, data.y, data.z, data.rotY, false);
                }
            }
        }
        else if (data.type === 'SPAWN_ITEM') {
            if (typeof this.game.spawnDroppedItemFromNetwork === 'function') {
                this.game.spawnDroppedItemFromNetwork(data.x, data.y, data.z, data.itemType, data.count);
            }
        }
        else if (data.type === 'SHOOT_ARROW') {
            if (typeof this.game.spawnArrowFromNetwork === 'function') {
                this.game.spawnArrowFromNetwork(data.x, data.y, data.z, data.dx, data.dy, data.dz, data.shooterId);
            }
        } else if (data.type === 'HIT_PLAYER') {
            if (data.targetId === this.myPeerId && typeof this.game.takePlayerDamage === 'function') {
                this.game.takePlayerDamage(data.damage, data.attackerName || "Outro Jogador", data.knockbackDir);
            }
        } else if (data.type === 'HIT_MOB') {
            const mob = this.game.mobs ? this.game.mobs.find(m => m.id === data.mobId) : null;
            if (mob && typeof mob.takeDamage === 'function') mob.takeDamage(data.damage);
        } 
        else if (data.type === 'CREEPER_EXPLODE') {
            if (typeof this.game.triggerExplosionEffects === 'function') {
                this.game.triggerExplosionEffects(data.x, data.y, data.z);
            }
        }
        else if (data.type === 'TOGGLE_DOOR') {
            if (typeof this.game.toggleDoorFromNetwork === 'function') {
                this.game.toggleDoorFromNetwork(data.doorKey, data.isOpen);
            }
        } else if (data.type === 'CHEST_UPDATE') {
            if (this.game.chestData) this.game.chestData.set(data.chestKey, data.slots);
            if (this.game.activeChestKey === data.chestKey && typeof this.game.updateChestUI === 'function') {
                this.game.updateChestUI();
            }
        } else if (data.type === 'MOBS_SYNC') {
            if (typeof this.game.syncRemoteMobs === 'function') {
                this.game.syncRemoteMobs(data.mobsData);
            }
        } else if (data.type === 'WORLD_SYNC') {
            this.game.dayTime = data.dayTime;
            this.game.seasonIndex = data.seasonIndex;
            this.game.currentWeather = data.currentWeather;
        }
        else if (data.type === 'FURNACE_UPDATE') {
            if (typeof this.game.applyRemoteFurnaceUpdate === 'function') {
                this.game.applyRemoteFurnaceUpdate(data.furnaceKey, data.furnaceData);
            }
        }
        else if (data.type === 'ARMOR_UPDATE') {
            if (typeof this.game.updateRemotePlayerArmor === 'function') {
                this.game.updateRemotePlayerArmor(data.id, data.armor);
            }
        }
    }

    sendCreeperExplode(x, y, z) {
        if (this.netConn && this.netConn.open) {
            this.netConn.send({ type: 'CREEPER_EXPLODE', x, y, z });
        }
    }

    sendSpawnItem(x, y, z, itemType, count) {
        if (this.netConn && this.netConn.open) {
            this.netConn.send({ type: 'SPAWN_ITEM', x, y, z, itemType, count });
        }
    }

    sendChatMessage(text) {
        if (this.netConn && this.netConn.open) {
            const senderName = this.game.activeProfile ? this.game.activeProfile.name : 'Jogador';
            this.netConn.send({ type: 'CHAT_MSG', sender: senderName, text });
        }
    }

    sendPos(x, y, z, rotY) {
        if (this.netConn && this.netConn.open) {
            this.netConn.send({
                type: 'POS',
                id: this.myPeerId,
                name: this.game.activeProfile ? this.game.activeProfile.name : 'Jogador',
                x, y, z, rotY,
                armor: this.game.armorSlots || null
            });
        }
    }

    sendBlock(x, y, z, blockType, rotY = null) {
        if (this.netConn && this.netConn.open) {
            this.netConn.send({ type: 'BLOCK', x, y, z, blockType, rotY });
        }
    }

    sendShootArrow(x, y, z, dx, dy, dz, shooterId) {
        if (this.netConn && this.netConn.open) {
            this.netConn.send({ type: 'SHOOT_ARROW', x, y, z, dx, dy, dz, shooterId });
        }
    }

    sendHitPlayer(targetId, damage, knockbackDir = null) {
        if (this.netConn && this.netConn.open) {
            const attackerName = this.game.activeProfile ? this.game.activeProfile.name : 'Jogador';
            this.netConn.send({ type: 'HIT_PLAYER', targetId, damage, attackerName, knockbackDir });
        }
    }

    sendHitMob(mobId, damage) {
        if (this.isHost || !this.netConn) {
            const mob = this.game.mobs ? this.game.mobs.find(m => m.id === mobId) : null;
            if (mob && typeof mob.takeDamage === 'function') mob.takeDamage(damage);
        } else if (this.netConn && this.netConn.open) {
            this.netConn.send({ type: 'HIT_MOB', mobId, damage });
        }
    }

    sendToggleDoor(doorKey, isOpen) {
        if (this.netConn && this.netConn.open) {
            this.netConn.send({ type: 'TOGGLE_DOOR', doorKey, isOpen });
        }
    }

    sendChestUpdate(chestKey, slots) {
        if (this.netConn && this.netConn.open) {
            this.netConn.send({ type: 'CHEST_UPDATE', chestKey, slots });
        }
    }

    sendMobsSync(mobsData) {
        if (this.netConn && this.netConn.open) {
            this.netConn.send({ type: 'MOBS_SYNC', mobsData });
        }
    }

    sendWorldSync(dayTime, seasonIndex, currentWeather) {
        if (this.netConn && this.netConn.open) {
            this.netConn.send({ type: 'WORLD_SYNC', dayTime, seasonIndex, currentWeather });
        }
    }

    sendFurnaceUpdate(furnaceKey, furnaceData) {
        if (this.netConn && this.netConn.open) {
            this.netConn.send({ type: 'FURNACE_UPDATE', furnaceKey, furnaceData });
        }
    }

    sendArmorUpdate(armorSlots) {
        if (this.netConn && this.netConn.open) {
            this.netConn.send({ type: 'ARMOR_UPDATE', id: this.myPeerId, armor: armorSlots });
        }
    }

    destroy() {
        lobbyManager.unregisterPublicRoom();
        if (this.netConn && this.netConn.open) {
            try {
                this.netConn.send({ type: 'LEAVE_PLAYER', id: this.myPeerId });
            } catch (e) {}
            this.netConn.close();
        }
        if (this.peer) this.peer.destroy();
    }
}