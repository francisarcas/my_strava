// ══════════════════════════════════════════════
//  DASHBOARD VIEW
// ══════════════════════════════════════════════

function renderDashboard() {
    const weeks  = +document.getElementById('period').value || 4;
    const cutoff = new Date(Date.now() - weeks * 7 * 86400000);
    const R      = A.acts.filter(a => a.date >= cutoff);

    if (!R.length) { toast('No runs in this period', 'inf'); return; }

    // ── Stats ──────────────────────────────────
    const totDist = R.reduce((s,a) => s + a.dist, 0);
    const totTime = R.reduce((s,a) => s + a.time, 0);
    const wP      = R.filter(a => a.pace > 0);
    const wH      = R.filter(a => a.hr   > 0);
    const avgPace = wP.length ? wP.reduce((s,a) => s+a.pace,0) / wP.length : 0;
    const avgHR   = wH.length ? wH.reduce((s,a) => s+a.hr,  0) / wH.length : 0;
    const totElev = R.reduce((s,a) => s + a.elev, 0);

    html('s-dist', totDist.toFixed(0) + ' <span>km</span>');
    html('s-runs', R.length);
    html('s-time', (totTime/3600).toFixed(1) + ' <span>hrs</span>');
    html('s-pace', fmtPace(avgPace) + ' <span>/km</span>');
    html('s-hr',   avgHR ? Math.round(avgHR) + ' <span>bpm</span>' : '— <span>bpm</span>');
    html('s-elev', Math.round(totElev).toLocaleString() + ' <span>m</span>');
    html('dash-sub', `${R.length} runs · last ${weeks} weeks · ${totDist.toFixed(0)} km`);

    // ── Weekly distance bar ────────────────────
    const wData = weeklyData(R, weeks);
    const wAvg  = wData.reduce((s,v) => s+v, 0) / wData.length;
    html('wk-avg', 'Avg ' + wAvg.toFixed(0) + ' km/wk');

    mkChart('c-weekly', {
        type: 'bar',
        data: {
            labels: weekLabels(weeks),
            datasets: [{
                label: 'km',
                data:  wData,
                backgroundColor: wData.map(v =>
                    v >= wAvg * 1.05 ? 'rgba(252,76,2,.9)' : 'rgba(252,76,2,.42)'
                ),
                borderRadius: 6,
            }],
        },
        options: baseOpts({ cb: v => `${v.toFixed(1)} km` }),
    });

    // ── HR Zones doughnut + custom legend ─────
    // Inject legend container right after the canvas wrapper
    const zonesCard = document.getElementById('c-zones').closest('.card');
    let legendEl    = document.getElementById('zones-legend-dash');
    if (!legendEl) {
        legendEl    = document.createElement('div');
        legendEl.id = 'zones-legend-dash';
        zonesCard.appendChild(legendEl);
    }
    renderZonesDoughnut('c-zones', 'zones-legend-dash', R);

    // ── Pace trend line ────────────────────────
    const sorted = [...R].sort((a,b) => a.date - b.date);
    mkChart('c-pace', {
        type: 'line',
        data: {
            labels: sorted.map(a => a.dateStr),
            datasets: [{
                label:           'Pace',
                data:            sorted.map(a => a.pace / 60),
                borderColor:     'rgba(252,76,2,1)',
                backgroundColor: 'rgba(252,76,2,.1)',
                borderWidth:     2,
                pointRadius:     3,
                tension:         .3,
                fill:            true,
            }],
        },
        options: paceOpts(),
    });

    // ── Distance distribution pie ──────────────
    const bk = { '<5 km':0, '5–10 km':0, '10–15 km':0, '15–21 km':0, '21 km+':0 };
    R.forEach(a => {
        if      (a.dist <  5) bk['<5 km']++;
        else if (a.dist < 10) bk['5–10 km']++;
        else if (a.dist < 15) bk['10–15 km']++;
        else if (a.dist < 21) bk['15–21 km']++;
        else                  bk['21 km+']++;
    });
    mkChart('c-dist', {
        type: 'pie',
        data: {
            labels: Object.keys(bk),
            datasets: [{
                data: Object.values(bk),
                backgroundColor: [
                    'rgba(252,76,2,.9)','rgba(252,76,2,.7)',
                    'rgba(252,76,2,.5)','rgba(252,76,2,.33)','rgba(252,76,2,.18)',
                ],
                borderColor:  '#2d2d2d',
                borderWidth:  2,
            }],
        },
        options: {
            responsive:          true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels:   { color:'#a0a0a0', font:{size:11}, boxWidth:12, padding:8 },
                },
            },
        },
    });

    // ── Elevation bar (last 15 runs) ───────────
    const last15 = sorted.slice(-15);
    mkChart('c-elev', {
        type: 'bar',
        data: {
            labels: last15.map(a => a.dateStr),
            datasets: [{
                label:           'm',
                data:            last15.map(a => a.elev),
                backgroundColor: 'rgba(255,140,66,.6)',
                borderColor:     'rgba(255,140,66,1)',
                borderWidth:     1,
                borderRadius:    4,
            }],
        },
        options: baseOpts({ cb: v => `${Math.round(v)} m` }),
    });
}
