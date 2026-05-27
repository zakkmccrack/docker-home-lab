const audio = document.getElementById("audio-engine");
const btnPlay = document.getElementById("btn-play");
const btnPrev = document.getElementById("btn-prev");
const btnNext = document.getElementById("btn-next");
const btnRandom = document.getElementById("btn-random");

const seekbar = document.getElementById("seekbar");
const volumebar = document.getElementById("volumebar");
const timeCurrent = document.getElementById("time-current");
const timeTotal = document.getElementById("time-total");
const nowTitle = document.getElementById("now-title");
const nowArtist = document.getElementById("now-artist");

const songList = document.getElementById("song-list");
const searchList = document.getElementById("search-list");
const albumList = document.getElementById("albums-list");
const playlistsList = document.getElementById("playlists-list");

const search = document.getElementById("search");
const album_search = document.getElementById("album-search");

const songsNumber = document.getElementById("songs-number");
const songsNumberSearch = document.getElementById("songs-number-serach");

const playlistForm = document.getElementById("playlist-form");


let library = [];
let filtered = [];

let tree = [];
let treeFiltered = [];

let playlists = [];

let queue = [];

let isAlbum = false;
let isPlaylist = false;

let max = 0;
let randomize = false;
let currentQueueIndex = -1;


// --- Utility ---

function fmt(seconds) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60)
    .toString()
    .padStart(2, "0");
  return `${m}:${s}`;
}


// --- Library ---

async function loadLibrary() {
  const res = await fetch("/api/songs");
  library = await res.json();
  library.sort(
    (a, b) =>
      a.artist.localeCompare(b.artist) ||
      a.album.localeCompare(b.album) ||
      a.title_full.localeCompare(b.title_full),
  );
  filtered = [...library];
  renderList();
}

function renderList() {
  songList.innerHTML = "";
  library.forEach((song, i) => {
    const tr = document.createElement("tr");
    tr.dataset.id = song.id;
    tr.innerHTML = `
            <td>${song.title}</td>
            <td>${song.artist}</td>
            <td>${song.album}</td>
            <td>${fmt(song.duration)}</td>
        `;
    tr.addEventListener("click", () => selectSong(i));
    songList.appendChild(tr);
  });
  max = library.length - 1;
  songsNumber.innerHTML = library.length + " canzoni caricate!";
}

function renderSearchList() {
  searchList.innerHTML = "";
  filtered.forEach((song, i) => {
    const tr = document.createElement("tr");
    tr.dataset.id = song.id;
    tr.innerHTML = `
            <td>${song.title}</td>
            <td>${song.artist}</td>
            <td>${song.album}</td>
            <td>${fmt(song.duration)}</td>
        `;
    tr.addEventListener("click", () => selectFilteredSong(song.title));
    searchList.appendChild(tr);
  });
  max = filtered.length - 1;
  songsNumberSearch.innerHTML = filtered.length + " canzoni caricate!";
}


// --- Albums Tree --

async function loadTree() {
  const res = await fetch("/api/tree");
  tree = await res.json();
  tree = Object.entries(tree);
  tree.forEach(([album, artist], i) => {
    Object.entries(artist).forEach((album) => {
      album[1].sort((a, b) => a.title_full.localeCompare(b.title_full));
    });
  });

  treeFiltered = tree;
  renderTree();
}

function renderTree() {
  albumList.innerHTML = "";

  treeFiltered.forEach(([artist, albums], i) => {
    const artistDiv = document.createElement("div");
    const artistTitle = document.createElement("h2");
    artistDiv.classList.add("artist-title-div");
    const bandName = artist;
    artistTitle.textContent = bandName;

    artistDiv.appendChild(artistTitle);

    albumList.appendChild(artistDiv)

    Object.entries(albums).forEach((albumName, j) => {
      const div = document.createElement("div");
      div.classList.add("album-div");


      const divData = document.createElement("div");
      divData.classList.add("album-data");


      const divArtistName = document.createElement("div");
      divArtistName.classList.add("album-artist-name-div");
      divArtistName.textContent = bandName;

      const divAlbumName = document.createElement("div");
      divAlbumName.classList.add("album-name-div");
      divAlbumName.textContent = albumName[0];

      divData.appendChild(divAlbumName);
      divData.appendChild(divArtistName);

      div.appendChild(divData)

      const url = (`/music/api/cover/${encodeURIComponent(bandName)}/${encodeURIComponent(albumName[0])}/cover.jpg?size=300`).replace("'", "%27").replace("(", "%28").replace(")", "%29")

      div.style.backgroundImage = `url(${url})`

      div.addEventListener("click", () => playAlbum(i, albumName[0]));

      albumList.appendChild(div);
    });
  });
}

