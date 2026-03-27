import { motion } from 'framer-motion'
import { Command, Edit3, Search, Tag } from "lucide-react"

const features = [
  {
    icon: <Edit3 className="h-10 w-10" />,
    title: "Rich Text Editing",
    description: "Create and edit notes with a powerful rich text editor.",
  },
  {
    icon: <Tag className="h-10 w-10" />,
    title: "Tag Organization",
    description: "Organize your notes with customizable tags for easy retrieval.",
  },
  {
    icon: <Search className="h-10 w-10" />,
    title: "Quick Search",
    description: "Find your notes instantly with our lightning-fast search feature.",
  },
  {
    icon: <Command className="h-10 w-10" />,
    title: "Command Palette",
    description: "Navigate and control NotePro effortlessly with the command palette.",
  },
]

export function FeaturesSection() {
  return (
    <section id="features" className="py-20 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-4xl font-bold text-center mb-12">Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              className="bg-card rounded-lg p-6 shadow-lg hover:shadow-xl transition-shadow duration-300 ease-in-out"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <motion.div
                className="text-primary mb-4"
                whileHover={{ scale: 1.1 }}
                transition={{ type: 'spring', stiffness: 400, damping: 10 }}
              >
                {feature.icon}
              </motion.div>
              <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}