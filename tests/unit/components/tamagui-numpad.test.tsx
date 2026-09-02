import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { describe, expect, it, vi } from "vitest";

import TamaguiNumpad from "../../../components/TamaguiNumpad";
import { renderWithTamagui } from "../../test-utils";

describe("TamaguiNumpad", () => {
    it("emits digits, decimals, backspace and toggle state", async () => {
        const user = userEvent.setup();
        const onChange = vi.fn();
        const onToggle = vi.fn();
        const { rerender } = renderWithTamagui(
            <TamaguiNumpad value="" onChange={onChange} enabled onToggle={onToggle} />,
        );

        await user.click(screen.getByRole("button", { name: "1" }));
        await user.click(screen.getByRole("button", { name: "decimal point" }));
        rerender(
            <TamaguiNumpad value="1.2" onChange={onChange} enabled onToggle={onToggle} />,
        );
        await user.click(screen.getByRole("button", { name: "decimal point" }));
        await user.click(screen.getByRole("button", { name: "delete" }));
        await user.click(screen.getByRole("button", { name: "Use keyboard" }));

        expect(onChange).toHaveBeenCalledWith("1");
        expect(onChange).toHaveBeenCalledWith("0.");
        expect(onChange).toHaveBeenCalledWith("1.");
        expect(onChange).not.toHaveBeenCalledWith("1.2.");
        expect(onToggle).toHaveBeenCalledOnce();

        rerender(
            <TamaguiNumpad value="12" onChange={onChange} enabled={false} onToggle={onToggle} />,
        );
        expect(screen.getByRole("button", { name: "Use numpad" })).toHaveAttribute(
            "aria-pressed",
            "false",
        );
        expect(screen.queryByRole("button", { name: "1" })).not.toBeInTheDocument();
    });

    it("hides the decimal key when integer input is required", () => {
        renderWithTamagui(
            <TamaguiNumpad value="" onChange={vi.fn()} enabled onToggle={vi.fn()} allowDecimal={false} />,
        );

        expect(screen.queryByRole("button", { name: "decimal point" })).not.toBeInTheDocument();
        expect(screen.getByRole("button", { name: "0" })).toBeInTheDocument();
    });
});
