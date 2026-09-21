"use strict";


/* ELEMENT */

const musicUI =
    document.getElementById("musicUI");

const openMusic =
    document.getElementById("openMusic");

const closeMusic =
    document.getElementById("closeMusic");

const audio =
    document.getElementById("audio");

const playlist =
    document.getElementById("playlist");

const searchInput =
    document.getElementById("searchInput");

const playBtn =
    document.getElementById("playBtn");

const previousBtn =
    document.getElementById("previousBtn");

const nextBtn =
    document.getElementById("nextBtn");

const progress =
    document.getElementById("progress");

const volume =
    document.getElementById("volume");

const currentTime =
    document.getElementById("currentTime");

const duration =
    document.getElementById("duration");

const songTitle =
    document.getElementById("songTitle");

const songArtist =
    document.getElementById("songArtist");

const songCount =
    document.getElementById("songCount");

const favoriteBtn =
    document.getElementById("favoriteBtn");


/* DAFTAR LAGU */

const songs = [

    {
        title: "Lagu 1",
        artist: "XI IPS 1",
        file: "assets/audio/lagu1.mp3"
    },

    {
        title: "Lagu 2",
        artist: "XI IPS 1",
        file: "assets/audio/lagu2.mp3"
    },

    {
        title: "Lagu 3",
        artist: "XI IPS 1",
        file: "assets/audio/lagu3.mp3"
    },

    {
        title: "Lagu 4",
        artist: "XI IPS 1",
        file: "assets/audio/lagu4.mp3"
    },

    {
        title: "Lagu 5",
        artist: "XI IPS 1",
        file: "assets/audio/lagu5.mp3"
    },

    {
        title: "Lagu 6",
        artist: "XI IPS 1",
        file: "assets/audio/lagu6.mp3"
    },

    {
        title: "Lagu 7",
        artist: "XI IPS 1",
        file: "assets/audio/lagu7.mp3"
    },

    {
        title: "Lagu 8",
        artist: "XI IPS 1",
        file: "assets/audio/lagu8.mp3"
    },

    {
        title: "Lagu 9",
        artist: "XI IPS 1",
        file: "assets/audio/lagu9.mp3"
    },

    {
        title: "Lagu 10",
        artist: "XI IPS 1",
        file: "assets/audio/lagu10.mp3"
    }

];


let currentIndex = 0;

let isPlaying = false;

let favorites =
    JSON.parse(
        localStorage.getItem(
            "xi_ips_music_favorites"
        ) || "[]"
    );


/* BUKA */

openMusic.addEventListener(
    "click",
    () => {

        musicUI.classList.add("open");

        openMusic.style.display =
            "none";

    }
);


/* TUTUP */

closeMusic.addEventListener(
    "click",
    () => {

        musicUI.classList.remove("open");

        openMusic.style.display =
            "block";

    }
);


/* RENDER PLAYLIST */

function renderPlaylist(list = songs) {

    playlist.innerHTML = "";

    songCount.textContent =
        `${list.length} lagu`;


    if (!list.length) {

        playlist.innerHTML = `
            <div style="
                grid-column:1/-1;
                padding:40px;
                text-align:center;
                color:#89938d;
            ">
                Lagu tidak ditemukan.
            </div>
        `;

        return;
    }


    list.forEach(
        (song, index) => {

            const originalIndex =
                songs.indexOf(song);

            const item =
                document.createElement("div");

            item.className =
                "song-item";


            if (
                originalIndex ===
                currentIndex
            ) {

                item.classList.add(
                    "playing"
                );

            }


            item.innerHTML = `

                <div class="song-number">
                    ${String(
                        index + 1
                    ).padStart(2, "0")}
                </div>

                <div class="song-cover">
                    ♪
                </div>

                <div class="song-details">

                    <strong>
                        ${escapeHTML(
                            song.title
                        )}
                    </strong>

                    <span>
                        ${escapeHTML(
                            song.artist
                        )}
                    </span>

                </div>

                <button class="song-play">
                    ▶
                </button>

            `;


            item.addEventListener(
                "click",
                () => {

                    loadSong(
                        originalIndex,
                        true
                    );

                }
            );


            playlist.appendChild(item);

        }
    );

}


/* LOAD SONG */

function loadSong(
    index,
    autoPlay = false
) {

    if (
        index < 0 ||
        index >= songs.length
    ) {
        return;
    }


    currentIndex = index;


    const song =
        songs[currentIndex];


    audio.src =
        song.file;


    audio.load();


    songTitle.textContent =
        song.title;


    songArtist.textContent =
        song.artist;


    updateFavoriteButton();


    renderPlaylist(
        getFilteredSongs()
    );


    if (autoPlay) {

        audio.play()
            .then(() => {

                isPlaying = true;

                updatePlayButton();

            })
            .catch(
                error => {
                    console.warn(
                        "Audio gagal diputar:",
                        error
                    );
                }
            );

    }

}


