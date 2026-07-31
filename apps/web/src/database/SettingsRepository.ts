import { defaultAppSettings, type AppSettings } from "../settings/AppSettings";
import { getDatabase } from "./Database";

export async function loadSettings(): Promise<AppSettings> {
  const database = await getDatabase();
  return (await database.get("settings", "app")) ?? defaultAppSettings;
}

export async function saveSettings(settings: AppSettings): Promise<void> {
  const database = await getDatabase();
  await database.put("settings", settings, "app");
}
