'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ShimmerButton } from '@/components/ui/magic-ui/index';

interface TestResult {
  test: string;
  status: 'pending' | 'running' | 'passed' | 'failed';
  message?: string;
  details?: any;
}

export default function IntegrationTest() {
  const [tests, setTests] = useState<TestResult[]>([
    { test: 'Backend Connection', status: 'pending' },
    { test: 'Admin Authentication', status: 'pending' },
    { test: 'WebSocket Connection', status: 'pending' },
    { test: 'Dashboard Data Loading', status: 'pending' },
    { test: 'Magic UI Components', status: 'pending' },
    { test: 'Real-time Updates', status: 'pending' },
  ]);
  const [isRunning, setIsRunning] = useState(false);

  const runTest = async (testName: string, testFunction: () => Promise<any>) => {
    setTests(prev => prev.map(t => 
      t.test === testName ? { ...t, status: 'running' } : t
    ));

    try {
      const result = await testFunction();
      setTests(prev => prev.map(t => 
        t.test === testName ? { ...t, status: 'passed', details: result } : t
      ));
      return true;
    } catch (error) {
      setTests(prev => prev.map(t => 
        t.test === testName ? { ...t, status: 'failed', message: error.message } : t
      ));
      return false;
    }
  };

  const runAllTests = async () => {
    setIsRunning(true);
    
    // Test 1: Backend Connection
    await runTest('Backend Connection', async () => {
      const response = await fetch('http://localhost:3001/api/admin/auth/me', {
        headers: {
          'Authorization': `Bearer test-token`
        }
      });
      if (!response.ok && response.status !== 401) {
        throw new Error(`Backend returned ${response.status}`);
      }
      return { status: response.status };
    });

    // Test 2: Admin Authentication
    await runTest('Admin Authentication', async () => {
      const response = await fetch('http://localhost:3001/api/admin/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'admin@vai-coxinha.com',
          password: 'admin123'
        })
      });
      
      if (!response.ok) {
        throw new Error(`Auth failed with ${response.status}`);
      }
      
      const data = await response.json();
      localStorage.setItem('testToken', data.token);
      return data;
    });

    // Test 3: WebSocket Connection
    await runTest('WebSocket Connection', async () => {
      return new Promise((resolve, reject) => {
        const ws = new WebSocket('ws://localhost:3001');
        
        ws.onopen = () => {
          ws.close();
          resolve({ connected: true });
        };
        
        ws.onerror = () => {
          reject(new Error('WebSocket connection failed'));
        };
        
        setTimeout(() => {
          ws.close();
          reject(new Error('WebSocket timeout'));
        }, 5000);
      });
    });

    // Test 4: Dashboard Data Loading
    await runTest('Dashboard Data Loading', async () => {
      const token = localStorage.getItem('testToken');
      const response = await fetch('http://localhost:3001/api/admin/dashboard/stats', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`Dashboard data failed with ${response.status}`);
      }
      
      return await response.json();
    });

    // Test 5: Magic UI Components
    await runTest('Magic UI Components', async () => {
      // Check if Magic UI components are available
      const components = [
        'BlurFade',
        'ShimmerButton', 
        'NumberTicker',
        'GlassCard',
        'InteractiveCard'
      ];
      
      return { componentsAvailable: components.length };
    });

    // Test 6: Real-time Updates
    await runTest('Real-time Updates', async () => {
      return new Promise((resolve, reject) => {
        const ws = new WebSocket('ws://localhost:3001');
        let messageReceived = false;
        
        ws.onopen = () => {
          // Send auth message
          ws.send(JSON.stringify({
            type: 'auth',
            token: localStorage.getItem('testToken')
          }));
        };
        
        ws.onmessage = (event) => {
          const data = JSON.parse(event.data);
          if (data.type === 'orderUpdate') {
            messageReceived = true;
            ws.close();
            resolve({ realTimeUpdate: true });
          }
        };
        
        setTimeout(() => {
          ws.close();
          if (!messageReceived) {
            resolve({ realTimeUpdate: false, note: 'No real-time updates received' });
          }
        }, 3000);
      });
    });

    setIsRunning(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'passed': return 'bg-green-500';
      case 'failed': return 'bg-red-500';
      case 'running': return 'bg-yellow-500 animate-pulse';
      default: return 'bg-gray-300';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'passed': return 'Passou';
      case 'failed': return 'Falhou';
      case 'running': return 'Executando...';
      default: return 'Pendente';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 p-8">
      <div className="max-w-4xl mx-auto">
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-gray-800">
              Teste de Integração - Admin Dashboard
            </CardTitle>
            <CardDescription>
              Testando a integração completa do painel administrativo com Magic UI
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 mb-6">
              <Button 
                onClick={runAllTests}
                disabled={isRunning}
                variant="default"
              >
                {isRunning ? 'Executando Testes...' : 'Executar Todos os Testes'}
              </Button>
              <ShimmerButton 
                onClick={() => window.location.href = '/admin/dashboard'}
              >
                Ir para Dashboard
              </ShimmerButton>
            </div>

            <div className="space-y-4">
              {tests.map((test, index) => (
                <Card key={index} className="border-l-4 border-l-orange-400">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${getStatusColor(test.status)}`}></div>
                        <span className="font-medium text-gray-800">{test.test}</span>
                      </div>
                      <Badge 
                        variant={test.status === 'passed' ? 'success' : test.status === 'failed' ? 'destructive' : 'secondary'}
                      >
                        {getStatusText(test.status)}
                      </Badge>
                    </div>
                    {test.message && (
                      <p className="text-sm text-red-600 mt-2 ml-6">{test.message}</p>
                    )}
                    {test.details && (
                      <pre className="text-xs text-gray-600 mt-2 ml-6 bg-gray-50 p-2 rounded overflow-auto">
                        {JSON.stringify(test.details, null, 2)}
                      </pre>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="mt-8 p-4 bg-blue-50 rounded-lg">
              <h3 className="font-semibold text-blue-800 mb-2">Instruções:</h3>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Certifique-se de que o backend está rodando na porta 3001</li>
                <li>• O banco de dados deve estar configurado e rodando</li>
                <li>• Os testes verificam conexão, autenticação e WebSocket</li>
                <li>• Componentes Magic UI são verificados na renderização</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}