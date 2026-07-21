import {Config} from "@remotion/cli/config";
import {chromium} from "playwright";

Config.setEntryPoint("video/index.ts");
Config.setPublicDir("artifacts/demo-video");
Config.setCodec("h264");
Config.setCrf(18);
Config.setPixelFormat("yuv420p");
Config.setConcurrency(1);
Config.setMuted(true);
Config.setEnforceAudioTrack(false);
Config.setBrowserExecutable(chromium.executablePath());

// TypeScript 7 exposes its CommonJS API differently. Supplying the raw config
// keeps Remotion's esbuild loader from trying to read it through `require()`.
Config.overrideWebpackConfig((current) => {
  const rules = current.module?.rules?.map((rule) => {
    if (!rule || typeof rule !== "object") {
      return rule;
    }

    const typedRule = rule as {use?: unknown};
    if (!Array.isArray(typedRule.use)) {
      return rule;
    }

    return {
      ...rule,
      use: typedRule.use.map((entry) => {
        if (!entry || typeof entry !== "object") {
          return entry;
        }

        const loader = entry as {
          loader?: string;
          options?: Record<string, unknown>;
        };
        if (!loader.loader?.includes("esbuild-loader")) {
          return entry;
        }

        return {
          ...loader,
          options: {
            ...loader.options,
            tsconfigRaw: {
              compilerOptions: {
                jsx: "react-jsx",
                target: "ES2022",
                useDefineForClassFields: true,
              },
            },
          },
        };
      }),
    };
  });

  return {
    ...current,
    module: {
      ...current.module,
      rules,
    },
  };
});
