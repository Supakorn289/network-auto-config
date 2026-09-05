/** NET-AUTO v2.4 // Interactive topology-first application controller. */
document.addEventListener('DOMContentLoaded', () => {
  const Catalog = window.NetCatalog;
  const Topology = window.NetTopology;
  const Engine = window.NetConfigEngine;
  const Subnet = window.NetSubnet;
  const state = Topology.state;

  const $ = s => document.querySelector(s);
  const $$ = s => [...document.querySelectorAll(s)];
  const els = {
    palette: $('#device-palette'), canvas: $('#topology-canvas'), svg: $('#link-layer'), inspector: $('#inspector-body'),
    linkList: $('#link-list'), stepper: $('#stepper'), questions: $('#question-area'), configs: $('#config-output'),
    testList: $('#test-checklist'), validation: $('#validation-panel'), category: $('#device-category'), search: $('#device-search'),
    baseInput: $('#base-network'), networkCalc: $('#network-calculation'), cidrBadge: $('#auto-cidr-badge')
  };

  let selectedNodeId = null, connectFrom = null, currentStep = 1, dragging = null;

  function nodeDimensions() {
    const styles = getComputedStyle(document.documentElement);
    return {
      w: parseFloat(styles.getPropertyValue('--topo-node-w')) || 156,
      h: parseFloat(styles.getPropertyValue('--topo-node-h')) || 94
    };
  }

  function clampNodeToCanvas(node) {
    const rect = els.canvas.getBoundingClientRect();
    const { w, h } = nodeDimensions();
    if (!rect.width || !rect.height) return;
    node.x = Math.max(0, Math.min(Math.max(0, rect.width - w), Number(node.x) || 0));
    node.y = Math.max(0, Math.min(Math.max(0, rect.height - h), Number(node.y) || 0));
  }
  function clampAllNodesToCanvas() { state.nodes.forEach(clampNodeToCanvas); }

  function autoNodePosition(index) {
    const rect = els.canvas.getBoundingClientRect();
    const { w, h } = nodeDimensions();
    const gap = window.innerWidth <= 760 ? 12 : 18;
    const cols = Math.max(1, Math.floor(Math.max(w, rect.width - 24) / (w + gap)));
    const rows = Math.max(1, Math.floor(Math.max(h, rect.height - 24) / (h + gap)));
    const col = index % cols;
    const row = Math.floor(index / cols) % rows;
    return { x: 12 + col * (w + gap), y: 12 + row * (h + gap) };
  }

  function toast(message, type='ok') {
    const el = document.createElement('div'); el.className = `toast ${type}`; el.textContent = message;
    document.body.appendChild(el); requestAnimationFrame(()=>el.classList.add('show'));
    setTimeout(()=>{el.classList.remove('show'); setTimeout(()=>el.remove(),250)},2300);
  }

  function profile(node) { return Catalog.getDevice(node.profileId); }
  function nodeBy(id) { return Topology.getNode(id); }
  function deviceImage(device, mode='palette') { return mode === 'topology' ? (device.topologyImage || device.image) : device.image; }
  function deviceLabel(device) { return device.displayName || device.name; }
  function escapeHtml(str){return String(str).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));}
  function nodeUsesVlan(n) { return Object.entries(n.features || {}).some(([f,on]) => on && Topology.VLAN_INTENT_FEATURES.has(f)); }

  function renderNetworkCalculation() {
    try {
      const info = Topology.previewBase();
      els.cidrBadge.textContent = `AUTO /${info.cidr}`;
      els.cidrBadge.classList.remove('invalid');
      els.networkCalc.innerHTML = `
        <div class="net-stat primary-stat"><span>AUTO CIDR</span><b>/${info.cidr}</b><small>ระบบตรวจจากรูปแบบ Network Address</small></div>
        <div class="net-stat"><span>SUBNET MASK</span><b>${info.subnetMask}</b></div>
        <div class="net-stat"><span>NETWORK</span><b>${info.networkAddress}</b></div>
        <div class="net-stat"><span>BROADCAST</span><b>${info.broadcastAddress}</b></div>
        <div class="net-stat wide-stat"><span>USABLE IP RANGE</span><b>${info.usableHostRange}</b></div>
        <div class="net-stat"><span>USABLE HOSTS</span><b>${Number(info.totalHosts).toLocaleString('en-US')}</b></div>`;
    } catch (e) {
      els.cidrBadge.textContent = 'INVALID IP';
      els.cidrBadge.classList.add('invalid');
      els.networkCalc.innerHTML = `<div class="network-calc-error"><b>ยังคำนวณไม่ได้</b><span>${escapeHtml(e.message)}</span></div>`;
    }
  }

  function renderPalette() {
    const q = els.search.value.trim().toLowerCase(), cat = els.category.value;
    const list = Catalog.DEVICE_CATALOG.filter(d => (!cat || d.category===cat) && (!q || `${d.name} ${d.family}`.toLowerCase().includes(q)));
    els.palette.innerHTML = list.map(d => `<button class="device-item" draggable="true" data-profile="${d.id}" title="ลากไปวางหรือคลิกเพื่อเพิ่ม ${d.name}"><span class="device-thumb"><img src="${d.image}" alt="" loading="lazy"><em>${d.icon}</em></span><span class="device-copy"><b>${d.name}</b><small>${d.category}</small></span><span class="add-mark">+</span></button>`).join('');
    $$('.device-item').forEach(btn => {
      btn.onclick = () => addDevice(btn.dataset.profile);
      btn.ondragstart = e => { e.dataTransfer.setData('text/netauto-profile', btn.dataset.profile); e.dataTransfer.effectAllowed='copy'; };
    });
  }

  function initCategories() {
    els.category.innerHTML = '<option value="">ทุกหมวด</option>' + Catalog.categories().map(c=>`<option>${c}</option>`).join('');
  }

  function addDevice(profileId) {
    const p = Catalog.getDevice(profileId);
    const pos = autoNodePosition(state.nodes.length);
    const n = Topology.addNode(p, pos.x, pos.y);
    clampNodeToCanvas(n);
    n.features = Catalog.defaultFeatureState(p);
    selectedNodeId = n.id; renderAll(); toast(`เพิ่ม ${p.name} แล้ว`);
  }

  function renderCanvas() {
    els.canvas.querySelectorAll('.topo-node').forEach(n=>n.remove());
    clampAllNodesToCanvas();
    state.nodes.forEach(n => {
      const p = profile(n); const el = document.createElement('button');
      el.className = `topo-node ${selectedNodeId===n.id?'selected':''} family-${p.family}`;
      el.dataset.id = n.id; el.type = 'button'; el.setAttribute('aria-label', `${n.name} — ${p.name}`);
      el.style.left = `${n.x}px`; el.style.top = `${n.y}px`;
      el.innerHTML = `<span class="node-photo"><img src="${deviceImage(p,'topology')}" alt="" draggable="false"></span><span class="node-copy"><span class="node-name">${n.name}</span><span class="node-model" title="${p.name}">${deviceLabel(p)}</span><span class="node-badge">${p.category}</span></span>`;
      el.onpointerdown = e => {
        if (e.button !== 0 && e.pointerType === 'mouse') return;
        const nodeRect = el.getBoundingClientRect();
        dragging = { id:n.id, offsetX:e.clientX-nodeRect.left, offsetY:e.clientY-nodeRect.top, startX:e.clientX, startY:e.clientY, moved:false };
        el.setPointerCapture?.(e.pointerId);
      };
      el.onpointermove = e => {
        if (!dragging || dragging.id!==n.id) return;
        const rect=els.canvas.getBoundingClientRect(); const { w, h } = nodeDimensions();
        n.x = Math.max(0, Math.min(Math.max(0, rect.width-w), e.clientX-rect.left-dragging.offsetX));
        n.y = Math.max(0, Math.min(Math.max(0, rect.height-h), e.clientY-rect.top-dragging.offsetY));
        if (Math.abs(e.clientX-dragging.startX) > 3 || Math.abs(e.clientY-dragging.startY) > 3) dragging.moved=true;
        el.style.left=`${n.x}px`;el.style.top=`${n.y}px`;renderLinks();
      };
      el.onpointerup = () => { const wasMoved = dragging?.moved; dragging=null; if (!wasMoved) handleNodeClick(n.id); };
      el.onpointercancel = () => { dragging = null; };
      els.canvas.appendChild(el);
    });
    renderLinks();
  }

  function handleNodeClick(id) {
    if ($('#btn-connect').classList.contains('active')) {
      if (!connectFrom) { connectFrom=id; selectedNodeId=id; toast(`เลือก ${nodeBy(id).name} เป็นต้นทาง แล้วคลิกอุปกรณ์ปลายทาง`,'info'); renderAll(); return; }
      if (connectFrom===id) { connectFrom=null; toast('ยกเลิกต้นทาง','info'); renderAll(); return; }
      try { Topology.addLink(connectFrom,id); toast(`เชื่อม ${nodeBy(connectFrom).name} ↔ ${nodeBy(id).name} แล้ว`); }
      catch(e){ toast(e.message,'error'); }
      connectFrom=null; $('#btn-connect').classList.remove('active'); renderAll(); return;
    }
    selectedNodeId=id; renderAll();
    if (window.matchMedia('(max-width: 760px)').matches) requestAnimationFrame(() => document.querySelector('.inspector-pane')?.scrollIntoView({behavior:'smooth',block:'start'}));
  }

  function resolvedMode(link) { return Topology.effectiveLinkMode(link,Catalog); }

  function renderLinks() {
    const { w, h } = nodeDimensions();
    const paths = state.links.map(l => {
      const a=nodeBy(l.a),b=nodeBy(l.b); if(!a||!b)return '';
      const aEl = els.canvas.querySelector(`[data-id="${a.id}"]`); const bEl = els.canvas.querySelector(`[data-id="${b.id}"]`);
      const aw = aEl?.offsetWidth || w, ah = aEl?.offsetHeight || h, bw = bEl?.offsetWidth || w, bh = bEl?.offsetHeight || h;
      const x1=a.x+aw/2,y1=a.y+ah/2,x2=b.x+bw/2,y2=b.y+bh/2; const labelX=(x1+x2)/2,labelY=(y1+y2)/2;
      const mode = resolvedMode(l);
      const label = l.mode === 'auto' ? `AUTO→${mode.toUpperCase()}` : mode.toUpperCase();
      return `<g data-link="${l.id}"><line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" class="link-line ${mode}"/><text x="${labelX}" y="${labelY-7}" class="link-label">${label}</text></g>`;
    }).join('');
    els.svg.innerHTML = paths;
  }

  function renderInspector() {
    const n=nodeBy(selectedNodeId);
    if(!n){ els.inspector.innerHTML='<div class="empty-state"><b>เลือกอุปกรณ์</b><span>คลิกอุปกรณ์บนพื้นที่วาง Network เพื่อแก้ชื่อและค่าพื้นฐาน</span></div>'; return; }
    const p=profile(n);
    els.inspector.innerHTML = `
      <div class="inspector-head"><span class="inspector-photo"><img src="${deviceImage(p,'topology')}" alt="ภาพตัวแทน ${p.name}"></span><div><b>${deviceLabel(p)}</b><small>${p.category} • ${p.family}</small></div></div>
      <label>Hostname<input id="ins-name" value="${n.name}" maxlength="24"></label>
      <label>Admin Username<input id="ins-user" value="${n.settings.username}"></label>
      <label>Secret / Password<input id="ins-secret" type="password" value="${n.settings.secret}"></label>
      <p class="inspector-note">การตั้งค่า VLAN ถูกย้ายไป Step 2 และจะแสดงเฉพาะเมื่อเลือกใช้ฟังก์ชัน VLAN</p>
      <button class="danger-link" id="btn-delete-node">ลบอุปกรณ์นี้</button>`;
    $('#ins-name').oninput=e=>{n.name=e.target.value||n.name;renderCanvas()};
    $('#ins-user').oninput=e=>n.settings.username=e.target.value;
    $('#ins-secret').oninput=e=>n.settings.secret=e.target.value;
    $('#btn-delete-node').onclick=()=>{Topology.removeNode(n.id);selectedNodeId=null;renderAll();};
  }

  function renderLinkList() {
    if(!state.links.length){els.linkList.innerHTML='<span class="muted">ยังไม่มีการเชื่อมต่อ</span>';return;}
    els.linkList.innerHTML=state.links.map(l=>`<div class="link-row"><span>${nodeBy(l.a)?.name||'?'} ↔ ${nodeBy(l.b)?.name||'?'}</span><select data-link-mode="${l.id}"><option value="auto" ${l.mode==='auto'?'selected':''}>Auto (${resolvedMode(l)})</option><option value="access" ${l.mode==='access'?'selected':''}>Access</option><option value="trunk" ${l.mode==='trunk'?'selected':''}>Trunk</option><option value="routed" ${l.mode==='routed'?'selected':''}>Routed L3</option></select><button data-remove-link="${l.id}">×</button></div>`).join('');
    $$('[data-link-mode]').forEach(s=>s.onchange=e=>{const l=state.links.find(x=>x.id===s.dataset.linkMode);l.mode=e.target.value;renderLinks()});
    $$('[data-remove-link]').forEach(b=>b.onclick=()=>{Topology.removeLink(b.dataset.removeLink);renderAll()});
  }

  function renderVlans() {
    const box=$('#vlan-editor'); if (!box) return;
    box.innerHTML=state.vlans.map((v,i)=>`<div class="vlan-edit"><input data-vlan-id="${i}" type="number" min="1" max="4094" value="${v.id}" aria-label="VLAN ID"><input data-vlan-name="${i}" value="${v.name}" aria-label="VLAN Name"><button data-del-vlan="${i}" ${state.vlans.length<=1?'disabled':''} title="ลบ VLAN">×</button></div>`).join('');
    $$('[data-vlan-id]').forEach(el=>el.onchange=e=>{
      const index=Number(el.dataset.vlanId), oldId=Number(state.vlans[index].id), newId=Number(e.target.value);
      state.vlans[index].id=newId;
      state.nodes.forEach(n=>{
        if(Number(n.settings.accessVlan)===oldId) n.settings.accessVlan=newId;
        if(Number(n.settings.managementVlan)===oldId) n.settings.managementVlan=newId;
      });
      state.links.forEach(l=>{
        if(Number(l.vlan)===oldId) l.vlan=newId;
        if(l.allowedVlans) l.allowedVlans=l.allowedVlans.split(',').map(x=>Number(x.trim())===oldId?String(newId):x.trim()).filter(Boolean).join(',');
      });
      renderLinkQuestions();
    });
    $$('[data-vlan-name]').forEach(el=>el.oninput=e=>state.vlans[Number(el.dataset.vlanName)].name=e.target.value.toUpperCase());
    $$('[data-del-vlan]').forEach(el=>el.onclick=()=>{state.vlans.splice(Number(el.dataset.delVlan),1);renderVlanPlan();renderLinkQuestions();});
  }

  function renderVlanPlan() {
    const section = $('#vlan-plan-section'); if (!section) return;
    const active = Topology.usesVlans(); state.vlanEnabled = active;
    section.hidden = !active;
    if (!active) return;
    Topology.ensureDefaultVlans();
    const hint = $('#vlan-plan-hint');
    try {
      const base=Topology.previewBase();
      hint.textContent = base.cidr <= 24 ? `Base ${base.networkAddress}/${base.cidr} • ระบบจัด /24 ให้แต่ละ VLAN` : 'Base Network เล็กเกินไปสำหรับ VLAN /24';
    } catch { hint.textContent='กรอก Base Network ให้ถูกต้องก่อน'; }
    renderVlans();
  }

  function settingLabel(name,value,placeholder='') {
    return `<label>${name}<input data-setting-node="__NODE__" data-setting="${value}" value="__VALUE__" ${placeholder?`placeholder="${placeholder}"`:''}></label>`;
  }

  function advancedFields(n,p) {
    const fields = [
      ['OSPF Area','ospfArea',''],['EIGRP AS','eigrpAs',''],['DHCP Helper','helperAddress','เช่น 10.10.0.10'],['WAN Gateway','wanGateway','ถ้ามี ISP'],
      ['SSID','ssid',''],['Wi-Fi Password','wifiPassword',''],['EtherChannel Ports','channelPorts','Gi0/1 - 2'],
      ['Static NAT Local','staticNatLocal','10.10.0.50'],['Static NAT Global','staticNatGlobal','203.0.113.50'],['Serial Clock Rate','clockRate','']
    ];
    if (nodeUsesVlan(n)) {
      fields.splice(6,0,['Native VLAN','nativeVlan',''],['VTP Domain','vtpDomain','']);
    }
    const inputs = fields.map(([label,key,ph]) => `<label>${label}<input data-setting-node="${n.id}" data-setting="${key}" value="${n.settings[key] ?? ''}" ${ph?`placeholder="${ph}"`:''}></label>`).join('');
    const vlanSelectors = Topology.usesVlans() ? `
      <label>Access / User VLAN<select data-setting-node="${n.id}" data-setting="accessVlan">${state.vlans.map(v=>`<option value="${v.id}" ${Number(n.settings.accessVlan)===Number(v.id)?'selected':''}>VLAN ${v.id} — ${v.name}</option>`).join('')}</select></label>
      ${['l2switch','l3switch','wlc'].includes(p.family)?`<label>Management VLAN<select data-setting-node="${n.id}" data-setting="managementVlan">${state.vlans.map(v=>`<option value="${v.id}" ${Number(n.settings.managementVlan)===Number(v.id)?'selected':''}>VLAN ${v.id} — ${v.name}</option>`).join('')}</select></label>`:''}` : '';
    return `${vlanSelectors}${inputs}`;
  }

  function renderQuestions() {
    if(!state.nodes.length){els.questions.innerHTML='<div class="empty-state"><b>ยังไม่มีอุปกรณ์</b><span>กลับไป Step 1 แล้วเพิ่มอุปกรณ์ก่อน</span></div>';return;}
    if (Topology.usesVlans()) Topology.ensureDefaultVlans();
    els.questions.innerHTML = state.nodes.map(n=>{
      const p=profile(n); const grouped={};
      p.features.forEach(fid=>{const f=Catalog.getFeature(fid); if(!f)return;(grouped[f.group]??=[]).push({id:fid,...f})});
      const groups=Object.entries(grouped).map(([group,features])=>`<div class="feature-group"><h4>${group}</h4>${features.map(f=>`<label class="feature-toggle"><span><b>${f.label}</b>${f.note?`<small>${f.note}</small>`:''}</span><input type="checkbox" data-feature-node="${n.id}" data-feature="${f.id}" ${n.features[f.id]?'checked':''}><i></i></label>`).join('')}</div>`).join('');
      return `<section class="question-device"><header><span class="question-device-photo"><img src="${deviceImage(p,'topology')}" alt=""></span><div><h3>${n.name}</h3><p>${deviceLabel(p)} — เลือกเฉพาะฟังก์ชันที่ต้องการใช้งานจริง</p></div></header>${groups || '<p class="muted">อุปกรณ์ประเภทนี้ไม่มี CLI feature ที่ต้องถาม</p>'}<details><summary>ค่าขั้นสูงของอุปกรณ์</summary><div class="advanced-grid">${advancedFields(n,p)}</div></details></section>`;
    }).join('');
    $$('[data-feature-node]').forEach(el=>el.onchange=()=>{
      nodeBy(el.dataset.featureNode).features[el.dataset.feature]=el.checked;
      if (Topology.usesVlans()) Topology.ensureDefaultVlans();
      // Re-render so VLAN-only settings appear/disappear immediately and no irrelevant input remains visible.
      renderQuestions();
    });
    $$('[data-setting-node]').forEach(el=>{
      const eventName = el.tagName === 'SELECT' ? 'change' : 'input';
      el.addEventListener(eventName,()=>{
        const node=nodeBy(el.dataset.settingNode); if(!node)return;
        const numeric=['accessVlan','managementVlan','nativeVlan','ospfArea','eigrpAs'].includes(el.dataset.setting);
        node.settings[el.dataset.setting]=numeric ? Number(el.value) : el.value;
      });
    });
    renderVlanPlan();
    renderLinkQuestions();
  }

  function renderLinkQuestions() {
    const box = $('#link-question-area'); if (!box) return;
    if (!state.links.length) { box.innerHTML='<div class="empty-state"><b>ยังไม่มีลิงก์</b><span>กลับไปเชื่อมอุปกรณ์ก่อน</span></div>'; return; }
    const useVlans = Topology.usesVlans();
    box.classList.toggle('without-vlan',!useVlans);
    box.innerHTML = state.links.map(l => {
      const vlanControls = useVlans ? `<select data-q-vlan="${l.id}" title="Access VLAN">${state.vlans.map(v=>`<option value="${v.id}" ${Number(l.vlan)===Number(v.id)?'selected':''}>VLAN ${v.id}</option>`).join('')}</select><input data-q-allowed="${l.id}" value="${l.allowedVlans || state.vlans.map(v=>v.id).join(',')}" title="Allowed VLANs" placeholder="Allowed VLANs เช่น 10,20">` : '';
      return `<div class="link-question ${useVlans?'with-vlan':'flat-link'}"><div><b>${nodeBy(l.a)?.name||'?'} ↔ ${nodeBy(l.b)?.name||'?'}</b><small>${l.aPort||'auto-port'} ↔ ${l.bPort||'auto-port'} • Auto = ${resolvedMode(l)}</small></div><select data-q-mode="${l.id}"><option value="auto" ${l.mode==='auto'?'selected':''}>Auto (${resolvedMode(l)})</option><option value="access" ${l.mode==='access'?'selected':''}>Access</option><option value="trunk" ${l.mode==='trunk'?'selected':''}>Trunk</option><option value="routed" ${l.mode==='routed'?'selected':''}>Routed L3</option></select>${vlanControls}</div>`;
    }).join('');
    $$('[data-q-mode]').forEach(el=>el.onchange=()=>{state.links.find(l=>l.id===el.dataset.qMode).mode=el.value;renderLinks();renderLinkQuestions();});
    $$('[data-q-vlan]').forEach(el=>el.onchange=()=>{state.links.find(l=>l.id===el.dataset.qVlan).vlan=Number(el.value)});
    $$('[data-q-allowed]').forEach(el=>el.oninput=()=>{state.links.find(l=>l.id===el.dataset.qAllowed).allowedVlans=el.value});
  }

  function prepareTopology() {
    const result=Topology.validate(Catalog); renderValidation(result); if(result.errors.length) return false;
    Topology.assignPorts(Catalog);
    if (state.internet) {
      const edge = state.nodes.find(n => profile(n).family === 'router');
      if (edge) { edge.features.natPat = true; edge.features.staticRoute = true; }
    }
    try { Topology.planAddresses(Catalog); } catch(e){toast(e.message,'error');return false;}
    return true;
  }

  function renderValidation(r=Topology.validate(Catalog)) {
    const items=[...r.errors.map(x=>`<li class="bad">${x}</li>`),...r.warnings.map(x=>`<li class="warn">${x}</li>`)];
    els.validation.innerHTML=items.length?`<ul>${items.join('')}</ul>`:'<span class="good">Topology ผ่านการตรวจพื้นฐาน</span>';
  }

  function generateAll() {
    if(!prepareTopology()) return;
    const outputs=state.nodes.map(n=>({n,p:profile(n),text:Engine.generateDevice(n,profile(n),state)}));
    els.configs.innerHTML=outputs.map(({n,p,text},i)=>`<article class="config-device ${i===0?'active':''}" data-config-card="${n.id}"><header><div><b>${n.name}</b><small>${p.name}</small></div><button data-copy="${n.id}">COPY</button></header><pre><code>${escapeHtml(text)}</code></pre></article>`).join('');
    $$('[data-copy]').forEach(b=>b.onclick=async()=>{const card=$(`[data-config-card="${b.dataset.copy}"] code`);await navigator.clipboard.writeText(card.textContent);toast(`คัดลอก config ${nodeBy(b.dataset.copy).name} แล้ว`)});
    const tests=Engine.testChecklist(state,Catalog); els.testList.innerHTML=tests.map((t,i)=>`<li><span>${String(i+1).padStart(2,'0')}</span>${t}</li>`).join('');
    gotoStep(3,false);
  }

  function exportProject() {
    const payload={version:'2.4',generatedAt:new Date().toISOString(),state};
    const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='net-auto-project.json';a.click();URL.revokeObjectURL(a.href);
  }

  function downloadAllConfigs() {
    if(!prepareTopology()) return;
    const text=state.nodes.map(n=>`\n\n########## ${n.name} ##########\n${Engine.generateDevice(n,profile(n),state)}`).join('');
    const blob=new Blob([text],{type:'text/plain'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='net-auto-all-configs.txt';a.click();URL.revokeObjectURL(a.href);
  }

  function gotoStep(step, prepare=true) {
    if(step===2 && prepare && !prepareTopology()) return;
    currentStep=step;
    $$('.workflow-step').forEach(s=>s.classList.toggle('active',Number(s.dataset.step)===step));
    $$('.step-panel').forEach(s=>s.classList.toggle('active',Number(s.dataset.panel)===step));
    if(step===1) renderAll();
    if(step===2) renderQuestions();
    if(step===3) renderValidation();
    window.scrollTo({top:0,behavior:'smooth'});
  }

  function renderAll(){renderCanvas();renderInspector();renderLinkList();renderNetworkCalculation();renderValidation();}

  initCategories(); renderPalette(); renderAll();
  Subnet.setupIpMasking(els.baseInput);
  els.search.oninput=renderPalette; els.category.onchange=renderPalette;
  els.canvas.ondragover=e=>{e.preventDefault();e.dataTransfer.dropEffect='copy';els.canvas.classList.add('drag-over')};
  els.canvas.ondragleave=()=>els.canvas.classList.remove('drag-over');
  els.canvas.ondrop=e=>{
    e.preventDefault(); els.canvas.classList.remove('drag-over');
    const id=e.dataTransfer.getData('text/netauto-profile'); if(!id)return;
    const rect=els.canvas.getBoundingClientRect(); const p=Catalog.getDevice(id); const {w,h}=nodeDimensions();
    const n=Topology.addNode(p,Math.max(0,Math.min(Math.max(0,rect.width-w),e.clientX-rect.left-w/2)),Math.max(0,Math.min(Math.max(0,rect.height-h),e.clientY-rect.top-h/2)));
    n.features=Catalog.defaultFeatureState(p);selectedNodeId=n.id;renderAll();toast(`เพิ่ม ${p.name} แล้ว`);
  };
  $('#btn-connect').onclick=()=>{connectFrom=null;$('#btn-connect').classList.toggle('active');toast($('#btn-connect').classList.contains('active')?'โหมดเชื่อมต่อ: คลิกอุปกรณ์ตัวแรก แล้วคลิกตัวที่สอง':'ปิดโหมดเชื่อมต่อ','info')};
  $('#btn-clear').onclick=()=>{
    Topology.reset(); selectedNodeId=null; connectFrom=null;
    els.baseInput.value=state.baseNetwork; $('#internet-required').checked=false;
    renderAll(); toast('ล้าง Topology แล้ว','info');
  };
  $('#btn-add-vlan').onclick=()=>{let id=10;while(state.vlans.some(v=>v.id===id))id+=10;state.vlans.push({id,name:`VLAN_${id}`,cidr:24});renderVlanPlan();renderLinkQuestions();};
  els.baseInput.oninput=e=>{state.baseNetwork=e.target.value.trim();renderNetworkCalculation();renderValidation();};
  $('#internet-required').onchange=e=>state.internet=e.target.checked;
  $('#btn-step2').onclick=()=>gotoStep(2);
  $('#btn-back1').onclick=()=>gotoStep(1,false);
  $('#btn-generate').onclick=generateAll;
  $('#btn-back2').onclick=()=>gotoStep(2,false);
  $('#btn-export-project').onclick=exportProject;
  $('#btn-download-all').onclick=downloadAllConfigs;

  let resizeFrame = 0;
  const syncCanvasAfterResize = () => {
    cancelAnimationFrame(resizeFrame);
    resizeFrame = requestAnimationFrame(() => { clampAllNodesToCanvas(); renderCanvas(); });
  };
  if ('ResizeObserver' in window) new ResizeObserver(syncCanvasAfterResize).observe(els.canvas);
  else window.addEventListener('resize', syncCanvasAfterResize, {passive:true});

  $('#btn-load-demo').onclick=()=>{
    Topology.reset(); els.baseInput.value=state.baseNetwork; $('#internet-required').checked=false;
    const rp=autoNodePosition(0), sp=autoNodePosition(1), ap=autoNodePosition(2), pp=autoNodePosition(3);
    const r=Topology.addNode(Catalog.getDevice('r-2911'),rp.x,rp.y);r.features=Catalog.defaultFeatureState(Catalog.getDevice(r.profileId));r.features.ospf=true;r.features.dhcpServer=true;
    const s=Topology.addNode(Catalog.getDevice('l3-3560'),sp.x,sp.y);s.features=Catalog.defaultFeatureState(Catalog.getDevice(s.profileId));s.features.ospf=true;s.features.vlanDatabase=true;s.features.interVlan=true;
    const a=Topology.addNode(Catalog.getDevice('sw-2960-24tt'),ap.x,ap.y);a.features=Catalog.defaultFeatureState(Catalog.getDevice(a.profileId));a.features.vlanDatabase=true;
    const pc=Topology.addNode(Catalog.getDevice('pc-pt'),pp.x,pp.y);pc.features=Catalog.defaultFeatureState(Catalog.getDevice(pc.profileId));
    state.vlans=[{id:10,name:'USERS',cidr:24},{id:20,name:'STAFF',cidr:24},{id:30,name:'GUEST',cidr:24}];
    Topology.addLink(r.id,s.id);Topology.addLink(s.id,a.id);Topology.addLink(a.id,pc.id);
    selectedNodeId=s.id;renderAll();toast('โหลด Demo Topology แล้ว');
  };
});
