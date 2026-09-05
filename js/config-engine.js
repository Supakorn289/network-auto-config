/** NET-AUTO // topology-aware configuration generator. */
(function (root, factory) {
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.NetConfigEngine = api;
})(typeof window !== 'undefined' ? window : globalThis, function () {
  const yes = (node, feature) => !!node.features?.[feature];
  const clean = v => String(v ?? '').trim();
  const VLAN_INTENT_FEATURES = new Set(['vlanDatabase','interVlan','routerOnStick','nativeVlan','vtp','dhcpSnooping','dai','hsrp','wlanVlanMap','ipPhone']);

  const maskFromCidr = cidr => {
    const n = Number(cidr); const mask = n === 0 ? 0 : (~0 << (32-n)) >>> 0;
    return [24,16,8,0].map(s => (mask >>> s) & 255).join('.');
  };
  const wildcard = mask => mask.split('.').map(x => 255 - Number(x)).join('.');
  const vlanActive = state => !!state.vlanEnabled || state.nodes?.some(n => Object.entries(n.features || {}).some(([f,on]) => on && VLAN_INTENT_FEATURES.has(f)));
  const segments = state => {
    if (vlanActive(state)) return (state.vlans || []).filter(v => v.network && v.mask);
    return state.flatNetwork?.network ? [state.flatNetwork] : [];
  };
  const segmentWildcard = seg => wildcard(seg.mask || maskFromCidr(seg.cidr || 24));

  function header(node, profile) {
    return [
      '! ============================================================',
      `! NET-AUTO // ${node.name} // ${profile.name}`,
      '! Generated from topology + user intent',
      '! Paste in GLOBAL CONFIGURATION MODE unless a step says otherwise.',
      '! Verify commands in your exact Packet Tracer device/IOS image.',
      '! ============================================================', ''
    ];
  }

  function commonIos(lines, node) {
    if (yes(node,'hostname')) lines.push(`hostname ${node.name}`,'');
    if (yes(node,'disableDnsLookup')) lines.push('no ip domain-lookup','');
    if (yes(node,'passwordEncryption')) lines.push('service password-encryption','');
    if (yes(node,'enableSecret')) lines.push(`enable secret ${clean(node.settings.secret) || 'NetAuto123!'}`,'');
    if (yes(node,'localUser')) lines.push(`username ${clean(node.settings.username) || 'admin'} privilege 15 secret ${clean(node.settings.secret) || 'NetAuto123!'}`,'');
    if (yes(node,'banner')) lines.push('banner motd ^AUTHORIZED USERS ONLY^','');
    if (yes(node,'ssh')) {
      const domain = clean(node.settings.domain) || 'netauto.local';
      lines.push(`ip domain-name ${domain}`,'crypto key generate rsa general-keys modulus 1024','ip ssh version 2','line vty 0 4',' login local',' transport input ssh',' exec-timeout 15 0','exit','');
    }
    if (yes(node,'ntp') && clean(node.settings.ntpServer)) lines.push(`ntp server ${clean(node.settings.ntpServer)}`,'');
    if (yes(node,'syslog') && clean(node.settings.syslogServer)) lines.push(`logging host ${clean(node.settings.syslogServer)}`,'');
  }

  function nodeLinks(node, state) {
    return state.links.filter(l => l.a === node.id || l.b === node.id).map(l => ({
      ...l,
      mode: l.resolvedMode || (l.mode === 'auto' ? 'access' : l.mode),
      localPort: l.a === node.id ? l.aPort : l.bPort,
      localIp: l.a === node.id ? l.aIp : l.bIp,
      peerIp: l.a === node.id ? l.bIp : l.aIp,
      peerId: l.a === node.id ? l.b : l.a
    }));
  }

  function generateSwitch(node, profile, state, isL3) {
    const lines = header(node, profile); commonIos(lines,node);
    const useVlans = vlanActive(state);
    const nets = segments(state);

    if (useVlans && yes(node,'vlanDatabase')) {
      lines.push('! --- VLAN DATABASE ---');
      state.vlans.forEach(v => lines.push(`vlan ${v.id}`,` name ${v.name}`,'exit'));
      lines.push('');
    }

    if (isL3 && useVlans && yes(node,'interVlan') && (node.settings.gatewayOwner || node.settings.hsrpMember)) {
      lines.push('ip routing','');
      state.vlans.forEach(v => {
        const sviIp = node.settings.hsrpMember ? node.settings.sviIps?.[v.id] : v.gateway;
        lines.push(`interface Vlan${v.id}`,` description GATEWAY_${v.name}`,` ip address ${sviIp} ${v.mask || '255.255.255.0'}`);
        if (node.settings.hsrpMember && yes(node,'hsrp')) {
          const prio = 110 - Math.max(0, state.nodes.filter(n=>n.settings?.hsrpMember).indexOf(node) * 10);
          lines.push(` standby ${v.id} ip ${v.gateway}`,` standby ${v.id} priority ${prio}`,` standby ${v.id} preempt`);
        }
        if (yes(node,'ipv6')) lines.push(` ipv6 address 2001:DB8:${Number(v.id).toString(16)}::${node.settings.hsrpMember ? '2' : '1'}/64`);
        lines.push(' no shutdown','exit','');
      });
    } else if (isL3 && !useVlans && yes(node,'ipv4Interface') && state.flatNetwork?.gateway) {
      // Flat LAN needs no custom VLAN input; the default VLAN 1 becomes the LAN SVI automatically.
      lines.push('ip routing','',
        'interface Vlan1',' description NET_AUTO_FLAT_LAN',
        ` ip address ${state.flatNetwork.gateway} ${state.flatNetwork.mask}`,
        ' no shutdown','exit','');
    } else if (!isL3 && yes(node,'managementSvi') && clean(node.settings.managementIp)) {
      const mgmtVlan = useVlans ? (Number(node.settings.managementVlan) || state.vlans[0]?.id || 1) : 1;
      const mask = useVlans ? (state.vlans.find(v=>Number(v.id)===Number(mgmtVlan))?.mask || '255.255.255.0') : (state.flatNetwork?.mask || '255.255.255.0');
      lines.push(`interface Vlan${mgmtVlan}`,` ip address ${node.settings.managementIp} ${mask}`,' no shutdown','exit');
      if (clean(node.settings.defaultGateway)) lines.push(`ip default-gateway ${node.settings.defaultGateway}`);
      lines.push('');
    }

    nodeLinks(node,state).forEach(link => {
      if (!link.localPort || link.localPort === 'Port0') return;
      if (link.mode === 'trunk' && yes(node,'trunking')) {
        lines.push(`interface ${link.localPort}`,' description NET_AUTO_TRUNK',' switchport mode trunk');
        if (useVlans) {
          const allowed = clean(link.allowedVlans) || state.vlans.map(v=>v.id).join(',');
          if (allowed) lines.push(` switchport trunk allowed vlan ${allowed}`);
          if (yes(node,'nativeVlan')) lines.push(` switchport trunk native vlan ${Number(node.settings.nativeVlan)||99}`);
        }
        if (yes(node,'dhcpSnooping') && useVlans) lines.push(' ip dhcp snooping trust');
        if (yes(node,'dai') && useVlans) lines.push(' ip arp inspection trust');
        lines.push(' no shutdown','exit','');
      } else if (link.mode === 'access' && yes(node,'accessPorts')) {
        lines.push(`interface ${link.localPort}`,' description NET_AUTO_ACCESS',' switchport mode access');
        if (useVlans) lines.push(` switchport access vlan ${Number(link.vlan)||state.vlans[0]?.id||10}`);
        if (yes(node,'portFast')) lines.push(' spanning-tree portfast');
        if (yes(node,'bpduGuard')) lines.push(' spanning-tree bpduguard enable');
        if (yes(node,'portSecurity')) lines.push(' switchport port-security',' switchport port-security maximum 2',' switchport port-security violation restrict',' switchport port-security mac-address sticky');
        lines.push(' no shutdown','exit','');
      } else if (link.mode === 'routed' && isL3) {
        lines.push(`interface ${link.localPort}`,' no switchport',` ip address ${link.localIp} 255.255.255.252`);
        if (yes(node,'ipv6')) {
          const idx = state.links.findIndex(x=>x.id===link.id)+1;
          const side = link.a===node.id ? 1 : 2;
          lines.push(` ipv6 address 2001:DB8:FF${idx.toString(16)}::${side}/64`);
        }
        lines.push(' no shutdown','exit','');
      }
    });

    if (yes(node,'stp')) lines.push('spanning-tree mode rapid-pvst','');
    if (useVlans && yes(node,'vtp')) lines.push(`vtp domain ${clean(node.settings.vtpDomain)||'NETAUTO'}`,`vtp mode ${clean(node.settings.vtpMode)||'transparent'}`,'');
    if (useVlans && yes(node,'dhcpSnooping')) lines.push('ip dhcp snooping',`ip dhcp snooping vlan ${state.vlans.map(v=>v.id).join(',')}`,'');
    if (useVlans && yes(node,'dai')) lines.push(`ip arp inspection vlan ${state.vlans.map(v=>v.id).join(',')}`,'');
    if (yes(node,'etherchannel') && clean(node.settings.channelPorts)) lines.push(`interface range ${clean(node.settings.channelPorts)}`,` channel-group ${Number(node.settings.channelGroup)||1} mode active`,'exit',`interface Port-channel${Number(node.settings.channelGroup)||1}`,' switchport mode trunk','exit','');
    if (isL3) routingFeatures(lines,node,state);
    if (yes(node,'dhcpServer') && isL3) dhcpPools(lines,state);
    lines.push('end','write memory');
    return lines.join('\n');
  }

  function dhcpPools(lines,state) {
    const nets = segments(state);
    if (!nets.length) return;
    lines.push('! --- DHCP POOLS ---');
    nets.forEach((seg,index) => {
      const suffix = vlanActive(state) ? `VLAN_${seg.id}` : 'FLAT_LAN';
      const first = seg.gateway;
      const exclusionEnd = seg.network.split('.').map(Number);
      // Reserve up to the first 20 addresses without assuming a /24.
      const base = exclusionEnd.reduce((acc,o)=>(acc*256)+o,0);
      const maxHosts = Math.max(2, 2 ** (32 - Number(seg.cidr || 24)) - 2);
      const endInt = base + Math.min(20,maxHosts);
      const endIp = [(endInt>>>24)&255,(endInt>>>16)&255,(endInt>>>8)&255,endInt&255].join('.');
      lines.push(`ip dhcp excluded-address ${first} ${endIp}`,`ip dhcp pool ${suffix}`,` network ${seg.network} ${seg.mask}`,` default-router ${seg.gateway}`,' dns-server 8.8.8.8','exit','');
    });
  }

  function routingFeatures(lines,node,state) {
    const routed = nodeLinks(node,state).filter(l => l.mode === 'routed');
    const nets = segments(state);
    if (yes(node,'staticRoute') && clean(node.settings.wanGateway)) lines.push(`ip route 0.0.0.0 0.0.0.0 ${clean(node.settings.wanGateway)}`,'');
    if (yes(node,'ipv6')) lines.push('ipv6 unicast-routing','');
    if (yes(node,'rip')) {
      lines.push('router rip',' version 2',' no auto-summary');
      nets.forEach(v => lines.push(` network ${v.network}`)); lines.push('exit','');
    }
    if (yes(node,'ospf')) {
      lines.push(`router ospf ${Number(node.settings.ospfProcess)||1}`);
      nets.forEach(v => lines.push(` network ${v.network} ${segmentWildcard(v)} area ${Number(node.settings.ospfArea)||0}`));
      routed.forEach(l => { const net = l.network?.split('/')[0]; if(net) lines.push(` network ${net} 0.0.0.3 area ${Number(node.settings.ospfArea)||0}`); });
      lines.push('exit','');
    }
    if (yes(node,'eigrp')) {
      lines.push(`router eigrp ${Number(node.settings.eigrpAs)||100}`,' no auto-summary');
      nets.forEach(v => lines.push(` network ${v.network} ${segmentWildcard(v)}`)); lines.push('exit','');
    }
    if (yes(node,'bgp')) {
      lines.push(`router bgp ${Number(node.settings.bgpAs)||65001}`);
      routed.forEach(l => {
        const peer = state.nodes.find(n=>n.id===l.peerId);
        if (l.peerIp && peer) lines.push(` neighbor ${l.peerIp} remote-as ${Number(peer.settings?.bgpAs)||65001}`);
      });
      lines.push('exit','');
    }
    if (yes(node,'acl')) {
      const base = state.baseInfo || state.flatNetwork;
      if (base?.networkAddress || base?.network) {
        const net = base.networkAddress || base.network;
        const mask = base.subnetMask || base.mask || maskFromCidr(base.cidr || 24);
        lines.push(`access-list 99 permit ${net} ${wildcard(mask)}`,'line vty 0 4',' access-class 99 in','exit','');
      }
    }
  }

  function generateRouter(node, profile, state) {
    const lines = header(node,profile); commonIos(lines,node);
    const links = nodeLinks(node,state);
    const useVlans = vlanActive(state);
    let flatLanAssigned = false;

    links.forEach(link => {
      if (!link.localPort || link.localPort === 'Port0') return;
      if (link.mode === 'routed') {
        lines.push(`interface ${link.localPort}`,' description NET_AUTO_ROUTED_LINK',` ip address ${link.localIp} 255.255.255.252`);
        if (yes(node,'ipv6')) { const idx=state.links.findIndex(x=>x.id===link.id)+1; const side=link.a===node.id?1:2; lines.push(` ipv6 address 2001:DB8:FF${idx.toString(16)}::${side}/64`); }
        if (link.localPort.startsWith('Serial') && yes(node,'ppp')) { lines.push(' encapsulation ppp'); if (clean(node.settings.pppChapUser)) lines.push(' ppp authentication chap'); }
        if (link.localPort.startsWith('Serial') && yes(node,'serialWan') && clean(node.settings.clockRate)) lines.push(` clock rate ${clean(node.settings.clockRate)}`);
        lines.push(' no shutdown','exit','');
      } else if (link.mode === 'trunk' && useVlans) {
        state.vlans.forEach(v => lines.push(`interface ${link.localPort}.${v.id}`,` encapsulation dot1Q ${v.id}`,` ip address ${v.gateway} ${v.mask || '255.255.255.0'}`,' no shutdown','exit',''));
        lines.push(`interface ${link.localPort}`,' no shutdown','exit','');
      } else if (!flatLanAssigned) {
        const seg = useVlans ? (state.vlans.find(v=>Number(v.id)===Number(link.vlan)) || state.vlans[0]) : state.flatNetwork;
        if (seg?.gateway) {
          lines.push(`interface ${link.localPort}`,' description NET_AUTO_LAN',` ip address ${seg.gateway} ${seg.mask}`,' no shutdown','exit','');
          flatLanAssigned = true;
        }
      } else {
        lines.push(`interface ${link.localPort}`,' description NET_AUTO_LAN_LINK',' no shutdown','exit','');
      }
    });

    if (yes(node,'dhcpServer')) dhcpPools(lines,state);
    if (yes(node,'dhcpRelay') && clean(node.settings.helperAddress)) {
      links.filter(l=>l.mode==='routed').forEach(l=>lines.push(`interface ${l.localPort}`,` ip helper-address ${clean(node.settings.helperAddress)}`,'exit'));
      lines.push('');
    }
    if (yes(node,'staticNat') && clean(node.settings.staticNatLocal) && clean(node.settings.staticNatGlobal)) lines.push(`ip nat inside source static ${clean(node.settings.staticNatLocal)} ${clean(node.settings.staticNatGlobal)}`,'');
    if (yes(node,'natPat')) {
      const routedLinks = links.filter(l => l.mode === 'routed');
      if (routedLinks[0]) {
        lines.push(`interface ${routedLinks[0].localPort}`,' ip nat outside','exit');
        const lanLink = links.find(l=>l.mode!=='routed');
        if (lanLink) lines.push(`interface ${lanLink.localPort}`,' ip nat inside','exit');
        segments(state).forEach(seg => lines.push(`access-list 1 permit ${seg.network} ${segmentWildcard(seg)}`));
        lines.push(`ip nat inside source list 1 interface ${routedLinks[0].localPort} overload`,'');
      } else lines.push('! NAT/PAT selected: connect at least one routed WAN link and review inside/outside interfaces.','');
    }
    routingFeatures(lines,node,state);
    lines.push('end','write memory'); return lines.join('\n');
  }

  function generateAsa(node, profile, state) {
    const lines = header(node,profile);
    lines.push(`hostname ${node.name}`);
    if (yes(node,'enableSecret')) lines.push(`enable password ${clean(node.settings.secret)||'NetAuto123!'}`);
    const links = nodeLinks(node,state).filter(l=>l.mode==='routed');
    if (links[0]) lines.push(`interface ${links[0].localPort}`,' nameif outside',' security-level 0',` ip address ${links[0].localIp} 255.255.255.252`,' no shutdown','exit');
    if (links[1]) lines.push(`interface ${links[1].localPort}`,' nameif inside',' security-level 100',` ip address ${links[1].localIp} 255.255.255.252`,' no shutdown','exit');
    lines.push('! ASA syntax differs by model/software. Verify NAT/ACL syntax on ASA 5505 vs 5506-X before pasting advanced policy.');
    lines.push('write memory'); return lines.join('\n');
  }

  function selectedSegment(node,state) {
    if (vlanActive(state)) return state.vlans.find(v=>v.id===Number(node.settings.accessVlan)) || state.vlans[0];
    return state.flatNetwork;
  }

  function generateGuide(node, profile, state) {
    const seg = selectedSegment(node,state);
    const ip = node.settings.plannedIp || 'DHCP';
    const vlanLine = vlanActive(state) && seg?.id != null ? `\n- VLAN: ${seg.id} — ${seg.name}` : '';
    if (profile.family === 'server') return `DEVICE: ${node.name} (${profile.name})\nPacket Tracer > Desktop > IP Configuration\n- Mode: ${yes(node,'endpointIp') ? 'DHCP หรือ Static ตามโจทย์' : 'Static'}\n- Suggested IP: ${ip}\n- Subnet Mask: ${seg?.mask || ''}\n- Default Gateway: ${node.settings.defaultGateway || seg?.gateway || ''}${vlanLine}\n\nPacket Tracer > Services\n- เปิดเฉพาะบริการที่เลือก เช่น DHCP / DNS / HTTP / TFTP / AAA\n- ตรวจ IP, Subnet Mask และ Default Gateway ให้ตรงกับ Network Plan`;
    if (profile.family === 'wlc') return `DEVICE: ${node.name} (${profile.name})\nใช้ GUI ของ WLC ใน Packet Tracer\n- SSID: ${node.settings.ssid}\n- Security: WPA2${yes(node,'wlanVlanMap') && seg?.id != null ? `\n- WLAN → VLAN: ${seg.id}` : '\n- WLAN ใช้ Flat Network เดียว ไม่ต้องกำหนด VLAN Mapping'}\n- ตรวจ CAPWAP registration ของ Lightweight AP`;
    if (profile.family === 'ap' || profile.family === 'homeRouter') return `DEVICE: ${node.name} (${profile.name})\nใช้ Config/GUI ใน Packet Tracer\n- SSID: ${node.settings.ssid}\n- WPA2 Password: ${node.settings.wifiPassword}\n- Network: ${seg?.network || ''}/${seg?.cidr ?? ''}${vlanLine}`;
    if (profile.family === 'passive') return `DEVICE: ${node.name} (${profile.name})\nอุปกรณ์นี้ไม่ต้องใช้ Cisco IOS CLI ใน workflow ปกติ\nใช้เป็นตัวกลางตาม topology แล้วตรวจการเชื่อมต่อที่ปลายทาง.`;
    return `DEVICE: ${node.name} (${profile.name})\nPacket Tracer > Desktop > IP Configuration\n- Suggested IP: ${ip}\n- Subnet Mask: ${seg?.mask || ''}\n- Default Gateway: ${node.settings.defaultGateway || seg?.gateway || ''}\n- DNS: 8.8.8.8${vlanLine}`;
  }

  function generateDevice(node, profile, state) {
    if (profile.family === 'router') return generateRouter(node,profile,state);
    if (profile.family === 'l2switch') return generateSwitch(node,profile,state,false);
    if (profile.family === 'l3switch') return generateSwitch(node,profile,state,true);
    if (profile.family === 'firewall') return generateAsa(node,profile,state);
    return generateGuide(node,profile,state);
  }

  function testChecklist(state, catalog) {
    const useVlans = vlanActive(state);
    const tests = ['ตรวจว่า link ทุกเส้นเป็นสีเขียว/Up ใน Packet Tracer', useVlans ? 'ทดสอบ ping จาก End Device ไป Default Gateway ของ VLAN ตัวเอง' : 'ทดสอบ ping จาก End Device ไป Default Gateway ของ Flat Network'];
    const families = state.nodes.map(n=>catalog.getDevice(n.profileId).family);
    if (useVlans && state.vlans.length > 1 && families.includes('l3switch')) tests.push('ทดสอบ ping ข้าม VLAN (Inter-VLAN Routing)');
    if (state.nodes.some(n=>yes(n,'dhcpServer'))) tests.push('ตั้ง End Device เป็น DHCP แล้วตรวจ IP / Gateway / DNS ที่ได้รับ');
    if (state.nodes.some(n=>yes(n,'ospf'))) tests.push('บน Router/L3 Switch: show ip ospf neighbor และ show ip route');
    if (state.nodes.some(n=>yes(n,'eigrp'))) tests.push('บน Router/L3 Switch: show ip eigrp neighbors และ show ip route');
    if (state.nodes.some(n=>yes(n,'natPat'))) tests.push('ทดสอบออกเครือข่าย WAN และตรวจ show ip nat translations');
    if (families.some(f=>['l2switch','l3switch'].includes(f))) tests.push(useVlans ? 'บน Switch: show vlan brief และ show interfaces trunk' : 'บน Switch: show interfaces status และตรวจพอร์ตที่เชื่อมต่อ');
    tests.push('บันทึกไฟล์ .pkt หลังทดสอบผ่าน และค่อยนำ config ไปใช้กับ topology จริง');
    return tests;
  }

  return { generateDevice, testChecklist, maskFromCidr, wildcard, vlanActive, segments };
});
