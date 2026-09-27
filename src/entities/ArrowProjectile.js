const THREE_REF = window.THREE || (typeof THREE !== 'undefined' ? THREE : null);

export class ArrowProjectile {
    constructor(arg1, arg2, arg3, arg4, arg5, arg6) {
        const THREE = window.THREE || THREE_REF;

        // Flexibilidade para aceitar qualquer ordem de parâmetros do Engine ou da Rede
        if (typeof arg1 === 'number') {
            // Chamada padrão: (x, y, z, dir, shooterId, game)
            this.position = new THREE.Vector3(arg1, arg2, arg3);
            this.dir = (arg4 && arg4.isVector3) ? arg4.clone() : new THREE.Vector3(arg4?.x || 0, arg4?.y || 0, arg4?.z || -1);
            this.shooterId = arg5;
            this.game = arg6;
        } else if (arg1 && arg1.isVector3) {
            // Chamada com Vector3: (posVector3, dirVector3, shooterId, game)
            this.position = arg1.clone();
            this.dir = (arg2 && arg2.isVector3) ? arg2.clone() : new THREE.Vector3(0, 0, -1);
            this.shooterId = arg3;
            this.game = arg4;
        } else if (arg1 && arg1.scene) {
            // Chamada invertida: (game, pos, dir, shooterId)
            this.game = arg1;
            this.position = (arg2 && arg2.isVector3) ? arg2.clone() : new THREE.Vector3(arg2 || 0, arg3 || 0, arg4 || 0);
            this.dir = (arguments[4] && arguments[4].isVector3) ? arguments[4].clone() : new THREE.Vector3(0, 0, -1);
            this.shooterId = arguments[5];
        }

        // Garante que a direção está normalizada
        if (this.dir && this.dir.lengthSq() > 0.0001) {
            this.dir.normalize();
        } else {
            this.dir = new THREE.Vector3(0, 0, -1);
        }

        this.life = 0;
        this.maxLife = 7.0;
        this.speed = 32.0; // Velocidade do disparo
        this.isStuck = false;

        this.mesh = this.createMesh();
        if (this.mesh && this.position) {
            this.mesh.position.copy(this.position);
            const target = this.position.clone().add(this.dir);
            this.mesh.lookAt(target);
        }

        if (this.game && this.game.scene && this.mesh) {
            this.game.scene.add(this.mesh);
        }
    }

    createMesh() {
        const THREE = window.THREE || THREE_REF;
        if (!THREE) return null;

        const group = new THREE.Group();
        
        // Haste de madeira da flecha
        const shaftGeo = new THREE.BoxGeometry(0.05, 0.05, 0.6);
        const shaftMat = new THREE.MeshStandardMaterial({ color: 0x8b5a2b, roughness: 0.8 });
        const shaft = new THREE.Mesh(shaftGeo, shaftMat);
        group.add(shaft);

        // Ponta de pedra/ferro
        const tipGeo = new THREE.ConeGeometry(0.08, 0.15, 4);
        const tipMat = new THREE.MeshStandardMaterial({ color: 0x737373, roughness: 0.5 });
        const tip = new THREE.Mesh(tipGeo, tipMat);
        tip.rotation.x = Math.PI / 2;
        tip.position.z = 0.35;
        group.add(tip);

        // Pena traseira
        const featherGeo = new THREE.BoxGeometry(0.02, 0.12, 0.12);
        const featherMat = new THREE.MeshStandardMaterial({ color: 0xffffff });
        const f1 = new THREE.Mesh(featherGeo, featherMat);
        f1.position.z = -0.28;
        group.add(f1);

        return group;
    }

    update(delta) {
        if (!this.mesh || !this.position || !this.dir) return true;

        this.life += delta;
        if (this.life >= this.maxLife) {
            this.destroy();
            return true;
        }

        // Se a flecha já cravou na parede, não calcula física nem movimento
        if (this.isStuck) return false;

        // 1. Movimento e Gravidade
        const moveVec = this.dir.clone().multiplyScalar(this.speed * delta);
        this.position.add(moveVec);
        this.mesh.position.copy(this.position);

        // Gravidade suave puxando a ponta da flecha para baixo
        this.dir.y -= 0.25 * delta;
        if (this.dir.lengthSq() > 0.0001) this.dir.normalize();
        
        const target = this.position.clone().add(this.dir);
        this.mesh.lookAt(target);

        // 2. Colisão com Mobs (Inimigos / Animais)
        if (this.game && this.game.mobs && Array.isArray(this.game.mobs)) {
            for (let mob of this.game.mobs) {
                if (mob) {
                    const mobPos = mob.mesh ? mob.mesh.position : mob.position;
                    if (mobPos && this.position.distanceTo(mobPos) < 1.3) {
                        if (this.game.network && typeof this.game.network.sendHitMob === 'function') {
                            this.game.network.sendHitMob(mob.id, 15);
                        } else if (typeof mob.takeDamage === 'function') {
                            mob.takeDamage(15);
                        }

                        if (this.game.particleSystem && typeof this.game.particleSystem.createMobHitParticles === 'function') {
                            this.game.particleSystem.createMobHitParticles(mobPos.x, mobPos.y + 0.5, mobPos.z);
                        }

                        this.destroy();
                        return true;
                    }
                }
            }
        }

        // 3. Colisão com Jogadores Remotos (Multiplayer)
        if (this.game && this.game.remotePlayers) {
            const players = this.game.remotePlayers instanceof Map 
                ? this.game.remotePlayers.entries() 
                : Object.entries(this.game.remotePlayers);

            for (let [id, rp] of players) {
                if (rp && id !== this.shooterId) {
                    const pPos = rp.group ? rp.group.position : (rp.targetPos || rp.position);
                    if (pPos && this.position.distanceTo(pPos) < 1.2) {
                        if (this.game.network && typeof this.game.network.sendHitPlayer === 'function') {
                            this.game.network.sendHitPlayer(id, 15, { x: this.dir.x, z: this.dir.z });
                        }
                        this.destroy();
                        return true;
                    }
                }
            }
        }

        // 4. Colisão com o Jogador Local (Flecha vinda da rede)
        if (this.game && this.shooterId && this.game.network && this.shooterId !== this.game.network.myPeerId) {
            if (this.game.position && this.position.distanceTo(this.game.position) < 1.0) {
                if (typeof this.game.takePlayerDamage === 'function') {
                    this.game.takePlayerDamage(15, "Flecha", { x: this.dir.x, z: this.dir.z });
                }
                this.destroy();
                return true;
            }
        }

        // 5. Colisão com o Terreno Sólido
        // (Ignora os primeiros 0.04s para não cravar na cabeça do próprio jogador ao atirar)
        if (this.life > 0.04 && this.game && typeof this.game.checkSolid === 'function') {
            const bx = Math.floor(this.position.x);
            const by = Math.floor(this.position.y);
            const bz = Math.floor(this.position.z);

            if (this.game.checkSolid(bx, by, bz)) {
                this.isStuck = true; // Crava na parede
                if (this.game.sound && typeof this.game.sound.playPlace === 'function') {
                    this.game.sound.playPlace();
                }
                return false; // Mantém a flecha visível na parede até atingir o maxLife
            }
        }

        return false;
    }

    destroy() {
        if (this.mesh && this.game && this.game.scene) {
            this.game.scene.remove(this.mesh);
            this.mesh.traverse(c => {
                if (c.geometry) c.geometry.dispose();
                if (c.material) c.material.dispose();
            });
        }
    }
}