// ============================================================
//  Utils
// ============================================================
const allPlaylistSettingsDiv = document.getElementById("all-playlist");
const playlistForm = document.getElementById("playlist-form");
const selectBox = document.getElementById("song-selection");
const currentList = document.getElementById("current-list");
const title = document.getElementById('playlist-name');

let library;
let libraryFiltered;
let selected = [""];
let selectedTitle = [""];

//playlistForm.addEventListener("submit", (e) => e.preventDefault());


// ============================================================
//  Playlist
// ============================================================

async function populateInsertLibrary() {
    const res = await fetch("/api/songs");
    library = await res.json();
    libraryFiltered = [...library]
    loadSongSelection();
}

function loadSongSelection() {
    for (a in selectBox.options) { selectBox.options.remove(0); }

    const fragment = document.createDocumentFragment();
    libraryFiltered.forEach((song, i) => {
        const optionBox = document.createElement("option");
        const filepathOriginal = song.filepath;
        optionBox.value = (filepathOriginal.replace("/music", ''));
        optionBox.textContent = song.title + " || " + song.album + " || " + song.artist;
        optionBox.addEventListener("dblclick", () => { triggerSongOnSelected(optionBox.value, song.title) })
        fragment.appendChild(optionBox);
    });
    selectBox.appendChild(fragment);
}

function filterFunction() {
    const input = document.getElementById("myInput");
    const filter = input.value.toLowerCase();
    libraryFiltered = library.filter(
        (s) =>
            s.title.toLowerCase().includes(filter) ||
            s.artist.toLowerCase().includes(filter) ||
            s.album.toLowerCase().includes(filter),
    )
    loadSongSelection();
}

function triggerSongOnSelected(path, title) {
    if (!selected.includes(path)) {
        selected.push(path)
        selectedTitle.push(title)
    } else {
        const index = selected.indexOf(path);
        selected.splice(index, 1);

        const index2 = selectedTitle.indexOf(title);
        selectedTitle.splice(index2, 1);
    }

    let out = "";
    selectedTitle.forEach((element) => {
        out += element + "  ||  ";
    });
    currentList.innerHTML = out;
}


async function loadSettingsPlaylist() {

}

function createPlaylistPost() {
    if (selected[0] == "") { selected.shift() }
    if (selected.length >= 2) {
        name = title.value;
        fetch("/api/playlists", {
            method: "POST",
            body: JSON.stringify({
                name: name,
                songs: selected
            }),
            headers: {
                "Content-type": "application/json; charset=UTF-8"
            }
        })
            .then((response) => response.json())
            .then((json) => console.log(json));
    }
}

async function renderSettingsPlaylists() {
    const res = await fetch("/api/playlists");
    const playlists = Object.entries(await res.json());

    allPlaylistSettingsDiv.innerHTML = "";
    const frag = document.createDocumentFragment();

    playlists.forEach(([name]) => {
        const div = document.createElement("div");
        div.classList.add("playlist-div");
        div.innerHTML = `<div class="album-name-div">${name}</div>`;
        const deleteDiv = document.createElement("div");
        deleteDiv.innerHTML = "DELETE"
        deleteDiv.addEventListener("click", () => deletePlaylist(1));
        frag.appendChild(div);
    });
    allPlaylistSettingsDiv.appendChild(frag);
}

function deletePlaylist() {
    alert("delete: " + 1)
}
