import { ApiContext, ApiGenericResponse } from ".";

export type TreeIcon = {
  icon: "default" | "page";
};

export type TreeNodeNote = {
  type: "note";
  id: string;
  icon: TreeIcon;
};

export type TreeNodeFolder = {
  type: "folder";
  id: string;
  title: string;
  icon?: TreeIcon;
  iconChildren?: TreeIcon;
  expanded: boolean;
  children?: TreeStructure;
};

export type TreeNode = TreeNodeNote | TreeNodeFolder;

export type TreeStructure = Array<TreeNode>;

export type ApiTree = {
  structure: TreeStructure;
  revision: number;
  modified: string;
  created: string;
};

export const apiTreeGet = async (
  context: ApiContext
): Promise<ApiGenericResponse<ApiTree>> => {
  const response = await fetch("/api/tree", {
    method: "GET",
    headers: {
      "X-Session-Tab-Token": context.sessionTabToken ?? "",
    },
  });

  return await response.json();
};

export const apiTreeSet = async (
  context: ApiContext,
  payload: {
    structure: TreeStructure;
    revision: number;
  }
): Promise<ApiGenericResponse<ApiTree>> => {
  const response = await fetch("/api/tree", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Session-Tab-Token": context.sessionTabToken ?? "",
    },
    body: JSON.stringify(payload),
  });

  return await response.json();
};
