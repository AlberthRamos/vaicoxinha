'use client'

import { useState, useEffect } from 'react'
import { productsService, Product, ProductFilters } from '@/services/productsService'
import ProductCard from '../ProductCard'
import ProductModal from '../ProductModal'
import { UnifiedLoadingScreen } from '@/components/UnifiedLoadingScreen/UnifiedLoadingScreen'

interface ProductCatalogProps {
  featured?: boolean
  limit?: number
  category?: string
}

export default function ProductCatalog({ featured, limit, category }: ProductCatalogProps) {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')

  const categories = [
    { id: 'all', name: 'Todos' },
    { id: 'coxinhas-tradicionais', name: 'Coxinhas Tradicionais' },
    { id: 'coxinhas-especiais', name: 'Coxinhas Especiais' },
    { id: 'coxinhas-premium', name: 'Coxinhas Premium' },
    { id: 'bebidas', name: 'Bebidas' },
    { id: 'combos', name: 'Combos' }
  ]

  useEffect(() => {
    loadProducts()
  }, [featured, limit, category])

  const loadProducts = async () => {
    try {
      setLoading(true)
      setError(null)

      let data
      if (featured) {
        data = await productsService.getFeaturedProducts(limit)
      } else if (category) {
        const result = await productsService.getProductsByCategory(category, { limit })
        data = result.products
      } else {
        const filters: ProductFilters = {}
        if (selectedCategory !== 'all') {
          filters.category = selectedCategory
        }
        if (searchTerm) {
          filters.search = searchTerm
        }
        
        const result = await productsService.getProducts(filters, { limit })
        data = result.products
      }

      setProducts(data)
    } catch (err) {
      console.error('Erro ao carregar produtos:', err)
      setError('Erro ao carregar produtos. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (term: string) => {
    setSearchTerm(term)
    loadProducts()
  }

  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategory(categoryId)
    loadProducts()
  }

  const openProductModal = (product: Product) => {
    setSelectedProduct(product)
  }

  const closeProductModal = () => {
    setSelectedProduct(null)
  }

  if (loading) {
    return <UnifiedLoadingScreen isLoading={true} context="products" />
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-4">{error}</div>
        <button 
          onClick={loadProducts}
          className="bg-vc-red-500 text-white px-6 py-2 rounded-lg hover:bg-vc-red-600"
        >
          Tentar Novamente
        </button>
      </div>
    )
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-500 mb-4">Nenhum produto encontrado.</div>
        <button 
          onClick={loadProducts}
          className="bg-vc-red-500 text-white px-6 py-2 rounded-lg hover:bg-vc-red-600"
        >
          Atualizar
        </button>
      </div>
    )
  }

  return (
    <section className="py-16 bg-vc-cream-50">
      <div className="container mx-auto px-4">
        {!featured && !category && (
          <div className="mb-8">
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Buscar produtos..."
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-vc-red-500 focus:border-transparent"
                />
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => handleCategoryChange(category.id)}
                  className={`px-4 py-2 rounded-full text-sm font-medium ${
                    selectedCategory === category.id
                      ? 'bg-vc-red-500 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {category.name}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map((product) => (
            <div key={product.id}>
              <ProductCard
                product={product}
                onClick={() => openProductModal(product)}
              />
            </div>
          ))}
        </div>
      </div>

      <ProductModal
        product={selectedProduct}
        isOpen={!!selectedProduct}
        onClose={closeProductModal}
      />
    </section>
  )
}