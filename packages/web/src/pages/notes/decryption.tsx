import { useContext, useEffect, useState } from "react";
import { AuthContext } from "../../contexts/auth-context";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useConfig } from "../../hooks/config";

const Component = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { authInitialised, key, decryptEncryptionKey } =
    useContext(AuthContext);
  const { config } = useConfig();

  const [password, setPassword] = useState("");
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (config && config.dev.flag && config.dev.autofillPassword) {
      setPassword((prev) => prev || (config.dev.autofillPassword ?? ""));
    }

    if (!authInitialised || !key) {
      return;
    }

    const returnPage = searchParams.get("return");

    if (returnPage?.startsWith("/notes/")) {
      navigate(returnPage);
      return;
    }

    navigate("/notes/");
  }, [authInitialised, key, navigate, searchParams, config]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      setError("Please enter a password");
      return;
    }

    setIsDecrypting(true);
    setError(null);

    try {
      const success = await decryptEncryptionKey(password);
      if (!success) {
        setError("Failed to decrypt key. Please check your password.");
        return;
      }
    } finally {
      setIsDecrypting(false);
    }
  };

  if (!authInitialised) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!config) {
    return "loading...";
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Decrypt Your Notes
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Enter your password to access your encrypted notes
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="password" className="sr-only">
              Password
            </label>
            <input
              autoFocus
              defaultValue={password}
              id="password"
              name="password"
              type="password"
              className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isDecrypting}
            />
          </div>

          {error && (
            <div className="text-red-600 text-sm text-center">{error}</div>
          )}

          <div>
            <button
              type="submit"
              disabled={isDecrypting}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isDecrypting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Decrypting...
                </>
              ) : (
                "Decrypt & Access Notes"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Component;
