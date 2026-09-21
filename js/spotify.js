/* =========================================================
   XI IPS 1 - SPOTIFY LOGIN
   Authorization Code + PKCE
   ========================================================= */

(() => {
    "use strict";

    const config = window.SPOTIFY_CONFIG;

    if (!config) {
        console.error("SPOTIFY_CONFIG tidak ditemukan.");
        return;
    }

    const STORAGE = {
        verifier: "spotify_code_verifier",
        state: "spotify_oauth_state",
        token: "spotify_access_token",
        expires: "spotify_token_expires",
        refresh: "spotify_refresh_token"
    };

    /* =========================================================
       UTILITIES
       ========================================================= */

    function randomString(length = 64) {
        const chars =
            "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~";

        const array = new Uint8Array(length);
        crypto.getRandomValues(array);

        return Array.from(array)
            .map(value => chars[value % chars.length])
            .join("");
    }

    function base64UrlEncode(arrayBuffer) {
        const bytes = new Uint8Array(arrayBuffer);

        let binary = "";

        bytes.forEach(byte => {
            binary += String.fromCharCode(byte);
        });

        return btoa(binary)
            .replace(/\+/g, "-")
            .replace(/\//g, "_")
            .replace(/=+$/, "");
    }

    async function createCodeChallenge(verifier) {
        const encoder = new TextEncoder();

        const data = encoder.encode(verifier);

        const digest = await crypto.subtle.digest(
            "SHA-256",
            data
        );

        return base64UrlEncode(digest);
    }

    function getParams() {
        return new URLSearchParams(window.location.search);
    }

    function cleanCallbackUrl() {
        const cleanUrl =
            window.location.origin +
            window.location.pathname;

        window.history.replaceState(
            {},
            document.title,
            cleanUrl
        );
    }

    /* =========================================================
       LOGIN
       ========================================================= */

    async function loginSpotify() {
        try {
            if (!window.crypto || !window.crypto.subtle) {
                throw new Error(
                    "Browser tidak mendukung Web Crypto."
                );
            }

            const verifier = randomString(96);
            const challenge = await createCodeChallenge(verifier);

            /*
             * State dibuat SEKALI sebelum redirect.
             * Nilai yang sama akan diperiksa ketika kembali.
             */
            const state = randomString(32);

            localStorage.setItem(
                STORAGE.verifier,
                verifier
            );

            localStorage.setItem(
                STORAGE.state,
                state
            );

            const params = new URLSearchParams({
                response_type: "code",
                client_id: config.clientId,
                scope: config.scopes.join(" "),
                redirect_uri: config.redirectUri,
                code_challenge_method: "S256",
                code_challenge: challenge,
                state: state
            });

            const authUrl =
                "https://accounts.spotify.com/authorize?" +
                params.toString();

            console.log("Spotify login dimulai.");

            window.location.assign(authUrl);

        } catch (error) {
            console.error("Spotify Login Error:", error);

            showMessage(
                "Gagal memulai login Spotify."
            );
        }
    }

    /* =========================================================
       CALLBACK
       ========================================================= */

    async function handleCallback() {
        const params = getParams();

        const code = params.get("code");
        const returnedState = params.get("state");
        const error = params.get("error");

        /*
         * Tidak sedang callback
         */
        if (!code && !error) {
            return false;
        }

        /*
         * User membatalkan login
         */
        if (error) {
            console.warn(
                "Spotify OAuth Error:",
                error
            );

            clearOAuthStorage();
            cleanCallbackUrl();

            showMessage(
                "Login Spotify dibatalkan."
            );

            return true;
        }

        /*
         * Ambil state asli yang dibuat SEBELUM redirect
         */
        const savedState =
            localStorage.getItem(
                STORAGE.state
            );

        /*
         * Validasi state
         */
        if (
            !returnedState ||
            !savedState ||
            returnedState !== savedState
        ) {
            console.error(
                "Spotify State Mismatch",
                {
                    returnedState,
                    savedState
                }
            );

            clearOAuthStorage();
            cleanCallbackUrl();

            showMessage(
                "Login gagal: state tidak cocok. Silakan login kembali."
            );

            return true;
        }

        /*
         * State sudah digunakan.
         * Hapus supaya tidak dapat dipakai ulang.
         */
        localStorage.removeItem(
            STORAGE.state
        );

        try {
            const verifier =
                localStorage.getItem(
                    STORAGE.verifier
                );

            if (!verifier) {
                throw new Error(
                    "Code verifier tidak ditemukan."
                );
            }

            const token =
                await exchangeCodeForToken(
                    code,
                    verifier
                );

            if (!token.access_token) {
                throw new Error(
                    "Access token tidak diterima Spotify."
                );
            }

            saveToken(token);

            localStorage.removeItem(
                STORAGE.verifier
            );

            cleanCallbackUrl();

            console.log(
                "Spotify berhasil login."
            );

            /*
             * Ambil profile Spotify
             */
            const profile =
                await getSpotifyProfile(
                    token.access_token
                );

            if (profile) {
                saveProfile(profile);
                updateSpotifyUI(profile);
            }

            showMessage(
                "Berhasil login ke Spotify!"
            );

            return true;

        } catch (error) {
            console.error(
                "Spotify Callback Error:",
                error
            );

            clearOAuthStorage();
            cleanCallbackUrl();

            showMessage(
                "Login Spotify gagal. Periksa Redirect URI dan coba lagi."
            );

            return true;
        }
    }

    /* =========================================================
       TOKEN
       ========================================================= */

    async function exchangeCodeForToken(
        code,
        verifier
    ) {
        const body = new URLSearchParams({
            client_id: config.clientId,
            grant_type: "authorization_code",
            code: code,
            redirect_uri: config.redirectUri,
            code_verifier: verifier
        });

        const response = await fetch(
            "https://accounts.spotify.com/api/token",
            {
                method: "POST",

                headers: {
                    "Content-Type":
                        "application/x-www-form-urlencoded"
                },

                body
            }
        );

        const data =
            await response.json();

        if (!response.ok) {
            console.error(
                "Spotify Token Error:",
                data
            );

            throw new Error(
                data.error_description ||
                data.error ||
                "Token request gagal."
            );
        }

        return data;
    }

    function saveToken(token) {
        localStorage.setItem(
            STORAGE.token,
            token.access_token
        );

        if (token.refresh_token) {
            localStorage.setItem(
                STORAGE.refresh,
                token.refresh_token
            );
        }

        const expiresAt =
            Date.now() +
            (token.expires_in * 1000);

        localStorage.setItem(
            STORAGE.expires,
            expiresAt.toString()
        );
    }

    function getAccessToken() {
        const token =
            localStorage.getItem(
                STORAGE.token
            );

        const expires =
            Number(
                localStorage.getItem(
                    STORAGE.expires
                )
            );

        if (!token) {
            return null;
        }

        /*
         * Beri buffer 60 detik sebelum dianggap expired
         */
        if (
            expires &&
            Date.now() > expires - 60000
        ) {
            return null;
        }

        return token;
    }

    /* =========================================================
       SPOTIFY PROFILE
       ========================================================= */

    async function getSpotifyProfile(
        accessToken
    ) {
        const response =
            await fetch(
                "https://api.spotify.com/v1/me",
                {
                    headers: {
                        Authorization:
                            `Bearer ${accessToken}`
                    }
                }
            );

        if (!response.ok) {
            throw new Error(
                "Tidak dapat mengambil profile Spotify."
            );
        }

        return await response.json();
    }

    function saveProfile(profile) {
        localStorage.setItem(
            "spotify_profile",
            JSON.stringify(profile)
        );
    }

    function getSavedProfile() {
        try {
            return JSON.parse(
                localStorage.getItem(
                    "spotify_profile"
                )
            );
        } catch {
            return null;
        }
    }

    /* =========================================================
       UI
       ========================================================= */

    function updateSpotifyUI(profile) {
        if (!profile) return;

        const name =
            profile.display_name ||
            "Spotify User";

        const image =
            profile.images &&
            profile.images.length
                ? profile.images[0].url
                : "";

        /*
         * Support beberapa ID UI
         */
        const nameElements = [
            document.getElementById("spotifyUserName"),
            document.getElementById("spotifyProfileName"),
            document.getElementById("profileName")
        ];

        nameElements.forEach(element => {
            if (element) {
                element.textContent = name;
            }
        });

        const imageElements = [
            document.getElementById("spotifyUserImage"),
            document.getElementById("spotifyProfileImage"),
            document.getElementById("profileImage")
        ];

        imageElements.forEach(element => {
            if (element && image) {
                element.src = image;
            }
        });

        /*
         * Tombol login
         */
        const loginButtons = document.querySelectorAll(
            "#spotifyLogin, .spotify-login, [data-spotify-login]"
        );

        loginButtons.forEach(button => {
            button.textContent = "Spotify Terhubung";
            button.classList.add(
                "spotify-connected"
            );
        });
    }

    function showMessage(message) {
        /*
         * Kalau website punya fungsi toast sendiri,
         * gunakan fungsi tersebut.
         */
        if (
            typeof window.showToast ===
            "function"
        ) {
            window.showToast(message);
            return;
        }

        /*
         * Coba elemen message yang sudah ada
         */
        const messageElement =
            document.getElementById(
                "spotifyMessage"
            );

        if (messageElement) {
            messageElement.textContent =
                message;

            messageElement.style.display =
                "block";

            setTimeout(() => {
                messageElement.style.display =
                    "none";
            }, 4000);

            return;
        }

        console.log(
            "[Spotify]",
            message
        );
    }

    /* =========================================================
       LOGOUT
       ========================================================= */

    function logoutSpotify() {
        localStorage.removeItem(
            STORAGE.token
        );

        localStorage.removeItem(
            STORAGE.expires
        );

        localStorage.removeItem(
            STORAGE.refresh
        );

        localStorage.removeItem(
            "spotify_profile"
        );

        localStorage.removeItem(
            STORAGE.verifier
        );

        localStorage.removeItem(
            STORAGE.state
        );

        showMessage(
            "Berhasil logout dari Spotify."
        );

        window.location.reload();
    }

    function clearOAuthStorage() {
        localStorage.removeItem(
            STORAGE.verifier
        );

        localStorage.removeItem(
            STORAGE.state
        );
    }

    /* =========================================================
       EVENT BUTTON
       ========================================================= */

    function setupButtons() {
        const loginButtons =
            document.querySelectorAll(
                "#spotifyLogin, .spotify-login, [data-spotify-login]"
            );

        loginButtons.forEach(button => {
            button.addEventListener(
                "click",
                event => {
                    event.preventDefault();
                    loginSpotify();
                }
            );
        });

        const logoutButtons =
            document.querySelectorAll(
                "#spotifyLogout, .spotify-logout, [data-spotify-logout]"
            );

        logoutButtons.forEach(button => {
            button.addEventListener(
                "click",
                event => {
                    event.preventDefault();
                    logoutSpotify();
                }
            );
        });
    }

    /* =========================================================
       INITIALIZATION
       ========================================================= */

    async function initSpotify() {
        console.log(
            "Spotify system initialized."
        );

        /*
         * Handle callback terlebih dahulu.
         * Jangan langsung membuat state baru.
         */
        const isCallback =
            await handleCallback();

        if (isCallback) {
            return;
        }

        /*
         * Cek token yang sudah tersimpan
         */
        const token =
            getAccessToken();

        if (token) {
            try {
                const profile =
                    await getSpotifyProfile(
                        token
                    );

                saveProfile(profile);
                updateSpotifyUI(profile);

                console.log(
                    "Spotify session aktif:",
                    profile.display_name
                );

            } catch (error) {
                console.warn(
                    "Session Spotify tidak valid."
                );

                localStorage.removeItem(
                    STORAGE.token
                );

                localStorage.removeItem(
                    STORAGE.expires
                );
            }
        } else {
            /*
             * Jika sebelumnya sudah login tetapi
             * token expired, jangan otomatis redirect.
             * User dapat menekan Login Spotify lagi.
             */

            const profile =
                getSavedProfile();

            if (profile) {
                updateSpotifyUI(profile);
            }
        }

        setupButtons();
    }

    /* =========================================================
       PUBLIC API
       ========================================================= */

    window.SpotifyAuth = {
        login: loginSpotify,
        logout: logoutSpotify,
        getToken: getAccessToken,
        getProfile: getSavedProfile,
        isLoggedIn: () => {
            return !!getAccessToken();
        }
    };

    /*
     * Jalankan setelah DOM tersedia
     */
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
