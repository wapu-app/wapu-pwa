import { InputReadOnly } from "./styled";

export const CustomInputReadOnly = ({
    label,
    name,
    value,
    onChange,
    type,
    required,
    autoComplete,
    step,
}) => {
    return (
        <InputReadOnly
            id={name}
            name={name}
            value={value}
            onChange={onChange}
            placeholder={label}
            type={type}
            required={required}
            autoComplete={autoComplete}
            step={step}
            readOnly
        />
    );
};

export default CustomInputReadOnly;
