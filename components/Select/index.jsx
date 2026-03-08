import { Select } from "./styled";

export const CustomSelect = ({
    label,
    name,
    onChange,
    value,
    options,
    style,
    readOnly = false,
}) => {
    return (
        <Select
            id={name}
            name={name}
            value={value}
            onChange={onChange}
            style={style}
            disabled={readOnly}
        >
            <option value="" disabled>
                {label ? label : "Choose an option"}
            </option>
            {options.map((item, index) => (
                <option key={index} value={item.id}>
                    {item.name}
                </option>
            ))}
        </Select>
    );
};
