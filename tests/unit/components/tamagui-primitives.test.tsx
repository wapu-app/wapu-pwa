import { fireEvent, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { describe, expect, it, vi } from "vitest";

import TamaguiButton from "../../../components/TamaguiButton";
import TamaguiCheckbox from "../../../components/TamaguiCheckbox";
import TamaguiGuide from "../../../components/TamaguiGuide";
import TamaguiIconButton from "../../../components/TamaguiIconButton";
import TamaguiInput from "../../../components/TamaguiInput";
import TamaguiLink from "../../../components/TamaguiLink";
import { renderWithTamagui } from "../../test-utils";

describe("Tamagui primitives", () => {
    it("prevents a second async submit while the first press is pending", async () => {
        // Given
        let resolveSubmit: () => void = () => undefined;
        const onClick = vi.fn(
            () =>
                new Promise<void>((resolve) => {
                    resolveSubmit = resolve;
                }),
        );
        renderWithTamagui(
            <TamaguiButton
                text="Submit"
                onClick={onClick}
                href={undefined}
                secondary={false}
                terciary={false}
                isDisabled={false}
                target={undefined}
                middle={false}
                isLoading={false}
            />,
        );
        const button = screen.getByRole("button", { name: "Submit" });

        // When
        fireEvent.click(button);
        fireEvent.click(button);

        // Then
        expect(onClick).toHaveBeenCalledTimes(1);
        resolveSubmit();
        await waitFor(() => expect(button).not.toBeDisabled());
    });

    it("renders disabled and loading button states", () => {
        // Given / When
        renderWithTamagui(
            <>
                <TamaguiButton
                    text="Disabled"
                    onClick={undefined}
                    href={undefined}
                    secondary={false}
                    terciary={false}
                    isDisabled
                    target={undefined}
                    middle={false}
                    isLoading={false}
                />
                <TamaguiButton
                    text="Loading"
                    onClick={undefined}
                    href={undefined}
                    secondary={false}
                    terciary={false}
                    isDisabled={false}
                    target={undefined}
                    middle={false}
                    isLoading
                />
            </>,
        );

        // Then
        expect(screen.getByRole("button", { name: "Disabled" })).toBeDisabled();
        expect(screen.getAllByRole("button")).toHaveLength(2);
    });

    it("renders links with the target href", () => {
        // Given / When
        renderWithTamagui(
            <TamaguiButton
                text="Help"
                onClick={undefined}
                href="https://wapupay.com/#ayuda"
                secondary={false}
                terciary={false}
                isDisabled={false}
                target="_blank"
                middle={false}
                isLoading={false}
            />,
        );

        // Then
        const link = screen.getByRole("link", { name: "Help" });
        expect(link).toHaveAttribute("href", "https://wapupay.com/#ayuda");
        expect(link).toHaveAttribute("target", "_blank");
    });

    it("toggles checkbox callbacks and renders its checked indicator", () => {
        // Given
        const onClick = vi.fn();

        // When
        const { rerender } = renderWithTamagui(
            <TamaguiCheckbox
                value={false}
                onClick={onClick}
                size={undefined}
                label="Accept terms"
            />,
        );
        fireEvent.click(screen.getByRole("checkbox"));
        rerender(
            <TamaguiCheckbox
                value
                onClick={onClick}
                size={undefined}
                label="Accept terms"
            />,
        );

        // Then
        expect(onClick).toHaveBeenCalledTimes(1);
        expect(screen.getByAltText("icon")).toBeInTheDocument();
    });

    it("renders guide text and icon", () => {
        // Given / When
        renderWithTamagui(<TamaguiGuide text="Network failed" icon="/error.svg" type="error" />);

        // Then
        expect(screen.getByText("Network failed")).toBeInTheDocument();
        expect(screen.getByAltText("icon")).toBeInTheDocument();
    });

    it("renders supported guide variants", () => {
        renderWithTamagui(
            <>
                <TamaguiGuide text="Information" icon="/info.svg" type="info" />
                <TamaguiGuide text="Success" icon="/success.svg" type="success" />
            </>,
        );

        expect(screen.getByText("Information")).toBeInTheDocument();
        expect(screen.getByText("Success")).toBeInTheDocument();
    });

    it("calls icon button and link callbacks", async () => {
        // Given
        const user = userEvent.setup();
        const onIconClick = vi.fn();
        const onLinkClick = vi.fn();
        renderWithTamagui(
            <>
                <TamaguiIconButton
                    icon="/icon.svg"
                    onClick={onIconClick}
                    isDisabled={false}
                    size={undefined}
                    backgroundColor={undefined}
                    borderColor={undefined}
                    notification={false}
                    gap={undefined}
                    label="Open"
                    colorLabel={undefined}
                    fontSizeLabel={undefined}
                    fontWeightLabel={undefined}
                    style={undefined}
                />
                <TamaguiLink
                    text="Forgot password?"
                    onClick={onLinkClick}
                    style={undefined}
                />
            </>,
        );

        // When
        await user.click(screen.getByRole("button", { name: "icon" }));
        await user.click(screen.getByRole("button", { name: "Forgot password?" }));

        // Then
        expect(onIconClick).toHaveBeenCalledTimes(1);
        expect(onLinkClick).toHaveBeenCalledTimes(1);
    });

    it("keeps a disabled icon button inactive", () => {
        const onClick = vi.fn();
        renderWithTamagui(
            <TamaguiIconButton
                icon="/icon.svg"
                onClick={onClick}
                isDisabled
                size={undefined}
                backgroundColor={undefined}
                borderColor={undefined}
                notification
                gap={undefined}
                label="Open"
                colorLabel={undefined}
                fontSizeLabel={undefined}
                fontWeightLabel={undefined}
                style={undefined}
            />,
        );

        const button = screen.getByRole("button", { name: "icon" });
        expect(button).toBeDisabled();
        fireEvent.click(button);
        expect(onClick).not.toHaveBeenCalled();
    });

    it("updates input value and calls its trailing icon callback", async () => {
        // Given
        const user = userEvent.setup();
        const onChange = vi.fn();
        const onPressIcon = vi.fn();
        renderWithTamagui(
            <TamaguiInput
                value=""
                onChange={onChange}
                secureTextEntry={false}
                label="Password"
                placeholder="Enter your password"
                icon="/eye.svg"
                onFocusChange={undefined}
                error={false}
                onPressIcon={onPressIcon}
            />,
        );

        // When
        await user.type(screen.getByPlaceholderText("Enter your password"), "secret");
        await user.click(screen.getByRole("button"));

        // Then
        expect(onChange).toHaveBeenLastCalledWith("t");
        expect(onPressIcon).toHaveBeenCalledTimes(1);
    });

});
