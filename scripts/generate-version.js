/**
 * Genera public/version.json en tiempo de build con el commit y la fecha/hora
 * del build. La página /version lo consume por fetch (evita que webpack/Amplify
 * congelen el valor en la caché de .next/cache).
 *
 * Fuente del commit, en orden de preferencia:
 *   1. AWS_COMMIT_ID  -> variable que AWS Amplify inyecta en el build (SHA completo)
 *   2. git rev-parse  -> fallback local / otros CI
 *   3. "unknown"      -> si nada está disponible (no inventamos un valor)
 */
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

function getCommit() {
    if (process.env.AWS_COMMIT_ID) {
        return process.env.AWS_COMMIT_ID.trim().slice(0, 7);
    }
    try {
        return execSync("git rev-parse --short HEAD", {
            encoding: "utf8",
            stdio: ["ignore", "pipe", "ignore"],
        }).trim();
    } catch (error) {
        return "unknown";
    }
}

const versionInfo = {
    commit: getCommit(),
    buildTime: new Date().toISOString(), // siempre UTC
};

const outPath = path.join(__dirname, "..", "public", "version.json");
fs.writeFileSync(outPath, JSON.stringify(versionInfo, null, 2) + "\n");

console.log(
    `[generate-version] ${outPath} -> commit=${versionInfo.commit} buildTime=${versionInfo.buildTime}`
);
