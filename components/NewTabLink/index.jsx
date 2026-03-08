const NewTabLink = ({ href, children, className }) => (
    <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={className}
    >
        {children}
    </a>
);

export default NewTabLink;
