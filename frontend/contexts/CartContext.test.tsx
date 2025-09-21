import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react';
import { CartProvider, useCart } from './CartContext';

const mockProduct = {
  id: '1',
  name: 'Test Product',
  price: 10,
  image: 'test.jpg',
};

const TestComponent = () => {
  const { addToCart, totalItems, totalPrice } = useCart();

  return (
    <div>
      <button onClick={() => addToCart(mockProduct)}>Add to Cart</button>
      <div data-testid="total-items">{totalItems}</div>
      <div data-testid="total-price">{totalPrice}</div>
    </div>
  );
};

describe('CartContext', () => {
  it('should add a product to the cart and update totals', () => {
    render(
      <CartProvider>
        <TestComponent />
      </CartProvider>
    );

    fireEvent.click(screen.getByText('Add to Cart'));

    expect(screen.getByTestId('total-items').textContent).toBe('1');
    expect(screen.getByTestId('total-price').textContent).toBe('10');
  });
});
