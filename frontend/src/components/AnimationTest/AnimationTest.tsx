'use client';

import { useState } from 'react';

export function AnimationTest() {
  const [isVisible, setIsVisible] = useState(true);

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8">Teste de Animações</h1>
        
        {/* Teste de Fade In/Out */}
        <div className="mb-8 p-6 bg-white rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Fade In/Out</h2>
          <button
            onClick={() => setIsVisible(!isVisible)}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 mb-4"
          >
            Toggle Visibility
          </button>
          
          {isVisible && (
            <div className="p-4 bg-green-100 rounded">
              <p>Este elemento aparece e desaparece!</p>
            </div>
          )}
        </div>

        {/* Teste de Slide */}
        <div className="mb-8 p-6 bg-white rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Slide Animation</h2>
          <div className="p-4 bg-yellow-100 rounded">
            <p>Este elemento está visível!</p>
          </div>
        </div>

        {/* Teste de Hover */}
        <div className="mb-8 p-6 bg-white rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Hover Animation</h2>
          <div className="p-4 bg-purple-100 rounded cursor-pointer">
            <p>Passe o mouse ou clique neste elemento!</p>
          </div>
        </div>

        {/* Teste de Stagger */}
        <div className="mb-8 p-6 bg-white rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Stagger Animation</h2>
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((item) => (
              <div
                key={item}
                className="p-2 bg-red-100 rounded"
              >
                <p>Item {item} - Elemento visível</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}