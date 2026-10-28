// =============================================================
// PRINTFORGE STORAGE & PERSISTENCE MANAGER
// Risolve la perdita di dati al refresh (F5): salva su LocalStorage
// =============================================================

const STORAGE_KEYS = {
  CURRENT_USER: 'pf_currentUser_v1',
  CART: 'pf_shoppingCart_v1',
  CREATOR_REQUESTS: 'pf_creatorRequests_v1',
  MAKERS_LIST: 'pf_makersList_v1',
  CHAT_HISTORY: 'pf_chatHistory_v1',
  TRACKER_STEP: 'pf_trackerStep_v1',
  WIZARD_PREFERENCES: 'pf_wizardPrefs_v1'
};

const StorageManager = {
  saveUser(user) {
    try {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
    } catch (e) {
      console.warn("Storage saveUser error:", e);
    }
  },

  loadUser() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      console.warn("Storage loadUser error:", e);
      return null;
    }
  },

  saveCart(cart) {
    try {
      localStorage.setItem(STORAGE_KEYS.CART, JSON.stringify(cart));
    } catch (e) {
      console.warn("Storage saveCart error:", e);
    }
  },

  loadCart() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CART);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      console.warn("Storage loadCart error:", e);
      return null;
    }
  },

  saveRequests(requests) {
    try {
      localStorage.setItem(STORAGE_KEYS.CREATOR_REQUESTS, JSON.stringify(requests));
    } catch (e) {
      console.warn("Storage saveRequests error:", e);
    }
  },

  loadRequests() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CREATOR_REQUESTS);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      console.warn("Storage loadRequests error:", e);
      return null;
    }
  },

  saveMakers(makers) {
    try {
      localStorage.setItem(STORAGE_KEYS.MAKERS_LIST, JSON.stringify(makers));
    } catch (e) {
      console.warn("Storage saveMakers error:", e);
    }
  },

  loadMakers() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.MAKERS_LIST);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      console.warn("Storage loadMakers error:", e);
      return null;
    }
  },

  saveTrackerStep(step) {
    try {
      localStorage.setItem(STORAGE_KEYS.TRACKER_STEP, JSON.stringify(step));
    } catch (e) {
      console.warn("Storage saveTrackerStep error:", e);
    }
  },

  loadTrackerStep() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.TRACKER_STEP);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      return null;
    }
  },

  clearAllData() {
    try {
      Object.values(STORAGE_KEYS).forEach(k => localStorage.removeItem(k));
      console.log("PrintForge cache azzerata con successo.");
    } catch (e) {
      console.warn("Storage clearAllData error:", e);
    }
  }
};
