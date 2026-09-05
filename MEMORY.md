# Project Memory & State Tracker

ไฟล์นี้ใช้สำหรับบันทึกความจำ สถานะการทำงาน และบริบทสำคัญของโปรเจกต์ เพื่อให้ AI Agent สามารถทำงานต่อเนื่องได้อย่างแม่นยำและไม่หลุดโฟกัส

## 1. Core Identity & Goals (ข้อมูลสำคัญของโปรเจกต์)
- **Project:** Network Configuration Automation Generator
- **Lead Developer:** Supakorn
- **Ultimate Goal:** สร้างผลงานชิ้นเอก (Masterpiece) สำหรับ Portfolio เพื่อใช้สมัครฝึกงาน โชว์ศักยภาพในการนำซอฟต์แวร์มาแก้ปัญหางานฮาร์ดแวร์/เน็ตเวิร์ก และแสดงให้เห็นถึงทักษะการก้าวเข้าสู่สายงาน DevOps อย่างมืออาชีพ
- **Key Value:** ลดเวลาทำงานจาก 30 นาทีเหลือ 1 นาที และการันตี Zero Human Error

## 2. Current Status (สถานะปัจจุบัน)
- **Phase 1: Architecture & Context Setup** -> `[COMPLETED]` (สร้างไฟล์ .md พื้นฐานครบถ้วน)
- **Phase 2: UI Foundation & Scaffolding** -> `[COMPLETED]` (สร้าง index.html และ style.css เรียบร้อยแล้ว พร้อมเพิ่มลายเซ็นดิจิทัล SYS_ADMIN และ NODE_ID ใน HUD)
- **Phase 3: Core Logic (Subnet & Generator)** -> `[COMPLETED]` (สร้างและอัปเกรดลอจิก subnet.js และ generator.js สำเร็จลุล่วง ไม่มี Error ใน Packet Tracer)
- **Phase 4: Interactions & Effects** -> `[COMPLETED]` (ทำระบบ Intro Screen, Boot Sequence, Canvas Network Graph และ Toast Alerts สมบูรณ์ครบถ้วน)
- **Phase 5: Multi-device Topology Scaling** -> `[COMPLETED]` (ขยายขีดความสามารถรองรับ Multi-device Topology: เพิ่ม Device Role, Hardware Model, ลอจิก Dynamic Form, แยกสคริปต์ Router/L2 Switch และอัปเกรดฟีเจอร์เราเตอร์ระดับ Production Grade เช่น DNS Disable, Default Route, ACL Firewall)
- **System State:** `[READY FOR PRODUCTION]` *(หมายเหตุ: ผ่านการจำลองและทดสอบการใช้งานบน Cisco Packet Tracer ในสถานการณ์จริงเสร็จสมบูรณ์ 100%)*

