import { createContext, useContext, useEffect, useState } from "react";

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
    const [theme, setTheme] = useState(() => {
        try { return localStorage.getItem("iim-theme") || "dark"; } catch { return "dark"; }
    });

    useEffect(() => {
        const root = document.documentElement;
        root.setAttribute("data-theme", theme);
        try { localStorage.setItem("iim-theme", theme); } catch {}
    }, [theme]);

    const toggle = () => setTheme(t => t === "dark" ? "light" : "dark");
    return <ThemeContext.Provider value={{ theme, toggle }}>{children}</ThemeContext.Provider>;
}

export const useTheme = () => useContext(ThemeContext);
