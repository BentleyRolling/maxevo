function postProcess(text) {
  return (text || "")
    .replace(/(^|\n)\s*as an ai[^.\n]*[.\n]/gi, "$1")
    .replace(/I (cannot|can't) predict (the )?future[^.\n]*[.\n]/gi, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

module.exports = { postProcess };