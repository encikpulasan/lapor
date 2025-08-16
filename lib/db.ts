/// <reference lib="deno.unstable" />
import { ulid } from "@std/ulid";

// Database interface
const kv = await Deno.openKv();

// Data schemas based on SRS requirements
export interface Location {
  city: string;
  lat: number;
  lon: number;
}

export interface PollutionReport {
  report_id: string;
  timestamp: string;
  ip_address: string;
  location: Location | null;
  device_id: string | null;
  pollution_type: string;
  sector: number;
  user_id: string | null;
  status: "pending" | "submitted" | "failed" | "resolved";
  description?: string | null;
  created_at: string;
  updated_at: string;
}

export interface User {
  user_id: string;
  email: string;
  password_hash: string;
  name: string;
  phone?: string;
  created_at: string;
  updated_at: string;
  is_admin: boolean;
}

export interface Session {
  session_id: string;
  user_id: string;
  created_at: Date;
  expires_at: Date;
}

export interface PollutionType {
  type_id: string;
  name: string;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Sector {
  sector_id: string;
  name: string;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Database operations for reports
export class ReportDB {
  static async create(
    report: Omit<PollutionReport, "report_id" | "created_at" | "updated_at">,
  ): Promise<PollutionReport> {
    const now = new Date().toISOString();
    const fullReport: PollutionReport = {
      ...report,
      report_id: ulid(),
      created_at: now,
      updated_at: now,
    };

    const key = ["reports", fullReport.report_id];
    await kv.set(key, fullReport);

    // Create indices for querying
    await kv.set([
      "reports_by_timestamp",
      fullReport.timestamp,
      fullReport.report_id,
    ], fullReport.report_id);
    await kv.set(
      ["reports_by_sector", fullReport.sector, fullReport.report_id],
      fullReport.report_id,
    );
    if (fullReport.user_id) {
      await kv.set([
        "reports_by_user",
        fullReport.user_id,
        fullReport.report_id,
      ], fullReport.report_id);
    }

    return fullReport;
  }

  static async getById(reportId: string): Promise<PollutionReport | null> {
    const result = await kv.get<PollutionReport>(["reports", reportId]);
    return result.value;
  }

  static async getAll(limit = 100, offset = 0): Promise<PollutionReport[]> {
    const reports: PollutionReport[] = [];
    const iter = kv.list<PollutionReport>({ prefix: ["reports"] });
    let count = 0;

    for await (const entry of iter) {
      if (count >= offset && reports.length < limit) {
        reports.push(entry.value);
      }
      count++;
    }

    return reports.sort((a, b) =>
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }

  static async getBySector(
    sector: number,
    limit = 100,
  ): Promise<PollutionReport[]> {
    const reports: PollutionReport[] = [];
    const iter = kv.list<string>({ prefix: ["reports_by_sector", sector] });

    for await (const entry of iter) {
      if (reports.length >= limit) break;
      const report = await this.getById(entry.value);
      if (report) {
        reports.push(report);
      }
    }

    return reports;
  }

  static async getByUser(
    userId: string,
    limit = 100,
  ): Promise<PollutionReport[]> {
    const reports: PollutionReport[] = [];
    const iter = kv.list<string>({ prefix: ["reports_by_user", userId] });

    for await (const entry of iter) {
      if (reports.length >= limit) break;
      const report = await this.getById(entry.value);
      if (report) {
        reports.push(report);
      }
    }

    return reports;
  }

  static async update(
    reportId: string,
    updates: Partial<PollutionReport>,
  ): Promise<PollutionReport | null> {
    const existing = await this.getById(reportId);
    if (!existing) return null;

    const updated: PollutionReport = {
      ...existing,
      ...updates,
      updated_at: new Date().toISOString(),
    };

    const key = ["reports", reportId];
    await kv.set(key, updated);

    return updated;
  }

  static get kv() {
    return kv;
  }

  static get(reportId: string): Promise<PollutionReport | null> {
    return this.getById(reportId);
  }
}

// Database operations for users
export class UserDB {
  static async create(
    user: Omit<User, "user_id" | "created_at" | "updated_at">,
  ): Promise<User> {
    const now = new Date().toISOString();
    const fullUser: User = {
      ...user,
      user_id: ulid(),
      created_at: now,
      updated_at: now,
    };

    const key = ["users", fullUser.user_id];
    await kv.set(key, fullUser);

    // Create index by email
    await kv.set(["users_by_email", fullUser.email], fullUser.user_id);

    return fullUser;
  }

  static async getById(userId: string): Promise<User | null> {
    const result = await kv.get<User>(["users", userId]);
    return result.value;
  }

  static async getByEmail(email: string): Promise<User | null> {
    const userIdResult = await kv.get<string>(["users_by_email", email]);
    if (!userIdResult.value) return null;

    return this.getById(userIdResult.value);
  }

  static get kv() {
    return kv;
  }

  static get(userId: string): Promise<User | null> {
    return this.getById(userId);
  }
}

// Database operations for sessions
export class SessionDB {
  static async create(
    userId: string,
    expiresIn = 24 * 60 * 60 * 1000,
  ): Promise<Session> {
    const now = new Date();
    const session: Session = {
      session_id: ulid(),
      user_id: userId,
      created_at: now,
      expires_at: new Date(now.getTime() + expiresIn),
    };

    const key = ["sessions", session.session_id];
    await kv.set(key, session, { expireIn: expiresIn });

    return session;
  }

  static async getById(sessionId: string): Promise<Session | null> {
    const result = await kv.get<Session>(["sessions", sessionId]);
    if (!result.value) return null;

    // Check if session is expired
    if (result.value.expires_at < new Date()) {
      await this.delete(sessionId);
      return null;
    }

    return result.value;
  }

  static async delete(sessionId: string): Promise<void> {
    await kv.delete(["sessions", sessionId]);
  }
}

// Database operations for pollution types
export class PollutionTypeDB {
  static async create(
    type: Omit<PollutionType, "type_id" | "created_at" | "updated_at">,
  ): Promise<PollutionType> {
    const type_id = ulid();
    const now = new Date().toISOString();

    const newType: PollutionType = {
      type_id,
      ...type,
      created_at: now,
      updated_at: now,
    };

    await kv.set(["pollution_types", type_id], newType);
    return newType;
  }

  static async getAll(): Promise<PollutionType[]> {
    const entries = kv.list<PollutionType>({ prefix: ["pollution_types"] });
    const types: PollutionType[] = [];

    for await (const entry of entries) {
      types.push(entry.value);
    }

    return types.sort((a, b) => a.name.localeCompare(b.name));
  }

  static async getActive(): Promise<PollutionType[]> {
    const allTypes = await this.getAll();
    return allTypes.filter((type) => type.is_active);
  }

  static async getById(typeId: string): Promise<PollutionType | null> {
    const result = await kv.get<PollutionType>(["pollution_types", typeId]);
    return result.value;
  }

  static async update(
    typeId: string,
    updates: Partial<Omit<PollutionType, "type_id" | "created_at">>,
  ): Promise<PollutionType | null> {
    const existing = await this.getById(typeId);
    if (!existing) return null;

    const updated: PollutionType = {
      ...existing,
      ...updates,
      updated_at: new Date().toISOString(),
    };

    await kv.set(["pollution_types", typeId], updated);
    return updated;
  }

  static async delete(typeId: string): Promise<boolean> {
    const existing = await this.getById(typeId);
    if (!existing) return false;

    await kv.delete(["pollution_types", typeId]);
    return true;
  }

  static get kv() {
    return kv;
  }
}

// Database operations for sectors
export class SectorDB {
  static async create(
    sector: Omit<Sector, "sector_id" | "created_at" | "updated_at">,
  ): Promise<Sector> {
    const sector_id = ulid();
    const now = new Date().toISOString();

    const newSector: Sector = {
      sector_id,
      ...sector,
      created_at: now,
      updated_at: now,
    };

    await kv.set(["sectors", sector_id], newSector);
    return newSector;
  }

  static async getAll(): Promise<Sector[]> {
    const entries = kv.list<Sector>({ prefix: ["sectors"] });
    const sectors: Sector[] = [];

    for await (const entry of entries) {
      sectors.push(entry.value);
    }

    return sectors.sort((a, b) => a.name.localeCompare(b.name));
  }

  static async getActive(): Promise<Sector[]> {
    const allSectors = await this.getAll();
    return allSectors.filter((sector) => sector.is_active);
  }

  static async getById(sectorId: string): Promise<Sector | null> {
    const result = await kv.get<Sector>(["sectors", sectorId]);
    return result.value;
  }

  static async update(
    sectorId: string,
    updates: Partial<Omit<Sector, "sector_id" | "created_at">>,
  ): Promise<Sector | null> {
    const existing = await this.getById(sectorId);
    if (!existing) return null;

    const updated: Sector = {
      ...existing,
      ...updates,
      updated_at: new Date().toISOString(),
    };

    await kv.set(["sectors", sectorId], updated);
    return updated;
  }

  static async delete(sectorId: string): Promise<boolean> {
    const existing = await this.getById(sectorId);
    if (!existing) return false;

    await kv.delete(["sectors", sectorId]);
    return true;
  }

  static get kv() {
    return kv;
  }
}

export { kv };
