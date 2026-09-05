# UI/UX Design Context & Aesthetic Blueprint

## 1. Theme & Vibe (Cyberpunk / High-Tech Hacker)
- **Concept:** นำเสนอภาพลักษณ์ของ Network & Security Console ที่มีความล้ำสมัย ดุดัน แต่แฝงไปด้วยความเรียบหรู (Premium Cyber)
- **Background Visuals (วิดีโอ หรือ 3D):** - ใช้แบ็คกราวด์เป็นวิดีโอแบบ Looping สั้นๆ (เช่น เส้นสาย Data Flow, กราฟิก Topology ของเน็ตเวิร์กที่เคลื่อนไหวช้าๆ) หรือการฝัง 3D Model แบบ Lightweight (เช่น Spline 3D) ที่ผู้ใช้สามารถขยับเมาส์แล้วมี Interaction เล็กน้อย
  - **ข้อกําหนด:** พื้นหลังต้องถูกครอบทับด้วย Overlay บางๆ เพื่อไม่ให้รบกวนการอ่านข้อมูล (Content is King)

## 2. Impeccable Typography & Color Palette
- **Colors (OKLCH System):** - **Background:** ห้ามใช้ดำสนิท ให้ใช้สีเทาเข้มเจือน้ำเงิน/ม่วง (Tinted Dark Obsidian หรือ Deep Cyber Navy) เพื่อให้มีมิติ
  - **Accents (สีไฮไลต์):** ใช้สีโทนสว่างที่มีพลัง เช่น "Terminal Green", "Electric Cyan", หรือ "Neon Purple" แบบแมตต์ (ไม่สว่างจ้าจนแสบตา) นำมาใช้แต้มเฉพาะจุดสำคัญ เช่น ปุ่มกด หรือสถานะการ Gen โค้ด
- **Typography:**
  - **Headings/UI Text:** ใช้ฟอนต์แนว Technical หรือ Geometric Sans-serif ที่ดูทันสมัยและมีโครงสร้างชัดเจน
  - **Data/Code Output:** บังคับใช้ฟอนต์ตระกูล Monospace (เช่น Fira Code, JetBrains Mono, หรือ Space Mono) สำหรับกล่องแสดงผล Script และ IP เพื่อดึงอารมณ์ของการพิมพ์ Command Line

## 3. UI Patterns & Layout
- **Glassmorphism (กระจกฝ้า):** โครงสร้างฟอร์มกรอกข้อมูลและกล่องแสดงผล จะไม่ใช้ Card สีทึบ แต่จะใช้เอฟเฟกต์กระจกฝ้า (Blur Backdrop) ที่โปร่งแสงเล็กน้อย เพื่อให้มองเห็นความเคลื่อนไหวของวิดีโอ/3D ด้านหลังได้อย่างมีระดับ
- **Terminal-Inspired Elements:** กล่อง Output ของคำสั่ง Cisco CLI จะต้องจำลองหน้าตาให้คล้ายกับ Terminal Window ของจริง (มีปุ่มจำลอง 3 ปุ่มที่มุมซ้ายบน) และมีการไฮไลต์ Syntax สีต่างๆ ให้แยกแยะคำสั่งและตัวแปรได้ง่าย
- **Asymmetrical & Grid Layout:** จัดวางเลย์เอาต์แบบชิดซ้าย ผสานเส้นตาราง (Grid Lines) บางๆ จางๆ ในพื้นหลัง เพื่อเสริมความรู้สึกเป็นระบบปฏิบัติการขั้นสูง

## 4. Motion & Interaction
- **Micro-interactions:** ปุ่มป้อนข้อมูลหรือปุ่ม Generate จะมีการเรืองแสง (Glow Effect) บางๆ เมื่อเอาเมาส์ไปชี้ (Hover)
- **Data Loading Vibe:** เมื่อกดปุ่มประมวลผล ให้มีเอฟเฟกต์การสุ่มตัวอักษรแบบแฮกเกอร์ (Scramble Text Effect) สั้นๆ ประมาณ 0.5 วินาที ก่อนจะแสดงผลลัพธ์ Script เพื่อเพิ่มความตื่นเต้นและประสบการณ์ที่ดูล้ำสมัย