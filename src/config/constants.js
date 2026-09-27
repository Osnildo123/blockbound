import { TextureAtlasGenerator } from '../world/TextureAtlas.js';

export const BLOCKS = {
    AIR: 0, GRASS: 1, DIRT: 2, STONE: 3, WOOD: 4, LEAVES: 5, SAND: 6, PLANK: 7,
    RED_FLOWER: 8, YELLOW_FLOWER: 9, TALL_GRASS: 10, MUSHROOM: 11, BEDROCK: 12, COBBLE: 13,
    TORCH: 14, CAMPFIRE: 15, RAW_MEAT: 16, COOKED_MEAT: 17, WATER: 18,
    COAL_ORE: 19, IRON_ORE: 20, GOLD_ORE: 21, DIAMOND_ORE: 22,
    SWORD: 23, AXE: 24, ELEMENTAL_CORE: 25, TOTEM: 26, PICKAXE: 27,
    GLASS: 28, DOOR: 29, CHEST: 30, BOW: 31, SNOW: 32, ICE: 33, CACTUS: 34,
    FLINT_STEEL: 35,
    WOOD_PICKAXE: 36, STONE_PICKAXE: 37, IRON_PICKAXE: 38, GOLD_PICKAXE: 39, DIAMOND_PICKAXE: 40,
    WOOD_AXE: 41, STONE_AXE: 42, IRON_AXE: 43, GOLD_AXE: 44, DIAMOND_AXE: 45,
    WOOD_SWORD: 46, STONE_SWORD: 47, IRON_SWORD: 48, GOLD_SWORD: 49, DIAMOND_SWORD: 50,
    CRAFTING_TABLE: 51,
    FURNACE: 52,
    IRON_INGOT: 53,
    BUCKET: 54,        // Balde Vazio
    WATER_BUCKET: 55,  // Balde com Água
    GOLD_INGOT: 56,    // Barra de Ouro
    LAVA: 57           // Lava Incandescente
};

