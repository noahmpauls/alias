import type { Alias } from "@alias/alias";

export const EXAMPLE_ALIASES: Alias[] = [
  {
    code: "arch",
    link: "https://archlinux.org",
    note: "Arch Linux",
  },
  {
    code: "git",
    link: "https://github.com/",
    note: "GitHub",
  },
  {
    code: "git alias",
    link: "https://github.com/noahmpauls/alias",
    note: "GitHub",
  },
  {
    code: "git bouncer",
    link: "https://github.com/noahmpauls/bouncer",
    note: "GitHub",
  },
  {
    code: "hn",
    link: "https://news.ycombinator.com",
    note: "HackerNews",
  },
  {
    code: "test",
    link: "https://thisdomain.isfartoolong.andsomeoneshould.reallthinkabout.maybeshorteningitdown.com/anddontgetme/startedon/thepaths",
    note: "HackerNews",
  },
  {
    code: "mail",
    link: "https://app.fastmail.com",
    note: "Email"
  },
  {
    code: "mdn",
    link: "https://developer.mozilla.org",
    note: "MDN",
  },
  {
    code: "wiki",
    link: "https://en.wikipedia.org",
    note: "Wikipedia",
  },
].map((alias, index) => ({ ...alias, id: String(index) }));

