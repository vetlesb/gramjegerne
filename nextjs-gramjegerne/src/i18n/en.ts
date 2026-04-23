const en = {
  // Navigation
  nav: {
    gear: 'Gear',
    lists: 'Packing lists',
    trips: 'Trips',
    maps: 'Maps',
    settings: 'Settings',
  },

  // Settings
  settings: {
    title: 'Settings',
    account: 'Account',
    theme: 'Theme',
    language: 'Language',
    currency: 'Currency',
    signOut: 'Sign out',
    themes: {
      forrest: 'Forrest',
      ocean: 'Ocean',
      spring: 'Spring',
      rock: 'Rock',
    },
  },

  // Auth
  auth: {
    signIn: 'Sign in',
    signingIn: 'Signing in…',
    errorConfig: 'Login is misconfigured. Please try again later or contact support.',
    errorDenied: 'Access denied.',
    errorFailed: 'Login failed. Please try again.',
    errorGeneric: 'Something went wrong. Please try again.',
  },

  // Common actions
  actions: {
    add: 'Add',
    cancel: 'Cancel',
    create: 'Create',
    creating: 'Creating...',
    save: 'Save',
    saving: 'Saving...',
    delete: 'Delete',
    deleting: 'Deleting...',
    update: 'Update',
    updating: 'Updating...',
    edit: 'Edit',
    duplicate: 'Duplicate',
    remove: 'Remove',
    share: 'Share',
    adding: 'Adding...',
    back: 'Back',
  },

  // Common labels
  labels: {
    name: 'Name',
    title: 'Title',
    category: 'Category',
    weight: 'Weight',
    weightGrams: 'Weight (grams)',
    size: 'Size',
    calories: 'Calories',
    image: 'Image',
    description: 'Description',
    price: 'Price',
    days: 'Days',
    participants: 'Participants',
    quantity: 'Quantity',
  },

  // Sort options
  sort: {
    label: 'Sort',
    az: 'A-Z',
    weightLow: 'Weight (low)',
    weightHigh: 'Weight (high)',
    calories: 'Calories',
  },

  // View modes
  viewMode: {
    grid: 'Grid',
    list: 'List',
  },

  // Gear page
  gear: {
    addGear: 'Add gear',
    editGear: 'Edit gear',
    addCategory: 'Add category',
    categories: 'Categories',
    excel: 'Excel',
    gearCreated: 'Gear created!',
    gearUpdated: 'Gear updated successfully!',
    emptyState: 'You have not added any gear yet. The advantage is that it weighs 0 grams!',
    emptyCategoryState: 'No gear in this category yet. Add some new!',
    deleteConfirm: 'Are you sure you want to delete',
    deleteInLists: 'is in these lists, do you still want to delete it?',
    deleteCategoryConfirm: 'Are you sure you want to delete this category?',
    deleteCategoryWarning: 'Delete this category? Trips using it will lose their category.',
    cannotDeleteCategory: 'Cannot delete category. It is referenced by gear items.',
    couldNotDeleteGear: 'Could not delete gear',
    couldNotFetchCategories: 'Could not fetch categories.',
    couldNotUpdateGear: 'Could not update gear.',
    nameRequired: 'Name and slug are required.',
    removeImage: 'Remove image',
  },

  // Lists
  lists: {
    title: 'Lists',
    addList: 'Add List',
    newList: 'New',
    editList: 'Edit',
    listCreated: 'List created!',
    listUpdated: 'List updated!',
    shared: 'Shared',
    copy: 'copy',
    connectedTrip: 'Connected Trip (Optional)',
    noTripConnected: 'No trip connected',
    completed: 'Completed',
    overview: 'Overview',
    onBody: 'On body',
    removeOnBody: 'Remove on body',
    setOnBody: 'Set on body',
    itemSetOnBody: 'Item set as on body',
    itemRemovedOnBody: 'Item removed from on body',
    failedUpdateOnBody: 'Failed to update on body status. Please try again.',
    backpack: 'Backpack',
    packed: 'Packed',
    addToGear: 'Add to my gear',
    savedToMyLists: 'Saved to my lists',
    saveToMyLists: 'Save to my lists',
  },

  // Trips
  trips: {
    title: 'Trips',
    addTrip: 'Add Trip',
    saveTrip: 'Save trip',
    editTrip: 'Edit trip',
    deleteTrip: 'Are you sure you want to delete this trip?',
    connectMap: 'Connect map',
    connectList: 'Connect list',
    connectAList: 'Connect a list',
    noMapsYet: 'No maps connected yet.',
    noListsYet: 'No lists connected yet.',
    noListsToConnect: 'No available lists to connect. Create a list first.',
    listConnected: '1 list connected',
    listsConnected: '{count} lists connected',
    mapConnected: '1 map connected',
    mapsConnected: '{count} maps connected',
    mainMap: 'Main map',
    setAsMainMap: 'Set as main map',
    removeAsMainMap: 'Remove as main map',
    removeMainMap: 'Remove main map',
    owner: 'owner',
    me: 'Me',
    createTripToStart: 'Create a trip to start planning with friends.',
    savedToMyTrips: 'Already saved - View trip',
    saveToMyTrips: 'Save to my trips',
    newTrip: 'New trip',
    startDate: 'Start date',
    endDate: 'End date',
    descriptionPlaceholder: 'Optional description...',
    namePlaceholder: 'e.g., Jotunheimen Summer 2025',
    onlyICanAddMaps: 'Only I can add maps',
    tripNotFound: 'Trip not found',
  },

  // Maps
  maps: {
    title: 'Maps',
    newMap: 'New Map',
    addNewMap: 'Add new map',
    editMap: 'Edit Map',
    mapName: 'Map Name',
    defaultMapStyle: 'Default Map Style',
    noTopoKartverket: 'NO Topo (Kartverket)',
    satelliteEsri: 'Satellite (ESRI)',
    streetMapOsm: 'Street Map (OSM)',
    loadingMap: 'Loading map...',
    connectMap: 'Connect a map',
    noMapsToConnect: 'No available maps to connect. Create a map first.',
    connectedToAnotherTrip: 'Connected to another trip',
    mapCreated: 'Map created!',
    mapUpdated: 'Map updated!',
  },

  // Import/Export
  import: {
    title: 'Excel',
    description: 'Import or export your gear as .xlsx',
    processingFile: 'Processing file...',
    checkingCategories: 'Checking categories...',
    processingItems: 'Processing items...',
    importCompleted: 'Import completed successfully!',
    importCompletedWithErrors: 'Import completed with some errors',
  },

  // Clipboard
  clipboard: {
    copied: 'Link copied to clipboard!',
    failed: 'Could not copy link',
  },

  // Misc
  misc: {
    loading: 'Loading...',
    contact: 'Contact',
    all: 'All',
    items: 'pcs',
    spots: 'spots',
    routes: 'routes',
    noResults: 'No categories found.',
    createCategory: 'Create',
    existingImage: 'Existing image:',
    loadingTrips: 'Loading trips...',
    searchGearOrCategory: 'Search for gear or category',
    searchLists: 'Search for list',
    searchMaps: 'Search for map',
    noMatches: 'No matches',
  },
};

// Deep-convert all values to string for the type
type DeepString<T> = {
  [K in keyof T]: T[K] extends Record<string, unknown> ? DeepString<T[K]> : string;
};

export type Translations = DeepString<typeof en>;
export default en as Translations;
