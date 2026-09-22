/* =========================================
   DATA SISWA
========================================= */

const students = [
    "AL SILA RAMADHANI",
    "ALDIANSYAH PUTRA KUSUMA",
    "Andin Aulia Agustin",
    "ANDINI AULIA WIJAYA",
    "ANJU MAULANA LUMBAN GAUL",
    "Azka Fina",
    "David Jonathan Ketaren",
    "FILZAH AMARTA PUTRI HIDAYAT",
    "HALIMATUL JULHIJAH",
    "JEREMI THOMAS WARASI",
    "Lois Zadol Zai",
    "Melati Kirana Putri",
    "MOCH. FAJAR NURJAYADI",
    "MOCHAMAD RIZKI ADITYA PERMANA",
    "MUHAMAD ADILLAH KHOIR",
    "Muhamad Hairil Nur Zaman",
    "MUHAMAD REVAN AULIA MAKMUR",
    "Muhammad Azriel Daniyal",
    "NAZWA OKTAPIYANI",
    "REJEKI KURNIAWAN WARUWU",
    "RENO FEDRIAN",
    "RYAD ZABAL ARASY",
    "Siti Alayya Zulaikha",
    "SITI DARA NURHAFNI",
    "SITI PAUJIAH",
    "SYARIFFA NURIL AINI",
    "YADI ROSDIANSYAH"
];


/* =========================================
   JADWAL
========================================= */

const schedules = {

    Senin: [
        ["PJOK", "07.40–09.00"],
        ["PKN", "09.00–10.20"],
        ["Istirahat", "10.20–10.50"],
        ["Informatika", "10.50–12.10"],
        ["B. Jepang", "12.10–12.50"],
        ["Istirahat", "12.50–13.30"],
        ["B. Jepang", "13.30–14.10"],
        ["PAI / Kristen", "14.10–15.30"]
    ],

    Selasa: [
        ["Sosiologi", "07.40–09.00"],
        ["B. Jepang", "09.00–10.20"],
        ["Istirahat", "10.20–10.50"],
        ["Seni Budaya", "10.50–12.10"],
        ["Ekonomi", "12.10–12.50"],
        ["Istirahat", "12.50–13.30"],
        ["Ekonomi", "13.30–14.10"],
        ["BK", "14.10–14.50"],
        ["BTQ", "14.50–15.30"]
    ],

    Rabu: [
        ["Sosiologi", "07.40–09.00"],
        ["Matematika", "09.00–09.40"],
        ["B. Indonesia", "09.40–10.20"],
        ["Istirahat", "10.20–10.50"],
        ["B. Indonesia", "10.50–12.10"],
        ["Informatika", "12.10–12.50"],
        ["Istirahat", "12.50–13.30"],
        ["Informatika", "13.30–14.10"],
        ["Sejarah", "14.10–15.30"]
    ],

    Kamis: [
        ["B. Inggris", "07.40–09.00"],
        ["B. Sunda", "09.00–10.20"],
        ["Istirahat", "10.20–10.50"],
        ["Matematika", "10.50–12.10"],
        ["Geografi", "12.10–12.50"],
        ["Istirahat", "12.50–13.30"],
        ["Geografi", "13.30–14.10"],
        ["B. Mandarin", "14.10–15.30"]
    ],

    Jumat: [
        ["Ekonomi", "07.40–09.00"],
        ["Geografi", "09.00–09.40"],
        ["Istirahat", "09.40–10.00"],
        ["Geografi", "10.00–10.40"],
        ["Klinik Belajar", "10.40–11.20"]
    ]
};


/* =========================================
   LOADING
========================================= */

window.addEventListener("load", () => {

    setTimeout(() => {

        const loader = document.getElementById("loader");

        if (loader) {
            loader.classList.add("hide");
        }

    }, 1500);

});


/* =========================================
   TAMPILKAN SISWA
========================================= */

const studentList = document.getElementById("studentList");

students.forEach((name, index) => {

    const card = document.createElement("div");

    card.className = "student";

    card.innerHTML = `
        <div class="student-number">
            ${String(index + 1).padStart(2, "0")}
        </div>

        <div class="student-name">
            ${name}
        </div>
    `;

    studentList.appendChild(card);

});


