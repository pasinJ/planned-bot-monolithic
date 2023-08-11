import * as React from 'react';

export default async function reportAccessibility(
  App: typeof React,
  config?: Record<string, unknown>,
): Promise<void> {
  if (process.env.NODE_ENV !== 'production') {
    const axe = await import('@axe-core/react');
    const ReactDOM = await import('react-dom');

    await axe.default(App, ReactDOM, 1000, config);
  }
}
