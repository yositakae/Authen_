# Fullstack Menu App

โปรเจกต์ตัวอย่างเว็บจัดการเมนูอาหาร แบ่งเป็น frontend ที่ใช้ React + Vite และ backend ที่ใช้ Node.js + Express เชื่อมต่อฐานข้อมูล MySQL ผ่าน Prisma

## เทคโนโลยี

- Frontend: React, Vite
- Backend: Node.js, Express
- Database: MySQL
- ORM: Prisma

## สิ่งที่ต้องติดตั้ง

- Node.js และ npm
- MySQL Server

## ตั้งค่าและเริ่มใช้งาน

เปิด terminal ที่โฟลเดอร์โปรเจกต์ แล้วติดตั้ง dependencies ของแต่ละส่วน:

```powershell
cd backend
npm install
```

```powershell
cd ..\frontend
npm install
```

### ตั้งค่าฐานข้อมูล

1. เปิด MySQL Server และสร้างฐานข้อมูลชื่อ `myshop` (หรือเลือกชื่ออื่นตามต้องการ)
2. ในโฟลเดอร์ `backend` คัดลอก `.env.example` เป็น `.env`
3. แก้ `DATABASE_URL` ให้ตรงกับการตั้งค่า MySQL ของคุณ:

```env
PORT=3000
DATABASE_URL="mysql://root:your_password@localhost:3306/myshop"
```

แทน `root`, `your_password` และ `myshop` ด้วยชื่อผู้ใช้ รหัสผ่าน และชื่อฐานข้อมูลจริง อย่า commit ไฟล์ `.env` หรือแชร์รหัสผ่าน

เตรียมตารางในฐานข้อมูลโดยนำเข้า `backend/schema.sql` ผ่าน MySQL client หรือ MySQL Workbench หลังจากนั้นตรวจสอบว่าโครงสร้างตารางตรงกับ Prisma schema ใน `backend/prisma`.

### รันแอป

เปิด terminal สองหน้าต่างจากโฟลเดอร์โปรเจกต์

Terminal 1 — API:

```powershell
cd backend
npm run dev
```

Terminal 2 — เว็บ:

```powershell
cd frontend
npm run dev
```

เปิด URL ที่ Vite แสดงใน terminal (โดยปกติคือ `http://localhost:5173`) ส่วน API จะทำงานที่ `http://localhost:3000` และตรวจสอบสถานะได้ที่ `http://localhost:3000/api/health`.

> คำสั่ง `npm run dev` เรียก Vite ที่ติดตั้งไว้ใน dependencies ของ frontend ให้อยู่ในโฟลเดอร์ `frontend` และติดตั้ง dependencies ก่อน หากเรียก `vite` ตรง ๆ จาก terminal แล้วพบข้อความว่าไม่รู้จักคำสั่ง ให้ใช้ `npm run dev` แทน

## API ที่มี

| Method | Path | รายละเอียด |
| --- | --- | --- |
| `GET` | `/api/health` | ตรวจสอบสถานะ API |
| `GET` | `/api/types` | อ่านประเภทเมนู |
| `POST` | `/api/types` | เพิ่มประเภทเมนู |
| `PUT` | `/api/types/:typeId` | แก้ไขประเภทเมนู |
| `DELETE` | `/api/types/:typeId` | ลบประเภทเมนู |
| `GET` | `/api/menus` | อ่านรายการเมนูพร้อมประเภท |
| `POST` | `/api/menus` | เพิ่มเมนู |
| `PUT` | `/api/menus/:menuId` | แก้ไขเมนู |
| `DELETE` | `/api/menus/:menuId` | ลบเมนู |

## โครงสร้างโปรเจกต์

```text
├── backend/
│   ├── prisma/       # Prisma schema
│   ├── schema.sql    # โครงสร้างฐานข้อมูล SQL
│   └── src/          # Express API และการเชื่อมต่อฐานข้อมูล
├── frontend/
│   └── src/          # React application
└── README.md
```
