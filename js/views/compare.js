// ══════════════════════════════════════════════
//  COMPARE VIEW
// ══════════════════════════════════════════════

function fillCompareDropdowns() {
    const opts = A.acts.map(a =>
        `<option value="${a.id}">${a.dateStr} — ${esc(a.name)} (${a.dist.toFixed(1)} km)</option>`
    ).join('');
    ['cmp-a','cmp-b'].forEach(id => {
        document.getElementById(id).innerHTML =
            '<option value="">Choose a run…</option>' + opts;
    });
}

function renderCompare() {
    const a = A.acts.find(x => x.id === +document.getElementById('cmp-a').value);
    const b = A.acts.find(x => x.id === +document.getElementById('cmp-b').value);

    const statsHtml = act => !act ? '' : `
        <div class="m-stats" style="grid-template-columns:repeat(3,1fr)">
            ${[
                { l:'Distance',  v:`${act.dist.toFixed(2)} km` },
                { l:'Pace',      v:`${act.paceStr} /km` },
                { l:'Time',      v:fmtTime(act.time) },
                { l:'Avg HR',    v:act.hr  > 0 ? `${Math.round(act.hr)} bpm`  : '—' },
                { l:'Elevation', v:`${Math.round(act.elev)} m` },
                { l:'Calories',  v:act.cal > 0 ? `${act.cal}`                 : '—' },
            ].map(s => `
                <div class="m-stat">
                    <div class="m-val">${s.v}</div>
                    <div class="m-lbl">${s.l}</div>
                </div>`).join('')}
        </div>`;

    html('cmp-a-stats', statsHtml(a));
    html('cmp-b-stats', statsHtml(b));

    if (a && b) {
        document.getElementById('cmp-chart').style.display = 'block';
        const sA  = splits(a);
        const sB  = splits(b);
        const len = Math.max(sA.length, sB.length);

        mkChart('c-compare', {
            type: 'line',
            data: {
                labels: Array.from({ length: len }, (_, i) => `km ${i+1}`),
                datasets: [
                    {
                        label:           a.name,
                        data:            sA,
                        borderColor:     'rgba(252,76,2,1)',
                        backgroundColor: 'rgba(252,76,2,.08)',
                        borderWidth:     2,
                        pointRadius:     4,
                        tension:         .3,
                        fill:            false,
                    },
                    {
                        label:           b.name,
                        data:            sB,
                        borderColor:     'rgba(100,180,255,1)',
                        backgroundColor: 'rgba(100,180,255,.08)',
                        borderWidth:     2,
                        pointRadius:     4,
                        tension:         .3,
                        fill:            false,
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
    } else {
        document.getElementById('cmp-chart').style.display = 'none';
    }
}
