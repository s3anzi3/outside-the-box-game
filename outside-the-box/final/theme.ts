import { GameState } from "./types";

// ── Institute of Lateral Cognition — "Ivory & Oxblood" house palette ──────────
// One source of truth for colour. getTheme(state) returns the active palette and
// every screen, overlay and level draws from these tokens, so retuning the whole
// look is a single-file change.
//
// The legacy keys (bg / fg / fgMid / fgDim / stroke / overlayBg / divider) are
// preserved so existing callers keep working unchanged; the richer semantic
// tokens (paper / ink / accent / seal / pass / danger / hairline / panel …)
// drive the new certification design.

export interface Theme {
  // legacy keys (kept for back-compat with existing callers)
  bg: string;
  fg: string;
  fgMid: string;
  fgDim: string;
  stroke: string;
  overlayBg: string;
  divider: string;
  // semantic tokens
  paper: string;      // the document / desk surface
  ink: string;        // primary text
  inkSoft: string;    // secondary text
  panel: string;      // raised card / inset surface
  panelEdge: string;  // border of a raised card
  hairline: string;   // thin rule / divider
  accent: string;     // oxblood — primary accent
  accentDeep: string; // darker oxblood — pressed / shadow
  seal: string;       // antique gold — seals, ribbons, medals
  sealDim: string;    // translucent gold for inner rules
  pass: string;       // validation green
  danger: string;     // error / void red
  scrim: string;      // translucent backdrop behind modals
}

export const getTheme = (state: GameState): Theme =>
  state.darkMode
    ? {
        // ── After-hours examination hall (dark) ──────────────────────────────
        bg:        "#161310",
        fg:        "#F4EEDE",
        fgMid:     "#D2C8B0",
        fgDim:     "#A99C82",
        stroke:    "#E6DCC4",
        overlayBg: "rgba(16,13,10,0.92)",
        divider:   "#43392B",

        paper:     "#161310",
        ink:       "#F4EEDE",
        inkSoft:   "#D2C8B0",
        panel:     "#211C16",
        panelEdge: "#3A3022",
        hairline:  "#43392B",
        accent:    "#C65B4F",
        accentDeep: "#7A2E2E",
        seal:      "#D4B05A",
        sealDim:   "rgba(212,176,90,0.32)",
        pass:      "#5FA67C",
        danger:    "#D2554E",
        scrim:     "rgba(10,8,6,0.66)",
      }
    : {
        // ── Examination booklet (light, default) ─────────────────────────────
        bg:        "#F2EBDA",
        fg:        "#1E1A15",
        fgMid:     "#473E32",
        fgDim:     "#6E6150",
        stroke:    "#26201A",
        overlayBg: "rgba(244,238,223,0.93)",
        divider:   "#CBBF9F",

        paper:     "#F2EBDA",
        ink:       "#1E1A15",
        inkSoft:   "#473E32",
        panel:     "#FBF8EF",
        panelEdge: "#E2D8BF",
        hairline:  "#CBBF9F",
        accent:    "#7A2E2E",
        accentDeep: "#5A2222",
        seal:      "#B0892F",
        sealDim:   "rgba(176,137,47,0.34)",
        pass:      "#3E6B4F",
        danger:    "#9A2B25",
        scrim:     "rgba(28,22,16,0.55)",
      };
