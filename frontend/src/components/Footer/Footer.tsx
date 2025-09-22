'use client';

import Link from 'next/link';
import { Phone, Mail, MapPin, Clock, Instagram, Facebook, MessageCircle } from 'lucide-react';

export function Footer() {
  const currentYear = new Date().getFullYear();

  const contactInfo = [
    { icon: Phone, label: 'Telefone', value: '(11) 99999-9999', href: 'tel:+5511999999999' },
    { icon: MessageCircle, label: 'WhatsApp', value: '(11) 99999-9999', href: 'https://wa.me/5511999999999' },
    { icon: Mail, label: 'Email', value: 'contato@vaiacoxinha.com.br', href: 'mailto:contato@vaiacoxinha.com.br' },
    { icon: MapPin, label: 'Endereço', value: 'Rua das Coxinhas, 123 - São Paulo/SP', href: '#map' },
    { icon: Clock, label: 'Horário', value: 'Seg-Sex: 10h às 22h | Sáb-Dom: 10h às 23h', href: '#hours' },
  ];

  const quickLinks = [
    { name: 'Cardápio', href: '/cardapio' },
    { name: 'Entregas', href: '/entregas' },
    { name: 'Política de Privacidade', href: '/privacidade' },
    { name: 'Termos de Uso', href: '/termos' },
  ];

  const socialLinks = [
    { name: 'Instagram', icon: Instagram, href: 'https://instagram.com/vaiacoxinha', color: 'hover:text-pink-500' },
    { name: 'Facebook', icon: Facebook, href: 'https://facebook.com/vaiacoxinha', color: 'hover:text-blue-600' },
    { name: 'WhatsApp', icon: MessageCircle, href: 'https://wa.me/5511999999999', color: 'hover:text-green-500' },
  ];

  return (
    <footer className="bg-gray-900 text-white" role="contentinfo">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Conteúdo Principal */}
        <div className="py-12 lg:py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
            
            {/* Sobre */}
            <div className="lg:col-span-2">
              <div className="mb-6">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-red-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-xl">VC</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">Vai Coxinha</h3>
                    <p className="text-gray-400 text-sm">Os melhores salgados da cidade</p>
                  </div>
                </div>
                <p className="text-gray-300 leading-relaxed mb-6 max-w-md">
                  Há mais de 10 anos servindo as melhores coxinhas artesanais da cidade. 
                  Ingredientes selecionados, receitas tradicionais e muito amor em cada mordida.
                </p>
              </div>

              {/* Redes Sociais */}
              <div>
                <h4 className="text-lg font-semibold mb-4">
                  Siga-nos
                </h4>
                <div className="flex space-x-4">
                  {socialLinks.map((social) => (
                    <a
                      key={social.name}
                      href={social.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`p-3 bg-gray-800 rounded-full ${social.color} focus:outline-none focus:ring-2 focus:ring-orange-500`}
                      aria-label={`Siga-nos no ${social.name}`}
                      title={`Siga-nos no ${social.name}`}
                    >
                      <social.icon className="w-5 h-5" />
                    </a>
                  ))}
                </div>
              </div>
            </div>

            {/* Links Rápidos */}
            <div>
              <h4 className="text-lg font-semibold mb-4">
                Links Rápidos
              </h4>
              <ul className="space-y-2">
                {quickLinks.map((link) => (
                  <li key={link.name}>
                    <Link
                      href={link.href}
                      className="text-gray-300 hover:text-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-500 rounded px-1 py-0.5"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

          </div>
        </div>

        {/* Formas de Pagamento - Seção Simplificada */}
        <div className="border-t border-gray-800 py-6">
          <div className="text-center">
            <div className="flex flex-wrap justify-center items-center gap-2 text-gray-400 text-sm">
              <span>PIX</span>
              <span>•</span>
              <span>Cartão</span>
              <span>•</span>
              <span>Dinheiro</span>
            </div>
          </div>
        </div>
      </div>

      {/* Rodapé Inferior */}
      <div className="bg-gray-800 py-6">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="text-center md:text-left">
              <p className="text-gray-400 text-sm">
                © {currentYear} Vai Coxinha. Todos os direitos reservados.
              </p>
              <p className="text-gray-500 text-xs mt-1">
                Desenvolvido com ❤️ para nossos clientes
              </p>
            </div>
            
            <div className="flex items-center space-x-6 text-sm text-gray-400">
              <Link 
                href="/privacidade" 
                className="hover:text-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-500 rounded px-1 py-0.5"
              >
                Política de Privacidade
              </Link>
              <Link 
                href="/termos" 
                className="hover:text-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-500 rounded px-1 py-0.5"
              >
                Termos de Uso
              </Link>
              <Link 
                href="/cookies" 
                className="hover:text-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-500 rounded px-1 py-0.5"
              >
                Cookies
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Botão Voltar ao Topo */}
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        className="fixed bottom-6 right-6 bg-orange-500 hover:bg-orange-600 text-white p-3 rounded-full shadow-lg focus:outline-none focus:ring-2 focus:ring-orange-500 z-50"
        aria-label="Voltar ao topo"
        title="Voltar ao topo"
      >
        ↑
      </button>
    </footer>
  );
}