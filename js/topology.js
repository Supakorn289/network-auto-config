/** NET-AUTO // Topology state, inference, automatic IPv4 planning and validation. */
(function (root, factory) {
  const api = factory(typeof require === 'function' ? (() => { try { return require('./subnet.js'); } catch { return null; } })() : null);
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.NetTopology = api;
})(typeof window !== 'undefined' ? window : globalThis, function (nodeSubnet) {
  const subnetApi = nodeSubnet || (typeof window !== 'undefined' ? window.NetSubnet : null);

  // Only features that actually require a custom VLAN plan should expose the VLAN editor.
  const VLAN_INTENT_FEATURES = new Set([
    'vlanDatabase','interVlan','routerOnStick','nativeVlan','vtp','dhcpSnooping','dai','hsrp','wlanVlanMap','ipPhone'
  ]);

  const state = {
    nodes: [], links: [],
    // VLAN definitions are preserved while hidden, but are not used unless a VLAN feature is selected.
    vlans: [],
    baseNetwork: '10.10.0.0',
    baseInfo: null,
    flatNetwork: null,
    vlanEnabled: false,
    internet: false
  };

  const uid = prefix => `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,7)}`;

  function reset() {
    state.nodes.splice(0); state.links.splice(0);
    state.vlans = [];
    state.baseNetwork = '10.10.0.0';
    state.baseInfo = null;
    state.flatNetwork = null;
    state.vlanEnabled = false;
    state.internet = false;
  }

  function ensureDefaultVlans() {
    if (!state.vlans.length) state.vlans.push({id:10,name:'USERS',cidr:24});
    return state.vlans;
  }

  function usesVlans() {
    return state.nodes.some(node => Object.entries(node.features || {}).some(([feature,enabled]) => enabled && VLAN_INTENT_FEATURES.has(feature)));
  }

  function addNode(profile, x = 160, y = 120) {
    const same = state.nodes.filter(n => n.profileId === profile.id).length + 1;
    const familyPrefix = profile.nodePrefix || {router:'R',l2switch:'SW',l3switch:'MLS',firewall:'FW',wlc:'WLC',ap:'AP',server:'SRV',endpoint:'PC',phone:'IPP',iot:'IOT',passive:'NET',homeRouter:'WIFI'}[profile.family] || 'NODE';
    const node = {
      id: uid('node'), profileId: profile.id, name: `${familyPrefix}${same}`,
      x, y, features: {}, settings: {
        username: 'admin', secret: 'NetAuto123!', domain: 'netauto.local',
        managementVlan: 10, managementIp: '', defaultGateway: '',
        accessVlan: 10, ospfProcess: 1, ospfArea: 0,
        eigrpAs: 100, ripVersion: 2, bgpAs: 65001,
        ntpServer: '', syslogServer: '', helperAddress: '',
        ssid: 'NET-AUTO', wifiPassword: 'PacketTracer123!',
        wanGateway: '', outsideIp: '', insideIp: '', nativeVlan: 99,
        vtpDomain: 'NETAUTO', vtpMode: 'transparent', channelPorts: '', channelGroup: 1,
        staticNatLocal: '', staticNatGlobal: '', pppChapUser: '', clockRate: '64000'
      }
    };
    state.nodes.push(node);
    return node;
  }

  function removeNode(nodeId) {
    const idx = state.nodes.findIndex(n => n.id === nodeId);
    if (idx >= 0) state.nodes.splice(idx, 1);
    for (let i = state.links.length - 1; i >= 0; i--) {
      if (state.links[i].a === nodeId || state.links[i].b === nodeId) state.links.splice(i, 1);
    }
  }

  function addLink(a, b) {
    if (!a || !b || a === b) throw new Error('เลือกอุปกรณ์คนละตัวเพื่อเชื่อมต่อ');
    const duplicate = state.links.some(l => (l.a === a && l.b === b) || (l.a === b && l.b === a));
    if (duplicate) throw new Error('อุปกรณ์คู่นี้เชื่อมกันอยู่แล้ว');
    const link = { id: uid('link'), a, b, mode: 'auto', resolvedMode: 'access', vlan: 10, allowedVlans: '', aPort: '', bPort: '', network: '', aIp: '', bIp: '' };
    state.links.push(link);
    return link;
  }

  function removeLink(id) { const i = state.links.findIndex(l => l.id === id); if (i >= 0) state.links.splice(i,1); }
  const getNode = id => state.nodes.find(n => n.id === id);

  function inferLinkMode(link, catalog) {
    const a = catalog.getDevice(getNode(link.a)?.profileId);
    const b = catalog.getDevice(getNode(link.b)?.profileId);
    if (!a || !b) return 'access';
    const switchLike = f => ['l2switch','l3switch'].includes(f);
    const routed = f => ['router','l3switch','firewall'].includes(f);
    const vlanActive = usesVlans();

    if (switchLike(a.family) && switchLike(b.family)) return vlanActive ? 'trunk' : 'access';
    if ((a.family === 'ap' || a.family === 'wlc') && switchLike(b.family)) return vlanActive ? 'trunk' : 'access';
    if ((b.family === 'ap' || b.family === 'wlc') && switchLike(a.family)) return vlanActive ? 'trunk' : 'access';
    if (routed(a.family) && routed(b.family)) return 'routed';
    if ((a.family === 'router' && b.family === 'l2switch') || (b.family === 'router' && a.family === 'l2switch')) return vlanActive ? 'trunk' : 'access';
    if ((a.family === 'router' && b.family === 'l3switch') || (b.family === 'router' && a.family === 'l3switch')) return 'routed';
    return 'access';
  }

  function effectiveLinkMode(link, catalog) {
    return link.mode === 'auto' ? inferLinkMode(link, catalog) : link.mode;
  }

  function portSequence(profile) {
    const out = [];
    const p = profile.ports || {};
    for (let i=0;i<(p.gigabit||0);i++) out.push(`GigabitEthernet0/${i}`);
    for (let i=1;i<=(p.fast||0);i++) out.push(`FastEthernet0/${i}`);
    for (let i=0;i<(p.serial||0);i++) out.push(`Serial0/${i}/0`);
    if (!out.length) out.push('Port0');
    return out;
  }

  function assignPorts(catalog) {
    const used = new Map();
    state.nodes.forEach(n => used.set(n.id, 0));
    state.links.forEach(link => {
      const na = getNode(link.a), nb = getNode(link.b);
      const pa = catalog.getDevice(na.profileId), pb = catalog.getDevice(nb.profileId);
      const sa = portSequence(pa), sb = portSequence(pb);
      if (!link.aPort) link.aPort = sa[Math.min(used.get(na.id), sa.length-1)];
      if (!link.bPort) link.bPort = sb[Math.min(used.get(nb.id), sb.length-1)];
      used.set(na.id, used.get(na.id)+1); used.set(nb.id, used.get(nb.id)+1);
      link.resolvedMode = effectiveLinkMode(link, catalog);
    });
  }

  function parseBase() {
    if (!subnetApi) throw new Error('Subnet Engine ไม่พร้อมใช้งาน');
    // Backward-compatible import: ignore old /xx suffix because v2.3 always auto-calculates it.
    const ip = String(state.baseNetwork || '').trim().split('/')[0];
    if (!subnetApi.validateIpv4(ip)) throw new Error('Base Network ต้องเป็น IPv4 รูป x.x.x.x เช่น 10.10.0.0');
    const result = subnetApi.calculateAutoSubnet(ip);
    return result;
  }

  function previewBase() { return parseBase(); }

  function makeFlatSegment(base) {
    return {
      id: null,
      name: 'FLAT_LAN',
      network: base.networkAddress,
      gateway: base.firstUsableHost,
      cidr: base.cidr,
      mask: base.subnetMask,
      broadcast: base.broadcastAddress,
      firstUsable: base.firstUsableHost,
      lastUsable: base.lastUsableHost
    };
  }

  function clearPlannedVlanFields() {
    state.vlans.forEach(v => {
      delete v.network; delete v.gateway; delete v.mask; delete v.broadcast;
    });
  }

  function planAddresses(catalog) {
    const base = parseBase();
    state.baseNetwork = base.inputIp;
    state.baseInfo = base;
    state.flatNetwork = makeFlatSegment(base);
    state.vlanEnabled = usesVlans();

    const baseInt = subnetApi.ipToInt(base.networkAddress);
    const baseCidr = base.cidr;
    const totalSize = 2 ** (32 - baseCidr);

    clearPlannedVlanFields();
    if (state.vlanEnabled) {
      ensureDefaultVlans();
      if (baseCidr > 24) throw new Error('เมื่อใช้ VLAN ระบบต้องมี Base Network /24 หรือใหญ่กว่า เช่น 10.10.0.0 → Auto /16');
      state.vlans.forEach((v, idx) => {
        const offset = idx * 256;
        if (offset + 255 >= totalSize) throw new Error('Base Network เล็กเกินจำนวน VLAN ที่เลือก');
        const netInt = (baseInt + offset) >>> 0;
        v.network = subnetApi.intToIp(netInt);
        v.gateway = subnetApi.intToIp((netInt + 1) >>> 0);
        v.cidr = 24;
        v.mask = '255.255.255.0';
        v.broadcast = subnetApi.intToIp((netInt + 255) >>> 0);
      });
    }

    // Routed point-to-point links use /30 blocks from the end of the detected base block.
    let routedIndex = 0;
    state.links.forEach(link => {
      link.resolvedMode = effectiveLinkMode(link, catalog);
      link.network = ''; link.aIp = ''; link.bIp = '';
      if (link.resolvedMode !== 'routed') return;
      if (baseCidr > 30) throw new Error('Base Network เล็กเกินไปสำหรับ Routed /30 link');
      const start = (baseInt + totalSize - 4 - (routedIndex * 4)) >>> 0;
      if (start < baseInt) throw new Error('Base Network ไม่มีพื้นที่พอสำหรับ Routed links');
      link.network = `${subnetApi.intToIp(start)}/30`;
      link.aIp = subnetApi.intToIp((start + 1) >>> 0);
      link.bIp = subnetApi.intToIp((start + 2) >>> 0);
      routedIndex++;
    });

    state.nodes.forEach(n => { n.settings.gatewayOwner = false; n.settings.hsrpMember = false; n.settings.sviIps = {}; });
    const l3Nodes = state.nodes.filter(n => ['l3switch','router','firewall'].includes(catalog.getDevice(n.profileId).family));

    if (state.vlanEnabled) {
      const l3Switches = l3Nodes.filter(n => catalog.getDevice(n.profileId).family === 'l3switch');
      const hsrpMembers = l3Switches.filter(n => n.features?.hsrp);
      let gatewayOwner = l3Switches[0] || l3Nodes[0];
      if (hsrpMembers.length >= 2) {
        hsrpMembers.forEach((n, memberIndex) => {
          n.settings.hsrpMember = true;
          state.vlans.forEach(v => {
            n.settings.sviIps[v.id] = subnetApi.intToIp((subnetApi.ipToInt(v.network) + 2 + memberIndex) >>> 0);
          });
        });
        gatewayOwner = null;
      } else if (gatewayOwner) gatewayOwner.settings.gatewayOwner = true;
    }

    const segments = state.vlanEnabled ? state.vlans : [state.flatNetwork];
    state.nodes.forEach((n, idx) => {
      const p = catalog.getDevice(n.profileId);
      const segment = state.vlanEnabled
        ? (state.vlans.find(v => v.id === Number(n.settings.accessVlan)) || state.vlans[0])
        : state.flatNetwork;
      if (!segment) return;
      if (['endpoint','server','phone','iot'].includes(p.family)) {
        const netInt = subnetApi.ipToInt(segment.network);
        const hostOffset = Math.min(20 + idx, Math.max(2, (2 ** (32 - segment.cidr)) - 2));
        n.settings.plannedIp = subnetApi.intToIp((netInt + hostOffset) >>> 0);
        n.settings.plannedCidr = segment.cidr;
        n.settings.defaultGateway = segment.gateway;
      }
      if (p.family === 'l2switch' && n.features?.managementSvi && !n.settings.managementIp) {
        const netInt = subnetApi.ipToInt(segment.network);
        n.settings.managementIp = subnetApi.intToIp((netInt + Math.min(200 + idx, Math.max(2, (2 ** (32-segment.cidr)) - 2))) >>> 0);
        n.settings.defaultGateway = segment.gateway;
      }
    });

    return { base, vlanEnabled: state.vlanEnabled, segments };
  }

  function validate(catalog) {
    const errors = [], warnings = [];
    if (!state.nodes.length) errors.push('ยังไม่มีอุปกรณ์ใน Topology');
    const names = state.nodes.map(n => n.name.trim().toLowerCase()).filter(Boolean);
    const dup = names.find((n,i) => names.indexOf(n) !== i);
    if (dup) errors.push(`Hostname ซ้ำ: ${dup}`);
    state.nodes.forEach(n => {
      const degree = state.links.filter(l => l.a === n.id || l.b === n.id).length;
      if (degree === 0 && state.nodes.length > 1) warnings.push(`${n.name} ยังไม่ได้เชื่อมกับอุปกรณ์อื่น`);
    });
    state.links.forEach(l => {
      if (!getNode(l.a) || !getNode(l.b)) errors.push('พบลิงก์ที่อ้างอิงอุปกรณ์หายไป');
    });

    if (usesVlans()) {
      ensureDefaultVlans();
      const vlanIds = state.vlans.map(v => Number(v.id));
      const duplicateVlan = vlanIds.find((v,i) => vlanIds.indexOf(v) !== i);
      if (duplicateVlan) errors.push(`VLAN ID ${duplicateVlan} ซ้ำ`);
      if (vlanIds.some(v => v < 1 || v > 4094 || !Number.isInteger(v))) errors.push('VLAN ID ต้องอยู่ระหว่าง 1-4094');
    }
    try { parseBase(); } catch (e) { errors.push(e.message); }
    return { errors, warnings };
  }

  return {
    state, reset, addNode, removeNode, addLink, removeLink, getNode,
    inferLinkMode, effectiveLinkMode, assignPorts, planAddresses, validate, portSequence,
    parseBase, previewBase, usesVlans, ensureDefaultVlans, VLAN_INTENT_FEATURES
  };
});
