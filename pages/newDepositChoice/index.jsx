import { useRouter } from "next/router";
import Image from "next/image";
import { XStack, YStack, Paragraph, H6 } from "tamagui";
import BlockchainIcon from "../../public/blockchain_deposit_icon.svg";
import AlternativeIcon from "../../public/alternative_deposit_icon.svg";
import LightningIcon from "../../public/lightning_deposit_icon.svg";
import NewHeaderButton from "../../components/newHeaderButton";

function index() {
    const router = useRouter();

    const handleBackClick = () => {
        router.back();
    };

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
                    Select a deposit method
                </H6>
                <XStack
                    width={"$width100"}
                    padding={"$3.5"}
                    borderRadius={"$1_5"}
                    borderWidth={"1"}
                    borderColor={"$neutral3"}
                    backgroundColor={"$neutral3"}
                    gap={"$2"}
                    justifyContent="space-between"
                >
                    <XStack
                        gap={"$3"}
                        alignItems="flex-start"
                        onPress={() => {
                            router.push("/newBlockchainDeposit");
                        }}
                    >
                        <Image src={BlockchainIcon} alt="icon" />
                        <YStack>
                            <Paragraph
                                color={"$neutral13"}
                                size={"$4"}
                                weight={"$2"}
                                textAlign="left"
                            >
                                Blockchain
                            </Paragraph>
                            <Paragraph
                                color={"$neutral10"}
                                size={"$5"}
                                weight={"$2"}
                                textAlign="left"
                            >
                                Network gas cost
                            </Paragraph>
                        </YStack>
                    </XStack>
                    <XStack />
                </XStack>
                <XStack
                    width={"$width100"}
                    padding={"$3.5"}
                    borderRadius={"$1_5"}
                    borderWidth={"1"}
                    borderColor={"$neutral3"}
                    backgroundColor={"$neutral3"}
                    gap={"$2"}
                    justifyContent="space-between"
                >
                    <XStack
                        gap={"$3"}
                        alignItems="flex-start"
                        onPress={() => {
                            router.push("/bitcoinDeposit");
                        }}
                    >
                        <Image src={LightningIcon} alt="icon" />
                        <YStack>
                            <Paragraph
                                color={"$neutral13"}
                                size={"$4"}
                                weight={"$2"}
                                textAlign="left"
                            >
                                Bitcoin
                            </Paragraph>
                            <Paragraph
                                color={"$neutral10"}
                                size={"$5"}
                                weight={"$2"}
                                textAlign="left"
                            >
                                Lightning Network cost
                            </Paragraph>
                        </YStack>
                    </XStack>
                    <XStack />
                </XStack>
                <XStack
                    width={"$width100"}
                    padding={"$3.5"}
                    borderRadius={"$1_5"}
                    borderWidth={"1"}
                    borderColor={"$neutral3"}
                    backgroundColor={"$neutral3"}
                    gap={"$2"}
                    justifyContent="space-between"
                >
                    <XStack
                        gap={"$3"}
                        alignItems="flex-start"
                        onPress={() => {
                            router.push("/newAlternativeDeposit");
                        }}
                    >
                        <Image src={AlternativeIcon} alt="icon" />
                        <YStack>
                            <Paragraph
                                color={"$neutral13"}
                                size={"$4"}
                                weight={"$2"}
                                textAlign="left"
                            >
                                Other Alternative
                            </Paragraph>
                            <Paragraph
                                color={"$neutral10"}
                                size={"$5"}
                                weight={"$2"}
                                textAlign="left"
                            >
                                3% of transaction cost
                            </Paragraph>
                        </YStack>
                    </XStack>
                    <XStack />
                </XStack>
            </YStack>
        </YStack>
    );
}

export default index;
