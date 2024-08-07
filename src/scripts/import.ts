import { AliasDataImporterElement } from "components/AliasDataImporterElement";
import { AliasFileImporterElement } from "components/AliasFileImporterElement";
import { AliasManagerElement } from "components/AliasManagerElement";
import { AliasPagesElement } from "components/AliasPagesElement";

AliasPagesElement.register();
AliasFileImporterElement.register();
AliasManagerElement.register();
AliasDataImporterElement.register();

const dataImporter = document.querySelector("alias-data-importer");

document.addEventListener("extractaliasdata", event => {
  dataImporter?.setData(event.detail.filename, event.detail.aliases);
});