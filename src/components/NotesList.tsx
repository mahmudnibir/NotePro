import { Link } from 'react-router-dom'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, Clock, Tag } from 'lucide-react'

interface Note {
  id: string
  title: string
  content: string
  tags: string[]
  createdAt: number
  updatedAt: number
}

export function NotesList({ notes }: { notes: Note[] }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {notes.map((note) => (
        <Link key={note.id} to={`/note/${note.id}`}>
          <Card className="h-full hover:shadow-lg transition-shadow border-l-4 border-blue-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-bold text-blue-700">{note.title}</CardTitle>
              <div className="flex items-center text-xs text-gray-500">
                <Calendar className="w-3 h-3 mr-1" />
                <span>{new Date(note.createdAt).toLocaleDateString()}</span>
                <Clock className="w-3 h-3 ml-2 mr-1" />
                <span>{new Date(note.updatedAt).toLocaleTimeString()}</span>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-700 line-clamp-3">{note.content}</p>
            </CardContent>
            <CardFooter className="pt-2">
              <div className="flex items-center">
                <Tag className="w-4 h-4 mr-2 text-gray-500" />
                <div className="flex flex-wrap gap-1">
                  {note.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs bg-gray-200 text-gray-700">{tag}</Badge>
                  ))}
                </div>
              </div>
            </CardFooter>
          </Card>
        </Link>
      ))}
    </div>
  )
}