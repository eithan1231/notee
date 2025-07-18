import { useContext } from "react";
import { AuthContext } from "../../../contexts/auth-context";
import { NoteTreeContext } from "../../../contexts/note-tree-context";

const Component = () => {
  const { auth, authInitialised: authInitialLoad } = useContext(AuthContext);
  const { tree } = useContext(NoteTreeContext);

  return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Welcome to Notee Notes</h1>

        {!authInitialLoad && (
          <p className="text-gray-600">
            Loading your notes and settings, please wait...
          </p>
        )}

        {authInitialLoad && auth?.other.isActiveEditor ? (
          <>
            <p className="text-gray-600">
              Select a note from the sidebar to view or edit it.
            </p>
            <p className="text-gray-600 mt-2">
              If you don't have any notes yet, create one to get started!
            </p>
          </>
        ) : (
          <>
            {(tree && tree.length == 0 && (
              <p className="text-gray-600 mt-2">
                To get started, enter edit mode and create your first note.
                <br />
                You can find the edit-mode toggle at the top right corner.
              </p>
            )) || (
              <p className="text-gray-600">
                Notee Notes is a secure place to store your notes.
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Component;
