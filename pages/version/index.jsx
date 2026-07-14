import { useState, useEffect } from "react";
import { getVersion } from "../../api/api";

export default function VersionPage () {
    const [backend, setBackend] = useState(null);
    const [backendError, setBackendError] = useState(null);
    const [buildInfo, setBuildInfo] = useState(null);

    useEffect(() => {
        const fetchVersion = async () => {
            try {
                const response = await getVersion();
                // El backend puede devolver 200 con un body inesperado (o un
                // 502 con HTML que igual "parsea" como texto en algún proxy):
                // solo confiamos en el dato si trae la forma esperada.
                if (response?.data?.backend) {
                    setBackend(response.data.backend);
                } else {
                    setBackendError("Respuesta inesperada del backend");
                }
            } catch (error) {
                // apiRequest siempre relanza como Error(string) (ej: 502 con
                // HTML en vez de JSON, o bloqueo CORS). Nunca debe tumbar el render.
                setBackendError(error?.message || "Backend no disponible");
            }
        };
        fetchVersion();
    }, []);

    useEffect(() => {
        const fetchBuildInfo = async () => {
            try {
                // Cache-bust para que el service worker (PWA) / caché HTTP no
                // devuelva un version.json viejo y muestre datos de un deploy previo.
                const response = await fetch(`/version.json?t=${Date.now()}`, {
                    cache: "no-store",
                });
                if (!response.ok) throw new Error(`HTTP ${response.status}`);
                setBuildInfo(await response.json());
            } catch (error) {
                // En dev (o sin build) version.json no existe: mostramos "local".
                setBuildInfo({ commit: "local", buildTime: null });
            }
        };
        fetchBuildInfo();
    }, []);

    const frontend_release = "1.0";

    const formatBuildTime = (iso) => {
        if (!iso) return "—";
        const date = new Date(iso);
        if (isNaN(date.getTime())) return iso;
        return `${date.toLocaleString()} (local) · ${iso} (UTC)`;
    };

    return (
        <>
            <p>Version</p>
            <p>Frontend
            <br/>Release: {frontend_release}
            <br/>Commit: {buildInfo ? buildInfo.commit : "Loading..."}
            <br/>Build: {buildInfo ? formatBuildTime(buildInfo.buildTime) : "Loading..."}</p>
            {backend ? (
                <p>Backend
                <br/>Release: {backend.release ?? "—"}
                <br/>Commit sha: {backend.commit_sha ?? "—"}</p>
            ) : backendError ? (
                <p>Backend: no disponible ({backendError})</p>
            ) : (
                <p>Backend: Loading...</p>
            )}
        </>
    );
}
