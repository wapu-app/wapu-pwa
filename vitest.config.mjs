import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            "react-native": "react-native-web",
        },
    },
    test: {
        environment: "jsdom",
        globals: true,
        setupFiles: ["./tests/setup.tsx"],
        include: ["tests/unit/**/*.{test,spec}.{js,jsx,ts,tsx}"],
        clearMocks: true,
        restoreMocks: true,
        coverage: {
            provider: "v8",
            reporter: ["text", "html", "json-summary"],
            reportsDirectory: "coverage",
            include: [
                "components/Tamagui*/index.{js,jsx,ts,tsx}",
                "hooks/useAmountNumpad.jsx",
                "pages/login/index.jsx",
                "pages/newSignUp/index.jsx",
                "pages/newDepositChoice/index.jsx",
                "pages/newBlockchainDeposit/index.jsx",
                "pages/newSend/index.jsx",
                "pages/newWithdrawal/index.jsx",
            ],
        },
    },
});
