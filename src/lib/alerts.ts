import db from "./db";
import { localSearch } from "./search";

interface AlertRow {
  id: number;
  user_id: number;
  prompt: string;
  is_active: number;
  created_at: string;
}

/**
 * Check all active alerts against a newly created property.
 * If the property matches an alert's prompt (score > 5), create an alert_match.
 */
export function checkAlertsForProperty(propertyId: number) {
  const alerts = db
    .prepare("SELECT * FROM search_alerts WHERE is_active = 1")
    .all() as AlertRow[];

  const insertMatch = db.prepare(
    `INSERT OR IGNORE INTO alert_matches (alert_id, property_id, score, reasons)
     VALUES (?, ?, ?, ?)`
  );

  for (const alert of alerts) {
    try {
      const results = localSearch(alert.prompt);
      const match = results.find((r) => r.property.id === propertyId);
      if (match && match.score > 5) {
        insertMatch.run(
          alert.id,
          propertyId,
          match.score,
          JSON.stringify(match.matchReasons)
        );
      }
    } catch (error) {
      console.error(
        `Error checking alert ${alert.id} for property ${propertyId}:`,
        error
      );
    }
  }
}

/**
 * Run an alert's prompt against all existing active properties.
 * Returns the number of matches created.
 */
export function runAlertAgainstAllProperties(alertId: number, prompt: string): number {
  const results = localSearch(prompt);
  const insertMatch = db.prepare(
    `INSERT OR IGNORE INTO alert_matches (alert_id, property_id, score, reasons)
     VALUES (?, ?, ?, ?)`
  );

  let count = 0;
  for (const result of results) {
    if (result.score > 5) {
      const info = insertMatch.run(
        alertId,
        result.property.id,
        result.score,
        JSON.stringify(result.matchReasons)
      );
      if (info.changes > 0) count++;
    }
  }

  return count;
}
