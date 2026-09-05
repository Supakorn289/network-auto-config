/**
 * Network Automation & Subnet Console - Main App Controller
 * 
 * ศูนย์กลางควบคุมแอปพลิเคชัน คอยดักจับ Events และประสานงานโมดูลย่อยทั้งหมด
 */

document.addEventListener('DOMContentLoaded', () => {
    console.log("NET-AUTO Console Core Initialized.");

    // ดึงโมดูล subnet และ generator จาก global namespace
    const NetSubnet = window.NetSubnet;
    const NetGenerator = window.NetGenerator;
    const NetEffects = window.NetEffects;

    // ระบบแจ้งเตือนสไตล์แฮกเกอร์ (Cyber Toast Notification)
    function showCyberToast(message, type = 'success') {
        const oldToast = document.querySelector('.cyber-toast');
        if (oldToast) oldToast.remove();

        const toast = document.createElement('div');
        toast.className = `cyber-toast ${type === 'success' ? 'cyber-toast-success' : ''}`;
        const icon = type === 'success' ? '✔' : 'ℹ';
        
        toast.innerHTML = `
            <span class="cyber-toast-icon">// ${icon}</span>
            <span class="cyber-toast-message">${message}</span>
        `;
        document.body.appendChild(toast);

        // แสดงแจ้งเตือนและเล่นเสียงยืนยันคำสั่ง
        setTimeout(() => {
            toast.classList.add('show');
            if (NetEffects && NetEffects.playBeep) {
                NetEffects.playBeep(1100, 70, 0.02);
            }
        }, 10);

        // ทำลายตัวเองหลังเวลาผ่านไป
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 400);
        }, 3000);
    }

    // ฟังก์ชันปรับปรุงแถวตัวเลขด้านข้างใน Terminal ให้สอดคล้องกับความยาวจริงของสคริปต์
    function updateTerminalLineNumbers(configText) {
        const lineNumbersDiv = document.getElementById('terminal-line-numbers');
        if (lineNumbersDiv) {
            const lineCount = configText.split('\n').length;
            let html = '';
            for (let i = 1; i <= lineCount; i++) {
                html += `<span>${i}</span>`;
            }
            lineNumbersDiv.innerHTML = html;
        }
    }

    // 1. ผูก Real-time Input Masking กับ Input IP หลัก
    const baseIpInput = document.getElementById('subnet-ip');
    if (baseIpInput && NetSubnet) {
        NetSubnet.setupIpMasking(baseIpInput);
    }

    // 2. ผูก Real-time Input Masking กับ IP ของ VLAN เริ่มต้น
    const initialVlanIps = document.querySelectorAll('.vlan-ip-input');
    if (initialVlanIps && NetSubnet) {
        initialVlanIps.forEach(ipInput => NetSubnet.setupIpMasking(ipInput));
    }

    // 2.5 ผูก Real-time IP Masking สำหรับ Router และลอจิกสลับ Dynamic Form
    const routerWanIpInput = document.getElementById('router-wan-ip');
    const routerLanIpInput = document.getElementById('router-lan-ip');
    const routerWanGwInput = document.getElementById('router-wan-gw');
    if (routerWanIpInput && NetSubnet) NetSubnet.setupIpMasking(routerWanIpInput);
    if (routerLanIpInput && NetSubnet) NetSubnet.setupIpMasking(routerLanIpInput);
    if (routerWanGwInput && NetSubnet) NetSubnet.setupIpMasking(routerWanGwInput);

    const deviceRoleSelect = document.getElementById('gen-device-role');
    const hwModelInput = document.getElementById('gen-hw-model');

    const updateFormByDeviceRole = () => {
        if (!deviceRoleSelect) return;
        const role = deviceRoleSelect.value;
        
        // ล้างคลาสสถานะเก่าของ Body และใส่ตัวใหม่
        document.body.classList.remove('device-l3', 'device-router', 'device-l2');
        
        if (role === 'L3_Core_Switch') {
            document.body.classList.add('device-l3');
            if (hwModelInput && (hwModelInput.value === 'ISR 4321' || hwModelInput.value === 'Catalyst 2960')) {
                hwModelInput.value = 'Catalyst 9300';
            }
        } else if (role === 'Edge_Router') {
            document.body.classList.add('device-router');
            if (hwModelInput && (hwModelInput.value === 'Catalyst 9300' || hwModelInput.value === 'Catalyst 2960')) {
                hwModelInput.value = 'ISR 4321';
            }
        } else if (role === 'L2_Access_Switch') {
            document.body.classList.add('device-l2');
            if (hwModelInput && (hwModelInput.value === 'Catalyst 9300' || hwModelInput.value === 'ISR 4321')) {
                hwModelInput.value = 'Catalyst 2960';
            }
        }
    };

    if (deviceRoleSelect) {
        deviceRoleSelect.addEventListener('change', updateFormByDeviceRole);
        updateFormByDeviceRole(); // ทำงานทันทีที่โหลดเสร็จ
    }

    // 3. ฟังก์ชันคำนวณและแสดงผล Subnet (สำหรับแถบคำนวณ Subnet)
    const btnCalculate = document.getElementById('btn-calculate');
    if (btnCalculate && NetSubnet) {
        btnCalculate.addEventListener('click', () => {
            const ip = document.getElementById('subnet-ip').value;
            const cidr = parseInt(document.getElementById('subnet-cidr').value, 10);

            try {
                const result = NetSubnet.calculateSubnet(ip, cidr);
                
                // อัปเดต UI ด้วยค่าที่คำนวณได้
                document.getElementById('val-netmask').textContent = result.subnetMask;
                
                const valNetaddr = document.getElementById('val-netaddr');
                valNetaddr.textContent = result.networkAddress;
                
                const valBroadcast = document.getElementById('val-broadcast');
                valBroadcast.textContent = result.broadcastAddress;
                
                document.getElementById('val-hostrange').textContent = result.usableHostRange;
                
                const valTotalhosts = document.getElementById('val-totalhosts');
                valTotalhosts.textContent = `${result.totalHosts.toLocaleString()} Hosts`;

                // จัดรูปแบบข้อความใน Terminal สำหรับการแสดงผลวิเคราะห์ IP
                const terminalCode = document.getElementById('terminal-code');
                if (terminalCode) {
                    const now = new Date();
                    const timestamp = now.toISOString().replace('T', ' ').substring(0, 19);
                    
                    const outputText = `! --- IP SUBNET ANALYSIS RESULT ---
! Calculated at: ${timestamp}
! Base IP Input: ${ip}/${cidr}
!
! Network Details:
!  - Subnet Mask:      ${result.subnetMask}
!  - Network Address:  ${result.networkAddress}
!  - Broadcast IP:     ${result.broadcastAddress}
!  - Usable IP Range:  ${result.usableHostRange}
!  - Total Host IPs:   ${result.totalHosts}
! -------------------------------------`;
                    
                    terminalCode.textContent = outputText;
                    updateTerminalLineNumbers(outputText);

                    // เล่นเอฟเฟกต์เสียงคำนวณเสร็จสิ้น
                    if (NetEffects && NetEffects.playBeep) {
                        NetEffects.playBeep(1200, 100, 0.04);
                    }
                    showCyberToast("SUBNET CALCULATION SUCCEEDED");
                }

            } catch (error) {
                console.error("Subnet calculation error:", error);
                showCyberToast(`ERROR: ${error.message}`, "error");
            }
        });
    }

    // 4. ลอจิกการจัดการปุ่มแท็บ (Tab Switching) ใน UI
    const navButtons = document.querySelectorAll('.nav-btn');
    navButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            navButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const targetId = btn.getAttribute('data-target');
            const sections = document.querySelectorAll('.form-section');
            sections.forEach(sec => {
                if (sec.id === targetId) {
                    sec.classList.add('active');
                } else {
                    sec.classList.remove('active');
                }
            });
        });
    });

    // 5. จัดการปุ่มลบ VLAN (สำหรับปุ่มเริ่มต้นที่มีอยู่ใน HTML)
    const vlanList = document.getElementById('vlan-list');
    if (vlanList) {
        vlanList.addEventListener('click', (e) => {
            if (e.target.classList.contains('btn-remove-vlan')) {
                const row = e.target.closest('.vlan-row');
                // อนุญาตให้ลบได้ถ้ามีแถวมากกว่า 1 แถว เพื่อป้องกันการไม่มี VLAN เลย
                if (vlanList.querySelectorAll('.vlan-row').length > 1) {
                    row.remove();
                    showCyberToast("VLAN SEGMENT REMOVED");
                } else {
                    showCyberToast("WARNING: AT LEAST 1 VLAN IS REQUIRED", "error");
                }
            }
        });
    }

    // 6. เพิ่ม VLAN แถวใหม่พร้อมผูก IP Masking อัตโนมัติ และ Port Range prediction
    const btnAddVlan = document.getElementById('btn-add-vlan');
    if (btnAddVlan && vlanList) {
        btnAddVlan.addEventListener('click', () => {
            const rows = vlanList.querySelectorAll('.vlan-row');
            const nextIndex = rows.length > 0 
                ? parseInt(rows[rows.length - 1].getAttribute('data-vlan-index'), 10) + 1 
                : 0;

            // คาดเดาค่าเริ่มต้นสำหรับ VLAN ใหม่ตามแถวล่าสุด
            let nextVlanId = 30;
            let nextVlanName = "Guest";
            let nextIp = "192.168.30.1";
            let nextPorts = "0/21-24";

            if (rows.length > 0) {
                const lastRow = rows[rows.length - 1];
                const lastId = parseInt(lastRow.querySelector('.vlan-id-input').value, 10);
                if (!isNaN(lastId)) {
                    nextVlanId = lastId + 10;
                }
                nextVlanName = `Segment_${nextVlanId}`;
                
                const lastIpVal = lastRow.querySelector('.vlan-ip-input').value;
                const ipParts = lastIpVal.split('.');
                if (ipParts.length === 4) {
                    const thirdOctet = parseInt(ipParts[2], 10);
                    if (!isNaN(thirdOctet)) {
                        ipParts[2] = (thirdOctet + 10).toString();
                        // หากเกิน 254 ให้รีเซ็ต
                        if (thirdOctet + 10 > 254) ipParts[2] = "10";
                        nextIp = ipParts.join('.');
                    }
                }

                // คาดเดาช่วงพอร์ตถัดไป
                const lastPortsInput = lastRow.querySelector('.vlan-port-input');
                if (lastPortsInput) {
                    const lastPortsVal = lastPortsInput.value;
                    const portRegex = /(\d+)\/(\d+)-(\d+)/;
                    const match = lastPortsVal.match(portRegex);
                    if (match) {
                        const slot = match[1];
                        const start = parseInt(match[2], 10);
                        const end = parseInt(match[3], 10);
                        const rangeSize = end - start + 1;
                        const nextStart = end + 1;
                        const nextEnd = nextStart + rangeSize - 1;
                        nextPorts = `${slot}/${nextStart}-${nextEnd}`;
                    }
                }
            }

            const newRow = document.createElement('div');
            newRow.className = 'vlan-row';
            newRow.setAttribute('data-vlan-index', nextIndex);
            newRow.innerHTML = `
              <div class="vlan-field vlan-id-col">
                <label class="sr-only">VLAN ID</label>
                <input type="number" class="vlan-id-input" placeholder="ID" value="${nextVlanId}" min="2" max="4094" required title="VLAN ID (2-4094)">
              </div>
              <div class="vlan-field vlan-name-col">
                <label class="sr-only">VLAN Name</label>
                <input type="text" class="vlan-name-input" placeholder="Name" value="${nextVlanName}" required title="VLAN Name">
              </div>
              <div class="vlan-field vlan-ip-col">
                <label class="sr-only">IP Address</label>
                <input type="text" class="vlan-ip-input" placeholder="IP (e.g. 192.168.30.1)" value="${nextIp}" required title="SVI IP Address">
              </div>
              <div class="vlan-field vlan-port-col">
                <label class="sr-only">Port Range</label>
                <input type="text" class="vlan-port-input" placeholder="Ports (e.g. 0/21-24)" value="${nextPorts}" title="Switchport Access Ports">
              </div>
              <div class="vlan-field vlan-mask-col">
                <label class="sr-only">CIDR</label>
                <select class="vlan-cidr-select" title="Subnet Prefix">
                  <option value="30">/30</option>
                  <option value="29">/29</option>
                  <option value="28">/28</option>
                  <option value="27">/27</option>
                  <option value="26">/26</option>
                  <option value="25">/25</option>
                  <option value="24" selected>/24</option>
                  <option value="16">/16</option>
                </select>
              </div>
              <div class="vlan-field vlan-dhcp-col">
                <label class="checkbox-label" title="Enable DHCP pool for this VLAN">
                  <input type="checkbox" class="vlan-dhcp-check" checked>
                  <span>DHCP</span>
                </label>
              </div>
              <button type="button" class="btn-remove-vlan" title="Delete VLAN">×</button>
            `;

            vlanList.appendChild(newRow);
            showCyberToast(`VLAN ${nextVlanId} SEGMENT ADDED`);

            // ผูก Input Masking ให้กับ VLAN IP ช่องใหม่
            const newIpInput = newRow.querySelector('.vlan-ip-input');
            if (newIpInput && NetSubnet) {
                NetSubnet.setupIpMasking(newIpInput);
            }
        });
    }

    // 8. รันสคริปต์ Cisco IOS CLI (COMPILE CISCO IOS)
    const btnGenerate = document.getElementById('btn-generate');
    if (btnGenerate && NetGenerator) {
        btnGenerate.addEventListener('click', () => {
            const hostname = document.getElementById('gen-hostname').value;
            const enableSecret = document.getElementById('gen-secret').value;
            const bannerMotd = document.getElementById('gen-motd').value;
            const enableSsh = document.getElementById('gen-enable-ssh').checked;
            const portType = document.getElementById('gen-port-type').value;
            const deviceRole = document.getElementById('gen-device-role').value;
            const hwModel = document.getElementById('gen-hw-model').value.trim();
            const disableDns = document.getElementById('gen-disable-dns').checked;

            // รวบรวมข้อมูลตาม Device Role
            let vlans = [];
            let routerConfig = {};
            let hasError = false;

            if (deviceRole === 'Edge_Router') {
                const wanIf = document.getElementById('router-wan-if').value.trim();
                const wanIp = document.getElementById('router-wan-ip').value.trim();
                const wanCidr = parseInt(document.getElementById('router-wan-cidr').value, 10);
                const wanGw = document.getElementById('router-wan-gw').value.trim();
                const lanIf = document.getElementById('router-lan-if').value.trim();
                const lanIp = document.getElementById('router-lan-ip').value.trim();
                const lanCidr = parseInt(document.getElementById('router-lan-cidr').value, 10);
                const ospfPid = parseInt(document.getElementById('router-ospf-pid').value, 10);
                const ospfArea = parseInt(document.getElementById('router-ospf-area').value, 10);
                const enableOspf = document.getElementById('router-enable-ospf').checked;
                const enableNat = document.getElementById('router-enable-nat').checked;
                const blockSsh = document.getElementById('router-block-ssh').checked;

                if (wanIf === "" || lanIf === "") {
                    showCyberToast("ERROR: INTERFACE NAMES CANNOT BE EMPTY", "error");
                    return;
                }

                // รูปแบบ IP Address format check
                const ipRegex = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/;
                if (!ipRegex.test(wanIp)) {
                    showCyberToast(`ERROR: INVALID WAN IP '${wanIp}'`, "error");
                    return;
                }
                if (!ipRegex.test(lanIp)) {
                    showCyberToast(`ERROR: INVALID LAN IP '${lanIp}'`, "error");
                    return;
                }
                if (wanGw !== "" && !ipRegex.test(wanGw)) {
                    showCyberToast(`ERROR: INVALID DEFAULT GATEWAY IP '${wanGw}'`, "error");
                    return;
                }

                if (enableOspf && (isNaN(ospfPid) || ospfPid < 1 || ospfPid > 65535)) {
                    showCyberToast("ERROR: INVALID OSPF PROCESS ID (1-65535)", "error");
                    return;
                }
                if (enableOspf && (isNaN(ospfArea) || ospfArea < 0)) {
                    showCyberToast("ERROR: INVALID OSPF AREA", "error");
                    return;
                }

                routerConfig = {
                    wanIf,
                    wanIp,
                    wanCidr,
                    wanGw,
                    lanIf,
                    lanIp,
                    lanCidr,
                    ospfPid,
                    ospfArea,
                    enableOspf,
                    enableNat,
                    blockSsh
                };
            } else {
                // รวบรวมข้อมูล VLANs จากตาราง
                const vlanRows = document.querySelectorAll('#vlan-list .vlan-row');
                
                vlanRows.forEach(row => {
                    const idVal = parseInt(row.querySelector('.vlan-id-input').value, 10);
                    const nameVal = row.querySelector('.vlan-name-input').value.trim();
                    const ipVal = row.querySelector('.vlan-ip-input').value.trim();
                    const portRangeVal = row.querySelector('.vlan-port-input').value.trim();
                    const cidrVal = parseInt(row.querySelector('.vlan-cidr-select').value, 10);
                    const dhcpVal = row.querySelector('.vlan-dhcp-check').checked;

                    // ตรวจสอบความถูกต้องเบื้องต้นของ VLAN Row
                    if (isNaN(idVal) || idVal < 2 || idVal > 4094) {
                        showCyberToast(`ERROR: INVALID VLAN ID ${idVal}`, "error");
                        hasError = true;
                        return;
                    }

                    if (nameVal === "") {
                        showCyberToast("ERROR: VLAN NAME CANNOT BE EMPTY", "error");
                        hasError = true;
                        return;
                    }

                    // L2 Switch ไม่จำเป็นต้องเช็ค SVI IP (ถูกซ่อน)
                    if (deviceRole !== 'L2_Access_Switch') {
                        const ipRegex = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/;
                        if (!ipRegex.test(ipVal)) {
                            showCyberToast(`ERROR: INVALID IP '${ipVal}' ON VLAN ${idVal}`, "error");
                            hasError = true;
                            return;
                        }
                    }

                    vlans.push({
                        id: idVal,
                        name: nameVal,
                        ip: ipVal,
                        portRange: portRangeVal,
                        cidr: cidrVal,
                        dhcp: dhcpVal
                    });
                });

                if (hasError) return;

                // ตรวจสอบ VLAN ID ซ้ำ
                const vlanIds = vlans.map(v => v.id);
                const duplicates = vlanIds.filter((item, index) => vlanIds.indexOf(item) !== index);
                if (duplicates.length > 0) {
                    showCyberToast(`ERROR: DUPLICATE VLAN ID DETECTED (${duplicates[0]})`, "error");
                    return;
                }
            }

            try {
                // เปลี่ยนสถานะปุ่มชั่วคราวและใช้ Scramble Text Effect เพิ่มความเท่
                const btnLabel = btnGenerate.querySelector('.btn-label') || btnGenerate;
                
                if (NetEffects && NetEffects.scrambleText) {
                    NetEffects.scrambleText(btnLabel, "COMPILING IOS...", 500);
                }

                setTimeout(() => {
                    const ciscoConfig = NetGenerator.generateCiscoConfig({
                        hostname,
                        enableSecret,
                        bannerMotd,
                        enableSsh,
                        portType,
                        vlans,
                        deviceRole,
                        hwModel,
                        routerConfig,
                        disableDns
                    });

                    // อัปเดต Terminal
                    const terminalCode = document.getElementById('terminal-code');
                    if (terminalCode) {
                        terminalCode.textContent = ciscoConfig;
                        updateTerminalLineNumbers(ciscoConfig);
                        
                        // เลื่อนสกรอลล์กลับไปด้านบนสุด
                        const terminalBody = terminalCode.closest('.terminal-body');
                        if (terminalBody) terminalBody.scrollTop = 0;
                    }

                    if (NetEffects && NetEffects.playBeep) {
                        NetEffects.playBeep(1400, 180, 0.05);
                    }
                    showCyberToast("CISCO IOS CONFIG COMPILED SUCCESSFULLY");
                }, 500);

            } catch (err) {
                console.error("Config compilation error:", err);
                showCyberToast(`ERROR: ${err.message}`, "error");
            }
        });
    }

    // 9. ทำปุ่ม Copy to Clipboard ใช้งานได้จริง
    const btnCopyCode = document.getElementById('btn-copy-code');
    if (btnCopyCode) {
        btnCopyCode.addEventListener('click', () => {
            const terminalCode = document.getElementById('terminal-code');
            if (!terminalCode) return;

            const text = terminalCode.textContent;
            
            // ตรวจสอบว่ามีสคริปต์จริงหรือไม่
            if (text.includes("Press \"COMPILE CISCO IOS\"")) {
                showCyberToast("WARNING: COMPILE CONFIG BEFORE COPYING", "error");
                return;
            }

            navigator.clipboard.writeText(text).then(() => {
                showCyberToast("CONFIG COPIED TO CLIPBOARD // NODE_SECURE");
            }).catch(err => {
                console.error("Clipboard copy error:", err);
                
                // Fallback copy สำหรับเบราว์เซอร์ที่ไม่ซัพพอร์ต writeText
                try {
                    const textarea = document.createElement('textarea');
                    textarea.value = text;
                    textarea.style.position = 'fixed';
                    document.body.appendChild(textarea);
                    textarea.select();
                    document.execCommand('copy');
                    document.body.removeChild(textarea);
                    showCyberToast("CONFIG COPIED TO CLIPBOARD // FALLBACK_SUCCESS");
                } catch (fallbackErr) {
                    showCyberToast("CLIPBOARD WRITE FAILED", "error");
                }
            });
        });
    }

    // 10. ทำปุ่ม Download Script ใช้งานได้จริง
    const btnDownloadCode = document.getElementById('btn-download-code');
    if (btnDownloadCode) {
        btnDownloadCode.addEventListener('click', () => {
            const terminalCode = document.getElementById('terminal-code');
            if (!terminalCode) return;

            const text = terminalCode.textContent;
            
            if (text.includes("Press \"COMPILE CISCO IOS\"")) {
                showCyberToast("WARNING: COMPILE CONFIG BEFORE DOWNLOADING", "error");
                return;
            }

            const hostname = document.getElementById('gen-hostname').value || "Core-SW";
            const sanitizedHostname = hostname.replace(/[^a-z0-9_-]/gi, '_').toLowerCase();

            try {
                const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${sanitizedHostname}_cisco_ios.cfg`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
                showCyberToast(`CONFIG DOWNLOADED: ${sanitizedHostname}_cisco_ios.cfg`);
            } catch (err) {
                console.error("Download file error:", err);
                showCyberToast("FILE DOWNLOAD FAILED", "error");
            }
        });
    }

    // 11. จัดการนาฬิกาบน HUD
    const clockEl = document.getElementById('hud-clock');
    if (clockEl) {
        const updateClock = () => {
            const now = new Date();
            const pad = (n) => n.toString().padStart(2, '0');
            clockEl.textContent = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
        };
        setInterval(updateClock, 1000);
        updateClock(); // อัปเดตทันที
    }
});
