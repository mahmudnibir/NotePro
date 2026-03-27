import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { TagManager } from './TagManager'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card"
import { Save, ArrowLeft } from 'lucide-react'

interface Note {
  id: string
  title: string
  content: string
  tags: string[]
}

interface NoteEditorProps {
  tags: string[]
  notes?: Note[]
  onSave: (note: Omit<Note, 'id'> | Note) => void
  onAddTag: (tag: string) => void
}

export function NoteEditor({ notes, onSave, onAddTag }: NoteEditorProps) {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [noteTags, setNoteTags] = useState<string[]>([])
  const navigate = useNavigate()
  const { id } = useParams()

  useEffect(() => {
    if (id && notes) {
      const note = notes.find(n => n.id === id)
      if (note) {
        setTitle(note.title)
        setContent(note.content)
        setNoteTags(note.tags)
      }
    } else {
      // Reset state when creating a new note
      setTitle('')
      setContent('')
      setNoteTags([])
    }
  }, [id, notes])

  const handleSave = () => {
    if (id) {
      // If id exists, we're editing an existing note
      onSave({
        id,
        title,
        content,
        tags: noteTags,
      })
    } else {
      // If no id, we're creating a new note
      onSave({
        title,
        content,
        tags: noteTags,
      })
    }
    navigate('/notes')
  }

  const handleAddTag = (tag: string) => {
    if (!noteTags.includes(tag)) {
      setNoteTags([...noteTags, tag])
    }
    onAddTag(tag)
  }

  const handleRemoveTag = (tag: string) => {
    setNoteTags(noteTags.filter(t => t !== tag))
  }

  return (
    <Card className="max-w-3xl mx-auto my-8 shadow-lg">
      <CardHeader>
        <CardTitle className="text-3xl font-bold text-primary flex items-center">
          <Button variant="ghost" size="sm" onClick={() => navigate('/notes')} className="mr-2">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          {id ? 'Edit Note' : 'New Note'}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
            Title
          </label>
          <Input
            id="title"
            placeholder="Enter note title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full"
          />
        </div>
        <div>
          <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-1">
            Content
          </label>
          <Textarea
            id="content"
            placeholder="Write your note content here..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="min-h-[200px] w-full"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tags
          </label>
          <TagManager
            tags={noteTags}
            onAddTag={handleAddTag}
            onRemoveTag={handleRemoveTag}
          />
        </div>
      </CardContent>
      <CardFooter>
        <Button onClick={handleSave} className="w-full sm:w-auto">
          <Save className="mr-2 h-4 w-4" />
          Save Note
        </Button>
      </CardFooter>
    </Card>
  )
}
