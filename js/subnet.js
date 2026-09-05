/**
 * Network Automation & Subnet Console - Subnet Math Logic
 * 
 * ไฟล์นี้ทำหน้าที่คำนวณค่า IPv4 Subnetting โดยใช้ Bitwise Operators
 * และจัดการ Real-time Input Masking สำหรับ IP Address เพื่อลดข้อผิดพลาด
 */

/**
 * แปลง IP Address ในรูปแบบ String (เช่น "192.168.1.1") ให้เป็น 32-bit Unsigned Integer
 * @param {string} ip - IP address string
 * @returns {number} 32-bit unsigned integer ของ IP Address
 */
function ipToInt(ip) {
    return ip.split('.').reduce((acc, octet) => {
        return (acc << 8) + parseInt(octet, 10);
    }, 0) >>> 0;
}

/**
 * แปลง 32-bit Unsigned Integer กลับเป็น IP Address ในรูปแบบ String (เช่น "192.168.1.1")
 * @param {number} int - 32-bit unsigned integer
 * @returns {string} IP address string
 */
function intToIp(int) {
    return [
        (int >>> 24) & 255,
        (int >>> 16) & 255,
        (int >>> 8) & 255,
        int & 255
    ].join('.');
}

/**
 * คำนวณ IPv4 Subnet parameters โดยใช้ Bitwise Operators (&, |, ~)
 * @param {string} ip - IP Address string (เช่น "192.168.1.1")
 * @param {number} cidr - CIDR Prefix (เช่น 24)
 * @returns {Object} ผลลัพธ์การคำนวณ Subnet
 */
function calculateSubnet(ip, cidr) {
    // 1. ตรวจสอบข้อมูลนำเข้าเบื้องต้น
    if (!ip || isNaN(cidr) || cidr < 0 || cidr > 32) {
        throw new Error("ข้อมูล IP หรือ CIDR ไม่ถูกต้อง");
    }

    const ipInt = ipToInt(ip);

    // 2. สร้าง Subnet Mask 32-bit โดยใช้ Bitwise Shift และ NOT
    // กรณี cidr = 0 (0.0.0.0/0) ให้ mask = 0
    // สำหรับกรณีปกติ ใช้ ~0 (1 ทั้งหมด) เลื่อนบิตไปทางซ้ายตามจำนวนบิตของ host (32 - cidr)
    const mask = cidr === 0 ? 0 : (~0 << (32 - cidr)) >>> 0;
    const netmask = intToIp(mask);

    // 3. หา Network Address ด้วย Bitwise AND (&)
    const netInt = (ipInt & mask) >>> 0;
    const networkAddress = intToIp(netInt);

    // 4. หา Broadcast Address ด้วย Bitwise OR (|) และ NOT (~)
    const bcInt = (ipInt | ~mask) >>> 0;
    const broadcastAddress = intToIp(bcInt);

    // 5. คำนวณ Usable Hosts Range และ Total Hosts
    let firstUsable = "";
    let lastUsable = "";
    let totalHosts = 0;

    if (cidr === 32) {
        firstUsable = networkAddress;
        lastUsable = networkAddress;
        totalHosts = 1;
    } else if (cidr === 31) {
        firstUsable = networkAddress;
        lastUsable = broadcastAddress;
        totalHosts = 2;
    } else {
        // ช่วง IP ใช้งานได้เริ่มจาก Network Address + 1 ถึง Broadcast Address - 1
        const firstInt = (netInt + 1) >>> 0;
        const lastInt = (bcInt - 1) >>> 0;
        
        firstUsable = intToIp(firstInt);
        lastUsable = intToIp(lastInt);
        totalHosts = (bcInt - netInt - 1) >>> 0;
    }

    const usableHostRange = totalHosts > 0 
        ? `${firstUsable} - ${lastUsable}` 
        : "N/A (No Usable Hosts)";

    return {
        subnetMask: netmask,
        networkAddress: networkAddress,
        broadcastAddress: broadcastAddress,
        firstUsableHost: firstUsable,
        lastUsableHost: lastUsable,
        usableHostRange: usableHostRange,
        totalHosts: totalHosts,
        cidr: cidr
    };
}

