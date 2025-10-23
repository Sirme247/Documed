import {create} from "zustand";

const useStore = create((set,get )=>({
    theme: "light",
    // localStorage.getItem("theme") ??
    user: null, // Don't initialize from localStorage here
    navigationHistory: [],
    addToNavigationHistory: (path, name) => {
    const { navigationHistory } = get();
    
    // Don't add if it's the same as the last item
    if (navigationHistory.length > 0 && 
        navigationHistory[navigationHistory.length - 1].path === path) {
      return;
    }
    
    // Add the new path
    set({
      navigationHistory: [...navigationHistory, { path, name, timestamp: Date.now() }]
    });
  },
  clearNavigationHistory: () => {
    set({ navigationHistory: [] });
  },
  removeFromNavigationHistory: (count = 1) => {
    const { navigationHistory } = get();
    set({
      navigationHistory: navigationHistory.slice(0, -count)
    });
  },
  
  // Navigate back in history
  navigateBackInHistory: (toIndex) => {
    const { navigationHistory } = get();
    set({
      navigationHistory: navigationHistory.slice(0, toIndex + 1)
    });
  },

    setTheme: (value) => set({ theme: value}),
    setCredentials: (user) => {
        localStorage.setItem("user", JSON.stringify(user)); // Persist to localStorage
        set({ user });
        console.log("User set in store:", user);
    },
    signOut: () => {
        localStorage.removeItem("user");
        localStorage.removeItem("authToken");
        set({ user: null });
    },
}))

export default useStore;

