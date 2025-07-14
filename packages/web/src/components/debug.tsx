import { useContext } from "react";
import { AuthContext } from "../contexts/auth-context";
import { StorageContext } from "../contexts/storage-context";
import { NoteTreeContext } from "../contexts/note-tree-context";

export const DebugComponent = () => {
  const authContext = useContext(AuthContext);
  const { notes, tree } = useContext(NoteTreeContext);
  const storageContext = useContext(StorageContext);

  const hasCryptoSubtleSupport = window.crypto.subtle !== undefined;

  return (
    <div className="px-3 md:px-10 pt-4 pb-16 h-full w-full xl:max-w-[70rem]">
      <h1 className="text-3xl font-bold mb-4">Debug Page</h1>
      <p className="text-lg mb-4">
        This page is for debugging purposes. It will display debug information
        about the current user and the application.
      </p>

      <p className="mb-4">
        <pre className="bg-gray-100 p-2 rounded">
          Has Crypto Support: {hasCryptoSubtleSupport ? "Yes" : "No"}
        </pre>
      </p>

      <h2 className="text-2xl font-semibold mb-2">Auth context:</h2>
      <p className="mb-4 overflow-scroll">
        {authContext.auth ? (
          <pre className="bg-gray-100 p-2 rounded">
            {JSON.stringify(authContext.auth, null, 2)}
          </pre>
        ) : (
          "Not authenticated"
        )}
      </p>

      <h2 className="text-2xl font-semibold mb-2">Notes Tree Context:</h2>
      <p className="mb-4 overflow-scroll">
        {authContext.auth ? (
          <>
            <pre className="bg-gray-100 p-2 rounded">
              {JSON.stringify(tree, null, 2)}
            </pre>
            <pre className="bg-gray-100 p-2 rounded">
              {JSON.stringify(notes, null, 2)}
            </pre>
          </>
        ) : (
          "Not authenticated"
        )}
      </p>

      <h2 className="text-2xl font-semibold mb-2">Storage Context:</h2>
      <p className="mb-4 overflow-scroll">
        {authContext.auth ? (
          <pre className="bg-gray-100 p-2 rounded">
            {JSON.stringify(storageContext, null, 2)}
          </pre>
        ) : (
          "Not authenticated"
        )}
      </p>
    </div>
  );
};
