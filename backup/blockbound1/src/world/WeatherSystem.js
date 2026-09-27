export class WeatherSystem {
    constructor(scene) {
        this.scene = scene;
        this.count = 350;
        this.geo = new THREE.BufferGeometry();
        this.pos = new Float32Array(this.count * 3);
        
        for (let i = 0; i < this.count * 3; i += 3) {
            this.pos[i] = (Math.random() - 0.5) * 60;
            this.pos[i + 1] = Math.random() * 35;
            this.pos[i + 2] = (Math.random() - 0.5) * 60;
        }
        this.geo.setAttribute('position', new THREE.BufferAttribute(this.pos, 3));

        this.mat = new THREE.PointsMaterial({
            size: 0.18,
            color: 0x38bdf8,
            transparent: true,
            depthWrite: false,
            opacity: 0.0
        });

        this.mesh = new THREE.Points(this.geo, this.mat);
        this.scene.add(this.mesh);
    }

    update(delta, playerPos, weatherType) {
        if (weatherType === 'Limpo') {
            this.mat.opacity = 0.0;
            return;
        }

        this.mat.opacity = 0.75;
        if (weatherType === 'Neve') {
            this.mat.color.setHex(0xf8fafc);
            this.mat.size = 0.25;
        } else {
            this.mat.color.setHex(0x38bdf8);
            this.mat.size = 0.18;
        }

        this.mesh.position.set(playerPos.x, 0, playerPos.z);
        const pos = this.geo.attributes.position.array;
        const fallSpeed = (weatherType === 'Neve') ? 6.0 : 26.0;

        for (let i = 1; i < this.count * 3; i += 3) {
            pos[i] -= fallSpeed * delta;
            if (pos[i] < 0) {
                pos[i] = 32 + Math.random() * 5;
            }
        }
        this.geo.attributes.position.needsUpdate = true;
    }
}