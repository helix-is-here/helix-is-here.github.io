/* =========================
   ADF rank data
   Ordered most senior first within each service. `group` is one of:
   officer, enlisted (including warrant officers) or appointment.
   Insignia items are listed bottom-up (see insignia.js). Navy star ranks
   also have `boardInsignia`: the gold shoulder board, shown when the
   "shoulder boards" option is chosen. To use a real picture instead of a
   drawing, add e.g. image: "/assets/ranks/navy-adml.png" (or boardImage).

   Left out of the quiz on purpose:
   - Acting Sub Lieutenant: same insignia as Sub Lieutenant
   - Private: no rank insignia
   ========================= */

const SERVICES = {
  navy: "Navy",
  army: "Army",
  raaf: "Air Force"
};

const GROUPS = {
  officer: "Officers",
  enlisted: "Enlisted & warrant officers",
  appointment: "Special appointments"
};

const RANKS = [
  // ---------- Navy ----------
  { id: "navy-af", service: "navy", group: "officer", name: "Admiral of the Fleet", abbr: "AF",
    insignia: { stripes: ["m", "m", "m", "m", "b"], label: "" },
    boardInsignia: { board: true, items: ["batonsWreathSilver", "crown"] } },
  { id: "navy-adml", service: "navy", group: "officer", name: "Admiral", abbr: "ADML",
    insignia: { stripes: ["m", "m", "m", "b"], label: "" },
    boardInsignia: { board: true, items: ["stars4", "swordBatonSilver", "crown"] } },
  { id: "navy-vadm", service: "navy", group: "officer", name: "Vice Admiral", abbr: "VADM",
    insignia: { stripes: ["m", "m", "b"], label: "" },
    boardInsignia: { board: true, items: ["stars3", "swordBatonSilver", "crown"] } },
  { id: "navy-radm", service: "navy", group: "officer", name: "Rear Admiral", abbr: "RADM",
    insignia: { stripes: ["m", "b"], label: "" },
    boardInsignia: { board: true, items: ["stars2", "swordBatonSilver", "crown"] } },
  { id: "navy-cdre", service: "navy", group: "officer", name: "Commodore", abbr: "CDRE",
    insignia: { stripes: ["b"], label: "" },
    boardInsignia: { board: true, items: ["stars1", "anchorSilver", "crown"] } },
  { id: "navy-capt", service: "navy", group: "officer", name: "Captain", abbr: "CAPT",
    insignia: { stripes: ["m", "m", "m", "m"], label: "" } },
  { id: "navy-cmdr", service: "navy", group: "officer", name: "Commander", abbr: "CMDR",
    insignia: { stripes: ["m", "m", "m"], label: "" } },
  { id: "navy-lcdr", service: "navy", group: "officer", name: "Lieutenant Commander", abbr: "LCDR",
    insignia: { stripes: ["m", "t", "m"], label: "" } },
  { id: "navy-leut", service: "navy", group: "officer", name: "Lieutenant", abbr: "LEUT",
    insignia: { stripes: ["m", "m"], label: "" } },
  { id: "navy-sblt", service: "navy", group: "officer", name: "Sub Lieutenant", abbr: "SBLT",
    insignia: { stripes: ["m"], label: "" } },
  { id: "navy-midn", service: "navy", group: "officer", name: "Midshipman", abbr: "MIDN",
    insignia: { patch: "midshipman" } },
  { id: "navy-won", service: "navy", group: "appointment", name: "Warrant Officer of the Navy", abbr: "WO-N",
    insignia: { items: ["wreathArms"] } },
  { id: "navy-wo", service: "navy", group: "enlisted", name: "Warrant Officer", abbr: "WO",
    insignia: { items: ["coatOfArms"] } },
  { id: "navy-cpo", service: "navy", group: "enlisted", name: "Chief Petty Officer", abbr: "CPO",
    insignia: { items: ["wreathAnchor", "crown"] } },
  { id: "navy-po", service: "navy", group: "enlisted", name: "Petty Officer", abbr: "PO",
    insignia: { items: ["crossedAnchors", "crown"] } },
  { id: "navy-ls", service: "navy", group: "enlisted", name: "Leading Seaman", abbr: "LS",
    insignia: { items: ["anchor"] } },
  { id: "navy-ab", service: "navy", group: "enlisted", name: "Able Seaman", abbr: "AB",
    insignia: { items: ["knot"] } },
  { id: "navy-smn", service: "navy", group: "enlisted", name: "Seaman", abbr: "SMN",
    insignia: { items: [] } },

  // ---------- Army ----------
  { id: "army-fm", service: "army", group: "officer", name: "Field Marshal", abbr: "FM",
    insignia: { items: ["batonsWreath", "crown"] } },
  { id: "army-gen", service: "army", group: "officer", name: "General", abbr: "GEN",
    insignia: { items: ["swordBaton", "pip", "crown"] } },
  { id: "army-ltgen", service: "army", group: "officer", name: "Lieutenant General", abbr: "LTGEN",
    insignia: { items: ["swordBaton", "crown"] } },
  { id: "army-majgen", service: "army", group: "officer", name: "Major General", abbr: "MAJGEN",
    insignia: { items: ["swordBaton", "pip"] } },
  { id: "army-brig", service: "army", group: "officer", name: "Brigadier", abbr: "BRIG",
    insignia: { items: ["pipTriangle", "crown"] } },
  { id: "army-col", service: "army", group: "officer", name: "Colonel", abbr: "COL",
    insignia: { items: ["pip", "pip", "crown"] } },
  { id: "army-ltcol", service: "army", group: "officer", name: "Lieutenant Colonel", abbr: "LTCOL",
    insignia: { items: ["pip", "crown"] } },
  { id: "army-maj", service: "army", group: "officer", name: "Major", abbr: "MAJ",
    insignia: { items: ["crown"] } },
  { id: "army-capt", service: "army", group: "officer", name: "Captain", abbr: "CAPT",
    insignia: { items: ["pip", "pip", "pip"] } },
  { id: "army-lt", service: "army", group: "officer", name: "Lieutenant", abbr: "LT",
    insignia: { items: ["pip", "pip"] } },
  { id: "army-2lt", service: "army", group: "officer", name: "Second Lieutenant", abbr: "2LT",
    insignia: { items: ["pip"] } },
  { id: "army-ocdt", service: "army", group: "officer", name: "Officer Cadet", abbr: "OCDT",
    insignia: { whiteBand: true } },
  { id: "army-scdt", service: "army", group: "officer", name: "Staff Cadet", abbr: "SCDT",
    insignia: { label: "RMC" } },
  { id: "army-rsma", service: "army", group: "appointment", name: "Regimental Sergeant Major of the Army", abbr: "RSM-A",
    insignia: { items: ["wreathArms"] } },
  { id: "army-wo1", service: "army", group: "enlisted", name: "Warrant Officer Class One", abbr: "WO1",
    insignia: { items: ["coatOfArms"] } },
  { id: "army-wo2", service: "army", group: "enlisted", name: "Warrant Officer Class Two", abbr: "WO2",
    insignia: { items: ["crownLarge"] } },
  { id: "army-ssgt", service: "army", group: "enlisted", name: "Staff Sergeant", abbr: "SSGT",
    insignia: { items: ["chevrons3", "crown"] } },
  { id: "army-sgt", service: "army", group: "enlisted", name: "Sergeant", abbr: "SGT",
    insignia: { items: ["chevrons3"] } },
  { id: "army-cpl", service: "army", group: "enlisted", name: "Corporal", abbr: "CPL",
    insignia: { items: ["chevrons2"] } },
  { id: "army-lcpl", service: "army", group: "enlisted", name: "Lance Corporal", abbr: "LCPL",
    insignia: { items: ["chevrons1"] } },

  // ---------- Air Force ----------
  { id: "raaf-mraaf", service: "raaf", group: "officer", name: "Marshal of the RAAF", abbr: "MRAAF",
    insignia: { stripes: ["m", "m", "m", "m", "b"], label: "" } },
  { id: "raaf-acm", service: "raaf", group: "officer", name: "Air Chief Marshal", abbr: "ACM",
    insignia: { stripes: ["m", "m", "m", "b"], label: "" } },
  { id: "raaf-airmshl", service: "raaf", group: "officer", name: "Air Marshal", abbr: "AIRMSHL",
    insignia: { stripes: ["m", "m", "b"], label: "" } },
  { id: "raaf-avm", service: "raaf", group: "officer", name: "Air Vice-Marshal", abbr: "AVM",
    insignia: { stripes: ["m", "b"], label: "" } },
  { id: "raaf-aircdre", service: "raaf", group: "officer", name: "Air Commodore", abbr: "AIRCDRE",
    insignia: { stripes: ["b"], label: "" } },
  { id: "raaf-gpcapt", service: "raaf", group: "officer", name: "Group Captain", abbr: "GPCAPT",
    insignia: { stripes: ["m", "m", "m", "m"], label: "" } },
  { id: "raaf-wgcdr", service: "raaf", group: "officer", name: "Wing Commander", abbr: "WGCDR",
    insignia: { stripes: ["m", "m", "m"], label: "" } },
  { id: "raaf-sqnldr", service: "raaf", group: "officer", name: "Squadron Leader", abbr: "SQNLDR",
    insignia: { stripes: ["m", "t", "m"], label: "" } },
  { id: "raaf-fltlt", service: "raaf", group: "officer", name: "Flight Lieutenant", abbr: "FLTLT",
    insignia: { stripes: ["m", "m"], label: "" } },
  { id: "raaf-flgoff", service: "raaf", group: "officer", name: "Flying Officer", abbr: "FLGOFF",
    insignia: { stripes: ["m"], label: "" } },
  { id: "raaf-pltoff", service: "raaf", group: "officer", name: "Pilot Officer", abbr: "PLTOFF",
    insignia: { stripes: ["t"], label: "" } },
  { id: "raaf-offcdt", service: "raaf", group: "officer", name: "Officer Cadet", abbr: "OFFCDT",
    insignia: { patch: "raafCadet" } },
  { id: "raaf-woffaf", service: "raaf", group: "appointment", name: "Warrant Officer of the Air Force", abbr: "WOFF-AF",
    insignia: { items: ["wreathArms"] } },
  { id: "raaf-woff", service: "raaf", group: "enlisted", name: "Warrant Officer", abbr: "WOFF",
    insignia: { items: ["coatOfArms"] } },
  { id: "raaf-fsgt", service: "raaf", group: "enlisted", name: "Flight Sergeant", abbr: "FSGT",
    insignia: { items: ["chevrons3", "crownMono"] } },
  { id: "raaf-sgt", service: "raaf", group: "enlisted", name: "Sergeant", abbr: "SGT",
    insignia: { items: ["chevrons3"] } },
  { id: "raaf-cpl", service: "raaf", group: "enlisted", name: "Corporal", abbr: "CPL",
    insignia: { items: ["chevrons2"] } },
  { id: "raaf-lac", service: "raaf", group: "enlisted", name: "Leading Aircraftman/Aircraftwoman", abbr: "LAC/LACW",
    insignia: { items: ["chevrons1"] } },
  { id: "raaf-ac", service: "raaf", group: "enlisted", name: "Aircraftman/Aircraftwoman", abbr: "AC/ACW",
    insignia: { items: [] } }
];
