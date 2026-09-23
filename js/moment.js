// Daftar momen kelas yang bisa dilihat oleh SEMUA pengunjung web
const classMoments = [
    {
        image: "https://asset.tribunnews.com/DcFN-E_UP1hyE5K10JKlvhcwJgQ=/1200x675/filters:upscale():quality(30):format(webp):focal(0.5x0.5:0.5x0.5)/pontianak/foto/bank/originals/Macam-Macam-Lomba-Class-Meeting-Online-yang-Cocok-Dilaksanakan-oleh-Sekolah.jpg",
        caption: "Kumpul Pertama Kelas XI IPS 1"
    },
    {
        image: "https://cdn1-production-images-kly.akamaized.net/LX68zB1JBAQDOIwdkprKBX8UWq0=/1200x675/smart/filters:quality(75):strip_icc():format(jpeg)/kly-media-production/medias/4465099/original/045650900_1686708687-ed-us-_y4FqRhxkR8-unsplash.jpg",
        caption: "Kegiatan Olahraga Bersama"
    }
    // Kamu bisa terus tambah di sini dan commit ke GitHub
];

const momentsGrid = document.getElementById('momentsGrid');

function renderPublicMoments() {
    momentsGrid.innerHTML = '';

    if (classMoments.length === 0) {
        momentsGrid.innerHTML = `<p style="color: gray; grid-column: 1/-1;">Belum ada dokumentasi foto.</p>`;
        return;
    }

    classMoments.forEach((moment) => {
        const card = document.createElement('div');
        card.style.cssText = "background: rgba(255,255,255,0.05); border-radius: 12px; overflow: hidden; border: 1px solid rgba(255,255,255,0.1); padding: 10px;";
        
        card.innerHTML = `
            <img src="${moment.image}" alt="Moment Kelas" style="width: 100%; height: 180px; object-fit: cover; border-radius: 8px; margin-bottom: 10px;">
            <p style="color: white; font-weight: 500; margin-bottom: 5px; font-size: 14px;">${moment.caption}</p>
        `;
        momentsGrid.appendChild(card);
    });
}

// Jalankan saat halaman dimuat
document.addEventListener('DOMContentLoaded', renderPublicMoments);
