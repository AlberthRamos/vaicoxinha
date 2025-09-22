import { NextRequest, NextResponse } from 'next/server'
import { COMBOS_VAI_COXINHA } from '../../../products/route'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ category: string }> }
) {
  const { category } = await params
  try {
    const decodedCategory = decodeURIComponent(category)
    
    const products = COMBOS_VAI_COXINHA.filter(p => p.category === decodedCategory)
    
    return NextResponse.json({
      products,
      total: products.length,
      page: 1,
      totalPages: 1,
      hasNext: false,
      hasPrev: false
    })
  } catch (error) {
    console.error('Error fetching products by category:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}