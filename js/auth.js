// ══════════════════════════════════════════════
//  AUTHENTICATION
// ══════════════════════════════════════════════

function connectStrava() {
    const p = new URLSearchParams({
        client_id:       CFG.CLIENT_ID,
        redirect_uri:    CFG.REDIRECT,
        response_type:   'code',
        approval_prompt: 'auto',
        scope:           CFG.SCOPE,
    });
    window.location.href = CFG.AUTH_URL + '?' + p;
}

async function handleCode(code) {
    showLoad('Authenticating…');

    // Client secret — prompted once, stored only in localStorage
    let secret = localStorage.getItem('rd_secret');
    if (!secret) {
        secret = prompt(
            'One-time setup: paste your Strava Client Secret\n' +
            '(saved only in your browser — never sent anywhere except Strava)'
        );
        if (!secret) { hideLoad(); return; }
        localStorage.setItem('rd_secret', secret);
    }

    try {
        const r = await fetch(CFG.TOKEN_URL, {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                client_id:     CFG.CLIENT_ID,
                client_secret: secret,
                code,
                grant_type:    'authorization_code',
            }),
        });
        if (!r.ok) {
            const e = await r.json();
            throw new Error(e.message || 'Token exchange failed');
        }
        const d = await r.json();
        A.token   = d.access_token;
        A.athlete = d.athlete;
        localStorage.setItem('rd_token',   d.access_token);
        localStorage.setItem('rd_refresh', d.refresh_token);
        localStorage.setItem('rd_expires', d.expires_at);
        localStorage.setItem('rd_athlete', JSON.stringify(d.athlete));
        await fetchActivities();
    } catch(e) {
        hideLoad();
        toast('Auth failed: ' + e.message, 'err');
        console.error(e);
    }
}

// ── Entry point ────────────────────────────────
(function init() {
    const p     = new URLSearchParams(window.location.search);
    const code  = p.get('code');
    const error = p.get('error');

    if (code || error)
        window.history.replaceState({}, '', window.location.pathname);

    if (error) { toast('Strava auth denied', 'err'); return; }
    if (code)  { handleCode(code); return; }

    // Returning visitor with stored token
    const tok = localStorage.getItem('rd_token');
    if (tok) {
        A.token = tok;
        const ath = localStorage.getItem('rd_athlete');
        if (ath) A.athlete = JSON.parse(ath);
        fetchActivities();
    }
})();
