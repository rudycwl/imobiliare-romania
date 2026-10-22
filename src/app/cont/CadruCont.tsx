import { esteAdmin } from "@/lib/fondatori";
import { MeniuCont } from "./MeniuCont";

/** Așază meniul contului lângă conținutul paginii. */
export function CadruCont({ u, children }: { u: { tip: string; email: string | null }; children: React.ReactNode }) {
  return (
    <div className="cadru-cont">
      <MeniuCont agentie={u.tip === "agentie"} admin={esteAdmin(u.email)} />
      <div className="continut-cont">{children}</div>
    </div>
  );
}
