/**
 * Network Automation & Subnet Console - UI Interactions & Effects
 * 
 * ไฟล์นี้ใช้สำหรับจัดการ Micro-interactions เช่น Scramble Text Effect,
 * ระบบจำลอง Boot Sequence, เสียงบี๊บเอฟเฟกต์ และระบบสร้าง Canvas Network Graph
 */

// 1. ระบบสังเคราะห์เสียง Beep ด้วย Web Audio API
function playBeep(freq = 1000, duration = 80, volume = 0.05, type = 'sine') {
    try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        
        oscillator.type = type;
        oscillator.frequency.setValueAtTime(freq, audioCtx.currentTime);
        
        gainNode.gain.setValueAtTime(volume, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration / 1000);
        
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        
        oscillator.start();
        oscillator.stop(audioCtx.currentTime + duration / 1000);
    } catch (e) {
        console.warn("AudioContext blocking or not supported in this browser:", e);
    }
}

// 2. ฟังก์ชัน Boot Sequence จำลองแฮกเกอร์รันสคริปต์
function initBootSequence() {
    const btnInitiate = document.getElementById('btn-initiate');
    const introPanel = document.getElementById('intro-panel');
    const bootTerminal = document.getElementById('boot-terminal');
    const introOverlay = document.getElementById('intro-overlay');

    if (!btnInitiate || !introPanel || !bootTerminal || !introOverlay) return;

    btnInitiate.addEventListener('click', () => {
        // เล่นเสียงยืนยันคำสั่งบี๊บแรกแบบเฉียบคม
        playBeep(880, 150, 0.08, 'sine');
        
        // ค่อยๆ ซ่อนตัวแผงหลักและเตรียมระบบโหลด
        introPanel.classList.add('fade-away');
        
        setTimeout(() => {
            introPanel.style.display = 'none';
            bootTerminal.style.display = 'block';
            runTerminalLines();
        }, 400);
    });

    const lines = [
        { text: "NET-AUTO // TERMINAL INTERFACE INITIATED...", class: "info", delay: 200 },
        { text: "ESTABLISHING SECURE CONNECTION TO LAN INTERFACE... [OK]", class: "ok", delay: 300 },
        { text: "DECRYPTING DEVICE MANAGEMENT CONFIGS... [OK]", class: "ok", delay: 250 },
        { text: "INITIALIZING Cisco Packet Tracer/IOS PARSER... [OK]", class: "ok", delay: 400 },
        { text: "BYPASSING SECURITY & ENCRYPTION SHIELDS... [OK]", class: "ok", delay: 200 },
        { text: "RETRIEVING NODE INFO (68319010053)... [OK]", class: "info", delay: 350 },
        { text: "LOADING CISCO CONFIGURATION TEMPLATES... [DONE]", class: "done", delay: 300 },
        { text: "SYSTEM STATUS: SECURE & ONLINE // WELCOME SYS_ADMIN SUPAKORN", class: "info", delay: 300 }
    ];

    function runTerminalLines() {
        let currentLine = 0;

        function printNextLine() {
            if (currentLine < lines.length) {
                const lineData = lines[currentLine];
                const lineDiv = document.createElement('div');
                lineDiv.className = `boot-line ${lineData.class}`;
                lineDiv.textContent = lineData.text;
                bootTerminal.appendChild(lineDiv);
                
                // เลื่อนหน้าจอ Terminal ลงมาข้างล่างสุดเสมอ
                bootTerminal.scrollTop = bootTerminal.scrollHeight;

                // เล่นเสียงบี๊บในโทนที่ต่างกันไปตามความพรีเมียม
                if (lineData.class === 'ok') {
                    playBeep(1200, 60, 0.03);
                } else if (lineData.class === 'done') {
                    playBeep(1500, 150, 0.05);
                } else {
                    playBeep(900, 50, 0.03);
                }

                currentLine++;
                setTimeout(printNextLine, lineData.delay);
            } else {
                // โหลดเสร็จสิ้นแล้ว หน่วงเวลาแป๊บนึงเพื่อให้เห็นคำว่า System Status แล้วเฟดออกอย่างนุ่มนวล
                setTimeout(() => {
                    // เล่นเสียงบูตเสร็จสิ้นเสียงหวานๆ (สองโทน)
                    playBeep(1000, 100, 0.06);
                    setTimeout(() => playBeep(1500, 200, 0.06), 80);

                    introOverlay.classList.add('fade-out');
                    
                    // ลบ element หรือเปลี่ยน display เพื่อไม่ให้บังปุ่ม UI อื่นๆ ข้างหลังหลังจางลงไปแล้ว
                    setTimeout(() => {
                        introOverlay.style.display = 'none';
                    }, 800); // 800ms เท่ากับ transition
                }, 600);
            }
        }

        printNextLine();
    }
}

// 3. ฟังก์ชันสร้าง Scramble Text Effect (สุ่มตัวอักษรแบบแฮกเกอร์)
function scrambleText(element, targetText, duration = 500) {
    if (!element) return;
    
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$&*';
    const totalFrames = Math.floor(duration / 30);
    let frame = 0;
    
    const interval = setInterval(() => {
        let text = '';
        for (let i = 0; i < targetText.length; i++) {
            if (i < (frame / totalFrames) * targetText.length) {
                text += targetText[i];
            } else {
                text += chars[Math.floor(Math.random() * chars.length)];
            }
        }
        
        element.textContent = text;
        frame++;
        
        if (frame > totalFrames) {
            clearInterval(interval);
            element.textContent = targetText;
        }
    }, 30);
}

