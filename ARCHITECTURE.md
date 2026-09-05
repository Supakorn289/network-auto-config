# System Architecture & Folder Structure

## 1. Architectural Pattern
- **Type:** Client-Side Web Application (Single Page Application - SPA)
- **Data Flow:** User Input (UI) -> Event Listener -> Logic Processing (Bitwise/Templates) -> DOM Update & Micro-interactions
- **Key Concept:** Separation of Concerns (SoC) แยกส่วนแสดงผล (UI), ความสวยงาม (Style), และตรรกะการคำนวณ (Logic) ออกจากกันอย่างเด็ดขาดเพื่อให้ง่ายต่อการขยายสเกลในอนาคต

## 2. Directory Structure & File Responsibilities

/network-auto-config
│
├── index.html          # โครงกระดูกเว็บ (Entry Point) 
│                       # ทำหน้าที่กำหนดเลย์เอาต์หลัก, สร้างฟอร์มแบบ Glassmorphism, 
│                       # และเตรียม Container สำหรับรองรับวิดีโอหรือ 3D Model พื้นหลัง
│
├── style.css           # กล้ามเนื้อและความสวยงาม (Styling) 
│                       # เก็บตัวแปรสี OKLCH, คลาสจัดการ Layout, เอฟเฟกต์เรืองแสง (Glow), 
│                       # และบังคับใช้กฎ Anti-pattern ของ Impeccable อย่างเคร่งครัด
│
├── /js                 # สมองกล (Logic Modules) - แยกไฟล์ให้เป็นระเบียบ
│   ├── app.js          # (Main Controller) ศูนย์กลางดักจับ Event การคลิก ปุ่มกด Dropdown Device Role และประสานงานข้อมูล
│   ├── subnet.js       # (Math Logic) จัดการคณิตศาสตร์เครือข่าย แปลงเลขฐานสองและคำนวณ Bitwise Operators
│   ├── generator.js    # (Template Engine) สร้าง Cisco CLI แยกตาม Device Role (L3 Core, Edge Router, L2 Switch) และผูกบริการ NAT/OSPF/ACL
│   └── effects.js      # (UI Interactions) จัดการลูกเล่นสไตล์ Hacker เช่น Scramble Text Effect และ Canvas Network Graph
│
├── /assets             # ทรัพยากรประกอบเว็บ (Resources)
│   ├── /media          # เก็บไฟล์วิดีโอ Looping (.mp4/.webm) หรือไฟล์ Spline 3D (.splinecode)
│   └── /fonts          # เก็บไฟล์ฟอนต์ Technical หรือ Monospace (หากไม่ได้ดึงผ่าน CDN)
│
└── /docs               # โฟลเดอร์เก็บเอกสาร Context ของ AI (AGENTS.md, DESIGN.md ฯลฯ)