'use client';

import Link from 'next/link';
import { WifiOff, RefreshCw, Home } from 'lucide-react';

export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Ícone de offline */}
          <div className="mx-auto w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-6">
            <WifiOff className="w-10 h-10 text-red-600" />
          </div>

          {/* Título */}
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Você está offline
          </h1>

          {/* Mensagem */}
          <p className="text-gray-600 mb-8 leading-relaxed">
            Parece que você está sem conexão com a internet. 
            Verifique sua conexão e tente novamente.
          </p>

          {/* Ações */}
          <div className="space-y-3">
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-red-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-red-700 transition-colors flex items-center justify-center space-x-2"
            >
              <RefreshCw className="w-5 h-5" />
              <span>Tentar Novamente</span>
            </button>

            <Link
              href="/"
              className="w-full bg-gray-100 text-gray-700 py-3 px-6 rounded-lg font-medium hover:bg-gray-200 transition-colors flex items-center justify-center space-x-2"
            >
              <Home className="w-5 h-5" />
              <span>Voltar para Home</span>
            </Link>
          </div>

          {/* Dica */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Dica:</strong> Algumas funcionalidades ainda podem estar disponíveis offline. 
              Tente acessar páginas que você visitou recentemente.
            </p>
          </div>
        </div>

        {/* Logo */}
        <div className="mt-8">
          <p className="text-sm text-gray-500 mb-2">Vai Coxinha</p>
          <div className="flex justify-center">
            <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-sm">VC</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}