// 4. พัฒนา Canvas Background แบบ Network Node Graph โต้ตอบกับเมาส์
function initNetworkGraph() {
    const canvas = document.getElementById('cyber-bg-canvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let width = canvas.width = window.innerWidth;
    let height = canvas.height = window.innerHeight;

    // ปรับขนาด Canvas อัตโนมัติเมื่อขนาดหน้าจอเปลี่ยน
    window.addEventListener('resize', () => {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
    });

    const particles = [];
    // คำนวณจำนวนจุดให้เหมาะสมกับพื้นที่หน้าจอ เพื่อให้ประสิทธิภาพการทำงานยังคงลื่นไหล
    const particleCount = Math.min(90, Math.floor((width * height) / 16000));
    
    const mouse = {
        x: null,
        y: null,
        radius: 140
    };

    window.addEventListener('mousemove', (e) => {
        mouse.x = e.clientX;
        mouse.y = e.clientY;
    });

    window.addEventListener('mouseleave', () => {
        mouse.x = null;
        mouse.y = null;
    });

    // โครงสร้าง Node จุดเครือข่าย
    class Node {
        constructor() {
            this.x = Math.random() * width;
            this.y = Math.random() * height;
            // เคลื่อนที่ช้าๆ ดูลื่นไหลผ่อนคลาย (Damped drift velocity)
            this.vx = (Math.random() - 0.5) * 0.4;
            this.vy = (Math.random() - 0.5) * 0.4;
            this.radius = Math.random() * 2 + 1.5;
        }

        update() {
            this.x += this.vx;
            this.y += this.vy;

            // ชนขอบเด้งกลับ
            if (this.x < 0 || this.x > width) this.vx = -this.vx;
            if (this.y < 0 || this.y > height) this.vy = -this.vy;

            // โต้ตอบกับเมาส์: ค่อยๆ ผลักออกจากบริเวณเมาส์ (Damping interactive force)
            if (mouse.x !== null && mouse.y !== null) {
                const dx = mouse.x - this.x;
                const dy = mouse.y - this.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < mouse.radius) {
                    const force = (mouse.radius - dist) / mouse.radius;
                    // ผลักจุดห่างออกไปเบาๆ
                    this.x -= (dx / dist) * force * 0.7;
                    this.y -= (dy / dist) * force * 0.7;
                }
            }
        }

        draw() {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            // สีฟ้าเรืองแสงอ่อนๆ
            ctx.fillStyle = 'rgba(100, 220, 255, 0.4)';
            ctx.fill();
        }
    }

    // สร้าง Nodes ตามจำนวนที่กำหนด
    for (let i = 0; i < particleCount; i++) {
        particles.push(new Node());
    }

    // ลูปวาดภาพแอนิเมชัน (60 FPS rendering loop)
    function animate() {
        ctx.clearRect(0, 0, width, height);

        particles.forEach(p => {
            p.update();
            p.draw();
        });

        // ลากเส้นเชื่อมต่อโยงใยเครือข่าย (Network Node Connectivities)
        for (let i = 0; i < particles.length; i++) {
            for (let j = i + 1; j < particles.length; j++) {
                const p1 = particles[i];
                const p2 = particles[j];
                const dx = p1.x - p2.x;
                const dy = p1.y - p2.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                // หากระยะห่างต่ำกว่า 110px ให้วาดเส้นเชื่อม
                if (dist < 110) {
                    const alpha = ((110 - dist) / 110) * 0.12; // บางมาก ไม่รบกวนการอ่านข้อมูลหน้าจอ
                    ctx.beginPath();
                    ctx.moveTo(p1.x, p1.y);
                    ctx.lineTo(p2.x, p2.y);
                    // เส้นสีฟ้าบางเฉียบสไตล์เน็ตเวิร์กแลน
                    ctx.strokeStyle = `rgba(100, 220, 255, ${alpha})`;
                    ctx.lineWidth = 0.8;
                    ctx.stroke();
                }
            }

            // วาดเส้นใยพิเศษเชื่อมต่อจุดรอบๆ เมาส์ (Interactive Focus Lines)
            if (mouse.x !== null && mouse.y !== null) {
                const p = particles[i];
                const dx = mouse.x - p.x;
                const dy = mouse.y - p.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < mouse.radius) {
                    const alpha = ((mouse.radius - dist) / mouse.radius) * 0.16;
                    ctx.beginPath();
                    ctx.moveTo(mouse.x, mouse.y);
                    ctx.lineTo(p.x, p.y);
                    // แสงเรืองแสงสีม่วงพรีเมียมรอบตำแหน่งเมาส์
                    ctx.strokeStyle = `rgba(168, 85, 247, ${alpha})`;
                    ctx.lineWidth = 1;
                    ctx.stroke();
                }
            }
        }

        requestAnimationFrame(animate);
    }

    animate();
}

// เริ่มต้นเอฟเฟกต์ทั้งหมดเมื่อ DOM โหลดเสร็จสิ้น
document.addEventListener('DOMContentLoaded', () => {
    initBootSequence();
    initNetworkGraph();
});

// ส่งออกฟังก์ชันช่วยเหลือ
window.NetEffects = {
    playBeep,
    scrambleText
};
