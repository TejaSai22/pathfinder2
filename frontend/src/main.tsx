import { StrictMode, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import './index.css'

const Root = () => import('./pages/Root')
const Home = () => import('./pages/Home')
const Login = () => import('./pages/Login')
const Register = () => import('./pages/Register')

const Lazy = (factory: () => Promise<{ default: React.ComponentType<any> }>) => (
  <Suspense fallback={<div>Loading...</div>}>
    {(() => {
      const C = React.lazy(factory as any)
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
    <RouterProvider router={router} />
  </StrictMode>,
)
