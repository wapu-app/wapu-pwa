import React, { useState, useEffect } from "react";
import Cookies from "js-cookie";
import dynamic from "next/dynamic";

const ModuleLoading = () => (
    <p className="animate-bounce text-white font-bold">Loading...</p>
);
const AddToIosSafari = dynamic(() => import("./AddToIosSafari"), {
    loading: () => <ModuleLoading />,
});
const AddToMobileChrome = dynamic(() => import("./AddToMobileChrome"), {
    loading: () => <ModuleLoading />,
});
const AddToMobileFirefox = dynamic(() => import("./AddToMobileFirefox"), {
    loading: () => <ModuleLoading />,
});
const AddToMobileFirefoxIos = dynamic(() => import("./AddToMobileFirefoxIos"), {
    loading: () => <ModuleLoading />,
});
const AddToMobileChromeIos = dynamic(() => import("./AddToMobileChromeIos"), {
    loading: () => <ModuleLoading />,
});
const AddToSamsung = dynamic(() => import("./AddToSamsung"), {
    loading: () => <ModuleLoading />,
});
const AddToOtherBrowser = dynamic(() => import("./AddToOtherBrowser"), {
    loading: () => <ModuleLoading />,
});

import useUserAgent from "../../hooks/userAgent";

const COOKIE_NAME = "addToHomeScreenPrompt";

export default function AddToHomeScreen() {
    const [displayPrompt, setDisplayPrompt] = useState("");
    const { userAgent, isMobile, isStandalone, isIOS } = useUserAgent();

    const closePrompt = () => {
        setDisplayPrompt("");
    };

    const doNotShowAgain = () => {
        // Create date 1 year from now
        const date = new Date();
        date.setFullYear(date.getFullYear() + 1);
        Cookies.set(COOKIE_NAME, "dontShow", { expires: date }); // Set cookie for a year
        setDisplayPrompt("");
    };

    useEffect(() => {
        const addToHomeScreenPromptCookie = Cookies.get(COOKIE_NAME);

        if (addToHomeScreenPromptCookie !== "dontShow") {
            // Only show prompt if user is on mobile and app is not installed
            if (isMobile && !isStandalone) {
                if (userAgent === "Safari") {
                    setDisplayPrompt("safari");
                } else if (userAgent === "Chrome") {
                    setDisplayPrompt("chrome");
                } else if (userAgent === "Firefox") {
                    setDisplayPrompt("firefox");
                } else if (userAgent === "FirefoxiOS") {
                    setDisplayPrompt("firefoxIos");
                } else if (userAgent === "ChromeiOS") {
                    setDisplayPrompt("chromeIos");
                } else if (userAgent === "SamsungBrowser") {
                    setDisplayPrompt("samsung");
                } else {
                    setDisplayPrompt("other");
                }
            }
        } else {
        }
    }, [userAgent, isMobile, isStandalone, isIOS]);

    const Prompt = () => (
        <>
            {
                {
                    safari: (
                        <AddToIosSafari
                            closePrompt={closePrompt}
                            doNotShowAgain={doNotShowAgain}
                        />
                    ),
                    chrome: (
                        <AddToMobileChrome
                            closePrompt={closePrompt}
                            doNotShowAgain={doNotShowAgain}
                        />
                    ),
                    firefox: (
                        <AddToMobileFirefox
                            closePrompt={closePrompt}
                            doNotShowAgain={doNotShowAgain}
                        />
                    ),
                    firefoxIos: (
                        <AddToMobileFirefoxIos
                            closePrompt={closePrompt}
                            doNotShowAgain={doNotShowAgain}
                        />
                    ),
                    chromeIos: (
                        <AddToMobileChromeIos
                            closePrompt={closePrompt}
                            doNotShowAgain={doNotShowAgain}
                        />
                    ),
                    samsung: (
                        <AddToSamsung
                            closePrompt={closePrompt}
                            doNotShowAgain={doNotShowAgain}
                        />
                    ),
                    other: (
                        <AddToOtherBrowser
                            closePrompt={closePrompt}
                            doNotShowAgain={doNotShowAgain}
                        />
                    ),
                    "": <></>,
                }[displayPrompt]
            }
        </>
    );

    return (
        <>
            {displayPrompt !== "" ? (
                <>
                    <div
                        style={{
                            width: "90%",
                            height: "auto",
                            background: "#0b0b0b",
                            borderRadius: "1rem",
                            border: "1px solid #b5179e",
                            zIndex: "10",
                            position: "absolute",
                        }}
                        onClick={closePrompt}
                    >
                        <Prompt />
                    </div>
                </>
            ) : (
                <></>
            )}
        </>
    );
}
