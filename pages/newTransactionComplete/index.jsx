import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { XStack, YStack, H6, Paragraph } from "tamagui";
import TamaguiButton from "../../components/TamaguiButton";
import TamaguiIconButton from "../../components/TamaguiIconButton";
import TickIcon from "../../public/tick.svg";
import NewHeaderButton from "../../components/newHeaderButton";

export default function index() {
    const router = useRouter();

    const { id, transaction_type } = router.query;

    const [headerMessage, setHeaderMessage] = useState("");
    const [bodyMessage, setBodyMessage] = useState("");

    const handleBackClick = () => {
        router.back();
    };

    const handleBackHome = () => {
        router.push("/home");
    };

    const handleDetails = () => {
        router.push("/newTransactionDetail?id=" + id + "&back=home");
    };

    useEffect(() => {
        if (transaction_type === "deposit") {
            setHeaderMessage("Deposit");
            setBodyMessage(
                "This will take a few minutes. You can check the status on the History page."
            );
        } else if (transaction_type === "send_digital") {
            setHeaderMessage("Send Digital Dollar");
        }
    }, [transaction_type]);

    return (
        <YStack
            height={"$height100"}
            width={"$width90"}
            justifyContent="space-between"
            overflow="auto"
            scrollbarWidth="thin"
        >
            {/* we should create a newHeader component and add it to the pages */}
            <NewHeaderButton onClick={handleBackClick} isCloseButton={true}>
                {headerMessage}
            </NewHeaderButton>
            <XStack
                paddingTop={"$3"}
                alignItems="center"
                justifyContent="space-between"
                width={"$width90"}
            >
                <XStack />
                {/* to balance the layout*/}
            </XStack>
            <H6 color={"$neutral13"} textAlign="center" paddingBottom={"$4"}>
                Done!
            </H6>
            <TamaguiIconButton
                icon={TickIcon}
                style={{ paddingBottom: "30%" }}
            />
            <Paragraph color={"$neutral12"} textAlign="center" weight={"$1"}>
                {bodyMessage}
            </Paragraph>
            <YStack
                justifyContent="space-between"
                gap={"$4"}
                paddingBottom={"$6"}
            >
                <TamaguiButton
                    secondary
                    text={"View Details"}
                    onClick={handleDetails}
                />
                <TamaguiButton text={"Go Home"} onClick={handleBackHome} />
            </YStack>
        </YStack>
    );
}
