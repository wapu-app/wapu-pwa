import { useRouter } from "next/router";
import { XStack, YStack, H6, Text } from "tamagui";
import TamaguiButton from "../../components/TamaguiButton";
import TamaguiIconButton from "../../components/TamaguiIconButton";
import HourglassIcon from "../../public/hourglassIcon.svg";
import NewHeaderButton from "../../components/newHeaderButton";

export default function index() {
    const router = useRouter();
    let message = "";
    let header = "";
    const { id, transaction_type } = router.query;

    const handleBackHome = () => {
        router.push("/home");
    };

    const handleDetails = () => {
        router.push("/newTransactionDetail?id=" + id + "&back=home");
    };
    switch (transaction_type) {
        case "fiat_transfer":
            header = "Standard Send";
            message = "It will take up to 24 hours to be completed";
            break;
        case "fast_fiat_transfer":
            header = "Fast Send";
            message = "It will take up to 2 hours to be completed";
            break;
        case "withdraw":
            header = "Send Digital Dollar";
            message = "It will take up to 4 hours to be completed";
            break;
    }

    return (
        <YStack
            height={"$height100"}
            width={"$width90"}
            justifyContent="space-between"
            overflow="auto"
            scrollbarWidth="thin"
            paddingTop="$3"
            paddingBottom="$3"
        >
            <NewHeaderButton onClick={handleBackHome} isCloseButton={true}>
                {header}
            </NewHeaderButton>
            <XStack
                width="90%"
                alignItems="center"
                justifyContent="space-between"
            ></XStack>
            <H6 color={"$neutral13"} textAlign="center" paddingBottom={"$4"}>
                Transaction in progress
            </H6>
            <TamaguiIconButton
                icon={HourglassIcon}
                style={{ paddingBottom: "30%" }}
            />
            <Text
                color={"$neutral13"}
                fontWeight={"bold"}
                fontSize={"$3"}
                textAlign="center"
            >
                {message}
            </Text>
            <YStack justifyContent="space-between" space={"$4"}>
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
