import { Input, InputContainer } from "./styled";

export const FileUpload = ({ fileSetter }) => {
    const handleOnChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                fileSetter(event.target.result);
            };
            reader.readAsDataURL(file);
        }
    };
    return (
        <InputContainer>
            <Input type="file" onChange={handleOnChange} />
        </InputContainer>
    );
};

export default FileUpload;
