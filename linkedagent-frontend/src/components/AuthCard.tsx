import type { ReactNode } from 'react';

interface AuthCardProps {
  children: ReactNode;
}

/**
 * Reusable glass-morphism card for auth-related UI.
 * Uses CSS variables --glass-bg and --glass-blur defined in index.css.
 */
export const AuthCard = ({ children }: AuthCardProps) => (
  <div className="glass-card">
    {children}
  </div>
);
