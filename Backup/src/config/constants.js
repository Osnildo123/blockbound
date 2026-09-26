import { TextureAtlasGenerator } from '../world/TextureAtlas.js';

export const BLOCKS = {
    AIR: 0, GRASS: 1, DIRT: 2, STONE: 3, WOOD: 4, LEAVES: 5, SAND: 6, PLANK: 7,
    RED_FLOWER: 8, YELLOW_FLOWER: 9, TALL_GRASS: 10, MUSHROOM: 11, BEDROCK: 12, COBBLE: 13,
    TORCH: 14, CAMPFIRE: 15, RAW_MEAT: 16, COOKED_MEAT: 17, WATER: 18,
    COAL_ORE: 19, IRON_ORE: 20, GOLD_ORE: 21, DIAMOND_ORE: 22,
    SWORD: 23, AXE: 24, ELEMENTAL_CORE: 25, TOTEM: 26, PICKAXE: 27,
    GLASS: 28, DOOR: 29, CHEST: 30, BOW: 31, SNOW: 32, ICE: 33, CACTUS: 34,
    FLINT_STEEL: 35,
    CRAFTING_TABLE: 51,
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
    51: { name: 'Mesa de Trabalho', top: [6,3], side: [6,3], bottom: [0,1], isCraftingTable: true },
};

export const BLOCK_PARTICLE_COLORS = {
    1: 0x55a02c, 2: 0x866043, 3: 0x737373, 4: 0x675231, 5: 0x2d7a1e, 6: 0xdbd3a2,
    7: 0xb8945f, 12: 0x333333, 13: 0x5a5a5a, 19: 0x1e1e1e, 20: 0xd89c74, 21: 0xfacc15,
    22: 0x38bdf8, 28: 0xbae6fd, 29: 0x8f6f43, 30: 0x8b5a2b, 32: 0xf8fafc, 33: 0x38bdf8, 34: 0x15803d
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

export const BLOCK_ICONS = {};
for (let id in BLOCK_TILES) {
    const b = BLOCK_TILES[id];
    BLOCK_ICONS[id] = TextureAtlasGenerator.createBlockIconDataURL(
        b.top[0], b.top[1], b.side ? b.side[0] : b.top[0], b.side ? b.side[1] : b.top[1], ATLAS_CANVAS, b.plant
    );
}