"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var src_exports = {};
__export(src_exports, {
  TMPlugin: () => tampermonkeyPlugin,
  defineTmHeader: () => defineTmHeader
});
module.exports = __toCommonJS(src_exports);

// src/common/constant.ts
var DEV_MODE = "development";
var PROD_MODE = "production";
var GM_ADD_STYLE = "GM_addStyle";
var DEFAULT_NPM_CDN = "https://unpkg.com";
var INTRO_FOR_PLACEHOLDER = 'console.warn("__TEMPLATE_INJECT_CSS_PLACEHOLDER_NOT_WORK__")';
var grants = [
  "unsafeWindow",
  "GM_addStyle",
  "GM_addElement",
  "GM_deleteValue",
  "GM_listValues",
  "GM_addValueChangeListener",
  "GM_removeValueChangeListener",
  "GM_setValue",
  "GM_getValue",
  "GM_log",
  "GM_getResourceText",
  "GM_getResourceURL",
  "GM_registerMenuCommand",
  "GM_unregisterMenuCommand",
  "GM_openInTab",
  "GM_xmlhttpRequest",
  "GM_download",
  "GM_getTab",
  "GM_saveTab",
  "GM_getTabs",
  "GM_notification",
  "GM_setClipboard",
  "GM_info"
];
var tmHeaderKeys = [
  "name",
  "name:en",
  "name:zh",
  "name:zh-cn",
  "version",
  "description",
  "description:en",
  "description:zh",
  "description:zh-cn",
  "author",
  "namespace",
  "license",
  "include",
  "require",
  "homepage",
  "homepageURL",
  "website",
  "source",
  "icon",
  "iconURL",
  "defaulticon",
  "icon64",
  "icon64URL",
  "updateURL",
  "downloadURL",
  "supportURL",
  "match",
  "exclude",
  "resource",
  "connect",
  "run-at",
  "grant",
  "noframes",
  "unwrap",
  "nocompat",
  "antifeature"
];

// src/lib/client-code.ts
function generateClientCode(scheme, { address, port }, entry) {
  return `
  const url = '${scheme}://${address}:${port}'

  const originFetch = unsafeWindow.fetch
  const ping = '/__vite_ping'
  unsafeWindow.fetch = function(input, init) {
    if (input === ping) {
      input = url + ping
    }
    return originFetch(input, init)
  }

  ${grants.map((item) => `unsafeWindow.${item} = ${item}`).join("\n  ")}

  function createModuleScript(path) {
    if (typeof GM_addElement == 'function') {
      return GM_addElement('script', {
        type: 'module',
        src: url + '/' + path
      })
    } else {
      const script = document.createElement('script')
      script.type = 'module'
      script.src = url + '/' + path
      document.body.appendChild(script)
      return script
    }
  }

  createModuleScript('@vite/client')
  createModuleScript('${entry != null ? entry : "src/main.ts"}')
`;
}

// src/common/utils.ts
var import_node_fs = __toESM(require("fs"));
var import_node_path = __toESM(require("path"));
var root = process.cwd();
function readJSON(filePath) {
  const json = import_node_fs.default.readFileSync(filePath, "utf8");
  return JSON.parse(json);
}
function readPackageJSON() {
  const packagePath = import_node_path.default.resolve(root, "package.json");
  return readJSON(packagePath);
}
function buildName(name) {
  return name.replace(
    /(^|-)([A-Za-z])/g,
    (m) => m.replace("-", "").toUpperCase()
  );
}
function buildGlobalName(input) {
  if (!input)
    return input;
  if (Array.isArray(input)) {
    const result = {};
    for (const name of input) {
      result[name] = buildName(name);
    }
    return result;
  }
  const globals = {};
  for (const [key, value] of Object.entries(input)) {
    if (Array.isArray(value)) {
      globals[key] = value[0];
    } else {
      globals[key] = value;
    }
  }
  return globals;
}
function buildDefaultCDN(packageName) {
  const packagePath = import_node_path.default.resolve(
    root,
    `node_modules/${packageName}/package.json`
  );
  if (import_node_fs.default.existsSync(packagePath)) {
    const { version = "latest" } = readJSON(packagePath);
    return `${DEFAULT_NPM_CDN}/${packageName}@${version}`;
  }
  return `${DEFAULT_NPM_CDN}/${packageName}`;
}
function buildRequireCDN(input) {
  if (!input)
    return [];
  if (Array.isArray(input)) {
    return input.map((name) => buildDefaultCDN(name)).filter(Boolean);
  }
  const requireCDNs = [];
  for (const [key, value] of Object.entries(input)) {
    if (Array.isArray(value)) {
      value[1] && requireCDNs.push(value[1]);
      continue;
    }
    requireCDNs.push(buildDefaultCDN(key));
  }
  return requireCDNs;
}
function defaultEntry() {
  const tsconfigFile = import_node_path.default.resolve(root, "vite.config.js");
  const extension = import_node_fs.default.existsSync(tsconfigFile) ? "ts" : "js";
  return import_node_path.default.resolve(root, `src/main.${extension}`);
}
function getDefinedConfig() {
  const jsonPath = import_node_path.default.resolve(root, "header.config.json");
  if (import_node_fs.default.existsSync(jsonPath)) {
    return readJSON(jsonPath);
  }
  const jsPath = import_node_path.default.resolve(root, "header.config.mjs");
  if (import_node_fs.default.existsSync(jsPath)) {
    return require(jsPath);
  }
  const txtPath = import_node_path.default.resolve(root, "header.config.txt");
  if (import_node_fs.default.existsSync(txtPath)) {
    return import_node_fs.default.readFileSync(txtPath, "utf8");
  }
  return readPackageJSON().tmHeader;
}