## 3. Work Log (ประวัติการทำงาน)
- [x] กำหนดโครงสร้างและเป้าหมายโปรเจกต์
- [x] สร้าง `AGENTS.md` (กำหนดบทบาท Senior Software & DevOps Engineer)
- [x] สร้าง `SKILL.md` (กำหนด Tech Stack และกฎ Impeccable Design)
- [x] สร้าง `DESIGN.md` (กำหนดธีม Cyberpunk/Hacker, Glassmorphism, 3D/Video Background)
- [x] สร้าง `ARCHITECTURE.md` (วางโครงสร้างแบบ Modular แยกลอจิก JS เป็นหมวดหมู่)
- [x] สร้าง `PROMPTS.md` (เตรียมคลังคำสั่งสำหรับ Generate โค้ดทีละส่วน)
- [x] สร้าง `MEMORY.md` (ไฟล์นี้)
- [x] รันคำสั่ง `/build-ui` เพื่อสร้าง `index.html` และ `style.css` (สอดคล้องกับ Impeccable Design & OKLCH)
- [x] ปรับแต่ง HUD Header & Footer ใน `index.html` เพื่อแสดงลายเซ็นดิจิทัล (SYS_ADMIN: SUPAKORN P., NODE_ID: 68319010053)
- [x] รันคำสั่ง `/build-subnet-logic` เพื่อสร้าง `js/subnet.js` (คำนวณด้วย Bitwise Operators: &, |, ~ พร้อมระบบ Real-time Input Masking ป้องกัน IP Address ผิดพลาดและเชื่อมโยง scripts ทั้งหมดใน index.html)
- [x] เพิ่มหน้าจอ Intro Screen & Boot Sequence ใน `index.html`, `style.css` และ `js/effects.js` (จำลองโค้ดโหลดสไตล์แฮกเกอร์วิ่งวิ่งขึ้นมาพร้อมเสียงบี๊บเอฟเฟกต์สังเคราะห์และระบบเฟดเอาต์)
- [x] รันคำสั่ง `/build-generator-logic` เพื่อสร้าง `js/generator.js` (ลอจิกสร้าง Cisco IOS CLI, SVI configuration loop, dynamic DHCP scope, และผูก event ปุ่มคอมไพล์/คัดลอก/ดาวน์โหลดสคริปต์ใน app.js)
- [x] แก้บั๊ก Cisco CLI สำหรับ Packet Tracer: ลบคำสั่ง enable/conf t, ลด dns-server เหลือ 1 ไอพี ป้องกัน Error
- [x] อัปเกรดระบบพอร์ต: เพิ่ม Device Port Type ใน Global Config และช่องกรอก Port Range ในตาราง VLAN พร้อมลอจิกผูก interface range เข้ากับ switchport access vlan อัตโนมัติ
- [x] รันคำสั่ง `/build-hacker-effects` เพื่อสร้างเอฟเฟกต์พื้นหลัง Canvas Network Node Graph โต้ตอบกับตำแหน่งเมาส์ใน `js/effects.js`
- [x] รันคำสั่ง `/audit-impeccable` เพื่อทำ Code Audit ความเนี้ยบในการออกแบบและสไตล์ของหน้าเว็บก่อนส่งมอบงานจริง (ไม่มี Card ซ้อน Card, ใช้สี OKLCH, เลย์เอาต์สมบูรณ์)
- [x] **[MULTI-DEVICE TOPOLOGY SCALING]** อัปเกรด UI (index.html): เพิ่ม Dropdown 'Device Role' และช่องกรอก 'Hardware Model'
- [x] **[MULTI-DEVICE TOPOLOGY SCALING]** พัฒนาลอจิก Dynamic Form: สลับการแสดงผลฟิลด์และการจัดเรียงคอลัมน์ของ VLAN Table ตาม Device Role ที่เลือก (ซ่อนคอลัมน์ SVI IP/DHCP บน L2 Switch, แสดงฟิลด์ WAN/LAN/OSPF/NAT บน Router)
- [x] **[MULTI-DEVICE TOPOLOGY SCALING]** อัปเกรด Generator (generator.js): แยกเงื่อนไขการ Gen สคริปต์ CLI ตามบทบาทอุปกรณ์ (Router: interfaces/NAT/OSPF, L2 Switch: ปิด routing/DHCP และจัดเฉพาะ VLAN database, L3 Switch: ใช้ตามสูตรเดิม)
- [x] **[MULTI-DEVICE TOPOLOGY SCALING]** อัปเกรด app.js: รองรับการเก็บข้อมูล Router, อัปเดตรุ่น Hardware ดีฟอลต์ตาม Role และเพิ่ม Real-time IP Masking ป้องกัน Error บน WAN/LAN IP inputs ของ Router
- [x] **[PRODUCTION GRADE EDGE ROUTER]** เพิ่มฟังก์ชันตั้งค่า Default Gateway IP และสคริปต์ Static Default Route (`ip route 0.0.0.0 0.0.0.0`)
- [x] **[PRODUCTION GRADE EDGE ROUTER]** เพิ่มระบบ Disable IP Domain-Lookup ทั้งระดับ Global Config และ Generator (`no ip domain-lookup`)
- [x] **[PRODUCTION GRADE EDGE ROUTER]** เพิ่มระบบความปลอดภัย Basic WAN Firewall (ACL 100) เพื่อบล็อกพอร์ต SSH/Telnet (22/23) บนขา WAN อินเทอร์เฟซ ป้องกันภัยคุกคามจากภายนอก

## 4. Immediate Next Steps (สิ่งที่ต้องทำต่อไปเมื่อกลับมาปฏิบัติงาน)
1. พัฒนาการทำ **"Integrated Topology"** (การสร้างชุดการตั้งค่าที่เชื่อมโยงและจัด Topology ให้ Router, L3 Core Switch และ L2 Switch ทำงานร่วมกันอย่างไร้รอยต่อภายในโปรเจกต์เดียวกัน)
2. เพิ่มฟีเจอร์ **"DHCP Service บน Router"** เพื่อให้เราเตอร์สามารถจ่าย IP ให้ขา LAN ได้โดยตรงโดยไม่ต้องมี Switch L3 เพิ่มความยืดหยุ่นในระบบเครือข่ายเดี่ยว
3. อัปโหลดโปรเจกต์นี้ขึ้น GitHub Repository ส่วนตัว (เช่น `network-auto-config`) และเปิดใช้งาน GitHub Pages เพื่อแสดงผลงานแบบสาธารณะ

## 5. Critical Constraints (ข้อควรระวังที่ห้ามลืมเด็ดขาด!)
- **Strictly Client-Side:** ห้ามสร้าง Backend Server ทุกอย่างต้องประมวลผลผ่าน Browser ด้วย Vanilla JS
- **Mathematical Accuracy:** การคำนวณ Subnet ต้องใช้ Bitwise Operators (`&`, `|`, `~`) เท่านั้น ห้ามใช้การบวกเลขฐานสิบธรรมดา
- **Impeccable Style:**
  - ห้ามใช้ฟอนต์ Default (Inter, Arial ฯลฯ)
  - ห้ามใช้สี Pure Black (`#000`) หรือ Pure White (`#fff`) ให้ใช้ระบบสี OKLCH
  - ห้ามซ้อน Card (No Nested Cards)
- **Code Quality:** โค้ดต้องสะอาด เป็นโมดูล (Modular) และใส่คอมเมนต์อธิบายการทำงานให้ชัดเจน เพื่อประโยชน์ในการพรีเซนต์งาน