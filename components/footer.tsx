import Link from "next/link";

export default function Footer() {
    return (
        <footer className="bg-gray-800 text-white py-8 px-4 sm:px-6 lg:px-8">
            <div className="container mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    <div>
                        <h3 className="text-lg font-semibold mb-4">Safadasnow</h3>
                        <p className="text-sm">Apimente sua noite com as melhores acompanhantes.</p>
                    </div>
                    <div>
                        <h4 className="text-lg font-semibold mb-4">Quick Links</h4>
                        <ul className="space-y-2">
                            <li>
                                <Link href="#features" className="text-sm hover:underline">
                                    Features
                                </Link>
                            </li>
                            <li>
                                <Link href="#testimonials" className="text-sm hover:underline">
                                    Testimonials
                                </Link>
                            </li>
                            <li>
                                <Link href="#pricing" className="text-sm hover:underline">
                                    Pricing
                                </Link>
                            </li>
                            <li>
                                <Link href="#faq" className="text-sm hover:underline">
                                    FAQ
                                </Link>
                            </li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="text-lg font-semibold mb-4">Legal</h4>
                        <ul className="space-y-2">
                            <li>
                                <Link href="/terms" className="text-sm hover:underline">
                                    Terms of Service
                                </Link>
                            </li>
                            <li>
                                <Link href="/privacy" className="text-sm hover:underline">
                                    Privacy Policy
                                </Link>
                            </li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="text-lg font-semibold mb-4">Connect</h4>
                        <ul className="space-y-2">
                            <li>
                                <Link href="#" className="text-sm hover:underline">
                                    Twitter
                                </Link>
                            </li>
                            <li>
                                <Link href="#" className="text-sm hover:underline">
                                    Facebook
                                </Link>
                            </li>
                            <li>
                                <Link href="#" className="text-sm hover:underline">
                                    Instagram
                                </Link>
                            </li>
                        </ul>
                    </div>
                </div>
                <div className="mt-8 pt-8 border-t border-gray-700 text-center">
                    <p className="text-sm">&copy; {new Date().getFullYear()} CompanionApp. All rights reserved.</p>
                </div>
            </div>
        </footer>
    );
}

