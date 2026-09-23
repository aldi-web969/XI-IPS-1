const members = [
    "AL SILA RAMADHANI",
    "ALDIYANSYAH PUTRA KUSUMA",
    "Andin Aulia Agustin",
    "ANDINI AULIA WIJAYA",
    "ANJU MAULANA LUMBAN GAUL",
    "Aska Fina",
    "David Jonathan Ketaren",
    "FILZAH AMARTA PUTRI HIDAYAT",
    "HALIMATUL JULIHAH",
    "JEREMI THOMAS WARASI",
    "Lois Zadoi Zai",
    "Melati Kirana Putri",
    "MOCH. FAJAR NURJAYADI",
    "MOCHAMAD RIZKI ADITYA PERMANA",
    "MUHAMAD ABDILAH KHOR",
    "Muhamad Hanif Nur Zaman",
    "MUHAMAD REVAN AULIA MAKMUR",
    "Muhammad Azriel Daniyal",
    "NAZWA OKTAPIYANI",
    "REJEKI KURNIAWAN WARUWU",
    "RENO FEDRIAN",
    "RYAD ZABAL ARASY",
    "Siti Alayya Zulaikha",
    "SITI DARA NURHAFNAH",
    "SITI PAUJIAH",
    "SYARIFAH NURIL AINI",
    "YADI ROSDIANSYAH"
];

const schedules = {
    "Senin": [
        ["07.40–09.00", "PJOK"],
        ["09.00–10.20", "PKN"],
        ["10.20–10.50", "Istirahat", true],
        ["10.50–12.10", "Informatika"],
        ["12.10–12.50 & 13.30–14.10", "B. Jepang"],
        ["12.50–13.30", "Istirahat", true],
        ["14.10–15.30", "PAI / Kristen"]
    ],
    "Selasa": [
        ["07.40–09.00", "Sosiologi"],
        ["09.00–10.20", "B. Jepang"],
        ["10.20–10.50", "Istirahat", true],
        ["10.50–12.10", "Seni Budaya"],
        ["12.10–12.50 & 13.30–14.10", "Ekonomi"],
        ["12.50–13.30", "Istirahat", true],
        ["14.10–14.50", "BK"],
        ["14.50–15.30", "BTQ"]
    ],
    "Rabu": [
        ["07.40–09.00", "Sosiologi"],
        ["09.00–09.40", "Matematika"],
        ["09.40–10.20 & 10.50–12.10", "B. Indonesia"],
        ["10.20–10.50", "Istirahat", true],
        ["12.10–12.50 & 13.30–14.10", "Informatika"],
        ["12.50–13.30", "Istirahat", true],
        ["14.10–15.30", "Sejarah"]
    ],
    "Kamis": [
        ["07.40–09.00", "B. Inggris"],
        ["09.00–10.20", "B. Sunda"],
        ["10.20–10.50", "Istirahat", true],
        ["10.50–12.10", "Matematika"],
        ["12.10–12.50 & 13.30–14.10", "Geografi"],
        ["12.50–13.30", "Istirahat", true],
        ["14.10–15.30", "B. Mandarin"]
    ],
    "Jumat": [
        ["07.40–09.00", "Ekonomi"],
        ["09.00–09.40 & 10.00–10.40", "Geografi"],
        ["09.40–10.00", "Istirahat", true],
        ["10.40–11.20", "Klinik Belajar"]
    ]
};

const membersGrid = document.getElementById("membersGrid");

members.forEach((name, index) => {
    const card = document.createElement("article");
    card.className = "member-card";
    card.innerHTML = `
        <div class="member-number">${String(index + 1).padStart(2, "0")}</div>
        <h3>${name}</h3>
    `;
    membersGrid.appendChild(card);
});

const scheduleGrid = document.getElementById("scheduleGrid");

Object.entries(schedules).forEach(([day, items]) => {
    const card = document.createElement("article");
    card.className = "schedule-card";

    const rows = items.map(([time, subject, isBreak]) => `
        <tr class="${isBreak ? "break-row" : ""}">
            <td>${time}</td>
            <td>${subject}</td>
        </tr>
    `).join("");

    card.innerHTML = `
        <div class="schedule-head">
            <h3>${day}</h3>
            <span>XI IPS 1</span>
        </div>
        <table class="schedule-table">
            <thead>
                <tr>
                    <th>Waktu</th>
                    <th>Pelajaran</th>
                </tr>
            </thead>
            <tbody>${rows}</tbody>
        </table>
    `;

    scheduleGrid.appendChild(card);
});

