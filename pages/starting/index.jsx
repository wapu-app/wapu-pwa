import { useEffect } from "react";
import { LogoContainer } from "./styled";
import Spinner from "../../components/CustomSpinner";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { getAccessToken, isAuthExpired } from "../../utils/auth";

export default function Starting() {
    const route = useRouter();

    useEffect(() => {
        let isMounted = true;

        const resolveDestination = async () => {
            if (Cookies.get("isLoggedIn") === "true" && !isAuthExpired()) {
                route.replace("/home");
                return;
            }

            const accessToken = await getAccessToken();
            if (isMounted) {
                route.replace(accessToken ? "/home" : "/newSignUp");
            }
        };

        resolveDestination();
        return () => {
            isMounted = false;
        };
    }, [route]);

    return (
        <LogoContainer className="logo">
            <Spinner />
        </LogoContainer>
    );
}
