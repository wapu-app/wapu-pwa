import Image from "next/image";
import React from "react";
import { Checkbox, Label, XStack } from "tamagui";
import check from "../../public/check.svg";
export default function TamaguiCheckbox({
    onClick,
    value,
    size,
    label = "Accept terms and conditions",
    ...checkboxProps
}) {
    return (
        <XStack width="$width100" alignItems="center" gap="$2.5">
            <Checkbox
                size={size}
                value={value}
                onPress={onClick}
                height={"$3.5"}
                width={"$3.5"}
                borderColor={"$pink400"}
                borderWidth={"1"}
                borderRadius={"$1"}
                backgroundColor={"$transparent"}
                {...checkboxProps}
            >
                <Checkbox.Indicator>
                    {value ? <Image src={check} alt="icon" /> : ""}
                </Checkbox.Indicator>
            </Checkbox>

            <Label
                size={size}
                color={"$neutral11"}
                fontSize={"$5"}
                fontWeight={"$2"}
                lineHeight={"14.52px"}
            >
                {label}
            </Label>
        </XStack>
    );
}
