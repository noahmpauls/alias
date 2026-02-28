import path from "node:path";
import * as esbuild from "esbuild";

const plugin = {
  name: "plugin",
  setup(build) {
    build.onStart(() => {
      console.log("[esbuild] starting building...");
    });
    build.onEnd((result) => {
      const errors = result.errors.length;
      if (errors > 0) {
        console.error(
          `[esbuild] build failed with ${errors} error${errors > 1 ? "s" : ""}.`,
        );
      } else {
        console.log(`[esbuild] build complete.`);
      }
    });
  },
};

const scriptEntry = (file) => ({
  in: path.resolve("src", "scripts", `${file}.ts`),
  out: file,
});

const files = ["background", "components", "import", "popup"].map(scriptEntry);

const args = new Set(process.argv);
const watch = args.has("--watch") || args.has("-w");

const config = {
  entryPoints: files,
  bundle: true,
  format: "esm",
  target: "esnext",
  ignoreAnnotations: true,
  outdir: path.resolve("bin"),
  plugins: [plugin],
  color: true,
  define: { ESBUILD_DEV: `${watch}` },
};

if (watch) {
  console.log("watching...");
  const ctx = await esbuild.context(config);
  await ctx.watch();
} else {
  await esbuild.build(config);
}
