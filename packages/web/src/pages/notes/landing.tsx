import { useContext } from "react";
import { AuthContext } from "../../contexts/auth-context";
import { NoteTreeContext } from "../../contexts/note-tree-context";
import ReactMarkdown from "react-markdown";

const Component = () => {
  const { auth, authInitialised: authInitialLoad } = useContext(AuthContext);
  const { tree } = useContext(NoteTreeContext);

  return (
    <div className="flex items-center justify-center p-8">
      <div className="prose">
        <ReactMarkdown>
          {`# Welcome to Notee notes!

We are under active development, you may encounter stability issues. Feel free to create a GitHub bug report by [Clicking Here](https://github.com/eithan1231/notee).

## Overview

Notee is a simple and secure note keeping app. To edit notes, you must be in editor mode. You can opt to require a password reprompt every time you open Notee for maximum security.


## Your first note


Firstly start off by entering Editor mode, in the top right. This will allow you to write and save notes. Changes will be discarded on other tabs or devices which have an active editor. You can now click the New Note button on the sidebar to create a new note!


## Command pallet


Familiar with VS Codes command pallet? Well heavily inspired, we have our own implementation at Notee. Ctrl+P will open a universal command pallet, conveniently allowing you to access common notes and shortcuts.

- Prefix of ">" will show actions. Actions include logging out, locking your vault, creating new notes and folders, entering editor mode, and more.
- Prefix of "#" will show system navigation. System navigation include going to settings, notes decryption, homepage and more.
- Prefix of ":" will show notes navigation. Notes navigation includes all of your personal notes, conveniently accessible to you.

## Settings

Settings gives you a simple settings interface, allowing you to update your password, sign out of your account, or how you handle encryption.

### Store Decryption Key

Store Decryption Key will determine how your local browser handles your encryption key. When this is enabled, you will not need to enter a password reprompt when accessing Notee from that device. For a more secure experience, it is recommended to turn this off. For a convenient experience, keep this enabled.
`}
        </ReactMarkdown>
      </div>

      <div className="text-center" hidden={true}>
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
