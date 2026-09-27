let db = null;
let firebaseInitialized = false;

// Inicialização segura do Firebase CDN
async function initFirebase() {
    if (firebaseInitialized) return true;
    try {
        const { initializeApp } = await import('https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js');
        const { getDatabase } = await import('https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js');

        const firebaseConfig = {
            apiKey: "AIzaSyBEu7vVWy8XRk5hk_TogYKnaEXqKWQl-sI",
            authDomain: "blockbound-survival.firebaseapp.com",
            databaseURL: "https://blockbound-survival-default-rtdb.firebaseio.com",
            projectId: "blockbound-survival",
            storageBucket: "blockbound-survival.firebasestorage.app",
            messagingSenderId: "497391909447",
            appId: "1:497391909447:web:4cf270ba2d27db521bcf62"
        };

        const app = initializeApp(firebaseConfig);
        db = getDatabase(app);
        firebaseInitialized = true;
        return true;
    } catch (e) {
        console.error("❌ Falha ao carregar SDK do Firebase CDN:", e);
        return false;
    }
}

export class LobbyManager {
    constructor() {
        this.currentRoomRef = null;
    }

    async registerPublicRoom(peerId, roomName, hostName, maxPlayers = 8, hasPassword = false) {
        const ok = await initFirebase();
        if (!ok || !peerId) return;

        try {
            const { ref, set, onDisconnect } = await import('https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js');
            this.currentRoomRef = ref(db, 'public_rooms/' + peerId);

            const roomData = {
                peerId: peerId,
                roomName: roomName || 'Mundo de Sobrevivência',
                hostName: hostName || 'Host',
                players: 1,
                maxPlayers: maxPlayers,
                hasPassword: !!hasPassword,
                createdAt: Date.now()
            };

            await set(this.currentRoomRef, roomData);
            onDisconnect(this.currentRoomRef).remove();
            console.log("🌐 Sala pública registrada!");
        } catch (err) {
            console.error("❌ Erro ao registrar sala no Firebase:", err);
        }
    }

    async unregisterPublicRoom() {
        if (this.currentRoomRef) {
            try {
                const { remove } = await import('https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js');
                await remove(this.currentRoomRef);
            } catch (e) {}
            this.currentRoomRef = null;
        }
    }

    async listenPublicRooms(callback, errorCallback) {
        const ok = await initFirebase();
        if (!ok) {
            if (errorCallback) errorCallback("Não foi possível carregar a conexão com o Firebase.");
            return;
        }

        try {
            const { ref, onValue } = await import('https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js');
            const roomsRef = ref(db, 'public_rooms');

            onValue(roomsRef, (snapshot) => {
                const data = snapshot.val();
                const roomsList = [];
                if (data) {
                    for (let id in data) {
                        roomsList.push(data[id]);
                    }
                }
                callback(roomsList);
            }, (error) => {
                if (errorCallback) errorCallback(error.message);
            });
        } catch (err) {
            if (errorCallback) errorCallback(err.message);
        }
    }
}

export const lobbyManager = new LobbyManager();