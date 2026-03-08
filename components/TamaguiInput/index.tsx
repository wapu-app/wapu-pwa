import React, { useState, useEffect } from "react";
import { Button, Input, Label, XStack, YStack } from "tamagui";
import Image from "next/image";

export default function TamaguiInput({
    value,
    onChange,
    secureTextEntry,
    placeholder,
    label,
    icon,
    onFocusChange,
    error,
    onPressIcon,
    ...props
}) {
    const [focus, setFocus] = useState(false);
    const [borderColor, setBorderColor] = useState("$pink400");

    useEffect(() => {
        if (error) {
            setBorderColor("$semanticRed");
        } else if (focus) {
            setBorderColor("$pink500");
        } else {
            setBorderColor("$pink400");
        }
    }, [error, focus]);

    const handleFocus = () => {
        setFocus(true);
    };

    const handleBlur = () => {
        setFocus(false);
    };

    const handleOnChange = (e) => {
        onChange(e.target.value);
    };

    return (
        <YStack width={"$width100"} gap={"$2"}>
            <Label
                color={"$neutral13"}
                fontSize={"$3"}
                fontFamily={"$body"}
                fontWeight={"$2"}
            >
                {label}
            </Label>
            <XStack
                backgroundColor={"$neutral3"}
                borderWidth={"$1"}
                borderColor={borderColor}
                borderRadius={"$7"}
            >
                <Input
                    value={value}
                    onChange={handleOnChange}
                    secureTextEntry={secureTextEntry}
                    placeholder={placeholder}
                    onBlur={handleBlur}
                    onFocus={handleFocus}
                    width={"$width100"}
                    backgroundColor={"$neutral3"}
                    color={"$neutral13"}
                    height={"$5"}
                    fontSize={"$3"}
                    paddingTop={"$4"}
                    paddingBottom={"$4"}
                    paddingRight={"$4"}
                    paddingLeft={"$4"}
                    position={"relative"}
                    placeholderTextColor={"$pink400"}
                    borderWidth={"0"}
                    outlineWidth={"0"}
                    focusVisibleStyle={{
                        outlineWidth: 0,
                    }}
                    {...props}
                />
                {icon ? (
                    <Button
                        onPress={onPressIcon}
                        backgroundColor={"$transparent"}
                        color={"$neutral13"}
                        bordered={false}
                        paddingRight={"$3"}
                    >
                        <Image src={icon} alt={"icon"} />
                    </Button>
                ) : (
                    <></>
                )}
            </XStack>
        </YStack>
    );
}