export const BLOCK_TILES = {
    1: { name: 'Grama', top: [0,0], side: [1,0], bottom: [2,0] },
    2: { name: 'Terra', top: [2,0], side: [2,0], bottom: [2,0] },
    3: { name: 'Pedra', top: [3,0], side: [3,0], bottom: [3,0] },
    4: { name: 'Tronco', top: [5,0], side: [4,0], bottom: [5,0] },
    5: { name: 'Folha', top: [6,0], side: [6,0], bottom: [6,0], transparent: true },
    6: { name: 'Areia', top: [7,0], side: [7,0], bottom: [7,0] },
    7: { name: 'Tábua', top: [0,1], side: [0,1], bottom: [0,1] },
    8: { name: 'Flor Vermelha', top: [1,1], plant: true },
    9: { name: 'Flor Amarela', top: [2,1], plant: true },
    10: { name: 'Grama Alta', top: [3,1], plant: true },
    11: { name: 'Cogumelo', top: [4,1], plant: true },
    12: { name: 'Bedrock', top: [5,1], side: [5,1], bottom: [5,1], unbreakable: true },
    13: { name: 'Pedregulho', top: [6,1], side: [6,1], bottom: [6,1] },
    14: { name: 'Tocha', top: [7,1], plant: true, light: true },
    15: { name: 'Fogueira', top: [0,2], plant: true, campfire: true, light: true },
    16: { name: 'Carne Crua', top: [1,2], plant: true, food: true, healHunger: 20 },
    17: { name: 'Carne Assada', top: [2,2], plant: true, food: true, healHunger: 50, healHP: 20 },
    18: { name: 'Água', top: [3,2], side: [3,2], bottom: [3,2], water: true },
    19: { name: 'Minério de Carvão', top: [4,2], side: [4,2], bottom: [4,2] },
    20: { name: 'Minério de Ferro', top: [5,2], side: [5,2], bottom: [5,2] },
    21: { name: 'Minério de Ouro', top: [6,2], side: [6,2], bottom: [6,2] },
    22: { name: 'Minério de Diamante', top: [7,2], side: [7,2], bottom: [7,2] },
    23: { name: 'Espada de Ferro', top: [0,3], plant: true, isTool: true, toolType: 'sword', toolDamage: 5, toolSpeed: 5.5 },
    24: { name: 'Machado de Ferro', top: [1,3], plant: true, isTool: true, toolType: 'axe', toolSpeed: 5.5 },
    25: { name: 'Núcleo Elementar', top: [2,3], plant: true, isTool: true },
    26: { name: 'Totem Repelente', top: [3,3], plant: true, light: true, isTotem: true },
    27: { name: 'Picareta de Ferro', top: [4,3], plant: true, isTool: true, toolType: 'pickaxe', toolSpeed: 5.5 },
    28: { name: 'Vidro', top: [5,3], side: [5,3], bottom: [5,3], transparent: true },
    29: { name: 'Porta', top: [6,3], side: [6,3], bottom: [6,3], isDoor: true, transparent: true },
    30: { name: 'Baú', top: [7,3], side: [7,3], bottom: [7,3], isChest: true },
    31: { name: 'Arco e Flecha', top: [0,4], plant: true, isTool: true },
    32: { name: 'Neve', top: [1,4], side: [1,4], bottom: [2,0] },
    33: { name: 'Gelo', top: [2,4], side: [2,4], bottom: [2,4], transparent: true },
    34: { name: 'Cacto', top: [3,4], side: [3,4], bottom: [3,4], transparent: true },
    35: { name: 'Isqueiro', top: [4,4], plant: true, isTool: true },

    36: { name: 'Picareta de Madeira', top: [4,3], plant: true, isTool: true, toolType: 'pickaxe', toolSpeed: 2.0 },
    37: { name: 'Picareta de Pedra', top: [4,3], plant: true, isTool: true, toolType: 'pickaxe', toolSpeed: 3.5 },
    38: { name: 'Picareta de Ferro', top: [4,3], plant: true, isTool: true, toolType: 'pickaxe', toolSpeed: 5.5 },
    39: { name: 'Picareta de Ouro', top: [4,3], plant: true, isTool: true, toolType: 'pickaxe', toolSpeed: 8.0 },
    40: { name: 'Picareta de Diamante', top: [4,3], plant: true, isTool: true, toolType: 'pickaxe', toolSpeed: 10.0 },

    41: { name: 'Machado de Madeira', top: [1,3], plant: true, isTool: true, toolType: 'axe', toolSpeed: 2.0 },
    42: { name: 'Machado de Pedra', top: [1,3], plant: true, isTool: true, toolType: 'axe', toolSpeed: 3.5 },
    43: { name: 'Machado de Ferro', top: [1,3], plant: true, isTool: true, toolType: 'axe', toolSpeed: 5.5 },
    44: { name: 'Machado de Ouro', top: [1,3], plant: true, isTool: true, toolType: 'axe', toolSpeed: 8.0 },
    45: { name: 'Machado de Diamante', top: [1,3], plant: true, isTool: true, toolType: 'axe', toolSpeed: 10.0 },

    46: { name: 'Espada de Madeira', top: [0,3], plant: true, isTool: true, toolType: 'sword', toolDamage: 2, toolSpeed: 2.0 },
    47: { name: 'Espada de Pedra', top: [0,3], plant: true, isTool: true, toolType: 'sword', toolDamage: 3, toolSpeed: 3.5 },
    48: { name: 'Espada de Ferro', top: [0,3], plant: true, isTool: true, toolType: 'sword', toolDamage: 5, toolSpeed: 5.5 },
    49: { name: 'Espada de Ouro', top: [0,3], plant: true, isTool: true, toolType: 'sword', toolDamage: 4, toolSpeed: 8.0 },
    50: { name: 'Espada de Diamante', top: [0,3], plant: true, isTool: true, toolType: 'sword', toolDamage: 8, toolSpeed: 10.0 },
    
    51: { 
        name: 'Mesa de Trabalho', 
        top: [6, 4], 
        side: [0, 1], 
        bottom: [0, 1], 
        isCraftingTable: true 
    },
    
    52: { 
        name: 'Fornalha', 
        top: [6, 1], 
        bottom: [6, 1], 
        side: [6, 1], 
        front: [5, 4], 
        isFurnace: true 
    },

    53: { name: 'Barra de Ferro', top: [3, 3], isTool: true },
    54: { name: 'Balde', top: [0, 5], plant: true, isTool: true },
    55: { name: 'Balde com Água', top: [1, 5], plant: true, isTool: true },
    56: { name: 'Barra de Ouro', top: [6, 2], isTool: true },
    57: { name: 'Lava', top: [2, 5], side: [2, 5], bottom: [2, 5], light: true, lava: true }
};

