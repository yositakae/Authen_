import { useEffect, useMemo, useState } from 'react'
import FoodForm from './FoodForm'
import './Menu.css'

const API_URL = 'http://localhost:5000/api'
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
  const [mode, setMode] = useState(() => localStorage.getItem('mode') || 'USER')
  const [saving, setSaving] = useState(false)

  const changeMode = () => {
    const nextMode = mode === 'USER' ? 'ADMIN' : 'USER'
    setMode(nextMode)
    localStorage.setItem('mode', nextMode)
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
          <button className="mode-toggle" type="button" onClick={changeMode} aria-pressed={mode === 'ADMIN'}>
            {mode === 'USER' ? 'เข้าสู่โหมดผู้ดูแล' : 'กลับไปหน้าลูกค้า'}
          </button>
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

        {mode === 'ADMIN' ? <FoodForm types={types} onSubmit={addMenu} saving={saving} /> : null}

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
                </div>
              </article>
            )
          })}
        </div>
        {!loading && !error ? <p className="menu-count">แสดง {filteredMenus.length} จาก {menus.length} เมนู</p> : null}
      </section>

      <footer className="footer"><span className="brand-mark">คร</span><span>ครัวละมุน</span><span className="footer-note">อิ่มท้อง อิ่มใจ ในทุกวัน</span></footer>
    </main>
  )
}

export default App
