/* ============================================
   FRIDAY – Utility Functions
   ============================================ */

const Utils = {
    /**
     * Generate a unique ID
     * @returns {string} UUID-like string
     */
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
    },

    /**
     * Format currency value using user's setting
     * @param {number} amount
     * @returns {string} Formatted currency string
     */
    formatCurrency(amount) {
        const settings = Storage.getSettings();
        const symbol = settings.currency || '₹';
        return `${symbol}${parseFloat(amount).toFixed(2)}`;
    },

    /**
     * Get currency symbol from settings
     * @returns {string}
     */
    getCurrencySymbol() {
        const settings = Storage.getSettings();
        return settings.currency || '₹';
    },

    /**
     * Format date to readable string
     * @param {string|Date} date - Date to format
     * @param {Object} options - Intl options
     * @returns {string} Formatted date
     */
    formatDate(date, options = {}) {
        const d = new Date(date);
        const defaults = { year: 'numeric', month: 'short', day: 'numeric' };
        return d.toLocaleDateString('en-US', { ...defaults, ...options });
    },

    /**
     * Format time to readable string
     * @param {string|Date} date - Date to format
     * @returns {string} Formatted time
     */
    formatTime(date) {
        const d = new Date(date);
        return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    },

    /**
     * Format date to relative string (e.g., "2 hours ago")
     * @param {string|Date} date - Date to format
     * @returns {string} Relative time string
     */
    timeAgo(date) {
        const d = new Date(date);
        const now = new Date();
        const seconds = Math.floor((now - d) / 1000);

        if (seconds < 60) return 'just now';
        if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
        if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
        if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
        return Utils.formatDate(date);
    },

    /**
     * Check if a date is today
     * @param {string|Date} date - Date to check
     * @returns {boolean}
     */
    isToday(date) {
        const d = new Date(date);
        const now = new Date();
        return d.toDateString() === now.toDateString();
    },

    /**
     * Check if a date is in the past
     * @param {string|Date} date - Date to check
     * @returns {boolean}
     */
    isPast(date) {
        return new Date(date) < new Date();
    },

    /**
     * Check if date is within last N days
     * @param {string|Date} date - Date to check
     * @param {number} days - Number of days
     * @returns {boolean}
     */
    isWithinDays(date, days) {
        const d = new Date(date);
        const now = new Date();
        const diff = now - d;
        return diff >= 0 && diff <= days * 86400000;
    },

    /**
     * Get start of day
     * @param {Date} date - Date
     * @returns {Date} Start of day
     */
    startOfDay(date = new Date()) {
        const d = new Date(date);
        d.setHours(0, 0, 0, 0);
        return d;
    },

    /**
     * Format date for input[type=date]
     * @param {Date} date - Date
     * @returns {string} YYYY-MM-DD
     */
    toInputDate(date = new Date()) {
        const d = new Date(date);
        return d.toISOString().split('T')[0];
    },

    /**
     * Format time for input[type=time]
     * @param {Date} date - Date
     * @returns {string} HH:MM
     */
    toInputTime(date = new Date()) {
        const d = new Date(date);
        return d.toTimeString().slice(0, 5);
    },

    /**
     * Parse natural language date (basic)
     * @param {string} text - Text containing date reference
     * @returns {Date} Parsed date
     */
    parseNaturalDate(text) {
        const lower = text.toLowerCase();
        const now = new Date();
        let result = new Date(now);
        let dateFound = false;

        // --- Named day references ---
        if (lower.includes('today')) {
            dateFound = true;
        } else if (lower.includes('tomorrow')) {
            result.setDate(result.getDate() + 1);
            dateFound = true;
        } else if (lower.includes('day after tomorrow')) {
            result.setDate(result.getDate() + 2);
            dateFound = true;
        } else if (lower.includes('next week')) {
            result.setDate(result.getDate() + 7);
            dateFound = true;
        } else {
            // --- Day-of-week parsing (Saturday, next Monday, etc.) ---
            const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
            const dayMatch = lower.match(/(?:next\s+|this\s+|on\s+)?(sunday|monday|tuesday|wednesday|thursday|friday|saturday)/);
            if (dayMatch) {
                const targetDay = dayNames.indexOf(dayMatch[1]);
                const currentDay = now.getDay();
                let daysAhead = targetDay - currentDay;
                if (daysAhead <= 0) daysAhead += 7; // always go forward
                if (lower.includes('next') && daysAhead < 7) daysAhead += 7; // "next Saturday" means the one after this coming one if this week
                result.setDate(result.getDate() + daysAhead);
                dateFound = true;
            }
        }

        // --- Time parsing (6pm, 3:30pm, 18:00, etc.) ---
        const timeMatch = lower.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/);
        if (timeMatch) {
            let hours = parseInt(timeMatch[1]);
            const minutes = timeMatch[2] ? parseInt(timeMatch[2]) : 0;
            const meridiem = timeMatch[3];

            if (meridiem === 'pm' && hours < 12) hours += 12;
            if (meridiem === 'am' && hours === 12) hours = 0;

            result.setHours(hours, minutes, 0, 0);

            // If time already passed today and no specific date, move to tomorrow
            if (!dateFound && result < now) {
                result.setDate(result.getDate() + 1);
            }
        } else if (lower.includes('morning')) {
            result.setHours(9, 0, 0, 0);
        } else if (lower.includes('afternoon') || lower.includes('noon')) {
            result.setHours(12, 0, 0, 0);
        } else if (lower.includes('evening')) {
            result.setHours(18, 0, 0, 0);
        } else if (lower.includes('night')) {
            result.setHours(21, 0, 0, 0);
        }

        return result;
    },

    /**
     * Debounce function
     * @param {Function} fn - Function to debounce
     * @param {number} delay - Delay in ms
     * @returns {Function} Debounced function
     */
    debounce(fn, delay = 300) {
        let timer;
        return function (...args) {
            clearTimeout(timer);
            timer = setTimeout(() => fn.apply(this, args), delay);
        };
    },

    /**
     * Escape HTML special characters
     * @param {string} text - Text to escape
     * @returns {string} Escaped text
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },

    /**
     * Show a toast notification
     * @param {string} message - Toast message
     * @param {number} duration - Duration in ms
     */
    showToast(message, duration = 3000) {
        // Remove existing toast
        const existing = document.querySelector('.toast');
        if (existing) existing.remove();

        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.textContent = message;
        document.body.appendChild(toast);

        setTimeout(() => {
            toast.classList.add('toast-exit');
            setTimeout(() => toast.remove(), 300);
        }, duration);
    },

    /**
     * Open modal with content
     * @param {string} title - Modal title
     * @param {string} bodyHTML - Modal body HTML
     */
    openModal(title, bodyHTML) {
        document.getElementById('modal-title').textContent = title;
        document.getElementById('modal-body').innerHTML = bodyHTML;
        document.getElementById('modal-overlay').classList.add('show');
    },

    /**
     * Close modal
     */
    closeModal() {
        document.getElementById('modal-overlay').classList.remove('show');
    },

    /**
     * Get category emoji
     * @param {string} category - Category name
     * @returns {string} Emoji
     */
    getCategoryEmoji(category) {
        const emojis = {
            'Food': '🍔',
            'Travel': '✈️',
            'Rent': '🏠',
            'Shopping': '🛍️',
            'Health': '💊',
            'Other': '📦'
        };
        return emojis[category] || '📦';
    },

    /**
     * Get day names
     * @returns {string[]}
     */
    getDayNames() {
        return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    },

    /**
     * Get month names
     * @returns {string[]}
     */
    getMonthNames() {
        return ['January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'];
    }
};
