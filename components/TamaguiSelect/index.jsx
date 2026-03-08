import React, { useState } from "react";
import arrowDown from "../../public/icons/Ic_Arrow_24px/Arrow24Down.svg";
import Image from "next/image";
import { Select } from "tamagui";

export const TamaguiSelect = ({ value, onChange, items, placeholder }) => {
    const [fontColor, setFontColor] = useState("$pink400");

    const handleValueChange = (newValue) => {
        const index = items.findIndex(
            (item) => item.name.toUpperCase() === newValue
        );
        onChange(index);
        setFontColor("$neutral12");
    };

    return (
        <Select value={value} onValueChange={handleValueChange}>
            <Select.Trigger
                width={"$width100"}
                height={"$5"}
                backgroundColor={"$neutral3"}
                borderColor={"$pink400"}
                borderWidth={"$1"}
                paddingTop={"$5"}
                paddingBottom={"$5"}
                paddingRight={"$4"}
                paddingLeft={"$4"}
            >
                <Select.Value color={fontColor} fontSize={"$3"}>
                    {value || placeholder}
                </Select.Value>
                <Image
                    src={arrowDown}
                    style={{ width: "16px", height: "auto" }}
                />
            </Select.Trigger>

            <Select.Content>
                <Select.ScrollUpButton />

                <Select.Viewport
                    height={"$heightAuto"}
                    display="flex"
                    backgroundColor={"$neutral5"}
                    padding={"$2"}
                    borderColor={"$neutral8"}
                    borderWidth={"$1"}
                >
                    <Select.Group>
                        <Select.Item
                            index={0}
                            key="default"
                            value=""
                            disabled
                            padding={"$2"}
                        >
                            <Select.ItemText color={"$neutral11"}>
                                {placeholder}
                            </Select.ItemText>
                        </Select.Item>
                        {items.map((item, i) => (
                            <Select.Item
                                index={i + 1}
                                key={item.id}
                                value={item.name.toUpperCase()}
                                padding={"$2"}
                            >
                                <Select.ItemText color={"$neutral12"}>
                                    {item.name}
                                </Select.ItemText>
                            </Select.Item>
                        ))}
                    </Select.Group>
                </Select.Viewport>

                <Select.ScrollDownButton />
            </Select.Content>
        </Select>
    );
};
