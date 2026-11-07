import { PageHeader } from "@/components/ui";
import { StrategyTool } from "./StrategyTool";
export default function Strategy() {
  return (
    <div>
      <PageHeader title="Outreach strategy generator" sub="Tactics, cadence, templates and collateral tailored to the target account. See docs/OUTREACH_PLAYBOOK.md for the full playbook." />
      <StrategyTool />
    </div>
  );
}
