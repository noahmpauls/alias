const aliasList = document.querySelector("alias-list");

document.addEventListener("createalias", (event) => {
  aliasList?.createAlias(event.detail);
});

document.addEventListener("updatealias", (event) => {
  aliasList?.updateAlias(event.detail);
});

document.addEventListener("deletealias", (event) => {
  aliasList?.deleteAlias(event.detail);
});
