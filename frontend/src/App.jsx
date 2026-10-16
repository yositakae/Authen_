import { useEffect, useMemo, useState } from 'react'
import FoodForm from './FoodForm'
import AuthModal from './AuthModal'
import './Menu.css'

const API_URL = `${import.meta.env.VITE_API_URL || 'http://localhost:5002'}/api`
const foodDetails = {
  'ข้าวกะเพราไก่ไข่ดาว': ['🍳', 'กะเพราไก่ผัดหอม เสิร์ฟพร้อมไข่ดาวกรอบ'],
  'ข้าวผัดกุ้ง': ['🍤', 'ข้าวผัดกระทะร้อนกับกุ้งเนื้อแน่น'],
  'ผัดไทยกุ้งสด': ['🍜', 'เส้นเหนียวนุ่ม รสกลมกล่อม โรยถั่วคั่ว'],
  'ข้าวหมูทอดกระเทียม': ['🍚', 'หมูหมักทอดกระเทียมหอม เสิร์ฟกับข้าวสวย'],
  'ต้มยำกุ้งน้ำข้น': ['🍲', 'ต้มยำน้ำข้นรสจัดจ้าน พร้อมกุ้งตัวโต'],
  'แกงเขียวหวานไก่': ['🥘', 'แกงกะทิหอมใบโหระพา เสิร์ฟพร้อมข้าวสวย'],
  'ชาไทยเย็น': ['🧋', 'ชาไทยเข้มข้น หวานมัน เย็นชื่นใจ'],
  'อเมริกาโน่เย็น': ['🧊', 'กาแฟคั่วหอม ดื่มง่าย สดชื่น'],
  'น้ำมะนาวโซดา': ['🍋', 'เปรี้ยวซ่าจากมะนาวแท้ เติมความสดชื่น'],
  'ข้าวเหนียวมะม่วง': ['🥭', 'มะม่วงสุกหวานฉ่ำกับข้าวเหนียวมูนกะทิ'],
  'บัวลอยกะทิสด': ['🍡', 'แป้งบัวลอยนุ่มในน้ำกะทิหอม'],
}

