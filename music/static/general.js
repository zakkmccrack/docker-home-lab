const header = document.getElementById("library-header");
const openButton = document.getElementById("header-activate-button");

const PAGES = ['home', 'all-player', 'albums', 'playlists', 'search_tab', 'settings', 'playlist', 'genres'];



function showPage(pageId, activeNavId = null) {
    PAGES.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = id === pageId ? 'block' : 'none';
    });

    document.querySelectorAll('#library-header button').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.nav === activeNavId);
    });
}

function goHomePage() { showPage('home'); header.style.display = 'none'; }

function goMainPage() { showPage('all-player', 'home'); startNavbar(); }

function goAlbumPage() { renderTree(); showPage('albums', 'albums'); startNavbar(); }

function goPlaylistsPage() { loadPlaylists(); showPage('playlists', 'playlists'); }

function goSearchPage() { showPage('search_tab', 'search'); startNavbar(); }

function goSettings() { showPage('settings'); startNavbar(); }

function goCreatePlaylistPage() { populateInsertLibrary(); showPage('playlist'); startNavbar(); }

function showBigPicture() { loadBigPicture(); }

goHomePage();

// async function goGenresPage() { await loadGenresPage(); showPage('genres'); startNavbar()}


function startNavbar() {
    let vw = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0)
    if (vw < 768)
        header.style.display = 'none';
    else
        header.style.display = 'flex'
}

function activateNavbar() {
    let vw = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0)
    if (vw < 768)
        header.style.display = (header.style.display === "none") ? (header.style.display = 'flex') : (header.style.display = 'none');
    else
        header.style.display = 'flex'
}