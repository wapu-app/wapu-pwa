import Image from "next/image";
import { Anchor, Button, Paragraph, XStack, YStack } from "tamagui";

export default function MenuRow({
    icon,
    label,
    onPress,
    href = null,
    target = null,
    disabled = false,
}) {
    const row = (
        <Button
            width={"$width100"}
            backgroundColor={"$transparent"}
            borderWidth={0}
            justifyContent="flex-start"
            paddingHorizontal={"$3.5"}
            paddingVertical={"$3"}
            pressStyle={{ backgroundColor: "$neutral3" }}
            disabled={disabled}
            opacity={disabled ? 0.5 : 1}
            onPress={href ? undefined : onPress}
        >
            <XStack width={"$width100"} alignItems="center" gap={"$3.5"}>
                <YStack
                    width={40}
                    height={40}
                    borderRadius={"$10"}
                    backgroundColor={disabled ? "$neutral4" : "$pink500"}
                    alignItems="center"
                    justifyContent="center"
                >
                    <Image src={icon} alt={label} width={20} height={20} />
                </YStack>
                <Paragraph color={"$neutral13"} fontSize={"$3"} fontWeight={"$1"}>
                    {label}
                </Paragraph>
            </XStack>
        </Button>
    );

    if (href) {
        return (
            <Anchor
                href={href}
                target={target}
                onClick={onPress}
                style={{ textDecoration: "none", width: "100%" }}
            >
                {row}
            </Anchor>
        );
    }

    return row;
}
