import {
  EditPencil,
  Eye,
  FolderPlus,
  Menu,
  PagePlus,
  Settings,
} from "iconoir-react";
import {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Link,
  Outlet,
  RouteObject,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { SidebarTree } from "../../../components/sidebar-tree";
import { AuthContext } from "../../../contexts/auth-context";
import { NoteTreeContext } from "../../../contexts/note-tree-context";
import { StorageContext } from "../../../contexts/storage-context";
import { useDisplayMode } from "../../../hooks/display-mode";

import NoteEditComponent from "./[noteId]/landing";
import LandingComponent from "./landing";
import SettingsComponent from "./settings";
import DecryptionComponent from "./decryption";
import { CommandPalletComponent } from "../../../components/command-pallet";

const Component = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { displayMode } = useDisplayMode();
  const authContext = useContext(AuthContext);
  const { tree, addNodeFolder } = useContext(NoteTreeContext);
  const storageContext = useContext(StorageContext);

  const sidebarRef = useRef<HTMLElement | null>(null);
  const [isResizing, setIsResizing] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(displayMode === "desktop");

  const sidebarMinimumWidth = useMemo(() => {
    if (displayMode === "mobile" || displayMode === "tablet") {
      return window.innerWidth;
    }

    return 150;
  }, [displayMode]);
  const sidebarMaximumWidth = useMemo(() => {
    if (displayMode === "mobile" || displayMode === "tablet") {
      return window.innerWidth;
    }

    return 520;
  }, [displayMode]);
  const [sidebarWidth, setSidebarWidth] = useState(300);

  useEffect(() => {
    if (displayMode === "mobile" || displayMode === "tablet") {
      setSidebarOpen(false);
      setSidebarWidth(window.innerWidth);
    } else {
      setSidebarOpen(true);
      // Use stored sidebar width or default to 268px
      const storedWidth = storageContext.storageData.sidebarWidth;
      setSidebarWidth(storedWidth ?? 268);
    }
  }, [displayMode, storageContext.storageData.sidebarWidth]);

  // Close sidebar on navigation in mobile/tablet mode
  useEffect(() => {
    if (displayMode === "mobile" || displayMode === "tablet") {
      setSidebarOpen(false);
    }
  }, [location]);

  const startResizing = useCallback(() => {
    setIsResizing(true);
  }, []);

  const stopResizing = useCallback(() => {
    setIsResizing(false);
  }, []);

  const resize = useCallback(
    (e: MouseEvent) => {
      if (!isResizing || !sidebarRef.current) {
        return;
      }

      const width = e.clientX - sidebarRef.current.getBoundingClientRect().left;
      if (width < sidebarMinimumWidth || width > sidebarMaximumWidth) {
        return;
      }

      if (displayMode === "mobile" || displayMode === "tablet") {
        // Prevent resizing in mobile/tablet mode
        return;
      }

      const newWidth =
        e.clientX - sidebarRef.current.getBoundingClientRect().left;

      setSidebarWidth(newWidth);

      if (displayMode === "desktop") {
        storageContext.setStorageData("sidebarWidth", newWidth);
      }
    },
    [
      isResizing,
      sidebarMinimumWidth,
      sidebarMaximumWidth,
      displayMode,
      storageContext,
    ]
  );

  useEffect(() => {
    document.addEventListener("mousemove", resize);
    document.addEventListener("mouseup", stopResizing);
    return () => {
      document.removeEventListener("mousemove", resize);
      document.removeEventListener("mouseup", stopResizing);
    };
  }, [resize, stopResizing]);

  useEffect(() => {
    if (authContext.authInitialised && !authContext.auth) {
      navigate("/notee/auth/login");
    }
  }, [authContext.authInitialised, authContext.auth, navigate]);

  const toggleEditorMode = useCallback(() => {
    if (!authContext.auth) {
      return;
    }

    if (authContext.auth.other.isActiveEditor) {
      authContext.removeActiveEditor();
    } else {
      authContext.setActiveEditor();
    }
  }, [authContext.authInitialised, authContext.auth]);

  const handleCreateNote = useCallback(async () => {
    // const note = await notesContext.createEmptyNote();
    // if (note) {
    //   navigate(`/notee/notes/${note}/`);
    //   return;
    // }
  }, [navigate]);

  const handleCreateFolder = useCallback(async () => {
    await addNodeFolder(null, 0, "New Folder");
  }, [tree]);

  return (
    <>
      <CommandPalletComponent />
      <div className="h-screen">
        <header className="border-b px-5 py-5 h-[4rem] flex items-center justify-between">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-gray-500 hover:text-gray-700 focus:outline-none"
          >
            <Menu
              className={`${displayMode === "desktop" ? "w-6 h-6" : "w-8 h-8"}`}
            />
          </button>

          <h1 className="text-xl font-semibold inline">Notee</h1>

          <button
            // disabled={authContext.isUpdatingActiveEditor}
            onClick={toggleEditorMode}
            className={`
            border-transparent focus:border-transparent focus:ring-0
            relative inline-flex h-6 w-11 items-center rounded-full
            transition-colors focus:outline-none
            ${
              authContext.auth?.other.isActiveEditor
                ? "bg-blue-600"
                : "bg-gray-200"
            }
            ${
              // authContext.isUpdatingActiveEditor
              false ? "opacity-50 cursor-not-allowed" : ""
            }
          `}
          >
            <span
              className={`
              inline-block h-4 w-4 transform rounded-full bg-white transition-transform
              ${
                authContext.auth?.other.isActiveEditor
                  ? "translate-x-6"
                  : "translate-x-1"
              }
            `}
            >
              {authContext.auth?.other.isActiveEditor ? (
                <EditPencil className="w-3 h-3 text-blue-600 m-0.5" />
              ) : (
                <Eye className="w-3 h-3 text-gray-600 m-0.5" />
              )}
            </span>
          </button>
        </header>

        <div
          className={`
          ${displayMode === "desktop" ? "flex flex-row" : ""}
          h-[calc(100vh-4rem)]
        `}
        >
          <aside
            ref={sidebarRef}
            hidden={!sidebarOpen}
            style={{
              display: sidebarOpen ? "" : "none",
              width:
                displayMode === "mobile" || displayMode === "tablet"
                  ? window.innerWidth
                  : sidebarWidth,
              minWidth: sidebarMinimumWidth,
              maxWidth: sidebarMaximumWidth,
            }}
            className={`
              ${displayMode === "desktop" ? "flex-none flex flex-row" : ""}
              border-r border-gray-200
              z-2
            `}
          >
            <div
              className={`flex-1 overflow-x-hidden`}
              style={{
                scrollbarWidth: "thin",
                width: sidebarWidth - 5,
              }}
            >
              <div className="px-4 pt-4 pb-4 flex align-center">
                {authContext.auth?.other.isActiveEditor && (
                  <>
                    <button
                      onClick={handleCreateNote}
                      className="mr-10 text-gray-600 hover:text-blue-800 align-center"
                    >
                      <PagePlus className="w-5 h-5 mr-1" /> Note
                    </button>

                    <button
                      onClick={handleCreateFolder}
                      className="mr-10 text-gray-600 hover:text-blue-800"
                    >
                      <FolderPlus className="w-5 h-5 mr-1" /> Folder
                    </button>
                  </>
                )}
                <Link
                  to="/notee/notes/settings"
                  className=" text-gray-600 hover:text-blue-800"
                >
                  <Settings className="w-5 h-5 mr-1" /> Settings
                </Link>
              </div>

              {!authContext.auth?.other.isActiveEditor && (
                <div className="text-sm text-gray-500 italic">
                  <p className="px-4 pt-2">
                    You are in read-only mode. Enable editor mode to create and
                    edit notes.
                  </p>
                </div>
              )}

              <SidebarTree />
            </div>

            <div
              onMouseDown={(e) => {
                e.preventDefault();
                startResizing();
              }}
              className={`
                ${displayMode !== "desktop" ? "hidden" : ""}
                flex-none basis-[6px] 
                justify-self-end 
                cursor-col-resize 
                resize-x 
                hover:w-[3px] 
                hover:bg-[#c1c3c5b4]
              `}
            />
          </aside>

          {((displayMode === "mobile" || displayMode === "tablet") &&
            !sidebarOpen) ||
          displayMode === "desktop" ? (
            <main
              className={`
            ${displayMode === "desktop" ? "flex-1 flex flex-col" : ""}
            h-full
            bg-white
            shadow-[rgba(0,0,0,0.25)_2px_32px_-2px_8px]
            rounded-tr-[10px] rounded-br-[10px]
            z-1
          `}
            >
              <Outlet />
            </main>
          ) : null}
        </div>
      </div>
    </>
  );
};

export default {
  path: "/notee/notes/",
  Component,
  children: [
    {
      index: true,
      Component: LandingComponent,
    },
    {
      path: "settings/",
      Component: SettingsComponent,
    },
    {
      path: "decryption/",
      Component: DecryptionComponent,
    },
    {
      path: ":noteId/",
      Component: NoteEditComponent,
    },
  ],
} as RouteObject;
