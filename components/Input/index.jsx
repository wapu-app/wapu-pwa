import { Input, InputContainer, Max } from "./styled";

export const CustomInput = ({
    label,
    name,
    value,
    onChange,
    type,
    required,
    autoComplete,
    step,
    text,
    onClick,
}) => {
    return (
        <InputContainer>
            <Input
                id={name}
                name={name}
                value={value}
                onChange={onChange}
                placeholder={label}
                type={type}
                required={required}
                autoComplete={autoComplete}
                step={step}
            />
            {!text ? " " : <Max onClick={onClick}>{text}</Max>}
        </InputContainer>
    );
};

export default CustomInput;
