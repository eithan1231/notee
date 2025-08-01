import { useContext, useState } from "react";
import { StorageContext } from "../../contexts/storage-context";
import { NavArrowDown } from "iconoir-react";
import { AuthContext } from "../../contexts/auth-context";
import { useNavigate } from "react-router-dom";

const Component = () => {
  const navigate = useNavigate();
  const { storageData, setStorageData, storageLoaded } =
    useContext(StorageContext);

  const { passwordUpdate, logout } = useContext(AuthContext);

  const [state, setState] = useState<{
    sectionPasswordUpdate: {
      visible: boolean;
      message: { text: string; status: "info" | "error" } | null;
      currentPassword: string;
      newPassword: string;
    };
  }>({
    sectionPasswordUpdate: {
      visible: false,
      message: null,
      currentPassword: "",
      newPassword: "",
    },
  });

  if (!storageLoaded) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const handleSecretDebug = async () => {
    await navigate("/notes/debug");
  };

  const handleSignOut = async () => {
    await logout();
    await navigate("/auth/login");
  };

  const toggleStoreKey = () => {
    if (storageData.shouldStoreKey) {
      setStorageData("shouldStoreKey", false);
      setStorageData("key", null);
    } else {
      setStorageData("shouldStoreKey", true);
    }
  };

  const handlePasswordUpdate = async () => {
    try {
      setState((prev) => ({
        ...prev,
        sectionPasswordUpdate: {
          ...prev.sectionPasswordUpdate,
          message: null,
        },
      }));

      if (
        !state.sectionPasswordUpdate.currentPassword ||
        !state.sectionPasswordUpdate.newPassword
      ) {
        setState((prev) => ({
          ...prev,
          sectionPasswordUpdate: {
            ...prev.sectionPasswordUpdate,
            message: {
              text: "Please fill in all fields",
              status: "error",
            },
          },
        }));

        return;
      }

      const result = await passwordUpdate(
        state.sectionPasswordUpdate.currentPassword,
        state.sectionPasswordUpdate.newPassword
      );

      if (result.success) {
        setState((prev) => ({
          ...prev,
          sectionPasswordUpdate: {
            ...prev.sectionPasswordUpdate,
            message: {
              text: "Password updated successfully",
              status: "info",
            },
          },
        }));
      } else {
        setState((prev) => ({
          ...prev,
          sectionPasswordUpdate: {
            ...prev.sectionPasswordUpdate,
            message: {
              text: result.message,
              status: "error",
            },
          },
        }));
        return;
      }
    } catch (error) {
      console.error("Password update error:", error);
      setState((prev) => ({
        ...prev,
        sectionPasswordUpdate: {
          ...prev.sectionPasswordUpdate,
          message: {
            text: "An unexpected error occurred",
            status: "error",
          },
        },
      }));
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="mb-6 justify-center text-center">
        <h1
          className="text-2xl font-bold text-gray-900 mb-3"
          onDoubleClick={handleSecretDebug}
        >
          Settings
        </h1>
      </div>

      <div className="mt-10">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">
          Account Settings
        </h2>
        <p className="text-sm text-gray-600 mb-4">
          Manage your account settings below.
        </p>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="flex-1">
            <h3 className="text-lg font-medium text-gray-900">Sign Out</h3>
            <p className="text-sm text-gray-500 mt-1">
              Sign out of your account
            </p>
          </div>

          <div className="flex items-center ml-4">
            <button
              onClick={handleSignOut}
              className="bg-red-600 text-white text-sm py-1.5 px-3 rounded-md hover:bg-red-700 transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="m-4 flex-1">
            <h3 className="text-lg font-medium text-gray-900">
              Update Password
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              Update your account password
            </p>
          </div>

          <div
            className="p-4 sm:px-12"
            hidden={!state.sectionPasswordUpdate.visible}
          >
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                handlePasswordUpdate();
              }}
              className="space-y-4"
            >
              <div>
                {state.sectionPasswordUpdate.message && (
                  <div
                    className={`text-sm mb-2 ${
                      state.sectionPasswordUpdate.message.status === "error"
                        ? "text-red-600"
                        : "text-blue-600"
                    }`}
                  >
                    {state.sectionPasswordUpdate.message.text}
                  </div>
                )}
              </div>
              <div>
                <label
                  htmlFor="currentPassword"
                  className="block text-sm font-medium text-gray-700"
                >
                  Current Password
                </label>
                <input
                  onChange={(e) =>
                    setState((prev) => ({
                      ...prev,
                      sectionPasswordUpdate: {
                        ...prev.sectionPasswordUpdate,
                        currentPassword: e.target.value,
                      },
                    }))
                  }
                  type="password"
                  id="currentPassword"
                  name="currentPassword"
                  required
                  className="mt-1 block w-full p-1 border-b border-gray-300 transition-colors focus:border-blue-300 focus:outline-none"
                />
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-700"
                >
                  New Password
                </label>
                <input
                  onChange={(e) =>
                    setState((prev) => ({
                      ...prev,
                      sectionPasswordUpdate: {
                        ...prev.sectionPasswordUpdate,
                        newPassword: e.target.value,
                      },
                    }))
                  }
                  type="password"
                  id="password"
                  name="password"
                  required
                  className="mt-1 block w-full p-1 border-b border-gray-300 transition-colors focus:border-blue-300 focus:outline-none"
                />
              </div>

              <div className="flex justify-end mt-4">
                <button
                  type="submit"
                  className="bg-blue-600 text-sm text-white py-1.5 px-3 rounded-md hover:bg-blue-700 transition-colors"
                >
                  Update Password
                </button>
              </div>
            </form>
          </div>

          <button
            className={`
              w-full border-t border-gray-200
              text-gray-500 text-sm text-center
              py-2 px-4
              hover:bg-gray-50 focus:outline-none
            `}
            onClick={() =>
              setState((prev) => ({
                ...prev,
                sectionPasswordUpdate: {
                  ...prev.sectionPasswordUpdate,
                  visible: !prev.sectionPasswordUpdate.visible,
                },
              }))
            }
          >
            <NavArrowDown
              className={`
              inline-block mr-1
              transition-transform transform ${
                state.sectionPasswordUpdate.visible ? "rotate-180" : ""
              }
            `}
            />
          </button>
        </div>
      </div>

      <div className="mt-10">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">
          Storage Settings
        </h2>
        <p className="text-sm text-gray-600 mb-4">
          Manage your local storage settings below. These settings will not sync
          to other devices.
        </p>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="flex-1">
            <h3 className="text-lg font-medium text-gray-900">
              Store Decryption Key
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              Keep your decryption key in browser storage for convenience
            </p>
          </div>

          <div className="flex items-center ml-4">
            <button
              onClick={toggleStoreKey}
              className={`
              flex-0
               border-transparent focus:border-transparent focus:ring-0
               relative inline-flex h-6 w-11 items-center rounded-full
               transition-colors focus:outline-none
               ${storageData.shouldStoreKey ? "bg-blue-600" : "bg-gray-200"}`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  storageData.shouldStoreKey ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Component;
