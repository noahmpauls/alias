import { AliasFileImporterElement } from "components/AliasFileImporterElement";
import { AliasPagesElement } from "components/AliasPagesElement";

AliasPagesElement.register();
AliasFileImporterElement.register();

document.addEventListener("extractaliasdata", event => {
  console.log(event.detail);
});