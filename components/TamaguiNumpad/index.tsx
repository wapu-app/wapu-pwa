import React from "react";
import { Button, Paragraph, XStack, YStack } from "tamagui";
import { GEIST_MONO } from "../../utils/fonts";

const BACKSPACE = "⌫";

const KEY_ROWS = [
    ["1", "2", "3"],
    ["4", "5", "6"],
    ["7", "8", "9"],
    [".", "0", BACKSPACE],
];

/**
 * On-screen numpad for amount inputs. Presentational: availability, the
 * mobile gate and the persisted preference live in hooks/useAmountNumpad.
 * Emits the next value string through onChange (same contract as
 * TamaguiInput.onChange) so each screen's amount handler keeps validating.
 */
export default function TamaguiNumpad({
    value,
    onChange,
    enabled,
    onToggle,
    allowDecimal = true,
}) {
    const handleKey = (key) => {
        if (key === BACKSPACE) {
            onChange(value.slice(0, -1));
        } else if (key === ".") {
            if (value === "") {
                // isValidAmount rejects a leading "."; emit "0." instead.
                onChange("0.");
            } else if (!value.includes(".")) {
                onChange(value + ".");
            }
        } else {
            onChange(value + key);
        }
    };

    return (
        <YStack width={"$width100"} gap={"$2"}>
            <XStack justifyContent="flex-end">
                <Button
                    chromeless
                    size={"$2"}
                    color={"$pink500"}
                    onPress={onToggle}
                    aria-pressed={enabled}
                >
                    {enabled ? "Use keyboard" : "Use numpad"}
                </Button>
            </XStack>
            {enabled
                ? KEY_ROWS.map((row) => (
                      <XStack key={row[0]} gap={"$2"}>
                          {row.map((key) =>
                              key === "." && !allowDecimal ? (
                                  <YStack key={key} flex={1} />
                              ) : (
                                  <Button
                                      key={key}
                                      flex={1}
                                      height={56}
                                      $short={{ height: 44 }}
                                      backgroundColor={"$neutral3"}
                                      pressStyle={{
                                          backgroundColor: "$neutral4",
                                      }}
                                      borderWidth={0}
                                      borderRadius={"$7"}
                                      onPress={() => handleKey(key)}
                                      aria-label={
                                          key === BACKSPACE
                                              ? "delete"
                                              : key === "."
                                                ? "decimal point"
                                                : key
                                      }
                                  >
                                      <Paragraph
                                          color={"$neutral13"}
                                          style={{
                                              fontFamily: GEIST_MONO,
                                              fontSize: 20,
                                              fontWeight: 500,
                                          }}
                                      >
                                          {key}
                                      </Paragraph>
                                  </Button>
                              )
                          )}
                      </XStack>
                  ))
                : null}
        </YStack>
    );
}
