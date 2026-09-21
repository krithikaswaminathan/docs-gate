// SYNTHETIC FIXTURE: written for docs-gate testing only.
// Requires another module, so it CANNOT be parsed statically -- this
// exercises the fallback-to-directory-tree path, and (with explicit
// confirmation) the opt-in execute-sidebars.mjs path.
const generated = require("./generated-sidebar.js");

module.exports = {
  mainSidebar: ["intro", generated],
};
