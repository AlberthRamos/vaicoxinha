import { ReactNode } from 'react';

interface CodeSplitLoaderProps {
  isLoading: boolean;
  children: ReactNode;
  className?: string;
}

export function CodeSplitLoader({
  isLoading,
  children,
  className
}: CodeSplitLoaderProps) {
  if (!isLoading) {
    return <>{children}</>;
  }

  return (
    <div className={`code-split-loader ${className || ''}`} />
  );
}