'use client';

import { ReactElement, ReactNode } from 'react';
import { render } from '@testing-library/react';
import { Toaster } from 'react-hot-toast';

interface WrapperProps {
  children: ReactNode;
}

function DefaultWrapper({ children }: WrapperProps) {
  return (
    <>
      {children}
      <Toaster position="top-right" />
    </>
  );
}

export function renderWithProviders(ui: ReactElement, options?: Parameters<typeof render>[1]) {
  return render(ui, { wrapper: DefaultWrapper, ...options });
}

export * from '@testing-library/react';
