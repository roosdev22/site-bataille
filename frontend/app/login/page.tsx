import { Suspense } from 'react'
import { Loader2 } from 'lucide-react'
import LoginForm from './LoginForm'

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#f9f9fb]">
        <Loader2 size={22} className="animate-spin text-gray-300" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  )
}