import { useState } from 'react'

const API_URL = `${import.meta.env.VITE_API_URL || 'http://localhost:5002'}/api`

function AuthModal({ initialMode = 'login', onClose, onAuthenticated }) {
  const [mode, setMode] = useState(initialMode)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (event) => {
    event.preventDefault()
    setBusy(true)
    setError('')
    if (mode === 'register' && password !== confirmPassword) {
      setError('รหัสผ่านและการยืนยันรหัสผ่านไม่ตรงกัน')
      setBusy(false)
      return
    }
    try {
      const response = await fetch(`${API_URL}/auth/${mode}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, confirmPassword }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'เข้าสู่ระบบไม่สำเร็จ')
      onAuthenticated(result)
    } catch (requestError) { setError(requestError.message) }
    finally { setBusy(false) }
  }

  return (
    <div className="auth-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
      <section className="auth-card" role="dialog" aria-modal="true" aria-labelledby="auth-title">
        <button className="auth-close" type="button" onClick={onClose} aria-label="ปิด">×</button>
        <p className="eyebrow">ยินดีต้อนรับสู่ครัวละมุน</p>
        <h2 id="auth-title">{mode === 'login' ? 'เข้าสู่ระบบ' : 'สร้างบัญชีใหม่'}</h2>
        <p className="auth-description">{mode === 'login' ? 'เข้าสู่ระบบเพื่อให้คะแนนเมนูที่คุณชื่นชอบ' : 'สมัครสมาชิกเพื่อให้คะแนนเมนูและร่วมแบ่งปันความอร่อย'}</p>
        <form className="auth-form" onSubmit={submit}>
          {mode === 'register' ? <label>ชื่อที่แสดง<input value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" required maxLength={120} placeholder="ชื่อของคุณ" /></label> : null}
          <label>อีเมล<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" required placeholder="you@example.com" /></label>
          <label>รหัสผ่าน<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} required minLength={mode === 'register' ? 8 : 1} placeholder={mode === 'register' ? 'อย่างน้อย 8 ตัวอักษร' : 'รหัสผ่าน'} /></label>
          {mode === 'register' ? <label>ยืนยันรหัสผ่าน<input type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} autoComplete="new-password" required minLength={8} placeholder="กรอกรหัสผ่านอีกครั้ง" /></label> : null}
          {error ? <p className="auth-error">{error}</p> : null}
          <button className="auth-submit" type="submit" disabled={busy}>{busy ? 'กำลังดำเนินการ...' : mode === 'login' ? 'เข้าสู่ระบบ' : 'สมัครสมาชิก'}</button>
        </form>
        <p className="auth-switch">{mode === 'login' ? 'ยังไม่มีบัญชี?' : 'มีบัญชีแล้ว?'} <button type="button" onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError('') }}>{mode === 'login' ? 'สมัครสมาชิก' : 'เข้าสู่ระบบ'}</button></p>
      </section>
    </div>
  )
}

export default AuthModal
