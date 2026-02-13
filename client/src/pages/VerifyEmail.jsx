import React, { useState, useEffect } from 'react'
import { Mail, ArrowLeft } from 'lucide-react'
import api from '../configs/api'
import toast from 'react-hot-toast'

const VerifyEmail = ({ email, onVerificationComplete, onBack }) => {
  const [code, setCode] = useState(['', '', '', '', '', ''])
  const [loading, setLoading] = useState(false)
  const [timeLeft, setTimeLeft] = useState(600) // 10 minutes
  const [resendLoading, setResendLoading] = useState(false)

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(interval)
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  const handleCodeChange = (index, value) => {
    if (!/^\d*$/.test(value)) return
    const newCode = [...code]
    newCode[index] = value
    setCode(newCode)
    
    if (value && index < 5) {
      document.getElementById(`code-${index + 1}`)?.focus()
    }
  }

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      document.getElementById(`code-${index - 1}`)?.focus()
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const fullCode = code.join('')
    
    if (fullCode.length !== 6) {
      toast.error('Please enter all 6 digits')
      return
    }

    setLoading(true)
    try {
      const { data } = await api.post('/api/users/verify-email', {
        email,
        code: fullCode
      })
      
      toast.success(data.message)
      const { data: loginData } = await api.post('/api/users/login', {
        email,
        password: localStorage.getItem('signup_password')
      })
      
      onVerificationComplete(loginData)
      localStorage.removeItem('signup_password')
    } catch (error) {
      toast.error(error?.response?.data?.message || error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    setResendLoading(true)
    try {
      await api.post('/api/users/resend-verification', { email })
      toast.success('New verification code sent to your email')
      setTimeLeft(600)
      setCode(['', '', '', '', '', ''])
    } catch (error) {
      toast.error(error?.response?.data?.message || error.message)
    } finally {
      setResendLoading(false)
    }
  }

  const minutes = Math.floor(timeLeft / 60)
  const seconds = timeLeft % 60

  return (
    <div className='flex items-center justify-center min-h-screen bg-gray-50'>
      <form onSubmit={handleSubmit} className="sm:w-[380px] w-full text-center border border-gray-300/60 rounded-2xl px-8 bg-white py-10">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft size={18} />
          <span className="text-sm">Back</span>
        </button>

        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
            <Mail size={32} className="text-green-600" />
          </div>
        </div>

        <h1 className="text-gray-900 text-2xl font-semibold mt-4">Email Verification</h1>
        <p className="text-gray-600 text-sm mt-2">
          We've sent a verification code to<br />
          <span className="font-medium text-gray-900">{email}</span>
        </p>

        <div className="mt-8 mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Enter 6-digit code
          </label>
          <div className="flex gap-2 justify-center">
            {code.map((digit, index) => (
              <input
                key={index}
                id={`code-${index}`}
                type="text"
                maxLength="1"
                value={digit}
                onChange={(e) => handleCodeChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                className="w-12 h-14 text-center text-2xl font-bold border-2 border-gray-300 rounded-lg focus:border-green-500 focus:outline-none transition"
                placeholder="0"
              />
            ))}
          </div>
        </div>

        <div className="text-sm text-gray-600 mb-6">
          {timeLeft > 0 ? (
            <p>Code expires in <span className="font-semibold text-gray-900">{minutes}:{seconds.toString().padStart(2, '0')}</span></p>
          ) : (
            <p className="text-red-500 font-medium">Code has expired</p>
          )}
        </div>

        <button
          type="submit"
          disabled={loading || timeLeft === 0}
          className="w-full h-11 rounded-full text-white bg-green-500 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity font-medium"
        >
          {loading ? 'Verifying...' : 'Verify Email'}
        </button>

        <p className="text-gray-600 text-sm mt-6">
          Didn't receive the code?{' '}
          <button
            type="button"
            onClick={handleResend}
            disabled={resendLoading || timeLeft > 540} // 9 minutes left
            className="text-green-500 hover:underline font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {resendLoading ? 'Sending...' : 'Resend'}
          </button>
        </p>
      </form>
    </div>
  )
}

export default VerifyEmail
