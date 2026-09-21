// SYNTHETIC FIXTURE: written for docs-gate testing only.
// Stands in for a real build-time sidebar generator. Deliberately has
// an observable side effect (the console.log) so a manual test can
// confirm this file's code actually ran when execute-sidebars.mjs is
// used, and did NOT run when only the static parser is used.
console.log("generated-sidebar.js was executed");

module.exports = {
  type: "category",
  label: "Guides",
  items: ["guides/setup"],
};