export const BLOCK_PARTICLE_COLORS = {
    1: 0x55a02c, 2: 0x866043, 3: 0x737373, 4: 0x675231, 5: 0x2d7a1e, 6: 0xdbd3a2,
    7: 0xb8945f, 12: 0x333333, 13: 0x5a5a5a, 19: 0x1e1e1e, 20: 0xd89c74, 21: 0xfacc15,
    22: 0x38bdf8, 28: 0xbae6fd, 29: 0x8f6f43, 30: 0x8b5a2b, 32: 0xf8fafc, 33: 0x38bdf8, 34: 0x15803d,
    52: 0x5a5a5a, 53: 0xd89c74, 57: 0xff4500
};

export function isTransparentBlock(id) {
    if (id === BLOCKS.AIR) return true;
    const info = BLOCK_TILES[id];
    if (!info) return true;
    return info.plant || info.transparent || info.water || info.isDoor ||
           id === BLOCKS.LEAVES || id === BLOCKS.GLASS || id === BLOCKS.ICE ||
           id === BLOCKS.TORCH || id === BLOCKS.CAMPFIRE || id === BLOCKS.CACTUS || id === BLOCKS.CHEST;
}

const generatedAtlas = TextureAtlasGenerator.generateAtlas();
export const ATLAS_TEXTURE = generatedAtlas.texture;
export const ATLAS_CANVAS = generatedAtlas.canvas;

// DESENHA A FACE DA FORNALHA NO ATLAS
(function drawFurnaceFront() {
    if (!ATLAS_CANVAS) return;
    const ctx = ATLAS_CANVAS.getContext('2d');
    const tileSize = 16; 
    
    const tileX = 5 * tileSize;
    const tileY = 4 * tileSize;

    ctx.fillStyle = '#686868';
    ctx.fillRect(tileX, tileY, tileSize, tileSize);
    
    ctx.fillStyle = '#4a4a4a';
    ctx.fillRect(tileX + 1, tileY + 1, 14, 14);
    ctx.fillStyle = '#888888';
    ctx.fillRect(tileX + 2, tileY + 2, 12, 12);

    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(tileX + 3, tileY + 3, 10, 4);
    ctx.fillStyle = '#0f0f0f';
    ctx.fillRect(tileX + 4, tileY + 4, 8, 2);

    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(tileX + 3, tileY + 9, 10, 4);
    ctx.fillStyle = '#0f0f0f';
    ctx.fillRect(tileX + 4, tileY + 10, 8, 2);

    if (ATLAS_TEXTURE) ATLAS_TEXTURE.needsUpdate = true;
})();