// --- Playlists --

async function loadPlaylists() {
  const res = await fetch("/api/playlists");
  console.log(res)
  playlists = await res.json();
  playlists = Object.entries(playlists);

  renderPlaylists();
}

function renderPlaylists() {
  playlistsList.innerHTML = "";

  playlists.forEach(([playlist, songs], i) => {
    const div = document.createElement("div");
    div.classList.add("album-div");

    const divAlbumName = document.createElement("div");
    divAlbumName.classList.add("album-name-div");
    divAlbumName.textContent = playlist;

    div.appendChild(divAlbumName);
    console.log(songs)
    div.addEventListener("click", () => startPlaylist(songs));

    playlistsList.appendChild(div);
  });
}

/*

CHANGE INTO CHECKBOX?

*/
function loadSongSelection() {
  selectBox = document.getElementById("song-selection");
  const fragment = document.createDocumentFragment();

  library.forEach((song, i) => {
    const optionBox = document.createElement("option");
    const filepathOriginal = song.filepath;
    optionBox.value = (filepathOriginal.replace("/music", ''));
    optionBox.textContent = song.title;
    fragment.appendChild(optionBox);
  });
  selectBox.appendChild(fragment);
}

playlistForm.addEventListener("submit", async (e) => {

})


// --- Queue ---

function populateQueue(indexInFiltered) {
  queue[0] = indexInFiltered;
  currentQueueIndex = 0;
  if (randomize) {
    for (var i = 1; i < 50; i++) {
      queue[i] = Math.floor(Math.random() * max);
    }
  } else {
    for (var i = 1; i < 50; i++) {
      queue[i] = indexInFiltered + i;
    }
  }
}


// --- Player ---

// DO BETTER

function playSong(indexInFiltered) {
  if (queue[0] == null || (currentQueueIndex == queue.length - 1 && !isPlaylist) || (currentQueueIndex == queue.length && isPlaylist)) {
    populateQueue(indexInFiltered);
  }
  console.log(queue)
  if (!isPlaylist) {
    const song = library[queue[currentQueueIndex]];
    audio.src = `/api/stream/${song.id}`;
    nowTitle.textContent = song.title;
    nowArtist.textContent = song.artist;
    seekbar.max = song.duration;
    audio.play();
    btnPlay.textContent = "⏸";
    highlightRow();

    document.title = song.title + " - " + song.artist;
  } else {
    console
    const songPath = queue[currentQueueIndex];
    const songDataFromPath = library[library.findIndex((song) => song.filepath == ("/music" + songPath))]
    audio.src = `/api/stream/path/${songPath}`;
    nowTitle.textContent = songDataFromPath.title;
    nowArtist.textContent = songDataFromPath.artist;
    seekbar.max = songDataFromPath.duration;
    audio.play();
    btnPlay.textContent = "⏸";
    highlightRow();
    document.title = songDataFromPath.title + " - " + songDataFromPath.artist;
  }
}

function playNext() {
  currentQueueIndex++;
  if (isAlbum) {
    queue[queue.length] = queue[currentQueueIndex];
  }
  console.log(queue)
  if (!randomize) {
    if (currentQueueIndex < max) playSong(currentQueueIndex + 1);
    else btnPlay.textContent = "▶";
  } else {
    playSong(currentQueueIndex + 1);
  }
}

function playAlbum(band, album) {
  queue = [];
  treeFiltered[band][1][album].forEach((album, i) => {
    queue[i] = library.findIndex((s) => s.id == album.id);
  });
  currentQueueIndex = -1;
  isAlbum = true;
  isPlaylist = false;
  playNext();
}

function startPlaylist(playlist_queue) {
  isAlbum = true;
  isPlaylist = true;
  queue = playlist_queue;
  currentQueueIndex = -1;
  console.log(queue)
  playNext();
}

