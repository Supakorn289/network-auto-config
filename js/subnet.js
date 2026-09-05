/**
 * NET-AUTO // IPv4 subnet math + beginner-friendly automatic prefix inference.
 */
(function (root, factory) {
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.NetSubnet = api;
})(typeof window !== 'undefined' ? window : globalThis, function () {
  function validateIpv4(ip) {
    const text = String(ip ?? '').trim();
    const parts = text.split('.');
    if (parts.length !== 4) return false;
    return parts.every(part => /^\d{1,3}$/.test(part) && Number(part) >= 0 && Number(part) <= 255);
  }

  function ipToInt(ip) {
    if (!validateIpv4(ip)) throw new Error('IP Address ต้องอยู่ในรูป x.x.x.x และแต่ละชุดต้องเป็น 0-255');
    return String(ip).split('.').reduce((acc, octet) => ((acc << 8) + Number(octet)) >>> 0, 0) >>> 0;
  }

  function intToIp(int) {
    const value = Number(int) >>> 0;
    return [
      (value >>> 24) & 255,
      (value >>> 16) & 255,
      (value >>> 8) & 255,
      value & 255
    ].join('.');
  }

  /**
   * Infer a practical prefix from a network-style IPv4 address.
   * This is intentionally a UI heuristic because an IPv4 address by itself does not encode a subnet mask.
   * Examples: 10.0.0.0 -> /8, 10.10.0.0 -> /16, 192.168.1.0 -> /24.
   * Host-like addresses default to /24 so the user never has to type /xx.
   */
  function inferCidr(ip) {
    if (!validateIpv4(ip)) throw new Error('IP Address ต้องอยู่ในรูป x.x.x.x และแต่ละชุดต้องเป็น 0-255');
    const [a,b,c,d] = String(ip).split('.').map(Number);
    if (a === 0 && b === 0 && c === 0 && d === 0) return 0;
    if (b === 0 && c === 0 && d === 0) return 8;
    if (c === 0 && d === 0) return 16;
    if (d === 0) return 24;
    return 24;
  }

  function calculateSubnet(ip, cidr) {
    const prefix = Number(cidr);
    if (!validateIpv4(ip) || !Number.isInteger(prefix) || prefix < 0 || prefix > 32) {
      throw new Error('ข้อมูล IP หรือ CIDR ไม่ถูกต้อง');
    }

    const ipInt = ipToInt(ip);
    const mask = prefix === 0 ? 0 : (~0 << (32 - prefix)) >>> 0;
    const netmask = intToIp(mask);
    const netInt = (ipInt & mask) >>> 0;
    const networkAddress = intToIp(netInt);
    const bcInt = (ipInt | ~mask) >>> 0;
    const broadcastAddress = intToIp(bcInt);

    let firstUsable = '';
    let lastUsable = '';
    let totalHosts = 0;
    if (prefix === 32) {
      firstUsable = networkAddress;
      lastUsable = networkAddress;
      totalHosts = 1;
    } else if (prefix === 31) {
      firstUsable = networkAddress;
      lastUsable = broadcastAddress;
      totalHosts = 2;
    } else {
      firstUsable = intToIp((netInt + 1) >>> 0);
      lastUsable = intToIp((bcInt - 1) >>> 0);
      // Avoid unsigned bitwise truncation for very large networks such as /0.
      totalHosts = Math.max(0, (bcInt - netInt) - 1);
    }

    return {
      inputIp: String(ip),
      subnetMask: netmask,
      networkAddress,
      broadcastAddress,
      firstUsableHost: firstUsable,
      lastUsableHost: lastUsable,
      usableHostRange: totalHosts > 0 ? `${firstUsable} - ${lastUsable}` : 'N/A (No Usable Hosts)',
      totalHosts,
      cidr: prefix
    };
  }

  function calculateAutoSubnet(ip) {
    const cidr = inferCidr(ip);
    return {
      ...calculateSubnet(ip, cidr),
      inferred: true,
      inferenceLabel: cidr === 0 ? 'Default route block' : `Auto /${cidr}`
    };
  }

  function setupIpMasking(inputElement) {
    if (!inputElement) return;
    inputElement.addEventListener('keypress', function(e) {
      const char = String.fromCharCode(e.which || e.keyCode);
      if (!/[0-9.]/.test(char)) e.preventDefault();
    });
    inputElement.addEventListener('input', function() {
      let value = this.value.replace(/[^0-9.]/g, '');
      let parts = value.split('.').slice(0, 4);
      let shouldAppendDot = false;
      for (let i = 0; i < parts.length; i++) {
        let part = parts[i].slice(0, 3);
        if (part !== '') {
          const num = Math.min(255, Number(part));
          if (part.length > 1 && part.startsWith('0')) part = String(num);
          else if (Number(part) > 255) part = '255';
        }
        parts[i] = part;
        if (part.length === 3 && i < 3 && parts.length === i + 1) shouldAppendDot = true;
      }
      this.value = parts.join('.');
      if (shouldAppendDot && this.value.split('.').length < 4) this.value += '.';
    });
  }

  return { validateIpv4, ipToInt, intToIp, inferCidr, calculateSubnet, calculateAutoSubnet, setupIpMasking };
});
