import { describe, expect, it } from "vitest";

import { isAnAuthablePage } from "../../../utils/validations";

describe("isAnAuthablePage", () => {
    it("treats an unresolved pathname as public while the router hydrates", () => {
        expect(isAnAuthablePage(null)).toBe(false);
    });
});
