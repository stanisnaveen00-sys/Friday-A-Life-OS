/* ============================================
   FRIDAY – Gemini AI Service
   Handles API calls to Google Gemini for
   intent detection, entity extraction, and
   smart responses.
   ============================================ */

const GeminiAI = {
    API_URL: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent',

    /**
     * Check if Gemini is configured
     * @returns {boolean}
     */
    isEnabled() {
        const settings = Storage.getSettings();
        return !!(settings.geminiApiKey && settings.geminiApiKey.trim());
    },

    /**
     * Get API key from settings
     * @returns {string}
     */
    getApiKey() {
        return Storage.getSettings().geminiApiKey || '';
    },

    /**
     * Call Gemini API
     * @param {string} prompt - The prompt to send
     * @param {string} systemInstruction - System-level instruction
     * @returns {Promise<string|null>} AI response text or null on error
     */
    async call(prompt, systemInstruction = '') {
        if (!this.isEnabled()) return null;

        const apiKey = this.getApiKey();
        const url = `${this.API_URL}?key=${apiKey}`;

        const body = {
            contents: [{
                parts: [{ text: prompt }]
            }]
        };

        if (systemInstruction) {
            body.system_instruction = {
                parts: [{ text: systemInstruction }]
            };
        }

        // Use lower temperature for structured extraction
        body.generationConfig = {
            temperature: 0.2,
            maxOutputTokens: 1024
        };

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });

            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                console.error('Gemini API error:', response.status, errData);
                return null;
            }

            const data = await response.json();
            const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
            return text || null;
        } catch (err) {
            console.error('Gemini API call failed:', err);
            return null;
        }
    },

    /**
     * Parse user message to extract intent and entities using Gemini
     * @param {string} userMessage - User's natural language input
     * @returns {Promise<Object|null>} Parsed intent object or null
     */
    async parseIntent(userMessage) {
        const today = new Date();
        const systemPrompt = `You are FRIDAY, a life assistant. Parse the user's message and extract intent and entities.

Current date/time: ${today.toISOString()} (${today.toLocaleDateString('en-US', { weekday: 'long' })})

Respond ONLY with valid JSON (no markdown, no code fences). Use this exact schema:

{
  "intent": "add_task" | "add_event" | "log_expense" | "set_reminder" | "save_memory" | "show_daily" | "show_weekly" | "greeting" | "help" | "general",
  "title": "extracted title/description",
  "amount": number or null,
  "category": "Food" | "Travel" | "Rent" | "Shopping" | "Health" | "Other" or null,
  "date": "YYYY-MM-DD" or null,
  "time": "HH:MM" (24h) or null,
  "priority": "low" | "medium" | "high" or null,
  "memoryType": "Goal" | "Preference" | "Rule" | "Person" | "General" or null,
  "reply": "A short, friendly reply to show the user (1-2 sentences max)"
}

Rules:
- For tasks: extract title, date, time, priority
- For events: extract title, date, time
- For expenses: extract amount, category, title (description)
- For reminders: extract title, date, time
- For memories: extract title (content) and memoryType
- For dates: convert "today", "tomorrow", "next Monday", "Saturday", etc. to YYYY-MM-DD
- For times: convert "6pm", "3:30pm", "morning" to HH:MM (24h)
- If no date mentioned for tasks/events, use today
- If no time mentioned, use null
- "reply" should confirm the action in a friendly but concise way`;

        const rawResponse = await this.call(userMessage, systemPrompt);
        if (!rawResponse) return null;

        try {
            // Clean up markdown code fences if Gemini includes them
            let cleaned = rawResponse.trim();
            if (cleaned.startsWith('```')) {
                cleaned = cleaned.replace(/^```(?:json)?\s*/, '').replace(/```\s*$/, '');
            }
            return JSON.parse(cleaned);
        } catch (e) {
            console.error('Failed to parse Gemini response:', e, rawResponse);
            return null;
        }
    },

    /**
     * Generate a natural language summary using Gemini
     * @param {Object} data - Summary data
     * @param {string} type - 'daily' or 'weekly'
     * @returns {Promise<string|null>} AI-generated summary text
     */
    async generateSummary(data, type = 'daily') {
        const systemPrompt = `You are FRIDAY, a calm and friendly life assistant.
Generate a brief, warm ${type} summary paragraph based on the provided data.
Keep it to 3-5 sentences. Use emojis sparingly. Be encouraging.
Respond with ONLY the summary text, no JSON.`;

        const prompt = `Here is the user's ${type} data:\n${JSON.stringify(data, null, 2)}\n\nGenerate a friendly summary.`;
        return await this.call(prompt, systemPrompt);
    },

    /**
     * Generate a conversational reply for general messages
     * @param {string} userMessage - User's message
     * @param {Array} recentMessages - Recent chat history for context
     * @returns {Promise<string|null>} AI reply
     */
    async chat(userMessage, recentMessages = []) {
        const systemPrompt = `You are FRIDAY, a calm, friendly, and concise Life Operating System assistant.
You help users manage their tasks, calendar, expenses, reminders, and memories.
Keep replies short (1-3 sentences). Be warm but efficient.
If the user asks something you can't do, suggest what they can do instead.
You can suggest commands like: "add task ...", "spent ... on ...", "remind me ...", "remember ...", "show today".`;

        // Build conversation context
        const contextMsgs = recentMessages.slice(-6).map(m =>
            `${m.role === 'user' ? 'User' : 'FRIDAY'}: ${m.text}`
        ).join('\n');

        const prompt = contextMsgs
            ? `Recent conversation:\n${contextMsgs}\n\nUser: ${userMessage}\n\nFRIDAY:`
            : `User: ${userMessage}\n\nFRIDAY:`;

        return await this.call(prompt, systemPrompt);
    }
};
