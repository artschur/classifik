import { db, kv } from "@/db";

export default async function Success() {

    return (
        <div className="flex flex-col items-center justify-center h-screen">
            <h1 className="text-3xl font-bold">Payment Successful</h1>
            <p className="mt-4 text-lg">Thank you for your purchase!</p>
            <p className="mt-2 text-gray-600">Your order is being processed.</p>
        </div>
    );
};