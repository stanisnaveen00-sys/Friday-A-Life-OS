/* ============================================
   FRIDAY – LocalStorage Wrapper
   ============================================ */

const Storage = {
    // Storage keys
    KEYS: {
        TASKS: 'friday_tasks',
        EVENTS: 'friday_events',
        EXPENSES: 'friday_expenses',
        REMINDERS: 'friday_reminders',
        MEMORIES: 'friday_memories',
        TIMELINE: 'friday_timeline',
        SETTINGS: 'friday_settings',
        CHAT: 'friday_chat'
    },

    /**
     * Get data from LocalStorage
     * @param {string} key - Storage key
     * @param {*} fallback - Default value if key doesn't exist
     * @returns {*} Parsed data or fallback
     */
    get(key, fallback = []) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : fallback;
        } catch (e) {
            console.error(`Storage.get error for ${key}:`, e);
            return fallback;
        }
    },

    /**
     * Save data to LocalStorage
     * @param {string} key - Storage key
     * @param {*} data - Data to save
     */
    set(key, data) {
        try {
            localStorage.setItem(key, JSON.stringify(data));
        } catch (e) {
            console.error(`Storage.set error for ${key}:`, e);
        }
    },

    /**
     * Add an item to a stored array
     * @param {string} key - Storage key
     * @param {Object} item - Item to add
     */
    addItem(key, item) {
        const items = this.get(key, []);
        items.unshift(item); // Add to beginning
        this.set(key, items);
    },

    /**
     * Update an item in a stored array by ID
     * @param {string} key - Storage key
     * @param {string} id - Item ID
     * @param {Object} updates - Fields to update
     */
    updateItem(key, id, updates) {
        const items = this.get(key, []);
        const index = items.findIndex(item => item.id === id);
        if (index !== -1) {
            items[index] = { ...items[index], ...updates };
            this.set(key, items);
        }
    },

    /**
     * Delete an item from a stored array by ID
     * @param {string} key - Storage key
     * @param {string} id - Item ID
     */
    deleteItem(key, id) {
        const items = this.get(key, []);
        const filtered = items.filter(item => item.id !== id);
        this.set(key, filtered);
    },

    /**
     * Get a single item by ID
     * @param {string} key - Storage key
     * @param {string} id - Item ID
     * @returns {Object|null} Found item or null
     */
    getItem(key, id) {
        const items = this.get(key, []);
        return items.find(item => item.id === id) || null;
    },

    /**
     * Get default settings
     * @returns {Object} Default settings object
     */
    getDefaultSettings() {
        return {
            voiceInput: true,
            voiceOutput: false,
            geminiApiKey: '',
            currency: '₹',
            voiceName: '',
            theme: 'light'
        };
    },

    /**
     * Get settings (with defaults)
     * @returns {Object} Settings object
     */
    getSettings() {
        return this.get(this.KEYS.SETTINGS, this.getDefaultSettings());
    },

    /**
     * Update settings
     * @param {Object} updates - Settings to update
     */
    updateSettings(updates) {
        const settings = this.getSettings();
        this.set(this.KEYS.SETTINGS, { ...settings, ...updates });
    },

    /**
     * Clear all FRIDAY data
     */
    clearAll() {
        Object.values(this.KEYS).forEach(key => {
            localStorage.removeItem(key);
        });
    },

    /**
     * Export all data as JSON
     * @returns {Object} All stored data
     */
    exportAll() {
        const data = {};
        Object.entries(this.KEYS).forEach(([name, key]) => {
            data[name] = this.get(key, name === 'SETTINGS' ? this.getDefaultSettings() : []);
        });
        data.exportDate = new Date().toISOString();
        return data;
    }
};
