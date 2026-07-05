import React, { useEffect, useState } from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { auth, db } from '../../firebase/config'

export default function ProtectedAdminRoute() {
  const [user, setUser] = useState(null)
  const [role, setRole] = useState(null)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        try {
          const userDoc = await getDoc(doc(db, 'users', currentUser.uid))
          if (userDoc.exists()) {
            const userData = userDoc.data()
            setUser(currentUser)
            setRole(userData.role)
          } else {
            setUser(currentUser)
            setRole(null)
          }
        } catch (error) {
          console.error('Error fetching admin role:', error)
          setUser(null)
          setRole(null)
        }
      } else {
        setUser(null)
        setRole(null)
      }
      setChecking(false)
    })

    return () => unsubscribe()
  }, [])

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <p className="text-on-surface-variant font-medium animate-pulse">
          Memeriksa akses admin...
        </p>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/admin-login" replace />
  }

  if (role !== 'admin') {
    signOut(auth)
    return <Navigate to="/admin-login" replace />
  }

  return <Outlet />
}