import { useEffect, useState } from "react";
import { LogoContainer } from "./styled";
import { Spinner } from "../pix/styled";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";

export default function Starting() {
    const route = useRouter();
    useEffect(() => {
        const destination =
            Cookies.get("isLoggedIn") === "true" ? "/home" : "/newSignUp";
        const timeout = setTimeout(() => route.push(destination), 1500);
        return () => clearTimeout(timeout);
    }, []);
    return (
        <LogoContainer className="logo">
            <Spinner />
        </LogoContainer>
    );
}
