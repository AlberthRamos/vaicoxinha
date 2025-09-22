'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { User, MapPin, Phone, Mail, Calendar, Edit2, Save, X } from 'lucide-react';

interface UserData {
  nome: string;
  email: string;
  telefone: string;
  endereco: {
    rua: string;
    numero: string;
    bairro: string;
    cidade: string;
    estado: string;
    cep: string;
    complemento?: string;
  };
}

interface Pedido {
  id: string;
  data: string;
  status: string;
  total: number;
  itens: Array<{
    nome: string;
    quantidade: number;
    preco: number;
  }>;
}

export default function PerfilPage() {
  const [userData, setUserData] = useState<UserData>({
    nome: 'João Silva',
    email: 'joao.silva@email.com',
    telefone: '(11) 98765-4321',
    endereco: {
      rua: 'Rua das Flores',
      numero: '123',
      bairro: 'Centro',
      cidade: 'São Paulo',
      estado: 'SP',
      cep: '01000-000',
      complemento: 'Apto 45'
    }
  });

  const [pedidos, setPedidos] = useState<Pedido[]>([
    {
      id: '12345',
      data: '2024-01-15',
      status: 'Entregue',
      total: 45.90,
      itens: [
        { nome: 'Coxinha de Frango', quantidade: 3, preco: 8.50 },
        { nome: 'Pastel de Queijo', quantidade: 2, preco: 6.90 },
        { nome: 'Refrigerante', quantidade: 1, preco: 5.50 }
      ]
    },
    {
      id: '12346',
      data: '2024-01-10',
      status: 'Entregue',
      total: 32.40,
      itens: [
        { nome: 'Bolinha de Queijo', quantidade: 4, preco: 4.90 },
        { nome: 'Suco Natural', quantidade: 2, preco: 4.50 }
      ]
    }
  ]);

  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState<UserData>(userData);
  const [activeTab, setActiveTab] = useState<'dados' | 'pedidos'>('dados');

  const handleSave = () => {
    setUserData(editedData);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedData(userData);
    setIsEditing(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Entregue': return 'text-green-600 bg-green-100';
      case 'Em preparo': return 'text-yellow-600 bg-yellow-100';
      case 'Saiu para entrega': return 'text-blue-600 bg-blue-100';
      case 'Cancelado': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Meu Perfil</h1>
          <p className="text-gray-600">Gerencie seus dados e acompanhe seus pedidos</p>
        </div>

        {/* Profile Card */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden mb-6">
          {/* Profile Header */}
          <div className="bg-gradient-to-r from-orange-500 to-red-500 px-6 py-8">
            <div className="flex items-center space-x-4">
              <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center">
                <User className="w-10 h-10 text-orange-500" />
              </div>
              <div className="text-white">
                <h2 className="text-2xl font-bold">{userData.nome}</h2>
                <p className="text-orange-100">{userData.email}</p>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab('dados')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'dados'
                    ? 'border-orange-500 text-orange-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Dados Pessoais
              </button>
              <button
                onClick={() => setActiveTab('pedidos')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'pedidos'
                    ? 'border-orange-500 text-orange-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Histórico de Pedidos
              </button>
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'dados' && (
              <div className="space-y-6">
                {/* Personal Data */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <User className="w-4 h-4 inline mr-2" />
                      Nome
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editedData.nome}
                        onChange={(e) => setEditedData({...editedData, nome: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                      />
                    ) : (
                      <p className="text-gray-900">{userData.nome}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Mail className="w-4 h-4 inline mr-2" />
                      Email
                    </label>
                    <p className="text-gray-900">{userData.email}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Phone className="w-4 h-4 inline mr-2" />
                      Telefone
                    </label>
                    {isEditing ? (
                      <input
                        type="tel"
                        value={editedData.telefone}
                        onChange={(e) => setEditedData({...editedData, telefone: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                      />
                    ) : (
                      <p className="text-gray-900">{userData.telefone}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <MapPin className="w-4 h-4 inline mr-2" />
                      Endereço
                    </label>
                    <p className="text-gray-900">
                      {userData.endereco.rua}, {userData.endereco.numero} - {userData.endereco.bairro}
                    </p>
                    <p className="text-gray-600 text-sm">
                      {userData.endereco.cidade} - {userData.endereco.estado}, {userData.endereco.cep}
                    </p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end space-x-3 pt-4">
                  {isEditing ? (
                    <>
                      <button
                        onClick={handleCancel}
                        className="px-4 py-2 text-gray-600 hover:text-gray-800 flex items-center space-x-2"
                      >
                        <X className="w-4 h-4" />
                        <span>Cancelar</span>
                      </button>
                      <button
                        onClick={handleSave}
                        className="px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 flex items-center space-x-2"
                      >
                        <Save className="w-4 h-4" />
                        <span>Salvar</span>
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 flex items-center space-x-2"
                    >
                      <Edit2 className="w-4 h-4" />
                      <span>Editar Dados</span>
                    </button>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'pedidos' && (
              <div className="space-y-4">
                {pedidos.map((pedido) => (
                  <div
                    key={pedido.id}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-medium text-gray-900">Pedido #{pedido.id}</h4>
                        <p className="text-sm text-gray-500 flex items-center">
                          <Calendar className="w-3 h-3 mr-1" />
                          {new Date(pedido.data).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(pedido.status)}`}>
                        {pedido.status}
                      </span>
                    </div>

                    <div className="space-y-2 mb-3">
                      {pedido.itens.map((item, index) => (
                        <div key={index} className="flex justify-between text-sm">
                          <span className="text-gray-600">
                            {item.quantidade}x {item.nome}
                          </span>
                          <span className="text-gray-900">
                            R$ {(item.quantidade * item.preco).toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="border-t pt-2 flex justify-between items-center">
                      <span className="font-medium text-gray-900">Total</span>
                      <span className="font-bold text-orange-600">R$ {pedido.total.toFixed(2)}</span>
                    </div>
                  </div>
                ))}

                {pedidos.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-gray-500">Nenhum pedido encontrado</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}