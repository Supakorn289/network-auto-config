const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Catalog = require('../js/catalog.js');
const Topology = require('../js/topology.js');
const Engine = require('../js/config-engine.js');
const Subnet = require('../js/subnet.js');

function node(profileId,x=0,y=0){
  const p=Catalog.getDevice(profileId);
  const n=Topology.addNode(p,x,y);
  n.features=Catalog.defaultFeatureState(p);
  return n;
}

test.beforeEach(()=>Topology.reset());

test('subnet math remains bitwise-correct for /24',()=>{
  const r=Subnet.calculateSubnet('192.168.10.77',24);
  assert.equal(r.networkAddress,'192.168.10.0');
  assert.equal(r.broadcastAddress,'192.168.10.255');
  assert.equal(r.totalHosts,254);
});

test('automatic prefix inference follows network-style trailing zero octets',()=>{
  assert.equal(Subnet.inferCidr('10.0.0.0'),8);
  assert.equal(Subnet.inferCidr('10.10.0.0'),16);
  assert.equal(Subnet.inferCidr('192.168.1.0'),24);
  assert.equal(Subnet.inferCidr('192.168.1.25'),24);
  const r=Subnet.calculateAutoSubnet('10.10.0.0');
  assert.equal(r.subnetMask,'255.255.0.0');
  assert.equal(r.usableHostRange,'10.10.0.1 - 10.10.255.254');
  assert.equal(r.totalHosts,65534);
});

test('catalog contains broad Packet Tracer-oriented families',()=>{
  const families=new Set(Catalog.DEVICE_CATALOG.map(d=>d.family));
  ['router','l2switch','l3switch','firewall','wlc','ap','server','endpoint','iot','passive'].forEach(f=>assert.ok(families.has(f)));
  assert.ok(Catalog.DEVICE_CATALOG.length >= 40);
});

test('router profile exposes a full feature question set',()=>{
  const r=Catalog.getDevice('r-2911');
  ['staticRoute','rip','ospf','eigrp','bgp','acl','natPat','dhcpServer','dhcpRelay','routerOnStick','ppp','ssh'].forEach(f=>assert.ok(r.features.includes(f),f));
});

test('custom VLAN features are opt-in instead of forced by default',()=>{
  const sw=node('sw-2960-24tt'), l3=node('l3-3560'), phone=node('ipphone-7960');
  assert.equal(sw.features.vlanDatabase,false);
  assert.equal(sw.features.managementSvi,false);
  assert.equal(l3.features.interVlan,false);
  assert.equal(phone.features.ipPhone,false);
  assert.equal(Topology.usesVlans(),false);
});

test('link inference stays flat without VLAN and becomes trunk when VLAN is requested',()=>{
  const pc=node('pc-pt'), sw=node('sw-2960-24tt'), sw2=node('l3-3560'), r=node('r-2911');
  const l1=Topology.addLink(pc.id,sw.id);
  const l2=Topology.addLink(sw.id,sw2.id);
  const l3=Topology.addLink(r.id,sw2.id);
  const l4=Topology.addLink(r.id,sw.id);
  assert.equal(Topology.inferLinkMode(l1,Catalog),'access');
  assert.equal(Topology.inferLinkMode(l2,Catalog),'access');
  assert.equal(Topology.inferLinkMode(l3,Catalog),'routed');
  assert.equal(Topology.inferLinkMode(l4,Catalog),'access');
  sw.features.vlanDatabase=true;
  assert.equal(Topology.usesVlans(),true);
  assert.equal(Topology.inferLinkMode(l2,Catalog),'trunk');
  assert.equal(Topology.inferLinkMode(l4,Catalog),'trunk');
});

test('duplicate logical links are rejected',()=>{
  const a=node('pc-pt'),b=node('sw-2960-24tt');
  Topology.addLink(a.id,b.id);
  assert.throws(()=>Topology.addLink(b.id,a.id),/เชื่อมกันอยู่แล้ว/);
});

test('flat network planner uses auto /16 and does not require VLAN input',()=>{
  const r=node('r-2911'), sw=node('sw-2960-24tt'), pc=node('pc-pt');
  Topology.addLink(r.id,sw.id);Topology.addLink(sw.id,pc.id);
  Topology.assignPorts(Catalog);const plan=Topology.planAddresses(Catalog);
  assert.equal(plan.vlanEnabled,false);
  assert.equal(Topology.state.vlans.length,0);
  assert.equal(Topology.state.baseInfo.cidr,16);
  assert.equal(Topology.state.flatNetwork.network,'10.10.0.0');
  assert.equal(Topology.state.flatNetwork.mask,'255.255.0.0');
  assert.equal(Topology.state.flatNetwork.gateway,'10.10.0.1');
  assert.match(pc.settings.plannedIp,/^10\.10\./);
  assert.equal(pc.settings.plannedCidr,16);
});

test('VLAN planner appears logically only after VLAN feature is enabled and allocates /24s',()=>{
  const l3=node('l3-3560'), sw=node('sw-2960-24tt'), pc=node('pc-pt');
  l3.features.vlanDatabase=true; l3.features.interVlan=true; sw.features.vlanDatabase=true;
  Topology.state.vlans=[{id:10,name:'USERS',cidr:24},{id:20,name:'STAFF',cidr:24}];
  Topology.addLink(l3.id,sw.id);Topology.addLink(sw.id,pc.id);
  Topology.assignPorts(Catalog);const plan=Topology.planAddresses(Catalog);
  assert.equal(plan.vlanEnabled,true);
  assert.equal(Topology.state.vlans[0].network,'10.10.0.0');
  assert.equal(Topology.state.vlans[1].network,'10.10.1.0');
  assert.equal(Topology.state.vlans[0].mask,'255.255.255.0');
});

