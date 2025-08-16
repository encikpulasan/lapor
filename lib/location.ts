import type { Location } from "./db.ts";

// IP-based location detection service
export class LocationService {
  // Get client IP address from request
  static getClientIP(request: Request): string {
    const forwarded = request.headers.get("x-forwarded-for");
    if (forwarded) {
      return forwarded.split(",")[0].trim();
    }

    const realIp = request.headers.get("x-real-ip");
    if (realIp) {
      return realIp;
    }

    // Fallback for development
    return "127.0.0.1";
  }

  // Get location from IP address using ipapi.co (free tier)
  static async getLocationFromIP(ipAddress: string): Promise<Location | null> {
    // Skip location detection for local/private IPs
    if (this.isPrivateIP(ipAddress)) {
      return {
        city: "Local Development",
        lat: 1.4927, // Default to Johor Bahru coordinates
        lon: 103.7414,
      };
    }

    try {
      const response = await fetch(`https://ipapi.co/${ipAddress}/json/`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.error) {
        console.warn(`IP location error for ${ipAddress}:`, data.reason);
        return null;
      }

      return {
        city: data.city || "Unknown",
        lat: parseFloat(data.latitude) || 0,
        lon: parseFloat(data.longitude) || 0,
      };
    } catch (error) {
      console.error("Failed to get location from IP:", error);
      return null;
    }
  }

  // Alternative location service using ip-api.com (backup)
  static async getLocationFromIPBackup(
    ipAddress: string,
  ): Promise<Location | null> {
    if (this.isPrivateIP(ipAddress)) {
      return {
        city: "Local Development",
        lat: 1.4927,
        lon: 103.7414,
      };
    }

    try {
      const response = await fetch(`http://ip-api.com/json/${ipAddress}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.status === "fail") {
        console.warn(`IP location error for ${ipAddress}:`, data.message);
        return null;
      }

      return {
        city: data.city || "Unknown",
        lat: data.lat || 0,
        lon: data.lon || 0,
      };
    } catch (error) {
      console.error("Failed to get location from backup IP service:", error);
      return null;
    }
  }

  // Get location with fallback to backup service
  static async getLocationWithFallback(
    ipAddress: string,
  ): Promise<Location | null> {
    let location = await this.getLocationFromIP(ipAddress);

    if (!location) {
      console.log("Primary location service failed, trying backup...");
      location = await this.getLocationFromIPBackup(ipAddress);
    }

    return location;
  }

  // Check if IP address is private/local
  static isPrivateIP(ip: string): boolean {
    const privateRanges = [
      /^127\./, // 127.0.0.0/8
      /^192\.168\./, // 192.168.0.0/16
      /^10\./, // 10.0.0.0/8
      /^172\.(1[6-9]|2[0-9]|3[0-1])\./, // 172.16.0.0/12
      /^::1$/, // IPv6 localhost
      /^fc00:/, // IPv6 unique local
      /^fe80:/, // IPv6 link-local
    ];

    return privateRanges.some((range) => range.test(ip)) || ip === "localhost";
  }
}
