export function CompanionsListSkeleton() {
    return (
        <>
            {[1, 2, 3].map((item) => (
                <div
                    key={item}
                    className="animate-pulse flex flex-row gap-8 p-4 border border-gray-200 rounded-lg shadow-md"
                >

                </div>
            ))}
        </>
    );
}