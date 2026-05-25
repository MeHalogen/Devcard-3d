/* ==========================================================================
   DEVCARD 3D - APPLICATION ENGINE v2.0
   Features: GitHub OAuth (Supabase), Verified Badge, Anti-Cheat Leaderboard,
             Light Mode, Embed Mode, State Persistence, Query Params
   ========================================================================== */

/* --------------------------------------------------------------------------
   SUPABASE CONFIGURATION
   Replace the values below with your Supabase project URL and anon key.
   Get them free at https://supabase.com — the free tier is more than enough.
   If left as empty strings, the app runs in full LOCAL SIMULATION MODE.
   -------------------------------------------------------------------------- */
const SUPABASE_URL = window.SUPABASE_CONFIG?.url || '';
const SUPABASE_ANON_KEY = window.SUPABASE_CONFIG?.anonKey || '';
const LEADERBOARD_TABLE = 'devcard_leaderboard';

/* --------------------------------------------------------------------------
   BOOTSTRAP
   -------------------------------------------------------------------------- */
document.addEventListener('DOMContentLoaded', () => {

    // ---- Supabase client (null if not configured) ----
    let supabase = null;
    if (SUPABASE_URL && SUPABASE_ANON_KEY) {
        try {
            supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        } catch (e) {
            console.warn('Supabase init failed — running in local simulation mode.', e);
        }
    }

    // ---- App State ----
    const state = {
        username:      'torvalds',
        name:          'Linus Torvalds',
        bio:           'Writes kernel modules in his sleep. Direct commands bypass compiler limitations.',
        avatarUrl:     'https://avatars.githubusercontent.com/u/1024?v=4',
        hp:            18450,
        atk:           83,
        def:           190500,
        lvl:           18,
        rarity:        'Legendary Systems Architect',
        theme:         'holo-classic',
        primaryLang:   'cpp',
        secondaryLang: 'rs',
        isFlipped:     false,
        isVerified:    false,   // true only when stats come directly from GitHub API or OAuth
        authUser:      null,    // { login, avatarUrl, name } when authenticated
        isOnLeaderboard: false,
        isLightMode:   false,
    };

    // ---- Language to Element Map ----
    const elements = {
        js:   { emoji: '⚡', name: 'Lightning', color: '#f7df1e', title: 'Lightning Evoker' },
        ts:   { emoji: '🛡️', name: 'Cyber',    color: '#3178c6', title: 'Cyber Paladin' },
        py:   { emoji: '🐍', name: 'Nature',   color: '#3776ab', title: 'Nature Druid' },
        rs:   { emoji: '⚙️', name: 'Iron',     color: '#c85d1e', title: 'Iron Warlock' },
        go:   { emoji: '💨', name: 'Sky',      color: '#00add8', title: 'Sky Daemon' },
        cpp:  { emoji: '🔥', name: 'Fire',     color: '#f34b7d', title: 'Fire Conjurer' },
        html: { emoji: '✨', name: 'Illusion', color: '#e34c26', title: 'Illusionist Master' },
        rb:   { emoji: '💎', name: 'Heart',    color: '#701516', title: 'Heart Enchanter' },
        java: { emoji: '🏔️', name: 'Earth',   color: '#b07219', title: 'Enterprise Golem' },
    };



    // ---- DOM References ----
    const dom = {
        usernameInput:        document.getElementById('username'),
        btnFetch:             document.getElementById('btn-fetch'),
        themeCards:           document.querySelectorAll('.theme-card'),
        accordionToggle:      document.getElementById('accordion-toggle'),
        accordionContent:     document.getElementById('accordion-content'),
        statHp:               document.getElementById('stat-hp'),
        statAtk:              document.getElementById('stat-atk'),
        statDef:              document.getElementById('stat-def'),
        statLvl:              document.getElementById('stat-lvl'),
        valHp:                document.getElementById('val-hp'),
        valAtk:               document.getElementById('val-atk'),
        valDef:               document.getElementById('val-def'),
        valLvl:               document.getElementById('val-lvl'),
        customName:           document.getElementById('custom-name'),
        customTitle:          document.getElementById('custom-title'),
        customBio:            document.getElementById('custom-bio'),
        customAvatar:         document.getElementById('custom-avatar'),
        primaryLangSelect:    document.getElementById('primary-lang'),
        secondaryLangSelect:  document.getElementById('secondary-lang'),
        devCard:              document.getElementById('dev-card'),
        cardPerspective:      document.getElementById('card-perspective-container'),
        cardFoil:             document.getElementById('card-foil'),
        cardRarityTitle:      document.getElementById('card-rarity-title'),
        cardDisplayName:      document.getElementById('card-display-name'),
        cardDisplayLevel:     document.getElementById('card-display-level'),
        cardDisplayAvatar:    document.getElementById('card-display-avatar'),
        cardPrimaryElementBadge: document.getElementById('card-primary-element-badge'),
        cardDisplayBio:       document.getElementById('card-display-bio'),
        cardDisplayHp:        document.getElementById('card-display-hp'),
        cardDisplayAtk:       document.getElementById('card-display-atk'),
        cardDisplayDef:       document.getElementById('card-display-def'),
        affinity1:            document.getElementById('affinity-1'),
        affinity2:            document.getElementById('affinity-2'),
        cardVerifiedBadge:    document.getElementById('card-verified-badge'),
        verifiedBadgeText:    document.getElementById('verified-badge-text'),
        btnDownload:          document.getElementById('btn-download'),
        btnFlip:              document.getElementById('btn-flip'),
        quickFillButtons:     document.querySelectorAll('.btn-quick-fill'),
        tabTriggers:          document.querySelectorAll('.tab-trigger'),
        tabContents:          document.querySelectorAll('.tab-content'),
        embedCode:            document.getElementById('embed-code-content'),
        readmeCode:           document.getElementById('readme-code-content'),
        btnCopies:            document.querySelectorAll('.btn-copy'),
        toast:                document.getElementById('toast-notify'),
        shareTwitter:         document.getElementById('share-twitter'),
        shareLinkedin:        document.getElementById('share-linkedin'),
        btnCopyCardLink:      document.getElementById('btn-copy-card-link'),
        themeToggleBtn:       document.getElementById('theme-toggle'),
        themeIconLight:       document.getElementById('theme-icon-light'),
        themeIconDark:        document.getElementById('theme-icon-dark'),
        btnGithubLogin:       document.getElementById('btn-github-login'),
        userProfileChip:      document.getElementById('user-profile-chip'),
        userAvatarSm:         document.getElementById('user-avatar-sm'),
        userChipName:         document.getElementById('user-chip-name'),
        userChipDropdown:     document.getElementById('user-chip-dropdown'),
        ddViewCard:           document.getElementById('dd-view-card'),
        ddRegisterLeaderboard: document.getElementById('dd-register-leaderboard'),
        ddSignOut:            document.getElementById('dd-sign-out'),
        leaderboardList:      document.getElementById('leaderboard-list'),
        lbUnverifiedNotice:   document.getElementById('lb-unverified-notice'),
        btnJoinLeaderboard:   document.getElementById('btn-join-leaderboard'),
        joinLbLabel:          document.getElementById('join-lb-label'),
        consentModal:         document.getElementById('consent-modal'),
        modalConfirm:         document.getElementById('modal-confirm'),
        modalCancel:          document.getElementById('modal-cancel'),
        modalClose:           document.getElementById('modal-close'),
    };

    /* ========================================================================
       CARD BACK INJECTION
       ======================================================================== */
    function injectCardBack() {
        const backHtml = `
            <div class="card-back">
                <div class="circuit-grid"></div>
                <div class="card-back-logo">
                    <i data-lucide="layers" class="back-logo-icon"></i>
                    <span>DEVCARD</span>
                </div>
                <div class="card-back-frame">
                    <h4>DEV STATS OVERVIEW</h4>
                    <ul class="back-stats-list">
                        <li><span>RANKING</span><span class="stat-highlight" id="back-stat-rank">GOLD MAGE</span></li>
                        <li><span>LINEAGE</span><span id="back-stat-lang">C++ / RUST</span></li>
                        <li><span>CREATION</span><span id="back-stat-created">EST. 2008</span></li>
                        <li><span>VERIFIED</span><span id="back-stat-verified">NO</span></li>
                    </ul>
                </div>
                <div class="card-back-footer">
                    <span>DEVCARD-3D ✦ VERIFIED DEVELOPER EDITION</span>
                </div>
            </div>
        `;
        dom.devCard.insertAdjacentHTML('beforeend', backHtml);
    }

    // Inject card back then init icons
    injectCardBack();
    lucide.createIcons();

    /* ========================================================================
       EMBED MODE DETECTION
       ======================================================================== */
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('embed') === 'true') {
        document.body.classList.add('embed-mode');
    }

    /* ========================================================================
       LIGHT / DARK MODE
       ======================================================================== */
    let particleColors = [];

    function applyTheme(isLight) {
        state.isLightMode = isLight;
        document.body.classList.toggle('light-mode', isLight);
        dom.themeIconLight.style.display = isLight ? 'none' : '';
        dom.themeIconDark.style.display = isLight ? '' : 'none';
        localStorage.setItem('devcard_light_mode', isLight ? '1' : '0');
        // Rebuild particles with the right colors
        particleColors = isLight
            ? ['15, 23, 42', '2, 132, 199']
            : ['0, 242, 254', '79, 70, 229'];
    }

    const savedTheme = localStorage.getItem('devcard_light_mode');
    applyTheme(savedTheme === '1');

    dom.themeToggleBtn.addEventListener('click', () => applyTheme(!state.isLightMode));

    /* ========================================================================
       PARTICLE CANVAS
       ======================================================================== */

    (() => {
        const canvas = document.getElementById('canvas-particles');
        const ctx = canvas.getContext('2d');
        const particles = [];

        const resize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        window.addEventListener('resize', resize);
        resize();

        class Particle {
            constructor() { this.reset(); }
            reset() {
                this.x = Math.random() * canvas.width;
                this.y = Math.random() * canvas.height;
                this.size = Math.random() * 2.2 + 0.4;
                this.speedX = Math.random() * 0.4 - 0.2;
                this.speedY = Math.random() * -0.55 - 0.1;
                this.opacity = Math.random() * 0.45 + 0.08;
                this.refreshColor();
            }
            refreshColor() {
                this.glowColor = particleColors[Math.random() > 0.5 ? 0 : 1];
            }
            update() {
                this.x += this.speedX;
                this.y += this.speedY;
                if (this.y < 0) { this.y = canvas.height; this.x = Math.random() * canvas.width; this.refreshColor(); }
                if (this.x < 0 || this.x > canvas.width) { this.x = Math.random() * canvas.width; }
            }
            draw() {
                ctx.save();
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(${this.glowColor}, ${this.opacity})`;
                ctx.shadowBlur = this.size * 4;
                ctx.shadowColor = `rgb(${this.glowColor})`;
                ctx.fill();
                ctx.restore();
            }
        }

        for (let i = 0; i < 40; i++) particles.push(new Particle());

        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            particles.forEach(p => { p.update(); p.draw(); });
            requestAnimationFrame(animate);
        };
        animate();
    })();

    /* ========================================================================
       3D TILT & HOLOGRAPHIC FOIL
       ======================================================================== */
    dom.cardPerspective.addEventListener('mousemove', (e) => {
        if (state.isFlipped) return;
        const rect = dom.cardPerspective.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const rotX = ((y / rect.height) - 0.5) * -28;
        const rotY = ((x / rect.width)  - 0.5) * 28;
        const foilX = (x / rect.width)  * 100;
        const foilY = (y / rect.height) * 100;
        dom.devCard.style.transform = `rotateX(${rotX}deg) rotateY(${rotY}deg)`;
        dom.cardFoil.style.backgroundPosition = `${foilX}% ${foilY}%`;
    });

    dom.cardPerspective.addEventListener('mouseleave', () => {
        if (state.isFlipped) return;
        dom.devCard.style.transform = 'rotateX(0deg) rotateY(0deg)';
    });

    /* ========================================================================
       UTILITY FUNCTIONS
       ======================================================================== */
    const formatNumber = (n) => {
        if (n >= 1000000) return (n / 1000000).toFixed(1) + 'm';
        if (n >= 1000)    return (n / 1000).toFixed(1) + 'k';
        return n.toLocaleString();
    };

    const getDevRarity = (followers, repos) => {
        const score = followers * 5 + repos * 2;
        if (score >= 10000) return 'Mythic Systems Architect';
        if (score >= 2500)  return 'Legendary Engine Artificer';
        if (score >= 700)   return 'Epic Full-Stack Sorcerer';
        if (score >= 150)   return 'Rare Web Guardian';
        if (score >= 30)    return 'Uncommon Code Squire';
        return 'Common Compiler Apprentice';
    };

    /** Dev score formula for leaderboard ranking */
    const calcScore = (dev) =>
        Math.round((dev.hp / 10) + (dev.atk * 8) + (dev.def * 1.5) + (dev.lvl * 20));

    /* ========================================================================
       VERIFICATION BADGE
       ======================================================================== */
    function updateVerifiedBadge() {
        const badge = dom.cardVerifiedBadge;
        const txt   = dom.verifiedBadgeText;
        const backVerified = document.getElementById('back-stat-verified');
        const iconWrapper = document.getElementById('badge-icon-wrapper');

        if (state.isVerified) {
            badge.className = 'card-verified-badge verified';
            if (iconWrapper) iconWrapper.innerHTML = '<i data-lucide="badge-check" aria-hidden="true"></i>';
            txt.textContent = 'Verified Dev';
            if (backVerified) backVerified.textContent = 'YES ✓';
        } else {
            badge.className = 'card-verified-badge creative';
            if (iconWrapper) iconWrapper.innerHTML = '<i data-lucide="pencil" aria-hidden="true"></i>';
            txt.textContent = 'Creative Mode';
            if (backVerified) backVerified.textContent = 'NO';
        }
        lucide.createIcons();
    }

    function revokeVerification() {
        if (state.isVerified) {
            state.isVerified = false;
            updateVerifiedBadge();
            renderLeaderboard();
        }
    }

    /* ========================================================================
       CARD GRAPHICS UPDATE
       ======================================================================== */
    function updateCardGraphics() {
        const cardNode = dom.devCard.firstElementChild;
        cardNode.className = `card-face card-front ${state.theme}`;

        dom.cardRarityTitle.textContent  = state.rarity;
        dom.cardDisplayName.textContent  = state.username;
        dom.cardDisplayLevel.textContent = state.lvl;
        dom.cardDisplayAvatar.src        = state.avatarUrl;
        dom.cardDisplayAvatar.alt        = `${state.name}'s avatar`;
        dom.cardDisplayHp.textContent    = formatNumber(state.hp);
        dom.cardDisplayAtk.textContent   = formatNumber(state.atk);
        dom.cardDisplayDef.textContent   = formatNumber(state.def);
        dom.cardDisplayBio.textContent   = state.bio;

        const pri = elements[state.primaryLang]   || elements.js;
        const sec = elements[state.secondaryLang] || elements.ts;

        dom.cardPrimaryElementBadge.firstElementChild.textContent = pri.emoji;
        dom.cardPrimaryElementBadge.style.borderColor  = pri.color;
        dom.cardPrimaryElementBadge.style.boxShadow    = `0 0 10px ${pri.color}55`;

        dom.affinity1.textContent    = pri.name;
        dom.affinity1.style.color    = pri.color;
        dom.affinity1.style.borderColor = `${pri.color}33`;

        dom.affinity2.textContent    = sec.name;
        dom.affinity2.style.color    = sec.color;
        dom.affinity2.style.borderColor = `${sec.color}33`;

        // Card back dynamic data
        const backRank    = document.getElementById('back-stat-rank');
        const backLang    = document.getElementById('back-stat-lang');
        const backCreated = document.getElementById('back-stat-created');
        if (backRank)    backRank.textContent    = state.rarity.split(' ').slice(0, 2).join(' ').toUpperCase();
        if (backLang)    backLang.textContent    = `${pri.name.toUpperCase()} / ${sec.name.toUpperCase()}`;
        if (backCreated) backCreated.textContent = `EST. ${new Date().getFullYear() - state.lvl}`;

        updateVerifiedBadge();
        updateCodeBlocks();
        saveStateToLocalStorage();
    }

    /* ========================================================================
       EMBED CODE & README BADGES
       ======================================================================== */
    function updateCodeBlocks() {
        const base = (window.location.origin && window.location.origin !== 'null')
            ? window.location.origin
            : 'https://devcard3d.vercel.app';

        const params = new URLSearchParams({
            user:    state.username,
            theme:   state.theme,
            primary: state.primaryLang,
            secondary: state.secondaryLang,
            embed:   'true',
        });

        dom.embedCode.textContent =
            `<iframe src="${base}/?${params}" width="360" height="520" style="border:none;border-radius:18px;overflow:hidden;" scrolling="no" loading="lazy"></iframe>`;

        dom.readmeCode.textContent =
            `[![My DevCard](${base}/api/badge?user=${state.username}&theme=${state.theme})](${base})`;
    }

    /* ========================================================================
       LOCAL STORAGE STATE PERSISTENCE
       ======================================================================== */
    function saveStateToLocalStorage() {
        const saved = {
            username: state.username, name: state.name, bio: state.bio,
            avatarUrl: state.avatarUrl, hp: state.hp, atk: state.atk,
            def: state.def, lvl: state.lvl, rarity: state.rarity,
            theme: state.theme, primaryLang: state.primaryLang,
            secondaryLang: state.secondaryLang,
        };
        try { localStorage.setItem('devcard_state', JSON.stringify(saved)); } catch (_) {}
    }

    function loadStateFromLocalStorage() {
        try {
            const raw = localStorage.getItem('devcard_state');
            if (!raw) return false;
            const saved = JSON.parse(raw);
            Object.assign(state, saved);
            return true;
        } catch (_) { return false; }
    }

    /* ========================================================================
       QUERY PARAMETER INITIALIZATION
       ======================================================================== */
    function initFromQueryParams() {
        const p = new URLSearchParams(window.location.search);
        let changed = false;

        if (p.get('user'))      { state.username = p.get('user'); changed = true; }
        if (p.get('theme'))     { state.theme    = p.get('theme'); changed = true; }
        if (p.get('primary'))   { state.primaryLang   = p.get('primary'); changed = true; }
        if (p.get('secondary')) { state.secondaryLang = p.get('secondary'); changed = true; }
        if (p.get('hp'))        { state.hp  = parseInt(p.get('hp'), 10)  || state.hp; }
        if (p.get('atk'))       { state.atk = parseInt(p.get('atk'), 10) || state.atk; }
        if (p.get('def'))       { state.def = parseInt(p.get('def'), 10) || state.def; }
        if (p.get('lvl'))       { state.lvl = parseInt(p.get('lvl'), 10) || state.lvl; }

        // If we got user from URL, try to auto-fetch live data
        if (changed && p.get('user') && !p.get('hp')) {
            fetchGithubData(p.get('user'));
        }
        return changed;
    }

    /* ========================================================================
       SLIDER SYNC
       ======================================================================== */
    function syncSlidersWithState() {
        dom.statHp.value   = Math.min(state.hp, 25000);
        dom.valHp.textContent  = state.hp.toLocaleString();
        dom.statAtk.value  = Math.min(state.atk, 150);
        dom.valAtk.textContent = state.atk;
        dom.statDef.value  = Math.min(state.def, 10000);
        dom.valDef.textContent = state.def.toLocaleString();
        dom.statLvl.value  = Math.min(state.lvl, 25);
        dom.valLvl.textContent = state.lvl;
        dom.customName.value   = state.name;
        dom.customTitle.value  = state.rarity;
        dom.customBio.value    = state.bio;
        dom.customAvatar.value = state.avatarUrl;
        dom.primaryLangSelect.value   = state.primaryLang;
        dom.secondaryLangSelect.value = state.secondaryLang;

        // Sync active theme card
        dom.themeCards.forEach(c => {
            const isActive = c.dataset.theme === state.theme;
            c.classList.toggle('active', isActive);
            c.setAttribute('aria-checked', isActive);
        });
    }

    /* ========================================================================
       MANUAL SLIDER EVENT BINDINGS
       ======================================================================== */
    const linkSlider = (slider, valNode, stateProp, fmt = x => x) => {
        slider.addEventListener('input', (e) => {
            const val = parseInt(e.target.value, 10);
            valNode.textContent = fmt(val);
            state[stateProp] = val;
            if (stateProp === 'def' || stateProp === 'atk') {
                state.rarity = getDevRarity(state.def, state.atk);
                dom.customTitle.value = state.rarity;
            }
            revokeVerification(); // Manually edited → revoke verified status
            updateCardGraphics();
        });
    };

    linkSlider(dom.statHp,  dom.valHp,  'hp',  x => x.toLocaleString());
    linkSlider(dom.statAtk, dom.valAtk, 'atk');
    linkSlider(dom.statDef, dom.valDef, 'def', x => x.toLocaleString());
    linkSlider(dom.statLvl, dom.valLvl, 'lvl');

    const linkInput = (inputNode, stateProp) => {
        inputNode.addEventListener('input', (e) => {
            state[stateProp] = e.target.value || state[stateProp];
            updateCardGraphics();
        });
    };

    linkInput(dom.customName,  'name');
    linkInput(dom.customTitle, 'rarity');
    linkInput(dom.customBio,   'bio');

    dom.customAvatar.addEventListener('input', (e) => {
        if (e.target.value) { state.avatarUrl = e.target.value; updateCardGraphics(); }
    });

    dom.primaryLangSelect.addEventListener('change', (e) => {
        state.primaryLang = e.target.value; updateCardGraphics();
    });
    dom.secondaryLangSelect.addEventListener('change', (e) => {
        state.secondaryLang = e.target.value; updateCardGraphics();
    });

    dom.themeCards.forEach(card => {
        card.addEventListener('click', () => {
            dom.themeCards.forEach(c => { c.classList.remove('active'); c.setAttribute('aria-checked', 'false'); });
            card.classList.add('active');
            card.setAttribute('aria-checked', 'true');
            state.theme = card.dataset.theme;
            updateCardGraphics();
        });
    });

    dom.accordionToggle.addEventListener('click', () => {
        const isExpanded = dom.accordionToggle.classList.toggle('active');
        dom.accordionContent.classList.toggle('active', isExpanded);
        dom.accordionToggle.setAttribute('aria-expanded', isExpanded);
        dom.accordionContent.setAttribute('aria-hidden', !isExpanded);
    });

    dom.accordionToggle.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); dom.accordionToggle.click(); }
    });

    /* ========================================================================
       GITHUB API FETCH
       ======================================================================== */
    const showToast = (message, isError = false) => {
        const iconWrapper = document.getElementById('toast-icon-wrapper');
        if (isError) {
            dom.toast.style.borderColor = '#ff4a5a';
            dom.toast.style.boxShadow   = '0 10px 30px rgba(255,74,90,0.2)';
            if (iconWrapper) iconWrapper.innerHTML = '<i data-lucide="alert-circle" class="toast-icon" aria-hidden="true"></i>';
        } else {
            dom.toast.style.borderColor = '';
            dom.toast.style.boxShadow   = '';
            if (iconWrapper) iconWrapper.innerHTML = '<i data-lucide="check-circle" class="toast-icon" aria-hidden="true"></i>';
        }
        lucide.createIcons();
        dom.toast.querySelector('.toast-message').textContent = message;
        dom.toast.classList.add('show');
        setTimeout(() => dom.toast.classList.remove('show'), 3200);
    };

    const fetchGithubData = async (username) => {
        if (!username) return;

        dom.btnFetch.classList.add('loading');
        dom.btnFetch.disabled = true;
        const iconWrapper = document.getElementById('btn-fetch-icon-wrapper');
        if (iconWrapper) iconWrapper.innerHTML = '<i data-lucide="loader-2" aria-hidden="true"></i>';
        lucide.createIcons();

        try {
            const userResp = await fetch(`https://api.github.com/users/${username}`);
            if (!userResp.ok) {
                const status = userResp.status;
                if (status === 403) throw new Error('API rate limited — please try again shortly.');
                if (status === 404) throw new Error(`GitHub user "@${username}" not found.`);
                throw new Error('Failed to fetch GitHub profile.');
            }
            const userData = await userResp.json();

            // Fetch top languages from repos
            let topLangs = ['js', 'ts'];
            try {
                const reposResp = await fetch(`https://api.github.com/users/${username}/repos?per_page=40&sort=updated`);
                if (reposResp.ok) {
                    const repos = await reposResp.json();
                    const count = {};
                    repos.forEach(r => { if (r.language) { const l = r.language.toLowerCase(); count[l] = (count[l] || 0) + 1; } });
                    const sorted = Object.keys(count).sort((a, b) => count[b] - count[a]);
                    const map = { javascript: 'js', typescript: 'ts', python: 'py', rust: 'rs', go: 'go', 'c++': 'cpp', html: 'html', css: 'html', ruby: 'rb', java: 'java' };
                    const matched = sorted.map(l => map[l]).filter(Boolean);
                    if (matched[0]) topLangs[0] = matched[0];
                    if (matched[1]) topLangs[1] = matched[1];
                }
            } catch (_) {}

            const hp  = Math.min(25000, (userData.public_repos * 32) + (userData.followers * 3) + 1500);
            const lvl = Math.max(1, new Date().getFullYear() - new Date(userData.created_at).getFullYear() + 1);

            state.username     = userData.login;
            state.name         = userData.name || userData.login;
            state.avatarUrl    = userData.avatar_url;
            state.bio          = userData.bio || 'This mysterious developer lets their code speak for itself.';
            state.atk          = userData.public_repos || 1;
            state.def          = userData.followers    || 0;
            state.hp           = hp;
            state.lvl          = Math.min(99, lvl);
            state.rarity       = getDevRarity(state.def, state.atk);
            state.primaryLang  = topLangs[0] || 'js';
            state.secondaryLang = topLangs[1] || 'ts';
            state.isVerified   = true;   // ✅ Fresh from API — verified!

            syncSlidersWithState();
            updateCardGraphics();
            renderLeaderboard();
            showToast(`✅ Loaded verified stats for @${userData.login}!`);
        } catch (err) {
            console.error(err);
            showToast(err.message, true);
            simulateOfflineStats(username);
        } finally {
            dom.btnFetch.classList.remove('loading');
            dom.btnFetch.disabled = false;
            const iconWrapper = document.getElementById('btn-fetch-icon-wrapper');
            if (iconWrapper) iconWrapper.innerHTML = '<i data-lucide="sparkles" aria-hidden="true"></i>';
            lucide.createIcons();
        }
    };

    const simulateOfflineStats = (username) => {
        let hash = 0;
        for (let i = 0; i < username.length; i++) {
            hash = username.charCodeAt(i) + ((hash << 5) - hash);
        }
        const langs = Object.keys(elements);
        state.username     = username;
        state.name         = username.charAt(0).toUpperCase() + username.slice(1);
        state.avatarUrl    = `https://api.dicebear.com/7.x/identicon/svg?seed=${username}`;
        state.bio          = 'Simulated offline card — generated while GitHub API was unreachable.';
        state.atk          = Math.abs(hash % 45) + 15;
        state.def          = Math.abs(hash % 380) * 8 + 12;
        state.hp           = Math.abs(hash % 120) * 150 + 1200;
        state.lvl          = Math.abs(hash % 12) + 1;
        state.rarity       = getDevRarity(state.def, state.atk);
        state.primaryLang  = langs[Math.abs(hash)       % langs.length];
        state.secondaryLang = langs[Math.abs(hash + 1)  % langs.length];
        state.isVerified   = false;  // offline sim is never verified

        syncSlidersWithState();
        updateCardGraphics();
    };

    dom.btnFetch.addEventListener('click', () => {
        const u = dom.usernameInput.value.trim();
        if (u) fetchGithubData(u);
    });

    dom.usernameInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') { const u = dom.usernameInput.value.trim(); if (u) fetchGithubData(u); }
    });

    dom.quickFillButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            dom.usernameInput.value = btn.dataset.user;
            fetchGithubData(btn.dataset.user);
        });
    });

    /* ========================================================================
       GITHUB OAUTH / SUPABASE SESSION
       ======================================================================== */
    async function signInWithGitHub() {
        if (!supabase) {
            // Local simulation mode
            simulateLocalLogin();
            return;
        }
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'github',
                options: { redirectTo: window.location.href },
            });
            if (error) throw error;
        } catch (err) {
            showToast('GitHub sign-in failed: ' + err.message, true);
        }
    }

    function simulateLocalLogin() {
        // Simulate a GitHub login using the currently loaded card's data
        const user = {
            login:     state.username || 'developer',
            name:      state.name     || 'Developer',
            avatarUrl: state.avatarUrl,
        };
        state.authUser = user;
        state.isVerified = true;
        applyAuthUserToUI(user);
        // Fetch real data for this user if possible
        fetchGithubData(user.login);
        showToast(`👋 Signed in as @${user.login} (local simulation)`);
    }

    function applyAuthUserToUI(user) {
        dom.btnGithubLogin.style.display    = 'none';
        dom.userProfileChip.classList.add('visible');
        dom.userAvatarSm.src                = user.avatarUrl || `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(user.login || 'user')}`;
        dom.userChipName.textContent        = user.name || user.login;
        dom.joinLbLabel.textContent         = state.isOnLeaderboard ? 'On Leaderboard ✓' : 'Join Leaderboard';
    }

    function clearAuthUI() {
        state.authUser       = null;
        state.isVerified     = false;
        state.isOnLeaderboard = false;
        dom.btnGithubLogin.style.display = '';
        dom.userProfileChip.classList.remove('visible');
        updateVerifiedBadge();
        renderLeaderboard();
    }

    // Resolve active Supabase session on load
    async function resolveSession() {
        if (!supabase) return;
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
                const meta = session.user.user_metadata;
                state.authUser = { login: meta.user_name, name: meta.full_name, avatarUrl: meta.avatar_url };
                state.isVerified = true;
                applyAuthUserToUI(state.authUser);
                await fetchGithubData(state.authUser.login);
                await checkLeaderboardStatus();
            }
        } catch (err) {
            console.warn('Session resolve error:', err);
        }
    }

    resolveSession();

    dom.btnGithubLogin.addEventListener('click', signInWithGitHub);

    // Profile chip dropdown toggle
    dom.userProfileChip.addEventListener('click', (e) => {
        e.stopPropagation();
        const isOpen = dom.userChipDropdown.classList.toggle('open');
        dom.userProfileChip.setAttribute('aria-expanded', isOpen);
    });

    // Prevent propagation on clicks inside the dropdown so they do not bubble up to the chip and toggle it
    dom.userChipDropdown.addEventListener('click', (e) => {
        e.stopPropagation();
    });

    document.addEventListener('click', () => {
        dom.userChipDropdown.classList.remove('open');
        dom.userProfileChip.setAttribute('aria-expanded', 'false');
    });

    dom.ddViewCard.addEventListener('click', () => {
        if (state.authUser) fetchGithubData(state.authUser.login);
        dom.userChipDropdown.classList.remove('open');
    });

    dom.ddRegisterLeaderboard.addEventListener('click', () => {
        dom.userChipDropdown.classList.remove('open');
        openConsentModal();
    });

    dom.ddSignOut.addEventListener('click', async () => {
        dom.userChipDropdown.classList.remove('open');
        if (supabase) { try { await supabase.auth.signOut(); } catch (_) {} }
        clearAuthUI();
        showToast('Signed out successfully.');
    });

    /* ========================================================================
       LEADERBOARD
       ======================================================================== */
    async function checkLeaderboardStatus() {
        if (!supabase || !state.authUser) return;
        try {
            const { data } = await supabase
                .from(LEADERBOARD_TABLE)
                .select('username')
                .eq('username', state.authUser.login)
                .single();
            state.isOnLeaderboard = !!data;
            if (dom.joinLbLabel) {
                dom.joinLbLabel.textContent = state.isOnLeaderboard ? 'On Leaderboard ✓' : 'Join Leaderboard';
            }
        } catch (_) {}
    }

    async function registerOnLeaderboard() {
        if (!state.isVerified) {
            showToast('Only verified stats can join the leaderboard.', true);
            return;
        }

        const entry = {
            username:   state.username,
            name:       state.name,
            avatar_url: state.avatarUrl,
            score:      calcScore(state),
            hp:         state.hp,
            atk:        state.atk,
            def:        state.def,
            lvl:        state.lvl,
            theme:      state.theme,
            primary_lang: state.primaryLang,
            verified:   true,
            updated_at: new Date().toISOString(),
        };

        if (supabase) {
            try {
                const { error } = await supabase
                    .from(LEADERBOARD_TABLE)
                    .upsert(entry, { onConflict: 'username' });
                if (error) throw error;
            } catch (err) {
                console.warn('Supabase write failed, saving locally:', err);
            }
        }

        // Always save locally too
        saveLocalLeaderboardEntry(entry);
        state.isOnLeaderboard = true;
        dom.joinLbLabel.textContent = 'On Leaderboard ✓';
        showToast('🏆 You\'ve been registered on the leaderboard!');
        renderLeaderboard();
    }

    function saveLocalLeaderboardEntry(entry) {
        try {
            const existing = JSON.parse(localStorage.getItem('devcard_leaderboard') || '[]');
            const filtered = existing.filter(e => e.username !== entry.username);
            filtered.push(entry);
            localStorage.setItem('devcard_leaderboard', JSON.stringify(filtered));
        } catch (_) {}
    }

    function loadLocalLeaderboardEntries() {
        try {
            return JSON.parse(localStorage.getItem('devcard_leaderboard') || '[]');
        } catch (_) { return []; }
    }

    async function fetchLeaderboardFromSupabase() {
        if (!supabase) return [];
        try {
            const { data } = await supabase
                .from(LEADERBOARD_TABLE)
                .select('*')
                .eq('verified', true)
                .order('score', { ascending: false })
                .limit(20);
            return data || [];
        } catch (_) { return []; }
    }

    async function renderLeaderboard() {
        const container = dom.leaderboardList;
        if (!container) return;

        // Show unverified notice if user is in creative mode
        if (dom.lbUnverifiedNotice) {
            dom.lbUnverifiedNotice.style.display = (!state.isVerified && state.authUser) ? '' : 'none';
        }

        // Gather all entries: benchmarks + DB/local entries
        const localEntries = loadLocalLeaderboardEntries();
        const dbEntries    = await fetchLeaderboardFromSupabase();

        // Merge: prefer DB entries, fall back to local
        const merged = {};
        localEntries.forEach(e  => { merged[e.username] = { ...e, score: calcScore(e) }; });
        dbEntries.forEach(e     => { merged[e.username] = { ...e, score: calcScore(e) }; });

        // Add current user's verified card if applicable (even if not registered)
        if (state.isVerified && state.username) {
            merged[state.username] = {
                username:   state.username,
                name:       state.name,
                avatarUrl:  state.avatarUrl,
                avatar_url: state.avatarUrl,
                score:      calcScore(state),
                hp: state.hp, atk: state.atk, def: state.def, lvl: state.lvl,
                verified:   true,
                isCurrentUser: true,
            };
        }

        // Sort by score descending
        const ranked = Object.values(merged).sort((a, b) => b.score - a.score);

        if (ranked.length === 0) {
            container.innerHTML = `<div class="lb-empty"><span class="empty-icon">🌌</span>No entries yet. Be the first to join!</div>`;
            return;
        }

        container.innerHTML = ranked.map((dev, i) => {
            const rank      = i + 1;
            const rankClass = rank <= 3 ? `rank-${rank}` : '';
            const rankEmoji = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `#${rank}`;
            const avatar    = dev.avatar_url || dev.avatarUrl || `https://api.dicebear.com/7.x/identicon/svg?seed=${dev.username}`;
            const name      = dev.name || dev.username;
            const isCurrent = dev.isCurrentUser ? 'is-current-user' : '';
            const score     = dev.score.toLocaleString();
            const sub       = `@${dev.username} · LVL ${dev.lvl || '?'}`;
            const verifiedDot = dev.verified ? '<span class="lb-verified-dot" title="Verified via GitHub" aria-label="Verified"></span>' : '';

            return `
                <div class="leaderboard-row ${rankClass} ${isCurrent}" role="listitem">
                    <span class="lb-rank" aria-label="Rank ${rank}">${rankEmoji}</span>
                    <img class="lb-avatar" src="${avatar}" alt="${name}" loading="lazy" onerror="this.src='https://api.dicebear.com/7.x/identicon/svg?seed=${dev.username}'">
                    <div class="lb-info">
                        <div class="lb-name">${name}${dev.isCurrentUser ? ' <em style="font-size:0.7rem;font-weight:400;opacity:0.6">(You)</em>' : ''}</div>
                        <div class="lb-sub">${sub}</div>
                    </div>
                    <div class="lb-score-block">
                        <span class="lb-score">${score}</span>
                        <span class="lb-score-label">DEV SCORE</span>
                    </div>
                    ${verifiedDot}
                </div>
            `;
        }).join('');
    }

    /* ========================================================================
       CONSENT MODAL
       ======================================================================== */
    function openConsentModal() {
        if (!state.authUser && !supabase) {
            // Not logged in at all — prompt login first
            showToast('Sign in with GitHub first to join the leaderboard.', true);
            return;
        }
        if (!state.isVerified) {
            showToast('Your card must be in Verified mode to join the leaderboard.', true);
            return;
        }
        dom.consentModal.classList.add('open');
        dom.modalConfirm.focus();
    }

    function closeConsentModal() {
        dom.consentModal.classList.remove('open');
    }

    dom.btnJoinLeaderboard.addEventListener('click', openConsentModal);
    dom.modalClose.addEventListener('click', closeConsentModal);
    dom.modalCancel.addEventListener('click', closeConsentModal);
    dom.consentModal.addEventListener('click', (e) => { if (e.target === dom.consentModal) closeConsentModal(); });

    dom.modalConfirm.addEventListener('click', async () => {
        closeConsentModal();
        await registerOnLeaderboard();
    });

    // Keyboard trap for modal
    dom.consentModal.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeConsentModal();
    });

    /* ========================================================================
       CARD FLIP & DOWNLOAD
       ======================================================================== */
    dom.btnFlip.addEventListener('click', () => {
        state.isFlipped = !state.isFlipped;
        dom.devCard.style.transform = state.isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)';
        dom.btnFlip.innerHTML = state.isFlipped
            ? '<i data-lucide="rotate-3d"></i> Show Front'
            : '<i data-lucide="rotate-3d"></i> Flip Card';
        lucide.createIcons();
    });

    dom.btnDownload.addEventListener('click', () => {
        const orig = dom.devCard.style.transform;
        dom.devCard.style.transform = 'rotateX(0deg) rotateY(0deg)';
        setTimeout(() => {
            html2canvas(document.getElementById('card-front-content'), {
                useCORS: true, allowTaint: true, backgroundColor: null, scale: 2
            }).then(canvas => {
                const link = document.createElement('a');
                link.download = `devcard_${state.username}.png`;
                link.href = canvas.toDataURL('image/png');
                link.click();
                showToast(`📥 Saved as devcard_${state.username}.png`);
                dom.devCard.style.transform = orig;
            }).catch(err => {
                console.error(err);
                showToast('Download failed. Try a different browser.', true);
                dom.devCard.style.transform = orig;
            });
        }, 160);
    });

    /* ========================================================================
       TABS
       ======================================================================== */
    dom.tabTriggers.forEach(tab => {
        tab.addEventListener('click', () => {
            dom.tabTriggers.forEach(t => { t.classList.remove('active'); t.setAttribute('aria-selected', 'false'); });
            dom.tabContents.forEach(c =>   c.classList.remove('active'));
            tab.classList.add('active');
            tab.setAttribute('aria-selected', 'true');
            const target = document.getElementById(tab.dataset.tab);
            if (target) target.classList.add('active');

            // Render leaderboard lazily on first open
            if (tab.dataset.tab === 'tab-leaderboard') renderLeaderboard();
        });
    });

    dom.btnCopies.forEach(btn => {
        btn.addEventListener('click', () => {
            const el = document.getElementById(btn.dataset.target);
            if (!el) return;
            navigator.clipboard.writeText(el.textContent)
                .then(() => showToast('Copied to clipboard!'))
                .catch(() => showToast('Copy failed.', true));
        });
    });

    /* ========================================================================
       SOCIAL SHARES
       ======================================================================== */
    const updateSocialShares = () => {
        const url  = window.location.href;
        const text = `Check out my ${state.rarity} card on DevCard 3D! I scored ${calcScore(state).toLocaleString()} points. Generate yours:`;
        dom.shareTwitter.href  = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
        dom.shareLinkedin.href = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
    };

    dom.btnCopyCardLink.addEventListener('click', () => {
        const params = new URLSearchParams({
            user: state.username, theme: state.theme,
            primary: state.primaryLang, secondary: state.secondaryLang,
        });
        const url = `${window.location.origin}/?${params}`;
        navigator.clipboard.writeText(url)
            .then(() => showToast('Card link copied!'))
            .catch(() => showToast('Failed to copy link.', true));
    });

    setInterval(updateSocialShares, 1500);

    /* ========================================================================
       BOOT SEQUENCE
       ======================================================================== */
    const didLoadFromParams = initFromQueryParams();
    if (!didLoadFromParams) {
        loadStateFromLocalStorage();
    }
    syncSlidersWithState();
    updateCardGraphics();
    renderLeaderboard();

}); // end DOMContentLoaded
