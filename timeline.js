/* ============================================
   FRIDAY – Timeline Logger
   Automatically logs every user action
   ============================================ */

const Timeline = {
    /**
     * Add entry to timeline
     * @param {string} type - Entry type: task, event, expense, reminder, memory
     * @param {string} action - Action description
     * @param {Object} data - Related data
     */
    add(type, action, data = {}) {
        const entry = {
            id: Utils.generateId(),
            type,
            action,
            data,
            timestamp: new Date().toISOString()
        };
        Storage.addItem(Storage.KEYS.TIMELINE, entry);
    },

    /**
     * Get all timeline entries
     * @param {string} filter - Optional type filter
     * @returns {Array} Timeline entries
     */
    getAll(filter = 'all') {
        const entries = Storage.get(Storage.KEYS.TIMELINE, []);
        if (filter === 'all') return entries;
        return entries.filter(e => e.type === filter);
    },

    /**
     * Get entries for today
     * @returns {Array} Today's timeline entries
     */
    getToday() {
        return this.getAll().filter(e => Utils.isToday(e.timestamp));
    },

    /**
     * Get entries for last N days
     * @param {number} days - Number of days
     * @returns {Array} Filtered entries
     */
    getLastDays(days) {
        return this.getAll().filter(e => Utils.isWithinDays(e.timestamp, days));
    },

    /**
     * Render timeline page
     */
    render() {
        const container = document.getElementById('app');
        const entries = this.getAll();

        container.innerHTML = `
            <div class="page-enter">
                <div class="page-header">
                    <h1>Timeline</h1>
                </div>
                <div class="chips" id="timeline-filters">
                    <button class="chip active" data-filter="all">All</button>
                    <button class="chip" data-filter="task">Tasks</button>
                    <button class="chip" data-filter="event">Events</button>
                    <button class="chip" data-filter="expense">Expenses</button>
                    <button class="chip" data-filter="reminder">Reminders</button>
                    <button class="chip" data-filter="memory">Memories</button>
                </div>
                <div class="timeline-feed" id="timeline-feed">
                    ${this.renderEntries(entries)}
                </div>
            </div>
        `;

        this.bindEvents();
    },

    /**
     * Render timeline entries HTML
     * @param {Array} entries - Entries to render
     * @returns {string} HTML string
     */
    renderEntries(entries) {
        if (entries.length === 0) {
            return `
                <div class="empty-state">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                    <h3>No activity yet</h3>
                    <p>Your actions will appear here automatically.</p>
                </div>
            `;
        }

        return entries.map(entry => `
            <div class="timeline-entry type-${entry.type}">
                <div class="timeline-content">
                    <div class="timeline-action">${Utils.escapeHtml(entry.action)}</div>
                    <div class="timeline-time">${Utils.timeAgo(entry.timestamp)}</div>
                </div>
            </div>
        `).join('');
    },

    /**
     * Bind timeline filter events
     */
    bindEvents() {
        const filters = document.getElementById('timeline-filters');
        if (!filters) return;

        filters.addEventListener('click', (e) => {
            const chip = e.target.closest('.chip');
            if (!chip) return;

            // Update active chip
            filters.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
            chip.classList.add('active');

            // Filter and re-render
            const filter = chip.dataset.filter;
            const entries = this.getAll(filter);
            document.getElementById('timeline-feed').innerHTML = this.renderEntries(entries);
        });
    }
};
