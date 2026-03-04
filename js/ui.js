// ══════════════════════════════════════════════
//  UI HELPERS  (toasts, loading, view switching)
// ══════════════════════════════════════════════

function showView(v) {
    ['dashboard','activities','compare','records'].forEach(id => {
        document.getElementById('view-' + id).style.display = id === v ? 'block' : 'none';
        document.getElementById('nav-'  + id).classList.toggle('active', id === v);
    });
}

function html(id, v) {
    const el = document.getElementById(id);
    if (el) el.innerHTML = v;
}

function esc(s) {
    return String(s)
        .replace(/&/g,'&amp;')
        .replace(/</g,'&lt;')
        .replace(/>/g,'&gt;');
}

function showLoad(t = 'Loading…') {
    html('loading-txt', t);
    document.getElementById('loading').classList.add('on');
}
function setLoadTxt(t) { html('loading-txt', t); }
function hideLoad()    { document.getElementById('loading').classList.remove('on'); }

function toast(msg, type = 'inf') {
    const c = document.getElementById('toasts');
    const t = document.createElement('div');
    t.className   = 'toast ' + type;
    t.textContent = msg;
    c.appendChild(t);
    setTimeout(() => t.remove(), 3500);
}

function signOut() {
    localStorage.clear();
    A.token   = null;
    A.athlete = null;
    A.acts    = [];
    A.shown   = [];
    A.charts  = {};
    A.demo    = false;
    document.getElementById('app').style.display          = 'none';
    document.getElementById('login-screen').style.display = 'flex';
    toast('Signed out', 'inf');
}

function doRefresh() {
    if (A.demo)   { toast('Demo mode — no live data', 'inf'); return; }
    if (!A.token) { toast('Not connected', 'err'); return; }
    const b = document.getElementById('refresh-btn');
    b.disabled    = true;
    b.textContent = '⏳ Loading…';
    fetchActivities().finally(() => {
        b.disabled    = false;
        b.textContent = '🔄 Refresh';
    });
}

// Modal
function closeModal(e) {
    if (e.target.id === 'modal')
        document.getElementById('modal').classList.remove('open');
}
function closeModalDirect() {
    document.getElementById('modal').classList.remove('open');
}

// Called once data is ready — wires up the whole UI
function boot() {
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('app').style.display          = 'block';

    const name = A.athlete
        ? (A.athlete.firstname + ' ' + (A.athlete.lastname || '')).trim()
        : 'Athlete';

    html('ath-name', name);
    if (A.demo) document.getElementById('demo-badge').style.display = 'inline';

    // Avatar
    const av = document.getElementById('ath-avatar');
    if (A.athlete?.profile && !A.athlete.profile.includes('large.jpg')) {
        const img = document.createElement('img');
        img.className = 'ath-avatar';
        img.id        = 'ath-avatar';
        img.src       = A.athlete.profile;
        img.alt       = name;
        av.replaceWith(img);
    } else {
        av.textContent = name.charAt(0).toUpperCase();
    }

    fillCompareDropdowns();
    renderDashboard();
    renderTable();
    renderRecords();
}
