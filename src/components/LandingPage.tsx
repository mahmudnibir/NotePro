'use client'

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowRight, Search } from "lucide-react"
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { FeaturesSection } from './FeaturesSection'
import { ThemeToggle } from './ThemeToggle'
export function LandingPage() {
  const [isCommandMenuOpen, setIsCommandMenuOpen] = useState(false)

  return (
    <div className="min-h-screen flex flex-col">

      <main className="flex-grow">
        <div className="absolute top-4 right-4 z-50">
          <ThemeToggle />
        </div>
        <section className="bg-background text-primary min-h-[calc(100vh-4rem)] flex flex-col justify-center items-center text-center px-4 sm:px-6 lg:px-8 relative overflow-hidden border-b border-border">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="relative z-10"
          >
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold mb-6 text-foreground leading-tight">
               Your Thoughts,{' '}
              <span className="text-primary">
                Organized!
              </span>
            </h1>
            <p className="text-xl sm:text-2xl mb-8 max-w-3xl mx-auto">
              Capture ideas, create to-do lists, and manage your notes with ease. NotePro is the ultimate note-taking app for productivity enthusiasts.
            </p>
            <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4">
              <Button asChild size="lg" className="text-lg group">
                <Link to="/auth">
                  Get Started
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="secondary" className="text-lg">
                <a href="#features">Learn More</a>
              </Button>
            </div>
          </motion.div>
          <motion.div
            className="absolute inset-0 z-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.5, delay: 0.5 }}
          >
            
          </motion.div>
        </section>

        <FeaturesSection />

        <section className="py-20 bg-secondary/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold mb-4">Ready to get started?</h2>
              <p className="text-xl text-muted-foreground">Join thousands of users who trust NotePro for their note-taking needs.</p>
            </div>
            <div className="flex justify-center">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button asChild size="lg" className="text-lg px-8">
                  <Link to="/auth">Start Organizing Now</Link>
                </Button>
              </motion.div>
            </div>
          </div>
        </section>
      </main>


      <AnimatePresence>
        {isCommandMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setIsCommandMenuOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="bg-card rounded-lg shadow-xl p-6 w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <Input
                type="text"
                placeholder="Search notes..."
                className="w-full mb-4"
                autoFocus
              />
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Recent searches</p>
                <ul className="space-y-2">
                  <li>
                    <Button variant="ghost" className="w-full justify-start">
                      <Search className="mr-2 h-4 w-4" />
                      Project ideas
                    </Button>
                  </li>
                  <li>
                    <Button variant="ghost" className="w-full justify-start">
                      <Search className="mr-2 h-4 w-4" />
                      Meeting notes
                    </Button>
                  </li>
                </ul>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}