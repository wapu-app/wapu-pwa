import { React, useState } from "react";
import { XStack } from "tamagui";
import HistoryIcon from "../../public/icons/Ic_Nav/HistoryOff.svg";
import HomeIcon from "../../public/icons/Ic_Nav/HomeOff.svg";
import FocusedHistoryIcon from "../../public/icons/Ic_Nav/HistoryOn.svg";
import FocusedHomeIcon from "../../public/icons/Ic_Nav/HomeOn.svg";
import iconMainButton from "../../public/icons/Ic_Nav/iconMainButton.svg";
import navigationAsset from "../../public/navigationAsset.svg";
import TamaguiIconButton from "../TamaguiIconButton";
import TamaguiSendModal from "../TamaguiSendModal";
import Image from "next/image";
import { useRouter } from "next/router";
import { usePathname } from "next/navigation";
export default function NewFooterNavigation() {
    const router = useRouter();
    const pathname = usePathname();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const openModal = () => setIsModalOpen(true);
    const closeModal = () => setIsModalOpen(false);

    const handleHomeClick = () => {
        router.push("/home")
    }

    const handleHistoryClick = () => {
        router.push("/newMovements")
    }

    const handleSendClick = () => {
        openModal()
    }

    return (
        <XStack
            width="$width100"
            height={"8%"}
            display="flex"
            justifyContent="space-around"
            backgroundColor="$neutral3"
            position="absolute"
            bottom={0}
            zIndex={0}
        >
            <Image
                src={navigationAsset}
                alt="asset"
                style={{ position: "absolute"}}
                /* for the center button design */
            />
            <TamaguiIconButton
                icon={pathname === "/home" ? FocusedHomeIcon : HomeIcon}
                fontSizeLabel={"$6"}
                colorLabel={"$neutral8"}
                fontWeightLabel={"$1"}
                onClick={handleHomeClick}
            />
            <TamaguiIconButton
                icon={iconMainButton}
                size={"70px"}
                backgroundColor={"#53182d"}
                borderColor={"$pink400"}
                style={{ top: "-35px"}}
                onClick={handleSendClick}
            />
            <TamaguiIconButton
                icon={ pathname === "/newMovements" ? FocusedHistoryIcon : HistoryIcon}
                fontSizeLabel={"$6"}
                colorLabel={"$neutral8"}
                fontWeightLabel={"$1"}
                onClick={handleHistoryClick}
            />
            <TamaguiSendModal isOpen={isModalOpen} onClose={closeModal} />
        </XStack>
    );
}
