"use client";

import Link from "next/link";

interface WhatsAppButtonProps {
    phoneNumber?: string;
    message?: string;
}

export const WhatsAppButton = ({
    phoneNumber = "351912979481",
    message = "",
}: WhatsAppButtonProps) => {
    const whatsappUrl = `https://wa.me/${phoneNumber}${message ? `?text=${encodeURIComponent(message)}` : ""}`;

    return (
        <Link
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="fixed bottom-6 right-6 bg-green-500 hover:bg-green-600 text-white rounded-full p-4 shadow-lg transition-all duration-300 ease-in-out z-50 flex items-center justify-center"
        >
            <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="w-6 h-6"
            >
                <path
                    d="M12 2C6.48 2 2 6.48 2 12c0 2.16.7 4.16 1.88 5.78L2.3 22l4.32-1.58C8.16 21.42 10.01 22 12 22c5.52 0 10-4.48 10-10S17.52 2 12 2zm0 18c-1.85 0-3.57-.59-4.98-1.59l-3.02 1.11 1.12-2.97C4.39 15.18 4 13.63 4 12 4 7.58 7.58 4 12 4s8 3.58 8 8-3.58 8-8 8zm-1-3h2v-2h-2v2zm0-3h2V8h-2v6z"
                />
            </svg>
            <span className="ml-2">Contato</span>
        </Link>
    );
};

export default WhatsAppButton;