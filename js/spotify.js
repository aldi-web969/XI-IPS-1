/* =========================================================
   XI IPS 1 - SPOTIFY UI V2
   Spotify Web API + Authorization Code with PKCE
   ========================================================= */

(() => {
    "use strict";

    /* =====================================================
       CONFIG
       ===================================================== */

    const CONFIG = window.SPOTIFY_CONFIG || {};

    const CLIENT_ID = CONFIG.clientId;

    const REDIRECT_URI =
        CONFIG.redirectUri ||
        window.location.origin + window.location.pathname;

    const SCOPES =
        Array.isArray(CONFIG.scopes) && CONFIG.scopes.length
            ? CONFIG.scopes
            : [
                "user-read-private",
                "user-read-email"
            ];

    const API_BASE = "https://api.spotify.com/v1";
    const AUTH_URL = "https://accounts.spotify.com/authorize";
    const TOKEN_URL = "https://accounts.spotify.com/api/token";

    const STORAGE = {
        ACCESS_TOKEN: "xi_ips_spotify_access_token",
        EXPIRES_AT: "xi_ips_spotify_expires_at",
        REFRESH_TOKEN: "xi_ips_spotify_refresh_token",
        CODE_VERIFIER: "xi_ips_spotify_code_verifier",
        STATE: "xi_ips_spotify_state"
    };

    let accessToken =
        localStorage.getItem(STORAGE.ACCESS_TOKEN);

    let currentUser = null;
    let currentTracks = [];
    let currentTrack = null;

    /* =====================================================
       BASIC CHECK
       ===================================================== */

    if (!CLIENT_ID) {
        console.error(
            "Spotify Client ID belum ditemukan. Periksa spotify-config.js"
        );
        return;
    }

    /* =====================================================
       UTILITIES
       ===================================================== */

    function randomString(length = 64) {
        const characters =
            "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

        const values =
            crypto.getRandomValues(
                new Uint8Array(length)
            );

        return Array.from(values)
            .map(value =>
                characters[
                    value % characters.length
                ]
            )
            .join("");
    }

    async function sha256(value) {
        const data =
            new TextEncoder().encode(value);

        return crypto.subtle.digest(
            "SHA-256",
            data
        );
    }

    function base64UrlEncode(buffer) {
        return btoa(
            String.fromCharCode(
                ...new Uint8Array(buffer)
            )
        )
            .replace(/\+/g, "-")
            .replace(/\//g, "_")
            .replace(/=+$/, "");
    }

    function escapeHTML(value) {
        return String(value || "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    function formatDuration(ms) {
        const totalSeconds =
            Math.floor(ms / 1000);

        const minutes =
            Math.floor(totalSeconds / 60);

        const seconds =
            totalSeconds % 60;

        return `${minutes}:${String(
            seconds
        ).padStart(2, "0")}`;
    }

    function showToast(message) {
        let toast =
            document.querySelector(
                "#spotifyToast"
            );

        if (!toast) {
            toast =
                document.createElement("div");

            toast.id =
                "spotifyToast";

            Object.assign(
                toast.style,
                {
                    position: "fixed",
                    left: "50%",
                    bottom: "28px",
                    transform:
                        "translateX(-50%) translateY(20px)",
                    padding: "12px 18px",
                    borderRadius: "14px",
                    background:
                        "rgba(8,12,10,.94)",
                    border:
                        "1px solid rgba(140,255,152,.28)",
                    color: "#fff",
                    fontSize: "14px",
                    zIndex: "999999",
                    opacity: "0",
                    transition:
                        "all .25s ease",
                    backdropFilter:
                        "blur(18px)",
                    boxShadow:
                        "0 15px 50px rgba(0,0,0,.4)"
                }
            );

            document.body.appendChild(toast);
        }

        toast.textContent =
            message;

        requestAnimationFrame(() => {
            toast.style.opacity = "1";

            toast.style.transform =
                "translateX(-50%) translateY(0)";
        });

        clearTimeout(toast._timer);

        toast._timer =
            setTimeout(() => {
                toast.style.opacity = "0";

                toast.style.transform =
                    "translateX(-50%) translateY(20px)";
            }, 2600);
    }

    /* =====================================================
       SPOTIFY LOGIN
       ===================================================== */

    async function loginSpotify() {
        try {
            const verifier =
                randomString(64);

            const hashed =
                await sha256(verifier);

            const challenge =
                base64UrlEncode(hashed);

            const state =
                randomString(32);

            localStorage.setItem(
                STORAGE.CODE_VERIFIER,
                verifier
            );

            localStorage.setItem(
                STORAGE.STATE,
                state
            );

            const params =
                new URLSearchParams({
                    client_id: CLIENT_ID,
                    response_type: "code",
                    redirect_uri: REDIRECT_URI,
                    scope: SCOPES.join(" "),
                    state: state,
                    code_challenge_method: "S256",
                    code_challenge: challenge
                });

            window.location.href =
                `${AUTH_URL}?${params.toString()}`;

        } catch (error) {
            console.error(error);

            showToast(
                "Gagal memulai login Spotify."
            );
        }
    }

    /* =====================================================
       TOKEN
       ===================================================== */

    async function exchangeCodeForToken(code) {
        const verifier =
            localStorage.getItem(
                STORAGE.CODE_VERIFIER
            );

        if (!verifier) {
            throw new Error(
                "PKCE verifier tidak ditemukan."
            );
        }

        const response =
            await fetch(
                TOKEN_URL,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/x-www-form-urlencoded"
                    },

                    body:
                        new URLSearchParams({
                            client_id:
                                CLIENT_ID,

                            grant_type:
                                "authorization_code",

                            code:
                                code,

                            redirect_uri:
                                REDIRECT_URI,

                            code_verifier:
                                verifier
                        })
                }
            );

        const data =
            await response.json();

        if (!response.ok) {
            throw new Error(
                data.error_description ||
                "Gagal mendapatkan Spotify token."
            );
        }

        accessToken =
            data.access_token;

        localStorage.setItem(
            STORAGE.ACCESS_TOKEN,
            data.access_token
        );

        localStorage.setItem(
            STORAGE.EXPIRES_AT,
            String(
                Date.now() +
                data.expires_in * 1000
            )
        );

        if (data.refresh_token) {
            localStorage.setItem(
                STORAGE.REFRESH_TOKEN,
                data.refresh_token
            );
        }

        localStorage.removeItem(
            STORAGE.CODE_VERIFIER
        );

        return data;
    }

    async function refreshAccessToken() {
        const refreshToken =
            localStorage.getItem(
                STORAGE.REFRESH_TOKEN
            );

        if (!refreshToken) {
            return false;
        }

        try {
            const response =
                await fetch(
                    TOKEN_URL,
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/x-www-form-urlencoded"
                        },

                        body:
                            new URLSearchParams({
                                client_id:
                                    CLIENT_ID,

                                grant_type:
                                    "refresh_token",

                                refresh_token:
                                    refreshToken
                            })
                    }
                );

            const data =
                await response.json();

            if (!response.ok) {
                throw new Error(
                    data.error_description ||
                    "Refresh token gagal."
                );
            }

            accessToken =
                data.access_token;

            localStorage.setItem(
                STORAGE.ACCESS_TOKEN,
                data.access_token
            );

            localStorage.setItem(
                STORAGE.EXPIRES_AT,
                String(
                    Date.now() +
                    data.expires_in * 1000
                )
            );

            if (data.refresh_token) {
                localStorage.setItem(
                    STORAGE.REFRESH_TOKEN,
                    data.refresh_token
                );
            }

            return true;

        } catch (error) {
            console.error(error);

            logoutSpotify(false);

            return false;
        }
    }

    /* =====================================================
       API
       ===================================================== */

    async function spotifyFetch(
        endpoint,
        options = {},
        retry = true
    ) {
        if (!accessToken) {
            throw new Error(
                "Belum login Spotify."
            );
        }

        const response =
            await fetch(
                `${API_BASE}${endpoint}`,
                {
                    ...options,

                    headers: {
                        ...(options.headers || {}),

                        Authorization:
                            `Bearer ${accessToken}`
                    }
                }
            );

        if (
            response.status === 401 &&
            retry
        ) {
            const refreshed =
                await refreshAccessToken();

            if (refreshed) {
                return spotifyFetch(
                    endpoint,
                    options,
                    false
                );
            }
        }

        if (!response.ok) {
            let errorData = {};

            try {
                errorData =
                    await response.json();
            } catch (_) {}

            throw new Error(
                errorData?.error?.message ||
                `Spotify API error ${response.status}`
            );
        }

        if (response.status === 204) {
            return null;
        }

        return response.json();
    }

    async function getProfile() {
        return spotifyFetch("/me");
    }

    async function searchTracks(query) {
        const params =
            new URLSearchParams({
                q: query,
                type: "track",
                limit: "20"
            });

        return spotifyFetch(
            `/search?${params.toString()}`
        );
    }

    /* =====================================================
       LOGOUT
       ===================================================== */

    function logoutSpotify(
        showMessage = true
    ) {
        accessToken = null;
        currentUser = null;

        localStorage.removeItem(
            STORAGE.ACCESS_TOKEN
        );

        localStorage.removeItem(
            STORAGE.EXPIRES_AT
        );

        localStorage.removeItem(
            STORAGE.REFRESH_TOKEN
        );

        localStorage.removeItem(
            STORAGE.CODE_VERIFIER
        );

        localStorage.removeItem(
            STORAGE.STATE
        );

        updateAuthUI();

        if (showMessage) {
            showToast(
                "Berhasil logout dari Spotify."
            );
        }
    }

    /* =====================================================
       CALLBACK
       ===================================================== */

    async function handleCallback() {
        const params =
            new URLSearchParams(
                window.location.search
            );

        const code =
            params.get("code");

        const returnedState =
            params.get("state");

        const error =
            params.get("error");

        if (error) {
            window.history.replaceState(
                {},
                document.title,
                window.location.pathname
            );

            showToast(
                "Login Spotify dibatalkan."
            );

            return;
        }

        if (!code) {
            return;
        }

        const savedState =
            localStorage.getItem(
                STORAGE.STATE
            );

        if (
            !savedState ||
            returnedState !== savedState
        ) {
            showToast(
                "Login gagal: state tidak cocok."
            );

            return;
        }

        try {
            await exchangeCodeForToken(
                code
            );

            localStorage.removeItem(
                STORAGE.STATE
            );

            window.history.replaceState(
                {},
                document.title,
                window.location.pathname
            );

            showToast(
                "Berhasil terhubung ke Spotify!"
            );

            await loadProfile();

        } catch (error) {
            console.error(error);

            showToast(
                "Gagal menghubungkan Spotify."
            );
        }
    }

    /* =====================================================
       PROFILE
       ===================================================== */

    async function loadProfile() {
        if (!accessToken) {
            updateAuthUI();
            return;
        }

        try {
            currentUser =
                await getProfile();

            updateAuthUI();

        } catch (error) {
            console.error(error);

            logoutSpotify(false);

            showToast(
                "Sesi Spotify sudah berakhir."
            );
        }
    }

    /* =====================================================
       CREATE SPOTIFY UI
       ===================================================== */

    function createSpotifyUI() {

        if (
            document.querySelector(
                "#spotifyConnect"
            )
        ) {
            return;
        }

        const style =
            document.createElement("style");

        style.textContent = `

        /* ===============================
           SPOTIFY APP
           =============================== */

        .spotify-app {
            width:min(1200px, calc(100% - 30px));
            min-height:620px;
            margin:40px auto;
            display:grid;
            grid-template-columns:220px 1fr;
            overflow:hidden;
            border-radius:28px;
            background:
                linear-gradient(
                    145deg,
                    rgba(20,24,22,.96),
                    rgba(7,10,9,.98)
                );
            border:1px solid rgba(255,255,255,.09);
            box-shadow:
                0 30px 100px rgba(0,0,0,.45);
            backdrop-filter:blur(25px);
            -webkit-backdrop-filter:blur(25px);
            color:#fff;
        }

        /* SIDEBAR */

        .spotify-sidebar {
            padding:24px 16px;
            background:
                rgba(255,255,255,.025);
            border-right:
                1px solid rgba(255,255,255,.07);
        }

        .spotify-brand {
            display:flex;
            align-items:center;
            gap:10px;
            padding:8px 10px 28px;
            font-size:20px;
            font-weight:900;
        }

        .spotify-brand-icon {
            width:38px;
            height:38px;
            display:grid;
            place-items:center;
            border-radius:50%;
            background:#1ed760;
            color:#071009;
            font-size:20px;
            box-shadow:
                0 0 25px rgba(30,215,96,.25);
        }

        .spotify-nav-title {
            padding:10px;
            color:#68716c;
            font-size:10px;
            font-weight:800;
            letter-spacing:1.5px;
            text-transform:uppercase;
        }

        .spotify-nav {
            display:flex;
            flex-direction:column;
            gap:5px;
        }

        .spotify-nav button {
            width:100%;
            display:flex;
            align-items:center;
            gap:12px;
            padding:12px;
            border:0;
            border-radius:13px;
            background:transparent;
            color:#9ba39e;
            text-align:left;
            font:inherit;
            font-size:13px;
            font-weight:700;
            cursor:pointer;
            transition:
                .2s ease;
        }

        .spotify-nav button:hover,
        .spotify-nav button.active {
            background:
                rgba(140,255,152,.09);
            color:#8cff98;
        }

        .spotify-nav-icon {
            width:21px;
            text-align:center;
            font-size:16px;
        }

        .spotify-sidebar-bottom {
            margin-top:35px;
            padding:14px;
            border-radius:16px;
            background:
                rgba(140,255,152,.045);
            border:
                1px solid rgba(140,255,152,.08);
        }

        .spotify-sidebar-bottom small {
            display:block;
            color:#68716c;
            margin-bottom:7px;
        }

        .spotify-sidebar-bottom strong {
            color:#8cff98;
            font-size:13px;
        }

        /* MAIN */

        .spotify-main {
            min-width:0;
            padding:25px;
            padding-bottom:110px;
            overflow:hidden;
        }

        .spotify-topbar {
            display:flex;
            align-items:center;
            justify-content:space-between;
            gap:15px;
            margin-bottom:25px;
        }

        .spotify-search-box {
            flex:1;
            max-width:620px;
            position:relative;
        }

        .spotify-search-box input {
            width:100%;
            box-sizing:border-box;
            padding:14px 18px 14px 45px;
            border:1px solid rgba(255,255,255,.08);
            border-radius:15px;
            outline:none;
            background:
                rgba(255,255,255,.055);
            color:#fff;
            font:inherit;
        }

        .spotify-search-box input:focus {
            border-color:
                rgba(140,255,152,.4);
            box-shadow:
                0 0 0 4px
                rgba(140,255,152,.05);
        }

        .spotify-search-icon {
            position:absolute;
            left:16px;
            top:50%;
            transform:translateY(-50%);
            color:#8a948e;
        }

        .spotify-user {
            display:flex;
            align-items:center;
            gap:9px;
            padding:7px 11px;
            border-radius:14px;
            background:
                rgba(255,255,255,.05);
            border:1px solid rgba(255,255,255,.07);
        }

        .spotify-user-avatar {
            width:34px;
            height:34px;
            border-radius:50%;
            object-fit:cover;
            background:#1ed760;
        }

        .spotify-user-name {
            max-width:130px;
            overflow:hidden;
            white-space:nowrap;
            text-overflow:ellipsis;
            font-size:12px;
            font-weight:700;
        }

        /* HERO */

        .spotify-hero {
            position:relative;
            overflow:hidden;
            padding:30px;
            margin-bottom:25px;
            border-radius:22px;
            background:
                radial-gradient(
                    circle at 80% 20%,
                    rgba(30,215,96,.17),
                    transparent 35%
                ),
                linear-gradient(
                    120deg,
                    rgba(140,255,152,.07),
                    rgba(255,255,255,.025)
                );
            border:
                1px solid rgba(255,255,255,.08);
        }

        .spotify-hero h1 {
            margin:0 0 8px;
            font-size:clamp(25px,4vw,40px);
            line-height:1.1;
        }

        .spotify-hero h1 span {
            color:#8cff98;
        }

        .spotify-hero p {
            margin:0;
            color:#8e9791;
            font-size:14px;
        }

        .spotify-hero-glow {
            position:absolute;
            width:180px;
            height:180px;
            right:-70px;
            bottom:-90px;
            border-radius:50%;
            background:#1ed760;
            filter:blur(70px);
            opacity:.14;
        }

        /* SECTION */

        .spotify-section-title {
            display:flex;
            align-items:center;
            justify-content:space-between;
            margin-bottom:15px;
        }

        .spotify-section-title h2 {
            margin:0;
            font-size:19px;
        }

        .spotify-section-title span {
            color:#68716c;
            font-size:12px;
        }

        /* RESULTS */

        .spotify-results {
            display:grid;
            grid-template-columns:
                repeat(
                    auto-fill,
                    minmax(260px,1fr)
                );
            gap:12px;
        }

        .spotify-track {
            display:flex;
            align-items:center;
            gap:13px;
            min-width:0;
            padding:11px;
            border-radius:18px;
            background:
                rgba(255,255,255,.035);
            border:
                1px solid rgba(255,255,255,.065);
            transition:
                transform .2s ease,
                background .2s ease,
                border-color .2s ease;
        }

        .spotify-track:hover {
            transform:translateY(-3px);
            background:
                rgba(255,255,255,.07);
            border-color:
                rgba(140,255,152,.2);
        }

        .spotify-cover {
            width:65px;
            height:65px;
            flex:none;
            border-radius:12px;
            object-fit:cover;
            background:#111;
        }

        .spotify-track-info {
            min-width:0;
            flex:1;
        }

        .spotify-track-title {
            color:#fff;
            font-size:13px;
            font-weight:800;
            white-space:nowrap;
            overflow:hidden;
            text-overflow:ellipsis;
        }

        .spotify-track-artist {
            margin-top:4px;
            color:#929b95;
            font-size:12px;
            white-space:nowrap;
            overflow:hidden;
            text-overflow:ellipsis;
        }

        .spotify-track-meta {
            margin-top:6px;
            color:#626c66;
            font-size:10px;
        }

        .spotify-track-actions {
            display:flex;
            flex-direction:column;
            gap:5px;
        }

        .spotify-play-btn,
        .spotify-open-btn {
            width:34px;
            height:34px;
            display:grid;
            place-items:center;
            border:0;
            border-radius:50%;
            cursor:pointer;
            transition:.2s ease;
        }

        .spotify-play-btn {
            background:#8cff98;
            color:#071009;
            font-weight:900;
        }

        .spotify-open-btn {
            background:
                rgba(255,255,255,.07);
            color:#fff;
            text-decoration:none;
        }

        .spotify-play-btn:hover,
        .spotify-open-btn:hover {
            transform:scale(1.08);
        }

        /* EMPTY */

        .spotify-empty {
            grid-column:1/-1;
            padding:55px 20px;
            text-align:center;
            color:#77817b;
            border:
                1px dashed rgba(255,255,255,.1);
            border-radius:18px;
        }

        .spotify-empty-icon {
            font-size:35px;
            margin-bottom:10px;
            opacity:.7;
        }

        /* LOGIN */

        .spotify-login-button {
            padding:11px 17px;
            border:0;
            border-radius:13px;
            background:#1ed760;
            color:#061008;
            font-weight:900;
            cursor:pointer;
            transition:.2s ease;
        }

        .spotify-login-button:hover {
            transform:translateY(-2px);
            box-shadow:
                0 10px 30px
                rgba(30,215,96,.18);
        }

        .spotify-logout-button {
            padding:8px 12px;
            border:1px solid rgba(255,255,255,.1);
            border-radius:11px;
            background:rgba(255,255,255,.05);
            color:#fff;
            cursor:pointer;
            font-size:11px;
        }

        /* BOTTOM PLAYER */

        .spotify-player {
            position:fixed;
            left:50%;
            bottom:16px;
            transform:translateX(-50%);
            width:min(900px, calc(100% - 30px));
            min-height:64px;
            z-index:9000;
            display:flex;
            align-items:center;
            gap:15px;
            padding:10px 15px;
            box-sizing:border-box;
            border-radius:19px;
            background:
                rgba(12,16,14,.9);
            border:
                1px solid rgba(140,255,152,.13);
            box-shadow:
                0 20px 60px rgba(0,0,0,.4);
            backdrop-filter:blur(22px);
            -webkit-backdrop-filter:blur(22px);
        }

        .spotify-player-cover {
            width:45px;
            height:45px;
            border-radius:9px;
            object-fit:cover;
            background:#151915;
        }

        .spotify-player-info {
            min-width:0;
            flex:1;
        }

        .spotify-player-title {
            font-size:12px;
            font-weight:800;
            white-space:nowrap;
            overflow:hidden;
            text-overflow:ellipsis;
        }

        .spotify-player-artist {
            margin-top:3px;
            color:#77817b;
            font-size:10px;
            white-space:nowrap;
            overflow:hidden;
            text-overflow:ellipsis;
        }

        .spotify-player-button {
            width:38px;
            height:38px;
            border:0;
            border-radius:50%;
            background:#8cff98;
            color:#071009;
            cursor:pointer;
            font-weight:900;
        }

        .spotify-player-open {
            padding:8px 11px;
            border-radius:10px;
            background:rgba(255,255,255,.06);
            color:#fff;
            text-decoration:none;
            font-size:10px;
            font-weight:800;
        }

        /* MOBILE */

        @media(max-width:800px) {

            .spotify-app {
                grid-template-columns:1fr;
                width:calc(100% - 18px);
            }

            .spotify-sidebar {
                border-right:0;
                border-bottom:
                    1px solid rgba(255,255,255,.07);
                padding:13px;
            }

            .spotify-brand {
                padding:5px 7px 13px;
            }

            .spotify-nav {
                display:grid;
                grid-template-columns:
                    repeat(3,1fr);
            }

            .spotify-nav-title,
            .spotify-sidebar-bottom {
                display:none;
            }

            .spotify-nav button {
                justify-content:center;
                flex-direction:column;
                gap:4px;
                padding:8px;
                font-size:10px;
                text-align:center;
            }

            .spotify-nav-icon {
                font-size:16px;
            }

            .spotify-main {
                padding:15px;
            }

            .spotify-topbar {
                align-items:stretch;
                flex-direction:column;
            }

            .spotify-search-box {
                max-width:none;
            }

            .spotify-results {
                grid-template-columns:1fr;
            }

            .spotify-hero {
                padding:23px;
            }

            .spotify-user {
                width:max-content;
            }

            .spotify-player {
                bottom:8px;
            }
        }

        `;

        document.head.appendChild(style);

        const wrapper =
            document.createElement("section");

        wrapper.id =
            "spotifyConnect";

        wrapper.innerHTML = `

        <div class="spotify-app">

            <!-- SIDEBAR -->

            <aside class="spotify-sidebar">

                <div class="spotify-brand">
                    <div class="spotify-brand-icon">
                        ♪
                    </div>

                    <span>Spotify</span>
                </div>

                <div class="spotify-nav-title">
                    Menu
                </div>

                <nav class="spotify-nav">

                    <button
                        class="active"
                        data-spotify-nav="home"
                    >
                        <span class="spotify-nav-icon">
                            ⌂
                        </span>
                        Home
                    </button>

                    <button
                        data-spotify-nav="search"
                    >
                        <span class="spotify-nav-icon">
                            ⌕
                        </span>
                        Search
                    </button>

                    <button
                        data-spotify-nav="playlist"
                    >
                        <span class="spotify-nav-icon">
                            ☷
                        </span>
                        Playlist
                    </button>

                    <button
                        data-spotify-nav="liked"
                    >
                        <span class="spotify-nav-icon">
                            ♡
                        </span>
                        Liked Songs
                    </button>

                    <button
                        data-spotify-nav="history"
                    >
                        <span class="spotify-nav-icon">
                            ◷
                        </span>
                        History
                    </button>

                    <button
                        data-spotify-nav="profile"
                    >
                        <span class="spotify-nav-icon">
                            ◉
                        </span>
                        Profile
                    </button>

                </nav>

                <div class="spotify-sidebar-bottom">

                    <small>
                        XI IPS 1
                    </small>

                    <strong>
                        Music Space
                    </strong>

                </div>

            </aside>


            <!-- MAIN -->

            <main class="spotify-main">

                <div class="spotify-topbar">

                    <div class="spotify-search-box">

                        <span
                            class="spotify-search-icon"
                        >
                            🔎
                        </span>

                        <input
                            id="spotifySearchInput"
                            type="search"
                            placeholder="Cari lagu, artis, atau album..."
                            autocomplete="off"
                        >

                    </div>

                    <div
                        class="spotify-user"
                        id="spotifyUser"
                    >
                        <button
                            class="spotify-login-button"
                            id="spotifyLoginBtn"
                        >
                            Login Spotify
                        </button>
                    </div>

                </div>


                <!-- HERO -->

                <section class="spotify-hero">

                    <div class="spotify-hero-glow"></div>

                    <h1>
                        Music for
                        <span>XI IPS 1</span>
                    </h1>

                    <p>
                        Cari musik favoritmu dari katalog Spotify.
                    </p>

                </section>


                <!-- RESULTS -->

                <div class="spotify-section-title">

                    <h2 id="spotifyResultTitle">
                        Temukan Musik
                    </h2>

                    <span id="spotifyResultCount">
                        Spotify
                    </span>

                </div>

                <div
                    class="spotify-results"
                    id="spotifyResults"
                >

                    <div class="spotify-empty">

                        <div class="spotify-empty-icon">
                            ♪
                        </div>

                        Login Spotify lalu
                        cari lagu favoritmu.

                    </div>

                </div>

            </main>

        </div>


        <!-- BOTTOM PLAYER -->

        <div
            class="spotify-player"
            id="spotifyPlayer"
        >

            <div
                class="spotify-player-cover"
                id="spotifyPlayerCover"
            ></div>

            <div class="spotify-player-info">

                <div
                    class="spotify-player-title"
                    id="spotifyPlayerTitle"
                >
                    Belum ada lagu dipilih
                </div>

                <div
                    class="spotify-player-artist"
                    id="spotifyPlayerArtist"
                >
                    Pilih lagu dari hasil pencarian
                </div>

            </div>

            <button
                class="spotify-player-button"
                id="spotifyPlayerButton"
                title="Buka Spotify"
            >
                ▶
            </button>

            <a
                class="spotify-player-open"
                id="spotifyPlayerOpen"
                href="#"
                target="_blank"
                rel="noopener noreferrer"
                style="display:none"
            >
                Spotify
            </a>

        </div>

        `;

        const main =
            document.querySelector("main");

        const musicSection =
            document.querySelector(
                "#music, .music-section, [data-section='music']"
            );

        if (musicSection) {

            musicSection.insertAdjacentElement(
                "afterend",
                wrapper
            );

        } else if (main) {

            main.appendChild(wrapper);

        } else {

            document.body.appendChild(wrapper);

        }

        bindSpotifyEvents();
    }

    /* =====================================================
       EVENTS
       ===================================================== */

    function bindSpotifyEvents() {

        const loginButton =
            document.querySelector(
                "#spotifyLoginBtn"
            );

        if (loginButton) {
            loginButton.addEventListener(
                "click",
                loginSpotify
            );
        }

        const input =
            document.querySelector(
                "#spotifySearchInput"
            );

        if (input) {

            input.addEventListener(
                "keydown",
                event => {

                    if (
                        event.key === "Enter"
                    ) {
                        performSearch();
                    }

                }
            );

        }

        document
            .querySelectorAll(
                "[data-spotify-nav]"
            )
            .forEach(button => {

                button.addEventListener(
                    "click",
                    () => {

                        document
                            .querySelectorAll(
                                "[data-spotify-nav]"
                            )
                            .forEach(item =>
                                item.classList.remove(
                                    "active"
                                )
                            );

                        button.classList.add(
                            "active"
                        );

                        const section =
                            button.dataset
                                .spotifyNav;

                        handleNavigation(
                            section
                        );
                    }
                );

            });
    }

    /* =====================================================
       NAVIGATION
       ===================================================== */

    function handleNavigation(section) {

        const input =
            document.querySelector(
                "#spotifySearchInput"
            );

        const title =
            document.querySelector(
                "#spotifyResultTitle"
            );

        if (section === "home") {

            title.textContent =
                "Temukan Musik";

            if (input) {
                input.focus();
            }

        }

        else if (section === "search") {

            title.textContent =
                "Cari Musik";

            if (input) {
                input.focus();
            }

        }

        else if (section === "playlist") {

            title.textContent =
                "Playlist";

            showToast(
                "Playlist akan tersedia setelah fitur playlist ditambahkan."
            );

        }

        else if (section === "liked") {

            title.textContent =
                "Liked Songs";

            showToast(
                "Liked Songs memerlukan fitur penyimpanan lagu."
            );

        }

        else if (section === "history") {

            title.textContent =
                "History";

            showToast(
                "History akan muncul setelah kamu mencari lagu."
            );

        }

        else if (section === "profile") {

            title.textContent =
                "Profile";

            if (currentUser) {

                showToast(
                    `Login sebagai ${
                        currentUser.display_name ||
                        currentUser.id
                    }`
                );

            } else {

                showToast(
                    "Login Spotify terlebih dahulu."
                );

            }

        }

    }

    /* =====================================================
       AUTH UI
       ===================================================== */

    function updateAuthUI() {

        const userBox =
            document.querySelector(
                "#spotifyUser"
            );

        if (!userBox) {
            return;
        }

        if (currentUser) {

            const image =
                currentUser
                    .images?.[0]?.url;

            userBox.innerHTML = `

                ${
                    image
                        ? `
                            <img
                                class="spotify-user-avatar"
                                src="${escapeHTML(image)}"
                                alt=""
                            >
                          `
                        : `
                            <div
                                class="spotify-user-avatar"
                                style="
                                    display:grid;
                                    place-items:center;
                                    color:#071009;
                                    font-weight:900;
                                "
                            >
                                ♪
                            </div>
                          `
                }

                <span
                    class="spotify-user-name"
                >
                    ${escapeHTML(
                        currentUser.display_name ||
                        currentUser.id ||
                        "Spotify User"
                    )}
                </span>

                <button
                    class="spotify-logout-button"
                    id="spotifyLogoutBtn"
                >
                    Keluar
                </button>

            `;

            document
                .querySelector(
                    "#spotifyLogoutBtn"
                )
                ?.addEventListener(
                    "click",
                    () => logoutSpotify(true)
                );

        } else {

            userBox.innerHTML = `

                <button
                    class="spotify-login-button"
                    id="spotifyLoginBtn"
                >
                    Login Spotify
                </button>

            `;

            document
                .querySelector(
                    "#spotifyLoginBtn"
                )
                ?.addEventListener(
                    "click",
                    loginSpotify
                );
        }
    }

    /* =====================================================
       SEARCH
       ===================================================== */

    async function performSearch() {

        const input =
            document.querySelector(
                "#spotifySearchInput"
            );

        const results =
            document.querySelector(
                "#spotifyResults"
            );

        const title =
            document.querySelector(
                "#spotifyResultTitle"
            );

        const count =
            document.querySelector(
                "#spotifyResultCount"
            );

        if (!input || !results) {
            return;
        }

        const query =
            input.value.trim();

        if (!query) {

            showToast(
                "Masukkan nama lagu atau artis."
            );

            return;
        }

        if (!accessToken) {

            showToast(
                "Login Spotify terlebih dahulu."
            );

            return;
        }

        results.innerHTML = `

            <div class="spotify-empty">

                <div class="spotify-empty-icon">
                    ⏳
                </div>

                Mencari
                "${escapeHTML(query)}"...

            </div>

        `;

        if (title) {
            title.textContent =
                `Hasil: ${query}`;
        }

        try {

            const data =
                await searchTracks(query);

            const tracks =
                data?.tracks?.items || [];

            currentTracks =
                tracks;

            if (count) {
                count.textContent =
                    `${tracks.length} hasil`;
            }

            renderTracks(tracks);

        } catch (error) {

            console.error(error);

            results.innerHTML = `

                <div class="spotify-empty">

                    <div class="spotify-empty-icon">
                        ⚠
                    </div>

                    Pencarian gagal.

                    <br><br>

                    ${escapeHTML(
                        error.message
                    )}

                </div>

            `;

            showToast(
                "Pencarian Spotify gagal."
            );
        }
    }

    /* =====================================================
       RENDER TRACKS
       ===================================================== */

    function renderTracks(tracks) {

        const results =
            document.querySelector(
                "#spotifyResults"
            );

        if (!results) {
            return;
        }

        if (!tracks.length) {

            results.innerHTML = `

                <div class="spotify-empty">

                    <div class="spotify-empty-icon">
                        ♪
                    </div>

                    Tidak ada lagu ditemukan.

                </div>

            `;

            return;
        }

        results.innerHTML =
            tracks.map(
                (track, index) => {

                    const cover =
                        track.album
                            ?.images?.[1]
                            ?.url ||
                        track.album
                            ?.images?.[0]
                            ?.url ||
                        "";

                    const artists =
                        (
                            track.artists || []
                        )
                            .map(
                                artist =>
                                    artist.name
                            )
                            .join(", ");

                    const spotifyURL =
                        track
                            .external_urls
                            ?.spotify ||
                        "#";

                    return `

                    <article
                        class="spotify-track"
                    >

                        ${
                            cover
                                ? `
                                    <img
                                        class="spotify-cover"
                                        src="${escapeHTML(cover)}"
                                        alt="${escapeHTML(track.name)}"
                                        loading="lazy"
                                    >
                                  `
                                : `
                                    <div
                                        class="spotify-cover"
                                        style="
                                            display:grid;
                                            place-items:center;
                                            color:#8cff98;
                                            font-size:24px;
                                        "
                                    >
                                        ♪
                                    </div>
                                  `
                        }

                        <div
                            class="spotify-track-info"
                        >

                            <div
                                class="spotify-track-title"
                                title="${escapeHTML(track.name)}"
                            >
                                ${escapeHTML(
                                    track.name
                                )}
                            </div>

                            <div
                                class="spotify-track-artist"
                            >
                                ${escapeHTML(
                                    artists
                                )}
                            </div>

                            <div
                                class="spotify-track-meta"
                            >
                                ${escapeHTML(
                                    track.album?.name ||
                                    "Spotify"
                                )}
                                •
                                ${formatDuration(
                                    track.duration_ms ||
                                    0
                                )}
                            </div>

                        </div>

                        <div
                            class="spotify-track-actions"
                        >

                            <button
                                class="spotify-play-btn"
                                title="Pilih lagu"
                                data-track-index="${index}"
                            >
                                ▶
                            </button>

                            <a
                                class="spotify-open-btn"
                                href="${escapeHTML(
                                    spotifyURL
                                )}"
                                target="_blank"
                                rel="noopener noreferrer"
                                title="Buka Spotify"
                            >
                                ↗
                            </a>

                        </div>

                    </article>

                    `;
                }
            ).join("");

        document
            .querySelectorAll(
                ".spotify-play-btn"
            )
            .forEach(button => {

                button.addEventListener(
                    "click",
                    () => {

                        const index =
                            Number(
                                button.dataset
                                    .trackIndex
                            );

                        selectTrack(
                            tracks[index]
                        );

                    }
                );

            });
    }

    /* =====================================================
       SELECT TRACK
       ===================================================== */

    function selectTrack(track) {

        if (!track) {
            return;
        }

        currentTrack =
            track;

        const cover =
            track.album
                ?.images?.[1]
                ?.url ||
            track.album
                ?.images?.[0]
                ?.url ||
            "";

        const artists =
            (
                track.artists || []
            )
                .map(
                    artist =>
                        artist.name
                )
                .join(", ");

        const title =
            document.querySelector(
                "#spotifyPlayerTitle"
            );

        const artist =
            document.querySelector(
                "#spotifyPlayerArtist"
            );

        const coverElement =
            document.querySelector(
                "#spotifyPlayerCover"
            );

        const open =
            document.querySelector(
                "#spotifyPlayerOpen"
            );

        if (title) {
            title.textContent =
                track.name;
        }

        if (artist) {
            artist.textContent =
                artists;
        }

        if (coverElement) {

            if (cover) {

                coverElement.style.backgroundImage =
                    `url("${cover}")`;

                coverElement.style.backgroundSize =
                    "cover";

                coverElement.style.backgroundPosition =
                    "center";

            } else {

                coverElement.style.backgroundImage =
                    "none";

                coverElement.textContent =
                    "♪";
            }
        }

        if (open) {

            open.href =
                track.external_urls
                    ?.spotify ||
                "#";

            open.style.display =
                "block";
        }

        showToast(
            `Dipilih: ${track.name}`
        );
    }

    /* =====================================================
       INIT
       ===================================================== */

    async function initSpotify() {

        createSpotifyUI();

        await handleCallback();

        const expiresAt =
            Number(
                localStorage.getItem(
                    STORAGE.EXPIRES_AT
                )
            );

        if (
            accessToken &&
            expiresAt &&
            Date.now() >= expiresAt
        ) {

            const refreshed =
                await refreshAccessToken();

            if (!refreshed) {
                accessToken = null;
            }
        }

        if (accessToken) {

            await loadProfile();

        } else {

            updateAuthUI();

        }
    }

    /* =====================================================
       PUBLIC API
       ===================================================== */

    window.XIIPS_SPOTIFY = {

        login:
            loginSpotify,

        logout:
            logoutSpotify,

        search:
            searchTracks,

        getProfile,

        getToken:
            () => accessToken

    };

    /* =====================================================
       START
       ===================================================== */

    if (
        document.readyState ===
        "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            initSpotify
        );

    } else {

        initSpotify();

    }

})();
