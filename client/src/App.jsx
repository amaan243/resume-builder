import React from 'react'
import { Route, Routes } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import Home from './pages/Home'
import Layout from './pages/Layout'
import Dashboard from './pages/Dashboard'
import ResumeBuilder from './pages/ResumeBuilder'
import Preview from './pages/Preview'
import api from './configs/api'
import { login, setLoading } from './app/features/authSlice'
import {Toaster} from 'react-hot-toast'



const App = () => {
 
  const dispatch = useDispatch();

  const getUserData = async () => {
    const token = localStorage.getItem('token');

    // Ensure loader always stops, even on errors or missing token
    try {
      if (token) {
        const { data } = await api.get('/api/users/data', {
          headers: { Authorization: token },
        });

        if (data.user) {
          dispatch(login({ user: data.user, token }));
        }
      }
    } catch (error) {
      console.log(error.message);
    } finally {
      dispatch(setLoading(false));
    }
  }

  React.useEffect(() => {
    getUserData();
  }, [])

  return (
    <>
      <Toaster />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path='app' element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path='builder/:resumeId' element={<ResumeBuilder />} />
        </Route>
        <Route path='view/:resumeId' element={<Preview/>} />
        
        <Route path='*' element={<h2>404: Page Not Found</h2>} />
      </Routes>
    </>
  )
}

export default App

