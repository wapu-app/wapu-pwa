import { createFont, createTamagui, createTokens, createMedia } from "tamagui";
// Create a font:
const interFont = createFont({
    family: "Inter, Helvetica, Arial, sans-serif",
    size: {
        0.5: 24,
        1: 20,
        2: 18,
        3: 16,
        4: 14,
        5: 12,
        6: 10,
    },
    lineHeight: {
        1: 22,
        2: 29
    },
    weight: {
        1: "600",
        2: "700",
    },
    letterSpacing: {
        1: 0,
        2: -1,
        3: 1,
    },
});
const clash_display = createFont({
    family: `'Clash Display', sans-serif`,
    size: {
        1: 48,
        2: 40,
        3: 36,
        4: 32,
        5: 28,
        6: 24,
    },
    lineHeight: {
        1: 22,
    },
    weight: {
        1: "700",
        2: "600",
    },
    letterSpacing: {
        1: 0,
        2: -1,
        3: 1,
    },
});
// Set up our tokens

export const tokens = createTokens({
    size: {
        width100: "100%",
        width90: "90%",
        widthAuto: "auto",
        height100: "100%",
        height90: "90%",
        heightAuto: "auto",
        true: "auto",
    },
    space: {
        true: 0,
        0.25: 0.5,
        0.5: 1,
        0.75: 1.5,
        1: 2,
        1.5: 4,
        2: 7,
        2.5: 10,
        3: 13,
        3.5: 16,
        4: 18,
        4.5: 21,
        5: 24,
        6: 32,
        7: 39,
        8: 46,
        9: 56,
        10: 60,
        11: 74,
        12: 88,
        13: 102,
        14: 116,
        15: 130,
        16: 144,
        17: 158,
        18: 172,
        19: 186,
        20: 200,
    },
    radius: {
        $1: 3,
        $1_5: 4,
        $2: 5,
        $3: 7,
        $4: 9,
        $5: 10,
        $6: 16,
        $7: 19,
        $8: 22,
        $9: 26,
        $10: 34,
        true: 16,
    },
    zIndex: { sm: 0, md: 100, lg: 200, true: 0 },
    color: {
        neutral1: "#020202",
        neutral2: "#0B0B0C",
        neutral3: "#181619",
        neutral4: "#28282C",
        neutral5: "#2E2E32",
        neutral6: "#34343A",
        neutral7: "#3E3E44",
        neutral8: "#504F57",
        neutral9: "#706F78",
        neutral10: "#7E7D86",
        neutral11: "#A09FA6",
        neutral12: "#D8D8DA",
        neutral13: "#FFFFFF",
        pink900: "#6F006A",
        pink800: "#851062",
        pink700: "#A61A6E",
        pink600: "#C62676",
        pink500: "#E7357C",
        pink400: "#F3537E",
        pink300: "#F7859C",
        pink200: "#FF94B4",
        pink100: "#FCBED1",
        blue900: "#0B067D",
        blue800: "#0F09A4",
        blue700: "#251ECA",
        blue600: "#3D37CB",
        blue500: "#504DE7",
        blue400: "#626AF2",
        blue300: "#808FF9",
        blue200: "#A4B7FD",
        blue100: "#C7D4FE",
        semanticGreen: "#529300",
        semanticRed: "#FF151C",
        semanticYellow: "#F5D90A",
        semanticBlue: "#4202C9",
        semanticGray: "#CCBECB",
        transparent: "transparent",
    },
});

const config = createTamagui({
    fonts: {
        // for tamagui, heading and body are assumed
        heading: clash_display,
        body: interFont,
    },
    tokens,
    themes: {
        light: {
            bg: tokens.color.neutral12,
            color: tokens.color.neutral1,
        },
        dark: {
            bg: tokens.color.neutral1,
            color: tokens.color.neutral13,
        },
    },

    // For web-only, media queries work out of the box and you can avoid the
    // `createMedia` call here by passing the media object directly.
    // If you are going to target React Native, use `createMedia` (it's an identity
    // function on web so you can import it there without concern).
    media: createMedia({
        sm: { maxWidth: 860 },
        gtSm: { minWidth: 860 + 1 },
        short: { maxHeight: 820 },
        hoverNone: { hover: "none" },
        pointerCoarse: { pointer: "coarse" },
    }),

    /* // Shorthands
    // Adds <View m={10} /> to <View margin={10} />
    shorthands: {
        px: "paddingHorizontal",
        f: "flex",
        m: "margin",
        w: "width",
    } as const, */
});

export default config;
