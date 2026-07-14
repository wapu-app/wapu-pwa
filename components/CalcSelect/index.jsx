"use client";
import React from "react";
import Image from "next/image";
import { Select, XStack, Paragraph } from "tamagui";
import arrowDown from "../../public/icons/Ic_Arrow_24px/Arrow24Down.svg";
import { GEIST_MONO } from "../../utils/fonts";

// Compact select styled after the home CurrencySelect, generalized to any
// { value, label } options. Select.Content uses a high zIndex so its popover
// paints above a fullscreen Dialog overlay. `onChange` receives the value itself
// (not an index).
export default function CalcSelect({
    value,
    onChange,
    options,
    label,
    minWidth = 96,
}) {
    const selected =
        options.find((option) => option.value === value) || options[0] || null;

    // Shared frame styling for both the interactive trigger and the static pill.
    const frame = {
        width: "$widthAuto",
        height: "$5",
        minWidth,
        maxWidth: 220,
        alignItems: "center",
        backgroundColor: "$brandSurfaceDeep",
        borderColor: "$neutral8",
        borderWidth: "$1",
        borderRadius: "$4",
    };

    // A single choice isn't a choice: render static text (no chevron) instead of a dropdown that can't change anything.
    if (options.length <= 1) {
        return (
            <XStack {...frame} aria-label={label} paddingHorizontal={"$3"}>
                <Paragraph
                    color={"$brandOffWhite"}
                    fontSize={"$4"}
                    fontWeight={"$1"}
                    style={{ fontFamily: GEIST_MONO, letterSpacing: "0.02em" }}
                >
                    {selected ? selected.label : ""}
                </Paragraph>
            </XStack>
        );
    }

    return (
        <Select
            value={String(value)}
            onValueChange={(next) => {
                const match = options.find((o) => String(o.value) === next);
                if (match) {
                    onChange(match.value);
                }
            }}
            defaultValue={String(value)}
        >
            <Select.Trigger
                {...frame}
                aria-label={label}
                display={"flex"}
                justifyContent={"space-between"}
                paddingLeft={"$3"}
                paddingRight={"$2.5"}
                gap={"$2"}
                hoverStyle={{ borderColor: "$pink500" }}
                pressStyle={{ borderColor: "$pink500" }}
            >
                <Select.Value
                    color={"$brandOffWhite"}
                    fontSize={"$4"}
                    fontWeight={"$1"}
                    style={{ fontFamily: GEIST_MONO, letterSpacing: "0.02em" }}
                >
                    {selected ? selected.label : ""}
                </Select.Value>
                <Image
                    src={arrowDown}
                    alt=""
                    style={{ width: "14px", height: "auto" }}
                />
            </Select.Trigger>

            <Select.Content zIndex={100000}>
                <Select.ScrollUpButton />
                <Select.Viewport
                    display="flex"
                    backgroundColor={"$brandSurface"}
                    padding={"$1.5"}
                    borderColor={"$neutral8"}
                    borderWidth={"$1"}
                    borderRadius={"$4"}
                    style={{ maxHeight: "none" }}
                >
                    <Select.Group>
                        {/* Not useMemo: must stay a zero-hook component so the early return above is legal. */}
                        {options.map((option, i) => (
                            <Select.Item
                                index={i}
                                key={String(option.value)}
                                value={String(option.value)}
                                paddingVertical={"$2"}
                                paddingHorizontal={"$2.5"}
                                borderRadius={"$2"}
                            >
                                <Select.ItemText
                                    color={"$brandOffWhite"}
                                    fontSize={"$4"}
                                    style={{ fontFamily: GEIST_MONO }}
                                >
                                    {option.label}
                                </Select.ItemText>
                            </Select.Item>
                        ))}
                    </Select.Group>
                </Select.Viewport>
                <Select.ScrollDownButton />
            </Select.Content>
        </Select>
    );
}
