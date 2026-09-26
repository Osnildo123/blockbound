const THREE = window.THREE;
import { BLOCKS } from '../config/constants.js';

export class FirstPersonHand {
    constructor(camera) {
        this.camera = camera;
        this.group = new THREE.Group();

        this.heldLight = new THREE.PointLight(0xffaa44, 0, 24);
        this.heldLight.position.set(0.2, -0.1, -0.3);
        this.group.add(this.heldLight);

        this.swingTimer = 0;
        this.camera.add(this.group);
    }

    swing() {
        this.swingTimer = 0.22;
    }

    update(activeBlockId, delta) {
        if (activeBlockId === BLOCKS.TORCH) {
            this.heldLight.intensity = 2.2 + Math.sin(Date.now() * 0.008 * 6) * 0.2;
        } else {
            this.heldLight.intensity = 0;
        }

        if (this.swingTimer > 0) {
            this.swingTimer -= delta;
            const progress = 1.0 - (this.swingTimer / 0.22);
            this.group.rotation.x = -Math.sin(progress * Math.PI) * 0.8;
            this.group.rotation.y = Math.sin(progress * Math.PI) * 0.4;
        } else {
            this.group.rotation.set(0, 0, 0);
        }
    }
}