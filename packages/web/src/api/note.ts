import { ApiContext, ApiGenericResponse } from ".";

export type Note = {
  id: string;
  title: string;
  revision: number;
  notices: unknown[];
  content: string;
  created: string;
  modified: string;
};

export type NoteBasic = Omit<Note, "content" | "notices">;

export type NotesResponse = {
  notes: NoteBasic[];
};

export type NoteResponse = {
  note: Note;
};

export const apiNotes = async (
  context: ApiContext
): Promise<ApiGenericResponse<NotesResponse>> => {
  const response = await fetch("/api/note", {
    method: "GET",
    headers: {
      "X-Session-Tab-Token": context.sessionTabToken ?? "",
    },
  });

  return await response.json();
};

export const apiCreateNote = async (
  context: ApiContext,
  payload: {
    title: string;
    content: string;
  }
): Promise<ApiGenericResponse<NoteResponse>> => {
  const response = await fetch(`/api/note`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Session-Tab-Token": context.sessionTabToken ?? "",
    },
    body: JSON.stringify(payload),
  });

  return await response.json();
};

export const apiGetNote = async (
  context: ApiContext,
  noteId: string
): Promise<ApiGenericResponse<NoteResponse>> => {
  const response = await fetch(`/api/note/${noteId}`, {
    method: "GET",
    headers: {
      "X-Session-Tab-Token": context.sessionTabToken ?? "",
    },
  });

  return await response.json();
};

export const apiUpdateNote = async (
  context: ApiContext,
  noteId: string,
  payload: {
    title?: string;
    content?: string;
    revision: number;
  }
): Promise<ApiGenericResponse<NoteResponse>> => {
  const response = await fetch(`/api/note/${noteId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      "X-Session-Tab-Token": context.sessionTabToken ?? "",
    },
    body: JSON.stringify(payload),
  });

  return await response.json();
};

export const apiDeleteNote = async (
  context: ApiContext,
  noteId: string
): Promise<ApiGenericResponse> => {
  const response = await fetch(`/api/note/${noteId}`, {
    method: "DELETE",
    headers: {
      "X-Session-Tab-Token": context.sessionTabToken ?? "",
    },
  });

  return await response.json();
};
