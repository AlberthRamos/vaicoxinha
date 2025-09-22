interface UnifiedLoadingScreenProps {
  isLoading: boolean;
  context?: 'products' | 'catalog' | 'cart' | 'order' | 'default';
}

export function UnifiedLoadingScreen({ isLoading }: UnifiedLoadingScreenProps) {
  if (!isLoading) return null;
  
  return (
    <div className="fixed inset-0 bg-white z-50" />
  );
}