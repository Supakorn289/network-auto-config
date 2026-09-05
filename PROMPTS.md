# AI Prompt Library (คลังคำสั่งสำหรับผู้ช่วย AI)

ไฟล์นี้รวบรวมชุดคำสั่ง (Prompts) แบบสำเร็จรูป เพื่อให้ AI เข้าใจบริบทและสร้างโค้ดแต่ละส่วนของระบบตามสถาปัตยกรรม (ARCHITECTURE.md) และข้อกำหนดด้านการออกแบบ (DESIGN.md) ได้อย่างแม่นยำ

## 1. ฐานราก UI และโครงสร้างหน้าเว็บ (HTML & CSS)
**Command:** `/build-ui`
**Prompt:** "ช่วยสร้างไฟล์ `index.html` และ `style.css` ตามโครงสร้างใน ARCHITECTURE.md โดยยึดหลักธีม Cyberpunk/Hacker และใช้ Glassmorphism ตาม DESIGN.md อย่างเคร่งครัด ขอฟอร์มรับค่า 2 ส่วนคือ Subnet Calculator และ Auto-Config Generator (มีปุ่มเพิ่ม VLAN) ห้ามใช้ฟอนต์ Default ห้ามใช้สี Pure Black/White และใช้ระบบสี OKLCH"

## 2. สมองกลคำนวณเครือข่าย (Subnet Logic)
**Command:** `/build-subnet-logic`
**Prompt:** "สร้างไฟล์ `/js/subnet.js` สำหรับจัดการคณิตศาสตร์เครือข่าย เขียนฟังก์ชันรับค่า IP Address และ CIDR แล้วประมวลผลด้วย Bitwise Operators (&, |, ~) เพื่อหาค่า Network Address, Broadcast Address และ Usable Hosts รีเทิร์นค่ากลับมาเป็น Object ที่พร้อมนำไปแสดงผลบน UI"

## 3. ระบบสร้างสคริปต์ Cisco CLI (Generator Logic)
**Command:** `/build-generator-logic`
**Prompt:** "สร้างไฟล์ `/js/generator.js` เพื่อทำหน้าที่ Template Engine รับค่า Object (เช่น VLAN ID, IP, Subnet) มาวน Loop สร้างชุดคำสั่ง Command Line สำหรับตั้งค่า Cisco Switch และ Router (ครอบคลุม VLAN, Interface, DHCP) ให้ผลลัพธ์เป็น String ข้อความที่จัดบรรทัดอย่างถูกต้อง พร้อมสำหรับการ Copy ไปวางในคอนโซล"

## 4. ลูกเล่นและเอฟเฟกต์ (UI Interactions & Effects)
**Command:** `/build-hacker-effects`
**Prompt:** "สร้างไฟล์ `/js/effects.js` เพื่อจัดการ Micro-interactions ขอฟังก์ชัน 'Scramble Text Effect' (สุ่มตัวอักษรแบบแฮกเกอร์) ความยาว 0.5 วินาที สำหรับใช้ตอนกดปุ่ม Generate และสร้างโค้ดสำหรับจัดการวิดีโอแบ็คกราวด์ (Looping Video) ให้อยู่ด้านหลังสุดโดยมี Overlay บางๆ ทับไว้"

## 5. ศูนย์กลางควบคุม (Main Controller)
**Command:** `/build-app-controller`
**Prompt:** "สร้างไฟล์ `/js/app.js` เพื่อเป็น Main Controller คอยดักจับ Event Listeners จาก UI ใน `index.html` (เช่น การคลิกปุ่ม Generate, ปุ่มเพิ่ม VLAN, ปุ่ม Copy to Clipboard) แล้วเรียกใช้งานฟังก์ชันจาก `subnet.js`, `generator.js`, และ `effects.js` ให้ทำงานประสานกันอย่างสมบูรณ์แบบ"

## 6. ตรวจสอบความเนี้ยบ (Impeccable Audit)
**Command:** `/audit-impeccable`
**Prompt:** "ช่วยตรวจสอบโค้ดใน `style.css` และ `index.html` ว่าละเมิดกฎของ Impeccable.style หรือไม่ (เช่น มี Nested Cards หรือไม่, ใช้ฟอนต์/สีที่ห้ามไว้หรือเปล่า) หากมีให้ช่วย Refactor โค้ดใหม่ให้ถูกต้องและดูพรีเมียมที่สุด"