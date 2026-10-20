// i18n.js - Language translations and management

const translations = {
  en: {
    // Popup
    app_title: "Website Screenshot Pro",
    tagline: "Fast & clean website captures",
    timer_3s: "3s timer",
    timer_hint: "3-second countdown before capture (great for dropdowns/menus)",
    btn_visible: "Visible Area",
    btn_crop: "Selected Area",
    btn_crop_desc: "Drag a box with mouse",
    btn_element: "Element Picker",
    btn_element_desc: "Click on any DOM element",
    btn_fullpage: "Full Page",
    btn_fullpage_desc: "Scroll and stitch page",
    default_action: "Default action:",
    action_editor: "Open in Editor",
    action_preview: "Quick Preview in Popup",
    language_label: "Language:",
    working: "Working...",
    countdown_prefix: "Capturing in",
    countdown_seconds: "seconds...",
    quick_preview: "Quick Preview",
    btn_edit: "Edit",
    btn_download: "Download",
    btn_copy: "Copy",
    copied: "Copied!",
    restricted_warning: "Chrome does not allow extensions to run scripts or take captures on Chrome Web Store or internal browser pages (chrome://) for security reasons. Please try on a standard website.",
    capture_error: "Capture error: ",
    element_picker_tooltip: "Hover over an element and click to capture it (ESC to cancel)",
    crop_tooltip: "Drag mouse to select an area (ESC to cancel)",

    // Editor
    editor_title: "Screenshot Pro Editor",
    undo_title: "Undo (Ctrl+Z)",
    redo_title: "Redo (Ctrl+Y)",
    tool_select: "Select / Move / Resize (V)",
    tool_arrow: "Arrow (A)",
    tool_rect: "Rectangle (R)",
    tool_circle: "Circle (C)",
    tool_text: "Text (T)",
    tool_highlighter: "Highlighter (H)",
    tool_blur: "Blur / Pixelate Censorship (B)",
    tool_step: "Numbered Step Bubbles 1, 2, 3... (S)",
    tool_crop: "Crop Canvas",
    color_title: "Color",
    stroke_width_title: "Line Thickness",
    ocr_btn: "OCR Text",
    copy_btn: "Copy",
    download_btn: "Download",
    panel_cleanshot_title: "CleanShot Canvas & Backdrop",
    panel_cleanshot_desc: "Add beautiful padding, drop-shadow, and gradients behind your image.",
    padding_label: "Padding",
    radius_label: "Corner Radius",
    shadow_label: "Shadow",
    shadow_none: "None",
    shortcuts_title: "Keyboard Shortcuts",
    shortcut_select: "Select & Move",
    shortcut_arrow: "Arrow",
    shortcut_rect: "Rectangle",
    shortcut_circle: "Circle",
    shortcut_text: "Text",
    shortcut_highlighter: "Highlighter",
    shortcut_blur: "Blur / Censor",
    shortcut_step: "Step Bubble",
    shortcut_delete: "Delete Selected",
    shortcut_undo: "Undo",
    ocr_modal_title: "OCR Text Recognition",
    ocr_processing: "Extracting text from image via OCR... Please wait...",
    ocr_copy_btn: "Copy Text",
    ocr_no_text: "No text found in image.",
    ocr_no_library: "OCR engine could not be initialized."
  },
  da: {
    // Popup
    app_title: "Website Screenshot Pro",
    tagline: "Hurtig og nem skærmoptagelse",
    timer_3s: "3s timer",
    timer_hint: "3 sekunders forsinkelse før optagelse (godt til dropdowns/menuer)",
    btn_visible: "Synligt område",
    btn_crop: "Valgt område",
    btn_crop_desc: "Marker et udsnit med musen",
    btn_element: "Element-vælger",
    btn_element_desc: "Klik på et DOM element",
    btn_fullpage: "Fuld side",
    btn_fullpage_desc: "Ruller og fanger hele siden",
    default_action: "Standard handling:",
    action_editor: "Åbn i Editor",
    action_preview: "Hurtigvisning i Popup",
    language_label: "Sprog / Language:",
    working: "Arbejder...",
    countdown_prefix: "Optager om",
    countdown_seconds: "sekunder...",
    quick_preview: "Hurtigvisning",
    btn_edit: "Rediger",
    btn_download: "Download",
    btn_copy: "Kopiér",
    copied: "Kopieret!",
    restricted_warning: "Chrome tillader ikke udvidelser at køre scripts eller tage screenshots på Chrome Web Store eller interne browsersider (chrome://) af sikkerhedsmæssige årsager. Prøv venligst på en almindelig webside.",
    capture_error: "Fejl ved optagelse: ",
    element_picker_tooltip: "Hold musen over et element og klik for at fange det (ESC for at annullere)",
    crop_tooltip: "Træk musen for at markere et område (Tryk ESC for at annullere)",

    // Editor
    editor_title: "Screenshot Pro Editor",
    undo_title: "Fortryd (Ctrl+Z)",
    redo_title: "Gentag (Ctrl+Y)",
    tool_select: "Vælg / Flyt / Skalér (V)",
    tool_arrow: "Pil (A)",
    tool_rect: "Rektangel (R)",
    tool_circle: "Cirkel (C)",
    tool_text: "Tekst (T)",
    tool_highlighter: "Overstregningstusch (H)",
    tool_blur: "Sløring / Censurering (B)",
    tool_step: "Nummererede trinboblere 1, 2, 3... (S)",
    tool_crop: "Beskær Lærred",
    color_title: "Farve",
    stroke_width_title: "Stregtykkelse",
    ocr_btn: "OCR Tekst",
    copy_btn: "Kopiér",
    download_btn: "Download",
    panel_cleanshot_title: "CleanShot Lærred & Baggrund",
    panel_cleanshot_desc: "Tilføj smuk padding, skygge og gradient bag dit billede.",
    padding_label: "Polstring (Padding)",
    radius_label: "Hjørnerundning",
    shadow_label: "Skygge",
    shadow_none: "Ingen",
    shortcuts_title: "Tastaturgenveje",
    shortcut_select: "Vælg & Flyt",
    shortcut_arrow: "Pil",
    shortcut_rect: "Rektangel",
    shortcut_circle: "Cirkel",
    shortcut_text: "Tekst",
    shortcut_highlighter: "Overstregning",
    shortcut_blur: "Sløring / Censor",
    shortcut_step: "Trin-boble",
    shortcut_delete: "Slet valgte",
    shortcut_undo: "Fortryd",
    ocr_modal_title: "OCR Tekstgenkendelse",
    ocr_processing: "Behandler tekst i billedet med OCR... Vent et øjeblik...",
    ocr_copy_btn: "Kopiér Tekst",
    ocr_no_text: "Ingen tekst fundet i billedet.",
    ocr_no_library: "OCR motor kunne ikke initialiseres."
  }
};

let currentLang = "en"; // Default is English!

async function initI18n(callback) {
  const res = await new Promise(resolve => chrome.storage.local.get(["appLanguage"], resolve));
  currentLang = res.appLanguage || "en"; // Default English
  applyTranslations();
  if (callback) callback(currentLang);
}

function setLanguage(lang) {
  currentLang = lang;
  chrome.storage.local.set({ appLanguage: lang }, () => {
    applyTranslations();
  });
}

function t(key) {
  const dict = translations[currentLang] || translations.en;
  return dict[key] || translations.en[key] || key;
}

function applyTranslations() {
  document.querySelectorAll("[data-i18n]").forEach(el => {
    const key = el.getAttribute("data-i18n");
    el.textContent = t(key);
  });

  document.querySelectorAll("[data-i18n-title]").forEach(el => {
    const key = el.getAttribute("data-i18n-title");
    el.setAttribute("title", t(key));
  });

  document.querySelectorAll("[data-i18n-placeholder]").forEach(el => {
    const key = el.getAttribute("data-i18n-placeholder");
    el.setAttribute("placeholder", t(key));
  });
}
