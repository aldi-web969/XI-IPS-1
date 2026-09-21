document.addEventListener('DOMContentLoaded', () => {
    const $ = (selector, root = document) => root.querySelector(selector);
    const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

    // ------------------------------------------------------------
    // Loader
    // ------------------------------------------------------------
    const loader = $('#loader');
    const progress = $('#loaderProgress');
    const loadingText = $('#loadingText');

    let progressValue = 0;
    const loaderTimer = setInterval(() => {
        progressValue = Math.min(100, progressValue + 2);
        if (progress) progress.style.width = `${progressValue}%`;
        if (loadingText) loadingText.textContent = `${progressValue}%`;

        if (progressValue >= 100) {
            clearInterval(loaderTimer);
            setTimeout(() => loader?.classList.add('hide'), 350);
        }
    }, 30);

    // ------------------------------------------------------------
    // Background particles
    // ------------------------------------------------------------
    const canvas = $('#particles');
    if (canvas) {
        const ctx = canvas.getContext('2d');
        let particles = [];

        const resize = () => {
            canvas.width = innerWidth;
            canvas.height = innerHeight;
        };

        const createParticles = () => {
            particles = [];
            const count = Math.min(70, Math.floor(innerWidth / 15));

            for (let i = 0; i < count; i += 1) {
                particles.push({
                    x: Math.random() * canvas.width,
                    y: Math.random() * canvas.height,
                    size: Math.random() * 1.7 + 0.4,
                    dx: (Math.random() - 0.5) * 0.25,
                    dy: (Math.random() - 0.5) * 0.25,
                    opacity: Math.random() * 0.45 + 0.08
                });
            }
        };

        resize();
        createParticles();
        addEventListener('resize', () => {
            resize();
            createParticles();
        });

        const draw = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            particles.forEach((particle) => {
                particle.x += particle.dx;
                particle.y += particle.dy;

                if (particle.x < 0) particle.x = canvas.width;
                if (particle.x > canvas.width) particle.x = 0;
                if (particle.y < 0) particle.y = canvas.height;
                if (particle.y > canvas.height) particle.y = 0;

                ctx.beginPath();
                ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(140,255,152,${particle.opacity})`;
                ctx.fill();
            });

            requestAnimationFrame(draw);
        };

        draw();
    }

    // ------------------------------------------------------------
    // Navigation
    // ------------------------------------------------------------
    const nav = $('#siteNav');
    const menuButton = $('#menuButton');

    menuButton?.addEventListener('click', () => nav?.classList.toggle('active'));
    $$('#siteNav a').forEach((link) => {
        link.addEventListener('click', () => nav?.classList.remove('active'));
    });

    document.addEventListener('click', (event) => {
        if (
            nav?.classList.contains('active') &&
            !nav.contains(event.target) &&
            !menuButton?.contains(event.target)
        ) {
            nav.classList.remove('active');
        }
    });

    // ------------------------------------------------------------
    // Theme
    // ------------------------------------------------------------
    const themeButton = $('#themeButton');
    const savedTheme = localStorage.getItem('xiips-theme');

    const setThemeIcon = () => {
        if (!themeButton) return;
        themeButton.innerHTML = document.body.classList.contains('light')
            ? '<svg class="pro-icon" aria-hidden="true"><use href="#icon-moon"></use></svg>'
            : '<svg class="pro-icon" aria-hidden="true"><use href="#icon-sun"></use></svg>';
    };

    if (savedTheme === 'light') document.body.classList.add('light');
    setThemeIcon();

    themeButton?.addEventListener('click', () => {
        document.body.classList.toggle('light');
        const light = document.body.classList.contains('light');
        localStorage.setItem('xiips-theme', light ? 'light' : 'dark');
        setThemeIcon();
        toast('Tema', light ? 'Mode terang aktif' : 'Mode gelap aktif', 'theme');
    });

    // ------------------------------------------------------------
    // Counters & reveal animations
    // ------------------------------------------------------------
    const counters = $$('[data-counter]');

    if ('IntersectionObserver' in window) {
        const counterObserver = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) return;

                const element = entry.target;
                const target = Number(element.dataset.counter || 0);
                let current = 0;
                const step = Math.max(1, Math.ceil(target / 40));

                const timer = setInterval(() => {
                    current = Math.min(target, current + step);
                    element.textContent = current;
                    if (current >= target) clearInterval(timer);
                }, 28);

                counterObserver.unobserve(element);
            });
        }, { threshold: 0.5 });

        counters.forEach((element) => counterObserver.observe(element));
    } else {
        counters.forEach((element) => {
            element.textContent = element.dataset.counter;
        });
    }

    const reveals = $$('.reveal');
    if ('IntersectionObserver' in window) {
        const revealObserver = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) return;
                entry.target.classList.add('visible');
                revealObserver.unobserve(entry.target);
            });
        }, { threshold: 0.12 });

        reveals.forEach((element) => revealObserver.observe(element));
    } else {
        reveals.forEach((element) => element.classList.add('visible'));
    }

    // ------------------------------------------------------------
    // Student search / filter
    // ------------------------------------------------------------
    const search = $('#studentSearch');
    const filter = $('#studentFilter');
    const students = $$('.student-card');

    const applyStudentFilter = () => {
        const query = (search?.value || '').toLowerCase().trim();
        const gender = filter?.value || 'all';

        students.forEach((student) => {
            const matchesName = student.textContent.toLowerCase().includes(query);
            const matchesGender = gender === 'all' || student.dataset.gender === gender;
            student.style.display = matchesName && matchesGender ? 'flex' : 'none';
        });
    };

    search?.addEventListener('input', applyStudentFilter);
    filter?.addEventListener('change', applyStudentFilter);

    // ------------------------------------------------------------
    // Tasks
    // ------------------------------------------------------------
    $$('.done-button').forEach((button) => {
        button.addEventListener('click', () => {
            const card = button.closest('.task-card');
            card?.classList.toggle('completed');
            const done = card?.classList.contains('completed');
            button.textContent = done ? '✓' : '○';
            toast('Tugas', done ? 'Tugas ditandai selesai' : 'Tugas dibuka kembali', 'task');
        });
    });

    // ------------------------------------------------------------
    // Attendance
    // ------------------------------------------------------------
    $$('.attendance-button').forEach((button) => {
        button.addEventListener('click', () => {
            const card = button.closest('.student-card');
            if (!card) return;

            const present = card.classList.toggle('present');
            button.textContent = present ? 'Hadir ✓' : 'Hadir';
            toast('Absensi', present ? 'Siswa ditandai hadir' : 'Status kehadiran dibatalkan', 'person');
        });
    });

    // ------------------------------------------------------------
    // Gallery modal
    // ------------------------------------------------------------
    const modal = $('#galleryModal');
    const modalTitle = $('#modalTitle');
    const modalIcon = $('#modalIcon');
    const galleryIcons = {
        camera: 'camera',
        school: 'school',
        party: 'party',
        handshake: 'handshake'
    };

    const closeModal = () => {
        modal?.classList.remove('active');
        modal?.setAttribute('aria-hidden', 'true');
    };

    $$('.gallery-card').forEach((card) => {
        card.addEventListener('click', () => {
            if (!modal) return;

            modalTitle.textContent = card.dataset.title || 'Galeri XI IPS 1';
            const iconId = galleryIcons[card.dataset.icon] || 'camera';
            modalIcon.innerHTML = `<svg class="pro-icon" aria-hidden="true"><use href="#icon-${iconId}"></use></svg>`;
            modal.classList.add('active');
            modal.setAttribute('aria-hidden', 'false');
        });
    });

    $('#modalClose')?.addEventListener('click', closeModal);
    modal?.addEventListener('click', (event) => {
        if (event.target === modal) closeModal();
    });
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') closeModal();
    });

    // ------------------------------------------------------------
    // Next class — mengikuti jam jadwal XI IPS 1
    // ------------------------------------------------------------
    const nextClassName = $('#nextClassName');
    const nextClassTime = $('#nextClassTime');

    const classSchedule = {
        1: [
            ['PJOK', '07:40', '09:00'],
            ['PKN', '09:00', '10:20'],
            ['Informatika', '10:50', '12:10'],
            ['B. Jepang', '12:10', '12:50'],
            ['B. Jepang', '13:30', '14:10'],
            ['PAI / Kristen', '14:10', '15:30']
        ],
        2: [
            ['Sosiologi', '07:40', '09:00'],
            ['B. Jepang', '09:00', '10:20'],
            ['Seni Budaya', '10:50', '12:10'],
            ['Ekonomi', '12:10', '12:50'],
            ['Ekonomi', '13:30', '14:10'],
            ['BK', '14:10', '14:50'],
            ['BTQ', '14:50', '15:30']
        ],
        3: [
            ['Sosiologi', '07:40', '09:00'],
            ['Matematika', '09:00', '09:40'],
            ['B. Indonesia', '09:40', '10:20'],
            ['B. Indonesia', '10:50', '12:10'],
            ['Informatika', '12:10', '12:50'],
            ['Informatika', '13:30', '14:10'],
            ['Sejarah', '14:10', '15:30']
        ],
        4: [
            ['B. Inggris', '07:40', '09:00'],
            ['B. Sunda', '09:00', '10:20'],
            ['Matematika', '10:50', '12:10'],
            ['Geografi', '12:10', '12:50'],
            ['Geografi', '13:30', '14:10'],
            ['B. Mandarin', '14:10', '15:30']
        ],
        5: [
            ['Ekonomi', '07:40', '09:00'],
            ['Geografi', '09:00', '09:40'],
            ['Geografi', '10:00', '10:40'],
            ['Klinik Belajar', '10:40', '11:20']
        ]
    };

    const toMinutes = (time) => {
        const [hours, minutes] = time.split(':').map(Number);
        return hours * 60 + minutes;
    };

    const updateNextClass = () => {
        if (!nextClassName) return;

        const now = new Date();
        const day = now.getDay();
        const current = now.getHours() * 60 + now.getMinutes();
        const today = classSchedule[day] || [];
        const upcoming = today.find((item) => current < toMinutes(item[1]));

        if (!today.length) {
            nextClassName.textContent = 'Tidak ada jadwal';
            if (nextClassTime) {
                nextClassTime.textContent = day === 0 || day === 6
                    ? 'Sabtu/Minggu'
                    : 'Jadwal belum tersedia';
            }
            return;
        }

        if (!upcoming) {
            nextClassName.textContent = 'Selesai';
            if (nextClassTime) nextClassTime.textContent = 'Tidak ada pelajaran lagi hari ini';
            return;
        }

        nextClassName.textContent = upcoming[0];
        if (nextClassTime) nextClassTime.textContent = `${upcoming[1]}–${upcoming[2]}`;
    };

    updateNextClass();
    setInterval(updateNextClass, 30000);

    // ------------------------------------------------------------
    // Spotify-style local music player with playlist/search/shuffle/repeat
    const musicShortcut=$('#musicButton'),audio=$('#backgroundMusic'),musicPlayer=$('#musicPlayer');
    const musicPlay=$('#musicPlay'),musicPrev=$('#musicPrev'),musicNext=$('#musicNext'),musicMute=$('#musicMute');
    const musicProgress=$('#musicProgress'),musicVolume=$('#musicVolume'),musicCurrent=$('#musicCurrent'),musicDuration=$('#musicDuration');
    const musicTitle=$('#musicTitle'),musicArtist=$('#musicArtist'),musicPlaylist=$('#musicPlaylist'),musicPlaylistToggle=$('#musicPlaylistToggle');
    const musicSearch=$('#musicSearch'),musicShuffle=$('#musicShuffle'),musicRepeat=$('#musicRepeat'),musicTrackCount=$('#musicTrackCount');
    const tracks=[
      {title:'Night Study',artist:'XI IPS 1 • Local Instrumental',src:'assets/audio/night-study.mp3'},
      {title:'Green Focus',artist:'XI IPS 1 • Local Instrumental',src:'assets/audio/green-focus.mp3'}
    ];
    let currentTrack=0,lastVolume=Number(musicVolume?.value||.65),isShuffle=false,isRepeat=false;
    const formatTime=s=>Number.isFinite(s)?`${Math.floor(s/60)}:${Math.floor(s%60).toString().padStart(2,'0')}`:'0:00';
    const setButtonIcon=(b,i,l)=>{if(!b)return;b.innerHTML=`<svg class="pro-icon" aria-hidden="true"><use href="#icon-${i}"></use></svg>`;b.setAttribute('aria-label',l)};
    const renderPlaylist=(filter='')=>{
      if(!musicPlaylist)return; const q=filter.trim().toLowerCase();
      const visible=tracks.map((track,index)=>({track,index})).filter(x=>`${x.track.title} ${x.track.artist}`.toLowerCase().includes(q));
      musicPlaylist.innerHTML=visible.length?visible.map(({track,index})=>`<button class="music-track ${index===currentTrack?'is-active':''}" data-track-index="${index}" type="button"><span class="music-track__number">${String(index+1).padStart(2,'0')}</span><span class="music-track__icon"><svg class="pro-icon"><use href="#icon-music"></use></svg></span><span class="music-track__info"><strong>${track.title}</strong><small>${track.artist}</small></span><span class="music-track__state">${index===currentTrack?(audio&&!audio.paused?'PLAYING':'READY'):''}</span></button>`).join(''):'<div class="music-empty">Lagu tidak ditemukan.</div>';
      $$('.music-track').forEach(b=>b.addEventListener('click',()=>{currentTrack=Number(b.dataset.trackIndex);renderTrack();playMusic()}));
      if(musicTrackCount)musicTrackCount.textContent=`${currentTrack+1} / ${tracks.length}`;
    };
    const renderTrack=()=>{
      if(!audio||!tracks.length)return;const t=tracks[currentTrack];audio.src=t.src;audio.load();
      if(musicTitle)musicTitle.textContent=t.title;if(musicArtist)musicArtist.textContent=t.artist;
      if(musicCurrent)musicCurrent.textContent='0:00';if(musicDuration)musicDuration.textContent='0:00';if(musicProgress)musicProgress.value=0;
      renderPlaylist(musicSearch?.value||'');
    };
    const updatePlayerState=()=>{const playing=Boolean(audio&&!audio.paused&&!audio.ended);setButtonIcon(musicPlay,playing?'pause':'play',playing?'Jeda musik':'Putar musik');setButtonIcon(musicShortcut,playing?'pause':'play',playing?'Jeda musik':'Putar musik');musicPlayer?.classList.toggle('is-playing',playing);renderPlaylist(musicSearch?.value||'')};
    const playMusic=async()=>{if(!audio)return;try{await audio.play();musicPlayer?.classList.add('is-open')}catch{toast('Musik','File audio belum tersedia atau browser menunggu interaksi pengguna.','music')}updatePlayerState()};
    const pauseMusic=()=>{audio?.pause();updatePlayerState()};
    const toggleMusic=()=>{if(!audio)return;audio.paused?playMusic():pauseMusic()};
    const changeTrack=d=>{if(!tracks.length)return;if(isRepeat&&d>0){audio.currentTime=0;playMusic();return}if(isShuffle&&tracks.length>1){let n=currentTrack;while(n===currentTrack)n=Math.floor(Math.random()*tracks.length);currentTrack=n}else currentTrack=(currentTrack+d+tracks.length)%tracks.length;renderTrack();playMusic()};
    musicPlay?.addEventListener('click',toggleMusic);musicShortcut?.addEventListener('click',toggleMusic);musicPrev?.addEventListener('click',()=>changeTrack(-1));musicNext?.addEventListener('click',()=>changeTrack(1));
    musicPlaylistToggle?.addEventListener('click',()=>{musicPlayer?.classList.toggle('playlist-open');musicPlayer?.classList.add('is-open')});
    musicSearch?.addEventListener('input',()=>renderPlaylist(musicSearch.value));
    musicShuffle?.addEventListener('click',()=>{isShuffle=!isShuffle;musicShuffle.classList.toggle('is-active',isShuffle);toast('Playlist',isShuffle?'Mode acak aktif':'Mode acak nonaktif','music')});
    musicRepeat?.addEventListener('click',()=>{isRepeat=!isRepeat;musicRepeat.classList.toggle('is-active',isRepeat);toast('Playlist',isRepeat?'Ulangi lagu aktif':'Ulangi lagu nonaktif','music')});
    musicMute?.addEventListener('click',()=>{if(!audio)return;if(audio.volume>0){lastVolume=audio.volume;audio.volume=0;if(musicVolume)musicVolume.value=0;setButtonIcon(musicMute,'volume-off','Nyalakan suara')}else{audio.volume=lastVolume||.65;if(musicVolume)musicVolume.value=audio.volume;setButtonIcon(musicMute,'volume','Matikan suara')}});
    musicVolume?.addEventListener('input',()=>{if(!audio)return;audio.volume=Number(musicVolume.value);if(audio.volume>0){lastVolume=audio.volume;setButtonIcon(musicMute,'volume','Matikan suara')}else setButtonIcon(musicMute,'volume-off','Nyalakan suara')});
    musicProgress?.addEventListener('input',()=>{if(audio&&Number.isFinite(audio.duration))audio.currentTime=Number(musicProgress.value)/100*audio.duration});
    audio?.addEventListener('loadedmetadata',()=>{if(musicDuration)musicDuration.textContent=formatTime(audio.duration)});
    audio?.addEventListener('timeupdate',()=>{if(!audio||!Number.isFinite(audio.duration))return;musicProgress.value=audio.currentTime/audio.duration*100;musicCurrent.textContent=formatTime(audio.currentTime);musicDuration.textContent=formatTime(audio.duration)});
    audio?.addEventListener('ended',()=>changeTrack(1));audio?.addEventListener('play',()=>{musicPlayer?.classList.add('is-playing');updatePlayerState()});audio?.addEventListener('pause',()=>{musicPlayer?.classList.remove('is-playing');updatePlayerState()});
    if(audio)audio.volume=lastVolume;renderTrack();updatePlayerState();

    // ------------------------------------------------------------
    // Spotify OAuth login modal (Authorization Code + PKCE)
    // ------------------------------------------------------------
    const spotifyLoginButton = $('#spotifyLoginButton');
    const spotifyLoginModal = $('#spotifyLoginModal');
    const spotifyLoginClose = $('#spotifyLoginClose');
    const spotifyLoginOptions = $$('.spotify-login-option');

    const base64UrlEncode = (bytes) => {
        let binary = '';
        bytes.forEach((byte) => binary += String.fromCharCode(byte));
        return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
    };

    const createCodeChallenge = async (verifier) => {
        const data = new TextEncoder().encode(verifier);
        const digest = await crypto.subtle.digest('SHA-256', data);
        return base64UrlEncode(new Uint8Array(digest));
    };

    const randomString = (length = 64) => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
        const values = new Uint8Array(length);
        crypto.getRandomValues(values);
        return [...values].map((value) => chars[value % chars.length]).join('');
    };

    const openSpotifyLogin = () => {
        spotifyLoginModal?.classList.add('active');
        spotifyLoginModal?.setAttribute('aria-hidden', 'false');
    };

    const closeSpotifyLogin = () => {
        spotifyLoginModal?.classList.remove('active');
        spotifyLoginModal?.setAttribute('aria-hidden', 'true');
    };

    spotifyLoginButton?.addEventListener('click', openSpotifyLogin);
    spotifyLoginClose?.addEventListener('click', closeSpotifyLogin);
    spotifyLoginModal?.addEventListener('click', (event) => {
        if (event.target === spotifyLoginModal) closeSpotifyLogin();
    });

    const startSpotifyOAuth = async (method) => {
        const config = window.SPOTIFY_CONFIG || {};
        if (!config.clientId || config.clientId.includes('PASTE_YOUR')) {
            closeSpotifyLogin();
            toast('Spotify', 'Masukkan Client ID Spotify di js/spotify-config.js terlebih dahulu.', 'music');
            return;
        }

        if (!window.crypto?.subtle) {
            toast('Spotify', 'OAuth membutuhkan HTTPS atau localhost/127.0.0.1.', 'info');
            return;
        }

        const verifier = randomString(64);
        const challenge = await createCodeChallenge(verifier);
        const state = randomString(32);
        sessionStorage.setItem('spotify_code_verifier', verifier);
        sessionStorage.setItem('spotify_state', state);
        sessionStorage.setItem('spotify_login_method', method);

        const params = new URLSearchParams({
            client_id: config.clientId,
            response_type: 'code',
            redirect_uri: config.redirectUri,
            code_challenge_method: 'S256',
            code_challenge: challenge,
            state
        });
        window.location.href = `https://accounts.spotify.com/authorize?${params.toString()}`;
    };

    spotifyLoginOptions.forEach((button) => {
        button.addEventListener('click', () => startSpotifyOAuth(button.dataset.loginMethod || 'spotify'));
    });

    // Handle the OAuth callback without ever asking the site for a Spotify password.
    const spotifyParams = new URLSearchParams(window.location.search);
    const spotifyCode = spotifyParams.get('code');
    const spotifyState = spotifyParams.get('state');
    const spotifyError = spotifyParams.get('error');

    if (spotifyError) {
        history.replaceState({}, document.title, window.location.pathname + window.location.hash);
        toast('Spotify', 'Login Spotify dibatalkan atau tidak berhasil.', 'info');
    }

    if (spotifyCode && spotifyState) {
        const savedState = sessionStorage.getItem('spotify_state');
        const verifier = sessionStorage.getItem('spotify_code_verifier');
        const config = window.SPOTIFY_CONFIG || {};

        if (savedState === spotifyState && verifier && config.clientId) {
            fetch('https://accounts.spotify.com/api/token', {
                method: 'POST',
                headers: {'Content-Type': 'application/x-www-form-urlencoded'},
                body: new URLSearchParams({
                    client_id: config.clientId,
                    grant_type: 'authorization_code',
                    code: spotifyCode,
                    redirect_uri: config.redirectUri,
                    code_verifier: verifier
                })
            })
                .then((response) => response.json())
                .then((token) => {
                    if (!token.access_token) throw new Error('Spotify token gagal');
                    sessionStorage.setItem('spotify_access_token', token.access_token);
                    if (token.expires_in) sessionStorage.setItem('spotify_token_expires', String(Date.now() + token.expires_in * 1000));
                    const method = sessionStorage.getItem('spotify_login_method') || 'spotify';
                    const methodNames = {spotify: 'Spotify', google: 'Google', phone: 'nomor telepon', email: 'email'};
                    toast('Spotify', `Login berhasil melalui ${methodNames[method] || 'Spotify'}.`, 'music');
                })
                .catch(() => toast('Spotify', 'Gagal menyelesaikan login Spotify.', 'info'))
                .finally(() => {
                    sessionStorage.removeItem('spotify_code_verifier');
                    sessionStorage.removeItem('spotify_state');
                    sessionStorage.removeItem('spotify_login_method');
                    history.replaceState({}, document.title, window.location.pathname + window.location.hash);
                });
        }
    }

    // ------------------------------------------------------------
    // Cinematic cursor glow + subtle 3D tilt
    // ------------------------------------------------------------
    const cursorLight = $('#cursorLight');
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (cursorLight && !reduceMotion && window.matchMedia('(pointer:fine)').matches) {
        let tx = innerWidth / 2, ty = innerHeight / 2, cx = tx, cy = ty;
        addEventListener('pointermove', (event) => {
            tx = event.clientX; ty = event.clientY;
            cursorLight.classList.add('is-visible');
        });
        addEventListener('pointerleave', () => cursorLight.classList.remove('is-visible'));
        const moveLight = () => {
            cx += (tx - cx) * .14; cy += (ty - cy) * .14;
            cursorLight.style.transform = `translate3d(${cx}px,${cy}px,0) translate(-50%,-50%)`;
            requestAnimationFrame(moveLight);
        };
        moveLight();

        const tiltItems = $$('.glass-card, .gallery-card, .student-card, .schedule-card, .stat-card');
        tiltItems.forEach((card) => {
            card.addEventListener('pointermove', (event) => {
                if (window.innerWidth < 800) return;
                const rect = card.getBoundingClientRect();
                const x = (event.clientX - rect.left) / rect.width - .5;
                const y = (event.clientY - rect.top) / rect.height - .5;
                card.style.transform = `perspective(900px) rotateX(${(-y * 4).toFixed(2)}deg) rotateY(${(x * 5).toFixed(2)}deg) translateY(-3px)`;
            });
            card.addEventListener('pointerleave', () => { card.style.transform = ''; });
        });
    }

    // ------------------------------------------------------------
    // Announcement
    // ------------------------------------------------------------
    $('.announcement-button')?.addEventListener('click', () => {
        toast('Pengumuman', 'Selamat datang di Class Portal XI IPS 1', 'info');
    });

    // ------------------------------------------------------------
    // Toast helper
    // ------------------------------------------------------------
    function toast(title, message, icon = 'spark') {
        const element = $('#toast');
        if (!element) return;

        const iconMap = {
            music: 'music',
            person: 'person',
            task: 'book',
            info: 'spark',
            theme: 'sun',
            spark: 'spark'
        };
        const iconName = iconMap[icon] || 'spark';

        const iconHolder = element.querySelector('span');
        if (iconHolder) {
            iconHolder.innerHTML = `<svg class="pro-icon" aria-hidden="true"><use href="#icon-${iconName}"></use></svg>`;
        }
        element.querySelector('strong').textContent = title;
        element.querySelector('p').textContent = message;
        element.classList.add('active');

        clearTimeout(window.__toastTimer);
        window.__toastTimer = setTimeout(() => element.classList.remove('active'), 3000);
    }
});

/* =========================================
   MUSIC PLAYER OPEN / CLOSE
========================================= */

const musicButton = document.getElementById("musicButton");
const musicPlayer = document.getElementById("musicPlayer");

if (musicButton && musicPlayer) {

    musicButton.addEventListener("click", () => {

        const isOpen = musicPlayer.classList.toggle("is-open");

        musicButton.classList.toggle("is-active", isOpen);

        musicButton.setAttribute(
            "aria-label",
            isOpen ? "Tutup pemutar musik" : "Buka pemutar musik"
        );

    });

}
