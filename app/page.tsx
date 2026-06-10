'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Session, seedIfEmpty } from '@/lib/store'

export default function Home() {
  const router = useRouter()
  useEffect(() => {
    seedIfEmpty()
    const user = Session.get()
    router.replace(user ? '/dashboard' : '/login')
  }, [router])
  return null
}
