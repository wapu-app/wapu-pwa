import { useState, useEffect } from "react";
import { getVersion } from "../../api/api";

export default function VersionPage () {
    const [message, setMessage] = useState(null);
    const [buildInfo, setBuildInfo] = useState(null);

    useEffect(() => {
        const fetchVersion = async () => {
            try {
                const response = await getVersion();
                setMessage(response.data);
            } catch (error) {
                setMessage(error.message);
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

    const frontend_release = "0.28.1";

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
            {message ? (
                <p>Backend
                <br/>Release: {message.backend?.release}
                <br/>Commit sha: {message.backend?.commit_sha}</p>
            ) : (
                <p>Backend: Loading...</p>
            )}
        </>
    );
}
