'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Trash2, Plus, Minus, ShoppingCart, CreditCard, DollarSign, ArrowLeft, Check, MapPin, Truck, Calculator, Phone, Navigation } from 'lucide-react'
import { useCart } from '@/contexts/CartContext'
import { LocationCapture } from '@/components/LocationCapture'
import DeliveryCalculator from '@/components/DeliveryCalculator/DeliveryCalculator'
import OrderNumber from '@/components/OrderNumber/OrderNumber'
import { AddressFormData } from '@/components/AddressForm/AddressForm'
import PaymentModal from '@/components/PaymentModal/PaymentModal'

export default function CarrinhoPage() {
  const { state, removeFromCart, updateQuantity, clearCart } = useCart()
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'pix'>('card')
  const [orderCompleted, setOrderCompleted] = useState(false)
  const [deliveryFee, setDeliveryFee] = useState(0)
  const [showDeliveryCalculator, setShowDeliveryCalculator] = useState(false)
  const [orderNumber, setOrderNumber] = useState<string>('')
  const [customerAddress, setCustomerAddress] = useState<AddressFormData | null>(null)
  const [showOrderConfirmation, setShowOrderConfirmation] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [orderData, setOrderData] = useState<any>(null)
  
  // Estados para verificação de cadastro e taxa grátis
  const [isFirstOrder, setIsFirstOrder] = useState<boolean | null>(null)
  const [isCheckingCustomer, setIsCheckingCustomer] = useState(false)
  const [showFreeDeliveryMessage, setShowFreeDeliveryMessage] = useState(false)
  
  // Estados para mensagens de erro
  const [cpfError, setCpfError] = useState<string>('')
  const [phoneError, setPhoneError] = useState<string>('')
  const [nameError, setNameError] = useState<string>('')
  
  // Estados para dados do endereço separados
  const [street, setStreet] = useState<string>('')
  const [houseNumber, setHouseNumber] = useState<string>('')
  const [neighborhood, setNeighborhood] = useState<string>('')
  const [city, setCity] = useState<string>('')
  const [addressState, setAddressState] = useState<string>('')
  const [zipCode, setZipCode] = useState<string>('')
  const [propertyType, setPropertyType] = useState<'casa' | 'apartamento' | ''>('')
  const [apartmentNumber, setApartmentNumber] = useState<string>('')
  const [block, setBlock] = useState<string>('')

  const cart = state.items
  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  const total = subtotal + deliveryFee

  const [deliveryAddress, setDeliveryAddress] = useState('')
  const [addressComplement, setAddressComplement] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [customerName, setCustomerName] = useState('')
  const [customerLastName, setCustomerLastName] = useState('')
  const [customerCPF, setCustomerCPF] = useState('')
  const [isCalculatingShipping, setIsCalculatingShipping] = useState(false)

  // Função para validar CPF
  const validateCPF = (cpf: string): boolean => {
    // Remover caracteres não numéricos
    const cleanCPF = cpf.replace(/[^\d]/g, '')
    
    // Verificar se tem 11 dígitos
    if (cleanCPF.length !== 11) return false
    
    // Verificar se todos os dígitos são iguais (CPF inválido)
    if (/^(\d)\1+$/.test(cleanCPF)) return false
    
    // Validar dígitos verificadores
    let sum = 0
    let remainder
    
    // Primeiro dígito verificador
    for (let i = 1; i <= 9; i++) {
      sum += parseInt(cleanCPF.substring(i - 1, i)) * (11 - i)
    }
    remainder = (sum * 10) % 11
    
    if (remainder === 10 || remainder === 11) remainder = 0
    if (remainder !== parseInt(cleanCPF.substring(9, 10))) return false
    
    // Segundo dígito verificador
    sum = 0
    for (let i = 1; i <= 10; i++) {
      sum += parseInt(cleanCPF.substring(i - 1, i)) * (12 - i)
    }
    remainder = (sum * 10) % 11
    
    if (remainder === 10 || remainder === 11) remainder = 0
    if (remainder !== parseInt(cleanCPF.substring(10, 11))) return false
    
    return true
  }

  // Função para formatar CPF
  const formatCPF = (value: string): string => {
    const cleanCPF = value.replace(/[^\d]/g, '')
    
    if (cleanCPF.length <= 3) return cleanCPF
    if (cleanCPF.length <= 6) return `${cleanCPF.slice(0, 3)}.${cleanCPF.slice(3)}`
    if (cleanCPF.length <= 9) return `${cleanCPF.slice(0, 3)}.${cleanCPF.slice(3, 6)}.${cleanCPF.slice(6)}`
    return `${cleanCPF.slice(0, 3)}.${cleanCPF.slice(3, 6)}.${cleanCPF.slice(6, 9)}-${cleanCPF.slice(9, 11)}`
  }

  // Função para validar telefone
  const validatePhone = (phone: string): boolean => {
    const cleanPhone = phone.replace(/[^\d]/g, '')
    
    // Verificar se tem entre 10 e 11 dígitos
    if (cleanPhone.length < 10 || cleanPhone.length > 11) return false
    
    // Verificar se é um número válido (não pode ser todos iguais)
    if (/^(\d)\1+$/.test(cleanPhone)) return false
    
    // Verificar DDD válido (não pode começar com 0 ou 1)
    const ddd = cleanPhone.substring(0, 2)
    if (ddd.startsWith('0') || ddd.startsWith('1')) return false
    
    return true
  }

  // Função para formatar telefone
  const formatPhone = (value: string): string => {
    const cleanPhone = value.replace(/[^\d]/g, '')
    
    if (cleanPhone.length <= 2) return cleanPhone
    if (cleanPhone.length <= 6) return `(${cleanPhone.slice(0, 2)}) ${cleanPhone.slice(2)}`
    if (cleanPhone.length <= 10) return `(${cleanPhone.slice(0, 2)}) ${cleanPhone.slice(2, 6)}-${cleanPhone.slice(6)}`
    return `(${cleanPhone.slice(0, 2)}) ${cleanPhone.slice(2, 7)}-${cleanPhone.slice(7, 11)}`
  }

  // Função para extrair dados do endereço automaticamente
  const extractAddressData = (address: string) => {
    // Limpa o endereço removendo múltiplos espaços e espaços extras
    const cleanAddress = address.trim().replace(/\s+/g, ' ')
    
    // Padrões de separação comuns em endereços brasileiros
    const patterns = [
      // Rua Nome da Rua, Número - Bairro, Cidade - UF
      /^(Rua|R\.|Avenida|Av\.|Travessa|Tv\.|Alameda|Al\.|Rodovia|BR)\s+(.+?)\s*,?\s*(\d*)\s*[-,]?\s*([^,]+)?\s*,?\s*([^,-]+)?\s*[-,]?\s*([A-Z]{2})?$/i,
      // Nome da Rua, Número - Bairro, Cidade - UF
      /^(.+?)\s*,?\s*(\d*)\s*[-,]?\s*([^,]+)?\s*,?\s*([^,-]+)?\s*[-,]?\s*([A-Z]{2})?$/i
    ]
    
    let extractedStreet = ''
    let extractedNumber = ''
    let extractedNeighborhood = ''
    let extractedCity = ''
    let extractedState = ''
    
    // Tenta cada padrão
    for (const pattern of patterns) {
      const match = cleanAddress.match(pattern)
      if (match) {
        // Para o primeiro padrão (com tipo de logradouro)
        if (match[1] && match[2]) {
          extractedStreet = `${match[1]} ${match[2]}`.trim()
          extractedNumber = match[3] || ''
          extractedNeighborhood = match[4] || ''
          extractedCity = match[5] || ''
          extractedState = match[6] || ''
        } else {
          // Para o segundo padrão (sem tipo de logradouro)
          extractedStreet = match[1].trim()
          extractedNumber = match[2] || ''
          extractedNeighborhood = match[3] || ''
          extractedCity = match[4] || ''
          extractedState = match[5] || ''
        }
        break
      }
    }
    
    // Se não encontrou com padrões, tenta extração manual
    if (!extractedStreet) {
      const parts = cleanAddress.split(/[,-]/).map(part => part.trim())
      
      if (parts.length >= 1) {
        // Primeira parte geralmente é rua/número
        const streetPart = parts[0]
        const numberMatch = streetPart.match(/(\d+)$/)
        if (numberMatch) {
          extractedNumber = numberMatch[1]
          extractedStreet = streetPart.replace(/\s*\d+$/, '').trim()
        } else {
          extractedStreet = streetPart
        }
      }
      
      if (parts.length >= 2) {
        extractedNeighborhood = parts[1]
      }
      
      if (parts.length >= 3) {
        extractedCity = parts[2]
      }
      
      if (parts.length >= 4) {
        const stateMatch = parts[parts.length - 1].match(/([A-Z]{2})$/)
        if (stateMatch) {
          extractedState = stateMatch[1]
        }
      }
    }
    
    // Atualizar os estados apenas se houver dados válidos
    if (extractedStreet) setStreet(extractedStreet)
    if (extractedNumber) setHouseNumber(extractedNumber)
    if (extractedNeighborhood) setNeighborhood(extractedNeighborhood)
    if (extractedCity) setCity(extractedCity)
    if (extractedState) setAddressState(extractedState)
  }

  // Função para buscar estado pelo CEP
  const fetchStateByCEP = async (cep: string) => {
    const cleanCEP = cep.replace(/\D/g, '')
    if (cleanCEP.length !== 8) return
    
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cleanCEP}/json/`)
      const data = await response.json()
      
      if (!data.erro) {
        // Mapeamento de estados por sigla
        const stateMap: { [key: string]: string } = {
          'AC': 'Acre',
          'AL': 'Alagoas',
          'AP': 'Amapá',
          'AM': 'Amazonas',
          'BA': 'Bahia',
          'CE': 'Ceará',
          'DF': 'Distrito Federal',
          'ES': 'Espírito Santo',
          'GO': 'Goiás',
          'MA': 'Maranhão',
          'MT': 'Mato Grosso',
          'MS': 'Mato Grosso do Sul',
          'MG': 'Minas Gerais',
          'PA': 'Pará',
          'PB': 'Paraíba',
          'PR': 'Paraná',
          'PE': 'Pernambuco',
          'PI': 'Piauí',
          'RJ': 'Rio de Janeiro',
          'RN': 'Rio Grande do Norte',
          'RS': 'Rio Grande do Sul',
          'RO': 'Rondônia',
          'RR': 'Roraima',
          'SC': 'Santa Catarina',
          'SP': 'São Paulo',
          'SE': 'Sergipe',
          'TO': 'Tocantins'
        }
        
        if (data.uf && stateMap[data.uf]) {
          setAddressState(stateMap[data.uf])
        }
        
        if (data.localidade) {
          setCity(data.localidade)
        }
        
        if (data.bairro) {
          setNeighborhood(data.bairro)
        }
        
        if (data.logradouro) {
          setStreet(data.logradouro)
        }
      }
    } catch (error) {
      console.error('Erro ao buscar CEP:', error)
    }
  }

  // Função para buscar endereço a partir das coordenadas
  const fetchAddressFromCoordinates = async (latitude: number, longitude: number) => {
    console.log('Buscando endereço para coordenadas:', latitude, longitude)
    
    try {
      // Usar HTTPS sempre para evitar problemas de mixed content
      const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1&accept-language=pt-BR`
      console.log('URL da API:', url)
      
      const response = await fetch(url)
      console.log('Resposta da API:', response.status)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      console.log('Dados recebidos:', data)
      
      if (data.address) {
        console.log('Endereço encontrado:', data.address)
        // Preencher campos com dados da localização
        setStreet(data.address.road || '')
        setNeighborhood(data.address.neighbourhood || data.address.suburb || '')
        setCity(data.address.city || data.address.town || '')
        
        // Converter nome do estado para sigla
        const stateName = data.address.state || ''
        const stateMap: { [key: string]: string } = {
          'Acre': 'AC',
          'Alagoas': 'AL',
          'Amapá': 'AP',
          'Amazonas': 'AM',
          'Bahia': 'BA',
          'Ceará': 'CE',
          'Distrito Federal': 'DF',
          'Espírito Santo': 'ES',
          'Goiás': 'GO',
          'Maranhão': 'MA',
          'Mato Grosso': 'MT',
          'Mato Grosso do Sul': 'MS',
          'Minas Gerais': 'MG',
          'Pará': 'PA',
          'Paraíba': 'PB',
          'Paraná': 'PR',
          'Pernambuco': 'PE',
          'Piauí': 'PI',
          'Rio de Janeiro': 'RJ',
          'Rio Grande do Norte': 'RN',
          'Rio Grande do Sul': 'RS',
          'Rondônia': 'RO',
          'Roraima': 'RR',
          'Santa Catarina': 'SC',
          'São Paulo': 'SP',
          'Sergipe': 'SE',
          'Tocantins': 'TO'
        }
        
        const stateCode = stateMap[stateName] || ''
        setAddressState(stateCode)
        
        // Tentar extrair número da rua
        if (data.address.house_number) {
          setHouseNumber(data.address.house_number)
        }
        
        // Tentar obter CEP da API de localização
        let foundZipCode = ''
        if (data.address.postcode) {
          foundZipCode = data.address.postcode
        }
        
        // Se não conseguiu CEP da API de localização, tentar buscar pelo endereço
        if (!foundZipCode && data.address.road && data.address.city) {
          try {
            console.log('Tentando buscar CEP pelo endereço...')
            const searchUrl = `https://nominatim.openstreetmap.org/search?format=json&street=${encodeURIComponent(data.address.road)}&city=${encodeURIComponent(data.address.city)}&state=${encodeURIComponent(data.address.state || '')}&country=Brazil&limit=1`
            const searchResponse = await fetch(searchUrl)
            
            if (searchResponse.ok) {
              const searchData = await searchResponse.json()
              if (searchData && searchData.length > 0 && searchData[0].address && searchData[0].address.postcode) {
                foundZipCode = searchData[0].address.postcode
                console.log('CEP encontrado pela busca:', foundZipCode)
              }
            }
          } catch (searchError) {
            console.log('Erro ao buscar CEP alternativo:', searchError)
          }
        }
        
        // Se encontrou CEP, formatar e preencher
        if (foundZipCode) {
          const formattedCEP = formatZipCode(foundZipCode)
          setZipCode(formattedCEP)
          console.log('CEP preenchido:', formattedCEP)
        }
        
        console.log('Campos atualizados com sucesso!')
      } else {
        console.log('Nenhum endereço encontrado nos dados')
      }
    } catch (error) {
      console.error('Erro ao buscar endereço por coordenadas:', error)
    }
  }

  // Função para detectar localização atual
  const detectCurrentLocation = () => {
    console.log('Botão de localização clicado')
    
    // Verificar se está em ambiente seguro
    if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
      console.log('Geolocalização requer HTTPS ou localhost')
      return
    }
    
    if (!navigator.geolocation) {
      console.log('Geolocalização não suportada')
      return
    }

    console.log('Solicitando permissão de localização...')
    
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        console.log('Localização obtida com sucesso:', position.coords)
        const { latitude, longitude } = position.coords
        await fetchAddressFromCoordinates(latitude, longitude)
      },
      (error) => {
        console.error('Erro ao obter localização:', error)
        console.log('Código do erro:', error.code)
        console.log('Mensagem do erro:', error.message)
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000
      }
    )
  }

  // Função para verificar se é o primeiro pedido do cliente
  const checkIfFirstOrder = async (name: string, cpf: string) => {
    if (!name || !cpf) return
    
    setIsCheckingCustomer(true)
    try {
      // Limpar CPF para enviar apenas números
      const cleanCpf = cpf.replace(/\D/g, '')
      
      // Fazer requisição para verificar cadastro
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/customers/check`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: name.trim(),
          cpf: cleanCpf
        })
      })
      
      if (response.ok) {
        const data = await response.json()
        setIsFirstOrder(data.isFirstOrder)
        
        // Se for primeiro pedido, mostrar mensagem de taxa grátis
        if (data.isFirstOrder) {
          setShowFreeDeliveryMessage(true)
          // Recalcular taxa com desconto
          setTimeout(() => {
            if (customerAddress && deliveryFee > 0) {
              setDeliveryFee(0)
            }
          }, 1000)
        }
      } else {
        console.error('Erro ao verificar cadastro:', response.status)
        setIsFirstOrder(null)
      }
    } catch (error) {
      console.error('Erro na verificação:', error)
      setIsFirstOrder(null)
    } finally {
      setIsCheckingCustomer(false)
    }
  }

  // Função para formatar CEP
  const formatZipCode = (value: string): string => {
    const cleanZip = value.replace(/[^\d]/g, '')
    if (cleanZip.length <= 5) return cleanZip
    return `${cleanZip.slice(0, 5)}-${cleanZip.slice(5, 8)}`
  }

  // Função para montar o endereço completo sem atualizar estado
  const buildFullAddressFromFields = () => {
    const parts = []
    if (street) parts.push(street)
    if (houseNumber) parts.push(houseNumber)
    if (neighborhood) parts.push(neighborhood)
    if (city) parts.push(city)
    if (addressState) parts.push(addressState)
    
    // Adicionar informações específicas do tipo de imóvel
    if (propertyType === 'apartamento' && (block || apartmentNumber)) {
      const apartmentInfo = []
      if (block) apartmentInfo.push(`Bloco ${block}`)
      if (apartmentNumber) apartmentInfo.push(`Apto ${apartmentNumber}`)
      parts.push(apartmentInfo.join(' - '))
    }
    
    return parts.join(', ')
  }

  // Função para montar o endereço completo e atualizar estado
  const buildFullAddress = () => {
    const fullAddress = buildFullAddressFromFields()
    setDeliveryAddress(fullAddress)
    sessionStorage.setItem('deliveryAddress', fullAddress)
  }

  // Função para validar compatibilidade entre nome e CPF
  const validateNameCPFCompatibility = (name: string, lastName: string, cpf: string): boolean => {
    // Esta é uma validação básica - em produção, seria integrada com uma API de validação
    const cleanCPF = cpf.replace(/[^\d]/g, '')
    
    // Verificar se o nome não está vazio e tem pelo menos 2 caracteres
    if (!name || name.trim().length < 2) return false
    
    // Verificar se o sobrenome não está vazio
    if (!lastName || lastName.trim().length < 1) return false
    
    // Verificar se o nome não contém números ou caracteres especiais
    const nameRegex = /^[A-Za-zÀ-ÖØ-öø-ÿ\s]+$/
    if (!nameRegex.test(name) || !nameRegex.test(lastName)) return false
    
    // Verificar se não são nomes genéricos demais
    const genericNames = ['joao', 'maria', 'jose', 'ana', 'teste', 'fulano', 'beltrano', 'sicrano']
    const nameLower = name.toLowerCase().trim()
    const lastNameLower = lastName.toLowerCase().trim()
    
    if (genericNames.includes(nameLower) || genericNames.includes(lastNameLower)) {
      return false
    }
    
    return true
  }

  // Função para atualizar o frete quando calculado
  const handleDeliveryFeeChange = (fee: number) => {
    // Se for o primeiro pedido, aplicar desconto de 100%
    if (isFirstOrder === true) {
      setDeliveryFee(0)
      setShowFreeDeliveryMessage(true)
    } else {
      setDeliveryFee(fee)
    }
  }

  // Efeito para preencher endereço automaticamente quando detectado
  useEffect(() => {
    // Verificar se há um endereço armazenado na sessão
    const storedAddress = sessionStorage.getItem('detectedAddress')
    if (storedAddress) {
      setDeliveryAddress(storedAddress)
    }
  }, [])

  // Efeito para calcular frete automaticamente quando o endereço mudar
  useEffect(() => {
    if (deliveryAddress && deliveryAddress.trim().length > 10) {
      const timeoutId = setTimeout(() => {
        calculateShipping()
      }, 1000) // Delay de 1 segundo para evitar muitas requisições
      
      return () => clearTimeout(timeoutId)
    }
  }, [deliveryAddress])

  // Calcular frete automático baseado na localização com geocoding
  const calculateShipping = async () => {
    if (!street || !neighborhood || !city) {
      return
    }
    
    setIsCalculatingShipping(true)
    
    try {
      // Usar Nominatim para geocoding do endereço
      const addressQuery = `${street}, ${neighborhood}, ${city}, ${addressState}, Brazil`
      const geocodeResponse = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(addressQuery)}&limit=1`)
      const geocodeData = await geocodeResponse.json()
      
      let distanceFee = 0
      
      if (geocodeData && geocodeData.length > 0) {
        const { lat, lon } = geocodeData[0]
        
        // Coordenadas de referência (exemplo: centro de São Paulo)
        const referenceLat = -23.5505
        const referenceLon = -46.6333
        
        // Calcular distância aproximada (em km) usando fórmula de Haversine
        const distance = calculateDistance(parseFloat(lat), parseFloat(lon), referenceLat, referenceLon)
        
        // Definir taxa baseada na distância
        if (distance <= 2) {
          distanceFee = 3.00 // Centro
        } else if (distance <= 5) {
          distanceFee = 5.00 // Próximo ao centro
        } else if (distance <= 10) {
          distanceFee = 8.00 // Média distância
        } else if (distance <= 20) {
          distanceFee = 12.00 // Longe
        } else {
          distanceFee = 15.00 // Muito longe
        }
      } else {
        // Fallback: calcular baseado no CEP ou bairro
        distanceFee = calculateFeeByNeighborhood()
      }
      
      const baseFee = 5.00
      const totalFee = baseFee + distanceFee
      
      setTimeout(() => {
        // Aplicar desconto se for o primeiro pedido
        if (isFirstOrder === true) {
          setDeliveryFee(0)
          setShowFreeDeliveryMessage(true)
        } else {
          setDeliveryFee(totalFee)
        }
        setIsCalculatingShipping(false)
      }, 1000)
    } catch (error) {
      console.error('Erro ao calcular frete:', error)
      // Fallback para cálculo por bairro
      const fallbackFee = calculateFeeByNeighborhood()
      const totalFallbackFee = 5.00 + fallbackFee
      
      // Aplicar desconto se for o primeiro pedido
      if (isFirstOrder === true) {
        setDeliveryFee(0)
        setShowFreeDeliveryMessage(true)
      } else {
        setDeliveryFee(totalFallbackFee)
      }
      setIsCalculatingShipping(false)
    }
  }

  // Função para calcular distância entre dois pontos (fórmula de Haversine)
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371 // Raio da Terra em km
    const dLat = (lat2 - lat1) * Math.PI / 180
    const dLon = (lon2 - lon1) * Math.PI / 180
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
    return R * c
  }

  // Função fallback para calcular taxa por bairro
  const calculateFeeByNeighborhood = (): number => {
    const addressLower = `${street} ${neighborhood} ${city}`.toLowerCase()
    
    if (addressLower.includes('centro')) {
      return 3.00
    } else if (addressLower.includes('jardins') || addressLower.includes('paulista')) {
      return 4.00
    } else if (addressLower.includes('zona sul') || addressLower.includes('morumbi')) {
      return 6.00
    } else if (addressLower.includes('zona norte') || addressLower.includes('tucuruvi')) {
      return 7.00
    } else if (addressLower.includes('zona leste') || addressLower.includes('são mateus')) {
      return 8.00
    } else if (addressLower.includes('zona oeste') || addressLower.includes('barra funda')) {
      return 9.00
    } else {
      return 10.00 // Bairro não identificado
    }
  }

  // Recalcular frete quando campos do endereço mudarem (com delay)
  useEffect(() => {
    if (street && neighborhood && city) {
      const timer = setTimeout(() => {
        calculateShipping()
      }, 1000) // Aguardar 1 segundo após o usuário parar de digitar
      
      return () => clearTimeout(timer)
    }
  }, [street, neighborhood, city, addressState])

  // Validação em tempo real do CPF
  useEffect(() => {
    if (customerCPF && customerCPF.length > 0) {
      if (customerCPF.length === 14) { // CPF completamente formatado
        if (!validateCPF(customerCPF)) {
          setCpfError('CPF inválido')
        } else {
          setCpfError('')
          // Verificar se é primeiro pedido quando CPF for válido
          if (customerName && customerLastName) {
            checkIfFirstOrder(`${customerName} ${customerLastName}`, customerCPF)
          }
        }
      } else {
        setCpfError('')
      }
    }
  }, [customerCPF])

  // Validação em tempo real do telefone
  useEffect(() => {
    if (phoneNumber && phoneNumber.length > 0) {
      const cleanPhone = phoneNumber.replace(/[^\d]/g, '')
      if (cleanPhone.length >= 10) { // Telefone completamente digitado
        if (!validatePhone(phoneNumber)) {
          setPhoneError('Telefone inválido')
        } else {
          setPhoneError('')
        }
      } else {
        setPhoneError('')
      }
    }
  }, [phoneNumber])

  // Validação em tempo real do nome
  useEffect(() => {
    if (customerName && customerLastName && customerCPF) {
      if (customerName.length >= 2 && customerLastName.length >= 1) {
        if (!validateNameCPFCompatibility(customerName, customerLastName, customerCPF)) {
          setNameError('Nome/sobrenome inválidos ou genéricos')
        } else {
          setNameError('')
          // Verificar se é primeiro pedido quando todos os dados estiverem válidos
          if (customerCPF.length === 14 && validateCPF(customerCPF)) {
            checkIfFirstOrder(`${customerName} ${customerLastName}`, customerCPF)
          }
        }
      } else {
        setNameError('')
      }
    }
  }, [customerName, customerLastName, customerCPF])

  // Atualizar endereço completo quando campos individuais mudarem
  useEffect(() => {
    buildFullAddress()
  }, [street, houseNumber, neighborhood, city, addressState, propertyType, apartmentNumber, block])

  // Buscar estado pelo CEP quando CEP for digitado
  useEffect(() => {
    const cleanCEP = zipCode.replace(/\D/g, '')
    if (cleanCEP.length === 8) {
      fetchStateByCEP(zipCode)
    }
  }, [zipCode])

  // Extrair dados do endereço quando o endereço completo mudar (apenas se não for atualização interna)
  useEffect(() => {
    if (deliveryAddress && deliveryAddress.length > 10) {
      // Verificar se o endereço foi alterado externamente (não por buildFullAddress)
      const currentAddress = buildFullAddressFromFields()
      if (deliveryAddress !== currentAddress) {
        extractAddressData(deliveryAddress)
      }
    }
  }, [deliveryAddress])

  const handleFinalizeOrder = async () => {
    // Limpar mensagens de erro anteriores
    setCpfError('')
    setPhoneError('')
    setNameError('')

    // Validações de mercado - Campos obrigatórios
    if (!deliveryAddress || !phoneNumber || !customerName || !customerLastName || !customerCPF) {
      alert('Por favor, preencha todos os dados do cliente')
      return
    }

    // Validação de endereço completo
    if (!street || !houseNumber || !neighborhood || !city || !addressState || !zipCode) {
      alert('Por favor, preencha todos os campos do endereço')
      return
    }

    // Validação específica para apartamentos
    if (propertyType === 'apartamento') {
      if (!apartmentNumber) {
        alert('Por favor, informe o número do apartamento')
        return
      }
      if (!block) {
        alert('Por favor, informe o bloco/torre do apartamento')
        return
      }
    }

    // Validar CPF
    if (!validateCPF(customerCPF)) {
      setCpfError('CPF inválido! Por favor, digite um CPF válido.')
      alert('CPF inválido! Por favor, digite um CPF válido.')
      return
    }

    // Validar telefone
    if (!validatePhone(phoneNumber)) {
      setPhoneError('Telefone inválido! Por favor, informe um número de telefone válido com DDD.')
      alert('Telefone inválido! Por favor, informe um número de telefone válido com DDD.')
      return
    }

    // Validar compatibilidade entre nome e CPF
    if (!validateNameCPFCompatibility(customerName, customerLastName, customerCPF)) {
      setNameError('Nome e/ou sobrenome inválidos ou incompatíveis com o CPF.')
      alert('Nome e/ou sobrenome inválidos ou incompatíveis com o CPF. Por favor, verifique os dados informados.')
      return
    }

    // Validação de CEP
    const cleanCEP = zipCode.replace(/\D/g, '')
    if (cleanCEP.length !== 8) {
      alert('CEP inválido! Por favor, digite um CEP válido com 8 dígitos.')
      return
    }

    // Validação de valor mínimo do pedido
    if (total < 20.00) {
      alert('O pedido mínimo é de R$ 20,00')
      return
    }

    if (deliveryFee === 0) {
      alert('Por favor, calcule o frete antes de prosseguir!')
      setShowDeliveryCalculator(true)
      return
    }
    
    // Preparar dados do pedido para o pagamento
    const orderData = {
      items: cart,
      subtotal,
      deliveryFee,
      total,
      paymentMethod,
      customerInfo: {
        firstName: customerName,
        lastName: customerLastName,
        email: `${customerName.toLowerCase()}@temp.com`, // Email temporário se não tiver
        phone: phoneNumber,
        cpf: customerCPF,
        address: {
          street,
          number: houseNumber,
          complement: addressComplement,
          neighborhood,
          city,
          state: addressState,
          zipCode
        }
      },
      deliveryInfo: {
        address: deliveryAddress,
        propertyType,
        apartmentNumber,
        block
      }
    }
    
    setOrderData(orderData)
    setShowPaymentModal(true)
  }

  const handlePaymentComplete = (paymentResult: any) => {
    // Gerar número do pedido automaticamente
    const { generateOrderNumber } = require('@/components/OrderNumber/OrderNumber')
    const newOrderNumber = generateOrderNumber()
    setOrderNumber(newOrderNumber)
    setShowOrderConfirmation(true)
    
    // Limpar carrinho após finalizar pedido
    clearCart()
    
    // Armazenar dados do pedido na sessão - com novos campos
    sessionStorage.setItem('lastOrder', JSON.stringify({
      orderNumber: newOrderNumber,
      items: cart,
      total: total,
      deliveryAddress,
      phoneNumber,
      customerName,
      customerLastName,
      customerCPF,
      paymentMethod,
      propertyType,
      street,
      houseNumber,
      neighborhood,
      city,
      addressState,
      zipCode,
      apartmentNumber,
      block,
      paymentResult,
      timestamp: new Date().toISOString()
    }))
    
    setOrderCompleted(true)
  }

  if (orderCompleted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center bg-white p-8 rounded-lg shadow-md max-w-md">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-semibold text-gray-800 mb-2">Pedido Realizado!</h2>
          <div className="bg-gray-50 p-4 rounded-lg mb-4">
            <p className="text-lg font-semibold text-gray-800 mb-1">Número do Pedido</p>
            <p className="text-2xl font-bold text-red-600">{orderNumber}</p>
            <p className="text-sm text-gray-600 mt-2">Use este número para rastrear seu pedido</p>
          </div>
          <p className="text-gray-600 mb-6">
            Seu pedido foi recebido e está sendo processado. Entraremos em contato em breve para confirmar os detalhes da entrega.
          </p>
          <Link
            href="/"
            className="inline-flex items-center px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar ao cardápio
          </Link>
        </div>
      </div>
    )
  }

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <ShoppingCart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-gray-800 mb-2">Carrinho vazio</h2>
          <p className="text-gray-600 mb-6">Adicione produtos ao carrinho para continuar</p>
          <Link
            href="/"
            className="inline-flex items-center px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar ao cardápio
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Link
            href="/"
            className="inline-flex items-center text-red-600 hover:text-red-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar ao cardápio
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Produtos */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Seu Carrinho</h1>
                <button
                  onClick={clearCart}
                  className="text-red-600 hover:text-red-700 text-sm font-medium"
                >
                  Limpar carrinho
                </button>
              </div>

              <div className="space-y-4">
                {cart.map((item) => (
                  <div key={item.id} className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg hover:shadow-sm transition-shadow duration-200">
                    <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
                      {item.image ? (
                        <Image
                          src={item.image}
                          alt={item.name}
                          width={64}
                          height={64}
                          className="object-cover"
                        />
                      ) : (
                        <span className="text-2xl">🍗</span>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-black text-base">{item.name}</h3>
                      <p className="text-black font-medium text-sm">R$ {item.price.toFixed(2)}</p>
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                        className="w-10 h-10 rounded-full bg-orange-500 hover:bg-orange-600 flex items-center justify-center transition-colors duration-200 shadow-sm hover:shadow-md"
                        aria-label="Diminuir quantidade"
                      >
                        <Minus className="w-5 h-5 text-white" />
                      </button>
                      <span className="w-12 text-center font-semibold text-black text-lg">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="w-10 h-10 rounded-full bg-orange-500 hover:bg-orange-600 flex items-center justify-center transition-colors duration-200 shadow-sm hover:shadow-md"
                        aria-label="Aumentar quantidade"
                      >
                        <Plus className="w-5 h-5 text-white" />
                      </button>
                    </div>

                    <div className="text-right min-w-[80px]">
                      <p className="font-bold text-black text-lg">
                        R$ {(item.price * item.quantity).toFixed(2)}
                      </p>
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="text-red-600 hover:text-red-700 mt-2 p-1 rounded hover:bg-red-50 transition-colors"
                        aria-label="Remover item"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Dados do Cliente */}
            <div className="mt-6 bg-white rounded-lg p-6 shadow-sm border">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Dados do Cliente</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nome
                  </label>
                  <input
                    type="text"
                    placeholder="Seu nome"
                    className={`w-full p-3 border rounded-lg focus:ring-2 focus:border-transparent text-black ${
                      nameError ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-red-500'
                    }`}
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                  />
                  {nameError && (
                    <p className="mt-1 text-sm text-red-600">{nameError}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sobrenome
                  </label>
                  <input
                    type="text"
                    placeholder="Seu sobrenome"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-black"
                    value={customerLastName}
                    onChange={(e) => setCustomerLastName(e.target.value)}
                  />
                </div>
              </div>
              
              <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    CPF
                  </label>
                  <input
                  type="text"
                  placeholder="000.000.000-00"
                  className={`w-full p-3 border rounded-lg focus:ring-2 focus:border-transparent text-black ${
                    cpfError ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-red-500'
                  }`}
                  value={customerCPF}
                  onChange={(e) => setCustomerCPF(formatCPF(e.target.value))}
                  maxLength={14}
                />
                {cpfError && (
                  <p className="mt-1 text-sm text-red-600">{cpfError}</p>
                )}
                </div>
            </div>

            {/* Campos de Endereço e Telefone - agora integrados diretamente */}
            <div className="mt-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold text-gray-800">Endereço de Entrega</h3>
                <button
                  onClick={detectCurrentLocation}
                  className="flex items-center px-3 py-2 text-sm bg-yellow-50 text-yellow-700 border border-yellow-200 rounded-lg hover:bg-yellow-100 transition-colors"
                >
                  <Navigation className="w-4 h-4 mr-1" />
                  Usar minha localização
                </button>
              </div>
              
              {/* CEP e Estado na mesma linha */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    CEP <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={zipCode}
                    onChange={(e) => setZipCode(formatZipCode(e.target.value))}
                    placeholder="00000-000"
                    maxLength={9}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-black"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Estado <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={addressState}
                    onChange={(e) => setAddressState(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-black"
                  >
                    <option value="">Selecione o estado</option>
                    <option value="AC">Acre</option>
                    <option value="AL">Alagoas</option>
                    <option value="AP">Amapá</option>
                    <option value="AM">Amazonas</option>
                    <option value="BA">Bahia</option>
                    <option value="CE">Ceará</option>
                    <option value="DF">Distrito Federal</option>
                    <option value="ES">Espírito Santo</option>
                    <option value="GO">Goiás</option>
                    <option value="MA">Maranhão</option>
                    <option value="MT">Mato Grosso</option>
                    <option value="MS">Mato Grosso do Sul</option>
                    <option value="MG">Minas Gerais</option>
                    <option value="PA">Pará</option>
                    <option value="PB">Paraíba</option>
                    <option value="PR">Paraná</option>
                    <option value="PE">Pernambuco</option>
                    <option value="PI">Piauí</option>
                    <option value="RJ">Rio de Janeiro</option>
                    <option value="RN">Rio Grande do Norte</option>
                    <option value="RS">Rio Grande do Sul</option>
                    <option value="RO">Rondônia</option>
                    <option value="RR">Roraima</option>
                    <option value="SC">Santa Catarina</option>
                    <option value="SP">São Paulo</option>
                    <option value="SE">Sergipe</option>
                    <option value="TO">Tocantins</option>
                  </select>
                </div>
              </div>

              {/* Cidade e Bairro na mesma linha */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cidade <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Nome da cidade"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-black"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bairro <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={neighborhood}
                    onChange={(e) => setNeighborhood(e.target.value)}
                    placeholder="Nome do bairro"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-black"
                  />
                </div>
              </div>

              {/* Rua e Número na mesma linha */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rua <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={street}
                    onChange={(e) => setStreet(e.target.value)}
                    placeholder="Nome da rua"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-black"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Número <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={houseNumber}
                    onChange={(e) => setHouseNumber(e.target.value)}
                    placeholder="Número"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-black"
                  />
                </div>
              </div>

              {/* Tipo de imóvel - Interface mais moderna */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Tipo de Endereço
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setPropertyType('casa')}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      propertyType === 'casa'
                        ? 'border-red-500 bg-red-50 text-red-700'
                        : 'border-gray-200 hover:border-gray-300 text-gray-700'
                    }`}
                  >
                    <div className="text-center">
                      <div className="text-lg mb-1">🏠</div>
                      <div className="text-sm font-medium">Casa</div>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPropertyType('apartamento')}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      propertyType === 'apartamento'
                        ? 'border-red-500 bg-red-50 text-red-700'
                        : 'border-gray-200 hover:border-gray-300 text-gray-700'
                    }`}
                  >
                    <div className="text-center">
                      <div className="text-lg mb-1">🏢</div>
                      <div className="text-sm font-medium">Apartamento</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Campos específicos para apartamento - Layout otimizado */}
              {propertyType === 'apartamento' && (
                <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-100">
                  <h4 className="text-sm font-semibold text-blue-800 mb-3">Informações do Apartamento</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Número do Apartamento
                      </label>
                      <input
                        type="text"
                        value={apartmentNumber}
                        onChange={(e) => setApartmentNumber(e.target.value)}
                        placeholder="Ex: 101, 502"
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Bloco/Torre
                      </label>
                      <input
                        type="text"
                        value={block}
                        onChange={(e) => setBlock(e.target.value)}
                        placeholder="Ex: A, Torre 1"
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Telefone - Interface melhorada */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Telefone para Contato <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(formatPhone(e.target.value))}
                    placeholder="(00) 00000-0000"
                    className={`w-full p-3 border rounded-lg focus:ring-2 focus:border-transparent text-black pl-10 ${
                      phoneError ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-red-500'
                    }`}
                    maxLength={15}
                  />
                  <Phone className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                </div>
                {phoneError && (
                  <p className="mt-1 text-sm text-red-600">{phoneError}</p>
                )}
              </div>
            </div>
          </div>

          {/* Resumo do Pedido */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-4">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Resumo do Pedido</h2>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal ({cart.reduce((sum, item) => sum + item.quantity, 0)} itens):</span>
                  <span>R$ {subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Taxa de entrega:</span>
                  <div className="text-right">
                    {isFirstOrder === true && deliveryFee === 0 ? (
                      <div className="flex flex-col items-end">
                        <span className="line-through text-red-500 text-sm">
                          R$ {deliveryFee.toFixed(2)}
                        </span>
                        <span className="text-green-600 font-semibold">
                          GRÁTIS!
                        </span>
                      </div>
                    ) : (
                      <span className={deliveryFee > 0 ? 'text-green-600' : 'text-gray-400'}>
                        {deliveryFee > 0 ? `R$ ${deliveryFee.toFixed(2)}` : 'Não calculado'}
                      </span>
                    )}
                  </div>
                </div>
                <div className="border-t border-gray-200 pt-3 mt-4">
                  <div className="flex justify-between text-lg font-semibold text-gray-800">
                    <span>Total:</span>
                    <span>R$ {total.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Status do Frete */}
              {deliveryFee === 0 ? (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                  <div className="flex items-center">
                    <MapPin className="w-4 h-4 text-yellow-600 mr-2" />
                    <span className="text-yellow-800 text-sm">
                      Preencha o endereço para calcular o frete
                    </span>
                  </div>
                </div>
              ) : (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                  <div className="flex items-center">
                    <Truck className="w-4 h-4 text-green-600 mr-2" />
                    <span className="text-green-800 text-sm">
                      Frete calculado com sucesso!
                    </span>
                  </div>
                </div>
              )}

              {/* Mensagem de Taxa Grátis para Primeiro Pedido */}
              {showFreeDeliveryMessage && isFirstOrder === true && (
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-lg p-4 mb-4">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
                      <span className="text-green-600 text-lg">🎉</span>
                    </div>
                    <div>
                      <h4 className="text-green-800 font-semibold text-sm">
                        Parabéns! Taxa de entrega grátis no seu primeiro pedido!
                      </h4>
                      <p className="text-green-700 text-xs mt-1">
                        Aproveite esta oferta especial por ser nosso cliente novo.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Forma de Pagamento */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Forma de Pagamento</h3>
                <div className="space-y-2">
                  <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="payment"
                      value="card"
                      checked={paymentMethod === 'card'}
                      onChange={(e) => setPaymentMethod(e.target.value as 'card')}
                      className="mr-3"
                    />
                    <CreditCard className="w-5 h-5 mr-2 text-gray-600" />
                    <span>Cartão de Crédito/Débito</span>
                  </label>
                  <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="payment"
                      value="pix"
                      checked={paymentMethod === 'pix'}
                      onChange={(e) => setPaymentMethod(e.target.value as 'pix')}
                      className="mr-3"
                    />
                    <DollarSign className="w-5 h-5 mr-2 text-gray-600" />
                    <span>PIX</span>
                  </label>
                </div>
              </div>

              <button
                onClick={handleFinalizeOrder}
                disabled={!deliveryAddress || !phoneNumber || !customerName || !customerLastName || !customerCPF}
                className="w-full bg-red-600 text-white py-3 rounded-lg font-semibold hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                Finalizar Pedido
              </button>
              {(!deliveryAddress || !phoneNumber || !customerName || !customerLastName || !customerCPF) && (
                <p className="text-sm text-gray-500 text-center mt-2">
                  Preencha todos os dados do cliente e endereço para finalizar o pedido
                </p>
              )}

              {/* Número do Pedido (após confirmação) */}
              {showOrderConfirmation && orderNumber && (
                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">Resumo do Pedido</h3>
                  <div className="space-y-2 text-sm text-gray-600">
                    <p><strong>Número do Pedido:</strong> {orderNumber}</p>
                    <p><strong>Cliente:</strong> {customerName} {customerLastName}</p>
                    <p><strong>CPF:</strong> {customerCPF}</p>
                    <p><strong>Endereço:</strong> {deliveryAddress}</p>
                    {addressComplement && <p><strong>Complemento:</strong> {addressComplement}</p>}
                    <p><strong>Telefone:</strong> {phoneNumber}</p>
                    <p><strong>Forma de Pagamento:</strong> {paymentMethod === 'card' ? 'Cartão' : 'PIX'}</p>
                    <p><strong>Total:</strong> R$ {total.toFixed(2)}</p>
                  </div>
                  <OrderNumber 
                    orderNumber={orderNumber}
                    showCopyButton={true}
                  />
                </div>
              )}


            </div>
          </div>
        </div>
      </div>
    </div>

      {/* Payment Modal */}
      {showPaymentModal && orderData && (
        <PaymentModal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          orderId={orderNumber || `ORDER_${Date.now()}`}
          amount={total}
          customerInfo={orderData.customerInfo}
          onPaymentComplete={handlePaymentComplete}
        />
      )}
    </div>
  )
}