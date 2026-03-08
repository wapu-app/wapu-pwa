import { useState } from "react";
import MessageModal from "../MessageModal";
import NewTabLink from "../NewTabLink";
import Image from "next/image";
import { useMediaQuery } from "@react-hook/media-query";
import classes from "./media-icons.module.css";

export default function MediaIcons() {
    const [isModalOpen, setIsModalOpen] = useState(false);

    const isWideScreen = useMediaQuery("(min-width: 1024px)");

    const toggleModal = () => {
        setIsModalOpen(!isModalOpen);
    };

    if (!isWideScreen && isModalOpen) {
        setIsModalOpen(false);
    }

    return (
        <div className={classes["media-icons"]}>
            {/* <button className={classes["bell-icon"]} onClick={toggleModal}>
                <Image
                    src="/social-media/bell-icon.png"
                    alt="Instagram logo"
                    height={45}
                    width={45}
                />
                {isModalOpen && (
                    <MessageModal onClose={toggleModal}>
                        <p>
                            Visit our website{" "}
                            <NewTabLink
                                href="https://wapupay.com/"
                                target="_blank"
                                rel="noopener noreferrer"
                                className={classes.link}
                            >
                                here
                            </NewTabLink>
                            !
                        </p>
                        <p>Follow us on our social media!</p>
                    </MessageModal>
                )}
            </button> */}
            <button className={classes["media-icon"]}>
                <NewTabLink href="https://www.instagram.com/wapu.app/">
                    <Image
                        src="/social-media/instagram-icon.png"
                        alt="Instagram logo"
                        height={35}
                        width={35}
                    />
                </NewTabLink>
            </button>
            <button className={classes["media-icon"]}>
                <NewTabLink href="https://twitter.com/wapupay">
                    <Image
                        src="/social-media/twitter-X-icon.png"
                        alt="Twitter-X logo"
                        height={35}
                        width={35}
                    />
                </NewTabLink>
            </button>
            <button className={classes["media-icon"]}>
                <NewTabLink href="https://discord.gg/cN4tuZjeTE">
                    <Image
                        src="/social-media/discord-icon.png"
                        alt="Discord logo"
                        height={35}
                        width={35}
                    />
                </NewTabLink>
            </button>
        </div>
    );
}
