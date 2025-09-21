'use client'

import React, { useState, useEffect } from 'react'

// Import dinâmico para evitar erros de SSR
const loadFramerMotion = async () => {
  if (typeof window !== 'undefined') {
    const fm = await import('framer-motion')
    return fm
  }
  return null
}

function cn(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(' ')
}

interface FabMenuProps {
  cartItemsCount?: number
}

export function FabMenu({ cartItemsCount = 0 }: FabMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [framerMotion, setFramerMotion] = useState<any>(null)
  const [Link, setLink] = useState<any>(null)

  useEffect(() => {
    // Carregar componentes dinamicamente
    const loadComponents = async () => {
      if (typeof window !== 'undefined') {
        const fm = await loadFramerMotion()
        const nextLink = (await import('next/link')).default
        setFramerMotion(fm)
        setLink(() => nextLink)
      }
    }
    loadComponents()
  }, [])

  if (!framerMotion || !Link) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-14 h-14 bg-coxinha-primary rounded-full shadow-lg flex items-center justify-center text-white text-2xl"
        >
          ☰
        </button>
      </div>
    )
  }

  const { motion, AnimatePresence } = framerMotion

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Background overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/20 z-40"
            onClick={() => setIsOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Action buttons */}
      <AnimatePresence>
        {isOpen && (
          <div className="absolute bottom-16 right-0 space-y-3">
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.8 }}
              transition={{ duration: 0.2, delay: 0.1 }}
            >
              <Link
                href="/acompanhamento"
                className="flex items-center gap-3 bg-white shadow-lg rounded-full px-4 py-3 text-gray-700 hover:bg-gray-50 transition-colors"
                onClick={() => setIsOpen(false)}
              >
                <span className="text-xl">📍</span>
                <span className="text-sm font-medium">Acompanhar Pedido</span>
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.8 }}
              transition={{ duration: 0.2 }}
            >
              <Link
                href="/carrinho"
                className="flex items-center gap-3 bg-coxinha-primary shadow-lg rounded-full px-4 py-3 text-white hover:bg-coxinha-dark transition-colors"
                onClick={() => setIsOpen(false)}
              >
                <span className="text-xl">🛒</span>
                <span className="text-sm font-medium">Carrinho</span>
                {cartItemsCount > 0 && (
                  <span className="bg-white text-coxinha-primary text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {cartItemsCount}
                  </span>
                )}
              </Link>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Main FAB button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-14 h-14 rounded-full shadow-lg flex items-center justify-center text-white text-2xl transition-colors",
          isOpen ? "bg-red-500 hover:bg-red-600" : "bg-coxinha-primary hover:bg-coxinha-dark"
        )}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        <motion.div
          animate={{ rotate: isOpen ? 45 : 0 }}
          transition={{ duration: 0.2 }}
        >
          {isOpen ? "✕" : "☰"}
        </motion.div>
      </motion.button>
    </div>
  )
}