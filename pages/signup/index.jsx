import Login from "../../components/login/login";
import LoginByMagicLink from "../../components/loginMagicLink";
import SignUp from "../../components/SignUp/signup";
import { Wrapper } from "./styled";
import { useRouter } from "next/router";
import { useState, useEffect } from "react";

export function unregisteredUsers() {
    const router = useRouter();
    const [referralCode, setReferralCode] = useState(null);
    const [tempPass, setTempPass] = useState(null);
    const [isSignUpOpen, setIsSignUpOpen] = useState(false);

    useEffect(() => {
        if (router.asPath !== router.route) {
            setReferralCode(router.query.ref);
            setTempPass(router.query.tempPassword);
            if (router.query.ref) {
                setIsSignUpOpen(true);
            }
        }
    }, [router]);

    return (
        <Wrapper>
            <SignUp
                isOpen={isSignUpOpen}
                setIsOpen={setIsSignUpOpen}
                referralCode={referralCode}
            />
            <Login />
            <LoginByMagicLink tempPass={tempPass} />
        </Wrapper>
    );
}

export default unregisteredUsers;
