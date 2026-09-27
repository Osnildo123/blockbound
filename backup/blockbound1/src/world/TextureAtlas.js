export class TextureAtlasGenerator {
    static generateAtlas() {
        const canvas = document.createElement('canvas'); canvas.width = 128; canvas.height = 128;
        const ctx = canvas.getContext('2d');

        const drawTile = (x, y, drawFn) => {
            ctx.save(); ctx.translate(x * 16, y * 16); drawFn(ctx); ctx.restore();
        };

        const drawOreTile = (tx, ty, spotColor) => {
            drawTile(tx, ty, (c) => {
                c.fillStyle = '#737373'; c.fillRect(0, 0, 16, 16);
                for (let i = 0; i < 35; i++) {
                    c.fillStyle = Math.random() > 0.5 ? '#585858' : '#8e8e8e';
                    c.fillRect(Math.floor(Math.random()*16), Math.floor(Math.random()*16), 1, 1);
                }
                c.fillStyle = spotColor;
                const spots = [[3,4],[4,4],[4,5],[10,2],[11,2],[11,3],[7,10],[8,10],[8,11],[2,12],[3,12],[12,12]];
                for (let s of spots) { c.fillRect(s[0], s[1], 1, 1); }
            });
        };

        const drawToolTile = (tx, ty, toolType, headColor) => {
            drawTile(tx, ty, (c) => {
                c.fillStyle = '#675231';
                c.fillRect(4, 10, 2, 5); c.fillRect(6, 8, 2, 2); c.fillRect(8, 6, 2, 2);
                c.fillStyle = headColor;
                if (toolType === 'pickaxe') {
                    c.fillRect(5, 2, 9, 3); c.fillRect(11, 5, 3, 2);
                } else if (toolType === 'axe') {
                    c.fillRect(8, 2, 6, 5); c.fillRect(10, 7, 3, 2);
                } else if (toolType === 'sword') {
                    c.fillRect(8, 2, 6, 6); c.fillRect(6, 6, 2, 2);
                }
            });
        };

        drawTile(0, 0, (c) => {
            c.fillStyle = '#55a02c'; c.fillRect(0, 0, 16, 16);
            for (let i = 0; i < 40; i++) {
                c.fillStyle = Math.random() > 0.5 ? '#63b834' : '#458522';
                c.fillRect(Math.floor(Math.random()*16), Math.floor(Math.random()*16), 1, 1);
            }
        });

        drawTile(1, 0, (c) => {
            c.fillStyle = '#866043'; c.fillRect(0, 0, 16, 16);
            for (let i = 0; i < 30; i++) {
                c.fillStyle = '#6d4c33'; c.fillRect(Math.floor(Math.random()*16), Math.floor(Math.random()*16), 1, 1);
            }
            c.fillStyle = '#55a02c'; c.fillRect(0, 0, 16, 4);
            for (let x = 0; x < 16; x++) {
                if (Math.random() > 0.35) c.fillRect(x, 4, 1, 1 + Math.floor(Math.random()*3));
            }
        });

        drawTile(2, 0, (c) => {
            c.fillStyle = '#866043'; c.fillRect(0, 0, 16, 16);
            for (let i = 0; i < 40; i++) {
                c.fillStyle = Math.random() > 0.5 ? '#6d4c33' : '#9c7252';
                c.fillRect(Math.floor(Math.random()*16), Math.floor(Math.random()*16), 1, 1);
            }
        });

        drawTile(3, 0, (c) => {
            c.fillStyle = '#737373'; c.fillRect(0, 0, 16, 16);
            for (let i = 0; i < 45; i++) {
                c.fillStyle = Math.random() > 0.5 ? '#585858' : '#8e8e8e';
                c.fillRect(Math.floor(Math.random()*16), Math.floor(Math.random()*16), 1, 1);
            }
        });

        drawTile(4, 0, (c) => {
            c.fillStyle = '#675231'; c.fillRect(0, 0, 16, 16);
            c.fillStyle = '#4a3a21';
            for (let y = 0; y < 16; y += 4) c.fillRect(0, y, 16, 1);
        });

        drawTile(5, 0, (c) => {
            c.fillStyle = '#80663f'; c.fillRect(0, 0, 16, 16);
            c.fillStyle = '#5c482b'; c.fillRect(2, 2, 12, 12);
            c.fillStyle = '#80663f'; c.fillRect(4, 4, 8, 8);
        });

        drawTile(6, 0, (c) => {
            c.fillStyle = '#2d7a1e'; c.fillRect(0, 0, 16, 16);
            for (let i = 0; i < 50; i++) {
                c.fillStyle = Math.random() > 0.5 ? '#3da82a' : '#1e5414';
                c.fillRect(Math.floor(Math.random()*16), Math.floor(Math.random()*16), 1, 1);
            }
        });

        drawTile(7, 0, (c) => {
            c.fillStyle = '#dbd3a2'; c.fillRect(0, 0, 16, 16);
            for (let i = 0; i < 35; i++) {
                c.fillStyle = Math.random() > 0.5 ? '#c9c08f' : '#ede5b4';
                c.fillRect(Math.floor(Math.random()*16), Math.floor(Math.random()*16), 1, 1);
            }
        });

        drawTile(0, 1, (c) => {
            c.fillStyle = '#b8945f'; c.fillRect(0, 0, 16, 16);
            c.fillStyle = '#8f6f43';
            for (let y = 0; y < 16; y += 4) c.fillRect(0, y, 16, 1);
        });

        drawTile(1, 1, (c) => {
            c.fillStyle = '#2b6e1e'; c.fillRect(7, 8, 2, 8);
            c.fillStyle = '#e53935'; c.fillRect(5, 4, 6, 5);
        });

        drawTile(2, 1, (c) => {
            c.fillStyle = '#2b6e1e'; c.fillRect(7, 8, 2, 8);
            c.fillStyle = '#fbc02d'; c.fillRect(5, 4, 6, 5);
        });

        drawTile(3, 1, (c) => {
            c.fillStyle = '#3da82a';
            c.fillRect(3, 6, 2, 10); c.fillRect(7, 2, 2, 14); c.fillRect(11, 5, 2, 11);
        });

        drawTile(4, 1, (c) => {
            c.fillStyle = '#d7ccc8'; c.fillRect(7, 10, 2, 6);
            c.fillStyle = '#d32f2f'; c.fillRect(4, 5, 8, 5);
        });

        drawTile(5, 1, (c) => {
            c.fillStyle = '#333333'; c.fillRect(0, 0, 16, 16);
            for (let i = 0; i < 50; i++) {
                c.fillStyle = Math.random() > 0.5 ? '#111111' : '#555555';
                c.fillRect(Math.floor(Math.random()*16), Math.floor(Math.random()*16), 1, 1);
            }
        });

        drawTile(6, 1, (c) => {
            c.fillStyle = '#5a5a5a'; c.fillRect(0, 0, 16, 16);
            c.fillStyle = '#3a3a3a';
            c.fillRect(0, 4, 16, 1); c.fillRect(0, 10, 16, 1);
            c.fillRect(6, 0, 1, 4); c.fillRect(12, 4, 1, 6); c.fillRect(4, 10, 1, 6);
        });

        drawTile(7, 1, (c) => {
            c.fillStyle = '#675231'; c.fillRect(6, 6, 4, 10);
            c.fillStyle = '#ffaa00'; c.fillRect(5, 2, 6, 4);
            c.fillStyle = '#ffffff'; c.fillRect(7, 3, 2, 2);
        });

        drawTile(0, 2, (c) => {
            c.fillStyle = '#5a5a5a'; c.fillRect(1, 12, 14, 4);
            c.fillStyle = '#675231'; c.fillRect(2, 8, 12, 4);
            c.fillStyle = '#ff3d00'; c.fillRect(4, 2, 8, 6);
            c.fillStyle = '#ffea00'; c.fillRect(6, 4, 4, 4);
        });

        drawTile(1, 2, (c) => {
            c.fillStyle = '#c62828'; c.fillRect(3, 4, 10, 8);
            c.fillStyle = '#ef9a9a'; c.fillRect(5, 6, 4, 4);
        });

        drawTile(2, 2, (c) => {
            c.fillStyle = '#4e342e'; c.fillRect(3, 4, 10, 8);
            c.fillStyle = '#8d6e63'; c.fillRect(5, 6, 6, 4);
        });

        drawTile(3, 2, (c) => {
            c.fillStyle = '#1d4ed8'; c.fillRect(0, 0, 16, 16);
            for (let i = 0; i < 30; i++) {
                c.fillStyle = Math.random() > 0.5 ? '#60a5fa' : '#2563eb';
                c.fillRect(Math.floor(Math.random()*16), Math.floor(Math.random()*16), 2, 1);
            }
        });

        drawOreTile(4, 2, '#1e1e1e');
        drawOreTile(5, 2, '#d89c74');
        drawOreTile(6, 2, '#facc15');
        drawOreTile(7, 2, '#38bdf8');

        drawToolTile(0, 3, 'sword', '#cbd5e1');
        drawToolTile(1, 3, 'axe', '#94a3b8');
        drawToolTile(2, 3, 'pickaxe', '#06b6d4');
        drawToolTile(3, 3, 'axe', '#b8945f');
        drawToolTile(4, 3, 'pickaxe', '#737373');

        drawTile(5, 3, (c) => {
            c.fillStyle = 'rgba(186, 230, 253, 0.45)'; c.fillRect(0, 0, 16, 16);
            c.strokeStyle = '#38bdf8'; c.lineWidth = 1.5; c.strokeRect(0, 0, 16, 16);
            c.strokeStyle = '#ffffff'; c.lineWidth = 1;
            c.beginPath(); c.moveTo(3, 3); c.lineTo(7, 3); c.lineTo(3, 7); c.stroke();
            c.beginPath(); c.moveTo(13, 9); c.lineTo(13, 13); c.lineTo(9, 13); c.stroke();
        });

        drawTile(6, 3, (c) => {
            c.fillStyle = '#8f6f43'; c.fillRect(0, 0, 16, 16);
            c.fillStyle = '#5c3917'; c.fillRect(2, 2, 5, 5); c.fillRect(9, 2, 5, 5);
            c.fillRect(2, 9, 5, 5); c.fillRect(9, 9, 5, 5);
            c.fillStyle = '#facc15'; c.fillRect(12, 8, 2, 2);
        });

        drawTile(7, 3, (c) => {
            c.fillStyle = '#8b5a2b'; c.fillRect(0, 0, 16, 16);
            c.fillStyle = '#3a2212'; c.fillRect(0, 6, 16, 2);
            c.fillStyle = '#facc15'; c.fillRect(7, 5, 2, 3);
        });

        drawTile(0, 4, (c) => {
            c.strokeStyle = '#675231'; c.lineWidth = 2; c.beginPath(); c.arc(8, 8, 6, -1.2, 1.2); c.stroke();
            c.strokeStyle = '#ffffff'; c.lineWidth = 1; c.beginPath(); c.moveTo(8, 2); c.lineTo(8, 14); c.stroke();
        });

        drawTile(1, 4, (c) => {
            c.fillStyle = '#f8fafc'; c.fillRect(0, 0, 16, 16);
            for (let i = 0; i < 20; i++) {
                c.fillStyle = '#e2e8f0'; c.fillRect(Math.random()*16, Math.random()*16, 1, 1);
            }
        });

        drawTile(2, 4, (c) => {
            c.fillStyle = '#38bdf8'; c.fillRect(0, 0, 16, 16);
            c.fillStyle = '#7dd3fc'; c.fillRect(2, 2, 6, 2); c.fillRect(8, 10, 5, 2);
        });

        drawTile(3, 4, (c) => {
            c.fillStyle = '#15803d'; c.fillRect(0, 0, 16, 16);
            c.fillStyle = '#166534'; c.fillRect(2, 0, 2, 16); c.fillRect(8, 0, 2, 16); c.fillRect(14, 0, 2, 16);
        });

        drawTile(4, 4, (c) => {
            c.fillStyle = '#94a3b8'; c.fillRect(4, 8, 8, 6);
            c.fillStyle = '#334155'; c.fillRect(5, 4, 3, 4);
            c.fillStyle = '#ffaa00'; c.fillRect(5, 2, 2, 2);
        });

        const texture = new THREE.CanvasTexture(canvas);
        texture.magFilter = THREE.NearestFilter;
        texture.minFilter = THREE.NearestFilter;
        return { texture, canvas };
    }

    static createBlockIconDataURL(topTileX, topTileY, sideTileX, sideTileY, atlasCanvas, isPlant = false) {
        const canvas = document.createElement('canvas'); canvas.width = 32; canvas.height = 32;
        const ctx = canvas.getContext('2d');

        const getTileCanvas = (tx, ty) => {
            const c = document.createElement('canvas'); c.width = 16; c.height = 16;
            c.getContext('2d').drawImage(atlasCanvas, tx * 16, ty * 16, 16, 16, 0, 0, 16, 16);
            return c;
        };

        if (isPlant) {
            ctx.imageSmoothingEnabled = false;
            ctx.drawImage(getTileCanvas(topTileX, topTileY), 4, 4, 24, 24);
            return canvas.toDataURL();
        }

        const topC = getTileCanvas(topTileX, topTileY);
        const sideC = getTileCanvas(sideTileX, sideTileY);

        ctx.save(); ctx.translate(16, 2); ctx.scale(1, 0.5); ctx.rotate(Math.PI / 4);
        ctx.drawImage(topC, 0, 0, 18, 18); ctx.restore();

        ctx.save(); ctx.transform(0.707, 0.35, 0, 0.7, 3, 11);
        ctx.drawImage(sideC, 0, 0, 18, 18); ctx.restore();

        ctx.save(); ctx.transform(0.707, -0.35, 0, 0.7, 16, 17);
        ctx.drawImage(sideC, 0, 0, 18, 18); ctx.restore();

        return canvas.toDataURL();
    }
}