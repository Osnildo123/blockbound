const THREE = window.THREE;
import { BLOCKS } from '../config/constants.js';

export class VoxelFish {
    constructor(type, x, y, z, scene) {
        this.scene = scene;
        this.position = new THREE.Vector3(x, y, z);
        this.rotation = Math.random() * Math.PI * 2;
        this.targetRotation = this.rotation;
        this.turnCooldown = 0;
        this.swimTimer = 0;
        this.type = type;

        this.group = new THREE.Group();
        this.tailMesh = null; // Tartarugas não usarão cauda, usarão barbatanas

        // Definições base
        this.swimSpeed = 1.0;
        let colorHex = 0xf97316; // Cor padrão (Laranja)
        let stripeHex = 0xffffff;

        // ==============================================
        // 1. CONSTRUÇÃO BASEADA NO TIPO DE ANIMAL
        // ==============================================
        
        if (type === 'turtle') {
            // --- TARTARUGA MARINHA ---
            this.swimSpeed = 0.5 + Math.random() * 0.3; // Muito lenta
            
            const shellMat = new THREE.MeshStandardMaterial({ color: 0x4ade80, roughness: 0.8 }); // Verde carapaça
            const skinMat = new THREE.MeshStandardMaterial({ color: 0xa16207, roughness: 0.7 }); // Castanho corpo

            // Carapaça
            const shell = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.2, 0.6), shellMat);
            shell.position.y = 0.1;
            this.group.add(shell);

            // Cabeça
            const head = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.15, 0.2), skinMat);
            head.position.set(0, 0.05, 0.4);
            this.group.add(head);

            // Barbatanas (Limbos que vamos animar no update)
            this.flippers = [];
            const flipperGeo = new THREE.BoxGeometry(0.3, 0.05, 0.2);
            
            const flipFL = new THREE.Mesh(flipperGeo, skinMat); flipFL.position.set(0.35, 0.0, 0.2);
            const flipFR = new THREE.Mesh(flipperGeo, skinMat); flipFR.position.set(-0.35, 0.0, 0.2);
            const flipBL = new THREE.Mesh(flipperGeo, skinMat); flipBL.position.set(0.3, 0.0, -0.2);
            const flipBR = new THREE.Mesh(flipperGeo, skinMat); flipBR.position.set(-0.3, 0.0, -0.2);

            this.flippers.push(flipFL, flipFR, flipBL, flipBR);
            this.flippers.forEach(f => this.group.add(f));

        } else if (type === 'pufferfish') {
            // --- BAIACU ---
            this.swimSpeed = 0.7 + Math.random() * 0.4;
            colorHex = 0xfacc15; // Amarelo
            const bodyMat = new THREE.MeshStandardMaterial({ color: colorHex, roughness: 0.5 });
            
            // Corpo mais gordo
            const body = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.3, 0.4), bodyMat);
            body.position.y = 0.15;
            this.group.add(body);

            // Cauda pequena
            const tail = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.15, 0.15), bodyMat);
            tail.position.set(0, 0.15, -0.25);
            this.tailMesh = tail;
            this.group.add(tail);

        } else {
            // --- PEIXES NORMAIS (Salmão, Azul, Bacalhau) ---
            let bodyWidth = 0.18, bodyHeight = 0.22, bodyLength = 0.5;

            if (type === 'blue') {
                colorHex = 0x38bdf8;
                this.swimSpeed = 1.5 + Math.random() * 0.5; // Rápido
                bodyLength = 0.4; // Mais curto
            } else if (type === 'salmon') {
                colorHex = 0xef4444; // Vermelho
                this.swimSpeed = 1.2 + Math.random() * 0.4;
            } else if (type === 'cod') { // Bacalhau
                colorHex = 0x854d0e; // Castanho esverdeado
                this.swimSpeed = 0.9 + Math.random() * 0.4;
                bodyLength = 0.6; // Mais comprido
                bodyWidth = 0.15; // Mais fino
            }

            const bodyMat = new THREE.MeshStandardMaterial({ color: colorHex, roughness: 0.5 });
            const stripeMat = new THREE.MeshStandardMaterial({ color: stripeHex, roughness: 0.5 });

            // Corpo
            const body = new THREE.Mesh(new THREE.BoxGeometry(bodyWidth, bodyHeight, bodyLength), bodyMat);
            body.position.y = bodyHeight / 2;
            this.group.add(body);

            // Risca central (se não for bacalhau)
            if (type !== 'cod') {
                const stripe = new THREE.Mesh(new THREE.BoxGeometry(bodyWidth + 0.01, bodyHeight + 0.01, 0.1), stripeMat);
                stripe.position.set(0, bodyHeight / 2, 0);
                this.group.add(stripe);
            }

            // Cauda oscilante
            const tail = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.2, 0.22), bodyMat);
            tail.position.set(0, bodyHeight / 2, -(bodyLength / 2 + 0.05));
            this.tailMesh = tail;
            this.group.add(tail);
        }

        this.group.position.copy(this.position);
        this.scene.add(this.group);
    }

    update(delta, game) {
        // Velocidade da animação varia com o tipo
        const animSpeed = this.type === 'turtle' ? 3 : 8;
        this.swimTimer += delta * animSpeed;

        // Animação das partes do corpo
        if (this.type === 'turtle' && this.flippers) {
            const flap = Math.sin(this.swimTimer) * 0.3;
            this.flippers[0].rotation.z = flap;
            this.flippers[1].rotation.z = -flap;
            this.flippers[2].rotation.z = flap * 0.5;
            this.flippers[3].rotation.z = -flap * 0.5;
        } else if (this.tailMesh) {
            this.tailMesh.rotation.y = Math.sin(this.swimTimer) * 0.4;
        }

        // ==============================================
        // LÓGICA DE MOVIMENTO E COLISÃO CORRIGIDA
        // ==============================================

        if (this.turnCooldown > 0) this.turnCooldown -= delta;

        let diff = this.targetRotation - this.rotation;
        diff = Math.atan2(Math.sin(diff), Math.cos(diff));
        
        const turnSpeed = this.type === 'turtle' ? 2.0 : 5.0;
        this.rotation += diff * Math.min(1.0, delta * turnSpeed);

        const dirX = Math.sin(this.rotation);
        const dirZ = Math.cos(this.rotation);

        const probeX = Math.floor(this.position.x + dirX * 0.5);
        const probeY = Math.floor(this.position.y);
        const probeZ = Math.floor(this.position.z + dirZ * 0.5);

        if (game.getBlock(probeX, probeY, probeZ) !== BLOCKS.WATER) {
            // Só manda virar se já completou a curva anterior (cooldown zerado)
            if (this.turnCooldown <= 0) {
                this.targetRotation += Math.PI; // Manda dar meia-volta
                this.targetRotation += (Math.random() - 0.5); // Desvio natural
                
                // O SEGREDO: A tartaruga recebe 2.5 segundos de tempo para conseguir
                // completar a curva lenta sem o cérebro interromper a meio!
                this.turnCooldown = this.type === 'turtle' ? 2.5 : 1.0; 
            }
        } else {
            // Se o caminho estiver livre de blocos sólidos, nada em frente!
            this.position.x += dirX * this.swimSpeed * delta;
            this.position.z += dirZ * this.swimSpeed * delta;

            if (Math.random() < 0.01 && this.turnCooldown <= 0) {
                this.targetRotation += (Math.random() - 0.5) * Math.PI;
                this.turnCooldown = 0.5;
            }
        }

        this.group.rotation.y = this.rotation;
        this.group.position.copy(this.position);
    }
}