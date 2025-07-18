import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  ApiTree,
  apiTreeGet,
  apiTreeSet,
  TreeNodeFolder,
  TreeNodeNote,
  TreeStructure,
} from "../api/tree";
import { apiDeleteNote, apiNotes, NoteBasic } from "../api/note";
import {
  treeStructureFindAndRemove,
  treeStructureInsertDanglers,
  treeStructureInsert,
  treeStructureUpdateFolderTitle,
  treeStructureFlattenNotes,
} from "../util/tree-structure";
import { AuthContext } from "./auth-context";

export type NoteTreeContextType = {
  tree: TreeStructure | null;
  notes: Array<NoteBasic> | null;
  // isPublishing: boolean;
  // isRefreshing: boolean;
  // hasLocalChanges: boolean;

  /**
   * Adds a folder to the local tree
   */
  addNodeFolder(
    parentId: string | null,
    index: number,
    title: string
  ): Promise<void>;

  /**
   * Adds a note to the local tree
   */
  addNodeNote(
    parentId: string | null,
    index: number,
    noteId: string
  ): Promise<void>;

  /**
   * Updates the title of a folder in the local tree
   */
  setNodeFolderTitle: (folderId: string, title: string) => Promise<void>;

  /**
   * Sets the position of a node in the local tree
   */
  setNodePosition: (
    sourceNodeId: string,
    destinationParentId: string | null,
    destinationIndex: number
  ) => Promise<void>;

  /**
   * Removes a node from the local tree
   */
  removeNode: (nodeId: string) => Promise<void>;
};

export const NoteTreeContext = createContext<NoteTreeContextType>({
  tree: null,
  notes: null,
  // isPublishing: false,
  // isRefreshing: false,
  // hasLocalChanges: false,
  addNodeFolder: async () => {
    throw new Error("addFolder not implemented");
  },
  addNodeNote: async () => {
    throw new Error("addNote not implemented");
  },
  setNodeFolderTitle: async () => {
    throw new Error("setFolderTitle not implemented");
  },
  setNodePosition: async () => {
    throw new Error("setNodePosition not implemented");
  },
  removeNode: async () => {
    throw new Error("removeNode not implemented");
  },
});

