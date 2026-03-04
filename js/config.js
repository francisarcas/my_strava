// ══════════════════════════════════════════════
//  GLOBAL STATE & CONFIG
//  Must be loaded FIRST — all other scripts
//  depend on CFG and A being defined.
// ══════════════════════════════════════════════

const CFG = {
    CLIENT_ID: '208009',
    get REDIRECT() {
        return window.location.origin + window.location.pathname;
    },
    SCOPE:     'read,activity:read_all',
    AUTH_URL:  'https://www.strava.com/oauth/authorize',
    TOKEN_URL: 'https://www.strava.com/oauth/token',
    API:       'https://www.strava.com/api/v3',
};

// Single shared state — every module reads and writes this object
const A = {
    token:   null,
    athlete: null,
    acts:    [],    // all processed activities
    shown:   [],    // filtered/sorted subset for the table
    charts:  {},    // Chart.js instances keyed by canvas id
    demo:    false,
};
