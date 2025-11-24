import {create} from "zustand";

const useStore = create((set,get )=>({
    theme: "light",
    
    user: null, 
    navigationHistory: [],
    addToNavigationHistory: (path, name) => {
    const { navigationHistory } = get();
    
    if (navigationHistory.length > 0 && 
        navigationHistory[navigationHistory.length - 1].path === path) {
      return;
    }
    
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
  
  
  navigateBackInHistory: (toIndex) => {
    const { navigationHistory } = get();
    set({
      navigationHistory: navigationHistory.slice(0, toIndex + 1)
    });
  },

    setTheme: (value) => set({ theme: value}),
    setCredentials: (user) => {
        localStorage.setItem("user", JSON.stringify(user)); 
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

