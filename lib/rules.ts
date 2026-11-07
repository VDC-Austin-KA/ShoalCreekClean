import "server-only";
import { q } from "./db";
import { DEFAULT_RULES, type Rule } from "./pricing";

export async function loadRules(): Promise<Rule[]> {
  const rows = await q<Rule>("SELECT service,label,unit,rate,min_cents,production_per_hour,equipment,phase,description FROM pricing_rules ORDER BY phase, service");
  return rows.length ? rows : DEFAULT_RULES;
}
