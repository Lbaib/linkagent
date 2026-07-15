# Login UI Implementation Plan

> **For agentic workers:** REQUIRED SUB‑SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task‑by‑task. Steps use checkbox (`- [ ]`) syntax for tracking.

## Goal
Introduce a single glass‑morphism styled `LoginPage` as the entry point, protect all routes with `RequireAuth`, and use React Router v6 for navigation. Unauthenticated users are redirected to `/login`; after successful login they are sent back to the originally requested page.

## Architecture
- React Router v6 for navigation.
- `RequireAuth` wrapper for protected routes.
- Reusable `AuthCard` component for glass‑morphism UI.
- `AuthContext` remains the source of truth for auth state.

## Tech Stack
- Vite + React + TypeScript (already in project)
- `react-router-dom@6`
- Existing Axios & React Query stack

## Global Constraints
- Type‑only imports must be used where `verbatimModuleSyntax` is enabled.
- No placeholder code (no TODO/TBD).
- Follow existing code style and lint rules.

---

## Task 1: Install React Router

**Files:**
- Modify `package.json` (add dependency)

- [ ] **Step 1:** Run `npm i react-router-dom@6`.
- [ ] **Step 2:** Verify `package.json` contains `"react-router-dom": "^6"`.
- [ ] **Step 3:** Commit.

## Task 2: Wrap App with BrowserRouter

**Files:**
- Modify `src/main.tsx`

- [ ] **Step 1:** Replace render call with:
```tsx
import { BrowserRouter } from 'react-router-dom';
import App from './App';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
```
- [ ] **Step 2:** Run `npm run build` to ensure no TypeScript errors.
- [ ] **Step 3:** Commit.

## Task 3: Create RequireAuth component

**Files:**
- `src/components/RequireAuth.tsx`

- [ ] **Step 1:** Implement component:
```tsx
import { useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ReactNode } from 'react';

interface Props { children: ReactNode; }

export const RequireAuth = ({ children }: Props) => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  return <>{children}</>;
};
```
- [ ] **Step 2:** Export from `src/components/index.ts` if exists.
- [ ] **Step 3:** Run `npm run build`.
- [ ] **Step 4:** Commit.

## Task 4: Add global glass‑morphism CSS and AuthCard component

**Files:**
- `src/index.css`
- `src/components/AuthCard.tsx`

- [ ] **Step 1:** Append to `src/index.css`:
```css
:root {
  --glass-bg: rgba(255,255,255,0.12);
  --glass-blur: 8px;
}
.glass-card {
  backdrop-filter: blur(var(--glass-blur));
  background: var(--glass-bg);
  border-radius: 1rem;
  padding: 2rem;
  box-shadow: 0 4px 30px rgba(0,0,0,0.1);
}
```
- [ ] **Step 2:** Create `src/components/AuthCard.tsx`:
```tsx
import { ReactNode } from 'react';

export const AuthCard = ({ children }: { children: ReactNode }) => (
  <div className="glass-card max-w-md mx-auto mt-20">
    {children}
  </div>
);
```
- [ ] **Step 3:** Export if needed.
- [ ] **Step 4:** Run build, commit.

## Task 5: Refactor LoginPage to use AuthCard & redirect logic

**Files:**
- `src/components/LoginPage.tsx`

- [ ] **Step 1:** Wrap the form inside `<AuthCard>`.
- [ ] **Step 2:** After successful `authApi.login`, call:
```tsx
const navigate = useNavigate();
const location = useLocation();
const from = (location.state as any)?.from?.pathname || '/home';
navigate(from, { replace: true });
```
- [ ] **Step 3:** Ensure imports of `useNavigate`, `useLocation`.
- [ ] **Step 4:** Run build, commit.

## Task 6: Replace tab‑switch logic with route definitions

**Files:**
- `src/App.tsx`

- [ ] **Step 1:** Remove `activeTab` state & tab UI.
- **Step 2:** Add routes:
```tsx
import { Routes, Route } from 'react-router-dom';
import { RequireAuth } from './components/RequireAuth';
import LoginPage from './components/LoginPage';
import AgentWorkbench from './components/AgentWorkbench';
import AdminConsole from './components/AdminConsole';

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage title="登录" />} />
      <Route
        path="/home"
        element={
          <RequireAuth>
            <AgentWorkbench />
          </RequireAuth>
        }
      />
      <Route
        path="/admin"
        element={
          <RequireAuth>
            <AdminConsole />
          </RequireAuth>
        }
      />
      <Route path="*" element={<Navigate to="/home" replace />} />
    </Routes>
  );
}
```
- [ ] **Step 2:** Import `Navigate` from `react-router-dom`.
- [ ] **Step 3:** Remove import of `ApiTester` and any unused code.
- [ ] **Step 4:** Run build, commit.

## Task 7: Delete obsolete ApiTester component

**Files:**
- `src/components/ApiTester.tsx`
- Remove its import from any files.

- [ ] **Step 1:** Delete the file.
- [ ] **Step 2:** Ensure no remaining references (search for `ApiTester`).
- [ ] **Step 3:** Run `npm run build` to confirm.
- [ ] **Step 4:** Commit.

## Task 8: Verify build and manual runtime flow

**Files:** N/A

- [ ] **Step 1:** Run `npm run build` – ensure success.
- [ ] **Step 2:** Start dev server `npm run dev`.
- [ ] **Step 3:** In browser, navigate to `/home` → redirected to `/login`.
- [ ] **Step 4:** Perform login (backend must be up) → redirected to `/home`.
- [ ] **Step 5:** Refresh → stays on `/home`.
- [ ] **Step 6:** Click logout (add a simple button in `AgentWorkbench` if not present) → redirects to `/login`.
- [ ] **Step 7:** Verify UI: login card uses same glass‑morphism as other cards.
- [ ] **Step 8:** Commit final changes.

---

**Execution Options**

1. **Subagent‑Driven (recommended)** – dispatch a fresh subagent per task, review between tasks.
2. **Inline Execution** – execute tasks in this session using the `executing‑plans` skill.

Which approach would you like to proceed with?
