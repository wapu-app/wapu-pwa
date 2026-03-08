"use client";
import Logout from "../../public/icons/logout_black.svg";
import { MenuButton, CustomIcon } from "../Burger/styled";
import userLogout from "../../utils/userLogout";
import Cookies from "js-cookie";

export default function logout() {
    const handleLogout = async () => {
        try {
            await userLogout();
            Cookies.remove("access_token");
        } catch (error) {
            console.log(error);
        }
    };
    return (
        <>
            <MenuButton onClick={handleLogout} text="Log Out">
                <CustomIcon width={20} height={20} src={Logout} alt={Logout} />
                Log out
            </MenuButton>
        </>
    );
}
