/**
 * js/services/weight-service.js
 * Manages Weight reference data and calculation logic.
 */
import { setState, getState } from "../state.js";
import { dataManager } from "./data-manager.js";
import { excelParser } from "./excel-parser.js";
import { detectRating } from "./rating-detector.js";

const LOG_PREFIX = "[WeightService]";

class WeightService {
    constructor() {
        this.initialState = {
            refData: [], // Array of rows from wtValveweights.xlsx
            config: {
                smartValveDetection: true
            }
        };
    }

    _normalizeValveType(value) {
        return String(value || '')
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
    }

    _isCodeLikeValveType(value) {
        const t = String(value || '').trim().toUpperCase();
        return !t || (t.length <= 6 && /^[A-Z0-9_-]+$/.test(t) && !/\s/.test(t));
    }

    init() {
        const currentState = getState("weight");
        if (!currentState) {
            // Load config from localStorage
            let savedConfig = { smartValveDetection: true };
            try {
                const raw = localStorage.getItem("pcf_weight_config");
                if (raw) savedConfig = JSON.parse(raw);
            } catch (e) {
                console.warn("Failed to load weight config", e);
            }

            setState("weight", {
                ...this.initialState,
                config: savedConfig
            });
        }
    }

    /**
     * Load reference data from a file.
     * @param {File} file 
     */
    async loadReferenceData(file) {
        console.info(`${LOG_PREFIX} Loading reference data from ${file.name}`);
        const data = await excelParser.parseExcelFile(file);

        const s = getState("weight");
        setState("weight", { ...s, refData: data });

        console.info(`${LOG_PREFIX} Loaded ${data.length} rows of reference data.`);
    }

    toggleSmartValve(enabled) {
        const s = getState("weight");
        const newConfig = { ...s.config, smartValveDetection: enabled };
        setState("weight", { ...s, config: newConfig });

        localStorage.setItem("pcf_weight_config", JSON.stringify(newConfig));
    }

    /**
     * Smart Rating Detection — delegated to shared rating-detector.js
     * Uses configurable pressureRatingMap from defaults.js.
     * @param {string} pipingClass e.g. "150LB", "300#", "A1-150"
     * @returns {number|null} Rating (150, 300, 600...) or null
     */
    detectRating(pipingClass) {
        return detectRating(pipingClass);
    }

