import { useState } from 'react'
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, X } from "lucide-react"

interface TagManagerProps {
  tags: string[]
  onAddTag: (tag: string) => void
  onRemoveTag: (tag: string) => void
}

export function TagManager({ tags, onAddTag, onRemoveTag }: TagManagerProps) {
  const [newTag, setNewTag] = useState('')

  const handleAddTag = () => {
    if (newTag.trim() !== '') {
      onAddTag(newTag.trim())
      setNewTag('')
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {tags.map((tag) => (
          <Badge key={tag} variant="secondary" className="text-sm">
            {tag}
            <Button
              variant="ghost"
              size="sm"
              className="ml-2 h-4 w-4 p-0"
              onClick={() => onRemoveTag(tag)}
            >
              <X className="h-3 w-3" />
            </Button>
          </Badge>
        ))}
      </div>
      <div className="flex items-center space-x-2">
        <Input
          type="text"
          placeholder="Add new tag..."
          value={newTag}
          onChange={(e) => setNewTag(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
        />
        <Button onClick={handleAddTag} size="sm">
          <Plus className="mr-2 h-4 w-4" /> Add Tag
        </Button>
      </div>
    </div>
  )
}