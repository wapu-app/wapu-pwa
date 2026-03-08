import { YStack, XStack, Paragraph, Button, Dialog } from "tamagui";
import Image from "next/image";
import { useRouter } from "next/router";
import CloseIcon from "../../public/icons/close_black.svg";
import ARSIcon from "../../public/icons/argentinaFlag.svg";
import DollarIcon from "../../public/icons/USDT.svg";
import TamaguiIconButton from "../TamaguiIconButton";

export default function TamaguiSendModal({ isOpen, onClose }) {
    const router = useRouter();
    return (
        <Dialog modal open={isOpen} onOpenChange={onClose}>
            <Dialog.Portal>
                <Dialog.Overlay
                    animation="slow"
                    opacity={0.9}
                    enterStyle={{ opacity: 0 }}
                    exitStyle={{ opacity: 0 }}
                    style={{
                        backgroundColor: "rgba(0, 0, 0, 0.8)",
                        zIndex: 10,
                        backdropFilter: "blur(30px)",
                        WebkitBackdropFilter: "blur(30px)", // For Safari support
                    }}
                />
                <YStack height="90%" gap={"$7"}>
                    <Dialog.Content
                        bordered
                        elevate
                        animation={[
                            "quicker",
                            { opacity: { overshootClamping: true } },
                        ]}
                        enterStyle={{ x: 0, y: -20, opacity: 0, scale: 0.9 }}
                        exitStyle={{ x: 0, y: 10, opacity: 0, scale: 0.95 }}
                        borderColor={"$pink400"}
                        backgroundColor={"$neutral4"}
                        width={"93%"}
                        borderRadius={"$8"}
                        padding={"$8"}
                        borderWidth={"$1"}
                        marginBottom={"$true"}
                    >
                        <YStack alignItems="center">
                            <YStack
                                width={"$width100"}
                                alignItems="center"
                                gap={"$8"}
                            >
                                <Button
                                    width="120%"
                                    height={"$6"}
                                    backgroundColor="transparent"
                                    borderWidth={"$true"}
                                    borderRadius={"$4"}
                                    justifyContent="flex-start"
                                    onPress={() => {
                                        router.push("/newSend");
                                    }}
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                    }}
                                >
                                    <Image
                                        src={ARSIcon}
                                        alt="ARS Icon"
                                        width={"$2"}
                                        height={"$2"}
                                    />
                                    <YStack
                                        alignItems="flex-start"
                                        gap={"$1"}
                                        paddingLeft={"$1"}
                                    >
                                        <Paragraph
                                            color={"$neutral13"}
                                            fontWeight={"$2"}
                                            fontSize={"$3"}
                                        >
                                            Send Local currency (ARS)
                                        </Paragraph>
                                        <Paragraph
                                            color={"$neutral9"}
                                            size={"$5"}
                                        >
                                            To Argentinian bank account
                                        </Paragraph>
                                    </YStack>
                                </Button>
                                <Button
                                    width="120%"
                                    height={"$6"}
                                    backgroundColor="transparent"
                                    borderWidth={"$true"}
                                    borderRadius={"$4"}
                                    justifyContent="flex-start"
                                    onPress={() => {
                                        router.push("/newWithdrawal");
                                    }}
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                    }}
                                >
                                    <Image
                                        src={DollarIcon}
                                        alt="Dollar Icon"
                                        width={"$2"}
                                        height={"$2"}
                                    />
                                    <YStack
                                        alignItems="flex-start"
                                        gap={"$1"}
                                        paddingLeft={"$1"}
                                    >
                                        <Paragraph
                                            color={"$neutral13"}
                                            fontWeight={"$2"}
                                            fontSize={"$3"}
                                        >
                                            Send Digital Dollar
                                        </Paragraph>
                                        <Paragraph
                                            color={"$neutral9"}
                                            size={"$5"}
                                        >
                                            To Wapu user, other blockchain
                                        </Paragraph>
                                    </YStack>
                                </Button>
                            </YStack>
                        </YStack>
                    </Dialog.Content>
                    <XStack
                        width={"$width100"}
                        justifyContent="center"
                        position="relative"
                        zIndex="20"
                    >
                        <YStack
                            borderColor={"$pink700"}
                            borderRadius={"$9"}
                            padding={"$2"}
                            backgroundColor={"rgba(255, 105, 180, 0.2)"}
                            borderWidth={"$0.75"}
                        >
                            <TamaguiIconButton
                                onClick={onClose}
                                icon={CloseIcon}
                                size={"$6"}
                                alignSelf="flex-start"
                            />
                        </YStack>
                    </XStack>
                </YStack>
            </Dialog.Portal>
        </Dialog>
    );
}
