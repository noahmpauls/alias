export type Alias = {
  id: string,
  code: string,
  link: string,
  note: string,
}

export type AliasCreate = Omit<Alias, "id">

export type AliasUpdate = Pick<Alias, "id"> & Partial<Alias>

export type AliasDelete = Pick<Alias, "id">