// src/lib/grants.ts
var import_acorn_walk = require("acorn-walk");
var grantsSet = new Set(grants);
var usedGrants = /* @__PURE__ */ new Set();
function parseGrant(autoGrant) {
  if (autoGrant === false)
    return {};
  return {
    name: "tm-userscript-grant",
    moduleParsed(moduleInfo) {
      if (/\.(ts|js|vue)$/.test(moduleInfo.id) && moduleInfo.ast) {
        (0, import_acorn_walk.full)(moduleInfo.ast, (node) => {
          if (node.type === "CallExpression") {
            const calleeName = node.callee.name;
            if (calleeName && grantsSet.has(calleeName)) {
              usedGrants.add(calleeName);
            }
          }
          if (node.type === "Identifier" && grantsSet.has(node.name)) {
            usedGrants.add(node.name);
          }
        });
      }
    }
  };
}
function addUsedGrants(tmConfig, isDevelopment = false) {
  if (isDevelopment) {
    tmConfig.grant = grants;
    return;
  }
  if (!Array.isArray(tmConfig.grant)) {
    tmConfig.grant = [tmConfig.grant].filter(Boolean);
  }
  tmConfig.grant = [.../* @__PURE__ */ new Set([...tmConfig.grant, ...usedGrants])];
}
function addExtraTmGrant(tmConfig) {
  if (!Array.isArray(tmConfig.grant)) {
    tmConfig.grant = [tmConfig.grant].filter(Boolean);
  }
  if (!tmConfig.grant.includes(GM_ADD_STYLE)) {
    tmConfig.grant.push(GM_ADD_STYLE);
  }
  return tmConfig;
}

// src/lib/tm-header.ts
function generateTmHeader(mode, input, hasCss) {
  var _a, _b, _c;
  const definedConfig = (_a = getDefinedConfig()) != null ? _a : {};
  if (typeof definedConfig == "string")
    return definedConfig;
  const packageJson = readPackageJSON();
  const config = {};
  for (const key of tmHeaderKeys) {
    const value = (_b = definedConfig[key]) != null ? _b : packageJson[key];
    if (value)
      config[key] = value;
  }
  config.require = [
    ...Array.isArray(config.require) ? config.require : [(_c = config.require) != null ? _c : ""],
    ...buildRequireCDN(input)
  ].filter(Boolean);
  if (mode === DEV_MODE) {
    addUsedGrants(config, true);
    config.name = "[ Dev ] - " + config.name;
  } else {
    hasCss && addExtraTmGrant(config);
    addUsedGrants(config);
  }
  const definedMetaKeys = Object.keys(config);
  const maxKeyLength = Math.max(...definedMetaKeys.map((k) => k.length));
  const definedMetaBlock = definedMetaKeys.flatMap((key) => {
    const value = config[key];
    const spaces = Array.from({ length: maxKeyLength - key.length + 8 }).join(" ");
    const dealMeta = (v) => {
      if (Array.isArray(v))
        return v.map((element) => dealMeta(element));
      if (typeof v == "boolean" && v === true)
        return `// @${key}`;
      return `// @${key}${spaces}${v}`;
    };
    return dealMeta(value);
  });
  return [
    "// ==UserScript==",
    ...definedMetaBlock,
    "// ==/UserScript=="
  ].join("\n");
}

