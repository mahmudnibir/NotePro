import { Link, useLocation } from "react-router-dom";
import { Users, FileText, BarChart3, Activity, ShieldAlert, Tag, Trash2, LogOut, Archive } from "lucide-react";

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const currentPath = location.pathname;

  const links = [
    { to: "/admin", icon: Activity, label: "Dashboard" },
    { to: "/admin/analytics", icon: BarChart3, label: "Analytics" },
    { to: "/admin/users", icon: Users, label: "Users" },
    { to: "/admin/notes", icon: FileText, label: "Notes" },
    { to: "/admin/archive", icon: Archive, label: "Archive" },
    { to: "/admin/trash", icon: Trash2, label: "Trash" },
    { to: "/admin/tags", icon: Tag, label: "Tags" },
    { to: "/admin/audit", icon: ShieldAlert, label: "Audit Logs" },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      <aside className="w-full md:w-64 bg-surface border-r border-border flex flex-col p-4">
        <div className="mb-8 px-4 flex items-center gap-2">
          <div className="w-8 h-8 rounded bg-primary text-primary-foreground flex items-center justify-center font-bold">
            A
          </div>
          <span className="font-bold text-lg text-foreground">Admin Panel</span>
        </div>
        
        <nav className="flex-1 space-y-2">
          {links.map((link) => {
            const isActive = currentPath === link.to;
            return (
              <Link
                key={link.to}
                to={link.to}
                className={`flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                }`}
              >
                <link.icon className="w-5 h-5 mr-3" />
                {link.label}
              </Link>
            );
          })}
        </nav>
        
        <div className="mt-auto pt-4 border-t border-border">
          <Link
            to="/notes"
            className="flex items-center px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground rounded-md"
          >
            <LogOut className="w-5 h-5 mr-3" />
            Exit Admin
          </Link>
        </div>
      </aside>
      
      <main className="flex-1 overflow-auto p-4 md:p-8">
        <div className="max-w-6xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
