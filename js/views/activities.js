// ══════════════════════════════════════════════
//  ACTIVITIES VIEW  (table + modal)
// ══════════════════════════════════════════════

function renderTable(list = A.shown) {
    const tb = document.getElementById('act-tbody');

    if (!list.length) {
        tb.innerHTML = `<tr><td colspan="7"
            style="text-align:center;padding:3rem;color:var(--text-muted)">
            No runs found</td></tr>`;
        return;
    }

    tb.innerHTML = list.map(a => {
        const pc = a.pace < 270 ? 'p-fast' : a.pace < 360 ? 'p-medium' : 'p-slow';
        const hc = a.hr   > 170 ? 'hr-high': a.hr   > 150 ? 'hr-medium': 'hr-low';
        const ef = Math.min(100,
            a.suffer ? Math.round(a.suffer / 1.5) : Math.round((a.hr / 200) * 100)
        );
        return `
        <tr onclick="openModal(${a.id})">
            <td>
                <div class="act-name">${esc(a.name)}</div>
                <div class="act-date">📅 ${a.dateStr}</div>
            </td>
            <td><strong>${a.dist.toFixed(2)}</strong> km</td>
            <td><span class="pbadge ${pc}">⚡ ${a.paceStr}</span></td>
            <td>${fmtTime(a.time)}</td>
            <td>${a.hr > 0
                ? `<span class="${hc}">❤️ ${Math.round(a.hr)} bpm</span>`
                : '<span style="color:#555">—</span>'
            }</td>
            <td>${a.elev > 0 ? `⛰️ ${Math.round(a.elev)} m` : '—'}</td>
            <td><div class="ebar"><div class="efill" style="width:${ef}%"></div></div></td>
        </tr>`;
    }).join('');
}

function filterActs() {
    const q   = document.getElementById('search').value.toLowerCase();
    A.shown   = A.acts.filter(a =>
        a.name.toLowerCase().includes(q) || a.dateStr.toLowerCase().includes(q)
    );
    renderTable();
}

function sortActs(f) {
    const fn = {
        date:      (a,b) => b.date  - a.date,
        distance:  (a,b) => b.dist  - a.dist,
        pace:      (a,b) => a.pace  - b.pace,
        hr:        (a,b) => b.hr    - a.hr,
        elevation: (a,b) => b.elev  - a.elev,
        time:      (a,b) => b.time  - a.time,
        name:      (a,b) => a.name.localeCompare(b.name),
    }[f];
    if (fn) { A.shown.sort(fn); renderTable(); }
}

// ── Activity detail modal ──────────────────────
function openModal(id) {
    const a = A.acts.find(x => x.id === id);
    if (!a) return;

    document.getElementById('modal-title').textContent = a.name;

    html('m-stats', [
        { l:'Distance',  v:`${a.dist.toFixed(2)} km` },
        { l:'Pace',      v:`${a.paceStr} /km` },
        { l:'Time',      v:fmtTime(a.time) },
        { l:'Avg HR',    v:a.hr    > 0 ? `${Math.round(a.hr)} bpm`    : '—' },
        { l:'Max HR',    v:a.maxHR > 0 ? `${Math.round(a.maxHR)} bpm` : '—' },
        { l:'Elevation', v:`${Math.round(a.elev)} m` },
        { l:'Calories',  v:a.cal   > 0 ? `${a.cal} kcal`              : '—' },
        { l:'Kudos',     v:`👍 ${a.kudos}` },
        { l:'Date',      v:a.dateStr },
    ].map(s => `
        <div class="m-stat">
            <div class="m-val">${s.v}</div>
            <div class="m-lbl">${s.l}</div>
        </div>`).join('')
    );

    // Split-pace bar chart
    const sp = splits(a);
    mkChart('c-modal', {
        type: 'bar',
        data: {
            labels: sp.map((_, i) => `km ${i+1}`),
            datasets: [{
                label:           'Split pace',
                data:            sp,
                backgroundColor: sp.map(v =>
                    v < a.pace/60 ? 'rgba(76,175,80,.75)' : 'rgba(252,76,2,.75)'
                ),
                // ── Rounded tops only ──────────────
                borderRadius:       { topLeft:6, topRight:6, bottomLeft:0, bottomRight:0 },
                borderSkipped:      false,
            }],
        },
        options: paceOpts(),
    });

    document.getElementById('modal').classList.add('open');
}
