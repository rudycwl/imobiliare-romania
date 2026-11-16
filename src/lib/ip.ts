import { isIP } from "net";

/** Doar adrese publice: serverul nu trebuie să poată fi folosit pentru a citi adrese din rețeaua internă. */
export function ipPrivat(ip: string) {
  if (isIP(ip) === 6) return /^(::1?$|f[cd]|fe80|::ffff:(10|127|169\.254|192\.168|172\.(1[6-9]|2\d|3[01]))\.)/i.test(ip);
  return /^(0|10|127|169\.254|192\.168|172\.(1[6-9]|2\d|3[01])|100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7]))\./.test(ip);
}