function selectSong(indexInFiltered) {
  currentQueueIndex = 0;
  isAlbum = false;
  isPlaylist = false;
  populateQueue(indexInFiltered);
  playSong(indexInFiltered);
}

function selectFilteredSong(songNameInFiltered) {
  currentQueueIndex = 0;
  isAlbum = false;
  isPlaylist = false;
  populateQueue((library.findIndex((song) => song.title == songNameInFiltered)));
  playSong((library.findIndex((song) => song.title == songNameInFiltered)));
}


// --- Search ---

search.addEventListener("input", () => {
  const q = search.value.toLowerCase();
  filtered = library.filter(
    (s) =>
      s.title.toLowerCase().includes(q) ||
      s.artist.toLowerCase().includes(q) ||
      s.album.toLowerCase().includes(q),
  );
  renderSearchList();
});

album_search.addEventListener("input", () => {
  // const q = search.value.toLowerCase();
  // filtered = tree.filter(s =>
  //     s.artist.toLowerCase().includes(q) ||
  //     s.album.toLowerCase().includes(q)
  // );
  // renderTree();
});

//  --- GUI Functions --

function loadBigPicture() {
  alert("big picture");
}

function highlightRow() {
  document
    .querySelectorAll("#song-list tr")
    .forEach((tr) => tr.classList.remove("active"));
  const rows = document.querySelectorAll("#song-list tr");
  if (rows[queue[currentQueueIndex]])
    rows[queue[currentQueueIndex]].classList.add("active");
}

btnPlay.addEventListener("click", () => {
  if (audio.paused) {
    audio.play();
    btnPlay.textContent = "⏸";
  } else {
    audio.pause();
    btnPlay.textContent = "▶";
  }
});

btnNext.addEventListener("click", () => {
  playNext();
});

btnPrev.addEventListener("click", () => {
  if (currentQueueIndex > 0) {
    currentQueueIndex--;
    playSong(currentQueueIndex - 1);
  }
});

btnRandom.addEventListener("click", () => {
  randomize = !randomize;
  btnRandom.style.color = !randomize ? "white" : "green";
  populateQueue(queue[currentQueueIndex]);
});


// Autoplay next track
audio.addEventListener("ended", () => {
  playNext();
});


// Seekbar
audio.addEventListener("timeupdate", () => {
  seekbar.value = Math.floor(audio.currentTime);
  timeCurrent.textContent = fmt(audio.currentTime);
});

audio.addEventListener("loadedmetadata", () => {
  timeTotal.textContent = fmt(audio.duration);
});

seekbar.addEventListener("input", () => {
  audio.currentTime = seekbar.value;
});


// Volume
volumebar.addEventListener("input", () => {
  audio.volume = volumebar.value / 100;
});


// -- Filters (non funzionano per ora)--

function orderByTitle() {
  filtered.sort((a, b) => a.album.localeCompare(b.album) || a.title_full.localeCompare(b.title_full))
  document.getElementById("title-col").classList.add("active-filter")
  document.getElementById("artist-col").classList.remove("active-filter")
  document.getElementById("album-col").classList.remove("active-filter")
  document.getElementById("duration-col").classList.remove("active-filter")
  renderSearchList();
}

function orderByArtist() {
  filtered.sort((a, b) => a.artist.localeCompare(b.artist))
  document.getElementById("title-col").classList.remove("active-filter")
  document.getElementById("artist-col").classList.add("active-filter")
  document.getElementById("album-col").classList.remove("active-filter")
  document.getElementById("duration-col").classList.remove("active-filter")
  renderSearchList();
}

function orderByAlbum() {
  filtered.sort((a, b) => a.album.localeCompare(b.album) || a.title_full.localeCompare(b.title_full))
  document.getElementById("title-col").classList.remove("active-filter")
  document.getElementById("artist-col").classList.remove("active-filter")
  document.getElementById("album-col").classList.add("active-filter")
  document.getElementById("duration-col").classList.remove("active-filter")
  renderSearchList();
}

function orderByTime() {
  filtered.sort((a, b) => a.duration - b.duration)
  document.getElementById("title-col").classList.remove("active-filter")
  document.getElementById("artist-col").classList.remove("active-filter")
  document.getElementById("album-col").classList.remove("active-filter")
  document.getElementById("duration-col").classList.add("active-filter")
  renderSearchList();
}


// --- Init ---
loadLibrary();
loadTree();
