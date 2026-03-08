import { CustomButton, CustomLink } from "./styled";

export const Button = ({
    text,
    onClick,
    type,
    href,
    secondary,
    isDisabled,
    target,
}) => {
    return (
        <>
            {href ? (
                <CustomLink href={href} target={target}>
                    <CustomButton
                        disabled={isDisabled ? true : false}
                        type={type}
                        onClick={onClick}
                        style={{
                            ...(secondary
                                ? {
                                      backgroundImage: "none",
                                      backgroundColor: "transparent",
                                      border: "1px solid #b5179e",
                                  }
                                : { background: isDisabled ? "#ccc" : "" }),
                        }}
                    >
                        {text}
                    </CustomButton>
                </CustomLink>
            ) : (
                <CustomButton
                    disabled={isDisabled ? true : false}
                    type={type}
                    onClick={onClick}
                    style={{
                        ...(secondary
                            ? {
                                  backgroundImage: "none",
                                  backgroundColor: "transparent",
                                  border: "1px solid #b5179e",
                              }
                            : { background: isDisabled ? "#ccc" : "" }),
                    }}
                >
                    {text}
                </CustomButton>
            )}
        </>
    );
};
