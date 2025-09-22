import { NextRequest, NextResponse } from 'next/server'

export interface Product {
  id: string
  name: string
  description: string
  price: number
  originalPrice?: number
  image: string
  category: string
  featured: boolean
  isNew?: boolean
  available: boolean
  preparationTime: number
  rating?: number
  reviewCount?: number
  isVegan?: boolean
  nutritionalInfo?: {
    calories: number
    protein: number
    carbs: number
    fat: number
  }
}

const COMBOS_VAI_COXINHA: Product[] = [
  {
    id: 'combo-1',
    name: 'Combo Clássico - 10 Coxinhas',
    description: '10 coxinhas de frango tradicionais, bem douradas e crocantes. Perfeitas para compartilhar!',
    price: 35.90,
    originalPrice: 42.90,
    image: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400&h=300&fit=crop',
    category: 'Combos Tradicionais',
    featured: true,
    isNew: false,
    available: true,
    preparationTime: 20,
    rating: 4.8,
    reviewCount: 156,
    nutritionalInfo: {
      calories: 180,
      protein: 12,
      carbs: 8,
      fat: 11
    }
  },
  {
    id: 'combo-2',
    name: 'Combo Família - 20 Coxinhas',
    description: '20 coxinhas de frango com massa crocante e recheio suculento. Economia garantida!',
    price: 65.90,
    originalPrice: 79.90,
    image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&h=300&fit=crop',
    category: 'Combos Tradicionais',
    featured: true,
    isNew: false,
    available: true,
    preparationTime: 25,
    rating: 4.9,
    reviewCount: 203,
    nutritionalInfo: {
      calories: 180,
      protein: 12,
      carbs: 8,
      fat: 11
    }
  },
  {
    id: 'combo-3',
    name: 'Combo Festa - 30 Coxinhas + 10 Bolinhas de Queijo',
    description: 'O combo perfeito para festas! 30 coxinhas tradicionais + 10 bolinhas de queijo douradas.',
    price: 99.90,
    originalPrice: 129.90,
    image: 'https://images.unsplash.com/photo-1514516870926-20598973e480?w=400&h=300&fit=crop',
    category: 'Combos Especiais',
    featured: true,
    isNew: true,
    available: true,
    preparationTime: 30,
    rating: 4.7,
    reviewCount: 89,
    nutritionalInfo: {
      calories: 195,
      protein: 10,
      carbs: 9,
      fat: 13
    }
  },
  {
    id: 'combo-4',
    name: 'Combo Vegano - 10 Coxinhas de Jaca',
    description: '10 coxinhas veganas com recheio de jaca desfiada e temperos especiais. 100% vegetal!',
    price: 42.90,
    originalPrice: 49.90,
    image: 'https://images.unsplash.com/photo-1540914124281-342587389522?w=400&h=300&fit=crop',
    category: 'Combos Veganos',
    featured: false,
    isNew: true,
    available: true,
    preparationTime: 20,
    rating: 4.6,
    reviewCount: 67,
    isVegan: true,
    nutritionalInfo: {
      calories: 145,
      protein: 6,
      carbs: 18,
      fat: 6
    }
  },
  {
    id: 'combo-5',
    name: 'Combo Premium - 15 Coxinhas Especiais',
    description: '15 coxinhas com recheios especiais: frango com requeijão, calabresa com catupiry e frango com cream cheese.',
    price: 79.90,
    originalPrice: 95.90,
    image: 'https://images.unsplash.com/photo-1551782450-a2132b4ba21d?w=400&h=300&fit=crop',
    category: 'Combos Especiais',
    featured: true,
    isNew: false,
    available: true,
    preparationTime: 25,
    rating: 4.8,
    reviewCount: 124,
    nutritionalInfo: {
      calories: 195,
      protein: 11,
      carbs: 9,
      fat: 14
    }
  },
  {
    id: 'combo-6',
    name: 'Combo Kids - 8 Mini Coxinhas + 5 Bolinhas de Queijo',
    description: 'Combo infantil com 8 mini coxinhas e 5 bolinhas de queijo no tamanho perfeito para as crianças.',
    price: 28.90,
    originalPrice: 34.90,
    image: 'https://images.unsplash.com/photo-1556694795-b6423d3d5b28?w=400&h=300&fit=crop',
    category: 'Combos Kids',
    featured: false,
    isNew: true,
    available: true,
    preparationTime: 15,
    rating: 4.5,
    reviewCount: 45,
    nutritionalInfo: {
      calories: 165,
      protein: 8,
      carbs: 10,
      fat: 10
    }
  },
  {
    id: 'combo-7',
    name: 'Combo Mega Festa - 50 Coxinhas + 20 Bolinhas + Bebidas',
    description: 'O combo mais completo! 50 coxinhas tradicionais + 20 bolinhas de queijo + refrigerantes 2L. Atende até 30 pessoas!',
    price: 189.90,
    originalPrice: 249.90,
    image: 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=400&h=300&fit=crop',
    category: 'Combos Especiais',
    featured: true,
    isNew: false,
    available: true,
    preparationTime: 45,
    rating: 4.9,
    reviewCount: 312,
    nutritionalInfo: {
      calories: 185,
      protein: 10,
      carbs: 12,
      fat: 12
    }
  }
]

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const featured = searchParams.get('featured')
    const isNew = searchParams.get('isNew')
    const search = searchParams.get('search')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')

    let products = [...COMBOS_VAI_COXINHA]

    // Aplicar filtros
    if (category) {
      products = products.filter(p => p.category === category)
    }
    if (featured === 'true') {
      products = products.filter(p => p.featured)
    }
    if (isNew === 'true') {
      products = products.filter(p => p.isNew)
    }
    if (search) {
      products = products.filter(p => 
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.description.toLowerCase().includes(search.toLowerCase())
      )
    }

    // Paginação
    const startIndex = (page - 1) * limit
    const endIndex = startIndex + limit
    const paginatedProducts = products.slice(startIndex, endIndex)
    const totalPages = Math.ceil(products.length / limit)

    return NextResponse.json({
      products: paginatedProducts,
      total: products.length,
      page,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1
    })
  } catch (error) {
    console.error('Error fetching products:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export { COMBOS_VAI_COXINHA };