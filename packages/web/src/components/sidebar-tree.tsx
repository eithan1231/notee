import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import { NodeRendererProps, Tree, TreeApi } from "react-arborist";
import { Link, useNavigate, useParams } from "react-router-dom";
import { NavArrowRight, Page } from "iconoir-react";
import { MenuContext, MenuContextMenuItem } from "../contexts/menu-context";
import { TreeNode, TreeStructure } from "../api/tree";
import { AuthContext } from "../contexts/auth-context";
import { StorageContext } from "../contexts/storage-context";
import { TextPromptComponent } from "./text-prompt";
import { ConfirmPromptComponent } from "./confirm-prompt";
import { NoteTreeContext } from "../contexts/note-tree-context";

const SidebarContext = createContext<{
  renameFolder: (id: string) => void;
  createFolder: (title: string, parentId: string | null, index: number) => void;
  select: (id: string) => void;
  delete: (id: string) => void;
}>({
  renameFolder: () => {},
  createFolder: () => {},
  select: () => {},
  delete: () => {},
});

export const SidebarTree = () => {
  const {
    tree,
    addNodeFolder,
    setNodeFolderTitle,
    removeNode,
    setNodePosition,
  } = useContext(NoteTreeContext);
  const authContext = useContext(AuthContext);
  const { storageLoaded, storageData, setStorageData } =
    useContext(StorageContext);

  const navigate = useNavigate();
  const params = useParams();

  const [renameFolderId, setRenameFolderId] = useState<string | null>(null);
  const [deleteNodeId, setDeleteNodeId] = useState<string | null>(null);

  const [treeRef, setTreeRef] = useState<TreeApi<TreeNode> | null | undefined>(
    null
  );

  // I hate that this is necessary. I am sorry for my sins. Sincerely... I am.
  const treeHeight = useMemo(() => {
    if (!tree) {
      return 1000;
    }

    const getSize = (children: TreeStructure): number => {
      let sum = 0;

      for (const child of children) {
        sum += 1;

        if (
          child.type === "folder" &&
          child.children &&
          typeof storageData.treeInitialExpanded[child.id] === "undefined"
        ) {
          sum += getSize(child.children);
        }
      }

      return sum;
    };

    const visibleNodesCount = getSize(tree);

    return visibleNodesCount * (treeRef?.rowHeight || 34);
  }, [storageData, tree, treeRef]);

  const contextHandleSelect = useCallback(
    (id: string) => {
      const node = treeRef?.get(id);

      if (!node || node.data.type === "folder") {
        return;
      }

      navigate(`/notee/notes/${id}/`);
    },
    [navigate, treeRef]
  );

  const contextHandleCreateFolder = useCallback(
    async (title: string, parentNodeId: string | null, index: number) => {
      await addNodeFolder(parentNodeId, index, title);
    },
    [tree]
  );

  const contextHandleRenameFolder = useCallback(
    (nodeId: string) => {
      setRenameFolderId(nodeId);
    },
    [setRenameFolderId]
  );

  const contextHandleDelete = useCallback(
    (nodeId: string) => {
      setDeleteNodeId(nodeId);
    },
    [setDeleteNodeId]
  );

  const handleFolderRenamePromptCallback = useCallback(
    async (text: string) => {
      if (!renameFolderId) {
        return;
      }

      await setNodeFolderTitle(renameFolderId, text);

      setRenameFolderId(null);
    },
    [renameFolderId, tree]
  );

  const handleFolderDeletePromptCallback = useCallback(async () => {
    if (!deleteNodeId) {
      return;
    }

    await removeNode(deleteNodeId);

    setDeleteNodeId(null);
  }, [deleteNodeId, tree]);

  return (
    <>
      {renameFolderId && (
        <TextPromptComponent
          onCancel={() => {
            setRenameFolderId(null);
          }}
          onSubmit={handleFolderRenamePromptCallback}
          title="Rename Folder"
        />
      )}

      {deleteNodeId && (
        <ConfirmPromptComponent
          onCancel={() => {
            setDeleteNodeId(null);
          }}
          onSubmit={handleFolderDeletePromptCallback}
          title="Delete Folder"
          message="Are you sure you want to delete this item? This action is irreversible."
        />
      )}

      <SidebarContext.Provider
        value={{
          renameFolder: contextHandleRenameFolder,
          createFolder: contextHandleCreateFolder,
          select: contextHandleSelect,
          delete: contextHandleDelete,
        }}
      >
        <div className="p-4 pr-2">
          {tree !== null && storageLoaded && (
            <Tree<TreeNode>
              selection={params.noteId}
              className="border-radius-16px"
              ref={(t) => setTreeRef(t)}
              indent={22}
              disableDrag={!authContext.auth?.other.isActiveEditor}
              rowHeight={34}
              height={treeHeight}
              disableEdit={true}
              onToggle={(id) => {
                const node = treeRef?.get(id);
                if (node && node.data.type === "folder") {
                  const initialExpandedTreeClone = structuredClone(
                    storageData.treeInitialExpanded
                  );

                  if (!node.isOpen) {
                    initialExpandedTreeClone[node.data.id] = false;
                  } else {
                    delete initialExpandedTreeClone[node.data.id];
                  }

                  setStorageData(
                    "treeInitialExpanded",
                    initialExpandedTreeClone
                  );
                }
              }}
              disableMultiSelection={true}
              onMove={(args) => {
                if (args.dragNodes.length === 0) {
                  return;
                }

                const dragNode = args.dragNodes[0];
                const parentId = args.parentNode?.data.id ?? null;
                const index = args.index;

                // Stupid bug with react-arborist where the index is off by one when moving node within the same parent.
                const existingIndex =
                  args.dragNodes[0].parent?.children?.findIndex(
                    (child) => child.data.id === dragNode.data.id
                  );

                let newIndex;

                if (existingIndex !== undefined && existingIndex >= 0) {
                  if (existingIndex < index) {
                    newIndex = index - 1;
                  } else {
                    newIndex = index;
                  }
                } else {
                  newIndex = index;
                }

                setNodePosition(dragNode.data.id, parentId, newIndex);
              }}
              width={"100%"}
              initialOpenState={storageData.treeInitialExpanded}
              data={tree}
            >
              {Node}
            </Tree>
          )}
        </div>
      </SidebarContext.Provider>
    </>
  );
};