// DESENHA O TOPO DA MESA DE TRABALHO NO ATLAS
(function drawCraftingTableTop() {
    if (!ATLAS_CANVAS) return;
    const ctx = ATLAS_CANVAS.getContext('2d');
    const tileSize = 16; 
    
    const tileX = 6 * tileSize; 
    const tileY = 4 * tileSize; 

    ctx.fillStyle = '#b8945f';
    ctx.fillRect(tileX, tileY, tileSize, tileSize);
    
    ctx.strokeStyle = '#8a6b3c';
    ctx.lineWidth = 1;
    ctx.strokeRect(tileX + 0.5, tileY + 0.5, 15, 15);

    ctx.fillStyle = '#6b4e28';
    
    ctx.fillRect(tileX + 5, tileY + 2, 1, 12);
    ctx.fillRect(tileX + 10, tileY + 2, 1, 12);
    
    ctx.fillRect(tileX + 2, tileY + 5, 12, 1);
    ctx.fillRect(tileX + 2, tileY + 10, 12, 1);

    ctx.fillStyle = '#888888';
    ctx.fillRect(tileX + 1, tileY + 1, 4, 2);
    ctx.fillStyle = '#3a2311';
    ctx.fillRect(tileX + 1, tileY + 3, 2, 2);

    ctx.fillStyle = '#4a4a4a';
    ctx.fillRect(tileX + 11, tileY + 13, 4, 2);
    ctx.fillStyle = '#5c3a21';
    ctx.fillRect(tileX + 12, tileY + 9, 2, 4);

    if (ATLAS_TEXTURE) ATLAS_TEXTURE.needsUpdate = true;
})();

// ============================================================
// DESENHA O BALDE VAZIO NO ATLAS (Coluna 0, Linha 5)
// ============================================================
(function drawBucket() {
    if (!ATLAS_CANVAS) return;
    const ctx = ATLAS_CANVAS.getContext('2d');
    ctx.imageSmoothingEnabled = false;

    const tileSize = 16; 
    const tileX = 0 * tileSize; 
    const tileY = 5 * tileSize; 

    const pixels = [
        "....KKKKKKKK....",
        "..KKLLLLLLLLKK..",
        "..KLLLLLLLLLL2K.",
        ".KKKKKKKKKKKKKKK",
        ".KWWLGGGGGGGDG2K",
        ".KWWLGGGGGGGDG2K",
        ".KWWLGGGGGGGDG2K",
        ".KWWWLGGGGGGDG2K",
        ".KWWWLGGGGGGDG2K",
        ".KWWWWLGGGGGGGGK",
        "..KWWWWLGGGGGGG2K",
        "..KWWWWWGGGGGGG2K",
        "..KWWWWWGGGGGGG2K",
        "....KWWWWGGGGG2K.",
        "....KKKKKKKKKK..",
        "................"
    ];

    const palette = {
        'K': '#2a2a2a',
        'W': '#ffffff',
        'L': '#d0d0d0',
        'G': '#888888',
        'D': '#4a4a4a',
        '2': '#666666'
    };

    for (let r = 0; r < 16; r++) {
        for (let c = 0; c < 16; c++) {
            const char = pixels[r][c];
            if (char !== '.' && palette[char]) {
                ctx.fillStyle = palette[char];
                ctx.fillRect(tileX + c, tileY + r, 1, 1);
            }
        }
    }

    if (ATLAS_TEXTURE) ATLAS_TEXTURE.needsUpdate = true;
})();

