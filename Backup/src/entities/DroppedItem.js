const THREE = window.THREE;
import { BLOCKS, BLOCK_TILES, ATLAS_TEXTURE } from '../config/constants.js';

export class DroppedItem {
    constructor(x, y, z, type, count = 1, game) {
        this.game = game;
        this.type = type;
        this.count = count;
        this.position = new THREE.Vector3(x, y, z);
        this.velocity = new THREE.Vector3(
            (Math.random() - 0.5) * 1.8,
            3.2,
            (Math.random() - 0.5) * 1.8
        );
        this.pickupDelay = 0.5;
        this.floatTimer = Math.random() * Math.PI * 2;
        this.isGrounded = false;
        this.despawnTimer = 300;

        this.mesh = this.createItemMesh(type);
        if (this.mesh) {
            this.mesh.position.copy(this.position);
            this.game.scene.add(this.mesh);
        }
    }

    createItemMesh(type) {
        const bInfo = BLOCK_TILES[type] || BLOCK_TILES[BLOCKS.DIRT] || { top: [2, 0] };
        const group = new THREE.Group();

        try {
            if (bInfo.plant) {
                const tileCoord = bInfo.top || [0, 0];
                const uMin = tileCoord[0] * (16 / 128);
                const vMin = 1.0 - ((tileCoord[1] + 1) * (16 / 128));
                const uMax = uMin + (16 / 128);
                const vMax = vMin + (16 / 128);

                const geo = new THREE.PlaneGeometry(0.38, 0.38);
                const uvs = geo.attributes.uv;
                uvs.setXY(0, uMin, vMax);
                uvs.setXY(1, uMax, vMax);
                uvs.setXY(2, uMin, vMin);
                uvs.setXY(3, uMax, vMin);
                uvs.needsUpdate = true;

                const mat = new THREE.MeshStandardMaterial({
                    map: ATLAS_TEXTURE,
                    side: THREE.DoubleSide,
                    transparent: true,
                    alphaTest: 0.5,
                    roughness: 0.8
                });

                const mesh = new THREE.Mesh(geo, mat);
                group.add(mesh);
            } else {
                const geo = new THREE.BoxGeometry(0.3, 0.3, 0.3);
                const uvs = geo.attributes.uv;

                const setFaceUVs = (faceIdx, tile) => {
                    if (!tile) tile = [0, 0];
                    const uMin = tile[0] * (16 / 128);
                    const vMin = 1.0 - ((tile[1] + 1) * (16 / 128));
                    const uMax = uMin + (16 / 128);
                    const vMax = vMin + (16 / 128);
                    const base = faceIdx * 4;
                    uvs.setXY(base + 0, uMin, vMax);
                    uvs.setXY(base + 1, uMax, vMax);
                    uvs.setXY(base + 2, uMin, vMin);
                    uvs.setXY(base + 3, uMax, vMin);
                };

                const topTile = bInfo.top || [0, 0];
                const sideTile = bInfo.side || topTile;
                const bottomTile = bInfo.bottom || topTile;

                setFaceUVs(0, sideTile);
                setFaceUVs(1, sideTile);
                setFaceUVs(2, topTile);
                setFaceUVs(3, bottomTile);
                setFaceUVs(4, sideTile);
                setFaceUVs(5, sideTile);
                uvs.needsUpdate = true;

                const mat = new THREE.MeshStandardMaterial({
                    map: ATLAS_TEXTURE,
                    roughness: 0.8,
                    metalness: 0.0
                });

                const mesh = new THREE.Mesh(geo, mat);
                mesh.castShadow = true;
                group.add(mesh);
            }
        } catch (e) {
            console.error("Erro ao criar mesh do item:", e);
        }

        return group;
    }

    update(delta) {
        if (!this.mesh) return true;

        this.pickupDelay -= delta;
        this.despawnTimer -= delta;

        if (this.despawnTimer <= 0) {
            this.destroy();
            return true;
        }

        this.mesh.rotation.y += delta * 2.2;

        if (!this.isGrounded) {
            this.velocity.y -= 14.0 * delta;
            this.position.x += this.velocity.x * delta;
            this.position.y += this.velocity.y * delta;
            this.position.z += this.velocity.z * delta;

            this.velocity.x *= 0.92;
            this.velocity.z *= 0.92;

            const bx = Math.floor(this.position.x);
            const by = Math.floor(this.position.y);
            const bz = Math.floor(this.position.z);

            if (this.game.checkSolid(bx, by, bz)) {
                this.position.y = by + 1.18;
                this.velocity.set(0, 0, 0);
                this.isGrounded = true;
            }
            this.mesh.position.copy(this.position);
        } else {
            this.floatTimer += delta * 3.5;
            this.mesh.position.x = this.position.x;
            this.mesh.position.z = this.position.z;
            this.mesh.position.y = this.position.y + Math.sin(this.floatTimer) * 0.06;
        }

        const playerPos = this.game.position;
        if (playerPos) {
            const dist = this.position.distanceTo(playerPos);

            if (this.pickupDelay <= 0 && dist < 2.5) {
                const targetPos = playerPos.clone().sub(new THREE.Vector3(0, 0.6, 0));
                this.position.lerp(targetPos, delta * 9.0);

                if (dist < 0.7) {
                    this.game.addToInventory(this.type, this.count);
                    this.game.sound.playPlace();
                    const name = BLOCK_TILES[this.type] ? BLOCK_TILES[this.type].name : 'Item';
                    this.game.notify(`+${this.count} ${name}`);
                    this.destroy();
                    return true;
                }
            }
        }

        return false;
    }

    destroy() {
        if (this.mesh) {
            this.game.scene.remove(this.mesh);
            this.mesh.traverse((child) => {
                if (child.geometry) child.geometry.dispose();
                if (child.material) child.material.dispose();
            });
        }
    }
}