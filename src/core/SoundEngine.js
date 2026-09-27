import { BLOCKS } from '../config/constants.js';

export class SoundEngine {
    constructor() {
        this.ctx = null;
    }

    initCtx() {
        if (!this.ctx) {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    getMaterialType(blockId) {
        if (!blockId) return 'dirt';

        if (blockId === BLOCKS.STONE || blockId === BLOCKS.COBBLE || blockId === BLOCKS.BEDROCK || 
            blockId === BLOCKS.COAL_ORE || blockId === BLOCKS.IRON_ORE || blockId === BLOCKS.GOLD_ORE || 
            blockId === BLOCKS.DIAMOND_ORE || blockId === BLOCKS.FURNACE) {
            return 'stone';
        }

        if (blockId === BLOCKS.WOOD || blockId === BLOCKS.PLANK || blockId === BLOCKS.CHEST || 
            blockId === BLOCKS.CRAFTING_TABLE || blockId === BLOCKS.DOOR) {
            return 'wood';
        }

        if (blockId === BLOCKS.SNOW || blockId === BLOCKS.ICE) {
            return 'snow';
        }

        if (blockId === BLOCKS.WATER || blockId === BLOCKS.WATER_BUCKET) {
            return 'water';
        }

        if (blockId === BLOCKS.LEAVES || blockId === BLOCKS.TALL_GRASS || blockId === BLOCKS.RED_FLOWER || 
            blockId === BLOCKS.YELLOW_FLOWER) {
            return 'plant';
        }

        return 'dirt';
    }

    // Gerador de Ruído Acastanhado/Sufocado (Elimina a estática sintética)
    createOrganicNoiseBuffer(duration = 0.2) {
        const bufferSize = this.ctx.sampleRate * duration;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        let lastOut = 0.0;
        for (let i = 0; i < bufferSize; i++) {
            const white = Math.random() * 2 - 1;
            data[i] = (lastOut + (0.05 * white)) / 1.05;
            lastOut = data[i];
            data[i] *= 3.5;
        }
        return buffer;
    }

    // ============================================================
    // PASSOS NATURAIS POR SUPERFÍCIE
    // ============================================================
    // ============================================================
    // PASSOS NATURAIS POR SUPERFÍCIE (TERRA E AREIA BASEADOS NO QUEBRAR)
    // ============================================================
    // ============================================================
    // PASSOS COM A MESMA MATRIZ DE SOM DE QUEBRAR A TERRA
    // ============================================================
    // ============================================================
    // PASSOS COM MATRIZ CROCANTE (NEVE E TERRA UNIFICADAS)
    // ============================================================
    playStep(blockId) {
        this.initCtx();
        if (!this.ctx) return;

        const material = this.getMaterialType(blockId);
        const t = this.ctx.currentTime;
        const pitchVar = 0.88 + Math.random() * 0.24;

        // 1. ÁGUA
        if (material === 'water') {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(280 * pitchVar, t);
            osc.frequency.exponentialRampToValueAtTime(70, t + 0.1);
            gain.gain.setValueAtTime(0.2, t);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
            osc.connect(gain); gain.connect(this.ctx.destination);
            osc.start(t); osc.stop(t + 0.1);
            return;
        }

        // 2. MADEIRA
        if (material === 'wood') {
            const noise = this.ctx.createBufferSource();
            noise.buffer = this.createOrganicNoiseBuffer(0.09);

            const filter = this.ctx.createBiquadFilter();
            filter.type = 'bandpass';
            filter.frequency.setValueAtTime(450 * pitchVar, t);
            filter.Q.value = 1.2;

            const gain = this.ctx.createGain();
            gain.gain.setValueAtTime(0.35, t);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);

            noise.connect(filter);
            filter.connect(gain);
            gain.connect(this.ctx.destination);
            noise.start(t); noise.stop(t + 0.09);
            return;
        }

        // 3. NEVE (ESTRUTURA SIMILAR À TERRA - CROCANTE COM FILTRO HIGHPASS)
        if (material === 'snow') {
            const noise = this.ctx.createBufferSource();
            noise.buffer = this.createOrganicNoiseBuffer(0.07);

            const filter = this.ctx.createBiquadFilter();
            filter.type = 'highpass';
            filter.frequency.setValueAtTime(1100 * pitchVar, t);

            const gain = this.ctx.createGain();
            gain.gain.setValueAtTime(0.22, t);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.065);

            noise.connect(filter);
            filter.connect(gain);
            gain.connect(this.ctx.destination);

            noise.start(t);
            noise.stop(t + 0.07);
            return;
        }

        // 4. PEDRA
        if (material === 'stone') {
            const noise = this.ctx.createBufferSource();
            noise.buffer = this.createOrganicNoiseBuffer(0.05);

            const filter = this.ctx.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(320 * pitchVar, t);

            const gain = this.ctx.createGain();
            gain.gain.setValueAtTime(0.20, t);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.045);

            noise.connect(filter);
            filter.connect(gain);
            gain.connect(this.ctx.destination);
            noise.start(t); noise.stop(t + 0.05);
            return;
        }

