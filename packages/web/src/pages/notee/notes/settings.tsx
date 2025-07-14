import { useContext } from "react";
import { StorageContext } from "../../../contexts/storage-context";

const Component = () => {
  const { storageData, setStorageData, storageLoaded } =
    useContext(StorageContext);

  if (!storageLoaded) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const toggleStoreKey = () => {
    if (storageData.shouldStoreKey) {
      setStorageData("shouldStoreKey", false);
      setStorageData("key", null);
    } else {
      setStorageData("shouldStoreKey", true);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-3">Settings</h1>
        <p className="text-sm text-gray-600 mb-10">
          These settings are stored in your browser's local storage and will not
          sync across devices.
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
