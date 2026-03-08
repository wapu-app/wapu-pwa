import React from "react";
import { Layout } from "../components/layout";
import { UserContextProvider } from "../context/userContext";
import Head from "next/head";
import CONFIG from "../config/environment/current";
import "./styles.css";
import { TamaguiProvider } from "tamagui";
import config from "../tamagui.config";
const metadata = {
    title: "Wapu",
    description: "Pay always as a local",
    manifest: "/manifest.json",
    generator: "Next.js",
    keywords: ["nextjs", "nextjs13", "next13", "pwa", "next-pwa"],
    themeColor: [{ media: "(prefers-color-scheme: dark)", color: "#fff" }],
    authors: [],
    viewport:
        "minimum-scale=1, initial-scale=1, width=device-width, shrink-to-fit=no, viewport-fit=cover, user-scalable=no",
    icons: [
        { rel: "apple-touch-icon", url: "/wapu_192x192.png" },
        { rel: "icon", url: "/wapu_192x192.png" },
    ],
};

function MyApp({ Component, pageProps }) {
    return (
        <React.Fragment>
            <Head>
                {/* Google Tag Manager */}
                {CONFIG.MODE === "PROD" ? (
                    <script
                        dangerouslySetInnerHTML={{
                            __html: `
            (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});
            var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;
            j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
            })(window,document,'script','dataLayer', 'GTM-WPXBKFQZ');
          `,
                        }}
                    />
                ) : (
                    <></>
                )}
                <link rel="manifest" href={metadata.manifest} />
                <link
                    rel="stylesheet"
                    href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200"
                />
                <link href="https://api.fontshare.com/v2/css?f[]=clash-display@1&display=swap" rel="stylesheet"/> 
                <link rel="icon" href="/wapu_logo_1.ico" />
                <meta name="mobile-web-app-capable" content="yes" />
                <meta name="apple-mobile-web-app-capable" content="yes" />
                <meta
                    name="apple-mobile-web-app-status-bar-style"
                    content="black-translucent"
                />
                <meta
                    name="apple-mobile-web-app-title"
                    content={metadata.title}
                />
                <meta name="description" content={metadata.description} />
                <meta name="viewport" content={metadata.viewport} />

                <meta httpEquiv="cleartype" content="on" />
            </Head>
            <UserContextProvider>
                <TamaguiProvider config={config}>
                    <Layout>
                        <Component {...pageProps} />
                    </Layout>
                </TamaguiProvider>
            </UserContextProvider>
        </React.Fragment>
    );
}

export default MyApp;