        // 5. TERRA / AREIA / RELVA
        const noise = this.ctx.createBufferSource();
        noise.buffer = this.createOrganicNoiseBuffer(0.07);

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.setValueAtTime(950 * pitchVar, t);

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.25, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.065);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);

        noise.start(t);
        noise.stop(t + 0.07);
    }

    // ============================================================
    // SOM DE QUEBRAR BLOCOS (PEDRA E BARRO/TERRA INVERTIDOS)
    // ============================================================
    playBreak(blockId) {
        this.initCtx();
        if (!this.ctx) return;

        const material = this.getMaterialType(blockId);
        const t = this.ctx.currentTime;
        const pitchVar = 0.85 + Math.random() * 0.3;

        // 1. MADEIRA
        if (material === 'wood') {
            const noise = this.ctx.createBufferSource();
            noise.buffer = this.createOrganicNoiseBuffer(0.18);

            const filter = this.ctx.createBiquadFilter();
            filter.type = 'bandpass';
            filter.frequency.setValueAtTime(550 * pitchVar, t);
            filter.Q.value = 0.9;

            const gain = this.ctx.createGain();
            gain.gain.setValueAtTime(0.5, t);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.16);

            const bodyOsc = this.ctx.createOscillator();
            const bodyGain = this.ctx.createGain();
            bodyOsc.type = 'sine';
            bodyOsc.frequency.setValueAtTime(130 * pitchVar, t);
            bodyOsc.frequency.exponentialRampToValueAtTime(40, t + 0.12);
            bodyGain.gain.setValueAtTime(0.3, t);
            bodyGain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);

            noise.connect(filter);
            filter.connect(gain);
            gain.connect(this.ctx.destination);

            bodyOsc.connect(bodyGain);
            bodyGain.connect(this.ctx.destination);

            noise.start(t); noise.stop(t + 0.18);
            bodyOsc.start(t); bodyOsc.stop(t + 0.12);
            return;
        }

        // 2. PEDRA (AGORA RECEBE O SOM SUAVE/ABAFADO ANTERIOR DO BARRO)
        if (material === 'stone') {
            const noise = this.ctx.createBufferSource();
            noise.buffer = this.createOrganicNoiseBuffer(0.15);

            const filter = this.ctx.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(380 * pitchVar, t);

            const gain = this.ctx.createGain();
            gain.gain.setValueAtTime(0.35, t);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.14);

            noise.connect(filter);
            filter.connect(gain);
            gain.connect(this.ctx.destination);
            noise.start(t); noise.stop(t + 0.15);
            return;
        }

        // 3. BARRO / TERRA / OUTROS (AGORA RECEBE O ESTILHAÇO/ESTALO ANTERIOR DA PEDRA)
        const noise = this.ctx.createBufferSource();
        noise.buffer = this.createOrganicNoiseBuffer(0.18);

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.setValueAtTime(1000 * pitchVar, t);

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.4, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.16);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);
        noise.start(t); noise.stop(t + 0.18);
    }

    // ============================================================
    // SOM DE COLOCAR BLOCO
    // ============================================================
    playPlace(blockId) {
        this.initCtx();
        if (!this.ctx) return;

        const material = this.getMaterialType(blockId);
        const t = this.ctx.currentTime;
        const pitchVar = 0.9 + Math.random() * 0.2;

        const noise = this.ctx.createBufferSource();
        noise.buffer = this.createOrganicNoiseBuffer(0.08);

        const filter = this.ctx.createBiquadFilter();
        const gain = this.ctx.createGain();

        if (material === 'wood') {
            filter.type = 'bandpass';
            filter.frequency.setValueAtTime(480 * pitchVar, t);
            filter.Q.value = 1.5;
            gain.gain.setValueAtTime(0.35, t);
        } else if (material === 'stone') {
            filter.type = 'highpass';
            filter.frequency.setValueAtTime(1100 * pitchVar, t);
            gain.gain.setValueAtTime(0.30, t);
        } else {
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(280 * pitchVar, t);
            gain.gain.setValueAtTime(0.30, t);
        }

        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.07);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);

        noise.start(t); noise.stop(t + 0.08);
    }

    playEat() {
        this.initCtx();
        if (!this.ctx) return;
        const t = this.ctx.currentTime;
        const pitchVar = 0.9 + Math.random() * 0.2;

        const noise = this.ctx.createBufferSource();
        noise.buffer = this.createOrganicNoiseBuffer(0.06);
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(800 * pitchVar, t);
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.2, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);

        noise.connect(filter); filter.connect(gain); gain.connect(this.ctx.destination);
        noise.start(t); noise.stop(t + 0.06);
    }
}