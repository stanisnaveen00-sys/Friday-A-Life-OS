/* ============================================
   FRIDAY – Summary Generator (shared logic)
   ============================================ */

const Summary = {
    /**
     * Get daily summary data for today
     * @returns {Object} Summary data
     */
    getDailyData() {
        const today = Utils.startOfDay();
        const todayStr = today.toDateString();

        const tasks = Storage.get(Storage.KEYS.TASKS, []);
        const events = Storage.get(Storage.KEYS.EVENTS, []);
        const expenses = Storage.get(Storage.KEYS.EXPENSES, []);
        const reminders = Storage.get(Storage.KEYS.REMINDERS, []);

        const todayTasks = tasks.filter(t => new Date(t.createdAt).toDateString() === todayStr);
        const completedToday = todayTasks.filter(t => t.completed);
        const pendingToday = todayTasks.filter(t => !t.completed);

        const todayExpenses = expenses.filter(e => new Date(e.date).toDateString() === todayStr);
        const totalSpent = todayExpenses.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);

        const upcomingEvents = events.filter(e => {
            const d = new Date(e.date);
            return d.toDateString() === todayStr && d >= new Date();
        });

        const missedReminders = reminders.filter(r =>
            !r.done && !r.ignored && new Date(r.datetime) < new Date() &&
            new Date(r.datetime).toDateString() === todayStr
        );

        return {
            tasksCompleted: completedToday.length,
            tasksPending: pendingToday.length,
            totalTasks: todayTasks.length,
            totalSpent,
            expenses: todayExpenses,
            upcomingEvents,
            missedReminders: missedReminders.length,
            summaryText: this.generateDailyText({
                completedToday,
                pendingToday,
                totalSpent,
                upcomingEvents,
                missedReminders
            })
        };
    },

    /**
     * Generate daily summary text
     * @param {Object} data - Summary data
     * @returns {string} Summary paragraph
     */
    generateDailyText(data) {
        const parts = [];
        const dateStr = Utils.formatDate(new Date(), { weekday: 'long', month: 'long', day: 'numeric' });

        parts.push(`Here's your daily summary for ${dateStr}.`);

        if (data.completedToday.length > 0) {
            parts.push(`You completed ${data.completedToday.length} task${data.completedToday.length > 1 ? 's' : ''} today. Great work! 🎉`);
        }

        if (data.pendingToday.length > 0) {
            parts.push(`You have ${data.pendingToday.length} task${data.pendingToday.length > 1 ? 's' : ''} still pending.`);
        }

        if (data.totalSpent > 0) {
            parts.push(`Today's spending: $${data.totalSpent.toFixed(2)}.`);
        }

        if (data.upcomingEvents.length > 0) {
            parts.push(`${data.upcomingEvents.length} upcoming event${data.upcomingEvents.length > 1 ? 's' : ''} today.`);
        }

        if (data.missedReminders.length > 0) {
            parts.push(`⚠️ ${data.missedReminders.length} missed reminder${data.missedReminders.length > 1 ? 's' : ''}.`);
        }

        if (parts.length === 1) {
            parts.push('No major activity recorded yet today. Start by adding some tasks or logging expenses!');
        }

        return parts.join(' ');
    },

    /**
     * Get weekly summary data (last 7 days)
     * @returns {Object} Weekly data
     */
    getWeeklyData() {
        const tasks = Storage.get(Storage.KEYS.TASKS, []);
        const expenses = Storage.get(Storage.KEYS.EXPENSES, []);
        const reminders = Storage.get(Storage.KEYS.REMINDERS, []);

        const weekTasks = tasks.filter(t => Utils.isWithinDays(t.createdAt, 7));
        const weekCompleted = weekTasks.filter(t => t.completed);
        const weekExpenses = expenses.filter(e => Utils.isWithinDays(e.date, 7));
        const totalSpent = weekExpenses.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);

        // Most used category
        const categoryCounts = {};
        weekExpenses.forEach(e => {
            categoryCounts[e.category] = (categoryCounts[e.category] || 0) + 1;
        });
        const topCategory = Object.entries(categoryCounts).sort((a, b) => b[1] - a[1])[0];

        // Missed reminders
        const missedReminders = reminders.filter(r =>
            !r.done && !r.ignored && Utils.isWithinDays(r.datetime, 7) && new Date(r.datetime) < new Date()
        );

        // Per-day spending for chart
        const dailySpending = [];
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dayStr = d.toDateString();
            const dayTotal = weekExpenses
                .filter(e => new Date(e.date).toDateString() === dayStr)
                .reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);
            dailySpending.push({
                label: dayNames[d.getDay()],
                value: Math.round(dayTotal)
            });
        }

        return {
            totalTasks: weekTasks.length,
            tasksCompleted: weekCompleted.length,
            totalSpent,
            topCategory: topCategory ? topCategory[0] : 'N/A',
            missedReminders: missedReminders.length,
            dailySpending
        };
    }
};
