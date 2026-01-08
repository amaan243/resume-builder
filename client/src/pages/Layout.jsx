import React, { use } from 'react'
import { Outlet } from 'react-router-dom'
import Navbar from '../components/Navbar'
import { useSelector } from 'react-redux'
import Loder from '../components/Loder'
import Login from './Login'

const Layout = () => {

  const { user, loading } = useSelector((state) => state.auth);

  if (loading) {
    return <Loder />
  }

  return (
    <div>
      {user ? (
        <div className='min-h-screen bg-gray-50'>
          <Navbar />
          <Outlet />
        </div>)
        : (
          <Login />
        )}

    </div>
  )
}

export default Layout
