import React from 'react'
import { Lock, Mail, User2Icon } from 'lucide-react'
import api from '../configs/api';
import { useDispatch } from 'react-redux';
import { login } from '../app/features/authSlice';
import toast from 'react-hot-toast';
import VerifyEmail from './VerifyEmail';

const Login = () => {
  
  const query = new URLSearchParams(window.location.search);
  const urlState = query.get('state');
  const [state, setState] = React.useState(urlState || "login")
  const [showVerification, setShowVerification] = React.useState(false)
  const [pendingEmail, setPendingEmail] = React.useState(null)
  const [loading, setLoading] = React.useState(false)

  const dispatch=useDispatch();

    const [formData, setFormData] = React.useState({
        name: '',
        email: '',
        password: ''
    })

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        try {
            const { data } = await api.post(`/api/users/${state}`, formData);
            
            // If signup requires verification
            if (state === "register" && data.requiresVerification) {
                setPendingEmail(formData.email)
                // Store password temporarily for auto-login after verification
                localStorage.setItem('signup_password', formData.password)
                setShowVerification(true)
                toast.success('Verification code sent to your email!')
                return
            }
            
            // If login (token should be present)
            if (data.token) {
                dispatch(login({ user: data.user, token: data.token }));
                localStorage.setItem('token', data.token);
                toast.success(data.message);
            } else {
                toast.error('Please verify your email first')
            }
        } catch (error) {
            toast.error(error?.response?.data?.message || error.message);
        } finally {
            setLoading(false)
        }

    }

    const handleChange = (e) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
    }

    const handleVerificationComplete = (loginData) => {
        dispatch(login({ user: loginData.user, token: loginData.token }));
        localStorage.setItem('token', loginData.token);
        setShowVerification(false)
        setPendingEmail(null)
        setFormData({ name: '', email: '', password: '' })
        toast.success('Email verified! Welcome!')
    }

    if (showVerification && pendingEmail) {
        return (
            <VerifyEmail 
                email={pendingEmail}
                onVerificationComplete={handleVerificationComplete}
                onBack={() => {
                    setShowVerification(false)
                    setPendingEmail(null)
                    localStorage.removeItem('signup_password')
                }}
            />
        )
    }

  return (
    <div className='flex items-center justify-center min-h-screen bg-gray-50'>
      <form onSubmit={handleSubmit} className="sm:w-[350px] w-full text-center border border-gray-300/60 rounded-2xl px-8 bg-white">
                <h1 className="text-gray-900 text-3xl mt-10 font-medium">{state === "login" ? "Login" : "Sign up"}</h1>
                <p className="text-gray-500 text-sm mt-2">Please {state} to continue</p>
                {state !== "login" && (
                    <div className="flex items-center mt-6 w-full bg-white border border-gray-300/80 h-12 rounded-full overflow-hidden pl-6 gap-2">
                        <User2Icon size={16} color='#6B7280'/>
                        <input type="text" name="name" placeholder="Name" className="border-none outline-none ring-0" value={formData.name} onChange={handleChange} required />
                    </div>
                )}
                <div className="flex items-center w-full mt-4 bg-white border border-gray-300/80 h-12 rounded-full overflow-hidden pl-6 gap-2">
                   <Mail size={13} color='#6B7280'/>
                    <input type="email" name="email" placeholder="Email id" className="border-none outline-none ring-0" value={formData.email} onChange={handleChange} required />
                </div>
                <div className="flex items-center mt-4 w-full bg-white border border-gray-300/80 h-12 rounded-full overflow-hidden pl-6 gap-2">
                    <Lock size={13} color='#6B7280'/>
                    <input type="password" name="password" placeholder="Password" className="border-none outline-none ring-0" value={formData.password} onChange={handleChange} required />
                </div>
                <div className="mt-4 text-left text-green-500">
                    <button className="text-sm" type="reset">Forget password?</button>
                </div>
                <button type="submit" disabled={loading} className="mt-2 w-full h-11 rounded-full text-white bg-green-500 hover:opacity-90 transition-opacity disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center">
                    {loading ? (
                        <div className="flex items-center gap-2">
                            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <span>{state === "login" ? "Logging in..." : "Signing up..."}</span>
                        </div>
                    ) : (
                        state === "login" ? "Login" : "Sign up"
                    )}
                </button>
                <p onClick={() => setState(prev => prev === "login" ? "register" : "login")} className="text-gray-500 text-sm mt-3 mb-11">{state === "login" ? "Don't have an account?" : "Already have an account?"} <a href="#" className="text-green-500 hover:underline">click here</a></p>
            </form>
    </div>
  )
}

export default Login
