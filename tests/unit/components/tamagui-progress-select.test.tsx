import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

import TamaguiProgressBar from "../../../components/TamaguiProgressBar";
import { TamaguiSelect } from "../../../components/TamaguiSelect";
import { renderWithTamagui } from "../../test-utils";

type SelectRootProps = {
    readonly children: ReactNode;
    readonly onValueChange?: (value: string) => void;
};

type SelectItemProps = {
    readonly children: ReactNode;
    readonly disabled?: boolean;
    readonly value: string;
};

type PassthroughProps = {
    readonly children?: ReactNode;
};

vi.mock("tamagui", async (importOriginal) => {
    const actual = await importOriginal<typeof import("tamagui")>();
    const react = await import("react");
    let handleValueChange: (value: string) => void = () => undefined;
    const Passthrough = ({ children }: PassthroughProps) =>
        react.createElement(react.Fragment, null, children);
    const FakeSelect = Object.assign(
        ({ children, onValueChange }: SelectRootProps) => {
            handleValueChange = onValueChange ?? (() => undefined);
            return react.createElement("div", null, children);
        },
        {
            Content: Passthrough,
            Group: Passthrough,
            Item: ({ children, disabled, value }: SelectItemProps) =>
                react.createElement(
                    "button",
                    {
                        disabled,
                        onClick: () => {
                            if (!disabled) {
                                handleValueChange(value);
                            }
                        },
                        type: "button",
                    },
                    children,
                ),
            ItemText: Passthrough,
            ScrollDownButton: () => null,
            ScrollUpButton: () => null,
            Trigger: Passthrough,
            Value: Passthrough,
            Viewport: Passthrough,
        },
    );

    return { ...actual, Select: FakeSelect };
});

describe("TamaguiProgressBar and TamaguiSelect", () => {
    it("renders the progress value and maps a selected item to its index", async () => {
        const user = userEvent.setup();
        const onChange = vi.fn();
        renderWithTamagui(
            <>
                <TamaguiProgressBar
                    progress={66}
                    status="Weak"
                    sizeProp={2}
                    width={undefined}
                    backgroundColor={undefined}
                />
                <TamaguiSelect
                    value=""
                    placeholder="Select network"
                    onChange={onChange}
                    items={[
                        { id: "eth", name: "Ethereum" },
                        { id: "liquid", name: "Liquid" },
                    ]}
                />
            </>,
        );

        await user.click(screen.getByRole("button", { name: "Liquid" }));

        expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "66");
        expect(onChange).toHaveBeenCalledWith(1);
    });
});
