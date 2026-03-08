import { useEffect, useState } from "react";
import { LogoContainer } from "./styled";
import { Spinner } from "../pix/styled";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { getSettings } from "../../api/api";

export default function Starting() {
    const route = useRouter();
    const getDesignVersion = async () => {
        const settings = await getSettings();
        return settings;
    };
    useEffect(() => {
        getDesignVersion().then((settings) => { 
            if (Cookies.get("isLoggedIn") !== "true") {
                setTimeout(() => {
                    route.push(settings.webapp_design === "tamagui-1.0" ? "/newSignUp" : "/signup");
                }, 1500);
            }
            if (Cookies.get("isLoggedIn") === "true") {
                setTimeout(() => {
                    route.push(settings.webapp_design === "tamagui-1.0" ? "/home" : "/oldHome");
                }, 1500);
            }
        });
    }, []);
    return (
        <LogoContainer className="logo">
            <Spinner />
        </LogoContainer>
    );
}
