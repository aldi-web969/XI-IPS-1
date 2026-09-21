/* =========================================================
   XI IPS 1 - SPOTIFY INTEGRATION
   Login Spotify + PKCE + Profile + Playlist
   ========================================================= */

(() => {
    "use strict";

    /* =====================================================
       KONFIGURASI
       ===================================================== */

    const SPOTIFY = {
        clientId: "a5dd486ff00a4694b004bb9b3d583591",

        redirectUri:
            "https://aldi-web969.github.io/XI-IPS-1/",

        scopes: [
            "user-read-private",
            "user-read-email",
            "playlist-read-private",
            "playlist-read-collaborative"
        ]
    };


    /* =====================================================
       LOCAL STORAGE KEY
       ===================================================== */

    const KEY = {
        state: "xi_spotify_state",
        verifier: "xi_spotify_verifier",
        token: "xi_spotify_access_token",
        expires: "xi_spotify_expires",
        profile: "xi_spotify_profile"
    };


    /* =====================================================
       LAGU LOKAL
       2 LAGU YANG SUDAH ADA
       ===================================================== */

    const LOCAL_SONGS = [
        {
            id: "local-1",
            title: "Lagu XI IPS 1",
            artist: "XI IPS 1",
            file: "assets/audio/lagu1.mp3"
        },

        {
            id: "local-2",
            title: "Lagu Favorit XI IPS 1",
            artist: "XI IPS 1",
            file: "assets/audio/lagu2.mp3"
        }
    ];


    /* =====================================================
       RANDOM STRING
       ===================================================== */

    function randomString(length = 64) {

        const characters =
            "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~";

        const array =
            new Uint8Array(length);

        crypto.getRandomValues(array);

        return Array
            .from(array)
            .map(
                value =>
                    characters[
                        value % characters.length
                    ]
            )
            .join("");
    }


    /* =====================================================
       BASE64 URL
       ===================================================== */

    function base64UrlEncode(buffer) {

        const bytes =
            new Uint8Array(buffer);

        let binary = "";

        for (const byte of bytes) {
            binary += String.fromCharCode(byte);
        }

        return btoa(binary)
            .replace(/\+/g, "-")
            .replace(/\//g, "_")
            .replace(/=+$/, "");
    }


    /* =====================================================
       CODE CHALLENGE
       ===================================================== */

    async function createCodeChallenge(verifier) {

        const data =
            new TextEncoder().encode(verifier);

        const digest =
            await crypto.subtle.digest(
                "SHA-256",
                data
            );

        return base64UrlEncode(digest);
    }


    /* =====================================================
       LOGIN SPOTIFY
       ===================================================== */

    async function loginSpotify() {

        try {

            const verifier =
                randomString(96);

            const state =
                randomString(32);

            const challenge =
                await createCodeChallenge(
                    verifier
                );


            /*
             * SIMPAN SEBELUM PINDAH KE SPOTIFY
             */

            localStorage.setItem(
                KEY.verifier,
                verifier
            );

            localStorage.setItem(
                KEY.state,
                state
            );


            /*
             * PARAMETER LOGIN
             */

            const params =
                new URLSearchParams({

                    client_id:
                        SPOTIFY.clientId,

                    response_type:
                        "code",

                    redirect_uri:
                        SPOTIFY.redirectUri,

                    scope:
                        SPOTIFY.scopes.join(" "),

                    state:
                        state,

                    code_challenge_method:
                        "S256",

                    code_challenge:
                        challenge
                });


            const url =
                "https://accounts.spotify.com/authorize?" +
                params.toString();


            /*
             * ARAHKAN KE LOGIN RESMI SPOTIFY
             */

            window.location.href = url;

        } catch (error) {

            console.error(
                "Spotify Login Error:",
                error
            );

            showMessage(
                "Tidak dapat membuka login Spotify."
            );
        }
    }


    /* =====================================================
       CALLBACK SPOTIFY
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


        /*
         * BUKAN CALLBACK
         */

        if (!code && !error) {
            return false;
        }


        /*
         * LOGIN DIBATALKAN
         */

        if (error) {

            console.log(
                "Spotify login dibatalkan:",
                error
            );

            clearOAuthData();

            cleanUrl();

            showMessage(
                "Login Spotify dibatalkan."
            );

            return true;
        }


        /*
         * AMBIL STATE YANG DISIMPAN
         */

        const savedState =
            localStorage.getItem(
                KEY.state
            );


        /*
         * CEK STATE
         */

        if (
            !savedState ||
            !returnedState ||
            savedState !== returnedState
        ) {

            console.error(
                "STATE TIDAK COCOK",
                {
                    savedState,
                    returnedState
                }
            );

            clearOAuthData();

            cleanUrl();

            showMessage(
                "Login gagal: state tidak cocok. Silakan login kembali."
            );

            return true;
        }


        /*
         * STATE SUDAH DIPAKAI
         */

        localStorage.removeItem(
            KEY.state
        );


        try {

            const verifier =
                localStorage.getItem(
                    KEY.verifier
                );


            if (!verifier) {

                throw new Error(
                    "Code verifier tidak ditemukan."
                );
            }


            /*
             * TUKAR CODE MENJADI TOKEN
             */

            const token =
                await exchangeCode(
                    code,
                    verifier
                );


            if (!token.access_token) {

                throw new Error(
                    "Access token tidak ditemukan."
                );
            }


            /*
             * SIMPAN TOKEN
             */

            saveToken(token);


            localStorage.removeItem(
                KEY.verifier
            );


            /*
             * BERSIHKAN URL
             */

            cleanUrl();


            /*
             * AMBIL PROFILE
             */

            const profile =
                await getProfile(
                    token.access_token
                );


            localStorage.setItem(
                KEY.profile,
                JSON.stringify(profile)
            );


            /*
             * TAMPILKAN PROFILE
             */

            updateProfileUI(profile);


            /*
             * AMBIL PLAYLIST
             */

            const playlists =
                await getPlaylists(
                    token.access_token
                );


            /*
             * TAMPILKAN PLAYLIST
             */

            renderPlaylists(
                playlists
            );


            showMessage(
                "Login Spotify berhasil!"
            );


            return true;

        } catch (error) {

            console.error(
                "Spotify Callback Error:",
                error
            );

            clearOAuthData();

            cleanUrl();

            showMessage(
                "Login Spotify gagal. Silakan coba lagi."
            );

            return true;
        }
    }


    /* =====================================================
       TUKAR CODE KE TOKEN
       ===================================================== */

    async function exchangeCode(
        code,
        verifier
    ) {

        const body =
            new URLSearchParams({

                client_id:
                    SPOTIFY.clientId,

                grant_type:
                    "authorization_code",

                code:
                    code,

                redirect_uri:
                    SPOTIFY.redirectUri,

                code_verifier:
                    verifier
            });


        const response =
            await fetch(
                "https://accounts.spotify.com/api/token",
                {

                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/x-www-form-urlencoded"
                    },

                    body: body
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
                "Token gagal."
            );
        }


        return data;
    }


    /* =====================================================
       SIMPAN TOKEN
       ===================================================== */

    function saveToken(token) {

        localStorage.setItem(
            KEY.token,
            token.access_token
        );


        const expires =
            Date.now() +
            (
                Number(token.expires_in || 3600) *
                1000
            );


        localStorage.setItem(
            KEY.expires,
            expires.toString()
        );
    }


    /* =====================================================
       AMBIL TOKEN
       ===================================================== */

    function getToken() {

        const token =
            localStorage.getItem(
                KEY.token
            );

        const expires =
            Number(
                localStorage.getItem(
                    KEY.expires
                )
            );


        if (!token) {
            return null;
        }


        if (
            expires &&
            Date.now() >= expires
        ) {

            localStorage.removeItem(
                KEY.token
            );

            localStorage.removeItem(
                KEY.expires
            );

            return null;
        }


        return token;
    }


    /* =====================================================
       PROFILE SPOTIFY
       ===================================================== */

    async function getProfile(token) {

        const response =
            await fetch(
                "https://api.spotify.com/v1/me",
                {

                    headers: {
                        Authorization:
                            `Bearer ${token}`
                    }
                }
            );


        if (!response.ok) {

            throw new Error(
                "Profile Spotify gagal."
            );
        }


        return await response.json();
    }


    /* =====================================================
       PLAYLIST SPOTIFY
       ===================================================== */

    async function getPlaylists(token) {

        let allPlaylists = [];

        let url =
            "https://api.spotify.com/v1/me/playlists?limit=50";


        while (url) {

            const response =
                await fetch(
                    url,
                    {
                        headers: {
                            Authorization:
                                `Bearer ${token}`
                        }
                    }
                );


            if (!response.ok) {

                throw new Error(
                    "Playlist Spotify gagal dimuat."
                );
            }


            const data =
                await response.json();


            if (data.items) {

                allPlaylists =
                    allPlaylists.concat(
                        data.items
                    );
            }


            url =
                data.next || null;
        }


        return allPlaylists;
    }


    /* =====================================================
       TAMPILKAN PROFILE
       ===================================================== */

    function updateProfileUI(profile) {

        if (!profile) return;


        const name =
            profile.display_name ||
            "Spotify User";


        const image =
            profile.images &&
            profile.images.length
                ? profile.images[0].url
                : "";


        const names =
            document.querySelectorAll(
                "#spotifyUserName, #spotifyProfileName, #profileName"
            );


        names.forEach(element => {

            element.textContent =
                name;

        });


        const images =
            document.querySelectorAll(
                "#spotifyUserImage, #spotifyProfileImage, #profileImage"
            );


        images.forEach(element => {

            if (image) {
                element.src = image;
            }

        });


        const loginButtons =
            document.querySelectorAll(
                "#spotifyLogin, .spotify-login, [data-spotify-login]"
            );


        loginButtons.forEach(button => {

            button.textContent =
                "Spotify Terhubung";

            button.classList.add(
                "spotify-connected"
            );

        });
    }


    /* =====================================================
       RENDER PLAYLIST
       ===================================================== */

    function renderPlaylists(
        playlists
    ) {

        /*
         * Coba beberapa ID container
         */

        const container =
            document.getElementById(
                "spotifyPlaylist"
            ) ||
            document.getElementById(
                "musicPlaylist"
            ) ||
            document.getElementById(
                "playlist"
            );


        if (!container) {

            console.warn(
                "Container playlist tidak ditemukan."
            );

            return;
        }


        /*
         * BERSIHKAN PLAYLIST
         */

        container.innerHTML = "";


        /*
         * TAMBAHKAN 2 LAGU LOKAL
         */

        LOCAL_SONGS.forEach(song => {

            const item =
                createLocalSongElement(
                    song
                );

            container.appendChild(
                item
            );

        });


        /*
         * PEMISAH
         */

        if (playlists.length > 0) {

            const separator =
                document.createElement(
                    "div"
                );

            separator.className =
                "spotify-section-title";

            separator.textContent =
                "Playlist Spotify Saya";

            container.appendChild(
                separator
            );
        }


        /*
         * PLAYLIST SPOTIFY
         */

        playlists.forEach(playlist => {

            const item =
                createPlaylistElement(
                    playlist
                );

            container.appendChild(
                item
            );

        });


        /*
         * JUMLAH PLAYLIST
         */

        updatePlaylistCount(
            playlists.length
        );
    }


    /* =====================================================
       LAGU LOKAL ELEMENT
       ===================================================== */

    function createLocalSongElement(song) {

        const item =
            document.createElement(
                "div"
            );


        item.className =
            "music-item local-song";


        item.innerHTML = `

            <div class="music-cover">
                ♪
            </div>

            <div class="music-info">

                <strong>
                    ${escapeHTML(song.title)}
                </strong>

                <span>
                    ${escapeHTML(song.artist)}
                </span>

            </div>

            <button
                class="local-play-button"
                type="button"
            >
                ▶
            </button>

        `;


        const button =
            item.querySelector(
                ".local-play-button"
            );


        button.addEventListener(
            "click",
            () => {

                playLocalSong(
                    song
                );

            }
        );


        return item;
    }


    /* =====================================================
       PLAYLIST ELEMENT
       ===================================================== */

    function createPlaylistElement(
        playlist
    ) {

        const item =
            document.createElement(
                "div"
            );


        item.className =
            "music-item spotify-playlist-item";


        const image =
            playlist.images &&
            playlist.images.length
                ? playlist.images[0].url
                : "";


        item.innerHTML = `

            <div class="music-cover">

                ${
                    image
                        ? `<img src="${escapeAttribute(image)}" alt="">`
                        : "♫"
                }

            </div>

            <div class="music-info">

                <strong>
                    ${escapeHTML(playlist.name)}
                </strong>

                <span>
                    ${
                        playlist.tracks
                            ? playlist.tracks.total
                            : 0
                    } lagu
                </span>

            </div>

            <button
                class="playlist-open-button"
                type="button"
            >
                ↗
            </button>

        `;


        item.addEventListener(
            "click",
            () => {

                if (
                    playlist.external_urls &&
                    playlist.external_urls.spotify
                ) {

                    window.open(
                        playlist.external_urls.spotify,
                        "_blank",
                        "noopener,noreferrer"
                    );
                }

            }
        );


        return item;
    }


    /* =====================================================
       PLAY LAGU LOKAL
       ===================================================== */

    function playLocalSong(song) {

        let audio =
            document.getElementById(
                "audio"
            );


        /*
         * Kalau audio tidak ada,
         * buat otomatis.
         */

        if (!audio) {

            audio =
                document.createElement(
                    "audio"
                );

            audio.id =
                "audio";

            audio.controls =
                true;

            document.body.appendChild(
                audio
            );
        }


        audio.src =
            song.file;


        audio.play()
            .catch(error => {

                console.warn(
                    "Audio tidak dapat diputar:",
                    error
                );

                showMessage(
                    "Klik tombol play untuk memulai lagu."
                );
            });


        const title =
            document.getElementById(
                "songTitle"
            );

        const artist =
            document.getElementById(
                "songArtist"
            );


        if (title) {
            title.textContent =
                song.title;
        }


        if (artist) {
            artist.textContent =
                song.artist;
        }
    }


    /* =====================================================
       UPDATE JUMLAH PLAYLIST
       ===================================================== */

    function updatePlaylistCount(
        count
    ) {

        const elements =
            document.querySelectorAll(
                "#songCount, #playlistCount"
            );


        elements.forEach(element => {

            element.textContent =
                `${count} playlist Spotify`;

        });
    }


    /* =====================================================
       HTML SECURITY
       ===================================================== */

    function escapeHTML(value) {

        return String(value || "")
            .replace(
                /&/g,
                "&amp;"
            )
            .replace(
                /</g,
                "&lt;"
            )
            .replace(
                />/g,
                "&gt;"
            )
            .replace(
                /"/g,
                "&quot;"
            )
            .replace(
                /'/g,
                "&#039;"
            );
    }


    function escapeAttribute(value) {

        return escapeHTML(value);
    }


    /* =====================================================
       CLEAN URL
       ===================================================== */

    function cleanUrl() {

        const clean =
            window.location.origin +
            window.location.pathname;


        window.history.replaceState(
            {},
            document.title,
            clean
        );
    }


    /* =====================================================
       CLEAR OAUTH
       ===================================================== */

    function clearOAuthData() {

        localStorage.removeItem(
            KEY.state
        );

        localStorage.removeItem(
            KEY.verifier
        );
    }


    /* =====================================================
       LOGOUT
       ===================================================== */

    function logoutSpotify() {

        localStorage.removeItem(
            KEY.token
        );

        localStorage.removeItem(
            KEY.expires
        );

        localStorage.removeItem(
            KEY.profile
        );

        clearOAuthData();


        showMessage(
            "Berhasil logout dari website."
        );


        setTimeout(() => {

            window.location.reload();

        }, 500);
    }


    /* =====================================================
       MESSAGE
       ===================================================== */

    function showMessage(message) {

        console.log(
            "[Spotify]",
            message
        );


        if (
            typeof window.showToast ===
            "function"
        ) {

            window.showToast(
                message
            );

            return;
        }


        const element =
            document.getElementById(
                "spotifyMessage"
            );


        if (element) {

            element.textContent =
                message;

            element.style.display =
                "block";


            setTimeout(() => {

                element.style.display =
                    "none";

            }, 4000);

            return;
        }


        /*
         * Tidak memakai alert
         * agar UI website tetap bagus.
         */
    }


    /* =====================================================
       BUTTON LOGIN / LOGOUT
       ===================================================== */

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


    /* =====================================================
       CEK LOGIN LAMA
       ===================================================== */

    async function restoreSession() {

        const token =
            getToken();


        if (!token) {
            return;
        }


        try {

            const profile =
                await getProfile(
                    token
                );


            localStorage.setItem(
                KEY.profile,
                JSON.stringify(profile)
            );


            updateProfileUI(
                profile
            );


            const playlists =
                await getPlaylists(
                    token
                );


            renderPlaylists(
                playlists
            );


        } catch (error) {

            console.warn(
                "Session Spotify sudah tidak valid.",
                error
            );


            localStorage.removeItem(
                KEY.token
            );

            localStorage.removeItem(
                KEY.expires
            );
        }
    }


    /* =====================================================
       INITIALIZATION
       ===================================================== */

    async function init() {

        console.log(
            "XI IPS 1 Spotify initialized."
        );


        /*
         * CALLBACK HARUS DIPROSES
         * SEBELUM RESTORE SESSION
         */

        const callback =
            await handleCallback();


        if (callback) {
            return;
        }


        setupButtons();

        await restoreSession();
    }


    /* =====================================================
       PUBLIC API
       ===================================================== */

    window.SpotifyXI = {

        login:
            loginSpotify,

        logout:
            logoutSpotify,

        getToken:
            getToken,

        getProfile:
            () => {

                try {

                    return JSON.parse(
                        localStorage.getItem(
                            KEY.profile
                        )
                    );

                } catch {

                    return null;
                }
            },

        getPlaylists:
            async () => {

                const token =
                    getToken();

                if (!token) {
                    return [];
                }

                return await getPlaylists(
                    token
                );
            }
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
            init
        );

    } else {

        init();

    }

})();
