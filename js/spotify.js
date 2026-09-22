document.addEventListener("DOMContentLoaded", () => {

    const button =
        document.getElementById("spotifyButton");

    if (!button) return;

    button.addEventListener("click", () => {

        window.open(
            "https://open.spotify.com/",
            "_blank"
        );

    });

});
