/* =========================================================
   XI IPS 1 - SPOTIFY CONNECT
   Spotify Web API + Authorization Code with PKCE
   ========================================================= */

(() => {
    "use strict";

    /* -----------------------------------------------------
       CONFIG
       ----------------------------------------------------- */

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

    let accessToken = localStorage.getItem(STORAGE.ACCESS_TOKEN);
    let currentUser = null;
    let currentQuery = "";

    /* -----------------------------------------------------
       BASIC CHECK
       ----------------------------------------------------- */

    if (!CLIENT_ID) {
        console.error(
            "Spotify Client ID belum ditemukan. Periksa spotify-config.js"
        );
        return;
    }

    /* -----------------------------------------------------
       UTILITIES
       ----------------------------------------------------- */

    function randomString(length = 64) {
        const characters =
            "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

        const values = crypto.getRandomValues(
            new Uint8Array(length)
        );

        return Array.from(values)
            .map(value => characters[value % characters.length])
            .join("");
    }

    async function sha256(value) {
        const data = new TextEncoder().encode(value);

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
        const totalSeconds = Math.floor(ms / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;

        return `${minutes}:${String(seconds).padStart(2, "0")}`;
    }

    function showToast(message) {
        let toast = document.querySelector("#spotifyToast");

        if (!toast) {
            toast = document.createElement("div");
            toast.id = "spotifyToast";

            Object.assign(toast.style, {
                position: "fixed",
                left: "50%",
                bottom: "28px",
                transform: "translateX(-50%) translateY(20px)",
                padding: "12px 18px",
                borderRadius: "14px",
                background: "rgba(10,14,12,.92)",
                border: "1px solid rgba(140,255,152,.28)",
                color: "#f7f9f8",
                fontSize: "14px",
                zIndex: "99999",
                opacity: "0",
                transition: "all .25s ease",
                backdropFilter: "blur(16px)",
                boxShadow: "0 15px 50px rgba(0,0,0,.35)"
            });

            document.body.appendChild(toast);
        }

        toast.textContent = message;

        requestAnimationFrame(() => {
            toast.style.opacity = "1";
            toast.style.transform =
                "translateX(-50%) translateY(0)";
        });

        clearTimeout(toast._timer);

        toast._timer = setTimeout(() => {
            toast.style.opacity = "0";
            toast.style.transform =
                "translateX(-50%) translateY(20px)";
        }, 2600);
    }

    /* -----------------------------------------------------
       SPOTIFY AUTHORIZATION
       ----------------------------------------------------- */

    async function loginSpotify() {
        try {
            const verifier = randomString(64);

            const hashed = await sha256(verifier);

            const challenge =
                base64UrlEncode(hashed);

            const state = randomString(32);

            localStorage.setItem(
                STORAGE.CODE_VERIFIER,
                verifier
            );

            localStorage.setItem(
                STORAGE.STATE,
                state
            );

            const params = new URLSearchParams({
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
            showToast("Gagal memulai login Spotify.");
        }
    }

    /* -----------------------------------------------------
       GET TOKEN
       ----------------------------------------------------- */

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

        const response = await fetch(
            TOKEN_URL,
            {
                method: "POST",

                headers: {
                    "Content-Type":
                        "application/x-www-form-urlencoded"
                },

                body: new URLSearchParams({
                    client_id: CLIENT_ID,
                    grant_type: "authorization_code",
                    code: code,
                    redirect_uri: REDIRECT_URI,
                    code_verifier: verifier
                })
            }
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(
                data.error_description ||
                "Gagal mendapatkan Spotify token."
            );
        }

        accessToken = data.access_token;

        localStorage.setItem(
            STORAGE.ACCESS_TOKEN,
            data.access_token
        );

        localStorage.setItem(
            STORAGE.EXPIRES_AT,
            String(
                Date.now() +
                (data.expires_in * 1000)
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

    /* -----------------------------------------------------
       REFRESH TOKEN
       ----------------------------------------------------- */

    async function refreshAccessToken() {
        const refreshToken =
            localStorage.getItem(
                STORAGE.REFRESH_TOKEN
            );

        if (!refreshToken) {
            return false;
        }

        try {
            const response = await fetch(
                TOKEN_URL,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/x-www-form-urlencoded"
                    },

                    body: new URLSearchParams({
                        client_id: CLIENT_ID,
                        grant_type: "refresh_token",
                        refresh_token: refreshToken
                    })
                }
            );

            const data = await response.json();

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
                    (data.expires_in * 1000)
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

    /* -----------------------------------------------------
       API REQUEST
       ----------------------------------------------------- */

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

        const response = await fetch(
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

    /* -----------------------------------------------------
       PROFILE
       ----------------------------------------------------- */

    async function getProfile() {
        return spotifyFetch("/me");
    }

    /* -----------------------------------------------------
       SEARCH TRACK
       ----------------------------------------------------- */

    async function searchTracks(query) {
        const params = new URLSearchParams({
            q: query,
            type: "track",
            limit: "10"
        });

        return spotifyFetch(
            `/search?${params.toString()}`
        );
    }

    /* -----------------------------------------------------
       LOGOUT
       ----------------------------------------------------- */

    function logoutSpotify(showMessage = true) {
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

    /* -----------------------------------------------------
       HANDLE CALLBACK
       ----------------------------------------------------- */

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
            console.error(
                "Spotify state mismatch."
            );

            showToast(
                "Login Spotify gagal: state tidak cocok."
            );

            return;
        }

        try {
            await exchangeCodeForToken(code);

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

    /* -----------------------------------------------------
       LOAD PROFILE
       ----------------------------------------------------- */

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

    /* -----------------------------------------------------
       CREATE UI
       ----------------------------------------------------- */

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
        .spotify-connect-wrap {
            width: min(100%, 1100px);
            margin: 30px auto;
        }

        .spotify-panel {
            padding: 24px;
            border-radius: 24px;
            background:
                linear-gradient(
                    145deg,
                    rgba(255,255,255,.07),
                    rgba(255,255,255,.025)
                );
            border: 1px solid rgba(255,255,255,.09);
            box-shadow:
                0 25px 80px rgba(0,0,0,.28);
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
        }

        .spotify-head {
            display:flex;
            align-items:center;
            justify-content:space-between;
            gap:20px;
            flex-wrap:wrap;
            margin-bottom:22px;
        }

        .spotify-title {
            display:flex;
            align-items:center;
            gap:12px;
        }

        .spotify-logo {
            width:46px;
            height:46px;
            border-radius:50%;
            display:grid;
            place-items:center;
            background:#1ed760;
            color:#061008;
            font-size:24px;
            font-weight:900;
        }

        .spotify-title h2 {
            margin:0;
            font-size:22px;
        }

        .spotify-title p {
            margin:4px 0 0;
            color:#98a19b;
            font-size:13px;
        }

        .spotify-actions {
            display:flex;
            gap:10px;
            flex-wrap:wrap;
        }

        .spotify-btn {
            border:0;
            border-radius:14px;
            padding:11px 16px;
            font-weight:700;
            cursor:pointer;
            transition:
                transform .2s ease,
                box-shadow .2s ease;
        }

        .spotify-btn:hover {
            transform:translateY(-2px);
        }

        .spotify-login {
            background:#1ed760;
            color:#061008;
            box-shadow:
                0 10px 30px rgba(30,215,96,.18);
        }

        .spotify-logout {
            background:rgba(255,255,255,.07);
            color:#fff;
            border:1px solid rgba(255,255,255,.1);
        }

        .spotify-profile {
            display:none;
            align-items:center;
            gap:10px;
            padding:8px 12px;
            border-radius:14px;
            background:rgba(255,255,255,.05);
        }

        .spotify-profile img {
            width:34px;
            height:34px;
            border-radius:50%;
            object-fit:cover;
        }

        .spotify-search {
            display:flex;
            gap:10px;
            margin-bottom:20px;
        }

        .spotify-search input {
            flex:1;
            min-width:0;
            padding:14px 16px;
            border-radius:14px;
            border:1px solid rgba(255,255,255,.1);
            outline:none;
            background:rgba(0,0,0,.2);
            color:#fff;
            font:inherit;
        }

        .spotify-search input:focus {
            border-color:rgba(140,255,152,.45);
            box-shadow:
                0 0 0 4px rgba(140,255,152,.06);
        }

        .spotify-search button {
            padding:0 20px;
            border:0;
            border-radius:14px;
            background:#8cff98;
            color:#071009;
            font-weight:800;
            cursor:pointer;
        }

        .spotify-status {
            color:#98a19b;
            font-size:13px;
            margin:10px 0 18px;
        }

        .spotify-results {
            display:grid;
            grid-template-columns:
                repeat(auto-fit,minmax(260px,1fr));
            gap:12px;
        }

        .spotify-track {
            display:flex;
            gap:13px;
            align-items:center;
            padding:12px;
            border-radius:18px;
            background:rgba(255,255,255,.04);
            border:1px solid rgba(255,255,255,.07);
            transition:
                transform .2s ease,
                background .2s ease,
                border-color .2s ease;
        }

        .spotify-track:hover {
            transform:translateY(-3px);
            background:rgba(255,255,255,.07);
            border-color:rgba(140,255,152,.2);
        }

        .spotify-cover {
            width:64px;
            height:64px;
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
            font-weight:750;
            white-space:nowrap;
            overflow:hidden;
            text-overflow:ellipsis;
        }

        .spotify-track-artist {
            color:#98a19b;
            font-size:13px;
            margin-top:4px;
            white-space:nowrap;
            overflow:hidden;
            text-overflow:ellipsis;
        }

        .spotify-track-meta {
            color:#68716c;
            font-size:11px;
            margin-top:6px;
        }

        .spotify-open {
            flex:none;
            padding:9px 11px;
            border-radius:11px;
            text-decoration:none;
            background:#1ed760;
            color:#061008;
            font-size:12px;
            font-weight:800;
        }

        .spotify-empty {
            padding:30px;
            text-align:center;
            color:#98a19b;
            border:1px dashed rgba(255,255,255,.1);
            border-radius:18px;
        }

        @media(max-width:600px) {
            .spotify-search {
                flex-direction:column;
            }

            .spotify-search button {
                padding:13px;
            }

            .spotify-track {
                align-items:flex-start;
            }

            .spotify-open {
                align-self:center;
            }
        }
        `;

        document.head.appendChild(style);

        const wrapper =
            document.createElement("section");

        wrapper.className =
            "spotify-connect-wrap";

        wrapper.id =
            "spotifyConnect";

        wrapper.innerHTML = `
            <div class="spotify-panel">

                <div class="spotify-head">

                    <div class="spotify-title">
                        <div class="spotify-logo">
                            ♪
                        </div>

                        <div>
                            <h2>Spotify</h2>
                            <p>
                                Cari lagu dari katalog Spotify
                            </p>
                        </div>
                    </div>

                    <div class="spotify-actions">

                        <div
                            class="spotify-profile"
                            id="spotifyProfile"
                        ></div>

                        <button
                            class="spotify-btn spotify-login"
                            id="spotifyLoginBtn"
                        >
                            Login dengan Spotify
                        </button>

                        <button
                            class="spotify-btn spotify-logout"
                            id="spotifyLogoutBtn"
                            style="display:none"
                        >
                            Logout
                        </button>

                    </div>

                </div>

                <div class="spotify-search">

                    <input
                        id="spotifySearchInput"
                        type="search"
                        placeholder="Cari lagu, artis, atau album..."
                        autocomplete="off"
                    >

                    <button
                        id="spotifySearchBtn"
                    >
                        Cari
                    </button>

                </div>

                <div
                    class="spotify-status"
                    id="spotifyStatus"
                >
                    Login Spotify untuk melakukan pencarian.
                </div>

                <div
                    class="spotify-results"
                    id="spotifyResults"
                >
                    <div class="spotify-empty">
                        🔎 Ketik nama lagu untuk mulai mencari.
                    </div>
                </div>

            </div>
        `;

        /*
         * Masukkan panel setelah header/main.
         * Kalau #music ada, panel dimasukkan setelahnya.
         * Kalau tidak ada, panel masuk ke body.
         */

        const musicSection =
            document.querySelector(
                "#music, .music-section, [data-section='music']"
            );

        const main =
            document.querySelector("main");

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

        /* EVENTS */

        document
            .querySelector("#spotifyLoginBtn")
            .addEventListener(
                "click",
                loginSpotify
            );

        document
            .querySelector("#spotifyLogoutBtn")
            .addEventListener(
                "click",
                () => logoutSpotify(true)
            );

        document
            .querySelector("#spotifySearchBtn")
            .addEventListener(
                "click",
                performSearch
            );

        document
            .querySelector("#spotifySearchInput")
            .addEventListener(
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

    /* -----------------------------------------------------
       AUTH UI
       ----------------------------------------------------- */

    function updateAuthUI() {
        const loginButton =
            document.querySelector(
                "#spotifyLoginBtn"
            );

        const logoutButton =
            document.querySelector(
                "#spotifyLogoutBtn"
            );

        const profile =
            document.querySelector(
                "#spotifyProfile"
            );

        const status =
            document.querySelector(
                "#spotifyStatus"
            );

        if (
            !loginButton ||
            !logoutButton ||
            !profile
        ) {
            return;
        }

        if (currentUser) {
            loginButton.style.display =
                "none";

            logoutButton.style.display =
                "inline-block";

            profile.style.display =
                "flex";

            const image =
                currentUser.images?.[0]?.url;

            profile.innerHTML = `
                ${
                    image
                        ? `<img src="${escapeHTML(image)}" alt="">`
                        : `<div style="
                            width:34px;
                            height:34px;
                            border-radius:50%;
                            background:#1ed760;
                            display:grid;
                            place-items:center;
                            color:#061008;
                            font-weight:900;
                          ">♪</div>`
                }

                <span>
                    ${escapeHTML(
                        currentUser.display_name ||
                        currentUser.id ||
                        "Spotify User"
                    )}
                </span>
            `;

            if (status) {
                status.textContent =
                    "Terhubung ke Spotify. Cari lagu favoritmu.";
            }

        } else {
            loginButton.style.display =
                "inline-block";

            logoutButton.style.display =
                "none";

            profile.style.display =
                "none";

            if (status) {
                status.textContent =
                    "Login Spotify untuk melakukan pencarian.";
            }
        }
    }

    /* -----------------------------------------------------
       SEARCH
       ----------------------------------------------------- */

    async function performSearch() {
        const input =
            document.querySelector(
                "#spotifySearchInput"
            );

        const results =
            document.querySelector(
                "#spotifyResults"
            );

        const status =
            document.querySelector(
                "#spotifyStatus"
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

        currentQuery = query;

        results.innerHTML = `
            <div class="spotify-empty">
                Mencari "${escapeHTML(query)}"...
            </div>
        `;

        if (status) {
            status.textContent =
                `Mencari: ${query}`;
        }

        try {
            const data =
                await searchTracks(query);

            renderTracks(
                data?.tracks?.items || []
            );

        } catch (error) {
            console.error(error);

            results.innerHTML = `
                <div class="spotify-empty">
                    Tidak dapat mengambil hasil Spotify.
                    <br><br>
                    ${escapeHTML(error.message)}
                </div>
            `;

            showToast(
                "Pencarian Spotify gagal."
            );
        }
    }

    /* -----------------------------------------------------
       RENDER TRACKS
       ----------------------------------------------------- */

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
                    Tidak ada lagu ditemukan.
                </div>
            `;

            return;
        }

        results.innerHTML =
            tracks.map(track => {

                const cover =
                    track.album?.images?.[1]?.url ||
                    track.album?.images?.[0]?.url ||
                    "";

                const artists =
                    (track.artists || [])
                        .map(
                            artist =>
                                artist.name
                        )
                        .join(", ");

                const spotifyURL =
                    track.external_urls?.spotify ||
                    "#";

                return `
                    <article class="spotify-track">

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

                        <div class="spotify-track-info">

                            <div
                                class="spotify-track-title"
                                title="${escapeHTML(track.name)}"
                            >
                                ${escapeHTML(track.name)}
                            </div>

                            <div
                                class="spotify-track-artist"
                                title="${escapeHTML(artists)}"
                            >
                                ${escapeHTML(artists)}
                            </div>

                            <div class="spotify-track-meta">
                                ${escapeHTML(
                                    track.album?.name ||
                                    "Spotify"
                                )}
                                •
                                ${formatDuration(
                                    track.duration_ms || 0
                                )}
                            </div>

                        </div>

                        <a
                            class="spotify-open"
                            href="${escapeHTML(spotifyURL)}"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            Buka
                        </a>

                    </article>
                `;
            }).join("");
    }

    /* -----------------------------------------------------
       INITIALIZATION
       ----------------------------------------------------- */

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

    /* -----------------------------------------------------
       PUBLIC API
       ----------------------------------------------------- */

    window.XIIPS_SPOTIFY = {
        login: loginSpotify,
        logout: logoutSpotify,
        search: searchTracks,
        getProfile,
        getToken: () => accessToken
    };

    /* -----------------------------------------------------
       START
       ----------------------------------------------------- */

    if (
        document.readyState === "loading"
    ) {
        document.addEventListener(
            "DOMContentLoaded",
            initSpotify
        );
    } else {
        initSpotify();
    }

})();
