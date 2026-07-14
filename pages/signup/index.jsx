import { useRouter } from "next/router";
import { useEffect } from "react";

// /signup is deprecated. Redirect to /newSignUp preserving query params
// (ref, tempPassword, etc.) so referral links and magic-link flows still work.
// next.config.js already handles server-side redirects, but this catches
// client-side navigations (router.push/Link) that bypass config redirects.
export default function SignupRedirect() {
    const router = useRouter();

    useEffect(() => {
        if (!router.isReady) return;
        router.replace({ pathname: "/newSignUp", query: router.query });
    }, [router.isReady, router]);

    return null;
}
