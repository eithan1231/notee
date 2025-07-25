import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AuthContext } from "../../contexts/auth-context";
import ReactMarkdown from "react-markdown";
import { apiGetNote, apiUpdateNote, Note } from "../../api/note";
import { decrypt, encrypt } from "../../util/encryption";
import { useDisplayMode } from "../../hooks/display-mode";

const Component = () => {
  const navigate = useNavigate();
  const { isExtraExtraLarge } = useDisplayMode();

  const { auth, apiContext, authInitialised, key } = useContext(AuthContext);

  const { noteId } = useParams();

  const [note, setNote] = useState<Note | null>(null);
  const [noteTitle, setNoteTitle] = useState<string | null>(null);
  const [noteContent, setNoteContent] = useState<string | null>(null);
  const showPreview = useMemo(() => isExtraExtraLarge, [isExtraExtraLarge]); // TODO: make toggleable

  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (noteId == null) {
      setNoteTitle(null);
      setNoteContent(null);

      navigate("/notes/");
      return;
    }

    if (!authInitialised) {
      console.log("[ViewNote] Waiting for auth to load");
      return;
    }

    if (!key) {
      navigate(
        `/notes/decryption?return=${encodeURIComponent("/notes/" + noteId)}`
      );
      return;
    }

    setNote(null);
    setNoteTitle(null);
    setNoteContent(null);

    setIsBusy(true);
    apiGetNote(apiContext, noteId)
      .then((result) => {
        if (!result.success) {
          setError("Failed to fetch note");
          console.log("[ViewNote] Failed to fetch note:", result.message);
          throw new Error("Failed to fetch note");
        }

        setNote(result.data.note);
        setNoteTitle(result.data.note.title);

        if (result.data.note.content.length === 0) {
          return "";
        }

        return decrypt(key, result.data.note.content);
      })
      .then((content) => {
        setNoteContent(content);
      })
      .catch((err) => {
        console.error("[ViewNote] Error fetching or decrypting note:", err);
        setError("Failed to load note content");
      })
      .finally(() => {
        setIsBusy(false);
      });
  }, [noteId, authInitialised]);

  // Auto refresh when not in edit mode
  useEffect(() => {
    if (
      !authInitialised ||
      auth === null ||
      auth.other.isActiveEditor ||
      noteId == null ||
      key === null
    ) {
      console.log("[ViewNote] Skipping auto-refresh due to conditions not met");
      return;
    }

    const interval = setInterval(() => {
      apiGetNote(apiContext, noteId).then((result) => {
        if (!result.success) {
          setError("Failed to refresh note");
          console.log("[ViewNote] Failed to refresh note:", result.message);
          return;
        }

        setNote(result.data.note);
        setNoteTitle(result.data.note.title);

        decrypt(key, result.data.note.content).then((content) => {
          setNoteContent(content);
        });
      });
    }, 10000);

    return () => clearInterval(interval);
  }, [noteId, auth, authInitialised, key]);

  const save = useCallback(async () => {
    console.log("[ViewNote] Saving note...");

    if (
      note === null ||
      noteId == null ||
      noteTitle == null ||
      noteContent == null ||
      key === null
    ) {
      console.error("[ViewNote] Cannot save note, missing data");
      return;
    }

    const payload: { title?: string; content?: string; revision: number } = {
      revision: note.revision + 1,
    };

    if (noteTitle !== null && noteTitle !== note.title) {
      payload.title = noteTitle;
    }

    if (noteContent !== null && noteContent !== note.content) {
      console.log(noteContent);
      payload.content = await encrypt(key, noteContent);
    }

    if (payload.title === undefined && payload.content === undefined) {
      console.log("[ViewNote] No changes to save");
      return;
    }

    setIsBusy(true);

    try {
      const result = await apiUpdateNote(apiContext, note.id, payload);

      if (result.success) {
        setNote(result.data.note);
      } else {
        alert("Failed to save note. Please try again.");
      }
    } finally {
      setIsBusy(false);
    }
  }, [note, noteId, noteTitle, noteContent, key, apiContext]);

  if (!noteId || note === null || noteTitle === null || noteContent === null) {
    return (
      <div className="flex items-center justify-center h-full">
        {error && <div className="text-red-500 mb-4">{error}</div>}
        <p className="text-gray-600">Loading note...</p>
      </div>
    );
  }

  return (
    <div
      key={`viewer-note-${note.id}`}
      className="px-3 md:px-10 pt-4 pb-16 h-full w-full justify-center"
    >
      {auth?.other.isActiveEditor && (
        <>
          <input
            defaultValue={noteTitle}
            onChange={(e) => {
              setNoteTitle((previous) => {
                if (previous === null) {
                  return null;
                }

                return e.target.value;
              });
            }}
            className="text-2xl font-bold mb-4 w-full text-center focus:outline-none"
          />

          <div className="flex w-full min-h-[calc(100%-3rem)]">
            <div className={`${showPreview ? "w-1/2 pr-5" : "w-full"}`}>
              <textarea
                id={`note-content-${note.id}`}
                disabled={isBusy}
                onChange={(e) => {
                  setNoteContent((prev) => {
                    if (prev === null) {
                      return null;
                    }

                    return e.target.value;
                  });
                }}
                defaultValue={noteContent}
                style={{
                  scrollbarWidth: "thin",
                  ...(showPreview ? { fieldSizing: "content" } : {}),
                }}
                className={`
                  min-h-full
                  ${!showPreview ? "h-full" : null}
                  outline-none overflow-auto
                  p-2 md:p-4
                  border rounded-lg
                  resize-none
                  w-full
                `}
                placeholder="Start writing your note here..."
              ></textarea>
            </div>

            <div className={` ${showPreview ? "w-1/2 pl-5" : "hidden"}`}>
              <div className="prose">
                <ReactMarkdown>{noteContent}</ReactMarkdown>
              </div>
            </div>
          </div>

          <div className="py-2 flex items center justify-between">
            <span className="text-gray-500 text-sm">
              {/* Add last modified and such here. Will be useful to have. */}
              {isBusy ? "Busy..." : ""}
              {error && <span className="text-red-500 ml-2">{error}</span>}
            </span>
            <button
              onClick={save}
              className={`px-4 py-2 bg-blue-500 text-white rounded-lg justify-end`}
              disabled={isBusy}
            >
              Save Note
            </button>
          </div>
        </>
      )}

      {!auth?.other.isActiveEditor && (
        <>
          <h1 className="text-2xl font-bold mb-4 text-center">{noteTitle}</h1>
          <div className="prose">
            <ReactMarkdown>{noteContent}</ReactMarkdown>
          </div>
        </>
      )}
    </div>
  );
};

export default Component;
