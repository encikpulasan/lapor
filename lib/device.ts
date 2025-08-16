import { encodeBase64 } from "@std/encoding/base64";

// Device fingerprinting service
export class DeviceService {
  // Generate a device fingerprint from request headers and other data
  static async generateDeviceFingerprint(
    request: Request,
    userAgent?: string,
  ): Promise<string> {
    const headers = request.headers;
    const fingerprint = {
      userAgent: userAgent || headers.get("user-agent") || "",
      acceptLanguage: headers.get("accept-language") || "",
      acceptEncoding: headers.get("accept-encoding") || "",
      connection: headers.get("connection") || "",
      dnt: headers.get("dnt") || "",
      sec_fetch_site: headers.get("sec-fetch-site") || "",
      sec_fetch_mode: headers.get("sec-fetch-mode") || "",
      sec_fetch_dest: headers.get("sec-fetch-dest") || "",
      timestamp: Date.now(),
    };

    // Create a hash of the fingerprint data
    const fingerprintString = JSON.stringify(fingerprint);
    const encoder = new TextEncoder();
    const data = encoder.encode(fingerprintString);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);

    return encodeBase64(hashBuffer).substring(0, 16); // Shortened for readability
  }

  // Client-side device fingerprinting script (to be included in the frontend)
  static getClientFingerprintScript(): string {
    return `
      function generateClientFingerprint() {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        ctx.textBaseline = 'top';
        ctx.font = '14px Arial';
        ctx.fillText('Device fingerprint test', 2, 2);
        
        const fingerprint = {
          screen: screen.width + 'x' + screen.height,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          language: navigator.language,
          platform: navigator.platform,
          canvas: canvas.toDataURL(),
          webgl: getWebGLFingerprint(),
          fonts: detectFonts(),
          cookieEnabled: navigator.cookieEnabled,
          doNotTrack: navigator.doNotTrack,
          hardwareConcurrency: navigator.hardwareConcurrency || 0,
          deviceMemory: navigator.deviceMemory || 0,
          timestamp: Date.now()
        };
        
        return btoa(JSON.stringify(fingerprint)).substring(0, 32);
      }
      
      function getWebGLFingerprint() {
        try {
          const canvas = document.createElement('canvas');
          const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
          if (!gl) return '';
          
          const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
          if (debugInfo) {
            return gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) + '|' + 
                   gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);
          }
          return '';
        } catch (e) {
          return '';
        }
      }
      
      function detectFonts() {
        const testFonts = ['Arial', 'Helvetica', 'Times', 'Courier', 'Verdana', 'Georgia', 'Palatino', 'Garamond', 'Bookman', 'Comic Sans MS', 'Trebuchet MS', 'Arial Black', 'Impact'];
        const testString = 'mmmmmmmmmmlli';
        const testSize = '72px';
        const h = document.getElementsByTagName('body')[0];
        
        const s = document.createElement('span');
        s.style.fontSize = testSize;
        s.innerHTML = testString;
        s.style.fontFamily = 'monospace';
        h.appendChild(s);
        const defaultWidth = s.offsetWidth;
        const defaultHeight = s.offsetHeight;
        
        const fonts = testFonts.filter(font => {
          s.style.fontFamily = font + ', monospace';
          return s.offsetWidth !== defaultWidth || s.offsetHeight !== defaultHeight;
        });
        
        h.removeChild(s);
        return fonts.join(',');
      }
      
      // Store fingerprint in localStorage or send with form
      const deviceId = generateClientFingerprint();
      localStorage.setItem('deviceId', deviceId);
    `;
  }

  // Combine server and client fingerprints
  static combineFingerprints(
    serverFingerprint: string,
    clientFingerprint?: string,
  ): string {
    if (!clientFingerprint) {
      return `server_${serverFingerprint}`;
    }

    const combined = `${serverFingerprint}_${clientFingerprint}`;
    return combined.substring(0, 32); // Keep it reasonable length
  }
}
