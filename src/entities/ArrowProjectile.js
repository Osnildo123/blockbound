const THREE = window.THREE;

export class ArrowProjectile {
    constructor(x, y, z, dir, shooterId, game) {
        if (typeof x === 'object' && x !== null && x.scene) {
            this.game = x;
            this.position = new THREE.Vector3(y, z, arguments[3]);
            this.dir = arguments[4] || new THREE.Vector3(0, 0, -1);
            this.shooterId = arguments[5];
        } else {
            this.game = game;
            this.position = new THREE.Vector3(x, y, z);
            this.dir = (dir && dir.isVector3) ? dir.clone() : new THREE.Vector3(dir?.x || 0, dir?.y || 0, dir?.z || -1);
            this.shooterId = shooterId;
        }

        if (this.dir.lengthSq() > 0.0001) this.dir.normalize();

        this.life = 0;
        this.maxLife = 5.0;
        this.speed = 28.0;

        this.mesh = this.createMesh();
        this.mesh.position.copy(this.position);

        const target = this.position.clone().add(this.dir);
        this.mesh.lookAt(target);

        if (this.game && this.game.scene) {
            this.game.scene.add(this.mesh);
        }
    }

    createMesh() {
        const group = new THREE.Group();
        
        const shaftGeo = new THREE.BoxGeometry(0.05, 0.05, 0.6);
        const shaftMat = new THREE.MeshStandardMaterial({ color: 0x8b5a2b, roughness: 0.8 });
        const shaft = new THREE.Mesh(shaftGeo, shaftMat);
        group.add(shaft);

        const tipGeo = new THREE.ConeGeometry(0.08, 0.15, 4);
        const tipMat = new THREE.MeshStandardMaterial({ color: 0x737373, roughness: 0.5 });
        const tip = new THREE.Mesh(tipGeo, tipMat);
        tip.rotation.x = Math.PI / 2;
        tip.position.z = 0.35;
        group.add(tip);

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

        const moveVec = this.dir.clone().multiplyScalar(this.speed * delta);
        this.position.add(moveVec);
        this.mesh.position.copy(this.position);

        this.dir.y -= 0.15 * delta;
        if (this.dir.lengthSq() > 0.0001) this.dir.normalize();
        const target = this.position.clone().add(this.dir);
        this.mesh.lookAt(target);

        // 1. Colisão de Flecha com Mobs (Vacas, Porcos, Galinhas, Creepers, etc.)
        if (this.game && this.game.mobs) {
            for (let mob of this.game.mobs) {
                if (mob && mob.mesh) {
                    const mobPos = mob.mesh.position;
                    const dist = this.position.distanceTo(mobPos);
                    if (dist < 1.3) {
                        if (this.game.network) {
                            this.game.network.sendHitMob(mob.id, 15);
                        } else if (typeof mob.takeDamage === 'function') {
                            mob.takeDamage(15);
                        }
                        this.destroy();
                        return true;
                    }
                }
            }
        }

        // 2. Colisão de Flecha com Jogadores Remotos
        if (this.game && this.game.remotePlayers) {
            for (let [id, rp] of this.game.remotePlayers.entries()) {
                if (rp && rp.group && id !== this.shooterId) {
                    const dist = this.position.distanceTo(rp.group.position);
                    if (dist < 1.2) {
                        if (this.game.network) {
                            this.game.network.sendHitPlayer(id, 15, { x: this.dir.x, z: this.dir.z });
                        }
                        this.destroy();
                        return true;
                    }
                }
            }
        }

        // 3. Colisão com o Jogador Local (caso a flecha venha da rede)
        if (this.game && this.shooterId && this.game.network && this.shooterId !== this.game.network.myPeerId) {
            const dist = this.position.distanceTo(this.game.position);
            if (dist < 1.0) {
                this.game.takePlayerDamage(15, "Flecha", { x: this.dir.x, z: this.dir.z });
                this.destroy();
                return true;
            }
        }

        // 4. Colisão com o Terreno
        if (this.game && typeof this.game.checkSolid === 'function') {
            const bx = Math.floor(this.position.x);
            const by = Math.floor(this.position.y);
            const bz = Math.floor(this.position.z);
            if (this.game.checkSolid(bx, by, bz)) {
                this.destroy();
                return true;
            }
        }

        return false;
    }

    destroy() {
        if (this.mesh && this.game && this.game.scene) {
            this.game.scene.remove(this.mesh);
            this.mesh.traverse(c => { if (c.geometry) c.geometry.dispose(); });
        }
    }
}