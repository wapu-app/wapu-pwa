import { render } from "@testing-library/react";
import type { RenderOptions, RenderResult } from "@testing-library/react";
import React from "react";
import type { ReactElement, ReactNode } from "react";
import { TamaguiProvider } from "tamagui";
import config from "../tamagui.config";

type TamaguiWrapperProps = {
    readonly children: ReactNode;
};

function TamaguiWrapper({ children }: TamaguiWrapperProps): ReactElement {
    return (
        <TamaguiProvider config={config} defaultTheme="dark">
            {children}
        </TamaguiProvider>
    );
}

export function renderWithTamagui(
    ui: ReactElement,
    options?: Omit<RenderOptions, "wrapper">,
): RenderResult {
    return render(ui, { wrapper: TamaguiWrapper, ...options });
}
