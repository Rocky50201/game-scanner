import { openDB, type IDBPDatabase } from "idb";
import type { GameScannerSchema } from "./schema";

let connection: Promise<IDBPDatabase<GameScannerSchema>> | null = null;

export function getDatabase(): Promise<IDBPDatabase<GameScannerSchema>> {
  if (!connection) {
    connection = openDB<GameScannerSchema>("game-scanner-pro", 1, {
      upgrade(database) {
        if (!database.objectStoreNames.contains("settings")) {
          database.createObjectStore("settings");
        }
        if (!database.objectStoreNames.contains("scanHistory")) {
          const store = database.createObjectStore("scanHistory", { keyPath: "id" });
          store.createIndex("by-captured-at", "capturedAt");
        }
      }
    });
  }
  return connection;
}
