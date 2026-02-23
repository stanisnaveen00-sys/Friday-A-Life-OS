/* ============================================
   FRIDAY – App Entry Point
   ============================================ */

(function () {
    'use strict';

    // Initialize when DOM is ready
    document.addEventListener('DOMContentLoaded', () => {
        // Init modules
        Chat.init();
        Voice.init();
        Reminders.scheduleAllPending();

        // Init router (handles intro, nav, page rendering)
        Router.init();

        console.log('🟢 FRIDAY Life OS initialized');
    });
})();
