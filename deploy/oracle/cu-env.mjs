// Pornește o comandă cu variabilele din /etc/cheiamea/env.json (fără probleme de ghilimele în valori).
import { readFileSync } from "node:fs";
import { spawn } from "node:child_process";

const env = { ...process.env, ...JSON.parse(readFileSync("/etc/cheiamea/env.json", "utf8")) };
const [cmd, ...args] = process.argv.slice(2);
const copil = spawn(cmd, args, { env, stdio: "inherit" });
for (const s of ["SIGTERM", "SIGINT"]) process.on(s, () => copil.kill(s));
copil.on("exit", (cod, semnal) => (semnal ? process.kill(process.pid, semnal) : process.exit(cod ?? 1)));
