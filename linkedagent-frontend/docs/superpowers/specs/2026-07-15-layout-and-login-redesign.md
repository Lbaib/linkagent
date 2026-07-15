# Layout & Login UI Redesign Spec

## 1. Goal
Unify the application flow so that the application acts as a proper dashboard system rather than a marketing site. Eliminate the confusing dual-login paths. Revamp the login page aesthetics to a steady, high-tech "particles/stars" theme, removing any flashing/blinking animations.

## 2. Architecture & Flow (统一入口模式)
- **Default Route (`/`)**: Redirects to the login page (`/login`) if unauthenticated, or to the main workspace (`/agent` by default) if authenticated.
- **Login Page (`/login`)**: The sole entry point for unauthenticated users.
- **App Layout**: Once logged in, users see a unified layout with a top navigation bar (or sidebar). From this navigation bar, authorized users can switch between:
  - **客服工作台** (`/agent`)
  - **管理中心** (`/admin`)
- The old `HeroSection` and its confusing "two buttons" approach will be completely removed.

## 3. Login Page Aesthetic (粒子/星空风格)
- **Background**: Deep space / dark tech theme (e.g., `bg-slate-950`).
- **Visuals**: A static or extremely slow, subtle particle/starry overlay. No aggressive `animate-blob` or flashing circles.
- **Card**: The central login form remains a glass-morphism card (`AuthCard`), but tuned to look sharper against the dark starry background (slight white border, subtle shadow).

## 4. Required Changes
1. **Remove Old Landing Page**: Delete `HeroSection.tsx` and strip `HomePage` logic.
2. **Global AppShell / Navigation**: Create a new `TopNav` component visible only on protected routes. It will contain tabs for "工作台" and "管理中心" along with a "退出登录" (Logout) button.
3. **Login Redesign**: Update `LoginPage.tsx` and `index.css` to implement the new dark tech background and remove old keyframes.

## 5. Success Criteria
- Accessing the app immediately prompts for login if not authenticated.
- The login background is visually stable, dark, and tech-oriented (no flashing).
- After login, the user has a clear navigation bar to switch between Agent and Admin modes.
