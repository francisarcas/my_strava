// ══════════════════════════════════════════════
//  CHART FACTORY  &  SHARED CHART HELPERS
// ══════════════════════════════════════════════

function mkChart(id, cfg) {
    if (A.charts[id]) A.charts[id].destroy();
    const el = document.getElementById(id);
    if (el) A.charts[id] = new Chart(el, cfg);
}

// Base options shared by bar/line charts
function baseOpts({ cb } = {}) {
    return {
        responsive:          true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: {
                backgroundColor: '#1a1a1a',
                borderColor:     '#3a3a3a',
                borderWidth:     1,
                titleColor:      '#fff',
                bodyColor:       '#a0a0a0',
                callbacks: cb ? { label: c => ' ' + cb(c.raw) } : {},
            },
        },
        scales: {
            x: {
                ticks: { color:'#666', maxRotation:45, font:{size:11} },
                grid:  { color:'#2a2a2a' },
            },
            y: {
                ticks: { color:'#a0a0a0', font:{size:11} },
                grid:  { color:'#333' },
            },
        },
        animation: { duration: 500 },
    };
}

// Pace-axis variant (reversed Y, min:sec labels)
function paceOpts() {
    const o = baseOpts();
    o.scales.y = {
        reverse: true,
        ticks: {
            color: '#a0a0a0',
            callback: v =>
                `${Math.floor(v)}:${String(Math.round((v % 1) * 60)).padStart(2,'0')}`,
        },
        grid: { color: '#333' },
    };
    return o;
}

// ── Shared data helpers ────────────────────────
function weeklyData(acts, weeks) {
    const d   = new Array(weeks).fill(0);
    const now = Date.now();
    acts.forEach(a => {
        const w = Math.floor((now - a.date.getTime()) / (7 * 86400000));
        if (w < weeks) d[weeks - 1 - w] += a.dist;
    });
    return d.map(v => Math.round(v * 10) / 10);
}

function weekLabels(weeks) {
    return Array.from({ length: weeks }, (_, i) => {
        const d = new Date(Date.now() - (weeks - 1 - i) * 7 * 86400000);
        return d.toLocaleDateString('en-US', { month:'short', day:'numeric' });
    });
}

function hrZones(acts) {
    const w = acts.filter(a => a.hr > 0);
    if (!w.length) return [20, 35, 25, 15, 5];
    const c = [0, 0, 0, 0, 0];
    w.forEach(a => {
        const h = a.hr;
        if      (h < 115) c[0]++;
        else if (h < 140) c[1]++;
        else if (h < 158) c[2]++;
        else if (h < 170) c[3]++;
        else              c[4]++;
    });
    const t = c.reduce((s,v) => s+v, 0);
    return c.map(v => Math.round((v/t)*100));
}

// Simulated per-km splits for a given activity
function splits(a) {
    const n    = Math.ceil(a.dist);
    const base = a.pace / 60;
    return Array.from({ length: n }, (_, i) => {
        const v = (Math.random() - .5) * .33;
        const f = i > n * .7 ? (i - n * .7) * .04 : 0;
        return Math.max(3, base + v + f);
    });
}

// ── HR Zones doughnut with custom 3+2 legend ──
function renderZonesDoughnut(canvasId, legendContainerId, acts) {
    const z = hrZones(acts);

    const ZONE_COLORS = ['#4CAF50','#8BC34A','#FFC107','#FF5722','#F44336'];
    const ZONE_LABELS = [
        'Zone 1: Easy',
        'Zone 2: Aerobic',
        'Zone 3: Tempo',
        'Zone 4: Threshold',
        'Zone 5: Max',
    ];

    // Build chart — legend disabled, we draw our own below
    mkChart(canvasId, {
        type: 'doughnut',
        data: {
            labels: ZONE_LABELS,
            datasets: [{
                data:            z,
                backgroundColor: ZONE_COLORS,
                borderColor:     '#2d2d2d',
                borderWidth:     3,
            }],
        },
        options: {
            responsive:          true,
            maintainAspectRatio: false,
            plugins: {
                legend:  { display: false },   // ← hidden; custom legend below
                tooltip: {
                    callbacks: { label: c => ` ${c.label}: ${c.raw}%` },
                },
            },
            cutout: '60%',
        },
    });

    // Build custom 3+2 legend
    const container = document.getElementById(legendContainerId);
    if (!container) return;

    container.innerHTML = `
        <div class="zone-legend">
            <div class="zone-legend-row">
                ${[0,1,2].map(i => `
                    <div class="zone-legend-item">
                        <div class="zone-dot" style="background:${ZONE_COLORS[i]}"></div>
                        <span>${ZONE_LABELS[i]}</span>
                    </div>`).join('')}
            </div>
            <div class="zone-legend-row">
                ${[3,4].map(i => `
                    <div class="zone-legend-item">
                        <div class="zone-dot" style="background:${ZONE_COLORS[i]}"></div>
                        <span>${ZONE_LABELS[i]}</span>
                    </div>`).join('')}
            </div>
        </div>`;
}
