/** 
 * Darkens `#rgb` / `#rrggbb` by scaling channels toward black; 
 * returns `hex` unchanged if parsing fails. 
 */
export const darkenHexColor = (hex: string, factor = 0.72): string => {
	const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(hex.trim());
	const cap = m?.[1];
	if (!cap) return hex;
	let h = cap;
	if (h.length === 3) {
		h = h.split("").map((c) => c + c).join("");
	}
	const n = parseInt(h, 16);
	const r = Math.round(((n >> 16) & 255) * factor);
	const g = Math.round(((n >> 8) & 255) * factor);
	const b = Math.round((n & 255) * factor);
	return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}
