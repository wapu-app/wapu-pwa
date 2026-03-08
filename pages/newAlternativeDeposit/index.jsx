import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { YStack, H6, Text } from "tamagui";
import TamaguiButton from "../../components/TamaguiButton";
import NewHeaderButton from "../../components/newHeaderButton";
import { getSettings } from "../../api/api";
import { useUserContext } from "../../context/userContext";

function index() {
    const router = useRouter();
    const [externalKycUrl, setExternalKycUrl] = useState("");
    const { user } = useUserContext();
    const handleBackClick = () => {
        router.back();
    };

    useEffect(() => {
        async function fetchSettings() {
            const settings = await getSettings();
            setExternalKycUrl(settings.external_kyc_url);
        }
        fetchSettings();
    }, []);

    return (
        <YStack
            height={"$height100"}
            width={"$width90"}
            gap={"$3.5"}
            paddingTop={"$3.5"}
            paddingBottom={"$3.5"}
        >
            <NewHeaderButton onClick={handleBackClick}>Deposit</NewHeaderButton>

            <YStack
                gap={"$3"}
                width={"$width100"}
                justifyContent="center"
                alignItems="center"
                alignContent="center"
                padding={"$3.5"}
            >
                <H6
                    color={"$neutral13"}
                    weight={"$2"}
                    textAlign="left"
                    lineHeight={"$2"}
                    marginBottom={"$5"}
                >
                    How would you like to deposit?
                </H6>
                <Text
                    color={"$neutral12"}
                    fontWeight={"$1"}
                    fontSize={"$3"}
                    flex={1}
                    textAlign="left"
                >
                    👋 We're here to help! You can deposit Euros, Dollars,
                    Reals, and more through Wise, Pix, or bank transfer.
                </Text>
                <Text
                    color={"$neutral12"}
                    fontWeight={"$1"}
                    fontSize={"$3"}
                    flex={1}
                    textAlign="left"
                >
                    For bank transfers, please complete the complete the ID
                    validation process (KYC) first.
                </Text>
                <Text
                    color={"$neutral12"}
                    fontWeight={"$1"}
                    fontSize={"$3"}
                    flex={1}
                    textAlign="left"
                >
                    Feel free to message us with the currency and country of
                    origin!
                </Text>
            </YStack>
            <YStack gap="$3.5">
                <TamaguiButton
                    href={
                        "https://api.whatsapp.com/send?phone=5491124060850&text=Hi%2C%20I%20need%20to%20top%20up%20my%20Wapu%20account%20through%20Wise%2C%20Pix%20or%20a%20bank%20transfer.%20My%20user%20is%20" +
                        user.username
                    }
                    text={"Contact us"}
                />
                {user.kycStatus !== "Accepted" ? (
                    <TamaguiButton
                        text={"Complete ID Validation"}
                        onClick={() => {
                            router.push(
                                externalKycUrl +
                                    "?username=" +
                                    encodeURIComponent(user.username)
                            );
                        }}
                        secondary
                    />
                ) : (
                    ""
                )}
            </YStack>
        </YStack>
    );
}

export default index;
