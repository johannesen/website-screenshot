# Website Screenshot - Chrome Extension (Manifest V3)

En moderne, hurtig og intuitiv Google Chrome udvidelse til at tage screenshots af websider.

## Funktioner
- 📸 **Synligt område (Visible Area)**: Tager lynhurtigt et skærmbillede af det aktuelle viewport.
- ✂️ **Valgt område (Crop / Selection)**: Træk et rektangel med musen på siden for kun at fange et bestemt udsnit.
- 📜 **Fuld side (Full Page)**: Ruller automatisk ned over siden og sammensætter hele websiden til ét samlet højopløsningsbillede.
- 💾 **Eksport**:
  - Download direkte som `.png`
  - Kopiér til udklipsholder (Clipboard)
  - Forhåndsvisning direkte i udvidelsens popup

## Installation i Chrome
1. Åbn Google Chrome og naviger til `chrome://extensions/`
2. Aktivér **Udviklertilstand** (Developer mode) i øverste højre hjørne.
3. Klik på **Indlæs udpakket** (Load unpacked).
4. Vælg mappen for dette projekt: `c:\dev\Chrome Extensions\website-screenshot`
5. Fastgør (pin) udvidelsen til din værktøjslinje for nem adgang.

## Projektstruktur
```text
├── manifest.json         # Extension Manifest V3 konfiguration
├── background.js         # Service Worker til capture og filhåndtering
├── popup.html            # Brugerflade
├── popup.css             # Styling (inkl. mørkt/lyst tema)
├── popup.js              # Popup logik og forhåndsvisning
├── content/
│   ├── crop.js           # Områdemarkering med musen
│   ├── crop.css          # Styling til markeringsrektangel
│   └── fullpage.js       # Rullende sammensætning af hele websiden
└── icons/                # Ikoner i 16x16, 48x48 og 128x128
```
