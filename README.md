## Automatic Network Plan + Conditional VLAN — v2.3

- Base Network รับเฉพาะ IPv4 `x.x.x.x`; ผู้ใช้ไม่ต้องกรอก `/xx`
- `subnet.js` เดา CIDR จากรูปแบบ network-style address เช่น `10.10.0.0 → /16`, `192.168.1.0 → /24` แล้วคำนวณ Subnet Mask, Network, Broadcast, Usable Range และ Host count
- Step 1 ไม่มี VLAN form แล้ว
- VLAN Plan ถูกย้ายไป Step 2 และจะแสดงเฉพาะเมื่อเปิดฟังก์ชันที่ต้องใช้ Custom VLAN
- ถ้าไม่ใช้ VLAN ระบบวาง IP แบบ Flat Network และ config จะไม่สร้าง `vlan`, `switchport access vlan` หรือ VLAN-specific commands ที่ไม่จำเป็น
- Automated tests ล่าสุด: **17/17 ผ่าน**

## Responsive Web Design — v2.2

NET-AUTO v2.2 รองรับ Desktop, Tablet และ Phone แบบ touch-first: header/action ไม่ถูกซ่อน, Device Library เปลี่ยนเป็น horizontal shelf บนมือถือ, topology node ปรับขนาดตาม breakpoint, node/link coordinates clamp ตาม canvas จริงเมื่อ resize/หมุนจอ, form/control มี touch target ที่เหมาะสม และ output config เลื่อนแนวนอนได้โดยไม่ดัน viewport ล้น.

## Visual Device Library

NET-AUTO v2.1 adds optimized router/network artwork to the header, device palette, topology nodes, inspector, and intent questions. Device images are representative visuals mapped by device family so every catalog profile has a recognizable image without changing the topology/config engine.

# NET-AUTO v2 — Topology-first Network Configuration Generator

เว็บ Client-Side สำหรับผู้เริ่มต้นที่ต้องการออกแบบ Network แบบลากวาง แล้วให้ระบบแปลง Topology + ความต้องการเป็น Cisco/Packet Tracer configuration แยกตามอุปกรณ์

## User Flow
1. **Topology** — ลากอุปกรณ์จาก Device Library ไปวางบน workspace
2. **Connect** — กด `เชื่อมอุปกรณ์` แล้วคลิกอุปกรณ์ตัวแรกและตัวที่สอง ไม่ต้องเลือกชนิดสาย
3. **Network Plan** — กรอก Base Network เฉพาะ `x.x.x.x`; ระบบหา CIDR/Subnet ให้อัตโนมัติ
4. **Feature Questions** — ระบบถามฟังก์ชันของอุปกรณ์แต่ละประเภทจาก Feature Registry; ถ้าเลือกฟังก์ชัน VLAN จึงค่อยแสดง VLAN Plan
5. **Link Intent** — ตรวจ/แก้ Access, Trunk, Routed L3; ช่อง Access VLAN/Allowed VLANs จะแสดงเฉพาะเมื่อใช้ VLAN
6. **Generate** — ระบบคำนวณ IP, จองพอร์ต และสร้าง config/guide แยกทุกอุปกรณ์
7. **Verify** — นำไปทดลองใน Cisco Packet Tracer ตาม Test Checklist ก่อนใช้งานจริง

## Architecture
- `js/catalog.js` — Device Catalog + Feature Registry
- `js/topology.js` — Topology graph, validation, link inference, port assignment, IP planning
- `js/config-engine.js` — topology-aware config generator
- `js/subnet.js` — IPv4 validation, automatic CIDR inference และ subnet calculation using bitwise operators
- `js/app.js` — UI controller / drag-drop / connection / workflow
- `tests/netauto.test.js` — Node.js tests for core logic

## Current Catalog
Catalog มี profile แบบ Packet Tracer-oriented มากกว่า 50 รายการ ครอบคลุม Router, L2/L3 Switch, ASA/Meraki, WLC/AP, WAN infrastructure, End Device, Server, IP Phone และ IoT พร้อม `Custom / Other Packet Tracer Device` สำหรับรุ่นเฉพาะที่ยังไม่มี profile ตรงรุ่น

> Packet Tracer มี device/IOS feature แตกต่างกันตามเวอร์ชัน รุ่น และ image. ระบบจึงออกแบบ catalog-driven เพื่อเพิ่ม profile/feature ต่อได้โดยไม่ต้องเขียน UI ใหม่

## Run
เปิด `index.html` ได้โดยตรง หรือใช้ static server เช่น:

```bash
python -m http.server 8000
```

## Test
```bash
npm test
```

## Important
- ระบบทำงานบน Browser 100% ไม่มี Backend
- Config ต้องทดสอบใน Cisco Packet Tracer ก่อนเสมอ
- ฟังก์ชันที่ขึ้นกับ IOS/model โดยเฉพาะ BGP, DAI, DHCP Snooping, ASA policy และ Industrial device ควรตรวจ command support ในรุ่นเป้าหมาย
