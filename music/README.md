# The very cool people web player

This project was born with the idea of making available to everyone a personal music streaming service with only and exclusively the audio content you own.

On paper, this service does not depend on anything but the libraries used and a network connection, even if only local.

This document aims to illustrate the project and its use both from the point of view of simple use and from the point of view of local development and maintenance.

## Prima parte che non sarà sul doc README finale ma che servirà a voi plebaglia per capire come usare questo servizio a 360°

Prima faccio chiarezza su alcuni punti del progetto:

- non vi sono account per ora (forse per sempre)

- le playlist sono condivise tra tutti e non possono essere rese private in alcun modo. È musica, finchè dentro questo server non sarà presente roba tipo sfera ebbasta o elettra lamborghini, nessuno si deve vergognare (e nessuno verrà fucilato)

- l'utilizzo del servizio per chi è fuori da casa Zaganelli dipende esclusivamente dalla connessione internet di suddetto nucleo familiare e dal Relay Server di Francoforte del servizio Tailscale

- l'hardware non è al 100% a prova di tutto. Uno sbalzo di corrente o cose simili e potrebbe perdere tutti i dati. Il servizio è su github, il sistema operativo in flashdrive e possiedo una copia di tutte le canzoni inserite da me in un SSD a parte. Il problema si pone solo per le canzoni che terzi caricheranno quindi vi consiglo di farvi un piccolo backup fisico di ciò che caricate (qualche chiavetta oppure un piccolo ssd vostro) se volete essere sicuri di poterle avere in caso di problemi a qualsiasi servizio di download che utilizzerete. Ricordate, **_If buying isn’t owning, then piracy isn’t stealing_**

- non ho mai testato il server in condizioni di over load, quindi no so come si possa comportare se troppi utenti lo usano in contemporanea.

- il sito potrebbe inizialmente risultarvi "bloccato" per questioni di sicurezza del browser visto che è in http e non https, quindi non crea una connessione sicura. Non preoccupatevi. In locale nella mia rete non serve minimamente avere una connessione sicura mentre per gli esterni che si connetteranno con tailscale, la connessione sicura è già stabilita dalla VPN Tailscale. Quindi è gia tutto al 100% sicuro in ogni caso.

Premesse fatte, iniziamo a capire come usare questo servizio.

### Locale (in casa mia)

Veloce ed indolore. Per utilizzarlo basta semplicemente digitare su una qualsiasi barra di ricerca l'indirizzo _192.168.1.13/music_. Questo indirizzo potrebbe variare per via delle impostazioni del router, in quel caso basta vedere sull'admin page a quale nuovo indirizzo è associato l'host **zakkRaspberry**.

### Esterno (Tailscale)

Qui c'è qualche passaggio in più da seguire, ma è sempre semplice e diretto. Vi basterà scaricare l'app ufficiale di Tailscale oppure il servizio per linux e/o windows e/o macOS di tailscale e fare il login con l'account che vi verrà dato. Tra tutte le varie soluzioni questa risulta essere la migliore per ora. Abbiamo tutti lo stesso account creato appositamente per questo e ci basterà fare il login nel servizio Tailscale. Unico problema non so come worka con macOS e Windows visto che uso solo linux e android (I Use Arch BTW).
