/* =========================
   LOADING
========================= */

window.addEventListener("load", function () {

    const loader =
        document.getElementById("page-loader");

    const status =
        document.getElementById("loaderStatus");


    setTimeout(function () {

        status.textContent =
            "Website siap digunakan";

    }, 1500);


    setTimeout(function () {

        loader.classList.add("loaded");

    }, 2600);

});



/* =========================
   MOBILE MENU
========================= */

const menuButton =
    document.getElementById("menuButton");

const navMenu =
    document.getElementById("navMenu");


if (menuButton) {

    menuButton.addEventListener(
        "click",
        function () {

            navMenu.classList.toggle(
                "active"
            );

        }
    );

}


document.querySelectorAll(
    "#navMenu a"
).forEach(function (link) {

    link.addEventListener(
        "click",
        function () {

            navMenu.classList.remove(
                "active"
            );

        }
    );

});



/* =========================
   SEARCH SISWA
========================= */

const studentSearch =
    document.getElementById(
        "studentSearch"
    );

const students =
    document.querySelectorAll(
        ".student"
    );


if (studentSearch) {

    studentSearch.addEventListener(
        "input",
        function () {

            const keyword =
                this.value
                    .toLowerCase()
                    .trim();


            students.forEach(
                function (student) {

                    const name =
                        student.textContent
                            .toLowerCase();


                    if (
                        name.includes(keyword)
                    ) {

                        student.style.display =
                            "";

                    } else {

                        student.style.display =
                            "none";

                    }

                }
            );

        }
    );

}



/* =========================
   CLASS MOMENTS
========================= */

const photoInput =
    document.getElementById(
        "photoInput"
    );

const gallery =
    document.getElementById(
        "gallery"
    );


let photos = [];


try {

    photos =
        JSON.parse(
            localStorage.getItem(
                "classMomentsPhotos"
            ) || "[]"
        );

} catch (error) {

    photos = [];

}



function savePhotos() {

    try {

        localStorage.setItem(
            "classMomentsPhotos",
            JSON.stringify(photos)
        );

        return true;

    } catch (error) {

        alert(
            "Penyimpanan browser penuh. Gunakan foto yang lebih kecil."
        );

        return false;

    }

}



function renderGallery() {

    gallery.innerHTML = "";


    if (photos.length === 0) {

        gallery.innerHTML = `
            <div class="empty-gallery">
                Belum ada foto.<br><br>
                Klik <strong>+ Tambah Foto</strong>
                untuk menambahkan Class Moments.
            </div>
        `;

        return;

    }


    photos.forEach(
        function (photo, index) {

            const card =
                document.createElement(
                    "div"
                );

            card.className =
                "gallery-card";


            const image =
                document.createElement(
                    "img"
                );

            image.src = photo;

            image.alt =
                "Class Moment " +
                (index + 1);


            const deleteButton =
                document.createElement(
                    "button"
                );

            deleteButton.className =
                "delete-photo";

            deleteButton.type =
                "button";

            deleteButton.setAttribute(
                "aria-label",
                "Hapus foto"
            );


            deleteButton.innerHTML = `
                <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round">

                    <path d="M3 6h18"/>
                    <path d="M8 6V4h8v2"/>
                    <path d="M19 6l-1 14H6L5 6"/>
                    <path d="M10 11v5"/>
                    <path d="M14 11v5"/>

                </svg>
            `;


            deleteButton.addEventListener(
                "click",
                function () {

                    const confirmDelete =
                        confirm(
                            "Hapus foto ini?"
                        );


                    if (!confirmDelete) {
                        return;
                    }


                    photos.splice(
                        index,
                        1
                    );


                    savePhotos();

                    renderGallery();

                }
            );


            card.appendChild(image);

            card.appendChild(
                deleteButton
            );

            gallery.appendChild(card);

        }
    );

}