// ============================================================
// DESENHA O BALDE COM ÁGUA NO ATLAS (Coluna 1, Linha 5)
// ============================================================
(function drawWaterBucket() {
    if (!ATLAS_CANVAS) return;
    const ctx = ATLAS_CANVAS.getContext('2d');
    ctx.imageSmoothingEnabled = false;

    const tileSize = 16; 
    const tileX = 1 * tileSize; 
    const tileY = 5 * tileSize; 

    const pixels = [
        "....KKKKKKKK....",
        "..KK11223322KK..",
        "..K11223322112K.",
        ".K1122332211221K",
        ".KDKKKKKKKKKKDK.",
        ".KL22222232GGG2K",
        ".KWL222223GGDG2K",
        ".KWL222223GGDG2K",
        ".KWWL22223GGDG2K",
        ".KWWWL2223GGDG2K",
        ".KWWWWL223GGGG2K",
        "..KWWWWL232GGG2K",
        "..KWWWWW332GGG2K",
        "..KWWWWW332GGG2K",
        "....KWWWW33GG2K.",
        "....KKKKKKKKKK.."
    ];

    const palette = {
        'K': '#222222',
        'W': '#ffffff',
        'L': '#d0d0d0',
        'G': '#888888',
        'D': '#4a4a4a',
        '1': '#00d5ff',
        '2': '#0088ff',
        '3': '#0055cc'
    };

    for (let r = 0; r < 16; r++) {
        for (let c = 0; c < 16; c++) {
            const char = pixels[r][c];
            if (char !== '.' && palette[char]) {
                ctx.fillStyle = palette[char];
                ctx.fillRect(tileX + c, tileY + r, 1, 1);
            }
        }
    }

    if (ATLAS_TEXTURE) ATLAS_TEXTURE.needsUpdate = true;
})();

// ============================================================
// DESENHA A LAVA NO ATLAS (Coluna 2, Linha 5)
// ============================================================
(function drawLava() {
    if (!ATLAS_CANVAS) return;
    const ctx = ATLAS_CANVAS.getContext('2d');
    ctx.imageSmoothingEnabled = false;

    const tileSize = 16; 
    const tileX = 2 * tileSize; 
    const tileY = 5 * tileSize; 

    const pixels = [
        "RRRROOOOORRRROOO",
        "RROOOOOOORROOOOO",
        "OOOOOYYYYOOOOOYY",
        "OOOYYYYYYYOOYYYY",
        "OYYYYYYRRYYYYYRR",
        "YYYYYRRRRYYRRRRR",
        "YYYRRRRRRRRRRRRR",
        "YRRRRROOOORRRRRO",
        "RRRROOOOOOORROOO",
        "RROOOOOOYYYYOOOY",
        "OOOOOYYYYYYYYYYY",
        "OOYYYYYYYYYYYRRR",
        "YYYYYYYYYRRRRRRR",
        "YYYYYRRRRRRRROOO",
        "YYRRRRRRRROOOOOO",
        "RRRRRRROOOOOOOOO"
    ];

    const palette = {
        'R': '#8b0000', // Magma escuro / crosta
        'O': '#ff4500', // Laranja incandescent
        'Y': '#ffcc00'  // Amarelo brilhante
    };

    for (let r = 0; r < 16; r++) {
        for (let c = 0; c < 16; c++) {
            const char = pixels[r][c];
            if (palette[char]) {
                ctx.fillStyle = palette[char];
                ctx.fillRect(tileX + c, tileY + r, 1, 1);
            }
        }
    }

    if (ATLAS_TEXTURE) ATLAS_TEXTURE.needsUpdate = true;
})();

// ============================================================
// REDESENHA O TOPO DA GRAMA (Coluna 0, Linha 0)
// ============================================================
(function drawGrassTop() {
    if (!ATLAS_CANVAS) return;
    const ctx = ATLAS_CANVAS.getContext('2d');
    ctx.imageSmoothingEnabled = false;

    const tileSize = 16;
    const tileX = 0 * tileSize;
    const tileY = 0 * tileSize;

    const pixels = [
        "4213234123214534",
        "3422312233242314",
        "2341132332344312",
        "3243321322345431",
        "2234443244345321",
        "3123212431443443",
        "4321334322432211",
        "3332145324443322",
        "2444345433453133",
        "2134334323422333",
        "3331144334334312",
        "2242233223244322",
        "1343343133243233",
        "2234442223343322",
        "3423344324234433",
        "3422233221343333"
    ];

    const palette = {
        '1': '#355320',
        '2': '#3e6326',
        '3': '#4d7c30',
        '4': '#5c913b',
        '5': '#6aa244'
    };

    for (let r = 0; r < 16; r++) {
        for (let c = 0; c < 16; c++) {
            const char = pixels[r][c];
            ctx.fillStyle = palette[char] || palette['4'];
            ctx.fillRect(tileX + c, tileY + r, 1, 1);
        }
    }
})();