/**
 * ติดตั้ง Real-time Input Masking ให้กับ Text Input สำหรับกรอก IP Address
 * @param {HTMLInputElement} inputElement - อิลิเมนต์ <input> ที่ต้องการ
 */
function setupIpMasking(inputElement) {
    if (!inputElement) return;

    // ดักจับคีย์บอร์ดเพื่อป้องกันการพิมพ์อักษรแปลกปลอมตั้งแต่แรก
    inputElement.addEventListener('keypress', function(e) {
        const char = String.fromCharCode(e.which || e.keyCode);
        if (!/[0-9.]/.test(char)) {
            e.preventDefault();
        }
    });

    // ตรวจสอบและจัดฟอร์แมต IP address แบบเรียลไทม์ (Real-time Input Masking)
    inputElement.addEventListener('input', function(e) {
        let value = this.value;
        
        // ลบอักขระที่ไม่ใช่ตัวเลขหรือจุดออกทั้งหมด
        value = value.replace(/[^0-9.]/g, '');
        
        let parts = value.split('.');
        
        // จำกัดไม่ให้มีเกิน 4 octets
        if (parts.length > 4) {
            parts = parts.slice(0, 4);
        }
        
        let shouldAppendDot = false;
        
        for (let i = 0; i < parts.length; i++) {
            let part = parts[i];
            
            // จำกัดแต่ละ octet ให้มีความยาวไม่เกิน 3 ตัวอักษร
            if (part.length > 3) {
                part = part.slice(0, 3);
            }
            
            // ตรวจสอบค่าไม่ให้เกิน 255
            if (part !== '') {
                const num = parseInt(part, 10);
                if (num > 255) {
                    part = '255';
                }
                
                // จัดการเลข 0 ที่อาจกรอกซ้ำโดยไม่ได้ตั้งใจ (เช่น "05" -> "5", ยอมรับ "0" ตัวเดียว)
                if (part.length > 1 && part.startsWith('0') && part !== '0') {
                    part = num.toString();
                }
            }
            
            parts[i] = part;
            
            // Auto-dotting: เติมจุดให้อัตโนมัติเมื่อผู้ใช้พิมพ์ครบ 3 ตัว
            // และขณะนั้นเป็น octet ปัจจุบันที่กำลังพิมพ์อยู่ (ไม่ใช่ตัวสุดท้ายที่ 4)
            if (part.length === 3 && i < 3 && parts.length === i + 1) {
                shouldAppendDot = true;
            }
        }
        
        this.value = parts.join('.');
        
        // เติมจุดต่อท้ายถ้าผ่านเงื่อนไข Auto-dotting
        if (shouldAppendDot && this.value.split('.').length < 4) {
            this.value += '.';
        }
    });

    // ดักจับตอนเบลอ (focusout) เพื่อตรวจสอบความสมบูรณ์ของ IP
    inputElement.addEventListener('blur', function() {
        let value = this.value;
        if (!value) return;

        let parts = value.split('.');
        
        // หากกรอกจุดค้างไว้ท้ายสุด ให้ลบออก
        if (parts[parts.length - 1] === '') {
            parts.pop();
        }

        // เติม octet ที่ขาดให้ครบ 4 octets ด้วย "0"
        while (parts.length < 4) {
            parts.push('0');
        }

        // สำหรับแต่ละ octet เติม "0" หากว่างเปล่า
        parts = parts.map(part => part === '' ? '0' : part);

        this.value = parts.join('.');
    });
}

// ส่งออกฟังก์ชันสำหรับการโหลดแบบโมดูลหรือเก็บไว้ใช้ในโกลบอลเพื่อไม่เกิดปัญหากับ File Protocol
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        ipToInt,
        intToIp,
        calculateSubnet,
        setupIpMasking
    };
} else {
    window.NetSubnet = {
        ipToInt,
        intToIp,
        calculateSubnet,
        setupIpMasking
    };
}
