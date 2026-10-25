import { test } from "node:test";
import assert from "node:assert/strict";
import { stareEFacturaOblio } from "@/lib/facturare/oblio";

process.env.OBLIO_EMAIL = "test@exemplu.ro";
process.env.OBLIO_SECRET = "secret";
process.env.FACTURARE_CIF = "39409800";

function cuRaspuns(data: unknown) {
  const cereri: { url: string; init?: RequestInit }[] = [];
  globalThis.fetch = (async (url: string, init?: RequestInit) => {
    cereri.push({ url, init });
    if (url.endsWith("/authorize/token")) return Response.json({ access_token: "t", expires_in: 3600 });
    return Response.json({ status: 200, statusMessage: "Success", data });
  }) as typeof fetch;
  return cereri;
}

test("starea e-Factura se citește din lista Oblio, cu GET și fără să trimită nimic", async () => {
  const cereri = cuRaspuns([{ seriesName: "CHM", number: "0001", einvoiceStatus: { text: "Trimisa", sent: true, code: 1 } }]);
  assert.equal(await stareEFacturaOblio("CHM", "0001"), 1);
  const lista = cereri.find((c) => c.url.includes("/docs/invoice/list"))!;
  assert.equal(lista.init?.method, "GET");
  assert.equal(lista.init?.body, undefined);
  assert.match(lista.url, /cif=39409800&seriesName=CHM&number=0001&withEinvoiceStatus=1/);
  assert.ok(!cereri.some((c) => c.url.includes("/docs/einvoice")));
});

test("codul venit ca text se citește ca număr; fără factură în listă întoarce null", async () => {
  cuRaspuns([{ einvoiceStatus: { code: "0" } }]);
  assert.equal(await stareEFacturaOblio("CHM", "0001"), 0);
  cuRaspuns([]);
  assert.equal(await stareEFacturaOblio("CHM", "0009"), null);
});