/* PLAY / PAUSE */

playBtn.addEventListener(
    "click",
    () => {

        if (!audio.src) {

            loadSong(
                currentIndex,
                true
            );

            return;
        }


        if (audio.paused) {

            audio.play()
                .then(() => {

                    isPlaying = true;

                    updatePlayButton();

                });

        } else {

            audio.pause();

            isPlaying = false;

            updatePlayButton();

        }

    }
);


/* UPDATE PLAY */

function updatePlayButton() {

    playBtn.textContent =
        isPlaying
            ? "❚❚"
            : "▶";

}


/* PREVIOUS */

previousBtn.addEventListener(
    "click",
    () => {

        currentIndex--;

        if (
            currentIndex < 0
        ) {

            currentIndex =
                songs.length - 1;

        }

        loadSong(
            currentIndex,
            true
        );

    }
);


/* NEXT */

nextBtn.addEventListener(
    "click",
    () => {

        currentIndex++;

        if (
            currentIndex >=
            songs.length
        ) {

            currentIndex = 0;

        }

        loadSong(
            currentIndex,
            true
        );

    }
);


/* AUTO NEXT */

audio.addEventListener(
    "ended",
    () => {

        currentIndex++;

        if (
            currentIndex >=
            songs.length
        ) {

            currentIndex = 0;

        }

        loadSong(
            currentIndex,
            true
        );

    }
);


/* PROGRESS */

audio.addEventListener(
    "timeupdate",
    () => {

        if (
            !audio.duration ||
            Number.isNaN(
                audio.duration
            )
        ) {
            return;
        }


        progress.value =
            (
                audio.currentTime /
                audio.duration
            ) * 100;


        currentTime.textContent =
            formatTime(
                audio.currentTime
            );

    }
);


/* DURATION */

audio.addEventListener(
    "loadedmetadata",
    () => {

        duration.textContent =
            formatTime(
                audio.duration
            );

    }
);


/* SEEK */

progress.addEventListener(
    "input",
    () => {

        if (!audio.duration) {
            return;
        }


        audio.currentTime =
            (
                progress.value / 100
            ) *
            audio.duration;

    }
);


/* VOLUME */

audio.volume =
    Number(volume.value);


volume.addEventListener(
    "input",
    () => {

        audio.volume =
            Number(volume.value);

        localStorage.setItem(
            "xi_ips_music_volume",
            volume.value
        );

    }
);


/* FAVORITE */

favoriteBtn.addEventListener(
    "click",
    () => {

        const position =
            favorites.indexOf(
                currentIndex
            );


        if (position === -1) {

            favorites.push(
                currentIndex
            );

        } else {

            favorites.splice(
                position,
                1
            );

        }


        localStorage.setItem(
            "xi_ips_music_favorites",
            JSON.stringify(
                favorites
            )
        );


        updateFavoriteButton();

    }
);


/* FAVORITE UI */

function updateFavoriteButton() {

    const active =
        favorites.includes(
            currentIndex
        );


    favoriteBtn.textContent =
        active
            ? "♥"
            : "♡";


    favoriteBtn.classList.toggle(
        "active",
        active
    );

}


/* SEARCH */

searchInput.addEventListener(
    "input",
    () => {

        renderPlaylist(
            getFilteredSongs()
        );

    }
);


function getFilteredSongs() {

    const query =
        searchInput.value
            .trim()
            .toLowerCase();


    if (!query) {
        return songs;
    }


    return songs.filter(
        song =>

            song.title
                .toLowerCase()
                .includes(query)

            ||

            song.artist
                .toLowerCase()
                .includes(query)
    );

}


/* FORMAT TIME */

function formatTime(seconds) {

    if (
        !seconds ||
        Number.isNaN(seconds)
    ) {
        return "0:00";
    }


    const minutes =
        Math.floor(
            seconds / 60
        );


    const secondsLeft =
        Math.floor(
            seconds % 60
        );


    return (
        minutes +
        ":" +
        String(
            secondsLeft
        ).padStart(2, "0")
    );

}


/* ESCAPE */

function escapeHTML(value) {

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}


/* KEYBOARD */

document.addEventListener(
    "keydown",
    event => {

        if (
            event.code === "Space" &&
            document.activeElement.tagName !==
            "INPUT"
        ) {

            event.preventDefault();

            playBtn.click();

        }


        if (
            event.key === "Escape"
        ) {

            musicUI.classList.remove(
                "open"
            );

            openMusic.style.display =
                "block";

        }

    }
);


/* START */

renderPlaylist();

loadSong(
    0,
    false
);
