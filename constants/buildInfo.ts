// Build identity marker.
//
// This constant is bumped in the same commit that ships an OTA / native
// build, so a glance at the property-detail footer or any other surface
// that renders BUILD_SHA is enough to verify *which JS bundle is actually
// running on the device* — no remote-debug session required.
//
// Update both fields when you commit an OTA / build change.
export const BUILD_SHA = 'f1cbc3c (hotfix #9)';
export const BUILD_LABEL = 'hotfix #9 — Carto map tiles';
