import { useTheme } from "@/lib/theme-provider";

export function useThemeToggle() {
  const { theme, setTheme } = useTheme();
  
  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light");
  };
  
  return {
    theme,
    setTheme,
    toggleTheme,
    isDarkMode: theme === "dark"
  };
}