const menuToggle = document.getElementById("menuToggle");
const navMenu = document.getElementById("navMenu");

menuToggle.addEventListener("click", () => {
    const isOpen = navMenu.classList.toggle("open");
    menuToggle.setAttribute("aria-expanded", isOpen);
});

document.querySelectorAll(".nav-link").forEach(link => {
    link.addEventListener("click", () => {
        navMenu.classList.remove("open");
        menuToggle.setAttribute("aria-expanded", "false");
    });
});

const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add("show");
        }
    });
}, { threshold: 0.12 });

document.querySelectorAll(".reveal").forEach(el => revealObserver.observe(el));

const navLinks = document.querySelectorAll(".nav-link");
const sections = document.querySelectorAll("main section");

const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (!entry.isIntersecting) return;

        navLinks.forEach(link => {
            link.classList.toggle(
                "active",
                link.getAttribute("href") === `#${entry.target.id}`
            );
        });
    });
}, { rootMargin: "-35% 0px -55% 0px" });

sections.forEach(section => sectionObserver.observe(section));

document.getElementById("year").textContent = new Date().getFullYear();


/* ===== ABSENSI LOKAL + SPIN KELOMPOK ===== */
(function () {
    const attendanceName = document.getElementById("attendanceName");
    const attendanceButton = document.getElementById("attendanceButton");
    const attendanceStatus = document.getElementById("attendanceStatus");
    const attendanceList = document.getElementById("attendanceList");
    const attendanceSummary = document.getElementById("attendanceSummary");
    const attendanceDate = document.getElementById("attendanceDate");

    function getToday() {
        return new Intl.DateTimeFormat("en-CA", {
            timeZone: "Asia/Jakarta",
            year: "numeric", month: "2-digit", day: "2-digit"
        }).format(new Date());
    }

    const today = getToday();
    attendanceDate.textContent = today;

    members.forEach(function (name, index) {
        const option = document.createElement("option");
        option.value = String(index);
        option.textContent = name;
        attendanceName.appendChild(option);
    });

    function getAttendance() {
        try {
            const raw = localStorage.getItem("xi_ips1_attendance_" + today);
            return raw ? JSON.parse(raw) : {};
        } catch (e) {
            return {};
        }
    }

    function renderAttendance() {
        const data = getAttendance();
        const entries = Object.values(data).sort(function(a,b) {
            return (a.timestamp || 0) - (b.timestamp || 0);
        });

        attendanceSummary.innerHTML =
            "<strong>" + entries.length + "</strong><span>Hadir hari ini</span>";

        if (!entries.length) {
            attendanceList.innerHTML =
                '<div class="empty-state">Belum ada yang absen hari ini.</div>';
            return;
        }

        attendanceList.innerHTML = entries.map(function(item, i) {
            const time = item.timestamp
                ? new Date(item.timestamp).toLocaleTimeString("id-ID", {
                    hour: "2-digit", minute: "2-digit"
                })
                : "--:--";

            return '<div class="attendance-item">' +
                '<span class="status-dot"></span>' +
                '<div><strong>' + (i + 1) + ". " + item.name + '</strong>' +
                '<small>Hadir ' + time + ' WIB</small></div></div>';
        }).join("");
    }

    attendanceButton.addEventListener("click", function() {
        const selected = attendanceName.value;
        if (selected === "") {
            attendanceStatus.textContent = "Silakan pilih nama terlebih dahulu.";
            attendanceStatus.style.color = "#fbbf24";
            return;
        }

        const index = Number(selected);
        const key = String(index);
        const data = getAttendance();

        if (data[key]) {
            attendanceStatus.textContent =
                members[index] + " sudah melakukan absen hari ini.";
            attendanceStatus.style.color = "#fbbf24";
            return;
        }

        data[key] = {
            name: members[index],
            timestamp: Date.now()
        };

        try {
            localStorage.setItem("xi_ips1_attendance_" + today, JSON.stringify(data));
            renderAttendance();
            attendanceStatus.textContent =
                "Berhasil! " + members[index] + " tercatat hadir hari ini.";
            attendanceStatus.style.color = "#86efac";
            attendanceName.value = "";
        } catch (e) {
            attendanceStatus.textContent =
                "Browser tidak mengizinkan penyimpanan absensi.";
            attendanceStatus.style.color = "#fb7185";
        }
    });

    renderAttendance();

    /* Spin kelompok — Aurora Roulette */
    const groupCount = document.getElementById("groupCount");
    const spinButton = document.getElementById("spinButton");
    const shuffleButton = document.getElementById("shuffleButton");
    const spinStage = document.getElementById("spinStage");
    const rouletteWheel = document.getElementById("rouletteWheel");
    const wheelLabels = document.getElementById("wheelLabels");
    const spinResult = document.getElementById("spinResult");
    const drawNumber = document.getElementById("drawNumber");
    const drawName = document.getElementById("drawName");
    const drawStatus = document.getElementById("drawStatus");
    const drawProgress = document.getElementById("drawProgress");
    const drawCounter = document.getElementById("drawCounter");
    const groupsGrid = document.getElementById("groupsGrid");

    let spinOrder = shuffleInPlace(members.slice());
    let spinRotation = 0;
    let spinning = false;

    function escapeHtml(value) {
        return value.replace(/[&<>'"]/g, function(char) {
            return ({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"})[char];
        });
    }

    function renderWheelLabels() {
        wheelLabels.innerHTML = spinOrder.map(function(name, index) {
            const angle = index * (360 / spinOrder.length);
            return '<span style="--angle:' + angle + 'deg">' + escapeHtml(name.split(" ")[0]) + '</span>';
        }).join("");
    }

    function shuffleInPlace(arr) {
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr;
    }

    function showGroups(groups) {
        groupsGrid.innerHTML = groups.map(function(group, index) {
            return '<article class="group-card group-reveal" style="--delay:' + (index * 70) + 'ms">' +
                '<div class="group-top"><span class="group-index">0' + (index + 1) + '</span><div><h3>Kelompok ' + (index + 1) + '</h3><span class="group-count">' + group.length + ' anggota</span></div></div>' +
                '<div class="group-members">' + group.map(function(name, memberIndex) {
                    return '<div class="group-member"><span>' + String(memberIndex + 1).padStart(2,"0") + '</span>' + escapeHtml(name) + '</div>';
                }).join("") + '</div></article>';
        }).join("");
    }

    renderWheelLabels();

    shuffleButton.addEventListener("click", function() {
        if (spinning) return;
        shuffleInPlace(spinOrder);
        renderWheelLabels();
        rouletteWheel.classList.remove("shuffle-flash");
        void rouletteWheel.offsetWidth;
        rouletteWheel.classList.add("shuffle-flash");
        drawName.textContent = "Urutan diacak";
        drawStatus.textContent = "Siap untuk pengundian baru.";
    });

    spinButton.addEventListener("click", async function() {
        if (spinning) return;
        spinning = true;
        spinButton.disabled = true;
        shuffleButton.disabled = true;
        groupCount.disabled = true;
        groupsGrid.innerHTML = "";

        const total = Number(groupCount.value);
        const shuffled = shuffleInPlace(spinOrder.slice());
        const groups = Array.from({length: total}, function() { return []; });

        drawStatus.textContent = "Roda sedang berputar...";
        drawName.textContent = "Mengundi...";
        drawNumber.textContent = "✦";
        drawProgress.style.width = "0%";
        drawCounter.textContent = "0 / 27 siswa";
        spinResult.textContent = "GO";
        spinStage.classList.add("spinning");

        const extraTurns = 3 + Math.floor(Math.random() * 3);
        spinRotation += extraTurns * 360 + Math.floor(Math.random() * 360);
        rouletteWheel.style.transform = "rotate(" + spinRotation + "deg)";

        await new Promise(function(resolve) { setTimeout(resolve, 2400); });
        spinStage.classList.remove("spinning");

        for (let i = 0; i < shuffled.length; i++) {
            const name = shuffled[i];
            groups[i % total].push(name);
            drawNumber.textContent = String(i + 1).padStart(2, "0");
            drawName.textContent = name;
            drawStatus.innerHTML = "Masuk ke <b>Kelompok " + ((i % total) + 1) + "</b>";
            drawProgress.style.width = ((i + 1) / shuffled.length * 100) + "%";
            drawCounter.textContent = (i + 1) + " / 27 siswa";
            spinResult.textContent = String(i + 1).padStart(2, "0");
            await new Promise(function(resolve) { setTimeout(resolve, 105); });
        }

        showGroups(groups);
        drawName.textContent = "Pembagian selesai!";
        drawStatus.innerHTML = "27 siswa terbagi merata ke <b>" + total + " kelompok</b>.";
        spinResult.textContent = "✓";
        spinButton.textContent = "🔄 SPIN LAGI";
        spinButton.disabled = false;
        shuffleButton.disabled = false;
        groupCount.disabled = false;
        spinning = false;
    });
})();
