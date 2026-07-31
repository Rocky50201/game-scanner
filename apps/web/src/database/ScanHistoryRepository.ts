import { getDatabase } from "./Database";
import type { ScanHistoryRecord } from "./schema";

export async function addScan(record: ScanHistoryRecord): Promise<void> {
  const database = await getDatabase();
  await database.put("scanHistory", record);
}

export async function getRecentScans(limit = 20): Promise<ScanHistoryRecord[]> {
  const database = await getDatabase();
  const all = await database.getAllFromIndex("scanHistory", "by-captured-at");
  return all.sort((a, b) => b.capturedAt - a.capturedAt).slice(0, limit);
}
