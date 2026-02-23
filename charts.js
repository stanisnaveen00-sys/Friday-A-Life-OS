/* ============================================
   FRIDAY – Charts (Pure HTML/CSS bar chart)
   ============================================ */

const Charts = {
    /**
     * Render a bar chart
     * @param {string} containerId - Target container id
     * @param {Array} data - Array of { label, value, color? }
     * @param {Object} options - Chart options
     */
    renderBarChart(containerId, data, options = {}) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const maxValue = Math.max(...data.map(d => d.value), 1);
        const chartHeight = options.height || 200;

        let html = `<div class="bar-chart" style="height: ${chartHeight}px">`;

        data.forEach(item => {
            const heightPercent = (item.value / maxValue) * 100;
            const color = item.color || 'var(--accent)';

            html += `
                <div class="bar-wrapper">
                    <span class="bar-value">${item.value}</span>
                    <div class="bar" style="height: ${heightPercent}%; background: ${color};"></div>
                    <span class="bar-label">${item.label}</span>
                </div>
            `;
        });

        html += '</div>';
        container.innerHTML = html;

        // Animate bars in
        setTimeout(() => {
            container.querySelectorAll('.bar').forEach(bar => {
                bar.style.transition = 'height 0.6s ease';
            });
        }, 50);
    }
};
