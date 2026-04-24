import { Github } from "lucide-react"

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-background border-t border-border">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 flex flex-col items-center gap-4">
        <div className="text-center">
          <p className="text-sm font-medium text-foreground">
            &copy; {currentYear} Copyright to Niviron INC.
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Owners: Nibir Mahmud & Hiranmay Roy
          </p>
        </div>

        <div className="flex items-center justify-center gap-6">
          <a
            href="https://github.com/mahmudnibir/"
            target="_blank"
            rel="noreferrer"
            className="group flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-all duration-300"
          >
            <div className="p-2 rounded-full bg-muted group-hover:bg-primary/10 group-hover:scale-110 transition-all duration-300">
              <Github className="w-5 h-5 group-hover:text-primary animate-in group-hover:animate-pulse" />
            </div>
            <span className="bg-gradient-to-r from-muted-foreground to-muted-foreground group-hover:from-primary group-hover:to-blue-500 bg-clip-text group-hover:text-transparent transition-all duration-300">
              Nibir Mahmud
            </span>
          </a>

          <a
            href="https://github.com/cold-cofffeee/"
            target="_blank"
            rel="noreferrer"
            className="group flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-all duration-300"
          >
            <div className="p-2 rounded-full bg-muted group-hover:bg-primary/10 group-hover:scale-110 transition-all duration-300">
              <Github className="w-5 h-5 group-hover:text-primary animate-in group-hover:animate-pulse" />
            </div>
            <span className="bg-gradient-to-r from-muted-foreground to-muted-foreground group-hover:from-primary group-hover:to-blue-500 bg-clip-text group-hover:text-transparent transition-all duration-300">
              Hiranmay Roy
            </span>
          </a>
        </div>
      </div>
    </footer>
  )
}