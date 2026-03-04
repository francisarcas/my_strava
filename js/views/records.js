// ══════════════════════════════════════════════
//  RECORDS VIEW
// ══════════════════════════════════════════════

function renderRecords() {
    // ── Personal bests ─────────────────────────
    const DISTS = [
        { label:'1 km',           km:1    },
        { label:'5 km',           km:5    },
        { label:'10 km',          km:10   },
        { label:'Half Marathon',  km:21.1 },
        { label:'Marathon',       km:42.2 },
    ];

    const prs = DISTS.map(d => {
        const c = A.acts.filter(a => a.dist >= d.km*.95 && a.dist <= d.km*1.1);
        if (!c.length) return null;
        const best = c.reduce((b,a) =>
            (a.time/a.dist) < (b.time/b.dist) ? a : b
        );
        return {
            label: d.label,
            time:  fmtTime(Math.round((best.time / best.dist) * d.km)),
            date:  best.dateStr,
        };
    }).filter(Boolean);

    html('pr-grid', prs.length
        ? prs.map(p => `
            <div class="pr-card">
                <div class="pr-dist">${p.label}</div>
                <div class="pr-time">${p.time}</div>
                <div class="pr-date">${p.date}</div>
            </div>`).join('')
        : '<p style="color:var(--text-muted);padding:1rem">Not enough matching runs yet</p>'
    );

    // ── Pace improvement line ──────────────────
    const sorted = [...A.acts].sort((a,b) => a.date - b.date);
    const mAvg   = sorted.map((_, i) => {
        const w = sorted.slice(Math.max(0, i-4), i+1);
        return w.reduce((s,a) => s + a.pace, 0) / w.length / 60;
    });

    mkChart('c-improve', {
        type: 'line',
        data: {
            labels: sorted.map(a => a.dateStr),
            datasets: [
                {
                    label:       'Pace',
                    data:        sorted.map(a => a.pace / 60),
                    borderColor: 'rgba(252,76,2,.22)',
                    borderWidth: 1,
                    pointRadius: 2,
                    tension:     .2,
                    fill:        false,
                },
                {
                    label:       '5-run avg',
                    data:        mAvg,
                    borderColor: 'rgba(252,76,2,1)',
                    borderWidth: 2.5,
                    pointRadius: 0,
                    tension:     .4,
                    fill:        false,
                },
            ],
        },
        options: {
            ...paceOpts(),
            plugins: {
                legend:  { labels: { color:'#a0a0a0' } },
                tooltip: {
                    backgroundColor: '#1a1a1a',
                    borderColor:     '#3a3a3a',
                    borderWidth:     1,
                    titleColor:      '#fff',
                    bodyColor:       '#a0a0a0',
                },
            },
        },
    });

    // ── All-time HR zone bars ──────────────────
    const z      = hrZones(A.acts);
    const Z_CLR  = ['#4CAF50','#8BC34A','#FFC107','#FF5722','#F44336'];
    const Z_NAME = ['Zone 1: Easy','Zone 2: Aerobic','Zone 3: Tempo','Zone 4: Threshold','Zone 5: Max'];

    html('zones-all', `
        <div class="zones-grid">
            ${z.map((p,i) => `
                <div class="zone-row">
                    <div class="zone-lbl">${Z_NAME[i]}</div>
                    <div class="zone-bg">
                        <div class="zone-fill" style="width:${p}%;background:${Z_CLR[i]}"></div>
                    </div>
                    <div class="zone-pct">${p}%</div>
                </div>`).join('')}
        </div>`
    );
}
