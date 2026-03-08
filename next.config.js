/** @type {import('next').NextConfig} */
const path = require("path");
// Load environment config (uses ES6 exports)
const fs = require('fs');
const configPath = path.join(__dirname, 'config/environment/current/index.js');
const configContent = fs.readFileSync(configPath, 'utf8');

// Parse the ES6 export format
const modifiedContent = configContent
    .replace('export default CONFIG;', 'return CONFIG;')
    .replace(/^const CONFIG/, 'var CONFIG');

const CONFIG = new Function(modifiedContent)();

const nextConfig = {
    reactStrictMode: true,
    compiler: {
        removeConsole: CONFIG.MODE !== "LOCAL", // Remove console.log in production
        styledComponents: true,
    },
    async rewrites() {
        return [
            {
                source: "/",
                destination: "/home",
            },
            {
                source: "/index",
                destination: "/_index",
            },
        ];
    },
    async redirects() {
        return [
            {
                source: "/kycFacePhoto",
                destination: "/kycPersonData",
                permanent: true,
            },
            {
                source: "/kycResidenceData",
                destination: "/kycPersonData",
                permanent: true,
            },
            {
                source: "/kycPassportData",
                destination: "/kycPersonData",
                permanent: true,
            },
            {
                source: "/unregisteredUsers",
                destination: "/signup",
                permanent: true,
            },
        ];
    },
    sassOptions: {
        includePaths: [path.join(__dirname, "styles")],
    },
};
const withPWA = require("next-pwa")({
    dest: "public", // Destination directory for the PWA files
    disable: CONFIG.MODE === "LOCAL", // Disable PWA in development mode
    register: true, // Register the PWA service worker
    skipWaiting: true, // Skip waiting for service worker activation
});

module.exports = withPWA(nextConfig);