// src/lib/build-options.ts
var getRollupOptions = (input) => {
  const external = Array.isArray(input) ? input : Object.keys(input != null ? input : {});
  const globals = buildGlobalName(input);
  return {
    external,
    output: {
      globals,
      intro: INTRO_FOR_PLACEHOLDER,
      inlineDynamicImports: true
    }
  };
};
var getLibraryOptions = (entry) => {
  const { name: packageName } = readPackageJSON();
  if (!packageName) {
    const error = "props `name` in package.json is required!";
    console.error(error);
    throw new Error(error);
  }
  const name = buildName(packageName);
  return {
    name,
    entry: entry != null ? entry : defaultEntry(),
    formats: ["iife"],
    fileName: () => `${packageName}.user.js`
  };
};

// src/lib/plugin.ts
function generateDevelopmentCode(scheme, address, input, entry) {
  if (!address)
    return "\u5904\u7406\u5927\u5931\u8D25\u4E86\u55F7...";
  const tmHeader = generateTmHeader(DEV_MODE, input, true);
  const code = generateClientCode(scheme, address, entry);
  return `${tmHeader}

(function () {
${code}
})()`;
}
function getAddress(address) {
  return typeof address == "object" ? address : void 0;
}
var DEV_TAMPERMONKEY_PATH = "/_development.user.js";
var showInstallLog = (isHttps, address) => {
  const url = `${isHttps ? "https" : "http"}://${address.address}:${address.port}${DEV_TAMPERMONKEY_PATH}`;
  setTimeout(() => {
    console.log(
      "\x1B[36m%s\x1B[0m",
      `> [TMPlugin] - click link to install userscript: ${url}`
    );
  });
};
function tampermonkeyPlugin(options = {}) {
  const { entry, externalGlobals, autoGrant } = options;
  const { moduleParsed } = parseGrant(autoGrant);
  return [
    {
      name: "tm-userscript-builder",
      moduleParsed,
      configureServer(server) {
        return () => {
          var _a;
          const isHttps = !!server.config.server.https;
          (_a = server.httpServer) == null ? void 0 : _a.on("listening", () => {
            var _a2;
            debugger;
            const address = getAddress((_a2 = server.httpServer) == null ? void 0 : _a2.address());
            address && showInstallLog(isHttps, address);
          });
          server.middlewares.use((request, response, next) => {
            var _a2;
            let scheme_result = isHttps ? "https" : "http";
            if (request.url === DEV_TAMPERMONKEY_PATH) {
              const address = getAddress((_a2 = server.httpServer) == null ? void 0 : _a2.address());
              const developmentCode = generateDevelopmentCode(
                scheme_result,
                address,
                externalGlobals,
                entry
              );
              response.setHeader("Cache-Control", "no-store");
              response.write(developmentCode);
            }
            next();
          });
        };
      },
      config(config) {
        config.build = {
          lib: getLibraryOptions(entry),
          rollupOptions: getRollupOptions(externalGlobals),
          minify: false,
          sourcemap: false,
          cssCodeSplit: false
        };
      }
    },
    {
      name: "tm-userscript-inject",
      apply: "build",
      enforce: "post",
      generateBundle(_options, bundle) {
        const bundleKeys = Object.keys(bundle);
        const cssBundles = bundleKeys.filter((key) => key.endsWith(".css"));
        const jsBundles = bundleKeys.filter((key) => key.endsWith(".js"));
        const cssList = [];
        for (const css of cssBundles) {
          const chunk = bundle[css];
          if (chunk.type === "asset" && typeof chunk.source == "string") {
            delete bundle[css];
            cssList.push(chunk.source);
            continue;
          }
        }
        const hadCss = cssList.length > 0;
        const tmHeader = generateTmHeader(PROD_MODE, externalGlobals, hadCss);
        for (const js of jsBundles) {
          const chunk = bundle[js];
          if (chunk.type === "chunk") {
            let chunkCode = chunk.code;
            for (const [moduleKey, moduleValue] of Object.entries(
              chunk.modules
            )) {
              if (/\.(c|le|sc)ss$/.test(moduleKey) && moduleValue.code) {
                const cssCode = moduleValue.code.replaceAll("'", '"').replaceAll("#__PURE__", "@__PURE__");
                chunkCode = chunkCode.replace(cssCode, "");
              }
            }
            chunk.code = tmHeader + "\n\n" + chunkCode.replace(
              INTRO_FOR_PLACEHOLDER,
              hadCss ? `${GM_ADD_STYLE}(\`
${cssList.join("\n")}  \`)` : ""
            );
          }
        }
      }
    }
  ];
}

// src/index.ts
function defineTmHeader(options) {
  return options;
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  TMPlugin,
  defineTmHeader
});
//# sourceMappingURL=index.js.map