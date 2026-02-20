/**
 * Settings Store — localStorage-based app settings
 * Manages license type selection, theme, and other user preferences
 */

const STORAGE_KEY = "thayduy_settings_v1";

export type LicenseType = "B" | "C1" | "C" | "D1" | "D" | "BE" | "CE" | "D1E" | "DE";
export type ThemeMode = "auto" | "light" | "dark";

interface SettingsData {
    licenseType: LicenseType;
    theme: ThemeMode;
}

const DEFAULT_SETTINGS: SettingsData = {
    licenseType: "B",
    theme: "auto",
};

function getData(): SettingsData {
    if (typeof window === "undefined") return DEFAULT_SETTINGS;
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return DEFAULT_SETTINGS;
        return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
    } catch {
        return DEFAULT_SETTINGS;
    }
}

function setData(data: SettingsData) {
    if (typeof window === "undefined") return;
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
        // localStorage full or unavailable
    }
}

/** Get current license type */
export function getLicenseType(): LicenseType {
    return getData().licenseType;
}

/** Set license type */
export function setLicenseType(type: LicenseType) {
    const data = getData();
    data.licenseType = type;
    setData(data);
}

/** Get theme mode */
export function getTheme(): ThemeMode {
    return getData().theme;
}

/** Set theme mode */
export function setTheme(theme: ThemeMode) {
    const data = getData();
    data.theme = theme;
    setData(data);
    applyTheme(theme);
}

/** Apply theme to document */
export function applyTheme(theme?: ThemeMode) {
    if (typeof document === "undefined") return;
    const t = theme ?? getTheme();
    document.documentElement.setAttribute("data-theme", t);
}

/** License type display info */
export const LICENSE_INFO: Record<LicenseType, { name: string; desc: string; icon: string }> = {
    B: { name: "Hạng B", desc: "Ô tô chở người ≤ 9 chỗ", icon: "🚗" },
    C1: { name: "Hạng C1", desc: "Xe tải 3.5 - 7.5 tấn", icon: "🚚" },
    C: { name: "Hạng C", desc: "Xe tải > 7.5 tấn", icon: "🚛" },
    D1: { name: "Hạng D1", desc: "Xe khách 10-30 chỗ", icon: "🚌" },
    D: { name: "Hạng D", desc: "Xe khách > 30 chỗ", icon: "🚍" },
    BE: { name: "Hạng BE", desc: "B + kéo rơ-moóc", icon: "🚗" },
    CE: { name: "Hạng CE", desc: "C + kéo rơ-moóc", icon: "🚛" },
    D1E: { name: "Hạng D1E", desc: "D1 + kéo rơ-moóc", icon: "🚌" },
    DE: { name: "Hạng DE", desc: "D + kéo rơ-moóc", icon: "🚍" },
};

