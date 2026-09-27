import { TextureAtlasGenerator } from '../world/TextureAtlas.js';

export const BLOCKS = {
    FLINT_STEEL: 35,
    CRAFTING_TABLE: 51,
    FURNACE: 52,
    IRON_INGOT: 53,
    BUCKET: 54,        // <-- Balde Vazio
    WATER_BUCKET: 55,  // <-- Balde com Água
    AIR: 0, GRASS: 1, DIRT: 2, STONE: 3, WOOD: 4, LEAVES: 5, SAND: 6, PLANK: 7,
    RED_FLOWER: 8, YELLOW_FLOWER: 9, TALL_GRASS: 10, MUSHROOM: 11, BEDROCK: 12, COBBLE: 13,
    TORCH: 14, CAMPFIRE: 15, RAW_MEAT: 16, COOKED_MEAT: 17, WATER: 18,
    COAL_ORE: 19, IRON_ORE: 20, GOLD_ORE: 21, DIAMOND_ORE: 22,
    SWORD: 23, AXE: 24, ELEMENTAL_CORE: 25, TOTEM: 26, PICKAXE: 27,
    GLASS: 28, DOOR: 29, CHEST: 30, BOW: 31, SNOW: 32, ICE: 33, CACTUS: 34,
    FLINT_STEEL: 35,
    CRAFTING_TABLE: 51,
    FURNACE: 52,
    IRON_INGOT: 53,
    WOOD_PICKAXE: 36, STONE_PICKAXE: 37, IRON_PICKAXE: 38, GOLD_PICKAXE: 39, DIAMOND_PICKAXE: 40,
    WOOD_AXE: 41, STONE_AXE: 42, IRON_AXE: 43, GOLD_AXE: 44, DIAMOND_AXE: 45,
    WOOD_SWORD: 46, STONE_SWORD: 47, IRON_SWORD: 48, GOLD_SWORD: 49, DIAMOND_SWORD: 50
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
        top: [6, 4],     // Nova textura desenhada (Grelha de Crafting)
        side: [0, 1],    // Textura de Tábua nos lados
        bottom: [0, 1],  // Textura de Tábua no fundo
        isCraftingTable: true 
    },
    
    52: { 
        name: 'Fornalha', 
        top: [6, 1],      // Pedregulho no topo
        bottom: [6, 1],   // Pedregulho na base
        side: [6, 1],     // Pedregulho nos lados e trás
        front: [5, 4],    // <-- NOVA POSIÇÃO LIVRE
        isFurnace: true 
    },

    53: { name: 'Barra de Ferro', top: [5,2], plant: true },
    
// Adicionar no final do BLOCK_TILES:
    54: { name: 'Balde', top: [4, 4], plant: true, isTool: true },
    55: { name: 'Balde com Água', top: [3, 2], plant: true, isTool: true }

};

export const BLOCK_PARTICLE_COLORS = {
    1: 0x55a02c, 2: 0x866043, 3: 0x737373, 4: 0x675231, 5: 0x2d7a1e, 6: 0xdbd3a2,
    7: 0xb8945f, 12: 0x333333, 13: 0x5a5a5a, 19: 0x1e1e1e, 20: 0xd89c74, 21: 0xfacc15,
    22: 0x38bdf8, 28: 0xbae6fd, 29: 0x8f6f43, 30: 0x8b5a2b, 32: 0xf8fafc, 33: 0x38bdf8, 34: 0x15803d,
    52: 0x5a5a5a, 53: 0xd89c74
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
    
    // Posição no atlas livre (Coluna 5, Linha 4)
    const tileX = 5 * tileSize; // <-- MUDOU AQUI
    const tileY = 4 * tileSize; // <-- MUDOU AQUI

    // Fundo cinza (pedra)
    ctx.fillStyle = '#686868';
    ctx.fillRect(tileX, tileY, tileSize, tileSize);
    
    // Contorno interior
    ctx.fillStyle = '#4a4a4a';
    ctx.fillRect(tileX + 1, tileY + 1, 14, 14);
    ctx.fillStyle = '#888888';
    ctx.fillRect(tileX + 2, tileY + 2, 12, 12);

    // Abertura superior
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(tileX + 3, tileY + 3, 10, 4);
    ctx.fillStyle = '#0f0f0f';
    ctx.fillRect(tileX + 4, tileY + 4, 8, 2);

    // Abertura inferior
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
    
    // Posição no atlas livre (Coluna 6, Linha 4)
    const tileX = 6 * tileSize; 
    const tileY = 4 * tileSize; 

    // Fundo base (madeira de tábua)
    ctx.fillStyle = '#b8945f';
    ctx.fillRect(tileX, tileY, tileSize, tileSize);
    
    // Moldura mais escura
    ctx.strokeStyle = '#8a6b3c';
    ctx.lineWidth = 1;
    ctx.strokeRect(tileX + 0.5, tileY + 0.5, 15, 15);

    // Grelha 3x3 clássica
    ctx.fillStyle = '#6b4e28';
    
    // Linhas verticais
    ctx.fillRect(tileX + 5, tileY + 2, 1, 12);
    ctx.fillRect(tileX + 10, tileY + 2, 1, 12);
    
    // Linhas horizontais
    ctx.fillRect(tileX + 2, tileY + 5, 12, 1);
    ctx.fillRect(tileX + 2, tileY + 10, 12, 1);

    // Ferramentas no canto (um serrote e um martelo em pixels!)
    ctx.fillStyle = '#888888'; // Lâmina
    ctx.fillRect(tileX + 1, tileY + 1, 4, 2);
    ctx.fillStyle = '#3a2311'; // Cabo
    ctx.fillRect(tileX + 1, tileY + 3, 2, 2);

    ctx.fillStyle = '#4a4a4a'; // Cabeça do martelo
    ctx.fillRect(tileX + 11, tileY + 13, 4, 2);
    ctx.fillStyle = '#5c3a21'; // Cabo do martelo
    ctx.fillRect(tileX + 12, tileY + 9, 2, 4);

    if (ATLAS_TEXTURE) ATLAS_TEXTURE.needsUpdate = true;
})();

export const BLOCK_ICONS = {};
for (let id in BLOCK_TILES) {
    const b = BLOCK_TILES[id];
    // Ao criar o ícone da fornalha para o inventário, forçamos o uso da face da frente (se existir)
    const sideX = b.front ? b.front[0] : (b.side ? b.side[0] : b.top[0]);
    const sideY = b.front ? b.front[1] : (b.side ? b.side[1] : b.top[1]);

    BLOCK_ICONS[id] = TextureAtlasGenerator.createBlockIconDataURL(
        b.top[0], b.top[1], sideX, sideY, ATLAS_CANVAS, b.plant
    );
}