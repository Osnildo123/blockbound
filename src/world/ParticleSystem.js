export class ParticleSystem {
    constructor(scene) {
        this.scene = scene;
        this.particles = [];
    }

    createBlockBreakParticles(x, y, z, colorHex = 0x8b5a2b) {
        const count = 18;
        const geo = new THREE.BufferGeometry();
        const pos = new Float32Array(count * 3);
        const vel = [];

        for (let i = 0; i < count; i++) {
            pos[i * 3] = x + (Math.random() - 0.5) * 0.6;
            pos[i * 3 + 1] = y + (Math.random() - 0.5) * 0.6;
            pos[i * 3 + 2] = z + (Math.random() - 0.5) * 0.6;

            vel.push(new THREE.Vector3(
                (Math.random() - 0.5) * 3.5,
                Math.random() * 3.0 + 1.0,
                (Math.random() - 0.5) * 3.5
            ));
        }

        geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
        const mat = new THREE.PointsMaterial({
            size: 0.22,
            color: colorHex,
            transparent: true,
            depthWrite: false,
            opacity: 1.0
        });

        const pMesh = new THREE.Points(geo, mat);
        this.scene.add(pMesh);

        this.particles.push({
            mesh: pMesh,
            vel: vel,
            life: 0.45,
            maxLife: 0.45
        });
    }

    createMobHitParticles(x, y, z, isDeath = false) {
        const count = isDeath ? 35 : 12;
        const geo = new THREE.BufferGeometry();
        const pos = new Float32Array(count * 3);
        const vel = [];

        for (let i = 0; i < count; i++) {
            pos[i * 3] = x;
            pos[i * 3 + 1] = y + 0.5;
            pos[i * 3 + 2] = z;

            vel.push(new THREE.Vector3(
                (Math.random() - 0.5) * 4.0,
                Math.random() * 4.0 + 1.5,
                (Math.random() - 0.5) * 4.0
            ));
        }

        geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
        const mat = new THREE.PointsMaterial({
            size: 0.28,
            color: isDeath ? 0x666666 : 0xef4444,
            transparent: true,
            depthWrite: false,
            opacity: 1.0
        });

        const pMesh = new THREE.Points(geo, mat);
        this.scene.add(pMesh);

        this.particles.push({
            mesh: pMesh,
            vel: vel,
            life: isDeath ? 0.7 : 0.35,
            maxLife: isDeath ? 0.7 : 0.35
        });
    }

    createExplosion(x, y, z) {
        const count = 60;
        const geo = new THREE.BufferGeometry();
        const pos = new Float32Array(count * 3);
        const colors = new Float32Array(count * 3);
        const vel = [];

        const palette = [
            new THREE.Color(0xff4500),
            new THREE.Color(0xffcc00),
            new THREE.Color(0x333333),
            new THREE.Color(0x777777)
        ];

        for (let i = 0; i < count; i++) {
            pos[i * 3] = x;
            pos[i * 3 + 1] = y;
            pos[i * 3 + 2] = z;

            const col = palette[Math.floor(Math.random() * palette.length)];
            colors[i * 3] = col.r;
            colors[i * 3 + 1] = col.g;
            colors[i * 3 + 2] = col.b;

            const speed = 3.5 + Math.random() * 8.5;
            const theta = Math.random() * Math.PI * 2;
            const phi = (Math.random() - 0.5) * Math.PI;

            vel.push(new THREE.Vector3(
                Math.cos(phi) * Math.sin(theta) * speed,
                Math.sin(phi) * speed + 2.5,
                Math.cos(phi) * Math.cos(theta) * speed
            ));
        }

        geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
        geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

        const mat = new THREE.PointsMaterial({
            size: 0.35,
            vertexColors: true,
            transparent: true,
            depthWrite: false,
            opacity: 1.0
        });

        const pMesh = new THREE.Points(geo, mat);
        this.scene.add(pMesh);

        this.particles.push({
            mesh: pMesh,
            vel: vel,
            life: 0.85,
            maxLife: 0.85
        });
    }

    update(delta) {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.life -= delta;

            if (p.life <= 0) {
                this.scene.remove(p.mesh);
                p.mesh.geometry.dispose();
                p.mesh.material.dispose();
                this.particles.splice(i, 1);
                continue;
            }

            p.mesh.material.opacity = p.life / p.maxLife;
            const posAttr = p.mesh.geometry.attributes.position;
            const pos = posAttr.array;

            for (let j = 0; j < p.vel.length; j++) {
                p.vel[j].y -= 9.8 * delta;
                pos[j * 3] += p.vel[j].x * delta;
                pos[j * 3 + 1] += p.vel[j].y * delta;
                pos[j * 3 + 2] += p.vel[j].z * delta;
            }
            posAttr.needsUpdate = true;
        }
    }

    createFootstepParticles(x, y, z, colorHex = 0x8b5a2b, isWater = false) {
        const count = isWater ? 8 : 5;
        const geo = new THREE.BufferGeometry();
        const pos = new Float32Array(count * 3);
        const vel = [];

        for (let i = 0; i < count; i++) {
            pos[i * 3] = x + (Math.random() - 0.5) * 0.4;
            pos[i * 3 + 1] = y;
            pos[i * 3 + 2] = z + (Math.random() - 0.5) * 0.4;

            vel.push(new THREE.Vector3(
                (Math.random() - 0.5) * (isWater ? 1.5 : 0.8),
                Math.random() * (isWater ? 1.2 : 0.6) + 0.2,
                (Math.random() - 0.5) * (isWater ? 1.5 : 0.8)
            ));
        }

        geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
        const mat = new THREE.PointsMaterial({
            size: isWater ? 0.20 : 0.14,
            color: isWater ? 0x38bdf8 : colorHex,
            transparent: true,
            depthWrite: false,
            opacity: 0.8
        });

        const pMesh = new THREE.Points(geo, mat);
        this.scene.add(pMesh);

        this.particles.push({
            mesh: pMesh,
            vel: vel,
            life: 0.25,
            maxLife: 0.25
        });
    }
}