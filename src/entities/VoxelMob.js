const THREE = window.THREE;
import { BLOCKS } from '../config/constants.js';

export class VoxelMob {
    constructor(type, x, y, z, game, id = null) {
        this.game = game;
        this.type = type;
        this.id = id || ('mob_' + Math.random().toString(36).substr(2, 9));
        this.hp = type === 'creeper' ? 20 : (type === 'spider' ? 16 : (type === 'skeleton' ? 15 : 12));
        this.isHostile = ['creeper', 'spider', 'skeleton'].includes(type);
        this.rotation = Math.random() * Math.PI * 2;
        this.attackCooldown = Math.random() * 1.5;
        this.legs = [];
        this.walkTimer = Math.random() * 10;

        this.fuseTimer = 0;
        this.fuseMax = 1.5;
        this.hasPlayedFuseSound = false;
        
        // Temporizador de invulnerabilidade
        this.immunityTimer = 0;

        // GARANTE QUE NENHUM ANIMAL NASÇA DENTRO DA ÁGUA
        if (this.game && typeof this.game.getHighestBlockY === 'function') {
            let hy = this.game.getHighestBlockY(x, z);
            if (hy <= 11) {
                let foundLand = false;
                for (let radius = 2; radius <= 24; radius += 2) {
                    for (let dx = -radius; dx <= radius; dx += radius) {
                        for (let dz = -radius; dz <= radius; dz += radius) {
                            let testHy = this.game.getHighestBlockY(x + dx, z + dz);
                            if (testHy > 11) {
                                x = x + dx;
                                z = z + dz;
                                y = testHy + 1;
                                foundLand = true;
                                break;
                            }
                        }
                        if (foundLand) break;
                    }
                    if (foundLand) break;
                }
            }
        }

        this.targetPos = new THREE.Vector3(x, y, z);
        this.mesh = this.createMesh(type);
        this.mesh.position.set(x, y, z);
        this.mesh.traverse(child => {
            child.userData.mobInstance = this;
        });
    }

    playFuseSound() {
        try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const bufferSize = ctx.sampleRate * 1.5;
            const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                data[i] = Math.random() * 2 - 1;
            }
            const noise = ctx.createBufferSource();
            noise.buffer = buffer;

            const filter = ctx.createBiquadFilter();
            filter.type = 'highpass';
            filter.frequency.value = 1200;

            const gain = ctx.createGain();
            gain.gain.setValueAtTime(0.25, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 1.5);

