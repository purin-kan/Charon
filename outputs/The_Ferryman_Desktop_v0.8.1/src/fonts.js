// The bundled display fonts (declared in src/index.css). Canvas text does not re-draw when a web font
// arrives, so a scene that uses them waits for whenFontsReady() before it creates any text.
export const HEAD_FONT = '"Cinzel Decorative", Georgia, serif';
export const BODY_FONT = '"Cormorant Garamond", Georgia, serif';

const FACES = ['400 20px "Cinzel Decorative"', '700 20px "Cinzel Decorative"', '400 20px "Cormorant Garamond"', '600 20px "Cormorant Garamond"'];

/** Resolves once the fonts are usable, or after timeoutMs: a font that fails falls back to Georgia and never blocks a scene. */
export function whenFontsReady(timeoutMs = 3000) {
  const loads = FACES.map((face) => document.fonts.load(face).catch((err) => console.warn(`[ferry] font ${face}: ${err.message}`)));
  return Promise.race([Promise.all(loads), new Promise((resolve) => setTimeout(resolve, timeoutMs))]);
}