// ============================================================
// REDESENHA O LADO DA GRAMA (Coluna 1, Linha 0)
// ============================================================
(function drawGrassSide() {
    if (!ATLAS_CANVAS) return;
    const ctx = ATLAS_CANVAS.getContext('2d');
    ctx.imageSmoothingEnabled = false;

    const tileSize = 16;
    const tileX = 1 * tileSize;
    const tileY = 0 * tileSize;

    const pixels = [
        "4323454323443234",
        "3432314323143231",
        "2343212343212343",
        "321d432d314d321d",
        "d32dd4dd3d4dd3dd",
        "MMMMLMDMMMMLMHMd",
        "dLMMMDPpMMMDMMLM",
        "MDMMMMLMMDMMMLMD",
        "LMHMDMMMMLMHMDMM",
        "MDMMMLMPpDMMMLMH",
        "dMLMMMDPdMMMDdMM",
        "MMDDMMLMMMDDMLMD",
        "LMHMPpMDDMMMMDdM",
        "MDMMpdMMMMHMDMLM",
        "dMLMHMDMMMLMHMDd",
        "MMDDMMLMPpDDMMLM"
    ];

    const palette = {
        '1': '#355320',
        '2': '#3e6326',
        '3': '#4d7c30',
        '4': '#5c913b',
        '5': '#6aa244',
        'D': '#3b2315',
        'd': '#4d301d',
        'M': '#644027',
        'L': '#7c5234',
        'H': '#966543',
        'P': '#6e6e6e',
        'p': '#484848'
    };

    for (let r = 0; r < 16; r++) {
        for (let c = 0; c < 16; c++) {
            const char = pixels[r][c];
            if (palette[char]) {
                ctx.fillStyle = palette[char];
                ctx.fillRect(tileX + c, tileY + r, 1, 1);
            }
        }
    }

    if (ATLAS_TEXTURE) ATLAS_TEXTURE.needsUpdate = true;
})();

// ============================================================
// REDESENHA A CASCA DO TRONCO (Coluna 4, Linha 0)
// ============================================================
(function drawWoodSide() {
    if (!ATLAS_CANVAS) return;
    const ctx = ATLAS_CANVAS.getContext('2d');
    ctx.imageSmoothingEnabled = false;

    const tileSize = 16;
    const tileX = 4 * tileSize;
    const tileY = 0 * tileSize;

    const pixels = [
        "3341133441334133",
        "3341133441334133",
        "3113331133344133",
        "3113331133344133",
        "3334413341133311",
        "3334413341133311",
        "4113334113344133",
        "4113334113344133",
        "3331133344133411",
        "3331133344133411",
        "1133441333113334",
        "1133441333113334",
        "3441333113344133",
        "3441333113344133",
        "3333113344133411",
        "3333113344133411"
    ];

    const palette = {
        '1': '#3a2514',
        '3': '#5f4024',
        '4': '#7d5833'
    };

    for (let r = 0; r < 16; r++) {
        for (let c = 0; c < 16; c++) {
            const char = pixels[r][c];
            ctx.fillStyle = palette[char] || palette['3'];
            ctx.fillRect(tileX + c, tileY + r, 1, 1);
        }
    }

    if (ATLAS_TEXTURE) ATLAS_TEXTURE.needsUpdate = true;
})();

