import { NoteBasic } from "../api/note";
import { TreeNode, TreeNodeNote, TreeStructure } from "../api/tree";

export const treeStructureInsertDanglers = (
  structure: TreeStructure,
  notes: NoteBasic[]
): { inserted: number; newStructure: TreeStructure } => {
  let result = structuredClone(structure);
  let inserted = 0;

  for (const note of notes) {
    if (treeStructureFind(result, note.id)) {
      continue; // Note already exists in the tree
    }

    inserted++;

    let danglerFolder = treeStructureFindFolder(result, "Danglers");
    if (!danglerFolder) {
      danglerFolder = {
        type: "folder",
        id: crypto.randomUUID(),
        title: "Danglers",
        icon: { icon: "default" },
        expanded: false,
        children: [],
      };

      result = treeStructureInsert(result, danglerFolder, null, result.length);
    }

    result = treeStructureInsert(
      result,
      {
        type: "note",
        id: note.id,
        icon: {
          icon: "default",
        },
      },
      danglerFolder.id,
      0
    );
  }

  return {
    inserted,
    newStructure: result,
  };
};

export const treeStructureFindFolder = (
  structure: TreeStructure,
  title: string
): TreeNode | null => {
  for (const node of structure) {
    if (node.type === "folder" && node.title === title) {
      return node;
    }

    if (node.type === "folder" && node.children) {
      const found = treeStructureFindFolder(node.children, title);
      if (found) {
        return found;
      }
    }
  }

  return null;
};

export const treeStructureFind = (
  structure: TreeStructure,
  nodeId: string
): TreeNode | null => {
  for (const node of structure) {
    if (node.id === nodeId) {
      return node;
    }

    if (node.type === "folder" && node.children) {
      const found = treeStructureFind(node.children, nodeId);
      if (found) {
        return found;
      }
    }
  }

  return null;
};

export const treeStructureInsert = (
  structure: TreeStructure,
  node: TreeNode,
  destinationNodeId: string | null,
  index: number
): TreeStructure => {
  if (destinationNodeId === null) {
    return [...structure.slice(0, index), node, ...structure.slice(index)];
  }

  for (let i = 0; i < structure.length; i++) {
    const currentNode = structure[i];

    if (currentNode.type === "folder" && currentNode.id === destinationNodeId) {
      // Found the destination node, insert here
      const children = currentNode.children || [];

      return [
        ...structure.slice(0, i),
        {
          ...currentNode,
          children: [
            ...children.slice(0, index),
            node,
            ...children.slice(index),
          ],
        },
        ...structure.slice(i + 1),
      ];
    }

    if (currentNode.type === "folder") {
      // Recursively search in children
      const newChildren = treeStructureInsert(
        currentNode.children || [],
        node,
        destinationNodeId,
        index
      );

      if (newChildren !== currentNode.children) {
        return [
          ...structure.slice(0, i),
          { ...currentNode, children: newChildren },
          ...structure.slice(i + 1),
        ];
      }
    }
  }
  return structure; // If not found, return original structure
};

export const treeStructureUpdateFolderTitle = (
  nodes: TreeNode[],
  nodeId: string,
  title: string
): TreeNode[] => {
  return nodes.map((node) => {
    if (node.id === nodeId && node.type === "folder") {
      return { ...node, title };
    }

    if (node.type === "folder" && node.children) {
      return {
        ...node,
        children: treeStructureUpdateFolderTitle(node.children, nodeId, title),
      };
    }

    return node;
  });
};

export const treeStructureFindAndRemove = (
  structure: TreeStructure,
  nodeId: string
): { node: TreeNode | null; newStructure: TreeStructure } => {
  for (let i = 0; i < structure.length; i++) {
    const node = structure[i];

    if (node.id === nodeId) {
      // Found the node, remove it
      return {
        node,
        newStructure: [...structure.slice(0, i), ...structure.slice(i + 1)],
      };
    }

    if (node.type === "folder") {
      // Recursively search in children
      const result = treeStructureFindAndRemove(node.children || [], nodeId);

      if (result.node) {
        return {
          node: result.node,
          newStructure: [
            ...structure.slice(0, i),
            {
              ...node,
              children: result.newStructure,
            },
            ...structure.slice(i + 1),
          ],
        };
      }
    }
  }

  return {
    node: null,
    newStructure: structure,
  };
};

export const treeStructureFlattenNotes = (
  structure: TreeStructure
): TreeNodeNote[] => {
  const notes: TreeNodeNote[] = [];

  for (const node of structure) {
    if (node.type === "note") {
      notes.push(node);
    } else if (node.type === "folder" && node.children) {
      notes.push(...treeStructureFlattenNotes(node.children));
    }
  }

  return notes;
};
