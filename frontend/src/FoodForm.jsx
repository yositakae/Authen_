import { useState } from 'react'

const initialValues = { name: '', price: '', typeId: '', isBestSeller: false }

function FoodForm({ types, onSubmit, saving }) {
  const [values, setValues] = useState(initialValues)
  const [formError, setFormError] = useState('')

  const update = (event) => {
    const { name, value, checked, type } = event.target
    setValues((current) => ({ ...current, [name]: type === 'checkbox' ? checked : value }))
  }

  const submit = async (event) => {
    event.preventDefault()
    setFormError('')
    try {
      await onSubmit({
        name: values.name.trim(),
        price: Number(values.price),
        typeId: Number(values.typeId),
        isBestSeller: values.isBestSeller,
      })
      setValues(initialValues)
    } catch (error) {
      setFormError(error.message)
    }
  }

  return (
    <form className="menu-admin-form" onSubmit={submit}>
      <div className="admin-form-heading">
        <div><p className="eyebrow">จัดการรายการ</p><h3>เพิ่มเมนูใหม่</h3></div>
        <span>โหมดผู้ดูแล</span>
      </div>
      <div className="admin-form-fields">
        <label>ชื่อเมนู<input name="name" value={values.name} onChange={update} placeholder="เช่น ข้าวกะเพราไก่" required maxLength={180} /></label>
        <label>ราคา (บาท)<input name="price" type="number" min="0" step="0.01" value={values.price} onChange={update} placeholder="ราคา" required /></label>
        <label>หมวดหมู่<select name="typeId" value={values.typeId} onChange={update} required><option value="">เลือกหมวดหมู่</option>{types.map((type) => <option key={type.typeId} value={type.typeId}>{type.name}</option>)}</select></label>
        <label className="best-seller-option"><input name="isBestSeller" type="checkbox" checked={values.isBestSeller} onChange={update} /> ทำเครื่องหมายเมนูขายดี</label>
        <button className="add-menu-button" type="submit" disabled={saving || types.length === 0}>{saving ? 'กำลังบันทึก...' : 'เพิ่มเมนู'}</button>
      </div>
      {types.length === 0 ? <p className="admin-form-error">ยังไม่มีหมวดหมู่ กรุณาเพิ่มหมวดหมู่ก่อน</p> : null}
      {formError ? <p className="admin-form-error">{formError}</p> : null}
    </form>
  )
}

export default FoodForm