export const NoteTreeProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [isBlocked, setIsBlocked] = useState(false);

  const { apiContext: genericApiContext, auth } = useContext(AuthContext);

  const [_treeServer, setTreeServer] = useState<Pick<
    ApiTree,
    "revision" | "structure"
  > | null>(null);

  const [tree, setTree] = useState<Pick<
    ApiTree,
    "revision" | "structure"
  > | null>(null);

  const [notesServer, setNotesServer] = useState<Array<NoteBasic> | null>(null);

  useEffect(() => {
    if (auth === null) {
      console.log("[NotesProvider] Tree Server Refresh: No auth context");
      return;
    }

    const fetchTree = async () => {
      console.log("[NotesProvider] Tree Server Refresh: Fetching tree");
      const treeResult = await apiTreeGet(genericApiContext);
      const notesResult = await apiNotes(genericApiContext);

      if (!treeResult.success) {
        console.error(
          "[NotesProvider] Failed to fetch tree:",
          treeResult.message
        );

        return;
      }

      if (!notesResult.success) {
        console.error(
          "[NotesProvider] Failed to fetch notes:",
          notesResult.message
        );

        return;
      }

      setNotesServer(notesResult.data.notes);
      setTreeServer(treeResult.data);

      console.log(
        "[NotesProvider] Tree Server Refresh: Tree fetched successfully"
      );

      // TODO: Check if server tree is ahead of local tree.

      if (!tree) {
        console.log(
          "[NotesProvider] Tree Server Refresh: Setting initial tree"
        );
        setTree(treeResult.data);
        return;
      }

      if (tree && treeResult.data.revision > tree.revision) {
        // Server ahead of tree
        console.log(
          "[NotesProvider] Tree Server Refresh: Server tree is ahead of local tree"
        );
        setTree(treeResult.data);
        return;
      }

      if (!auth.other.isActiveEditor) {
        console.log(
          "[NotesProvider] Tree Server Refresh: Overwriting local tree"
        );

        setTree(treeResult.data);
      }

      // Inject dangling notes which cannot be found in the CURRENT tree.
      const treeWithDanglers = treeStructureInsertDanglers(
        treeResult.data.structure,
        notesResult.data.notes
      );

      if (treeWithDanglers.inserted === 0) {
        return;
      }

      console.log(
        `[NotesProvider] Tree Server Refresh: Inserted ${treeWithDanglers.inserted} dangling notes`
      );

      setTree({
        revision: treeResult.data.revision,
        structure: treeWithDanglers.newStructure,
      });
    };

    fetchTree();

    const interval = setInterval(fetchTree, 10000);
    return () => clearInterval(interval);
  }, [genericApiContext, auth]);

  const addNodeFolder = useCallback(
    async (parentId: string | null, index: number, title: string) => {
      if (isBlocked) {
        console.log("[addNodeFolder] Operation blocked, already in progress");
        return;
      }

      if (!tree) {
        console.error("[addNodeFolder] Tree is not initialized");
        return;
      }

      try {
        setIsBlocked(true);

        const folder: TreeNodeFolder = {
          id: crypto.randomUUID(),
          type: "folder",
          title,
          expanded: false,
          children: [],
        };

        const treeUpdated = treeStructureInsert(
          tree.structure,
          folder,
          parentId,
          index
        );

        const newTree = {
          revision: tree.revision + 1,
          structure: treeUpdated,
        };

        const result = await apiTreeSet(genericApiContext, newTree);
        const notesResult = await apiNotes(genericApiContext);

        if (result.success) {
          setTree(newTree);
          setTreeServer(newTree);
        } else {
          console.error(
            "[addNodeFolder] Failed to update tree after adding folder:",
            result.message
          );
        }

        if (notesResult.success) {
          setNotesServer(notesResult.data.notes);
        } else {
          console.error(
            "[addNodeFolder] Failed to fetch notes after adding folder:",
            notesResult.message
          );
        }
      } finally {
        setIsBlocked(false);
      }
    },
    [tree, isBlocked, genericApiContext]
  );

  const addNodeNote = useCallback(
    async (parentId: string | null, index: number, noteId: string) => {
      if (isBlocked) {
        console.log("[addNodeNote] Operation blocked, already in progress");
        return;
      }

      if (!tree) {
        console.error("[addNodeNote] Tree is not initialized");
        return;
      }

      try {
        setIsBlocked(true);

        const note: TreeNodeNote = {
          type: "note",
          id: noteId,
          icon: {
            icon: "default",
          },
        };

        const treeUpdated = treeStructureInsert(
          tree.structure,
          note,
          parentId,
          index
        );

        const newTree = {
          revision: tree.revision + 1,
          structure: treeUpdated,
        };

        const result = await apiTreeSet(genericApiContext, newTree);
        const notesResult = await apiNotes(genericApiContext);

        if (result.success) {
          setTree(newTree);
          setTreeServer(newTree);
        } else {
          console.error(
            "[addNodeNote] Failed to update tree after adding note:",
            result.message
          );
        }

        if (notesResult.success) {
          setNotesServer(notesResult.data.notes);
        } else {
          console.error(
            "[addNodeNote] Failed to fetch notes after adding note:",
            notesResult.message
          );
        }
      } finally {
        setIsBlocked(false);
      }
    },
    [tree, isBlocked, genericApiContext]
  );

  const setNodeFolderTitle = async (folderId: string, title: string) => {
    if (isBlocked) {
      console.log(
        "[setNodeFolderTitle] Operation blocked, already in progress"
      );
      return;
    }

    if (!tree) {
      console.error("[setNodeFolderTitle] Tree is not initialized");
      return;
    }

    try {
      setIsBlocked(true);

      const treeUpdated = treeStructureUpdateFolderTitle(
        tree.structure,
        folderId,
        title
      );

      const newTree = {
        revision: tree.revision + 1,
        structure: treeUpdated,
      };

      const result = await apiTreeSet(genericApiContext, newTree);
      const notesResult = await apiNotes(genericApiContext);

      if (result.success) {
        setTree(result.data);
        setTreeServer(result.data);
      } else {
        console.error(
          "[setNodeFolderTitle] Failed to update tree after setting folder title:",
          result.message
        );
      }

      if (notesResult.success) {
        setNotesServer(notesResult.data.notes);
      } else {
        console.error(
          "[setNodeFolderTitle] Failed to fetch notes after setting folder title:",
          notesResult.message
        );
      }
    } finally {
      setIsBlocked(false);
    }
  };

  const setNodePosition = async (
    sourceNodeId: string,
    destinationParentId: string | null,
    destinationIndex: number
  ) => {
    if (isBlocked) {
      console.log("[setNodePosition] Operation blocked, already in progress");
      return;
    }

    if (!tree) {
      console.error("[setNodeFolderTitle] Tree is not initialized");
      return;
    }

    try {
      setIsBlocked(true);

      const { node: removedNode, newStructure: treeWithRemoved } =
        treeStructureFindAndRemove(tree.structure, sourceNodeId);

      if (!removedNode) {
        console.error("[setNodePosition] Node not found in tree");
        return;
      }

      const treeUpdated = treeStructureInsert(
        treeWithRemoved,
        removedNode,
        destinationParentId,
        destinationIndex
      );

      const newTree = {
        revision: tree.revision + 1,
        structure: treeUpdated,
      };

      const result = await apiTreeSet(genericApiContext, newTree);
      const notesResult = await apiNotes(genericApiContext);

      if (result.success) {
        setTree(result.data);
        setTreeServer(result.data);
      } else {
        console.error(
          "[setNodePosition] Failed to update tree after setting node position:",
          result.message
        );
      }

      if (notesResult.success) {
        setNotesServer(notesResult.data.notes);
      } else {
        console.error(
          "[setNodePosition] Failed to fetch notes after setting node position:",
          notesResult.message
        );
      }
    } finally {
      setIsBlocked(false);
    }
  };

  const removeNode = async (nodeId: string) => {
    if (isBlocked) {
      console.log("[removeNode] Operation blocked, already in progress");
      return;
    }

    if (!tree) {
      console.error("[setNodeFolderTitle] Tree is not initialized");
      return;
    }

    try {
      setIsBlocked(true);

      const { newStructure: treeUpdated, node: removedNode } =
        treeStructureFindAndRemove(tree.structure, nodeId);

      console.log("[removeNode] Removing node:", removedNode);

      if (removedNode) {
        const removedNotes = treeStructureFlattenNotes([removedNode]);

        for (const note of removedNotes) {
          console.log("[removeNode] Deleting note:", note.id);
          await apiDeleteNote(genericApiContext, note.id).catch((err) => {
            console.error(
              `[removeNode] Failed to delete note ${note.id}:`,
              err
            );
          });
        }
      }

      const newTree = {
        revision: tree.revision + 1,
        structure: treeUpdated,
      };

      const result = await apiTreeSet(genericApiContext, newTree);
      const notesResult = await apiNotes(genericApiContext);

      if (result.success) {
        setTree(result.data);
        setTreeServer(result.data);
      } else {
        console.error(
          "[removeNode] Failed to update tree after removing node:",
          result.message
        );
      }

      if (notesResult.success) {
        setNotesServer(notesResult.data.notes);
      } else {
        console.error(
          "[removeNode] Failed to fetch notes after removing node:",
          notesResult.message
        );
      }
    } finally {
      setIsBlocked(false);
    }
  };

  const contextValue = useMemo(() => {
    return {
      notes: notesServer,
      tree: tree ? tree.structure : null,
      addNodeFolder,
      addNodeNote,
      setNodeFolderTitle,
      setNodePosition,
      removeNode,
    };
  }, [
    notesServer,
    tree,
    addNodeFolder,
    addNodeNote,
    setNodeFolderTitle,
    setNodePosition,
    removeNode,
  ]);

  return (
    <NoteTreeContext.Provider value={contextValue}>
      {children}
    </NoteTreeContext.Provider>
  );
};
