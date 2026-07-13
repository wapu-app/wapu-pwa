const CONFIG = {
    MODE: "STG",
    API: {
        BASE_URL: "https://be-stage.wapu.app",
    },
    // Kill switch for the client-side API response cache (utils/apiCache.js).
    // Set to false so every getOrFetch() call hits the backend directly.
    API_CACHE_ENABLED: true,
};

export default CONFIG;
