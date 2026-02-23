/* ============================================
   FRIDAY – SPA Router
   ============================================ */
const Router = {
    currentPage: 'chat',

    pages: {
        chat: { title: 'Chat', render: () => Chat.render() },
        tasks: { title: 'Tasks', render: () => Tasks.render() },
        calendar: { title: 'Calendar', render: () => Calendar.render() },
        expenses: { title: 'Expenses', render: () => Expenses.render() },
        reminders: { title: 'Reminders', render: () => Reminders.render() },
        memory: { title: 'Memory Vault', render: () => Memory.render() },
        timeline: { title: 'Timeline', render: () => Timeline.render() },
        daily: { title: 'Daily Summary', render: () => DailySummary.render() },
        weekly: { title: 'Weekly Summary', render: () => WeeklySummary.render() },
        settings: { title: 'Settings', render: () => Settings.render() }
    },

    init() {
        // Check if intro was already dismissed
        const introSeen = localStorage.getItem('friday_intro_seen');
        if (introSeen) {
            this.showApp();
        }

        // Intro button
        document.getElementById('enter-friday-btn')?.addEventListener('click', () => {
            localStorage.setItem('friday_intro_seen', 'true');
            this.showApp();
        });

        // Intro feature cards
        document.querySelectorAll('.intro-feature-card[data-page]').forEach(card => {
            card.addEventListener('click', () => {
                localStorage.setItem('friday_intro_seen', 'true');
                this.showApp();
                this.navigate(card.dataset.page);
            });
        });

        // Sidebar nav
        document.querySelectorAll('.nav-item[data-page]').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                this.navigate(item.dataset.page);
                // Close sidebar on mobile
                document.getElementById('sidebar').classList.remove('open');
                document.getElementById('sidebar-overlay').classList.remove('show');
            });
        });

        // Bottom nav
        document.querySelectorAll('.bottom-nav-item[data-page]').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                this.navigate(item.dataset.page);
            });
        });

        // Hamburger menu
        document.getElementById('hamburger-btn')?.addEventListener('click', () => {
            document.getElementById('sidebar').classList.add('open');
            document.getElementById('sidebar-overlay').classList.add('show');
        });

        // Close sidebar
        document.getElementById('sidebar-close-btn')?.addEventListener('click', () => {
            document.getElementById('sidebar').classList.remove('open');
            document.getElementById('sidebar-overlay').classList.remove('show');
        });

        document.getElementById('sidebar-overlay')?.addEventListener('click', () => {
            document.getElementById('sidebar').classList.remove('open');
            document.getElementById('sidebar-overlay').classList.remove('show');
        });

        // Modal close
        document.getElementById('modal-close-btn')?.addEventListener('click', () => Utils.closeModal());
        document.getElementById('modal-overlay')?.addEventListener('click', (e) => {
            if (e.target === e.currentTarget) Utils.closeModal();
        });

        // Voice output toggle in header
        document.getElementById('voice-output-toggle')?.addEventListener('click', () => {
            const settings = Storage.getSettings();
            const newVal = !settings.voiceOutput;
            Storage.updateSettings({ voiceOutput: newVal });
            document.getElementById('voice-output-toggle').classList.toggle('active', newVal);
            Utils.showToast(newVal ? '🔊 Voice output enabled' : '🔇 Voice output disabled');
        });

        // Init the voice output toggle state
        const settings = Storage.getSettings();
        if (settings.voiceOutput) {
            document.getElementById('voice-output-toggle')?.classList.add('active');
        }
    },

    showApp() {
        document.getElementById('intro-overlay').classList.add('hidden');
        document.getElementById('app-layout').classList.remove('hidden');
        // Navigate to default page
        this.navigate(this.currentPage);
    },

    navigate(page) {
        if (!this.pages[page]) return;
        this.currentPage = page;

        // Update title
        document.getElementById('page-title').textContent = this.pages[page].title;

        // Update sidebar active
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.toggle('active', item.dataset.page === page);
        });

        // Update bottom nav active
        document.querySelectorAll('.bottom-nav-item').forEach(item => {
            item.classList.toggle('active', item.dataset.page === page);
        });

        // Render page
        this.pages[page].render();

        // Scroll to top
        window.scrollTo(0, 0);
    }
};
