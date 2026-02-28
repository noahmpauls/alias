const dataImporter = document.querySelector("lit-alias-data-importer");

document.addEventListener("extractaliasdata", (event) => {
  dataImporter?.setData(event.detail.filename, event.detail.aliases);
});
