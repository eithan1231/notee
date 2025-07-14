import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { AuthProvider } from "./contexts/auth-context";
import { MenuProvider } from "./contexts/menu-context";
import { NoteTreeProvider } from "./contexts/note-tree-context";
import { StorageProvider } from "./contexts/storage-context";
import landing from "./pages/landing";
import noteeAuthLogin from "./pages/notee/auth/login";
import noteeAuthRegister from "./pages/notee/auth/register";
import noteeLanding from "./pages/notee/landing";
import noteeNotesIndex from "./pages/notee/notes/index";
import noteeSpecial404 from "./pages/special/404";

const router = createBrowserRouter([
  noteeSpecial404,
  landing,
  noteeLanding,
  noteeAuthLogin,
  noteeAuthRegister,
  noteeNotesIndex,
]);

function App() {
  return (
    <StorageProvider>
      <AuthProvider>
        <MenuProvider>
          <NoteTreeProvider>
            <RouterProvider router={router} />
          </NoteTreeProvider>
        </MenuProvider>
      </AuthProvider>
    </StorageProvider>
  );
}

export default App;
