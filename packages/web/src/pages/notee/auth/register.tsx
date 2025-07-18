import { useCallback, useContext, useEffect, useState } from "react";
import { Link, RouteObject, useNavigate } from "react-router-dom";
import { AuthContext } from "../../../contexts/auth-context";
import { useConfig } from "../../../hooks/config";

const Component = () => {
  const navigate = useNavigate();
  const authContext = useContext(AuthContext);
  const { config, configError } = useConfig();

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setBusy(true);
      setError(null);

      const result = await authContext.register(email, password);

      if (!result.success) {
        setError(result.message || "An error occurred during registration.");
        setBusy(false);
        return;
      }

      setBusy(false);
    },
    [email, password, authContext.register]
  );

  useEffect(() => {
    if (authContext.authInitialised && authContext.auth) {
      navigate("/notee/notes/");
    }
  }, [authContext.authInitialised, authContext.auth, navigate]);

  useEffect(() => {
    if (!config || !config.dev.flag) {
      return;
    }

    if (config.dev.autofillEmail) {
      setEmail(config.dev.autofillEmail);
    }

    if (config.dev.autofillPassword) {
      setPassword(config.dev.autofillPassword);
    }
  }, [config]);

  if (!authContext.authInitialised) {
    return <span className="text-gray-500">Loading...</span>;
  }

  if (config && !config.feature.authRegisterEnabled) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white p-6 sm:p-8 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold mb-6 text-center">
            Registration is currently disabled
          </h2>
          <p className="text-gray-600 text-center">
            Please contact support for more information.
          </p>
        </div>
      </div>
    );
  }

  if (config === null && configError === null) {
    return "loading....";
  }

  if (configError) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white p-6 sm:p-8 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold mb-6 text-center text-red-600">
            Error Loading Configuration
          </h2>
          <p className="text-gray-600 text-center">
            {configError || "An unexpected error occurred."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white p-6 sm:p-8 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-6 text-center">
          Account Registration
        </h2>

        {error && (
          <div className="mb-4 p-4 bg-red-100 text-red-700 rounded">
            <p>{error}</p>
          </div>
        )}

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email" className="block text-gray-700">
              Email
            </label>
            <input
              required
              defaultValue={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={busy}
              id="email"
              type="email"
              placeholder="you@example.com"
              className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-300"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-gray-700">
              Password
            </label>
            <input
              required
              defaultValue={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={busy}
              id="password"
              type="password"
              placeholder="********"
              className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-300"
            />
          </div>
          <div className="flex items-center">
            <input
              disabled={busy}
              id="remember"
              type="checkbox"
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="remember" className="ml-2 text-gray-900">
              Remember me
            </label>
          </div>

          <button
            disabled={busy}
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 disabled:bg-blue-500 enabled:cursor-pointer transition"
          >
            Register
          </button>

          {busy && (
            <div className="animate-pulse text-center text-gray-500 mt-2">
              <p>Processing...</p>
            </div>
          )}
        </form>

        <p className="mt-4 text-center text-sm text-gray-600">
          Already have an account?{" "}
          <Link
            to="/notee/auth/login"
            className="text-blue-600 hover:underline"
          >
            Login here
          </Link>
        </p>
      </div>
    </div>
  );
};
export default {
  path: "/notee/auth/register",
  Component: Component,
} as RouteObject;
