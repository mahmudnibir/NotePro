import { Button } from "@/components/ui/button"
import { Command } from "lucide-react"
import { useEffect } from 'react'
import { Link } from 'react-router-dom'

interface TopNavProps {
  setIsCommandMenuOpen: (isOpen: boolean) => void
}

export function TopNav({ setIsCommandMenuOpen }: TopNavProps) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.key === 's') {
        event.preventDefault()
        setIsCommandMenuOpen(true)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [setIsCommandMenuOpen])

  return (
    <nav className="sticky top-0 z-50 w-full bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <Link to="/" className="flex items-center space-x-2">
            <span className="text-2xl font-bold">📝 NotePro</span>
          </Link>
          <div className="hidden md:flex items-center space-x-4">
            <Link to="/" className="hover:text-primary bg-secondary/50 px-3 py-2 rounded-md">Home</Link>
            <Link to="/notes" className="hover:text-primary">My Notes</Link>
            <a href="#about" className="hover:text-primary">About</a>
            {/* <a href="#features" className="hover:text-primary">Features</a> */}
          </div>
          <div className="flex items-center space-x-4">
            <Button
              variant="secondary"
              size="sm"
              className="hidden sm:flex"
              onClick={() => setIsCommandMenuOpen(true)}
            >
              <Command className="mr-2 h-4 w-4" />
              Search... (Ctrl+S)
            </Button>
            <Button variant="ghost" asChild>
              <Link to="/notes">Get Started</Link>
            </Button>
          </div>
        </div>
      </div>
    </nav>
  )
}
