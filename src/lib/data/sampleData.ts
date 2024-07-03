import type { Alias } from "@alias/alias";

export const EXAMPLE_ALIASES: Alias[] = [
  {
    code: "arch",
    link: "https://archlinux.org",
    name: "Arch Linux",
  },
  {
    code: "git",
    link: "https://github.com/",
    name: "GitHub",
  },
  {
    code: "git alias",
    link: "https://github.com/noahmpauls/alias",
    name: "GitHub",
  },
  {
    code: "git bouncer",
    link: "https://github.com/noahmpauls/bouncer",
    name: "GitHub",
  },
  {
    code: "hn",
    link: "https://news.ycombinator.com",
    name: "HackerNews",
  },
  {
    code: "test",
    link: "https://thisdomain.isfartoolong.andsomeoneshould.reallthinkabout.maybeshorteningitdown.com/anddontgetme/startedon/thepaths",
    name: "HackerNews",
  },
  {
    code: "mail",
    link: "https://app.fastmail.com",
    name: "Email"
  },
  {
    code: "mdn",
    link: "https://developer.mozilla.org",
    name: "MDN",
  },
  {
    code: "wiki",
    link: "https://en.wikipedia.org",
    name: "Wikipedia",
  },
].map((alias, index) => ({ ...alias, id: String(index) }));

