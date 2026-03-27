import { motion } from 'framer-motion'
import { BookOpen, Github, Lightbulb, Users } from 'lucide-react'

const highlights = [
  {
    icon: <Lightbulb className="h-8 w-8" />,
    title: 'Born from a Simple Idea',
    description:
      'NotePro started as a personal project to build a clean, distraction-free note-taking tool that actually gets out of your way.',
  },
  {
    icon: <BookOpen className="h-8 w-8" />,
    title: 'Built for Every Thinker',
    description:
      'Whether you are a student, developer, writer, or professional, NotePro adapts to the way you capture and organize your thoughts.',
  },
  {
    icon: <Users className="h-8 w-8" />,
    title: 'Community Driven',
    description:
      'Feedback and ideas from real users shape every feature. Your voice helps NotePro grow into the tool you always wished you had.',
  },
  {
    icon: <Github className="h-8 w-8" />,
    title: 'Open Source',
    description:
      'NotePro is proudly open source. Explore the code, report issues, or contribute — every pull request is welcome.',
  },
]

export function AboutSection() {
  return (
    <section id="about" className="py-20 bg-secondary/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          className="text-center mb-14"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-4xl font-bold mb-4">About NotePro</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            NotePro is a modern, open-source note-taking application crafted to help you
            capture ideas quickly, organize them effortlessly, and find them instantly —
            all in one beautifully simple interface.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          {highlights.map((item, index) => (
            <motion.div
              key={item.title}
              className="bg-card rounded-lg p-6 shadow-lg hover:shadow-xl transition-shadow duration-300"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <motion.div
                className="text-primary mb-4"
                whileHover={{ scale: 1.1 }}
                transition={{ type: 'spring', stiffness: 400, damping: 10 }}
              >
                {item.icon}
              </motion.div>
              <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
              <p className="text-muted-foreground">{item.description}</p>
            </motion.div>
          ))}
        </div>

        <motion.div
          className="bg-card rounded-2xl shadow-xl p-8 md:p-12 text-center max-w-3xl mx-auto"
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <p className="text-2xl font-semibold mb-4">
            "Your thoughts deserve a home that is as organized as your ambitions."
          </p>
          <p className="text-muted-foreground">
            NotePro was built with one mission: give everyone a powerful yet lightweight
            space to think, plan, and create — without the clutter of over-engineered
            tools. We believe great note-taking should feel effortless.
          </p>
          <div className="mt-6 text-sm text-muted-foreground">
            Made with ❤️ by{' '}
            <a
              href="https://zed.impic.tech"
              className="text-primary hover:underline font-medium"
              target="_blank"
              rel="noopener noreferrer"
            >
              Nibir
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