            noise.connect(filter);
            filter.connect(gain);
            gain.connect(ctx.destination);
            noise.start();
        } catch(e) {}
    }

    createMesh(type) {
        const group = new THREE.Group();
        this.legs = [];

        if (type === 'cow') {
            const bodyMat = new THREE.MeshStandardMaterial({ color: 0x4a3222, roughness: 0.8 });    // Castanho escuro
            const spotMat = new THREE.MeshStandardMaterial({ color: 0xf0f0f0, roughness: 0.8 });    // Manchas brancas
            const skinMat = new THREE.MeshStandardMaterial({ color: 0xdbb89a, roughness: 0.8 });    // Focinho/Pele
            const udderMat = new THREE.MeshStandardMaterial({ color: 0xf49ac2, roughness: 0.8 });  // Úbere (Rosa)
            const hornMat = new THREE.MeshStandardMaterial({ color: 0xe0e0e0, roughness: 0.6 });   // Chifres
            const eyeWhiteMat = new THREE.MeshStandardMaterial({ color: 0xffffff });
            const eyeBlackMat = new THREE.MeshStandardMaterial({ color: 0x111111 });
            const hoofMat = new THREE.MeshStandardMaterial({ color: 0x221a14, roughness: 0.9 });    // Cascos
            const nostrilMat = new THREE.MeshStandardMaterial({ color: 0x8a6243 });

            // 1. CORPO
            const body = new THREE.Mesh(new THREE.BoxGeometry(0.82, 0.82, 1.22), bodyMat);
            body.position.y = 0.7;
            group.add(body);

            // Manchas brancas em relevo
            const spot1 = new THREE.Mesh(new THREE.BoxGeometry(0.84, 0.5, 0.5), spotMat);
            spot1.position.set(0, 0.75, 0.1);
            const spot2 = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.84, 0.4), spotMat);
            spot2.position.set(-0.1, 0.7, -0.3);
            group.add(spot1); group.add(spot2);

            // Úbere (Tetas) por baixo do corpo
            const udder = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.15, 0.3), udderMat);
            udder.position.set(0, 0.25, -0.1);
            group.add(udder);

            // Rabo
            const tail = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.45, 0.08), bodyMat);
            tail.position.set(0, 0.6, -0.62);
            tail.rotation.x = 0.15;
            group.add(tail);

            // 2. CABEÇA
            const headGroup = new THREE.Group();

            const head = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.5), bodyMat);
            head.position.set(0, 1.05, 0.65);
            headGroup.add(head);

            // Mancha branca na testa
            const forehead = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.25, 0.02), spotMat);
            forehead.position.set(0, 1.15, 0.901);
            headGroup.add(forehead);

            // Focinho 3D + Narinas
            const snout = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.22, 0.22), skinMat);
            snout.position.set(0, 0.92, 0.9);
            headGroup.add(snout);

            const nL = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.08, 0.02), nostrilMat);
            nL.position.set(-0.1, 0.92, 1.011);
            const nR = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.08, 0.02), nostrilMat);
            nR.position.set(0.1, 0.92, 1.011);
            headGroup.add(nL); headGroup.add(nR);

            // Chifres
            const hL = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.22, 0.1), hornMat);
            hL.position.set(-0.3, 1.35, 0.6);
            const hR = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.22, 0.1), hornMat);
            hR.position.set(0.3, 1.35, 0.6);
            headGroup.add(hL); headGroup.add(hR);

            // Orelhas
            const earL = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.08, 0.1), bodyMat);
            earL.position.set(-0.32, 1.1, 0.6);
            earL.rotation.z = -0.2;
            const earR = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.08, 0.1), bodyMat);
            earR.position.set(0.32, 1.1, 0.6);
            earR.rotation.z = 0.2;
            headGroup.add(earL); headGroup.add(earR);

            // Olhos
            const eyeWL = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.02), eyeWhiteMat);
            eyeWL.position.set(-0.21, 1.08, 0.881);
            const eyeBL = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.08, 0.02), eyeBlackMat);
            eyeBL.position.set(-0.23, 1.08, 0.882);

            const eyeWR = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.02), eyeWhiteMat);
            eyeWR.position.set(0.21, 1.08, 0.881);
            const eyeBR = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.08, 0.02), eyeBlackMat);
            eyeBR.position.set(0.23, 1.08, 0.882);

            headGroup.add(eyeWL); headGroup.add(eyeBL);
            headGroup.add(eyeWR); headGroup.add(eyeBR);

            group.add(headGroup);

            // 3. PATAS COM CASCOS
            const legPositions = [
                [-0.28, 0.3, 0.4], [0.28, 0.3, 0.4],
                [-0.28, 0.3, -0.4], [0.28, 0.3, -0.4]
            ];
            legPositions.forEach(pos => {
                const legGroup = new THREE.Group();

                const legUpper = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.48, 0.22), bodyMat);
                legUpper.position.y = 0.06;
                legGroup.add(legUpper);

                const hoof = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.12, 0.22), hoofMat);
                hoof.position.y = -0.24;
                legGroup.add(hoof);

                legGroup.position.set(...pos);
                group.add(legGroup);
                this.legs.push(legGroup);
            });

        } else if (type === 'pig') {
            const pigMat = new THREE.MeshStandardMaterial({ color: 0xf49ac2, roughness: 0.8 });    // Rosa pele
            const snoutMat = new THREE.MeshStandardMaterial({ color: 0xe87cae, roughness: 0.7 });  // Rosa focinho
            const nostrilMat = new THREE.MeshStandardMaterial({ color: 0x8a335c, roughness: 0.9 });// Narinas
            const eyeWhiteMat = new THREE.MeshStandardMaterial({ color: 0xffffff });               // Olhos
            const eyeBlackMat = new THREE.MeshStandardMaterial({ color: 0x111111 });               // Pupilas
            const hoofMat = new THREE.MeshStandardMaterial({ color: 0x593d2c, roughness: 0.9 });  // Cascos
            const earMat = new THREE.MeshStandardMaterial({ color: 0xe87cae, roughness: 0.8 });   // Orelhas

            // 1. CORPO
            const body = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.7, 1.1), pigMat);
            body.position.y = 0.6;
            group.add(body);

            // Rabo enrolado atrás
            const tail = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.14, 0.08), snoutMat);
            tail.position.set(0, 0.75, -0.58);
            tail.rotation.x = 0.45;
            group.add(tail);

            // 2. CABEÇA
            const head = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.5), pigMat);
            head.position.set(0, 0.85, 0.6);
            group.add(head);

            // Orelhas descaídas
            const earL = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 0.06), earMat);
            earL.position.set(-0.24, 1.1, 0.55);
            earL.rotation.z = -0.25;

            const earR = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 0.06), earMat);
            earR.position.set(0.24, 1.1, 0.55);
            earR.rotation.z = 0.25;
            group.add(earL); group.add(earR);

            // Focinho 3D
            const snout = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.18, 0.16), snoutMat);
            snout.position.set(0, 0.78, 0.88);
            group.add(snout);

            // Narinas
            const nostrilL = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.08, 0.02), nostrilMat);
            nostrilL.position.set(-0.07, 0.78, 0.961);
            const nostrilR = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.08, 0.02), nostrilMat);
            nostrilR.position.set(0.07, 0.78, 0.961);
            group.add(nostrilL); group.add(nostrilR);

            // Olhos
            const eyeWL = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.08, 0.02), eyeWhiteMat);
            eyeWL.position.set(-0.16, 0.92, 0.851);
            const eyeBL = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.08, 0.02), eyeBlackMat);
            eyeBL.position.set(-0.185, 0.92, 0.852);

            const eyeWR = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.08, 0.02), eyeWhiteMat);
            eyeWR.position.set(0.16, 0.92, 0.851);
            const eyeBR = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.08, 0.02), eyeBlackMat);
            eyeBR.position.set(0.185, 0.92, 0.852);

            group.add(eyeWL); group.add(eyeBL);
            group.add(eyeWR); group.add(eyeBR);

            // 3. PATAS COM CASCOS
            const legPositions = [
                [-0.26, 0.25, 0.35], [0.26, 0.25, 0.35],
                [-0.26, 0.25, -0.35], [0.26, 0.25, -0.35]
            ];

            legPositions.forEach(pos => {
                const legGroup = new THREE.Group();

                const legUpper = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.38, 0.2), pigMat);
                legUpper.position.y = 0.06;
                legGroup.add(legUpper);

                const hoof = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.12, 0.2), hoofMat);
                hoof.position.y = -0.19;
                legGroup.add(hoof);

                legGroup.position.set(...pos);
                group.add(legGroup);
                this.legs.push(legGroup);
            });

        } else if (type === 'sheep') {
            const woolMat = new THREE.MeshStandardMaterial({ color: 0xf5f5f5, roughness: 0.95 });   // Lã
            const skinMat = new THREE.MeshStandardMaterial({ color: 0xdbb89a, roughness: 0.8 });    // Pele
            const snoutMat = new THREE.MeshStandardMaterial({ color: 0xc49a7a, roughness: 0.85 });  // Focinho
            const eyeWhiteMat = new THREE.MeshStandardMaterial({ color: 0xffffff });               // Olhos
            const eyeBlackMat = new THREE.MeshStandardMaterial({ color: 0x111111 });               // Pupilas
            const hoofMat = new THREE.MeshStandardMaterial({ color: 0x6e523b, roughness: 0.9 });    // Cascos
            const earMat = new THREE.MeshStandardMaterial({ color: 0xcba085, roughness: 0.8 });     // Orelhas

            // 1. CORPO (Lã fofa)
            const woolBody = new THREE.Mesh(new THREE.BoxGeometry(0.92, 0.82, 1.22), woolMat);
            woolBody.position.y = 0.7;
            group.add(woolBody);

            // 2. CABEÇA
            const headGroup = new THREE.Group();

            const headSkin = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.42, 0.48), skinMat);
            headSkin.position.set(0, 0.92, 0.68);
            headGroup.add(headSkin);

            const headWool = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.22, 0.46), woolMat);
            headWool.position.set(0, 1.1, 0.65);
            headGroup.add(headWool);

            const snout = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.18, 0.16), snoutMat);
            snout.position.set(0, 0.85, 0.92);
            headGroup.add(snout);

            const earL = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.08, 0.18), earMat);
            earL.position.set(-0.25, 0.98, 0.65);
            earL.rotation.z = -0.2;

            const earR = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.08, 0.18), earMat);
            earR.position.set(0.25, 0.98, 0.65);
            earR.rotation.z = 0.2;
            headGroup.add(earL); headGroup.add(earR);

            const eyeWL = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.02), eyeWhiteMat);
            eyeWL.position.set(-0.16, 0.95, 0.921);
            const eyeBL = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.08, 0.02), eyeBlackMat);
            eyeBL.position.set(-0.18, 0.95, 0.922);

            const eyeWR = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.02), eyeWhiteMat);
            eyeWR.position.set(0.16, 0.95, 0.921);
            const eyeBR = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.08, 0.02), eyeBlackMat);
            eyeBR.position.set(0.18, 0.95, 0.922);

            headGroup.add(eyeWL); headGroup.add(eyeBL);
            headGroup.add(eyeWR); headGroup.add(eyeBR);

            group.add(headGroup);

            // 3. PATAS
            const legPositions = [
                [-0.28, 0.25, 0.4], [0.28, 0.25, 0.4],
                [-0.28, 0.25, -0.4], [0.28, 0.25, -0.4]
            ];

            legPositions.forEach(pos => {
                const legGroup = new THREE.Group();

                const legWool = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.24, 0.24), woolMat);
                legWool.position.y = 0.12;
                legGroup.add(legWool);

                const legLower = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.22, 0.18), skinMat);
                legLower.position.y = -0.08;
                legGroup.add(legLower);

                const hoof = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.08, 0.18), hoofMat);
                hoof.position.y = -0.21;
                legGroup.add(hoof);

                legGroup.position.set(...pos);
                group.add(legGroup);
                this.legs.push(legGroup);
            });

        } else if (type === 'chicken') {
            const featherMat = new THREE.MeshStandardMaterial({ color: 0xf8f8f8, roughness: 0.85 }); // Penas brancas
            const beakMat = new THREE.MeshStandardMaterial({ color: 0xff9900, roughness: 0.7 });    // Bico/Pés laranja
            const wattleMat = new THREE.MeshStandardMaterial({ color: 0xcc0000, roughness: 0.8 });  // Crista/Papo vermelho
            const eyeWhiteMat = new THREE.MeshStandardMaterial({ color: 0xffffff });
            const eyeBlackMat = new THREE.MeshStandardMaterial({ color: 0x111111 });

            // 1. CORPO E ASAS
            const body = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.48, 0.58), featherMat);
            body.position.y = 0.45;
            group.add(body);

            // Asas nas laterais
            const wingL = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.32, 0.42), featherMat);
            wingL.position.set(-0.27, 0.48, 0.0);
            const wingR = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.32, 0.42), featherMat);
            wingR.position.set(0.27, 0.48, 0.0);
            group.add(wingL); group.add(wingR);

            // Cauda levantada
            const tail = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.28, 0.12), featherMat);
            tail.position.set(0, 0.6, -0.28);
            tail.rotation.x = -0.35;
            group.add(tail);

            // 2. CABEÇA
            const headGroup = new THREE.Group();

            const head = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.36, 0.32), featherMat);
            head.position.set(0, 0.78, 0.22);
            headGroup.add(head);

            // Crista Vermelha no topo
            const comb = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.16, 0.24), wattleMat);
            comb.position.set(0, 1.0, 0.22);
            headGroup.add(comb);

            // Bico 3D
            const beak = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.12, 0.18), beakMat);
            beak.position.set(0, 0.74, 0.45);
            headGroup.add(beak);

            // Papo Vermelho
            const wattle = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.16, 0.1), wattleMat);
            wattle.position.set(0, 0.6, 0.41);
            headGroup.add(wattle);

            // Olhos Laterais
            const eyeWL = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.06, 0.06), eyeWhiteMat);
            eyeWL.position.set(-0.151, 0.82, 0.28);
            const eyeBL = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.04, 0.04), eyeBlackMat);
            eyeBL.position.set(-0.152, 0.82, 0.29);

            const eyeWR = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.06, 0.06), eyeWhiteMat);
            eyeWR.position.set(0.151, 0.82, 0.28);
            const eyeBR = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.04, 0.04), eyeBlackMat);
            eyeBR.position.set(0.152, 0.82, 0.29);

            headGroup.add(eyeWL); headGroup.add(eyeBL);
            headGroup.add(eyeWR); headGroup.add(eyeBR);

            group.add(headGroup);

            // 3. PATAS E PÉS COM DEDOS
            const legPositions = [[-0.12, 0.18, 0.05], [0.12, 0.18, 0.05]];
            legPositions.forEach(pos => {
                const legGroup = new THREE.Group();

                const leg = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.32, 0.08), beakMat);
                leg.position.y = 0.02;
                legGroup.add(leg);

                const foot = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.04, 0.2), beakMat);
                foot.position.set(0, -0.14, 0.05);
                legGroup.add(foot);

                legGroup.position.set(...pos);
                group.add(legGroup);
                this.legs.push(legGroup);
            });

        } else if (type === 'creeper') {
            const creeperMat = new THREE.MeshStandardMaterial({ color: 0x2e8b57, roughness: 0.8 });
            const faceMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.9 });

            const body = new THREE.Mesh(new THREE.BoxGeometry(0.5, 1.1, 0.35), creeperMat);
            body.position.y = 0.75;
            body.userData.isBodyPart = true;
            group.add(body);

            const head = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.5), creeperMat);
            head.position.set(0, 1.5, 0);
            head.userData.isBodyPart = true;
            group.add(head);

            const face = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.35, 0.02), faceMat);
            face.position.set(0, 1.5, 0.255);
            group.add(face);

            const legGeo = new THREE.BoxGeometry(0.22, 0.35, 0.22);
            const legPositions = [
                [-0.18, 0.175, 0.18], [0.18, 0.175, 0.18],
                [-0.18, 0.175, -0.18], [0.18, 0.175, -0.18]
            ];
            legPositions.forEach(pos => {
                const leg = new THREE.Mesh(legGeo, creeperMat);
                leg.position.set(...pos);
                leg.userData.isBodyPart = true;
                group.add(leg);
                this.legs.push(leg);
            });

        } else if (type === 'spider') {
            const spiderMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.9 });
            const eyeMat = new THREE.MeshStandardMaterial({ color: 0xcc0000, emissive: 0x880000 });

            const abdomen = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.5, 0.8), spiderMat);
            abdomen.position.set(0, 0.4, -0.3);
            group.add(abdomen);

            const head = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.4, 0.5), spiderMat);
            head.position.set(0, 0.35, 0.3);
            group.add(head);

            const eye = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.1, 0.02), eyeMat);
            eye.position.set(0, 0.4, 0.551);
            group.add(eye);

            const legGeo = new THREE.BoxGeometry(0.8, 0.1, 0.1);
            for (let i = 0; i < 4; i++) {
                const legL = new THREE.Mesh(legGeo, spiderMat);
                legL.position.set(-0.6, 0.3, 0.3 - i * 0.2);
                legL.rotation.z = 0.3;
                const legR = new THREE.Mesh(legGeo, spiderMat);
                legR.position.set(0.6, 0.3, 0.3 - i * 0.2);
                legR.rotation.z = -0.3;
                group.add(legL); group.add(legR);
                this.legs.push(legL, legR);
            }

        } else {
            // SKELETON
            const skelMat = new THREE.MeshStandardMaterial({ color: 0xcccccc, roughness: 0.7 });
            const darkMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.9 });
            const bowMat = new THREE.MeshStandardMaterial({ color: 0x6e4726, roughness: 0.8 });

            const spine = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.7, 0.12), skelMat);
            spine.position.y = 0.9;
            group.add(spine);

            for (let r = 0; r < 3; r++) {
                const rib = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.08, 0.22), skelMat);
                rib.position.set(0, 1.15 - r * 0.18, 0);
                group.add(rib);
            }

            const pelvis = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.12, 0.22), skelMat);
            pelvis.position.set(0, 0.58, 0);
            group.add(pelvis);

            const head = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.45, 0.45), skelMat);
            head.position.set(0, 1.48, 0);
            group.add(head);

            const eyeL = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.02), darkMat);
            eyeL.position.set(-0.1, 1.52, 0.225);
            const eyeR = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.02), darkMat);
            eyeR.position.set(0.1, 1.52, 0.225);
            const mouth = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.08, 0.02), darkMat);
            mouth.position.set(0, 1.38, 0.225);
            group.add(eyeL); group.add(eyeR); group.add(mouth);

            const armGeo = new THREE.BoxGeometry(0.12, 0.7, 0.12);
            const armL = new THREE.Mesh(armGeo, skelMat);
            armL.position.set(-0.3, 0.9, 0.15);
            armL.rotation.x = -Math.PI / 3;

            const armR = new THREE.Mesh(armGeo, skelMat);
            armR.position.set(0.3, 0.9, 0.15);
            armR.rotation.x = -Math.PI / 3;
            group.add(armL); group.add(armR);

            const bowGroup = new THREE.Group();
            const bowShaft = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.7, 0.06), bowMat);
            const stringMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
            const bowString = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.68, 0.02), stringMat);
            bowString.position.z = -0.08;
            bowGroup.add(bowShaft); bowGroup.add(bowString);
            bowGroup.position.set(0, 0.8, 0.45);
            bowGroup.rotation.x = 0.2;
            group.add(bowGroup);

            const legGeo = new THREE.BoxGeometry(0.14, 0.7, 0.14);
            const legL = new THREE.Mesh(legGeo, skelMat); legL.position.set(-0.12, 0.35, 0);
            const legR = new THREE.Mesh(legGeo, skelMat); legR.position.set(0.12, 0.35, 0);
            group.add(legL); group.add(legR);
            this.legs.push(legL, legR);
        }

        group.traverse(child => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });

        return group;
    }

    setMeshColor(hex) {
        if (!this.mesh) return;
        this.mesh.traverse(child => {
            if (child.isMesh && child.userData.isBodyPart && child.material) {
                child.material.color.setHex(hex);
            }
        });
    }

    getNearestPlayer() {
        let nearest = {
            pos: this.game.position,
            dist: this.mesh.position.distanceTo(this.game.position),
            isClient: false,
            peerId: null
        };

        if (this.game.remotePlayers) {
            for (let [id, rp] of this.game.remotePlayers.entries()) {
                const clientPos = rp.targetPos || rp.group.position;
                const d = this.mesh.position.distanceTo(clientPos);
                if (d < nearest.dist) {
                    nearest = {
                        pos: clientPos,
                        dist: d,
                        isClient: true,
                        peerId: id
                    };
                }
            }
        }
        return nearest;
    }

    takeDamage(amount) {
        if (this.immunityTimer > 0) return;

        this.hp -= amount;
        if (this.game && this.game.particleSystem && this.mesh) {
            this.game.particleSystem.createMobHitParticles(
                this.mesh.position.x,
                this.mesh.position.y + 0.5,
                this.mesh.position.z
            );
        }
        if (this.game && this.game.sound) {
            this.game.sound.playBreak();
        }
        if (this.hp <= 0) {
            this.die();
        }
    }

    explode() {
        if (this.game && this.game.network) {
            this.game.network.sendCreeperExplode(this.mesh.position.x, this.mesh.position.y, this.mesh.position.z);
        }

        if (this.game && typeof this.game.triggerExplosionEffects === 'function') {
            this.game.triggerExplosionEffects(this.mesh.position.x, this.mesh.position.y, this.mesh.position.z);
        }

        const bx = Math.floor(this.mesh.position.x);
        const by = Math.floor(this.mesh.position.y);
        const bz = Math.floor(this.mesh.position.z);

        const affectedChunks = new Set();
        const radius = 2;

        for (let x = -radius; x <= radius; x++) {
            for (let y = -radius; y <= radius; y++) {
                for (let z = -radius; z <= radius; z++) {
                    if (x * x + y * y + z * z <= radius * radius + 0.5) {
                        const targetX = bx + x;
                        const targetY = by + y;
                        const targetZ = bz + z;
                        const block = this.game.getBlock(targetX, targetY, targetZ);

                        if (block !== BLOCKS.BEDROCK && block !== BLOCKS.AIR) {
                            this.game.setBlockModified(targetX, targetY, targetZ, BLOCKS.AIR);
                            const cx = Math.floor(targetX / this.game.chunkSize);
                            const cz = Math.floor(targetZ / this.game.chunkSize);
                            affectedChunks.add(`${cx},${cz}`);
                        }
                    }
                }
            }
        }

        for (let key of affectedChunks) {
            const [cx, cz] = key.split(',').map(Number);
            this.game.rebuildSingleChunk(cx, cz);
        }

        const target = this.getNearestPlayer();
        if (target.dist < 5.0) {
            const dmg = Math.round((1 - target.dist / 5.0) * 45);
            const knockback = { x: (target.pos.x - bx) * 0.8, z: (target.pos.z - bz) * 0.8 };
            if (target.isClient) {
                this.game.network.sendHitPlayer(target.peerId, dmg, knockback);
            } else {
                this.game.takePlayerDamage(dmg, "EXPLOSÃO DE CREEPER", knockback);
            }
        }

        this.die();
    }

    die() {
        const deathPos = this.mesh ? this.mesh.position.clone() : (this.position ? this.position.clone() : new THREE.Vector3());

        if (this.mesh && this.game && this.game.scene) {
            this.game.scene.remove(this.mesh);
            this.mesh.traverse(c => { if (c.geometry) c.geometry.dispose(); });
        }
        if (this.game && this.game.mobs) {
            const idx = this.game.mobs.indexOf(this);
            if (idx !== -1) {
                this.game.mobs.splice(idx, 1);
            }
        }
        if (this.game && typeof this.game.spawnDroppedItem === 'function') {
            let dropType = BLOCKS.DIRT;
            if (this.type === 'cow' || this.type === 'pig' || this.type === 'sheep') dropType = BLOCKS.RAW_MEAT;
            else if (this.type === 'chicken') dropType = BLOCKS.COOKED_MEAT;

            this.game.spawnDroppedItem(
                deathPos.x,
                deathPos.y + 0.4,
                deathPos.z,
                dropType,
                Math.floor(Math.random() * 2) + 1
            );
        }
    }

    update(delta) {
        if (!this.mesh) return;

        if (this.immunityTimer > 0) {
            this.immunityTimer -= delta;
        }

        const isClientLAN = this.game.network && !this.game.network.isHost && this.game.network.netConn && this.game.network.netConn.open;

        this.walkTimer += delta * 8.0;
        const swing = Math.sin(this.walkTimer) * 0.4;
        if (this.legs && this.legs.length > 0) {
            this.legs.forEach((leg, i) => {
                leg.rotation.x = (i % 2 === 0 ? swing : -swing);
            });
        }

        // FUSÍVEL DO CREEPER
        if (this.type === 'creeper') {
            if (this.fuseTimer > 0) {
                if (!this.hasPlayedFuseSound) {
                    this.playFuseSound();
                    this.hasPlayedFuseSound = true;
                }

                const progress = Math.min(1.0, this.fuseTimer / this.fuseMax);
                const scaleXZ = 1.0 + progress * 0.45;
                const scaleY = 1.0 + progress * 0.35;
                this.mesh.scale.set(scaleXZ, scaleY, scaleXZ);

                if (Math.floor(this.fuseTimer * 10) % 2 === 0) {
                    this.setMeshColor(0xffffff);
                } else {
                    this.setMeshColor(0x2e8b57);
                }
            } else {
                this.mesh.scale.set(1, 1, 1);
                this.setMeshColor(0x2e8b57);
                this.hasPlayedFuseSound = false;
            }
        }

        if (isClientLAN) return;

        if (this.isHostile) {
            const target = this.getNearestPlayer();
            this.attackCooldown = Math.max(0, this.attackCooldown - delta);

            if (this.type === 'creeper') {
                if (target.dist < 3.8) {
                    this.fuseTimer += delta;
                    if (this.fuseTimer >= this.fuseMax) {
                        this.explode();
                        return;
                    }
                } else {
                    if (this.fuseTimer > 0) {
                        this.fuseTimer = Math.max(0, this.fuseTimer - delta * 2.0);
                    }

                    const dir = new THREE.Vector3().subVectors(target.pos, this.mesh.position);
                    dir.y = 0;
                    if (dir.lengthSq() > 0.001) {
                        dir.normalize();
                        this.rotation = Math.atan2(dir.x, dir.z);
                        this.mesh.rotation.y = this.rotation;

                        const nextX = this.mesh.position.x + dir.x * 2.8 * delta;
                        const nextZ = this.mesh.position.z + dir.z * 2.8 * delta;
                        const groundY = this.game.getHighestBlockY(nextX, nextZ);
                        const realY = Math.max(groundY + 1, 12.0);
                        this.mesh.position.set(nextX, realY, nextZ);
                    }
                }
            } 
            else if (this.type === 'skeleton') {
                if (target.dist < 20) {
                    const dir = new THREE.Vector3().subVectors(target.pos, this.mesh.position);
                    const flatDir = new THREE.Vector3(dir.x, 0, dir.z);

                    if (flatDir.lengthSq() > 0.001) {
                        flatDir.normalize();
                        this.rotation = Math.atan2(flatDir.x, flatDir.z);
                        this.mesh.rotation.y = this.rotation;

                        let moveSpeed = 0;
                        if (target.dist > 13) moveSpeed = 2.4;
                        else if (target.dist < 7) moveSpeed = -1.8;

                        if (moveSpeed !== 0) {
                            const nextX = this.mesh.position.x + flatDir.x * moveSpeed * delta;
                            const nextZ = this.mesh.position.z + flatDir.z * moveSpeed * delta;
                            const groundY = this.game.getHighestBlockY(nextX, nextZ);
                            const realY = Math.max(groundY + 1, 12.0);
                            this.mesh.position.set(nextX, realY, nextZ);
                        }
                    }

                    if (this.attackCooldown <= 0 && target.dist < 18) {
                        this.attackCooldown = 2.2;
                        this.immunityTimer = 0.3;

                        const targetY = target.pos.y + 0.5;
                        const shootDir = new THREE.Vector3(
                            target.pos.x - this.mesh.position.x + (Math.random() - 0.5) * 0.4,
                            targetY - (this.mesh.position.y + 1.2) + (Math.random() - 0.5) * 0.2,
                            target.pos.z - this.mesh.position.z + (Math.random() - 0.5) * 0.4
                        ).normalize();

                        const offset = 1.5;
                        const spawnX = this.mesh.position.x + shootDir.x * offset;
                        const spawnY = this.mesh.position.y + 1.2 + shootDir.y * offset;
                        const spawnZ = this.mesh.position.z + shootDir.z * offset;

                        if (typeof this.game.spawnArrow === 'function') {
                            this.game.spawnArrow(spawnX, spawnY, spawnZ, shootDir.x, shootDir.y, shootDir.z, this.id);
                        } else if (typeof this.game.spawnArrowFromNetwork === 'function') {
                            this.game.spawnArrowFromNetwork(spawnX, spawnY, spawnZ, shootDir.x, shootDir.y, shootDir.z, this.id);
                        }

                        if (this.game.network) {
                            this.game.network.sendShootArrow(spawnX, spawnY, spawnZ, shootDir.x, shootDir.y, shootDir.z, this.id);
                        }

                        if (this.game.sound && typeof this.game.sound.playShoot === 'function') {
                            this.game.sound.playShoot();
                        }
                    }
                }
            } 
            else {
                if (target.dist < 18) {
                    const dir = new THREE.Vector3().subVectors(target.pos, this.mesh.position);
                    dir.y = 0;

                    if (dir.lengthSq() > 0.001) {
                        dir.normalize();
                        this.rotation = Math.atan2(dir.x, dir.z);
                        this.mesh.rotation.y = this.rotation;

                        const speed = 4.2;
                        const nextX = this.mesh.position.x + dir.x * speed * delta;
                        const nextZ = this.mesh.position.z + dir.z * speed * delta;

                        const groundY = this.game.getHighestBlockY(nextX, nextZ);
                        const realY = Math.max(groundY + 1, 12.0);
                        this.mesh.position.set(nextX, realY, nextZ);
                    }

                    if (target.dist < 1.8 && this.attackCooldown <= 0) {
                        this.attackCooldown = 1.2;
                        const damage = 12;
                        const knockback = { x: dir.x, z: dir.z };

                        if (target.isClient) {
                            this.game.network.sendHitPlayer(target.peerId, damage, knockback);
                        } else {
                            this.game.takePlayerDamage(damage, this.type.toUpperCase(), knockback);
                        }
                    }
                }
            }
        } else {
            // MOVIMENTAÇÃO DE ANIMAIS PASSIVOS
            if (Math.random() < 0.01) {
                this.rotation += (Math.random() - 0.5) * 1.5;
                this.mesh.rotation.y = this.rotation;
            }
            const dirX = Math.sin(this.rotation);
            const dirZ = Math.cos(this.rotation);
            const nextX = this.mesh.position.x + dirX * 0.8 * delta;
            const nextZ = this.mesh.position.z + dirZ * 0.8 * delta;

            const groundY = this.game.getHighestBlockY(nextX, nextZ);

            if (groundY <= 11) {
                this.rotation += Math.PI * (0.8 + Math.random() * 0.4);
                this.mesh.rotation.y = this.rotation;
            } else {
                this.mesh.position.set(nextX, groundY + 1, nextZ);
            }
        }
    }
}