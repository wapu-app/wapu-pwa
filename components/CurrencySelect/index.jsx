import React, { useState, useMemo } from "react";
import arrowDown from "../../public/icons/Ic_Arrow_24px/Arrow24Down.svg";
import Image from "next/image";
import { Select } from "tamagui";

export const CurrencySelect = ({ value, onChange, items }) => {
    return (
        <Select
            value={value}
            onValueChange={(newValue) => {
                const index = items.findIndex(
                    (item) => item.name.toUpperCase() === newValue
                );
                onChange(index);
            }}
            defaultValue={value}
        >
            <Select.Trigger
                width={"$widthAuto"}
                height={"$5"}
                display={"flex"}
                alignItems={"center"}
                backgroundColor={"$neutral5"}
                borderColor={"$neutral8"}
                borderWidth={"$1"}
                color={"$pink500"}
                paddingLeft={"10px"}
                paddingRight={"10px"}
                gap={"5px"}
            >
                <Select.Value
                    color={"$neutral12"}
                    width={"$width100"}
                    fontSize={"$5"}
                >
                    {value}
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
                    style={{ maxHeight: "none" }}
                >
                    <Select.Group>
                        {useMemo(
                            () =>
                                items.map((item, i) => {
                                    return (
                                        <Select.Item
                                            index={i}
                                            key={item.id}
                                            value={item.name.toUpperCase()}
                                            paddingBottom={"10px"}
                                        >
                                            <Select.ItemText
                                                color={"$neutral12"}
                                            >
                                                {item.name}
                                            </Select.ItemText>
                                        </Select.Item>
                                    );
                                }),
                            [items]
                        )}
                    </Select.Group>
                </Select.Viewport>

                <Select.ScrollDownButton />
            </Select.Content>
        </Select>
    );
};
