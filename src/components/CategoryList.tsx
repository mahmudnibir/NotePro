import { Link } from 'react-router-dom'
import { Button } from "@/components/ui/button"

export function CategoryList({ categories }: { categories: string[] }) {
  return (
    <div className="space-y-2">
      <h2 className="text-lg font-semibold mb-2">Categories</h2>
      {categories.map((category) => (
        <Link key={category} to={`/?category=${category}`}>
          <Button variant="ghost" className="w-full justify-start">
            {category}
          </Button>
        </Link>
      ))}
    </div>
  )
}