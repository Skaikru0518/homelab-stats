/**
 * A témát az első festés előtt kell beállítani, különben a sötét módú
 * felhasználó világos villanást lát betöltéskor. Ezért fut szinkron
 * inline scriptként a <head>-ben, nem React effektként.
 */
const SET_THEME = `(function(){try{var s=localStorage.getItem("theme");var d=s==="dark"||(s!=="light"&&window.matchMedia("(prefers-color-scheme: dark)").matches);document.documentElement.classList.toggle("dark",d);}catch(e){}})();`;

export function ThemeScript() {
	// biome-ignore lint/security/noDangerouslySetInnerHtml: szándékos inline script, nincs benne felhasználói adat
	return <script dangerouslySetInnerHTML={{ __html: SET_THEME }} />;
}
