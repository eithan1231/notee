import { createContext, useState } from "react";
import { Z_LEVELS } from "../z-levels";

export type MenuContextMenuItem = {
  name: string;
  action: () => void;
};

export type MenuContextType = {
  showContextMenu: (
    title: string | null,
    location: {
      x: number;
      y: number;
    },
    items: Array<MenuContextMenuItem>
  ) => void;
};

export const MenuContext = createContext<MenuContextType>({
  showContextMenu: () => {
    console.warn("MenuContext not initialized");
  },
});

export const MenuProvider = ({ children }: { children: React.ReactNode }) => {
  const [visible, setVisible] = useState<boolean>(false);

  const [position, setPosition] = useState<{
    x: number;
    y: number;
  }>({
    x: 0,
    y: 0,
  });

  const [title, setTitle] = useState<string | null>(null);

  const [items, setItems] = useState<Array<MenuContextMenuItem>>([]);

  const showContextMenu = (
    title: string | null,
    location: {
      x: number;
      y: number;
    },
    items: Array<MenuContextMenuItem>
  ) => {
    setTitle(title ?? null);
    setPosition(location);
    setItems(items);
    setVisible(true);
  };

  const handleContextMenuClick = (
    mouseEvent: React.MouseEvent,
    item: MenuContextMenuItem
  ) => {
    mouseEvent.stopPropagation();
    if (item.action) {
      item.action();
    }
    setVisible(false);
  };

  return (
    <>
      {visible && (
        <div
          onClick={() => setVisible(false)}
          onContextMenu={(e) => {
            e.preventDefault();
            setVisible(false);
          }}
          style={{ zIndex: Z_LEVELS.CONTEXT_MENU_BACKGROUND }}
          className="absolute w-full h-full top-0 left-0 bg-black/5"
        >
          <div
            style={{
              left: `${position.x}px`,
              top: `${position.y}px`,
            }}
            className="absolute w-[180px] bg-white border border-gray-200 rounded-lg shadow-lg p-2"
          >
            <ul className="list-none m-0 p-0">
              {title && (
                <li className="text-center font-bold pb-1 mb-2 text-gray-700 border-b-[1px] cursor-default">
                  {title}
                </li>
              )}
              {items.map((item, index) => (
                <li
                  onClick={(e) => {
                    handleContextMenuClick(e, item);
                  }}
                  key={index}
                  className={`py-2 px-4 hover:bg-gray-100 rounded-lg cursor-pointer`}
                >
                  {item.name}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      <MenuContext.Provider value={{ showContextMenu }}>
        {children}
      </MenuContext.Provider>
    </>
  );
};
