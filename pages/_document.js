import Document, { Html, Head, Main, NextScript } from "next/document";
import { ServerStyleSheet } from "styled-components";

export default class MyDocument extends Document {
    static async getInitialProps(ctx) {
        const sheet = new ServerStyleSheet();
        const originalRenderPage = ctx.renderPage;

        try {
            ctx.renderPage = () =>
                originalRenderPage({
                    enhanceApp: (App) => (props) =>
                        sheet.collectStyles(<App {...props} />),
                });

            const initialProps = await Document.getInitialProps(ctx);
            return {
                ...initialProps,
                styles: [initialProps.styles, sheet.getStyleElement()],
            };
        } finally {
            sheet.seal();
        }
    }

    render() {
        return (
            <Html>
                {/* Font stylesheets belong in Document, not _app's next/head
                    (Next.js warns against <link rel="stylesheet"> there). The
                    styled-components styles collected in getInitialProps are
                    injected into <Head/> automatically by Next. */}
                <Head>
                    <link
                        rel="stylesheet"
                        href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200"
                    />
                    <link
                        rel="stylesheet"
                        href="https://api.fontshare.com/v2/css?f[]=clash-display@1&display=swap"
                    />
                    {/* Geist (Sans + Mono), used by the price-calculator screen. */}
                    <link
                        rel="stylesheet"
                        href="https://fonts.googleapis.com/css2?family=Geist:wght@400;800&family=Geist+Mono:wght@400;500;600&display=swap"
                    />
                </Head>
                <body>
                    <Main />
                    <NextScript />
                </body>
            </Html>
        );
    }
}
