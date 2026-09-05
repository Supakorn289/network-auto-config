/**
 * NET-AUTO // Packet Tracer-oriented device catalog and feature registry.
 * Catalog-driven by design: add a device profile here and the palette/question engine updates automatically.
 */
(function (root, factory) {
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.NetCatalog = api;
})(typeof window !== 'undefined' ? window : globalThis, function () {
  const FEATURES = {
    hostname: { label: 'ตั้งชื่ออุปกรณ์ (Hostname)', group: 'พื้นฐาน', default: true },
    enableSecret: { label: 'Enable Secret', group: 'ความปลอดภัย', default: true },
    localUser: { label: 'Local Admin User', group: 'ความปลอดภัย', default: true },
    ssh: { label: 'SSH / VTY', group: 'ความปลอดภัย', default: true },
    banner: { label: 'Banner MOTD', group: 'ความปลอดภัย', default: false },
    passwordEncryption: { label: 'Service Password Encryption', group: 'ความปลอดภัย', default: true },
    disableDnsLookup: { label: 'Disable DNS Lookup', group: 'พื้นฐาน', default: true },
    ntp: { label: 'NTP', group: 'บริการ', default: false },
    syslog: { label: 'Syslog / Logging', group: 'บริการ', default: false },

    ipv4Interface: { label: 'IPv4 บน Interface', group: 'Layer 3', default: true },
    ipv6: { label: 'IPv6', group: 'Layer 3', default: false },
    staticRoute: { label: 'Static Route / Default Route', group: 'Routing', default: true },
    rip: { label: 'RIP v2', group: 'Routing', default: false },
    ospf: { label: 'OSPF', group: 'Routing', default: false },
    eigrp: { label: 'EIGRP', group: 'Routing', default: false },
    bgp: { label: 'BGP', group: 'Routing', default: false, note: 'ขึ้นกับรุ่น/IOS ใน Packet Tracer' },
    acl: { label: 'ACL', group: 'ความปลอดภัย', default: false },
    natPat: { label: 'NAT/PAT Overload', group: 'บริการ', default: false },
    staticNat: { label: 'Static NAT', group: 'บริการ', default: false },
    dhcpServer: { label: 'DHCP Server', group: 'บริการ', default: false },
    dhcpRelay: { label: 'DHCP Relay (ip helper-address)', group: 'บริการ', default: false },
    routerOnStick: { label: 'Router-on-a-Stick / Subinterface', group: 'VLAN', default: false },
    serialWan: { label: 'Serial WAN / Clock Rate', group: 'WAN', default: false },
    ppp: { label: 'PPP / CHAP', group: 'WAN', default: false },

    vlanDatabase: { label: 'สร้าง VLAN', group: 'VLAN', default: false },
    accessPorts: { label: 'Access Port', group: 'VLAN', default: true },
    trunking: { label: '802.1Q Trunk', group: 'VLAN', default: true },
    nativeVlan: { label: 'Native VLAN', group: 'VLAN', default: false },
    managementSvi: { label: 'Management SVI', group: 'VLAN', default: false },
    interVlan: { label: 'Inter-VLAN Routing / SVI Gateway', group: 'Layer 3', default: false },
    stp: { label: 'STP / Rapid-PVST', group: 'Switching', default: true },
    portFast: { label: 'PortFast', group: 'Switching', default: true },
    bpduGuard: { label: 'BPDU Guard', group: 'Switching', default: false },
    portSecurity: { label: 'Port Security', group: 'ความปลอดภัย', default: false },
    etherchannel: { label: 'EtherChannel (LACP/PAgP)', group: 'Switching', default: false },
    vtp: { label: 'VTP', group: 'VLAN', default: false },
    dhcpSnooping: { label: 'DHCP Snooping', group: 'ความปลอดภัย', default: false, note: 'ขึ้นกับรุ่น/IOS' },
    dai: { label: 'Dynamic ARP Inspection', group: 'ความปลอดภัย', default: false, note: 'ขึ้นกับรุ่น/IOS' },
    hsrp: { label: 'HSRP', group: 'High Availability', default: false },

    ssid: { label: 'SSID / WLAN', group: 'Wireless', default: true },
    wlanSecurity: { label: 'WPA2 / Wireless Security', group: 'Wireless', default: true },
    capwap: { label: 'CAPWAP / WLC Join', group: 'Wireless', default: true },
    wlanVlanMap: { label: 'WLAN → VLAN Mapping', group: 'Wireless', default: false },

    asaInterfaces: { label: 'ASA Inside / Outside Interfaces', group: 'Firewall', default: true },
    asaAcl: { label: 'ASA Access Rules', group: 'Firewall', default: true },
    asaNat: { label: 'ASA NAT/PAT', group: 'Firewall', default: true },

    endpointIp: { label: 'IP แบบ DHCP หรือ Static', group: 'End Device', default: true },
    endpointDns: { label: 'DNS / Gateway', group: 'End Device', default: true },
    serverServices: { label: 'Server Services (DHCP/DNS/HTTP/TFTP/AAA)', group: 'Server', default: false },
    ipPhone: { label: 'IP Phone / Voice VLAN', group: 'Voice', default: false },
    iotRegistration: { label: 'IoT Registration / Wireless', group: 'IoT', default: true }
  };

  const families = {
    router: ['hostname','enableSecret','localUser','ssh','banner','passwordEncryption','disableDnsLookup','ipv4Interface','ipv6','staticRoute','rip','ospf','eigrp','bgp','acl','natPat','staticNat','dhcpServer','dhcpRelay','routerOnStick','serialWan','ppp','ntp','syslog'],
    l2switch: ['hostname','enableSecret','localUser','ssh','banner','passwordEncryption','disableDnsLookup','vlanDatabase','accessPorts','trunking','nativeVlan','managementSvi','stp','portFast','bpduGuard','portSecurity','etherchannel','vtp','dhcpSnooping','dai','ntp','syslog'],
    l3switch: ['hostname','enableSecret','localUser','ssh','banner','passwordEncryption','disableDnsLookup','vlanDatabase','accessPorts','trunking','nativeVlan','managementSvi','interVlan','ipv4Interface','ipv6','staticRoute','rip','ospf','eigrp','acl','dhcpServer','dhcpRelay','stp','portFast','bpduGuard','portSecurity','etherchannel','vtp','dhcpSnooping','dai','hsrp','ntp','syslog'],
    firewall: ['hostname','enableSecret','localUser','ssh','asaInterfaces','asaAcl','asaNat','staticRoute','dhcpServer','ntp','syslog'],
    wlc: ['ssid','wlanSecurity','capwap','wlanVlanMap','dhcpServer'],
    ap: ['ssid','wlanSecurity','capwap'],
    homeRouter: ['endpointIp','dhcpServer','ssid','wlanSecurity','natPat'],
    server: ['endpointIp','endpointDns','serverServices'],
    endpoint: ['endpointIp','endpointDns'],
    phone: ['endpointIp','endpointDns','ipPhone'],
    iot: ['endpointIp','iotRegistration'],
    passive: []
  };

  const icon = {
    router: 'R', l2switch: 'SW', l3switch: 'L3', firewall: 'FW', wlc: 'WLC', ap: 'AP',
    homeRouter: 'WiFi', server: 'SRV', endpoint: 'PC', phone: 'TEL', iot: 'IoT', passive: 'NET'
  };

  // Visuals are representative category artwork so beginners can recognize a device at a glance.
  const visualByFamily = {
    router: 'router.webp',
    l2switch: 'switch.webp',
    l3switch: 'switch.webp',
    firewall: 'switch.webp',
    wlc: 'switch.webp',
    ap: 'router.webp',
    homeRouter: 'router.webp',
    server: 'server.webp',
    endpoint: 'pc.webp',
    phone: 'phone.webp',
    iot: 'smartphone.webp',
    passive: 'switch.webp'
  };

  const topologyByFamily = {
    router: 'topology-router.webp',
    l2switch: 'topology-switch.webp',
    l3switch: 'topology-switch.webp',
    firewall: 'topology-server.webp',
    wlc: 'topology-switch.webp',
    ap: 'topology-router.webp',
    homeRouter: 'topology-router.webp',
    server: 'topology-server.webp',
    endpoint: 'topology-pc.webp',
    phone: 'topology-phone.webp',
    iot: 'topology-smartphone.webp',
    passive: 'topology-switch.webp'
  };

  function imageFor(id, family) {
    if (id === 'laptop-pt') return 'assets/devices/laptop.webp';
    if (id === 'smartphone-pt' || id === 'tablet-pt') return 'assets/devices/smartphone.webp';
    if (id === 'ipphone-7960') return 'assets/devices/phone.webp';
    if (id === 'server-pt') return 'assets/devices/server.webp';
    if (id === 'pc-pt' || id === 'printer-pt' || id === 'tv-pt' || id === 'custom-device') return 'assets/devices/pc.webp';
    return `assets/devices/${visualByFamily[family] || 'pc.webp'}`;
  }

  function topologyImageFor(id, family) {
    if (id === 'laptop-pt') return 'assets/devices/topology-laptop.webp';
    if (id === 'smartphone-pt' || id === 'tablet-pt') return 'assets/devices/topology-smartphone.webp';
    if (id === 'ipphone-7960') return 'assets/devices/topology-phone.webp';
    if (id === 'server-pt') return 'assets/devices/topology-server.webp';
    if (id === 'pc-pt' || id === 'printer-pt' || id === 'tv-pt' || id === 'custom-device') return 'assets/devices/topology-pc.webp';
    return `assets/devices/${topologyByFamily[family] || 'topology-pc.webp'}`;
  }

  function compactName(name) {
    return String(name || '')
      .replace(/^Cisco\s+/i, '')
      .replace(/\s+Lightweight\s+AP$/i, ' AP')
      .replace(/\s+Multilayer$/i, '')
      .trim();
  }

  function nodePrefixFor(id, family) {
    if (family === 'endpoint') {
      if (id === 'laptop-pt') return 'LAP';
      if (id === 'tablet-pt') return 'TAB';
      if (id === 'smartphone-pt') return 'MOB';
      if (id === 'printer-pt') return 'PRN';
      if (id === 'tv-pt') return 'TV';
      return 'PC';
    }
    if (family === 'router') return 'R';
    if (family === 'l2switch') return 'SW';
    if (family === 'l3switch') return 'MLS';
    if (family === 'firewall') return 'FW';
    if (family === 'wlc') return 'WLC';
    if (family === 'ap') return 'AP';
    if (family === 'homeRouter') return 'WIFI';
    if (family === 'server') return 'SRV';
    if (family === 'phone') return 'IPP';
    if (family === 'iot') return 'IOT';
    if (family === 'passive') return 'NET';
    return 'NODE';
  }

  const mk = (id, name, family, category, ports, extra = {}) => ({
    id,
    name,
    displayName: compactName(name),
    family,
    category,
    icon: icon[family],
    image: imageFor(id, family),
    topologyImage: topologyImageFor(id, family),
    nodePrefix: nodePrefixFor(id, family),
    ports,
    features: families[family],
    ...extra
  });

  const DEVICE_CATALOG = [
    // Routers commonly present across Packet Tracer generations + PT 9 industrial additions.
    mk('r-1841','Cisco 1841', 'router','Routers',{fast:2,serial:2}),
    mk('r-2620xm','Cisco 2620XM', 'router','Routers',{fast:1,serial:2}),
    mk('r-2621xm','Cisco 2621XM', 'router','Routers',{fast:2,serial:2}),
    mk('r-1941','Cisco 1941', 'router','Routers',{gigabit:2,serial:2}),
    mk('r-2811','Cisco 2811', 'router','Routers',{fast:2,serial:2}),
    mk('r-2901','Cisco 2901', 'router','Routers',{gigabit:2,serial:2}),
    mk('r-2911','Cisco 2911', 'router','Routers',{gigabit:3,serial:2}),
    mk('r-4321','Cisco ISR 4321', 'router','Routers',{gigabit:2,serial:2}),
    mk('r-4331','Cisco ISR 4331', 'router','Routers',{gigabit:3,serial:2}),
    mk('r-819hgw','Cisco 819 HGW', 'router','Routers',{gigabit:1,fast:4,cellular:1}),
    mk('r-819iox','Cisco 819 IOX', 'router','Routers',{gigabit:1,fast:4,cellular:1}),
    mk('r-829','Cisco 829', 'router','Routers',{gigabit:4,cellular:1}),
    mk('r-cgr1240','Cisco CGR 1240', 'router','Industrial',{gigabit:3,fast:4,wireless:1}),
    mk('r-ir1101','Cisco Catalyst IR1101', 'router','Industrial',{gigabit:6,cellular:1}),
    mk('r-ir8340','Cisco Catalyst IR8340', 'router','Industrial',{gigabit:12,cellular:1}),
    mk('r-8200','Cisco 8200 Series', 'router','Routers',{gigabit:4}),
    mk('r-generic','Generic Router', 'router','Routers',{gigabit:4,serial:2}),

    // Switching
    mk('sw-2950-24','Catalyst 2950-24', 'l2switch','Switches',{fast:24}),
    mk('sw-2950t','Catalyst 2950T', 'l2switch','Switches',{fast:24,gigabit:2}),
    mk('sw-2960','Catalyst 2960', 'l2switch','Switches',{fast:24,gigabit:2}),
    mk('sw-2960-24tt','Catalyst 2960-24TT', 'l2switch','Switches',{fast:24,gigabit:2}),
    mk('sw-2960t','Catalyst 2960T', 'l2switch','Switches',{fast:24,gigabit:2}),
    mk('sw-generic','Generic L2 Switch', 'l2switch','Switches',{fast:24,gigabit:2}),
    mk('l3-3560','Catalyst 3560 Multilayer', 'l3switch','Multilayer Switches',{fast:24,gigabit:2}),
    mk('l3-3650','Catalyst 3650 Multilayer', 'l3switch','Multilayer Switches',{gigabit:24}),
    mk('l3-generic','Generic Multilayer Switch', 'l3switch','Multilayer Switches',{gigabit:24}),
    mk('sw-industrial','Industrial Ethernet Switch', 'l2switch','Industrial',{fast:8,gigabit:4}),

    // Security / wireless
    mk('fw-asa5505','Cisco ASA 5505', 'firewall','Security',{fast:8}),
    mk('fw-asa5506x','Cisco ASA 5506-X', 'firewall','Security',{gigabit:8}),
    mk('fw-meraki','Meraki Security Appliance', 'firewall','Security',{gigabit:8}),
    mk('wlc-2504','Cisco WLC 2504', 'wlc','Wireless',{gigabit:4}),
    mk('wlc-3504','Cisco WLC 3504', 'wlc','Wireless',{gigabit:5}),
    mk('ap-3702i','Aironet 3702i Lightweight AP', 'ap','Wireless',{gigabit:1,wireless:1}),
    mk('ap-ac','Access Point-AC', 'ap','Wireless',{gigabit:1,wireless:1}),
    mk('ap-generic','Generic Access Point', 'ap','Wireless',{fast:1,wireless:1}),
    mk('home-router','Home Wireless Router', 'homeRouter','Wireless',{fast:4,wireless:2}),

    // WAN / passive emulation
    mk('cloud-pt','Cloud-PT', 'passive','WAN / Infrastructure',{wan:8}),
    mk('cable-modem','Cable Modem', 'passive','WAN / Infrastructure',{coax:1,fast:1}),
    mk('dsl-modem','DSL Modem', 'passive','WAN / Infrastructure',{dsl:1,fast:1}),
    mk('cell-tower','Cell Tower', 'passive','WAN / Infrastructure',{cellular:8}),
    mk('hub-pt','Hub-PT', 'passive','WAN / Infrastructure',{fast:8}),
    mk('bridge-pt','Bridge-PT', 'passive','WAN / Infrastructure',{fast:2}),
    mk('repeater-pt','Repeater-PT', 'passive','WAN / Infrastructure',{fast:2}),

    // End devices
    mk('pc-pt','PC-PT', 'endpoint','End Devices',{fast:1}),
    mk('laptop-pt','Laptop-PT', 'endpoint','End Devices',{fast:1,wireless:1}),
    mk('server-pt','Server-PT', 'server','End Devices',{fast:1}),
    mk('printer-pt','Printer-PT', 'endpoint','End Devices',{fast:1}),
    mk('tablet-pt','Tablet PC', 'endpoint','End Devices',{wireless:1}),
    mk('smartphone-pt','Smartphone', 'endpoint','End Devices',{wireless:1,cellular:1}),
    mk('ipphone-7960','Cisco IP Phone 7960', 'phone','End Devices',{fast:2}),
    mk('tv-pt','TV / Media End Device', 'endpoint','End Devices',{fast:1,wireless:1}),

    // IoT / custom coverage
    mk('iot-home','IoT Home Device', 'iot','IoT',{wireless:1}),
    mk('iot-industrial','Industrial IoT Device / Sensor', 'iot','IoT',{fast:1,wireless:1}),
    mk('custom-device','Custom / Other Packet Tracer Device', 'endpoint','Other',{gigabit:1}, { description: 'ใช้แทนอุปกรณ์ที่มีใน Packet Tracer installation แต่ยังไม่มี profile เฉพาะใน catalog' })
  ];

  function getDevice(id) { return DEVICE_CATALOG.find(d => d.id === id) || DEVICE_CATALOG[0]; }
  function getFeature(id) { return FEATURES[id]; }
  function categories() { return [...new Set(DEVICE_CATALOG.map(d => d.category))]; }
  function defaultFeatureState(device) {
    return Object.fromEntries(device.features.map(id => [id, !!FEATURES[id]?.default]));
  }

  return { FEATURES, DEVICE_CATALOG, getDevice, getFeature, categories, defaultFeatureState };
});
