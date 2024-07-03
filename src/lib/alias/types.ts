export type Alias = {
  id: string,
  name: string,
  code: string,
  link: string,
}

export type AliasCreate = Omit<Alias, "id">

export type AliasUpdate = Pick<Alias, "id"> & Partial<Alias>

export type AliasDelete = Pick<Alias, "id">
