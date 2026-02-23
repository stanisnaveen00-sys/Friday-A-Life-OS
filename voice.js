/* ============================================
   FRIDAY – Voice Module
   Speech Recognition & Synthesis
   ============================================ */

const Voice = {
    recognition: null,
    isListening: false,
    voices: [],

    init() {
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            console.warn('Speech recognition not supported');
            return;
        }

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        this.recognition = new SpeechRecognition();
        this.recognition.continuous = false;
        this.recognition.interimResults = false;
        this.recognition.lang = 'en-US';

        this.recognition.onstart = () => {
            this.isListening = true;
            this.updateMicState(true);
            Utils.showToast('Listening...');
        };

        this.recognition.onend = () => {
            this.isListening = false;
            this.updateMicState(false);
        };

        this.recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            const input = document.getElementById('chat-input');
            if (input) {
                input.value = transcript;
                Chat.handleSend();
            }
        };

        this.recognition.onerror = (event) => {
            console.error('Speech recognition error', event.error);
            this.isListening = false;
            this.updateMicState(false);
            if (event.error === 'not-allowed') {
                Utils.showToast('Microphone access denied');
            }
        };

        // Load voices
        this.loadVoices();
        if (speechSynthesis.onvoiceschanged !== undefined) {
            speechSynthesis.onvoiceschanged = () => this.loadVoices();
        }
    },

    loadVoices() {
        this.voices = window.speechSynthesis.getVoices();
    },

    getVoices() {
        return this.voices;
    },

    checkSupport() {
        return {
            input: !!(window.SpeechRecognition || window.webkitSpeechRecognition),
            output: 'speechSynthesis' in window
        };
    },

    toggleListening() {
        if (!this.recognition) return;
        if (this.isListening) {
            this.recognition.stop();
        } else {
            this.recognition.start();
        }
    },

    updateMicState(listening) {
        const btn = document.getElementById('mic-btn');
        if (!btn) return;
        if (listening) {
            btn.classList.add('listening');
            btn.innerHTML = `<div class="mic-listening-ring"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--danger)" stroke-width="2"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg></div>`;
        } else {
            btn.classList.remove('listening');
            btn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>`;
        }
    },

    speak(text) {
        const settings = Storage.getSettings();
        if (!settings.voiceOutput || !('speechSynthesis' in window)) return;

        // Cancel previous speech
        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);

        // Find selected voice or best default
        let voice = null;
        if (settings.voiceName) {
            voice = this.voices.find(v => v.name === settings.voiceName);
        }

        if (!voice) {
            // Fallback to a female voice or Google/Microsoft voice if available
            voice = this.voices.find(v => v.name.includes('Google US English')) ||
                this.voices.find(v => v.name.includes('Microsoft Zira')) ||
                this.voices.find(v => v.name.includes('Female')) ||
                this.voices[0];
        }

        if (voice) utterance.voice = voice;

        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        window.speechSynthesis.speak(utterance);
    }
};

// Initialize on load
window.addEventListener('domincontentloaded', () => Voice.init());
// Also try init immediately just in case
setTimeout(() => Voice.init(), 1000);