if (photoInput) {

    photoInput.addEventListener(
        "change",
        function () {

            const files =
                Array.from(
                    this.files
                );


            if (!files.length) {
                return;
            }


            let loaded = 0;


            files.forEach(
                function (file) {

                    if (
                        !file.type.startsWith(
                            "image/"
                        )
                    ) {

                        loaded++;

                        return;

                    }


                    const reader =
                        new FileReader();


                    reader.onload =
                        function (event) {

                            photos.push(
                                event.target.result
                            );


                            loaded++;


                            if (
                                loaded ===
                                files.length
                            ) {

                                if (
                                    savePhotos()
                                ) {

                                    renderGallery();

                                }

                            }

                        };


                    reader.onerror =
                        function () {

                            loaded++;

                        };


                    reader.readAsDataURL(
                        file
                    );

                }
            );


            this.value = "";

        }
    );

}


renderGallery();



/* =========================
   NEXT CLASS
========================= */

const schedules = {

    1: [
        ["PJOK", "07:40", "09:00"],
        ["PKN", "09:00", "10:20"],
        ["Informatika", "10:50", "12:10"],
        ["B. Jepang", "12:10", "12:50"],
        ["B. Jepang", "13:30", "14:10"],
        ["PAI / Kristen", "14:10", "15:30"]
    ],

    2: [
        ["Sosiologi", "07:40", "09:00"],
        ["B. Jepang", "09:00", "10:20"],
        ["Seni Budaya", "10:50", "12:10"],
        ["Ekonomi", "12:10", "12:50"],
        ["Ekonomi", "13:30", "14:10"],
        ["BK", "14:10", "14:50"],
        ["BTQ", "14:50", "15:30"]
    ],

    3: [
        ["Sosiologi", "07:40", "09:00"],
        ["Matematika", "09:00", "09:40"],
        ["B. Indonesia", "09:40", "10:20"],
        ["B. Indonesia", "10:50", "12:10"],
        ["Informatika", "12:10", "12:50"],
        ["Informatika", "13:30", "14:10"],
        ["Sejarah", "14:10", "15:30"]
    ],

    4: [
        ["B. Inggris", "07:40", "09:00"],
        ["B. Sunda", "09:00", "10:20"],
        ["Matematika", "10:50", "12:10"],
        ["Geografi", "12:10", "12:50"],
        ["Geografi", "13:30", "14:10"],
        ["B. Mandarin", "14:10", "15:30"]
    ],

    5: [
        ["Ekonomi", "07:40", "09:00"],
        ["Geografi", "09:00", "09:40"],
        ["Geografi", "10:00", "10:40"],
        ["Klinik Belajar", "10:40", "11:20"]
    ]

};


function toMinutes(time) {

    const parts =
        time.split(":");

    return (
        Number(parts[0]) * 60 +
        Number(parts[1])
    );

}


function updateNextClass() {

    const subject =
        document.getElementById(
            "nextSubject"
        );

    const time =
        document.getElementById(
            "nextTime"
        );


    if (!subject || !time) {
        return;
    }


    const now =
        new Date();


    const day =
        now.getDay();


    if (
        day === 0 ||
        day === 6
    ) {

        subject.textContent =
            "Tidak ada jadwal";

        time.textContent =
            "Weekend";

        return;

    }


    const current =
        now.getHours() * 60 +
        now.getMinutes();


    const today =
        schedules[day] || [];


    for (
        let i = 0;
        i < today.length;
        i++
    ) {

        const lesson =
            today[i];


        const start =
            toMinutes(
                lesson[1]
            );


        const end =
            toMinutes(
                lesson[2]
            );


        if (
            current < end
        ) {

            subject.textContent =
                lesson[0];

            time.textContent =
                lesson[1] +
                " – " +
                lesson[2];

            return;

        }

    }


    subject.textContent =
        "Selesai";

    time.textContent =
        "Tidak ada lagi";

}


updateNextClass();


setInterval(
    updateNextClass,
    30000
);