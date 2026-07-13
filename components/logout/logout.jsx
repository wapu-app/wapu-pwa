"use client";
import LogoutIcon from "../../public/icons/logout_white.svg";
import MenuRow from "../Burger/MenuRow";
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
    return <MenuRow icon={LogoutIcon} label={"Log out"} onPress={handleLogout} />;
}
