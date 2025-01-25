export default function Button({
    children,
    onClick,
    className,
}: {
    children: React.ReactNode;
    onClick: () => void;
    className?: string;
}) {
    return (
        <button
            className={` px-4 py-2 bg-indigo-400 rounded-md ${className}`}
            onClick={onClick}
        >
            {children}
        </button>
    );
};