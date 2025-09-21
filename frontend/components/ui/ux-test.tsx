'use client'

import React, { useState } from 'react'
import { GlassCard } from '@/components/ui/glass-card'
import { ShimmerButton } from '@/components/ui/magic-ui'

interface UXTestProps {
  onComplete: (feedback: string) => void
}

export function UXTest({ onComplete }: UXTestProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [responses, setResponses] = useState<string[]>([])

  const questions = [
    {
      id: 'ease_of_use',
      question: 'Como você avalia a facilidade de uso do app?',
      options: ['Muito fácil', 'Fácil', 'Neutro', 'Difícil', 'Muito difícil']
    },
    {
      id: 'visual_appeal',
      question: 'Como você avalia a aparência visual do app?',
      options: ['Excelente', 'Muito boa', 'Boa', 'Regular', 'Ruim']
    },
    {
      id: 'checkout_process',
      question: 'O processo de checkout foi intuitivo?',
      options: ['Sim, muito intuitivo', 'Sim, intuitivo', 'Neutro', 'Não muito intuitivo', 'Nada intuitivo']
    },
    {
      id: 'animations',
      question: 'As animações ajudaram na experiência?',
      options: ['Sim, muito úteis', 'Sim, úteis', 'Neutro', 'Não muito úteis', 'Inúteis']
    },
    {
      id: 'recommendation',
      question: 'Você recomendaria este app para um amigo?',
      options: ['Sim, com certeza', 'Provavelmente sim', 'Neutro', 'Provavelmente não', 'Não']
    }
  ]

  const handleAnswer = (answer: string) => {
    const newResponses = [...responses, answer]
    setResponses(newResponses)

    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1)
    } else {
      // Finalizar teste
      const feedback = questions.map((q, i) => `${q.question}: ${newResponses[i]}`).join(' | ')
      onComplete(feedback)
    }
  }

  const progress = ((currentQuestion + 1) / questions.length) * 100

  return (
    <GlassCard className="p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-gray-600">Pergunta {currentQuestion + 1} de {questions.length}</span>
          <span className="text-sm text-gray-600">{Math.round(progress)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-coxinha-primary h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <h2 className="text-xl font-bold text-coxinha-dark mb-6">
        {questions[currentQuestion].question}
      </h2>

      <div className="space-y-3">
        {questions[currentQuestion].options.map((option, index) => (
          <ShimmerButton
            key={index}
            onClick={() => handleAnswer(option)}
            className="w-full text-left justify-start"
            variant={index % 2 === 0 ? 'primary' : 'secondary'}
          >
            {option}
          </ShimmerButton>
        ))}
      </div>

      <div className="mt-6 text-center">
        <p className="text-sm text-gray-600">
          Sua opinião é muito importante para melhorar nosso app!
        </p>
      </div>
    </GlassCard>
  )
}

export function UXTestTrigger() {
  const [showTest, setShowTest] = useState(false)
  const [completed, setCompleted] = useState(false)

  const handleComplete = (feedback: string) => {
    console.log('Feedback do usuário:', feedback)
    setCompleted(true)
    setTimeout(() => {
      setShowTest(false)
      setCompleted(false)
    }, 3000)
  }

  if (completed) {
    return (
      <GlassCard className="p-6 max-w-md mx-auto text-center">
        <div className="text-4xl mb-4">🎉</div>
        <h3 className="text-xl font-bold text-coxinha-dark mb-2">Obrigado pelo feedback!</h3>
        <p className="text-gray-600">
          Suas respostas nos ajudarão a melhorar ainda mais o Vai Coxinha!
        </p>
      </GlassCard>
    )
  }

  if (showTest) {
    return <UXTest onComplete={handleComplete} />
  }

  return (
    <GlassCard className="p-6 max-w-md mx-auto text-center">
      <div className="text-4xl mb-4">🤔</div>
      <h3 className="text-xl font-bold text-coxinha-dark mb-4">Ajude-nos a melhorar!</h3>
      <p className="text-gray-600 mb-6">
        Você gostaria de participar de uma pesquisa rápida sobre sua experiência?
      </p>
      <div className="space-y-3">
        <ShimmerButton onClick={() => setShowTest(true)}>
          Sim, quero ajudar! 💪
        </ShimmerButton>
        <ShimmerButton variant="secondary" onClick={() => {}}>
          Talvez mais tarde
        </ShimmerButton>
      </div>
    </GlassCard>
  )
}