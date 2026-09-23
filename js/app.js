// app.js - Logika Utama XI IPS 1 Class Portal

// 1. DATA SISWA
const students = [
    "AL SILA RAMADHANI", "ALDIANSYAH PUTRA KUSUMA", "Andin Aulia Agustin", "ANDINI AULIA WIJAYA", "ANJU MAULANA LUMBAN GAUL", "Azka Fina", "David Jonathan Ketaren", "FILZAH AMARTA PUTRI HIDAYAT", "HALIMATUL JULHIJAH", "JEREMI THOMAS WARASI", "Lois Zadol Zai", "Melati Kirana Putri", "MOCH. FAJAR NURJAYADI", "MOCHAMAD RIZKI ADITYA PERMANA", "MUHAMAD ADILLAH KHOIR", "Muhamad Hairil Nur Zaman", "MUHAMAD REVAN AULIA MAKMUR", "Muhammad Azriel Daniyal", "NAZWA OKTAPIYANI", "REJEKI KURNIAWAN WARUWU", "RENO FEDRIAN", "RYAD ZABAL ARASY", "Siti Alayya Zulaikha", "SITI DARA NURHAFNI", "SITI PAUJIAH", "SYARIFFA NURIL AINI", "YADI ROSDIANSYAH"
];

// 2. DATA JADWAL PELAJARAN
const scheduleData = {
    "Senin": [
        { time: "07:00 - 08:30", subject: "Upacara & Pendalaman Agama" },
        { time: "08:30 - 10:00", subject: "Ekonomi" },
        { time: "10:15 - 11:45", subject: "Sejarah" },
        { time: "12:30 - 14:00", subject: "Sosiologi" }
    ],
    "Selasa": [
        { time: "07:00 - 08:30", subject: "Matematika" },
        { time: "08:30 - 10:00", subject: "Geografi" },
        { time: "10:15 - 11:45", subject: "Bahasa Indonesia" },
        { time: "12:30 - 14:00", subject: "Bahasa Inggris" }
    ],
    "Rabu": [
        { time: "07:00 - 08:30", subject: "Ekonomi" },
        { time: "08:30 - 10:00", subject: "Sosiologi" },
        { time: "10:15 - 11:45", subject: "Sejarah Peminatan" },
        { time: "12:30 - 14:00", subject: "Seni Budaya" }
    ],
    "Kamis": [
        { time: "07:00 - 08:30", subject: "Geografi" },
        { time: "08:30 - 10:00", subject: "Matematika" },
        { time: "10:15 - 11:45", subject: "Bahasa Inggris" },
        { time: "12:30 - 14:00", subject: "Penjasorkes" }
    ],
    "Jumat": [
        { time: "07:00 - 08:30", subject: "Pendidikan Agama" },
        { time: "08:30 - 10:00", subject: "Bahasa Indonesia" },
        { time: "10:00 - 11:30", subject: "Kewarganegaraan (PPKn)" }
    ]
};

document.addEventListener("DOMContentLoaded", () => {
    
    // --- A. RENDER DAFTAR SISWA ---
    const studentListEl = document.getElementById("studentList");
    if (studentListEl) {
        studentListEl.innerHTML = students.map((name, index) => `
            <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); padding: 16px; border-radius: 12px; display: flex; align-items: center; gap: 12px;">
                <div style="width: 36px; height: 36px; background: rgba(255,255,255,0.1); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 14px; color: #fff;">${index + 1}</div>
                <div>
                    <strong style="display: block; font-size: 15px; color: #fff;">${name}</strong>
                    <small style="color: #888;">XI IPS 1</small>
                </div>
            </div>
        `).join('');
    }

    // --- B. RENDER JADWAL PELAJARAN & TOMBOL HARI ---
    const scheduleListEl = document.getElementById("scheduleList");
    const dayButtons = document.querySelectorAll(".day-btn");

    function renderSchedule(day) {
        if (!scheduleListEl) return;
        const items = scheduleData[day] || [];
        if (items.length === 0) {
            scheduleListEl.innerHTML = `<p style="color: #777; text-align: center; padding: 20px;">Tidak ada jadwal untuk hari ${day}.</p>`;
            return;
        }
        scheduleListEl.innerHTML = items.map(item => `
            <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); padding: 16px 20px; border-radius: 12px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; flex-wrap: wrap; gap: 10px;">
                <strong style="color: #fff; font-size: 16px;">${item.subject}</strong>
                <span style="background: rgba(255,255,255,0.1); padding: 6px 12px; border-radius: 20px; font-size: 13px; color: #ccc;">${item.time}</span>
            </div>
        `).join('');
    }

    // Tampilkan jadwal default (Senin)
    renderSchedule("Senin");

    // Event listener untuk tombol ganti hari
    dayButtons.forEach(btn => {
        btn.addEventListener("click", () => {
            dayButtons.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            const day = btn.getAttribute("data-day");
            renderSchedule(day);
        });
    });

    // --- C. JAM DIGITAL & NEXT CLASS ---
    const clockEl = document.getElementById("currentTime");
    const nextClassEl = document.getElementById("nextClass");
    const nextTimeEl = document.getElementById("nextTime");

    function updateClock() {
        const now = new Date();
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');
        
        if (clockEl) {
            clockEl.textContent = `${hours}:${minutes}:${seconds}`;
        }
        if (nextClassEl && nextTimeEl) {
            nextClassEl.textContent = "Portal XI IPS 1 Aktif";
            nextTimeEl.textContent = `${hours}:${minutes} WIB`;
        }
    }
    setInterval(updateClock, 1000);
    updateClock();

    // --- D. CLASS MOMENTS (GALERI FOTO LOCALSTORAGE) ---
    const photoInput = document.getElementById("photoInput");
    const galleryEl = document.getElementById("gallery");

    let savedPhotos = JSON.parse(localStorage.getItem("classPhotos")) || [];

    function renderGallery() {
        if (!galleryEl) return;
        if (savedPhotos.length === 0) {
            galleryEl.innerHTML = `<p style="color: #777; text-align: center; grid-column: 1/-1; padding: 40px;">Belum ada foto yang diunggah. Klik "+ Tambah Foto" di pojok kanan atas.</p>`;
            return;
        }
        galleryEl.innerHTML = savedPhotos.map((photo, index) => `
            <div style="position: relative; border-radius: 12px; overflow: hidden; border: 1px solid rgba(255,255,255,0.08); background: rgba(0,0,0,0.2); aspect-ratio: 1/1;">
                <img src="${photo}" alt="Class Moment" style="width: 100%; height: 100%; object-fit: cover;">
                <button onclick="window.deletePhoto(${index})" style="position: absolute; top: 8px; right: 8px; background: rgba(255,0,0,0.8); color: white; border: none; border-radius: 50%; width: 28px; height: 28px; cursor: pointer; font-size: 12px; display: flex; align-items: center; justify-content: center;">✕</button>
            </div>
        `).join('');
    }

    if (photoInput) {
        photoInput.addEventListener("change", (e) => {
            const files = e.target.files;
            for (let file of files) {
                const reader = new FileReader();
                reader.onload = function(event) {
                    savedPhotos.push(event.target.result);
                    localStorage.setItem("classPhotos", JSON.stringify(savedPhotos));
                    renderGallery();
                };
                reader.readAsDataURL(file);
            }
        });
    }

    window.deletePhoto = function(index) {
        savedPhotos.splice(index, 1);
        localStorage.setItem("classPhotos", JSON.stringify(savedPhotos));
        renderGallery();
    };

    renderGallery();
});
