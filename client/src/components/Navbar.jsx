import React, { use } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { logout } from '../app/features/authSlice';

const Navbar = () => {

    const {user} =useSelector((state) => state.auth);  
    const dispatch=useDispatch();

    const navigate=useNavigate();
    const logoutUser = () => {
        navigate('/');
        dispatch(logout());
        
    }

  return (
    <div className='shadow-md bg-white border-b border-[#E2E8F0]'>
      <nav className='flex items-center justify-between max-w-7xl mx-auto px-4 py-3.5 text-[#0F172A] transition-all'>
        <Link to="/">
          <img src="/logo.svg" alt="logo" className='h-11 w-auto'/>
        </Link>
        <div className='flex items-center gap-4 text-sm'>
          <p className='max-sm:hidden text-[#475569]'>Hi , {user?.name}</p>
          <button onClick={logoutUser} className='bg-white hover:bg-[#F8FAFC] border border-[#E2E8F0] px-7 py-1.5 rounded-xl active:scale-95 transition-all text-[#0F172A] hover:border-[#CBD5F5]'>Logout</button>
        </div>
      </nav>
    </div>
  )
}

export default Navbar
