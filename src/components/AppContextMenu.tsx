import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { isEditableTarget } from "@/features/notes/noteUtils";

interface AppContextMenuProps {
  children: React.ReactNode;
  onNewNote: () => void;
  onNewTag: () => void;
  onOpenTrash: () => void;
  onOpenArchive: () => void;
}

interface MenuPosition {
  x: number;
  y: number;
}

export function AppContextMenu({
  children,
  onNewNote,
  onNewTag,
  onOpenTrash,
  onOpenArchive,
}: AppContextMenuProps) {
  const [position, setPosition] = useState<MenuPosition | null>(null);
  const [adjustedPosition, setAdjustedPosition] = useState<MenuPosition | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!position) {
      setAdjustedPosition(null);
      return;
    }

    if (!menuRef.current) {
      setAdjustedPosition(position);
      return;
    }

    const { offsetWidth, offsetHeight } = menuRef.current;
    const padding = 12;
    const maxX = window.innerWidth - offsetWidth - padding;
    const maxY = window.innerHeight - offsetHeight - padding;

    setAdjustedPosition({
      x: Math.min(position.x, maxX),
      y: Math.min(position.y, maxY),
    });
  }, [position]);

  useEffect(() => {
    if (!position) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setPosition(null);
      }
    };

    const handlePointerDown = (event: MouseEvent) => {
      if (menuRef.current && menuRef.current.contains(event.target as Node)) {
        return;
      }
      setPosition(null);
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("pointerdown", handlePointerDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [position]);

  const handleContextMenu = (event: React.MouseEvent) => {
    if (isEditableTarget(event.target)) {
      return;
    }

    const target = event.target as HTMLElement | null;
    if (target?.closest("[data-note-contextmenu]")) {
      return;
    }

    event.preventDefault();
    setPosition({ x: event.clientX, y: event.clientY });
  };

  const handleAction = (callback: () => void) => {
    callback();
    setPosition(null);
  };

  return (
    <div className="flex flex-1" onContextMenu={handleContextMenu}>
      {children}
      {position &&
        createPortal(
          <div
            ref={menuRef}
            role="menu"
            className="fixed z-50 w-[156px] rounded-md border border-border bg-popover p-0.5 shadow-lg text-popover-foreground"
            style={{ left: adjustedPosition?.x ?? position.x, top: adjustedPosition?.y ?? position.y }}
          >
            <button
              type="button"
              role="menuitem"
              className="w-full rounded-sm px-2 py-1.5 text-left text-[13px] text-foreground hover:bg-accent hover:text-accent-foreground"
              onClick={() => handleAction(onNewNote)}
            >
              New Note
            </button>
            <button
              type="button"
              role="menuitem"
              className="w-full rounded-sm px-2 py-1.5 text-left text-[13px] text-foreground hover:bg-accent hover:text-accent-foreground"
              onClick={() => handleAction(onNewTag)}
            >
              New Tag
            </button>
            <div className="my-0.5 h-px bg-border" />
            <button
              type="button"
              role="menuitem"
              className="w-full rounded-sm px-2 py-1.5 text-left text-[13px] text-foreground hover:bg-accent hover:text-accent-foreground"
              onClick={() => handleAction(onOpenTrash)}
            >
              Open Trash
            </button>
            <button
              type="button"
              role="menuitem"
              className="w-full rounded-sm px-2 py-1.5 text-left text-[13px] text-foreground hover:bg-accent hover:text-accent-foreground"
              onClick={() => handleAction(onOpenArchive)}
            >
              Open Archive
            </button>
          </div>,
          document.body
        )}
    </div>
  );
}
