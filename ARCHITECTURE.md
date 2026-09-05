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
## 3. Topology-first v2 Architecture (2026-09-05)

```text
Device Catalog / Feature Registry
            ↓
Topology Graph (nodes + logical links)
            ↓
Validation + Link Inference + Port Assignment
            ↓
Intent Questions (per device + per link)
            ↓
Automatic IP Plan
            ↓
Per-device Config Engine
            ↓
Packet Tracer Test Checklist
```

### New modules
- `js/catalog.js`: Single source of truth for device profiles and supported question set
- `js/topology.js`: topology graph, IP plan, logical link inference and validation
- `js/config-engine.js`: transforms topology + intent into per-device scripts/guides
- `tests/netauto.test.js`: deterministic tests for subnet/topology/config behavior

### Design rule
UI must never manually duplicate device features. The UI asks questions by reading `profile.features` from the catalog. This is required so future Packet Tracer model profiles can be added without rebuilding the workflow.


## 4. v2.3 Network Intent Rules

```text
Base IPv4 only (x.x.x.x)
        ↓
Auto CIDR inference
        ↓
Subnet summary (mask/network/broadcast/range/hosts)
        ↓
Feature Registry
   ┌────┴────┐
No VLAN    VLAN feature selected
   ↓           ↓
Flat LAN    Conditional VLAN Plan
   └────┬──────┘
        ↓
Topology-aware Config Engine
```

- `Topology.usesVlans()` is the single decision point for whether custom VLAN configuration is active.
- Hidden VLAN definitions are never emitted into config while VLAN intent is disabled.
- `state.flatNetwork` stores the auto-detected non-VLAN LAN segment.
- Link mode `auto` is preserved; `resolvedMode` is derived from topology + current VLAN intent so enabling VLAN later can change Switch↔Switch or Router↔L2 from flat access to trunk without rebuilding links.
