import type {Translations} from './en';

const nb: Translations = {
  // Navigation
  nav: {
    gear: 'Utstyr',
    lists: 'Lister',
    trips: 'Turer',
    maps: 'Kart',
    settings: 'Innstillinger',
  },

  // Settings
  settings: {
    title: 'Innstillinger',
    account: 'Konto',
    theme: 'Tema',
    language: 'Språk',
    signOut: 'Logg ut',
    themes: {
      forrest: 'Skog',
      ocean: 'Hav',
      spring: 'Vår',
      rock: 'Fjell',
    },
  },

  // Auth
  auth: {
    signIn: 'Logg inn',
    signingIn: 'Logger inn…',
    errorConfig: 'Innlogging er feilkonfigurert. Prøv igjen senere eller kontakt support.',
    errorDenied: 'Tilgang nektet.',
    errorFailed: 'Innlogging feilet. Prøv igjen.',
    errorGeneric: 'Noe gikk galt. Prøv igjen.',
  },

  // Common actions
  actions: {
    add: 'Legg til',
    cancel: 'Avbryt',
    create: 'Opprett',
    creating: 'Oppretter...',
    save: 'Lagre',
    saving: 'Lagrer...',
    delete: 'Slett',
    deleting: 'Sletter...',
    update: 'Oppdater',
    updating: 'Oppdaterer...',
    edit: 'Rediger',
    duplicate: 'Dupliser',
    remove: 'Fjern',
    share: 'Del',
    adding: 'Legger til...',
    back: 'Tilbake',
  },

  // Common labels
  labels: {
    name: 'Navn',
    title: 'Tittel',
    category: 'Kategori',
    weight: 'Vekt',
    weightGrams: 'Vekt (gram)',
    size: 'Størrelse',
    calories: 'Kalorier',
    image: 'Bilde',
    description: 'Beskrivelse',
    price: 'Pris (NOK)',
    days: 'Dager',
    participants: 'Deltakere',
    quantity: 'Antall',
  },

  // Sort options
  sort: {
    label: 'Sorter',
    az: 'A-Å',
    weightLow: 'Vekt (lav)',
    weightHigh: 'Vekt (høy)',
    calories: 'Kalorier',
  },

  // View modes
  viewMode: {
    grid: 'Rutenett',
    list: 'Liste',
  },

  // Gear page
  gear: {
    addGear: 'Legg til utstyr',
    editGear: 'Rediger utstyr',
    addCategory: 'Legg til kategori',
    categories: 'Kategorier',
    excel: 'Excel',
    gearCreated: 'Utstyr opprettet!',
    gearUpdated: 'Utstyr oppdatert!',
    emptyState: 'Du har ikke lagt til noe utstyr ennå. Fordelen er at det veier 0 gram!',
    emptyCategoryState: 'Ingen utstyr i denne kategorien ennå. Legg til noe nytt!',
    deleteConfirm: 'Er du sikker på at du vil slette',
    deleteInLists: 'er i disse listene, vil du fortsatt slette det?',
    deleteCategoryConfirm: 'Er du sikker på at du vil slette denne kategorien?',
    deleteCategoryWarning: 'Slette denne kategorien? Turer som bruker den vil miste kategorien.',
    cannotDeleteCategory: 'Kan ikke slette kategori. Den har referanser i utstyr.',
    couldNotDeleteGear: 'Kunne ikke slette utstyr',
    couldNotFetchCategories: 'Kunne ikke hente kategorier.',
    couldNotUpdateGear: 'Kunne ikke oppdatere utstyr.',
    nameRequired: 'Navn og slug er obligatorisk.',
    removeImage: 'Fjern bilde',
  },

  // Lists
  lists: {
    title: 'Lister',
    addList: 'Legg til liste',
    newList: 'Ny',
    editList: 'Rediger',
    listCreated: 'Liste opprettet!',
    listUpdated: 'Liste oppdatert!',
    shared: 'Delt',
    copy: 'kopi',
    connectedTrip: 'Tilknyttet tur (valgfritt)',
    noTripConnected: 'Ingen tur tilknyttet',
    completed: 'Fullført',
    overview: 'Oversikt',
    onBody: 'På kroppen',
    removeOnBody: 'Fjern fra kroppen',
    setOnBody: 'Sett på kroppen',
    itemSetOnBody: 'Gjenstand satt på kroppen',
    itemRemovedOnBody: 'Gjenstand fjernet fra kroppen',
    failedUpdateOnBody: 'Kunne ikke oppdatere status. Prøv igjen.',
    backpack: 'Sekk',
    packed: 'Pakket',
    addToGear: 'Legg til i mitt utstyr',
    savedToMyLists: 'Lagret i mine lister',
    saveToMyLists: 'Lagre i mine lister',
  },

  // Trips
  trips: {
    title: 'Turer',
    addTrip: 'Legg til tur',
    saveTrip: 'Lagre tur',
    editTrip: 'Rediger tur',
    deleteTrip: 'Er du sikker på at du vil slette denne turen?',
    connectMap: 'Koble kart',
    connectList: 'Koble liste',
    noMapsYet: 'Ingen kart tilkoblet ennå.',
    noListsYet: 'Ingen lister tilkoblet ennå.',
    mainMap: 'Hovedkart',
    setAsMainMap: 'Sett som hovedkart',
    removeAsMainMap: 'Fjern som hovedkart',
    removeMainMap: 'Fjern hovedkart',
    owner: 'eier',
    me: 'Meg',
    createTripToStart: 'Opprett en tur for å begynne å planlegge med venner.',
    savedToMyTrips: 'Allerede lagret - Se tur',
    saveToMyTrips: 'Lagre i mine turer',
    newTrip: 'Ny tur',
    startDate: 'Startdato',
    endDate: 'Sluttdato',
    descriptionPlaceholder: 'Valgfri beskrivelse...',
    namePlaceholder: 'f.eks. Jotunheimen sommer 2025',
    onlyICanAddMaps: 'Bare jeg kan legge til kart',
    tripNotFound: 'Turen ble ikke funnet',
  },

  // Maps
  maps: {
    title: 'Kart',
    newMap: 'Nytt kart',
    addNewMap: 'Legg til nytt kart',
    editMap: 'Rediger kart',
    mapName: 'Kartnavn',
    defaultMapStyle: 'Standard kartstil',
    noTopoKartverket: 'NO Topo (Kartverket)',
    satelliteEsri: 'Satellitt (ESRI)',
    streetMapOsm: 'Gatekart (OSM)',
    loadingMap: 'Laster kart...',
    connectMap: 'Koble et kart',
    noMapsToConnect: 'Ingen kart tilgjengelig. Opprett et kart først.',
    connectedToAnotherTrip: 'Tilkoblet en annen tur',
    mapCreated: 'Kart opprettet!',
    mapUpdated: 'Kart oppdatert!',
  },

  // Import/Export
  import: {
    title: 'Excel',
    description: 'Importer eller eksporter utstyret ditt som .xlsx',
    processingFile: 'Behandler fil...',
    checkingCategories: 'Sjekker kategorier...',
    processingItems: 'Behandler gjenstander...',
    importCompleted: 'Import fullført!',
    importCompletedWithErrors: 'Import fullført med noen feil',
  },

  // Clipboard
  clipboard: {
    copied: 'Lenke kopiert!',
    failed: 'Kunne ikke kopiere lenke',
  },

  // Misc
  misc: {
    loading: 'Laster...',
    contact: 'Kontakt',
    all: 'Alle',
    items: 'gjenstander',
    spots: 'steder',
    routes: 'ruter',
    noResults: 'Ingen kategorier funnet.',
    createCategory: 'Opprett',
    existingImage: 'Eksisterende bilde:',
    loadingTrips: 'Laster turer...',
    searchGearOrCategory: 'Søk etter utstyr eller kategori',
  },
};

export default nb;