/* =========================================
   JADWAL
========================================= */

const scheduleList = document.getElementById("scheduleList");
const dayButtons = document.querySelectorAll(".day-btn");

function showSchedule(day) {

    scheduleList.innerHTML = "";

    schedules[day].forEach(item => {

        const div = document.createElement("div");

        div.className = "schedule-item";

        div.innerHTML = `
            <strong>${item[0]}</strong>
            <span>${item[1]}</span>
        `;

        scheduleList.appendChild(div);

    });
}

showSchedule("Senin");


dayButtons.forEach(button => {

    button.addEventListener("click", () => {

        dayButtons.forEach(btn =>
            btn.classList.remove("active")
        );

        button.classList.add("active");

        showSchedule(button.dataset.day);

    });

});


/* =========================================
   JAM DIGITAL
========================================= */

function updateClock() {

    const now = new Date();

    const time =
        now.toLocaleTimeString("id-ID", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit"
        });

    document.getElementById("currentTime").textContent = time;

}

updateClock();

setInterval(updateClock, 1000);


/* =========================================
   CLASS MOMENTS
========================================= */

const photoInput = document.getElementById("photoInput");
const gallery = document.getElementById("gallery");

let photos =
    JSON.parse(
        localStorage.getItem("classMomentsPhotos")
    ) || [];


function renderGallery() {

    gallery.innerHTML = "";

    if (photos.length === 0) {

        gallery.innerHTML = `
            <div class="gallery-empty">
                Belum ada foto Class Moments.
                <br>
                Klik "Tambah Foto" untuk menambahkan foto.
            </div>
        `;

        return;
    }

    photos.forEach((photo, index) => {

        const card = document.createElement("div");

        card.className = "photo-card";

        card.innerHTML = `

            <img src="${photo}" alt="Class Moment">

            <button
                class="delete-photo"
                data-index="${index}"
                title="Hapus foto"
            >
                ×
            </button>

        `;

        gallery.appendChild(card);

    });

}


photoInput.addEventListener("change", event => {

    const files = [...event.target.files];

    files.forEach(file => {

        const reader = new FileReader();

        reader.onload = e => {

            photos.push(e.target.result);

            localStorage.setItem(
                "classMomentsPhotos",
                JSON.stringify(photos)
            );

            renderGallery();

        };

        reader.readAsDataURL(file);

    });

    photoInput.value = "";

});


gallery.addEventListener("click", event => {

    const button =
        event.target.closest(".delete-photo");

    if (!button) return;

    const index =
        Number(button.dataset.index);

    photos.splice(index, 1);

    localStorage.setItem(
        "classMomentsPhotos",
        JSON.stringify(photos)
    );

    renderGallery();

});


renderGallery();


/* =========================================
   NEXT CLASS
========================================= */

const weeklySchedule = {

    1: schedules.Senin,
    2: schedules.Selasa,
    3: schedules.Rabu,
    4: schedules.Kamis,
    5: schedules.Jumat
};


function timeToMinutes(time) {

    const clean = time.replace(".", ":");

    const [hour, minute] =
        clean.split(":").map(Number);

    return hour * 60 + minute;

}


function updateNextClass() {

    const now = new Date();

    const day = now.getDay();

    const currentMinutes =
        now.getHours() * 60 + now.getMinutes();

    const nextClass =
        document.getElementById("nextClass");

    const nextTime =
        document.getElementById("nextTime");


    if (day === 0 || day === 6) {

        nextClass.textContent =
            "Tidak ada jadwal";

        nextTime.textContent =
            "Hari libur";

        return;
    }


    const today =
        weeklySchedule[day];

    if (!today) return;


    for (const lesson of today) {

        const start =
            lesson[1].split("–")[0];

        const startMinutes =
            timeToMinutes(start);

        if (
            lesson[0] !== "Istirahat" &&
            currentMinutes < startMinutes
        ) {

            nextClass.textContent =
                lesson[0];

            nextTime.textContent =
                lesson[1];

            return;
        }

    }


    nextClass.textContent =
        "Selesai";

    nextTime.textContent =
        "Tidak ada pelajaran lagi";

}


updateNextClass();

setInterval(updateNextClass, 30000);
