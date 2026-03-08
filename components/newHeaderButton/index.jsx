import { XStack, Text, YStack } from "tamagui";
import TamaguiIconButton from "../TamaguiIconButton";
import arrowBack from "../../public/arrowBack.svg";
import closeIcon from "../../public/closeIcon.svg";

export default function NewHeaderButton({
    children,
    icon,
    onClick,
    isCloseButton,
}) {
    return (
        <XStack
            width={"$width100"}
            marginTop={"$5"}
            alignItems="center"
            justifyContent="space-between"
        >
            {!isCloseButton && (
                <TamaguiIconButton icon={arrowBack} onClick={onClick} />
            )}
            <Text color={"$neutral13"} fontWeight={"bold"} fontSize={"$3"}>
                {children}
            </Text>
            {icon ? (
                <YStack>
                    <TamaguiIconButton icon={icon} isDisabled={true} />
                </YStack>
            ) : (
                <YStack />
            )}
            {isCloseButton && (
                <TamaguiIconButton icon={closeIcon} onClick={onClick} />
            )}
        </XStack>
    );
}
