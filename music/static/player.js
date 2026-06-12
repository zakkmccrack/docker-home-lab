// ============================================================
//  DOM refs
// ============================================================
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
const nowCover = document.getElementById("now-album-image");

const songList = document.getElementById("song-list");
const searchList = document.getElementById("search-list");
const albumList = document.getElementById("albums-list");
const playlistsList = document.getElementById("playlists-list");

const searchInput = document.getElementById("search");

const songsNumber = document.getElementById("songs-number");
const songsNumberSearch = document.getElementById("songs-number-serach");

const playlistForm = document.getElementById("playlist-form");

const COVER_API = "/music/api/cover/";

// ============================================================
//  Centralized state
// ============================================================

const QueueSource = Object.freeze({
  LIBRARY: "library",
  ALBUM: "album",
  PLAYLIST: "playlist",
});

const state = {
  library: [],
  filtered: [],

  tree: [],
  treeFiltered: [],

  playlists: [],

  queue: [],
  queueIndex: -1,

  queueSource: QueueSource.LIBRARY,

  randomize: false,
};

let max = 0;

// ============================================================
//  Utility
// ============================================================

function fmt(seconds) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60)
    .toString()
    .padStart(2, "0");
  return `${m}:${s}`;
}

/** Codifica un path per usarlo come URL senza toccare i separatori /  */
function encodeCoverPath(rawPath) {
  return rawPath
    .split("/")
    .map((seg) =>
      encodeURIComponent(seg)
        .replace(/'/g, "%27")
        .replace(/\(/g, "%28")
        .replace(/\)/g, "%29"),
    )
    .join("/");
}

function coverUrlFromSong(song) {
  const path = song.filepath.replace(/^\/music\//, "");
  return `${COVER_API}${encodeCoverPath(path)}`;
}

function coverUrlFromAlbum(artist, album) {
  return `${COVER_API}${encodeCoverPath(artist)}/${encodeCoverPath(album)}/cover.jpg?size=300`;
}

// Fisher-Yates
function shuffleInPlace(arr) {
  for (let i = state.queue.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

function songByFilepath(filepath) {
  return state.library.find((s) => s.filepath === "/music" + filepath);
}

// ============================================================
//  Costruzione coda
// ============================================================

/**
 * Costruisce la coda a partire da un indice nella library.
 * In modalità random riempie con 49 indici casuali dopo il primo;
 * altrimenti mette i 49 successivi in sequenza.
 */
function buildLibraryQueue(startIndex) {
  const max = state.library.length;
  if (state.randomize) {
    const rest = Array.from({ length: 49 }, () =>
      Math.floor(Math.random() * max),
    );
    state.queue = [startIndex, ...rest];
  } else {
    state.queue = Array.from({ length: 50 }, (_, i) => (startIndex + i) % max);
  }
  state.queueIndex = 0;
  state.queueSource = QueueSource.LIBRARY;
}

function buildAlbumQueue(songIndices) {
  state.queue = songIndices;
  console.log(songIndices);
  state.queue = state.randomize ? shuffledCopy(songIndices) : [...songIndices];
  state.queueIndex = -1;
  state.queueSource = QueueSource.ALBUM;
}

function buildPlaylistQueue(filepaths) {
  state.queue = state.randomize ? shuffledCopy(filepaths) : [...filepaths];
  state.queueIndex = -1;
  state.queueSource = QueueSource.PLAYLIST;
}

function shuffledCopy(arr) {
  const copy = [...arr];
  shuffleInPlace(copy);
  return copy;
}

function addSongsToQueue(currentIndex) {
  const max = state.library.length;
  if (state.randomize) {
    const rest = Array.from({ length: 49 }, () =>
      Math.floor(Math.random() * max),
    );
    state.queue = state.queue.concat(rest);
  } else {
    const rest = Array.from({ length: 50 }, (_, i) => (currentIndex + i) % max);
    state.queue = state.queue.concat(rest);
  }
}

// ============================================================
//  Caricamento dati
// ============================================================

async function loadLibrary() {
  const res = await fetch("/api/songs");
  state.library = await res.json();
  state.library.sort(
    (a, b) =>
      a.artist.localeCompare(b.artist) ||
      a.album.localeCompare(b.album) ||
      a.title_full.localeCompare(b.title_full),
  );
  state.filtered = [...state.library];
  renderSongList();
}

async function loadTree() {
  const res = await fetch("/api/tree");
  const raw = await res.json();
  state.tree = Object.entries(raw).map(([artist, albums]) => {
    const sortedAlbums = Object.fromEntries(
      Object.entries(albums).map(([album, songs]) => [
        album,
        [...songs].sort((a, b) => a.title_full.localeCompare(b.title_full)),
      ]),
    );
    return [artist, sortedAlbums];
  });
  state.treeFiltered = state.tree;
  renderTree();
}

async function loadPlaylists() {
  const res = await fetch("/api/playlists");
  state.playlists = Object.entries(await res.json());
  renderPlaylists();
}

// ============================================================
//  Entry point pubblici (click su brano / album / playlist)
// ============================================================

function selectSong(indexInLibrary) {
  buildLibraryQueue(indexInLibrary);
  playCurrentSong();
}

function selectFilteredSong(title) {
  const idx = state.library.findIndex((s) => s.title === title);
  if (idx !== -1) selectSong(idx);
}

function playAlbum(bandIndex, albumName) {
  const songs = state.treeFiltered[bandIndex][1][albumName];
  const indices = songs.map((s) =>
    state.library.findIndex((l) => l.id === s.id),
  );
  buildAlbumQueue(indices);
  playNext();
}

function startPlaylist(filepaths) {
  buildPlaylistQueue(filepaths);
  playNext();
}

// ============================================================
//  Render
// ============================================================

function makeSongRow(song, onClickFn) {
  const tr = document.createElement("tr");
  tr.dataset.id = song.id;
  tr.innerHTML = `
    <td>${song.title}</td>
    <td>${song.artist}</td>
    <td>${song.album}</td>
    <td>${fmt(song.duration)}</td>
  `;
  tr.addEventListener("click", onClickFn);
  return tr;
}

function renderSongList() {
  songList.innerHTML = "";
  const frag = document.createDocumentFragment();
  state.library.forEach((song, i) =>
    frag.appendChild(makeSongRow(song, () => selectSong(i))),
  );
  songList.appendChild(frag);
  songsNumber.textContent = `${state.library.length} canzoni caricate`;
}

function renderSearchList() {
  searchList.innerHTML = "";
  const frag = document.createDocumentFragment();
  state.filtered.forEach((song) =>
    frag.appendChild(makeSongRow(song, () => selectFilteredSong(song.title))),
  );
  searchList.appendChild(frag);
  songsNumberSearch.textContent = `${state.filtered.length} canzoni trovate`;
}

function renderTree() {
  albumList.innerHTML = "";
  const frag = document.createDocumentFragment();

  state.treeFiltered.forEach(([artist, albums], bandIndex) => {
    const artistDiv = document.createElement("div");
    artistDiv.classList.add("artist-title-div");
    artistDiv.innerHTML = `<h2>${artist}</h2>`;
    frag.appendChild(artistDiv);

    Object.keys(albums).forEach((albumName) => {
      const div = document.createElement("div");
      div.classList.add("album-div");
      div.style.backgroundImage = `url(${coverUrlFromAlbum(artist, albumName)})`;

      const dataDiv = document.createElement("div");
      dataDiv.classList.add("album-data");
      dataDiv.innerHTML = `
        <div class="album-name-div">${albumName}</div>
        <div class="album-artist-name-div">${artist}</div>
      `;
      div.appendChild(dataDiv);
      div.addEventListener("click", () => playAlbum(bandIndex, albumName));
      frag.appendChild(div);
    });
  });

  albumList.appendChild(frag);
}

function renderPlaylists() {
  playlistsList.innerHTML = "";
  const frag = document.createDocumentFragment();

  state.playlists.forEach(([name, songs]) => {
    const div = document.createElement("div");
    div.classList.add("album-div");
    div.innerHTML = `<div class="album-name-div">${name}</div>`;
    div.addEventListener("click", () => startPlaylist(songs));
    frag.appendChild(div);
  });

  playlistsList.appendChild(frag);
}

function highlightActiveRow() {
  document
    .querySelectorAll("#song-list tr.active")
    .forEach((tr) => tr.classList.remove("active"));
  const activeIndex = state.queue[state.queueIndex];
  const rows = document.querySelectorAll("#song-list tr");
  if (rows[activeIndex]) rows[activeIndex].classList.add("active");
}

// ============================================================
//  Ordinamento lista filtrata
// ============================================================

const sortColumns = ["title-col", "artist-col", "album-col", "duration-col"];

function setActiveFilterCol(activeId) {
  sortColumns.forEach((id) => {
    document
      .getElementById(id)
      ?.classList.toggle("active-filter", id === activeId);
  });
}

function orderBy(field, compareFn, colId) {
  state.filtered.sort(compareFn);
  setActiveFilterCol(colId);
  renderSearchList();
}

function orderByTitle() {
  orderBy(
    "title",
    (a, b) =>
      a.album.localeCompare(b.album) ||
      a.title_full.localeCompare(b.title_full),
    "title-col",
  );
}
function orderByArtist() {
  orderBy("artist", (a, b) => a.artist.localeCompare(b.artist), "artist-col");
}
function orderByAlbum() {
  orderBy(
    "album",
    (a, b) =>
      a.album.localeCompare(b.album) ||
      a.title_full.localeCompare(b.title_full),
    "album-col",
  );
}
function orderByTime() {
  orderBy("duration", (a, b) => a.duration - b.duration, "duration-col");
}

// ============================================================
//  Ricerca
// ============================================================

searchInput.addEventListener("input", () => {
  const q = searchInput.value.toLowerCase();
  state.filtered = state.library.filter(
    (s) =>
      s.title.toLowerCase().includes(q) ||
      s.artist.toLowerCase().includes(q) ||
      s.album.toLowerCase().includes(q),
  );
  renderSearchList();
});

// ============================================================
//  Controlli player
// ============================================================

btnPlay.addEventListener("click", () => {
  if (audio.paused) {
    audio.play();
    btnPlay.textContent = "⏸";
  } else {
    audio.pause();
    btnPlay.textContent = "▶";
  }
});

btnNext.addEventListener("click", playNext);
btnPrev.addEventListener("click", playPrev);

btnRandom.addEventListener("click", () => {
  state.randomize = !state.randomize;
  btnRandom.style.color = state.randomize ? "green" : "white";
  // Ricostruisce la coda dal brano corrente senza interrompere la riproduzione
  if (state.queueSource === QueueSource.LIBRARY && state.queueIndex >= 0) {
    const current = state.queue[state.queueIndex];
    buildLibraryQueue(current);
  } else if (state.queueSource === QueueSource.ALBUM && state.queueIndex >= 0) {
    const current = state.queue[state.queueIndex];
    buildAlbumQueue(current);
  } else if (
    state.queueSource === QueueSource.PLAYLIST &&
    state.queueIndex >= 0
  ) {
    const current = state.queue[state.queueIndex];
    buildPlaylistQueue(current);
  }
});

audio.addEventListener("ended", playNext);

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

navigator.mediaSession.setActionHandler("nexttrack", playNext);
navigator.mediaSession.setActionHandler("previoustrack", playPrev);

playlistForm.addEventListener("submit", (e) => e.preventDefault());

// ============================================================
//  GUI extra
// ============================================================

function loadBigPicture() {
  document.getElementById("player-bar").classList.toggle("full-picture");

  document.getElementById("song-controls").classList.toggle("is-full-picture");

  document
    .getElementById("now-album-image")
    .classList.toggle("is-full-picture");
  document.getElementById("player-info").classList.toggle("is-full-picture");

  document.getElementById("audio-controls").classList.toggle("is-full-picture");

  document
    .getElementById("player-progress")
    .classList.toggle("is-full-picture");
  document
    .getElementById("player-controls")
    .classList.toggle("is-full-picture");
}

// ============================================================
//  Player
// ============================================================

function currentSong() {
  const item = state.queue[state.queueIndex];
  if (state.queueSource === QueueSource.PLAYLIST) return songByFilepath(item);
  return state.library[item];
}

function playCurrentSong() {
  const song = currentSong();
  if (!song) return;

  // Sorgente audio
  if (state.queueSource === QueueSource.PLAYLIST) {
    audio.src = `/api/stream/path/${state.queue[state.queueIndex]}`;
  } else {
    audio.src = `/api/stream/${song.id}`;
  }

  audio.play();
  updateNowPlayingUI(song);
}

function updateNowPlayingUI(song) {
  nowTitle.textContent = song.title;
  nowArtist.textContent = song.artist;
  seekbar.max = song.duration;
  btnPlay.textContent = "⏸";
  document.title = `${song.title} - ${song.artist}`;

  const coverUrl = coverUrlFromSong(song);
  nowCover.style.backgroundImage = `url(${coverUrl})`;

  navigator.mediaSession.metadata = new MediaMetadata({
    title: song.title,
    artist: song.artist,
    album: song.album,
    artwork: [{ src: coverUrl }],
  });

  highlightActiveRow();
}

function playNext() {
  const lastIndex = state.queue.length - 1;
  if (state.queueIndex >= lastIndex) {
    if (state.queueSource == "album" || state.queueSource == "playlist") {
      state.queueIndex = -1;
    } else {
      addSongsToQueue(state.queueIndex);
    }
  }
  state.queueIndex++;
  playCurrentSong();
}

function playPrev() {
  if (state.queueIndex <= 0) return;
  state.queueIndex--;
  playCurrentSong();
}

// ============================================================
//  Init
// ============================================================
loadLibrary();
loadTree();
loadPlaylists();

// Volume
// volumebar.addEventListener("input", () => {
//   audio.volume = volumebar.value / 100;
// });
