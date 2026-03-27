import { useParams, useNavigate, Link } from 'react-router-dom'
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Calendar, Clock, Tag } from 'lucide-react'

interface Note {
  id: string
  title: string
  content: string
  tags: string[]
  createdAt: number
  updatedAt: number
}

interface NoteViewProps {
  notes: Note[]
  onDelete: (id: string) => void
}

export function NoteView({ notes, onDelete }: NoteViewProps) {
  const { id } = useParams()
  const navigate = useNavigate()
  const note = notes.find(n => n.id === id)

  if (!note) {
    return <div className="text-center py-10">Note not found</div>
  }

  const handleDelete = () => {
    onDelete(note.id)
    navigate('/')
  }

  return (
    <Card className="max-w-4xl mx-auto my-8 shadow-lg">
      <CardHeader className="space-y-4">
        <CardTitle className="text-3xl font-bold text-primary">{note.title}</CardTitle>
        <div className="flex flex-wrap gap-2">
          {note.tags.map((tag) => (
            <Badge key={tag} variant="secondary" className="px-2 py-1">
              <Tag className="w-4 h-4 mr-1 inline" />
              {tag}
            </Badge>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        <p className="whitespace-pre-wrap text-lg leading-relaxed">{note.content}</p>
      </CardContent>
      <CardFooter className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div className="text-sm text-muted-foreground space-y-1">
          <div className="flex items-center">
            <Calendar className="w-4 h-4 mr-2" />
            Created: {new Date(note.createdAt).toLocaleString()}
          </div>
          <div className="flex items-center">
            <Clock className="w-4 h-4 mr-2" />
            Updated: {new Date(note.updatedAt).toLocaleString()}
          </div>
        </div>
        <div className="space-x-2 flex">
          <Button variant="outline" asChild>
            <Link to={`/edit/${note.id}`}>Edit</Link>
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">Delete</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete your note.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardFooter>
    </Card>
  )
}