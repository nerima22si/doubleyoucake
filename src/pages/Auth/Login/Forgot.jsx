

export default function Forgot() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-[#faf7f3] px-4">
            <div className="w-full max-w-md bg-white shadow-2xl rounded-xl p-8">
                <div className="flex flex-col items-center mb-6">
                    <img src={jcoLogo} alt="JCO Logo" className="w-16 h-16 mb-2" />
                    <h2 className="text-2xl font-bold text-[#6b3e26] text-center">
                        Forgot Your Password?
                    </h2>
                    <p className="text-sm text-gray-500 text-center mt-1">
                        Enter your email address and we'll send you a link to reset your password.
                    </p>
                </div>

                <form>
                    <div className="mb-5">
                        <label
                            htmlFor="email"
                            className="block text-sm font-medium text-gray-700 mb-1"
                        >
                            Email Address
                        </label>
                        <input
                            type="email"
                            id="email"
                            className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-400"
                            placeholder="you@example.com"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-[#d2691e] hover:bg-[#a24f16] text-white font-semibold py-2 rounded-lg transition duration-300"
                    >
                        Send Reset Link
                    </button>
                </form>

                <p className="text-center text-xs text-gray-400 mt-6">
                    © 2025 JCO CRM. All rights reserved.
                </p>
            </div>
        </div>
    );
}
