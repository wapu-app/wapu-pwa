import { useState, useEffect } from "react";
import { getVersion } from "../../api/api";

export default function VersionPage () {
    const [message, setMessage] = useState(null);

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
    const frontend_release = "0.28.1";

    return (
        <>
            <p>Version</p>
                {message ? (
                    <p>Backend
                    <br/>Release: {message.backend.release}
                    <br/>Commit sha: {message.backend.commit_sha}<br/>
                    <br/>Frontend
                    <br/>Release: {frontend_release}</p>
                ) : (
                    <p>Backend: Loading...
                    <br/>Frontend Release: {frontend_release}
                    </p>
                )} 
        </>
    );
}