// ============================================================
// REDESENHA O TOPO DO TRONCO (Coluna 5, Linha 0)
// ============================================================
(function drawWoodTop() {
    if (!ATLAS_CANVAS) return;
    const ctx = ATLAS_CANVAS.getContext('2d');
    ctx.imageSmoothingEnabled = false;

    const tileSize = 16;
    const tileX = 5 * tileSize;
    const tileY = 0 * tileSize;

    const pixels = [
        "KKKKKKKKKKKKKKKK",
        "KDDDDDDDDDDDDDDK",
        "KDMMMMMMMMMMMMDK",
        "KDMLLLLLLLLLLMDK",
        "KDMLBBBBBBBBLMDK",
        "KDMLBLLLLLLBLMDK",
        "KDMLBLBBBBBLBLMDK",
        "KDMLBLBBBBBLBLMDK",
        "KDMLBLBBBBBLBLMDK",
        "KDMLBLBBBBBLBLMDK",
        "KDMLBLLLLLLBLMDK",
        "KDMLBBBBBBBBLMDK",
        "KDMLLLLLLLLLLMDK",
        "KDMMMMMMMMMMMMDK",
        "KDDDDDDDDDDDDDDK",
        "KKKKKKKKKKKKKKKK"
    ];

    const palette = {
        'K': '#33200d',
        'D': '#4d3219',
        'M': '#694828',
        'L': '#91703e',
        'B': '#b8945f'
    };

    for (let r = 0; r < 16; r++) {
        for (let c = 0; c < 16; c++) {
            ctx.fillStyle = palette[pixels[r][c]] || '#b8945f';
            ctx.fillRect(tileX + c, tileY + r, 1, 1);
        }
    }

    if (ATLAS_TEXTURE) ATLAS_TEXTURE.needsUpdate = true;
})();

// ============================================================
// REDESENHA AS FOLHAS DA ÁRVORE (Coluna 6, Linha 0)
// ============================================================
(function drawLeaves() {
    if (!ATLAS_CANVAS) return;
    const ctx = ATLAS_CANVAS.getContext('2d');
    ctx.imageSmoothingEnabled = false;

    const tileSize = 16;
    const tileX = 6 * tileSize;
    const tileY = 0 * tileSize;

    ctx.clearRect(tileX, tileY, tileSize, tileSize);

    const pixels = [
        "34.12.43.2.34.12",
        ".123..24.31..23.",
        "2.42.13.3.1.42.1",
        ".1.4..12.42.1.34",
        "4.31.24.31.23.1.",
        ".2.23.1.42..13.2",
        "12..42.3..24.1..",
        ".3..12.43.12.34.",
        "2.43..21.4..31.2",
        ".1.24.3..24.1..3",
        "42..1.23.1.2.42.",
        "3.13.4..21.3.1.3",
        ".24.1..34.21.4..",
        "1..32.4..1.23.12",
        ".42..1.32.42..1.",
        "2..4.2..3..42.1."
    ];

    const palette = {
        '1': '#193b0b',
        '2': '#245210',
        '3': '#306e15',
        '4': '#3a8519'
    };

    for (let r = 0; r < 16; r++) {
        for (let c = 0; c < 16; c++) {
            const char = pixels[r][c];
            if (char !== '.' && palette[char]) {
                ctx.fillStyle = palette[char];
                ctx.fillRect(tileX + c, tileY + r, 1, 1);
            }
        }
    }

    if (ATLAS_TEXTURE) ATLAS_TEXTURE.needsUpdate = true;
})();

// ============================================================
// O GERADOR DE ÍCONES FICA NO FINAL DE TUDO!
// ============================================================
export const BLOCK_ICONS = {};
for (let id in BLOCK_TILES) {
    const b = BLOCK_TILES[id];
    const sideX = b.front ? b.front[0] : (b.side ? b.side[0] : b.top[0]);
    const sideY = b.front ? b.front[1] : (b.side ? b.side[1] : b.top[1]);

    BLOCK_ICONS[id] = TextureAtlasGenerator.createBlockIconDataURL(
        b.top[0], b.top[1], sideX, sideY, ATLAS_CANVAS, b.plant
    );
}