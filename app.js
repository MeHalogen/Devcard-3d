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
        username:      '--',
        name:          '--',
        bio:           'This mysterious developer lets their code speak for itself.',
        avatarUrl:     'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%238b949e"><circle cx="12" cy="8" r="4"/><path d="M12 14c-6.1 0-8 4-8 4v2h16v-2s-1.9-4-8-4z"/></svg>',
        hp:            0,
        atk:           0,
        def:           0,
        lvl:           1,
        rarity:        'Common Developer',
        theme:         'holo-classic',
        primaryLang:   'js',
        secondaryLang: 'ts',
        isFlipped:     false,
        isVerified:    false,   // true only when stats come directly from GitHub API or OAuth
        authUser:      null,    // { login, avatarUrl, name } when authenticated
        isOnLeaderboard: false,
        isLightMode:   false,
        createdAt:     new Date().toISOString(),
        company:       '',
        hireable:      false,
    };

    // ---- Language configuration ----
    const elements = {
        js:   { emoji: '⚡', name: 'JavaScript', color: '#f7df1e', title: 'JS Wizard' },
        ts:   { emoji: '🛡️', name: 'TypeScript', color: '#3178c6', title: 'TS Paladin' },
        py:   { emoji: '🐍', name: 'Python',     color: '#3776ab', title: 'Python Guru' },
        rs:   { emoji: '⚙️', name: 'Rust',       color: '#c85d1e', title: 'Rust Master' },
        go:   { emoji: '💨', name: 'Go',         color: '#00add8', title: 'Go Champion' },
        cpp:  { emoji: '🔥', name: 'C++',        color: '#f34b7d', title: 'C++ Knight' },
        c:    { emoji: '🔌', name: 'C',          color: '#a8b9cc', title: 'C Specialist' },
        cs:   { emoji: '🎯', name: 'C#',         color: '#178600', title: 'C# Expert' },
        swift: { emoji: '🐦', name: 'Swift',     color: '#f05138', title: 'Swift Dev' },
        kotlin: { emoji: '📱', name: 'Kotlin',   color: '#7f52ff', title: 'Kotlin Ranger' },
        php:  { emoji: '🐘', name: 'PHP',        color: '#777bb4', title: 'PHP Sorcerer' },
        html: { emoji: '✨', name: 'HTML/CSS',   color: '#e34c26', title: 'UI Architect' },
        rb:   { emoji: '💎', name: 'Ruby',       color: '#701516', title: 'Ruby Mage' },
        java: { emoji: '🏔️', name: 'Java',       color: '#b07219', title: 'Java Veteran' },
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
                    <h4>DEV ATTRIBUTES</h4>
                    <div class="back-attributes">
                        <!-- INT Meter -->
                        <div class="attribute-node">
                            <div class="attribute-meta">
                                <span>INTELLECT (INT)</span>
                                <span class="attribute-value" id="back-val-int">50</span>
                            </div>
                            <div class="attribute-bar-bg">
                                <div class="attribute-bar-fill" id="back-bar-int" style="width: 50%"></div>
                            </div>
                        </div>
                        <!-- CHA Meter -->
                        <div class="attribute-node">
                            <div class="attribute-meta">
                                <span>CHARISMA (CHA)</span>
                                <span class="attribute-value" id="back-val-cha">50</span>
                            </div>
                            <div class="attribute-bar-bg">
                                <div class="attribute-bar-fill" id="back-bar-cha" style="width: 50%"></div>
                            </div>
                        </div>
                        <!-- AGI Meter -->
                        <div class="attribute-node">
                            <div class="attribute-meta">
                                <span>AGILITY (AGI)</span>
                                <span class="attribute-value" id="back-val-agi">50</span>
                            </div>
                            <div class="attribute-bar-bg">
                                <div class="attribute-bar-fill" id="back-bar-agi" style="width: 50%"></div>
                            </div>
                        </div>
                    </div>

                    <ul class="back-stats-list">
                        <li><span>LINEAGE</span><span id="back-stat-created">EST. --</span></li>
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

    const getDeveloperClass = (primaryLang, secondaryLang) => {
        const pLang = (primaryLang || 'js').toLowerCase();
        const sLang = (secondaryLang || (state && state.secondaryLang) || 'ts').toLowerCase();
        
        const frontendLangs = ['js', 'ts', 'html', 'css', 'swift', 'kotlin'];
        const backendLangs = ['go', 'java', 'py', 'rb', 'php', 'cpp', 'rs'];
        
        const isPFront = frontendLangs.includes(pLang);
        const isSFront = frontendLangs.includes(sLang);
        const isPBack = backendLangs.includes(pLang);
        const isSBack = backendLangs.includes(sLang);
        
        // Full stack: Primary is frontend and secondary is backend, or vice versa
        if ((isPFront && isSBack) || (isPBack && isSFront)) {
            const fullStackClasses = [
                'Full-Stack Alchemist',
                'Systems Architect',
                'Cyber Gladiator',
                'Full-Stack Archmage'
            ];
            const idx = (pLang.length + sLang.length) % fullStackClasses.length;
            return fullStackClasses[idx];
        } else if (isPFront) {
            const frontClasses = {
                'js': 'Frontend Spellweaver',
                'ts': 'Type Chronomancer',
                'html': 'DOM Paladin',
                'css': 'CSS Illusionist',
                'swift': 'iOS Ranger',
                'kotlin': 'Android Druid'
            };
            return frontClasses[pLang] || 'Frontend Spellweaver';
        } else {
            const backClasses = {
                'go': 'Goroutine Summoner',
                'java': 'Enterprise Fortress Knight',
                'py': 'Data Druid',
                'rb': 'Ruby Warlock',
                'php': 'Server Necromancer',
                'cpp': 'Systems Gladiator',
                'rs': 'Borrow Checker Ranger'
            };
            return backClasses[pLang] || 'Backend Sorcerer';
        }
    };

    // ========================================================================
    // DYNAMIC CONTENT ENGINE - Assigns unique flavor based on stats
    // ========================================================================
    
    const getPassiveAbility = (primaryLang, state) => {
        const lang = (primaryLang || 'js').toLowerCase();
        
        // Language-specific action-focused abilities
        const abilities = {
            'rs': {
                name: 'Borrow Checker',
                desc: 'Compile-time ownership validation. Complete protection against memory corruption.'
            },
            'cpp': {
                name: 'Memory Mastery',
                desc: 'Direct hardware control. Critical hits deal 2x damage and ignore armor.'
            },
            'js': {
                name: 'Async Sorcery',
                desc: 'Execute multiple spells simultaneously. Never wait, never block.'
            },
            'ts': {
                name: 'Type Guardian',
                desc: 'Compile-time shields block all runtime errors. DEF +25%.'
            },
            'py': {
                name: 'Zen Meditation',
                desc: 'Clean code heals wounds. Regenerate 15% HP every turn.'
            },
            'go': {
                name: 'Goroutine Swarm',
                desc: 'Summon 10,000 lightweight minions. Attack speed +30%.'
            },
            'java': {
                name: 'Factory Pattern',
                desc: 'Build impenetrable defense layers. Damage reduction +25%.'
            },
            'rb': {
                name: 'Metaprogramming Magic',
                desc: 'Rewrite reality on the fly. Charisma +20%, dodge chance +15%.'
            },
            'html': {
                name: 'Flexbox Mastery',
                desc: 'Instantly reorganize the battlefield. Perfect positioning every time.'
            },
            'css': {
                name: 'Style Cascade',
                desc: 'Visual dominance. Stuns enemies with aesthetic perfection.'
            },
            'php': {
                name: 'Server Sorcery',
                desc: 'Backend spells never miss. Consistent damage output.'
            },
            'swift': {
                name: 'Protocol Power',
                desc: 'iOS optimization grants bonus mobility. Movement speed +40%.'
            },
            'kotlin': {
                name: 'Null Safety',
                desc: 'NullPointerException immunity. Prevents instant death scenarios.'
            }
        };
        
        return abilities[lang] || {
            name: 'Clean Execution',
            desc: 'Reliable and balanced. No weaknesses, no surprises.'
        };
    };

    const getDynamicBio = (state, forceRecalculate = false) => {
        const { hp, atk, def, lvl, bio } = state;
        
        // If user has custom bio and we are not forcing a fresh recalculation, use it
        if (!forceRecalculate && bio && bio !== 'This mysterious developer lets their code speak for itself.') {
            return bio;
        }
        
        // Empty Profile check
        if (atk === 0 && hp === 0 && def === 0) {
            return 'An observer of the digital realm. Their GitHub profile is a clean slate waiting for their first masterpiece.';
        }
        
        // Famous Developer Easter Egg Bios (Witty, Premium, and Wording-Safe)
        const userLower = (state.username || '').toLowerCase();
        if (userLower === 'torvalds') {
            return 'The legendary architect of Linux and Git. Writes operating system kernels in his sleep and commands raw hardware directly.';
        }
        if (userLower === 'gaearon') {
            return 'Legendary React sorcerer who taught the world how to manage application state. Sculptor of virtual DOMs.';
        }
        if (userLower === 'yyx990803') {
            return 'The Grand Architect of Vue and Vite. Engineered a high-speed frontend ecosystem with absolute technical precision.';
        }
        if (userLower === 'mehalogen') {
            return 'Visionary founder of Halonic. Crafts magical developer experiences and ships complex products at lightning speeds.';
        }
        
        // Dynamic, humor-rich bios based on stats and ratios
        const ratio = atk > 0 ? (hp / atk) : hp;
        
        if (def >= 10000) {
            return 'Developer with massive influence. Their repositories inspire thousands and direct the flow of open-source.';
        }
        if (atk >= 80) {
            return 'A prolific builder who ships projects faster than most people can write a single commit.';
        }
        if (lvl >= 10) {
            return 'Battle-tested veteran. Has weathered framework wars and still writes vanilla JS.';
        }
        if (lvl <= 2) {
            return 'Rising star in the dev world. Fresh perspective, rapid momentum, and infinite potential.';
        }
        if (ratio >= 500) {
            return 'Hyper-focused engineer. Polishes their code to absolute perfection with hundreds of commits per project.';
        }
        if (atk > 20 && ratio < 50) {
            return 'Chaotic builder who spawns repositories like tweets. Code first, questions never.';
        }
        
        return 'Crafting elegant solutions one commit at a time. Steady progress, solid foundations.';
    };

    const getGuildName = (company) => {
        if (!company) return 'Freelance Alliance';
        let clean = company.trim();
        if (clean.startsWith('@')) {
            clean = clean.slice(1);
        }
        return clean.charAt(0).toUpperCase() + clean.slice(1);
    };

    const getDevRarity = (followers, repos, primaryLang = 'js') => {
        const defVal = typeof followers === 'number' ? followers : state.def;
        const atkVal = typeof repos === 'number' ? repos : state.atk;
        const hpVal = state ? state.hp : 5000;
        const lvlVal = state ? state.lvl : 8;
        const secondaryLang = state ? state.secondaryLang : 'ts';
        
        // Mathematically justified composite score for dynamic tiers
        const score = Math.round((hpVal / 10) + (atkVal * 12) + (defVal * 3) + (lvlVal * 25));
        
        let prefix = 'Common';
        if (score >= 12000) prefix = 'Legendary';
        else if (score >= 4000)  prefix = 'Epic';
        else if (score >= 1200)  prefix = 'Rare';
        else if (score >= 300)   prefix = 'Uncommon';
        
        return `${prefix} ${getDeveloperClass(primaryLang, secondaryLang)}`;
    };

    /** Dev score formula for leaderboard ranking */
    const calcScore = (dev) =>
        Math.round((dev.hp / 10) + (dev.atk * 8) + (dev.def * 1.5) + (dev.lvl * 20));

    /* ========================================================================
       VERIFICATION BADGE
       ======================================================================== */
    function updateVerifiedBadge() {
        const checkIcon = document.getElementById('card-verified-check');
        const backVerified = document.getElementById('back-stat-verified');

        if (state.isVerified) {
            if (checkIcon) checkIcon.style.display = 'inline-flex';
            if (backVerified) backVerified.textContent = 'YES ✓';
        } else {
            if (checkIcon) checkIcon.style.display = 'none';
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
        const nameLink = document.getElementById('card-display-name-link');
        if (nameLink) {
            nameLink.href = `https://github.com/${state.username}`;
        }
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
        
        let year = new Date().getFullYear() - state.lvl;
        if (state.createdAt) {
            const parsedYear = new Date(state.createdAt).getFullYear();
            if (!isNaN(parsedYear)) {
                year = parsedYear;
            }
        }
        if (backCreated) backCreated.textContent = `EST. ${year}`;

        // Update front card established year
        const frontEstablished = document.getElementById('card-established-year');
        if (frontEstablished) frontEstablished.textContent = `EST. ${year}`;

        // Attribute Meters - Improved formulas for better scaling
        // INT (Intellect): Based on code activity (repos × contributions)
        const intScore = Math.max(10, Math.min(Math.round((state.atk * 1.2) + (state.lvl * 3)), 100));
        
        // CHA (Charisma): Based on followers with sqrt scaling for better distribution
        // 0-100 followers = 10-30, 1k = 50, 10k = 75, 100k+ = 95-100
        const chaScore = Math.max(10, Math.min(Math.round(Math.sqrt(state.def) * 0.5 + 10), 100));
        
        // AGI (Agility): Based on repo/contribution efficiency
        const ratio = state.atk > 0 ? (state.hp / state.atk) : state.hp;
        const agiScore = Math.max(15, Math.min(Math.round(Math.log10(ratio + 1) * 20 + 20), 100));

        const valInt = document.getElementById('back-val-int');
        const barInt = document.getElementById('back-bar-int');
        if (valInt) valInt.textContent = intScore;
        if (barInt) barInt.style.width = `${intScore}%`;

        const valCha = document.getElementById('back-val-cha');
        const barCha = document.getElementById('back-bar-cha');
        if (valCha) valCha.textContent = chaScore;
        if (barCha) barCha.style.width = `${chaScore}%`;

        const valAgi = document.getElementById('back-val-agi');
        const barAgi = document.getElementById('back-bar-agi');
        if (valAgi) valAgi.textContent = agiScore;
        if (barAgi) barAgi.style.width = `${agiScore}%`;

        // Update Passive Ability Node (with stat-based selection)
        const passive = getPassiveAbility(state.primaryLang, state);
        const passName = document.getElementById('card-passive-name');
        const passDesc = document.getElementById('card-passive-desc');
        if (passName) passName.textContent = passive.name;
        if (passDesc) passDesc.textContent = passive.desc;

        // Update Guild and Quest Status
        const guildTitle = document.getElementById('card-guild-title');
        if (guildTitle) {
            guildTitle.textContent = `Guild: ${getGuildName(state.company)}`;
        }
        const questBadge = document.getElementById('card-quest-badge');
        if (questBadge) {
            questBadge.style.display = state.hireable ? 'inline-block' : 'none';
        }

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
            `[![My DevCard](YOUR_UPLOADED_IMAGE_URL)](${base}/?user=${state.username}&theme=${state.theme})`;
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
            createdAt: state.createdAt,
            company: state.company,
            hireable: state.hireable,
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
            // Update rarity on any core stat change since score is now composite
            state.rarity = getDevRarity(state.def, state.atk, state.primaryLang);
            dom.customTitle.value = state.rarity;
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
        state.primaryLang = e.target.value;
        state.rarity = getDevRarity(state.def, state.atk, state.primaryLang);
        dom.customTitle.value = state.rarity;
        updateCardGraphics();
    });
    dom.secondaryLangSelect.addEventListener('change', (e) => {
        state.secondaryLang = e.target.value;
        // Recalculate rarity since class contains secondary lang stack logic now
        state.rarity = getDevRarity(state.def, state.atk, state.primaryLang);
        dom.customTitle.value = state.rarity;
        updateCardGraphics();
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
                if (status === 404) {
                    const err = new Error(`GitHub user "@${username}" not found.`);
                    err.isNotFound = true;
                    throw err;
                }
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
                    const map = { 
                        javascript: 'js', 
                        typescript: 'ts', 
                        python: 'py', 
                        rust: 'rs', 
                        go: 'go', 
                        'c++': 'cpp', 
                        c: 'c', 
                        'c#': 'cs', 
                        swift: 'swift', 
                        kotlin: 'kotlin', 
                        php: 'php', 
                        html: 'html', 
                        css: 'html', 
                        ruby: 'rb', 
                        java: 'java' 
                    };
                    const matched = sorted.map(l => map[l]).filter(Boolean);
                    if (matched[0]) topLangs[0] = matched[0];
                    if (matched[1]) topLangs[1] = matched[1];
                }
            } catch (_) {}

            const reposCount = userData.public_repos || 0;
            const followersCount = userData.followers || 0;
            const hp = reposCount > 0 
                ? Math.min(25000, (reposCount * 32) + (followersCount * 3) + 200) 
                : 0;
            const lvl = Math.max(1, new Date().getFullYear() - new Date(userData.created_at).getFullYear() + 1);

            state.username     = userData.login;
            state.name         = userData.name || userData.login;
            state.avatarUrl    = userData.avatar_url;
            state.atk          = reposCount;
            state.def          = followersCount;
            state.hp           = hp;
            state.lvl          = Math.min(99, lvl);
            state.primaryLang  = topLangs[0] || 'js';
            state.secondaryLang = topLangs[1] || 'ts';
            state.rarity       = getDevRarity(state.def, state.atk, state.primaryLang);
            
            // Generate dynamic bio based on stats (after all stats are set)
            state.bio          = userData.bio || getDynamicBio(state, true);
            state.isVerified   = true;   // ✅ Fresh from API — verified!
            state.createdAt    = userData.created_at || new Date().toISOString();
            state.company      = userData.company || '';
            state.hireable     = !!userData.hireable;

            syncSlidersWithState();
            updateCardGraphics();
            renderLeaderboard();
            showToast(`✅ Loaded verified stats for @${userData.login}!`);
        } catch (err) {
            console.error(err);
            showToast(err.message, true);
            if (!err.isNotFound) {
                simulateOfflineStats(username);
            }
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
        state.primaryLang  = langs[Math.abs(hash)       % langs.length];
        state.secondaryLang = langs[Math.abs(hash + 1)  % langs.length];
        state.rarity       = getDevRarity(state.def, state.atk, state.primaryLang);
        state.isVerified   = false;  // offline sim is never verified
        state.createdAt    = new Date(new Date().getFullYear() - state.lvl, 0, 1).toISOString();
        state.company      = Math.abs(hash) % 2 === 0 ? 'Indie Devs' : '';
        state.hireable     = Math.abs(hash) % 3 === 0;

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
        
        // Hide promo banner on login
        const promoBanner = document.getElementById('leaderboard-promo-banner');
        if (promoBanner) promoBanner.style.display = 'none';
    }

    function clearAuthUI() {
        state.authUser       = null;
        state.isVerified     = false;
        state.isOnLeaderboard = false;
        dom.btnGithubLogin.style.display = '';
        dom.userProfileChip.classList.remove('visible');
        updateVerifiedBadge();
        renderLeaderboard();

        // Show promo banner if not dismissed
        const promoBanner = document.getElementById('leaderboard-promo-banner');
        if (promoBanner && localStorage.getItem('devcard_promo_dismissed') !== '1') {
            promoBanner.style.display = 'flex';
        }
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

        // Check if the current user is in the top 20
        const loggedInUsername = state.authUser ? state.authUser.login : null;
        const isLoggedInUserInTop20 = loggedInUsername ? ranked.slice(0, 20).some(dev => dev.username === loggedInUsername) : false;
        
        let displayList = ranked.slice(0, 20);
        
        // If user is logged in and verified, but not in top 20
        let pinnedRowHtml = '';
        if (loggedInUsername && !isLoggedInUserInTop20) {
            const userIndex = ranked.findIndex(dev => dev.username === loggedInUsername);
            const userRank = userIndex !== -1 ? userIndex + 1 : '?';
            const userDev = userIndex !== -1 ? ranked[userIndex] : {
                username:   state.authUser.login,
                name:       state.authUser.name || state.authUser.login,
                avatar_url: state.authUser.avatarUrl,
                score:      calcScore(state),
                lvl:        state.lvl,
                verified:   true,
            };

            const avatar = userDev.avatar_url || userDev.avatarUrl || `https://api.dicebear.com/7.x/identicon/svg?seed=${userDev.username}`;
            const name = userDev.name || userDev.username;
            const score = userDev.score.toLocaleString();
            const sub = `@${userDev.username} · LVL ${userDev.lvl || '?'}`;
            const verifiedDot = userDev.verified ? '<span class="lb-verified-dot" title="Verified via GitHub" aria-label="Verified"></span>' : '';
            const isCurrent = userDev.username === state.username ? 'is-current-user' : '';

            pinnedRowHtml = `
                <div class="leaderboard-divider" aria-hidden="true">
                    <span>•••</span>
                </div>
                <div class="leaderboard-row ${isCurrent} is-pinned" role="listitem">
                    <span class="lb-rank" aria-label="Rank ${userRank}">#${userRank}</span>
                    <img class="lb-avatar" src="${avatar}" alt="${name}" loading="lazy" onerror="this.src='https://api.dicebear.com/7.x/identicon/svg?seed=${userDev.username}'">
                    <div class="lb-info">
                        <a href="https://github.com/${userDev.username}" target="_blank" rel="noopener noreferrer" class="lb-profile-link">
                            <div class="lb-name">${name} <em style="font-size:0.7rem;font-weight:400;opacity:0.6">(You)</em></div>
                            <div class="lb-sub">${sub}</div>
                        </a>
                    </div>
                    <div class="lb-score-block">
                        <span class="lb-score">${score}</span>
                        <span class="lb-score-label">DEV SCORE</span>
                    </div>
                    ${verifiedDot}
                </div>
            `;
        }

        // Render the list
        let listHtml = displayList.map((dev, i) => {
            const rank      = i + 1;
            const rankClass = rank <= 3 ? `rank-${rank}` : '';
            const rankEmoji = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `#${rank}`;
            const avatar    = dev.avatar_url || dev.avatarUrl || `https://api.dicebear.com/7.x/identicon/svg?seed=${dev.username}`;
            const name      = dev.name || dev.username;
            const isCurrent = dev.username === state.username ? 'is-current-user' : '';
            const score     = dev.score.toLocaleString();
            const sub       = `@${dev.username} · LVL ${dev.lvl || '?'}`;
            const verifiedDot = dev.verified ? '<span class="lb-verified-dot" title="Verified via GitHub" aria-label="Verified"></span>' : '';
            const isAuthUser = loggedInUsername && dev.username === loggedInUsername;

            return `
                <div class="leaderboard-row ${rankClass} ${isCurrent}" role="listitem">
                    <span class="lb-rank" aria-label="Rank ${rank}">${rankEmoji}</span>
                    <img class="lb-avatar" src="${avatar}" alt="${name}" loading="lazy" onerror="this.src='https://api.dicebear.com/7.x/identicon/svg?seed=${dev.username}'">
                    <div class="lb-info">
                        <a href="https://github.com/${dev.username}" target="_blank" rel="noopener noreferrer" class="lb-profile-link">
                            <div class="lb-name">${name}${isAuthUser ? ' <em style="font-size:0.7rem;font-weight:400;opacity:0.6">(You)</em>' : ''}</div>
                            <div class="lb-sub">${sub}</div>
                        </a>
                    </div>
                    <div class="lb-score-block">
                        <span class="lb-score">${score}</span>
                        <span class="lb-score-label">DEV SCORE</span>
                    </div>
                    ${verifiedDot}
                </div>
            `;
        }).join('');

        container.innerHTML = listHtml + pinnedRowHtml;
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
       PROMO BANNER CONTROLLER
       ======================================================================== */
    const promoBanner = document.getElementById('leaderboard-promo-banner');
    const promoClose = document.getElementById('promo-banner-close');
    const promoSignin = document.getElementById('promo-signin-trigger');

    if (promoBanner) {
        // Initialize promo visibility on startup
        const isDismissed = localStorage.getItem('devcard_promo_dismissed') === '1';
        if (!isDismissed && !state.authUser) {
            promoBanner.style.display = 'flex';
        }

        if (promoClose) {
            promoClose.addEventListener('click', () => {
                promoBanner.style.transform = 'translateY(-10px)';
                promoBanner.style.opacity = '0';
                setTimeout(() => {
                    promoBanner.style.display = 'none';
                }, 300);
                localStorage.setItem('devcard_promo_dismissed', '1');
            });
        }

        if (promoSignin) {
            promoSignin.addEventListener('click', () => {
                signInWithGitHub();
            });
        }
    }

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