const Node = ({ node, style, dragHandle }: NodeRendererProps<TreeNode>) => {
  const sidebarContext = useContext(SidebarContext);
  const { notes } = useContext(NoteTreeContext);
  const menuContext = useContext(MenuContext);
  const { auth } = useContext(AuthContext);

  const title = useMemo(() => {
    if (node.data.type === "folder") {
      return node.data.title;
    }

    if (node.data.type === "note") {
      if (!notes) {
        return "Loading...";
      }

      const note = notes.find((note) => note.id === node.data.id);
      return note?.title ?? "Dangling Note";
    }

    return "Unknown Title";
  }, [notes]);

  const contextMenuItems: MenuContextMenuItem[] = useMemo(() => {
    const items: MenuContextMenuItem[] = [];

    if (node.data.type === "folder" && auth?.other.isActiveEditor) {
      items.push({
        name: "Rename",
        action: () => {
          sidebarContext.renameFolder(node.data.id);
        },
      });
    }

    if (node.data.type === "note") {
      items.push({
        name: "Open",
        action: () => {
          node.select();
        },
      });
    }

    if (auth?.other.isActiveEditor) {
      items.push({
        name: "New Folder",
        action: () => {
          let parentNodeId;
          let index;

          if (node.data.type === "folder") {
            // When creating folder from another folder, we add it as a child.
            index = node.children?.length ?? 0;
            parentNodeId = node.data.id;
          } else if (
            node.parent &&
            node.parent.id === "__REACT_ARBORIST_INTERNAL_ROOT__"
          ) {
            index = node.rowIndex ?? 0;
            parentNodeId = null; // Root level
          } else {
            index = node.rowIndex ?? 0;
            parentNodeId = node.parent?.data.id || null;
          }

          sidebarContext.createFolder("New Folder", parentNodeId, index);
        },
      });

      items.push({
        name: "Delete",
        action: () => {
          sidebarContext.delete(node.data.id);
        },
      });
    }

    return items;
  }, [
    auth?.other.isActiveEditor,
    node.id,
    sidebarContext.renameFolder,
    sidebarContext.createFolder,
  ]);

  return (
    <Link
      to={`/notee/notes/${node.data.id}/`}
      onClick={(e) => {
        e.preventDefault();
        sidebarContext.select(node.data.id);
      }}
      title={title}
      className={`text-[16px]`}
    >
      <div
        ref={dragHandle}
        style={style}
        onClick={() => node.toggle()}
        onContextMenu={(e) => {
          e.preventDefault();
          menuContext.showContextMenu(
            title,
            {
              x: e.clientX,
              y: e.clientY,
            },
            contextMenuItems
          );
        }}
        className={`
          max-w-[400px] text-gray-700
          overflow-hidden whitespace-nowrap text-ellipsis py-1 rounded-lg px-2 
          transition-colors cursor-pointer justify-between
          ${node.isSelected ? "bg-gray-100" : "hover:bg-gray-100"}`}
      >
        <span className={`inline-block mr-2 `}>
          {node.data.type === "folder" ? (
            <NavArrowRight
              className={`inline transition-transform duration-50 ${
                node.isOpen ? "rotate-90" : "rotate-0"
              }`}
            />
          ) : (
            <Page className="inline text-[12px] mt-[-4px]" />
          )}
        </span>

        {title}
      </div>
    </Link>
  );
};
