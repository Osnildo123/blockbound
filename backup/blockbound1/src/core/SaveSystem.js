export class SaveSystem {
    // --- CONFIGURAÇÕES ---
    static getSettings() {
        const data = localStorage.getItem('blockbound_settings');
        return data ? JSON.parse(data) : { brightness: 100, renderDistance: 5, shadows: 100 };
    }

    static saveSettings(settings) {
        localStorage.setItem('blockbound_settings', JSON.stringify(settings));
    }

    // --- PERFIS ---
    static getProfiles() {
        const data = localStorage.getItem('blockbound_profiles');
        return data ? JSON.parse(data) : [];
    }

    static saveProfiles(profiles) {
        localStorage.setItem('blockbound_profiles', JSON.stringify(profiles));
    }

    static createProfile(name) {
        const profiles = this.getProfiles();
        const newProfile = {
            id: 'prof_' + Date.now(),
            name: name
        };
        profiles.push(newProfile);
        this.saveProfiles(profiles);
        return newProfile;
    }

    // --- MUNDOS ---
    static getWorlds(profileId) {
        if (!profileId) return [];
        const data = localStorage.getItem(`blockbound_worlds_${profileId}`);
        return data ? JSON.parse(data) : [];
    }

    static saveWorldsList(profileId, worlds) {
        if (!profileId) return;
        localStorage.setItem(`blockbound_worlds_${profileId}`, JSON.stringify(worlds));
    }

    static createWorld(profileId, name) {
        const worlds = this.getWorlds(profileId);
        const newWorld = {
            id: 'world_' + Date.now(),
            name: name,
            seed: Math.random(),
            lastPlayed: new Date().toLocaleDateString('pt-PT') + ' ' + new Date().toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' }),
            dayTime: 0.25,
            hp: 100,
            hunger: 100
        };
        worlds.push(newWorld);
        this.saveWorldsList(profileId, worlds);
        return newWorld;
    }

    static saveWorld(profileId, worldData) {
        if (!profileId || !worldData || !worldData.id) return;
        const worlds = this.getWorlds(profileId);
        const index = worlds.findIndex(w => w.id === worldData.id);
        if (index !== -1) {
            worlds[index] = worldData;
        } else {
            worlds.push(worldData);
        }
        this.saveWorldsList(profileId, worlds);
    }

    static deleteWorld(profileId, worldId) {
        if (!profileId || !worldId) return;
        let worlds = this.getWorlds(profileId);
        worlds = worlds.filter(w => w.id !== worldId);
        this.saveWorldsList(profileId, worlds);
    }
}