function App() {
  const [menus, setMenus] = useState([])
  const [types, setTypes] = useState([])
  const [activeType, setActiveType] = useState('all')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [user, setUser] = useState(() => { try { return JSON.parse(localStorage.getItem('user')) } catch { return null } })
  const [authMode, setAuthMode] = useState('')
  const [users, setUsers] = useState([])
  const [saving, setSaving] = useState(false)

  const mode = user?.role === 'ADMIN' ? 'ADMIN' : 'USER'
  const authenticate = (nextUser) => { setUser(nextUser); localStorage.setItem('user', JSON.stringify(nextUser)); setAuthMode('') }
  const logout = () => { setUser(null); localStorage.removeItem('user') }

  useEffect(() => {
    if (mode !== 'ADMIN') return
    fetch(`${API_URL}/users`).then((response) => response.ok ? response.json() : []).then(setUsers).catch(() => setUsers([]))
  }, [mode])

  const updateRole = async (userId, role) => {
    try {
      const response = await fetch(`${API_URL}/users/${userId}/role`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ role }) })
      if (!response.ok) throw new Error('เปลี่ยนสิทธิ์ผู้ใช้ไม่สำเร็จ')
      const updatedUser = await response.json()
      setUsers((current) => current.map((item) => item.userId === userId ? updatedUser : item))
      if (user?.userId === userId) authenticate(updatedUser)
    } catch (roleError) { setError(roleError.message) }
  }

  const rateMenu = async (menuId, score) => {
    if (!user) { setAuthMode('login'); return }
    try {
      const response = await fetch(`${API_URL}/menus/${menuId}/ratings`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: user.userId, score: Number(score) }) })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'บันทึกคะแนนไม่สำเร็จ')
      setMenus((current) => current.map((menu) => menu.menuId === menuId ? { ...menu, rating: result } : menu))
    } catch (ratingError) { setError(ratingError.message) }
  }

  const addMenu = async (values) => {
    setSaving(true)
    setError('')
    try {
      const response = await fetch(`${API_URL}/menus`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'เพิ่มเมนูไม่สำเร็จ')
      setMenus((current) => [...current, result])
    } catch (saveError) {
      setError(saveError.message)
      throw saveError
    } finally {
      setSaving(false)
    }
  }

  const deleteMenu = async (menuId) => {
    setError('')
    try {
      const response = await fetch(`${API_URL}/menus/${menuId}`, { method: 'DELETE' })
      if (!response.ok) {
        const result = await response.json().catch(() => ({}))
        throw new Error(result.error || 'ลบเมนูไม่สำเร็จ')
      }
      setMenus((current) => current.filter((menu) => menu.menuId !== menuId))
    } catch (deleteError) {
      setError(deleteError.message)
    }
  }

  useEffect(() => {
    Promise.all([
      fetch(`${API_URL}/menus`).then((response) => {
        if (!response.ok) throw new Error('โหลดรายการเมนูไม่สำเร็จ')
        return response.json()
      }),
      fetch(`${API_URL}/types`).then((response) => {
        if (!response.ok) throw new Error('โหลดหมวดหมู่ไม่สำเร็จ')
        return response.json()
      }),
    ])
      .then(([menuData, typeData]) => {
        setMenus(menuData)
        setTypes(typeData)
      })
      .catch((loadError) => setError(loadError.message))
      .finally(() => setLoading(false))
  }, [])

  const filteredMenus = useMemo(() => menus.filter((menu) => {
    const matchesType = activeType === 'all' || menu.typeId === activeType
    const matchesSearch = menu.name.toLowerCase().includes(search.trim().toLowerCase())
    return matchesType && matchesSearch
  }), [menus, activeType, search])

  return (
    <main className="page-shell">
      <header className="topbar">
        <a className="brand" href="#top" aria-label="ครัวละมุน หน้าแรก">
          <span className="brand-mark">คร</span>
          <span>ครัวละมุน<small>KHUA LAMOON</small></span>
        </a>
        <div className="topbar-actions">
          <span className="open-status"><i /> เปิดให้บริการทุกวัน</span>
          {user ? <span className="signed-in-name">{user.name}</span> : null}
          {user ? <button className="mode-toggle" type="button" onClick={logout}>ออกจากระบบ</button> : <><button className="mode-toggle" type="button" onClick={() => setAuthMode('login')}>เข้าสู่ระบบ</button><button className="mode-toggle register-toggle" type="button" onClick={() => setAuthMode('register')}>สมัครสมาชิก</button></>}
        </div>
      </header>

      <section className="hero" id="top">
        <div className="hero-copy">
          <p className="eyebrow">อาหารทำสด รสชาติบ้านเรา</p>
          <h1>อิ่มอร่อย<br /><span>ได้ทุกมื้อ</span></h1>
          <p className="hero-note">คัดเมนูโปรด ปรุงด้วยวัตถุดิบสดใหม่<br />เลือกจานที่ใช่สำหรับมื้อนี้เลย</p>
          <a className="hero-link" href="#menu">เลือกเมนู <span>↓</span></a>
        </div>
        <div className="hero-art" aria-label="ชามอาหารไทย" role="img">
          <span className="art-sun" />
          <span className="art-leaf leaf-one">✦</span>
          <span className="art-leaf leaf-two">✦</span>
          <div className="hero-bowl"><span>🍛</span></div>
          <span className="art-label">สดใหม่ · ทำด้วยใจ</span>
        </div>
        <div className="hero-stamp"><span>✳</span> อร่อยเหมือน<br />ทำให้คนที่บ้าน</div>
      </section>

      <section className="menu-section" id="menu">
        <div className="section-heading">
          <div>
            <p className="eyebrow">เมนูของเรา</p>
            <h2>เลือกความอร่อย</h2>
          </div>
          <label className="search-box">
            <span aria-hidden="true">⌕</span>
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="ค้นหาเมนู..." aria-label="ค้นหาเมนู" />
          </label>
        </div>

        <div className="filters" aria-label="กรองหมวดหมู่เมนู">
          <button className={activeType === 'all' ? 'filter active' : 'filter'} onClick={() => setActiveType('all')}>ทั้งหมด</button>
          {types.map((type) => (
            <button key={type.typeId} className={activeType === type.typeId ? 'filter active' : 'filter'} onClick={() => setActiveType(type.typeId)}>{type.name}</button>
          ))}
        </div>

        {mode === 'ADMIN' ? <><FoodForm types={types} onSubmit={addMenu} saving={saving} /><section className="users-panel"><div><p className="eyebrow">จัดการบัญชี</p><h3>ผู้ใช้งาน</h3></div>{users.length ? <ul>{users.map((item) => <li key={item.userId}><span>{item.name} <small>{item.email}</small></span><select value={item.role} onChange={(event) => updateRole(item.userId, event.target.value)} aria-label={`สิทธิ์ของ ${item.name}`}><option value="USER">ผู้ใช้</option><option value="ADMIN">ผู้ดูแล</option></select></li>)}</ul> : <p className="users-empty">ยังไม่มีบัญชีผู้ใช้อื่น</p>}</section></> : null}

        {loading ? <p className="state-message">กำลังโหลดเมนูอร่อย ๆ ...</p> : null}
        {error ? <p className="state-message error">{error} กรุณาตรวจสอบว่า backend เปิดอยู่</p> : null}
        {!loading && !error && filteredMenus.length === 0 ? <p className="state-message">ไม่พบเมนูที่ค้นหา</p> : null}

        <div className="menu-grid">
          {filteredMenus.map((menu, index) => {
            const [emoji, description] = foodDetails[menu.name] || ['🍽️', 'ปรุงสดใหม่ พร้อมเสิร์ฟความอร่อย']
            return (
              <article className={`menu-card tone-${index % 4}`} key={menu.menuId}>
                <div className="dish-art"><span>{emoji}</span>{menu.isBestSeller ? <b className="best-badge">ขายดี</b> : null}</div>
                <div className="dish-info">
                  <span className="dish-type">{menu.type?.name}</span>
                  <h3>{menu.name}</h3>
                  <p>{description}</p>
                  <div className="dish-footer"><strong>฿{Number(menu.price).toLocaleString('th-TH')}</strong>{mode === 'ADMIN' ? <button className="delete-menu" type="button" onClick={() => deleteMenu(menu.menuId)}>ลบเมนู</button> : <span>พร้อมเสิร์ฟ</span>}</div>
                  <div className="rating-row"><span aria-label={`คะแนนเฉลี่ย ${Number(menu.rating?.average || 0).toFixed(1)} จาก 5`}>★ {Number(menu.rating?.average || 0).toFixed(1)} <small>({menu.rating?.count || 0} รีวิว)</small></span>{mode !== 'ADMIN' ? <label>ให้คะแนน<select value="" onChange={(event) => rateMenu(menu.menuId, event.target.value)} aria-label={`ให้คะแนน ${menu.name}`}><option value="" disabled>{user ? 'เลือกคะแนน' : 'เข้าสู่ระบบ'}</option>{[5, 4, 3, 2, 1].map((score) => <option key={score} value={score}>{score} ดาว</option>)}</select></label> : null}</div>
                </div>
              </article>
            )
          })}
        </div>
        {!loading && !error ? <p className="menu-count">แสดง {filteredMenus.length} จาก {menus.length} เมนู</p> : null}
      </section>

      <footer className="footer"><span className="brand-mark">คร</span><span>ครัวละมุน</span><span className="footer-note">อิ่มท้อง อิ่มใจ ในทุกวัน</span></footer>
      {authMode ? <AuthModal initialMode={authMode} onClose={() => setAuthMode('')} onAuthenticated={authenticate} /> : null}
    </main>
  )
}

export default App
