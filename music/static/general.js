const PAGES = ['home', 'all-player', 'albums', 'playlists', 'search_tab', 'settings', 'create-playlist'];

function showPage(pageId, activeNavId = null) {
    PAGES.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = id === pageId ? 'block' : 'none';
    });

    document.querySelectorAll('#library-header button').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.nav === activeNavId);
    });
}

function goHomePage() { showPage('home'); }
function goMainPage() { showPage('all-player', 'home'); }
function goAlbumPage() { renderTree(); showPage('albums', 'albums'); }
function goPlaylistsPage() { loadPlaylists(); showPage('playlists', 'playlists'); }
function goSearchPage() { showPage('search_tab', 'search'); }
function goSettings() { showPage('settings'); }
function goCreatePlaylistPage() { loadSongSelection(); showPage('create-playlist'); }

function showBigPicture() { loadBigPicture(); }

goHomePage();