    /**
     * Calculate Weight for a component.
     * Uses wtValveweights.xlsx structure:
     * Col 0: Type Code (G, C, B, SB)
     * Col 2: Size DN
     * Col 3: Weight (kg)
     * Col 6: Length (mm)
     * Col 8: Rating
     * 
     * @param {Object} component PCF Component Object
     * @param {Object} linelistData Optional Linelist data for this component
     * @returns {number|null} Weight in KG
     */
    calculateWeight(component, linelistData) {
        let s = getState("weight");

        // Auto-init if missing
        if (!s) {
            this.init();
            s = getState("weight");
        }

        const refData = dataManager.getWeights();
        if (!refData || refData.length === 0) return null;

        // 1. Determine Rating
        // Try component attribute first (if available), then Linelist

        let rawClass = component.attributes?.["PIPING-CLASS"] ||
                       component.attributes?.["PIPING-SPEC"] ||
                       (linelistData ? (linelistData["Piping Class"] || linelistData["Class"] || linelistData["Spec"]) : "");

        let rating = this.detectRating(rawClass);

        // Fallback: User logic "Based on 1st or first two character of piping class"
        if (!rating && rawClass) {
             const clean = String(rawClass).trim().toUpperCase();
             if (/\b150\s*(LB|#|ANSI|ASME)?\b/.test(clean)) rating = 150;
             else if (/\b300\s*(LB|#|ANSI|ASME)?\b/.test(clean)) rating = 300;
             else if (/\b600\s*(LB|#|ANSI|ASME)?\b/.test(clean)) rating = 600;
             else if (/\b900\s*(LB|#|ANSI|ASME)?\b/.test(clean)) rating = 900;
             else if (/\b1500\s*(LB|#|ANSI|ASME)?\b/.test(clean)) rating = 1500;
             else if (/\b2500\s*(LB|#|ANSI|ASME)?\b/.test(clean)) rating = 2500;
        }

        if (!rating) return null; // Default fallback

        // 2. Determine Size (DN)
        // Component size is usually in MM (Bore)
        // Needs to handle cases where bore might be string or number
        // Ensure we have a valid numeric bore
        let sizeDN = component.bore1 || component.bore;
        if (!sizeDN && component.eps && component.eps.length > 0) {
            sizeDN = component.eps[0].bore;
        }
        if (!sizeDN) return null;

        // Round to nearest standard DN if needed?
        sizeDN = parseFloat(sizeDN);

        // 3. Determine Type & Length (for valves)
        const pcfType = component.type; // e.g. VALVE

        if (pcfType === "VALVE") {
            let valveType = component.valveType ||
                              component.attributes?.["VALVE-TYPE"] ||
                              component.attributes?.["Type Description"] ||
                              component.attributes?.["DESCRIPTION"] ||
                              component.attributes?.["Description"] ||
                              component.description ||
                              "";
            if (this._isCodeLikeValveType(valveType)) valveType = "";

            // Identify type by length if Smart Valve Detection is on
            // Safe access in case config is somehow still missing
            const smartEnabled = s?.config?.smartValveDetection ?? true;

            if (smartEnabled) {
                // Calculate length from endpoints
                // We need 3D distance between EP1 and EP2
                if (component.eps && component.eps.length >= 2) {
                    const p1 = component.eps[0];
                    const p2 = component.eps[1];
                    const dx = p1.x - p2.x;
                    const dy = p1.y - p2.y;
                    const dz = p1.z - p2.z;
                    const len = Math.sqrt(dx * dx + dy * dy + dz * dz);

                    // Find best match in DB for this Size + Rating + Length
                    const weight = this._findValveWeight(sizeDN, rating, len, refData, valveType);
                    if (weight !== null) return weight;
                }
            }
        }

        return null;
    }

    _findValveWeight(dn, rating, length, refData, valveType = '') {
        const TOLERANCE = 6.0; // mm allow some slack
        const map = dataManager.headerMap.weights;
        const valveNorm = this._normalizeValveType(valveType);

        // Ensure mapping exists (rating is now standard in defaults)
        if (!map || !map.size || !map.weight) {
             console.warn(`${LOG_PREFIX} Weight mapping missing required fields.`);
             return null;
        }

        let bestMatch = null;
        let minDiff = Infinity;

        for (const row of refData) {
            if (!row) continue;

            const rowValveType = this._normalizeValveType(
                row[map.description] ??
                row['Type Description'] ??
                row['Valve Type'] ??
                row.TypeDesc ??
                row.Type ??
                ''
            );
            if (valveNorm && (!rowValveType || rowValveType !== valveNorm)) continue;

            // Use mapped column names
            const rDN = parseFloat(row[map.size] ?? row.DN ?? row.NS ?? row['Size (NPS)'] ?? row.Size);

            // Check Rating if mapped and present
            if (map.rating && row[map.rating]) {
                const rRatingVal = String(row[map.rating]);
                const rRating = parseFloat(rRatingVal.replace(/[#LB]/gi, ''));
                if (!isNaN(rRating) && Math.abs(rRating - rating) > 0.1) {
                    continue; // Mismatch rating
                }
            }

            // Check match (Size)
            if (Math.abs(rDN - dn) < 0.1) {
                // Check Length (mapped or fuzzy)
                const lenKey = [
                    map.length,
                    'RF-F/F',
                    'Length (RF-F/F)',
                    'RTJ F/F',
                    'BW-F/F',
                    Object.keys(row).find(k => k.toLowerCase().includes("len"))
                ].find(k => k && row[k] != null) || "Length";
                const rLen = parseFloat(row[lenKey]);

                if (!isNaN(rLen)) {
                    const diff = Math.abs(rLen - length);
                    if (diff <= TOLERANCE && diff < minDiff) {
                        minDiff = diff;
                        bestMatch = row;
                    }
                }
            }
        }

        return bestMatch ? parseFloat(bestMatch['RF/RTJ KG'] ?? bestMatch[map.weight]) : null;
    }
}

export const weightService = new WeightService();
