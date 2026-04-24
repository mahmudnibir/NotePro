import { Button } from "./ui/button"
import { Command, LogOut, Search } from "lucide-react"
import { useEffect, useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { Input } from "./ui/input"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "./ui/dialog"

interface TopNavProps {
  onMenuClick: () => void
  searchTerm?: string
  setSearchTerm?: (val: string) => void
}

export function TopNav({ onMenuClick, searchTerm, setSearchTerm }: TopNavProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const [isSignOutOpen, setIsSignOutOpen] = useState(false)
  
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.key === 'k') {
        event.preventDefault()
        onMenuClick()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [onMenuClick])

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_info');
    toast.success('Logged out successfully');
    navigate('/auth');
  }

  const isNotesPage = location.pathname === '/notes'

  return (
    <nav className="sticky top-0 z-50 w-full bg-surface border-b border-border">
      <div className="w-full px-4">
        <div className="flex justify-between h-14 items-center">
          <Link to="/" className="flex items-center space-x-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-base">
              N
            </div>
            <span className="text-xl font-bold tracking-tight text-foreground hidden sm:block">NotePro</span>
          </Link>
          
          {isNotesPage && setSearchTerm && (
            <div className="flex-1 max-w-md mx-4 relative hidden md:block">
              <Search className="absolute left-2.5 top-2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search notes..."
                className="w-full pl-9 bg-background border-border focus-visible:ring-primary h-8 text-sm"
                value={searchTerm || ''}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          )}

          <div className="flex items-center space-x-2 sm:space-x-4">
            <Button
              variant="outline"
              size="sm"
              className="text-muted-foreground hover:text-foreground h-8"
              onClick={onMenuClick}
            >
              <Command className="mr-2 h-4 w-4 hidden sm:block" />
              Ctrl+K
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsSignOutOpen(true)}
              className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 h-8 hidden sm:flex"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsSignOutOpen(true)}
              className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 sm:hidden h-8 w-8"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
      <Dialog open={isSignOutOpen} onOpenChange={setIsSignOutOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sign out of NotePro?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">You can sign back in any time. Unsaved changes will be kept locally.</p>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsSignOutOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleLogout} className="bg-primary text-primary-foreground hover:bg-primary/90">
              Sign Out
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </nav>
  )
}
