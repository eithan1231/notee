import { useContext, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../contexts/auth-context";
import { NoteTreeContext } from "../contexts/note-tree-context";
import { Link, Page, Settings } from "iconoir-react";
import { apiCreateNote } from "../api/note";

type Command = {
  id: string;
  type: "navigate-system" | "action" | "navigate-note";
  name: string;
  description: string;
  keywords: string[];
  action: () => void;
};

type CommandRank = Command & {
  rank: number;
};

export const CommandPalletComponent = () => {
  const navigate = useNavigate();

  const { apiContext, auth, key, setActiveEditor, removeActiveEditor } =
    useContext(AuthContext);

  const { notes, addNodeNote, addNodeFolder } = useContext(NoteTreeContext);

  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [lastCommandId, setLastCommandId] = useState<string | null>(null);

  // Limit the number of visible commands to avoid overwhelming the user
  const visibleCommands = 6;

  const commands = useMemo(() => {
    const results: Array<Command> = [];

    if (notes) {
      for (const note of notes) {
        results.push({
          id: `navigate-note-${note.id}`,
          type: "navigate-note",
          name: note.title,
          description: `Open Note`,
          keywords: ["note"],
          action: () => {
            navigate(`/notee/notes/${note.id}`);
          },
        });
      }
    }

    if (auth?.other.isActiveEditor) {
      results.push({
        id: "new-note",
        type: "action",
        name: " Create New Note",
        description: "Create a new note",
        keywords: ["new", "note", "create", "add"],
        action: async () => {
          const noteResult = await apiCreateNote(apiContext, {
            title: "New Note",
            content: "",
          });

          if (!noteResult.success) {
            console.error("Failed to create note:", noteResult.message);
            return;
          }

          await addNodeNote(null, 0, noteResult.data.note.id);

          navigate(`/notee/notes/${noteResult.data.note.id}`);
        },
      });
    }

    if (auth?.other.isActiveEditor) {
      results.push({
        id: "new-folder",
        type: "action",
        name: "Create New Folder",
        description: "Create a new folder",
        keywords: ["new", "folder", "create", "add"],
        action: () => {
          addNodeFolder(null, 0, "New Folder");
        },
      });
    }

    if (auth?.other.isActiveEditor) {
      results.push({
        id: "toggle-active-editor",
        type: "action",
        name: "Toggle Active Editor",
        description: "Toggles the active editor state",
        keywords: ["toggle", "editor", "active", "set"],
        action: () => {
          removeActiveEditor();
        },
      });
    } else {
      results.push({
        id: "toggle-active-editor",
        type: "action",
        name: "Toggle Active Editor",
        description: "Toggles the active editor state",
        keywords: ["toggle", "editor", "active", "set"],
        action: () => {
          setActiveEditor();
        },
      });
    }

    if (!key) {
      results.push({
        id: "navigate-decrypt",
        type: "navigate-system",
        name: "Decrypt Notes",
        description: "Navigate to decryption page",
        keywords: [
          "decrypt",
          "notes",
          "unlock",
          "decryption",
          "password",
          "notes",
        ],
        action: () => {
          navigate("/notee/notes/decryption");
        },
      });
    }

    results.push({
      id: "navigate-home",
      type: "navigate-system",
      name: "Home",
      description: "Navigate to home page",
      keywords: ["home", "dashboard", "main"],
      action: () => {
        navigate("/notee/notes/");
      },
    });

    results.push({
      id: "navigate-settings",
      type: "navigate-system",
      name: "Settings",
      description: "Navigate to settings page",
      keywords: ["settings", "configuration", "preferences"],
      action: () => {
        navigate("/notee/notes/settings");
      },
    });

    return results;
  }, [auth, key, notes, apiContext]);

  const filteredCommands = commands
    .map<CommandRank>((command) => {
      let searchString = text.trim().toLowerCase();

      let type: "action" | "navigate-system" | "navigate-note" | null = null;
      if (text.startsWith(">")) {
        type = "action";
        searchString = searchString.substring(1).trim();
      } else if (text.startsWith("#")) {
        type = "navigate-system";
        searchString = searchString.substring(1).trim();
      } else if (text.startsWith(":")) {
        type = "navigate-note";
        searchString = searchString.substring(1).trim();
      }

      if (type && command.type !== type) {
        return {
          ...command,
          rank: -1,
        };
      }

      const keywords = searchString
        .split(/[^A-Za-z0-9]+/)
        .filter((kw) => kw.trim() !== "");

      let rank = -1;

      // Show some commands when no search text is present
      if (searchString.length === 0) {
        rank = 0;
      }

      // Add key word ranking
      rank += keywords.reduce((acc, keyword) => {
        if (keyword === "note" && command.type === "navigate-note") {
          return acc + 20; // Boost for note navigation
        }

        if (command.name.toLowerCase().includes(keyword)) {
          return acc + 10;
        }

        if (command.description.toLowerCase().includes(keyword)) {
          return acc + 5;
        }

        for (const commandKeywords of command.keywords) {
          if (commandKeywords.toLowerCase().includes(keyword)) {
            return acc + 3;
          }
        }

        return acc;
      }, 0);

      // Boost for last used command
      if (lastCommandId == command.id) {
        rank += 10;
      }

      return {
        ...command,
        rank,
      };
    })
    .filter((command) => command.rank !== -1)
    .sort((a, b) => b.rank - a.rank)
    .slice(0, visibleCommands);

  const handleCommandAction = (commandId: string) => {
    const command = commands.find((c) => c.id === commandId);

    if (command) {
      command.action();

      setLastCommandId(commandId);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === ",") {
        navigate("/notee/notes/settings");
        return;
      }

      if (open && e.key === "Escape") {
        e.preventDefault();
        setOpen(false);
        return;
      }

      if (open && (e.key === "ArrowDown" || (!e.shiftKey && e.key === "Tab"))) {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % filteredCommands.length);
        return;
      }

      if (open && (e.key === "ArrowUp" || (e.shiftKey && e.key === "Tab"))) {
        e.preventDefault();
        setSelectedIndex(
          (prev) =>
            (prev - 1 + filteredCommands.length) % filteredCommands.length
        );
        return;
      }

      if (open && e.key === "Enter") {
        e.preventDefault();
        if (filteredCommands[selectedIndex].id) {
          handleCommandAction(filteredCommands[selectedIndex].id);
        }
        setOpen(false);
        return;
      }

      if (!open && e.ctrlKey && e.key === "p") {
        e.preventDefault();
        setOpen(true);
        setSelectedIndex(0);
        setText("");

        return;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, selectedIndex, filteredCommands]);

  // Reset selected index when text changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [text]);

  if (!open) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex justify-center"
      onClick={() => setOpen(false)}
    >
      <div
        className="bg-gray-50 rounded-b-lg shadow-xl p-2 w-full max-w-md h-fit"
        onClick={(e) => e.stopPropagation()}
      >
        <input
          tabIndex={0}
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="w-full p-1 border border-gray-300 rounded focus:outline-none focus:ring-0 text-gray-700"
          autoFocus
        />
        <div className="mt-2">
          <div className="overflow-y-auto">
            {filteredCommands.map((command, index) => (
              <button
                key={command.id}
                onClick={() => {
                  handleCommandAction(command.id);
                  setOpen(false);
                }}
                className={`w-full text-left p-1 pl-3 rounded hover:bg-gray-100
                    flex items-start justify-between
                    ${
                      index === selectedIndex
                        ? "bg-blue-50 border-l-4 border-blue-500 focus"
                        : ""
                    }`}
              >
                <div className="font-normal text-gray-900">
                  {command.type === "navigate-system" && (
                    <Link className="inline text-gray-500 pr-2 mt-[-4px]" />
                  )}

                  {command.type === "navigate-note" && (
                    <Page className="inline text-gray-500 pr-2 mt-[-4px]" />
                  )}

                  {command.type === "action" && (
                    <Settings className="inline text-gray-500 pr-2 mt-[-4px]" />
                  )}
                  {command.name}
                </div>
                <div className="text-xs mt-1 text-gray-500">
                  {command.description}
                </div>
              </button>
            ))}
            {filteredCommands.length === 0 && (
              <div className="p-2 text-gray-500 text-center">
                No commands found
              </div>
            )}
          </div>
          <p className="text-gray-500 mt-2 select-none text-xs cursor-default">
            Press <kbd className="bg-gray-200 px-1 rounded">↑↓</kbd> to
            navigate, <kbd className="bg-gray-200 px-1 rounded">Enter</kbd> to
            select, <kbd className="bg-gray-200 px-1 rounded">Esc</kbd> to close
          </p>
        </div>
      </div>
    </div>
  );
};
