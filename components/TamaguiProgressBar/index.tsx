import React from "react";
import { Progress, styled } from "tamagui";

const CustomProgress = styled(Progress, {
    height: "$2",
    backgroundColor: "$neutral9",
});

export default function TamaguiProgressBar({
    sizeProp,
    progress,
    status,
    width,
    backgroundColor
}) {
    return (
        <CustomProgress
            width={width ? width : "$width100"}
            size={sizeProp}
            value={progress}
        >
            <Progress.Indicator
                backgroundColor={
                    status === "Unsafe"
                        ? "$semanticRed"
                        : status === "Weak"
                        ? "$semanticYellow"
                        : status === "Safe"
                        ? "$semanticGreen"
                        : backgroundColor
                }
                animation="bouncy"
            />
        </CustomProgress>
    );
}
