import { StrictMode, Suspense, lazy, type ComponentType } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import './index.css'
import { AuthProvider } from './lib/auth'

const Root = () => import('./pages/Root')
const Home = () => import('./pages/Home')
const Login = () => import('./pages/Login')
const Register = () => import('./pages/Register')

const Lazy = (factory: () => Promise<{ default: ComponentType<any> }>) => (
  <Suspense fallback={<div>Loading...</div>}>
    {(() => {
      const C = lazy(factory as any)
      return <C />
    })()}
  </Suspense>
)

const router = createBrowserRouter([
  {
    path: '/',
    element: Lazy(Root),
    children: [
      { index: true, element: Lazy(Home) },
      { path: 'login', element: Lazy(Login) },
      { path: 'register', element: Lazy(Register) },
    ],
  },
])

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  </StrictMode>,
)
