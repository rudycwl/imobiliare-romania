// Registrul județelor. Fiecare județ este un modul separat în acest folder.
// Pentru a adăuga un județ/oraș: editează sau creează fișierul județului și înregistrează-l aici.
import j_alba from "./alba";
import j_arad from "./arad";
import j_arges from "./arges";
import j_bacau from "./bacau";
import j_bihor from "./bihor";
import j_bistrita_nasaud from "./bistrita-nasaud";
import j_botosani from "./botosani";
import j_brasov from "./brasov";
import j_braila from "./braila";
import j_bucuresti from "./bucuresti";
import j_buzau from "./buzau";
import j_caras_severin from "./caras-severin";
import j_calarasi from "./calarasi";
import j_cluj from "./cluj";
import j_constanta from "./constanta";
import j_covasna from "./covasna";
import j_dambovita from "./dambovita";
import j_dolj from "./dolj";
import j_galati from "./galati";
import j_giurgiu from "./giurgiu";
import j_gorj from "./gorj";
import j_harghita from "./harghita";
import j_hunedoara from "./hunedoara";
import j_ialomita from "./ialomita";
import j_iasi from "./iasi";
import j_ilfov from "./ilfov";
import j_maramures from "./maramures";
import j_mehedinti from "./mehedinti";
import j_mures from "./mures";
import j_neamt from "./neamt";
import j_olt from "./olt";
import j_prahova from "./prahova";
import j_satu_mare from "./satu-mare";
import j_salaj from "./salaj";
import j_sibiu from "./sibiu";
import j_suceava from "./suceava";
import j_teleorman from "./teleorman";
import j_timis from "./timis";
import j_tulcea from "./tulcea";
import j_vaslui from "./vaslui";
import j_valcea from "./valcea";
import j_vrancea from "./vrancea";

export const JUDETE = [
  j_alba,
  j_arad,
  j_arges,
  j_bacau,
  j_bihor,
  j_bistrita_nasaud,
  j_botosani,
  j_brasov,
  j_braila,
  j_bucuresti,
  j_buzau,
  j_caras_severin,
  j_calarasi,
  j_cluj,
  j_constanta,
  j_covasna,
  j_dambovita,
  j_dolj,
  j_galati,
  j_giurgiu,
  j_gorj,
  j_harghita,
  j_hunedoara,
  j_ialomita,
  j_iasi,
  j_ilfov,
  j_maramures,
  j_mehedinti,
  j_mures,
  j_neamt,
  j_olt,
  j_prahova,
  j_satu_mare,
  j_salaj,
  j_sibiu,
  j_suceava,
  j_teleorman,
  j_timis,
  j_tulcea,
  j_vaslui,
  j_valcea,
  j_vrancea,
].sort((a, b) => a.nume.localeCompare(b.nume, "ro"));