test('flat L2 switch config contains no custom VLAN commands',()=>{
  const r=node('r-2911'),sw=node('sw-2960-24tt'),pc=node('pc-pt');
  Topology.addLink(r.id,sw.id);Topology.addLink(sw.id,pc.id);
  Topology.assignPorts(Catalog);Topology.planAddresses(Catalog);
  const cfg=Engine.generateDevice(sw,Catalog.getDevice(sw.profileId),Topology.state);
  assert.doesNotMatch(cfg,/\bvlan 10\b/i);
  assert.doesNotMatch(cfg,/switchport access vlan/i);
  assert.match(cfg,/switchport mode access/);
});

test('L3 switch VLAN config includes VLAN database, SVIs, access and trunk only when selected',()=>{
  const l3=node('l3-3560'), sw=node('sw-2960-24tt'), pc=node('pc-pt');
  l3.features.vlanDatabase=true;l3.features.interVlan=true;
  sw.features.vlanDatabase=true;
  Topology.state.vlans=[{id:10,name:'USERS',cidr:24},{id:20,name:'STAFF',cidr:24}];
  Topology.addLink(l3.id,sw.id);Topology.addLink(l3.id,pc.id);
  Topology.assignPorts(Catalog);Topology.planAddresses(Catalog);
  const cfg=Engine.generateDevice(l3,Catalog.getDevice(l3.profileId),Topology.state);
  assert.match(cfg,/vlan 10/);
  assert.match(cfg,/interface Vlan10/);
  assert.match(cfg,/switchport mode trunk/);
  assert.match(cfg,/switchport mode access/);
  assert.match(cfg,/switchport access vlan 10/);
});

test('router OSPF advertises flat auto-detected /16 network',()=>{
  const r=node('r-2911'),l3=node('l3-3560');
  r.features.ospf=true;
  Topology.addLink(r.id,l3.id);Topology.assignPorts(Catalog);Topology.planAddresses(Catalog);
  const cfg=Engine.generateDevice(r,Catalog.getDevice(r.profileId),Topology.state);
  assert.match(cfg,/router ospf 1/);
  assert.match(cfg,/network 10\.10\.0\.0 0\.0\.255\.255 area 0/);
  assert.match(cfg,/255\.255\.255\.252/);
});

test('router-on-a-stick is generated only when a VLAN feature is explicitly selected',()=>{
  const r=node('r-2911'),sw=node('sw-2960-24tt');
  r.features.routerOnStick=true; sw.features.vlanDatabase=true;
  Topology.state.vlans=[{id:10,name:'USERS',cidr:24},{id:20,name:'STAFF',cidr:24}];
  Topology.addLink(r.id,sw.id);Topology.assignPorts(Catalog);Topology.planAddresses(Catalog);
  const cfg=Engine.generateDevice(r,Catalog.getDevice(r.profileId),Topology.state);
  assert.match(cfg,/encapsulation dot1Q 10/);
  assert.match(cfg,/interface GigabitEthernet0\/0\.10/);
});

test('catalog device visual coverage', () => {
  for (const device of Catalog.DEVICE_CATALOG) {
    assert.ok(device.image, `${device.id} should have an image`);
    assert.ok(device.topologyImage, `${device.id} should have a topology image`);
    assert.ok(device.displayName, `${device.id} should have a compact display name`);
    assert.ok(device.nodePrefix, `${device.id} should have a node prefix`);
    assert.match(device.image, /^assets\/devices\/.+\.webp$/);
    assert.match(device.topologyImage, /^assets\/devices\/.+\.webp$/);
  }
});

test('default node naming uses cleaner device-specific prefixes',()=>{
  const router=node('r-2911');
  const l3=node('l3-3560');
  const laptop=node('laptop-pt');
  const phone=node('ipphone-7960');
  const printer=node('printer-pt');
  assert.equal(router.name,'R1');
  assert.equal(l3.name,'MLS1');
  assert.equal(laptop.name,'LAP1');
  assert.equal(phone.name,'IPP1');
  assert.equal(printer.name,'PRN1');
});

test('responsive CSS covers desktop, tablet, phone and small-phone breakpoints',()=>{
  const css=fs.readFileSync(path.join(__dirname,'..','style.css'),'utf8');
  for (const bp of ['1320px','1180px','980px','760px','480px']) assert.ok(css.includes(bp),`missing ${bp}`);
  assert.match(css,/safe-area-inset-bottom/);
  assert.match(css,/--topo-node-w/);
  assert.match(css,/network-calculation/);
});

test('Step 1 accepts only x.x.x.x and VLAN editor exists only in Step 2',()=>{
  const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
  assert.match(html,/id="base-network"[^>]*value="10\.10\.0\.0"/);
  assert.doesNotMatch(html,/value="10\.10\.0\.0\/16"/);
  const vlanIndex=html.indexOf('id="vlan-plan-section"');
  const step2Index=html.indexOf('<!-- STEP 2 -->');
  assert.ok(vlanIndex > step2Index);
  assert.equal((html.match(/id="vlan-editor"/g)||[]).length,1);
});

test('responsive topology JS avoids desktop-only node geometry and renders conditional VLAN UI',()=>{
  const js=fs.readFileSync(path.join(__dirname,'..','js','app.js'),'utf8');
  assert.match(js,/function nodeDimensions\(\)/);
  assert.match(js,/ResizeObserver/);
  assert.match(js,/renderVlanPlan/);
  assert.match(js,/calculate|previewBase/);
  assert.doesNotMatch(js,/rect\.width-156/);
  assert.doesNotMatch(js,/rect\.height-94/);
});
