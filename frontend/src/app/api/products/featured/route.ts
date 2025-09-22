import { NextResponse } from 'next/server'
import { COMBOS_VAI_COXINHA } from '../route'

export async function GET() {
  try {
    const featuredProducts = COMBOS_VAI_COXINHA.filter(p => p.featured)
    return NextResponse.json(featuredProducts)
  } catch (error) {
    console.error('Error fetching featured products:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}