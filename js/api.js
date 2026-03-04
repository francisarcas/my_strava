// ══════════════════════════════════════════════
//  STRAVA API  &  DATA PROCESSING
// ══════════════════════════════════════════════

async function apiFetch(path, params = {}) {
    const url = new URL(CFG.API + path);
    Object.entries(params).forEach(([k,v]) => url.searchParams.set(k, v));
    const r = await fetch(url.toString(), {
        headers: { Authorization: 'Bearer ' + A.token },
    });
    if (!r.ok) {
        const e = await r.json().catch(() => ({}));
        throw new Error(e.message || 'HTTP ' + r.status);
    }
    return r.json();
}

async function fetchActivities() {
    showLoad('Fetching your runs…');
    try {
        const all = [];
        let page  = 1;

        // No `after` filter — fetch ALL runs ever, paginate until empty
        while (true) {
            setLoadTxt(`Loading activities… page ${page} (${all.length} runs so far)`);

            const batch = await apiFetch('/athlete/activities', {
                per_page: 100,
                page,
            });

            if (!batch.length) break;    // no more pages

            all.push(...batch);
            page++;

            // Safety cap — 2000 activities (20 pages)
            // Raise this if you have more
            if (page > 20) {
                toast('Loaded first 2000 activities — if you have more, let me know!', 'inf');
                break;
            }
        }

        A.acts  = all
            .filter(a => a.type === 'Run' || a.sport_type === 'Run')
            .map(cook)
            .sort((a,b) => b.date - a.date);
        A.shown = [...A.acts];

        hideLoad();
        boot();
        toast(`Loaded ${A.acts.length} runs across all time 🏃`, 'ok');
    } catch(e) {
        hideLoad();
        toast('Failed: ' + e.message, 'err');
    }
}

// Normalise a raw Strava activity into our lean shape
function cook(a) {
    const km   = a.distance / 1000;
    const pace = km > 0 ? a.moving_time / km : 0;
    return {
        id:      a.id,
        name:    a.name,
        date:    new Date(a.start_date_local),
        dateStr: new Date(a.start_date_local).toLocaleDateString('en-US', {
                     month:'short', day:'numeric', year:'numeric' }),
        dist:    Math.round(km * 100) / 100,
        time:    a.moving_time,
        pace,
        paceStr: fmtPace(pace),
        hr:      a.average_heartrate    || 0,
        maxHR:   a.max_heartrate        || 0,
        elev:    a.total_elevation_gain || 0,
        cal:     a.calories             || 0,
        suffer:  a.suffer_score         || 0,
        kudos:   a.kudos_count          || 0,
    };
}

// ── Demo data ──────────────────────────────────
function loadDemo() {
    A.demo    = true;
    A.athlete = { firstname:'Demo', lastname:'Runner', profile:null };

    const names = [
        'Morning Easy','Tempo Tuesday','Long Run','Recovery Jog',
        'Intervals','Lunch Run','Evening Pace','Hill Repeats',
        'Fartlek','Shakeout','Race Day!','Cool Down',
    ];
    const now = Date.now();

    // Demo spans 3 years of data
    A.acts = Array.from({ length: 180 }, (_, i) => {
        const daysAgo = Math.floor(Math.random() * 1095);   // ~3 years
        const date    = new Date(now - daysAgo * 86400000);
        const km      = 3 + Math.random() * 20;
        const pace    = 290 + Math.random() * 110 - (i/180)*30 + (Math.random()-.5)*35;
        const hr      = 130 + Math.random() * 40;
        return {
            id:      i + 1,
            name:    names[i % names.length],
            date,
            dateStr: date.toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'}),
            dist:    Math.round(km * 100) / 100,
            time:    Math.round(km * pace),
            pace,
            paceStr: fmtPace(pace),
            hr:      Math.round(hr),
            maxHR:   Math.round(hr + 12 + Math.random() * 18),
            elev:    Math.round(Math.random() * 200),
            cal:     Math.round(km * 65),
            suffer:  Math.round(Math.random() * 120),
            kudos:   Math.round(Math.random() * 25),
        };
    }).sort((a,b) => b.date - a.date);

    A.shown = [...A.acts];
    boot();
    toast('Demo mode — 180 sample runs over 3 years 👟', 'inf');
}

// ── Shared format helpers ──────────────────────
function fmtPace(s) {
    if (!s || s <= 0) return '—:——';
    return Math.floor(s/60) + ':' + String(Math.round(s%60)).padStart(2,'0');
}

function fmtTime(s) {
    const h   = Math.floor(s / 3600);
    const m   = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return h > 0
        ? `${h}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`
        : `${m}:${String(sec).padStart(2,'0')}`;
}
