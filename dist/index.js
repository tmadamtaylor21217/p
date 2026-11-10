#!/usr/bin/env bun
// @bun
var __create = Object.create;
var __getProtoOf = Object.getPrototypeOf;
var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
function __accessProp(key) {
  return this[key];
}
var __toESMCache_node;
var __toESMCache_esm;
var __toESM = (mod, isNodeMode, target) => {
  var canCache = mod != null && typeof mod === "object";
  if (canCache) {
    var cache = isNodeMode ? __toESMCache_node ??= new WeakMap : __toESMCache_esm ??= new WeakMap;
    var cached = cache.get(mod);
    if (cached)
      return cached;
  }
  target = mod != null ? __create(__getProtoOf(mod)) : {};
  const to = isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target;
  for (let key of __getOwnPropNames(mod))
    if (!__hasOwnProp.call(to, key))
      __defProp(to, key, {
        get: __accessProp.bind(mod, key),
        enumerable: true
      });
  if (canCache)
    cache.set(mod, to);
  return to;
};
var __commonJS = (cb, mod) => () => (mod || cb((mod = { exports: {} }).exports, mod), mod.exports);
var __returnValue = (v) => v;
function __exportSetter(name, newValue) {
  this[name] = __returnValue.bind(null, newValue);
}
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, {
      get: all[name],
      enumerable: true,
      configurable: true,
      set: __exportSetter.bind(all, name)
    });
};
var __esm = (fn, res) => () => (fn && (res = fn(fn = 0)), res);
var __require = import.meta.require;

// node_modules/commander/lib/error.js
var require_error = __commonJS((exports) => {
  class CommanderError extends Error {
    constructor(exitCode, code, message) {
      super(message);
      Error.captureStackTrace(this, this.constructor);
      this.name = this.constructor.name;
      this.code = code;
      this.exitCode = exitCode;
      this.nestedError = undefined;
    }
  }

  class InvalidArgumentError extends CommanderError {
    constructor(message) {
      super(1, "commander.invalidArgument", message);
      Error.captureStackTrace(this, this.constructor);
      this.name = this.constructor.name;
    }
  }
  exports.CommanderError = CommanderError;
  exports.InvalidArgumentError = InvalidArgumentError;
});

// node_modules/commander/lib/argument.js
var require_argument = __commonJS((exports) => {
  var { InvalidArgumentError } = require_error();

  class Argument {
    constructor(name, description) {
      this.description = description || "";
      this.variadic = false;
      this.parseArg = undefined;
      this.defaultValue = undefined;
      this.defaultValueDescription = undefined;
      this.argChoices = undefined;
      switch (name[0]) {
        case "<":
          this.required = true;
          this._name = name.slice(1, -1);
          break;
        case "[":
          this.required = false;
          this._name = name.slice(1, -1);
          break;
        default:
          this.required = true;
          this._name = name;
          break;
      }
      if (this._name.endsWith("...")) {
        this.variadic = true;
        this._name = this._name.slice(0, -3);
      }
    }
    name() {
      return this._name;
    }
    _collectValue(value, previous) {
      if (previous === this.defaultValue || !Array.isArray(previous)) {
        return [value];
      }
      previous.push(value);
      return previous;
    }
    default(value, description) {
      this.defaultValue = value;
      this.defaultValueDescription = description;
      return this;
    }
    argParser(fn) {
      this.parseArg = fn;
      return this;
    }
    choices(values) {
      this.argChoices = values.slice();
      this.parseArg = (arg, previous) => {
        if (!this.argChoices.includes(arg)) {
          throw new InvalidArgumentError(`Allowed choices are ${this.argChoices.join(", ")}.`);
        }
        if (this.variadic) {
          return this._collectValue(arg, previous);
        }
        return arg;
      };
      return this;
    }
    argRequired() {
      this.required = true;
      return this;
    }
    argOptional() {
      this.required = false;
      return this;
    }
  }
  function humanReadableArgName(arg) {
    const nameOutput = arg.name() + (arg.variadic === true ? "..." : "");
    return arg.required ? "<" + nameOutput + ">" : "[" + nameOutput + "]";
  }
  exports.Argument = Argument;
  exports.humanReadableArgName = humanReadableArgName;
});

// node_modules/commander/lib/help.js
var require_help = __commonJS((exports) => {
  var { humanReadableArgName } = require_argument();

  class Help {
    constructor() {
      this.helpWidth = undefined;
      this.minWidthToWrap = 40;
      this.sortSubcommands = false;
      this.sortOptions = false;
      this.showGlobalOptions = false;
    }
    prepareContext(contextOptions) {
      this.helpWidth = this.helpWidth ?? contextOptions.helpWidth ?? 80;
    }
    visibleCommands(cmd) {
      const visibleCommands = cmd.commands.filter((cmd2) => !cmd2._hidden);
      const helpCommand = cmd._getHelpCommand();
      if (helpCommand && !helpCommand._hidden) {
        visibleCommands.push(helpCommand);
      }
      if (this.sortSubcommands) {
        visibleCommands.sort((a, b) => {
          return a.name().localeCompare(b.name());
        });
      }
      return visibleCommands;
    }
    compareOptions(a, b) {
      const getSortKey = (option) => {
        return option.short ? option.short.replace(/^-/, "") : option.long.replace(/^--/, "");
      };
      return getSortKey(a).localeCompare(getSortKey(b));
    }
    visibleOptions(cmd) {
      const visibleOptions = cmd.options.filter((option) => !option.hidden);
      const helpOption = cmd._getHelpOption();
      if (helpOption && !helpOption.hidden) {
        const removeShort = helpOption.short && cmd._findOption(helpOption.short);
        const removeLong = helpOption.long && cmd._findOption(helpOption.long);
        if (!removeShort && !removeLong) {
          visibleOptions.push(helpOption);
        } else if (helpOption.long && !removeLong) {
          visibleOptions.push(cmd.createOption(helpOption.long, helpOption.description));
        } else if (helpOption.short && !removeShort) {
          visibleOptions.push(cmd.createOption(helpOption.short, helpOption.description));
        }
      }
      if (this.sortOptions) {
        visibleOptions.sort(this.compareOptions);
      }
      return visibleOptions;
    }
    visibleGlobalOptions(cmd) {
      if (!this.showGlobalOptions)
        return [];
      const globalOptions = [];
      for (let ancestorCmd = cmd.parent;ancestorCmd; ancestorCmd = ancestorCmd.parent) {
        const visibleOptions = ancestorCmd.options.filter((option) => !option.hidden);
        globalOptions.push(...visibleOptions);
      }
      if (this.sortOptions) {
        globalOptions.sort(this.compareOptions);
      }
      return globalOptions;
    }
    visibleArguments(cmd) {
      if (cmd._argsDescription) {
        cmd.registeredArguments.forEach((argument) => {
          argument.description = argument.description || cmd._argsDescription[argument.name()] || "";
        });
      }
      if (cmd.registeredArguments.find((argument) => argument.description)) {
        return cmd.registeredArguments;
      }
      return [];
    }
    subcommandTerm(cmd) {
      const args = cmd.registeredArguments.map((arg) => humanReadableArgName(arg)).join(" ");
      return cmd._name + (cmd._aliases[0] ? "|" + cmd._aliases[0] : "") + (cmd.options.length ? " [options]" : "") + (args ? " " + args : "");
    }
    optionTerm(option) {
      return option.flags;
    }
    argumentTerm(argument) {
      return argument.name();
    }
    longestSubcommandTermLength(cmd, helper) {
      return helper.visibleCommands(cmd).reduce((max, command) => {
        return Math.max(max, this.displayWidth(helper.styleSubcommandTerm(helper.subcommandTerm(command))));
      }, 0);
    }
    longestOptionTermLength(cmd, helper) {
      return helper.visibleOptions(cmd).reduce((max, option) => {
        return Math.max(max, this.displayWidth(helper.styleOptionTerm(helper.optionTerm(option))));
      }, 0);
    }
    longestGlobalOptionTermLength(cmd, helper) {
      return helper.visibleGlobalOptions(cmd).reduce((max, option) => {
        return Math.max(max, this.displayWidth(helper.styleOptionTerm(helper.optionTerm(option))));
      }, 0);
    }
    longestArgumentTermLength(cmd, helper) {
      return helper.visibleArguments(cmd).reduce((max, argument) => {
        return Math.max(max, this.displayWidth(helper.styleArgumentTerm(helper.argumentTerm(argument))));
      }, 0);
    }
    commandUsage(cmd) {
      let cmdName = cmd._name;
      if (cmd._aliases[0]) {
        cmdName = cmdName + "|" + cmd._aliases[0];
      }
      let ancestorCmdNames = "";
      for (let ancestorCmd = cmd.parent;ancestorCmd; ancestorCmd = ancestorCmd.parent) {
        ancestorCmdNames = ancestorCmd.name() + " " + ancestorCmdNames;
      }
      return ancestorCmdNames + cmdName + " " + cmd.usage();
    }
    commandDescription(cmd) {
      return cmd.description();
    }
    subcommandDescription(cmd) {
      return cmd.summary() || cmd.description();
    }
    optionDescription(option) {
      const extraInfo = [];
      if (option.argChoices) {
        extraInfo.push(`choices: ${option.argChoices.map((choice) => JSON.stringify(choice)).join(", ")}`);
      }
      if (option.defaultValue !== undefined) {
        const showDefault = option.required || option.optional || option.isBoolean() && typeof option.defaultValue === "boolean";
        if (showDefault) {
          extraInfo.push(`default: ${option.defaultValueDescription || JSON.stringify(option.defaultValue)}`);
        }
      }
      if (option.presetArg !== undefined && option.optional) {
        extraInfo.push(`preset: ${JSON.stringify(option.presetArg)}`);
      }
      if (option.envVar !== undefined) {
        extraInfo.push(`env: ${option.envVar}`);
      }
      if (extraInfo.length > 0) {
        const extraDescription = `(${extraInfo.join(", ")})`;
        if (option.description) {
          return `${option.description} ${extraDescription}`;
        }
        return extraDescription;
      }
      return option.description;
    }
    argumentDescription(argument) {
      const extraInfo = [];
      if (argument.argChoices) {
        extraInfo.push(`choices: ${argument.argChoices.map((choice) => JSON.stringify(choice)).join(", ")}`);
      }
      if (argument.defaultValue !== undefined) {
        extraInfo.push(`default: ${argument.defaultValueDescription || JSON.stringify(argument.defaultValue)}`);
      }
      if (extraInfo.length > 0) {
        const extraDescription = `(${extraInfo.join(", ")})`;
        if (argument.description) {
          return `${argument.description} ${extraDescription}`;
        }
        return extraDescription;
      }
      return argument.description;
    }
    formatItemList(heading, items, helper) {
      if (items.length === 0)
        return [];
      return [helper.styleTitle(heading), ...items, ""];
    }
    groupItems(unsortedItems, visibleItems, getGroup) {
      const result = new Map;
      unsortedItems.forEach((item) => {
        const group = getGroup(item);
        if (!result.has(group))
          result.set(group, []);
      });
      visibleItems.forEach((item) => {
        const group = getGroup(item);
        if (!result.has(group)) {
          result.set(group, []);
        }
        result.get(group).push(item);
      });
      return result;
    }
    formatHelp(cmd, helper) {
      const termWidth = helper.padWidth(cmd, helper);
      const helpWidth = helper.helpWidth ?? 80;
      function callFormatItem(term, description) {
        return helper.formatItem(term, termWidth, description, helper);
      }
      let output = [
        `${helper.styleTitle("Usage:")} ${helper.styleUsage(helper.commandUsage(cmd))}`,
        ""
      ];
      const commandDescription = helper.commandDescription(cmd);
      if (commandDescription.length > 0) {
        output = output.concat([
          helper.boxWrap(helper.styleCommandDescription(commandDescription), helpWidth),
          ""
        ]);
      }
      const argumentList = helper.visibleArguments(cmd).map((argument) => {
        return callFormatItem(helper.styleArgumentTerm(helper.argumentTerm(argument)), helper.styleArgumentDescription(helper.argumentDescription(argument)));
      });
      output = output.concat(this.formatItemList("Arguments:", argumentList, helper));
      const optionGroups = this.groupItems(cmd.options, helper.visibleOptions(cmd), (option) => option.helpGroupHeading ?? "Options:");
      optionGroups.forEach((options, group) => {
        const optionList = options.map((option) => {
          return callFormatItem(helper.styleOptionTerm(helper.optionTerm(option)), helper.styleOptionDescription(helper.optionDescription(option)));
        });
        output = output.concat(this.formatItemList(group, optionList, helper));
      });
      if (helper.showGlobalOptions) {
        const globalOptionList = helper.visibleGlobalOptions(cmd).map((option) => {
          return callFormatItem(helper.styleOptionTerm(helper.optionTerm(option)), helper.styleOptionDescription(helper.optionDescription(option)));
        });
        output = output.concat(this.formatItemList("Global Options:", globalOptionList, helper));
      }
      const commandGroups = this.groupItems(cmd.commands, helper.visibleCommands(cmd), (sub) => sub.helpGroup() || "Commands:");
      commandGroups.forEach((commands, group) => {
        const commandList = commands.map((sub) => {
          return callFormatItem(helper.styleSubcommandTerm(helper.subcommandTerm(sub)), helper.styleSubcommandDescription(helper.subcommandDescription(sub)));
        });
        output = output.concat(this.formatItemList(group, commandList, helper));
      });
      return output.join(`
`);
    }
    displayWidth(str) {
      return stripColor(str).length;
    }
    styleTitle(str) {
      return str;
    }
    styleUsage(str) {
      return str.split(" ").map((word) => {
        if (word === "[options]")
          return this.styleOptionText(word);
        if (word === "[command]")
          return this.styleSubcommandText(word);
        if (word[0] === "[" || word[0] === "<")
          return this.styleArgumentText(word);
        return this.styleCommandText(word);
      }).join(" ");
    }
    styleCommandDescription(str) {
      return this.styleDescriptionText(str);
    }
    styleOptionDescription(str) {
      return this.styleDescriptionText(str);
    }
    styleSubcommandDescription(str) {
      return this.styleDescriptionText(str);
    }
    styleArgumentDescription(str) {
      return this.styleDescriptionText(str);
    }
    styleDescriptionText(str) {
      return str;
    }
    styleOptionTerm(str) {
      return this.styleOptionText(str);
    }
    styleSubcommandTerm(str) {
      return str.split(" ").map((word) => {
        if (word === "[options]")
          return this.styleOptionText(word);
        if (word[0] === "[" || word[0] === "<")
          return this.styleArgumentText(word);
        return this.styleSubcommandText(word);
      }).join(" ");
    }
    styleArgumentTerm(str) {
      return this.styleArgumentText(str);
    }
    styleOptionText(str) {
      return str;
    }
    styleArgumentText(str) {
      return str;
    }
    styleSubcommandText(str) {
      return str;
    }
    styleCommandText(str) {
      return str;
    }
    padWidth(cmd, helper) {
      return Math.max(helper.longestOptionTermLength(cmd, helper), helper.longestGlobalOptionTermLength(cmd, helper), helper.longestSubcommandTermLength(cmd, helper), helper.longestArgumentTermLength(cmd, helper));
    }
    preformatted(str) {
      return /\n[^\S\r\n]/.test(str);
    }
    formatItem(term, termWidth, description, helper) {
      const itemIndent = 2;
      const itemIndentStr = " ".repeat(itemIndent);
      if (!description)
        return itemIndentStr + term;
      const paddedTerm = term.padEnd(termWidth + term.length - helper.displayWidth(term));
      const spacerWidth = 2;
      const helpWidth = this.helpWidth ?? 80;
      const remainingWidth = helpWidth - termWidth - spacerWidth - itemIndent;
      let formattedDescription;
      if (remainingWidth < this.minWidthToWrap || helper.preformatted(description)) {
        formattedDescription = description;
      } else {
        const wrappedDescription = helper.boxWrap(description, remainingWidth);
        formattedDescription = wrappedDescription.replace(/\n/g, `
` + " ".repeat(termWidth + spacerWidth));
      }
      return itemIndentStr + paddedTerm + " ".repeat(spacerWidth) + formattedDescription.replace(/\n/g, `
${itemIndentStr}`);
    }
    boxWrap(str, width) {
      if (width < this.minWidthToWrap)
        return str;
      const rawLines = str.split(/\r\n|\n/);
      const chunkPattern = /[\s]*[^\s]+/g;
      const wrappedLines = [];
      rawLines.forEach((line) => {
        const chunks = line.match(chunkPattern);
        if (chunks === null) {
          wrappedLines.push("");
          return;
        }
        let sumChunks = [chunks.shift()];
        let sumWidth = this.displayWidth(sumChunks[0]);
        chunks.forEach((chunk) => {
          const visibleWidth = this.displayWidth(chunk);
          if (sumWidth + visibleWidth <= width) {
            sumChunks.push(chunk);
            sumWidth += visibleWidth;
            return;
          }
          wrappedLines.push(sumChunks.join(""));
          const nextChunk = chunk.trimStart();
          sumChunks = [nextChunk];
          sumWidth = this.displayWidth(nextChunk);
        });
        wrappedLines.push(sumChunks.join(""));
      });
      return wrappedLines.join(`
`);
    }
  }
  function stripColor(str) {
    const sgrPattern = /\x1b\[\d*(;\d*)*m/g;
    return str.replace(sgrPattern, "");
  }
  exports.Help = Help;
  exports.stripColor = stripColor;
});

// node_modules/commander/lib/option.js
var require_option = __commonJS((exports) => {
  var { InvalidArgumentError } = require_error();

  class Option {
    constructor(flags, description) {
      this.flags = flags;
      this.description = description || "";
      this.required = flags.includes("<");
      this.optional = flags.includes("[");
      this.variadic = /\w\.\.\.[>\]]$/.test(flags);
      this.mandatory = false;
      const optionFlags = splitOptionFlags(flags);
      this.short = optionFlags.shortFlag;
      this.long = optionFlags.longFlag;
      this.negate = false;
      if (this.long) {
        this.negate = this.long.startsWith("--no-");
      }
      this.defaultValue = undefined;
      this.defaultValueDescription = undefined;
      this.presetArg = undefined;
      this.envVar = undefined;
      this.parseArg = undefined;
      this.hidden = false;
      this.argChoices = undefined;
      this.conflictsWith = [];
      this.implied = undefined;
      this.helpGroupHeading = undefined;
    }
    default(value, description) {
      this.defaultValue = value;
      this.defaultValueDescription = description;
      return this;
    }
    preset(arg) {
      this.presetArg = arg;
      return this;
    }
    conflicts(names) {
      this.conflictsWith = this.conflictsWith.concat(names);
      return this;
    }
    implies(impliedOptionValues) {
      let newImplied = impliedOptionValues;
      if (typeof impliedOptionValues === "string") {
        newImplied = { [impliedOptionValues]: true };
      }
      this.implied = Object.assign(this.implied || {}, newImplied);
      return this;
    }
    env(name) {
      this.envVar = name;
      return this;
    }
    argParser(fn) {
      this.parseArg = fn;
      return this;
    }
    makeOptionMandatory(mandatory = true) {
      this.mandatory = !!mandatory;
      return this;
    }
    hideHelp(hide = true) {
      this.hidden = !!hide;
      return this;
    }
    _collectValue(value, previous) {
      if (previous === this.defaultValue || !Array.isArray(previous)) {
        return [value];
      }
      previous.push(value);
      return previous;
    }
    choices(values) {
      this.argChoices = values.slice();
      this.parseArg = (arg, previous) => {
        if (!this.argChoices.includes(arg)) {
          throw new InvalidArgumentError(`Allowed choices are ${this.argChoices.join(", ")}.`);
        }
        if (this.variadic) {
          return this._collectValue(arg, previous);
        }
        return arg;
      };
      return this;
    }
    name() {
      if (this.long) {
        return this.long.replace(/^--/, "");
      }
      return this.short.replace(/^-/, "");
    }
    attributeName() {
      if (this.negate) {
        return camelcase(this.name().replace(/^no-/, ""));
      }
      return camelcase(this.name());
    }
    helpGroup(heading) {
      this.helpGroupHeading = heading;
      return this;
    }
    is(arg) {
      return this.short === arg || this.long === arg;
    }
    isBoolean() {
      return !this.required && !this.optional && !this.negate;
    }
  }

  class DualOptions {
    constructor(options) {
      this.positiveOptions = new Map;
      this.negativeOptions = new Map;
      this.dualOptions = new Set;
      options.forEach((option) => {
        if (option.negate) {
          this.negativeOptions.set(option.attributeName(), option);
        } else {
          this.positiveOptions.set(option.attributeName(), option);
        }
      });
      this.negativeOptions.forEach((value, key) => {
        if (this.positiveOptions.has(key)) {
          this.dualOptions.add(key);
        }
      });
    }
    valueFromOption(value, option) {
      const optionKey = option.attributeName();
      if (!this.dualOptions.has(optionKey))
        return true;
      const preset = this.negativeOptions.get(optionKey).presetArg;
      const negativeValue = preset !== undefined ? preset : false;
      return option.negate === (negativeValue === value);
    }
  }
  function camelcase(str) {
    return str.split("-").reduce((str2, word) => {
      return str2 + word[0].toUpperCase() + word.slice(1);
    });
  }
  function splitOptionFlags(flags) {
    let shortFlag;
    let longFlag;
    const shortFlagExp = /^-[^-]$/;
    const longFlagExp = /^--[^-]/;
    const flagParts = flags.split(/[ |,]+/).concat("guard");
    if (shortFlagExp.test(flagParts[0]))
      shortFlag = flagParts.shift();
    if (longFlagExp.test(flagParts[0]))
      longFlag = flagParts.shift();
    if (!shortFlag && shortFlagExp.test(flagParts[0]))
      shortFlag = flagParts.shift();
    if (!shortFlag && longFlagExp.test(flagParts[0])) {
      shortFlag = longFlag;
      longFlag = flagParts.shift();
    }
    if (flagParts[0].startsWith("-")) {
      const unsupportedFlag = flagParts[0];
      const baseError = `option creation failed due to '${unsupportedFlag}' in option flags '${flags}'`;
      if (/^-[^-][^-]/.test(unsupportedFlag))
        throw new Error(`${baseError}
- a short flag is a single dash and a single character
  - either use a single dash and a single character (for a short flag)
  - or use a double dash for a long option (and can have two, like '--ws, --workspace')`);
      if (shortFlagExp.test(unsupportedFlag))
        throw new Error(`${baseError}
- too many short flags`);
      if (longFlagExp.test(unsupportedFlag))
        throw new Error(`${baseError}
- too many long flags`);
      throw new Error(`${baseError}
- unrecognised flag format`);
    }
    if (shortFlag === undefined && longFlag === undefined)
      throw new Error(`option creation failed due to no flags found in '${flags}'.`);
    return { shortFlag, longFlag };
  }
  exports.Option = Option;
  exports.DualOptions = DualOptions;
});

// node_modules/commander/lib/suggestSimilar.js
var require_suggestSimilar = __commonJS((exports) => {
  var maxDistance = 3;
  function editDistance(a, b) {
    if (Math.abs(a.length - b.length) > maxDistance)
      return Math.max(a.length, b.length);
    const d = [];
    for (let i = 0;i <= a.length; i++) {
      d[i] = [i];
    }
    for (let j = 0;j <= b.length; j++) {
      d[0][j] = j;
    }
    for (let j = 1;j <= b.length; j++) {
      for (let i = 1;i <= a.length; i++) {
        let cost = 1;
        if (a[i - 1] === b[j - 1]) {
          cost = 0;
        } else {
          cost = 1;
        }
        d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost);
        if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
          d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
        }
      }
    }
    return d[a.length][b.length];
  }
  function suggestSimilar(word, candidates) {
    if (!candidates || candidates.length === 0)
      return "";
    candidates = Array.from(new Set(candidates));
    const searchingOptions = word.startsWith("--");
    if (searchingOptions) {
      word = word.slice(2);
      candidates = candidates.map((candidate) => candidate.slice(2));
    }
    let similar = [];
    let bestDistance = maxDistance;
    const minSimilarity = 0.4;
    candidates.forEach((candidate) => {
      if (candidate.length <= 1)
        return;
      const distance = editDistance(word, candidate);
      const length = Math.max(word.length, candidate.length);
      const similarity = (length - distance) / length;
      if (similarity > minSimilarity) {
        if (distance < bestDistance) {
          bestDistance = distance;
          similar = [candidate];
        } else if (distance === bestDistance) {
          similar.push(candidate);
        }
      }
    });
    similar.sort((a, b) => a.localeCompare(b));
    if (searchingOptions) {
      similar = similar.map((candidate) => `--${candidate}`);
    }
    if (similar.length > 1) {
      return `
(Did you mean one of ${similar.join(", ")}?)`;
    }
    if (similar.length === 1) {
      return `
(Did you mean ${similar[0]}?)`;
    }
    return "";
  }
  exports.suggestSimilar = suggestSimilar;
});

// node_modules/commander/lib/command.js
var require_command = __commonJS((exports) => {
  var EventEmitter = __require("events").EventEmitter;
  var childProcess = __require("child_process");
  var path = __require("path");
  var fs = __require("fs");
  var process2 = __require("process");
  var { Argument, humanReadableArgName } = require_argument();
  var { CommanderError } = require_error();
  var { Help, stripColor } = require_help();
  var { Option, DualOptions } = require_option();
  var { suggestSimilar } = require_suggestSimilar();

  class Command extends EventEmitter {
    constructor(name) {
      super();
      this.commands = [];
      this.options = [];
      this.parent = null;
      this._allowUnknownOption = false;
      this._allowExcessArguments = false;
      this.registeredArguments = [];
      this._args = this.registeredArguments;
      this.args = [];
      this.rawArgs = [];
      this.processedArgs = [];
      this._scriptPath = null;
      this._name = name || "";
      this._optionValues = {};
      this._optionValueSources = {};
      this._storeOptionsAsProperties = false;
      this._actionHandler = null;
      this._executableHandler = false;
      this._executableFile = null;
      this._executableDir = null;
      this._defaultCommandName = null;
      this._exitCallback = null;
      this._aliases = [];
      this._combineFlagAndOptionalValue = true;
      this._description = "";
      this._summary = "";
      this._argsDescription = undefined;
      this._enablePositionalOptions = false;
      this._passThroughOptions = false;
      this._lifeCycleHooks = {};
      this._showHelpAfterError = false;
      this._showSuggestionAfterError = true;
      this._savedState = null;
      this._outputConfiguration = {
        writeOut: (str) => process2.stdout.write(str),
        writeErr: (str) => process2.stderr.write(str),
        outputError: (str, write) => write(str),
        getOutHelpWidth: () => process2.stdout.isTTY ? process2.stdout.columns : undefined,
        getErrHelpWidth: () => process2.stderr.isTTY ? process2.stderr.columns : undefined,
        getOutHasColors: () => useColor() ?? (process2.stdout.isTTY && process2.stdout.hasColors?.()),
        getErrHasColors: () => useColor() ?? (process2.stderr.isTTY && process2.stderr.hasColors?.()),
        stripColor: (str) => stripColor(str)
      };
      this._hidden = false;
      this._helpOption = undefined;
      this._addImplicitHelpCommand = undefined;
      this._helpCommand = undefined;
      this._helpConfiguration = {};
      this._helpGroupHeading = undefined;
      this._defaultCommandGroup = undefined;
      this._defaultOptionGroup = undefined;
    }
    copyInheritedSettings(sourceCommand) {
      this._outputConfiguration = sourceCommand._outputConfiguration;
      this._helpOption = sourceCommand._helpOption;
      this._helpCommand = sourceCommand._helpCommand;
      this._helpConfiguration = sourceCommand._helpConfiguration;
      this._exitCallback = sourceCommand._exitCallback;
      this._storeOptionsAsProperties = sourceCommand._storeOptionsAsProperties;
      this._combineFlagAndOptionalValue = sourceCommand._combineFlagAndOptionalValue;
      this._allowExcessArguments = sourceCommand._allowExcessArguments;
      this._enablePositionalOptions = sourceCommand._enablePositionalOptions;
      this._showHelpAfterError = sourceCommand._showHelpAfterError;
      this._showSuggestionAfterError = sourceCommand._showSuggestionAfterError;
      return this;
    }
    _getCommandAndAncestors() {
      const result = [];
      for (let command = this;command; command = command.parent) {
        result.push(command);
      }
      return result;
    }
    command(nameAndArgs, actionOptsOrExecDesc, execOpts) {
      let desc = actionOptsOrExecDesc;
      let opts = execOpts;
      if (typeof desc === "object" && desc !== null) {
        opts = desc;
        desc = null;
      }
      opts = opts || {};
      const [, name, args] = nameAndArgs.match(/([^ ]+) *(.*)/);
      const cmd = this.createCommand(name);
      if (desc) {
        cmd.description(desc);
        cmd._executableHandler = true;
      }
      if (opts.isDefault)
        this._defaultCommandName = cmd._name;
      cmd._hidden = !!(opts.noHelp || opts.hidden);
      cmd._executableFile = opts.executableFile || null;
      if (args)
        cmd.arguments(args);
      this._registerCommand(cmd);
      cmd.parent = this;
      cmd.copyInheritedSettings(this);
      if (desc)
        return this;
      return cmd;
    }
    createCommand(name) {
      return new Command(name);
    }
    createHelp() {
      return Object.assign(new Help, this.configureHelp());
    }
    configureHelp(configuration) {
      if (configuration === undefined)
        return this._helpConfiguration;
      this._helpConfiguration = configuration;
      return this;
    }
    configureOutput(configuration) {
      if (configuration === undefined)
        return this._outputConfiguration;
      this._outputConfiguration = {
        ...this._outputConfiguration,
        ...configuration
      };
      return this;
    }
    showHelpAfterError(displayHelp = true) {
      if (typeof displayHelp !== "string")
        displayHelp = !!displayHelp;
      this._showHelpAfterError = displayHelp;
      return this;
    }
    showSuggestionAfterError(displaySuggestion = true) {
      this._showSuggestionAfterError = !!displaySuggestion;
      return this;
    }
    addCommand(cmd, opts) {
      if (!cmd._name) {
        throw new Error(`Command passed to .addCommand() must have a name
- specify the name in Command constructor or using .name()`);
      }
      opts = opts || {};
      if (opts.isDefault)
        this._defaultCommandName = cmd._name;
      if (opts.noHelp || opts.hidden)
        cmd._hidden = true;
      this._registerCommand(cmd);
      cmd.parent = this;
      cmd._checkForBrokenPassThrough();
      return this;
    }
    createArgument(name, description) {
      return new Argument(name, description);
    }
    argument(name, description, parseArg, defaultValue) {
      const argument = this.createArgument(name, description);
      if (typeof parseArg === "function") {
        argument.default(defaultValue).argParser(parseArg);
      } else {
        argument.default(parseArg);
      }
      this.addArgument(argument);
      return this;
    }
    arguments(names) {
      names.trim().split(/ +/).forEach((detail) => {
        this.argument(detail);
      });
      return this;
    }
    addArgument(argument) {
      const previousArgument = this.registeredArguments.slice(-1)[0];
      if (previousArgument?.variadic) {
        throw new Error(`only the last argument can be variadic '${previousArgument.name()}'`);
      }
      if (argument.required && argument.defaultValue !== undefined && argument.parseArg === undefined) {
        throw new Error(`a default value for a required argument is never used: '${argument.name()}'`);
      }
      this.registeredArguments.push(argument);
      return this;
    }
    helpCommand(enableOrNameAndArgs, description) {
      if (typeof enableOrNameAndArgs === "boolean") {
        this._addImplicitHelpCommand = enableOrNameAndArgs;
        if (enableOrNameAndArgs && this._defaultCommandGroup) {
          this._initCommandGroup(this._getHelpCommand());
        }
        return this;
      }
      const nameAndArgs = enableOrNameAndArgs ?? "help [command]";
      const [, helpName, helpArgs] = nameAndArgs.match(/([^ ]+) *(.*)/);
      const helpDescription = description ?? "display help for command";
      const helpCommand = this.createCommand(helpName);
      helpCommand.helpOption(false);
      if (helpArgs)
        helpCommand.arguments(helpArgs);
      if (helpDescription)
        helpCommand.description(helpDescription);
      this._addImplicitHelpCommand = true;
      this._helpCommand = helpCommand;
      if (enableOrNameAndArgs || description)
        this._initCommandGroup(helpCommand);
      return this;
    }
    addHelpCommand(helpCommand, deprecatedDescription) {
      if (typeof helpCommand !== "object") {
        this.helpCommand(helpCommand, deprecatedDescription);
        return this;
      }
      this._addImplicitHelpCommand = true;
      this._helpCommand = helpCommand;
      this._initCommandGroup(helpCommand);
      return this;
    }
    _getHelpCommand() {
      const hasImplicitHelpCommand = this._addImplicitHelpCommand ?? (this.commands.length && !this._actionHandler && !this._findCommand("help"));
      if (hasImplicitHelpCommand) {
        if (this._helpCommand === undefined) {
          this.helpCommand(undefined, undefined);
        }
        return this._helpCommand;
      }
      return null;
    }
    hook(event, listener) {
      const allowedValues = ["preSubcommand", "preAction", "postAction"];
      if (!allowedValues.includes(event)) {
        throw new Error(`Unexpected value for event passed to hook : '${event}'.
Expecting one of '${allowedValues.join("', '")}'`);
      }
      if (this._lifeCycleHooks[event]) {
        this._lifeCycleHooks[event].push(listener);
      } else {
        this._lifeCycleHooks[event] = [listener];
      }
      return this;
    }
    exitOverride(fn) {
      if (fn) {
        this._exitCallback = fn;
      } else {
        this._exitCallback = (err) => {
          if (err.code !== "commander.executeSubCommandAsync") {
            throw err;
          }
        };
      }
      return this;
    }
    _exit(exitCode, code, message) {
      if (this._exitCallback) {
        this._exitCallback(new CommanderError(exitCode, code, message));
      }
      process2.exit(exitCode);
    }
    action(fn) {
      const listener = (args) => {
        const expectedArgsCount = this.registeredArguments.length;
        const actionArgs = args.slice(0, expectedArgsCount);
        if (this._storeOptionsAsProperties) {
          actionArgs[expectedArgsCount] = this;
        } else {
          actionArgs[expectedArgsCount] = this.opts();
        }
        actionArgs.push(this);
        return fn.apply(this, actionArgs);
      };
      this._actionHandler = listener;
      return this;
    }
    createOption(flags, description) {
      return new Option(flags, description);
    }
    _callParseArg(target, value, previous, invalidArgumentMessage) {
      try {
        return target.parseArg(value, previous);
      } catch (err) {
        if (err.code === "commander.invalidArgument") {
          const message = `${invalidArgumentMessage} ${err.message}`;
          this.error(message, { exitCode: err.exitCode, code: err.code });
        }
        throw err;
      }
    }
    _registerOption(option) {
      const matchingOption = option.short && this._findOption(option.short) || option.long && this._findOption(option.long);
      if (matchingOption) {
        const matchingFlag = option.long && this._findOption(option.long) ? option.long : option.short;
        throw new Error(`Cannot add option '${option.flags}'${this._name && ` to command '${this._name}'`} due to conflicting flag '${matchingFlag}'
-  already used by option '${matchingOption.flags}'`);
      }
      this._initOptionGroup(option);
      this.options.push(option);
    }
    _registerCommand(command) {
      const knownBy = (cmd) => {
        return [cmd.name()].concat(cmd.aliases());
      };
      const alreadyUsed = knownBy(command).find((name) => this._findCommand(name));
      if (alreadyUsed) {
        const existingCmd = knownBy(this._findCommand(alreadyUsed)).join("|");
        const newCmd = knownBy(command).join("|");
        throw new Error(`cannot add command '${newCmd}' as already have command '${existingCmd}'`);
      }
      this._initCommandGroup(command);
      this.commands.push(command);
    }
    addOption(option) {
      this._registerOption(option);
      const oname = option.name();
      const name = option.attributeName();
      if (option.negate) {
        const positiveLongFlag = option.long.replace(/^--no-/, "--");
        if (!this._findOption(positiveLongFlag)) {
          this.setOptionValueWithSource(name, option.defaultValue === undefined ? true : option.defaultValue, "default");
        }
      } else if (option.defaultValue !== undefined) {
        this.setOptionValueWithSource(name, option.defaultValue, "default");
      }
      const handleOptionValue = (val, invalidValueMessage, valueSource) => {
        if (val == null && option.presetArg !== undefined) {
          val = option.presetArg;
        }
        const oldValue = this.getOptionValue(name);
        if (val !== null && option.parseArg) {
          val = this._callParseArg(option, val, oldValue, invalidValueMessage);
        } else if (val !== null && option.variadic) {
          val = option._collectValue(val, oldValue);
        }
        if (val == null) {
          if (option.negate) {
            val = false;
          } else if (option.isBoolean() || option.optional) {
            val = true;
          } else {
            val = "";
          }
        }
        this.setOptionValueWithSource(name, val, valueSource);
      };
      this.on("option:" + oname, (val) => {
        const invalidValueMessage = `error: option '${option.flags}' argument '${val}' is invalid.`;
        handleOptionValue(val, invalidValueMessage, "cli");
      });
      if (option.envVar) {
        this.on("optionEnv:" + oname, (val) => {
          const invalidValueMessage = `error: option '${option.flags}' value '${val}' from env '${option.envVar}' is invalid.`;
          handleOptionValue(val, invalidValueMessage, "env");
        });
      }
      return this;
    }
    _optionEx(config, flags, description, fn, defaultValue) {
      if (typeof flags === "object" && flags instanceof Option) {
        throw new Error("To add an Option object use addOption() instead of option() or requiredOption()");
      }
      const option = this.createOption(flags, description);
      option.makeOptionMandatory(!!config.mandatory);
      if (typeof fn === "function") {
        option.default(defaultValue).argParser(fn);
      } else if (fn instanceof RegExp) {
        const regex = fn;
        fn = (val, def) => {
          const m = regex.exec(val);
          return m ? m[0] : def;
        };
        option.default(defaultValue).argParser(fn);
      } else {
        option.default(fn);
      }
      return this.addOption(option);
    }
    option(flags, description, parseArg, defaultValue) {
      return this._optionEx({}, flags, description, parseArg, defaultValue);
    }
    requiredOption(flags, description, parseArg, defaultValue) {
      return this._optionEx({ mandatory: true }, flags, description, parseArg, defaultValue);
    }
    combineFlagAndOptionalValue(combine = true) {
      this._combineFlagAndOptionalValue = !!combine;
      return this;
    }
    allowUnknownOption(allowUnknown = true) {
      this._allowUnknownOption = !!allowUnknown;
      return this;
    }
    allowExcessArguments(allowExcess = true) {
      this._allowExcessArguments = !!allowExcess;
      return this;
    }
    enablePositionalOptions(positional = true) {
      this._enablePositionalOptions = !!positional;
      return this;
    }
    passThroughOptions(passThrough = true) {
      this._passThroughOptions = !!passThrough;
      this._checkForBrokenPassThrough();
      return this;
    }
    _checkForBrokenPassThrough() {
      if (this.parent && this._passThroughOptions && !this.parent._enablePositionalOptions) {
        throw new Error(`passThroughOptions cannot be used for '${this._name}' without turning on enablePositionalOptions for parent command(s)`);
      }
    }
    storeOptionsAsProperties(storeAsProperties = true) {
      if (this.options.length) {
        throw new Error("call .storeOptionsAsProperties() before adding options");
      }
      if (Object.keys(this._optionValues).length) {
        throw new Error("call .storeOptionsAsProperties() before setting option values");
      }
      this._storeOptionsAsProperties = !!storeAsProperties;
      return this;
    }
    getOptionValue(key) {
      if (this._storeOptionsAsProperties) {
        return this[key];
      }
      return this._optionValues[key];
    }
    setOptionValue(key, value) {
      return this.setOptionValueWithSource(key, value, undefined);
    }
    setOptionValueWithSource(key, value, source) {
      if (this._storeOptionsAsProperties) {
        this[key] = value;
      } else {
        this._optionValues[key] = value;
      }
      this._optionValueSources[key] = source;
      return this;
    }
    getOptionValueSource(key) {
      return this._optionValueSources[key];
    }
    getOptionValueSourceWithGlobals(key) {
      let source;
      this._getCommandAndAncestors().forEach((cmd) => {
        if (cmd.getOptionValueSource(key) !== undefined) {
          source = cmd.getOptionValueSource(key);
        }
      });
      return source;
    }
    _prepareUserArgs(argv, parseOptions) {
      if (argv !== undefined && !Array.isArray(argv)) {
        throw new Error("first parameter to parse must be array or undefined");
      }
      parseOptions = parseOptions || {};
      if (argv === undefined && parseOptions.from === undefined) {
        if (process2.versions?.electron) {
          parseOptions.from = "electron";
        }
        const execArgv = process2.execArgv ?? [];
        if (execArgv.includes("-e") || execArgv.includes("--eval") || execArgv.includes("-p") || execArgv.includes("--print")) {
          parseOptions.from = "eval";
        }
      }
      if (argv === undefined) {
        argv = process2.argv;
      }
      this.rawArgs = argv.slice();
      let userArgs;
      switch (parseOptions.from) {
        case undefined:
        case "node":
          this._scriptPath = argv[1];
          userArgs = argv.slice(2);
          break;
        case "electron":
          if (process2.defaultApp) {
            this._scriptPath = argv[1];
            userArgs = argv.slice(2);
          } else {
            userArgs = argv.slice(1);
          }
          break;
        case "user":
          userArgs = argv.slice(0);
          break;
        case "eval":
          userArgs = argv.slice(1);
          break;
        default:
          throw new Error(`unexpected parse option { from: '${parseOptions.from}' }`);
      }
      if (!this._name && this._scriptPath)
        this.nameFromFilename(this._scriptPath);
      this._name = this._name || "program";
      return userArgs;
    }
    parse(argv, parseOptions) {
      this._prepareForParse();
      const userArgs = this._prepareUserArgs(argv, parseOptions);
      this._parseCommand([], userArgs);
      return this;
    }
    async parseAsync(argv, parseOptions) {
      this._prepareForParse();
      const userArgs = this._prepareUserArgs(argv, parseOptions);
      await this._parseCommand([], userArgs);
      return this;
    }
    _prepareForParse() {
      if (this._savedState === null) {
        this.saveStateBeforeParse();
      } else {
        this.restoreStateBeforeParse();
      }
    }
    saveStateBeforeParse() {
      this._savedState = {
        _name: this._name,
        _optionValues: { ...this._optionValues },
        _optionValueSources: { ...this._optionValueSources }
      };
    }
    restoreStateBeforeParse() {
      if (this._storeOptionsAsProperties)
        throw new Error(`Can not call parse again when storeOptionsAsProperties is true.
- either make a new Command for each call to parse, or stop storing options as properties`);
      this._name = this._savedState._name;
      this._scriptPath = null;
      this.rawArgs = [];
      this._optionValues = { ...this._savedState._optionValues };
      this._optionValueSources = { ...this._savedState._optionValueSources };
      this.args = [];
      this.processedArgs = [];
    }
    _checkForMissingExecutable(executableFile, executableDir, subcommandName) {
      if (fs.existsSync(executableFile))
        return;
      const executableDirMessage = executableDir ? `searched for local subcommand relative to directory '${executableDir}'` : "no directory for search for local subcommand, use .executableDir() to supply a custom directory";
      const executableMissing = `'${executableFile}' does not exist
 - if '${subcommandName}' is not meant to be an executable command, remove description parameter from '.command()' and use '.description()' instead
 - if the default executable name is not suitable, use the executableFile option to supply a custom name or path
 - ${executableDirMessage}`;
      throw new Error(executableMissing);
    }
    _executeSubCommand(subcommand, args) {
      args = args.slice();
      let launchWithNode = false;
      const sourceExt = [".js", ".ts", ".tsx", ".mjs", ".cjs"];
      function findFile(baseDir, baseName) {
        const localBin = path.resolve(baseDir, baseName);
        if (fs.existsSync(localBin))
          return localBin;
        if (sourceExt.includes(path.extname(baseName)))
          return;
        const foundExt = sourceExt.find((ext) => fs.existsSync(`${localBin}${ext}`));
        if (foundExt)
          return `${localBin}${foundExt}`;
        return;
      }
      this._checkForMissingMandatoryOptions();
      this._checkForConflictingOptions();
      let executableFile = subcommand._executableFile || `${this._name}-${subcommand._name}`;
      let executableDir = this._executableDir || "";
      if (this._scriptPath) {
        let resolvedScriptPath;
        try {
          resolvedScriptPath = fs.realpathSync(this._scriptPath);
        } catch {
          resolvedScriptPath = this._scriptPath;
        }
        executableDir = path.resolve(path.dirname(resolvedScriptPath), executableDir);
      }
      if (executableDir) {
        let localFile = findFile(executableDir, executableFile);
        if (!localFile && !subcommand._executableFile && this._scriptPath) {
          const legacyName = path.basename(this._scriptPath, path.extname(this._scriptPath));
          if (legacyName !== this._name) {
            localFile = findFile(executableDir, `${legacyName}-${subcommand._name}`);
          }
        }
        executableFile = localFile || executableFile;
      }
      launchWithNode = sourceExt.includes(path.extname(executableFile));
      let proc;
      if (process2.platform !== "win32") {
        if (launchWithNode) {
          args.unshift(executableFile);
          args = incrementNodeInspectorPort(process2.execArgv).concat(args);
          proc = childProcess.spawn(process2.argv[0], args, { stdio: "inherit" });
        } else {
          proc = childProcess.spawn(executableFile, args, { stdio: "inherit" });
        }
      } else {
        this._checkForMissingExecutable(executableFile, executableDir, subcommand._name);
        args.unshift(executableFile);
        args = incrementNodeInspectorPort(process2.execArgv).concat(args);
        proc = childProcess.spawn(process2.execPath, args, { stdio: "inherit" });
      }
      if (!proc.killed) {
        const signals = ["SIGUSR1", "SIGUSR2", "SIGTERM", "SIGINT", "SIGHUP"];
        signals.forEach((signal) => {
          process2.on(signal, () => {
            if (proc.killed === false && proc.exitCode === null) {
              proc.kill(signal);
            }
          });
        });
      }
      const exitCallback = this._exitCallback;
      proc.on("close", (code) => {
        code = code ?? 1;
        if (!exitCallback) {
          process2.exit(code);
        } else {
          exitCallback(new CommanderError(code, "commander.executeSubCommandAsync", "(close)"));
        }
      });
      proc.on("error", (err) => {
        if (err.code === "ENOENT") {
          this._checkForMissingExecutable(executableFile, executableDir, subcommand._name);
        } else if (err.code === "EACCES") {
          throw new Error(`'${executableFile}' not executable`);
        }
        if (!exitCallback) {
          process2.exit(1);
        } else {
          const wrappedError = new CommanderError(1, "commander.executeSubCommandAsync", "(error)");
          wrappedError.nestedError = err;
          exitCallback(wrappedError);
        }
      });
      this.runningCommand = proc;
    }
    _dispatchSubcommand(commandName, operands, unknown) {
      const subCommand = this._findCommand(commandName);
      if (!subCommand)
        this.help({ error: true });
      subCommand._prepareForParse();
      let promiseChain;
      promiseChain = this._chainOrCallSubCommandHook(promiseChain, subCommand, "preSubcommand");
      promiseChain = this._chainOrCall(promiseChain, () => {
        if (subCommand._executableHandler) {
          this._executeSubCommand(subCommand, operands.concat(unknown));
        } else {
          return subCommand._parseCommand(operands, unknown);
        }
      });
      return promiseChain;
    }
    _dispatchHelpCommand(subcommandName) {
      if (!subcommandName) {
        this.help();
      }
      const subCommand = this._findCommand(subcommandName);
      if (subCommand && !subCommand._executableHandler) {
        subCommand.help();
      }
      return this._dispatchSubcommand(subcommandName, [], [this._getHelpOption()?.long ?? this._getHelpOption()?.short ?? "--help"]);
    }
    _checkNumberOfArguments() {
      this.registeredArguments.forEach((arg, i) => {
        if (arg.required && this.args[i] == null) {
          this.missingArgument(arg.name());
        }
      });
      if (this.registeredArguments.length > 0 && this.registeredArguments[this.registeredArguments.length - 1].variadic) {
        return;
      }
      if (this.args.length > this.registeredArguments.length) {
        this._excessArguments(this.args);
      }
    }
    _processArguments() {
      const myParseArg = (argument, value, previous) => {
        let parsedValue = value;
        if (value !== null && argument.parseArg) {
          const invalidValueMessage = `error: command-argument value '${value}' is invalid for argument '${argument.name()}'.`;
          parsedValue = this._callParseArg(argument, value, previous, invalidValueMessage);
        }
        return parsedValue;
      };
      this._checkNumberOfArguments();
      const processedArgs = [];
      this.registeredArguments.forEach((declaredArg, index) => {
        let value = declaredArg.defaultValue;
        if (declaredArg.variadic) {
          if (index < this.args.length) {
            value = this.args.slice(index);
            if (declaredArg.parseArg) {
              value = value.reduce((processed, v) => {
                return myParseArg(declaredArg, v, processed);
              }, declaredArg.defaultValue);
            }
          } else if (value === undefined) {
            value = [];
          }
        } else if (index < this.args.length) {
          value = this.args[index];
          if (declaredArg.parseArg) {
            value = myParseArg(declaredArg, value, declaredArg.defaultValue);
          }
        }
        processedArgs[index] = value;
      });
      this.processedArgs = processedArgs;
    }
    _chainOrCall(promise, fn) {
      if (promise?.then && typeof promise.then === "function") {
        return promise.then(() => fn());
      }
      return fn();
    }
    _chainOrCallHooks(promise, event) {
      let result = promise;
      const hooks = [];
      this._getCommandAndAncestors().reverse().filter((cmd) => cmd._lifeCycleHooks[event] !== undefined).forEach((hookedCommand) => {
        hookedCommand._lifeCycleHooks[event].forEach((callback) => {
          hooks.push({ hookedCommand, callback });
        });
      });
      if (event === "postAction") {
        hooks.reverse();
      }
      hooks.forEach((hookDetail) => {
        result = this._chainOrCall(result, () => {
          return hookDetail.callback(hookDetail.hookedCommand, this);
        });
      });
      return result;
    }
    _chainOrCallSubCommandHook(promise, subCommand, event) {
      let result = promise;
      if (this._lifeCycleHooks[event] !== undefined) {
        this._lifeCycleHooks[event].forEach((hook) => {
          result = this._chainOrCall(result, () => {
            return hook(this, subCommand);
          });
        });
      }
      return result;
    }
    _parseCommand(operands, unknown) {
      const parsed = this.parseOptions(unknown);
      this._parseOptionsEnv();
      this._parseOptionsImplied();
      operands = operands.concat(parsed.operands);
      unknown = parsed.unknown;
      this.args = operands.concat(unknown);
      if (operands && this._findCommand(operands[0])) {
        return this._dispatchSubcommand(operands[0], operands.slice(1), unknown);
      }
      if (this._getHelpCommand() && operands[0] === this._getHelpCommand().name()) {
        return this._dispatchHelpCommand(operands[1]);
      }
      if (this._defaultCommandName) {
        this._outputHelpIfRequested(unknown);
        return this._dispatchSubcommand(this._defaultCommandName, operands, unknown);
      }
      if (this.commands.length && this.args.length === 0 && !this._actionHandler && !this._defaultCommandName) {
        this.help({ error: true });
      }
      this._outputHelpIfRequested(parsed.unknown);
      this._checkForMissingMandatoryOptions();
      this._checkForConflictingOptions();
      const checkForUnknownOptions = () => {
        if (parsed.unknown.length > 0) {
          this.unknownOption(parsed.unknown[0]);
        }
      };
      const commandEvent = `command:${this.name()}`;
      if (this._actionHandler) {
        checkForUnknownOptions();
        this._processArguments();
        let promiseChain;
        promiseChain = this._chainOrCallHooks(promiseChain, "preAction");
        promiseChain = this._chainOrCall(promiseChain, () => this._actionHandler(this.processedArgs));
        if (this.parent) {
          promiseChain = this._chainOrCall(promiseChain, () => {
            this.parent.emit(commandEvent, operands, unknown);
          });
        }
        promiseChain = this._chainOrCallHooks(promiseChain, "postAction");
        return promiseChain;
      }
      if (this.parent?.listenerCount(commandEvent)) {
        checkForUnknownOptions();
        this._processArguments();
        this.parent.emit(commandEvent, operands, unknown);
      } else if (operands.length) {
        if (this._findCommand("*")) {
          return this._dispatchSubcommand("*", operands, unknown);
        }
        if (this.listenerCount("command:*")) {
          this.emit("command:*", operands, unknown);
        } else if (this.commands.length) {
          this.unknownCommand();
        } else {
          checkForUnknownOptions();
          this._processArguments();
        }
      } else if (this.commands.length) {
        checkForUnknownOptions();
        this.help({ error: true });
      } else {
        checkForUnknownOptions();
        this._processArguments();
      }
    }
    _findCommand(name) {
      if (!name)
        return;
      return this.commands.find((cmd) => cmd._name === name || cmd._aliases.includes(name));
    }
    _findOption(arg) {
      return this.options.find((option) => option.is(arg));
    }
    _checkForMissingMandatoryOptions() {
      this._getCommandAndAncestors().forEach((cmd) => {
        cmd.options.forEach((anOption) => {
          if (anOption.mandatory && cmd.getOptionValue(anOption.attributeName()) === undefined) {
            cmd.missingMandatoryOptionValue(anOption);
          }
        });
      });
    }
    _checkForConflictingLocalOptions() {
      const definedNonDefaultOptions = this.options.filter((option) => {
        const optionKey = option.attributeName();
        if (this.getOptionValue(optionKey) === undefined) {
          return false;
        }
        return this.getOptionValueSource(optionKey) !== "default";
      });
      const optionsWithConflicting = definedNonDefaultOptions.filter((option) => option.conflictsWith.length > 0);
      optionsWithConflicting.forEach((option) => {
        const conflictingAndDefined = definedNonDefaultOptions.find((defined) => option.conflictsWith.includes(defined.attributeName()));
        if (conflictingAndDefined) {
          this._conflictingOption(option, conflictingAndDefined);
        }
      });
    }
    _checkForConflictingOptions() {
      this._getCommandAndAncestors().forEach((cmd) => {
        cmd._checkForConflictingLocalOptions();
      });
    }
    parseOptions(args) {
      const operands = [];
      const unknown = [];
      let dest = operands;
      function maybeOption(arg) {
        return arg.length > 1 && arg[0] === "-";
      }
      const negativeNumberArg = (arg) => {
        if (!/^-(\d+|\d*\.\d+)(e[+-]?\d+)?$/.test(arg))
          return false;
        return !this._getCommandAndAncestors().some((cmd) => cmd.options.map((opt) => opt.short).some((short) => /^-\d$/.test(short)));
      };
      let activeVariadicOption = null;
      let activeGroup = null;
      let i = 0;
      while (i < args.length || activeGroup) {
        const arg = activeGroup ?? args[i++];
        activeGroup = null;
        if (arg === "--") {
          if (dest === unknown)
            dest.push(arg);
          dest.push(...args.slice(i));
          break;
        }
        if (activeVariadicOption && (!maybeOption(arg) || negativeNumberArg(arg))) {
          this.emit(`option:${activeVariadicOption.name()}`, arg);
          continue;
        }
        activeVariadicOption = null;
        if (maybeOption(arg)) {
          const option = this._findOption(arg);
          if (option) {
            if (option.required) {
              const value = args[i++];
              if (value === undefined)
                this.optionMissingArgument(option);
              this.emit(`option:${option.name()}`, value);
            } else if (option.optional) {
              let value = null;
              if (i < args.length && (!maybeOption(args[i]) || negativeNumberArg(args[i]))) {
                value = args[i++];
              }
              this.emit(`option:${option.name()}`, value);
            } else {
              this.emit(`option:${option.name()}`);
            }
            activeVariadicOption = option.variadic ? option : null;
            continue;
          }
        }
        if (arg.length > 2 && arg[0] === "-" && arg[1] !== "-") {
          const option = this._findOption(`-${arg[1]}`);
          if (option) {
            if (option.required || option.optional && this._combineFlagAndOptionalValue) {
              this.emit(`option:${option.name()}`, arg.slice(2));
            } else {
              this.emit(`option:${option.name()}`);
              activeGroup = `-${arg.slice(2)}`;
            }
            continue;
          }
        }
        if (/^--[^=]+=/.test(arg)) {
          const index = arg.indexOf("=");
          const option = this._findOption(arg.slice(0, index));
          if (option && (option.required || option.optional)) {
            this.emit(`option:${option.name()}`, arg.slice(index + 1));
            continue;
          }
        }
        if (dest === operands && maybeOption(arg) && !(this.commands.length === 0 && negativeNumberArg(arg))) {
          dest = unknown;
        }
        if ((this._enablePositionalOptions || this._passThroughOptions) && operands.length === 0 && unknown.length === 0) {
          if (this._findCommand(arg)) {
            operands.push(arg);
            unknown.push(...args.slice(i));
            break;
          } else if (this._getHelpCommand() && arg === this._getHelpCommand().name()) {
            operands.push(arg, ...args.slice(i));
            break;
          } else if (this._defaultCommandName) {
            unknown.push(arg, ...args.slice(i));
            break;
          }
        }
        if (this._passThroughOptions) {
          dest.push(arg, ...args.slice(i));
          break;
        }
        dest.push(arg);
      }
      return { operands, unknown };
    }
    opts() {
      if (this._storeOptionsAsProperties) {
        const result = {};
        const len = this.options.length;
        for (let i = 0;i < len; i++) {
          const key = this.options[i].attributeName();
          result[key] = key === this._versionOptionName ? this._version : this[key];
        }
        return result;
      }
      return this._optionValues;
    }
    optsWithGlobals() {
      return this._getCommandAndAncestors().reduce((combinedOptions, cmd) => Object.assign(combinedOptions, cmd.opts()), {});
    }
    error(message, errorOptions) {
      this._outputConfiguration.outputError(`${message}
`, this._outputConfiguration.writeErr);
      if (typeof this._showHelpAfterError === "string") {
        this._outputConfiguration.writeErr(`${this._showHelpAfterError}
`);
      } else if (this._showHelpAfterError) {
        this._outputConfiguration.writeErr(`
`);
        this.outputHelp({ error: true });
      }
      const config = errorOptions || {};
      const exitCode = config.exitCode || 1;
      const code = config.code || "commander.error";
      this._exit(exitCode, code, message);
    }
    _parseOptionsEnv() {
      this.options.forEach((option) => {
        if (option.envVar && option.envVar in process2.env) {
          const optionKey = option.attributeName();
          if (this.getOptionValue(optionKey) === undefined || ["default", "config", "env"].includes(this.getOptionValueSource(optionKey))) {
            if (option.required || option.optional) {
              this.emit(`optionEnv:${option.name()}`, process2.env[option.envVar]);
            } else {
              this.emit(`optionEnv:${option.name()}`);
            }
          }
        }
      });
    }
    _parseOptionsImplied() {
      const dualHelper = new DualOptions(this.options);
      const hasCustomOptionValue = (optionKey) => {
        return this.getOptionValue(optionKey) !== undefined && !["default", "implied"].includes(this.getOptionValueSource(optionKey));
      };
      this.options.filter((option) => option.implied !== undefined && hasCustomOptionValue(option.attributeName()) && dualHelper.valueFromOption(this.getOptionValue(option.attributeName()), option)).forEach((option) => {
        Object.keys(option.implied).filter((impliedKey) => !hasCustomOptionValue(impliedKey)).forEach((impliedKey) => {
          this.setOptionValueWithSource(impliedKey, option.implied[impliedKey], "implied");
        });
      });
    }
    missingArgument(name) {
      const message = `error: missing required argument '${name}'`;
      this.error(message, { code: "commander.missingArgument" });
    }
    optionMissingArgument(option) {
      const message = `error: option '${option.flags}' argument missing`;
      this.error(message, { code: "commander.optionMissingArgument" });
    }
    missingMandatoryOptionValue(option) {
      const message = `error: required option '${option.flags}' not specified`;
      this.error(message, { code: "commander.missingMandatoryOptionValue" });
    }
    _conflictingOption(option, conflictingOption) {
      const findBestOptionFromValue = (option2) => {
        const optionKey = option2.attributeName();
        const optionValue = this.getOptionValue(optionKey);
        const negativeOption = this.options.find((target) => target.negate && optionKey === target.attributeName());
        const positiveOption = this.options.find((target) => !target.negate && optionKey === target.attributeName());
        if (negativeOption && (negativeOption.presetArg === undefined && optionValue === false || negativeOption.presetArg !== undefined && optionValue === negativeOption.presetArg)) {
          return negativeOption;
        }
        return positiveOption || option2;
      };
      const getErrorMessage = (option2) => {
        const bestOption = findBestOptionFromValue(option2);
        const optionKey = bestOption.attributeName();
        const source = this.getOptionValueSource(optionKey);
        if (source === "env") {
          return `environment variable '${bestOption.envVar}'`;
        }
        return `option '${bestOption.flags}'`;
      };
      const message = `error: ${getErrorMessage(option)} cannot be used with ${getErrorMessage(conflictingOption)}`;
      this.error(message, { code: "commander.conflictingOption" });
    }
    unknownOption(flag) {
      if (this._allowUnknownOption)
        return;
      let suggestion = "";
      if (flag.startsWith("--") && this._showSuggestionAfterError) {
        let candidateFlags = [];
        let command = this;
        do {
          const moreFlags = command.createHelp().visibleOptions(command).filter((option) => option.long).map((option) => option.long);
          candidateFlags = candidateFlags.concat(moreFlags);
          command = command.parent;
        } while (command && !command._enablePositionalOptions);
        suggestion = suggestSimilar(flag, candidateFlags);
      }
      const message = `error: unknown option '${flag}'${suggestion}`;
      this.error(message, { code: "commander.unknownOption" });
    }
    _excessArguments(receivedArgs) {
      if (this._allowExcessArguments)
        return;
      const expected = this.registeredArguments.length;
      const s = expected === 1 ? "" : "s";
      const forSubcommand = this.parent ? ` for '${this.name()}'` : "";
      const message = `error: too many arguments${forSubcommand}. Expected ${expected} argument${s} but got ${receivedArgs.length}.`;
      this.error(message, { code: "commander.excessArguments" });
    }
    unknownCommand() {
      const unknownName = this.args[0];
      let suggestion = "";
      if (this._showSuggestionAfterError) {
        const candidateNames = [];
        this.createHelp().visibleCommands(this).forEach((command) => {
          candidateNames.push(command.name());
          if (command.alias())
            candidateNames.push(command.alias());
        });
        suggestion = suggestSimilar(unknownName, candidateNames);
      }
      const message = `error: unknown command '${unknownName}'${suggestion}`;
      this.error(message, { code: "commander.unknownCommand" });
    }
    version(str, flags, description) {
      if (str === undefined)
        return this._version;
      this._version = str;
      flags = flags || "-V, --version";
      description = description || "output the version number";
      const versionOption = this.createOption(flags, description);
      this._versionOptionName = versionOption.attributeName();
      this._registerOption(versionOption);
      this.on("option:" + versionOption.name(), () => {
        this._outputConfiguration.writeOut(`${str}
`);
        this._exit(0, "commander.version", str);
      });
      return this;
    }
    description(str, argsDescription) {
      if (str === undefined && argsDescription === undefined)
        return this._description;
      this._description = str;
      if (argsDescription) {
        this._argsDescription = argsDescription;
      }
      return this;
    }
    summary(str) {
      if (str === undefined)
        return this._summary;
      this._summary = str;
      return this;
    }
    alias(alias) {
      if (alias === undefined)
        return this._aliases[0];
      let command = this;
      if (this.commands.length !== 0 && this.commands[this.commands.length - 1]._executableHandler) {
        command = this.commands[this.commands.length - 1];
      }
      if (alias === command._name)
        throw new Error("Command alias can't be the same as its name");
      const matchingCommand = this.parent?._findCommand(alias);
      if (matchingCommand) {
        const existingCmd = [matchingCommand.name()].concat(matchingCommand.aliases()).join("|");
        throw new Error(`cannot add alias '${alias}' to command '${this.name()}' as already have command '${existingCmd}'`);
      }
      command._aliases.push(alias);
      return this;
    }
    aliases(aliases) {
      if (aliases === undefined)
        return this._aliases;
      aliases.forEach((alias) => this.alias(alias));
      return this;
    }
    usage(str) {
      if (str === undefined) {
        if (this._usage)
          return this._usage;
        const args = this.registeredArguments.map((arg) => {
          return humanReadableArgName(arg);
        });
        return [].concat(this.options.length || this._helpOption !== null ? "[options]" : [], this.commands.length ? "[command]" : [], this.registeredArguments.length ? args : []).join(" ");
      }
      this._usage = str;
      return this;
    }
    name(str) {
      if (str === undefined)
        return this._name;
      this._name = str;
      return this;
    }
    helpGroup(heading) {
      if (heading === undefined)
        return this._helpGroupHeading ?? "";
      this._helpGroupHeading = heading;
      return this;
    }
    commandsGroup(heading) {
      if (heading === undefined)
        return this._defaultCommandGroup ?? "";
      this._defaultCommandGroup = heading;
      return this;
    }
    optionsGroup(heading) {
      if (heading === undefined)
        return this._defaultOptionGroup ?? "";
      this._defaultOptionGroup = heading;
      return this;
    }
    _initOptionGroup(option) {
      if (this._defaultOptionGroup && !option.helpGroupHeading)
        option.helpGroup(this._defaultOptionGroup);
    }
    _initCommandGroup(cmd) {
      if (this._defaultCommandGroup && !cmd.helpGroup())
        cmd.helpGroup(this._defaultCommandGroup);
    }
    nameFromFilename(filename) {
      this._name = path.basename(filename, path.extname(filename));
      return this;
    }
    executableDir(path2) {
      if (path2 === undefined)
        return this._executableDir;
      this._executableDir = path2;
      return this;
    }
    helpInformation(contextOptions) {
      const helper = this.createHelp();
      const context = this._getOutputContext(contextOptions);
      helper.prepareContext({
        error: context.error,
        helpWidth: context.helpWidth,
        outputHasColors: context.hasColors
      });
      const text = helper.formatHelp(this, helper);
      if (context.hasColors)
        return text;
      return this._outputConfiguration.stripColor(text);
    }
    _getOutputContext(contextOptions) {
      contextOptions = contextOptions || {};
      const error = !!contextOptions.error;
      let baseWrite;
      let hasColors;
      let helpWidth;
      if (error) {
        baseWrite = (str) => this._outputConfiguration.writeErr(str);
        hasColors = this._outputConfiguration.getErrHasColors();
        helpWidth = this._outputConfiguration.getErrHelpWidth();
      } else {
        baseWrite = (str) => this._outputConfiguration.writeOut(str);
        hasColors = this._outputConfiguration.getOutHasColors();
        helpWidth = this._outputConfiguration.getOutHelpWidth();
      }
      const write = (str) => {
        if (!hasColors)
          str = this._outputConfiguration.stripColor(str);
        return baseWrite(str);
      };
      return { error, write, hasColors, helpWidth };
    }
    outputHelp(contextOptions) {
      let deprecatedCallback;
      if (typeof contextOptions === "function") {
        deprecatedCallback = contextOptions;
        contextOptions = undefined;
      }
      const outputContext = this._getOutputContext(contextOptions);
      const eventContext = {
        error: outputContext.error,
        write: outputContext.write,
        command: this
      };
      this._getCommandAndAncestors().reverse().forEach((command) => command.emit("beforeAllHelp", eventContext));
      this.emit("beforeHelp", eventContext);
      let helpInformation = this.helpInformation({ error: outputContext.error });
      if (deprecatedCallback) {
        helpInformation = deprecatedCallback(helpInformation);
        if (typeof helpInformation !== "string" && !Buffer.isBuffer(helpInformation)) {
          throw new Error("outputHelp callback must return a string or a Buffer");
        }
      }
      outputContext.write(helpInformation);
      if (this._getHelpOption()?.long) {
        this.emit(this._getHelpOption().long);
      }
      this.emit("afterHelp", eventContext);
      this._getCommandAndAncestors().forEach((command) => command.emit("afterAllHelp", eventContext));
    }
    helpOption(flags, description) {
      if (typeof flags === "boolean") {
        if (flags) {
          if (this._helpOption === null)
            this._helpOption = undefined;
          if (this._defaultOptionGroup) {
            this._initOptionGroup(this._getHelpOption());
          }
        } else {
          this._helpOption = null;
        }
        return this;
      }
      this._helpOption = this.createOption(flags ?? "-h, --help", description ?? "display help for command");
      if (flags || description)
        this._initOptionGroup(this._helpOption);
      return this;
    }
    _getHelpOption() {
      if (this._helpOption === undefined) {
        this.helpOption(undefined, undefined);
      }
      return this._helpOption;
    }
    addHelpOption(option) {
      this._helpOption = option;
      this._initOptionGroup(option);
      return this;
    }
    help(contextOptions) {
      this.outputHelp(contextOptions);
      let exitCode = Number(process2.exitCode ?? 0);
      if (exitCode === 0 && contextOptions && typeof contextOptions !== "function" && contextOptions.error) {
        exitCode = 1;
      }
      this._exit(exitCode, "commander.help", "(outputHelp)");
    }
    addHelpText(position, text) {
      const allowedValues = ["beforeAll", "before", "after", "afterAll"];
      if (!allowedValues.includes(position)) {
        throw new Error(`Unexpected value for position to addHelpText.
Expecting one of '${allowedValues.join("', '")}'`);
      }
      const helpEvent = `${position}Help`;
      this.on(helpEvent, (context) => {
        let helpStr;
        if (typeof text === "function") {
          helpStr = text({ error: context.error, command: context.command });
        } else {
          helpStr = text;
        }
        if (helpStr) {
          context.write(`${helpStr}
`);
        }
      });
      return this;
    }
    _outputHelpIfRequested(args) {
      const helpOption = this._getHelpOption();
      const helpRequested = helpOption && args.find((arg) => helpOption.is(arg));
      if (helpRequested) {
        this.outputHelp();
        this._exit(0, "commander.helpDisplayed", "(outputHelp)");
      }
    }
  }
  function incrementNodeInspectorPort(args) {
    return args.map((arg) => {
      if (!arg.startsWith("--inspect")) {
        return arg;
      }
      let debugOption;
      let debugHost = "127.0.0.1";
      let debugPort = "9229";
      let match;
      if ((match = arg.match(/^(--inspect(-brk)?)$/)) !== null) {
        debugOption = match[1];
      } else if ((match = arg.match(/^(--inspect(-brk|-port)?)=([^:]+)$/)) !== null) {
        debugOption = match[1];
        if (/^\d+$/.test(match[3])) {
          debugPort = match[3];
        } else {
          debugHost = match[3];
        }
      } else if ((match = arg.match(/^(--inspect(-brk|-port)?)=([^:]+):(\d+)$/)) !== null) {
        debugOption = match[1];
        debugHost = match[3];
        debugPort = match[4];
      }
      if (debugOption && debugPort !== "0") {
        return `${debugOption}=${debugHost}:${parseInt(debugPort) + 1}`;
      }
      return arg;
    });
  }
  function useColor() {
    if (process2.env.NO_COLOR || process2.env.FORCE_COLOR === "0" || process2.env.FORCE_COLOR === "false")
      return false;
    if (process2.env.FORCE_COLOR || process2.env.CLICOLOR_FORCE !== undefined)
      return true;
    return;
  }
  exports.Command = Command;
  exports.useColor = useColor;
});

// node_modules/commander/index.js
var require_commander = __commonJS((exports) => {
  var { Argument } = require_argument();
  var { Command } = require_command();
  var { CommanderError, InvalidArgumentError } = require_error();
  var { Help } = require_help();
  var { Option } = require_option();
  exports.program = new Command;
  exports.createCommand = (name) => new Command(name);
  exports.createOption = (flags, description) => new Option(flags, description);
  exports.createArgument = (name, description) => new Argument(name, description);
  exports.Command = Command;
  exports.Option = Option;
  exports.Argument = Argument;
  exports.Help = Help;
  exports.CommanderError = CommanderError;
  exports.InvalidArgumentError = InvalidArgumentError;
  exports.InvalidOptionArgumentError = InvalidArgumentError;
});

// node_modules/commander/esm.mjs
var exports_esm = {};
__export(exports_esm, {
  program: () => program,
  createOption: () => createOption,
  createCommand: () => createCommand,
  createArgument: () => createArgument,
  Option: () => Option,
  InvalidOptionArgumentError: () => InvalidOptionArgumentError,
  InvalidArgumentError: () => InvalidArgumentError,
  Help: () => Help,
  CommanderError: () => CommanderError,
  Command: () => Command,
  Argument: () => Argument
});
var import__, program, createCommand, createArgument, createOption, CommanderError, InvalidArgumentError, InvalidOptionArgumentError, Command, Argument, Option, Help;
var init_esm = __esm(() => {
  import__ = __toESM(require_commander(), 1);
  ({
    program,
    createCommand,
    createArgument,
    createOption,
    CommanderError,
    InvalidArgumentError,
    InvalidOptionArgumentError,
    Command,
    Argument,
    Option,
    Help
  } = import__.default);
});

// node_modules/picocolors/picocolors.js
var require_picocolors = __commonJS((exports, module) => {
  var p = process || {};
  var argv = p.argv || [];
  var env = p.env || {};
  var isColorSupported = !(!!env.NO_COLOR || argv.includes("--no-color")) && (!!env.FORCE_COLOR || argv.includes("--color") || p.platform === "win32" || (p.stdout || {}).isTTY && env.TERM !== "dumb" || !!env.CI);
  var formatter = (open, close, replace = open) => (input) => {
    let string = "" + input, index = string.indexOf(close, open.length);
    return ~index ? open + replaceClose(string, close, replace, index) + close : open + string + close;
  };
  var replaceClose = (string, close, replace, index) => {
    let result = "", cursor = 0;
    do {
      result += string.substring(cursor, index) + replace;
      cursor = index + close.length;
      index = string.indexOf(close, cursor);
    } while (~index);
    return result + string.substring(cursor);
  };
  var createColors = (enabled = isColorSupported) => {
    let f = enabled ? formatter : () => String;
    return {
      isColorSupported: enabled,
      reset: f("\x1B[0m", "\x1B[0m"),
      bold: f("\x1B[1m", "\x1B[22m", "\x1B[22m\x1B[1m"),
      dim: f("\x1B[2m", "\x1B[22m", "\x1B[22m\x1B[2m"),
      italic: f("\x1B[3m", "\x1B[23m"),
      underline: f("\x1B[4m", "\x1B[24m"),
      inverse: f("\x1B[7m", "\x1B[27m"),
      hidden: f("\x1B[8m", "\x1B[28m"),
      strikethrough: f("\x1B[9m", "\x1B[29m"),
      black: f("\x1B[30m", "\x1B[39m"),
      red: f("\x1B[31m", "\x1B[39m"),
      green: f("\x1B[32m", "\x1B[39m"),
      yellow: f("\x1B[33m", "\x1B[39m"),
      blue: f("\x1B[34m", "\x1B[39m"),
      magenta: f("\x1B[35m", "\x1B[39m"),
      cyan: f("\x1B[36m", "\x1B[39m"),
      white: f("\x1B[37m", "\x1B[39m"),
      gray: f("\x1B[90m", "\x1B[39m"),
      bgBlack: f("\x1B[40m", "\x1B[49m"),
      bgRed: f("\x1B[41m", "\x1B[49m"),
      bgGreen: f("\x1B[42m", "\x1B[49m"),
      bgYellow: f("\x1B[43m", "\x1B[49m"),
      bgBlue: f("\x1B[44m", "\x1B[49m"),
      bgMagenta: f("\x1B[45m", "\x1B[49m"),
      bgCyan: f("\x1B[46m", "\x1B[49m"),
      bgWhite: f("\x1B[47m", "\x1B[49m"),
      blackBright: f("\x1B[90m", "\x1B[39m"),
      redBright: f("\x1B[91m", "\x1B[39m"),
      greenBright: f("\x1B[92m", "\x1B[39m"),
      yellowBright: f("\x1B[93m", "\x1B[39m"),
      blueBright: f("\x1B[94m", "\x1B[39m"),
      magentaBright: f("\x1B[95m", "\x1B[39m"),
      cyanBright: f("\x1B[96m", "\x1B[39m"),
      whiteBright: f("\x1B[97m", "\x1B[39m"),
      bgBlackBright: f("\x1B[100m", "\x1B[49m"),
      bgRedBright: f("\x1B[101m", "\x1B[49m"),
      bgGreenBright: f("\x1B[102m", "\x1B[49m"),
      bgYellowBright: f("\x1B[103m", "\x1B[49m"),
      bgBlueBright: f("\x1B[104m", "\x1B[49m"),
      bgMagentaBright: f("\x1B[105m", "\x1B[49m"),
      bgCyanBright: f("\x1B[106m", "\x1B[49m"),
      bgWhiteBright: f("\x1B[107m", "\x1B[49m")
    };
  };
  module.exports = createColors();
  module.exports.createColors = createColors;
});

// node_modules/sisteransi/src/index.js
var require_src = __commonJS((exports, module) => {
  var ESC = "\x1B";
  var CSI = `${ESC}[`;
  var beep = "\x07";
  var cursor = {
    to(x, y) {
      if (!y)
        return `${CSI}${x + 1}G`;
      return `${CSI}${y + 1};${x + 1}H`;
    },
    move(x, y) {
      let ret = "";
      if (x < 0)
        ret += `${CSI}${-x}D`;
      else if (x > 0)
        ret += `${CSI}${x}C`;
      if (y < 0)
        ret += `${CSI}${-y}A`;
      else if (y > 0)
        ret += `${CSI}${y}B`;
      return ret;
    },
    up: (count = 1) => `${CSI}${count}A`,
    down: (count = 1) => `${CSI}${count}B`,
    forward: (count = 1) => `${CSI}${count}C`,
    backward: (count = 1) => `${CSI}${count}D`,
    nextLine: (count = 1) => `${CSI}E`.repeat(count),
    prevLine: (count = 1) => `${CSI}F`.repeat(count),
    left: `${CSI}G`,
    hide: `${CSI}?25l`,
    show: `${CSI}?25h`,
    save: `${ESC}7`,
    restore: `${ESC}8`
  };
  var scroll = {
    up: (count = 1) => `${CSI}S`.repeat(count),
    down: (count = 1) => `${CSI}T`.repeat(count)
  };
  var erase = {
    screen: `${CSI}2J`,
    up: (count = 1) => `${CSI}1J`.repeat(count),
    down: (count = 1) => `${CSI}J`.repeat(count),
    line: `${CSI}2K`,
    lineEnd: `${CSI}K`,
    lineStart: `${CSI}1K`,
    lines(count) {
      let clear = "";
      for (let i = 0;i < count; i++)
        clear += this.line + (i < count - 1 ? cursor.up() : "");
      if (count)
        clear += cursor.left;
      return clear;
    }
  };
  module.exports = { cursor, scroll, erase, beep };
});

// node_modules/universalify/index.js
var require_universalify = __commonJS((exports) => {
  exports.fromCallback = function(fn) {
    return Object.defineProperty(function(...args) {
      if (typeof args[args.length - 1] === "function")
        fn.apply(this, args);
      else {
        return new Promise((resolve, reject) => {
          args.push((err, res) => err != null ? reject(err) : resolve(res));
          fn.apply(this, args);
        });
      }
    }, "name", { value: fn.name });
  };
  exports.fromPromise = function(fn) {
    return Object.defineProperty(function(...args) {
      const cb = args[args.length - 1];
      if (typeof cb !== "function")
        return fn.apply(this, args);
      else {
        args.pop();
        fn.apply(this, args).then((r2) => cb(null, r2), cb);
      }
    }, "name", { value: fn.name });
  };
});

// node_modules/graceful-fs/polyfills.js
var require_polyfills = __commonJS((exports, module) => {
  var constants = __require("constants");
  var origCwd = process.cwd;
  var cwd = null;
  var platform = process.env.GRACEFUL_FS_PLATFORM || process.platform;
  process.cwd = function() {
    if (!cwd)
      cwd = origCwd.call(process);
    return cwd;
  };
  try {
    process.cwd();
  } catch (er) {}
  if (typeof process.chdir === "function") {
    chdir = process.chdir;
    process.chdir = function(d3) {
      cwd = null;
      chdir.call(process, d3);
    };
    if (Object.setPrototypeOf)
      Object.setPrototypeOf(process.chdir, chdir);
  }
  var chdir;
  module.exports = patch;
  function patch(fs) {
    if (constants.hasOwnProperty("O_SYMLINK") && process.version.match(/^v0\.6\.[0-2]|^v0\.5\./)) {
      patchLchmod(fs);
    }
    if (!fs.lutimes) {
      patchLutimes(fs);
    }
    fs.chown = chownFix(fs.chown);
    fs.fchown = chownFix(fs.fchown);
    fs.lchown = chownFix(fs.lchown);
    fs.chmod = chmodFix(fs.chmod);
    fs.fchmod = chmodFix(fs.fchmod);
    fs.lchmod = chmodFix(fs.lchmod);
    fs.chownSync = chownFixSync(fs.chownSync);
    fs.fchownSync = chownFixSync(fs.fchownSync);
    fs.lchownSync = chownFixSync(fs.lchownSync);
    fs.chmodSync = chmodFixSync(fs.chmodSync);
    fs.fchmodSync = chmodFixSync(fs.fchmodSync);
    fs.lchmodSync = chmodFixSync(fs.lchmodSync);
    fs.stat = statFix(fs.stat);
    fs.fstat = statFix(fs.fstat);
    fs.lstat = statFix(fs.lstat);
    fs.statSync = statFixSync(fs.statSync);
    fs.fstatSync = statFixSync(fs.fstatSync);
    fs.lstatSync = statFixSync(fs.lstatSync);
    if (fs.chmod && !fs.lchmod) {
      fs.lchmod = function(path, mode, cb) {
        if (cb)
          process.nextTick(cb);
      };
      fs.lchmodSync = function() {};
    }
    if (fs.chown && !fs.lchown) {
      fs.lchown = function(path, uid, gid, cb) {
        if (cb)
          process.nextTick(cb);
      };
      fs.lchownSync = function() {};
    }
    if (platform === "win32") {
      fs.rename = typeof fs.rename !== "function" ? fs.rename : function(fs$rename) {
        function rename(from, to, cb) {
          var start = Date.now();
          var backoff = 0;
          fs$rename(from, to, function CB(er) {
            if (er && (er.code === "EACCES" || er.code === "EPERM" || er.code === "EBUSY") && Date.now() - start < 60000) {
              setTimeout(function() {
                fs.stat(to, function(stater, st) {
                  if (stater && stater.code === "ENOENT")
                    fs$rename(from, to, CB);
                  else
                    cb(er);
                });
              }, backoff);
              if (backoff < 100)
                backoff += 10;
              return;
            }
            if (cb)
              cb(er);
          });
        }
        if (Object.setPrototypeOf)
          Object.setPrototypeOf(rename, fs$rename);
        return rename;
      }(fs.rename);
    }
    fs.read = typeof fs.read !== "function" ? fs.read : function(fs$read) {
      function read(fd, buffer, offset, length, position, callback_) {
        var callback;
        if (callback_ && typeof callback_ === "function") {
          var eagCounter = 0;
          callback = function(er, _3, __) {
            if (er && er.code === "EAGAIN" && eagCounter < 10) {
              eagCounter++;
              return fs$read.call(fs, fd, buffer, offset, length, position, callback);
            }
            callback_.apply(this, arguments);
          };
        }
        return fs$read.call(fs, fd, buffer, offset, length, position, callback);
      }
      if (Object.setPrototypeOf)
        Object.setPrototypeOf(read, fs$read);
      return read;
    }(fs.read);
    fs.readSync = typeof fs.readSync !== "function" ? fs.readSync : function(fs$readSync) {
      return function(fd, buffer, offset, length, position) {
        var eagCounter = 0;
        while (true) {
          try {
            return fs$readSync.call(fs, fd, buffer, offset, length, position);
          } catch (er) {
            if (er.code === "EAGAIN" && eagCounter < 10) {
              eagCounter++;
              continue;
            }
            throw er;
          }
        }
      };
    }(fs.readSync);
    function patchLchmod(fs2) {
      fs2.lchmod = function(path, mode, callback) {
        fs2.open(path, constants.O_WRONLY | constants.O_SYMLINK, mode, function(err, fd) {
          if (err) {
            if (callback)
              callback(err);
            return;
          }
          fs2.fchmod(fd, mode, function(err2) {
            fs2.close(fd, function(err22) {
              if (callback)
                callback(err2 || err22);
            });
          });
        });
      };
      fs2.lchmodSync = function(path, mode) {
        var fd = fs2.openSync(path, constants.O_WRONLY | constants.O_SYMLINK, mode);
        var threw = true;
        var ret;
        try {
          ret = fs2.fchmodSync(fd, mode);
          threw = false;
        } finally {
          if (threw) {
            try {
              fs2.closeSync(fd);
            } catch (er) {}
          } else {
            fs2.closeSync(fd);
          }
        }
        return ret;
      };
    }
    function patchLutimes(fs2) {
      if (constants.hasOwnProperty("O_SYMLINK") && fs2.futimes) {
        fs2.lutimes = function(path, at, mt, cb) {
          fs2.open(path, constants.O_SYMLINK, function(er, fd) {
            if (er) {
              if (cb)
                cb(er);
              return;
            }
            fs2.futimes(fd, at, mt, function(er2) {
              fs2.close(fd, function(er22) {
                if (cb)
                  cb(er2 || er22);
              });
            });
          });
        };
        fs2.lutimesSync = function(path, at, mt) {
          var fd = fs2.openSync(path, constants.O_SYMLINK);
          var ret;
          var threw = true;
          try {
            ret = fs2.futimesSync(fd, at, mt);
            threw = false;
          } finally {
            if (threw) {
              try {
                fs2.closeSync(fd);
              } catch (er) {}
            } else {
              fs2.closeSync(fd);
            }
          }
          return ret;
        };
      } else if (fs2.futimes) {
        fs2.lutimes = function(_a, _b, _c, cb) {
          if (cb)
            process.nextTick(cb);
        };
        fs2.lutimesSync = function() {};
      }
    }
    function chmodFix(orig) {
      if (!orig)
        return orig;
      return function(target, mode, cb) {
        return orig.call(fs, target, mode, function(er) {
          if (chownErOk(er))
            er = null;
          if (cb)
            cb.apply(this, arguments);
        });
      };
    }
    function chmodFixSync(orig) {
      if (!orig)
        return orig;
      return function(target, mode) {
        try {
          return orig.call(fs, target, mode);
        } catch (er) {
          if (!chownErOk(er))
            throw er;
        }
      };
    }
    function chownFix(orig) {
      if (!orig)
        return orig;
      return function(target, uid, gid, cb) {
        return orig.call(fs, target, uid, gid, function(er) {
          if (chownErOk(er))
            er = null;
          if (cb)
            cb.apply(this, arguments);
        });
      };
    }
    function chownFixSync(orig) {
      if (!orig)
        return orig;
      return function(target, uid, gid) {
        try {
          return orig.call(fs, target, uid, gid);
        } catch (er) {
          if (!chownErOk(er))
            throw er;
        }
      };
    }
    function statFix(orig) {
      if (!orig)
        return orig;
      return function(target, options, cb) {
        if (typeof options === "function") {
          cb = options;
          options = null;
        }
        function callback(er, stats) {
          if (stats) {
            if (stats.uid < 0)
              stats.uid += 4294967296;
            if (stats.gid < 0)
              stats.gid += 4294967296;
          }
          if (cb)
            cb.apply(this, arguments);
        }
        return options ? orig.call(fs, target, options, callback) : orig.call(fs, target, callback);
      };
    }
    function statFixSync(orig) {
      if (!orig)
        return orig;
      return function(target, options) {
        var stats = options ? orig.call(fs, target, options) : orig.call(fs, target);
        if (stats) {
          if (stats.uid < 0)
            stats.uid += 4294967296;
          if (stats.gid < 0)
            stats.gid += 4294967296;
        }
        return stats;
      };
    }
    function chownErOk(er) {
      if (!er)
        return true;
      if (er.code === "ENOSYS")
        return true;
      var nonroot = !process.getuid || process.getuid() !== 0;
      if (nonroot) {
        if (er.code === "EINVAL" || er.code === "EPERM")
          return true;
      }
      return false;
    }
  }
});

// node_modules/graceful-fs/legacy-streams.js
var require_legacy_streams = __commonJS((exports, module) => {
  var Stream = __require("stream").Stream;
  module.exports = legacy;
  function legacy(fs) {
    return {
      ReadStream,
      WriteStream
    };
    function ReadStream(path, options) {
      if (!(this instanceof ReadStream))
        return new ReadStream(path, options);
      Stream.call(this);
      var self = this;
      this.path = path;
      this.fd = null;
      this.readable = true;
      this.paused = false;
      this.flags = "r";
      this.mode = 438;
      this.bufferSize = 64 * 1024;
      options = options || {};
      var keys = Object.keys(options);
      for (var index = 0, length = keys.length;index < length; index++) {
        var key = keys[index];
        this[key] = options[key];
      }
      if (this.encoding)
        this.setEncoding(this.encoding);
      if (this.start !== undefined) {
        if (typeof this.start !== "number") {
          throw TypeError("start must be a Number");
        }
        if (this.end === undefined) {
          this.end = Infinity;
        } else if (typeof this.end !== "number") {
          throw TypeError("end must be a Number");
        }
        if (this.start > this.end) {
          throw new Error("start must be <= end");
        }
        this.pos = this.start;
      }
      if (this.fd !== null) {
        process.nextTick(function() {
          self._read();
        });
        return;
      }
      fs.open(this.path, this.flags, this.mode, function(err, fd) {
        if (err) {
          self.emit("error", err);
          self.readable = false;
          return;
        }
        self.fd = fd;
        self.emit("open", fd);
        self._read();
      });
    }
    function WriteStream(path, options) {
      if (!(this instanceof WriteStream))
        return new WriteStream(path, options);
      Stream.call(this);
      this.path = path;
      this.fd = null;
      this.writable = true;
      this.flags = "w";
      this.encoding = "binary";
      this.mode = 438;
      this.bytesWritten = 0;
      options = options || {};
      var keys = Object.keys(options);
      for (var index = 0, length = keys.length;index < length; index++) {
        var key = keys[index];
        this[key] = options[key];
      }
      if (this.start !== undefined) {
        if (typeof this.start !== "number") {
          throw TypeError("start must be a Number");
        }
        if (this.start < 0) {
          throw new Error("start must be >= zero");
        }
        this.pos = this.start;
      }
      this.busy = false;
      this._queue = [];
      if (this.fd === null) {
        this._open = fs.open;
        this._queue.push([this._open, this.path, this.flags, this.mode, undefined]);
        this.flush();
      }
    }
  }
});

// node_modules/graceful-fs/clone.js
var require_clone = __commonJS((exports, module) => {
  module.exports = clone;
  var getPrototypeOf = Object.getPrototypeOf || function(obj) {
    return obj.__proto__;
  };
  function clone(obj) {
    if (obj === null || typeof obj !== "object")
      return obj;
    if (obj instanceof Object)
      var copy = { __proto__: getPrototypeOf(obj) };
    else
      var copy = Object.create(null);
    Object.getOwnPropertyNames(obj).forEach(function(key) {
      Object.defineProperty(copy, key, Object.getOwnPropertyDescriptor(obj, key));
    });
    return copy;
  }
});

// node_modules/graceful-fs/graceful-fs.js
var require_graceful_fs = __commonJS((exports, module) => {
  var fs = __require("fs");
  var polyfills = require_polyfills();
  var legacy = require_legacy_streams();
  var clone = require_clone();
  var util = __require("util");
  var gracefulQueue;
  var previousSymbol;
  if (typeof Symbol === "function" && typeof Symbol.for === "function") {
    gracefulQueue = Symbol.for("graceful-fs.queue");
    previousSymbol = Symbol.for("graceful-fs.previous");
  } else {
    gracefulQueue = "___graceful-fs.queue";
    previousSymbol = "___graceful-fs.previous";
  }
  function noop() {}
  function publishQueue(context, queue2) {
    Object.defineProperty(context, gracefulQueue, {
      get: function() {
        return queue2;
      }
    });
  }
  var debug = noop;
  if (util.debuglog)
    debug = util.debuglog("gfs4");
  else if (/\bgfs4\b/i.test(process.env.NODE_DEBUG || ""))
    debug = function() {
      var m2 = util.format.apply(util, arguments);
      m2 = "GFS4: " + m2.split(/\n/).join(`
GFS4: `);
      console.error(m2);
    };
  if (!fs[gracefulQueue]) {
    queue = global[gracefulQueue] || [];
    publishQueue(fs, queue);
    fs.close = function(fs$close) {
      function close(fd, cb) {
        return fs$close.call(fs, fd, function(err) {
          if (!err) {
            resetQueue();
          }
          if (typeof cb === "function")
            cb.apply(this, arguments);
        });
      }
      Object.defineProperty(close, previousSymbol, {
        value: fs$close
      });
      return close;
    }(fs.close);
    fs.closeSync = function(fs$closeSync) {
      function closeSync(fd) {
        fs$closeSync.apply(fs, arguments);
        resetQueue();
      }
      Object.defineProperty(closeSync, previousSymbol, {
        value: fs$closeSync
      });
      return closeSync;
    }(fs.closeSync);
    if (/\bgfs4\b/i.test(process.env.NODE_DEBUG || "")) {
      process.on("exit", function() {
        debug(fs[gracefulQueue]);
        __require("assert").equal(fs[gracefulQueue].length, 0);
      });
    }
  }
  var queue;
  if (!global[gracefulQueue]) {
    publishQueue(global, fs[gracefulQueue]);
  }
  module.exports = patch(clone(fs));
  if (process.env.TEST_GRACEFUL_FS_GLOBAL_PATCH && !fs.__patched) {
    module.exports = patch(fs);
    fs.__patched = true;
  }
  function patch(fs2) {
    polyfills(fs2);
    fs2.gracefulify = patch;
    fs2.createReadStream = createReadStream;
    fs2.createWriteStream = createWriteStream;
    var fs$readFile = fs2.readFile;
    fs2.readFile = readFile;
    function readFile(path, options, cb) {
      if (typeof options === "function")
        cb = options, options = null;
      return go$readFile(path, options, cb);
      function go$readFile(path2, options2, cb2, startTime) {
        return fs$readFile(path2, options2, function(err) {
          if (err && (err.code === "EMFILE" || err.code === "ENFILE"))
            enqueue([go$readFile, [path2, options2, cb2], err, startTime || Date.now(), Date.now()]);
          else {
            if (typeof cb2 === "function")
              cb2.apply(this, arguments);
          }
        });
      }
    }
    var fs$writeFile = fs2.writeFile;
    fs2.writeFile = writeFile;
    function writeFile(path, data, options, cb) {
      if (typeof options === "function")
        cb = options, options = null;
      return go$writeFile(path, data, options, cb);
      function go$writeFile(path2, data2, options2, cb2, startTime) {
        return fs$writeFile(path2, data2, options2, function(err) {
          if (err && (err.code === "EMFILE" || err.code === "ENFILE"))
            enqueue([go$writeFile, [path2, data2, options2, cb2], err, startTime || Date.now(), Date.now()]);
          else {
            if (typeof cb2 === "function")
              cb2.apply(this, arguments);
          }
        });
      }
    }
    var fs$appendFile = fs2.appendFile;
    if (fs$appendFile)
      fs2.appendFile = appendFile;
    function appendFile(path, data, options, cb) {
      if (typeof options === "function")
        cb = options, options = null;
      return go$appendFile(path, data, options, cb);
      function go$appendFile(path2, data2, options2, cb2, startTime) {
        return fs$appendFile(path2, data2, options2, function(err) {
          if (err && (err.code === "EMFILE" || err.code === "ENFILE"))
            enqueue([go$appendFile, [path2, data2, options2, cb2], err, startTime || Date.now(), Date.now()]);
          else {
            if (typeof cb2 === "function")
              cb2.apply(this, arguments);
          }
        });
      }
    }
    var fs$copyFile = fs2.copyFile;
    if (fs$copyFile)
      fs2.copyFile = copyFile;
    function copyFile(src, dest, flags, cb) {
      if (typeof flags === "function") {
        cb = flags;
        flags = 0;
      }
      return go$copyFile(src, dest, flags, cb);
      function go$copyFile(src2, dest2, flags2, cb2, startTime) {
        return fs$copyFile(src2, dest2, flags2, function(err) {
          if (err && (err.code === "EMFILE" || err.code === "ENFILE"))
            enqueue([go$copyFile, [src2, dest2, flags2, cb2], err, startTime || Date.now(), Date.now()]);
          else {
            if (typeof cb2 === "function")
              cb2.apply(this, arguments);
          }
        });
      }
    }
    var fs$readdir = fs2.readdir;
    fs2.readdir = readdir;
    var noReaddirOptionVersions = /^v[0-5]\./;
    function readdir(path, options, cb) {
      if (typeof options === "function")
        cb = options, options = null;
      var go$readdir = noReaddirOptionVersions.test(process.version) ? function go$readdir2(path2, options2, cb2, startTime) {
        return fs$readdir(path2, fs$readdirCallback(path2, options2, cb2, startTime));
      } : function go$readdir2(path2, options2, cb2, startTime) {
        return fs$readdir(path2, options2, fs$readdirCallback(path2, options2, cb2, startTime));
      };
      return go$readdir(path, options, cb);
      function fs$readdirCallback(path2, options2, cb2, startTime) {
        return function(err, files) {
          if (err && (err.code === "EMFILE" || err.code === "ENFILE"))
            enqueue([
              go$readdir,
              [path2, options2, cb2],
              err,
              startTime || Date.now(),
              Date.now()
            ]);
          else {
            if (files && files.sort)
              files.sort();
            if (typeof cb2 === "function")
              cb2.call(this, err, files);
          }
        };
      }
    }
    if (process.version.substr(0, 4) === "v0.8") {
      var legStreams = legacy(fs2);
      ReadStream = legStreams.ReadStream;
      WriteStream = legStreams.WriteStream;
    }
    var fs$ReadStream = fs2.ReadStream;
    if (fs$ReadStream) {
      ReadStream.prototype = Object.create(fs$ReadStream.prototype);
      ReadStream.prototype.open = ReadStream$open;
    }
    var fs$WriteStream = fs2.WriteStream;
    if (fs$WriteStream) {
      WriteStream.prototype = Object.create(fs$WriteStream.prototype);
      WriteStream.prototype.open = WriteStream$open;
    }
    Object.defineProperty(fs2, "ReadStream", {
      get: function() {
        return ReadStream;
      },
      set: function(val) {
        ReadStream = val;
      },
      enumerable: true,
      configurable: true
    });
    Object.defineProperty(fs2, "WriteStream", {
      get: function() {
        return WriteStream;
      },
      set: function(val) {
        WriteStream = val;
      },
      enumerable: true,
      configurable: true
    });
    var FileReadStream = ReadStream;
    Object.defineProperty(fs2, "FileReadStream", {
      get: function() {
        return FileReadStream;
      },
      set: function(val) {
        FileReadStream = val;
      },
      enumerable: true,
      configurable: true
    });
    var FileWriteStream = WriteStream;
    Object.defineProperty(fs2, "FileWriteStream", {
      get: function() {
        return FileWriteStream;
      },
      set: function(val) {
        FileWriteStream = val;
      },
      enumerable: true,
      configurable: true
    });
    function ReadStream(path, options) {
      if (this instanceof ReadStream)
        return fs$ReadStream.apply(this, arguments), this;
      else
        return ReadStream.apply(Object.create(ReadStream.prototype), arguments);
    }
    function ReadStream$open() {
      var that = this;
      open(that.path, that.flags, that.mode, function(err, fd) {
        if (err) {
          if (that.autoClose)
            that.destroy();
          that.emit("error", err);
        } else {
          that.fd = fd;
          that.emit("open", fd);
          that.read();
        }
      });
    }
    function WriteStream(path, options) {
      if (this instanceof WriteStream)
        return fs$WriteStream.apply(this, arguments), this;
      else
        return WriteStream.apply(Object.create(WriteStream.prototype), arguments);
    }
    function WriteStream$open() {
      var that = this;
      open(that.path, that.flags, that.mode, function(err, fd) {
        if (err) {
          that.destroy();
          that.emit("error", err);
        } else {
          that.fd = fd;
          that.emit("open", fd);
        }
      });
    }
    function createReadStream(path, options) {
      return new fs2.ReadStream(path, options);
    }
    function createWriteStream(path, options) {
      return new fs2.WriteStream(path, options);
    }
    var fs$open = fs2.open;
    fs2.open = open;
    function open(path, flags, mode, cb) {
      if (typeof mode === "function")
        cb = mode, mode = null;
      return go$open(path, flags, mode, cb);
      function go$open(path2, flags2, mode2, cb2, startTime) {
        return fs$open(path2, flags2, mode2, function(err, fd) {
          if (err && (err.code === "EMFILE" || err.code === "ENFILE"))
            enqueue([go$open, [path2, flags2, mode2, cb2], err, startTime || Date.now(), Date.now()]);
          else {
            if (typeof cb2 === "function")
              cb2.apply(this, arguments);
          }
        });
      }
    }
    return fs2;
  }
  function enqueue(elem) {
    debug("ENQUEUE", elem[0].name, elem[1]);
    fs[gracefulQueue].push(elem);
    retry();
  }
  var retryTimer;
  function resetQueue() {
    var now = Date.now();
    for (var i = 0;i < fs[gracefulQueue].length; ++i) {
      if (fs[gracefulQueue][i].length > 2) {
        fs[gracefulQueue][i][3] = now;
        fs[gracefulQueue][i][4] = now;
      }
    }
    retry();
  }
  function retry() {
    clearTimeout(retryTimer);
    retryTimer = undefined;
    if (fs[gracefulQueue].length === 0)
      return;
    var elem = fs[gracefulQueue].shift();
    var fn = elem[0];
    var args = elem[1];
    var err = elem[2];
    var startTime = elem[3];
    var lastTime = elem[4];
    if (startTime === undefined) {
      debug("RETRY", fn.name, args);
      fn.apply(null, args);
    } else if (Date.now() - startTime >= 60000) {
      debug("TIMEOUT", fn.name, args);
      var cb = args.pop();
      if (typeof cb === "function")
        cb.call(null, err);
    } else {
      var sinceAttempt = Date.now() - lastTime;
      var sinceStart = Math.max(lastTime - startTime, 1);
      var desiredDelay = Math.min(sinceStart * 1.2, 100);
      if (sinceAttempt >= desiredDelay) {
        debug("RETRY", fn.name, args);
        fn.apply(null, args.concat([startTime]));
      } else {
        fs[gracefulQueue].push(elem);
      }
    }
    if (retryTimer === undefined) {
      retryTimer = setTimeout(retry, 0);
    }
  }
});

// node_modules/fs-extra/lib/fs/index.js
var require_fs = __commonJS((exports) => {
  var u2 = require_universalify().fromCallback;
  var fs = require_graceful_fs();
  var api = [
    "access",
    "appendFile",
    "chmod",
    "chown",
    "close",
    "copyFile",
    "cp",
    "fchmod",
    "fchown",
    "fdatasync",
    "fstat",
    "fsync",
    "ftruncate",
    "futimes",
    "glob",
    "lchmod",
    "lchown",
    "lutimes",
    "link",
    "lstat",
    "mkdir",
    "mkdtemp",
    "open",
    "opendir",
    "readdir",
    "readFile",
    "readlink",
    "realpath",
    "rename",
    "rm",
    "rmdir",
    "stat",
    "statfs",
    "symlink",
    "truncate",
    "unlink",
    "utimes",
    "writeFile"
  ].filter((key) => {
    return typeof fs[key] === "function";
  });
  Object.assign(exports, fs);
  api.forEach((method) => {
    exports[method] = u2(fs[method]);
  });
  exports.exists = function(filename, callback) {
    if (typeof callback === "function") {
      return fs.exists(filename, callback);
    }
    return new Promise((resolve) => {
      return fs.exists(filename, resolve);
    });
  };
  exports.read = function(fd, buffer, offset, length, position, callback) {
    if (typeof callback === "function") {
      return fs.read(fd, buffer, offset, length, position, callback);
    }
    return new Promise((resolve, reject) => {
      fs.read(fd, buffer, offset, length, position, (err, bytesRead, buffer2) => {
        if (err)
          return reject(err);
        resolve({ bytesRead, buffer: buffer2 });
      });
    });
  };
  exports.write = function(fd, buffer, ...args) {
    if (typeof args[args.length - 1] === "function") {
      return fs.write(fd, buffer, ...args);
    }
    return new Promise((resolve, reject) => {
      fs.write(fd, buffer, ...args, (err, bytesWritten, buffer2) => {
        if (err)
          return reject(err);
        resolve({ bytesWritten, buffer: buffer2 });
      });
    });
  };
  exports.readv = function(fd, buffers, ...args) {
    if (typeof args[args.length - 1] === "function") {
      return fs.readv(fd, buffers, ...args);
    }
    return new Promise((resolve, reject) => {
      fs.readv(fd, buffers, ...args, (err, bytesRead, buffers2) => {
        if (err)
          return reject(err);
        resolve({ bytesRead, buffers: buffers2 });
      });
    });
  };
  exports.writev = function(fd, buffers, ...args) {
    if (typeof args[args.length - 1] === "function") {
      return fs.writev(fd, buffers, ...args);
    }
    return new Promise((resolve, reject) => {
      fs.writev(fd, buffers, ...args, (err, bytesWritten, buffers2) => {
        if (err)
          return reject(err);
        resolve({ bytesWritten, buffers: buffers2 });
      });
    });
  };
  if (typeof fs.realpath.native === "function") {
    exports.realpath.native = u2(fs.realpath.native);
  } else {
    process.emitWarning("fs.realpath.native is not a function. Is fs being monkey-patched?", "Warning", "fs-extra-WARN0003");
  }
});

// node_modules/fs-extra/lib/mkdirs/utils.js
var require_utils = __commonJS((exports, module) => {
  var path = __require("path");
  exports.checkPath = function checkPath(pth) {
    if (process.platform === "win32") {
      const pathHasInvalidWinCharacters = /[<>:"|?*]/.test(pth.replace(path.parse(pth).root, ""));
      if (pathHasInvalidWinCharacters) {
        const error = new Error(`Path contains invalid characters: ${pth}`);
        error.code = "EINVAL";
        throw error;
      }
    }
  };
});

// node_modules/fs-extra/lib/mkdirs/make-dir.js
var require_make_dir = __commonJS((exports, module) => {
  var fs = require_fs();
  var { checkPath } = require_utils();
  var getMode = (options) => {
    const defaults = { mode: 511 };
    if (typeof options === "number")
      return options;
    return { ...defaults, ...options }.mode;
  };
  exports.makeDir = async (dir, options) => {
    checkPath(dir);
    return fs.mkdir(dir, {
      mode: getMode(options),
      recursive: true
    });
  };
  exports.makeDirSync = (dir, options) => {
    checkPath(dir);
    return fs.mkdirSync(dir, {
      mode: getMode(options),
      recursive: true
    });
  };
});

// node_modules/fs-extra/lib/mkdirs/index.js
var require_mkdirs = __commonJS((exports, module) => {
  var u2 = require_universalify().fromPromise;
  var { makeDir: _makeDir, makeDirSync } = require_make_dir();
  var makeDir = u2(_makeDir);
  module.exports = {
    mkdirs: makeDir,
    mkdirsSync: makeDirSync,
    mkdirp: makeDir,
    mkdirpSync: makeDirSync,
    ensureDir: makeDir,
    ensureDirSync: makeDirSync
  };
});

// node_modules/fs-extra/lib/path-exists/index.js
var require_path_exists = __commonJS((exports, module) => {
  var u2 = require_universalify().fromPromise;
  var fs = require_fs();
  function pathExists(path) {
    return fs.access(path).then(() => true).catch(() => false);
  }
  module.exports = {
    pathExists: u2(pathExists),
    pathExistsSync: fs.existsSync
  };
});

// node_modules/fs-extra/lib/util/utimes.js
var require_utimes = __commonJS((exports, module) => {
  var fs = require_fs();
  var u2 = require_universalify().fromPromise;
  async function utimesMillis(path, atime, mtime) {
    const fd = await fs.open(path, "r+");
    let closeErr = null;
    try {
      await fs.futimes(fd, atime, mtime);
    } finally {
      try {
        await fs.close(fd);
      } catch (e2) {
        closeErr = e2;
      }
    }
    if (closeErr) {
      throw closeErr;
    }
  }
  function utimesMillisSync(path, atime, mtime) {
    const fd = fs.openSync(path, "r+");
    fs.futimesSync(fd, atime, mtime);
    return fs.closeSync(fd);
  }
  module.exports = {
    utimesMillis: u2(utimesMillis),
    utimesMillisSync
  };
});

// node_modules/fs-extra/lib/util/stat.js
var require_stat = __commonJS((exports, module) => {
  var fs = require_fs();
  var path = __require("path");
  var u2 = require_universalify().fromPromise;
  function getStats(src, dest, opts) {
    const statFunc = opts.dereference ? (file) => fs.stat(file, { bigint: true }) : (file) => fs.lstat(file, { bigint: true });
    return Promise.all([
      statFunc(src),
      statFunc(dest).catch((err) => {
        if (err.code === "ENOENT")
          return null;
        throw err;
      })
    ]).then(([srcStat, destStat]) => ({ srcStat, destStat }));
  }
  function getStatsSync(src, dest, opts) {
    let destStat;
    const statFunc = opts.dereference ? (file) => fs.statSync(file, { bigint: true }) : (file) => fs.lstatSync(file, { bigint: true });
    const srcStat = statFunc(src);
    try {
      destStat = statFunc(dest);
    } catch (err) {
      if (err.code === "ENOENT")
        return { srcStat, destStat: null };
      throw err;
    }
    return { srcStat, destStat };
  }
  async function checkPaths(src, dest, funcName, opts) {
    const { srcStat, destStat } = await getStats(src, dest, opts);
    if (destStat) {
      if (areIdentical(srcStat, destStat)) {
        const srcBaseName = path.basename(src);
        const destBaseName = path.basename(dest);
        if (funcName === "move" && srcBaseName !== destBaseName && srcBaseName.toLowerCase() === destBaseName.toLowerCase()) {
          return { srcStat, destStat, isChangingCase: true };
        }
        throw new Error("Source and destination must not be the same.");
      }
      if (srcStat.isDirectory() && !destStat.isDirectory()) {
        throw new Error(`Cannot overwrite non-directory '${dest}' with directory '${src}'.`);
      }
      if (!srcStat.isDirectory() && destStat.isDirectory()) {
        throw new Error(`Cannot overwrite directory '${dest}' with non-directory '${src}'.`);
      }
    }
    if (srcStat.isDirectory() && isSrcSubdir(src, dest)) {
      throw new Error(errMsg(src, dest, funcName));
    }
    return { srcStat, destStat };
  }
  function checkPathsSync(src, dest, funcName, opts) {
    const { srcStat, destStat } = getStatsSync(src, dest, opts);
    if (destStat) {
      if (areIdentical(srcStat, destStat)) {
        const srcBaseName = path.basename(src);
        const destBaseName = path.basename(dest);
        if (funcName === "move" && srcBaseName !== destBaseName && srcBaseName.toLowerCase() === destBaseName.toLowerCase()) {
          return { srcStat, destStat, isChangingCase: true };
        }
        throw new Error("Source and destination must not be the same.");
      }
      if (srcStat.isDirectory() && !destStat.isDirectory()) {
        throw new Error(`Cannot overwrite non-directory '${dest}' with directory '${src}'.`);
      }
      if (!srcStat.isDirectory() && destStat.isDirectory()) {
        throw new Error(`Cannot overwrite directory '${dest}' with non-directory '${src}'.`);
      }
    }
    if (srcStat.isDirectory() && isSrcSubdir(src, dest)) {
      throw new Error(errMsg(src, dest, funcName));
    }
    return { srcStat, destStat };
  }
  async function checkParentPaths(src, srcStat, dest, funcName) {
    const srcParent = path.resolve(path.dirname(src));
    const destParent = path.resolve(path.dirname(dest));
    if (destParent === srcParent || destParent === path.parse(destParent).root)
      return;
    let destStat;
    try {
      destStat = await fs.stat(destParent, { bigint: true });
    } catch (err) {
      if (err.code === "ENOENT")
        return;
      throw err;
    }
    if (areIdentical(srcStat, destStat)) {
      throw new Error(errMsg(src, dest, funcName));
    }
    return checkParentPaths(src, srcStat, destParent, funcName);
  }
  function checkParentPathsSync(src, srcStat, dest, funcName) {
    const srcParent = path.resolve(path.dirname(src));
    const destParent = path.resolve(path.dirname(dest));
    if (destParent === srcParent || destParent === path.parse(destParent).root)
      return;
    let destStat;
    try {
      destStat = fs.statSync(destParent, { bigint: true });
    } catch (err) {
      if (err.code === "ENOENT")
        return;
      throw err;
    }
    if (areIdentical(srcStat, destStat)) {
      throw new Error(errMsg(src, dest, funcName));
    }
    return checkParentPathsSync(src, srcStat, destParent, funcName);
  }
  function areIdentical(srcStat, destStat) {
    return destStat.ino !== undefined && destStat.dev !== undefined && destStat.ino === srcStat.ino && destStat.dev === srcStat.dev;
  }
  function isSrcSubdir(src, dest) {
    const srcArr = path.resolve(src).split(path.sep).filter((i) => i);
    const destArr = path.resolve(dest).split(path.sep).filter((i) => i);
    return srcArr.every((cur, i) => destArr[i] === cur);
  }
  function errMsg(src, dest, funcName) {
    return `Cannot ${funcName} '${src}' to a subdirectory of itself, '${dest}'.`;
  }
  module.exports = {
    checkPaths: u2(checkPaths),
    checkPathsSync,
    checkParentPaths: u2(checkParentPaths),
    checkParentPathsSync,
    isSrcSubdir,
    areIdentical
  };
});

// node_modules/fs-extra/lib/util/async.js
var require_async = __commonJS((exports, module) => {
  async function asyncIteratorConcurrentProcess(iterator, fn) {
    const promises = [];
    for await (const item of iterator) {
      promises.push(fn(item).then(() => null, (err) => err ?? new Error("unknown error")));
    }
    await Promise.all(promises.map((promise) => promise.then((possibleErr) => {
      if (possibleErr !== null)
        throw possibleErr;
    })));
  }
  module.exports = {
    asyncIteratorConcurrentProcess
  };
});

// node_modules/fs-extra/lib/copy/copy.js
var require_copy = __commonJS((exports, module) => {
  var fs = require_fs();
  var path = __require("path");
  var { mkdirs } = require_mkdirs();
  var { pathExists } = require_path_exists();
  var { utimesMillis } = require_utimes();
  var stat = require_stat();
  var { asyncIteratorConcurrentProcess } = require_async();
  async function copy(src, dest, opts = {}) {
    if (typeof opts === "function") {
      opts = { filter: opts };
    }
    opts.clobber = "clobber" in opts ? !!opts.clobber : true;
    opts.overwrite = "overwrite" in opts ? !!opts.overwrite : opts.clobber;
    if (opts.preserveTimestamps && process.arch === "ia32") {
      process.emitWarning(`Using the preserveTimestamps option in 32-bit node is not recommended;

` + "\tsee https://github.com/jprichardson/node-fs-extra/issues/269", "Warning", "fs-extra-WARN0001");
    }
    const { srcStat, destStat } = await stat.checkPaths(src, dest, "copy", opts);
    await stat.checkParentPaths(src, srcStat, dest, "copy");
    const include = await runFilter(src, dest, opts);
    if (!include)
      return;
    const destParent = path.dirname(dest);
    const dirExists = await pathExists(destParent);
    if (!dirExists) {
      await mkdirs(destParent);
    }
    await getStatsAndPerformCopy(destStat, src, dest, opts);
  }
  async function runFilter(src, dest, opts) {
    if (!opts.filter)
      return true;
    return opts.filter(src, dest);
  }
  async function getStatsAndPerformCopy(destStat, src, dest, opts) {
    const statFn = opts.dereference ? fs.stat : fs.lstat;
    const srcStat = await statFn(src);
    if (srcStat.isDirectory())
      return onDir(srcStat, destStat, src, dest, opts);
    if (srcStat.isFile() || srcStat.isCharacterDevice() || srcStat.isBlockDevice())
      return onFile(srcStat, destStat, src, dest, opts);
    if (srcStat.isSymbolicLink())
      return onLink(destStat, src, dest, opts);
    if (srcStat.isSocket())
      throw new Error(`Cannot copy a socket file: ${src}`);
    if (srcStat.isFIFO())
      throw new Error(`Cannot copy a FIFO pipe: ${src}`);
    throw new Error(`Unknown file: ${src}`);
  }
  async function onFile(srcStat, destStat, src, dest, opts) {
    if (!destStat)
      return copyFile(srcStat, src, dest, opts);
    if (opts.overwrite) {
      await fs.unlink(dest);
      return copyFile(srcStat, src, dest, opts);
    }
    if (opts.errorOnExist) {
      throw new Error(`'${dest}' already exists`);
    }
  }
  async function copyFile(srcStat, src, dest, opts) {
    await fs.copyFile(src, dest);
    if (opts.preserveTimestamps) {
      if (fileIsNotWritable(srcStat.mode)) {
        await makeFileWritable(dest, srcStat.mode);
      }
      const updatedSrcStat = await fs.stat(src);
      await utimesMillis(dest, updatedSrcStat.atime, updatedSrcStat.mtime);
    }
    return fs.chmod(dest, srcStat.mode);
  }
  function fileIsNotWritable(srcMode) {
    return (srcMode & 128) === 0;
  }
  function makeFileWritable(dest, srcMode) {
    return fs.chmod(dest, srcMode | 128);
  }
  async function onDir(srcStat, destStat, src, dest, opts) {
    if (!destStat) {
      await fs.mkdir(dest);
    }
    await asyncIteratorConcurrentProcess(await fs.opendir(src), async (item) => {
      const srcItem = path.join(src, item.name);
      const destItem = path.join(dest, item.name);
      const include = await runFilter(srcItem, destItem, opts);
      if (include) {
        const { destStat: destStat2 } = await stat.checkPaths(srcItem, destItem, "copy", opts);
        await getStatsAndPerformCopy(destStat2, srcItem, destItem, opts);
      }
    });
    if (!destStat) {
      await fs.chmod(dest, srcStat.mode);
    }
  }
  async function onLink(destStat, src, dest, opts) {
    let resolvedSrc = await fs.readlink(src);
    if (opts.dereference) {
      resolvedSrc = path.resolve(process.cwd(), resolvedSrc);
    }
    if (!destStat) {
      return fs.symlink(resolvedSrc, dest);
    }
    let resolvedDest = null;
    try {
      resolvedDest = await fs.readlink(dest);
    } catch (e2) {
      if (e2.code === "EINVAL" || e2.code === "UNKNOWN")
        return fs.symlink(resolvedSrc, dest);
      throw e2;
    }
    if (opts.dereference) {
      resolvedDest = path.resolve(process.cwd(), resolvedDest);
    }
    if (resolvedSrc !== resolvedDest) {
      if (stat.isSrcSubdir(resolvedSrc, resolvedDest)) {
        throw new Error(`Cannot copy '${resolvedSrc}' to a subdirectory of itself, '${resolvedDest}'.`);
      }
      if (stat.isSrcSubdir(resolvedDest, resolvedSrc)) {
        throw new Error(`Cannot overwrite '${resolvedDest}' with '${resolvedSrc}'.`);
      }
    }
    await fs.unlink(dest);
    return fs.symlink(resolvedSrc, dest);
  }
  module.exports = copy;
});

// node_modules/fs-extra/lib/copy/copy-sync.js
var require_copy_sync = __commonJS((exports, module) => {
  var fs = require_graceful_fs();
  var path = __require("path");
  var mkdirsSync = require_mkdirs().mkdirsSync;
  var utimesMillisSync = require_utimes().utimesMillisSync;
  var stat = require_stat();
  function copySync(src, dest, opts) {
    if (typeof opts === "function") {
      opts = { filter: opts };
    }
    opts = opts || {};
    opts.clobber = "clobber" in opts ? !!opts.clobber : true;
    opts.overwrite = "overwrite" in opts ? !!opts.overwrite : opts.clobber;
    if (opts.preserveTimestamps && process.arch === "ia32") {
      process.emitWarning(`Using the preserveTimestamps option in 32-bit node is not recommended;

` + "\tsee https://github.com/jprichardson/node-fs-extra/issues/269", "Warning", "fs-extra-WARN0002");
    }
    const { srcStat, destStat } = stat.checkPathsSync(src, dest, "copy", opts);
    stat.checkParentPathsSync(src, srcStat, dest, "copy");
    if (opts.filter && !opts.filter(src, dest))
      return;
    const destParent = path.dirname(dest);
    if (!fs.existsSync(destParent))
      mkdirsSync(destParent);
    return getStats(destStat, src, dest, opts);
  }
  function getStats(destStat, src, dest, opts) {
    const statSync = opts.dereference ? fs.statSync : fs.lstatSync;
    const srcStat = statSync(src);
    if (srcStat.isDirectory())
      return onDir(srcStat, destStat, src, dest, opts);
    else if (srcStat.isFile() || srcStat.isCharacterDevice() || srcStat.isBlockDevice())
      return onFile(srcStat, destStat, src, dest, opts);
    else if (srcStat.isSymbolicLink())
      return onLink(destStat, src, dest, opts);
    else if (srcStat.isSocket())
      throw new Error(`Cannot copy a socket file: ${src}`);
    else if (srcStat.isFIFO())
      throw new Error(`Cannot copy a FIFO pipe: ${src}`);
    throw new Error(`Unknown file: ${src}`);
  }
  function onFile(srcStat, destStat, src, dest, opts) {
    if (!destStat)
      return copyFile(srcStat, src, dest, opts);
    return mayCopyFile(srcStat, src, dest, opts);
  }
  function mayCopyFile(srcStat, src, dest, opts) {
    if (opts.overwrite) {
      fs.unlinkSync(dest);
      return copyFile(srcStat, src, dest, opts);
    } else if (opts.errorOnExist) {
      throw new Error(`'${dest}' already exists`);
    }
  }
  function copyFile(srcStat, src, dest, opts) {
    fs.copyFileSync(src, dest);
    if (opts.preserveTimestamps)
      handleTimestamps(srcStat.mode, src, dest);
    return setDestMode(dest, srcStat.mode);
  }
  function handleTimestamps(srcMode, src, dest) {
    if (fileIsNotWritable(srcMode))
      makeFileWritable(dest, srcMode);
    return setDestTimestamps(src, dest);
  }
  function fileIsNotWritable(srcMode) {
    return (srcMode & 128) === 0;
  }
  function makeFileWritable(dest, srcMode) {
    return setDestMode(dest, srcMode | 128);
  }
  function setDestMode(dest, srcMode) {
    return fs.chmodSync(dest, srcMode);
  }
  function setDestTimestamps(src, dest) {
    const updatedSrcStat = fs.statSync(src);
    return utimesMillisSync(dest, updatedSrcStat.atime, updatedSrcStat.mtime);
  }
  function onDir(srcStat, destStat, src, dest, opts) {
    if (!destStat)
      return mkDirAndCopy(srcStat.mode, src, dest, opts);
    return copyDir(src, dest, opts);
  }
  function mkDirAndCopy(srcMode, src, dest, opts) {
    fs.mkdirSync(dest);
    copyDir(src, dest, opts);
    return setDestMode(dest, srcMode);
  }
  function copyDir(src, dest, opts) {
    const dir = fs.opendirSync(src);
    try {
      let dirent;
      while ((dirent = dir.readSync()) !== null) {
        copyDirItem(dirent.name, src, dest, opts);
      }
    } finally {
      dir.closeSync();
    }
  }
  function copyDirItem(item, src, dest, opts) {
    const srcItem = path.join(src, item);
    const destItem = path.join(dest, item);
    if (opts.filter && !opts.filter(srcItem, destItem))
      return;
    const { destStat } = stat.checkPathsSync(srcItem, destItem, "copy", opts);
    return getStats(destStat, srcItem, destItem, opts);
  }
  function onLink(destStat, src, dest, opts) {
    let resolvedSrc = fs.readlinkSync(src);
    if (opts.dereference) {
      resolvedSrc = path.resolve(process.cwd(), resolvedSrc);
    }
    if (!destStat) {
      return fs.symlinkSync(resolvedSrc, dest);
    } else {
      let resolvedDest;
      try {
        resolvedDest = fs.readlinkSync(dest);
      } catch (err) {
        if (err.code === "EINVAL" || err.code === "UNKNOWN")
          return fs.symlinkSync(resolvedSrc, dest);
        throw err;
      }
      if (opts.dereference) {
        resolvedDest = path.resolve(process.cwd(), resolvedDest);
      }
      if (resolvedSrc !== resolvedDest) {
        if (stat.isSrcSubdir(resolvedSrc, resolvedDest)) {
          throw new Error(`Cannot copy '${resolvedSrc}' to a subdirectory of itself, '${resolvedDest}'.`);
        }
        if (stat.isSrcSubdir(resolvedDest, resolvedSrc)) {
          throw new Error(`Cannot overwrite '${resolvedDest}' with '${resolvedSrc}'.`);
        }
      }
      return copyLink(resolvedSrc, dest);
    }
  }
  function copyLink(resolvedSrc, dest) {
    fs.unlinkSync(dest);
    return fs.symlinkSync(resolvedSrc, dest);
  }
  module.exports = copySync;
});

// node_modules/fs-extra/lib/copy/index.js
var require_copy2 = __commonJS((exports, module) => {
  var u2 = require_universalify().fromPromise;
  module.exports = {
    copy: u2(require_copy()),
    copySync: require_copy_sync()
  };
});

// node_modules/fs-extra/lib/remove/index.js
var require_remove = __commonJS((exports, module) => {
  var fs = require_graceful_fs();
  var u2 = require_universalify().fromCallback;
  function remove(path, callback) {
    fs.rm(path, { recursive: true, force: true }, callback);
  }
  function removeSync(path) {
    fs.rmSync(path, { recursive: true, force: true });
  }
  module.exports = {
    remove: u2(remove),
    removeSync
  };
});

// node_modules/fs-extra/lib/empty/index.js
var require_empty = __commonJS((exports, module) => {
  var u2 = require_universalify().fromPromise;
  var fs = require_fs();
  var path = __require("path");
  var mkdir = require_mkdirs();
  var remove = require_remove();
  var emptyDir = u2(async function emptyDir2(dir) {
    let items;
    try {
      items = await fs.readdir(dir);
    } catch {
      return mkdir.mkdirs(dir);
    }
    return Promise.all(items.map((item) => remove.remove(path.join(dir, item))));
  });
  function emptyDirSync(dir) {
    let items;
    try {
      items = fs.readdirSync(dir);
    } catch {
      return mkdir.mkdirsSync(dir);
    }
    items.forEach((item) => {
      item = path.join(dir, item);
      remove.removeSync(item);
    });
  }
  module.exports = {
    emptyDirSync,
    emptydirSync: emptyDirSync,
    emptyDir,
    emptydir: emptyDir
  };
});

// node_modules/fs-extra/lib/ensure/file.js
var require_file = __commonJS((exports, module) => {
  var u2 = require_universalify().fromPromise;
  var path = __require("path");
  var fs = require_fs();
  var mkdir = require_mkdirs();
  async function createFile(file) {
    let stats;
    try {
      stats = await fs.stat(file);
    } catch {}
    if (stats && stats.isFile())
      return;
    const dir = path.dirname(file);
    let dirStats = null;
    try {
      dirStats = await fs.stat(dir);
    } catch (err) {
      if (err.code === "ENOENT") {
        await mkdir.mkdirs(dir);
        await fs.writeFile(file, "");
        return;
      } else {
        throw err;
      }
    }
    if (dirStats.isDirectory()) {
      await fs.writeFile(file, "");
    } else {
      await fs.readdir(dir);
    }
  }
  function createFileSync(file) {
    let stats;
    try {
      stats = fs.statSync(file);
    } catch {}
    if (stats && stats.isFile())
      return;
    const dir = path.dirname(file);
    try {
      if (!fs.statSync(dir).isDirectory()) {
        fs.readdirSync(dir);
      }
    } catch (err) {
      if (err && err.code === "ENOENT")
        mkdir.mkdirsSync(dir);
      else
        throw err;
    }
    fs.writeFileSync(file, "");
  }
  module.exports = {
    createFile: u2(createFile),
    createFileSync
  };
});

// node_modules/fs-extra/lib/ensure/link.js
var require_link = __commonJS((exports, module) => {
  var u2 = require_universalify().fromPromise;
  var path = __require("path");
  var fs = require_fs();
  var mkdir = require_mkdirs();
  var { pathExists } = require_path_exists();
  var { areIdentical } = require_stat();
  async function createLink(srcpath, dstpath) {
    let dstStat;
    try {
      dstStat = await fs.lstat(dstpath);
    } catch {}
    let srcStat;
    try {
      srcStat = await fs.lstat(srcpath);
    } catch (err) {
      err.message = err.message.replace("lstat", "ensureLink");
      throw err;
    }
    if (dstStat && areIdentical(srcStat, dstStat))
      return;
    const dir = path.dirname(dstpath);
    const dirExists = await pathExists(dir);
    if (!dirExists) {
      await mkdir.mkdirs(dir);
    }
    await fs.link(srcpath, dstpath);
  }
  function createLinkSync(srcpath, dstpath) {
    let dstStat;
    try {
      dstStat = fs.lstatSync(dstpath);
    } catch {}
    try {
      const srcStat = fs.lstatSync(srcpath);
      if (dstStat && areIdentical(srcStat, dstStat))
        return;
    } catch (err) {
      err.message = err.message.replace("lstat", "ensureLink");
      throw err;
    }
    const dir = path.dirname(dstpath);
    const dirExists = fs.existsSync(dir);
    if (dirExists)
      return fs.linkSync(srcpath, dstpath);
    mkdir.mkdirsSync(dir);
    return fs.linkSync(srcpath, dstpath);
  }
  module.exports = {
    createLink: u2(createLink),
    createLinkSync
  };
});

// node_modules/fs-extra/lib/ensure/symlink-paths.js
var require_symlink_paths = __commonJS((exports, module) => {
  var path = __require("path");
  var fs = require_fs();
  var { pathExists } = require_path_exists();
  var u2 = require_universalify().fromPromise;
  async function symlinkPaths(srcpath, dstpath) {
    if (path.isAbsolute(srcpath)) {
      try {
        await fs.lstat(srcpath);
      } catch (err) {
        err.message = err.message.replace("lstat", "ensureSymlink");
        throw err;
      }
      return {
        toCwd: srcpath,
        toDst: srcpath
      };
    }
    const dstdir = path.dirname(dstpath);
    const relativeToDst = path.join(dstdir, srcpath);
    const exists = await pathExists(relativeToDst);
    if (exists) {
      return {
        toCwd: relativeToDst,
        toDst: srcpath
      };
    }
    try {
      await fs.lstat(srcpath);
    } catch (err) {
      err.message = err.message.replace("lstat", "ensureSymlink");
      throw err;
    }
    return {
      toCwd: srcpath,
      toDst: path.relative(dstdir, srcpath)
    };
  }
  function symlinkPathsSync(srcpath, dstpath) {
    if (path.isAbsolute(srcpath)) {
      const exists2 = fs.existsSync(srcpath);
      if (!exists2)
        throw new Error("absolute srcpath does not exist");
      return {
        toCwd: srcpath,
        toDst: srcpath
      };
    }
    const dstdir = path.dirname(dstpath);
    const relativeToDst = path.join(dstdir, srcpath);
    const exists = fs.existsSync(relativeToDst);
    if (exists) {
      return {
        toCwd: relativeToDst,
        toDst: srcpath
      };
    }
    const srcExists = fs.existsSync(srcpath);
    if (!srcExists)
      throw new Error("relative srcpath does not exist");
    return {
      toCwd: srcpath,
      toDst: path.relative(dstdir, srcpath)
    };
  }
  module.exports = {
    symlinkPaths: u2(symlinkPaths),
    symlinkPathsSync
  };
});

// node_modules/fs-extra/lib/ensure/symlink-type.js
var require_symlink_type = __commonJS((exports, module) => {
  var fs = require_fs();
  var u2 = require_universalify().fromPromise;
  async function symlinkType(srcpath, type) {
    if (type)
      return type;
    let stats;
    try {
      stats = await fs.lstat(srcpath);
    } catch {
      return "file";
    }
    return stats && stats.isDirectory() ? "dir" : "file";
  }
  function symlinkTypeSync(srcpath, type) {
    if (type)
      return type;
    let stats;
    try {
      stats = fs.lstatSync(srcpath);
    } catch {
      return "file";
    }
    return stats && stats.isDirectory() ? "dir" : "file";
  }
  module.exports = {
    symlinkType: u2(symlinkType),
    symlinkTypeSync
  };
});

// node_modules/fs-extra/lib/ensure/symlink.js
var require_symlink = __commonJS((exports, module) => {
  var u2 = require_universalify().fromPromise;
  var path = __require("path");
  var fs = require_fs();
  var { mkdirs, mkdirsSync } = require_mkdirs();
  var { symlinkPaths, symlinkPathsSync } = require_symlink_paths();
  var { symlinkType, symlinkTypeSync } = require_symlink_type();
  var { pathExists } = require_path_exists();
  var { areIdentical } = require_stat();
  async function createSymlink(srcpath, dstpath, type) {
    let stats;
    try {
      stats = await fs.lstat(dstpath);
    } catch {}
    if (stats && stats.isSymbolicLink()) {
      let srcStat;
      if (path.isAbsolute(srcpath)) {
        srcStat = await fs.stat(srcpath);
      } else {
        const dstdir = path.dirname(dstpath);
        const relativeToDst = path.join(dstdir, srcpath);
        try {
          srcStat = await fs.stat(relativeToDst);
        } catch {
          srcStat = await fs.stat(srcpath);
        }
      }
      const dstStat = await fs.stat(dstpath);
      if (areIdentical(srcStat, dstStat))
        return;
    }
    const relative = await symlinkPaths(srcpath, dstpath);
    srcpath = relative.toDst;
    const toType = await symlinkType(relative.toCwd, type);
    const dir = path.dirname(dstpath);
    if (!await pathExists(dir)) {
      await mkdirs(dir);
    }
    return fs.symlink(srcpath, dstpath, toType);
  }
  function createSymlinkSync(srcpath, dstpath, type) {
    let stats;
    try {
      stats = fs.lstatSync(dstpath);
    } catch {}
    if (stats && stats.isSymbolicLink()) {
      let srcStat;
      if (path.isAbsolute(srcpath)) {
        srcStat = fs.statSync(srcpath);
      } else {
        const dstdir = path.dirname(dstpath);
        const relativeToDst = path.join(dstdir, srcpath);
        try {
          srcStat = fs.statSync(relativeToDst);
        } catch {
          srcStat = fs.statSync(srcpath);
        }
      }
      const dstStat = fs.statSync(dstpath);
      if (areIdentical(srcStat, dstStat))
        return;
    }
    const relative = symlinkPathsSync(srcpath, dstpath);
    srcpath = relative.toDst;
    type = symlinkTypeSync(relative.toCwd, type);
    const dir = path.dirname(dstpath);
    const exists = fs.existsSync(dir);
    if (exists)
      return fs.symlinkSync(srcpath, dstpath, type);
    mkdirsSync(dir);
    return fs.symlinkSync(srcpath, dstpath, type);
  }
  module.exports = {
    createSymlink: u2(createSymlink),
    createSymlinkSync
  };
});

// node_modules/fs-extra/lib/ensure/index.js
var require_ensure = __commonJS((exports, module) => {
  var { createFile, createFileSync } = require_file();
  var { createLink, createLinkSync } = require_link();
  var { createSymlink, createSymlinkSync } = require_symlink();
  module.exports = {
    createFile,
    createFileSync,
    ensureFile: createFile,
    ensureFileSync: createFileSync,
    createLink,
    createLinkSync,
    ensureLink: createLink,
    ensureLinkSync: createLinkSync,
    createSymlink,
    createSymlinkSync,
    ensureSymlink: createSymlink,
    ensureSymlinkSync: createSymlinkSync
  };
});

// node_modules/jsonfile/utils.js
var require_utils2 = __commonJS((exports, module) => {
  function stringify(obj, { EOL = `
`, finalEOL = true, replacer = null, spaces } = {}) {
    const EOF = finalEOL ? EOL : "";
    const str = JSON.stringify(obj, replacer, spaces);
    if (str === undefined) {
      throw new TypeError(`Converting ${typeof obj} value to JSON is not supported`);
    }
    return str.replace(/\n/g, EOL) + EOF;
  }
  function stripBom(content) {
    if (Buffer.isBuffer(content))
      content = content.toString("utf8");
    return content.replace(/^\uFEFF/, "");
  }
  module.exports = { stringify, stripBom };
});

// node_modules/jsonfile/index.js
var require_jsonfile = __commonJS((exports, module) => {
  var _fs;
  try {
    _fs = require_graceful_fs();
  } catch (_3) {
    _fs = __require("fs");
  }
  var universalify = require_universalify();
  var { stringify, stripBom } = require_utils2();
  async function _readFile(file, options = {}) {
    if (typeof options === "string") {
      options = { encoding: options };
    }
    const fs = options.fs || _fs;
    const shouldThrow = "throws" in options ? options.throws : true;
    let data = await universalify.fromCallback(fs.readFile)(file, options);
    data = stripBom(data);
    let obj;
    try {
      obj = JSON.parse(data, options ? options.reviver : null);
    } catch (err) {
      if (shouldThrow) {
        err.message = `${file}: ${err.message}`;
        throw err;
      } else {
        return null;
      }
    }
    return obj;
  }
  var readFile = universalify.fromPromise(_readFile);
  function readFileSync(file, options = {}) {
    if (typeof options === "string") {
      options = { encoding: options };
    }
    const fs = options.fs || _fs;
    const shouldThrow = "throws" in options ? options.throws : true;
    try {
      let content = fs.readFileSync(file, options);
      content = stripBom(content);
      return JSON.parse(content, options.reviver);
    } catch (err) {
      if (shouldThrow) {
        err.message = `${file}: ${err.message}`;
        throw err;
      } else {
        return null;
      }
    }
  }
  async function _writeFile(file, obj, options = {}) {
    const fs = options.fs || _fs;
    const str = stringify(obj, options);
    await universalify.fromCallback(fs.writeFile)(file, str, options);
  }
  var writeFile = universalify.fromPromise(_writeFile);
  function writeFileSync(file, obj, options = {}) {
    const fs = options.fs || _fs;
    const str = stringify(obj, options);
    return fs.writeFileSync(file, str, options);
  }
  module.exports = {
    readFile,
    readFileSync,
    writeFile,
    writeFileSync
  };
});

// node_modules/fs-extra/lib/json/jsonfile.js
var require_jsonfile2 = __commonJS((exports, module) => {
  var jsonFile = require_jsonfile();
  module.exports = {
    readJson: jsonFile.readFile,
    readJsonSync: jsonFile.readFileSync,
    writeJson: jsonFile.writeFile,
    writeJsonSync: jsonFile.writeFileSync
  };
});

// node_modules/fs-extra/lib/output-file/index.js
var require_output_file = __commonJS((exports, module) => {
  var u2 = require_universalify().fromPromise;
  var fs = require_fs();
  var path = __require("path");
  var mkdir = require_mkdirs();
  var pathExists = require_path_exists().pathExists;
  async function outputFile(file, data, encoding = "utf-8") {
    const dir = path.dirname(file);
    if (!await pathExists(dir)) {
      await mkdir.mkdirs(dir);
    }
    return fs.writeFile(file, data, encoding);
  }
  function outputFileSync(file, ...args) {
    const dir = path.dirname(file);
    if (!fs.existsSync(dir)) {
      mkdir.mkdirsSync(dir);
    }
    fs.writeFileSync(file, ...args);
  }
  module.exports = {
    outputFile: u2(outputFile),
    outputFileSync
  };
});

// node_modules/fs-extra/lib/json/output-json.js
var require_output_json = __commonJS((exports, module) => {
  var { stringify } = require_utils2();
  var { outputFile } = require_output_file();
  async function outputJson(file, data, options = {}) {
    const str = stringify(data, options);
    await outputFile(file, str, options);
  }
  module.exports = outputJson;
});

// node_modules/fs-extra/lib/json/output-json-sync.js
var require_output_json_sync = __commonJS((exports, module) => {
  var { stringify } = require_utils2();
  var { outputFileSync } = require_output_file();
  function outputJsonSync(file, data, options) {
    const str = stringify(data, options);
    outputFileSync(file, str, options);
  }
  module.exports = outputJsonSync;
});

// node_modules/fs-extra/lib/json/index.js
var require_json = __commonJS((exports, module) => {
  var u2 = require_universalify().fromPromise;
  var jsonFile = require_jsonfile2();
  jsonFile.outputJson = u2(require_output_json());
  jsonFile.outputJsonSync = require_output_json_sync();
  jsonFile.outputJSON = jsonFile.outputJson;
  jsonFile.outputJSONSync = jsonFile.outputJsonSync;
  jsonFile.writeJSON = jsonFile.writeJson;
  jsonFile.writeJSONSync = jsonFile.writeJsonSync;
  jsonFile.readJSON = jsonFile.readJson;
  jsonFile.readJSONSync = jsonFile.readJsonSync;
  module.exports = jsonFile;
});

// node_modules/fs-extra/lib/move/move.js
var require_move = __commonJS((exports, module) => {
  var fs = require_fs();
  var path = __require("path");
  var { copy } = require_copy2();
  var { remove } = require_remove();
  var { mkdirp } = require_mkdirs();
  var { pathExists } = require_path_exists();
  var stat = require_stat();
  async function move(src, dest, opts = {}) {
    const overwrite = opts.overwrite || opts.clobber || false;
    const { srcStat, isChangingCase = false } = await stat.checkPaths(src, dest, "move", opts);
    await stat.checkParentPaths(src, srcStat, dest, "move");
    const destParent = path.dirname(dest);
    const parsedParentPath = path.parse(destParent);
    if (parsedParentPath.root !== destParent) {
      await mkdirp(destParent);
    }
    return doRename(src, dest, overwrite, isChangingCase);
  }
  async function doRename(src, dest, overwrite, isChangingCase) {
    if (!isChangingCase) {
      if (overwrite) {
        await remove(dest);
      } else if (await pathExists(dest)) {
        throw new Error("dest already exists.");
      }
    }
    try {
      await fs.rename(src, dest);
    } catch (err) {
      if (err.code !== "EXDEV") {
        throw err;
      }
      await moveAcrossDevice(src, dest, overwrite);
    }
  }
  async function moveAcrossDevice(src, dest, overwrite) {
    const opts = {
      overwrite,
      errorOnExist: true,
      preserveTimestamps: true
    };
    await copy(src, dest, opts);
    return remove(src);
  }
  module.exports = move;
});

// node_modules/fs-extra/lib/move/move-sync.js
var require_move_sync = __commonJS((exports, module) => {
  var fs = require_graceful_fs();
  var path = __require("path");
  var copySync = require_copy2().copySync;
  var removeSync = require_remove().removeSync;
  var mkdirpSync = require_mkdirs().mkdirpSync;
  var stat = require_stat();
  function moveSync(src, dest, opts) {
    opts = opts || {};
    const overwrite = opts.overwrite || opts.clobber || false;
    const { srcStat, isChangingCase = false } = stat.checkPathsSync(src, dest, "move", opts);
    stat.checkParentPathsSync(src, srcStat, dest, "move");
    if (!isParentRoot(dest))
      mkdirpSync(path.dirname(dest));
    return doRename(src, dest, overwrite, isChangingCase);
  }
  function isParentRoot(dest) {
    const parent = path.dirname(dest);
    const parsedPath = path.parse(parent);
    return parsedPath.root === parent;
  }
  function doRename(src, dest, overwrite, isChangingCase) {
    if (isChangingCase)
      return rename(src, dest, overwrite);
    if (overwrite) {
      removeSync(dest);
      return rename(src, dest, overwrite);
    }
    if (fs.existsSync(dest))
      throw new Error("dest already exists.");
    return rename(src, dest, overwrite);
  }
  function rename(src, dest, overwrite) {
    try {
      fs.renameSync(src, dest);
    } catch (err) {
      if (err.code !== "EXDEV")
        throw err;
      return moveAcrossDevice(src, dest, overwrite);
    }
  }
  function moveAcrossDevice(src, dest, overwrite) {
    const opts = {
      overwrite,
      errorOnExist: true,
      preserveTimestamps: true
    };
    copySync(src, dest, opts);
    return removeSync(src);
  }
  module.exports = moveSync;
});

// node_modules/fs-extra/lib/move/index.js
var require_move2 = __commonJS((exports, module) => {
  var u2 = require_universalify().fromPromise;
  module.exports = {
    move: u2(require_move()),
    moveSync: require_move_sync()
  };
});

// node_modules/fs-extra/lib/index.js
var require_lib = __commonJS((exports, module) => {
  module.exports = {
    ...require_fs(),
    ...require_copy2(),
    ...require_empty(),
    ...require_ensure(),
    ...require_json(),
    ...require_mkdirs(),
    ...require_move2(),
    ...require_output_file(),
    ...require_path_exists(),
    ...require_remove()
  };
});

// node_modules/yaml/dist/nodes/identity.js
var require_identity = __commonJS((exports) => {
  var ALIAS = Symbol.for("yaml.alias");
  var DOC = Symbol.for("yaml.document");
  var MAP = Symbol.for("yaml.map");
  var PAIR = Symbol.for("yaml.pair");
  var SCALAR = Symbol.for("yaml.scalar");
  var SEQ = Symbol.for("yaml.seq");
  var NODE_TYPE = Symbol.for("yaml.node.type");
  var isAlias = (node) => !!node && typeof node === "object" && node[NODE_TYPE] === ALIAS;
  var isDocument = (node) => !!node && typeof node === "object" && node[NODE_TYPE] === DOC;
  var isMap = (node) => !!node && typeof node === "object" && node[NODE_TYPE] === MAP;
  var isPair = (node) => !!node && typeof node === "object" && node[NODE_TYPE] === PAIR;
  var isScalar = (node) => !!node && typeof node === "object" && node[NODE_TYPE] === SCALAR;
  var isSeq = (node) => !!node && typeof node === "object" && node[NODE_TYPE] === SEQ;
  function isCollection(node) {
    if (node && typeof node === "object")
      switch (node[NODE_TYPE]) {
        case MAP:
        case SEQ:
          return true;
      }
    return false;
  }
  function isNode(node) {
    if (node && typeof node === "object")
      switch (node[NODE_TYPE]) {
        case ALIAS:
        case MAP:
        case SCALAR:
        case SEQ:
          return true;
      }
    return false;
  }
  var hasAnchor = (node) => (isScalar(node) || isCollection(node)) && !!node.anchor;
  exports.ALIAS = ALIAS;
  exports.DOC = DOC;
  exports.MAP = MAP;
  exports.NODE_TYPE = NODE_TYPE;
  exports.PAIR = PAIR;
  exports.SCALAR = SCALAR;
  exports.SEQ = SEQ;
  exports.hasAnchor = hasAnchor;
  exports.isAlias = isAlias;
  exports.isCollection = isCollection;
  exports.isDocument = isDocument;
  exports.isMap = isMap;
  exports.isNode = isNode;
  exports.isPair = isPair;
  exports.isScalar = isScalar;
  exports.isSeq = isSeq;
});

// node_modules/yaml/dist/visit.js
var require_visit = __commonJS((exports) => {
  var identity = require_identity();
  var BREAK = Symbol("break visit");
  var SKIP = Symbol("skip children");
  var REMOVE = Symbol("remove node");
  function visit(node, visitor) {
    const visitor_ = initVisitor(visitor);
    if (identity.isDocument(node)) {
      const cd = visit_(null, node.contents, visitor_, Object.freeze([node]));
      if (cd === REMOVE)
        node.contents = null;
    } else
      visit_(null, node, visitor_, Object.freeze([]));
  }
  visit.BREAK = BREAK;
  visit.SKIP = SKIP;
  visit.REMOVE = REMOVE;
  function visit_(key, node, visitor, path) {
    const ctrl = callVisitor(key, node, visitor, path);
    if (identity.isNode(ctrl) || identity.isPair(ctrl)) {
      replaceNode(key, path, ctrl);
      return visit_(key, ctrl, visitor, path);
    }
    if (typeof ctrl !== "symbol") {
      if (identity.isCollection(node)) {
        path = Object.freeze(path.concat(node));
        for (let i = 0;i < node.items.length; ++i) {
          const ci = visit_(i, node.items[i], visitor, path);
          if (typeof ci === "number")
            i = ci - 1;
          else if (ci === BREAK)
            return BREAK;
          else if (ci === REMOVE) {
            node.items.splice(i, 1);
            i -= 1;
          }
        }
      } else if (identity.isPair(node)) {
        path = Object.freeze(path.concat(node));
        const ck = visit_("key", node.key, visitor, path);
        if (ck === BREAK)
          return BREAK;
        else if (ck === REMOVE)
          node.key = null;
        const cv = visit_("value", node.value, visitor, path);
        if (cv === BREAK)
          return BREAK;
        else if (cv === REMOVE)
          node.value = null;
      }
    }
    return ctrl;
  }
  async function visitAsync(node, visitor) {
    const visitor_ = initVisitor(visitor);
    if (identity.isDocument(node)) {
      const cd = await visitAsync_(null, node.contents, visitor_, Object.freeze([node]));
      if (cd === REMOVE)
        node.contents = null;
    } else
      await visitAsync_(null, node, visitor_, Object.freeze([]));
  }
  visitAsync.BREAK = BREAK;
  visitAsync.SKIP = SKIP;
  visitAsync.REMOVE = REMOVE;
  async function visitAsync_(key, node, visitor, path) {
    const ctrl = await callVisitor(key, node, visitor, path);
    if (identity.isNode(ctrl) || identity.isPair(ctrl)) {
      replaceNode(key, path, ctrl);
      return visitAsync_(key, ctrl, visitor, path);
    }
    if (typeof ctrl !== "symbol") {
      if (identity.isCollection(node)) {
        path = Object.freeze(path.concat(node));
        for (let i = 0;i < node.items.length; ++i) {
          const ci = await visitAsync_(i, node.items[i], visitor, path);
          if (typeof ci === "number")
            i = ci - 1;
          else if (ci === BREAK)
            return BREAK;
          else if (ci === REMOVE) {
            node.items.splice(i, 1);
            i -= 1;
          }
        }
      } else if (identity.isPair(node)) {
        path = Object.freeze(path.concat(node));
        const ck = await visitAsync_("key", node.key, visitor, path);
        if (ck === BREAK)
          return BREAK;
        else if (ck === REMOVE)
          node.key = null;
        const cv = await visitAsync_("value", node.value, visitor, path);
        if (cv === BREAK)
          return BREAK;
        else if (cv === REMOVE)
          node.value = null;
      }
    }
    return ctrl;
  }
  function initVisitor(visitor) {
    if (typeof visitor === "object" && (visitor.Collection || visitor.Node || visitor.Value)) {
      return Object.assign({
        Alias: visitor.Node,
        Map: visitor.Node,
        Scalar: visitor.Node,
        Seq: visitor.Node
      }, visitor.Value && {
        Map: visitor.Value,
        Scalar: visitor.Value,
        Seq: visitor.Value
      }, visitor.Collection && {
        Map: visitor.Collection,
        Seq: visitor.Collection
      }, visitor);
    }
    return visitor;
  }
  function callVisitor(key, node, visitor, path) {
    if (typeof visitor === "function")
      return visitor(key, node, path);
    if (identity.isMap(node))
      return visitor.Map?.(key, node, path);
    if (identity.isSeq(node))
      return visitor.Seq?.(key, node, path);
    if (identity.isPair(node))
      return visitor.Pair?.(key, node, path);
    if (identity.isScalar(node))
      return visitor.Scalar?.(key, node, path);
    if (identity.isAlias(node))
      return visitor.Alias?.(key, node, path);
    return;
  }
  function replaceNode(key, path, node) {
    const parent = path[path.length - 1];
    if (identity.isCollection(parent)) {
      parent.items[key] = node;
    } else if (identity.isPair(parent)) {
      if (key === "key")
        parent.key = node;
      else
        parent.value = node;
    } else if (identity.isDocument(parent)) {
      parent.contents = node;
    } else {
      const pt = identity.isAlias(parent) ? "alias" : "scalar";
      throw new Error(`Cannot replace node with ${pt} parent`);
    }
  }
  exports.visit = visit;
  exports.visitAsync = visitAsync;
});

// node_modules/yaml/dist/doc/directives.js
var require_directives = __commonJS((exports) => {
  var identity = require_identity();
  var visit = require_visit();
  var escapeChars = {
    "!": "%21",
    ",": "%2C",
    "[": "%5B",
    "]": "%5D",
    "{": "%7B",
    "}": "%7D"
  };
  var escapeTagName = (tn) => tn.replace(/[!,[\]{}]/g, (ch) => escapeChars[ch]);

  class Directives {
    constructor(yaml, tags) {
      this.docStart = null;
      this.docEnd = false;
      this.yaml = Object.assign({}, Directives.defaultYaml, yaml);
      this.tags = Object.assign({}, Directives.defaultTags, tags);
    }
    clone() {
      const copy = new Directives(this.yaml, this.tags);
      copy.docStart = this.docStart;
      return copy;
    }
    atDocument() {
      const res = new Directives(this.yaml, this.tags);
      switch (this.yaml.version) {
        case "1.1":
          this.atNextDocument = true;
          break;
        case "1.2":
          this.atNextDocument = false;
          this.yaml = {
            explicit: Directives.defaultYaml.explicit,
            version: "1.2"
          };
          this.tags = Object.assign({}, Directives.defaultTags);
          break;
      }
      return res;
    }
    add(line, onError) {
      if (this.atNextDocument) {
        this.yaml = { explicit: Directives.defaultYaml.explicit, version: "1.1" };
        this.tags = Object.assign({}, Directives.defaultTags);
        this.atNextDocument = false;
      }
      const parts = line.trim().split(/[ \t]+/);
      const name = parts.shift();
      switch (name) {
        case "%TAG": {
          if (parts.length !== 2) {
            onError(0, "%TAG directive should contain exactly two parts");
            if (parts.length < 2)
              return false;
          }
          const [handle, prefix] = parts;
          this.tags[handle] = prefix;
          return true;
        }
        case "%YAML": {
          this.yaml.explicit = true;
          if (parts.length !== 1) {
            onError(0, "%YAML directive should contain exactly one part");
            return false;
          }
          const [version] = parts;
          if (version === "1.1" || version === "1.2") {
            this.yaml.version = version;
            return true;
          } else {
            const isValid = /^\d+\.\d+$/.test(version);
            onError(6, `Unsupported YAML version ${version}`, isValid);
            return false;
          }
        }
        default:
          onError(0, `Unknown directive ${name}`, true);
          return false;
      }
    }
    tagName(source, onError) {
      if (source === "!")
        return "!";
      if (source[0] !== "!") {
        onError(`Not a valid tag: ${source}`);
        return null;
      }
      if (source[1] === "<") {
        const verbatim = source.slice(2, -1);
        if (verbatim === "!" || verbatim === "!!") {
          onError(`Verbatim tags aren't resolved, so ${source} is invalid.`);
          return null;
        }
        if (source[source.length - 1] !== ">")
          onError("Verbatim tags must end with a >");
        return verbatim;
      }
      const [, handle, suffix] = source.match(/^(.*!)([^!]*)$/s);
      if (!suffix)
        onError(`The ${source} tag has no suffix`);
      const prefix = this.tags[handle];
      if (prefix) {
        try {
          return prefix + decodeURIComponent(suffix);
        } catch (error) {
          onError(String(error));
          return null;
        }
      }
      if (handle === "!")
        return source;
      onError(`Could not resolve tag: ${source}`);
      return null;
    }
    tagString(tag) {
      for (const [handle, prefix] of Object.entries(this.tags)) {
        if (tag.startsWith(prefix))
          return handle + escapeTagName(tag.substring(prefix.length));
      }
      return tag[0] === "!" ? tag : `!<${tag}>`;
    }
    toString(doc) {
      const lines = this.yaml.explicit ? [`%YAML ${this.yaml.version || "1.2"}`] : [];
      const tagEntries = Object.entries(this.tags);
      let tagNames;
      if (doc && tagEntries.length > 0 && identity.isNode(doc.contents)) {
        const tags = {};
        visit.visit(doc.contents, (_key, node) => {
          if (identity.isNode(node) && node.tag)
            tags[node.tag] = true;
        });
        tagNames = Object.keys(tags);
      } else
        tagNames = [];
      for (const [handle, prefix] of tagEntries) {
        if (handle === "!!" && prefix === "tag:yaml.org,2002:")
          continue;
        if (!doc || tagNames.some((tn) => tn.startsWith(prefix)))
          lines.push(`%TAG ${handle} ${prefix}`);
      }
      return lines.join(`
`);
    }
  }
  Directives.defaultYaml = { explicit: false, version: "1.2" };
  Directives.defaultTags = { "!!": "tag:yaml.org,2002:" };
  exports.Directives = Directives;
});

// node_modules/yaml/dist/doc/anchors.js
var require_anchors = __commonJS((exports) => {
  var identity = require_identity();
  var visit = require_visit();
  function anchorIsValid(anchor) {
    if (/[\x00-\x19\s,[\]{}]/.test(anchor)) {
      const sa = JSON.stringify(anchor);
      const msg = `Anchor must not contain whitespace or control characters: ${sa}`;
      throw new Error(msg);
    }
    return true;
  }
  function anchorNames(root) {
    const anchors = new Set;
    visit.visit(root, {
      Value(_key, node) {
        if (node.anchor)
          anchors.add(node.anchor);
      }
    });
    return anchors;
  }
  function findNewAnchor(prefix, exclude) {
    for (let i = 1;; ++i) {
      const name = `${prefix}${i}`;
      if (!exclude.has(name))
        return name;
    }
  }
  function createNodeAnchors(doc, prefix) {
    const aliasObjects = [];
    const sourceObjects = new Map;
    let prevAnchors = null;
    return {
      onAnchor: (source) => {
        aliasObjects.push(source);
        prevAnchors ?? (prevAnchors = anchorNames(doc));
        const anchor = findNewAnchor(prefix, prevAnchors);
        prevAnchors.add(anchor);
        return anchor;
      },
      setAnchors: () => {
        for (const source of aliasObjects) {
          const ref = sourceObjects.get(source);
          if (typeof ref === "object" && ref.anchor && (identity.isScalar(ref.node) || identity.isCollection(ref.node))) {
            ref.node.anchor = ref.anchor;
          } else {
            const error = new Error("Failed to resolve repeated object (this should not happen)");
            error.source = source;
            throw error;
          }
        }
      },
      sourceObjects
    };
  }
  exports.anchorIsValid = anchorIsValid;
  exports.anchorNames = anchorNames;
  exports.createNodeAnchors = createNodeAnchors;
  exports.findNewAnchor = findNewAnchor;
});

// node_modules/yaml/dist/doc/applyReviver.js
var require_applyReviver = __commonJS((exports) => {
  function applyReviver(reviver, obj, key, val) {
    if (val && typeof val === "object") {
      if (Array.isArray(val)) {
        for (let i = 0, len = val.length;i < len; ++i) {
          const v0 = val[i];
          const v1 = applyReviver(reviver, val, String(i), v0);
          if (v1 === undefined)
            delete val[i];
          else if (v1 !== v0)
            val[i] = v1;
        }
      } else if (val instanceof Map) {
        for (const k3 of Array.from(val.keys())) {
          const v0 = val.get(k3);
          const v1 = applyReviver(reviver, val, k3, v0);
          if (v1 === undefined)
            val.delete(k3);
          else if (v1 !== v0)
            val.set(k3, v1);
        }
      } else if (val instanceof Set) {
        for (const v0 of Array.from(val)) {
          const v1 = applyReviver(reviver, val, v0, v0);
          if (v1 === undefined)
            val.delete(v0);
          else if (v1 !== v0) {
            val.delete(v0);
            val.add(v1);
          }
        }
      } else {
        for (const [k3, v0] of Object.entries(val)) {
          const v1 = applyReviver(reviver, val, k3, v0);
          if (v1 === undefined)
            delete val[k3];
          else if (v1 !== v0)
            val[k3] = v1;
        }
      }
    }
    return reviver.call(obj, key, val);
  }
  exports.applyReviver = applyReviver;
});

// node_modules/yaml/dist/nodes/toJS.js
var require_toJS = __commonJS((exports) => {
  var identity = require_identity();
  function toJS(value, arg, ctx) {
    if (Array.isArray(value))
      return value.map((v2, i) => toJS(v2, String(i), ctx));
    if (value && typeof value.toJSON === "function") {
      if (!ctx || !identity.hasAnchor(value))
        return value.toJSON(arg, ctx);
      const data = { aliasCount: 0, count: 1, res: undefined };
      ctx.anchors.set(value, data);
      ctx.onCreate = (res2) => {
        data.res = res2;
        delete ctx.onCreate;
      };
      const res = value.toJSON(arg, ctx);
      if (ctx.onCreate)
        ctx.onCreate(res);
      return res;
    }
    if (typeof value === "bigint" && !ctx?.keep)
      return Number(value);
    return value;
  }
  exports.toJS = toJS;
});

// node_modules/yaml/dist/nodes/Node.js
var require_Node = __commonJS((exports) => {
  var applyReviver = require_applyReviver();
  var identity = require_identity();
  var toJS = require_toJS();

  class NodeBase {
    constructor(type) {
      Object.defineProperty(this, identity.NODE_TYPE, { value: type });
    }
    clone() {
      const copy = Object.create(Object.getPrototypeOf(this), Object.getOwnPropertyDescriptors(this));
      if (this.range)
        copy.range = this.range.slice();
      return copy;
    }
    toJS(doc, { mapAsMap, maxAliasCount, onAnchor, reviver } = {}) {
      if (!identity.isDocument(doc))
        throw new TypeError("A document argument is required");
      const ctx = {
        anchors: new Map,
        doc,
        keep: true,
        mapAsMap: mapAsMap === true,
        mapKeyWarned: false,
        maxAliasCount: typeof maxAliasCount === "number" ? maxAliasCount : 100
      };
      const res = toJS.toJS(this, "", ctx);
      if (typeof onAnchor === "function")
        for (const { count, res: res2 } of ctx.anchors.values())
          onAnchor(res2, count);
      return typeof reviver === "function" ? applyReviver.applyReviver(reviver, { "": res }, "", res) : res;
    }
  }
  exports.NodeBase = NodeBase;
});

// node_modules/yaml/dist/nodes/Alias.js
var require_Alias = __commonJS((exports) => {
  var anchors = require_anchors();
  var visit = require_visit();
  var identity = require_identity();
  var Node = require_Node();
  var toJS = require_toJS();

  class Alias extends Node.NodeBase {
    constructor(source) {
      super(identity.ALIAS);
      this.source = source;
      Object.defineProperty(this, "tag", {
        set() {
          throw new Error("Alias nodes cannot have tags");
        }
      });
    }
    resolve(doc, ctx) {
      if (ctx?.maxAliasCount === 0)
        throw new ReferenceError("Alias resolution is disabled");
      let nodes;
      if (ctx?.aliasResolveCache) {
        nodes = ctx.aliasResolveCache;
      } else {
        nodes = [];
        visit.visit(doc, {
          Node: (_key, node) => {
            if (identity.isAlias(node) || identity.hasAnchor(node))
              nodes.push(node);
          }
        });
        if (ctx)
          ctx.aliasResolveCache = nodes;
      }
      let found = undefined;
      for (const node of nodes) {
        if (node === this)
          break;
        if (node.anchor === this.source)
          found = node;
      }
      return found;
    }
    toJSON(_arg, ctx) {
      if (!ctx)
        return { source: this.source };
      const { anchors: anchors2, doc, maxAliasCount } = ctx;
      const source = this.resolve(doc, ctx);
      if (!source) {
        const msg = `Unresolved alias (the anchor must be set before the alias): ${this.source}`;
        throw new ReferenceError(msg);
      }
      let data = anchors2.get(source);
      if (!data) {
        toJS.toJS(source, null, ctx);
        data = anchors2.get(source);
      }
      if (data?.res === undefined) {
        const msg = "This should not happen: Alias anchor was not resolved?";
        throw new ReferenceError(msg);
      }
      if (maxAliasCount >= 0) {
        data.count += 1;
        if (data.aliasCount === 0)
          data.aliasCount = getAliasCount(doc, source, anchors2);
        if (data.count * data.aliasCount > maxAliasCount) {
          const msg = "Excessive alias count indicates a resource exhaustion attack";
          throw new ReferenceError(msg);
        }
      }
      return data.res;
    }
    toString(ctx, _onComment, _onChompKeep) {
      const src = `*${this.source}`;
      if (ctx) {
        anchors.anchorIsValid(this.source);
        if (ctx.options.verifyAliasOrder && !ctx.anchors.has(this.source)) {
          const msg = `Unresolved alias (the anchor must be set before the alias): ${this.source}`;
          throw new Error(msg);
        }
        if (ctx.implicitKey)
          return `${src} `;
      }
      return src;
    }
  }
  function getAliasCount(doc, node, anchors2) {
    if (identity.isAlias(node)) {
      const source = node.resolve(doc);
      const anchor = anchors2 && source && anchors2.get(source);
      return anchor ? anchor.count * anchor.aliasCount : 0;
    } else if (identity.isCollection(node)) {
      let count = 0;
      for (const item of node.items) {
        const c = getAliasCount(doc, item, anchors2);
        if (c > count)
          count = c;
      }
      return count;
    } else if (identity.isPair(node)) {
      const kc = getAliasCount(doc, node.key, anchors2);
      const vc = getAliasCount(doc, node.value, anchors2);
      return Math.max(kc, vc);
    }
    return 1;
  }
  exports.Alias = Alias;
});

// node_modules/yaml/dist/nodes/Scalar.js
var require_Scalar = __commonJS((exports) => {
  var identity = require_identity();
  var Node = require_Node();
  var toJS = require_toJS();
  var isScalarValue = (value) => !value || typeof value !== "function" && typeof value !== "object";

  class Scalar extends Node.NodeBase {
    constructor(value) {
      super(identity.SCALAR);
      this.value = value;
    }
    toJSON(arg, ctx) {
      return ctx?.keep ? this.value : toJS.toJS(this.value, arg, ctx);
    }
    toString() {
      return String(this.value);
    }
  }
  Scalar.BLOCK_FOLDED = "BLOCK_FOLDED";
  Scalar.BLOCK_LITERAL = "BLOCK_LITERAL";
  Scalar.PLAIN = "PLAIN";
  Scalar.QUOTE_DOUBLE = "QUOTE_DOUBLE";
  Scalar.QUOTE_SINGLE = "QUOTE_SINGLE";
  exports.Scalar = Scalar;
  exports.isScalarValue = isScalarValue;
});

// node_modules/yaml/dist/doc/createNode.js
var require_createNode = __commonJS((exports) => {
  var Alias = require_Alias();
  var identity = require_identity();
  var Scalar = require_Scalar();
  var defaultTagPrefix = "tag:yaml.org,2002:";
  function findTagObject(value, tagName, tags) {
    if (tagName) {
      const match = tags.filter((t) => t.tag === tagName);
      const tagObj = match.find((t) => !t.format) ?? match[0];
      if (!tagObj)
        throw new Error(`Tag ${tagName} not found`);
      return tagObj;
    }
    return tags.find((t) => t.identify?.(value) && !t.format);
  }
  function createNode(value, tagName, ctx) {
    if (identity.isDocument(value))
      value = value.contents;
    if (identity.isNode(value))
      return value;
    if (identity.isPair(value)) {
      const map = ctx.schema[identity.MAP].createNode?.(ctx.schema, null, ctx);
      map.items.push(value);
      return map;
    }
    if (value instanceof String || value instanceof Number || value instanceof Boolean || typeof BigInt !== "undefined" && value instanceof BigInt) {
      value = value.valueOf();
    }
    const { aliasDuplicateObjects, onAnchor, onTagObj, schema, sourceObjects } = ctx;
    let ref = undefined;
    if (aliasDuplicateObjects && value && typeof value === "object") {
      ref = sourceObjects.get(value);
      if (ref) {
        ref.anchor ?? (ref.anchor = onAnchor(value));
        return new Alias.Alias(ref.anchor);
      } else {
        ref = { anchor: null, node: null };
        sourceObjects.set(value, ref);
      }
    }
    if (tagName?.startsWith("!!"))
      tagName = defaultTagPrefix + tagName.slice(2);
    let tagObj = findTagObject(value, tagName, schema.tags);
    if (!tagObj) {
      if (value && typeof value.toJSON === "function") {
        value = value.toJSON();
      }
      if (!value || typeof value !== "object") {
        const node2 = new Scalar.Scalar(value);
        if (ref)
          ref.node = node2;
        return node2;
      }
      tagObj = value instanceof Map ? schema[identity.MAP] : (Symbol.iterator in Object(value)) ? schema[identity.SEQ] : schema[identity.MAP];
    }
    if (onTagObj) {
      onTagObj(tagObj);
      delete ctx.onTagObj;
    }
    const node = tagObj?.createNode ? tagObj.createNode(ctx.schema, value, ctx) : typeof tagObj?.nodeClass?.from === "function" ? tagObj.nodeClass.from(ctx.schema, value, ctx) : new Scalar.Scalar(value);
    if (tagName)
      node.tag = tagName;
    else if (!tagObj.default)
      node.tag = tagObj.tag;
    if (ref)
      ref.node = node;
    return node;
  }
  exports.createNode = createNode;
});

// node_modules/yaml/dist/nodes/Collection.js
var require_Collection = __commonJS((exports) => {
  var createNode = require_createNode();
  var identity = require_identity();
  var Node = require_Node();
  function collectionFromPath(schema, path, value) {
    let v2 = value;
    for (let i = path.length - 1;i >= 0; --i) {
      const k3 = path[i];
      if (typeof k3 === "number" && Number.isInteger(k3) && k3 >= 0) {
        const a = [];
        a[k3] = v2;
        v2 = a;
      } else {
        v2 = new Map([[k3, v2]]);
      }
    }
    return createNode.createNode(v2, undefined, {
      aliasDuplicateObjects: false,
      keepUndefined: false,
      onAnchor: () => {
        throw new Error("This should not happen, please report a bug.");
      },
      schema,
      sourceObjects: new Map
    });
  }
  var isEmptyPath = (path) => path == null || typeof path === "object" && !!path[Symbol.iterator]().next().done;

  class Collection extends Node.NodeBase {
    constructor(type, schema) {
      super(type);
      Object.defineProperty(this, "schema", {
        value: schema,
        configurable: true,
        enumerable: false,
        writable: true
      });
    }
    clone(schema) {
      const copy = Object.create(Object.getPrototypeOf(this), Object.getOwnPropertyDescriptors(this));
      if (schema)
        copy.schema = schema;
      copy.items = copy.items.map((it) => identity.isNode(it) || identity.isPair(it) ? it.clone(schema) : it);
      if (this.range)
        copy.range = this.range.slice();
      return copy;
    }
    addIn(path, value) {
      if (isEmptyPath(path))
        this.add(value);
      else {
        const [key, ...rest] = path;
        const node = this.get(key, true);
        if (identity.isCollection(node))
          node.addIn(rest, value);
        else if (node === undefined && this.schema)
          this.set(key, collectionFromPath(this.schema, rest, value));
        else
          throw new Error(`Expected YAML collection at ${key}. Remaining path: ${rest}`);
      }
    }
    deleteIn(path) {
      const [key, ...rest] = path;
      if (rest.length === 0)
        return this.delete(key);
      const node = this.get(key, true);
      if (identity.isCollection(node))
        return node.deleteIn(rest);
      else
        throw new Error(`Expected YAML collection at ${key}. Remaining path: ${rest}`);
    }
    getIn(path, keepScalar) {
      const [key, ...rest] = path;
      const node = this.get(key, true);
      if (rest.length === 0)
        return !keepScalar && identity.isScalar(node) ? node.value : node;
      else
        return identity.isCollection(node) ? node.getIn(rest, keepScalar) : undefined;
    }
    hasAllNullValues(allowScalar) {
      return this.items.every((node) => {
        if (!identity.isPair(node))
          return false;
        const n = node.value;
        return n == null || allowScalar && identity.isScalar(n) && n.value == null && !n.commentBefore && !n.comment && !n.tag;
      });
    }
    hasIn(path) {
      const [key, ...rest] = path;
      if (rest.length === 0)
        return this.has(key);
      const node = this.get(key, true);
      return identity.isCollection(node) ? node.hasIn(rest) : false;
    }
    setIn(path, value) {
      const [key, ...rest] = path;
      if (rest.length === 0) {
        this.set(key, value);
      } else {
        const node = this.get(key, true);
        if (identity.isCollection(node))
          node.setIn(rest, value);
        else if (node === undefined && this.schema)
          this.set(key, collectionFromPath(this.schema, rest, value));
        else
          throw new Error(`Expected YAML collection at ${key}. Remaining path: ${rest}`);
      }
    }
  }
  exports.Collection = Collection;
  exports.collectionFromPath = collectionFromPath;
  exports.isEmptyPath = isEmptyPath;
});

// node_modules/yaml/dist/stringify/stringifyComment.js
var require_stringifyComment = __commonJS((exports) => {
  var stringifyComment = (str) => str.replace(/^(?!$)(?: $)?/gm, "#");
  function indentComment(comment, indent) {
    if (/^\n+$/.test(comment))
      return comment.substring(1);
    return indent ? comment.replace(/^(?! *$)/gm, indent) : comment;
  }
  var lineComment = (str, indent, comment) => str.endsWith(`
`) ? indentComment(comment, indent) : comment.includes(`
`) ? `
` + indentComment(comment, indent) : (str.endsWith(" ") ? "" : " ") + comment;
  exports.indentComment = indentComment;
  exports.lineComment = lineComment;
  exports.stringifyComment = stringifyComment;
});

// node_modules/yaml/dist/stringify/foldFlowLines.js
var require_foldFlowLines = __commonJS((exports) => {
  var FOLD_FLOW = "flow";
  var FOLD_BLOCK = "block";
  var FOLD_QUOTED = "quoted";
  function foldFlowLines(text, indent, mode = "flow", { indentAtStart, lineWidth = 80, minContentWidth = 20, onFold, onOverflow } = {}) {
    if (!lineWidth || lineWidth < 0)
      return text;
    if (lineWidth < minContentWidth)
      minContentWidth = 0;
    const endStep = Math.max(1 + minContentWidth, 1 + lineWidth - indent.length);
    if (text.length <= endStep)
      return text;
    const folds = [];
    const escapedFolds = {};
    let end = lineWidth - indent.length;
    if (typeof indentAtStart === "number") {
      if (indentAtStart > lineWidth - Math.max(2, minContentWidth))
        folds.push(0);
      else
        end = lineWidth - indentAtStart;
    }
    let split = undefined;
    let prev = undefined;
    let overflow = false;
    let i = -1;
    let escStart = -1;
    let escEnd = -1;
    if (mode === FOLD_BLOCK) {
      i = consumeMoreIndentedLines(text, i, indent.length);
      if (i !== -1)
        end = i + endStep;
    }
    for (let ch;ch = text[i += 1]; ) {
      if (mode === FOLD_QUOTED && ch === "\\") {
        escStart = i;
        switch (text[i + 1]) {
          case "x":
            i += 3;
            break;
          case "u":
            i += 5;
            break;
          case "U":
            i += 9;
            break;
          default:
            i += 1;
        }
        escEnd = i;
      }
      if (ch === `
`) {
        if (mode === FOLD_BLOCK)
          i = consumeMoreIndentedLines(text, i, indent.length);
        end = i + indent.length + endStep;
        split = undefined;
      } else {
        if (ch === " " && prev && prev !== " " && prev !== `
` && prev !== "\t") {
          const next = text[i + 1];
          if (next && next !== " " && next !== `
` && next !== "\t")
            split = i;
        }
        if (i >= end) {
          if (split) {
            folds.push(split);
            end = split + endStep;
            split = undefined;
          } else if (mode === FOLD_QUOTED) {
            while (prev === " " || prev === "\t") {
              prev = ch;
              ch = text[i += 1];
              overflow = true;
            }
            const j2 = i > escEnd + 1 ? i - 2 : escStart - 1;
            if (escapedFolds[j2])
              return text;
            folds.push(j2);
            escapedFolds[j2] = true;
            end = j2 + endStep;
            split = undefined;
          } else {
            overflow = true;
          }
        }
      }
      prev = ch;
    }
    if (overflow && onOverflow)
      onOverflow();
    if (folds.length === 0)
      return text;
    if (onFold)
      onFold();
    let res = text.slice(0, folds[0]);
    for (let i2 = 0;i2 < folds.length; ++i2) {
      const fold = folds[i2];
      const end2 = folds[i2 + 1] || text.length;
      if (fold === 0)
        res = `
${indent}${text.slice(0, end2)}`;
      else {
        if (mode === FOLD_QUOTED && escapedFolds[fold])
          res += `${text[fold]}\\`;
        res += `
${indent}${text.slice(fold + 1, end2)}`;
      }
    }
    return res;
  }
  function consumeMoreIndentedLines(text, i, indent) {
    let end = i;
    let start = i + 1;
    let ch = text[start];
    while (ch === " " || ch === "\t") {
      if (i < start + indent) {
        ch = text[++i];
      } else {
        do {
          ch = text[++i];
        } while (ch && ch !== `
`);
        end = i;
        start = i + 1;
        ch = text[start];
      }
    }
    return end;
  }
  exports.FOLD_BLOCK = FOLD_BLOCK;
  exports.FOLD_FLOW = FOLD_FLOW;
  exports.FOLD_QUOTED = FOLD_QUOTED;
  exports.foldFlowLines = foldFlowLines;
});

// node_modules/yaml/dist/stringify/stringifyString.js
var require_stringifyString = __commonJS((exports) => {
  var Scalar = require_Scalar();
  var foldFlowLines = require_foldFlowLines();
  var getFoldOptions = (ctx, isBlock) => ({
    indentAtStart: isBlock ? ctx.indent.length : ctx.indentAtStart,
    lineWidth: ctx.options.lineWidth,
    minContentWidth: ctx.options.minContentWidth
  });
  var containsDocumentMarker = (str) => /^(%|---|\.\.\.)/m.test(str);
  function lineLengthOverLimit(str, lineWidth, indentLength) {
    if (!lineWidth || lineWidth < 0)
      return false;
    const limit = lineWidth - indentLength;
    const strLen = str.length;
    if (strLen <= limit)
      return false;
    for (let i = 0, start = 0;i < strLen; ++i) {
      if (str[i] === `
`) {
        if (i - start > limit)
          return true;
        start = i + 1;
        if (strLen - start <= limit)
          return false;
      }
    }
    return true;
  }
  function doubleQuotedString(value, ctx) {
    const json = JSON.stringify(value);
    if (ctx.options.doubleQuotedAsJSON)
      return json;
    const { implicitKey } = ctx;
    const minMultiLineLength = ctx.options.doubleQuotedMinMultiLineLength;
    const indent = ctx.indent || (containsDocumentMarker(value) ? "  " : "");
    let str = "";
    let start = 0;
    for (let i = 0, ch = json[i];ch; ch = json[++i]) {
      if (ch === " " && json[i + 1] === "\\" && json[i + 2] === "n") {
        str += json.slice(start, i) + "\\ ";
        i += 1;
        start = i;
        ch = "\\";
      }
      if (ch === "\\")
        switch (json[i + 1]) {
          case "u":
            {
              str += json.slice(start, i);
              const code = json.substr(i + 2, 4);
              switch (code) {
                case "0000":
                  str += "\\0";
                  break;
                case "0007":
                  str += "\\a";
                  break;
                case "000b":
                  str += "\\v";
                  break;
                case "001b":
                  str += "\\e";
                  break;
                case "0085":
                  str += "\\N";
                  break;
                case "00a0":
                  str += "\\_";
                  break;
                case "2028":
                  str += "\\L";
                  break;
                case "2029":
                  str += "\\P";
                  break;
                default:
                  if (code.substr(0, 2) === "00")
                    str += "\\x" + code.substr(2);
                  else
                    str += json.substr(i, 6);
              }
              i += 5;
              start = i + 1;
            }
            break;
          case "n":
            if (implicitKey || json[i + 2] === '"' || json.length < minMultiLineLength) {
              i += 1;
            } else {
              str += json.slice(start, i) + `

`;
              while (json[i + 2] === "\\" && json[i + 3] === "n" && json[i + 4] !== '"') {
                str += `
`;
                i += 2;
              }
              str += indent;
              if (json[i + 2] === " ")
                str += "\\";
              i += 1;
              start = i + 1;
            }
            break;
          default:
            i += 1;
        }
    }
    str = start ? str + json.slice(start) : json;
    return implicitKey ? str : foldFlowLines.foldFlowLines(str, indent, foldFlowLines.FOLD_QUOTED, getFoldOptions(ctx, false));
  }
  function singleQuotedString(value, ctx) {
    if (ctx.options.singleQuote === false || ctx.implicitKey && value.includes(`
`) || /[ \t]\n|\n[ \t]/.test(value))
      return doubleQuotedString(value, ctx);
    const indent = ctx.indent || (containsDocumentMarker(value) ? "  " : "");
    const res = "'" + value.replace(/'/g, "''").replace(/\n+/g, `$&
${indent}`) + "'";
    return ctx.implicitKey ? res : foldFlowLines.foldFlowLines(res, indent, foldFlowLines.FOLD_FLOW, getFoldOptions(ctx, false));
  }
  function quotedString(value, ctx) {
    const { singleQuote } = ctx.options;
    let qs;
    if (singleQuote === false)
      qs = doubleQuotedString;
    else {
      const hasDouble = value.includes('"');
      const hasSingle = value.includes("'");
      if (hasDouble && !hasSingle)
        qs = singleQuotedString;
      else if (hasSingle && !hasDouble)
        qs = doubleQuotedString;
      else
        qs = singleQuote ? singleQuotedString : doubleQuotedString;
    }
    return qs(value, ctx);
  }
  var blockEndNewlines;
  try {
    blockEndNewlines = new RegExp(`(^|(?<!
))
+(?!
|$)`, "g");
  } catch {
    blockEndNewlines = /\n+(?!\n|$)/g;
  }
  function blockString({ comment, type, value }, ctx, onComment, onChompKeep) {
    const { blockQuote, commentString, lineWidth } = ctx.options;
    if (!blockQuote || /\n[\t ]+$/.test(value)) {
      return quotedString(value, ctx);
    }
    const indent = ctx.indent || (ctx.forceBlockIndent || containsDocumentMarker(value) ? "  " : "");
    const literal = blockQuote === "literal" ? true : blockQuote === "folded" || type === Scalar.Scalar.BLOCK_FOLDED ? false : type === Scalar.Scalar.BLOCK_LITERAL ? true : !lineLengthOverLimit(value, lineWidth, indent.length);
    if (!value)
      return literal ? `|
` : `>
`;
    let chomp;
    let endStart;
    for (endStart = value.length;endStart > 0; --endStart) {
      const ch = value[endStart - 1];
      if (ch !== `
` && ch !== "\t" && ch !== " ")
        break;
    }
    let end = value.substring(endStart);
    const endNlPos = end.indexOf(`
`);
    if (endNlPos === -1) {
      chomp = "-";
    } else if (value === end || endNlPos !== end.length - 1) {
      chomp = "+";
      if (onChompKeep)
        onChompKeep();
    } else {
      chomp = "";
    }
    if (end) {
      value = value.slice(0, -end.length);
      if (end[end.length - 1] === `
`)
        end = end.slice(0, -1);
      end = end.replace(blockEndNewlines, `$&${indent}`);
    }
    let startWithSpace = false;
    let startEnd;
    let startNlPos = -1;
    for (startEnd = 0;startEnd < value.length; ++startEnd) {
      const ch = value[startEnd];
      if (ch === " ")
        startWithSpace = true;
      else if (ch === `
`)
        startNlPos = startEnd;
      else
        break;
    }
    let start = value.substring(0, startNlPos < startEnd ? startNlPos + 1 : startEnd);
    if (start) {
      value = value.substring(start.length);
      start = start.replace(/\n+/g, `$&${indent}`);
    }
    const indentSize = indent ? "2" : "1";
    let header = (startWithSpace ? indentSize : "") + chomp;
    if (comment) {
      header += " " + commentString(comment.replace(/ ?[\r\n]+/g, " "));
      if (onComment)
        onComment();
    }
    if (!literal) {
      const foldedValue = value.replace(/\n+/g, `
$&`).replace(/(?:^|\n)([\t ].*)(?:([\n\t ]*)\n(?![\n\t ]))?/g, "$1$2").replace(/\n+/g, `$&${indent}`);
      let literalFallback = false;
      const foldOptions = getFoldOptions(ctx, true);
      if (blockQuote !== "folded" && type !== Scalar.Scalar.BLOCK_FOLDED) {
        foldOptions.onOverflow = () => {
          literalFallback = true;
        };
      }
      const body = foldFlowLines.foldFlowLines(`${start}${foldedValue}${end}`, indent, foldFlowLines.FOLD_BLOCK, foldOptions);
      if (!literalFallback)
        return `>${header}
${indent}${body}`;
    }
    value = value.replace(/\n+/g, `$&${indent}`);
    return `|${header}
${indent}${start}${value}${end}`;
  }
  function plainString(item, ctx, onComment, onChompKeep) {
    const { type, value } = item;
    const { actualString, implicitKey, indent, indentStep, inFlow } = ctx;
    if (implicitKey && value.includes(`
`) || inFlow && /[[\]{},]/.test(value)) {
      return quotedString(value, ctx);
    }
    if (/^[\n\t ,[\]{}#&*!|>'"%@`]|^[?-]$|^[?-][ \t]|[\n:][ \t]|[ \t]\n|[\n\t ]#|[\n\t :]$/.test(value)) {
      return implicitKey || inFlow || !value.includes(`
`) ? quotedString(value, ctx) : blockString(item, ctx, onComment, onChompKeep);
    }
    if (!implicitKey && !inFlow && type !== Scalar.Scalar.PLAIN && value.includes(`
`)) {
      return blockString(item, ctx, onComment, onChompKeep);
    }
    if (containsDocumentMarker(value)) {
      if (indent === "") {
        ctx.forceBlockIndent = true;
        return blockString(item, ctx, onComment, onChompKeep);
      } else if (implicitKey && indent === indentStep) {
        return quotedString(value, ctx);
      }
    }
    const str = value.replace(/\n+/g, `$&
${indent}`);
    if (actualString) {
      const test = (tag) => tag.default && tag.tag !== "tag:yaml.org,2002:str" && tag.test?.test(str);
      const { compat, tags } = ctx.doc.schema;
      if (tags.some(test) || compat?.some(test))
        return quotedString(value, ctx);
    }
    return implicitKey ? str : foldFlowLines.foldFlowLines(str, indent, foldFlowLines.FOLD_FLOW, getFoldOptions(ctx, false));
  }
  function stringifyString(item, ctx, onComment, onChompKeep) {
    const { implicitKey, inFlow } = ctx;
    const ss = typeof item.value === "string" ? item : Object.assign({}, item, { value: String(item.value) });
    let { type } = item;
    if (type !== Scalar.Scalar.QUOTE_DOUBLE) {
      if (/[\x00-\x08\x0b-\x1f\x7f-\x9f\u{D800}-\u{DFFF}]/u.test(ss.value))
        type = Scalar.Scalar.QUOTE_DOUBLE;
    }
    const _stringify = (_type) => {
      switch (_type) {
        case Scalar.Scalar.BLOCK_FOLDED:
        case Scalar.Scalar.BLOCK_LITERAL:
          return implicitKey || inFlow ? quotedString(ss.value, ctx) : blockString(ss, ctx, onComment, onChompKeep);
        case Scalar.Scalar.QUOTE_DOUBLE:
          return doubleQuotedString(ss.value, ctx);
        case Scalar.Scalar.QUOTE_SINGLE:
          return singleQuotedString(ss.value, ctx);
        case Scalar.Scalar.PLAIN:
          return plainString(ss, ctx, onComment, onChompKeep);
        default:
          return null;
      }
    };
    let res = _stringify(type);
    if (res === null) {
      const { defaultKeyType, defaultStringType } = ctx.options;
      const t = implicitKey && defaultKeyType || defaultStringType;
      res = _stringify(t);
      if (res === null)
        throw new Error(`Unsupported default string type ${t}`);
    }
    return res;
  }
  exports.stringifyString = stringifyString;
});

// node_modules/yaml/dist/stringify/stringify.js
var require_stringify = __commonJS((exports) => {
  var anchors = require_anchors();
  var identity = require_identity();
  var stringifyComment = require_stringifyComment();
  var stringifyString = require_stringifyString();
  function createStringifyContext(doc, options) {
    const opt = Object.assign({
      blockQuote: true,
      commentString: stringifyComment.stringifyComment,
      defaultKeyType: null,
      defaultStringType: "PLAIN",
      directives: null,
      doubleQuotedAsJSON: false,
      doubleQuotedMinMultiLineLength: 40,
      falseStr: "false",
      flowCollectionPadding: true,
      indentSeq: true,
      lineWidth: 80,
      minContentWidth: 20,
      nullStr: "null",
      simpleKeys: false,
      singleQuote: null,
      trailingComma: false,
      trueStr: "true",
      verifyAliasOrder: true
    }, doc.schema.toStringOptions, options);
    let inFlow;
    switch (opt.collectionStyle) {
      case "block":
        inFlow = false;
        break;
      case "flow":
        inFlow = true;
        break;
      default:
        inFlow = null;
    }
    return {
      anchors: new Set,
      doc,
      flowCollectionPadding: opt.flowCollectionPadding ? " " : "",
      indent: "",
      indentStep: typeof opt.indent === "number" ? " ".repeat(opt.indent) : "  ",
      inFlow,
      options: opt
    };
  }
  function getTagObject(tags, item) {
    if (item.tag) {
      const match = tags.filter((t) => t.tag === item.tag);
      if (match.length > 0)
        return match.find((t) => t.format === item.format) ?? match[0];
    }
    let tagObj = undefined;
    let obj;
    if (identity.isScalar(item)) {
      obj = item.value;
      let match = tags.filter((t) => t.identify?.(obj));
      if (match.length > 1) {
        const testMatch = match.filter((t) => t.test);
        if (testMatch.length > 0)
          match = testMatch;
      }
      tagObj = match.find((t) => t.format === item.format) ?? match.find((t) => !t.format);
    } else {
      obj = item;
      tagObj = tags.find((t) => t.nodeClass && obj instanceof t.nodeClass);
    }
    if (!tagObj) {
      const name = obj?.constructor?.name ?? (obj === null ? "null" : typeof obj);
      throw new Error(`Tag not resolved for ${name} value`);
    }
    return tagObj;
  }
  function stringifyProps(node, tagObj, { anchors: anchors$1, doc }) {
    if (!doc.directives)
      return "";
    const props = [];
    const anchor = (identity.isScalar(node) || identity.isCollection(node)) && node.anchor;
    if (anchor && anchors.anchorIsValid(anchor)) {
      anchors$1.add(anchor);
      props.push(`&${anchor}`);
    }
    const tag = node.tag ?? (tagObj.default ? null : tagObj.tag);
    if (tag)
      props.push(doc.directives.tagString(tag));
    return props.join(" ");
  }
  function stringify(item, ctx, onComment, onChompKeep) {
    if (identity.isPair(item))
      return item.toString(ctx, onComment, onChompKeep);
    if (identity.isAlias(item)) {
      if (ctx.doc.directives)
        return item.toString(ctx);
      if (ctx.resolvedAliases?.has(item)) {
        throw new TypeError(`Cannot stringify circular structure without alias nodes`);
      } else {
        if (ctx.resolvedAliases)
          ctx.resolvedAliases.add(item);
        else
          ctx.resolvedAliases = new Set([item]);
        item = item.resolve(ctx.doc);
      }
    }
    let tagObj = undefined;
    const node = identity.isNode(item) ? item : ctx.doc.createNode(item, { onTagObj: (o2) => tagObj = o2 });
    tagObj ?? (tagObj = getTagObject(ctx.doc.schema.tags, node));
    const props = stringifyProps(node, tagObj, ctx);
    if (props.length > 0)
      ctx.indentAtStart = (ctx.indentAtStart ?? 0) + props.length + 1;
    const str = typeof tagObj.stringify === "function" ? tagObj.stringify(node, ctx, onComment, onChompKeep) : identity.isScalar(node) ? stringifyString.stringifyString(node, ctx, onComment, onChompKeep) : node.toString(ctx, onComment, onChompKeep);
    if (!props)
      return str;
    return identity.isScalar(node) || str[0] === "{" || str[0] === "[" ? `${props} ${str}` : `${props}
${ctx.indent}${str}`;
  }
  exports.createStringifyContext = createStringifyContext;
  exports.stringify = stringify;
});

// node_modules/yaml/dist/stringify/stringifyPair.js
var require_stringifyPair = __commonJS((exports) => {
  var identity = require_identity();
  var Scalar = require_Scalar();
  var stringify = require_stringify();
  var stringifyComment = require_stringifyComment();
  function stringifyPair({ key, value }, ctx, onComment, onChompKeep) {
    const { allNullValues, doc, indent, indentStep, options: { commentString, indentSeq, simpleKeys } } = ctx;
    let keyComment = identity.isNode(key) && key.comment || null;
    if (simpleKeys) {
      if (keyComment) {
        throw new Error("With simple keys, key nodes cannot have comments");
      }
      if (identity.isCollection(key) || !identity.isNode(key) && typeof key === "object") {
        const msg = "With simple keys, collection cannot be used as a key value";
        throw new Error(msg);
      }
    }
    let explicitKey = !simpleKeys && (!key || keyComment && value == null && !ctx.inFlow || identity.isCollection(key) || (identity.isScalar(key) ? key.type === Scalar.Scalar.BLOCK_FOLDED || key.type === Scalar.Scalar.BLOCK_LITERAL : typeof key === "object"));
    ctx = Object.assign({}, ctx, {
      allNullValues: false,
      implicitKey: !explicitKey && (simpleKeys || !allNullValues),
      indent: indent + indentStep
    });
    let keyCommentDone = false;
    let chompKeep = false;
    let str = stringify.stringify(key, ctx, () => keyCommentDone = true, () => chompKeep = true);
    if (!explicitKey && !ctx.inFlow && str.length > 1024) {
      if (simpleKeys)
        throw new Error("With simple keys, single line scalar must not span more than 1024 characters");
      explicitKey = true;
    }
    if (ctx.inFlow) {
      if (allNullValues || value == null) {
        if (keyCommentDone && onComment)
          onComment();
        return str === "" ? "?" : explicitKey ? `? ${str}` : str;
      }
    } else if (allNullValues && !simpleKeys || value == null && explicitKey) {
      str = `? ${str}`;
      if (keyComment && !keyCommentDone) {
        str += stringifyComment.lineComment(str, ctx.indent, commentString(keyComment));
      } else if (chompKeep && onChompKeep)
        onChompKeep();
      return str;
    }
    if (keyCommentDone)
      keyComment = null;
    if (explicitKey) {
      if (keyComment)
        str += stringifyComment.lineComment(str, ctx.indent, commentString(keyComment));
      str = `? ${str}
${indent}:`;
    } else {
      str = `${str}:`;
      if (keyComment)
        str += stringifyComment.lineComment(str, ctx.indent, commentString(keyComment));
    }
    let vsb, vcb, valueComment;
    if (identity.isNode(value)) {
      vsb = !!value.spaceBefore;
      vcb = value.commentBefore;
      valueComment = value.comment;
    } else {
      vsb = false;
      vcb = null;
      valueComment = null;
      if (value && typeof value === "object")
        value = doc.createNode(value);
    }
    ctx.implicitKey = false;
    if (!explicitKey && !keyComment && identity.isScalar(value))
      ctx.indentAtStart = str.length + 1;
    chompKeep = false;
    if (!indentSeq && indentStep.length >= 2 && !ctx.inFlow && !explicitKey && identity.isSeq(value) && !value.flow && !value.tag && !value.anchor) {
      ctx.indent = ctx.indent.substring(2);
    }
    let valueCommentDone = false;
    const valueStr = stringify.stringify(value, ctx, () => valueCommentDone = true, () => chompKeep = true);
    let ws = " ";
    if (keyComment || vsb || vcb) {
      ws = vsb ? `
` : "";
      if (vcb) {
        const cs = commentString(vcb);
        ws += `
${stringifyComment.indentComment(cs, ctx.indent)}`;
      }
      if (valueStr === "" && !ctx.inFlow) {
        if (ws === `
` && valueComment)
          ws = `

`;
      } else {
        ws += `
${ctx.indent}`;
      }
    } else if (!explicitKey && identity.isCollection(value)) {
      const vs0 = valueStr[0];
      const nl0 = valueStr.indexOf(`
`);
      const hasNewline = nl0 !== -1;
      const flow = ctx.inFlow ?? value.flow ?? value.items.length === 0;
      if (hasNewline || !flow) {
        let hasPropsLine = false;
        if (hasNewline && (vs0 === "&" || vs0 === "!")) {
          let sp0 = valueStr.indexOf(" ");
          if (vs0 === "&" && sp0 !== -1 && sp0 < nl0 && valueStr[sp0 + 1] === "!") {
            sp0 = valueStr.indexOf(" ", sp0 + 1);
          }
          if (sp0 === -1 || nl0 < sp0)
            hasPropsLine = true;
        }
        if (!hasPropsLine)
          ws = `
${ctx.indent}`;
      }
    } else if (valueStr === "" || valueStr[0] === `
`) {
      ws = "";
    }
    str += ws + valueStr;
    if (ctx.inFlow) {
      if (valueCommentDone && onComment)
        onComment();
    } else if (valueComment && !valueCommentDone) {
      str += stringifyComment.lineComment(str, ctx.indent, commentString(valueComment));
    } else if (chompKeep && onChompKeep) {
      onChompKeep();
    }
    return str;
  }
  exports.stringifyPair = stringifyPair;
});

// node_modules/yaml/dist/log.js
var require_log = __commonJS((exports) => {
  var node_process = __require("process");
  function debug(logLevel, ...messages) {
    if (logLevel === "debug")
      console.log(...messages);
  }
  function warn(logLevel, warning) {
    if (logLevel === "debug" || logLevel === "warn") {
      if (typeof node_process.emitWarning === "function")
        node_process.emitWarning(warning);
      else
        console.warn(warning);
    }
  }
  exports.debug = debug;
  exports.warn = warn;
});

// node_modules/yaml/dist/schema/yaml-1.1/merge.js
var require_merge = __commonJS((exports) => {
  var identity = require_identity();
  var Scalar = require_Scalar();
  var MERGE_KEY = "<<";
  var merge = {
    identify: (value) => value === MERGE_KEY || typeof value === "symbol" && value.description === MERGE_KEY,
    default: "key",
    tag: "tag:yaml.org,2002:merge",
    test: /^<<$/,
    resolve: () => Object.assign(new Scalar.Scalar(Symbol(MERGE_KEY)), {
      addToJSMap: addMergeToJSMap
    }),
    stringify: () => MERGE_KEY
  };
  var isMergeKey = (ctx, key) => (merge.identify(key) || identity.isScalar(key) && (!key.type || key.type === Scalar.Scalar.PLAIN) && merge.identify(key.value)) && ctx?.doc.schema.tags.some((tag) => tag.tag === merge.tag && tag.default);
  function addMergeToJSMap(ctx, map, value) {
    const source = resolveAliasValue(ctx, value);
    if (identity.isSeq(source))
      for (const it of source.items)
        mergeValue(ctx, map, it);
    else if (Array.isArray(source))
      for (const it of source)
        mergeValue(ctx, map, it);
    else
      mergeValue(ctx, map, source);
  }
  function mergeValue(ctx, map, value) {
    const source = resolveAliasValue(ctx, value);
    if (!identity.isMap(source))
      throw new Error("Merge sources must be maps or map aliases");
    const srcMap = source.toJSON(null, ctx, Map);
    for (const [key, value2] of srcMap) {
      if (map instanceof Map) {
        if (!map.has(key))
          map.set(key, value2);
      } else if (map instanceof Set) {
        map.add(key);
      } else if (!Object.prototype.hasOwnProperty.call(map, key)) {
        Object.defineProperty(map, key, {
          value: value2,
          writable: true,
          enumerable: true,
          configurable: true
        });
      }
    }
    return map;
  }
  function resolveAliasValue(ctx, value) {
    return ctx && identity.isAlias(value) ? value.resolve(ctx.doc, ctx) : value;
  }
  exports.addMergeToJSMap = addMergeToJSMap;
  exports.isMergeKey = isMergeKey;
  exports.merge = merge;
});

// node_modules/yaml/dist/nodes/addPairToJSMap.js
var require_addPairToJSMap = __commonJS((exports) => {
  var log = require_log();
  var merge = require_merge();
  var stringify = require_stringify();
  var identity = require_identity();
  var toJS = require_toJS();
  function addPairToJSMap(ctx, map, { key, value }) {
    if (identity.isNode(key) && key.addToJSMap)
      key.addToJSMap(ctx, map, value);
    else if (merge.isMergeKey(ctx, key))
      merge.addMergeToJSMap(ctx, map, value);
    else {
      const jsKey = toJS.toJS(key, "", ctx);
      if (map instanceof Map) {
        map.set(jsKey, toJS.toJS(value, jsKey, ctx));
      } else if (map instanceof Set) {
        map.add(jsKey);
      } else {
        const stringKey = stringifyKey(key, jsKey, ctx);
        const jsValue = toJS.toJS(value, stringKey, ctx);
        if (stringKey in map)
          Object.defineProperty(map, stringKey, {
            value: jsValue,
            writable: true,
            enumerable: true,
            configurable: true
          });
        else
          map[stringKey] = jsValue;
      }
    }
    return map;
  }
  function stringifyKey(key, jsKey, ctx) {
    if (jsKey === null)
      return "";
    if (typeof jsKey !== "object")
      return String(jsKey);
    if (identity.isNode(key) && ctx?.doc) {
      const strCtx = stringify.createStringifyContext(ctx.doc, {});
      strCtx.anchors = new Set;
      for (const node of ctx.anchors.keys())
        strCtx.anchors.add(node.anchor);
      strCtx.inFlow = true;
      strCtx.inStringifyKey = true;
      const strKey = key.toString(strCtx);
      if (!ctx.mapKeyWarned) {
        let jsonStr = JSON.stringify(strKey);
        if (jsonStr.length > 40)
          jsonStr = jsonStr.substring(0, 36) + '..."';
        log.warn(ctx.doc.options.logLevel, `Keys with collection values will be stringified due to JS Object restrictions: ${jsonStr}. Set mapAsMap: true to use object keys.`);
        ctx.mapKeyWarned = true;
      }
      return strKey;
    }
    return JSON.stringify(jsKey);
  }
  exports.addPairToJSMap = addPairToJSMap;
});

// node_modules/yaml/dist/nodes/Pair.js
var require_Pair = __commonJS((exports) => {
  var createNode = require_createNode();
  var stringifyPair = require_stringifyPair();
  var addPairToJSMap = require_addPairToJSMap();
  var identity = require_identity();
  function createPair(key, value, ctx) {
    const k3 = createNode.createNode(key, undefined, ctx);
    const v2 = createNode.createNode(value, undefined, ctx);
    return new Pair(k3, v2);
  }

  class Pair {
    constructor(key, value = null) {
      Object.defineProperty(this, identity.NODE_TYPE, { value: identity.PAIR });
      this.key = key;
      this.value = value;
    }
    clone(schema) {
      let { key, value } = this;
      if (identity.isNode(key))
        key = key.clone(schema);
      if (identity.isNode(value))
        value = value.clone(schema);
      return new Pair(key, value);
    }
    toJSON(_3, ctx) {
      const pair = ctx?.mapAsMap ? new Map : {};
      return addPairToJSMap.addPairToJSMap(ctx, pair, this);
    }
    toString(ctx, onComment, onChompKeep) {
      return ctx?.doc ? stringifyPair.stringifyPair(this, ctx, onComment, onChompKeep) : JSON.stringify(this);
    }
  }
  exports.Pair = Pair;
  exports.createPair = createPair;
});

// node_modules/yaml/dist/stringify/stringifyCollection.js
var require_stringifyCollection = __commonJS((exports) => {
  var identity = require_identity();
  var stringify = require_stringify();
  var stringifyComment = require_stringifyComment();
  function stringifyCollection(collection, ctx, options) {
    const flow = ctx.inFlow ?? collection.flow;
    const stringify2 = flow ? stringifyFlowCollection : stringifyBlockCollection;
    return stringify2(collection, ctx, options);
  }
  function stringifyBlockCollection({ comment, items }, ctx, { blockItemPrefix, flowChars, itemIndent, onChompKeep, onComment }) {
    const { indent, options: { commentString } } = ctx;
    const itemCtx = Object.assign({}, ctx, { indent: itemIndent, type: null });
    let chompKeep = false;
    const lines = [];
    for (let i = 0;i < items.length; ++i) {
      const item = items[i];
      let comment2 = null;
      if (identity.isNode(item)) {
        if (!chompKeep && item.spaceBefore)
          lines.push("");
        addCommentBefore(ctx, lines, item.commentBefore, chompKeep);
        if (item.comment)
          comment2 = item.comment;
      } else if (identity.isPair(item)) {
        const ik = identity.isNode(item.key) ? item.key : null;
        if (ik) {
          if (!chompKeep && ik.spaceBefore)
            lines.push("");
          addCommentBefore(ctx, lines, ik.commentBefore, chompKeep);
        }
      }
      chompKeep = false;
      let str2 = stringify.stringify(item, itemCtx, () => comment2 = null, () => chompKeep = true);
      if (comment2)
        str2 += stringifyComment.lineComment(str2, itemIndent, commentString(comment2));
      if (chompKeep && comment2)
        chompKeep = false;
      lines.push(blockItemPrefix + str2);
    }
    let str;
    if (lines.length === 0) {
      str = flowChars.start + flowChars.end;
    } else {
      str = lines[0];
      for (let i = 1;i < lines.length; ++i) {
        const line = lines[i];
        str += line ? `
${indent}${line}` : `
`;
      }
    }
    if (comment) {
      str += `
` + stringifyComment.indentComment(commentString(comment), indent);
      if (onComment)
        onComment();
    } else if (chompKeep && onChompKeep)
      onChompKeep();
    return str;
  }
  function stringifyFlowCollection({ items }, ctx, { flowChars, itemIndent }) {
    const { indent, indentStep, flowCollectionPadding: fcPadding, options: { commentString } } = ctx;
    itemIndent += indentStep;
    const itemCtx = Object.assign({}, ctx, {
      indent: itemIndent,
      inFlow: true,
      type: null
    });
    let reqNewline = false;
    let linesAtValue = 0;
    const lines = [];
    for (let i = 0;i < items.length; ++i) {
      const item = items[i];
      let comment = null;
      if (identity.isNode(item)) {
        if (item.spaceBefore)
          lines.push("");
        addCommentBefore(ctx, lines, item.commentBefore, false);
        if (item.comment)
          comment = item.comment;
      } else if (identity.isPair(item)) {
        const ik = identity.isNode(item.key) ? item.key : null;
        if (ik) {
          if (ik.spaceBefore)
            lines.push("");
          addCommentBefore(ctx, lines, ik.commentBefore, false);
          if (ik.comment)
            reqNewline = true;
        }
        const iv = identity.isNode(item.value) ? item.value : null;
        if (iv) {
          if (iv.comment)
            comment = iv.comment;
          if (iv.commentBefore)
            reqNewline = true;
        } else if (item.value == null && ik?.comment) {
          comment = ik.comment;
        }
      }
      if (comment)
        reqNewline = true;
      let str = stringify.stringify(item, itemCtx, () => comment = null);
      reqNewline || (reqNewline = lines.length > linesAtValue || str.includes(`
`));
      if (i < items.length - 1) {
        str += ",";
      } else if (ctx.options.trailingComma) {
        if (ctx.options.lineWidth > 0) {
          reqNewline || (reqNewline = lines.reduce((sum, line) => sum + line.length + 2, 2) + (str.length + 2) > ctx.options.lineWidth);
        }
        if (reqNewline) {
          str += ",";
        }
      }
      if (comment)
        str += stringifyComment.lineComment(str, itemIndent, commentString(comment));
      lines.push(str);
      linesAtValue = lines.length;
    }
    const { start, end } = flowChars;
    if (lines.length === 0) {
      return start + end;
    } else {
      if (!reqNewline) {
        const len = lines.reduce((sum, line) => sum + line.length + 2, 2);
        reqNewline = ctx.options.lineWidth > 0 && len > ctx.options.lineWidth;
      }
      if (reqNewline) {
        let str = start;
        for (const line of lines)
          str += line ? `
${indentStep}${indent}${line}` : `
`;
        return `${str}
${indent}${end}`;
      } else {
        return `${start}${fcPadding}${lines.join(" ")}${fcPadding}${end}`;
      }
    }
  }
  function addCommentBefore({ indent, options: { commentString } }, lines, comment, chompKeep) {
    if (comment && chompKeep)
      comment = comment.replace(/^\n+/, "");
    if (comment) {
      const ic = stringifyComment.indentComment(commentString(comment), indent);
      lines.push(ic.trimStart());
    }
  }
  exports.stringifyCollection = stringifyCollection;
});

// node_modules/yaml/dist/nodes/YAMLMap.js
var require_YAMLMap = __commonJS((exports) => {
  var stringifyCollection = require_stringifyCollection();
  var addPairToJSMap = require_addPairToJSMap();
  var Collection = require_Collection();
  var identity = require_identity();
  var Pair = require_Pair();
  var Scalar = require_Scalar();
  function findPair(items, key) {
    const k3 = identity.isScalar(key) ? key.value : key;
    for (const it of items) {
      if (identity.isPair(it)) {
        if (it.key === key || it.key === k3)
          return it;
        if (identity.isScalar(it.key) && it.key.value === k3)
          return it;
      }
    }
    return;
  }

  class YAMLMap extends Collection.Collection {
    static get tagName() {
      return "tag:yaml.org,2002:map";
    }
    constructor(schema) {
      super(identity.MAP, schema);
      this.items = [];
    }
    static from(schema, obj, ctx) {
      const { keepUndefined, replacer } = ctx;
      const map = new this(schema);
      const add = (key, value) => {
        if (typeof replacer === "function")
          value = replacer.call(obj, key, value);
        else if (Array.isArray(replacer) && !replacer.includes(key))
          return;
        if (value !== undefined || keepUndefined)
          map.items.push(Pair.createPair(key, value, ctx));
      };
      if (obj instanceof Map) {
        for (const [key, value] of obj)
          add(key, value);
      } else if (obj && typeof obj === "object") {
        for (const key of Object.keys(obj))
          add(key, obj[key]);
      }
      if (typeof schema.sortMapEntries === "function") {
        map.items.sort(schema.sortMapEntries);
      }
      return map;
    }
    add(pair, overwrite) {
      let _pair;
      if (identity.isPair(pair))
        _pair = pair;
      else if (!pair || typeof pair !== "object" || !("key" in pair)) {
        _pair = new Pair.Pair(pair, pair?.value);
      } else
        _pair = new Pair.Pair(pair.key, pair.value);
      const prev = findPair(this.items, _pair.key);
      const sortEntries = this.schema?.sortMapEntries;
      if (prev) {
        if (!overwrite)
          throw new Error(`Key ${_pair.key} already set`);
        if (identity.isScalar(prev.value) && Scalar.isScalarValue(_pair.value))
          prev.value.value = _pair.value;
        else
          prev.value = _pair.value;
      } else if (sortEntries) {
        const i = this.items.findIndex((item) => sortEntries(_pair, item) < 0);
        if (i === -1)
          this.items.push(_pair);
        else
          this.items.splice(i, 0, _pair);
      } else {
        this.items.push(_pair);
      }
    }
    delete(key) {
      const it = findPair(this.items, key);
      if (!it)
        return false;
      const del = this.items.splice(this.items.indexOf(it), 1);
      return del.length > 0;
    }
    get(key, keepScalar) {
      const it = findPair(this.items, key);
      const node = it?.value;
      return (!keepScalar && identity.isScalar(node) ? node.value : node) ?? undefined;
    }
    has(key) {
      return !!findPair(this.items, key);
    }
    set(key, value) {
      this.add(new Pair.Pair(key, value), true);
    }
    toJSON(_3, ctx, Type) {
      const map = Type ? new Type : ctx?.mapAsMap ? new Map : {};
      if (ctx?.onCreate)
        ctx.onCreate(map);
      for (const item of this.items)
        addPairToJSMap.addPairToJSMap(ctx, map, item);
      return map;
    }
    toString(ctx, onComment, onChompKeep) {
      if (!ctx)
        return JSON.stringify(this);
      for (const item of this.items) {
        if (!identity.isPair(item))
          throw new Error(`Map items must all be pairs; found ${JSON.stringify(item)} instead`);
      }
      if (!ctx.allNullValues && this.hasAllNullValues(false))
        ctx = Object.assign({}, ctx, { allNullValues: true });
      return stringifyCollection.stringifyCollection(this, ctx, {
        blockItemPrefix: "",
        flowChars: { start: "{", end: "}" },
        itemIndent: ctx.indent || "",
        onChompKeep,
        onComment
      });
    }
  }
  exports.YAMLMap = YAMLMap;
  exports.findPair = findPair;
});

// node_modules/yaml/dist/schema/common/map.js
var require_map = __commonJS((exports) => {
  var identity = require_identity();
  var YAMLMap = require_YAMLMap();
  var map = {
    collection: "map",
    default: true,
    nodeClass: YAMLMap.YAMLMap,
    tag: "tag:yaml.org,2002:map",
    resolve(map2, onError) {
      if (!identity.isMap(map2))
        onError("Expected a mapping for this tag");
      return map2;
    },
    createNode: (schema, obj, ctx) => YAMLMap.YAMLMap.from(schema, obj, ctx)
  };
  exports.map = map;
});

// node_modules/yaml/dist/nodes/YAMLSeq.js
var require_YAMLSeq = __commonJS((exports) => {
  var createNode = require_createNode();
  var stringifyCollection = require_stringifyCollection();
  var Collection = require_Collection();
  var identity = require_identity();
  var Scalar = require_Scalar();
  var toJS = require_toJS();

  class YAMLSeq extends Collection.Collection {
    static get tagName() {
      return "tag:yaml.org,2002:seq";
    }
    constructor(schema) {
      super(identity.SEQ, schema);
      this.items = [];
    }
    add(value) {
      this.items.push(value);
    }
    delete(key) {
      const idx = asItemIndex(key);
      if (typeof idx !== "number")
        return false;
      const del = this.items.splice(idx, 1);
      return del.length > 0;
    }
    get(key, keepScalar) {
      const idx = asItemIndex(key);
      if (typeof idx !== "number")
        return;
      const it = this.items[idx];
      return !keepScalar && identity.isScalar(it) ? it.value : it;
    }
    has(key) {
      const idx = asItemIndex(key);
      return typeof idx === "number" && idx < this.items.length;
    }
    set(key, value) {
      const idx = asItemIndex(key);
      if (typeof idx !== "number")
        throw new Error(`Expected a valid index, not ${key}.`);
      const prev = this.items[idx];
      if (identity.isScalar(prev) && Scalar.isScalarValue(value))
        prev.value = value;
      else
        this.items[idx] = value;
    }
    toJSON(_3, ctx) {
      const seq = [];
      if (ctx?.onCreate)
        ctx.onCreate(seq);
      let i = 0;
      for (const item of this.items)
        seq.push(toJS.toJS(item, String(i++), ctx));
      return seq;
    }
    toString(ctx, onComment, onChompKeep) {
      if (!ctx)
        return JSON.stringify(this);
      return stringifyCollection.stringifyCollection(this, ctx, {
        blockItemPrefix: "- ",
        flowChars: { start: "[", end: "]" },
        itemIndent: (ctx.indent || "") + "  ",
        onChompKeep,
        onComment
      });
    }
    static from(schema, obj, ctx) {
      const { replacer } = ctx;
      const seq = new this(schema);
      if (obj && Symbol.iterator in Object(obj)) {
        let i = 0;
        for (let it of obj) {
          if (typeof replacer === "function") {
            const key = obj instanceof Set ? it : String(i++);
            it = replacer.call(obj, key, it);
          }
          seq.items.push(createNode.createNode(it, undefined, ctx));
        }
      }
      return seq;
    }
  }
  function asItemIndex(key) {
    let idx = identity.isScalar(key) ? key.value : key;
    if (idx && typeof idx === "string")
      idx = Number(idx);
    return typeof idx === "number" && Number.isInteger(idx) && idx >= 0 ? idx : null;
  }
  exports.YAMLSeq = YAMLSeq;
});

// node_modules/yaml/dist/schema/common/seq.js
var require_seq = __commonJS((exports) => {
  var identity = require_identity();
  var YAMLSeq = require_YAMLSeq();
  var seq = {
    collection: "seq",
    default: true,
    nodeClass: YAMLSeq.YAMLSeq,
    tag: "tag:yaml.org,2002:seq",
    resolve(seq2, onError) {
      if (!identity.isSeq(seq2))
        onError("Expected a sequence for this tag");
      return seq2;
    },
    createNode: (schema, obj, ctx) => YAMLSeq.YAMLSeq.from(schema, obj, ctx)
  };
  exports.seq = seq;
});

// node_modules/yaml/dist/schema/common/string.js
var require_string = __commonJS((exports) => {
  var stringifyString = require_stringifyString();
  var string = {
    identify: (value) => typeof value === "string",
    default: true,
    tag: "tag:yaml.org,2002:str",
    resolve: (str) => str,
    stringify(item, ctx, onComment, onChompKeep) {
      ctx = Object.assign({ actualString: true }, ctx);
      return stringifyString.stringifyString(item, ctx, onComment, onChompKeep);
    }
  };
  exports.string = string;
});

// node_modules/yaml/dist/schema/common/null.js
var require_null = __commonJS((exports) => {
  var Scalar = require_Scalar();
  var nullTag = {
    identify: (value) => value == null,
    createNode: () => new Scalar.Scalar(null),
    default: true,
    tag: "tag:yaml.org,2002:null",
    test: /^(?:~|[Nn]ull|NULL)?$/,
    resolve: () => new Scalar.Scalar(null),
    stringify: ({ source }, ctx) => typeof source === "string" && nullTag.test.test(source) ? source : ctx.options.nullStr
  };
  exports.nullTag = nullTag;
});

// node_modules/yaml/dist/schema/core/bool.js
var require_bool = __commonJS((exports) => {
  var Scalar = require_Scalar();
  var boolTag = {
    identify: (value) => typeof value === "boolean",
    default: true,
    tag: "tag:yaml.org,2002:bool",
    test: /^(?:[Tt]rue|TRUE|[Ff]alse|FALSE)$/,
    resolve: (str) => new Scalar.Scalar(str[0] === "t" || str[0] === "T"),
    stringify({ source, value }, ctx) {
      if (source && boolTag.test.test(source)) {
        const sv = source[0] === "t" || source[0] === "T";
        if (value === sv)
          return source;
      }
      return value ? ctx.options.trueStr : ctx.options.falseStr;
    }
  };
  exports.boolTag = boolTag;
});

// node_modules/yaml/dist/stringify/stringifyNumber.js
var require_stringifyNumber = __commonJS((exports) => {
  function stringifyNumber({ format, minFractionDigits, tag, value }) {
    if (typeof value === "bigint")
      return String(value);
    const num = typeof value === "number" ? value : Number(value);
    if (!isFinite(num))
      return isNaN(num) ? ".nan" : num < 0 ? "-.inf" : ".inf";
    let n = Object.is(value, -0) ? "-0" : JSON.stringify(value);
    if (!format && minFractionDigits && (!tag || tag === "tag:yaml.org,2002:float") && /^-?\d/.test(n) && !n.includes("e")) {
      let i = n.indexOf(".");
      if (i < 0) {
        i = n.length;
        n += ".";
      }
      let d3 = minFractionDigits - (n.length - i - 1);
      while (d3-- > 0)
        n += "0";
    }
    return n;
  }
  exports.stringifyNumber = stringifyNumber;
});

// node_modules/yaml/dist/schema/core/float.js
var require_float = __commonJS((exports) => {
  var Scalar = require_Scalar();
  var stringifyNumber = require_stringifyNumber();
  var floatNaN = {
    identify: (value) => typeof value === "number",
    default: true,
    tag: "tag:yaml.org,2002:float",
    test: /^(?:[-+]?\.(?:inf|Inf|INF)|\.nan|\.NaN|\.NAN)$/,
    resolve: (str) => str.slice(-3).toLowerCase() === "nan" ? NaN : str[0] === "-" ? Number.NEGATIVE_INFINITY : Number.POSITIVE_INFINITY,
    stringify: stringifyNumber.stringifyNumber
  };
  var floatExp = {
    identify: (value) => typeof value === "number",
    default: true,
    tag: "tag:yaml.org,2002:float",
    format: "EXP",
    test: /^[-+]?(?:\.[0-9]+|[0-9]+(?:\.[0-9]*)?)[eE][-+]?[0-9]+$/,
    resolve: (str) => parseFloat(str),
    stringify(node) {
      const num = Number(node.value);
      return isFinite(num) ? num.toExponential() : stringifyNumber.stringifyNumber(node);
    }
  };
  var float = {
    identify: (value) => typeof value === "number",
    default: true,
    tag: "tag:yaml.org,2002:float",
    test: /^[-+]?(?:\.[0-9]+|[0-9]+\.[0-9]*)$/,
    resolve(str) {
      const node = new Scalar.Scalar(parseFloat(str));
      const dot = str.indexOf(".");
      if (dot !== -1 && str[str.length - 1] === "0")
        node.minFractionDigits = str.length - dot - 1;
      return node;
    },
    stringify: stringifyNumber.stringifyNumber
  };
  exports.float = float;
  exports.floatExp = floatExp;
  exports.floatNaN = floatNaN;
});

// node_modules/yaml/dist/schema/core/int.js
var require_int = __commonJS((exports) => {
  var stringifyNumber = require_stringifyNumber();
  var intIdentify = (value) => typeof value === "bigint" || Number.isInteger(value);
  var intResolve = (str, offset, radix, { intAsBigInt }) => intAsBigInt ? BigInt(str) : parseInt(str.substring(offset), radix);
  function intStringify(node, radix, prefix) {
    const { value } = node;
    if (intIdentify(value) && value >= 0)
      return prefix + value.toString(radix);
    return stringifyNumber.stringifyNumber(node);
  }
  var intOct = {
    identify: (value) => intIdentify(value) && value >= 0,
    default: true,
    tag: "tag:yaml.org,2002:int",
    format: "OCT",
    test: /^0o[0-7]+$/,
    resolve: (str, _onError, opt) => intResolve(str, 2, 8, opt),
    stringify: (node) => intStringify(node, 8, "0o")
  };
  var int = {
    identify: intIdentify,
    default: true,
    tag: "tag:yaml.org,2002:int",
    test: /^[-+]?[0-9]+$/,
    resolve: (str, _onError, opt) => intResolve(str, 0, 10, opt),
    stringify: stringifyNumber.stringifyNumber
  };
  var intHex = {
    identify: (value) => intIdentify(value) && value >= 0,
    default: true,
    tag: "tag:yaml.org,2002:int",
    format: "HEX",
    test: /^0x[0-9a-fA-F]+$/,
    resolve: (str, _onError, opt) => intResolve(str, 2, 16, opt),
    stringify: (node) => intStringify(node, 16, "0x")
  };
  exports.int = int;
  exports.intHex = intHex;
  exports.intOct = intOct;
});

// node_modules/yaml/dist/schema/core/schema.js
var require_schema = __commonJS((exports) => {
  var map = require_map();
  var _null = require_null();
  var seq = require_seq();
  var string = require_string();
  var bool = require_bool();
  var float = require_float();
  var int = require_int();
  var schema = [
    map.map,
    seq.seq,
    string.string,
    _null.nullTag,
    bool.boolTag,
    int.intOct,
    int.int,
    int.intHex,
    float.floatNaN,
    float.floatExp,
    float.float
  ];
  exports.schema = schema;
});

// node_modules/yaml/dist/schema/json/schema.js
var require_schema2 = __commonJS((exports) => {
  var Scalar = require_Scalar();
  var map = require_map();
  var seq = require_seq();
  function intIdentify(value) {
    return typeof value === "bigint" || Number.isInteger(value);
  }
  var stringifyJSON = ({ value }) => JSON.stringify(value);
  var jsonScalars = [
    {
      identify: (value) => typeof value === "string",
      default: true,
      tag: "tag:yaml.org,2002:str",
      resolve: (str) => str,
      stringify: stringifyJSON
    },
    {
      identify: (value) => value == null,
      createNode: () => new Scalar.Scalar(null),
      default: true,
      tag: "tag:yaml.org,2002:null",
      test: /^null$/,
      resolve: () => null,
      stringify: stringifyJSON
    },
    {
      identify: (value) => typeof value === "boolean",
      default: true,
      tag: "tag:yaml.org,2002:bool",
      test: /^true$|^false$/,
      resolve: (str) => str === "true",
      stringify: stringifyJSON
    },
    {
      identify: intIdentify,
      default: true,
      tag: "tag:yaml.org,2002:int",
      test: /^-?(?:0|[1-9][0-9]*)$/,
      resolve: (str, _onError, { intAsBigInt }) => intAsBigInt ? BigInt(str) : parseInt(str, 10),
      stringify: ({ value }) => intIdentify(value) ? value.toString() : JSON.stringify(value)
    },
    {
      identify: (value) => typeof value === "number",
      default: true,
      tag: "tag:yaml.org,2002:float",
      test: /^-?(?:0|[1-9][0-9]*)(?:\.[0-9]*)?(?:[eE][-+]?[0-9]+)?$/,
      resolve: (str) => parseFloat(str),
      stringify: stringifyJSON
    }
  ];
  var jsonError = {
    default: true,
    tag: "",
    test: /^/,
    resolve(str, onError) {
      onError(`Unresolved plain scalar ${JSON.stringify(str)}`);
      return str;
    }
  };
  var schema = [map.map, seq.seq].concat(jsonScalars, jsonError);
  exports.schema = schema;
});

// node_modules/yaml/dist/schema/yaml-1.1/binary.js
var require_binary = __commonJS((exports) => {
  var node_buffer = __require("buffer");
  var Scalar = require_Scalar();
  var stringifyString = require_stringifyString();
  var binary = {
    identify: (value) => value instanceof Uint8Array,
    default: false,
    tag: "tag:yaml.org,2002:binary",
    resolve(src, onError) {
      if (typeof node_buffer.Buffer === "function") {
        return node_buffer.Buffer.from(src, "base64");
      } else if (typeof atob === "function") {
        const str = atob(src.replace(/[\n\r]/g, ""));
        const buffer = new Uint8Array(str.length);
        for (let i = 0;i < str.length; ++i)
          buffer[i] = str.charCodeAt(i);
        return buffer;
      } else {
        onError("This environment does not support reading binary tags; either Buffer or atob is required");
        return src;
      }
    },
    stringify({ comment, type, value }, ctx, onComment, onChompKeep) {
      if (!value)
        return "";
      const buf = value;
      let str;
      if (typeof node_buffer.Buffer === "function") {
        str = buf instanceof node_buffer.Buffer ? buf.toString("base64") : node_buffer.Buffer.from(buf.buffer).toString("base64");
      } else if (typeof btoa === "function") {
        let s = "";
        for (let i = 0;i < buf.length; ++i)
          s += String.fromCharCode(buf[i]);
        str = btoa(s);
      } else {
        throw new Error("This environment does not support writing binary tags; either Buffer or btoa is required");
      }
      type ?? (type = Scalar.Scalar.BLOCK_LITERAL);
      if (type !== Scalar.Scalar.QUOTE_DOUBLE) {
        const lineWidth = Math.max(ctx.options.lineWidth - ctx.indent.length, ctx.options.minContentWidth);
        const n = Math.ceil(str.length / lineWidth);
        const lines = new Array(n);
        for (let i = 0, o2 = 0;i < n; ++i, o2 += lineWidth) {
          lines[i] = str.substr(o2, lineWidth);
        }
        str = lines.join(type === Scalar.Scalar.BLOCK_LITERAL ? `
` : " ");
      }
      return stringifyString.stringifyString({ comment, type, value: str }, ctx, onComment, onChompKeep);
    }
  };
  exports.binary = binary;
});

// node_modules/yaml/dist/schema/yaml-1.1/pairs.js
var require_pairs = __commonJS((exports) => {
  var identity = require_identity();
  var Pair = require_Pair();
  var Scalar = require_Scalar();
  var YAMLSeq = require_YAMLSeq();
  function resolvePairs(seq, onError) {
    if (identity.isSeq(seq)) {
      for (let i = 0;i < seq.items.length; ++i) {
        let item = seq.items[i];
        if (identity.isPair(item))
          continue;
        else if (identity.isMap(item)) {
          if (item.items.length > 1)
            onError("Each pair must have its own sequence indicator");
          const pair = item.items[0] || new Pair.Pair(new Scalar.Scalar(null));
          if (item.commentBefore)
            pair.key.commentBefore = pair.key.commentBefore ? `${item.commentBefore}
${pair.key.commentBefore}` : item.commentBefore;
          if (item.comment) {
            const cn = pair.value ?? pair.key;
            cn.comment = cn.comment ? `${item.comment}
${cn.comment}` : item.comment;
          }
          item = pair;
        }
        seq.items[i] = identity.isPair(item) ? item : new Pair.Pair(item);
      }
    } else
      onError("Expected a sequence for this tag");
    return seq;
  }
  function createPairs(schema, iterable, ctx) {
    const { replacer } = ctx;
    const pairs2 = new YAMLSeq.YAMLSeq(schema);
    pairs2.tag = "tag:yaml.org,2002:pairs";
    let i = 0;
    if (iterable && Symbol.iterator in Object(iterable))
      for (let it of iterable) {
        if (typeof replacer === "function")
          it = replacer.call(iterable, String(i++), it);
        let key, value;
        if (Array.isArray(it)) {
          if (it.length === 2) {
            key = it[0];
            value = it[1];
          } else
            throw new TypeError(`Expected [key, value] tuple: ${it}`);
        } else if (it && it instanceof Object) {
          const keys = Object.keys(it);
          if (keys.length === 1) {
            key = keys[0];
            value = it[key];
          } else {
            throw new TypeError(`Expected tuple with one key, not ${keys.length} keys`);
          }
        } else {
          key = it;
        }
        pairs2.items.push(Pair.createPair(key, value, ctx));
      }
    return pairs2;
  }
  var pairs = {
    collection: "seq",
    default: false,
    tag: "tag:yaml.org,2002:pairs",
    resolve: resolvePairs,
    createNode: createPairs
  };
  exports.createPairs = createPairs;
  exports.pairs = pairs;
  exports.resolvePairs = resolvePairs;
});

// node_modules/yaml/dist/schema/yaml-1.1/omap.js
var require_omap = __commonJS((exports) => {
  var identity = require_identity();
  var toJS = require_toJS();
  var YAMLMap = require_YAMLMap();
  var YAMLSeq = require_YAMLSeq();
  var pairs = require_pairs();

  class YAMLOMap extends YAMLSeq.YAMLSeq {
    constructor() {
      super();
      this.add = YAMLMap.YAMLMap.prototype.add.bind(this);
      this.delete = YAMLMap.YAMLMap.prototype.delete.bind(this);
      this.get = YAMLMap.YAMLMap.prototype.get.bind(this);
      this.has = YAMLMap.YAMLMap.prototype.has.bind(this);
      this.set = YAMLMap.YAMLMap.prototype.set.bind(this);
      this.tag = YAMLOMap.tag;
    }
    toJSON(_3, ctx) {
      if (!ctx)
        return super.toJSON(_3);
      const map = new Map;
      if (ctx?.onCreate)
        ctx.onCreate(map);
      for (const pair of this.items) {
        let key, value;
        if (identity.isPair(pair)) {
          key = toJS.toJS(pair.key, "", ctx);
          value = toJS.toJS(pair.value, key, ctx);
        } else {
          key = toJS.toJS(pair, "", ctx);
        }
        if (map.has(key))
          throw new Error("Ordered maps must not include duplicate keys");
        map.set(key, value);
      }
      return map;
    }
    static from(schema, iterable, ctx) {
      const pairs$1 = pairs.createPairs(schema, iterable, ctx);
      const omap2 = new this;
      omap2.items = pairs$1.items;
      return omap2;
    }
  }
  YAMLOMap.tag = "tag:yaml.org,2002:omap";
  var omap = {
    collection: "seq",
    identify: (value) => value instanceof Map,
    nodeClass: YAMLOMap,
    default: false,
    tag: "tag:yaml.org,2002:omap",
    resolve(seq, onError) {
      const pairs$1 = pairs.resolvePairs(seq, onError);
      const seenKeys = [];
      for (const { key } of pairs$1.items) {
        if (identity.isScalar(key)) {
          if (seenKeys.includes(key.value)) {
            onError(`Ordered maps must not include duplicate keys: ${key.value}`);
          } else {
            seenKeys.push(key.value);
          }
        }
      }
      return Object.assign(new YAMLOMap, pairs$1);
    },
    createNode: (schema, iterable, ctx) => YAMLOMap.from(schema, iterable, ctx)
  };
  exports.YAMLOMap = YAMLOMap;
  exports.omap = omap;
});

// node_modules/yaml/dist/schema/yaml-1.1/bool.js
var require_bool2 = __commonJS((exports) => {
  var Scalar = require_Scalar();
  function boolStringify({ value, source }, ctx) {
    const boolObj = value ? trueTag : falseTag;
    if (source && boolObj.test.test(source))
      return source;
    return value ? ctx.options.trueStr : ctx.options.falseStr;
  }
  var trueTag = {
    identify: (value) => value === true,
    default: true,
    tag: "tag:yaml.org,2002:bool",
    test: /^(?:Y|y|[Yy]es|YES|[Tt]rue|TRUE|[Oo]n|ON)$/,
    resolve: () => new Scalar.Scalar(true),
    stringify: boolStringify
  };
  var falseTag = {
    identify: (value) => value === false,
    default: true,
    tag: "tag:yaml.org,2002:bool",
    test: /^(?:N|n|[Nn]o|NO|[Ff]alse|FALSE|[Oo]ff|OFF)$/,
    resolve: () => new Scalar.Scalar(false),
    stringify: boolStringify
  };
  exports.falseTag = falseTag;
  exports.trueTag = trueTag;
});

// node_modules/yaml/dist/schema/yaml-1.1/float.js
var require_float2 = __commonJS((exports) => {
  var Scalar = require_Scalar();
  var stringifyNumber = require_stringifyNumber();
  var floatNaN = {
    identify: (value) => typeof value === "number",
    default: true,
    tag: "tag:yaml.org,2002:float",
    test: /^(?:[-+]?\.(?:inf|Inf|INF)|\.nan|\.NaN|\.NAN)$/,
    resolve: (str) => str.slice(-3).toLowerCase() === "nan" ? NaN : str[0] === "-" ? Number.NEGATIVE_INFINITY : Number.POSITIVE_INFINITY,
    stringify: stringifyNumber.stringifyNumber
  };
  var floatExp = {
    identify: (value) => typeof value === "number",
    default: true,
    tag: "tag:yaml.org,2002:float",
    format: "EXP",
    test: /^[-+]?(?:[0-9][0-9_]*)?(?:\.[0-9_]*)?[eE][-+]?[0-9]+$/,
    resolve: (str) => parseFloat(str.replace(/_/g, "")),
    stringify(node) {
      const num = Number(node.value);
      return isFinite(num) ? num.toExponential() : stringifyNumber.stringifyNumber(node);
    }
  };
  var float = {
    identify: (value) => typeof value === "number",
    default: true,
    tag: "tag:yaml.org,2002:float",
    test: /^[-+]?(?:[0-9][0-9_]*)?\.[0-9_]*$/,
    resolve(str) {
      const node = new Scalar.Scalar(parseFloat(str.replace(/_/g, "")));
      const dot = str.indexOf(".");
      if (dot !== -1) {
        const f = str.substring(dot + 1).replace(/_/g, "");
        if (f[f.length - 1] === "0")
          node.minFractionDigits = f.length;
      }
      return node;
    },
    stringify: stringifyNumber.stringifyNumber
  };
  exports.float = float;
  exports.floatExp = floatExp;
  exports.floatNaN = floatNaN;
});

// node_modules/yaml/dist/schema/yaml-1.1/int.js
var require_int2 = __commonJS((exports) => {
  var stringifyNumber = require_stringifyNumber();
  var intIdentify = (value) => typeof value === "bigint" || Number.isInteger(value);
  function intResolve(str, offset, radix, { intAsBigInt }) {
    const sign = str[0];
    if (sign === "-" || sign === "+")
      offset += 1;
    str = str.substring(offset).replace(/_/g, "");
    if (intAsBigInt) {
      switch (radix) {
        case 2:
          str = `0b${str}`;
          break;
        case 8:
          str = `0o${str}`;
          break;
        case 16:
          str = `0x${str}`;
          break;
      }
      const n2 = BigInt(str);
      return sign === "-" ? BigInt(-1) * n2 : n2;
    }
    const n = parseInt(str, radix);
    return sign === "-" ? -1 * n : n;
  }
  function intStringify(node, radix, prefix) {
    const { value } = node;
    if (intIdentify(value)) {
      const str = value.toString(radix);
      return value < 0 ? "-" + prefix + str.substr(1) : prefix + str;
    }
    return stringifyNumber.stringifyNumber(node);
  }
  var intBin = {
    identify: intIdentify,
    default: true,
    tag: "tag:yaml.org,2002:int",
    format: "BIN",
    test: /^[-+]?0b[0-1_]+$/,
    resolve: (str, _onError, opt) => intResolve(str, 2, 2, opt),
    stringify: (node) => intStringify(node, 2, "0b")
  };
  var intOct = {
    identify: intIdentify,
    default: true,
    tag: "tag:yaml.org,2002:int",
    format: "OCT",
    test: /^[-+]?0[0-7_]+$/,
    resolve: (str, _onError, opt) => intResolve(str, 1, 8, opt),
    stringify: (node) => intStringify(node, 8, "0")
  };
  var int = {
    identify: intIdentify,
    default: true,
    tag: "tag:yaml.org,2002:int",
    test: /^[-+]?[0-9][0-9_]*$/,
    resolve: (str, _onError, opt) => intResolve(str, 0, 10, opt),
    stringify: stringifyNumber.stringifyNumber
  };
  var intHex = {
    identify: intIdentify,
    default: true,
    tag: "tag:yaml.org,2002:int",
    format: "HEX",
    test: /^[-+]?0x[0-9a-fA-F_]+$/,
    resolve: (str, _onError, opt) => intResolve(str, 2, 16, opt),
    stringify: (node) => intStringify(node, 16, "0x")
  };
  exports.int = int;
  exports.intBin = intBin;
  exports.intHex = intHex;
  exports.intOct = intOct;
});

// node_modules/yaml/dist/schema/yaml-1.1/set.js
var require_set = __commonJS((exports) => {
  var identity = require_identity();
  var Pair = require_Pair();
  var YAMLMap = require_YAMLMap();

  class YAMLSet extends YAMLMap.YAMLMap {
    constructor(schema) {
      super(schema);
      this.tag = YAMLSet.tag;
    }
    add(key) {
      let pair;
      if (identity.isPair(key))
        pair = key;
      else if (key && typeof key === "object" && "key" in key && "value" in key && key.value === null)
        pair = new Pair.Pair(key.key, null);
      else
        pair = new Pair.Pair(key, null);
      const prev = YAMLMap.findPair(this.items, pair.key);
      if (!prev)
        this.items.push(pair);
    }
    get(key, keepPair) {
      const pair = YAMLMap.findPair(this.items, key);
      return !keepPair && identity.isPair(pair) ? identity.isScalar(pair.key) ? pair.key.value : pair.key : pair;
    }
    set(key, value) {
      if (typeof value !== "boolean")
        throw new Error(`Expected boolean value for set(key, value) in a YAML set, not ${typeof value}`);
      const prev = YAMLMap.findPair(this.items, key);
      if (prev && !value) {
        this.items.splice(this.items.indexOf(prev), 1);
      } else if (!prev && value) {
        this.items.push(new Pair.Pair(key));
      }
    }
    toJSON(_3, ctx) {
      return super.toJSON(_3, ctx, Set);
    }
    toString(ctx, onComment, onChompKeep) {
      if (!ctx)
        return JSON.stringify(this);
      if (this.hasAllNullValues(true))
        return super.toString(Object.assign({}, ctx, { allNullValues: true }), onComment, onChompKeep);
      else
        throw new Error("Set items must all have null values");
    }
    static from(schema, iterable, ctx) {
      const { replacer } = ctx;
      const set2 = new this(schema);
      if (iterable && Symbol.iterator in Object(iterable))
        for (let value of iterable) {
          if (typeof replacer === "function")
            value = replacer.call(iterable, value, value);
          set2.items.push(Pair.createPair(value, null, ctx));
        }
      return set2;
    }
  }
  YAMLSet.tag = "tag:yaml.org,2002:set";
  var set = {
    collection: "map",
    identify: (value) => value instanceof Set,
    nodeClass: YAMLSet,
    default: false,
    tag: "tag:yaml.org,2002:set",
    createNode: (schema, iterable, ctx) => YAMLSet.from(schema, iterable, ctx),
    resolve(map, onError) {
      if (identity.isMap(map)) {
        if (map.hasAllNullValues(true))
          return Object.assign(new YAMLSet, map);
        else
          onError("Set items must all have null values");
      } else
        onError("Expected a mapping for this tag");
      return map;
    }
  };
  exports.YAMLSet = YAMLSet;
  exports.set = set;
});

// node_modules/yaml/dist/schema/yaml-1.1/timestamp.js
var require_timestamp = __commonJS((exports) => {
  var stringifyNumber = require_stringifyNumber();
  function parseSexagesimal(str, asBigInt) {
    const sign = str[0];
    const parts = sign === "-" || sign === "+" ? str.substring(1) : str;
    const num = (n) => asBigInt ? BigInt(n) : Number(n);
    const res = parts.replace(/_/g, "").split(":").reduce((res2, p2) => res2 * num(60) + num(p2), num(0));
    return sign === "-" ? num(-1) * res : res;
  }
  function stringifySexagesimal(node) {
    let { value } = node;
    let num = (n) => n;
    if (typeof value === "bigint")
      num = (n) => BigInt(n);
    else if (isNaN(value) || !isFinite(value))
      return stringifyNumber.stringifyNumber(node);
    let sign = "";
    if (value < 0) {
      sign = "-";
      value *= num(-1);
    }
    const _60 = num(60);
    const parts = [value % _60];
    if (value < 60) {
      parts.unshift(0);
    } else {
      value = (value - parts[0]) / _60;
      parts.unshift(value % _60);
      if (value >= 60) {
        value = (value - parts[0]) / _60;
        parts.unshift(value);
      }
    }
    return sign + parts.map((n) => String(n).padStart(2, "0")).join(":").replace(/000000\d*$/, "");
  }
  var intTime = {
    identify: (value) => typeof value === "bigint" || Number.isInteger(value),
    default: true,
    tag: "tag:yaml.org,2002:int",
    format: "TIME",
    test: /^[-+]?[0-9][0-9_]*(?::[0-5]?[0-9])+$/,
    resolve: (str, _onError, { intAsBigInt }) => parseSexagesimal(str, intAsBigInt),
    stringify: stringifySexagesimal
  };
  var floatTime = {
    identify: (value) => typeof value === "number",
    default: true,
    tag: "tag:yaml.org,2002:float",
    format: "TIME",
    test: /^[-+]?[0-9][0-9_]*(?::[0-5]?[0-9])+\.[0-9_]*$/,
    resolve: (str) => parseSexagesimal(str, false),
    stringify: stringifySexagesimal
  };
  var timestamp = {
    identify: (value) => value instanceof Date,
    default: true,
    tag: "tag:yaml.org,2002:timestamp",
    test: RegExp("^([0-9]{4})-([0-9]{1,2})-([0-9]{1,2})" + "(?:" + "(?:t|T|[ \\t]+)" + "([0-9]{1,2}):([0-9]{1,2}):([0-9]{1,2}(\\.[0-9]+)?)" + "(?:[ \\t]*(Z|[-+][012]?[0-9](?::[0-9]{2})?))?" + ")?$"),
    resolve(str) {
      const match = str.match(timestamp.test);
      if (!match)
        throw new Error("!!timestamp expects a date, starting with yyyy-mm-dd");
      const [, year, month, day, hour, minute, second] = match.map(Number);
      const millisec = match[7] ? Number((match[7] + "00").substr(1, 3)) : 0;
      let date = Date.UTC(year, month - 1, day, hour || 0, minute || 0, second || 0, millisec);
      const tz = match[8];
      if (tz && tz !== "Z") {
        let d3 = parseSexagesimal(tz, false);
        if (Math.abs(d3) < 30)
          d3 *= 60;
        date -= 60000 * d3;
      }
      return new Date(date);
    },
    stringify: ({ value }) => value?.toISOString().replace(/(T00:00:00)?\.000Z$/, "") ?? ""
  };
  exports.floatTime = floatTime;
  exports.intTime = intTime;
  exports.timestamp = timestamp;
});

// node_modules/yaml/dist/schema/yaml-1.1/schema.js
var require_schema3 = __commonJS((exports) => {
  var map = require_map();
  var _null = require_null();
  var seq = require_seq();
  var string = require_string();
  var binary = require_binary();
  var bool = require_bool2();
  var float = require_float2();
  var int = require_int2();
  var merge = require_merge();
  var omap = require_omap();
  var pairs = require_pairs();
  var set = require_set();
  var timestamp = require_timestamp();
  var schema = [
    map.map,
    seq.seq,
    string.string,
    _null.nullTag,
    bool.trueTag,
    bool.falseTag,
    int.intBin,
    int.intOct,
    int.int,
    int.intHex,
    float.floatNaN,
    float.floatExp,
    float.float,
    binary.binary,
    merge.merge,
    omap.omap,
    pairs.pairs,
    set.set,
    timestamp.intTime,
    timestamp.floatTime,
    timestamp.timestamp
  ];
  exports.schema = schema;
});

// node_modules/yaml/dist/schema/tags.js
var require_tags = __commonJS((exports) => {
  var map = require_map();
  var _null = require_null();
  var seq = require_seq();
  var string = require_string();
  var bool = require_bool();
  var float = require_float();
  var int = require_int();
  var schema = require_schema();
  var schema$1 = require_schema2();
  var binary = require_binary();
  var merge = require_merge();
  var omap = require_omap();
  var pairs = require_pairs();
  var schema$2 = require_schema3();
  var set = require_set();
  var timestamp = require_timestamp();
  var schemas = new Map([
    ["core", schema.schema],
    ["failsafe", [map.map, seq.seq, string.string]],
    ["json", schema$1.schema],
    ["yaml11", schema$2.schema],
    ["yaml-1.1", schema$2.schema]
  ]);
  var tagsByName = {
    binary: binary.binary,
    bool: bool.boolTag,
    float: float.float,
    floatExp: float.floatExp,
    floatNaN: float.floatNaN,
    floatTime: timestamp.floatTime,
    int: int.int,
    intHex: int.intHex,
    intOct: int.intOct,
    intTime: timestamp.intTime,
    map: map.map,
    merge: merge.merge,
    null: _null.nullTag,
    omap: omap.omap,
    pairs: pairs.pairs,
    seq: seq.seq,
    set: set.set,
    timestamp: timestamp.timestamp
  };
  var coreKnownTags = {
    "tag:yaml.org,2002:binary": binary.binary,
    "tag:yaml.org,2002:merge": merge.merge,
    "tag:yaml.org,2002:omap": omap.omap,
    "tag:yaml.org,2002:pairs": pairs.pairs,
    "tag:yaml.org,2002:set": set.set,
    "tag:yaml.org,2002:timestamp": timestamp.timestamp
  };
  function getTags(customTags, schemaName, addMergeTag) {
    const schemaTags = schemas.get(schemaName);
    if (schemaTags && !customTags) {
      return addMergeTag && !schemaTags.includes(merge.merge) ? schemaTags.concat(merge.merge) : schemaTags.slice();
    }
    let tags = schemaTags;
    if (!tags) {
      if (Array.isArray(customTags))
        tags = [];
      else {
        const keys = Array.from(schemas.keys()).filter((key) => key !== "yaml11").map((key) => JSON.stringify(key)).join(", ");
        throw new Error(`Unknown schema "${schemaName}"; use one of ${keys} or define customTags array`);
      }
    }
    if (Array.isArray(customTags)) {
      for (const tag of customTags)
        tags = tags.concat(tag);
    } else if (typeof customTags === "function") {
      tags = customTags(tags.slice());
    }
    if (addMergeTag)
      tags = tags.concat(merge.merge);
    return tags.reduce((tags2, tag) => {
      const tagObj = typeof tag === "string" ? tagsByName[tag] : tag;
      if (!tagObj) {
        const tagName = JSON.stringify(tag);
        const keys = Object.keys(tagsByName).map((key) => JSON.stringify(key)).join(", ");
        throw new Error(`Unknown custom tag ${tagName}; use one of ${keys}`);
      }
      if (!tags2.includes(tagObj))
        tags2.push(tagObj);
      return tags2;
    }, []);
  }
  exports.coreKnownTags = coreKnownTags;
  exports.getTags = getTags;
});

// node_modules/yaml/dist/schema/Schema.js
var require_Schema = __commonJS((exports) => {
  var identity = require_identity();
  var map = require_map();
  var seq = require_seq();
  var string = require_string();
  var tags = require_tags();
  var sortMapEntriesByKey = (a, b3) => a.key < b3.key ? -1 : a.key > b3.key ? 1 : 0;

  class Schema {
    constructor({ compat, customTags, merge, resolveKnownTags, schema, sortMapEntries, toStringDefaults }) {
      this.compat = Array.isArray(compat) ? tags.getTags(compat, "compat") : compat ? tags.getTags(null, compat) : null;
      this.name = typeof schema === "string" && schema || "core";
      this.knownTags = resolveKnownTags ? tags.coreKnownTags : {};
      this.tags = tags.getTags(customTags, this.name, merge);
      this.toStringOptions = toStringDefaults ?? null;
      Object.defineProperty(this, identity.MAP, { value: map.map });
      Object.defineProperty(this, identity.SCALAR, { value: string.string });
      Object.defineProperty(this, identity.SEQ, { value: seq.seq });
      this.sortMapEntries = typeof sortMapEntries === "function" ? sortMapEntries : sortMapEntries === true ? sortMapEntriesByKey : null;
    }
    clone() {
      const copy = Object.create(Schema.prototype, Object.getOwnPropertyDescriptors(this));
      copy.tags = this.tags.slice();
      return copy;
    }
  }
  exports.Schema = Schema;
});

// node_modules/yaml/dist/stringify/stringifyDocument.js
var require_stringifyDocument = __commonJS((exports) => {
  var identity = require_identity();
  var stringify = require_stringify();
  var stringifyComment = require_stringifyComment();
  function stringifyDocument(doc, options) {
    const lines = [];
    let hasDirectives = options.directives === true;
    if (options.directives !== false && doc.directives) {
      const dir = doc.directives.toString(doc);
      if (dir) {
        lines.push(dir);
        hasDirectives = true;
      } else if (doc.directives.docStart)
        hasDirectives = true;
    }
    if (hasDirectives)
      lines.push("---");
    const ctx = stringify.createStringifyContext(doc, options);
    const { commentString } = ctx.options;
    if (doc.commentBefore) {
      if (lines.length !== 1)
        lines.unshift("");
      const cs = commentString(doc.commentBefore);
      lines.unshift(stringifyComment.indentComment(cs, ""));
    }
    let chompKeep = false;
    let contentComment = null;
    if (doc.contents) {
      if (identity.isNode(doc.contents)) {
        if (doc.contents.spaceBefore && hasDirectives)
          lines.push("");
        if (doc.contents.commentBefore) {
          const cs = commentString(doc.contents.commentBefore);
          lines.push(stringifyComment.indentComment(cs, ""));
        }
        ctx.forceBlockIndent = !!doc.comment;
        contentComment = doc.contents.comment;
      }
      const onChompKeep = contentComment ? undefined : () => chompKeep = true;
      let body = stringify.stringify(doc.contents, ctx, () => contentComment = null, onChompKeep);
      if (contentComment)
        body += stringifyComment.lineComment(body, "", commentString(contentComment));
      if ((body[0] === "|" || body[0] === ">") && lines[lines.length - 1] === "---") {
        lines[lines.length - 1] = `--- ${body}`;
      } else
        lines.push(body);
    } else {
      lines.push(stringify.stringify(doc.contents, ctx));
    }
    if (doc.directives?.docEnd) {
      if (doc.comment) {
        const cs = commentString(doc.comment);
        if (cs.includes(`
`)) {
          lines.push("...");
          lines.push(stringifyComment.indentComment(cs, ""));
        } else {
          lines.push(`... ${cs}`);
        }
      } else {
        lines.push("...");
      }
    } else {
      let dc = doc.comment;
      if (dc && chompKeep)
        dc = dc.replace(/^\n+/, "");
      if (dc) {
        if ((!chompKeep || contentComment) && lines[lines.length - 1] !== "")
          lines.push("");
        lines.push(stringifyComment.indentComment(commentString(dc), ""));
      }
    }
    return lines.join(`
`) + `
`;
  }
  exports.stringifyDocument = stringifyDocument;
});

// node_modules/yaml/dist/doc/Document.js
var require_Document = __commonJS((exports) => {
  var Alias = require_Alias();
  var Collection = require_Collection();
  var identity = require_identity();
  var Pair = require_Pair();
  var toJS = require_toJS();
  var Schema = require_Schema();
  var stringifyDocument = require_stringifyDocument();
  var anchors = require_anchors();
  var applyReviver = require_applyReviver();
  var createNode = require_createNode();
  var directives = require_directives();

  class Document {
    constructor(value, replacer, options) {
      this.commentBefore = null;
      this.comment = null;
      this.errors = [];
      this.warnings = [];
      Object.defineProperty(this, identity.NODE_TYPE, { value: identity.DOC });
      let _replacer = null;
      if (typeof replacer === "function" || Array.isArray(replacer)) {
        _replacer = replacer;
      } else if (options === undefined && replacer) {
        options = replacer;
        replacer = undefined;
      }
      const opt = Object.assign({
        intAsBigInt: false,
        keepSourceTokens: false,
        logLevel: "warn",
        prettyErrors: true,
        strict: true,
        stringKeys: false,
        uniqueKeys: true,
        version: "1.2"
      }, options);
      this.options = opt;
      let { version } = opt;
      if (options?._directives) {
        this.directives = options._directives.atDocument();
        if (this.directives.yaml.explicit)
          version = this.directives.yaml.version;
      } else
        this.directives = new directives.Directives({ version });
      this.setSchema(version, options);
      this.contents = value === undefined ? null : this.createNode(value, _replacer, options);
    }
    clone() {
      const copy = Object.create(Document.prototype, {
        [identity.NODE_TYPE]: { value: identity.DOC }
      });
      copy.commentBefore = this.commentBefore;
      copy.comment = this.comment;
      copy.errors = this.errors.slice();
      copy.warnings = this.warnings.slice();
      copy.options = Object.assign({}, this.options);
      if (this.directives)
        copy.directives = this.directives.clone();
      copy.schema = this.schema.clone();
      copy.contents = identity.isNode(this.contents) ? this.contents.clone(copy.schema) : this.contents;
      if (this.range)
        copy.range = this.range.slice();
      return copy;
    }
    add(value) {
      if (assertCollection(this.contents))
        this.contents.add(value);
    }
    addIn(path, value) {
      if (assertCollection(this.contents))
        this.contents.addIn(path, value);
    }
    createAlias(node, name) {
      if (!node.anchor) {
        const prev = anchors.anchorNames(this);
        node.anchor = !name || prev.has(name) ? anchors.findNewAnchor(name || "a", prev) : name;
      }
      return new Alias.Alias(node.anchor);
    }
    createNode(value, replacer, options) {
      let _replacer = undefined;
      if (typeof replacer === "function") {
        value = replacer.call({ "": value }, "", value);
        _replacer = replacer;
      } else if (Array.isArray(replacer)) {
        const keyToStr = (v2) => typeof v2 === "number" || v2 instanceof String || v2 instanceof Number;
        const asStr = replacer.filter(keyToStr).map(String);
        if (asStr.length > 0)
          replacer = replacer.concat(asStr);
        _replacer = replacer;
      } else if (options === undefined && replacer) {
        options = replacer;
        replacer = undefined;
      }
      const { aliasDuplicateObjects, anchorPrefix, flow, keepUndefined, onTagObj, tag } = options ?? {};
      const { onAnchor, setAnchors, sourceObjects } = anchors.createNodeAnchors(this, anchorPrefix || "a");
      const ctx = {
        aliasDuplicateObjects: aliasDuplicateObjects ?? true,
        keepUndefined: keepUndefined ?? false,
        onAnchor,
        onTagObj,
        replacer: _replacer,
        schema: this.schema,
        sourceObjects
      };
      const node = createNode.createNode(value, tag, ctx);
      if (flow && identity.isCollection(node))
        node.flow = true;
      setAnchors();
      return node;
    }
    createPair(key, value, options = {}) {
      const k3 = this.createNode(key, null, options);
      const v2 = this.createNode(value, null, options);
      return new Pair.Pair(k3, v2);
    }
    delete(key) {
      return assertCollection(this.contents) ? this.contents.delete(key) : false;
    }
    deleteIn(path) {
      if (Collection.isEmptyPath(path)) {
        if (this.contents == null)
          return false;
        this.contents = null;
        return true;
      }
      return assertCollection(this.contents) ? this.contents.deleteIn(path) : false;
    }
    get(key, keepScalar) {
      return identity.isCollection(this.contents) ? this.contents.get(key, keepScalar) : undefined;
    }
    getIn(path, keepScalar) {
      if (Collection.isEmptyPath(path))
        return !keepScalar && identity.isScalar(this.contents) ? this.contents.value : this.contents;
      return identity.isCollection(this.contents) ? this.contents.getIn(path, keepScalar) : undefined;
    }
    has(key) {
      return identity.isCollection(this.contents) ? this.contents.has(key) : false;
    }
    hasIn(path) {
      if (Collection.isEmptyPath(path))
        return this.contents !== undefined;
      return identity.isCollection(this.contents) ? this.contents.hasIn(path) : false;
    }
    set(key, value) {
      if (this.contents == null) {
        this.contents = Collection.collectionFromPath(this.schema, [key], value);
      } else if (assertCollection(this.contents)) {
        this.contents.set(key, value);
      }
    }
    setIn(path, value) {
      if (Collection.isEmptyPath(path)) {
        this.contents = value;
      } else if (this.contents == null) {
        this.contents = Collection.collectionFromPath(this.schema, Array.from(path), value);
      } else if (assertCollection(this.contents)) {
        this.contents.setIn(path, value);
      }
    }
    setSchema(version, options = {}) {
      if (typeof version === "number")
        version = String(version);
      let opt;
      switch (version) {
        case "1.1":
          if (this.directives)
            this.directives.yaml.version = "1.1";
          else
            this.directives = new directives.Directives({ version: "1.1" });
          opt = { resolveKnownTags: false, schema: "yaml-1.1" };
          break;
        case "1.2":
        case "next":
          if (this.directives)
            this.directives.yaml.version = version;
          else
            this.directives = new directives.Directives({ version });
          opt = { resolveKnownTags: true, schema: "core" };
          break;
        case null:
          if (this.directives)
            delete this.directives;
          opt = null;
          break;
        default: {
          const sv = JSON.stringify(version);
          throw new Error(`Expected '1.1', '1.2' or null as first argument, but found: ${sv}`);
        }
      }
      if (options.schema instanceof Object)
        this.schema = options.schema;
      else if (opt)
        this.schema = new Schema.Schema(Object.assign(opt, options));
      else
        throw new Error(`With a null YAML version, the { schema: Schema } option is required`);
    }
    toJS({ json, jsonArg, mapAsMap, maxAliasCount, onAnchor, reviver } = {}) {
      const ctx = {
        anchors: new Map,
        doc: this,
        keep: !json,
        mapAsMap: mapAsMap === true,
        mapKeyWarned: false,
        maxAliasCount: typeof maxAliasCount === "number" ? maxAliasCount : 100
      };
      const res = toJS.toJS(this.contents, jsonArg ?? "", ctx);
      if (typeof onAnchor === "function")
        for (const { count, res: res2 } of ctx.anchors.values())
          onAnchor(res2, count);
      return typeof reviver === "function" ? applyReviver.applyReviver(reviver, { "": res }, "", res) : res;
    }
    toJSON(jsonArg, onAnchor) {
      return this.toJS({ json: true, jsonArg, mapAsMap: false, onAnchor });
    }
    toString(options = {}) {
      if (this.errors.length > 0)
        throw new Error("Document with errors cannot be stringified");
      if ("indent" in options && (!Number.isInteger(options.indent) || Number(options.indent) <= 0)) {
        const s = JSON.stringify(options.indent);
        throw new Error(`"indent" option must be a positive integer, not ${s}`);
      }
      return stringifyDocument.stringifyDocument(this, options);
    }
  }
  function assertCollection(contents) {
    if (identity.isCollection(contents))
      return true;
    throw new Error("Expected a YAML collection as document contents");
  }
  exports.Document = Document;
});

// node_modules/yaml/dist/errors.js
var require_errors = __commonJS((exports) => {
  class YAMLError extends Error {
    constructor(name, pos, code, message) {
      super();
      this.name = name;
      this.code = code;
      this.message = message;
      this.pos = pos;
    }
  }

  class YAMLParseError extends YAMLError {
    constructor(pos, code, message) {
      super("YAMLParseError", pos, code, message);
    }
  }

  class YAMLWarning extends YAMLError {
    constructor(pos, code, message) {
      super("YAMLWarning", pos, code, message);
    }
  }
  var prettifyError = (src, lc) => (error) => {
    if (error.pos[0] === -1)
      return;
    error.linePos = error.pos.map((pos) => lc.linePos(pos));
    const { line, col } = error.linePos[0];
    error.message += ` at line ${line}, column ${col}`;
    let ci = col - 1;
    let lineStr = src.substring(lc.lineStarts[line - 1], lc.lineStarts[line]).replace(/[\n\r]+$/, "");
    if (ci >= 60 && lineStr.length > 80) {
      const trimStart = Math.min(ci - 39, lineStr.length - 79);
      lineStr = "\u2026" + lineStr.substring(trimStart);
      ci -= trimStart - 1;
    }
    if (lineStr.length > 80)
      lineStr = lineStr.substring(0, 79) + "\u2026";
    if (line > 1 && /^ *$/.test(lineStr.substring(0, ci))) {
      let prev = src.substring(lc.lineStarts[line - 2], lc.lineStarts[line - 1]);
      if (prev.length > 80)
        prev = prev.substring(0, 79) + `\u2026
`;
      lineStr = prev + lineStr;
    }
    if (/[^ ]/.test(lineStr)) {
      let count = 1;
      const end = error.linePos[1];
      if (end?.line === line && end.col > col) {
        count = Math.max(1, Math.min(end.col - col, 80 - ci));
      }
      const pointer = " ".repeat(ci) + "^".repeat(count);
      error.message += `:

${lineStr}
${pointer}
`;
    }
  };
  exports.YAMLError = YAMLError;
  exports.YAMLParseError = YAMLParseError;
  exports.YAMLWarning = YAMLWarning;
  exports.prettifyError = prettifyError;
});

// node_modules/yaml/dist/compose/resolve-props.js
var require_resolve_props = __commonJS((exports) => {
  function resolveProps(tokens, { flow, indicator, next, offset, onError, parentIndent, startOnNewline }) {
    let spaceBefore = false;
    let atNewline = startOnNewline;
    let hasSpace = startOnNewline;
    let comment = "";
    let commentSep = "";
    let hasNewline = false;
    let reqSpace = false;
    let tab = null;
    let anchor = null;
    let tag = null;
    let newlineAfterProp = null;
    let comma = null;
    let found = null;
    let start = null;
    for (const token of tokens) {
      if (reqSpace) {
        if (token.type !== "space" && token.type !== "newline" && token.type !== "comma")
          onError(token.offset, "MISSING_CHAR", "Tags and anchors must be separated from the next token by white space");
        reqSpace = false;
      }
      if (tab) {
        if (atNewline && token.type !== "comment" && token.type !== "newline") {
          onError(tab, "TAB_AS_INDENT", "Tabs are not allowed as indentation");
        }
        tab = null;
      }
      switch (token.type) {
        case "space":
          if (!flow && (indicator !== "doc-start" || next?.type !== "flow-collection") && token.source.includes("\t")) {
            tab = token;
          }
          hasSpace = true;
          break;
        case "comment": {
          if (!hasSpace)
            onError(token, "MISSING_CHAR", "Comments must be separated from other tokens by white space characters");
          const cb = token.source.substring(1) || " ";
          if (!comment)
            comment = cb;
          else
            comment += commentSep + cb;
          commentSep = "";
          atNewline = false;
          break;
        }
        case "newline":
          if (atNewline) {
            if (comment)
              comment += token.source;
            else if (!found || indicator !== "seq-item-ind")
              spaceBefore = true;
          } else
            commentSep += token.source;
          atNewline = true;
          hasNewline = true;
          if (anchor || tag)
            newlineAfterProp = token;
          hasSpace = true;
          break;
        case "anchor":
          if (anchor)
            onError(token, "MULTIPLE_ANCHORS", "A node can have at most one anchor");
          if (token.source.endsWith(":"))
            onError(token.offset + token.source.length - 1, "BAD_ALIAS", "Anchor ending in : is ambiguous", true);
          anchor = token;
          start ?? (start = token.offset);
          atNewline = false;
          hasSpace = false;
          reqSpace = true;
          break;
        case "tag": {
          if (tag)
            onError(token, "MULTIPLE_TAGS", "A node can have at most one tag");
          tag = token;
          start ?? (start = token.offset);
          atNewline = false;
          hasSpace = false;
          reqSpace = true;
          break;
        }
        case indicator:
          if (anchor || tag)
            onError(token, "BAD_PROP_ORDER", `Anchors and tags must be after the ${token.source} indicator`);
          if (found)
            onError(token, "UNEXPECTED_TOKEN", `Unexpected ${token.source} in ${flow ?? "collection"}`);
          found = token;
          atNewline = indicator === "seq-item-ind" || indicator === "explicit-key-ind";
          hasSpace = false;
          break;
        case "comma":
          if (flow) {
            if (comma)
              onError(token, "UNEXPECTED_TOKEN", `Unexpected , in ${flow}`);
            comma = token;
            atNewline = false;
            hasSpace = false;
            break;
          }
        default:
          onError(token, "UNEXPECTED_TOKEN", `Unexpected ${token.type} token`);
          atNewline = false;
          hasSpace = false;
      }
    }
    const last = tokens[tokens.length - 1];
    const end = last ? last.offset + last.source.length : offset;
    if (reqSpace && next && next.type !== "space" && next.type !== "newline" && next.type !== "comma" && (next.type !== "scalar" || next.source !== "")) {
      onError(next.offset, "MISSING_CHAR", "Tags and anchors must be separated from the next token by white space");
    }
    if (tab && (atNewline && tab.indent <= parentIndent || next?.type === "block-map" || next?.type === "block-seq"))
      onError(tab, "TAB_AS_INDENT", "Tabs are not allowed as indentation");
    return {
      comma,
      found,
      spaceBefore,
      comment,
      hasNewline,
      anchor,
      tag,
      newlineAfterProp,
      end,
      start: start ?? end
    };
  }
  exports.resolveProps = resolveProps;
});

// node_modules/yaml/dist/compose/util-contains-newline.js
var require_util_contains_newline = __commonJS((exports) => {
  function containsNewline(key) {
    if (!key)
      return null;
    switch (key.type) {
      case "alias":
      case "scalar":
      case "double-quoted-scalar":
      case "single-quoted-scalar":
        if (key.source.includes(`
`))
          return true;
        if (key.end) {
          for (const st of key.end)
            if (st.type === "newline")
              return true;
        }
        return false;
      case "flow-collection":
        for (const it of key.items) {
          for (const st of it.start)
            if (st.type === "newline")
              return true;
          if (it.sep) {
            for (const st of it.sep)
              if (st.type === "newline")
                return true;
          }
          if (containsNewline(it.key) || containsNewline(it.value))
            return true;
        }
        return false;
      default:
        return true;
    }
  }
  exports.containsNewline = containsNewline;
});

// node_modules/yaml/dist/compose/util-flow-indent-check.js
var require_util_flow_indent_check = __commonJS((exports) => {
  var utilContainsNewline = require_util_contains_newline();
  function flowIndentCheck(indent, fc, onError) {
    if (fc?.type === "flow-collection") {
      const end = fc.end[0];
      if (end.indent === indent && (end.source === "]" || end.source === "}") && utilContainsNewline.containsNewline(fc)) {
        const msg = "Flow end indicator should be more indented than parent";
        onError(end, "BAD_INDENT", msg, true);
      }
    }
  }
  exports.flowIndentCheck = flowIndentCheck;
});

// node_modules/yaml/dist/compose/util-map-includes.js
var require_util_map_includes = __commonJS((exports) => {
  var identity = require_identity();
  function mapIncludes(ctx, items, search) {
    const { uniqueKeys } = ctx.options;
    if (uniqueKeys === false)
      return false;
    const isEqual = typeof uniqueKeys === "function" ? uniqueKeys : (a, b3) => a === b3 || identity.isScalar(a) && identity.isScalar(b3) && a.value === b3.value;
    return items.some((pair) => isEqual(pair.key, search));
  }
  exports.mapIncludes = mapIncludes;
});

// node_modules/yaml/dist/compose/resolve-block-map.js
var require_resolve_block_map = __commonJS((exports) => {
  var Pair = require_Pair();
  var YAMLMap = require_YAMLMap();
  var resolveProps = require_resolve_props();
  var utilContainsNewline = require_util_contains_newline();
  var utilFlowIndentCheck = require_util_flow_indent_check();
  var utilMapIncludes = require_util_map_includes();
  var startColMsg = "All mapping items must start at the same column";
  function resolveBlockMap({ composeNode, composeEmptyNode }, ctx, bm, onError, tag) {
    const NodeClass = tag?.nodeClass ?? YAMLMap.YAMLMap;
    const map = new NodeClass(ctx.schema);
    if (ctx.atRoot)
      ctx.atRoot = false;
    let offset = bm.offset;
    let commentEnd = null;
    for (const collItem of bm.items) {
      const { start, key, sep, value } = collItem;
      const keyProps = resolveProps.resolveProps(start, {
        indicator: "explicit-key-ind",
        next: key ?? sep?.[0],
        offset,
        onError,
        parentIndent: bm.indent,
        startOnNewline: true
      });
      const implicitKey = !keyProps.found;
      if (implicitKey) {
        if (key) {
          if (key.type === "block-seq")
            onError(offset, "BLOCK_AS_IMPLICIT_KEY", "A block sequence may not be used as an implicit map key");
          else if ("indent" in key && key.indent !== bm.indent)
            onError(offset, "BAD_INDENT", startColMsg);
        }
        if (!keyProps.anchor && !keyProps.tag && !sep) {
          commentEnd = keyProps.end;
          if (keyProps.comment) {
            if (map.comment)
              map.comment += `
` + keyProps.comment;
            else
              map.comment = keyProps.comment;
          }
          continue;
        }
        if (keyProps.newlineAfterProp || utilContainsNewline.containsNewline(key)) {
          onError(key ?? start[start.length - 1], "MULTILINE_IMPLICIT_KEY", "Implicit keys need to be on a single line");
        }
      } else if (keyProps.found?.indent !== bm.indent) {
        onError(offset, "BAD_INDENT", startColMsg);
      }
      ctx.atKey = true;
      const keyStart = keyProps.end;
      const keyNode = key ? composeNode(ctx, key, keyProps, onError) : composeEmptyNode(ctx, keyStart, start, null, keyProps, onError);
      if (ctx.schema.compat)
        utilFlowIndentCheck.flowIndentCheck(bm.indent, key, onError);
      ctx.atKey = false;
      if (utilMapIncludes.mapIncludes(ctx, map.items, keyNode))
        onError(keyStart, "DUPLICATE_KEY", "Map keys must be unique");
      const valueProps = resolveProps.resolveProps(sep ?? [], {
        indicator: "map-value-ind",
        next: value,
        offset: keyNode.range[2],
        onError,
        parentIndent: bm.indent,
        startOnNewline: !key || key.type === "block-scalar"
      });
      offset = valueProps.end;
      if (valueProps.found) {
        if (implicitKey) {
          if (value?.type === "block-map" && !valueProps.hasNewline)
            onError(offset, "BLOCK_AS_IMPLICIT_KEY", "Nested mappings are not allowed in compact mappings");
          if (ctx.options.strict && keyProps.start < valueProps.found.offset - 1024)
            onError(keyNode.range, "KEY_OVER_1024_CHARS", "The : indicator must be at most 1024 chars after the start of an implicit block mapping key");
        }
        const valueNode = value ? composeNode(ctx, value, valueProps, onError) : composeEmptyNode(ctx, offset, sep, null, valueProps, onError);
        if (ctx.schema.compat)
          utilFlowIndentCheck.flowIndentCheck(bm.indent, value, onError);
        offset = valueNode.range[2];
        const pair = new Pair.Pair(keyNode, valueNode);
        if (ctx.options.keepSourceTokens)
          pair.srcToken = collItem;
        map.items.push(pair);
      } else {
        if (implicitKey)
          onError(keyNode.range, "MISSING_CHAR", "Implicit map keys need to be followed by map values");
        if (valueProps.comment) {
          if (keyNode.comment)
            keyNode.comment += `
` + valueProps.comment;
          else
            keyNode.comment = valueProps.comment;
        }
        const pair = new Pair.Pair(keyNode);
        if (ctx.options.keepSourceTokens)
          pair.srcToken = collItem;
        map.items.push(pair);
      }
    }
    if (commentEnd && commentEnd < offset)
      onError(commentEnd, "IMPOSSIBLE", "Map comment with trailing content");
    map.range = [bm.offset, offset, commentEnd ?? offset];
    return map;
  }
  exports.resolveBlockMap = resolveBlockMap;
});

// node_modules/yaml/dist/compose/resolve-block-seq.js
var require_resolve_block_seq = __commonJS((exports) => {
  var YAMLSeq = require_YAMLSeq();
  var resolveProps = require_resolve_props();
  var utilFlowIndentCheck = require_util_flow_indent_check();
  function resolveBlockSeq({ composeNode, composeEmptyNode }, ctx, bs, onError, tag) {
    const NodeClass = tag?.nodeClass ?? YAMLSeq.YAMLSeq;
    const seq = new NodeClass(ctx.schema);
    if (ctx.atRoot)
      ctx.atRoot = false;
    if (ctx.atKey)
      ctx.atKey = false;
    let offset = bs.offset;
    let commentEnd = null;
    for (const { start, value } of bs.items) {
      const props = resolveProps.resolveProps(start, {
        indicator: "seq-item-ind",
        next: value,
        offset,
        onError,
        parentIndent: bs.indent,
        startOnNewline: true
      });
      if (!props.found) {
        if (props.anchor || props.tag || value) {
          if (value?.type === "block-seq")
            onError(props.end, "BAD_INDENT", "All sequence items must start at the same column");
          else
            onError(offset, "MISSING_CHAR", "Sequence item without - indicator");
        } else {
          commentEnd = props.end;
          if (props.comment)
            seq.comment = props.comment;
          continue;
        }
      }
      const node = value ? composeNode(ctx, value, props, onError) : composeEmptyNode(ctx, props.end, start, null, props, onError);
      if (ctx.schema.compat)
        utilFlowIndentCheck.flowIndentCheck(bs.indent, value, onError);
      offset = node.range[2];
      seq.items.push(node);
    }
    seq.range = [bs.offset, offset, commentEnd ?? offset];
    return seq;
  }
  exports.resolveBlockSeq = resolveBlockSeq;
});

// node_modules/yaml/dist/compose/resolve-end.js
var require_resolve_end = __commonJS((exports) => {
  function resolveEnd(end, offset, reqSpace, onError) {
    let comment = "";
    if (end) {
      let hasSpace = false;
      let sep = "";
      for (const token of end) {
        const { source, type } = token;
        switch (type) {
          case "space":
            hasSpace = true;
            break;
          case "comment": {
            if (reqSpace && !hasSpace)
              onError(token, "MISSING_CHAR", "Comments must be separated from other tokens by white space characters");
            const cb = source.substring(1) || " ";
            if (!comment)
              comment = cb;
            else
              comment += sep + cb;
            sep = "";
            break;
          }
          case "newline":
            if (comment)
              sep += source;
            hasSpace = true;
            break;
          default:
            onError(token, "UNEXPECTED_TOKEN", `Unexpected ${type} at node end`);
        }
        offset += source.length;
      }
    }
    return { comment, offset };
  }
  exports.resolveEnd = resolveEnd;
});

// node_modules/yaml/dist/compose/resolve-flow-collection.js
var require_resolve_flow_collection = __commonJS((exports) => {
  var identity = require_identity();
  var Pair = require_Pair();
  var YAMLMap = require_YAMLMap();
  var YAMLSeq = require_YAMLSeq();
  var resolveEnd = require_resolve_end();
  var resolveProps = require_resolve_props();
  var utilContainsNewline = require_util_contains_newline();
  var utilMapIncludes = require_util_map_includes();
  var blockMsg = "Block collections are not allowed within flow collections";
  var isBlock = (token) => token && (token.type === "block-map" || token.type === "block-seq");
  function resolveFlowCollection({ composeNode, composeEmptyNode }, ctx, fc, onError, tag) {
    const isMap = fc.start.source === "{";
    const fcName = isMap ? "flow map" : "flow sequence";
    const NodeClass = tag?.nodeClass ?? (isMap ? YAMLMap.YAMLMap : YAMLSeq.YAMLSeq);
    const coll = new NodeClass(ctx.schema);
    coll.flow = true;
    const atRoot = ctx.atRoot;
    if (atRoot)
      ctx.atRoot = false;
    if (ctx.atKey)
      ctx.atKey = false;
    let offset = fc.offset + fc.start.source.length;
    for (let i = 0;i < fc.items.length; ++i) {
      const collItem = fc.items[i];
      const { start, key, sep, value } = collItem;
      const props = resolveProps.resolveProps(start, {
        flow: fcName,
        indicator: "explicit-key-ind",
        next: key ?? sep?.[0],
        offset,
        onError,
        parentIndent: fc.indent,
        startOnNewline: false
      });
      if (!props.found) {
        if (!props.anchor && !props.tag && !sep && !value) {
          if (i === 0 && props.comma)
            onError(props.comma, "UNEXPECTED_TOKEN", `Unexpected , in ${fcName}`);
          else if (i < fc.items.length - 1)
            onError(props.start, "UNEXPECTED_TOKEN", `Unexpected empty item in ${fcName}`);
          if (props.comment) {
            if (coll.comment)
              coll.comment += `
` + props.comment;
            else
              coll.comment = props.comment;
          }
          offset = props.end;
          continue;
        }
        if (!isMap && ctx.options.strict && utilContainsNewline.containsNewline(key))
          onError(key, "MULTILINE_IMPLICIT_KEY", "Implicit keys of flow sequence pairs need to be on a single line");
      }
      if (i === 0) {
        if (props.comma)
          onError(props.comma, "UNEXPECTED_TOKEN", `Unexpected , in ${fcName}`);
      } else {
        if (!props.comma)
          onError(props.start, "MISSING_CHAR", `Missing , between ${fcName} items`);
        if (props.comment) {
          let prevItemComment = "";
          loop:
            for (const st of start) {
              switch (st.type) {
                case "comma":
                case "space":
                  break;
                case "comment":
                  prevItemComment = st.source.substring(1);
                  break loop;
                default:
                  break loop;
              }
            }
          if (prevItemComment) {
            let prev = coll.items[coll.items.length - 1];
            if (identity.isPair(prev))
              prev = prev.value ?? prev.key;
            if (prev.comment)
              prev.comment += `
` + prevItemComment;
            else
              prev.comment = prevItemComment;
            props.comment = props.comment.substring(prevItemComment.length + 1);
          }
        }
      }
      if (!isMap && !sep && !props.found) {
        const valueNode = value ? composeNode(ctx, value, props, onError) : composeEmptyNode(ctx, props.end, sep, null, props, onError);
        coll.items.push(valueNode);
        offset = valueNode.range[2];
        if (isBlock(value))
          onError(valueNode.range, "BLOCK_IN_FLOW", blockMsg);
      } else {
        ctx.atKey = true;
        const keyStart = props.end;
        const keyNode = key ? composeNode(ctx, key, props, onError) : composeEmptyNode(ctx, keyStart, start, null, props, onError);
        if (isBlock(key))
          onError(keyNode.range, "BLOCK_IN_FLOW", blockMsg);
        ctx.atKey = false;
        const valueProps = resolveProps.resolveProps(sep ?? [], {
          flow: fcName,
          indicator: "map-value-ind",
          next: value,
          offset: keyNode.range[2],
          onError,
          parentIndent: fc.indent,
          startOnNewline: false
        });
        if (valueProps.found) {
          if (!isMap && !props.found && ctx.options.strict) {
            if (sep)
              for (const st of sep) {
                if (st === valueProps.found)
                  break;
                if (st.type === "newline") {
                  onError(st, "MULTILINE_IMPLICIT_KEY", "Implicit keys of flow sequence pairs need to be on a single line");
                  break;
                }
              }
            if (props.start < valueProps.found.offset - 1024)
              onError(valueProps.found, "KEY_OVER_1024_CHARS", "The : indicator must be at most 1024 chars after the start of an implicit flow sequence key");
          }
        } else if (value) {
          if ("source" in value && value.source?.[0] === ":")
            onError(value, "MISSING_CHAR", `Missing space after : in ${fcName}`);
          else
            onError(valueProps.start, "MISSING_CHAR", `Missing , or : between ${fcName} items`);
        }
        const valueNode = value ? composeNode(ctx, value, valueProps, onError) : valueProps.found ? composeEmptyNode(ctx, valueProps.end, sep, null, valueProps, onError) : null;
        if (valueNode) {
          if (isBlock(value))
            onError(valueNode.range, "BLOCK_IN_FLOW", blockMsg);
        } else if (valueProps.comment) {
          if (keyNode.comment)
            keyNode.comment += `
` + valueProps.comment;
          else
            keyNode.comment = valueProps.comment;
        }
        const pair = new Pair.Pair(keyNode, valueNode);
        if (ctx.options.keepSourceTokens)
          pair.srcToken = collItem;
        if (isMap) {
          const map = coll;
          if (utilMapIncludes.mapIncludes(ctx, map.items, keyNode))
            onError(keyStart, "DUPLICATE_KEY", "Map keys must be unique");
          map.items.push(pair);
        } else {
          const map = new YAMLMap.YAMLMap(ctx.schema);
          map.flow = true;
          map.items.push(pair);
          const endRange = (valueNode ?? keyNode).range;
          map.range = [keyNode.range[0], endRange[1], endRange[2]];
          coll.items.push(map);
        }
        offset = valueNode ? valueNode.range[2] : valueProps.end;
      }
    }
    const expectedEnd = isMap ? "}" : "]";
    const [ce2, ...ee] = fc.end;
    let cePos = offset;
    if (ce2?.source === expectedEnd)
      cePos = ce2.offset + ce2.source.length;
    else {
      const name = fcName[0].toUpperCase() + fcName.substring(1);
      const msg = atRoot ? `${name} must end with a ${expectedEnd}` : `${name} in block collection must be sufficiently indented and end with a ${expectedEnd}`;
      onError(offset, atRoot ? "MISSING_CHAR" : "BAD_INDENT", msg);
      if (ce2 && ce2.source.length !== 1)
        ee.unshift(ce2);
    }
    if (ee.length > 0) {
      const end = resolveEnd.resolveEnd(ee, cePos, ctx.options.strict, onError);
      if (end.comment) {
        if (coll.comment)
          coll.comment += `
` + end.comment;
        else
          coll.comment = end.comment;
      }
      coll.range = [fc.offset, cePos, end.offset];
    } else {
      coll.range = [fc.offset, cePos, cePos];
    }
    return coll;
  }
  exports.resolveFlowCollection = resolveFlowCollection;
});

// node_modules/yaml/dist/compose/compose-collection.js
var require_compose_collection = __commonJS((exports) => {
  var identity = require_identity();
  var Scalar = require_Scalar();
  var YAMLMap = require_YAMLMap();
  var YAMLSeq = require_YAMLSeq();
  var resolveBlockMap = require_resolve_block_map();
  var resolveBlockSeq = require_resolve_block_seq();
  var resolveFlowCollection = require_resolve_flow_collection();
  function resolveCollection(CN, ctx, token, onError, tagName, tag) {
    const coll = token.type === "block-map" ? resolveBlockMap.resolveBlockMap(CN, ctx, token, onError, tag) : token.type === "block-seq" ? resolveBlockSeq.resolveBlockSeq(CN, ctx, token, onError, tag) : resolveFlowCollection.resolveFlowCollection(CN, ctx, token, onError, tag);
    const Coll = coll.constructor;
    if (tagName === "!" || tagName === Coll.tagName) {
      coll.tag = Coll.tagName;
      return coll;
    }
    if (tagName)
      coll.tag = tagName;
    return coll;
  }
  function composeCollection(CN, ctx, token, props, onError) {
    const tagToken = props.tag;
    const tagName = !tagToken ? null : ctx.directives.tagName(tagToken.source, (msg) => onError(tagToken, "TAG_RESOLVE_FAILED", msg));
    if (token.type === "block-seq") {
      const { anchor, newlineAfterProp: nl } = props;
      const lastProp = anchor && tagToken ? anchor.offset > tagToken.offset ? anchor : tagToken : anchor ?? tagToken;
      if (lastProp && (!nl || nl.offset < lastProp.offset)) {
        const message = "Missing newline after block sequence props";
        onError(lastProp, "MISSING_CHAR", message);
      }
    }
    const expType = token.type === "block-map" ? "map" : token.type === "block-seq" ? "seq" : token.start.source === "{" ? "map" : "seq";
    if (!tagToken || !tagName || tagName === "!" || tagName === YAMLMap.YAMLMap.tagName && expType === "map" || tagName === YAMLSeq.YAMLSeq.tagName && expType === "seq") {
      return resolveCollection(CN, ctx, token, onError, tagName);
    }
    let tag = ctx.schema.tags.find((t) => t.tag === tagName && t.collection === expType);
    if (!tag) {
      const kt = ctx.schema.knownTags[tagName];
      if (kt?.collection === expType) {
        ctx.schema.tags.push(Object.assign({}, kt, { default: false }));
        tag = kt;
      } else {
        if (kt) {
          onError(tagToken, "BAD_COLLECTION_TYPE", `${kt.tag} used for ${expType} collection, but expects ${kt.collection ?? "scalar"}`, true);
        } else {
          onError(tagToken, "TAG_RESOLVE_FAILED", `Unresolved tag: ${tagName}`, true);
        }
        return resolveCollection(CN, ctx, token, onError, tagName);
      }
    }
    const coll = resolveCollection(CN, ctx, token, onError, tagName, tag);
    const res = tag.resolve?.(coll, (msg) => onError(tagToken, "TAG_RESOLVE_FAILED", msg), ctx.options) ?? coll;
    const node = identity.isNode(res) ? res : new Scalar.Scalar(res);
    node.range = coll.range;
    node.tag = tagName;
    if (tag?.format)
      node.format = tag.format;
    return node;
  }
  exports.composeCollection = composeCollection;
});

// node_modules/yaml/dist/compose/resolve-block-scalar.js
var require_resolve_block_scalar = __commonJS((exports) => {
  var Scalar = require_Scalar();
  function resolveBlockScalar(ctx, scalar, onError) {
    const start = scalar.offset;
    const header = parseBlockScalarHeader(scalar, ctx.options.strict, onError);
    if (!header)
      return { value: "", type: null, comment: "", range: [start, start, start] };
    const type = header.mode === ">" ? Scalar.Scalar.BLOCK_FOLDED : Scalar.Scalar.BLOCK_LITERAL;
    const lines = scalar.source ? splitLines(scalar.source) : [];
    let chompStart = lines.length;
    for (let i = lines.length - 1;i >= 0; --i) {
      const content = lines[i][1];
      if (content === "" || content === "\r")
        chompStart = i;
      else
        break;
    }
    if (chompStart === 0) {
      const value2 = header.chomp === "+" && lines.length > 0 ? `
`.repeat(Math.max(1, lines.length - 1)) : "";
      let end2 = start + header.length;
      if (scalar.source)
        end2 += scalar.source.length;
      return { value: value2, type, comment: header.comment, range: [start, end2, end2] };
    }
    let trimIndent = scalar.indent + header.indent;
    let offset = scalar.offset + header.length;
    let contentStart = 0;
    for (let i = 0;i < chompStart; ++i) {
      const [indent, content] = lines[i];
      if (content === "" || content === "\r") {
        if (header.indent === 0 && indent.length > trimIndent)
          trimIndent = indent.length;
      } else {
        if (indent.length < trimIndent) {
          const message = "Block scalars with more-indented leading empty lines must use an explicit indentation indicator";
          onError(offset + indent.length, "MISSING_CHAR", message);
        }
        if (header.indent === 0)
          trimIndent = indent.length;
        contentStart = i;
        if (trimIndent === 0 && !ctx.atRoot) {
          const message = "Block scalar values in collections must be indented";
          onError(offset, "BAD_INDENT", message);
        }
        break;
      }
      offset += indent.length + content.length + 1;
    }
    for (let i = lines.length - 1;i >= chompStart; --i) {
      if (lines[i][0].length > trimIndent)
        chompStart = i + 1;
    }
    let value = "";
    let sep = "";
    let prevMoreIndented = false;
    for (let i = 0;i < contentStart; ++i)
      value += lines[i][0].slice(trimIndent) + `
`;
    for (let i = contentStart;i < chompStart; ++i) {
      let [indent, content] = lines[i];
      offset += indent.length + content.length + 1;
      const crlf = content[content.length - 1] === "\r";
      if (crlf)
        content = content.slice(0, -1);
      if (content && indent.length < trimIndent) {
        const src = header.indent ? "explicit indentation indicator" : "first line";
        const message = `Block scalar lines must not be less indented than their ${src}`;
        onError(offset - content.length - (crlf ? 2 : 1), "BAD_INDENT", message);
        indent = "";
      }
      if (type === Scalar.Scalar.BLOCK_LITERAL) {
        value += sep + indent.slice(trimIndent) + content;
        sep = `
`;
      } else if (indent.length > trimIndent || content[0] === "\t") {
        if (sep === " ")
          sep = `
`;
        else if (!prevMoreIndented && sep === `
`)
          sep = `

`;
        value += sep + indent.slice(trimIndent) + content;
        sep = `
`;
        prevMoreIndented = true;
      } else if (content === "") {
        if (sep === `
`)
          value += `
`;
        else
          sep = `
`;
      } else {
        value += sep + content;
        sep = " ";
        prevMoreIndented = false;
      }
    }
    switch (header.chomp) {
      case "-":
        break;
      case "+":
        for (let i = chompStart;i < lines.length; ++i)
          value += `
` + lines[i][0].slice(trimIndent);
        if (value[value.length - 1] !== `
`)
          value += `
`;
        break;
      default:
        value += `
`;
    }
    const end = start + header.length + scalar.source.length;
    return { value, type, comment: header.comment, range: [start, end, end] };
  }
  function parseBlockScalarHeader({ offset, props }, strict, onError) {
    if (props[0].type !== "block-scalar-header") {
      onError(props[0], "IMPOSSIBLE", "Block scalar header not found");
      return null;
    }
    const { source } = props[0];
    const mode = source[0];
    let indent = 0;
    let chomp = "";
    let error = -1;
    for (let i = 1;i < source.length; ++i) {
      const ch = source[i];
      if (!chomp && (ch === "-" || ch === "+"))
        chomp = ch;
      else {
        const n = Number(ch);
        if (!indent && n)
          indent = n;
        else if (error === -1)
          error = offset + i;
      }
    }
    if (error !== -1)
      onError(error, "UNEXPECTED_TOKEN", `Block scalar header includes extra characters: ${source}`);
    let hasSpace = false;
    let comment = "";
    let length = source.length;
    for (let i = 1;i < props.length; ++i) {
      const token = props[i];
      switch (token.type) {
        case "space":
          hasSpace = true;
        case "newline":
          length += token.source.length;
          break;
        case "comment":
          if (strict && !hasSpace) {
            const message = "Comments must be separated from other tokens by white space characters";
            onError(token, "MISSING_CHAR", message);
          }
          length += token.source.length;
          comment = token.source.substring(1);
          break;
        case "error":
          onError(token, "UNEXPECTED_TOKEN", token.message);
          length += token.source.length;
          break;
        default: {
          const message = `Unexpected token in block scalar header: ${token.type}`;
          onError(token, "UNEXPECTED_TOKEN", message);
          const ts = token.source;
          if (ts && typeof ts === "string")
            length += ts.length;
        }
      }
    }
    return { mode, indent, chomp, comment, length };
  }
  function splitLines(source) {
    const split = source.split(/\n( *)/);
    const first = split[0];
    const m2 = first.match(/^( *)/);
    const line0 = m2?.[1] ? [m2[1], first.slice(m2[1].length)] : ["", first];
    const lines = [line0];
    for (let i = 1;i < split.length; i += 2)
      lines.push([split[i], split[i + 1]]);
    return lines;
  }
  exports.resolveBlockScalar = resolveBlockScalar;
});

// node_modules/yaml/dist/compose/resolve-flow-scalar.js
var require_resolve_flow_scalar = __commonJS((exports) => {
  var Scalar = require_Scalar();
  var resolveEnd = require_resolve_end();
  function resolveFlowScalar(scalar, strict, onError) {
    const { offset, type, source, end } = scalar;
    let _type;
    let value;
    const _onError = (rel, code, msg) => onError(offset + rel, code, msg);
    switch (type) {
      case "scalar":
        _type = Scalar.Scalar.PLAIN;
        value = plainValue(source, _onError);
        break;
      case "single-quoted-scalar":
        _type = Scalar.Scalar.QUOTE_SINGLE;
        value = singleQuotedValue(source, _onError);
        break;
      case "double-quoted-scalar":
        _type = Scalar.Scalar.QUOTE_DOUBLE;
        value = doubleQuotedValue(source, _onError);
        break;
      default:
        onError(scalar, "UNEXPECTED_TOKEN", `Expected a flow scalar value, but found: ${type}`);
        return {
          value: "",
          type: null,
          comment: "",
          range: [offset, offset + source.length, offset + source.length]
        };
    }
    const valueEnd = offset + source.length;
    const re = resolveEnd.resolveEnd(end, valueEnd, strict, onError);
    return {
      value,
      type: _type,
      comment: re.comment,
      range: [offset, valueEnd, re.offset]
    };
  }
  function plainValue(source, onError) {
    let badChar = "";
    switch (source[0]) {
      case "\t":
        badChar = "a tab character";
        break;
      case ",":
        badChar = "flow indicator character ,";
        break;
      case "%":
        badChar = "directive indicator character %";
        break;
      case "|":
      case ">": {
        badChar = `block scalar indicator ${source[0]}`;
        break;
      }
      case "@":
      case "`": {
        badChar = `reserved character ${source[0]}`;
        break;
      }
    }
    if (badChar)
      onError(0, "BAD_SCALAR_START", `Plain value cannot start with ${badChar}`);
    return foldLines(source);
  }
  function singleQuotedValue(source, onError) {
    if (source[source.length - 1] !== "'" || source.length === 1)
      onError(source.length, "MISSING_CHAR", "Missing closing 'quote");
    return foldLines(source.slice(1, -1)).replace(/''/g, "'");
  }
  function foldLines(source) {
    let first, line;
    try {
      first = new RegExp(`(.*?)(?<![ 	])[ 	]*\r?
`, "sy");
      line = new RegExp(`[ 	]*(.*?)(?:(?<![ 	])[ 	]*)?\r?
`, "sy");
    } catch {
      first = /(.*?)[ \t]*\r?\n/sy;
      line = /[ \t]*(.*?)[ \t]*\r?\n/sy;
    }
    let match = first.exec(source);
    if (!match)
      return source;
    let res = match[1];
    let sep = " ";
    let pos = first.lastIndex;
    line.lastIndex = pos;
    while (match = line.exec(source)) {
      if (match[1] === "") {
        if (sep === `
`)
          res += sep;
        else
          sep = `
`;
      } else {
        res += sep + match[1];
        sep = " ";
      }
      pos = line.lastIndex;
    }
    const last = /[ \t]*(.*)/sy;
    last.lastIndex = pos;
    match = last.exec(source);
    return res + sep + (match?.[1] ?? "");
  }
  function doubleQuotedValue(source, onError) {
    let res = "";
    for (let i = 1;i < source.length - 1; ++i) {
      const ch = source[i];
      if (ch === "\r" && source[i + 1] === `
`)
        continue;
      if (ch === `
`) {
        const { fold, offset } = foldNewline(source, i);
        res += fold;
        i = offset;
      } else if (ch === "\\") {
        let next = source[++i];
        const cc = escapeCodes[next];
        if (cc)
          res += cc;
        else if (next === `
`) {
          next = source[i + 1];
          while (next === " " || next === "\t")
            next = source[++i + 1];
        } else if (next === "\r" && source[i + 1] === `
`) {
          next = source[++i + 1];
          while (next === " " || next === "\t")
            next = source[++i + 1];
        } else if (next === "x" || next === "u" || next === "U") {
          const length = next === "x" ? 2 : next === "u" ? 4 : 8;
          res += parseCharCode(source, i + 1, length, onError);
          i += length;
        } else {
          const raw = source.substr(i - 1, 2);
          onError(i - 1, "BAD_DQ_ESCAPE", `Invalid escape sequence ${raw}`);
          res += raw;
        }
      } else if (ch === " " || ch === "\t") {
        const wsStart = i;
        let next = source[i + 1];
        while (next === " " || next === "\t")
          next = source[++i + 1];
        if (next !== `
` && !(next === "\r" && source[i + 2] === `
`))
          res += i > wsStart ? source.slice(wsStart, i + 1) : ch;
      } else {
        res += ch;
      }
    }
    if (source[source.length - 1] !== '"' || source.length === 1)
      onError(source.length, "MISSING_CHAR", 'Missing closing "quote');
    return res;
  }
  function foldNewline(source, offset) {
    let fold = "";
    let ch = source[offset + 1];
    while (ch === " " || ch === "\t" || ch === `
` || ch === "\r") {
      if (ch === "\r" && source[offset + 2] !== `
`)
        break;
      if (ch === `
`)
        fold += `
`;
      offset += 1;
      ch = source[offset + 1];
    }
    if (!fold)
      fold = " ";
    return { fold, offset };
  }
  var escapeCodes = {
    "0": "\x00",
    a: "\x07",
    b: "\b",
    e: "\x1B",
    f: "\f",
    n: `
`,
    r: "\r",
    t: "\t",
    v: "\v",
    N: "\x85",
    _: "\xA0",
    L: "\u2028",
    P: "\u2029",
    " ": " ",
    '"': '"',
    "/": "/",
    "\\": "\\",
    "\t": "\t"
  };
  function parseCharCode(source, offset, length, onError) {
    const cc = source.substr(offset, length);
    const ok = cc.length === length && /^[0-9a-fA-F]+$/.test(cc);
    const code = ok ? parseInt(cc, 16) : NaN;
    try {
      return String.fromCodePoint(code);
    } catch {
      const raw = source.substr(offset - 2, length + 2);
      onError(offset - 2, "BAD_DQ_ESCAPE", `Invalid escape sequence ${raw}`);
      return raw;
    }
  }
  exports.resolveFlowScalar = resolveFlowScalar;
});

// node_modules/yaml/dist/compose/compose-scalar.js
var require_compose_scalar = __commonJS((exports) => {
  var identity = require_identity();
  var Scalar = require_Scalar();
  var resolveBlockScalar = require_resolve_block_scalar();
  var resolveFlowScalar = require_resolve_flow_scalar();
  function composeScalar(ctx, token, tagToken, onError) {
    const { value, type, comment, range } = token.type === "block-scalar" ? resolveBlockScalar.resolveBlockScalar(ctx, token, onError) : resolveFlowScalar.resolveFlowScalar(token, ctx.options.strict, onError);
    const tagName = tagToken ? ctx.directives.tagName(tagToken.source, (msg) => onError(tagToken, "TAG_RESOLVE_FAILED", msg)) : null;
    let tag;
    if (ctx.options.stringKeys && ctx.atKey) {
      tag = ctx.schema[identity.SCALAR];
    } else if (tagName)
      tag = findScalarTagByName(ctx.schema, value, tagName, tagToken, onError);
    else if (token.type === "scalar")
      tag = findScalarTagByTest(ctx, value, token, onError);
    else
      tag = ctx.schema[identity.SCALAR];
    let scalar;
    try {
      const res = tag.resolve(value, (msg) => onError(tagToken ?? token, "TAG_RESOLVE_FAILED", msg), ctx.options);
      scalar = identity.isScalar(res) ? res : new Scalar.Scalar(res);
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      onError(tagToken ?? token, "TAG_RESOLVE_FAILED", msg);
      scalar = new Scalar.Scalar(value);
    }
    scalar.range = range;
    scalar.source = value;
    if (type)
      scalar.type = type;
    if (tagName)
      scalar.tag = tagName;
    if (tag.format)
      scalar.format = tag.format;
    if (comment)
      scalar.comment = comment;
    return scalar;
  }
  function findScalarTagByName(schema, value, tagName, tagToken, onError) {
    if (tagName === "!")
      return schema[identity.SCALAR];
    const matchWithTest = [];
    for (const tag of schema.tags) {
      if (!tag.collection && tag.tag === tagName) {
        if (tag.default && tag.test)
          matchWithTest.push(tag);
        else
          return tag;
      }
    }
    for (const tag of matchWithTest)
      if (tag.test?.test(value))
        return tag;
    const kt = schema.knownTags[tagName];
    if (kt && !kt.collection) {
      schema.tags.push(Object.assign({}, kt, { default: false, test: undefined }));
      return kt;
    }
    onError(tagToken, "TAG_RESOLVE_FAILED", `Unresolved tag: ${tagName}`, tagName !== "tag:yaml.org,2002:str");
    return schema[identity.SCALAR];
  }
  function findScalarTagByTest({ atKey, directives, schema }, value, token, onError) {
    const tag = schema.tags.find((tag2) => (tag2.default === true || atKey && tag2.default === "key") && tag2.test?.test(value)) || schema[identity.SCALAR];
    if (schema.compat) {
      const compat = schema.compat.find((tag2) => tag2.default && tag2.test?.test(value)) ?? schema[identity.SCALAR];
      if (tag.tag !== compat.tag) {
        const ts = directives.tagString(tag.tag);
        const cs = directives.tagString(compat.tag);
        const msg = `Value may be parsed as either ${ts} or ${cs}`;
        onError(token, "TAG_RESOLVE_FAILED", msg, true);
      }
    }
    return tag;
  }
  exports.composeScalar = composeScalar;
});

// node_modules/yaml/dist/compose/util-empty-scalar-position.js
var require_util_empty_scalar_position = __commonJS((exports) => {
  function emptyScalarPosition(offset, before, pos) {
    if (before) {
      pos ?? (pos = before.length);
      for (let i = pos - 1;i >= 0; --i) {
        let st = before[i];
        switch (st.type) {
          case "space":
          case "comment":
          case "newline":
            offset -= st.source.length;
            continue;
        }
        st = before[++i];
        while (st?.type === "space") {
          offset += st.source.length;
          st = before[++i];
        }
        break;
      }
    }
    return offset;
  }
  exports.emptyScalarPosition = emptyScalarPosition;
});

// node_modules/yaml/dist/compose/compose-node.js
var require_compose_node = __commonJS((exports) => {
  var Alias = require_Alias();
  var identity = require_identity();
  var composeCollection = require_compose_collection();
  var composeScalar = require_compose_scalar();
  var resolveEnd = require_resolve_end();
  var utilEmptyScalarPosition = require_util_empty_scalar_position();
  var CN = { composeNode, composeEmptyNode };
  function composeNode(ctx, token, props, onError) {
    const atKey = ctx.atKey;
    const { spaceBefore, comment, anchor, tag } = props;
    let node;
    let isSrcToken = true;
    switch (token.type) {
      case "alias":
        node = composeAlias(ctx, token, onError);
        if (anchor || tag)
          onError(token, "ALIAS_PROPS", "An alias node must not specify any properties");
        break;
      case "scalar":
      case "single-quoted-scalar":
      case "double-quoted-scalar":
      case "block-scalar":
        node = composeScalar.composeScalar(ctx, token, tag, onError);
        if (anchor)
          node.anchor = anchor.source.substring(1);
        break;
      case "block-map":
      case "block-seq":
      case "flow-collection":
        try {
          node = composeCollection.composeCollection(CN, ctx, token, props, onError);
          if (anchor)
            node.anchor = anchor.source.substring(1);
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          onError(token, "RESOURCE_EXHAUSTION", message);
        }
        break;
      default: {
        const message = token.type === "error" ? token.message : `Unsupported token (type: ${token.type})`;
        onError(token, "UNEXPECTED_TOKEN", message);
        isSrcToken = false;
      }
    }
    node ?? (node = composeEmptyNode(ctx, token.offset, undefined, null, props, onError));
    if (anchor && node.anchor === "")
      onError(anchor, "BAD_ALIAS", "Anchor cannot be an empty string");
    if (atKey && ctx.options.stringKeys && (!identity.isScalar(node) || typeof node.value !== "string" || node.tag && node.tag !== "tag:yaml.org,2002:str")) {
      const msg = "With stringKeys, all keys must be strings";
      onError(tag ?? token, "NON_STRING_KEY", msg);
    }
    if (spaceBefore)
      node.spaceBefore = true;
    if (comment) {
      if (token.type === "scalar" && token.source === "")
        node.comment = comment;
      else
        node.commentBefore = comment;
    }
    if (ctx.options.keepSourceTokens && isSrcToken)
      node.srcToken = token;
    return node;
  }
  function composeEmptyNode(ctx, offset, before, pos, { spaceBefore, comment, anchor, tag, end }, onError) {
    const token = {
      type: "scalar",
      offset: utilEmptyScalarPosition.emptyScalarPosition(offset, before, pos),
      indent: -1,
      source: ""
    };
    const node = composeScalar.composeScalar(ctx, token, tag, onError);
    if (anchor) {
      node.anchor = anchor.source.substring(1);
      if (node.anchor === "")
        onError(anchor, "BAD_ALIAS", "Anchor cannot be an empty string");
    }
    if (spaceBefore)
      node.spaceBefore = true;
    if (comment) {
      node.comment = comment;
      node.range[2] = end;
    }
    return node;
  }
  function composeAlias({ options }, { offset, source, end }, onError) {
    const alias = new Alias.Alias(source.substring(1));
    if (alias.source === "")
      onError(offset, "BAD_ALIAS", "Alias cannot be an empty string");
    if (alias.source.endsWith(":"))
      onError(offset + source.length - 1, "BAD_ALIAS", "Alias ending in : is ambiguous", true);
    const valueEnd = offset + source.length;
    const re = resolveEnd.resolveEnd(end, valueEnd, options.strict, onError);
    alias.range = [offset, valueEnd, re.offset];
    if (re.comment)
      alias.comment = re.comment;
    return alias;
  }
  exports.composeEmptyNode = composeEmptyNode;
  exports.composeNode = composeNode;
});

// node_modules/yaml/dist/compose/compose-doc.js
var require_compose_doc = __commonJS((exports) => {
  var Document = require_Document();
  var composeNode = require_compose_node();
  var resolveEnd = require_resolve_end();
  var resolveProps = require_resolve_props();
  function composeDoc(options, directives, { offset, start, value, end }, onError) {
    const opts = Object.assign({ _directives: directives }, options);
    const doc = new Document.Document(undefined, opts);
    const ctx = {
      atKey: false,
      atRoot: true,
      directives: doc.directives,
      options: doc.options,
      schema: doc.schema
    };
    const props = resolveProps.resolveProps(start, {
      indicator: "doc-start",
      next: value ?? end?.[0],
      offset,
      onError,
      parentIndent: 0,
      startOnNewline: true
    });
    if (props.found) {
      doc.directives.docStart = true;
      if (value && (value.type === "block-map" || value.type === "block-seq") && !props.hasNewline)
        onError(props.end, "MISSING_CHAR", "Block collection cannot start on same line with directives-end marker");
    }
    doc.contents = value ? composeNode.composeNode(ctx, value, props, onError) : composeNode.composeEmptyNode(ctx, props.end, start, null, props, onError);
    const contentEnd = doc.contents.range[2];
    const re = resolveEnd.resolveEnd(end, contentEnd, false, onError);
    if (re.comment)
      doc.comment = re.comment;
    doc.range = [offset, contentEnd, re.offset];
    return doc;
  }
  exports.composeDoc = composeDoc;
});

// node_modules/yaml/dist/compose/composer.js
var require_composer = __commonJS((exports) => {
  var node_process = __require("process");
  var directives = require_directives();
  var Document = require_Document();
  var errors = require_errors();
  var identity = require_identity();
  var composeDoc = require_compose_doc();
  var resolveEnd = require_resolve_end();
  function getErrorPos(src) {
    if (typeof src === "number")
      return [src, src + 1];
    if (Array.isArray(src))
      return src.length === 2 ? src : [src[0], src[1]];
    const { offset, source } = src;
    return [offset, offset + (typeof source === "string" ? source.length : 1)];
  }
  function parsePrelude(prelude) {
    let comment = "";
    let atComment = false;
    let afterEmptyLine = false;
    for (let i = 0;i < prelude.length; ++i) {
      const source = prelude[i];
      switch (source[0]) {
        case "#":
          comment += (comment === "" ? "" : afterEmptyLine ? `

` : `
`) + (source.substring(1) || " ");
          atComment = true;
          afterEmptyLine = false;
          break;
        case "%":
          if (prelude[i + 1]?.[0] !== "#")
            i += 1;
          atComment = false;
          break;
        default:
          if (!atComment)
            afterEmptyLine = true;
          atComment = false;
      }
    }
    return { comment, afterEmptyLine };
  }

  class Composer {
    constructor(options = {}) {
      this.doc = null;
      this.atDirectives = false;
      this.prelude = [];
      this.errors = [];
      this.warnings = [];
      this.onError = (source, code, message, warning) => {
        const pos = getErrorPos(source);
        if (warning)
          this.warnings.push(new errors.YAMLWarning(pos, code, message));
        else
          this.errors.push(new errors.YAMLParseError(pos, code, message));
      };
      this.directives = new directives.Directives({ version: options.version || "1.2" });
      this.options = options;
    }
    decorate(doc, afterDoc) {
      const { comment, afterEmptyLine } = parsePrelude(this.prelude);
      if (comment) {
        const dc = doc.contents;
        if (afterDoc) {
          doc.comment = doc.comment ? `${doc.comment}
${comment}` : comment;
        } else if (afterEmptyLine || doc.directives.docStart || !dc) {
          doc.commentBefore = comment;
        } else if (identity.isCollection(dc) && !dc.flow && dc.items.length > 0) {
          let it = dc.items[0];
          if (identity.isPair(it))
            it = it.key;
          const cb = it.commentBefore;
          it.commentBefore = cb ? `${comment}
${cb}` : comment;
        } else {
          const cb = dc.commentBefore;
          dc.commentBefore = cb ? `${comment}
${cb}` : comment;
        }
      }
      if (afterDoc) {
        Array.prototype.push.apply(doc.errors, this.errors);
        Array.prototype.push.apply(doc.warnings, this.warnings);
      } else {
        doc.errors = this.errors;
        doc.warnings = this.warnings;
      }
      this.prelude = [];
      this.errors = [];
      this.warnings = [];
    }
    streamInfo() {
      return {
        comment: parsePrelude(this.prelude).comment,
        directives: this.directives,
        errors: this.errors,
        warnings: this.warnings
      };
    }
    *compose(tokens, forceDoc = false, endOffset = -1) {
      for (const token of tokens)
        yield* this.next(token);
      yield* this.end(forceDoc, endOffset);
    }
    *next(token) {
      if (node_process.env.LOG_STREAM)
        console.dir(token, { depth: null });
      switch (token.type) {
        case "directive":
          this.directives.add(token.source, (offset, message, warning) => {
            const pos = getErrorPos(token);
            pos[0] += offset;
            this.onError(pos, "BAD_DIRECTIVE", message, warning);
          });
          this.prelude.push(token.source);
          this.atDirectives = true;
          break;
        case "document": {
          const doc = composeDoc.composeDoc(this.options, this.directives, token, this.onError);
          if (this.atDirectives && !doc.directives.docStart)
            this.onError(token, "MISSING_CHAR", "Missing directives-end/doc-start indicator line");
          this.decorate(doc, false);
          if (this.doc)
            yield this.doc;
          this.doc = doc;
          this.atDirectives = false;
          break;
        }
        case "byte-order-mark":
        case "space":
          break;
        case "comment":
        case "newline":
          this.prelude.push(token.source);
          break;
        case "error": {
          const msg = token.source ? `${token.message}: ${JSON.stringify(token.source)}` : token.message;
          const error = new errors.YAMLParseError(getErrorPos(token), "UNEXPECTED_TOKEN", msg);
          if (this.atDirectives || !this.doc)
            this.errors.push(error);
          else
            this.doc.errors.push(error);
          break;
        }
        case "doc-end": {
          if (!this.doc) {
            const msg = "Unexpected doc-end without preceding document";
            this.errors.push(new errors.YAMLParseError(getErrorPos(token), "UNEXPECTED_TOKEN", msg));
            break;
          }
          this.doc.directives.docEnd = true;
          const end = resolveEnd.resolveEnd(token.end, token.offset + token.source.length, this.doc.options.strict, this.onError);
          this.decorate(this.doc, true);
          if (end.comment) {
            const dc = this.doc.comment;
            this.doc.comment = dc ? `${dc}
${end.comment}` : end.comment;
          }
          this.doc.range[2] = end.offset;
          break;
        }
        default:
          this.errors.push(new errors.YAMLParseError(getErrorPos(token), "UNEXPECTED_TOKEN", `Unsupported token ${token.type}`));
      }
    }
    *end(forceDoc = false, endOffset = -1) {
      if (this.doc) {
        this.decorate(this.doc, true);
        yield this.doc;
        this.doc = null;
      } else if (forceDoc) {
        const opts = Object.assign({ _directives: this.directives }, this.options);
        const doc = new Document.Document(undefined, opts);
        if (this.atDirectives)
          this.onError(endOffset, "MISSING_CHAR", "Missing directives-end indicator line");
        doc.range = [0, endOffset, endOffset];
        this.decorate(doc, false);
        yield doc;
      }
    }
  }
  exports.Composer = Composer;
});

// node_modules/yaml/dist/parse/cst-scalar.js
var require_cst_scalar = __commonJS((exports) => {
  var resolveBlockScalar = require_resolve_block_scalar();
  var resolveFlowScalar = require_resolve_flow_scalar();
  var errors = require_errors();
  var stringifyString = require_stringifyString();
  function resolveAsScalar(token, strict = true, onError) {
    if (token) {
      const _onError = (pos, code, message) => {
        const offset = typeof pos === "number" ? pos : Array.isArray(pos) ? pos[0] : pos.offset;
        if (onError)
          onError(offset, code, message);
        else
          throw new errors.YAMLParseError([offset, offset + 1], code, message);
      };
      switch (token.type) {
        case "scalar":
        case "single-quoted-scalar":
        case "double-quoted-scalar":
          return resolveFlowScalar.resolveFlowScalar(token, strict, _onError);
        case "block-scalar":
          return resolveBlockScalar.resolveBlockScalar({ options: { strict } }, token, _onError);
      }
    }
    return null;
  }
  function createScalarToken(value, context) {
    const { implicitKey = false, indent, inFlow = false, offset = -1, type = "PLAIN" } = context;
    const source = stringifyString.stringifyString({ type, value }, {
      implicitKey,
      indent: indent > 0 ? " ".repeat(indent) : "",
      inFlow,
      options: { blockQuote: true, lineWidth: -1 }
    });
    const end = context.end ?? [
      { type: "newline", offset: -1, indent, source: `
` }
    ];
    switch (source[0]) {
      case "|":
      case ">": {
        const he2 = source.indexOf(`
`);
        const head = source.substring(0, he2);
        const body = source.substring(he2 + 1) + `
`;
        const props = [
          { type: "block-scalar-header", offset, indent, source: head }
        ];
        if (!addEndtoBlockProps(props, end))
          props.push({ type: "newline", offset: -1, indent, source: `
` });
        return { type: "block-scalar", offset, indent, props, source: body };
      }
      case '"':
        return { type: "double-quoted-scalar", offset, indent, source, end };
      case "'":
        return { type: "single-quoted-scalar", offset, indent, source, end };
      default:
        return { type: "scalar", offset, indent, source, end };
    }
  }
  function setScalarValue(token, value, context = {}) {
    let { afterKey = false, implicitKey = false, inFlow = false, type } = context;
    let indent = "indent" in token ? token.indent : null;
    if (afterKey && typeof indent === "number")
      indent += 2;
    if (!type)
      switch (token.type) {
        case "single-quoted-scalar":
          type = "QUOTE_SINGLE";
          break;
        case "double-quoted-scalar":
          type = "QUOTE_DOUBLE";
          break;
        case "block-scalar": {
          const header = token.props[0];
          if (header.type !== "block-scalar-header")
            throw new Error("Invalid block scalar header");
          type = header.source[0] === ">" ? "BLOCK_FOLDED" : "BLOCK_LITERAL";
          break;
        }
        default:
          type = "PLAIN";
      }
    const source = stringifyString.stringifyString({ type, value }, {
      implicitKey: implicitKey || indent === null,
      indent: indent !== null && indent > 0 ? " ".repeat(indent) : "",
      inFlow,
      options: { blockQuote: true, lineWidth: -1 }
    });
    switch (source[0]) {
      case "|":
      case ">":
        setBlockScalarValue(token, source);
        break;
      case '"':
        setFlowScalarValue(token, source, "double-quoted-scalar");
        break;
      case "'":
        setFlowScalarValue(token, source, "single-quoted-scalar");
        break;
      default:
        setFlowScalarValue(token, source, "scalar");
    }
  }
  function setBlockScalarValue(token, source) {
    const he2 = source.indexOf(`
`);
    const head = source.substring(0, he2);
    const body = source.substring(he2 + 1) + `
`;
    if (token.type === "block-scalar") {
      const header = token.props[0];
      if (header.type !== "block-scalar-header")
        throw new Error("Invalid block scalar header");
      header.source = head;
      token.source = body;
    } else {
      const { offset } = token;
      const indent = "indent" in token ? token.indent : -1;
      const props = [
        { type: "block-scalar-header", offset, indent, source: head }
      ];
      if (!addEndtoBlockProps(props, "end" in token ? token.end : undefined))
        props.push({ type: "newline", offset: -1, indent, source: `
` });
      for (const key of Object.keys(token))
        if (key !== "type" && key !== "offset")
          delete token[key];
      Object.assign(token, { type: "block-scalar", indent, props, source: body });
    }
  }
  function addEndtoBlockProps(props, end) {
    if (end)
      for (const st of end)
        switch (st.type) {
          case "space":
          case "comment":
            props.push(st);
            break;
          case "newline":
            props.push(st);
            return true;
        }
    return false;
  }
  function setFlowScalarValue(token, source, type) {
    switch (token.type) {
      case "scalar":
      case "double-quoted-scalar":
      case "single-quoted-scalar":
        token.type = type;
        token.source = source;
        break;
      case "block-scalar": {
        const end = token.props.slice(1);
        let oa = source.length;
        if (token.props[0].type === "block-scalar-header")
          oa -= token.props[0].source.length;
        for (const tok of end)
          tok.offset += oa;
        delete token.props;
        Object.assign(token, { type, source, end });
        break;
      }
      case "block-map":
      case "block-seq": {
        const offset = token.offset + source.length;
        const nl = { type: "newline", offset, indent: token.indent, source: `
` };
        delete token.items;
        Object.assign(token, { type, source, end: [nl] });
        break;
      }
      default: {
        const indent = "indent" in token ? token.indent : -1;
        const end = "end" in token && Array.isArray(token.end) ? token.end.filter((st) => st.type === "space" || st.type === "comment" || st.type === "newline") : [];
        for (const key of Object.keys(token))
          if (key !== "type" && key !== "offset")
            delete token[key];
        Object.assign(token, { type, indent, source, end });
      }
    }
  }
  exports.createScalarToken = createScalarToken;
  exports.resolveAsScalar = resolveAsScalar;
  exports.setScalarValue = setScalarValue;
});

// node_modules/yaml/dist/parse/cst-stringify.js
var require_cst_stringify = __commonJS((exports) => {
  var stringify = (cst) => ("type" in cst) ? stringifyToken(cst) : stringifyItem(cst);
  function stringifyToken(token) {
    switch (token.type) {
      case "block-scalar": {
        let res = "";
        for (const tok of token.props)
          res += stringifyToken(tok);
        return res + token.source;
      }
      case "block-map":
      case "block-seq": {
        let res = "";
        for (const item of token.items)
          res += stringifyItem(item);
        return res;
      }
      case "flow-collection": {
        let res = token.start.source;
        for (const item of token.items)
          res += stringifyItem(item);
        for (const st of token.end)
          res += st.source;
        return res;
      }
      case "document": {
        let res = stringifyItem(token);
        if (token.end)
          for (const st of token.end)
            res += st.source;
        return res;
      }
      default: {
        let res = token.source;
        if ("end" in token && token.end)
          for (const st of token.end)
            res += st.source;
        return res;
      }
    }
  }
  function stringifyItem({ start, key, sep, value }) {
    let res = "";
    for (const st of start)
      res += st.source;
    if (key)
      res += stringifyToken(key);
    if (sep)
      for (const st of sep)
        res += st.source;
    if (value)
      res += stringifyToken(value);
    return res;
  }
  exports.stringify = stringify;
});

// node_modules/yaml/dist/parse/cst-visit.js
var require_cst_visit = __commonJS((exports) => {
  var BREAK = Symbol("break visit");
  var SKIP = Symbol("skip children");
  var REMOVE = Symbol("remove item");
  function visit(cst, visitor) {
    if ("type" in cst && cst.type === "document")
      cst = { start: cst.start, value: cst.value };
    _visit(Object.freeze([]), cst, visitor);
  }
  visit.BREAK = BREAK;
  visit.SKIP = SKIP;
  visit.REMOVE = REMOVE;
  visit.itemAtPath = (cst, path) => {
    let item = cst;
    for (const [field, index] of path) {
      const tok = item?.[field];
      if (tok && "items" in tok) {
        item = tok.items[index];
      } else
        return;
    }
    return item;
  };
  visit.parentCollection = (cst, path) => {
    const parent = visit.itemAtPath(cst, path.slice(0, -1));
    const field = path[path.length - 1][0];
    const coll = parent?.[field];
    if (coll && "items" in coll)
      return coll;
    throw new Error("Parent collection not found");
  };
  function _visit(path, item, visitor) {
    let ctrl = visitor(item, path);
    if (typeof ctrl === "symbol")
      return ctrl;
    for (const field of ["key", "value"]) {
      const token = item[field];
      if (token && "items" in token) {
        for (let i = 0;i < token.items.length; ++i) {
          const ci = _visit(Object.freeze(path.concat([[field, i]])), token.items[i], visitor);
          if (typeof ci === "number")
            i = ci - 1;
          else if (ci === BREAK)
            return BREAK;
          else if (ci === REMOVE) {
            token.items.splice(i, 1);
            i -= 1;
          }
        }
        if (typeof ctrl === "function" && field === "key")
          ctrl = ctrl(item, path);
      }
    }
    return typeof ctrl === "function" ? ctrl(item, path) : ctrl;
  }
  exports.visit = visit;
});

// node_modules/yaml/dist/parse/cst.js
var require_cst = __commonJS((exports) => {
  var cstScalar = require_cst_scalar();
  var cstStringify = require_cst_stringify();
  var cstVisit = require_cst_visit();
  var BOM = "\uFEFF";
  var DOCUMENT = "\x02";
  var FLOW_END = "\x18";
  var SCALAR = "\x1F";
  var isCollection = (token) => !!token && ("items" in token);
  var isScalar = (token) => !!token && (token.type === "scalar" || token.type === "single-quoted-scalar" || token.type === "double-quoted-scalar" || token.type === "block-scalar");
  function prettyToken(token) {
    switch (token) {
      case BOM:
        return "<BOM>";
      case DOCUMENT:
        return "<DOC>";
      case FLOW_END:
        return "<FLOW_END>";
      case SCALAR:
        return "<SCALAR>";
      default:
        return JSON.stringify(token);
    }
  }
  function tokenType(source) {
    switch (source) {
      case BOM:
        return "byte-order-mark";
      case DOCUMENT:
        return "doc-mode";
      case FLOW_END:
        return "flow-error-end";
      case SCALAR:
        return "scalar";
      case "---":
        return "doc-start";
      case "...":
        return "doc-end";
      case "":
      case `
`:
      case `\r
`:
        return "newline";
      case "-":
        return "seq-item-ind";
      case "?":
        return "explicit-key-ind";
      case ":":
        return "map-value-ind";
      case "{":
        return "flow-map-start";
      case "}":
        return "flow-map-end";
      case "[":
        return "flow-seq-start";
      case "]":
        return "flow-seq-end";
      case ",":
        return "comma";
    }
    switch (source[0]) {
      case " ":
      case "\t":
        return "space";
      case "#":
        return "comment";
      case "%":
        return "directive-line";
      case "*":
        return "alias";
      case "&":
        return "anchor";
      case "!":
        return "tag";
      case "'":
        return "single-quoted-scalar";
      case '"':
        return "double-quoted-scalar";
      case "|":
      case ">":
        return "block-scalar-header";
    }
    return null;
  }
  exports.createScalarToken = cstScalar.createScalarToken;
  exports.resolveAsScalar = cstScalar.resolveAsScalar;
  exports.setScalarValue = cstScalar.setScalarValue;
  exports.stringify = cstStringify.stringify;
  exports.visit = cstVisit.visit;
  exports.BOM = BOM;
  exports.DOCUMENT = DOCUMENT;
  exports.FLOW_END = FLOW_END;
  exports.SCALAR = SCALAR;
  exports.isCollection = isCollection;
  exports.isScalar = isScalar;
  exports.prettyToken = prettyToken;
  exports.tokenType = tokenType;
});

// node_modules/yaml/dist/parse/lexer.js
var require_lexer = __commonJS((exports) => {
  var cst = require_cst();
  function isEmpty(ch) {
    switch (ch) {
      case undefined:
      case " ":
      case `
`:
      case "\r":
      case "\t":
        return true;
      default:
        return false;
    }
  }
  var hexDigits = new Set("0123456789ABCDEFabcdef");
  var tagChars = new Set("0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-#;/?:@&=+$_.!~*'()");
  var flowIndicatorChars = new Set(",[]{}");
  var invalidAnchorChars = new Set(` ,[]{}
\r	`);
  var isNotAnchorChar = (ch) => !ch || invalidAnchorChars.has(ch);

  class Lexer {
    constructor() {
      this.atEnd = false;
      this.blockScalarIndent = -1;
      this.blockScalarKeep = false;
      this.buffer = "";
      this.flowKey = false;
      this.flowLevel = 0;
      this.indentNext = 0;
      this.indentValue = 0;
      this.lineEndPos = null;
      this.next = null;
      this.pos = 0;
    }
    *lex(source, incomplete = false) {
      if (source) {
        if (typeof source !== "string")
          throw TypeError("source is not a string");
        this.buffer = this.buffer ? this.buffer + source : source;
        this.lineEndPos = null;
      }
      this.atEnd = !incomplete;
      let next = this.next ?? "stream";
      while (next && (incomplete || this.hasChars(1)))
        next = yield* this.parseNext(next);
    }
    atLineEnd() {
      let i = this.pos;
      let ch = this.buffer[i];
      while (ch === " " || ch === "\t")
        ch = this.buffer[++i];
      if (!ch || ch === "#" || ch === `
`)
        return true;
      if (ch === "\r")
        return this.buffer[i + 1] === `
`;
      return false;
    }
    charAt(n) {
      return this.buffer[this.pos + n];
    }
    continueScalar(offset) {
      let ch = this.buffer[offset];
      if (this.indentNext > 0) {
        let indent = 0;
        while (ch === " ")
          ch = this.buffer[++indent + offset];
        if (ch === "\r") {
          const next = this.buffer[indent + offset + 1];
          if (next === `
` || !next && !this.atEnd)
            return offset + indent + 1;
        }
        return ch === `
` || indent >= this.indentNext || !ch && !this.atEnd ? offset + indent : -1;
      }
      if (ch === "-" || ch === ".") {
        const dt = this.buffer.substr(offset, 3);
        if ((dt === "---" || dt === "...") && isEmpty(this.buffer[offset + 3]))
          return -1;
      }
      return offset;
    }
    getLine() {
      let end = this.lineEndPos;
      if (typeof end !== "number" || end !== -1 && end < this.pos) {
        end = this.buffer.indexOf(`
`, this.pos);
        this.lineEndPos = end;
      }
      if (end === -1)
        return this.atEnd ? this.buffer.substring(this.pos) : null;
      if (this.buffer[end - 1] === "\r")
        end -= 1;
      return this.buffer.substring(this.pos, end);
    }
    hasChars(n) {
      return this.pos + n <= this.buffer.length;
    }
    setNext(state) {
      this.buffer = this.buffer.substring(this.pos);
      this.pos = 0;
      this.lineEndPos = null;
      this.next = state;
      return null;
    }
    peek(n) {
      return this.buffer.substr(this.pos, n);
    }
    *parseNext(next) {
      switch (next) {
        case "stream":
          return yield* this.parseStream();
        case "line-start":
          return yield* this.parseLineStart();
        case "block-start":
          return yield* this.parseBlockStart();
        case "doc":
          return yield* this.parseDocument();
        case "flow":
          return yield* this.parseFlowCollection();
        case "quoted-scalar":
          return yield* this.parseQuotedScalar();
        case "block-scalar":
          return yield* this.parseBlockScalar();
        case "plain-scalar":
          return yield* this.parsePlainScalar();
      }
    }
    *parseStream() {
      let line = this.getLine();
      if (line === null)
        return this.setNext("stream");
      if (line[0] === cst.BOM) {
        yield* this.pushCount(1);
        line = line.substring(1);
      }
      if (line[0] === "%") {
        let dirEnd = line.length;
        let cs = line.indexOf("#");
        while (cs !== -1) {
          const ch = line[cs - 1];
          if (ch === " " || ch === "\t") {
            dirEnd = cs - 1;
            break;
          } else {
            cs = line.indexOf("#", cs + 1);
          }
        }
        while (true) {
          const ch = line[dirEnd - 1];
          if (ch === " " || ch === "\t")
            dirEnd -= 1;
          else
            break;
        }
        const n = (yield* this.pushCount(dirEnd)) + (yield* this.pushSpaces(true));
        yield* this.pushCount(line.length - n);
        this.pushNewline();
        return "stream";
      }
      if (this.atLineEnd()) {
        const sp = yield* this.pushSpaces(true);
        yield* this.pushCount(line.length - sp);
        yield* this.pushNewline();
        return "stream";
      }
      yield cst.DOCUMENT;
      return yield* this.parseLineStart();
    }
    *parseLineStart() {
      const ch = this.charAt(0);
      if (!ch && !this.atEnd)
        return this.setNext("line-start");
      if (ch === "-" || ch === ".") {
        if (!this.atEnd && !this.hasChars(4))
          return this.setNext("line-start");
        const s = this.peek(3);
        if ((s === "---" || s === "...") && isEmpty(this.charAt(3))) {
          yield* this.pushCount(3);
          this.indentValue = 0;
          this.indentNext = 0;
          return s === "---" ? "doc" : "stream";
        }
      }
      this.indentValue = yield* this.pushSpaces(false);
      if (this.indentNext > this.indentValue && !isEmpty(this.charAt(1)))
        this.indentNext = this.indentValue;
      return yield* this.parseBlockStart();
    }
    *parseBlockStart() {
      const [ch0, ch1] = this.peek(2);
      if (!ch1 && !this.atEnd)
        return this.setNext("block-start");
      if ((ch0 === "-" || ch0 === "?" || ch0 === ":") && isEmpty(ch1)) {
        const n = (yield* this.pushCount(1)) + (yield* this.pushSpaces(true));
        this.indentNext = this.indentValue + 1;
        this.indentValue += n;
        return yield* this.parseBlockStart();
      }
      return "doc";
    }
    *parseDocument() {
      yield* this.pushSpaces(true);
      const line = this.getLine();
      if (line === null)
        return this.setNext("doc");
      let n = yield* this.pushIndicators();
      switch (line[n]) {
        case "#":
          yield* this.pushCount(line.length - n);
        case undefined:
          yield* this.pushNewline();
          return yield* this.parseLineStart();
        case "{":
        case "[":
          yield* this.pushCount(1);
          this.flowKey = false;
          this.flowLevel = 1;
          return "flow";
        case "}":
        case "]":
          yield* this.pushCount(1);
          return "doc";
        case "*":
          yield* this.pushUntil(isNotAnchorChar);
          return "doc";
        case '"':
        case "'":
          return yield* this.parseQuotedScalar();
        case "|":
        case ">":
          n += yield* this.parseBlockScalarHeader();
          n += yield* this.pushSpaces(true);
          yield* this.pushCount(line.length - n);
          yield* this.pushNewline();
          return yield* this.parseBlockScalar();
        default:
          return yield* this.parsePlainScalar();
      }
    }
    *parseFlowCollection() {
      let nl, sp;
      let indent = -1;
      do {
        nl = yield* this.pushNewline();
        if (nl > 0) {
          sp = yield* this.pushSpaces(false);
          this.indentValue = indent = sp;
        } else {
          sp = 0;
        }
        sp += yield* this.pushSpaces(true);
      } while (nl + sp > 0);
      const line = this.getLine();
      if (line === null)
        return this.setNext("flow");
      if (indent !== -1 && indent < this.indentNext && line[0] !== "#" || indent === 0 && (line.startsWith("---") || line.startsWith("...")) && isEmpty(line[3])) {
        const atFlowEndMarker = indent === this.indentNext - 1 && this.flowLevel === 1 && (line[0] === "]" || line[0] === "}");
        if (!atFlowEndMarker) {
          this.flowLevel = 0;
          yield cst.FLOW_END;
          return yield* this.parseLineStart();
        }
      }
      let n = 0;
      while (line[n] === ",") {
        n += yield* this.pushCount(1);
        n += yield* this.pushSpaces(true);
        this.flowKey = false;
      }
      n += yield* this.pushIndicators();
      switch (line[n]) {
        case undefined:
          return "flow";
        case "#":
          yield* this.pushCount(line.length - n);
          return "flow";
        case "{":
        case "[":
          yield* this.pushCount(1);
          this.flowKey = false;
          this.flowLevel += 1;
          return "flow";
        case "}":
        case "]":
          yield* this.pushCount(1);
          this.flowKey = true;
          this.flowLevel -= 1;
          return this.flowLevel ? "flow" : "doc";
        case "*":
          yield* this.pushUntil(isNotAnchorChar);
          return "flow";
        case '"':
        case "'":
          this.flowKey = true;
          return yield* this.parseQuotedScalar();
        case ":": {
          const next = this.charAt(1);
          if (this.flowKey || isEmpty(next) || next === ",") {
            this.flowKey = false;
            yield* this.pushCount(1);
            yield* this.pushSpaces(true);
            return "flow";
          }
        }
        default:
          this.flowKey = false;
          return yield* this.parsePlainScalar();
      }
    }
    *parseQuotedScalar() {
      const quote = this.charAt(0);
      let end = this.buffer.indexOf(quote, this.pos + 1);
      if (quote === "'") {
        while (end !== -1 && this.buffer[end + 1] === "'")
          end = this.buffer.indexOf("'", end + 2);
      } else {
        while (end !== -1) {
          let n = 0;
          while (this.buffer[end - 1 - n] === "\\")
            n += 1;
          if (n % 2 === 0)
            break;
          end = this.buffer.indexOf('"', end + 1);
        }
      }
      const qb = this.buffer.substring(0, end);
      let nl = qb.indexOf(`
`, this.pos);
      if (nl !== -1) {
        while (nl !== -1) {
          const cs = this.continueScalar(nl + 1);
          if (cs === -1)
            break;
          nl = qb.indexOf(`
`, cs);
        }
        if (nl !== -1) {
          end = nl - (qb[nl - 1] === "\r" ? 2 : 1);
        }
      }
      if (end === -1) {
        if (!this.atEnd)
          return this.setNext("quoted-scalar");
        end = this.buffer.length;
      }
      yield* this.pushToIndex(end + 1, false);
      return this.flowLevel ? "flow" : "doc";
    }
    *parseBlockScalarHeader() {
      this.blockScalarIndent = -1;
      this.blockScalarKeep = false;
      let i = this.pos;
      while (true) {
        const ch = this.buffer[++i];
        if (ch === "+")
          this.blockScalarKeep = true;
        else if (ch > "0" && ch <= "9")
          this.blockScalarIndent = Number(ch) - 1;
        else if (ch !== "-")
          break;
      }
      return yield* this.pushUntil((ch) => isEmpty(ch) || ch === "#");
    }
    *parseBlockScalar() {
      let nl = this.pos - 1;
      let indent = 0;
      let ch;
      loop:
        for (let i2 = this.pos;ch = this.buffer[i2]; ++i2) {
          switch (ch) {
            case " ":
              indent += 1;
              break;
            case `
`:
              nl = i2;
              indent = 0;
              break;
            case "\r": {
              const next = this.buffer[i2 + 1];
              if (!next && !this.atEnd)
                return this.setNext("block-scalar");
              if (next === `
`)
                break;
            }
            default:
              break loop;
          }
        }
      if (!ch && !this.atEnd)
        return this.setNext("block-scalar");
      if (indent >= this.indentNext) {
        if (this.blockScalarIndent === -1)
          this.indentNext = indent;
        else {
          this.indentNext = this.blockScalarIndent + (this.indentNext === 0 ? 1 : this.indentNext);
        }
        do {
          const cs = this.continueScalar(nl + 1);
          if (cs === -1)
            break;
          nl = this.buffer.indexOf(`
`, cs);
        } while (nl !== -1);
        if (nl === -1) {
          if (!this.atEnd)
            return this.setNext("block-scalar");
          nl = this.buffer.length;
        }
      }
      let i = nl + 1;
      ch = this.buffer[i];
      while (ch === " ")
        ch = this.buffer[++i];
      if (ch === "\t") {
        while (ch === "\t" || ch === " " || ch === "\r" || ch === `
`)
          ch = this.buffer[++i];
        nl = i - 1;
      } else if (!this.blockScalarKeep) {
        do {
          let i2 = nl - 1;
          let ch2 = this.buffer[i2];
          if (ch2 === "\r")
            ch2 = this.buffer[--i2];
          const lastChar = i2;
          while (ch2 === " ")
            ch2 = this.buffer[--i2];
          if (ch2 === `
` && i2 >= this.pos && i2 + 1 + indent > lastChar)
            nl = i2;
          else
            break;
        } while (true);
      }
      yield cst.SCALAR;
      yield* this.pushToIndex(nl + 1, true);
      return yield* this.parseLineStart();
    }
    *parsePlainScalar() {
      const inFlow = this.flowLevel > 0;
      let end = this.pos - 1;
      let i = this.pos - 1;
      let ch;
      while (ch = this.buffer[++i]) {
        if (ch === ":") {
          const next = this.buffer[i + 1];
          if (isEmpty(next) || inFlow && flowIndicatorChars.has(next))
            break;
          end = i;
        } else if (isEmpty(ch)) {
          let next = this.buffer[i + 1];
          if (ch === "\r") {
            if (next === `
`) {
              i += 1;
              ch = `
`;
              next = this.buffer[i + 1];
            } else
              end = i;
          }
          if (next === "#" || inFlow && flowIndicatorChars.has(next))
            break;
          if (ch === `
`) {
            const cs = this.continueScalar(i + 1);
            if (cs === -1)
              break;
            i = Math.max(i, cs - 2);
          }
        } else {
          if (inFlow && flowIndicatorChars.has(ch))
            break;
          end = i;
        }
      }
      if (!ch && !this.atEnd)
        return this.setNext("plain-scalar");
      yield cst.SCALAR;
      yield* this.pushToIndex(end + 1, true);
      return inFlow ? "flow" : "doc";
    }
    *pushCount(n) {
      if (n > 0) {
        yield this.buffer.substr(this.pos, n);
        this.pos += n;
        return n;
      }
      return 0;
    }
    *pushToIndex(i, allowEmpty) {
      const s = this.buffer.slice(this.pos, i);
      if (s) {
        yield s;
        this.pos += s.length;
        return s.length;
      } else if (allowEmpty)
        yield "";
      return 0;
    }
    *pushIndicators() {
      switch (this.charAt(0)) {
        case "!":
          return (yield* this.pushTag()) + (yield* this.pushSpaces(true)) + (yield* this.pushIndicators());
        case "&":
          return (yield* this.pushUntil(isNotAnchorChar)) + (yield* this.pushSpaces(true)) + (yield* this.pushIndicators());
        case "-":
        case "?":
        case ":": {
          const inFlow = this.flowLevel > 0;
          const ch1 = this.charAt(1);
          if (isEmpty(ch1) || inFlow && flowIndicatorChars.has(ch1)) {
            if (!inFlow)
              this.indentNext = this.indentValue + 1;
            else if (this.flowKey)
              this.flowKey = false;
            return (yield* this.pushCount(1)) + (yield* this.pushSpaces(true)) + (yield* this.pushIndicators());
          }
        }
      }
      return 0;
    }
    *pushTag() {
      if (this.charAt(1) === "<") {
        let i = this.pos + 2;
        let ch = this.buffer[i];
        while (!isEmpty(ch) && ch !== ">")
          ch = this.buffer[++i];
        return yield* this.pushToIndex(ch === ">" ? i + 1 : i, false);
      } else {
        let i = this.pos + 1;
        let ch = this.buffer[i];
        while (ch) {
          if (tagChars.has(ch))
            ch = this.buffer[++i];
          else if (ch === "%" && hexDigits.has(this.buffer[i + 1]) && hexDigits.has(this.buffer[i + 2])) {
            ch = this.buffer[i += 3];
          } else
            break;
        }
        return yield* this.pushToIndex(i, false);
      }
    }
    *pushNewline() {
      const ch = this.buffer[this.pos];
      if (ch === `
`)
        return yield* this.pushCount(1);
      else if (ch === "\r" && this.charAt(1) === `
`)
        return yield* this.pushCount(2);
      else
        return 0;
    }
    *pushSpaces(allowTabs) {
      let i = this.pos - 1;
      let ch;
      do {
        ch = this.buffer[++i];
      } while (ch === " " || allowTabs && ch === "\t");
      const n = i - this.pos;
      if (n > 0) {
        yield this.buffer.substr(this.pos, n);
        this.pos = i;
      }
      return n;
    }
    *pushUntil(test) {
      let i = this.pos;
      let ch = this.buffer[i];
      while (!test(ch))
        ch = this.buffer[++i];
      return yield* this.pushToIndex(i, false);
    }
  }
  exports.Lexer = Lexer;
});

// node_modules/yaml/dist/parse/line-counter.js
var require_line_counter = __commonJS((exports) => {
  class LineCounter {
    constructor() {
      this.lineStarts = [];
      this.addNewLine = (offset) => this.lineStarts.push(offset);
      this.linePos = (offset) => {
        let low = 0;
        let high = this.lineStarts.length;
        while (low < high) {
          const mid = low + high >> 1;
          if (this.lineStarts[mid] < offset)
            low = mid + 1;
          else
            high = mid;
        }
        if (this.lineStarts[low] === offset)
          return { line: low + 1, col: 1 };
        if (low === 0)
          return { line: 0, col: offset };
        const start = this.lineStarts[low - 1];
        return { line: low, col: offset - start + 1 };
      };
    }
  }
  exports.LineCounter = LineCounter;
});

// node_modules/yaml/dist/parse/parser.js
var require_parser = __commonJS((exports) => {
  var node_process = __require("process");
  var cst = require_cst();
  var lexer = require_lexer();
  function includesToken(list, type) {
    for (let i = 0;i < list.length; ++i)
      if (list[i].type === type)
        return true;
    return false;
  }
  function findNonEmptyIndex(list) {
    for (let i = 0;i < list.length; ++i) {
      switch (list[i].type) {
        case "space":
        case "comment":
        case "newline":
          break;
        default:
          return i;
      }
    }
    return -1;
  }
  function isFlowToken(token) {
    switch (token?.type) {
      case "alias":
      case "scalar":
      case "single-quoted-scalar":
      case "double-quoted-scalar":
      case "flow-collection":
        return true;
      default:
        return false;
    }
  }
  function getPrevProps(parent) {
    switch (parent.type) {
      case "document":
        return parent.start;
      case "block-map": {
        const it = parent.items[parent.items.length - 1];
        return it.sep ?? it.start;
      }
      case "block-seq":
        return parent.items[parent.items.length - 1].start;
      default:
        return [];
    }
  }
  function getFirstKeyStartProps(prev) {
    if (prev.length === 0)
      return [];
    let i = prev.length;
    loop:
      while (--i >= 0) {
        switch (prev[i].type) {
          case "doc-start":
          case "explicit-key-ind":
          case "map-value-ind":
          case "seq-item-ind":
          case "newline":
            break loop;
        }
      }
    while (prev[++i]?.type === "space") {}
    return prev.splice(i, prev.length);
  }
  function fixFlowSeqItems(fc) {
    if (fc.start.type === "flow-seq-start") {
      for (const it of fc.items) {
        if (it.sep && !it.value && !includesToken(it.start, "explicit-key-ind") && !includesToken(it.sep, "map-value-ind")) {
          if (it.key)
            it.value = it.key;
          delete it.key;
          if (isFlowToken(it.value)) {
            if (it.value.end)
              Array.prototype.push.apply(it.value.end, it.sep);
            else
              it.value.end = it.sep;
          } else
            Array.prototype.push.apply(it.start, it.sep);
          delete it.sep;
        }
      }
    }
  }

  class Parser {
    constructor(onNewLine) {
      this.atNewLine = true;
      this.atScalar = false;
      this.indent = 0;
      this.offset = 0;
      this.onKeyLine = false;
      this.stack = [];
      this.source = "";
      this.type = "";
      this.lexer = new lexer.Lexer;
      this.onNewLine = onNewLine;
    }
    *parse(source, incomplete = false) {
      if (this.onNewLine && this.offset === 0)
        this.onNewLine(0);
      for (const lexeme of this.lexer.lex(source, incomplete))
        yield* this.next(lexeme);
      if (!incomplete)
        yield* this.end();
    }
    *next(source) {
      this.source = source;
      if (node_process.env.LOG_TOKENS)
        console.log("|", cst.prettyToken(source));
      if (this.atScalar) {
        this.atScalar = false;
        yield* this.step();
        this.offset += source.length;
        return;
      }
      const type = cst.tokenType(source);
      if (!type) {
        const message = `Not a YAML token: ${source}`;
        yield* this.pop({ type: "error", offset: this.offset, message, source });
        this.offset += source.length;
      } else if (type === "scalar") {
        this.atNewLine = false;
        this.atScalar = true;
        this.type = "scalar";
      } else {
        this.type = type;
        yield* this.step();
        switch (type) {
          case "newline":
            this.atNewLine = true;
            this.indent = 0;
            if (this.onNewLine)
              this.onNewLine(this.offset + source.length);
            break;
          case "space":
            if (this.atNewLine && source[0] === " ")
              this.indent += source.length;
            break;
          case "explicit-key-ind":
          case "map-value-ind":
          case "seq-item-ind":
            if (this.atNewLine)
              this.indent += source.length;
            break;
          case "doc-mode":
          case "flow-error-end":
            return;
          default:
            this.atNewLine = false;
        }
        this.offset += source.length;
      }
    }
    *end() {
      while (this.stack.length > 0)
        yield* this.pop();
    }
    get sourceToken() {
      const st = {
        type: this.type,
        offset: this.offset,
        indent: this.indent,
        source: this.source
      };
      return st;
    }
    *step() {
      const top = this.peek(1);
      if (this.type === "doc-end" && top?.type !== "doc-end") {
        while (this.stack.length > 0)
          yield* this.pop();
        this.stack.push({
          type: "doc-end",
          offset: this.offset,
          source: this.source
        });
        return;
      }
      if (!top)
        return yield* this.stream();
      switch (top.type) {
        case "document":
          return yield* this.document(top);
        case "alias":
        case "scalar":
        case "single-quoted-scalar":
        case "double-quoted-scalar":
          return yield* this.scalar(top);
        case "block-scalar":
          return yield* this.blockScalar(top);
        case "block-map":
          return yield* this.blockMap(top);
        case "block-seq":
          return yield* this.blockSequence(top);
        case "flow-collection":
          return yield* this.flowCollection(top);
        case "doc-end":
          return yield* this.documentEnd(top);
      }
      yield* this.pop();
    }
    peek(n) {
      return this.stack[this.stack.length - n];
    }
    *pop(error) {
      const token = error ?? this.stack.pop();
      if (!token) {
        const message = "Tried to pop an empty stack";
        yield { type: "error", offset: this.offset, source: "", message };
      } else if (this.stack.length === 0) {
        yield token;
      } else {
        const top = this.peek(1);
        if (token.type === "block-scalar") {
          token.indent = "indent" in top ? top.indent : 0;
        } else if (token.type === "flow-collection" && top.type === "document") {
          token.indent = 0;
        }
        if (token.type === "flow-collection")
          fixFlowSeqItems(token);
        switch (top.type) {
          case "document":
            top.value = token;
            break;
          case "block-scalar":
            top.props.push(token);
            break;
          case "block-map": {
            const it = top.items[top.items.length - 1];
            if (it.value) {
              top.items.push({ start: [], key: token, sep: [] });
              this.onKeyLine = true;
              return;
            } else if (it.sep) {
              it.value = token;
            } else {
              Object.assign(it, { key: token, sep: [] });
              this.onKeyLine = !it.explicitKey;
              return;
            }
            break;
          }
          case "block-seq": {
            const it = top.items[top.items.length - 1];
            if (it.value)
              top.items.push({ start: [], value: token });
            else
              it.value = token;
            break;
          }
          case "flow-collection": {
            const it = top.items[top.items.length - 1];
            if (!it || it.value)
              top.items.push({ start: [], key: token, sep: [] });
            else if (it.sep)
              it.value = token;
            else
              Object.assign(it, { key: token, sep: [] });
            return;
          }
          default:
            yield* this.pop();
            yield* this.pop(token);
        }
        if ((top.type === "document" || top.type === "block-map" || top.type === "block-seq") && (token.type === "block-map" || token.type === "block-seq")) {
          const last = token.items[token.items.length - 1];
          if (last && !last.sep && !last.value && last.start.length > 0 && findNonEmptyIndex(last.start) === -1 && (token.indent === 0 || last.start.every((st) => st.type !== "comment" || st.indent < token.indent))) {
            if (top.type === "document")
              top.end = last.start;
            else
              top.items.push({ start: last.start });
            token.items.splice(-1, 1);
          }
        }
      }
    }
    *stream() {
      switch (this.type) {
        case "directive-line":
          yield { type: "directive", offset: this.offset, source: this.source };
          return;
        case "byte-order-mark":
        case "space":
        case "comment":
        case "newline":
          yield this.sourceToken;
          return;
        case "doc-mode":
        case "doc-start": {
          const doc = {
            type: "document",
            offset: this.offset,
            start: []
          };
          if (this.type === "doc-start")
            doc.start.push(this.sourceToken);
          this.stack.push(doc);
          return;
        }
      }
      yield {
        type: "error",
        offset: this.offset,
        message: `Unexpected ${this.type} token in YAML stream`,
        source: this.source
      };
    }
    *document(doc) {
      if (doc.value)
        return yield* this.lineEnd(doc);
      switch (this.type) {
        case "doc-start": {
          if (findNonEmptyIndex(doc.start) !== -1) {
            yield* this.pop();
            yield* this.step();
          } else
            doc.start.push(this.sourceToken);
          return;
        }
        case "anchor":
        case "tag":
        case "space":
        case "comment":
        case "newline":
          doc.start.push(this.sourceToken);
          return;
      }
      const bv = this.startBlockValue(doc);
      if (bv)
        this.stack.push(bv);
      else {
        yield {
          type: "error",
          offset: this.offset,
          message: `Unexpected ${this.type} token in YAML document`,
          source: this.source
        };
      }
    }
    *scalar(scalar) {
      if (this.type === "map-value-ind") {
        const prev = getPrevProps(this.peek(2));
        const start = getFirstKeyStartProps(prev);
        let sep;
        if (scalar.end) {
          sep = scalar.end;
          sep.push(this.sourceToken);
          delete scalar.end;
        } else
          sep = [this.sourceToken];
        const map = {
          type: "block-map",
          offset: scalar.offset,
          indent: scalar.indent,
          items: [{ start, key: scalar, sep }]
        };
        this.onKeyLine = true;
        this.stack[this.stack.length - 1] = map;
      } else
        yield* this.lineEnd(scalar);
    }
    *blockScalar(scalar) {
      switch (this.type) {
        case "space":
        case "comment":
        case "newline":
          scalar.props.push(this.sourceToken);
          return;
        case "scalar":
          scalar.source = this.source;
          this.atNewLine = true;
          this.indent = 0;
          if (this.onNewLine) {
            let nl = this.source.indexOf(`
`) + 1;
            while (nl !== 0) {
              this.onNewLine(this.offset + nl);
              nl = this.source.indexOf(`
`, nl) + 1;
            }
          }
          yield* this.pop();
          break;
        default:
          yield* this.pop();
          yield* this.step();
      }
    }
    *blockMap(map) {
      const it = map.items[map.items.length - 1];
      switch (this.type) {
        case "newline":
          this.onKeyLine = false;
          if (it.value) {
            const end = "end" in it.value ? it.value.end : undefined;
            const last = Array.isArray(end) ? end[end.length - 1] : undefined;
            if (last?.type === "comment")
              end?.push(this.sourceToken);
            else
              map.items.push({ start: [this.sourceToken] });
          } else if (it.sep) {
            it.sep.push(this.sourceToken);
          } else {
            it.start.push(this.sourceToken);
          }
          return;
        case "space":
        case "comment":
          if (it.value) {
            map.items.push({ start: [this.sourceToken] });
          } else if (it.sep) {
            it.sep.push(this.sourceToken);
          } else {
            if (this.atIndentedComment(it.start, map.indent)) {
              const prev = map.items[map.items.length - 2];
              const end = prev?.value?.end;
              if (Array.isArray(end)) {
                Array.prototype.push.apply(end, it.start);
                end.push(this.sourceToken);
                map.items.pop();
                return;
              }
            }
            it.start.push(this.sourceToken);
          }
          return;
      }
      if (this.indent >= map.indent) {
        const atMapIndent = !this.onKeyLine && this.indent === map.indent;
        const atNextItem = atMapIndent && (it.sep || it.explicitKey) && this.type !== "seq-item-ind";
        let start = [];
        if (atNextItem && it.sep && !it.value) {
          const nl = [];
          for (let i = 0;i < it.sep.length; ++i) {
            const st = it.sep[i];
            switch (st.type) {
              case "newline":
                nl.push(i);
                break;
              case "space":
                break;
              case "comment":
                if (st.indent > map.indent)
                  nl.length = 0;
                break;
              default:
                nl.length = 0;
            }
          }
          if (nl.length >= 2)
            start = it.sep.splice(nl[1]);
        }
        switch (this.type) {
          case "anchor":
          case "tag":
            if (atNextItem || it.value) {
              start.push(this.sourceToken);
              map.items.push({ start });
              this.onKeyLine = true;
            } else if (it.sep) {
              it.sep.push(this.sourceToken);
            } else {
              it.start.push(this.sourceToken);
            }
            return;
          case "explicit-key-ind":
            if (!it.sep && !it.explicitKey) {
              it.start.push(this.sourceToken);
              it.explicitKey = true;
            } else if (atNextItem || it.value) {
              start.push(this.sourceToken);
              map.items.push({ start, explicitKey: true });
            } else {
              this.stack.push({
                type: "block-map",
                offset: this.offset,
                indent: this.indent,
                items: [{ start: [this.sourceToken], explicitKey: true }]
              });
            }
            this.onKeyLine = true;
            return;
          case "map-value-ind":
            if (it.explicitKey) {
              if (!it.sep) {
                if (includesToken(it.start, "newline")) {
                  Object.assign(it, { key: null, sep: [this.sourceToken] });
                } else {
                  const start2 = getFirstKeyStartProps(it.start);
                  this.stack.push({
                    type: "block-map",
                    offset: this.offset,
                    indent: this.indent,
                    items: [{ start: start2, key: null, sep: [this.sourceToken] }]
                  });
                }
              } else if (it.value) {
                map.items.push({ start: [], key: null, sep: [this.sourceToken] });
              } else if (includesToken(it.sep, "map-value-ind")) {
                this.stack.push({
                  type: "block-map",
                  offset: this.offset,
                  indent: this.indent,
                  items: [{ start, key: null, sep: [this.sourceToken] }]
                });
              } else if (isFlowToken(it.key) && !includesToken(it.sep, "newline")) {
                const start2 = getFirstKeyStartProps(it.start);
                const key = it.key;
                const sep = it.sep;
                sep.push(this.sourceToken);
                delete it.key;
                delete it.sep;
                this.stack.push({
                  type: "block-map",
                  offset: this.offset,
                  indent: this.indent,
                  items: [{ start: start2, key, sep }]
                });
              } else if (start.length > 0) {
                it.sep = it.sep.concat(start, this.sourceToken);
              } else {
                it.sep.push(this.sourceToken);
              }
            } else {
              if (!it.sep) {
                Object.assign(it, { key: null, sep: [this.sourceToken] });
              } else if (it.value || atNextItem) {
                map.items.push({ start, key: null, sep: [this.sourceToken] });
              } else if (includesToken(it.sep, "map-value-ind")) {
                this.stack.push({
                  type: "block-map",
                  offset: this.offset,
                  indent: this.indent,
                  items: [{ start: [], key: null, sep: [this.sourceToken] }]
                });
              } else {
                it.sep.push(this.sourceToken);
              }
            }
            this.onKeyLine = true;
            return;
          case "alias":
          case "scalar":
          case "single-quoted-scalar":
          case "double-quoted-scalar": {
            const fs = this.flowScalar(this.type);
            if (atNextItem || it.value) {
              map.items.push({ start, key: fs, sep: [] });
              this.onKeyLine = true;
            } else if (it.sep) {
              this.stack.push(fs);
            } else {
              Object.assign(it, { key: fs, sep: [] });
              this.onKeyLine = true;
            }
            return;
          }
          default: {
            const bv = this.startBlockValue(map);
            if (bv) {
              if (bv.type === "block-seq") {
                if (!it.explicitKey && it.sep && !includesToken(it.sep, "newline")) {
                  yield* this.pop({
                    type: "error",
                    offset: this.offset,
                    message: "Unexpected block-seq-ind on same line with key",
                    source: this.source
                  });
                  return;
                }
              } else if (atMapIndent) {
                map.items.push({ start });
              }
              this.stack.push(bv);
              return;
            }
          }
        }
      }
      yield* this.pop();
      yield* this.step();
    }
    *blockSequence(seq) {
      const it = seq.items[seq.items.length - 1];
      switch (this.type) {
        case "newline":
          if (it.value) {
            const end = "end" in it.value ? it.value.end : undefined;
            const last = Array.isArray(end) ? end[end.length - 1] : undefined;
            if (last?.type === "comment")
              end?.push(this.sourceToken);
            else
              seq.items.push({ start: [this.sourceToken] });
          } else
            it.start.push(this.sourceToken);
          return;
        case "space":
        case "comment":
          if (it.value)
            seq.items.push({ start: [this.sourceToken] });
          else {
            if (this.atIndentedComment(it.start, seq.indent)) {
              const prev = seq.items[seq.items.length - 2];
              const end = prev?.value?.end;
              if (Array.isArray(end)) {
                Array.prototype.push.apply(end, it.start);
                end.push(this.sourceToken);
                seq.items.pop();
                return;
              }
            }
            it.start.push(this.sourceToken);
          }
          return;
        case "anchor":
        case "tag":
          if (it.value || this.indent <= seq.indent)
            break;
          it.start.push(this.sourceToken);
          return;
        case "seq-item-ind":
          if (this.indent !== seq.indent)
            break;
          if (it.value || includesToken(it.start, "seq-item-ind"))
            seq.items.push({ start: [this.sourceToken] });
          else
            it.start.push(this.sourceToken);
          return;
      }
      if (this.indent > seq.indent) {
        const bv = this.startBlockValue(seq);
        if (bv) {
          this.stack.push(bv);
          return;
        }
      }
      yield* this.pop();
      yield* this.step();
    }
    *flowCollection(fc) {
      const it = fc.items[fc.items.length - 1];
      if (this.type === "flow-error-end") {
        let top;
        do {
          yield* this.pop();
          top = this.peek(1);
        } while (top?.type === "flow-collection");
      } else if (fc.end.length === 0) {
        switch (this.type) {
          case "comma":
          case "explicit-key-ind":
            if (!it || it.sep)
              fc.items.push({ start: [this.sourceToken] });
            else
              it.start.push(this.sourceToken);
            return;
          case "map-value-ind":
            if (!it || it.value)
              fc.items.push({ start: [], key: null, sep: [this.sourceToken] });
            else if (it.sep)
              it.sep.push(this.sourceToken);
            else
              Object.assign(it, { key: null, sep: [this.sourceToken] });
            return;
          case "space":
          case "comment":
          case "newline":
          case "anchor":
          case "tag":
            if (!it || it.value)
              fc.items.push({ start: [this.sourceToken] });
            else if (it.sep)
              it.sep.push(this.sourceToken);
            else
              it.start.push(this.sourceToken);
            return;
          case "alias":
          case "scalar":
          case "single-quoted-scalar":
          case "double-quoted-scalar": {
            const fs = this.flowScalar(this.type);
            if (!it || it.value)
              fc.items.push({ start: [], key: fs, sep: [] });
            else if (it.sep)
              this.stack.push(fs);
            else
              Object.assign(it, { key: fs, sep: [] });
            return;
          }
          case "flow-map-end":
          case "flow-seq-end":
            fc.end.push(this.sourceToken);
            return;
        }
        const bv = this.startBlockValue(fc);
        if (bv)
          this.stack.push(bv);
        else {
          yield* this.pop();
          yield* this.step();
        }
      } else {
        const parent = this.peek(2);
        if (parent.type === "block-map" && (this.type === "map-value-ind" && parent.indent === fc.indent || this.type === "newline" && !parent.items[parent.items.length - 1].sep)) {
          yield* this.pop();
          yield* this.step();
        } else if (this.type === "map-value-ind" && parent.type !== "flow-collection") {
          const prev = getPrevProps(parent);
          const start = getFirstKeyStartProps(prev);
          fixFlowSeqItems(fc);
          const sep = fc.end.splice(1, fc.end.length);
          sep.push(this.sourceToken);
          const map = {
            type: "block-map",
            offset: fc.offset,
            indent: fc.indent,
            items: [{ start, key: fc, sep }]
          };
          this.onKeyLine = true;
          this.stack[this.stack.length - 1] = map;
        } else {
          yield* this.lineEnd(fc);
        }
      }
    }
    flowScalar(type) {
      if (this.onNewLine) {
        let nl = this.source.indexOf(`
`) + 1;
        while (nl !== 0) {
          this.onNewLine(this.offset + nl);
          nl = this.source.indexOf(`
`, nl) + 1;
        }
      }
      return {
        type,
        offset: this.offset,
        indent: this.indent,
        source: this.source
      };
    }
    startBlockValue(parent) {
      switch (this.type) {
        case "alias":
        case "scalar":
        case "single-quoted-scalar":
        case "double-quoted-scalar":
          return this.flowScalar(this.type);
        case "block-scalar-header":
          return {
            type: "block-scalar",
            offset: this.offset,
            indent: this.indent,
            props: [this.sourceToken],
            source: ""
          };
        case "flow-map-start":
        case "flow-seq-start":
          return {
            type: "flow-collection",
            offset: this.offset,
            indent: this.indent,
            start: this.sourceToken,
            items: [],
            end: []
          };
        case "seq-item-ind":
          return {
            type: "block-seq",
            offset: this.offset,
            indent: this.indent,
            items: [{ start: [this.sourceToken] }]
          };
        case "explicit-key-ind": {
          this.onKeyLine = true;
          const prev = getPrevProps(parent);
          const start = getFirstKeyStartProps(prev);
          start.push(this.sourceToken);
          return {
            type: "block-map",
            offset: this.offset,
            indent: this.indent,
            items: [{ start, explicitKey: true }]
          };
        }
        case "map-value-ind": {
          this.onKeyLine = true;
          const prev = getPrevProps(parent);
          const start = getFirstKeyStartProps(prev);
          return {
            type: "block-map",
            offset: this.offset,
            indent: this.indent,
            items: [{ start, key: null, sep: [this.sourceToken] }]
          };
        }
      }
      return null;
    }
    atIndentedComment(start, indent) {
      if (this.type !== "comment")
        return false;
      if (this.indent <= indent)
        return false;
      return start.every((st) => st.type === "newline" || st.type === "space");
    }
    *documentEnd(docEnd) {
      if (this.type !== "doc-mode") {
        if (docEnd.end)
          docEnd.end.push(this.sourceToken);
        else
          docEnd.end = [this.sourceToken];
        if (this.type === "newline")
          yield* this.pop();
      }
    }
    *lineEnd(token) {
      switch (this.type) {
        case "comma":
        case "doc-start":
        case "doc-end":
        case "flow-seq-end":
        case "flow-map-end":
        case "map-value-ind":
          yield* this.pop();
          yield* this.step();
          break;
        case "newline":
          this.onKeyLine = false;
        case "space":
        case "comment":
        default:
          if (token.end)
            token.end.push(this.sourceToken);
          else
            token.end = [this.sourceToken];
          if (this.type === "newline")
            yield* this.pop();
      }
    }
  }
  exports.Parser = Parser;
});

// node_modules/yaml/dist/public-api.js
var require_public_api = __commonJS((exports) => {
  var composer = require_composer();
  var Document = require_Document();
  var errors = require_errors();
  var log = require_log();
  var identity = require_identity();
  var lineCounter = require_line_counter();
  var parser = require_parser();
  function parseOptions(options) {
    const prettyErrors = options.prettyErrors !== false;
    const lineCounter$1 = options.lineCounter || prettyErrors && new lineCounter.LineCounter || null;
    return { lineCounter: lineCounter$1, prettyErrors };
  }
  function parseAllDocuments(source, options = {}) {
    const { lineCounter: lineCounter2, prettyErrors } = parseOptions(options);
    const parser$1 = new parser.Parser(lineCounter2?.addNewLine);
    const composer$1 = new composer.Composer(options);
    const docs = Array.from(composer$1.compose(parser$1.parse(source)));
    if (prettyErrors && lineCounter2)
      for (const doc of docs) {
        doc.errors.forEach(errors.prettifyError(source, lineCounter2));
        doc.warnings.forEach(errors.prettifyError(source, lineCounter2));
      }
    if (docs.length > 0)
      return docs;
    return Object.assign([], { empty: true }, composer$1.streamInfo());
  }
  function parseDocument(source, options = {}) {
    const { lineCounter: lineCounter2, prettyErrors } = parseOptions(options);
    const parser$1 = new parser.Parser(lineCounter2?.addNewLine);
    const composer$1 = new composer.Composer(options);
    let doc = null;
    for (const _doc of composer$1.compose(parser$1.parse(source), true, source.length)) {
      if (!doc)
        doc = _doc;
      else if (doc.options.logLevel !== "silent") {
        doc.errors.push(new errors.YAMLParseError(_doc.range.slice(0, 2), "MULTIPLE_DOCS", "Source contains multiple documents; please use YAML.parseAllDocuments()"));
        break;
      }
    }
    if (prettyErrors && lineCounter2) {
      doc.errors.forEach(errors.prettifyError(source, lineCounter2));
      doc.warnings.forEach(errors.prettifyError(source, lineCounter2));
    }
    return doc;
  }
  function parse(src, reviver, options) {
    let _reviver = undefined;
    if (typeof reviver === "function") {
      _reviver = reviver;
    } else if (options === undefined && reviver && typeof reviver === "object") {
      options = reviver;
    }
    const doc = parseDocument(src, options);
    if (!doc)
      return null;
    doc.warnings.forEach((warning) => log.warn(doc.options.logLevel, warning));
    if (doc.errors.length > 0) {
      if (doc.options.logLevel !== "silent")
        throw doc.errors[0];
      else
        doc.errors = [];
    }
    return doc.toJS(Object.assign({ reviver: _reviver }, options));
  }
  function stringify(value, replacer, options) {
    let _replacer = null;
    if (typeof replacer === "function" || Array.isArray(replacer)) {
      _replacer = replacer;
    } else if (options === undefined && replacer) {
      options = replacer;
    }
    if (typeof options === "string")
      options = options.length;
    if (typeof options === "number") {
      const indent = Math.round(options);
      options = indent < 1 ? undefined : indent > 8 ? { indent: 8 } : { indent };
    }
    if (value === undefined) {
      const { keepUndefined } = options ?? replacer ?? {};
      if (!keepUndefined)
        return;
    }
    if (identity.isDocument(value) && !_replacer)
      return value.toString(options);
    return new Document.Document(value, _replacer, options).toString(options);
  }
  exports.parse = parse;
  exports.parseAllDocuments = parseAllDocuments;
  exports.parseDocument = parseDocument;
  exports.stringify = stringify;
});

// node_modules/adm-zip/util/constants.js
var require_constants = __commonJS((exports, module) => {
  module.exports = {
    LOCHDR: 30,
    LOCSIG: 67324752,
    LOCVER: 4,
    LOCFLG: 6,
    LOCHOW: 8,
    LOCTIM: 10,
    LOCCRC: 14,
    LOCSIZ: 18,
    LOCLEN: 22,
    LOCNAM: 26,
    LOCEXT: 28,
    EXTSIG: 134695760,
    EXTHDR: 16,
    EXTCRC: 4,
    EXTSIZ: 8,
    EXTLEN: 12,
    CENHDR: 46,
    CENSIG: 33639248,
    CENVEM: 4,
    CENVER: 6,
    CENFLG: 8,
    CENHOW: 10,
    CENTIM: 12,
    CENCRC: 16,
    CENSIZ: 20,
    CENLEN: 24,
    CENNAM: 28,
    CENEXT: 30,
    CENCOM: 32,
    CENDSK: 34,
    CENATT: 36,
    CENATX: 38,
    CENOFF: 42,
    ENDHDR: 22,
    ENDSIG: 101010256,
    ENDSUB: 8,
    ENDTOT: 10,
    ENDSIZ: 12,
    ENDOFF: 16,
    ENDCOM: 20,
    END64HDR: 20,
    END64SIG: 117853008,
    END64START: 4,
    END64OFF: 8,
    END64NUMDISKS: 16,
    ZIP64SIG: 101075792,
    ZIP64HDR: 56,
    ZIP64LEAD: 12,
    ZIP64SIZE: 4,
    ZIP64VEM: 12,
    ZIP64VER: 14,
    ZIP64DSK: 16,
    ZIP64DSKDIR: 20,
    ZIP64SUB: 24,
    ZIP64TOT: 32,
    ZIP64SIZB: 40,
    ZIP64OFF: 48,
    ZIP64EXTRA: 56,
    STORED: 0,
    SHRUNK: 1,
    REDUCED1: 2,
    REDUCED2: 3,
    REDUCED3: 4,
    REDUCED4: 5,
    IMPLODED: 6,
    DEFLATED: 8,
    ENHANCED_DEFLATED: 9,
    PKWARE: 10,
    BZIP2: 12,
    LZMA: 14,
    IBM_TERSE: 18,
    IBM_LZ77: 19,
    AES_ENCRYPT: 99,
    FLG_ENC: 1,
    FLG_COMP1: 2,
    FLG_COMP2: 4,
    FLG_DESC: 8,
    FLG_ENH: 16,
    FLG_PATCH: 32,
    FLG_STR: 64,
    FLG_EFS: 2048,
    FLG_MSK: 4096,
    FILE: 2,
    BUFFER: 1,
    NONE: 0,
    EF_ID: 0,
    EF_SIZE: 2,
    ID_ZIP64: 1,
    ID_AVINFO: 7,
    ID_PFS: 8,
    ID_OS2: 9,
    ID_NTFS: 10,
    ID_OPENVMS: 12,
    ID_UNIX: 13,
    ID_FORK: 14,
    ID_PATCH: 15,
    ID_X509_PKCS7: 20,
    ID_X509_CERTID_F: 21,
    ID_X509_CERTID_C: 22,
    ID_STRONGENC: 23,
    ID_RECORD_MGT: 24,
    ID_X509_PKCS7_RL: 25,
    ID_IBM1: 101,
    ID_IBM2: 102,
    ID_POSZIP: 18064,
    EF_ZIP64_OR_32: 4294967295,
    EF_ZIP64_OR_16: 65535,
    EF_ZIP64_SUNCOMP: 0,
    EF_ZIP64_SCOMP: 8,
    EF_ZIP64_RHO: 16,
    EF_ZIP64_DSN: 24
  };
});

// node_modules/adm-zip/util/errors.js
var require_errors2 = __commonJS((exports) => {
  var errors2 = {
    INVALID_LOC: "Invalid LOC header (bad signature)",
    INVALID_CEN: "Invalid CEN header (bad signature)",
    INVALID_END: "Invalid END header (bad signature)",
    DESCRIPTOR_NOT_EXIST: "No descriptor present",
    DESCRIPTOR_UNKNOWN: "Unknown descriptor format",
    DESCRIPTOR_FAULTY: "Descriptor data is malformed",
    NO_DATA: "Nothing to decompress",
    BAD_CRC: "CRC32 checksum failed {0}",
    FILE_IN_THE_WAY: "There is a file in the way: {0}",
    UNKNOWN_METHOD: "Invalid/unsupported compression method",
    AVAIL_DATA: "inflate::Available inflate data did not terminate",
    INVALID_DISTANCE: "inflate::Invalid literal/length or distance code in fixed or dynamic block",
    TO_MANY_CODES: "inflate::Dynamic block code description: too many length or distance codes",
    INVALID_REPEAT_LEN: "inflate::Dynamic block code description: repeat more than specified lengths",
    INVALID_REPEAT_FIRST: "inflate::Dynamic block code description: repeat lengths with no first length",
    INCOMPLETE_CODES: "inflate::Dynamic block code description: code lengths codes incomplete",
    INVALID_DYN_DISTANCE: "inflate::Dynamic block code description: invalid distance code lengths",
    INVALID_CODES_LEN: "inflate::Dynamic block code description: invalid literal/length code lengths",
    INVALID_STORE_BLOCK: "inflate::Stored block length did not match one's complement",
    INVALID_BLOCK_TYPE: "inflate::Invalid block type (type == 3)",
    CANT_EXTRACT_FILE: "Could not extract the file",
    CANT_OVERRIDE: "Target file already exists",
    DISK_ENTRY_TOO_LARGE: "Number of disk entries is too large",
    NO_ZIP: "No zip file was loaded",
    NO_ENTRY: "Entry doesn't exist",
    DIRECTORY_CONTENT_ERROR: "A directory cannot have content",
    FILE_NOT_FOUND: 'File not found: "{0}"',
    NOT_IMPLEMENTED: "Not implemented",
    INVALID_FILENAME: "Invalid filename",
    INVALID_FORMAT: "Invalid or unsupported zip format. No END header found",
    INVALID_PASS_PARAM: "Incompatible password parameter",
    WRONG_PASSWORD: "Wrong Password",
    COMMENT_TOO_LONG: "Comment is too long",
    EXTRA_FIELD_PARSE_ERROR: "Extra field parsing error"
  };
  function E(message) {
    return function(...args) {
      if (args.length) {
        message = message.replace(/\{(\d)\}/g, (_3, n) => args[n] || "");
      }
      return new Error("ADM-ZIP: " + message);
    };
  }
  for (const msg of Object.keys(errors2)) {
    exports[msg] = E(errors2[msg]);
  }
});

// node_modules/adm-zip/util/utils.js
var require_utils3 = __commonJS((exports, module) => {
  var fsystem = __require("fs");
  var pth = __require("path");
  var Constants = require_constants();
  var Errors = require_errors2();
  var isWin = typeof process === "object" && process.platform === "win32";
  var is_Obj = (obj) => typeof obj === "object" && obj !== null;
  var crcTable = new Uint32Array(256).map((t, c) => {
    for (let k3 = 0;k3 < 8; k3++) {
      if ((c & 1) !== 0) {
        c = 3988292384 ^ c >>> 1;
      } else {
        c >>>= 1;
      }
    }
    return c >>> 0;
  });
  function Utils(opts) {
    this.sep = pth.sep;
    this.fs = fsystem;
    if (is_Obj(opts)) {
      if (is_Obj(opts.fs) && typeof opts.fs.statSync === "function") {
        this.fs = opts.fs;
      }
    }
  }
  module.exports = Utils;
  Utils.prototype.makeDir = function(folder) {
    const self = this;
    function mkdirSync(fpath) {
      let resolvedPath = fpath.split(self.sep)[0];
      fpath.split(self.sep).forEach(function(name) {
        if (!name || name.substr(-1, 1) === ":")
          return;
        resolvedPath += self.sep + name;
        var stat;
        try {
          stat = self.fs.statSync(resolvedPath);
        } catch (e2) {
          if (e2.message && e2.message.startsWith("ENOENT")) {
            self.fs.mkdirSync(resolvedPath);
          } else {
            throw e2;
          }
        }
        if (stat && stat.isFile())
          throw Errors.FILE_IN_THE_WAY(`"${resolvedPath}"`);
      });
    }
    mkdirSync(folder);
  };
  Utils.prototype.writeFileTo = function(path, content, overwrite, attr) {
    const self = this;
    if (self.fs.existsSync(path)) {
      if (!overwrite)
        return false;
      var stat = self.fs.statSync(path);
      if (stat.isDirectory()) {
        return false;
      }
    }
    var folder = pth.dirname(path);
    if (!self.fs.existsSync(folder)) {
      self.makeDir(folder);
    }
    var fd;
    try {
      fd = self.fs.openSync(path, "w", 438);
    } catch (e2) {
      self.fs.chmodSync(path, 438);
      fd = self.fs.openSync(path, "w", 438);
    }
    if (fd) {
      try {
        self.fs.writeSync(fd, content, 0, content.length, 0);
      } finally {
        self.fs.closeSync(fd);
      }
    }
    self.fs.chmodSync(path, attr || 438);
    return true;
  };
  Utils.prototype.writeFileToAsync = function(path, content, overwrite, attr, callback) {
    if (typeof attr === "function") {
      callback = attr;
      attr = undefined;
    }
    const self = this;
    self.fs.exists(path, function(exist) {
      if (exist && !overwrite)
        return callback(false);
      self.fs.stat(path, function(err, stat) {
        if (exist && stat.isDirectory()) {
          return callback(false);
        }
        var folder = pth.dirname(path);
        self.fs.exists(folder, function(exists) {
          if (!exists)
            self.makeDir(folder);
          self.fs.open(path, "w", 438, function(err2, fd) {
            if (err2) {
              self.fs.chmod(path, 438, function() {
                self.fs.open(path, "w", 438, function(err3, fd2) {
                  self.fs.write(fd2, content, 0, content.length, 0, function() {
                    self.fs.close(fd2, function() {
                      self.fs.chmod(path, attr || 438, function() {
                        callback(true);
                      });
                    });
                  });
                });
              });
            } else if (fd) {
              self.fs.write(fd, content, 0, content.length, 0, function() {
                self.fs.close(fd, function() {
                  self.fs.chmod(path, attr || 438, function() {
                    callback(true);
                  });
                });
              });
            } else {
              self.fs.chmod(path, attr || 438, function() {
                callback(true);
              });
            }
          });
        });
      });
    });
  };
  Utils.prototype.findFiles = function(path) {
    const self = this;
    function findSync(dir, pattern, recursive) {
      if (typeof pattern === "boolean") {
        recursive = pattern;
        pattern = undefined;
      }
      let files = [];
      self.fs.readdirSync(dir).forEach(function(file) {
        const path2 = pth.join(dir, file);
        const stat = self.fs.statSync(path2);
        if (!pattern || pattern.test(path2)) {
          files.push(pth.normalize(path2) + (stat.isDirectory() ? self.sep : ""));
        }
        if (stat.isDirectory() && recursive)
          files = files.concat(findSync(path2, pattern, recursive));
      });
      return files;
    }
    return findSync(path, undefined, true);
  };
  Utils.prototype.findFilesAsync = function(dir, cb) {
    const self = this;
    let results = [];
    self.fs.readdir(dir, function(err, list) {
      if (err)
        return cb(err);
      let list_length = list.length;
      if (!list_length)
        return cb(null, results);
      list.forEach(function(file) {
        file = pth.join(dir, file);
        self.fs.stat(file, function(err2, stat) {
          if (err2)
            return cb(err2);
          if (stat) {
            results.push(pth.normalize(file) + (stat.isDirectory() ? self.sep : ""));
            if (stat.isDirectory()) {
              self.findFilesAsync(file, function(err3, res) {
                if (err3)
                  return cb(err3);
                results = results.concat(res);
                if (!--list_length)
                  cb(null, results);
              });
            } else {
              if (!--list_length)
                cb(null, results);
            }
          }
        });
      });
    });
  };
  Utils.prototype.getAttributes = function() {};
  Utils.prototype.setAttributes = function() {};
  Utils.crc32update = function(crc, byte) {
    return crcTable[(crc ^ byte) & 255] ^ crc >>> 8;
  };
  Utils.crc32 = function(buf) {
    if (typeof buf === "string") {
      buf = Buffer.from(buf, "utf8");
    }
    let len = buf.length;
    let crc = ~0;
    for (let off = 0;off < len; )
      crc = Utils.crc32update(crc, buf[off++]);
    return ~crc >>> 0;
  };
  Utils.methodToString = function(method) {
    switch (method) {
      case Constants.STORED:
        return "STORED (" + method + ")";
      case Constants.DEFLATED:
        return "DEFLATED (" + method + ")";
      default:
        return "UNSUPPORTED (" + method + ")";
    }
  };
  Utils.canonical = function(path) {
    if (!path)
      return "";
    const safeSuffix = pth.posix.normalize("/" + path.split("\\").join("/"));
    return pth.join(".", safeSuffix);
  };
  Utils.zipnamefix = function(path) {
    if (!path)
      return "";
    const safeSuffix = pth.posix.normalize("/" + path.split("\\").join("/"));
    return pth.posix.join(".", safeSuffix);
  };
  Utils.findLast = function(arr, callback) {
    if (!Array.isArray(arr))
      throw new TypeError("arr is not array");
    const len = arr.length >>> 0;
    for (let i = len - 1;i >= 0; i--) {
      if (callback(arr[i], i, arr)) {
        return arr[i];
      }
    }
    return;
  };
  Utils.sanitize = function(prefix, name) {
    prefix = pth.resolve(pth.normalize(prefix));
    var parts = name.split("/");
    for (var i = 0, l2 = parts.length;i < l2; i++) {
      var path = pth.normalize(pth.join(prefix, parts.slice(i, l2).join(pth.sep)));
      if (path.indexOf(prefix) === 0) {
        return path;
      }
    }
    return pth.normalize(pth.join(prefix, pth.basename(name)));
  };
  Utils.toBuffer = function toBuffer(input, encoder) {
    if (Buffer.isBuffer(input)) {
      return input;
    } else if (input instanceof Uint8Array) {
      return Buffer.from(input);
    } else {
      return typeof input === "string" ? encoder(input) : Buffer.alloc(0);
    }
  };
  Utils.readBigUInt64LE = function(buffer, index) {
    const lo = buffer.readUInt32LE(index);
    const hi = buffer.readUInt32LE(index + 4);
    return hi * 4294967296 + lo;
  };
  Utils.fromDOS2Date = function(val) {
    return new Date((val >> 25 & 127) + 1980, Math.max((val >> 21 & 15) - 1, 0), Math.max(val >> 16 & 31, 1), val >> 11 & 31, val >> 5 & 63, (val & 31) << 1);
  };
  Utils.fromDate2DOS = function(val) {
    let date = 0;
    let time = 0;
    if (val.getFullYear() > 1979) {
      date = (val.getFullYear() - 1980 & 127) << 9 | val.getMonth() + 1 << 5 | val.getDate();
      time = val.getHours() << 11 | val.getMinutes() << 5 | val.getSeconds() >> 1;
    }
    return date << 16 | time;
  };
  Utils.isWin = isWin;
  Utils.crcTable = crcTable;
});

// node_modules/adm-zip/util/fattr.js
var require_fattr = __commonJS((exports, module) => {
  var pth = __require("path");
  module.exports = function(path, { fs }) {
    var _path = path || "", _obj = newAttr(), _stat = null;
    function newAttr() {
      return {
        directory: false,
        readonly: false,
        hidden: false,
        executable: false,
        mtime: 0,
        atime: 0
      };
    }
    if (_path && fs.existsSync(_path)) {
      _stat = fs.statSync(_path);
      _obj.directory = _stat.isDirectory();
      _obj.mtime = _stat.mtime;
      _obj.atime = _stat.atime;
      _obj.executable = (73 & _stat.mode) !== 0;
      _obj.readonly = (128 & _stat.mode) === 0;
      _obj.hidden = pth.basename(_path)[0] === ".";
    } else {
      console.warn("Invalid path: " + _path);
    }
    return {
      get directory() {
        return _obj.directory;
      },
      get readOnly() {
        return _obj.readonly;
      },
      get hidden() {
        return _obj.hidden;
      },
      get mtime() {
        return _obj.mtime;
      },
      get atime() {
        return _obj.atime;
      },
      get executable() {
        return _obj.executable;
      },
      decodeAttributes: function() {},
      encodeAttributes: function() {},
      toJSON: function() {
        return {
          path: _path,
          isDirectory: _obj.directory,
          isReadOnly: _obj.readonly,
          isHidden: _obj.hidden,
          isExecutable: _obj.executable,
          mTime: _obj.mtime,
          aTime: _obj.atime
        };
      },
      toString: function() {
        return JSON.stringify(this.toJSON(), null, "\t");
      }
    };
  };
});

// node_modules/adm-zip/util/decoder.js
var require_decoder = __commonJS((exports, module) => {
  module.exports = {
    efs: true,
    encode: (data) => Buffer.from(data, "utf8"),
    decode: (data) => data.toString("utf8")
  };
});

// node_modules/adm-zip/util/index.js
var require_util = __commonJS((exports, module) => {
  module.exports = require_utils3();
  module.exports.Constants = require_constants();
  module.exports.Errors = require_errors2();
  module.exports.FileAttr = require_fattr();
  module.exports.decoder = require_decoder();
});

// node_modules/adm-zip/headers/entryHeader.js
var require_entryHeader = __commonJS((exports, module) => {
  var Utils = require_util();
  var Constants = Utils.Constants;
  module.exports = function() {
    var _verMade = 20, _version = 10, _flags = 0, _method = 0, _time = 0, _crc = 0, _compressedSize = 0, _size = 0, _fnameLen = 0, _extraLen = 0, _comLen = 0, _diskStart = 0, _inattr = 0, _attr = 0, _offset = 0;
    _verMade |= Utils.isWin ? 2560 : 768;
    _flags |= Constants.FLG_EFS;
    const _localHeader = {
      extraLen: 0
    };
    const uint32 = (val) => Math.max(0, val) >>> 0;
    const uint16 = (val) => Math.max(0, val) & 65535;
    const uint8 = (val) => Math.max(0, val) & 255;
    _time = Utils.fromDate2DOS(new Date);
    return {
      get made() {
        return _verMade;
      },
      set made(val) {
        _verMade = val;
      },
      get version() {
        return _version;
      },
      set version(val) {
        _version = val;
      },
      get flags() {
        return _flags;
      },
      set flags(val) {
        _flags = val;
      },
      get flags_efs() {
        return (_flags & Constants.FLG_EFS) > 0;
      },
      set flags_efs(val) {
        if (val) {
          _flags |= Constants.FLG_EFS;
        } else {
          _flags &= ~Constants.FLG_EFS;
        }
      },
      get flags_desc() {
        return (_flags & Constants.FLG_DESC) > 0;
      },
      set flags_desc(val) {
        if (val) {
          _flags |= Constants.FLG_DESC;
        } else {
          _flags &= ~Constants.FLG_DESC;
        }
      },
      get method() {
        return _method;
      },
      set method(val) {
        switch (val) {
          case Constants.STORED:
            this.version = 10;
          case Constants.DEFLATED:
          default:
            this.version = 20;
        }
        _method = val;
      },
      get time() {
        return Utils.fromDOS2Date(this.timeval);
      },
      set time(val) {
        val = new Date(val);
        this.timeval = Utils.fromDate2DOS(val);
      },
      get timeval() {
        return _time;
      },
      set timeval(val) {
        _time = uint32(val);
      },
      get timeHighByte() {
        return uint8(_time >>> 8);
      },
      get crc() {
        return _crc;
      },
      set crc(val) {
        _crc = uint32(val);
      },
      get compressedSize() {
        return _compressedSize;
      },
      set compressedSize(val) {
        _compressedSize = uint32(val);
      },
      get size() {
        return _size;
      },
      set size(val) {
        _size = uint32(val);
      },
      get fileNameLength() {
        return _fnameLen;
      },
      set fileNameLength(val) {
        _fnameLen = val;
      },
      get extraLength() {
        return _extraLen;
      },
      set extraLength(val) {
        _extraLen = val;
      },
      get extraLocalLength() {
        return _localHeader.extraLen;
      },
      set extraLocalLength(val) {
        _localHeader.extraLen = val;
      },
      get commentLength() {
        return _comLen;
      },
      set commentLength(val) {
        _comLen = val;
      },
      get diskNumStart() {
        return _diskStart;
      },
      set diskNumStart(val) {
        _diskStart = uint32(val);
      },
      get inAttr() {
        return _inattr;
      },
      set inAttr(val) {
        _inattr = uint32(val);
      },
      get attr() {
        return _attr;
      },
      set attr(val) {
        _attr = uint32(val);
      },
      get fileAttr() {
        return (_attr || 0) >> 16 & 4095;
      },
      get offset() {
        return _offset;
      },
      set offset(val) {
        _offset = uint32(val);
      },
      get encrypted() {
        return (_flags & Constants.FLG_ENC) === Constants.FLG_ENC;
      },
      get centralHeaderSize() {
        return Constants.CENHDR + _fnameLen + _extraLen + _comLen;
      },
      get realDataOffset() {
        return _offset + Constants.LOCHDR + _localHeader.fnameLen + _localHeader.extraLen;
      },
      get localHeader() {
        return _localHeader;
      },
      loadLocalHeaderFromBinary: function(input) {
        var data = input.slice(_offset, _offset + Constants.LOCHDR);
        if (data.readUInt32LE(0) !== Constants.LOCSIG) {
          throw Utils.Errors.INVALID_LOC();
        }
        _localHeader.version = data.readUInt16LE(Constants.LOCVER);
        _localHeader.flags = data.readUInt16LE(Constants.LOCFLG);
        _localHeader.flags_desc = (_localHeader.flags & Constants.FLG_DESC) > 0;
        _localHeader.method = data.readUInt16LE(Constants.LOCHOW);
        _localHeader.time = data.readUInt32LE(Constants.LOCTIM);
        _localHeader.crc = data.readUInt32LE(Constants.LOCCRC);
        _localHeader.compressedSize = data.readUInt32LE(Constants.LOCSIZ);
        _localHeader.size = data.readUInt32LE(Constants.LOCLEN);
        _localHeader.fnameLen = data.readUInt16LE(Constants.LOCNAM);
        _localHeader.extraLen = data.readUInt16LE(Constants.LOCEXT);
        const extraStart = _offset + Constants.LOCHDR + _localHeader.fnameLen;
        const extraEnd = extraStart + _localHeader.extraLen;
        return input.slice(extraStart, extraEnd);
      },
      loadFromBinary: function(data) {
        if (data.length !== Constants.CENHDR || data.readUInt32LE(0) !== Constants.CENSIG) {
          throw Utils.Errors.INVALID_CEN();
        }
        _verMade = data.readUInt16LE(Constants.CENVEM);
        _version = data.readUInt16LE(Constants.CENVER);
        _flags = data.readUInt16LE(Constants.CENFLG);
        _method = data.readUInt16LE(Constants.CENHOW);
        _time = data.readUInt32LE(Constants.CENTIM);
        _crc = data.readUInt32LE(Constants.CENCRC);
        _compressedSize = data.readUInt32LE(Constants.CENSIZ);
        _size = data.readUInt32LE(Constants.CENLEN);
        _fnameLen = data.readUInt16LE(Constants.CENNAM);
        _extraLen = data.readUInt16LE(Constants.CENEXT);
        _comLen = data.readUInt16LE(Constants.CENCOM);
        _diskStart = data.readUInt16LE(Constants.CENDSK);
        _inattr = data.readUInt16LE(Constants.CENATT);
        _attr = data.readUInt32LE(Constants.CENATX);
        _offset = data.readUInt32LE(Constants.CENOFF);
      },
      localHeaderToBinary: function() {
        var data = Buffer.alloc(Constants.LOCHDR);
        data.writeUInt32LE(Constants.LOCSIG, 0);
        data.writeUInt16LE(_version, Constants.LOCVER);
        data.writeUInt16LE(_flags, Constants.LOCFLG);
        data.writeUInt16LE(_method, Constants.LOCHOW);
        data.writeUInt32LE(_time, Constants.LOCTIM);
        data.writeUInt32LE(_crc, Constants.LOCCRC);
        data.writeUInt32LE(_compressedSize, Constants.LOCSIZ);
        data.writeUInt32LE(_size, Constants.LOCLEN);
        data.writeUInt16LE(_fnameLen, Constants.LOCNAM);
        data.writeUInt16LE(_localHeader.extraLen, Constants.LOCEXT);
        return data;
      },
      centralHeaderToBinary: function() {
        var data = Buffer.alloc(Constants.CENHDR + _fnameLen + _extraLen + _comLen);
        data.writeUInt32LE(Constants.CENSIG, 0);
        data.writeUInt16LE(_verMade, Constants.CENVEM);
        data.writeUInt16LE(_version, Constants.CENVER);
        data.writeUInt16LE(_flags, Constants.CENFLG);
        data.writeUInt16LE(_method, Constants.CENHOW);
        data.writeUInt32LE(_time, Constants.CENTIM);
        data.writeUInt32LE(_crc, Constants.CENCRC);
        data.writeUInt32LE(_compressedSize, Constants.CENSIZ);
        data.writeUInt32LE(_size, Constants.CENLEN);
        data.writeUInt16LE(_fnameLen, Constants.CENNAM);
        data.writeUInt16LE(_extraLen, Constants.CENEXT);
        data.writeUInt16LE(_comLen, Constants.CENCOM);
        data.writeUInt16LE(_diskStart, Constants.CENDSK);
        data.writeUInt16LE(_inattr, Constants.CENATT);
        data.writeUInt32LE(_attr, Constants.CENATX);
        data.writeUInt32LE(_offset, Constants.CENOFF);
        return data;
      },
      toJSON: function() {
        const bytes = function(nr) {
          return nr + " bytes";
        };
        return {
          made: _verMade,
          version: _version,
          flags: _flags,
          method: Utils.methodToString(_method),
          time: this.time,
          crc: "0x" + _crc.toString(16).toUpperCase(),
          compressedSize: bytes(_compressedSize),
          size: bytes(_size),
          fileNameLength: bytes(_fnameLen),
          extraLength: bytes(_extraLen),
          commentLength: bytes(_comLen),
          diskNumStart: _diskStart,
          inAttr: _inattr,
          attr: _attr,
          offset: _offset,
          centralHeaderSize: bytes(Constants.CENHDR + _fnameLen + _extraLen + _comLen)
        };
      },
      toString: function() {
        return JSON.stringify(this.toJSON(), null, "\t");
      }
    };
  };
});

// node_modules/adm-zip/headers/mainHeader.js
var require_mainHeader = __commonJS((exports, module) => {
  var Utils = require_util();
  var Constants = Utils.Constants;
  module.exports = function() {
    var _volumeEntries = 0, _totalEntries = 0, _size = 0, _offset = 0, _commentLength = 0;
    return {
      get diskEntries() {
        return _volumeEntries;
      },
      set diskEntries(val) {
        _volumeEntries = _totalEntries = val;
      },
      get totalEntries() {
        return _totalEntries;
      },
      set totalEntries(val) {
        _totalEntries = _volumeEntries = val;
      },
      get size() {
        return _size;
      },
      set size(val) {
        _size = val;
      },
      get offset() {
        return _offset;
      },
      set offset(val) {
        _offset = val;
      },
      get commentLength() {
        return _commentLength;
      },
      set commentLength(val) {
        _commentLength = val;
      },
      get mainHeaderSize() {
        return Constants.ENDHDR + _commentLength;
      },
      loadFromBinary: function(data) {
        if ((data.length !== Constants.ENDHDR || data.readUInt32LE(0) !== Constants.ENDSIG) && (data.length < Constants.ZIP64HDR || data.readUInt32LE(0) !== Constants.ZIP64SIG)) {
          throw Utils.Errors.INVALID_END();
        }
        if (data.readUInt32LE(0) === Constants.ENDSIG) {
          _volumeEntries = data.readUInt16LE(Constants.ENDSUB);
          _totalEntries = data.readUInt16LE(Constants.ENDTOT);
          _size = data.readUInt32LE(Constants.ENDSIZ);
          _offset = data.readUInt32LE(Constants.ENDOFF);
          _commentLength = data.readUInt16LE(Constants.ENDCOM);
        } else {
          _volumeEntries = Utils.readBigUInt64LE(data, Constants.ZIP64SUB);
          _totalEntries = Utils.readBigUInt64LE(data, Constants.ZIP64TOT);
          _size = Utils.readBigUInt64LE(data, Constants.ZIP64SIZE);
          _offset = Utils.readBigUInt64LE(data, Constants.ZIP64OFF);
          _commentLength = 0;
        }
      },
      toBinary: function() {
        var b3 = Buffer.alloc(Constants.ENDHDR + _commentLength);
        b3.writeUInt32LE(Constants.ENDSIG, 0);
        b3.writeUInt32LE(0, 4);
        b3.writeUInt16LE(_volumeEntries, Constants.ENDSUB);
        b3.writeUInt16LE(_totalEntries, Constants.ENDTOT);
        b3.writeUInt32LE(_size, Constants.ENDSIZ);
        b3.writeUInt32LE(_offset, Constants.ENDOFF);
        b3.writeUInt16LE(_commentLength, Constants.ENDCOM);
        b3.fill(" ", Constants.ENDHDR);
        return b3;
      },
      toJSON: function() {
        const offset = function(nr, len) {
          let offs = nr.toString(16).toUpperCase();
          while (offs.length < len)
            offs = "0" + offs;
          return "0x" + offs;
        };
        return {
          diskEntries: _volumeEntries,
          totalEntries: _totalEntries,
          size: _size + " bytes",
          offset: offset(_offset, 4),
          commentLength: _commentLength
        };
      },
      toString: function() {
        return JSON.stringify(this.toJSON(), null, "\t");
      }
    };
  };
});

// node_modules/adm-zip/headers/index.js
var require_headers = __commonJS((exports) => {
  exports.EntryHeader = require_entryHeader();
  exports.MainHeader = require_mainHeader();
});

// node_modules/adm-zip/methods/deflater.js
var require_deflater = __commonJS((exports, module) => {
  module.exports = function(inbuf) {
    var zlib = __require("zlib");
    var opts = { chunkSize: (parseInt(inbuf.length / 1024) + 1) * 1024 };
    return {
      deflate: function() {
        return zlib.deflateRawSync(inbuf, opts);
      },
      deflateAsync: function(callback) {
        var tmp = zlib.createDeflateRaw(opts), parts = [], total = 0;
        tmp.on("data", function(data) {
          parts.push(data);
          total += data.length;
        });
        tmp.on("end", function() {
          var buf = Buffer.alloc(total), written = 0;
          buf.fill(0);
          for (var i = 0;i < parts.length; i++) {
            var part = parts[i];
            part.copy(buf, written);
            written += part.length;
          }
          callback && callback(buf);
        });
        tmp.end(inbuf);
      }
    };
  };
});

// node_modules/adm-zip/methods/inflater.js
var require_inflater = __commonJS((exports, module) => {
  var version = +(process.versions ? process.versions.node : "").split(".")[0] || 0;
  module.exports = function(inbuf, expectedLength) {
    var zlib = __require("zlib");
    const option = version >= 15 && expectedLength > 0 ? { maxOutputLength: expectedLength } : {};
    return {
      inflate: function() {
        return zlib.inflateRawSync(inbuf, option);
      },
      inflateAsync: function(callback) {
        var tmp = zlib.createInflateRaw(option), parts = [], total = 0;
        tmp.on("data", function(data) {
          parts.push(data);
          total += data.length;
        });
        tmp.on("end", function() {
          var buf = Buffer.alloc(total), written = 0;
          buf.fill(0);
          for (var i = 0;i < parts.length; i++) {
            var part = parts[i];
            part.copy(buf, written);
            written += part.length;
          }
          callback && callback(buf);
        });
        tmp.end(inbuf);
      }
    };
  };
});

// node_modules/adm-zip/methods/zipcrypto.js
var require_zipcrypto = __commonJS((exports, module) => {
  var { randomFillSync } = __require("crypto");
  var Errors = require_errors2();
  var crctable = new Uint32Array(256).map((t, crc) => {
    for (let j2 = 0;j2 < 8; j2++) {
      if ((crc & 1) !== 0) {
        crc = crc >>> 1 ^ 3988292384;
      } else {
        crc >>>= 1;
      }
    }
    return crc >>> 0;
  });
  var uMul = (a, b3) => Math.imul(a, b3) >>> 0;
  var crc32update = (pCrc32, bval) => {
    return crctable[(pCrc32 ^ bval) & 255] ^ pCrc32 >>> 8;
  };
  var genSalt = () => {
    if (typeof randomFillSync === "function") {
      return randomFillSync(Buffer.alloc(12));
    } else {
      return genSalt.node();
    }
  };
  genSalt.node = () => {
    const salt = Buffer.alloc(12);
    const len = salt.length;
    for (let i = 0;i < len; i++)
      salt[i] = Math.random() * 256 & 255;
    return salt;
  };
  var config = {
    genSalt
  };
  function Initkeys(pw) {
    const pass = Buffer.isBuffer(pw) ? pw : Buffer.from(pw);
    this.keys = new Uint32Array([305419896, 591751049, 878082192]);
    for (let i = 0;i < pass.length; i++) {
      this.updateKeys(pass[i]);
    }
  }
  Initkeys.prototype.updateKeys = function(byteValue) {
    const keys = this.keys;
    keys[0] = crc32update(keys[0], byteValue);
    keys[1] += keys[0] & 255;
    keys[1] = uMul(keys[1], 134775813) + 1;
    keys[2] = crc32update(keys[2], keys[1] >>> 24);
    return byteValue;
  };
  Initkeys.prototype.next = function() {
    const k3 = (this.keys[2] | 2) >>> 0;
    return uMul(k3, k3 ^ 1) >> 8 & 255;
  };
  function make_decrypter(pwd) {
    const keys = new Initkeys(pwd);
    return function(data) {
      const result = Buffer.alloc(data.length);
      let pos = 0;
      for (let c of data) {
        result[pos++] = keys.updateKeys(c ^ keys.next());
      }
      return result;
    };
  }
  function make_encrypter(pwd) {
    const keys = new Initkeys(pwd);
    return function(data, result, pos = 0) {
      if (!result)
        result = Buffer.alloc(data.length);
      for (let c of data) {
        const k3 = keys.next();
        result[pos++] = c ^ k3;
        keys.updateKeys(c);
      }
      return result;
    };
  }
  function decrypt(data, header, pwd) {
    if (!data || !Buffer.isBuffer(data) || data.length < 12) {
      return Buffer.alloc(0);
    }
    const decrypter = make_decrypter(pwd);
    const salt = decrypter(data.slice(0, 12));
    const verifyByte = (header.flags & 8) === 8 ? header.timeHighByte : header.crc >>> 24;
    if (salt[11] !== verifyByte) {
      throw Errors.WRONG_PASSWORD();
    }
    return decrypter(data.slice(12));
  }
  function _salter(data) {
    if (Buffer.isBuffer(data) && data.length >= 12) {
      config.genSalt = function() {
        return data.slice(0, 12);
      };
    } else if (data === "node") {
      config.genSalt = genSalt.node;
    } else {
      config.genSalt = genSalt;
    }
  }
  function encrypt(data, header, pwd, oldlike = false) {
    if (data == null)
      data = Buffer.alloc(0);
    if (!Buffer.isBuffer(data))
      data = Buffer.from(data.toString());
    const encrypter = make_encrypter(pwd);
    const salt = config.genSalt();
    salt[11] = header.crc >>> 24 & 255;
    if (oldlike)
      salt[10] = header.crc >>> 16 & 255;
    const result = Buffer.alloc(data.length + 12);
    encrypter(salt, result);
    return encrypter(data, result, 12);
  }
  module.exports = { decrypt, encrypt, _salter };
});

// node_modules/adm-zip/methods/index.js
var require_methods = __commonJS((exports) => {
  exports.Deflater = require_deflater();
  exports.Inflater = require_inflater();
  exports.ZipCrypto = require_zipcrypto();
});

// node_modules/adm-zip/zipEntry.js
var require_zipEntry = __commonJS((exports, module) => {
  var Utils = require_util();
  var Headers = require_headers();
  var Constants = Utils.Constants;
  var Methods = require_methods();
  module.exports = function(options, input) {
    var _centralHeader = new Headers.EntryHeader, _entryName = Buffer.alloc(0), _comment = Buffer.alloc(0), _isDirectory = false, uncompressedData = null, _extra = Buffer.alloc(0), _extralocal = Buffer.alloc(0), _efs = true;
    const opts = options;
    const decoder = typeof opts.decoder === "object" ? opts.decoder : Utils.decoder;
    _efs = decoder.hasOwnProperty("efs") ? decoder.efs : false;
    function getCompressedDataFromZip() {
      if (!input || !(input instanceof Uint8Array)) {
        return Buffer.alloc(0);
      }
      _extralocal = _centralHeader.loadLocalHeaderFromBinary(input);
      return input.slice(_centralHeader.realDataOffset, _centralHeader.realDataOffset + _centralHeader.compressedSize);
    }
    function crc32OK(data) {
      if (!_centralHeader.flags_desc && !_centralHeader.localHeader.flags_desc) {
        if (Utils.crc32(data) !== _centralHeader.localHeader.crc) {
          return false;
        }
      } else {
        const descriptor = {};
        const dataEndOffset = _centralHeader.realDataOffset + _centralHeader.compressedSize;
        if (input.readUInt32LE(dataEndOffset) == Constants.LOCSIG || input.readUInt32LE(dataEndOffset) == Constants.CENSIG) {
          throw Utils.Errors.DESCRIPTOR_NOT_EXIST();
        }
        if (input.readUInt32LE(dataEndOffset) == Constants.EXTSIG) {
          descriptor.crc = input.readUInt32LE(dataEndOffset + Constants.EXTCRC);
          descriptor.compressedSize = input.readUInt32LE(dataEndOffset + Constants.EXTSIZ);
          descriptor.size = input.readUInt32LE(dataEndOffset + Constants.EXTLEN);
        } else if (input.readUInt16LE(dataEndOffset + 12) === 19280) {
          descriptor.crc = input.readUInt32LE(dataEndOffset + Constants.EXTCRC - 4);
          descriptor.compressedSize = input.readUInt32LE(dataEndOffset + Constants.EXTSIZ - 4);
          descriptor.size = input.readUInt32LE(dataEndOffset + Constants.EXTLEN - 4);
        } else {
          throw Utils.Errors.DESCRIPTOR_UNKNOWN();
        }
        if (descriptor.compressedSize !== _centralHeader.compressedSize || descriptor.size !== _centralHeader.size || descriptor.crc !== _centralHeader.crc) {
          throw Utils.Errors.DESCRIPTOR_FAULTY();
        }
        if (Utils.crc32(data) !== descriptor.crc) {
          return false;
        }
      }
      return true;
    }
    function decompress(async, callback, pass) {
      if (typeof callback === "undefined" && typeof async === "string") {
        pass = async;
        async = undefined;
      }
      if (_isDirectory) {
        if (async && callback) {
          callback(Buffer.alloc(0), Utils.Errors.DIRECTORY_CONTENT_ERROR());
        }
        return Buffer.alloc(0);
      }
      var compressedData = getCompressedDataFromZip();
      if (compressedData.length === 0) {
        if (async && callback)
          callback(compressedData);
        return compressedData;
      }
      if (_centralHeader.encrypted) {
        if (typeof pass !== "string" && !Buffer.isBuffer(pass)) {
          throw Utils.Errors.INVALID_PASS_PARAM();
        }
        compressedData = Methods.ZipCrypto.decrypt(compressedData, _centralHeader, pass);
      }
      var data = Buffer.alloc(_centralHeader.size);
      switch (_centralHeader.method) {
        case Utils.Constants.STORED:
          compressedData.copy(data);
          if (!crc32OK(data)) {
            if (async && callback)
              callback(data, Utils.Errors.BAD_CRC());
            throw Utils.Errors.BAD_CRC();
          } else {
            if (async && callback)
              callback(data);
            return data;
          }
        case Utils.Constants.DEFLATED:
          var inflater = new Methods.Inflater(compressedData, _centralHeader.size);
          if (!async) {
            const result = inflater.inflate(data);
            result.copy(data, 0);
            if (!crc32OK(data)) {
              throw Utils.Errors.BAD_CRC(`"${decoder.decode(_entryName)}"`);
            }
            return data;
          } else {
            inflater.inflateAsync(function(result) {
              result.copy(result, 0);
              if (callback) {
                if (!crc32OK(result)) {
                  callback(result, Utils.Errors.BAD_CRC());
                } else {
                  callback(result);
                }
              }
            });
          }
          break;
        default:
          if (async && callback)
            callback(Buffer.alloc(0), Utils.Errors.UNKNOWN_METHOD());
          throw Utils.Errors.UNKNOWN_METHOD();
      }
    }
    function compress(async, callback) {
      if ((!uncompressedData || !uncompressedData.length) && Buffer.isBuffer(input)) {
        if (async && callback)
          callback(getCompressedDataFromZip());
        return getCompressedDataFromZip();
      }
      if (uncompressedData.length && !_isDirectory) {
        var compressedData;
        switch (_centralHeader.method) {
          case Utils.Constants.STORED:
            _centralHeader.compressedSize = _centralHeader.size;
            compressedData = Buffer.alloc(uncompressedData.length);
            uncompressedData.copy(compressedData);
            if (async && callback)
              callback(compressedData);
            return compressedData;
          default:
          case Utils.Constants.DEFLATED:
            var deflater = new Methods.Deflater(uncompressedData);
            if (!async) {
              var deflated = deflater.deflate();
              _centralHeader.compressedSize = deflated.length;
              return deflated;
            } else {
              deflater.deflateAsync(function(data) {
                compressedData = Buffer.alloc(data.length);
                _centralHeader.compressedSize = data.length;
                data.copy(compressedData);
                callback && callback(compressedData);
              });
            }
            deflater = null;
            break;
        }
      } else if (async && callback) {
        callback(Buffer.alloc(0));
      } else {
        return Buffer.alloc(0);
      }
    }
    function readUInt64LE(buffer, offset) {
      return Utils.readBigUInt64LE(buffer, offset);
    }
    function parseExtra(data) {
      try {
        var offset = 0;
        var signature, size, part;
        while (offset + 4 < data.length) {
          signature = data.readUInt16LE(offset);
          offset += 2;
          size = data.readUInt16LE(offset);
          offset += 2;
          part = data.slice(offset, offset + size);
          offset += size;
          if (Constants.ID_ZIP64 === signature) {
            parseZip64ExtendedInformation(part);
          }
        }
      } catch (error) {
        throw Utils.Errors.EXTRA_FIELD_PARSE_ERROR();
      }
    }
    function parseZip64ExtendedInformation(data) {
      var size, compressedSize, offset, diskNumStart;
      if (data.length >= Constants.EF_ZIP64_SCOMP) {
        size = readUInt64LE(data, Constants.EF_ZIP64_SUNCOMP);
        if (_centralHeader.size === Constants.EF_ZIP64_OR_32) {
          _centralHeader.size = size;
        }
      }
      if (data.length >= Constants.EF_ZIP64_RHO) {
        compressedSize = readUInt64LE(data, Constants.EF_ZIP64_SCOMP);
        if (_centralHeader.compressedSize === Constants.EF_ZIP64_OR_32) {
          _centralHeader.compressedSize = compressedSize;
        }
      }
      if (data.length >= Constants.EF_ZIP64_DSN) {
        offset = readUInt64LE(data, Constants.EF_ZIP64_RHO);
        if (_centralHeader.offset === Constants.EF_ZIP64_OR_32) {
          _centralHeader.offset = offset;
        }
      }
      if (data.length >= Constants.EF_ZIP64_DSN + 4) {
        diskNumStart = data.readUInt32LE(Constants.EF_ZIP64_DSN);
        if (_centralHeader.diskNumStart === Constants.EF_ZIP64_OR_16) {
          _centralHeader.diskNumStart = diskNumStart;
        }
      }
    }
    return {
      get entryName() {
        return decoder.decode(_entryName);
      },
      get rawEntryName() {
        return _entryName;
      },
      set entryName(val) {
        _entryName = Utils.toBuffer(val, decoder.encode);
        var lastChar = _entryName[_entryName.length - 1];
        _isDirectory = lastChar === 47 || lastChar === 92;
        _centralHeader.fileNameLength = _entryName.length;
      },
      get efs() {
        if (typeof _efs === "function") {
          return _efs(this.entryName);
        } else {
          return _efs;
        }
      },
      get extra() {
        return _extra;
      },
      set extra(val) {
        _extra = val;
        _centralHeader.extraLength = val.length;
        parseExtra(val);
      },
      get comment() {
        return decoder.decode(_comment);
      },
      set comment(val) {
        _comment = Utils.toBuffer(val, decoder.encode);
        _centralHeader.commentLength = _comment.length;
        if (_comment.length > 65535)
          throw Utils.Errors.COMMENT_TOO_LONG();
      },
      get name() {
        var n = decoder.decode(_entryName);
        return _isDirectory ? n.substr(n.length - 1).split("/").pop() : n.split("/").pop();
      },
      get isDirectory() {
        return _isDirectory;
      },
      getCompressedData: function() {
        return compress(false, null);
      },
      getCompressedDataAsync: function(callback) {
        compress(true, callback);
      },
      setData: function(value) {
        uncompressedData = Utils.toBuffer(value, Utils.decoder.encode);
        if (!_isDirectory && uncompressedData.length) {
          _centralHeader.size = uncompressedData.length;
          _centralHeader.method = Utils.Constants.DEFLATED;
          _centralHeader.crc = Utils.crc32(value);
          _centralHeader.changed = true;
        } else {
          _centralHeader.method = Utils.Constants.STORED;
        }
      },
      getData: function(pass) {
        if (_centralHeader.changed) {
          return uncompressedData;
        } else {
          return decompress(false, null, pass);
        }
      },
      getDataAsync: function(callback, pass) {
        if (_centralHeader.changed) {
          callback(uncompressedData);
        } else {
          decompress(true, callback, pass);
        }
      },
      set attr(attr) {
        _centralHeader.attr = attr;
      },
      get attr() {
        return _centralHeader.attr;
      },
      set header(data) {
        _centralHeader.loadFromBinary(data);
      },
      get header() {
        return _centralHeader;
      },
      packCentralHeader: function() {
        _centralHeader.flags_efs = this.efs;
        _centralHeader.extraLength = _extra.length;
        var header = _centralHeader.centralHeaderToBinary();
        var addpos = Utils.Constants.CENHDR;
        _entryName.copy(header, addpos);
        addpos += _entryName.length;
        _extra.copy(header, addpos);
        addpos += _centralHeader.extraLength;
        _comment.copy(header, addpos);
        return header;
      },
      packLocalHeader: function() {
        let addpos = 0;
        _centralHeader.flags_efs = this.efs;
        _centralHeader.extraLocalLength = _extralocal.length;
        const localHeaderBuf = _centralHeader.localHeaderToBinary();
        const localHeader = Buffer.alloc(localHeaderBuf.length + _entryName.length + _centralHeader.extraLocalLength);
        localHeaderBuf.copy(localHeader, addpos);
        addpos += localHeaderBuf.length;
        _entryName.copy(localHeader, addpos);
        addpos += _entryName.length;
        _extralocal.copy(localHeader, addpos);
        addpos += _extralocal.length;
        return localHeader;
      },
      toJSON: function() {
        const bytes = function(nr) {
          return "<" + (nr && nr.length + " bytes buffer" || "null") + ">";
        };
        return {
          entryName: this.entryName,
          name: this.name,
          comment: this.comment,
          isDirectory: this.isDirectory,
          header: _centralHeader.toJSON(),
          compressedData: bytes(input),
          data: bytes(uncompressedData)
        };
      },
      toString: function() {
        return JSON.stringify(this.toJSON(), null, "\t");
      }
    };
  };
});

// node_modules/adm-zip/zipFile.js
var require_zipFile = __commonJS((exports, module) => {
  var ZipEntry = require_zipEntry();
  var Headers = require_headers();
  var Utils = require_util();
  module.exports = function(inBuffer, options) {
    var entryList = [], entryTable = {}, _comment = Buffer.alloc(0), mainHeader = new Headers.MainHeader, loadedEntries = false;
    var password = null;
    const temporary = new Set;
    const opts = options;
    const { noSort, decoder } = opts;
    if (inBuffer) {
      readMainHeader(opts.readEntries);
    } else {
      loadedEntries = true;
    }
    function makeTemporaryFolders() {
      const foldersList = new Set;
      for (const elem of Object.keys(entryTable)) {
        const elements = elem.split("/");
        elements.pop();
        if (!elements.length)
          continue;
        for (let i = 0;i < elements.length; i++) {
          const sub = elements.slice(0, i + 1).join("/") + "/";
          foldersList.add(sub);
        }
      }
      for (const elem of foldersList) {
        if (!(elem in entryTable)) {
          const tempfolder = new ZipEntry(opts);
          tempfolder.entryName = elem;
          tempfolder.attr = 16;
          tempfolder.temporary = true;
          entryList.push(tempfolder);
          entryTable[tempfolder.entryName] = tempfolder;
          temporary.add(tempfolder);
        }
      }
    }
    function readEntries() {
      loadedEntries = true;
      entryTable = {};
      if (mainHeader.diskEntries > (inBuffer.length - mainHeader.offset) / Utils.Constants.CENHDR) {
        throw Utils.Errors.DISK_ENTRY_TOO_LARGE();
      }
      entryList = new Array(mainHeader.diskEntries);
      var index = mainHeader.offset;
      for (var i = 0;i < entryList.length; i++) {
        var tmp = index, entry = new ZipEntry(opts, inBuffer);
        entry.header = inBuffer.slice(tmp, tmp += Utils.Constants.CENHDR);
        entry.entryName = inBuffer.slice(tmp, tmp += entry.header.fileNameLength);
        if (entry.header.extraLength) {
          entry.extra = inBuffer.slice(tmp, tmp += entry.header.extraLength);
        }
        if (entry.header.commentLength)
          entry.comment = inBuffer.slice(tmp, tmp + entry.header.commentLength);
        index += entry.header.centralHeaderSize;
        entryList[i] = entry;
        entryTable[entry.entryName] = entry;
      }
      temporary.clear();
      makeTemporaryFolders();
    }
    function readMainHeader(readNow) {
      var i = inBuffer.length - Utils.Constants.ENDHDR, max = Math.max(0, i - 65535), n = max, endStart = inBuffer.length, endOffset = -1, commentEnd = 0;
      const trailingSpace = typeof opts.trailingSpace === "boolean" ? opts.trailingSpace : false;
      if (trailingSpace)
        max = 0;
      for (i;i >= n; i--) {
        if (inBuffer[i] !== 80)
          continue;
        if (inBuffer.readUInt32LE(i) === Utils.Constants.ENDSIG) {
          endOffset = i;
          commentEnd = i;
          endStart = i + Utils.Constants.ENDHDR;
          n = i - Utils.Constants.END64HDR;
          continue;
        }
        if (inBuffer.readUInt32LE(i) === Utils.Constants.END64SIG) {
          n = max;
          continue;
        }
        if (inBuffer.readUInt32LE(i) === Utils.Constants.ZIP64SIG) {
          endOffset = i;
          endStart = i + Utils.readBigUInt64LE(inBuffer, i + Utils.Constants.ZIP64SIZE) + Utils.Constants.ZIP64LEAD;
          break;
        }
      }
      if (endOffset == -1)
        throw Utils.Errors.INVALID_FORMAT();
      mainHeader.loadFromBinary(inBuffer.slice(endOffset, endStart));
      if (mainHeader.commentLength) {
        _comment = inBuffer.slice(commentEnd + Utils.Constants.ENDHDR);
      }
      if (readNow)
        readEntries();
    }
    function sortEntries() {
      if (entryList.length > 1 && !noSort) {
        entryList.sort((a, b3) => a.entryName.toLowerCase().localeCompare(b3.entryName.toLowerCase()));
      }
    }
    return {
      get entries() {
        if (!loadedEntries) {
          readEntries();
        }
        return entryList.filter((e2) => !temporary.has(e2));
      },
      get comment() {
        return decoder.decode(_comment);
      },
      set comment(val) {
        _comment = Utils.toBuffer(val, decoder.encode);
        mainHeader.commentLength = _comment.length;
      },
      getEntryCount: function() {
        if (!loadedEntries) {
          return mainHeader.diskEntries;
        }
        return entryList.length;
      },
      forEach: function(callback) {
        this.entries.forEach(callback);
      },
      getEntry: function(entryName) {
        if (!loadedEntries) {
          readEntries();
        }
        return entryTable[entryName] || null;
      },
      setEntry: function(entry) {
        if (!loadedEntries) {
          readEntries();
        }
        entryList.push(entry);
        entryTable[entry.entryName] = entry;
        mainHeader.totalEntries = entryList.length;
      },
      deleteFile: function(entryName, withsubfolders = true) {
        if (!loadedEntries) {
          readEntries();
        }
        const entry = entryTable[entryName];
        const list = this.getEntryChildren(entry, withsubfolders).map((child) => child.entryName);
        list.forEach(this.deleteEntry);
      },
      deleteEntry: function(entryName) {
        if (!loadedEntries) {
          readEntries();
        }
        const entry = entryTable[entryName];
        const index = entryList.indexOf(entry);
        if (index >= 0) {
          entryList.splice(index, 1);
          delete entryTable[entryName];
          mainHeader.totalEntries = entryList.length;
        }
      },
      getEntryChildren: function(entry, subfolders = true) {
        if (!loadedEntries) {
          readEntries();
        }
        if (typeof entry === "object") {
          if (entry.isDirectory && subfolders) {
            const list = [];
            const name = entry.entryName;
            for (const zipEntry of entryList) {
              if (zipEntry.entryName.startsWith(name)) {
                list.push(zipEntry);
              }
            }
            return list;
          } else {
            return [entry];
          }
        }
        return [];
      },
      getChildCount: function(entry) {
        if (entry && entry.isDirectory) {
          const list = this.getEntryChildren(entry);
          return list.includes(entry) ? list.length - 1 : list.length;
        }
        return 0;
      },
      compressToBuffer: function() {
        if (!loadedEntries) {
          readEntries();
        }
        sortEntries();
        const dataBlock = [];
        const headerBlocks = [];
        let totalSize = 0;
        let dindex = 0;
        mainHeader.size = 0;
        mainHeader.offset = 0;
        let totalEntries = 0;
        for (const entry of this.entries) {
          const compressedData = entry.getCompressedData();
          entry.header.offset = dindex;
          const localHeader = entry.packLocalHeader();
          const dataLength = localHeader.length + compressedData.length;
          dindex += dataLength;
          dataBlock.push(localHeader);
          dataBlock.push(compressedData);
          const centralHeader = entry.packCentralHeader();
          headerBlocks.push(centralHeader);
          mainHeader.size += centralHeader.length;
          totalSize += dataLength + centralHeader.length;
          totalEntries++;
        }
        totalSize += mainHeader.mainHeaderSize;
        mainHeader.offset = dindex;
        mainHeader.totalEntries = totalEntries;
        dindex = 0;
        const outBuffer = Buffer.alloc(totalSize);
        for (const content of dataBlock) {
          content.copy(outBuffer, dindex);
          dindex += content.length;
        }
        for (const content of headerBlocks) {
          content.copy(outBuffer, dindex);
          dindex += content.length;
        }
        const mh = mainHeader.toBinary();
        if (_comment) {
          _comment.copy(mh, Utils.Constants.ENDHDR);
        }
        mh.copy(outBuffer, dindex);
        inBuffer = outBuffer;
        loadedEntries = false;
        return outBuffer;
      },
      toAsyncBuffer: function(onSuccess, onFail, onItemStart, onItemEnd) {
        try {
          if (!loadedEntries) {
            readEntries();
          }
          sortEntries();
          const dataBlock = [];
          const centralHeaders = [];
          let totalSize = 0;
          let dindex = 0;
          let totalEntries = 0;
          mainHeader.size = 0;
          mainHeader.offset = 0;
          const compress2Buffer = function(entryLists) {
            if (entryLists.length > 0) {
              const entry = entryLists.shift();
              const name = entry.entryName + entry.extra.toString();
              if (onItemStart)
                onItemStart(name);
              entry.getCompressedDataAsync(function(compressedData) {
                if (onItemEnd)
                  onItemEnd(name);
                entry.header.offset = dindex;
                const localHeader = entry.packLocalHeader();
                const dataLength = localHeader.length + compressedData.length;
                dindex += dataLength;
                dataBlock.push(localHeader);
                dataBlock.push(compressedData);
                const centalHeader = entry.packCentralHeader();
                centralHeaders.push(centalHeader);
                mainHeader.size += centalHeader.length;
                totalSize += dataLength + centalHeader.length;
                totalEntries++;
                compress2Buffer(entryLists);
              });
            } else {
              totalSize += mainHeader.mainHeaderSize;
              mainHeader.offset = dindex;
              mainHeader.totalEntries = totalEntries;
              dindex = 0;
              const outBuffer = Buffer.alloc(totalSize);
              dataBlock.forEach(function(content) {
                content.copy(outBuffer, dindex);
                dindex += content.length;
              });
              centralHeaders.forEach(function(content) {
                content.copy(outBuffer, dindex);
                dindex += content.length;
              });
              const mh = mainHeader.toBinary();
              if (_comment) {
                _comment.copy(mh, Utils.Constants.ENDHDR);
              }
              mh.copy(outBuffer, dindex);
              inBuffer = outBuffer;
              loadedEntries = false;
              onSuccess(outBuffer);
            }
          };
          compress2Buffer(Array.from(this.entries));
        } catch (e2) {
          onFail(e2);
        }
      }
    };
  };
});

// node_modules/adm-zip/adm-zip.js
var require_adm_zip = __commonJS((exports, module) => {
  var Utils = require_util();
  var pth = __require("path");
  var ZipEntry = require_zipEntry();
  var ZipFile = require_zipFile();
  var get_Bool = (...val) => Utils.findLast(val, (c) => typeof c === "boolean");
  var get_Str = (...val) => Utils.findLast(val, (c) => typeof c === "string");
  var get_Fun = (...val) => Utils.findLast(val, (c) => typeof c === "function");
  var defaultOptions = {
    noSort: false,
    readEntries: false,
    method: Utils.Constants.NONE,
    fs: null
  };
  module.exports = function(input, options) {
    let inBuffer = null;
    const opts = Object.assign(Object.create(null), defaultOptions);
    if (input && typeof input === "object") {
      if (!(input instanceof Uint8Array)) {
        Object.assign(opts, input);
        input = opts.input ? opts.input : undefined;
        if (opts.input)
          delete opts.input;
      }
      if (Buffer.isBuffer(input)) {
        inBuffer = input;
        opts.method = Utils.Constants.BUFFER;
        input = undefined;
      }
    }
    Object.assign(opts, options);
    const filetools = new Utils(opts);
    if (typeof opts.decoder !== "object" || typeof opts.decoder.encode !== "function" || typeof opts.decoder.decode !== "function") {
      opts.decoder = Utils.decoder;
    }
    if (input && typeof input === "string") {
      if (filetools.fs.existsSync(input)) {
        opts.method = Utils.Constants.FILE;
        opts.filename = input;
        inBuffer = filetools.fs.readFileSync(input);
      } else {
        throw Utils.Errors.INVALID_FILENAME();
      }
    }
    const _zip = new ZipFile(inBuffer, opts);
    const { canonical, sanitize, zipnamefix } = Utils;
    function getEntry(entry) {
      if (entry && _zip) {
        var item;
        if (typeof entry === "string")
          item = _zip.getEntry(pth.posix.normalize(entry));
        if (typeof entry === "object" && typeof entry.entryName !== "undefined" && typeof entry.header !== "undefined")
          item = _zip.getEntry(entry.entryName);
        if (item) {
          return item;
        }
      }
      return null;
    }
    function fixPath(zipPath) {
      const { join: join14, normalize, sep } = pth.posix;
      return join14(pth.isAbsolute(zipPath) ? "/" : ".", normalize(sep + zipPath.split("\\").join(sep) + sep));
    }
    function filenameFilter(filterfn) {
      if (filterfn instanceof RegExp) {
        return function(rx) {
          return function(filename) {
            return rx.test(filename);
          };
        }(filterfn);
      } else if (typeof filterfn !== "function") {
        return () => true;
      }
      return filterfn;
    }
    const relativePath = (local, entry) => {
      let lastChar = entry.slice(-1);
      lastChar = lastChar === filetools.sep ? filetools.sep : "";
      return pth.relative(local, entry) + lastChar;
    };
    return {
      readFile: function(entry, pass) {
        var item = getEntry(entry);
        return item && item.getData(pass) || null;
      },
      childCount: function(entry) {
        const item = getEntry(entry);
        if (item) {
          return _zip.getChildCount(item);
        }
      },
      readFileAsync: function(entry, callback) {
        var item = getEntry(entry);
        if (item) {
          item.getDataAsync(callback);
        } else {
          callback(null, "getEntry failed for:" + entry);
        }
      },
      readAsText: function(entry, encoding) {
        var item = getEntry(entry);
        if (item) {
          var data = item.getData();
          if (data && data.length) {
            return data.toString(encoding || "utf8");
          }
        }
        return "";
      },
      readAsTextAsync: function(entry, callback, encoding) {
        var item = getEntry(entry);
        if (item) {
          item.getDataAsync(function(data, err) {
            if (err) {
              callback(data, err);
              return;
            }
            if (data && data.length) {
              callback(data.toString(encoding || "utf8"));
            } else {
              callback("");
            }
          });
        } else {
          callback("");
        }
      },
      deleteFile: function(entry, withsubfolders = true) {
        var item = getEntry(entry);
        if (item) {
          _zip.deleteFile(item.entryName, withsubfolders);
        }
      },
      deleteEntry: function(entry) {
        var item = getEntry(entry);
        if (item) {
          _zip.deleteEntry(item.entryName);
        }
      },
      addZipComment: function(comment) {
        _zip.comment = comment;
      },
      getZipComment: function() {
        return _zip.comment || "";
      },
      addZipEntryComment: function(entry, comment) {
        var item = getEntry(entry);
        if (item) {
          item.comment = comment;
        }
      },
      getZipEntryComment: function(entry) {
        var item = getEntry(entry);
        if (item) {
          return item.comment || "";
        }
        return "";
      },
      updateFile: function(entry, content) {
        var item = getEntry(entry);
        if (item) {
          item.setData(content);
        }
      },
      addLocalFile: function(localPath2, zipPath, zipName, comment) {
        if (filetools.fs.existsSync(localPath2)) {
          zipPath = zipPath ? fixPath(zipPath) : "";
          const p2 = pth.win32.basename(pth.win32.normalize(localPath2));
          zipPath += zipName ? zipName : p2;
          const _attr = filetools.fs.statSync(localPath2);
          const data = _attr.isFile() ? filetools.fs.readFileSync(localPath2) : Buffer.alloc(0);
          if (_attr.isDirectory())
            zipPath += filetools.sep;
          this.addFile(zipPath, data, comment, _attr);
        } else {
          throw Utils.Errors.FILE_NOT_FOUND(localPath2);
        }
      },
      addLocalFileAsync: function(options2, callback) {
        options2 = typeof options2 === "object" ? options2 : { localPath: options2 };
        const localPath2 = pth.resolve(options2.localPath);
        const { comment } = options2;
        let { zipPath, zipName } = options2;
        const self = this;
        filetools.fs.stat(localPath2, function(err, stats) {
          if (err)
            return callback(err, false);
          zipPath = zipPath ? fixPath(zipPath) : "";
          const p2 = pth.win32.basename(pth.win32.normalize(localPath2));
          zipPath += zipName ? zipName : p2;
          if (stats.isFile()) {
            filetools.fs.readFile(localPath2, function(err2, data) {
              if (err2)
                return callback(err2, false);
              self.addFile(zipPath, data, comment, stats);
              return setImmediate(callback, undefined, true);
            });
          } else if (stats.isDirectory()) {
            zipPath += filetools.sep;
            self.addFile(zipPath, Buffer.alloc(0), comment, stats);
            return setImmediate(callback, undefined, true);
          }
        });
      },
      addLocalFolder: function(localPath2, zipPath, filter) {
        filter = filenameFilter(filter);
        zipPath = zipPath ? fixPath(zipPath) : "";
        localPath2 = pth.normalize(localPath2);
        if (filetools.fs.existsSync(localPath2)) {
          const items = filetools.findFiles(localPath2);
          const self = this;
          if (items.length) {
            for (const filepath of items) {
              const p2 = pth.join(zipPath, relativePath(localPath2, filepath));
              if (filter(p2)) {
                self.addLocalFile(filepath, pth.dirname(p2));
              }
            }
          }
        } else {
          throw Utils.Errors.FILE_NOT_FOUND(localPath2);
        }
      },
      addLocalFolderAsync: function(localPath2, callback, zipPath, filter) {
        filter = filenameFilter(filter);
        zipPath = zipPath ? fixPath(zipPath) : "";
        localPath2 = pth.normalize(localPath2);
        var self = this;
        filetools.fs.open(localPath2, "r", function(err) {
          if (err && err.code === "ENOENT") {
            callback(undefined, Utils.Errors.FILE_NOT_FOUND(localPath2));
          } else if (err) {
            callback(undefined, err);
          } else {
            var items = filetools.findFiles(localPath2);
            var i = -1;
            var next = function() {
              i += 1;
              if (i < items.length) {
                var filepath = items[i];
                var p2 = relativePath(localPath2, filepath).split("\\").join("/");
                p2 = p2.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^\x20-\x7E]/g, "");
                if (filter(p2)) {
                  filetools.fs.stat(filepath, function(er0, stats) {
                    if (er0)
                      callback(undefined, er0);
                    if (stats.isFile()) {
                      filetools.fs.readFile(filepath, function(er1, data) {
                        if (er1) {
                          callback(undefined, er1);
                        } else {
                          self.addFile(zipPath + p2, data, "", stats);
                          next();
                        }
                      });
                    } else {
                      self.addFile(zipPath + p2 + "/", Buffer.alloc(0), "", stats);
                      next();
                    }
                  });
                } else {
                  process.nextTick(() => {
                    next();
                  });
                }
              } else {
                callback(true, undefined);
              }
            };
            next();
          }
        });
      },
      addLocalFolderAsync2: function(options2, callback) {
        const self = this;
        options2 = typeof options2 === "object" ? options2 : { localPath: options2 };
        localPath = pth.resolve(fixPath(options2.localPath));
        let { zipPath, filter, namefix } = options2;
        if (filter instanceof RegExp) {
          filter = function(rx) {
            return function(filename) {
              return rx.test(filename);
            };
          }(filter);
        } else if (typeof filter !== "function") {
          filter = function() {
            return true;
          };
        }
        zipPath = zipPath ? fixPath(zipPath) : "";
        if (namefix == "latin1") {
          namefix = (str) => str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^\x20-\x7E]/g, "");
        }
        if (typeof namefix !== "function")
          namefix = (str) => str;
        const relPathFix = (entry) => pth.join(zipPath, namefix(relativePath(localPath, entry)));
        const fileNameFix = (entry) => pth.win32.basename(pth.win32.normalize(namefix(entry)));
        filetools.fs.open(localPath, "r", function(err) {
          if (err && err.code === "ENOENT") {
            callback(undefined, Utils.Errors.FILE_NOT_FOUND(localPath));
          } else if (err) {
            callback(undefined, err);
          } else {
            filetools.findFilesAsync(localPath, function(err2, fileEntries) {
              if (err2)
                return callback(err2);
              fileEntries = fileEntries.filter((dir) => filter(relPathFix(dir)));
              if (!fileEntries.length)
                callback(undefined, false);
              setImmediate(fileEntries.reverse().reduce(function(next, entry) {
                return function(err3, done) {
                  if (err3 || done === false)
                    return setImmediate(next, err3, false);
                  self.addLocalFileAsync({
                    localPath: entry,
                    zipPath: pth.dirname(relPathFix(entry)),
                    zipName: fileNameFix(entry)
                  }, next);
                };
              }, callback));
            });
          }
        });
      },
      addLocalFolderPromise: function(localPath2, props) {
        return new Promise((resolve5, reject) => {
          this.addLocalFolderAsync2(Object.assign({ localPath: localPath2 }, props), (err, done) => {
            if (err)
              reject(err);
            if (done)
              resolve5(this);
          });
        });
      },
      addFile: function(entryName, content, comment, attr) {
        entryName = zipnamefix(entryName);
        let entry = getEntry(entryName);
        const update = entry != null;
        if (!update) {
          entry = new ZipEntry(opts);
          entry.entryName = entryName;
        }
        entry.comment = comment || "";
        const isStat = typeof attr === "object" && attr instanceof filetools.fs.Stats;
        if (isStat) {
          entry.header.time = attr.mtime;
        }
        var fileattr = entry.isDirectory ? 16 : 0;
        let unix = entry.isDirectory ? 16384 : 32768;
        if (isStat) {
          unix |= 4095 & attr.mode;
        } else if (typeof attr === "number") {
          unix |= 4095 & attr;
        } else {
          unix |= entry.isDirectory ? 493 : 420;
        }
        fileattr = (fileattr | unix << 16) >>> 0;
        entry.attr = fileattr;
        entry.setData(content);
        if (!update)
          _zip.setEntry(entry);
        return entry;
      },
      getEntries: function(password) {
        _zip.password = password;
        return _zip ? _zip.entries : [];
      },
      getEntry: function(name) {
        return getEntry(name);
      },
      getEntryCount: function() {
        return _zip.getEntryCount();
      },
      forEach: function(callback) {
        return _zip.forEach(callback);
      },
      extractEntryTo: function(entry, targetPath, maintainEntryPath, overwrite, keepOriginalPermission, outFileName) {
        overwrite = get_Bool(false, overwrite);
        keepOriginalPermission = get_Bool(false, keepOriginalPermission);
        maintainEntryPath = get_Bool(true, maintainEntryPath);
        outFileName = get_Str(keepOriginalPermission, outFileName);
        var item = getEntry(entry);
        if (!item) {
          throw Utils.Errors.NO_ENTRY();
        }
        var entryName = canonical(item.entryName);
        var target = sanitize(targetPath, outFileName && !item.isDirectory ? outFileName : maintainEntryPath ? entryName : pth.basename(entryName));
        if (item.isDirectory) {
          var children = _zip.getEntryChildren(item);
          children.forEach(function(child) {
            if (child.isDirectory)
              return;
            var content2 = child.getData();
            if (!content2) {
              throw Utils.Errors.CANT_EXTRACT_FILE();
            }
            var name = canonical(child.entryName);
            var childName = sanitize(targetPath, maintainEntryPath ? name : pth.basename(name));
            const fileAttr2 = keepOriginalPermission ? child.header.fileAttr : undefined;
            filetools.writeFileTo(childName, content2, overwrite, fileAttr2);
          });
          return true;
        }
        var content = item.getData(_zip.password);
        if (!content)
          throw Utils.Errors.CANT_EXTRACT_FILE();
        if (filetools.fs.existsSync(target) && !overwrite) {
          throw Utils.Errors.CANT_OVERRIDE();
        }
        const fileAttr = keepOriginalPermission ? entry.header.fileAttr : undefined;
        filetools.writeFileTo(target, content, overwrite, fileAttr);
        return true;
      },
      test: function(pass) {
        if (!_zip) {
          return false;
        }
        for (var entry in _zip.entries) {
          try {
            if (entry.isDirectory) {
              continue;
            }
            var content = _zip.entries[entry].getData(pass);
            if (!content) {
              return false;
            }
          } catch (err) {
            return false;
          }
        }
        return true;
      },
      extractAllTo: function(targetPath, overwrite, keepOriginalPermission, pass) {
        keepOriginalPermission = get_Bool(false, keepOriginalPermission);
        pass = get_Str(keepOriginalPermission, pass);
        overwrite = get_Bool(false, overwrite);
        if (!_zip)
          throw Utils.Errors.NO_ZIP();
        _zip.entries.forEach(function(entry) {
          var entryName = sanitize(targetPath, canonical(entry.entryName));
          if (entry.isDirectory) {
            filetools.makeDir(entryName);
            return;
          }
          var content = entry.getData(pass);
          if (!content) {
            throw Utils.Errors.CANT_EXTRACT_FILE();
          }
          const fileAttr = keepOriginalPermission ? entry.header.fileAttr : undefined;
          filetools.writeFileTo(entryName, content, overwrite, fileAttr);
          try {
            filetools.fs.utimesSync(entryName, entry.header.time, entry.header.time);
          } catch (err) {
            throw Utils.Errors.CANT_EXTRACT_FILE();
          }
        });
      },
      extractAllToAsync: function(targetPath, overwrite, keepOriginalPermission, callback) {
        callback = get_Fun(overwrite, keepOriginalPermission, callback);
        keepOriginalPermission = get_Bool(false, keepOriginalPermission);
        overwrite = get_Bool(false, overwrite);
        if (!callback) {
          return new Promise((resolve5, reject) => {
            this.extractAllToAsync(targetPath, overwrite, keepOriginalPermission, function(err) {
              if (err) {
                reject(err);
              } else {
                resolve5(this);
              }
            });
          });
        }
        if (!_zip) {
          callback(Utils.Errors.NO_ZIP());
          return;
        }
        targetPath = pth.resolve(targetPath);
        const getPath = (entry) => sanitize(targetPath, pth.normalize(canonical(entry.entryName)));
        const getError = (msg, file) => new Error(msg + ': "' + file + '"');
        const dirEntries = [];
        const fileEntries = [];
        _zip.entries.forEach((e2) => {
          if (e2.isDirectory) {
            dirEntries.push(e2);
          } else {
            fileEntries.push(e2);
          }
        });
        for (const entry of dirEntries) {
          const dirPath = getPath(entry);
          const dirAttr = keepOriginalPermission ? entry.header.fileAttr : undefined;
          try {
            filetools.makeDir(dirPath);
            if (dirAttr)
              filetools.fs.chmodSync(dirPath, dirAttr);
            filetools.fs.utimesSync(dirPath, entry.header.time, entry.header.time);
          } catch (er) {
            callback(getError("Unable to create folder", dirPath));
          }
        }
        fileEntries.reverse().reduce(function(next, entry) {
          return function(err) {
            if (err) {
              next(err);
            } else {
              const entryName = pth.normalize(canonical(entry.entryName));
              const filePath = sanitize(targetPath, entryName);
              entry.getDataAsync(function(content, err_1) {
                if (err_1) {
                  next(err_1);
                } else if (!content) {
                  next(Utils.Errors.CANT_EXTRACT_FILE());
                } else {
                  const fileAttr = keepOriginalPermission ? entry.header.fileAttr : undefined;
                  filetools.writeFileToAsync(filePath, content, overwrite, fileAttr, function(succ) {
                    if (!succ) {
                      next(getError("Unable to write file", filePath));
                    }
                    filetools.fs.utimes(filePath, entry.header.time, entry.header.time, function(err_2) {
                      if (err_2) {
                        next(getError("Unable to set times", filePath));
                      } else {
                        next();
                      }
                    });
                  });
                }
              });
            }
          };
        }, callback)();
      },
      writeZip: function(targetFileName, callback) {
        if (arguments.length === 1) {
          if (typeof targetFileName === "function") {
            callback = targetFileName;
            targetFileName = "";
          }
        }
        if (!targetFileName && opts.filename) {
          targetFileName = opts.filename;
        }
        if (!targetFileName)
          return;
        var zipData = _zip.compressToBuffer();
        if (zipData) {
          var ok = filetools.writeFileTo(targetFileName, zipData, true);
          if (typeof callback === "function")
            callback(!ok ? new Error("failed") : null, "");
        }
      },
      writeZipPromise: function(targetFileName, props) {
        const { overwrite, perm } = Object.assign({ overwrite: true }, props);
        return new Promise((resolve5, reject) => {
          if (!targetFileName && opts.filename)
            targetFileName = opts.filename;
          if (!targetFileName)
            reject("ADM-ZIP: ZIP File Name Missing");
          this.toBufferPromise().then((zipData) => {
            const ret = (done) => done ? resolve5(done) : reject("ADM-ZIP: Wasn't able to write zip file");
            filetools.writeFileToAsync(targetFileName, zipData, overwrite, perm, ret);
          }, reject);
        });
      },
      toBufferPromise: function() {
        return new Promise((resolve5, reject) => {
          _zip.toAsyncBuffer(resolve5, reject);
        });
      },
      toBuffer: function(onSuccess, onFail, onItemStart, onItemEnd) {
        if (typeof onSuccess === "function") {
          _zip.toAsyncBuffer(onSuccess, onFail, onItemStart, onItemEnd);
          return null;
        }
        return _zip.compressToBuffer();
      }
    };
  };
});

// src/index.ts
init_esm();
var import_picocolors34 = __toESM(require_picocolors(), 1);
import { readFileSync as readFileSync3 } from "fs";
import { dirname as dirname7, join as join17 } from "path";
import { fileURLToPath as fileURLToPath2 } from "url";

// src/commands/add.ts
import { isAbsolute, join as join8, resolve } from "path";

// node_modules/@clack/core/dist/index.mjs
var import_sisteransi = __toESM(require_src(), 1);
var import_picocolors = __toESM(require_picocolors(), 1);
import { stdin as j, stdout as M } from "process";
import * as g from "readline";
import O from "readline";
import { Writable as X } from "stream";
function DD({ onlyFirst: e = false } = {}) {
  const t = ["[\\u001B\\u009B][[\\]()#;?]*(?:(?:(?:(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]+)*|[a-zA-Z\\d]+(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]*)*)?(?:\\u0007|\\u001B\\u005C|\\u009C))", "(?:(?:\\d{1,4}(?:;\\d{0,4})*)?[\\dA-PR-TZcf-nq-uy=><~]))"].join("|");
  return new RegExp(t, e ? undefined : "g");
}
var uD = DD();
function P(e) {
  if (typeof e != "string")
    throw new TypeError(`Expected a \`string\`, got \`${typeof e}\``);
  return e.replace(uD, "");
}
function L(e) {
  return e && e.__esModule && Object.prototype.hasOwnProperty.call(e, "default") ? e.default : e;
}
var W = { exports: {} };
(function(e) {
  var u = {};
  e.exports = u, u.eastAsianWidth = function(F) {
    var s = F.charCodeAt(0), i = F.length == 2 ? F.charCodeAt(1) : 0, D = s;
    return 55296 <= s && s <= 56319 && 56320 <= i && i <= 57343 && (s &= 1023, i &= 1023, D = s << 10 | i, D += 65536), D == 12288 || 65281 <= D && D <= 65376 || 65504 <= D && D <= 65510 ? "F" : D == 8361 || 65377 <= D && D <= 65470 || 65474 <= D && D <= 65479 || 65482 <= D && D <= 65487 || 65490 <= D && D <= 65495 || 65498 <= D && D <= 65500 || 65512 <= D && D <= 65518 ? "H" : 4352 <= D && D <= 4447 || 4515 <= D && D <= 4519 || 4602 <= D && D <= 4607 || 9001 <= D && D <= 9002 || 11904 <= D && D <= 11929 || 11931 <= D && D <= 12019 || 12032 <= D && D <= 12245 || 12272 <= D && D <= 12283 || 12289 <= D && D <= 12350 || 12353 <= D && D <= 12438 || 12441 <= D && D <= 12543 || 12549 <= D && D <= 12589 || 12593 <= D && D <= 12686 || 12688 <= D && D <= 12730 || 12736 <= D && D <= 12771 || 12784 <= D && D <= 12830 || 12832 <= D && D <= 12871 || 12880 <= D && D <= 13054 || 13056 <= D && D <= 19903 || 19968 <= D && D <= 42124 || 42128 <= D && D <= 42182 || 43360 <= D && D <= 43388 || 44032 <= D && D <= 55203 || 55216 <= D && D <= 55238 || 55243 <= D && D <= 55291 || 63744 <= D && D <= 64255 || 65040 <= D && D <= 65049 || 65072 <= D && D <= 65106 || 65108 <= D && D <= 65126 || 65128 <= D && D <= 65131 || 110592 <= D && D <= 110593 || 127488 <= D && D <= 127490 || 127504 <= D && D <= 127546 || 127552 <= D && D <= 127560 || 127568 <= D && D <= 127569 || 131072 <= D && D <= 194367 || 177984 <= D && D <= 196605 || 196608 <= D && D <= 262141 ? "W" : 32 <= D && D <= 126 || 162 <= D && D <= 163 || 165 <= D && D <= 166 || D == 172 || D == 175 || 10214 <= D && D <= 10221 || 10629 <= D && D <= 10630 ? "Na" : D == 161 || D == 164 || 167 <= D && D <= 168 || D == 170 || 173 <= D && D <= 174 || 176 <= D && D <= 180 || 182 <= D && D <= 186 || 188 <= D && D <= 191 || D == 198 || D == 208 || 215 <= D && D <= 216 || 222 <= D && D <= 225 || D == 230 || 232 <= D && D <= 234 || 236 <= D && D <= 237 || D == 240 || 242 <= D && D <= 243 || 247 <= D && D <= 250 || D == 252 || D == 254 || D == 257 || D == 273 || D == 275 || D == 283 || 294 <= D && D <= 295 || D == 299 || 305 <= D && D <= 307 || D == 312 || 319 <= D && D <= 322 || D == 324 || 328 <= D && D <= 331 || D == 333 || 338 <= D && D <= 339 || 358 <= D && D <= 359 || D == 363 || D == 462 || D == 464 || D == 466 || D == 468 || D == 470 || D == 472 || D == 474 || D == 476 || D == 593 || D == 609 || D == 708 || D == 711 || 713 <= D && D <= 715 || D == 717 || D == 720 || 728 <= D && D <= 731 || D == 733 || D == 735 || 768 <= D && D <= 879 || 913 <= D && D <= 929 || 931 <= D && D <= 937 || 945 <= D && D <= 961 || 963 <= D && D <= 969 || D == 1025 || 1040 <= D && D <= 1103 || D == 1105 || D == 8208 || 8211 <= D && D <= 8214 || 8216 <= D && D <= 8217 || 8220 <= D && D <= 8221 || 8224 <= D && D <= 8226 || 8228 <= D && D <= 8231 || D == 8240 || 8242 <= D && D <= 8243 || D == 8245 || D == 8251 || D == 8254 || D == 8308 || D == 8319 || 8321 <= D && D <= 8324 || D == 8364 || D == 8451 || D == 8453 || D == 8457 || D == 8467 || D == 8470 || 8481 <= D && D <= 8482 || D == 8486 || D == 8491 || 8531 <= D && D <= 8532 || 8539 <= D && D <= 8542 || 8544 <= D && D <= 8555 || 8560 <= D && D <= 8569 || D == 8585 || 8592 <= D && D <= 8601 || 8632 <= D && D <= 8633 || D == 8658 || D == 8660 || D == 8679 || D == 8704 || 8706 <= D && D <= 8707 || 8711 <= D && D <= 8712 || D == 8715 || D == 8719 || D == 8721 || D == 8725 || D == 8730 || 8733 <= D && D <= 8736 || D == 8739 || D == 8741 || 8743 <= D && D <= 8748 || D == 8750 || 8756 <= D && D <= 8759 || 8764 <= D && D <= 8765 || D == 8776 || D == 8780 || D == 8786 || 8800 <= D && D <= 8801 || 8804 <= D && D <= 8807 || 8810 <= D && D <= 8811 || 8814 <= D && D <= 8815 || 8834 <= D && D <= 8835 || 8838 <= D && D <= 8839 || D == 8853 || D == 8857 || D == 8869 || D == 8895 || D == 8978 || 9312 <= D && D <= 9449 || 9451 <= D && D <= 9547 || 9552 <= D && D <= 9587 || 9600 <= D && D <= 9615 || 9618 <= D && D <= 9621 || 9632 <= D && D <= 9633 || 9635 <= D && D <= 9641 || 9650 <= D && D <= 9651 || 9654 <= D && D <= 9655 || 9660 <= D && D <= 9661 || 9664 <= D && D <= 9665 || 9670 <= D && D <= 9672 || D == 9675 || 9678 <= D && D <= 9681 || 9698 <= D && D <= 9701 || D == 9711 || 9733 <= D && D <= 9734 || D == 9737 || 9742 <= D && D <= 9743 || 9748 <= D && D <= 9749 || D == 9756 || D == 9758 || D == 9792 || D == 9794 || 9824 <= D && D <= 9825 || 9827 <= D && D <= 9829 || 9831 <= D && D <= 9834 || 9836 <= D && D <= 9837 || D == 9839 || 9886 <= D && D <= 9887 || 9918 <= D && D <= 9919 || 9924 <= D && D <= 9933 || 9935 <= D && D <= 9953 || D == 9955 || 9960 <= D && D <= 9983 || D == 10045 || D == 10071 || 10102 <= D && D <= 10111 || 11093 <= D && D <= 11097 || 12872 <= D && D <= 12879 || 57344 <= D && D <= 63743 || 65024 <= D && D <= 65039 || D == 65533 || 127232 <= D && D <= 127242 || 127248 <= D && D <= 127277 || 127280 <= D && D <= 127337 || 127344 <= D && D <= 127386 || 917760 <= D && D <= 917999 || 983040 <= D && D <= 1048573 || 1048576 <= D && D <= 1114109 ? "A" : "N";
  }, u.characterLength = function(F) {
    var s = this.eastAsianWidth(F);
    return s == "F" || s == "W" || s == "A" ? 2 : 1;
  };
  function t(F) {
    return F.match(/[\uD800-\uDBFF][\uDC00-\uDFFF]|[^\uD800-\uDFFF]/g) || [];
  }
  u.length = function(F) {
    for (var s = t(F), i = 0, D = 0;D < s.length; D++)
      i = i + this.characterLength(s[D]);
    return i;
  }, u.slice = function(F, s, i) {
    textLen = u.length(F), s = s || 0, i = i || 1, s < 0 && (s = textLen + s), i < 0 && (i = textLen + i);
    for (var D = "", C = 0, n = t(F), E = 0;E < n.length; E++) {
      var a = n[E], o = u.length(a);
      if (C >= s - (o == 2 ? 1 : 0))
        if (C + o <= i)
          D += a;
        else
          break;
      C += o;
    }
    return D;
  };
})(W);
var tD = W.exports;
var eD = L(tD);
var FD = function() {
  return /\uD83C\uDFF4\uDB40\uDC67\uDB40\uDC62(?:\uDB40\uDC77\uDB40\uDC6C\uDB40\uDC73|\uDB40\uDC73\uDB40\uDC63\uDB40\uDC74|\uDB40\uDC65\uDB40\uDC6E\uDB40\uDC67)\uDB40\uDC7F|(?:\uD83E\uDDD1\uD83C\uDFFF\u200D\u2764\uFE0F\u200D(?:\uD83D\uDC8B\u200D)?\uD83E\uDDD1|\uD83D\uDC69\uD83C\uDFFF\u200D\uD83E\uDD1D\u200D(?:\uD83D[\uDC68\uDC69]))(?:\uD83C[\uDFFB-\uDFFE])|(?:\uD83E\uDDD1\uD83C\uDFFE\u200D\u2764\uFE0F\u200D(?:\uD83D\uDC8B\u200D)?\uD83E\uDDD1|\uD83D\uDC69\uD83C\uDFFE\u200D\uD83E\uDD1D\u200D(?:\uD83D[\uDC68\uDC69]))(?:\uD83C[\uDFFB-\uDFFD\uDFFF])|(?:\uD83E\uDDD1\uD83C\uDFFD\u200D\u2764\uFE0F\u200D(?:\uD83D\uDC8B\u200D)?\uD83E\uDDD1|\uD83D\uDC69\uD83C\uDFFD\u200D\uD83E\uDD1D\u200D(?:\uD83D[\uDC68\uDC69]))(?:\uD83C[\uDFFB\uDFFC\uDFFE\uDFFF])|(?:\uD83E\uDDD1\uD83C\uDFFC\u200D\u2764\uFE0F\u200D(?:\uD83D\uDC8B\u200D)?\uD83E\uDDD1|\uD83D\uDC69\uD83C\uDFFC\u200D\uD83E\uDD1D\u200D(?:\uD83D[\uDC68\uDC69]))(?:\uD83C[\uDFFB\uDFFD-\uDFFF])|(?:\uD83E\uDDD1\uD83C\uDFFB\u200D\u2764\uFE0F\u200D(?:\uD83D\uDC8B\u200D)?\uD83E\uDDD1|\uD83D\uDC69\uD83C\uDFFB\u200D\uD83E\uDD1D\u200D(?:\uD83D[\uDC68\uDC69]))(?:\uD83C[\uDFFC-\uDFFF])|\uD83D\uDC68(?:\uD83C\uDFFB(?:\u200D(?:\u2764\uFE0F\u200D(?:\uD83D\uDC8B\u200D\uD83D\uDC68(?:\uD83C[\uDFFB-\uDFFF])|\uD83D\uDC68(?:\uD83C[\uDFFB-\uDFFF]))|\uD83E\uDD1D\u200D\uD83D\uDC68(?:\uD83C[\uDFFC-\uDFFF])|[\u2695\u2696\u2708]\uFE0F|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD]))?|(?:\uD83C[\uDFFC-\uDFFF])\u200D\u2764\uFE0F\u200D(?:\uD83D\uDC8B\u200D\uD83D\uDC68(?:\uD83C[\uDFFB-\uDFFF])|\uD83D\uDC68(?:\uD83C[\uDFFB-\uDFFF]))|\u200D(?:\u2764\uFE0F\u200D(?:\uD83D\uDC8B\u200D)?\uD83D\uDC68|(?:\uD83D[\uDC68\uDC69])\u200D(?:\uD83D\uDC66\u200D\uD83D\uDC66|\uD83D\uDC67\u200D(?:\uD83D[\uDC66\uDC67]))|\uD83D\uDC66\u200D\uD83D\uDC66|\uD83D\uDC67\u200D(?:\uD83D[\uDC66\uDC67])|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|\uD83C\uDFFF\u200D(?:\uD83E\uDD1D\u200D\uD83D\uDC68(?:\uD83C[\uDFFB-\uDFFE])|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|\uD83C\uDFFE\u200D(?:\uD83E\uDD1D\u200D\uD83D\uDC68(?:\uD83C[\uDFFB-\uDFFD\uDFFF])|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|\uD83C\uDFFD\u200D(?:\uD83E\uDD1D\u200D\uD83D\uDC68(?:\uD83C[\uDFFB\uDFFC\uDFFE\uDFFF])|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|\uD83C\uDFFC\u200D(?:\uD83E\uDD1D\u200D\uD83D\uDC68(?:\uD83C[\uDFFB\uDFFD-\uDFFF])|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|(?:\uD83C\uDFFF\u200D[\u2695\u2696\u2708]|\uD83C\uDFFE\u200D[\u2695\u2696\u2708]|\uD83C\uDFFD\u200D[\u2695\u2696\u2708]|\uD83C\uDFFC\u200D[\u2695\u2696\u2708]|\u200D[\u2695\u2696\u2708])\uFE0F|\u200D(?:(?:\uD83D[\uDC68\uDC69])\u200D(?:\uD83D[\uDC66\uDC67])|\uD83D[\uDC66\uDC67])|\uD83C\uDFFF|\uD83C\uDFFE|\uD83C\uDFFD|\uD83C\uDFFC)?|(?:\uD83D\uDC69(?:\uD83C\uDFFB\u200D\u2764\uFE0F\u200D(?:\uD83D\uDC8B\u200D(?:\uD83D[\uDC68\uDC69])|\uD83D[\uDC68\uDC69])|(?:\uD83C[\uDFFC-\uDFFF])\u200D\u2764\uFE0F\u200D(?:\uD83D\uDC8B\u200D(?:\uD83D[\uDC68\uDC69])|\uD83D[\uDC68\uDC69]))|\uD83E\uDDD1(?:\uD83C[\uDFFB-\uDFFF])\u200D\uD83E\uDD1D\u200D\uD83E\uDDD1)(?:\uD83C[\uDFFB-\uDFFF])|\uD83D\uDC69\u200D\uD83D\uDC69\u200D(?:\uD83D\uDC66\u200D\uD83D\uDC66|\uD83D\uDC67\u200D(?:\uD83D[\uDC66\uDC67]))|\uD83D\uDC69(?:\u200D(?:\u2764\uFE0F\u200D(?:\uD83D\uDC8B\u200D(?:\uD83D[\uDC68\uDC69])|\uD83D[\uDC68\uDC69])|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|\uD83C\uDFFF\u200D(?:\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|\uD83C\uDFFE\u200D(?:\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|\uD83C\uDFFD\u200D(?:\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|\uD83C\uDFFC\u200D(?:\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|\uD83C\uDFFB\u200D(?:\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD]))|\uD83E\uDDD1(?:\u200D(?:\uD83E\uDD1D\u200D\uD83E\uDDD1|\uD83C[\uDF3E\uDF73\uDF7C\uDF84\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|\uD83C\uDFFF\u200D(?:\uD83C[\uDF3E\uDF73\uDF7C\uDF84\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|\uD83C\uDFFE\u200D(?:\uD83C[\uDF3E\uDF73\uDF7C\uDF84\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|\uD83C\uDFFD\u200D(?:\uD83C[\uDF3E\uDF73\uDF7C\uDF84\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|\uD83C\uDFFC\u200D(?:\uD83C[\uDF3E\uDF73\uDF7C\uDF84\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|\uD83C\uDFFB\u200D(?:\uD83C[\uDF3E\uDF73\uDF7C\uDF84\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD]))|\uD83D\uDC69\u200D\uD83D\uDC66\u200D\uD83D\uDC66|\uD83D\uDC69\u200D\uD83D\uDC69\u200D(?:\uD83D[\uDC66\uDC67])|\uD83D\uDC69\u200D\uD83D\uDC67\u200D(?:\uD83D[\uDC66\uDC67])|(?:\uD83D\uDC41\uFE0F\u200D\uD83D\uDDE8|\uD83E\uDDD1(?:\uD83C\uDFFF\u200D[\u2695\u2696\u2708]|\uD83C\uDFFE\u200D[\u2695\u2696\u2708]|\uD83C\uDFFD\u200D[\u2695\u2696\u2708]|\uD83C\uDFFC\u200D[\u2695\u2696\u2708]|\uD83C\uDFFB\u200D[\u2695\u2696\u2708]|\u200D[\u2695\u2696\u2708])|\uD83D\uDC69(?:\uD83C\uDFFF\u200D[\u2695\u2696\u2708]|\uD83C\uDFFE\u200D[\u2695\u2696\u2708]|\uD83C\uDFFD\u200D[\u2695\u2696\u2708]|\uD83C\uDFFC\u200D[\u2695\u2696\u2708]|\uD83C\uDFFB\u200D[\u2695\u2696\u2708]|\u200D[\u2695\u2696\u2708])|\uD83D\uDE36\u200D\uD83C\uDF2B|\uD83C\uDFF3\uFE0F\u200D\u26A7|\uD83D\uDC3B\u200D\u2744|(?:(?:\uD83C[\uDFC3\uDFC4\uDFCA]|\uD83D[\uDC6E\uDC70\uDC71\uDC73\uDC77\uDC81\uDC82\uDC86\uDC87\uDE45-\uDE47\uDE4B\uDE4D\uDE4E\uDEA3\uDEB4-\uDEB6]|\uD83E[\uDD26\uDD35\uDD37-\uDD39\uDD3D\uDD3E\uDDB8\uDDB9\uDDCD-\uDDCF\uDDD4\uDDD6-\uDDDD])(?:\uD83C[\uDFFB-\uDFFF])|\uD83D\uDC6F|\uD83E[\uDD3C\uDDDE\uDDDF])\u200D[\u2640\u2642]|(?:\u26F9|\uD83C[\uDFCB\uDFCC]|\uD83D\uDD75)(?:\uFE0F|\uD83C[\uDFFB-\uDFFF])\u200D[\u2640\u2642]|\uD83C\uDFF4\u200D\u2620|(?:\uD83C[\uDFC3\uDFC4\uDFCA]|\uD83D[\uDC6E\uDC70\uDC71\uDC73\uDC77\uDC81\uDC82\uDC86\uDC87\uDE45-\uDE47\uDE4B\uDE4D\uDE4E\uDEA3\uDEB4-\uDEB6]|\uD83E[\uDD26\uDD35\uDD37-\uDD39\uDD3D\uDD3E\uDDB8\uDDB9\uDDCD-\uDDCF\uDDD4\uDDD6-\uDDDD])\u200D[\u2640\u2642]|[\xA9\xAE\u203C\u2049\u2122\u2139\u2194-\u2199\u21A9\u21AA\u2328\u23CF\u23ED-\u23EF\u23F1\u23F2\u23F8-\u23FA\u24C2\u25AA\u25AB\u25B6\u25C0\u25FB\u25FC\u2600-\u2604\u260E\u2611\u2618\u2620\u2622\u2623\u2626\u262A\u262E\u262F\u2638-\u263A\u2640\u2642\u265F\u2660\u2663\u2665\u2666\u2668\u267B\u267E\u2692\u2694-\u2697\u2699\u269B\u269C\u26A0\u26A7\u26B0\u26B1\u26C8\u26CF\u26D1\u26D3\u26E9\u26F0\u26F1\u26F4\u26F7\u26F8\u2702\u2708\u2709\u270F\u2712\u2714\u2716\u271D\u2721\u2733\u2734\u2744\u2747\u2763\u27A1\u2934\u2935\u2B05-\u2B07\u3030\u303D\u3297\u3299]|\uD83C[\uDD70\uDD71\uDD7E\uDD7F\uDE02\uDE37\uDF21\uDF24-\uDF2C\uDF36\uDF7D\uDF96\uDF97\uDF99-\uDF9B\uDF9E\uDF9F\uDFCD\uDFCE\uDFD4-\uDFDF\uDFF5\uDFF7]|\uD83D[\uDC3F\uDCFD\uDD49\uDD4A\uDD6F\uDD70\uDD73\uDD76-\uDD79\uDD87\uDD8A-\uDD8D\uDDA5\uDDA8\uDDB1\uDDB2\uDDBC\uDDC2-\uDDC4\uDDD1-\uDDD3\uDDDC-\uDDDE\uDDE1\uDDE3\uDDE8\uDDEF\uDDF3\uDDFA\uDECB\uDECD-\uDECF\uDEE0-\uDEE5\uDEE9\uDEF0\uDEF3])\uFE0F|\uD83C\uDFF3\uFE0F\u200D\uD83C\uDF08|\uD83D\uDC69\u200D\uD83D\uDC67|\uD83D\uDC69\u200D\uD83D\uDC66|\uD83D\uDE35\u200D\uD83D\uDCAB|\uD83D\uDE2E\u200D\uD83D\uDCA8|\uD83D\uDC15\u200D\uD83E\uDDBA|\uD83E\uDDD1(?:\uD83C\uDFFF|\uD83C\uDFFE|\uD83C\uDFFD|\uD83C\uDFFC|\uD83C\uDFFB)?|\uD83D\uDC69(?:\uD83C\uDFFF|\uD83C\uDFFE|\uD83C\uDFFD|\uD83C\uDFFC|\uD83C\uDFFB)?|\uD83C\uDDFD\uD83C\uDDF0|\uD83C\uDDF6\uD83C\uDDE6|\uD83C\uDDF4\uD83C\uDDF2|\uD83D\uDC08\u200D\u2B1B|\u2764\uFE0F\u200D(?:\uD83D\uDD25|\uD83E\uDE79)|\uD83D\uDC41\uFE0F|\uD83C\uDFF3\uFE0F|\uD83C\uDDFF(?:\uD83C[\uDDE6\uDDF2\uDDFC])|\uD83C\uDDFE(?:\uD83C[\uDDEA\uDDF9])|\uD83C\uDDFC(?:\uD83C[\uDDEB\uDDF8])|\uD83C\uDDFB(?:\uD83C[\uDDE6\uDDE8\uDDEA\uDDEC\uDDEE\uDDF3\uDDFA])|\uD83C\uDDFA(?:\uD83C[\uDDE6\uDDEC\uDDF2\uDDF3\uDDF8\uDDFE\uDDFF])|\uD83C\uDDF9(?:\uD83C[\uDDE6\uDDE8\uDDE9\uDDEB-\uDDED\uDDEF-\uDDF4\uDDF7\uDDF9\uDDFB\uDDFC\uDDFF])|\uD83C\uDDF8(?:\uD83C[\uDDE6-\uDDEA\uDDEC-\uDDF4\uDDF7-\uDDF9\uDDFB\uDDFD-\uDDFF])|\uD83C\uDDF7(?:\uD83C[\uDDEA\uDDF4\uDDF8\uDDFA\uDDFC])|\uD83C\uDDF5(?:\uD83C[\uDDE6\uDDEA-\uDDED\uDDF0-\uDDF3\uDDF7-\uDDF9\uDDFC\uDDFE])|\uD83C\uDDF3(?:\uD83C[\uDDE6\uDDE8\uDDEA-\uDDEC\uDDEE\uDDF1\uDDF4\uDDF5\uDDF7\uDDFA\uDDFF])|\uD83C\uDDF2(?:\uD83C[\uDDE6\uDDE8-\uDDED\uDDF0-\uDDFF])|\uD83C\uDDF1(?:\uD83C[\uDDE6-\uDDE8\uDDEE\uDDF0\uDDF7-\uDDFB\uDDFE])|\uD83C\uDDF0(?:\uD83C[\uDDEA\uDDEC-\uDDEE\uDDF2\uDDF3\uDDF5\uDDF7\uDDFC\uDDFE\uDDFF])|\uD83C\uDDEF(?:\uD83C[\uDDEA\uDDF2\uDDF4\uDDF5])|\uD83C\uDDEE(?:\uD83C[\uDDE8-\uDDEA\uDDF1-\uDDF4\uDDF6-\uDDF9])|\uD83C\uDDED(?:\uD83C[\uDDF0\uDDF2\uDDF3\uDDF7\uDDF9\uDDFA])|\uD83C\uDDEC(?:\uD83C[\uDDE6\uDDE7\uDDE9-\uDDEE\uDDF1-\uDDF3\uDDF5-\uDDFA\uDDFC\uDDFE])|\uD83C\uDDEB(?:\uD83C[\uDDEE-\uDDF0\uDDF2\uDDF4\uDDF7])|\uD83C\uDDEA(?:\uD83C[\uDDE6\uDDE8\uDDEA\uDDEC\uDDED\uDDF7-\uDDFA])|\uD83C\uDDE9(?:\uD83C[\uDDEA\uDDEC\uDDEF\uDDF0\uDDF2\uDDF4\uDDFF])|\uD83C\uDDE8(?:\uD83C[\uDDE6\uDDE8\uDDE9\uDDEB-\uDDEE\uDDF0-\uDDF5\uDDF7\uDDFA-\uDDFF])|\uD83C\uDDE7(?:\uD83C[\uDDE6\uDDE7\uDDE9-\uDDEF\uDDF1-\uDDF4\uDDF6-\uDDF9\uDDFB\uDDFC\uDDFE\uDDFF])|\uD83C\uDDE6(?:\uD83C[\uDDE8-\uDDEC\uDDEE\uDDF1\uDDF2\uDDF4\uDDF6-\uDDFA\uDDFC\uDDFD\uDDFF])|[#\*0-9]\uFE0F\u20E3|\u2764\uFE0F|(?:\uD83C[\uDFC3\uDFC4\uDFCA]|\uD83D[\uDC6E\uDC70\uDC71\uDC73\uDC77\uDC81\uDC82\uDC86\uDC87\uDE45-\uDE47\uDE4B\uDE4D\uDE4E\uDEA3\uDEB4-\uDEB6]|\uD83E[\uDD26\uDD35\uDD37-\uDD39\uDD3D\uDD3E\uDDB8\uDDB9\uDDCD-\uDDCF\uDDD4\uDDD6-\uDDDD])(?:\uD83C[\uDFFB-\uDFFF])|(?:\u26F9|\uD83C[\uDFCB\uDFCC]|\uD83D\uDD75)(?:\uFE0F|\uD83C[\uDFFB-\uDFFF])|\uD83C\uDFF4|(?:[\u270A\u270B]|\uD83C[\uDF85\uDFC2\uDFC7]|\uD83D[\uDC42\uDC43\uDC46-\uDC50\uDC66\uDC67\uDC6B-\uDC6D\uDC72\uDC74-\uDC76\uDC78\uDC7C\uDC83\uDC85\uDC8F\uDC91\uDCAA\uDD7A\uDD95\uDD96\uDE4C\uDE4F\uDEC0\uDECC]|\uD83E[\uDD0C\uDD0F\uDD18-\uDD1C\uDD1E\uDD1F\uDD30-\uDD34\uDD36\uDD77\uDDB5\uDDB6\uDDBB\uDDD2\uDDD3\uDDD5])(?:\uD83C[\uDFFB-\uDFFF])|(?:[\u261D\u270C\u270D]|\uD83D[\uDD74\uDD90])(?:\uFE0F|\uD83C[\uDFFB-\uDFFF])|[\u270A\u270B]|\uD83C[\uDF85\uDFC2\uDFC7]|\uD83D[\uDC08\uDC15\uDC3B\uDC42\uDC43\uDC46-\uDC50\uDC66\uDC67\uDC6B-\uDC6D\uDC72\uDC74-\uDC76\uDC78\uDC7C\uDC83\uDC85\uDC8F\uDC91\uDCAA\uDD7A\uDD95\uDD96\uDE2E\uDE35\uDE36\uDE4C\uDE4F\uDEC0\uDECC]|\uD83E[\uDD0C\uDD0F\uDD18-\uDD1C\uDD1E\uDD1F\uDD30-\uDD34\uDD36\uDD77\uDDB5\uDDB6\uDDBB\uDDD2\uDDD3\uDDD5]|\uD83C[\uDFC3\uDFC4\uDFCA]|\uD83D[\uDC6E\uDC70\uDC71\uDC73\uDC77\uDC81\uDC82\uDC86\uDC87\uDE45-\uDE47\uDE4B\uDE4D\uDE4E\uDEA3\uDEB4-\uDEB6]|\uD83E[\uDD26\uDD35\uDD37-\uDD39\uDD3D\uDD3E\uDDB8\uDDB9\uDDCD-\uDDCF\uDDD4\uDDD6-\uDDDD]|\uD83D\uDC6F|\uD83E[\uDD3C\uDDDE\uDDDF]|[\u231A\u231B\u23E9-\u23EC\u23F0\u23F3\u25FD\u25FE\u2614\u2615\u2648-\u2653\u267F\u2693\u26A1\u26AA\u26AB\u26BD\u26BE\u26C4\u26C5\u26CE\u26D4\u26EA\u26F2\u26F3\u26F5\u26FA\u26FD\u2705\u2728\u274C\u274E\u2753-\u2755\u2757\u2795-\u2797\u27B0\u27BF\u2B1B\u2B1C\u2B50\u2B55]|\uD83C[\uDC04\uDCCF\uDD8E\uDD91-\uDD9A\uDE01\uDE1A\uDE2F\uDE32-\uDE36\uDE38-\uDE3A\uDE50\uDE51\uDF00-\uDF20\uDF2D-\uDF35\uDF37-\uDF7C\uDF7E-\uDF84\uDF86-\uDF93\uDFA0-\uDFC1\uDFC5\uDFC6\uDFC8\uDFC9\uDFCF-\uDFD3\uDFE0-\uDFF0\uDFF8-\uDFFF]|\uD83D[\uDC00-\uDC07\uDC09-\uDC14\uDC16-\uDC3A\uDC3C-\uDC3E\uDC40\uDC44\uDC45\uDC51-\uDC65\uDC6A\uDC79-\uDC7B\uDC7D-\uDC80\uDC84\uDC88-\uDC8E\uDC90\uDC92-\uDCA9\uDCAB-\uDCFC\uDCFF-\uDD3D\uDD4B-\uDD4E\uDD50-\uDD67\uDDA4\uDDFB-\uDE2D\uDE2F-\uDE34\uDE37-\uDE44\uDE48-\uDE4A\uDE80-\uDEA2\uDEA4-\uDEB3\uDEB7-\uDEBF\uDEC1-\uDEC5\uDED0-\uDED2\uDED5-\uDED7\uDEEB\uDEEC\uDEF4-\uDEFC\uDFE0-\uDFEB]|\uD83E[\uDD0D\uDD0E\uDD10-\uDD17\uDD1D\uDD20-\uDD25\uDD27-\uDD2F\uDD3A\uDD3F-\uDD45\uDD47-\uDD76\uDD78\uDD7A-\uDDB4\uDDB7\uDDBA\uDDBC-\uDDCB\uDDD0\uDDE0-\uDDFF\uDE70-\uDE74\uDE78-\uDE7A\uDE80-\uDE86\uDE90-\uDEA8\uDEB0-\uDEB6\uDEC0-\uDEC2\uDED0-\uDED6]|(?:[\u231A\u231B\u23E9-\u23EC\u23F0\u23F3\u25FD\u25FE\u2614\u2615\u2648-\u2653\u267F\u2693\u26A1\u26AA\u26AB\u26BD\u26BE\u26C4\u26C5\u26CE\u26D4\u26EA\u26F2\u26F3\u26F5\u26FA\u26FD\u2705\u270A\u270B\u2728\u274C\u274E\u2753-\u2755\u2757\u2795-\u2797\u27B0\u27BF\u2B1B\u2B1C\u2B50\u2B55]|\uD83C[\uDC04\uDCCF\uDD8E\uDD91-\uDD9A\uDDE6-\uDDFF\uDE01\uDE1A\uDE2F\uDE32-\uDE36\uDE38-\uDE3A\uDE50\uDE51\uDF00-\uDF20\uDF2D-\uDF35\uDF37-\uDF7C\uDF7E-\uDF93\uDFA0-\uDFCA\uDFCF-\uDFD3\uDFE0-\uDFF0\uDFF4\uDFF8-\uDFFF]|\uD83D[\uDC00-\uDC3E\uDC40\uDC42-\uDCFC\uDCFF-\uDD3D\uDD4B-\uDD4E\uDD50-\uDD67\uDD7A\uDD95\uDD96\uDDA4\uDDFB-\uDE4F\uDE80-\uDEC5\uDECC\uDED0-\uDED2\uDED5-\uDED7\uDEEB\uDEEC\uDEF4-\uDEFC\uDFE0-\uDFEB]|\uD83E[\uDD0C-\uDD3A\uDD3C-\uDD45\uDD47-\uDD78\uDD7A-\uDDCB\uDDCD-\uDDFF\uDE70-\uDE74\uDE78-\uDE7A\uDE80-\uDE86\uDE90-\uDEA8\uDEB0-\uDEB6\uDEC0-\uDEC2\uDED0-\uDED6])|(?:[#\*0-9\xA9\xAE\u203C\u2049\u2122\u2139\u2194-\u2199\u21A9\u21AA\u231A\u231B\u2328\u23CF\u23E9-\u23F3\u23F8-\u23FA\u24C2\u25AA\u25AB\u25B6\u25C0\u25FB-\u25FE\u2600-\u2604\u260E\u2611\u2614\u2615\u2618\u261D\u2620\u2622\u2623\u2626\u262A\u262E\u262F\u2638-\u263A\u2640\u2642\u2648-\u2653\u265F\u2660\u2663\u2665\u2666\u2668\u267B\u267E\u267F\u2692-\u2697\u2699\u269B\u269C\u26A0\u26A1\u26A7\u26AA\u26AB\u26B0\u26B1\u26BD\u26BE\u26C4\u26C5\u26C8\u26CE\u26CF\u26D1\u26D3\u26D4\u26E9\u26EA\u26F0-\u26F5\u26F7-\u26FA\u26FD\u2702\u2705\u2708-\u270D\u270F\u2712\u2714\u2716\u271D\u2721\u2728\u2733\u2734\u2744\u2747\u274C\u274E\u2753-\u2755\u2757\u2763\u2764\u2795-\u2797\u27A1\u27B0\u27BF\u2934\u2935\u2B05-\u2B07\u2B1B\u2B1C\u2B50\u2B55\u3030\u303D\u3297\u3299]|\uD83C[\uDC04\uDCCF\uDD70\uDD71\uDD7E\uDD7F\uDD8E\uDD91-\uDD9A\uDDE6-\uDDFF\uDE01\uDE02\uDE1A\uDE2F\uDE32-\uDE3A\uDE50\uDE51\uDF00-\uDF21\uDF24-\uDF93\uDF96\uDF97\uDF99-\uDF9B\uDF9E-\uDFF0\uDFF3-\uDFF5\uDFF7-\uDFFF]|\uD83D[\uDC00-\uDCFD\uDCFF-\uDD3D\uDD49-\uDD4E\uDD50-\uDD67\uDD6F\uDD70\uDD73-\uDD7A\uDD87\uDD8A-\uDD8D\uDD90\uDD95\uDD96\uDDA4\uDDA5\uDDA8\uDDB1\uDDB2\uDDBC\uDDC2-\uDDC4\uDDD1-\uDDD3\uDDDC-\uDDDE\uDDE1\uDDE3\uDDE8\uDDEF\uDDF3\uDDFA-\uDE4F\uDE80-\uDEC5\uDECB-\uDED2\uDED5-\uDED7\uDEE0-\uDEE5\uDEE9\uDEEB\uDEEC\uDEF0\uDEF3-\uDEFC\uDFE0-\uDFEB]|\uD83E[\uDD0C-\uDD3A\uDD3C-\uDD45\uDD47-\uDD78\uDD7A-\uDDCB\uDDCD-\uDDFF\uDE70-\uDE74\uDE78-\uDE7A\uDE80-\uDE86\uDE90-\uDEA8\uDEB0-\uDEB6\uDEC0-\uDEC2\uDED0-\uDED6])\uFE0F|(?:[\u261D\u26F9\u270A-\u270D]|\uD83C[\uDF85\uDFC2-\uDFC4\uDFC7\uDFCA-\uDFCC]|\uD83D[\uDC42\uDC43\uDC46-\uDC50\uDC66-\uDC78\uDC7C\uDC81-\uDC83\uDC85-\uDC87\uDC8F\uDC91\uDCAA\uDD74\uDD75\uDD7A\uDD90\uDD95\uDD96\uDE45-\uDE47\uDE4B-\uDE4F\uDEA3\uDEB4-\uDEB6\uDEC0\uDECC]|\uD83E[\uDD0C\uDD0F\uDD18-\uDD1F\uDD26\uDD30-\uDD39\uDD3C-\uDD3E\uDD77\uDDB5\uDDB6\uDDB8\uDDB9\uDDBB\uDDCD-\uDDCF\uDDD1-\uDDDD])/g;
};
var sD = L(FD);
function p(e, u = {}) {
  if (typeof e != "string" || e.length === 0 || (u = { ambiguousIsNarrow: true, ...u }, e = P(e), e.length === 0))
    return 0;
  e = e.replace(sD(), "  ");
  const t = u.ambiguousIsNarrow ? 1 : 2;
  let F = 0;
  for (const s of e) {
    const i = s.codePointAt(0);
    if (i <= 31 || i >= 127 && i <= 159 || i >= 768 && i <= 879)
      continue;
    switch (eD.eastAsianWidth(s)) {
      case "F":
      case "W":
        F += 2;
        break;
      case "A":
        F += t;
        break;
      default:
        F += 1;
    }
  }
  return F;
}
var w = 10;
var N = (e = 0) => (u) => `\x1B[${u + e}m`;
var I = (e = 0) => (u) => `\x1B[${38 + e};5;${u}m`;
var R = (e = 0) => (u, t, F) => `\x1B[${38 + e};2;${u};${t};${F}m`;
var r = { modifier: { reset: [0, 0], bold: [1, 22], dim: [2, 22], italic: [3, 23], underline: [4, 24], overline: [53, 55], inverse: [7, 27], hidden: [8, 28], strikethrough: [9, 29] }, color: { black: [30, 39], red: [31, 39], green: [32, 39], yellow: [33, 39], blue: [34, 39], magenta: [35, 39], cyan: [36, 39], white: [37, 39], blackBright: [90, 39], gray: [90, 39], grey: [90, 39], redBright: [91, 39], greenBright: [92, 39], yellowBright: [93, 39], blueBright: [94, 39], magentaBright: [95, 39], cyanBright: [96, 39], whiteBright: [97, 39] }, bgColor: { bgBlack: [40, 49], bgRed: [41, 49], bgGreen: [42, 49], bgYellow: [43, 49], bgBlue: [44, 49], bgMagenta: [45, 49], bgCyan: [46, 49], bgWhite: [47, 49], bgBlackBright: [100, 49], bgGray: [100, 49], bgGrey: [100, 49], bgRedBright: [101, 49], bgGreenBright: [102, 49], bgYellowBright: [103, 49], bgBlueBright: [104, 49], bgMagentaBright: [105, 49], bgCyanBright: [106, 49], bgWhiteBright: [107, 49] } };
Object.keys(r.modifier);
var iD = Object.keys(r.color);
var CD = Object.keys(r.bgColor);
[...iD, ...CD];
function rD() {
  const e = new Map;
  for (const [u, t] of Object.entries(r)) {
    for (const [F, s] of Object.entries(t))
      r[F] = { open: `\x1B[${s[0]}m`, close: `\x1B[${s[1]}m` }, t[F] = r[F], e.set(s[0], s[1]);
    Object.defineProperty(r, u, { value: t, enumerable: false });
  }
  return Object.defineProperty(r, "codes", { value: e, enumerable: false }), r.color.close = "\x1B[39m", r.bgColor.close = "\x1B[49m", r.color.ansi = N(), r.color.ansi256 = I(), r.color.ansi16m = R(), r.bgColor.ansi = N(w), r.bgColor.ansi256 = I(w), r.bgColor.ansi16m = R(w), Object.defineProperties(r, { rgbToAnsi256: { value: (u, t, F) => u === t && t === F ? u < 8 ? 16 : u > 248 ? 231 : Math.round((u - 8) / 247 * 24) + 232 : 16 + 36 * Math.round(u / 255 * 5) + 6 * Math.round(t / 255 * 5) + Math.round(F / 255 * 5), enumerable: false }, hexToRgb: { value: (u) => {
    const t = /[a-f\d]{6}|[a-f\d]{3}/i.exec(u.toString(16));
    if (!t)
      return [0, 0, 0];
    let [F] = t;
    F.length === 3 && (F = [...F].map((i) => i + i).join(""));
    const s = Number.parseInt(F, 16);
    return [s >> 16 & 255, s >> 8 & 255, s & 255];
  }, enumerable: false }, hexToAnsi256: { value: (u) => r.rgbToAnsi256(...r.hexToRgb(u)), enumerable: false }, ansi256ToAnsi: { value: (u) => {
    if (u < 8)
      return 30 + u;
    if (u < 16)
      return 90 + (u - 8);
    let t, F, s;
    if (u >= 232)
      t = ((u - 232) * 10 + 8) / 255, F = t, s = t;
    else {
      u -= 16;
      const C = u % 36;
      t = Math.floor(u / 36) / 5, F = Math.floor(C / 6) / 5, s = C % 6 / 5;
    }
    const i = Math.max(t, F, s) * 2;
    if (i === 0)
      return 30;
    let D = 30 + (Math.round(s) << 2 | Math.round(F) << 1 | Math.round(t));
    return i === 2 && (D += 60), D;
  }, enumerable: false }, rgbToAnsi: { value: (u, t, F) => r.ansi256ToAnsi(r.rgbToAnsi256(u, t, F)), enumerable: false }, hexToAnsi: { value: (u) => r.ansi256ToAnsi(r.hexToAnsi256(u)), enumerable: false } }), r;
}
var ED = rD();
var d = new Set(["\x1B", "\x9B"]);
var oD = 39;
var y = "\x07";
var V = "[";
var nD = "]";
var G = "m";
var _ = `${nD}8;;`;
var z = (e) => `${d.values().next().value}${V}${e}${G}`;
var K = (e) => `${d.values().next().value}${_}${e}${y}`;
var aD = (e) => e.split(" ").map((u) => p(u));
var k = (e, u, t) => {
  const F = [...u];
  let s = false, i = false, D = p(P(e[e.length - 1]));
  for (const [C, n] of F.entries()) {
    const E = p(n);
    if (D + E <= t ? e[e.length - 1] += n : (e.push(n), D = 0), d.has(n) && (s = true, i = F.slice(C + 1).join("").startsWith(_)), s) {
      i ? n === y && (s = false, i = false) : n === G && (s = false);
      continue;
    }
    D += E, D === t && C < F.length - 1 && (e.push(""), D = 0);
  }
  !D && e[e.length - 1].length > 0 && e.length > 1 && (e[e.length - 2] += e.pop());
};
var hD = (e) => {
  const u = e.split(" ");
  let t = u.length;
  for (;t > 0 && !(p(u[t - 1]) > 0); )
    t--;
  return t === u.length ? e : u.slice(0, t).join(" ") + u.slice(t).join("");
};
var lD = (e, u, t = {}) => {
  if (t.trim !== false && e.trim() === "")
    return "";
  let F = "", s, i;
  const D = aD(e);
  let C = [""];
  for (const [E, a] of e.split(" ").entries()) {
    t.trim !== false && (C[C.length - 1] = C[C.length - 1].trimStart());
    let o = p(C[C.length - 1]);
    if (E !== 0 && (o >= u && (t.wordWrap === false || t.trim === false) && (C.push(""), o = 0), (o > 0 || t.trim === false) && (C[C.length - 1] += " ", o++)), t.hard && D[E] > u) {
      const c = u - o, f = 1 + Math.floor((D[E] - c - 1) / u);
      Math.floor((D[E] - 1) / u) < f && C.push(""), k(C, a, u);
      continue;
    }
    if (o + D[E] > u && o > 0 && D[E] > 0) {
      if (t.wordWrap === false && o < u) {
        k(C, a, u);
        continue;
      }
      C.push("");
    }
    if (o + D[E] > u && t.wordWrap === false) {
      k(C, a, u);
      continue;
    }
    C[C.length - 1] += a;
  }
  t.trim !== false && (C = C.map((E) => hD(E)));
  const n = [...C.join(`
`)];
  for (const [E, a] of n.entries()) {
    if (F += a, d.has(a)) {
      const { groups: c } = new RegExp(`(?:\\${V}(?<code>\\d+)m|\\${_}(?<uri>.*)${y})`).exec(n.slice(E).join("")) || { groups: {} };
      if (c.code !== undefined) {
        const f = Number.parseFloat(c.code);
        s = f === oD ? undefined : f;
      } else
        c.uri !== undefined && (i = c.uri.length === 0 ? undefined : c.uri);
    }
    const o = ED.codes.get(Number(s));
    n[E + 1] === `
` ? (i && (F += K("")), s && o && (F += z(o))) : a === `
` && (s && o && (F += z(s)), i && (F += K(i)));
  }
  return F;
};
function Y(e, u, t) {
  return String(e).normalize().replace(/\r\n/g, `
`).split(`
`).map((F) => lD(F, u, t)).join(`
`);
}
var xD = ["up", "down", "left", "right", "space", "enter", "cancel"];
var B = { actions: new Set(xD), aliases: new Map([["k", "up"], ["j", "down"], ["h", "left"], ["l", "right"], ["\x03", "cancel"], ["escape", "cancel"]]) };
function $(e, u) {
  if (typeof e == "string")
    return B.aliases.get(e) === u;
  for (const t of e)
    if (t !== undefined && $(t, u))
      return true;
  return false;
}
function BD(e, u) {
  if (e === u)
    return;
  const t = e.split(`
`), F = u.split(`
`), s = [];
  for (let i = 0;i < Math.max(t.length, F.length); i++)
    t[i] !== F[i] && s.push(i);
  return s;
}
var AD = globalThis.process.platform.startsWith("win");
var S = Symbol("clack:cancel");
function pD(e) {
  return e === S;
}
function m(e, u) {
  const t = e;
  t.isTTY && t.setRawMode(u);
}
function fD({ input: e = j, output: u = M, overwrite: t = true, hideCursor: F = true } = {}) {
  const s = g.createInterface({ input: e, output: u, prompt: "", tabSize: 1 });
  g.emitKeypressEvents(e, s), e.isTTY && e.setRawMode(true);
  const i = (D, { name: C, sequence: n }) => {
    const E = String(D);
    if ($([E, C, n], "cancel")) {
      F && u.write(import_sisteransi.cursor.show), process.exit(0);
      return;
    }
    if (!t)
      return;
    const a = C === "return" ? 0 : -1, o = C === "return" ? -1 : 0;
    g.moveCursor(u, a, o, () => {
      g.clearLine(u, 1, () => {
        e.once("keypress", i);
      });
    });
  };
  return F && u.write(import_sisteransi.cursor.hide), e.once("keypress", i), () => {
    e.off("keypress", i), F && u.write(import_sisteransi.cursor.show), e.isTTY && !AD && e.setRawMode(false), s.terminal = false, s.close();
  };
}
var gD = Object.defineProperty;
var vD = (e, u, t) => (u in e) ? gD(e, u, { enumerable: true, configurable: true, writable: true, value: t }) : e[u] = t;
var h = (e, u, t) => (vD(e, typeof u != "symbol" ? u + "" : u, t), t);

class x {
  constructor(u, t = true) {
    h(this, "input"), h(this, "output"), h(this, "_abortSignal"), h(this, "rl"), h(this, "opts"), h(this, "_render"), h(this, "_track", false), h(this, "_prevFrame", ""), h(this, "_subscribers", new Map), h(this, "_cursor", 0), h(this, "state", "initial"), h(this, "error", ""), h(this, "value");
    const { input: F = j, output: s = M, render: i, signal: D, ...C } = u;
    this.opts = C, this.onKeypress = this.onKeypress.bind(this), this.close = this.close.bind(this), this.render = this.render.bind(this), this._render = i.bind(this), this._track = t, this._abortSignal = D, this.input = F, this.output = s;
  }
  unsubscribe() {
    this._subscribers.clear();
  }
  setSubscriber(u, t) {
    const F = this._subscribers.get(u) ?? [];
    F.push(t), this._subscribers.set(u, F);
  }
  on(u, t) {
    this.setSubscriber(u, { cb: t });
  }
  once(u, t) {
    this.setSubscriber(u, { cb: t, once: true });
  }
  emit(u, ...t) {
    const F = this._subscribers.get(u) ?? [], s = [];
    for (const i of F)
      i.cb(...t), i.once && s.push(() => F.splice(F.indexOf(i), 1));
    for (const i of s)
      i();
  }
  prompt() {
    return new Promise((u, t) => {
      if (this._abortSignal) {
        if (this._abortSignal.aborted)
          return this.state = "cancel", this.close(), u(S);
        this._abortSignal.addEventListener("abort", () => {
          this.state = "cancel", this.close();
        }, { once: true });
      }
      const F = new X;
      F._write = (s, i, D) => {
        this._track && (this.value = this.rl?.line.replace(/\t/g, ""), this._cursor = this.rl?.cursor ?? 0, this.emit("value", this.value)), D();
      }, this.input.pipe(F), this.rl = O.createInterface({ input: this.input, output: F, tabSize: 2, prompt: "", escapeCodeTimeout: 50, terminal: true }), O.emitKeypressEvents(this.input, this.rl), this.rl.prompt(), this.opts.initialValue !== undefined && this._track && this.rl.write(this.opts.initialValue), this.input.on("keypress", this.onKeypress), m(this.input, true), this.output.on("resize", this.render), this.render(), this.once("submit", () => {
        this.output.write(import_sisteransi.cursor.show), this.output.off("resize", this.render), m(this.input, false), u(this.value);
      }), this.once("cancel", () => {
        this.output.write(import_sisteransi.cursor.show), this.output.off("resize", this.render), m(this.input, false), u(S);
      });
    });
  }
  onKeypress(u, t) {
    if (this.state === "error" && (this.state = "active"), t?.name && (!this._track && B.aliases.has(t.name) && this.emit("cursor", B.aliases.get(t.name)), B.actions.has(t.name) && this.emit("cursor", t.name)), u && (u.toLowerCase() === "y" || u.toLowerCase() === "n") && this.emit("confirm", u.toLowerCase() === "y"), u === "\t" && this.opts.placeholder && (this.value || (this.rl?.write(this.opts.placeholder), this.emit("value", this.opts.placeholder))), u && this.emit("key", u.toLowerCase()), t?.name === "return") {
      if (this.opts.validate) {
        const F = this.opts.validate(this.value);
        F && (this.error = F instanceof Error ? F.message : F, this.state = "error", this.rl?.write(this.value));
      }
      this.state !== "error" && (this.state = "submit");
    }
    $([u, t?.name, t?.sequence], "cancel") && (this.state = "cancel"), (this.state === "submit" || this.state === "cancel") && this.emit("finalize"), this.render(), (this.state === "submit" || this.state === "cancel") && this.close();
  }
  close() {
    this.input.unpipe(), this.input.removeListener("keypress", this.onKeypress), this.output.write(`
`), m(this.input, false), this.rl?.close(), this.rl = undefined, this.emit(`${this.state}`, this.value), this.unsubscribe();
  }
  restoreCursor() {
    const u = Y(this._prevFrame, process.stdout.columns, { hard: true }).split(`
`).length - 1;
    this.output.write(import_sisteransi.cursor.move(-999, u * -1));
  }
  render() {
    const u = Y(this._render(this) ?? "", process.stdout.columns, { hard: true });
    if (u !== this._prevFrame) {
      if (this.state === "initial")
        this.output.write(import_sisteransi.cursor.hide);
      else {
        const t = BD(this._prevFrame, u);
        if (this.restoreCursor(), t && t?.length === 1) {
          const F = t[0];
          this.output.write(import_sisteransi.cursor.move(0, F)), this.output.write(import_sisteransi.erase.lines(1));
          const s = u.split(`
`);
          this.output.write(s[F]), this._prevFrame = u, this.output.write(import_sisteransi.cursor.move(0, s.length - F - 1));
          return;
        }
        if (t && t?.length > 1) {
          const F = t[0];
          this.output.write(import_sisteransi.cursor.move(0, F)), this.output.write(import_sisteransi.erase.down());
          const s = u.split(`
`).slice(F);
          this.output.write(s.join(`
`)), this._prevFrame = u;
          return;
        }
        this.output.write(import_sisteransi.erase.down());
      }
      this.output.write(u), this.state === "initial" && (this.state = "active"), this._prevFrame = u;
    }
  }
}

class dD extends x {
  get cursor() {
    return this.value ? 0 : 1;
  }
  get _value() {
    return this.cursor === 0;
  }
  constructor(u) {
    super(u, false), this.value = !!u.initialValue, this.on("value", () => {
      this.value = this._value;
    }), this.on("confirm", (t) => {
      this.output.write(import_sisteransi.cursor.move(0, -1)), this.value = t, this.state = "submit", this.close();
    }), this.on("cursor", () => {
      this.value = !this.value;
    });
  }
}
var A;
A = new WeakMap;
var kD = Object.defineProperty;
var $D = (e, u, t) => (u in e) ? kD(e, u, { enumerable: true, configurable: true, writable: true, value: t }) : e[u] = t;
var H = (e, u, t) => ($D(e, typeof u != "symbol" ? u + "" : u, t), t);
var SD = class extends x {
  constructor(u) {
    super(u, false), H(this, "options"), H(this, "cursor", 0), this.options = u.options, this.value = [...u.initialValues ?? []], this.cursor = Math.max(this.options.findIndex(({ value: t }) => t === u.cursorAt), 0), this.on("key", (t) => {
      t === "a" && this.toggleAll();
    }), this.on("cursor", (t) => {
      switch (t) {
        case "left":
        case "up":
          this.cursor = this.cursor === 0 ? this.options.length - 1 : this.cursor - 1;
          break;
        case "down":
        case "right":
          this.cursor = this.cursor === this.options.length - 1 ? 0 : this.cursor + 1;
          break;
        case "space":
          this.toggleValue();
          break;
      }
    });
  }
  get _value() {
    return this.options[this.cursor].value;
  }
  toggleAll() {
    const u = this.value.length === this.options.length;
    this.value = u ? [] : this.options.map((t) => t.value);
  }
  toggleValue() {
    const u = this.value.includes(this._value);
    this.value = u ? this.value.filter((t) => t !== this._value) : [...this.value, this._value];
  }
};
var OD = Object.defineProperty;
var PD = (e, u, t) => (u in e) ? OD(e, u, { enumerable: true, configurable: true, writable: true, value: t }) : e[u] = t;
var J = (e, u, t) => (PD(e, typeof u != "symbol" ? u + "" : u, t), t);

class LD extends x {
  constructor(u) {
    super(u, false), J(this, "options"), J(this, "cursor", 0), this.options = u.options, this.cursor = this.options.findIndex(({ value: t }) => t === u.initialValue), this.cursor === -1 && (this.cursor = 0), this.changeValue(), this.on("cursor", (t) => {
      switch (t) {
        case "left":
        case "up":
          this.cursor = this.cursor === 0 ? this.options.length - 1 : this.cursor - 1;
          break;
        case "down":
        case "right":
          this.cursor = this.cursor === this.options.length - 1 ? 0 : this.cursor + 1;
          break;
      }
      this.changeValue();
    });
  }
  get _value() {
    return this.options[this.cursor];
  }
  changeValue() {
    this.value = this._value.value;
  }
}
class RD extends x {
  get valueWithCursor() {
    if (this.state === "submit")
      return this.value;
    if (this.cursor >= this.value.length)
      return `${this.value}\u2588`;
    const u = this.value.slice(0, this.cursor), [t, ...F] = this.value.slice(this.cursor);
    return `${u}${import_picocolors.default.inverse(t)}${F.join("")}`;
  }
  get cursor() {
    return this._cursor;
  }
  constructor(u) {
    super(u), this.on("finalize", () => {
      this.value || (this.value = u.defaultValue);
    });
  }
}

// node_modules/@clack/prompts/dist/index.mjs
var import_picocolors2 = __toESM(require_picocolors(), 1);
var import_sisteransi2 = __toESM(require_src(), 1);
import y2 from "process";
function ce() {
  return y2.platform !== "win32" ? y2.env.TERM !== "linux" : !!y2.env.CI || !!y2.env.WT_SESSION || !!y2.env.TERMINUS_SUBLIME || y2.env.ConEmuTask === "{cmd::Cmder}" || y2.env.TERM_PROGRAM === "Terminus-Sublime" || y2.env.TERM_PROGRAM === "vscode" || y2.env.TERM === "xterm-256color" || y2.env.TERM === "alacritty" || y2.env.TERMINAL_EMULATOR === "JetBrains-JediTerm";
}
var V2 = ce();
var u = (t, n) => V2 ? t : n;
var le = u("\u25C6", "*");
var L2 = u("\u25A0", "x");
var W2 = u("\u25B2", "x");
var C = u("\u25C7", "o");
var ue = u("\u250C", "T");
var o = u("\u2502", "|");
var d2 = u("\u2514", "\u2014");
var k2 = u("\u25CF", ">");
var P2 = u("\u25CB", " ");
var A2 = u("\u25FB", "[\u2022]");
var T = u("\u25FC", "[+]");
var F = u("\u25FB", "[ ]");
var $e = u("\u25AA", "\u2022");
var _2 = u("\u2500", "-");
var me = u("\u256E", "+");
var de = u("\u251C", "+");
var pe = u("\u256F", "+");
var q = u("\u25CF", "\u2022");
var D = u("\u25C6", "*");
var U = u("\u25B2", "!");
var K2 = u("\u25A0", "x");
var b2 = (t) => {
  switch (t) {
    case "initial":
    case "active":
      return import_picocolors2.default.cyan(le);
    case "cancel":
      return import_picocolors2.default.red(L2);
    case "error":
      return import_picocolors2.default.yellow(W2);
    case "submit":
      return import_picocolors2.default.green(C);
  }
};
var G2 = (t) => {
  const { cursor: n, options: r2, style: i } = t, s = t.maxItems ?? Number.POSITIVE_INFINITY, c = Math.max(process.stdout.rows - 4, 0), a = Math.min(c, Math.max(s, 5));
  let l2 = 0;
  n >= l2 + a - 3 ? l2 = Math.max(Math.min(n - a + 3, r2.length - a), 0) : n < l2 + 2 && (l2 = Math.max(n - 2, 0));
  const $2 = a < r2.length && l2 > 0, g2 = a < r2.length && l2 + a < r2.length;
  return r2.slice(l2, l2 + a).map((p2, v2, f) => {
    const j2 = v2 === 0 && $2, E = v2 === f.length - 1 && g2;
    return j2 || E ? import_picocolors2.default.dim("...") : i(p2, v2 + l2 === n);
  });
};
var he = (t) => new RD({ validate: t.validate, placeholder: t.placeholder, defaultValue: t.defaultValue, initialValue: t.initialValue, render() {
  const n = `${import_picocolors2.default.gray(o)}
${b2(this.state)}  ${t.message}
`, r2 = t.placeholder ? import_picocolors2.default.inverse(t.placeholder[0]) + import_picocolors2.default.dim(t.placeholder.slice(1)) : import_picocolors2.default.inverse(import_picocolors2.default.hidden("_")), i = this.value ? this.valueWithCursor : r2;
  switch (this.state) {
    case "error":
      return `${n.trim()}
${import_picocolors2.default.yellow(o)}  ${i}
${import_picocolors2.default.yellow(d2)}  ${import_picocolors2.default.yellow(this.error)}
`;
    case "submit":
      return `${n}${import_picocolors2.default.gray(o)}  ${import_picocolors2.default.dim(this.value || t.placeholder)}`;
    case "cancel":
      return `${n}${import_picocolors2.default.gray(o)}  ${import_picocolors2.default.strikethrough(import_picocolors2.default.dim(this.value ?? ""))}${this.value?.trim() ? `
${import_picocolors2.default.gray(o)}` : ""}`;
    default:
      return `${n}${import_picocolors2.default.cyan(o)}  ${i}
${import_picocolors2.default.cyan(d2)}
`;
  }
} }).prompt();
var ye = (t) => {
  const n = t.active ?? "Yes", r2 = t.inactive ?? "No";
  return new dD({ active: n, inactive: r2, initialValue: t.initialValue ?? true, render() {
    const i = `${import_picocolors2.default.gray(o)}
${b2(this.state)}  ${t.message}
`, s = this.value ? n : r2;
    switch (this.state) {
      case "submit":
        return `${i}${import_picocolors2.default.gray(o)}  ${import_picocolors2.default.dim(s)}`;
      case "cancel":
        return `${i}${import_picocolors2.default.gray(o)}  ${import_picocolors2.default.strikethrough(import_picocolors2.default.dim(s))}
${import_picocolors2.default.gray(o)}`;
      default:
        return `${i}${import_picocolors2.default.cyan(o)}  ${this.value ? `${import_picocolors2.default.green(k2)} ${n}` : `${import_picocolors2.default.dim(P2)} ${import_picocolors2.default.dim(n)}`} ${import_picocolors2.default.dim("/")} ${this.value ? `${import_picocolors2.default.dim(P2)} ${import_picocolors2.default.dim(r2)}` : `${import_picocolors2.default.green(k2)} ${r2}`}
${import_picocolors2.default.cyan(d2)}
`;
    }
  } }).prompt();
};
var ve = (t) => {
  const n = (r2, i) => {
    const s = r2.label ?? String(r2.value);
    switch (i) {
      case "selected":
        return `${import_picocolors2.default.dim(s)}`;
      case "active":
        return `${import_picocolors2.default.green(k2)} ${s} ${r2.hint ? import_picocolors2.default.dim(`(${r2.hint})`) : ""}`;
      case "cancelled":
        return `${import_picocolors2.default.strikethrough(import_picocolors2.default.dim(s))}`;
      default:
        return `${import_picocolors2.default.dim(P2)} ${import_picocolors2.default.dim(s)}`;
    }
  };
  return new LD({ options: t.options, initialValue: t.initialValue, render() {
    const r2 = `${import_picocolors2.default.gray(o)}
${b2(this.state)}  ${t.message}
`;
    switch (this.state) {
      case "submit":
        return `${r2}${import_picocolors2.default.gray(o)}  ${n(this.options[this.cursor], "selected")}`;
      case "cancel":
        return `${r2}${import_picocolors2.default.gray(o)}  ${n(this.options[this.cursor], "cancelled")}
${import_picocolors2.default.gray(o)}`;
      default:
        return `${r2}${import_picocolors2.default.cyan(o)}  ${G2({ cursor: this.cursor, options: this.options, maxItems: t.maxItems, style: (i, s) => n(i, s ? "active" : "inactive") }).join(`
${import_picocolors2.default.cyan(o)}  `)}
${import_picocolors2.default.cyan(d2)}
`;
    }
  } }).prompt();
};
var fe = (t) => {
  const n = (r2, i) => {
    const s = r2.label ?? String(r2.value);
    return i === "active" ? `${import_picocolors2.default.cyan(A2)} ${s} ${r2.hint ? import_picocolors2.default.dim(`(${r2.hint})`) : ""}` : i === "selected" ? `${import_picocolors2.default.green(T)} ${import_picocolors2.default.dim(s)} ${r2.hint ? import_picocolors2.default.dim(`(${r2.hint})`) : ""}` : i === "cancelled" ? `${import_picocolors2.default.strikethrough(import_picocolors2.default.dim(s))}` : i === "active-selected" ? `${import_picocolors2.default.green(T)} ${s} ${r2.hint ? import_picocolors2.default.dim(`(${r2.hint})`) : ""}` : i === "submitted" ? `${import_picocolors2.default.dim(s)}` : `${import_picocolors2.default.dim(F)} ${import_picocolors2.default.dim(s)}`;
  };
  return new SD({ options: t.options, initialValues: t.initialValues, required: t.required ?? true, cursorAt: t.cursorAt, validate(r2) {
    if (this.required && r2.length === 0)
      return `Please select at least one option.
${import_picocolors2.default.reset(import_picocolors2.default.dim(`Press ${import_picocolors2.default.gray(import_picocolors2.default.bgWhite(import_picocolors2.default.inverse(" space ")))} to select, ${import_picocolors2.default.gray(import_picocolors2.default.bgWhite(import_picocolors2.default.inverse(" enter ")))} to submit`))}`;
  }, render() {
    const r2 = `${import_picocolors2.default.gray(o)}
${b2(this.state)}  ${t.message}
`, i = (s, c) => {
      const a = this.value.includes(s.value);
      return c && a ? n(s, "active-selected") : a ? n(s, "selected") : n(s, c ? "active" : "inactive");
    };
    switch (this.state) {
      case "submit":
        return `${r2}${import_picocolors2.default.gray(o)}  ${this.options.filter(({ value: s }) => this.value.includes(s)).map((s) => n(s, "submitted")).join(import_picocolors2.default.dim(", ")) || import_picocolors2.default.dim("none")}`;
      case "cancel": {
        const s = this.options.filter(({ value: c }) => this.value.includes(c)).map((c) => n(c, "cancelled")).join(import_picocolors2.default.dim(", "));
        return `${r2}${import_picocolors2.default.gray(o)}  ${s.trim() ? `${s}
${import_picocolors2.default.gray(o)}` : ""}`;
      }
      case "error": {
        const s = this.error.split(`
`).map((c, a) => a === 0 ? `${import_picocolors2.default.yellow(d2)}  ${import_picocolors2.default.yellow(c)}` : `   ${c}`).join(`
`);
        return `${r2 + import_picocolors2.default.yellow(o)}  ${G2({ options: this.options, cursor: this.cursor, maxItems: t.maxItems, style: i }).join(`
${import_picocolors2.default.yellow(o)}  `)}
${s}
`;
      }
      default:
        return `${r2}${import_picocolors2.default.cyan(o)}  ${G2({ options: this.options, cursor: this.cursor, maxItems: t.maxItems, style: i }).join(`
${import_picocolors2.default.cyan(o)}  `)}
${import_picocolors2.default.cyan(d2)}
`;
    }
  } }).prompt();
};
var Ie = (t = "") => {
  process.stdout.write(`${import_picocolors2.default.gray(ue)}  ${t}
`);
};
var Se = (t = "") => {
  process.stdout.write(`${import_picocolors2.default.gray(o)}
${import_picocolors2.default.gray(d2)}  ${t}

`);
};
var J2 = `${import_picocolors2.default.gray(o)}  `;
var Y2 = ({ indicator: t = "dots" } = {}) => {
  const n = V2 ? ["\u25D2", "\u25D0", "\u25D3", "\u25D1"] : ["\u2022", "o", "O", "0"], r2 = V2 ? 80 : 120, i = process.env.CI === "true";
  let s, c, a = false, l2 = "", $2, g2 = performance.now();
  const p2 = (m2) => {
    const h2 = m2 > 1 ? "Something went wrong" : "Canceled";
    a && N2(h2, m2);
  }, v2 = () => p2(2), f = () => p2(1), j2 = () => {
    process.on("uncaughtExceptionMonitor", v2), process.on("unhandledRejection", v2), process.on("SIGINT", f), process.on("SIGTERM", f), process.on("exit", p2);
  }, E = () => {
    process.removeListener("uncaughtExceptionMonitor", v2), process.removeListener("unhandledRejection", v2), process.removeListener("SIGINT", f), process.removeListener("SIGTERM", f), process.removeListener("exit", p2);
  }, B2 = () => {
    if ($2 === undefined)
      return;
    i && process.stdout.write(`
`);
    const m2 = $2.split(`
`);
    process.stdout.write(import_sisteransi2.cursor.move(-999, m2.length - 1)), process.stdout.write(import_sisteransi2.erase.down(m2.length));
  }, R2 = (m2) => m2.replace(/\.+$/, ""), O2 = (m2) => {
    const h2 = (performance.now() - m2) / 1000, w2 = Math.floor(h2 / 60), I2 = Math.floor(h2 % 60);
    return w2 > 0 ? `[${w2}m ${I2}s]` : `[${I2}s]`;
  }, H2 = (m2 = "") => {
    a = true, s = fD(), l2 = R2(m2), g2 = performance.now(), process.stdout.write(`${import_picocolors2.default.gray(o)}
`);
    let h2 = 0, w2 = 0;
    j2(), c = setInterval(() => {
      if (i && l2 === $2)
        return;
      B2(), $2 = l2;
      const I2 = import_picocolors2.default.magenta(n[h2]);
      if (i)
        process.stdout.write(`${I2}  ${l2}...`);
      else if (t === "timer")
        process.stdout.write(`${I2}  ${l2} ${O2(g2)}`);
      else {
        const z2 = ".".repeat(Math.floor(w2)).slice(0, 3);
        process.stdout.write(`${I2}  ${l2}${z2}`);
      }
      h2 = h2 + 1 < n.length ? h2 + 1 : 0, w2 = w2 < n.length ? w2 + 0.125 : 0;
    }, r2);
  }, N2 = (m2 = "", h2 = 0) => {
    a = false, clearInterval(c), B2();
    const w2 = h2 === 0 ? import_picocolors2.default.green(C) : h2 === 1 ? import_picocolors2.default.red(L2) : import_picocolors2.default.red(W2);
    l2 = R2(m2 ?? l2), t === "timer" ? process.stdout.write(`${w2}  ${l2} ${O2(g2)}
`) : process.stdout.write(`${w2}  ${l2}
`), E(), s();
  };
  return { start: H2, stop: N2, message: (m2 = "") => {
    l2 = R2(m2 ?? l2);
  } };
};

// src/commands/add.ts
init_esm();
var import_fs_extra6 = __toESM(require_lib(), 1);
var import_picocolors6 = __toESM(require_picocolors(), 1);

// src/core/config.ts
var import_fs_extra = __toESM(require_lib(), 1);
import { dirname, join as join2 } from "path";

// node_modules/yaml/dist/index.js
var composer = require_composer();
var Document = require_Document();
var Schema = require_Schema();
var errors = require_errors();
var Alias = require_Alias();
var identity = require_identity();
var Pair = require_Pair();
var Scalar = require_Scalar();
var YAMLMap = require_YAMLMap();
var YAMLSeq = require_YAMLSeq();
var cst = require_cst();
var lexer = require_lexer();
var lineCounter = require_line_counter();
var parser = require_parser();
var publicApi = require_public_api();
var visit = require_visit();
var $Composer = composer.Composer;
var $Document = Document.Document;
var $Schema = Schema.Schema;
var $YAMLError = errors.YAMLError;
var $YAMLParseError = errors.YAMLParseError;
var $YAMLWarning = errors.YAMLWarning;
var $Alias = Alias.Alias;
var $isAlias = identity.isAlias;
var $isCollection = identity.isCollection;
var $isDocument = identity.isDocument;
var $isMap = identity.isMap;
var $isNode = identity.isNode;
var $isPair = identity.isPair;
var $isScalar = identity.isScalar;
var $isSeq = identity.isSeq;
var $Pair = Pair.Pair;
var $Scalar = Scalar.Scalar;
var $YAMLMap = YAMLMap.YAMLMap;
var $YAMLSeq = YAMLSeq.YAMLSeq;
var $Lexer = lexer.Lexer;
var $LineCounter = lineCounter.LineCounter;
var $Parser = parser.Parser;
var $parse = publicApi.parse;
var $parseAllDocuments = publicApi.parseAllDocuments;
var $parseDocument = publicApi.parseDocument;
var $stringify = publicApi.stringify;
var $visit = visit.visit;
var $visitAsync = visit.visitAsync;

// src/utils/paths.ts
import { homedir } from "os";
import { join } from "path";
var P_ROOT = join(homedir(), ".p");
var CONFIG_PATH = join(P_ROOT, "config.yaml");
var METADATA_PATH = join(P_ROOT, "meta.json");
var PROJECTS_DIR = join(P_ROOT, "projects");
var TEMPLATES_DIR = join(P_ROOT, "templates");
var TEMPLATES_META_PATH = join(P_ROOT, "templates-meta.json");
var HOOKS_DIR = join(P_ROOT, "hooks");

// src/utils/ui.ts
var import_picocolors3 = __toESM(require_picocolors(), 1);
var brand = {
  primary: (text) => `\x1B[38;5;208m${text}\x1B[0m`,
  secondary: (text) => `\x1B[38;5;214m${text}\x1B[0m`,
  success: import_picocolors3.default.green,
  warning: import_picocolors3.default.yellow,
  error: import_picocolors3.default.red,
  dim: import_picocolors3.default.dim,
  bold: import_picocolors3.default.bold
};
var bgOrange = (text) => `\x1B[48;2;180;80;20m\x1B[38;2;255;255;255m\x1B[1m${text}\x1B[0m`;
function printSuccess(message) {
  console.log(`${brand.success("\u2713")} ${message}`);
}
function printError(message) {
  console.log(`${brand.error("\u2717")} ${message}`);
}
function printInfo(message) {
  console.log(`${brand.secondary("\u25C6")} ${message}`);
}
function printPath(label, path) {
  console.log(import_picocolors3.default.dim(`  ${label}: `) + import_picocolors3.default.underline(path));
}
function formatRelativeTime(date) {
  const now = new Date;
  const diff = now.getTime() - date.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  if (days > 0)
    return `${days} \u5929\u524D`;
  if (hours > 0)
    return `${hours} \u5C0F\u65F6\u524D`;
  if (minutes > 0)
    return `${minutes} \u5206\u949F\u524D`;
  return "\u521A\u521A";
}
function charDisplayWidth(codePoint) {
  if (codePoint >= 4352 && codePoint <= 4447 || codePoint >= 11904 && codePoint <= 42191 || codePoint >= 44032 && codePoint <= 55203 || codePoint >= 63744 && codePoint <= 64255 || codePoint >= 65072 && codePoint <= 65103 || codePoint >= 65280 && codePoint <= 65376 || codePoint >= 65504 && codePoint <= 65510 || codePoint >= 131072 && codePoint <= 262141) {
    return 2;
  }
  return 1;
}
function wrapByWidth(text, maxWidth) {
  const lines = [];
  let line = "";
  let width = 0;
  for (const ch of Array.from(text)) {
    const w2 = charDisplayWidth(ch.codePointAt(0) ?? 0);
    if (width + w2 > maxWidth && line) {
      lines.push(line);
      line = "";
      width = 0;
    }
    line += ch;
    width += w2;
  }
  if (line)
    lines.push(line);
  return lines.length > 0 ? lines : [""];
}
function truncateByWidth(text, maxWidth) {
  let width = 0;
  for (const [i, ch] of Array.from(text).entries()) {
    const w2 = charDisplayWidth(ch.codePointAt(0) ?? 0);
    if (width + w2 > maxWidth - 1) {
      return `${text.slice(0, i)}\u2026`;
    }
    width += w2;
  }
  return text;
}

// src/core/config.ts
function deepMerge(base, override) {
  const result = { ...base };
  for (const key of Object.keys(override)) {
    const bVal = result[key];
    const oVal = override[key];
    if (typeof oVal === "object" && oVal !== null && !Array.isArray(oVal) && typeof bVal === "object" && bVal !== null && !Array.isArray(bVal)) {
      result[key] = deepMerge(bVal, oVal);
    } else {
      result[key] = oVal;
    }
  }
  return result;
}
function getDefaultConfigPath() {
  const execPath = process.argv[1];
  if (!execPath)
    return "";
  return join2(dirname(execPath), "config.yaml");
}
async function ensureInitialized() {
  const dirs = [P_ROOT, PROJECTS_DIR, TEMPLATES_DIR, HOOKS_DIR];
  for (const dir of dirs) {
    await import_fs_extra.default.ensureDir(dir);
  }
  if (!await import_fs_extra.default.pathExists(CONFIG_PATH)) {
    const defaultConfigPath = getDefaultConfigPath();
    if (await import_fs_extra.default.pathExists(defaultConfigPath)) {
      await import_fs_extra.default.copyFile(defaultConfigPath, CONFIG_PATH);
    }
  }
}
function loadConfig() {
  if (!import_fs_extra.default.existsSync(CONFIG_PATH)) {
    throw new Error("\u914D\u7F6E\u6587\u4EF6\u4E0D\u5B58\u5728\uFF0C\u8BF7\u8FD0\u884C p config \u521B\u5EFA\u914D\u7F6E\u6587\u4EF6");
  }
  try {
    const userContent = import_fs_extra.default.readFileSync(CONFIG_PATH, "utf-8");
    const userConfig = $parse(userContent) || {};
    let defaultConfig = {};
    const defaultConfigPath = getDefaultConfigPath();
    if (defaultConfigPath && import_fs_extra.default.existsSync(defaultConfigPath)) {
      const defaultContent = import_fs_extra.default.readFileSync(defaultConfigPath, "utf-8");
      defaultConfig = $parse(defaultContent) || {};
    }
    return deepMerge(defaultConfig, userConfig);
  } catch (error) {
    throw new Error(`\u914D\u7F6E\u6587\u4EF6\u89E3\u6790\u5931\u8D25: ${error.message}`);
  }
}
var DEPRECATED_CONFIG_KEYS = ["apiKey", "deepseekApiKey", "ai"];
function stripDeprecatedKeys(content, keys) {
  const lines = content.split(`
`);
  const out = [];
  let pending = [];
  let skipping = false;
  const removed = [];
  for (const line of lines) {
    const key = line.match(/^([A-Za-z_][\w-]*):/)?.[1];
    if (key && keys.includes(key)) {
      if (!removed.includes(key))
        removed.push(key);
      let cut = 0;
      for (let i = pending.length - 1;i >= 0; i--) {
        if (!pending[i]?.trim()) {
          cut = i + 1;
          break;
        }
      }
      out.push(...pending.slice(0, cut));
      pending = [];
      skipping = true;
      continue;
    }
    if (key) {
      out.push(...pending, line);
      pending = [];
      skipping = false;
      continue;
    }
    if (skipping && /^[ \t]+\S/.test(line))
      continue;
    if (line.trim() === "" || line.trimStart().startsWith("#")) {
      if (skipping) {
        if (line.trim() === "")
          continue;
        skipping = false;
      }
      pending.push(line);
      continue;
    }
    out.push(...pending, line);
    pending = [];
  }
  out.push(...pending);
  return { content: out.join(`
`), removed };
}
async function migrateUserConfig() {
  if (!import_fs_extra.default.existsSync(CONFIG_PATH))
    return;
  const content = import_fs_extra.default.readFileSync(CONFIG_PATH, "utf-8");
  const { content: cleaned, removed } = stripDeprecatedKeys(content, DEPRECATED_CONFIG_KEYS);
  if (removed.length === 0)
    return;
  await import_fs_extra.default.writeFile(CONFIG_PATH, cleaned, "utf-8");
  printInfo(`\u5DF2\u6E05\u7406\u914D\u7F6E\u4E2D\u7684\u5E9F\u5F03\u5B57\u6BB5: ${removed.join(", ")}`);
}

// src/core/project.ts
var import_fs_extra2 = __toESM(require_lib(), 1);
import { join as join3 } from "path";
function legacyNote(meta) {
  return meta?.note;
}
function loadMetadata() {
  if (!import_fs_extra2.default.existsSync(METADATA_PATH)) {
    return { projects: {} };
  }
  try {
    const content = import_fs_extra2.default.readFileSync(METADATA_PATH, "utf-8");
    return JSON.parse(content);
  } catch {
    return { projects: {} };
  }
}
function saveMetadata(metadata) {
  import_fs_extra2.default.writeFileSync(METADATA_PATH, JSON.stringify(metadata, null, 2), "utf-8");
}
function listProjects() {
  if (!import_fs_extra2.default.existsSync(PROJECTS_DIR)) {
    return [];
  }
  const entries = import_fs_extra2.default.readdirSync(PROJECTS_DIR, { withFileTypes: true });
  const metadata = loadMetadata();
  const projects = [];
  for (const entry of entries) {
    if (entry.isDirectory()) {
      const projectPath = join3(PROJECTS_DIR, entry.name);
      const stat = import_fs_extra2.default.statSync(projectPath);
      const meta = metadata.projects[entry.name];
      projects.push({
        name: entry.name,
        path: projectPath,
        template: meta?.template && meta.template !== "empty" ? meta.template : undefined,
        savedTemplate: meta?.savedTemplate,
        createdAt: meta?.createdAt ? new Date(meta.createdAt) : stat.birthtime,
        modifiedAt: stat.mtime,
        originalPath: meta?.originalPath,
        tags: meta?.tags,
        firstPrompt: meta?.firstPrompt ?? legacyNote(meta)
      });
    }
  }
  return projects.sort((a, b3) => b3.modifiedAt.getTime() - a.modifiedAt.getTime());
}
function getProjectMeta(projectName) {
  const metadata = loadMetadata();
  const meta = metadata.projects[projectName];
  if (!meta)
    return null;
  if (meta.firstPrompt === undefined && meta.note !== undefined) {
    return { ...meta, firstPrompt: meta.note };
  }
  return meta;
}
function saveProjectMeta(projectName, data = {}) {
  const metadata = loadMetadata();
  const existing = metadata.projects[projectName];
  const { note: legacy, ...legacyRest } = existing ?? {};
  const rest = existing ? legacyRest : {};
  metadata.projects[projectName] = {
    ...rest,
    template: data.template ?? rest.template,
    savedTemplate: data.savedTemplate ?? rest.savedTemplate,
    createdAt: rest.createdAt || new Date().toISOString(),
    ...data.originalPath !== undefined && { originalPath: data.originalPath },
    ...data.tags !== undefined && { tags: data.tags },
    firstPrompt: "firstPrompt" in data ? data.firstPrompt : rest.firstPrompt ?? legacy
  };
  saveMetadata(metadata);
}
function deleteProjectMeta(projectName) {
  const metadata = loadMetadata();
  delete metadata.projects[projectName];
  saveMetadata(metadata);
}
function clearOriginalPath(projectName) {
  const metadata = loadMetadata();
  const existing = metadata.projects[projectName];
  if (existing) {
    delete existing.originalPath;
    saveMetadata(metadata);
  }
}
function clearAllProjectMeta() {
  saveMetadata({ projects: {} });
}
function projectExists(name) {
  const projectPath = join3(PROJECTS_DIR, name);
  return import_fs_extra2.default.existsSync(projectPath);
}
function getProjectPath(name) {
  return join3(PROJECTS_DIR, name);
}
function validateProjectNameFormat(name) {
  if (!name || name.trim() === "") {
    return { valid: false, message: "\u9879\u76EE\u540D\u79F0\u4E0D\u80FD\u4E3A\u7A7A" };
  }
  const invalidChars = /[<>:"/\\|?*]/;
  if (invalidChars.test(name)) {
    return { valid: false, message: "\u9879\u76EE\u540D\u79F0\u5305\u542B\u975E\u6CD5\u5B57\u7B26" };
  }
  if (name.startsWith(".") || name.startsWith(" ") || name.endsWith(" ")) {
    return { valid: false, message: "\u9879\u76EE\u540D\u79F0\u683C\u5F0F\u4E0D\u6B63\u786E" };
  }
  return { valid: true };
}
function validateProjectName(name) {
  const format = validateProjectNameFormat(name);
  if (!format.valid)
    return format;
  if (projectExists(name)) {
    return { valid: false, message: "\u9879\u76EE\u5DF2\u5B58\u5728" };
  }
  return { valid: true };
}

// src/core/template.ts
var import_fs_extra5 = __toESM(require_lib(), 1);
var import_picocolors5 = __toESM(require_picocolors(), 1);
import { join as join7 } from "path";

// src/utils/shell.ts
var import_picocolors4 = __toESM(require_picocolors(), 1);
import {
  existsSync,
  readdirSync,
  readFileSync,
  statSync,
  writeFileSync
} from "fs";
import { dirname as dirname3, join as join6 } from "path";
var {$: $2 } = globalThis.Bun;

// src/utils/cchive.ts
var import_fs_extra3 = __toESM(require_lib(), 1);
import { homedir as homedir2 } from "os";
import { join as join4 } from "path";
var CCHIVE_SUBS_PATH = join4(homedir2(), ".claude", "cchive.json");
function toRealPath(path) {
  try {
    return import_fs_extra3.default.realpathSync(path);
  } catch {
    return path;
  }
}
var UUID_JSONL_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.jsonl$/;
function mungeCwd(cwd) {
  return cwd.replace(/[^a-zA-Z0-9]/g, "-");
}
function upsertSessionIds(subs, cwd, sessionIds) {
  if (sessionIds.length === 0)
    return { subs, changed: false };
  const dirs = subs.dirs ?? [];
  const existing = dirs.find((d3) => d3.cwd === cwd);
  if (!existing) {
    return {
      subs: {
        ...subs,
        dirs: [...dirs, { cwd, session_ids: [...sessionIds] }]
      },
      changed: sessionIds.length > 0
    };
  }
  const before = existing.session_ids ?? [];
  const merged = [...before];
  for (const id of sessionIds) {
    if (!merged.includes(id))
      merged.push(id);
  }
  if (merged.length === before.length)
    return { subs, changed: false };
  return {
    subs: {
      ...subs,
      dirs: dirs.map((d3) => d3.cwd === cwd ? { ...d3, session_ids: merged } : d3)
    },
    changed: true
  };
}
function removeDirEntries(subs, cwds) {
  if (cwds.length === 0 || !subs.dirs)
    return { subs, changed: false };
  const remove = new Set(cwds);
  const kept = subs.dirs.filter((d3) => !remove.has(d3.cwd));
  if (kept.length === subs.dirs.length)
    return { subs, changed: false };
  return { subs: { ...subs, dirs: kept }, changed: true };
}
async function mutateSubsFile(subsPath, mutate) {
  try {
    let subs = null;
    if (await import_fs_extra3.default.pathExists(subsPath)) {
      try {
        const parsed = JSON.parse(await import_fs_extra3.default.readFile(subsPath, "utf8"));
        if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
          subs = parsed;
        }
      } catch {}
    } else {
      subs = { dirs: [], imports: [] };
    }
    if (!subs)
      return false;
    const { subs: next, changed } = mutate(subs);
    if (!changed)
      return true;
    const tmp = `${subsPath}.tmp`;
    await import_fs_extra3.default.writeFile(tmp, JSON.stringify(next, null, 2));
    await import_fs_extra3.default.rename(tmp, subsPath);
    return true;
  } catch {
    return false;
  }
}
async function syncCchiveSession(cwd, sessionIds, subsPath = CCHIVE_SUBS_PATH) {
  if (sessionIds.length === 0)
    return false;
  const realCwd = toRealPath(cwd);
  return mutateSubsFile(subsPath, (subs) => upsertSessionIds(subs, realCwd, sessionIds));
}
async function removeCchiveDirs(cwds, subsPath = CCHIVE_SUBS_PATH) {
  if (cwds.length === 0)
    return false;
  const realCwds = [...new Set(cwds.map(toRealPath))];
  return mutateSubsFile(subsPath, (subs) => removeDirEntries(subs, realCwds));
}
async function maybeRemoveCchiveDirs(cchiveSync, cwds) {
  if (cchiveSync === false || cwds.length === 0)
    return false;
  return removeCchiveDirs(cwds);
}
function watchCchiveSync(projectPath, options) {
  const realPath = toRealPath(projectPath);
  const dir = join4(homedir2(), ".claude", "projects", mungeCwd(realPath));
  let known;
  try {
    known = new Set(import_fs_extra3.default.readdirSync(dir).filter((f) => UUID_JSONL_RE.test(f)));
  } catch {
    known = new Set;
  }
  let stopped = false;
  const stop = () => {
    if (stopped)
      return;
    stopped = true;
    clearInterval(timer);
  };
  const timer = setInterval(async () => {
    if (stopped)
      return;
    let entries;
    try {
      entries = await import_fs_extra3.default.readdir(dir);
    } catch {
      return;
    }
    const fresh = entries.filter((f) => UUID_JSONL_RE.test(f) && !known.has(f));
    if (fresh.length === 0)
      return;
    await syncCchiveSession(realPath, fresh.map((f) => f.replace(/\.jsonl$/, "")), options?.subsPath);
    stop();
  }, options?.intervalMs ?? 1000);
  return { stop };
}
function maybeWatchCchiveSync(cchiveSync, projectPath) {
  return cchiveSync === false ? null : watchCchiveSync(projectPath);
}

// src/utils/providers.ts
var import_fs_extra4 = __toESM(require_lib(), 1);
import { homedir as homedir3 } from "os";
import { basename, dirname as dirname2, join as join5 } from "path";
var PROVIDERS_PATH = join5(homedir3(), ".claude", "cchive-providers.json");
var FRAGMENT_DIR = join5(homedir3(), ".claude", "cchive-provider-fragments");
var SESSION_DIR = join5(homedir3(), ".claude", "sessions");
var DEFAULT_MAX = 3;
var DEFAULT_MAX_CONCURRENT = 50;
function positiveInt(value, fallback) {
  return typeof value === "number" && Number.isFinite(value) && value > 0 ? Math.floor(value) : fallback;
}
function isUsable(p2) {
  return typeof p2.name === "string" && p2.name.length > 0 && typeof p2.baseUrl === "string" && p2.baseUrl.length > 0 && typeof p2.token === "string" && p2.token.length > 0;
}
function loadProvidersConfig(configPath = PROVIDERS_PATH) {
  try {
    const parsed = JSON.parse(import_fs_extra4.default.readFileSync(configPath, "utf8"));
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed;
    }
  } catch {}
  return null;
}
function sanitizeName(name) {
  const cleaned = name.replace(/[^\p{L}\p{N}_-]/gu, "-");
  return cleaned || "provider";
}
function commandBasename(command) {
  const first = command.trim().split(/\s+/)[0] ?? "";
  return first.split("/").pop() ?? "";
}
function isClaudeCommand(command) {
  return commandBasename(command) === "claude";
}
function tokenizeCommand(command) {
  const tokens = [];
  let current = "";
  let quote = null;
  for (const ch of command) {
    if (quote) {
      if (ch === quote)
        quote = null;
      else
        current += ch;
    } else if (ch === '"' || ch === "'") {
      quote = ch;
    } else if (/\s/.test(ch)) {
      if (current) {
        tokens.push(current);
        current = "";
      }
    } else {
      current += ch;
    }
  }
  if (current)
    tokens.push(current);
  return tokens;
}
function settingsFragmentPath(command) {
  const tokens = tokenizeCommand(command);
  for (const [i, token] of tokens.entries()) {
    if (token === "--settings") {
      const next = tokens[i + 1];
      return next && next.length > 0 ? next : null;
    }
    if (token.startsWith("--settings=")) {
      const value = token.slice("--settings=".length);
      return value.length > 0 ? value : null;
    }
  }
  return null;
}
function fragmentStem(fragmentPath, fragmentDir = FRAGMENT_DIR) {
  if (dirname2(fragmentPath) !== fragmentDir)
    return null;
  const base = basename(fragmentPath);
  return base.endsWith(".json") ? base.slice(0, -".json".length) : null;
}
function readSessionStatus(pid, sessionDir = SESSION_DIR) {
  try {
    const parsed = JSON.parse(import_fs_extra4.default.readFileSync(join5(sessionDir, `${pid}.json`), "utf8"));
    if (!parsed || typeof parsed !== "object")
      return null;
    const record = parsed;
    if (record.pid !== pid)
      return null;
    return typeof record.status === "string" ? record.status : null;
  } catch {
    return null;
  }
}
function parseClaudeSessions(psOutput, fragmentDir = FRAGMENT_DIR, statusOf = () => "busy") {
  const overflow = new Map;
  let total = 0;
  for (const line of psOutput.split(`
`)) {
    const matched = /^\s*(\d+)\s+(.+)$/.exec(line);
    if (!matched)
      continue;
    const pid = Number(matched[1]);
    const command = matched[2] ?? "";
    if (!isClaudeCommand(command))
      continue;
    if (statusOf(pid) !== "busy")
      continue;
    const settingsPath = settingsFragmentPath(command);
    const stem = settingsPath ? fragmentStem(settingsPath, fragmentDir) : null;
    if (stem) {
      overflow.set(stem, (overflow.get(stem) ?? 0) + 1);
      continue;
    }
    total++;
  }
  return { total, overflow };
}
async function scanClaudeSessions(sessionDir = SESSION_DIR, fragmentDir = FRAGMENT_DIR) {
  if (process.platform === "win32") {
    return { total: 0, overflow: new Map };
  }
  try {
    const proc = Bun.spawn(["ps", "-eo", "pid=,command="], {
      stdin: "ignore",
      stdout: "pipe",
      stderr: "ignore"
    });
    const output = await new Response(proc.stdout).text();
    await proc.exited;
    return parseClaudeSessions(output, fragmentDir, (pid) => readSessionStatus(pid, sessionDir));
  } catch {
    return { total: 0, overflow: new Map };
  }
}
function pickProvider(config, totalBusy, overflowBusy) {
  if (totalBusy < positiveInt(config.defaultMax, DEFAULT_MAX))
    return null;
  const providers = Array.isArray(config.providers) ? config.providers : [];
  return providers.find((p2) => {
    if (!isUsable(p2))
      return false;
    const busy = overflowBusy.get(sanitizeName(p2.name)) ?? 0;
    return busy < positiveInt(p2.maxConcurrent, DEFAULT_MAX_CONCURRENT);
  }) ?? null;
}
function ensureFragment(provider, fragmentDir = FRAGMENT_DIR) {
  import_fs_extra4.default.mkdirSync(fragmentDir, { recursive: true });
  const env = {
    ANTHROPIC_BASE_URL: provider.baseUrl,
    ANTHROPIC_AUTH_TOKEN: provider.token
  };
  const models = [
    ["ANTHROPIC_MODEL", provider.model],
    ["ANTHROPIC_DEFAULT_OPUS_MODEL", provider.opusModel],
    ["ANTHROPIC_DEFAULT_SONNET_MODEL", provider.sonnetModel],
    ["ANTHROPIC_DEFAULT_HAIKU_MODEL", provider.haikuModel],
    ["CLAUDE_CODE_SUBAGENT_MODEL", provider.subagentModel]
  ];
  for (const [key, value] of models) {
    if (value)
      env[key] = value;
  }
  const settingsPath = join5(fragmentDir, `${sanitizeName(provider.name)}.json`);
  import_fs_extra4.default.writeFileSync(settingsPath, JSON.stringify({ env }), { mode: 384 });
  import_fs_extra4.default.chmodSync(settingsPath, 384);
  return settingsPath;
}
async function resolveOverflowSettings(options = {}) {
  const config = loadProvidersConfig(options.configPath);
  if (!config)
    return null;
  const sessions = options.sessions ?? await scanClaudeSessions();
  const provider = pickProvider(config, sessions.total, sessions.overflow);
  if (!provider)
    return null;
  try {
    return {
      provider,
      settingsPath: ensureFragment(provider, options.fragmentDir)
    };
  } catch {
    return null;
  }
}

// src/utils/shell.ts
var IDE_CACHE_PATH = join6(P_ROOT, "ide-cache.json");
var ideCache = null;
function loadIDECache() {
  if (ideCache)
    return ideCache;
  if (!existsSync(IDE_CACHE_PATH)) {
    ideCache = {};
    return ideCache;
  }
  try {
    ideCache = JSON.parse(readFileSync(IDE_CACHE_PATH, "utf-8")) ?? {};
    return ideCache;
  } catch {
    ideCache = {};
    return ideCache;
  }
}
function saveIDECache() {
  writeFileSync(IDE_CACHE_PATH, JSON.stringify(ideCache, null, 2));
}
async function execInDir(command, cwd, options = {}) {
  if (!options.silent) {
    console.log(import_picocolors4.default.dim("  $ ") + brand.secondary(command));
  }
  try {
    const isWindows = process.platform === "win32";
    const shell = isWindows ? process.env.COMSPEC || "cmd.exe" : "/bin/sh";
    const shellArgs = isWindows ? ["/c"] : ["-c"];
    const proc = Bun.spawn([shell, ...shellArgs, command], {
      cwd,
      stdin: "inherit",
      stdout: "inherit",
      stderr: options.captureStderr ? "pipe" : "inherit",
      env: {
        ...process.env,
        FORCE_COLOR: "3"
      }
    });
    let stderrOutput = "";
    if (options.captureStderr && proc.stderr) {
      const reader = proc.stderr.getReader();
      const decoder = new TextDecoder;
      while (true) {
        const { done, value } = await reader.read();
        if (done)
          break;
        stderrOutput += decoder.decode(value, { stream: true });
        process.stderr.write(value);
      }
    }
    const exitCode = await proc.exited;
    return {
      success: exitCode === 0,
      output: "",
      stderr: stderrOutput
    };
  } catch (error) {
    const err = error;
    return { success: false, output: err.message };
  }
}
async function execAndCapture(command, cwd) {
  try {
    const isWindows = process.platform === "win32";
    const shell = isWindows ? process.env.COMSPEC || "cmd.exe" : "/bin/sh";
    const shellArgs = isWindows ? ["/c"] : ["-c"];
    const proc = Bun.spawn([shell, ...shellArgs, command], {
      cwd,
      stdio: ["pipe", "pipe", "pipe"],
      env: process.env
    });
    const exitCode = await proc.exited;
    const output = await new Response(proc.stdout).text();
    const errorOutput = await new Response(proc.stderr).text();
    return {
      success: exitCode === 0,
      output: output.trim(),
      error: errorOutput.trim()
    };
  } catch (error) {
    const err = error;
    return { success: false, output: "", error: err.message };
  }
}
var TUI_COMMANDS = new Set(["claude", "codex", "gemini", "aider"]);
function isTUICommand(ide) {
  return TUI_COMMANDS.has(ide.trim().split(/\s+/)[0] ?? "");
}
var PROMPT_TUI_COMMANDS = new Set(["claude"]);
function supportsPromptArg(ide) {
  return PROMPT_TUI_COMMANDS.has(ide.trim().split(/\s+/)[0] ?? "");
}
function shellQuote(value) {
  return `'${value.replace(/'/g, "'\\''")}'`;
}
async function openWithIDE(ide, path, fuzzy = false) {
  const resolved = fuzzy ? resolveCommand(ide) : ide;
  if (isTUICommand(resolved)) {
    let cwd = path;
    try {
      if (statSync(path).isFile())
        cwd = dirname3(path);
    } catch {}
    if (!existsSync(cwd)) {
      throw new Error(`\u8DEF\u5F84\u4E0D\u5B58\u5728: ${cwd}`);
    }
    const isWindows = process.platform === "win32";
    const shell = isWindows ? process.env.COMSPEC || "cmd.exe" : "/bin/sh";
    const shellArgs = isWindows ? ["/c"] : ["-c"];
    const watcher = maybeWatchCchiveSync(loadConfig().cchiveSync, cwd);
    const overflow = isClaudeCommand(resolved) ? await resolveOverflowSettings() : null;
    const command = overflow ? `${resolved} --settings ${shellQuote(overflow.settingsPath)}` : resolved;
    if (overflow) {
      printInfo(`\u9ED8\u8BA4\u6E20\u9053\u5DF2\u6EE1\uFF0C\u6EA2\u51FA\u5230 ${brand.primary(overflow.provider.name)}`);
    }
    try {
      const proc = Bun.spawn([shell, ...shellArgs, command], {
        cwd,
        stdin: "inherit",
        stdout: "inherit",
        stderr: "inherit",
        env: process.env
      });
      await proc.exited;
      return { resolved };
    } catch {
      throw new Error(`\u65E0\u6CD5\u6253\u5F00 ${ide}\uFF0C\u8BF7\u786E\u4FDD ${resolved} \u547D\u4EE4\u5DF2\u5B89\u88C5\u5E76\u6DFB\u52A0\u5230 PATH \u73AF\u5883\u53D8\u91CF\u3002`);
    } finally {
      watcher?.stop();
    }
  }
  try {
    await $2`${resolved} ${path}`.quiet();
    return { resolved };
  } catch {
    throw new Error(`\u65E0\u6CD5\u6253\u5F00 ${ide}\uFF0C\u8BF7\u786E\u4FDD ${resolved} \u547D\u4EE4\u5DF2\u5B89\u88C5\u5E76\u6DFB\u52A0\u5230 PATH \u73AF\u5883\u53D8\u91CF\u3002`);
  }
}
function resolveCommand(prefix) {
  const cache = loadIDECache();
  if (cache[prefix]) {
    return cache[prefix];
  }
  const isWindows = process.platform === "win32";
  const pathEnv = process.env.PATH || "";
  const pathSep = isWindows ? ";" : ":";
  const paths = pathEnv.split(pathSep);
  const candidates = [];
  for (const dir of paths) {
    try {
      const files = readdirSync(dir);
      for (const file of files) {
        const name = isWindows && file.endsWith(".exe") ? file.slice(0, -4) : file;
        if (name.startsWith(prefix)) {
          candidates.push(name);
        }
      }
    } catch {}
  }
  const resolved = candidates.includes(prefix) ? prefix : candidates[0] || prefix;
  if (resolved !== prefix) {
    cache[prefix] = resolved;
    saveIDECache();
  }
  return resolved;
}
async function commandExists(command) {
  try {
    await $2`which ${command}`.quiet();
    return true;
  } catch {
    return false;
  }
}
async function moveToTrash(path) {
  if (process.platform === "darwin") {
    const proc = Bun.spawn([
      "osascript",
      "-e",
      `tell application "Finder" to move POSIX file "${path}" to trash`
    ], {
      stdio: ["pipe", "pipe", "pipe"]
    });
    return await proc.exited === 0;
  }
  const trashCmds = ["gio trash", "trash-put", "trash"];
  for (const cmd of trashCmds) {
    if (await commandExists(cmd === "gio trash" ? "gio" : cmd === "trash-put" ? "trash-put" : "trash")) {
      const args = cmd === "gio trash" ? ["trash", path] : [path];
      const bin = cmd === "gio trash" ? "gio" : cmd;
      const proc = Bun.spawn([bin, ...args], {
        stdio: ["pipe", "pipe", "pipe"]
      });
      return await proc.exited === 0;
    }
  }
  return false;
}

// src/core/template.ts
async function getLocalTemplates() {
  const localTemplates = {};
  if (!await import_fs_extra5.default.pathExists(TEMPLATES_DIR)) {
    return localTemplates;
  }
  const entries = await import_fs_extra5.default.readdir(TEMPLATES_DIR, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.isDirectory()) {
      localTemplates[entry.name] = {
        name: entry.name,
        dir: entry.name
      };
    }
  }
  return localTemplates;
}
async function getAllTemplates(configTemplates) {
  const localTemplates = await getLocalTemplates();
  return {
    ...localTemplates,
    ...configTemplates
  };
}
async function applyTemplate(template, projectPath) {
  await import_fs_extra5.default.ensureDir(projectPath);
  if (template.command) {
    console.log();
    console.log(import_picocolors5.default.dim("  \u6267\u884C\u6A21\u677F\u547D\u4EE4:"));
    const result = await execInDir(template.command, projectPath);
    if (!result.success) {
      return {
        success: false,
        message: `\u6A21\u677F\u547D\u4EE4\u6267\u884C\u5931\u8D25`
      };
    }
    console.log();
    return { success: true, message: "\u6A21\u677F\u5E94\u7528\u6210\u529F" };
  }
  if (template.dir) {
    const templatePath = join7(TEMPLATES_DIR, template.dir);
    if (!await import_fs_extra5.default.pathExists(templatePath)) {
      return {
        success: false,
        message: `\u6A21\u677F\u76EE\u5F55\u4E0D\u5B58\u5728: ${template.dir}\uFF08\u5728 ${TEMPLATES_DIR} \u4E2D\u67E5\u627E\uFF09`
      };
    }
    console.log();
    console.log(import_picocolors5.default.dim("  \u590D\u5236\u6A21\u677F\u6587\u4EF6:"));
    console.log(import_picocolors5.default.dim("  $ ") + brand.secondary(`cp -r ${templatePath}/* ${projectPath}/`));
    try {
      await import_fs_extra5.default.copy(templatePath, projectPath, { overwrite: true });
      console.log(import_picocolors5.default.dim("    ") + brand.success("\u2713") + import_picocolors5.default.dim(" \u590D\u5236\u5B8C\u6210"));
      console.log();
      return { success: true, message: "\u6A21\u677F\u590D\u5236\u6210\u529F" };
    } catch (error) {
      const err = error;
      console.log(import_picocolors5.default.red(`    ${err.message}`));
      return {
        success: false,
        message: `\u6A21\u677F\u590D\u5236\u5931\u8D25: ${err.message}`
      };
    }
  }
  if (template.hooks && template.hooks.length > 0) {
    return { success: true, message: "\u6A21\u677F\u914D\u7F6E\u6709\u6548\uFF08\u4EC5\u6267\u884C hooks\uFF09" };
  }
  return { success: true, message: "\u7A7A\u6A21\u677F\uFF08\u65E0\u64CD\u4F5C\uFF09" };
}
function getTemplateChoices(templates) {
  return Object.entries(templates).map(([key, template]) => {
    let hint;
    if (template.command) {
      hint = "\u547D\u4EE4\u6A21\u5F0F";
    } else if (template.dir) {
      hint = "\u672C\u5730\u6A21\u677F";
    }
    return {
      value: key,
      label: template.name,
      hint
    };
  });
}
function loadTemplatesMeta() {
  if (!import_fs_extra5.default.existsSync(TEMPLATES_META_PATH)) {
    return {};
  }
  try {
    return JSON.parse(import_fs_extra5.default.readFileSync(TEMPLATES_META_PATH, "utf-8"));
  } catch {
    return {};
  }
}
function saveTemplatesMeta(meta) {
  import_fs_extra5.default.writeFileSync(TEMPLATES_META_PATH, JSON.stringify(meta, null, 2), "utf-8");
}
function markTemplatePublished(name, owner, repo) {
  const meta = loadTemplatesMeta();
  const url = `https://github.com/${owner}/${repo}`;
  meta[name] = { owner, repo, url, publishedAt: new Date().toISOString() };
  saveTemplatesMeta(meta);
}
function getPublishedTemplates() {
  return loadTemplatesMeta();
}

// src/commands/add.ts
function validateBasePath(input) {
  if (!input || input.trim() === "")
    return ".";
  if (isAbsolute(input.trim())) {
    throw new Error("\u76EE\u6807\u8DEF\u5F84\u5FC5\u987B\u4E3A\u76F8\u5BF9\u8DEF\u5F84\u6216 .");
  }
  return input.trim();
}
function validateAlias(input) {
  if (!input || input.trim() === "") {
    return "\u522B\u540D\u4E0D\u80FD\u4E3A\u7A7A";
  }
  const invalidChars = /[<>:"/\\|?*]/;
  if (invalidChars.test(input)) {
    return "\u522B\u540D\u5305\u542B\u975E\u6CD5\u5B57\u7B26";
  }
  return;
}
async function ensureBasePath(basePath) {
  if (!await import_fs_extra6.default.pathExists(basePath)) {
    await import_fs_extra6.default.ensureDir(basePath);
  }
}
async function ensureDestination(destPath) {
  if (!await import_fs_extra6.default.pathExists(destPath))
    return;
  const entries = await import_fs_extra6.default.readdir(destPath);
  if (entries.length === 0)
    return;
  const shouldContinue = await ye({
    message: `${brand.warning("\u26A0")} \u76EE\u6807\u76EE\u5F55\u5DF2\u5B58\u5728\u4E14\u975E\u7A7A\uFF0C\u7EE7\u7EED\u5C06\u8986\u76D6\u6587\u4EF6\uFF0C\u662F\u5426\u7EE7\u7EED\uFF1F`,
    initialValue: false
  });
  if (pD(shouldContinue) || !shouldContinue) {
    Se(import_picocolors6.default.dim("\u5DF2\u53D6\u6D88"));
    process.exit(0);
  }
}
function splitSourceArg(input) {
  const [name, alias] = input.split(":");
  if (!name) {
    throw new Error("\u7F3A\u5C11\u6A21\u677F\u6216\u9879\u76EE\u540D\uFF01");
  }
  return { name, alias: alias || name };
}
async function resolveSource(sourceArg, configuredTemplates) {
  if (!sourceArg) {
    throw new Error("sourceArg \u672A\u63D0\u4F9B");
  }
  const { name, alias } = splitSourceArg(sourceArg);
  const isTemplate = Boolean(configuredTemplates[name]);
  const isProject = projectExists(name);
  if (!isTemplate && !isProject) {
    printError(`\u672A\u627E\u5230\u6A21\u677F\u6216\u9879\u76EE: ${name}`);
    console.log(import_picocolors6.default.dim("\u53EF\u7528\u6A21\u677F: ") + Object.keys(configuredTemplates).join(", ") + import_picocolors6.default.dim("\uFF1B\u9879\u76EE\u8BF7\u4F7F\u7528 p ls \u67E5\u770B"));
    process.exit(1);
  }
  if (isTemplate && isProject) {
    const selected = await ve({
      message: "\u68C0\u6D4B\u5230\u540C\u540D\u6A21\u677F\u548C\u9879\u76EE\uFF0C\u8BF7\u9009\u62E9\u6765\u6E90\u7C7B\u578B:",
      options: [
        { value: "template", label: "\u6A21\u677F" },
        { value: "project", label: "\u9879\u76EE" }
      ]
    });
    if (pD(selected)) {
      Se(import_picocolors6.default.dim("\u5DF2\u53D6\u6D88"));
      process.exit(0);
    }
    return { type: selected, name, alias };
  }
  return { type: isTemplate ? "template" : "project", name, alias };
}
async function interactivePick(templates, projects) {
  if (Object.keys(templates).length === 0 && projects.length === 0) {
    printInfo("\u6682\u65E0\u6A21\u677F\u6216\u9879\u76EE\u53EF\u7528");
    process.exit(0);
  }
  Ie(bgOrange(" \u6DFB\u52A0\u5230\u5F53\u524D\u9879\u76EE "));
  const type = await ve({
    message: "\u9009\u62E9\u6765\u6E90\u7C7B\u578B:",
    options: [
      { value: "template", label: "\u6A21\u677F", hint: "\u6765\u81EA config \u6216\u672C\u5730\u6A21\u677F" },
      { value: "project", label: "\u9879\u76EE", hint: "\u6765\u81EA ~/.p/projects" }
    ]
  });
  if (pD(type)) {
    Se(import_picocolors6.default.dim("\u5DF2\u53D6\u6D88"));
    process.exit(0);
  }
  let name;
  if (type === "template") {
    if (Object.keys(templates).length === 0) {
      printInfo("\u6682\u65E0\u53EF\u7528\u6A21\u677F");
      process.exit(0);
    }
    const result = await ve({
      message: "\u8BF7\u9009\u62E9\u6A21\u677F:",
      options: getTemplateChoices(templates)
    });
    if (pD(result)) {
      Se(import_picocolors6.default.dim("\u5DF2\u53D6\u6D88"));
      process.exit(0);
    }
    name = result;
  } else {
    if (projects.length === 0) {
      printInfo("\u6682\u65E0\u53EF\u7528\u9879\u76EE");
      process.exit(0);
    }
    const result = await ve({
      message: "\u8BF7\u9009\u62E9\u9879\u76EE:",
      options: projects.map((p2) => ({
        value: p2.name,
        label: p2.name,
        hint: p2.template ? import_picocolors6.default.cyan(p2.template) : import_picocolors6.default.dim(p2.path)
      }))
    });
    if (pD(result)) {
      Se(import_picocolors6.default.dim("\u5DF2\u53D6\u6D88"));
      process.exit(0);
    }
    name = result;
  }
  const aliasInput = await he({
    message: "\u8BF7\u8F93\u5165\u6DFB\u52A0\u540E\u7684\u76EE\u5F55\u540D\uFF08\u9ED8\u8BA4\u540C\u540D\uFF09:",
    initialValue: name,
    validate: (val) => validateAlias(val)
  });
  if (pD(aliasInput)) {
    Se(import_picocolors6.default.dim("\u5DF2\u53D6\u6D88"));
    process.exit(0);
  }
  const targetInput = await he({
    message: "\u8BF7\u8F93\u5165\u76EE\u6807\u57FA\u8DEF\u5F84\uFF08\u9ED8\u8BA4\u4E3A\u5F53\u524D\u76EE\u5F55 .\uFF09:",
    placeholder: ". \u6216\u76F8\u5BF9\u8DEF\u5F84",
    initialValue: ".",
    validate: (val) => {
      try {
        validateBasePath(val);
      } catch (error) {
        return error.message;
      }
    }
  });
  if (pD(targetInput)) {
    Se(import_picocolors6.default.dim("\u5DF2\u53D6\u6D88"));
    process.exit(0);
  }
  return {
    type,
    name,
    alias: String(aliasInput),
    target: validateBasePath(targetInput)
  };
}
function getTemplateDir(templateKey, template) {
  const dirName = template.dir || templateKey;
  return join8(TEMPLATES_DIR, dirName);
}
async function handleProjectAdd(projectName, destDir, projects) {
  const exists = projectExists(projectName);
  if (!exists) {
    printError(`\u9879\u76EE\u4E0D\u5B58\u5728: ${projectName}`);
    console.log(import_picocolors6.default.dim("\u4F7F\u7528 p ls \u67E5\u770B\u6240\u6709\u9879\u76EE"));
    process.exit(1);
  }
  const sourcePath = getProjectPath(projectName);
  const project = projects.find((p2) => p2.name === projectName);
  console.log();
  console.log(import_picocolors6.default.dim("  \u6765\u6E90\u9879\u76EE: ") + brand.secondary(projectName));
  if (project?.template) {
    console.log(import_picocolors6.default.dim("  \u6A21\u677F\u6807\u8BB0: ") + import_picocolors6.default.cyan(project.template));
  }
  console.log(import_picocolors6.default.dim("  \u76EE\u6807\u8DEF\u5F84: ") + import_picocolors6.default.dim(destDir));
  const copySpinner = Y2();
  copySpinner.start("\u6B63\u5728\u590D\u5236\u76EE\u5F55...");
  try {
    await import_fs_extra6.default.copy(sourcePath, destDir, { overwrite: true });
    copySpinner.stop(`${brand.success("\u2713")} \u76EE\u5F55\u5DF2\u590D\u5236\u5230: ${brand.primary(destDir)}`);
    Se(brand.success("\u2728 \u6DFB\u52A0\u5B8C\u6210"));
  } catch (error) {
    copySpinner.stop("\u590D\u5236\u5931\u8D25");
    printError(error.message);
    process.exit(1);
  }
}
var addCommand = new Command("add").description("\u5C06\u6A21\u677F\u6216\u9879\u76EE\u6DFB\u52A0\u5230\u5F53\u524D\u76EE\u5F55\u6216\u6307\u5B9A\u8DEF\u5F84").argument("[source]", "\u6A21\u677F\u540D\u6216\u9879\u76EE\u540D\uFF0C\u652F\u6301 name:alias \u91CD\u547D\u540D").argument("[target]", "\u76EE\u6807\u57FA\u8DEF\u5F84\uFF0C\u9ED8\u8BA4\u4E3A\u5F53\u524D\u76EE\u5F55 .").action(async (sourceArg, targetArg) => {
  const projects = listProjects();
  const config = loadConfig();
  const allTemplates = await getAllTemplates(config.templates);
  let context;
  if (!sourceArg) {
    const picked = await interactivePick(allTemplates, projects);
    context = {
      type: picked.type,
      name: picked.name,
      alias: picked.alias,
      targetPath: resolve(process.cwd(), picked.target)
    };
  } else {
    const resolvedTarget = (() => {
      try {
        return validateBasePath(targetArg);
      } catch (error) {
        printError(error.message);
        process.exit(1);
      }
    })();
    const { type, name, alias } = await resolveSource(sourceArg, allTemplates);
    context = {
      type,
      name,
      alias,
      targetPath: resolve(process.cwd(), resolvedTarget)
    };
  }
  const basePath = context.targetPath;
  const destDir = resolve(basePath, context.alias);
  await ensureBasePath(basePath);
  await ensureDestination(destDir);
  if (context.type === "template") {
    const template = allTemplates[context.name];
    if (!template) {
      printError(`\u6A21\u677F\u4E0D\u5B58\u5728: ${context.name}`);
      process.exit(1);
    }
    const templateDir = getTemplateDir(context.name, template);
    if (!await import_fs_extra6.default.pathExists(templateDir)) {
      printError(`\u6A21\u677F\u76EE\u5F55\u4E0D\u5B58\u5728: ${templateDir}`);
      process.exit(1);
    }
    console.log();
    console.log(import_picocolors6.default.dim("  \u4F7F\u7528\u6A21\u677F\u76EE\u5F55: ") + brand.secondary(templateDir));
    console.log(import_picocolors6.default.dim("  \u76EE\u6807\u8DEF\u5F84: ") + import_picocolors6.default.dim(destDir));
    const s = Y2();
    s.start("\u6B63\u5728\u590D\u5236\u76EE\u5F55...");
    try {
      await import_fs_extra6.default.copy(templateDir, destDir, { overwrite: true });
      s.stop(`${brand.success("\u2713")} \u6A21\u677F\u5DF2\u590D\u5236\u5230: ${brand.primary(destDir)}`);
      Se(brand.success("\u2728 \u6DFB\u52A0\u5B8C\u6210"));
    } catch (error) {
      s.stop("\u590D\u5236\u5931\u8D25");
      printError(error.message);
      process.exit(1);
    }
    return;
  }
  await handleProjectAdd(context.name, destDir, projects);
});

// src/commands/cd.ts
init_esm();
var import_picocolors9 = __toESM(require_picocolors(), 1);

// src/utils/live-search.ts
var import_picocolors7 = __toESM(require_picocolors(), 1);
var import_sisteransi3 = __toESM(require_src(), 1);
import * as readline from "readline";
import { Writable } from "stream";
var MAX_VISIBLE = 8;
var CANCEL = Symbol("live-search:cancel");
function buildInputLine(query, cursorPos, placeholder) {
  if (query.length === 0 && placeholder) {
    return import_picocolors7.default.inverse(placeholder[0]) + import_picocolors7.default.dim(placeholder.slice(1));
  }
  const before = query.slice(0, cursorPos);
  const at = query[cursorPos];
  const after = query.slice(cursorPos + 1);
  const cursorChar = at ? import_picocolors7.default.inverse(at) : import_picocolors7.default.inverse(" ");
  return before + cursorChar + after;
}
async function liveSearch(opts) {
  const stdin = process.stdin;
  const stdout = process.stdout;
  const multi = opts.multiSelect ?? false;
  const interceptStream = new Writable({
    write(_chunk, _encoding, callback) {
      callback();
    }
  });
  stdin.setRawMode(true);
  stdin.resume();
  stdout.write(import_sisteransi3.cursor.hide);
  const rl = readline.createInterface({
    input: stdin,
    output: interceptStream,
    terminal: true
  });
  readline.emitKeypressEvents(stdin, rl);
  const initialQuery = opts.initialQuery || "";
  const initialFiltered = initialQuery ? opts.filterFn(initialQuery) : opts.options;
  const state = {
    query: initialQuery,
    cursor: initialQuery.length,
    selectedIndex: 0,
    scrollOffset: 0,
    filtered: initialFiltered,
    checked: new Set
  };
  let blockHeight = 0;
  let resolved = false;
  function render() {
    const parts = [];
    if (blockHeight > 0)
      parts.push(import_sisteransi3.cursor.up(blockHeight));
    const lines = [];
    const countTag = multi && state.checked.size > 0 ? import_picocolors7.default.dim(` (\u5DF2\u9009 ${state.checked.size})`) : "";
    lines.push(`  ${brand.secondary("\u25C6")} ${opts.message}${countTag}`);
    const placeholder = opts.placeholder || "";
    const inputLine = buildInputLine(state.query, state.cursor, placeholder);
    lines.push(`  ${brand.secondary("\u2502")} ${inputLine}`);
    lines.push(`  ${brand.secondary("\u2502")}`);
    const visibleCount = Math.min(MAX_VISIBLE, state.filtered.length - state.scrollOffset);
    const visible = state.filtered.slice(state.scrollOffset, state.scrollOffset + visibleCount);
    if (visible.length === 0) {
      lines.push(`  ${brand.secondary("\u2502")}   ${import_picocolors7.default.dim("\u6CA1\u6709\u5339\u914D\u7684\u9879\u76EE")}`);
    } else {
      for (let i = 0;i < visible.length; i++) {
        const idx = state.scrollOffset + i;
        const isCursor = idx === state.selectedIndex;
        const item = visible[i];
        if (!item)
          continue;
        let marker;
        if (multi) {
          const checked = state.checked.has(item.value);
          const box = checked ? import_picocolors7.default.green("\u25A0") : import_picocolors7.default.dim("\u25A1");
          marker = isCursor ? brand.primary("\u25B8") + box : import_picocolors7.default.dim(" ") + box;
        } else {
          marker = isCursor ? brand.primary("\u25C9") : import_picocolors7.default.dim("\u25CB");
        }
        const label = isCursor ? brand.bold(item.label) : item.label;
        const hint2 = item.hint ? import_picocolors7.default.dim("  ") + item.hint : "";
        lines.push(`  ${brand.secondary("\u2502")} ${marker} ${label}${hint2}`);
      }
    }
    const remaining = state.filtered.length - state.scrollOffset - MAX_VISIBLE;
    if (remaining > 0) {
      lines.push(`  ${brand.secondary("\u2502")}   ${import_picocolors7.default.dim(`... \u8FD8\u6709 ${remaining} \u4E2A`)}`);
    }
    let hint = "\u8F93\u5165\u7B5B\u9009 \xB7 \u2191\u2193 \u9009\u62E9 \xB7 Enter \u786E\u8BA4";
    if (multi)
      hint += " \xB7 Space \u5207\u6362 \xB7 Ctrl+A \u5168\u9009";
    hint += " \xB7 Esc \u53D6\u6D88";
    lines.push(`  ${brand.secondary("\u2514")} ${import_picocolors7.default.dim(hint)}`);
    for (const line of lines) {
      parts.push(`${line}\x1B[K
`);
    }
    if (blockHeight > lines.length) {
      for (let i = lines.length;i < blockHeight; i++) {
        parts.push(`\x1B[K
`);
      }
      parts.push(import_sisteransi3.cursor.up(blockHeight - lines.length));
    }
    stdout.write(parts.join(""));
    blockHeight = lines.length;
  }
  render();
  return new Promise((resolve2) => {
    function cleanup() {
      if (resolved)
        return;
      resolved = true;
      stdin.removeListener("keypress", onKey);
      stdin.setRawMode(false);
      stdin.pause();
      rl.close();
      stdout.write(import_sisteransi3.cursor.show);
    }
    function submitResult(values, label) {
      const parts = [];
      parts.push(import_sisteransi3.cursor.up(blockHeight));
      for (let i = 0;i < blockHeight; i++) {
        parts.push(`\x1B[K
`);
      }
      parts.push(import_sisteransi3.cursor.up(blockHeight));
      parts.push(`  ${brand.success("\u25C6")} ${opts.message} ${brand.primary(label)}
`);
      stdout.write(parts.join(""));
      cleanup();
      resolve2(values);
    }
    function doCancel() {
      const parts = [];
      parts.push(import_sisteransi3.cursor.up(blockHeight));
      for (let i = 0;i < blockHeight; i++) {
        parts.push(`\x1B[K
`);
      }
      parts.push(import_sisteransi3.cursor.up(blockHeight));
      parts.push(`  ${brand.secondary("\u25C6")} ${opts.message} ${import_picocolors7.default.dim("\u5DF2\u53D6\u6D88")}
`);
      stdout.write(parts.join(""));
      cleanup();
      resolve2(CANCEL);
    }
    function toggleCurrent() {
      const item = state.filtered[state.selectedIndex];
      if (!item)
        return;
      if (state.checked.has(item.value)) {
        state.checked.delete(item.value);
      } else {
        state.checked.add(item.value);
      }
    }
    function toggleAll() {
      if (state.filtered.every((f) => state.checked.has(f.value))) {
        for (const f of state.filtered)
          state.checked.delete(f.value);
      } else {
        for (const f of state.filtered)
          state.checked.add(f.value);
      }
    }
    function onKey(_char, key) {
      if (resolved)
        return;
      if (key.sequence === "\x03") {
        doCancel();
        return;
      }
      if (multi && key.name === "a" && key.ctrl) {
        toggleAll();
        render();
        return;
      }
      if (multi && key.name === "space") {
        toggleCurrent();
        render();
        return;
      }
      switch (key.name) {
        case "return": {
          if (state.filtered.length === 0)
            return;
          if (multi) {
            if (state.checked.size > 0) {
              const values = [...state.checked];
              submitResult(values, `${values.length} \u4E2A\u9879\u76EE`);
            } else {
              const item = state.filtered[state.selectedIndex];
              if (item)
                submitResult([item.value], item.label);
            }
          } else {
            const selected = state.filtered[state.selectedIndex];
            if (selected)
              submitResult([selected.value], selected.label);
          }
          return;
        }
        case "escape": {
          doCancel();
          return;
        }
        case "backspace": {
          if (state.cursor > 0) {
            state.query = state.query.slice(0, state.cursor - 1) + state.query.slice(state.cursor);
            state.cursor--;
            refilter();
          }
          break;
        }
        case "delete": {
          if (state.cursor < state.query.length) {
            state.query = state.query.slice(0, state.cursor) + state.query.slice(state.cursor + 1);
            refilter();
          }
          break;
        }
        case "left": {
          if (state.cursor > 0)
            state.cursor--;
          break;
        }
        case "right": {
          if (state.cursor < state.query.length)
            state.cursor++;
          break;
        }
        case "up": {
          if (state.selectedIndex > 0) {
            state.selectedIndex--;
            if (state.selectedIndex < state.scrollOffset) {
              state.scrollOffset = state.selectedIndex;
            }
          } else if (state.filtered.length > 0) {
            state.selectedIndex = state.filtered.length - 1;
            state.scrollOffset = Math.max(0, state.filtered.length - MAX_VISIBLE);
          }
          break;
        }
        case "down": {
          if (state.selectedIndex < state.filtered.length - 1) {
            state.selectedIndex++;
            if (state.selectedIndex >= state.scrollOffset + MAX_VISIBLE) {
              state.scrollOffset = state.selectedIndex - MAX_VISIBLE + 1;
            }
          } else if (state.filtered.length > 0) {
            state.selectedIndex = 0;
            state.scrollOffset = 0;
          }
          break;
        }
        default: {
          if (key.sequence && key.sequence.length === 1 && !key.ctrl && !key.meta) {
            state.query = state.query.slice(0, state.cursor) + key.sequence + state.query.slice(state.cursor);
            state.cursor++;
            refilter();
          }
          break;
        }
      }
      render();
    }
    function refilter() {
      state.filtered = state.query ? opts.filterFn(state.query) : opts.options;
      state.selectedIndex = 0;
      state.scrollOffset = 0;
      if (multi) {
        const visible = new Set(state.filtered.map((f) => f.value));
        for (const v2 of state.checked) {
          if (!visible.has(v2))
            state.checked.delete(v2);
        }
      }
    }
    stdin.on("keypress", onKey);
  });
}

// src/utils/project-search.ts
var import_picocolors8 = __toESM(require_picocolors(), 1);
function filterProjects(projects, query) {
  const q2 = query.toLowerCase();
  return projects.filter((p2) => p2.name.toLowerCase().includes(q2) || p2.template?.toLowerCase().includes(q2) || p2.tags?.some((tag) => tag.toLowerCase().includes(q2)));
}
function projectHint(p2) {
  if (p2.firstPrompt) {
    return import_picocolors8.default.dim(truncateByWidth(p2.firstPrompt, 60));
  }
  const hints = [];
  if (p2.template)
    hints.push(import_picocolors8.default.cyan(p2.template));
  if (p2.tags && p2.tags.length > 0) {
    hints.push(p2.tags.map((t) => import_picocolors8.default.magenta(`#${t}`)).join(" "));
  }
  return hints.length > 0 ? hints.join(" ") : import_picocolors8.default.dim(p2.path);
}

// src/commands/cd.ts
var cdCommand = new Command("cd").alias("c").description("\u5207\u6362\u5230\u9879\u76EE\u76EE\u5F55").argument("[name]", "\u9879\u76EE\u540D\u79F0\u6216\u641C\u7D22\u5173\u952E\u8BCD").action(async (name) => {
  const projects = listProjects();
  if (projects.length === 0) {
    printInfo(`\u6682\u65E0\u9879\u76EE\uFF0C\u4F7F\u7528 ${brand.primary("p new")} \u521B\u5EFA\u65B0\u9879\u76EE`);
    return;
  }
  let projectName;
  if (!name) {
    const options = projects.map((p2) => ({
      value: p2.name,
      label: p2.name,
      hint: projectHint(p2)
    }));
    const result = await liveSearch({
      message: "\u9009\u62E9\u9879\u76EE:",
      placeholder: "\u8F93\u5165\u540D\u79F0\u3001\u6A21\u677F\u6216\u6807\u7B7E\u7B5B\u9009",
      options,
      filterFn: (query) => {
        if (!query)
          return options;
        const filtered = filterProjects(projects, query);
        return filtered.map((p2) => ({
          value: p2.name,
          label: p2.name,
          hint: projectHint(p2)
        }));
      },
      multiSelect: false
    });
    if (result === CANCEL) {
      Se(import_picocolors9.default.dim("\u5DF2\u53D6\u6D88"));
      process.exit(0);
    }
    projectName = result[0] ?? "";
  } else if (!projectExists(name)) {
    const filtered = filterProjects(projects, name);
    if (filtered.length === 1) {
      projectName = filtered[0]?.name ?? name;
      console.log(import_picocolors9.default.dim("  \u5339\u914D\u5230: ") + brand.primary(projectName));
    } else if (filtered.length > 1) {
      console.log(import_picocolors9.default.dim(`  \u5339\u914D\u5230 ${filtered.length} \u4E2A\u9879\u76EE`));
      const options = projects.map((p2) => ({
        value: p2.name,
        label: p2.name,
        hint: projectHint(p2)
      }));
      const result = await liveSearch({
        message: "\u9009\u62E9\u9879\u76EE:",
        placeholder: "\u8F93\u5165\u540D\u79F0\u3001\u6A21\u677F\u6216\u6807\u7B7E\u7B5B\u9009",
        options,
        filterFn: (query) => {
          if (!query)
            return options;
          const f = filterProjects(projects, query);
          return f.map((p2) => ({
            value: p2.name,
            label: p2.name,
            hint: projectHint(p2)
          }));
        },
        initialQuery: name,
        multiSelect: false
      });
      if (result === CANCEL) {
        Se(import_picocolors9.default.dim("\u5DF2\u53D6\u6D88"));
        process.exit(0);
      }
      projectName = result[0] ?? "";
    } else {
      printError(`\u9879\u76EE\u4E0D\u5B58\u5728: ${name}`);
      console.log(import_picocolors9.default.dim("\u4F7F\u7528 ") + brand.primary("p ls") + import_picocolors9.default.dim(" \u67E5\u770B\u6240\u6709\u9879\u76EE"));
      process.exit(1);
    }
  } else {
    projectName = name;
  }
  const projectPath = getProjectPath(projectName);
  const shell = process.env.SHELL || "/bin/bash";
  const s = Y2();
  s.start(`\u5207\u6362\u5230: ${brand.primary(projectName)}`);
  s.stop(`${brand.success("\u2713")} ${brand.primary(projectName)}`);
  console.log();
  const proc = Bun.spawn([shell], {
    cwd: projectPath,
    stdin: "inherit",
    stdout: "inherit",
    stderr: "inherit",
    env: { ...process.env }
  });
  const exitCode = await proc.exited;
  process.exit(exitCode);
});

// src/commands/claude.ts
init_esm();
var import_picocolors10 = __toESM(require_picocolors(), 1);
var claudeCommand = new Command("claude").alias("cc").description("\u5207\u6362\u5230\u9879\u76EE\u76EE\u5F55\u5E76\u542F\u52A8 Claude Code").argument("[name]", "\u9879\u76EE\u540D\u79F0\u6216\u641C\u7D22\u5173\u952E\u8BCD").action(async (name) => {
  const projects = listProjects();
  if (projects.length === 0) {
    printInfo(`\u6682\u65E0\u9879\u76EE\uFF0C\u4F7F\u7528 ${brand.primary("p new")} \u521B\u5EFA\u65B0\u9879\u76EE`);
    return;
  }
  let projectName;
  if (!name) {
    const options = projects.map((p2) => ({
      value: p2.name,
      label: p2.name,
      hint: projectHint(p2)
    }));
    const result = await liveSearch({
      message: "\u9009\u62E9\u9879\u76EE:",
      placeholder: "\u8F93\u5165\u540D\u79F0\u3001\u6A21\u677F\u6216\u6807\u7B7E\u7B5B\u9009",
      options,
      filterFn: (query) => {
        if (!query)
          return options;
        const filtered = filterProjects(projects, query);
        return filtered.map((p2) => ({
          value: p2.name,
          label: p2.name,
          hint: projectHint(p2)
        }));
      },
      multiSelect: false
    });
    if (result === CANCEL) {
      Se(import_picocolors10.default.dim("\u5DF2\u53D6\u6D88"));
      process.exit(0);
    }
    projectName = result[0] ?? "";
  } else if (!projectExists(name)) {
    const filtered = filterProjects(projects, name);
    if (filtered.length === 1) {
      projectName = filtered[0]?.name ?? name;
      console.log(import_picocolors10.default.dim("  \u5339\u914D\u5230: ") + brand.primary(projectName));
    } else if (filtered.length > 1) {
      console.log(import_picocolors10.default.dim(`  \u5339\u914D\u5230 ${filtered.length} \u4E2A\u9879\u76EE`));
      const options = projects.map((p2) => ({
        value: p2.name,
        label: p2.name,
        hint: projectHint(p2)
      }));
      const result = await liveSearch({
        message: "\u9009\u62E9\u9879\u76EE:",
        placeholder: "\u8F93\u5165\u540D\u79F0\u3001\u6A21\u677F\u6216\u6807\u7B7E\u7B5B\u9009",
        options,
        filterFn: (query) => {
          if (!query)
            return options;
          const f = filterProjects(projects, query);
          return f.map((p2) => ({
            value: p2.name,
            label: p2.name,
            hint: projectHint(p2)
          }));
        },
        initialQuery: name,
        multiSelect: false
      });
      if (result === CANCEL) {
        Se(import_picocolors10.default.dim("\u5DF2\u53D6\u6D88"));
        process.exit(0);
      }
      projectName = result[0] ?? "";
    } else {
      printError(`\u9879\u76EE\u4E0D\u5B58\u5728: ${name}`);
      console.log(import_picocolors10.default.dim("\u4F7F\u7528 ") + brand.primary("p ls") + import_picocolors10.default.dim(" \u67E5\u770B\u6240\u6709\u9879\u76EE"));
      process.exit(1);
    }
  } else {
    projectName = name;
  }
  const projectPath = getProjectPath(projectName);
  const s = Y2();
  s.start(`\u6B63\u5728\u542F\u52A8 Claude Code: ${brand.primary(projectName)}`);
  s.stop(`${brand.success("\u2713")} ${brand.primary("claude")} ${import_picocolors10.default.dim(`\u2014 ${projectName}`)}`);
  console.log();
  const watcher = maybeWatchCchiveSync(loadConfig().cchiveSync, projectPath);
  const overflow = await resolveOverflowSettings();
  const args = ["claude", "--dangerously-skip-permissions"];
  if (overflow) {
    args.push("--settings", overflow.settingsPath);
    printInfo(`\u9ED8\u8BA4\u6E20\u9053\u5DF2\u6EE1\uFF0C\u6EA2\u51FA\u5230 ${brand.primary(overflow.provider.name)}`);
  }
  const proc = Bun.spawn(args, {
    cwd: projectPath,
    stdin: "inherit",
    stdout: "inherit",
    stderr: "inherit",
    env: { ...process.env }
  });
  let exitCode;
  try {
    exitCode = await proc.exited;
  } finally {
    watcher?.stop();
  }
  process.exit(exitCode);
});

// src/commands/clone.ts
import { resolve as resolve2 } from "path";
init_esm();
var import_fs_extra7 = __toESM(require_lib(), 1);
var import_picocolors11 = __toESM(require_picocolors(), 1);
function normalizeUrl(input) {
  if (input.startsWith("https://") || input.startsWith("http://") || input.startsWith("git@") || input.startsWith("ssh://")) {
    if (input.startsWith("https://github.com/") && !input.endsWith(".git")) {
      return `${input}.git`;
    }
    return input;
  }
  if (/^[^/\s]+\/[^/\s]+$/.test(input)) {
    return `https://github.com/${input}.git`;
  }
  return input;
}
function extractProjectName(url) {
  let name = url.replace(/\.git$/, "");
  name = name.split("/").pop() || name;
  if (name.includes(":")) {
    name = name.split(":").pop() || name;
    name = name.split("/").pop() || name;
  }
  return name;
}
function extractSlug(url) {
  let match = url.match(/github\.com[:/]([^/]+)\/([^/]+?)(?:\.git)?$/);
  if (match)
    return { owner: match[1] ?? "", repo: match[2] ?? "" };
  match = url.match(/git@[^:]+:([^/]+)\/([^/]+?)(?:\.git)?$/);
  if (match)
    return { owner: match[1] ?? "", repo: match[2] ?? "" };
  return null;
}
async function getGitUsername() {
  const result = await execAndCapture("git config user.name", process.cwd());
  if (result.success && result.output.trim()) {
    return result.output.trim();
  }
  return null;
}
async function degitClone(owner, repo, targetPath, branch) {
  const tmpDir = resolve2(PROJECTS_DIR, `.tmp-degit-${Date.now()}`);
  try {
    await import_fs_extra7.default.ensureDir(tmpDir);
    const urls = [
      `https://api.github.com/repos/${owner}/${repo}/tarball/${branch}`
    ];
    let lastError = "";
    for (const tarballUrl of urls) {
      const proc = Bun.spawn(["curl", "-fsSL", "-o", "archive.tar.gz", tarballUrl], { cwd: tmpDir, stdout: "pipe", stderr: "pipe" });
      const code = await proc.exited;
      if (code === 0) {
        const tarProc = Bun.spawn(["tar", "-xzf", "archive.tar.gz"], {
          cwd: tmpDir,
          stdout: "pipe",
          stderr: "pipe"
        });
        await tarProc.exited;
        const entries = await import_fs_extra7.default.readdir(tmpDir);
        const contentDir = entries.find((e2) => e2 !== "archive.tar.gz");
        if (contentDir) {
          const contentPath = resolve2(tmpDir, contentDir);
          await import_fs_extra7.default.move(contentPath, targetPath);
          return { success: true };
        }
      }
      const err = await new Response(proc.stderr).text();
      lastError = err;
    }
    return { success: false, error: lastError || "\u4E0B\u8F7D\u5931\u8D25" };
  } catch (error) {
    return { success: false, error: error.message };
  } finally {
    await import_fs_extra7.default.remove(tmpDir).catch(() => {});
  }
}
var cloneCommand = new Command("clone").alias("cl").description("\u4ECE\u8FDC\u7A0B\u5730\u5740\u514B\u9686\u9879\u76EE\u5230 p \u7BA1\u7406").argument("<url>", "Git \u4ED3\u5E93\u5730\u5740\uFF08\u652F\u6301 owner/repo \u77ED\u683C\u5F0F\uFF09").argument("[name]", "\u81EA\u5B9A\u4E49\u9879\u76EE\u540D\u79F0\uFF08\u9ED8\u8BA4\u4ECE URL \u63A8\u65AD\uFF09").option("--degit", "\u4E22\u5F03 git \u5386\u53F2\uFF0C\u4EC5\u4E0B\u8F7D\u6587\u4EF6\uFF08\u7C7B\u4F3C degit\uFF09").action(async (url, customName, options) => {
  const config = loadConfig();
  const normalizedUrl = normalizeUrl(url);
  const projectName = customName || extractProjectName(normalizedUrl);
  const nameCheck = validateProjectNameFormat(projectName);
  if (!nameCheck.valid) {
    printError(nameCheck.message || "\u9879\u76EE\u540D\u79F0\u65E0\u6548");
    process.exit(1);
  }
  if (projectExists(projectName)) {
    printError(`\u9879\u76EE\u5DF2\u5B58\u5728: ${projectName}`);
    console.log(import_picocolors11.default.dim("\u4F7F\u7528 ") + brand.primary(`p open ${projectName}`) + import_picocolors11.default.dim(" \u6253\u5F00\u5DF2\u6709\u9879\u76EE"));
    process.exit(1);
  }
  console.log();
  if (options?.degit) {
    console.log(import_picocolors11.default.dim("  degit \u6A21\u5F0F\uFF1A\u4E0D\u5305\u542B .git \u76EE\u5F55\uFF08\u65E0\u5386\u53F2\u63D0\u4EA4\u8BB0\u5F55\uFF09"));
    console.log();
  }
  const projectPath = getProjectPath(projectName);
  const s = Y2();
  s.start(`\u6B63\u5728\u514B\u9686\u9879\u76EE\uFF1A${projectName}...`);
  if (options?.degit) {
    const slug = extractSlug(normalizedUrl);
    if (slug) {
      const result = await degitClone(slug.owner, slug.repo, projectPath, "main");
      if (!result.success) {
        const retry = await degitClone(slug.owner, slug.repo, projectPath, "master");
        if (!retry.success) {
          s.stop("\u514B\u9686\u5931\u8D25");
          console.log();
          printError("\u4E0B\u8F7D\u5931\u8D25\uFF0C\u8BF7\u68C0\u67E5\u4ED3\u5E93\u5730\u5740\u548C\u6743\u9650");
          console.log(import_picocolors11.default.dim("  \u63D0\u793A\uFF1A\u53EF\u53BB\u6389 --degit \u4F7F\u7528\u5B8C\u6574 git clone"));
          process.exit(1);
        }
      }
    } else {
      const result = await execAndCapture(`git clone --depth 1 ${normalizedUrl} ${projectName}`, PROJECTS_DIR);
      if (!result.success) {
        s.stop("\u514B\u9686\u5931\u8D25");
        console.log();
        printError("git clone \u5931\u8D25\uFF0C\u8BF7\u68C0\u67E5\u4ED3\u5E93\u5730\u5740\u548C\u6743\u9650");
        if (result.error)
          console.log(import_picocolors11.default.dim(result.error));
        process.exit(1);
      }
      await import_fs_extra7.default.remove(resolve2(projectPath, ".git")).catch(() => {});
    }
  } else {
    const owner = extractSlug(normalizedUrl)?.owner ?? null;
    const gitUser = await getGitUsername();
    if (owner && gitUser && gitUser.toLowerCase() !== owner.toLowerCase()) {
      console.log(import_picocolors11.default.dim(`  \u26A0 git \u7528\u6237 (${gitUser}) \u4E0E\u4ED3\u5E93 owner (${owner}) \u4E0D\u4E00\u81F4\uFF0C\u540E\u7EED push \u8BF7\u6CE8\u610F\u8FDC\u7A0B\u4ED3\u5E93\u5730\u5740`));
    }
    const result = await execAndCapture(`git clone ${normalizedUrl} ${projectName}`, PROJECTS_DIR);
    if (!result.success) {
      s.stop("\u514B\u9686\u5931\u8D25");
      console.log();
      printError("git clone \u5931\u8D25\uFF0C\u8BF7\u68C0\u67E5\u4ED3\u5E93\u5730\u5740\u548C\u6743\u9650");
      if (result.error)
        console.log(import_picocolors11.default.dim(result.error));
      process.exit(1);
    }
  }
  s.stop(`${brand.success("\u2713")} \u514B\u9686\u5B8C\u6210`);
  saveProjectMeta(projectName, { template: "clone" });
  if (isTUICommand(config.ide)) {
    Se(brand.success("\u2728 \u9879\u76EE\u514B\u9686\u6210\u529F\uFF01"));
    try {
      await openWithIDE(config.ide, projectPath);
    } catch (error) {
      printError(error.message);
      console.log(import_picocolors11.default.dim("  \u9879\u76EE\u8DEF\u5F84: ") + import_picocolors11.default.underline(projectPath));
    }
    return;
  }
  const ideSpinner = Y2();
  ideSpinner.start(`\u6B63\u5728\u7528 ${config.ide} \u6253\u5F00 ${projectName}...`);
  try {
    await openWithIDE(config.ide, projectPath);
    ideSpinner.stop(`${brand.success("\u2713")} \u5DF2\u6253\u5F00: ${brand.primary(projectName)}`);
  } catch (error) {
    ideSpinner.stop(`\u6253\u5F00 ${config.ide} \u5931\u8D25`);
    console.log();
    printError(error.message);
    console.log();
    console.log(import_picocolors11.default.dim("  \u9879\u76EE\u8DEF\u5F84: ") + import_picocolors11.default.underline(projectPath));
    console.log();
  }
  Se(brand.success("\u2728 \u9879\u76EE\u514B\u9686\u6210\u529F\uFF01"));
});

// src/commands/config.ts
init_esm();
var configCommand = new Command("config").description("\u7F16\u8F91\u914D\u7F6E\u6587\u4EF6").action(async () => {
  const config = loadConfig();
  console.log();
  console.log(brand.primary("  \u2699\uFE0F  \u914D\u7F6E\u6587\u4EF6"));
  printPath("  \u8DEF\u5F84", CONFIG_PATH);
  console.log();
  if (isTUICommand(config.ide)) {
    try {
      await openWithIDE(config.ide, CONFIG_PATH);
    } catch (error) {
      printError(error.message);
      printPath("  \u914D\u7F6E\u6587\u4EF6\u4F4D\u7F6E", CONFIG_PATH);
      process.exit(1);
    }
    return;
  }
  const s = Y2();
  s.start(`\u6B63\u5728\u7528 ${config.ide} \u6253\u5F00\u914D\u7F6E\u6587\u4EF6...`);
  try {
    await openWithIDE(config.ide, CONFIG_PATH);
    s.stop(`${brand.success("\u2713")} \u914D\u7F6E\u6587\u4EF6\u5DF2\u6253\u5F00`);
    console.log();
  } catch (error) {
    s.stop("\u6253\u5F00\u5931\u8D25");
    console.log();
    printError(error.message);
    console.log();
    printPath("  \u914D\u7F6E\u6587\u4EF6\u4F4D\u7F6E", CONFIG_PATH);
    console.log();
    process.exit(1);
  }
});

// src/commands/copy.ts
import { basename as basename2, resolve as resolve3 } from "path";
init_esm();
var import_fs_extra8 = __toESM(require_lib(), 1);
var import_picocolors12 = __toESM(require_picocolors(), 1);
var copyCommand = new Command("copy").alias("cp").description("\u5168\u91CF\u590D\u5236\u76EE\u5F55\u4F5C\u4E3A\u65B0\u9879\u76EE\u5230 p \u7BA1\u7406\uFF08\u652F\u6301\u9017\u53F7\u5206\u9694\u591A\u8DEF\u5F84\uFF09").argument("<paths>", "\u8981\u590D\u5236\u7684\u76EE\u5F55\u8DEF\u5F84\uFF08\u591A\u4E2A\u7528\u9017\u53F7\u5206\u9694\uFF09").argument("[names]", "\u81EA\u5B9A\u4E49\u9879\u76EE\u540D\uFF08\u591A\u4E2A\u7528\u9017\u53F7\u5206\u9694\uFF0C\u6570\u91CF\u9700\u4E0E\u8DEF\u5F84\u5BF9\u5E94\uFF09").option("-o, --open", "\u590D\u5236\u5B8C\u6210\u540E\u7528 IDE \u6253\u5F00\u9879\u76EE").option("--no-trash", "\u4E0D\u79FB\u5165\u539F\u59CB\u76EE\u5F55\u5230\u56DE\u6536\u7AD9\uFF08\u9ED8\u8BA4\u4F1A\u79FB\u5165\uFF09").action(async (inputPaths, inputNames, options) => {
  const config = loadConfig();
  const paths = inputPaths.split(",").map((s) => s.trim()).filter(Boolean);
  const names = inputNames ? inputNames.split(",").map((s) => s.trim()).filter(Boolean) : [];
  if (names.length > 0 && names.length !== paths.length) {
    printError(`\u9879\u76EE\u540D\u6570\u91CF (${names.length}) \u4E0E\u8DEF\u5F84\u6570\u91CF (${paths.length}) \u4E0D\u5339\u914D`);
    process.exit(1);
  }
  const isMultiple = paths.length > 1;
  const targets = [];
  for (let i = 0;i < paths.length; i++) {
    const sourcePath = resolve3(paths[i] ?? "");
    if (!import_fs_extra8.default.existsSync(sourcePath)) {
      printError(`\u8DEF\u5F84\u4E0D\u5B58\u5728: ${sourcePath}`);
      process.exit(1);
    }
    const stat = await import_fs_extra8.default.stat(sourcePath);
    if (!stat.isDirectory()) {
      printError(`\u4E0D\u662F\u76EE\u5F55: ${sourcePath}`);
      process.exit(1);
    }
    let projectName = names[i] || basename2(sourcePath);
    const nameCheck = validateProjectNameFormat(projectName);
    if (!nameCheck.valid) {
      printError(nameCheck.message || `\u9879\u76EE\u540D\u79F0\u65E0\u6548: ${projectName}`);
      process.exit(1);
    }
    if (projectExists(projectName)) {
      if (isMultiple) {
        printError(`\u9879\u76EE\u540D "${projectName}" \u5DF2\u5B58\u5728`);
        process.exit(1);
      }
      Ie(bgOrange(" \u590D\u5236\u76EE\u5F55 "));
      const result = await he({
        message: `\u9879\u76EE\u540D "${projectName}" \u5DF2\u5B58\u5728\uFF0C\u8BF7\u8F93\u5165\u65B0\u540D\u79F0:`,
        placeholder: `${projectName}-2`,
        validate: (value) => {
          const v2 = validateProjectNameFormat(value);
          if (!v2.valid)
            return v2.message;
          if (projectExists(value))
            return "\u9879\u76EE\u5DF2\u5B58\u5728";
          return;
        }
      });
      if (pD(result)) {
        Se(import_picocolors12.default.dim("\u5DF2\u53D6\u6D88"));
        process.exit(0);
      }
      projectName = result.trim();
    }
    targets.push({
      sourcePath,
      projectName,
      targetPath: getProjectPath(projectName)
    });
  }
  Ie(isMultiple ? bgOrange(` \u590D\u5236 ${targets.length} \u4E2A\u9879\u76EE `) : bgOrange(" \u590D\u5236\u76EE\u5F55 "));
  for (const t of targets) {
    console.log(import_picocolors12.default.dim("  \u6E90\u8DEF\u5F84:   ") + import_picocolors12.default.underline(t.sourcePath));
    console.log(import_picocolors12.default.dim("  \u9879\u76EE\u540D:   ") + brand.primary(t.projectName));
  }
  console.log();
  for (const t of targets) {
    const s = Y2();
    s.start(`\u6B63\u5728\u590D\u5236 ${t.projectName}...`);
    try {
      await import_fs_extra8.default.copy(t.sourcePath, t.targetPath, { overwrite: true });
      s.stop(`${brand.success("\u2713")} ${t.projectName} \u5DF2\u590D\u5236`);
    } catch (error) {
      s.stop(`${t.projectName} \u590D\u5236\u5931\u8D25`);
      printError(error.message);
      process.exit(1);
    }
    const gitResult = await execAndCapture("git init", t.targetPath);
    if (!gitResult.success) {
      console.log(import_picocolors12.default.dim(`  ${t.projectName} git init \u5931\u8D25: ${gitResult.error}`));
    }
    saveProjectMeta(t.projectName, { template: "copy" });
  }
  if (options.open) {
    for (const t of targets) {
      if (isTUICommand(config.ide)) {
        console.log(import_picocolors12.default.dim(`  \u6B63\u5728\u542F\u52A8 ${config.ide}: `) + brand.primary(t.projectName));
        try {
          await openWithIDE(config.ide, t.targetPath);
        } catch (error) {
          printError(error.message);
          console.log(import_picocolors12.default.dim("  \u9879\u76EE\u8DEF\u5F84: ") + import_picocolors12.default.underline(t.targetPath));
        }
        continue;
      }
      const ideSpinner = Y2();
      ideSpinner.start(`\u6B63\u5728\u7528 ${config.ide} \u6253\u5F00 ${t.projectName}...`);
      try {
        await openWithIDE(config.ide, t.targetPath);
        ideSpinner.stop(`${brand.success("\u2713")} \u5DF2\u6253\u5F00: ${brand.primary(t.projectName)}`);
      } catch (error) {
        ideSpinner.stop(`\u6253\u5F00 ${config.ide} \u5931\u8D25`);
        console.log();
        printError(error.message);
        console.log();
        console.log(import_picocolors12.default.dim("  \u9879\u76EE\u8DEF\u5F84: ") + import_picocolors12.default.underline(t.targetPath));
        console.log();
      }
    }
  }
  const doTrash = options.trash !== false;
  if (doTrash) {
    for (const t of targets) {
      const trashSpinner = Y2();
      trashSpinner.start(`\u6B63\u5728\u79FB\u5165\u56DE\u6536\u7AD9 ${t.projectName}...`);
      const success = await moveToTrash(t.sourcePath);
      if (success) {
        trashSpinner.stop(`${brand.success("\u2713")} ${t.projectName} \u539F\u59CB\u76EE\u5F55\u5DF2\u79FB\u5165\u56DE\u6536\u7AD9`);
      } else {
        trashSpinner.stop(`${t.projectName} \u79FB\u5165\u56DE\u6536\u7AD9\u5931\u8D25`);
        console.log(import_picocolors12.default.dim("  \u8BF7\u624B\u52A8\u5220\u9664: ") + import_picocolors12.default.underline(t.sourcePath));
      }
    }
  }
  Se(brand.success("\u2728 \u9879\u76EE\u590D\u5236\u6210\u529F\uFF01"));
});

// src/commands/delete.ts
init_esm();
var import_fs_extra9 = __toESM(require_lib(), 1);
var import_picocolors13 = __toESM(require_picocolors(), 1);
async function searchAndSelectDelete(projects, initialQuery) {
  const options = projects.map((p2) => ({
    value: p2.name,
    label: p2.name,
    hint: projectHint(p2)
  }));
  const result = await liveSearch({
    message: "\u641C\u7D22\u8981\u5220\u9664\u7684\u9879\u76EE:",
    placeholder: "\u8F93\u5165\u540D\u79F0\u3001\u6A21\u677F\u6216\u6807\u7B7E\u7B5B\u9009",
    options,
    filterFn: (query) => {
      if (!query)
        return options;
      const filtered = filterProjects(projects, query);
      return filtered.map((p2) => ({
        value: p2.name,
        label: p2.name,
        hint: projectHint(p2)
      }));
    },
    initialQuery,
    multiSelect: true
  });
  if (result === CANCEL) {
    Se(import_picocolors13.default.dim("\u5DF2\u53D6\u6D88"));
    process.exit(0);
  }
  return result;
}
function wildcardMatch(projects, pattern) {
  const regexStr = `^${pattern.replace(/[.+^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*")}$`;
  const regex = new RegExp(regexStr, "i");
  return projects.filter((p2) => regex.test(p2.name)).map((p2) => p2.name);
}
async function batchDelete(projectNames) {
  if (projectNames.length === 0) {
    printInfo("\u6CA1\u6709\u5339\u914D\u7684\u9879\u76EE");
    return;
  }
  console.log();
  console.log(import_picocolors13.default.dim("  \u5C06\u8981\u5220\u9664\u7684\u9879\u76EE:"));
  for (const name of projectNames) {
    console.log(`  ${brand.secondary("\u2022")} ${name}`);
  }
  console.log();
  const shouldDelete = await ye({
    message: `\u786E\u5B9A\u8981\u5220\u9664 ${brand.primary(String(projectNames.length))} \u4E2A\u9879\u76EE\u5417\uFF1F\u6B64\u64CD\u4F5C\u4E0D\u53EF\u6062\u590D\uFF01`,
    initialValue: true
  });
  if (pD(shouldDelete) || !shouldDelete) {
    Se(import_picocolors13.default.dim("\u5DF2\u53D6\u6D88"));
    process.exit(0);
  }
  console.log();
  const s = Y2();
  s.start("\u6B63\u5728\u5220\u9664\u9879\u76EE...");
  const results = await Promise.allSettled(projectNames.map(async (name, index) => {
    try {
      const path = getProjectPath(name);
      const realPath = toRealPath(path);
      await import_fs_extra9.default.remove(path);
      return { success: true, name, realPath, index };
    } catch (error) {
      const err = error;
      return { success: false, name, error: err.message, index };
    }
  }));
  s.stop();
  console.log();
  let deletedCount = 0;
  const errors2 = [];
  const removedCwds = [];
  for (const result of results) {
    if (result.status === "fulfilled") {
      const r2 = result.value;
      if (r2.success) {
        deletedCount++;
        deleteProjectMeta(r2.name);
        removedCwds.push(r2.realPath);
        console.log(`  ${brand.success("\u2713")} [${r2.index + 1}/${projectNames.length}] ${r2.name}`);
      } else {
        errors2.push(`${r2.name}: ${r2.error}`);
        console.log(`  ${brand.error("\u2717")} [${r2.index + 1}/${projectNames.length}] ${r2.name} - ${r2.error}`);
      }
    }
  }
  await maybeRemoveCchiveDirs(loadConfig().cchiveSync, removedCwds);
  console.log();
  if (errors2.length > 0) {
    Se(`${brand.success("\u2713")} \u5DF2\u5220\u9664 ${deletedCount} \u4E2A\u9879\u76EE\uFF0C${errors2.length} \u4E2A\u5931\u8D25`);
  } else {
    Se(`${brand.success("\u2713")} \u5DF2\u6210\u529F\u5220\u9664 ${deletedCount} \u4E2A\u9879\u76EE`);
  }
}
var deleteCommand = new Command("delete").alias("d").alias("rm").description("\u5220\u9664\u9879\u76EE").argument("[names...]", "\u9879\u76EE\u540D\u79F0\u3001\u901A\u914D\u7B26\u6A21\u5F0F\uFF0C\u6216 'all'\uFF08\u652F\u6301\u591A\u4E2A\uFF09").action(async (names) => {
  const args = names ?? [];
  const projects = listProjects();
  if (projects.length === 0) {
    console.log();
    printInfo("\u6682\u65E0\u9879\u76EE");
    console.log();
    return;
  }
  if (args.length === 1 && args[0] === "all") {
    Ie(bgOrange(" \u5220\u9664\u6240\u6709\u9879\u76EE "));
    console.log();
    console.log(import_picocolors13.default.dim("  \u5C06\u8981\u5220\u9664\u7684\u9879\u76EE:"));
    for (const project of projects) {
      const templateInfo = project?.template ? import_picocolors13.default.cyan(` (${project.template})`) : "";
      console.log(`  ${brand.secondary("\u2022")} ${project.name}${templateInfo}`);
    }
    console.log();
    const shouldDelete2 = await ye({
      message: `\u786E\u5B9A\u8981\u5220\u9664 ${brand.primary(String(projects.length))} \u4E2A\u9879\u76EE\u5417\uFF1F\u6B64\u64CD\u4F5C\u4E0D\u53EF\u6062\u590D\uFF01`,
      initialValue: true
    });
    if (pD(shouldDelete2) || !shouldDelete2) {
      Se(import_picocolors13.default.dim("\u5DF2\u53D6\u6D88"));
      process.exit(0);
    }
    console.log();
    const s2 = Y2();
    s2.start("\u6B63\u5728\u5220\u9664\u9879\u76EE...");
    const results = await Promise.allSettled(projects.map(async (project, index) => {
      try {
        const realPath = toRealPath(project.path);
        await import_fs_extra9.default.remove(project.path);
        return { success: true, project, realPath, index };
      } catch (error) {
        const err = error;
        return {
          success: false,
          project,
          error: err.message,
          index
        };
      }
    }));
    s2.stop();
    console.log();
    let deletedCount = 0;
    const errors2 = [];
    const removedCwds = [];
    const sortedResults = results.map((result, idx) => ({ result, originalIndex: idx })).sort((a, b3) => {
      const aIndex = a.result.status === "fulfilled" ? a.result.value.index : a.originalIndex;
      const bIndex = b3.result.status === "fulfilled" ? b3.result.value.index : b3.originalIndex;
      return aIndex - bIndex;
    });
    for (const { result } of sortedResults) {
      if (result.status === "fulfilled") {
        if (result.value.success) {
          deletedCount++;
          removedCwds.push(result.value.realPath);
          console.log(`  ${brand.success("\u2713")} [${result.value.index + 1}/${projects.length}] ${result.value.project.name}`);
        } else {
          errors2.push(`${result.value.project.name}: ${result.value.error}`);
          console.log(`  ${brand.error("\u2717")} [${result.value.index + 1}/${projects.length}] ${result.value.project.name} - ${result.value.error}`);
        }
      } else {
        errors2.push(`\u5220\u9664\u5931\u8D25: ${result.reason}`);
      }
    }
    clearAllProjectMeta();
    await maybeRemoveCchiveDirs(loadConfig().cchiveSync, removedCwds);
    console.log();
    if (errors2.length > 0) {
      Se(`${brand.success("\u2713")} \u5DF2\u5220\u9664 ${deletedCount} \u4E2A\u9879\u76EE\uFF0C${errors2.length} \u4E2A\u5931\u8D25`);
    } else {
      Se(`${brand.success("\u2713")} \u5DF2\u6210\u529F\u5220\u9664\u6240\u6709 ${deletedCount} \u4E2A\u9879\u76EE`);
    }
    return;
  }
  if (args.length === 1 && args[0]?.includes("*")) {
    const name2 = args[0] ?? "";
    let matched = wildcardMatch(projects, name2);
    if (matched.length === 0) {
      const keyword = name2.replace(/\*/g, "");
      const similar = keyword ? filterProjects(projects, keyword).map((p2) => p2.name) : [];
      if (similar.length === 0) {
        printError(`\u6CA1\u6709\u5339\u914D '${name2}' \u7684\u9879\u76EE`);
        process.exit(1);
      }
      printError(`\u6CA1\u6709\u5339\u914D '${name2}' \u7684\u9879\u76EE`);
      console.log();
      console.log(import_picocolors13.default.dim("  \u662F\u5426\u5220\u9664\u4EE5\u4E0B\u9879\u76EE\uFF1F"));
      for (const n of similar) {
        console.log(`    ${brand.secondary("\u2022")} ${n}`);
      }
      console.log();
      const shouldDelete2 = await ye({
        message: `\u5220\u9664\u8FD9 ${brand.primary(String(similar.length))} \u4E2A\u9879\u76EE\uFF1F`,
        initialValue: true
      });
      if (pD(shouldDelete2) || !shouldDelete2) {
        Se(import_picocolors13.default.dim("\u5DF2\u53D6\u6D88"));
        process.exit(0);
      }
      matched = similar;
    }
    Ie(bgOrange(" \u6279\u91CF\u5220\u9664 "));
    await batchDelete(matched);
    return;
  }
  if (args.length === 0) {
    Ie(bgOrange(" \u6279\u91CF\u5220\u9664 "));
    const result = await fe({
      message: "\u9009\u62E9\u8981\u5220\u9664\u7684\u9879\u76EE\uFF08\u7A7A\u683C\u9009\u62E9\uFF09:",
      options: projects.map((p2) => ({
        value: p2.name,
        label: p2.name,
        hint: projectHint(p2)
      }))
    });
    if (pD(result)) {
      Se(import_picocolors13.default.dim("\u5DF2\u53D6\u6D88"));
      process.exit(0);
    }
    const selected = result;
    await batchDelete(selected);
    return;
  }
  if (args.length > 1) {
    Ie(bgOrange(" \u6279\u91CF\u5220\u9664 "));
    const matched = [];
    const notFound = [];
    const seen = new Set;
    for (const arg of args) {
      let current = [];
      if (arg.includes("*")) {
        current = wildcardMatch(projects, arg);
      } else if (projectExists(arg)) {
        current = [arg];
      } else {
        const filtered = filterProjects(projects, arg);
        current = filtered.map((p2) => p2.name);
      }
      if (current.length === 0) {
        notFound.push(arg);
        continue;
      }
      for (const n of current) {
        if (!seen.has(n)) {
          seen.add(n);
          matched.push(n);
        }
      }
    }
    if (notFound.length > 0) {
      for (const n of notFound) {
        console.log(`  ${brand.error("\u2717")} ${n} - \u9879\u76EE\u4E0D\u5B58\u5728`);
      }
      console.log();
    }
    if (matched.length === 0) {
      printError("\u6CA1\u6709\u5339\u914D\u7684\u9879\u76EE");
      process.exit(1);
    }
    await batchDelete(matched);
    return;
  }
  const name = args[0] ?? "";
  let projectNames;
  if (projectExists(name)) {
    projectNames = [name];
  } else {
    const filtered = filterProjects(projects, name);
    if (filtered.length === 0) {
      printError(`\u9879\u76EE\u4E0D\u5B58\u5728: ${name}`);
      console.log(import_picocolors13.default.dim("\u4F7F\u7528 ") + brand.primary("p ls") + import_picocolors13.default.dim(" \u67E5\u770B\u6240\u6709\u9879\u76EE"));
      process.exit(1);
    }
    if (filtered.length === 1) {
      const matchedName = filtered[0]?.name ?? name;
      projectNames = [matchedName];
      console.log(import_picocolors13.default.dim("  \u5339\u914D\u5230: ") + brand.primary(matchedName));
    } else {
      console.log(import_picocolors13.default.dim(`  \u5339\u914D\u5230 ${filtered.length} \u4E2A\u9879\u76EE`));
      projectNames = await searchAndSelectDelete(projects, name);
    }
  }
  if (projectNames.length > 1) {
    Ie(bgOrange(" \u6279\u91CF\u5220\u9664 "));
    await batchDelete(projectNames);
    return;
  }
  const projectName = projectNames[0] ?? name;
  const projectPath = getProjectPath(projectName);
  const shouldDelete = await ye({
    message: `\u786E\u5B9A\u8981\u5220\u9664\u9879\u76EE ${brand.primary(projectName)} \u5417\uFF1F\u6B64\u64CD\u4F5C\u4E0D\u53EF\u6062\u590D\uFF01`,
    initialValue: true
  });
  if (pD(shouldDelete) || !shouldDelete) {
    Se(import_picocolors13.default.dim("\u5DF2\u53D6\u6D88"));
    process.exit(0);
  }
  const s = Y2();
  s.start(`\u6B63\u5728\u5220\u9664 ${projectName}...`);
  try {
    const realPath = toRealPath(projectPath);
    await import_fs_extra9.default.remove(projectPath);
    deleteProjectMeta(projectName);
    await maybeRemoveCchiveDirs(loadConfig().cchiveSync, [realPath]);
    s.stop(`${brand.success("\u2713")} \u5DF2\u5220\u9664: ${brand.primary(projectName)}`);
  } catch (error) {
    s.stop("\u5220\u9664\u5931\u8D25");
    const err = error;
    printError(err.message);
    process.exit(1);
  }
});

// src/commands/first-prompt.ts
init_esm();
var import_picocolors14 = __toESM(require_picocolors(), 1);
function resolveProjectName(name) {
  if (name === ".") {
    const currentDir = process.cwd();
    const projects2 = listProjects();
    const current = projects2.find((p2) => p2.path === currentDir);
    return current?.name || null;
  }
  if (projectExists(name))
    return name;
  const projects = listProjects();
  const filtered = filterProjects(projects, name);
  if (filtered.length === 1)
    return filtered[0]?.name ?? name;
  if (filtered.length > 1) {
    printError(`\u5339\u914D\u5230\u591A\u4E2A\u9879\u76EE: ${filtered.map((p2) => p2.name).join(", ")}`);
    return null;
  }
  printError(`\u9879\u76EE\u4E0D\u5B58\u5728: ${name}`);
  return null;
}
async function setFirstPrompt(projectName, promptText) {
  let prompt = promptText;
  if (!prompt && prompt !== "") {
    const meta = getProjectMeta(projectName);
    const existing = meta?.firstPrompt || "";
    const result = await he({
      message: `\u8F93\u5165 first prompt (${brand.primary(projectName)}):`,
      placeholder: "\u521B\u5EFA\u9879\u76EE\u65F6\u7684\u521D\u59CB\u9700\u6C42...",
      initialValue: existing
    });
    if (pD(result)) {
      Se(import_picocolors14.default.dim("\u5DF2\u53D6\u6D88"));
      process.exit(0);
    }
    prompt = result.trim();
  }
  if (!prompt) {
    saveProjectMeta(projectName, { firstPrompt: undefined });
    printSuccess(`\u5DF2\u6E05\u9664 ${brand.primary(projectName)} \u7684 first prompt`);
  } else {
    saveProjectMeta(projectName, { firstPrompt: prompt });
    printSuccess(`\u5DF2\u4E3A ${brand.primary(projectName)} \u8BBE\u7F6E first prompt: ${import_picocolors14.default.dim(prompt)}`);
  }
}
async function clearFirstPrompt(projectName) {
  saveProjectMeta(projectName, { firstPrompt: undefined });
  printSuccess(`\u5DF2\u6E05\u9664 ${brand.primary(projectName)} \u7684 first prompt`);
}
async function showFirstPrompt(projectName) {
  const meta = getProjectMeta(projectName);
  const prompt = meta?.firstPrompt;
  if (!prompt) {
    printInfo(`${brand.primary(projectName)} \u6CA1\u6709 first prompt`);
    return;
  }
  console.log();
  console.log(brand.primary(`  ${projectName}`) + import_picocolors14.default.dim(": ") + import_picocolors14.default.dim(prompt));
  console.log();
}
var firstPromptCommand = new Command("first-prompt").alias("fp").alias("note").alias("notes").description("\u7BA1\u7406\u9879\u76EE first prompt\uFF08\u521B\u5EFA\u65F6\u7684\u521D\u59CB\u9700\u6C42\uFF09").argument("[project]", "\u9879\u76EE\u540D\u79F0\u6216 . \u8868\u793A\u5F53\u524D\u76EE\u5F55").argument("[text]", "\u65B0\u7684 first prompt \u5185\u5BB9").option("-c, --clear", "\u6E05\u9664 first prompt").action(async (project, promptText, options) => {
  if (!project) {
    const currentDir = process.cwd();
    const projects = listProjects();
    const current = projects.find((p2) => p2.path === currentDir);
    if (!current) {
      printError("\u5F53\u524D\u76EE\u5F55\u4E0D\u662F p \u7BA1\u7406\u7684\u9879\u76EE");
      process.exit(1);
    }
    await showFirstPrompt(current.name);
    return;
  }
  const projectName = resolveProjectName(project);
  if (!projectName)
    process.exit(1);
  if (options?.clear) {
    await clearFirstPrompt(projectName);
    return;
  }
  await setFirstPrompt(projectName, promptText);
});

// src/commands/hook.ts
init_esm();
var import_fs_extra10 = __toESM(require_lib(), 1);
var import_picocolors15 = __toESM(require_picocolors(), 1);
var EXAMPLE_HOOK = `// \u81EA\u5B9A\u4E49 Hook \u811A\u672C\u793A\u4F8B
// \u53C2\u6570\u8BF4\u660E:
//   process.argv[2] - \u9879\u76EE\u8DEF\u5F84
//   process.argv[3] - \u9879\u76EE\u540D\u79F0
//   process.argv[4] - \u6A21\u677F\u540D\u79F0

const projectPath = process.argv[2];
const projectName = process.argv[3];
const templateName = process.argv[4];

console.log('\u6267\u884C\u81EA\u5B9A\u4E49 Hook: ' + projectName);
console.log('\u9879\u76EE\u8DEF\u5F84: ' + projectPath);
console.log('\u4F7F\u7528\u6A21\u677F: ' + templateName);

// \u5728\u8FD9\u91CC\u7F16\u5199\u4F60\u7684\u81EA\u5B9A\u4E49\u903B\u8F91...
// \u4F8B\u5982: \u521B\u5EFA\u989D\u5916\u7684\u6587\u4EF6\u3001\u4FEE\u6539\u914D\u7F6E\u7B49
`;
var hookCommand = new Command("hook").alias("hooks").description("\u7BA1\u7406\u81EA\u5B9A\u4E49 Hooks").action(async () => {
  const config = loadConfig();
  console.log();
  console.log(brand.primary("  \uD83D\uDCDD \u81EA\u5B9A\u4E49 Hooks"));
  console.log();
  if (!import_fs_extra10.default.existsSync(HOOKS_DIR)) {
    const examplePath = `${HOOKS_DIR}/example.js`;
    import_fs_extra10.default.writeFileSync(examplePath, EXAMPLE_HOOK, "utf-8");
    printInfo("\u5DF2\u521B\u5EFA\u793A\u4F8B Hook \u811A\u672C: example.js");
    console.log();
  }
  if (isTUICommand(config.ide)) {
    try {
      await openWithIDE(config.ide, HOOKS_DIR);
    } catch (error) {
      printError(error.message);
      console.log(import_picocolors15.default.dim("  Hooks \u76EE\u5F55: ") + import_picocolors15.default.underline(HOOKS_DIR));
      process.exit(1);
    }
    return;
  }
  const s = Y2();
  s.start(`\u6B63\u5728\u7528 ${config.ide} \u6253\u5F00 Hooks \u76EE\u5F55...`);
  try {
    await openWithIDE(config.ide, HOOKS_DIR);
    s.stop(`${brand.success("\u2713")} Hooks \u76EE\u5F55\u5DF2\u6253\u5F00`);
    console.log();
  } catch (error) {
    s.stop("\u6253\u5F00\u5931\u8D25");
    console.log();
    printError(error.message);
    console.log();
    console.log(import_picocolors15.default.dim("  Hooks \u76EE\u5F55: ") + import_picocolors15.default.underline(HOOKS_DIR));
    console.log();
    process.exit(1);
  }
  console.log(import_picocolors15.default.dim("  \u63D0\u793A: \u521B\u5EFA .js \u811A\u672C\u6587\u4EF6\uFF0C\u7136\u540E\u5728 config.yaml \u4E2D\u914D\u7F6E"));
  console.log();
});

// src/commands/import.ts
import { basename as basename3, resolve as resolve4 } from "path";
init_esm();
var import_fs_extra12 = __toESM(require_lib(), 1);
var import_picocolors16 = __toESM(require_picocolors(), 1);

// src/utils/files.ts
var import_fs_extra11 = __toESM(require_lib(), 1);
import { join as join9 } from "path";
var DEFAULT_IGNORES = [
  ".git",
  "node_modules",
  "dist",
  "build",
  ".next",
  ".nuxt",
  ".output",
  "coverage",
  ".vscode",
  ".idea",
  "*.log",
  ".DS_Store",
  "Thumbs.db",
  "package-lock.json",
  "pnpm-lock.yaml",
  "yarn.lock",
  "bun.lock",
  "bun.lockb"
];
async function isGitRepo(projectPath) {
  return await import_fs_extra11.default.pathExists(join9(projectPath, ".git"));
}
async function hasValidGitignore(projectPath) {
  const gitignorePath = join9(projectPath, ".gitignore");
  if (!await import_fs_extra11.default.pathExists(gitignorePath)) {
    return false;
  }
  const content = await import_fs_extra11.default.readFile(gitignorePath, "utf-8");
  return content.trim().length > 0;
}
async function collectProjectFiles(projectPath) {
  const isGit = await isGitRepo(projectPath);
  const hasGitignore = await hasValidGitignore(projectPath);
  if (isGit) {
    const result = await execAndCapture("git ls-files --cached --modified --others --exclude-standard", projectPath);
    if (result.success) {
      const files2 = result.output.split(`
`).map((f) => f.trim()).filter((f) => f.length > 0);
      return { success: true, files: files2 };
    }
    return {
      success: false,
      files: [],
      message: "\u65E0\u6CD5\u83B7\u53D6 git \u6587\u4EF6\u5217\u8868"
    };
  }
  if (hasGitignore) {
    const initResult = await execAndCapture("git init", projectPath);
    if (!initResult.success) {
      return {
        success: false,
        files: [],
        message: "Git \u521D\u59CB\u5316\u5931\u8D25"
      };
    }
    const lsResult = await execAndCapture("git ls-files --cached --modified --others --exclude-standard", projectPath);
    await import_fs_extra11.default.remove(join9(projectPath, ".git"));
    if (lsResult.success) {
      const files2 = lsResult.output.split(`
`).map((f) => f.trim()).filter((f) => f.length > 0);
      return { success: true, files: files2 };
    }
    return {
      success: false,
      files: [],
      message: "\u65E0\u6CD5\u83B7\u53D6\u6587\u4EF6\u5217\u8868"
    };
  }
  const files = [];
  async function walk(dir, relativePath = "") {
    const entries = await import_fs_extra11.default.readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const entryPath = join9(dir, entry.name);
      const relPath = relativePath ? `${relativePath}/${entry.name}` : entry.name;
      const shouldIgnore = DEFAULT_IGNORES.some((pattern) => {
        if (pattern.includes("*")) {
          const regex = new RegExp(`^${pattern.replace(/\*/g, ".*").replace(/\./g, "\\.")}$`);
          return regex.test(entry.name);
        }
        return entry.name === pattern || relPath.includes(`/${pattern}/`);
      });
      if (shouldIgnore) {
        continue;
      }
      if (entry.isDirectory()) {
        await walk(entryPath, relPath);
      } else {
        files.push(relPath);
      }
    }
  }
  await walk(projectPath);
  return { success: true, files };
}
async function copyFiles(sourcePath, targetPath, files) {
  await import_fs_extra11.default.ensureDir(targetPath);
  for (const file of files) {
    const src = join9(sourcePath, file);
    const dest = join9(targetPath, file);
    if (!await import_fs_extra11.default.pathExists(src))
      continue;
    await import_fs_extra11.default.ensureDir(join9(dest, ".."));
    await import_fs_extra11.default.copy(src, dest);
  }
}

// src/commands/import.ts
var importCommand = new Command("import").alias("i").description("\u5BFC\u5165\u5916\u90E8\u9879\u76EE\u5230 p \u7BA1\u7406").argument("[path]", "\u8981\u5BFC\u5165\u7684\u9879\u76EE\u8DEF\u5F84\uFF08. \u8868\u793A\u5F53\u524D\u76EE\u5F55\uFF0C\u7701\u7565\u5219\u4EA4\u4E92\u9009\u62E9\uFF09").action(async (inputPath) => {
  let sourcePath;
  if (inputPath === ".") {
    sourcePath = process.cwd();
  } else if (!inputPath) {
    const result = await he({
      message: "\u8F93\u5165\u8981\u5BFC\u5165\u7684\u9879\u76EE\u8DEF\u5F84:",
      placeholder: "/path/to/project",
      validate: (value) => {
        if (!value.trim())
          return "\u8DEF\u5F84\u4E0D\u80FD\u4E3A\u7A7A";
      }
    });
    if (pD(result)) {
      Se(import_picocolors16.default.dim("\u5DF2\u53D6\u6D88"));
      process.exit(0);
    }
    sourcePath = resolve4(result.trim());
  } else {
    sourcePath = resolve4(inputPath);
  }
  if (!import_fs_extra12.default.existsSync(sourcePath)) {
    printError(`\u8DEF\u5F84\u4E0D\u5B58\u5728: ${sourcePath}`);
    process.exit(1);
  }
  const stat = await import_fs_extra12.default.stat(sourcePath);
  if (!stat.isDirectory()) {
    printError(`\u4E0D\u662F\u76EE\u5F55: ${sourcePath}`);
    process.exit(1);
  }
  if (sourcePath.startsWith(resolve4(PROJECTS_DIR))) {
    printError("\u8BE5\u9879\u76EE\u5DF2\u5728 p \u7BA1\u7406\u4E0B\uFF0C\u65E0\u9700\u5BFC\u5165");
    process.exit(1);
  }
  let projectName = basename3(sourcePath);
  if (projectExists(projectName)) {
    Ie(bgOrange(" \u5BFC\u5165\u9879\u76EE "));
    const result = await he({
      message: `\u9879\u76EE\u540D "${projectName}" \u5DF2\u5B58\u5728\uFF0C\u8BF7\u8F93\u5165\u65B0\u540D\u79F0:`,
      placeholder: `${projectName}-2`,
      validate: (value) => {
        const v2 = validateProjectNameFormat(value);
        if (!v2.valid)
          return v2.message;
      }
    });
    if (pD(result)) {
      Se(import_picocolors16.default.dim("\u5DF2\u53D6\u6D88"));
      process.exit(0);
    }
    projectName = result.trim();
  }
  const nameCheck = validateProjectNameFormat(projectName);
  if (!nameCheck.valid) {
    printError(nameCheck.message || "\u9879\u76EE\u540D\u79F0\u65E0\u6548");
    process.exit(1);
  }
  Ie(bgOrange(" \u5BFC\u5165\u9879\u76EE "));
  const s = Y2();
  s.start("\u6B63\u5728\u5206\u6790\u6587\u4EF6...");
  const { success, files, message } = await collectProjectFiles(sourcePath);
  if (!success) {
    s.stop("\u5206\u6790\u5931\u8D25");
    printError(message || "\u65E0\u6CD5\u83B7\u53D6\u6587\u4EF6\u5217\u8868");
    process.exit(1);
  }
  if (files.length === 0) {
    s.stop("\u6CA1\u6709\u6587\u4EF6");
    printError("\u672A\u627E\u5230\u53EF\u5BFC\u5165\u7684\u6587\u4EF6\uFF08\u53EF\u80FD\u5168\u90E8\u88AB\u5FFD\u7565\u89C4\u5219\u6392\u9664\uFF09");
    process.exit(1);
  }
  s.stop(`${brand.success("\u2713")} \u627E\u5230 ${brand.primary(files.length.toString())} \u4E2A\u6587\u4EF6`);
  const targetPath = getProjectPath(projectName);
  const copySpinner = Y2();
  copySpinner.start("\u6B63\u5728\u590D\u5236\u6587\u4EF6...");
  try {
    await copyFiles(sourcePath, targetPath, files);
    copySpinner.stop(`${brand.success("\u2713")} \u5DF2\u590D\u5236 ${files.length} \u4E2A\u6587\u4EF6`);
  } catch (error) {
    copySpinner.stop("\u590D\u5236\u5931\u8D25");
    printError(error.message);
    process.exit(1);
  }
  saveProjectMeta(projectName, {
    originalPath: sourcePath
  });
  console.log();
  printSuccess(`\u5DF2\u5BFC\u5165\u9879\u76EE: ${brand.primary(projectName)}`);
  console.log();
  console.log(import_picocolors16.default.dim("  \u6E90\u8DEF\u5F84: ") + import_picocolors16.default.underline(sourcePath));
  console.log(import_picocolors16.default.dim("  \u76EE\u6807:   ") + import_picocolors16.default.underline(targetPath));
  console.log(import_picocolors16.default.dim("  \u63D0\u793A:   ") + "\u4E0B\u6B21\u7528 " + brand.primary("p open") + import_picocolors16.default.dim(" \u6253\u5F00\u65F6\uFF0C\u53EF\u5220\u9664\u539F\u59CB\u76EE\u5F55"));
  console.log();
});

// src/commands/ls.ts
init_esm();
var import_fs_extra13 = __toESM(require_lib(), 1);
var import_picocolors17 = __toESM(require_picocolors(), 1);
async function listTemplates(remoteOnly) {
  const published = getPublishedTemplates();
  if (remoteOnly) {
    const entries2 = Object.entries(published);
    if (entries2.length === 0) {
      console.log();
      printInfo(`\u6682\u65E0\u8FDC\u7A0B\u6A21\u677F\uFF0C\u4F7F\u7528 ${brand.primary("p templates publish")} \u53D1\u5E03\u6A21\u677F`);
      console.log();
      return;
    }
    console.log();
    console.log(brand.primary("  \uD83D\uDCE6 \u8FDC\u7A0B\u6A21\u677F") + import_picocolors17.default.dim(` (${entries2.length} \u4E2A)`));
    console.log(import_picocolors17.default.dim("  \u2500".repeat(20)));
    console.log();
    for (const [, meta] of entries2) {
      console.log(`  ${brand.secondary("\u25C6")} ${brand.bold(meta.repo)}`);
      console.log(import_picocolors17.default.dim(`    ${meta.url}`));
      console.log();
    }
    console.log(import_picocolors17.default.dim("  \u63D0\u793A: \u4F7F\u7528 ") + brand.primary("p templates add") + import_picocolors17.default.dim(" \u6DFB\u52A0\u6A21\u677F"));
    console.log();
    return;
  }
  if (!await import_fs_extra13.default.pathExists(TEMPLATES_DIR)) {
    console.log();
    printInfo(`\u6682\u65E0\u6A21\u677F\uFF0C\u4F7F\u7528 ${brand.primary("p templates add")} \u6DFB\u52A0\u6A21\u677F`);
    console.log();
    return;
  }
  const localTemplates = await getLocalTemplates();
  const entries = Object.values(localTemplates);
  if (entries.length === 0) {
    console.log();
    printInfo(`\u6682\u65E0\u6A21\u677F\uFF0C\u4F7F\u7528 ${brand.primary("p templates add")} \u6DFB\u52A0\u6A21\u677F`);
    console.log();
    return;
  }
  console.log();
  console.log(brand.primary("  \uD83D\uDCE6 \u6A21\u677F\u5217\u8868") + import_picocolors17.default.dim(` (${entries.length} \u4E2A)`));
  console.log(import_picocolors17.default.dim("  \u2500".repeat(20)));
  console.log();
  for (const tpl of entries) {
    const meta = published[tpl.name];
    const remoteTag = meta ? import_picocolors17.default.cyan("  \uD83C\uDF10 remote") : "";
    console.log(`  ${brand.secondary("\u25C6")} ${brand.bold(tpl.name)}${remoteTag}`);
    console.log(import_picocolors17.default.dim(`    ${TEMPLATES_DIR}/${tpl.dir || tpl.name}`));
    if (meta) {
      console.log(import_picocolors17.default.dim(`    ${meta.url}`));
    }
    console.log();
  }
  console.log(import_picocolors17.default.dim("  \u63D0\u793A: \u4F7F\u7528 ") + brand.primary("p templates add") + import_picocolors17.default.dim(" \u6DFB\u52A0\u6A21\u677F"));
  console.log();
}
var lsCommand = new Command("ls").alias("list").description("\u5217\u51FA\u6240\u6709\u9879\u76EE").argument("[filter]", "templates / t \u5217\u51FA\u6A21\u677F").option("-r, --remote", "\u914D\u5408 templates / t \u4F7F\u7528\uFF0C\u53EA\u5217\u51FA\u8FDC\u7A0B\u6A21\u677F").action(async (filter, options) => {
  if (filter === "templates" || filter === "t") {
    await listTemplates(!!options?.remote);
    return;
  }
  const projects = listProjects();
  if (projects.length === 0) {
    console.log();
    printInfo(`\u6682\u65E0\u9879\u76EE\uFF0C\u4F7F\u7528 ${brand.primary("p new")} \u521B\u5EFA\u65B0\u9879\u76EE`);
    console.log();
    return;
  }
  console.log();
  console.log(brand.primary("  \uD83D\uDCC2 \u9879\u76EE\u5217\u8868") + import_picocolors17.default.dim(` (${projects.length} \u4E2A)`));
  console.log(import_picocolors17.default.dim("  \u2500".repeat(20)));
  console.log();
  for (const project of projects) {
    const timeStr = formatRelativeTime(project.modifiedAt);
    const templateTag = project.template ? ` ${import_picocolors17.default.cyan(`[${project.template}]`)}` : "";
    const tagDisplay = project.tags && project.tags.length > 0 ? ` ${project.tags.map((t) => import_picocolors17.default.magenta(`#${t}`)).join(" ")}` : "";
    console.log("  " + brand.secondary("\u25C6") + " " + brand.bold(project.name) + templateTag + tagDisplay + import_picocolors17.default.dim(`  ${timeStr}`));
    console.log(import_picocolors17.default.dim(`    ${project.path}`));
    if (project.firstPrompt) {
      const columns = process.stdout.columns ?? 80;
      for (const line of wrapByWidth(project.firstPrompt, columns - 4)) {
        console.log(import_picocolors17.default.dim(`    ${line}`));
      }
    }
    console.log();
  }
  console.log(import_picocolors17.default.dim("  \u63D0\u793A: \u4F7F\u7528 ") + brand.primary("p open") + import_picocolors17.default.dim(" \u6253\u5F00\u9879\u76EE"));
  console.log();
});

// src/commands/meta.ts
init_esm();
var import_fs_extra14 = __toESM(require_lib(), 1);
var metaCommand = new Command("meta").description("\u67E5\u770B\u9879\u76EE\u5143\u6570\u636E").action(async () => {
  const config = loadConfig();
  console.log();
  console.log(brand.primary("  \uD83D\uDCCB \u9879\u76EE\u5143\u6570\u636E"));
  printPath("  \u8DEF\u5F84", METADATA_PATH);
  console.log();
  if (!import_fs_extra14.default.existsSync(METADATA_PATH)) {
    import_fs_extra14.default.writeFileSync(METADATA_PATH, JSON.stringify({ projects: {} }, null, 2), "utf-8");
    printInfo("\u5DF2\u521B\u5EFA\u7A7A\u7684\u5143\u6570\u636E\u6587\u4EF6");
    console.log();
  }
  if (isTUICommand(config.ide)) {
    try {
      await openWithIDE(config.ide, METADATA_PATH);
    } catch (error) {
      printError(error.message);
      printPath("  \u5143\u6570\u636E\u6587\u4EF6\u4F4D\u7F6E", METADATA_PATH);
      process.exit(1);
    }
    return;
  }
  const s = Y2();
  s.start(`\u6B63\u5728\u7528 ${config.ide} \u6253\u5F00\u5143\u6570\u636E\u6587\u4EF6...`);
  try {
    await openWithIDE(config.ide, METADATA_PATH);
    s.stop(`${brand.success("\u2713")} \u5143\u6570\u636E\u6587\u4EF6\u5DF2\u6253\u5F00`);
    console.log();
  } catch (error) {
    s.stop("\u6253\u5F00\u5931\u8D25");
    console.log();
    printError(error.message);
    console.log();
    printPath("  \u5143\u6570\u636E\u6587\u4EF6\u4F4D\u7F6E", METADATA_PATH);
    console.log();
    process.exit(1);
  }
});

// src/commands/new.ts
import { tmpdir } from "os";
import { join as join11 } from "path";
init_esm();
var import_fs_extra16 = __toESM(require_lib(), 1);
var import_picocolors20 = __toESM(require_picocolors(), 1);

// src/core/hooks.ts
var import_fs_extra15 = __toESM(require_lib(), 1);
var import_picocolors18 = __toESM(require_picocolors(), 1);
import { join as join10 } from "path";
async function executeHook(hookKey, hookDef, projectPath, projectName, templateName) {
  console.log();
  console.log(import_picocolors18.default.dim("  \u25B8 ") + brand.secondary(hookDef.name));
  try {
    if (hookDef.command) {
      const command = hookDef.command;
      await execInDir(command, projectPath);
    } else if (hookDef.file) {
      if (!hookDef.file.endsWith(".js")) {
        console.log(import_picocolors18.default.yellow(`    \u811A\u672C\u6587\u4EF6\u5FC5\u987B\u662F .js \u683C\u5F0F: ${hookDef.file}`));
        return false;
      }
      const scriptPath = join10(HOOKS_DIR, hookDef.file);
      if (!import_fs_extra15.default.existsSync(scriptPath)) {
        console.log(import_picocolors18.default.yellow(`    \u811A\u672C\u4E0D\u5B58\u5728: ${hookDef.file}`));
        return false;
      }
      await execInDir(`node ${scriptPath} ${projectPath} ${projectName} ${templateName}`, projectPath);
    } else {
      console.log(import_picocolors18.default.yellow(`    Hook ${hookKey} \u6CA1\u6709\u914D\u7F6E command \u6216 file`));
      return false;
    }
    return true;
  } catch (error) {
    console.log(import_picocolors18.default.red(`    \u6267\u884C\u5931\u8D25: ${error.message}`));
    return false;
  }
}
async function runHooks(config, templateKey, projectPath, projectName) {
  const template = config.templates[templateKey];
  const executedHooks = [];
  if (!template?.hooks || template.hooks.length === 0) {
    return executedHooks;
  }
  console.log();
  console.log(import_picocolors18.default.dim("  \u6267\u884C Hooks:"));
  for (const hookKey of template.hooks) {
    const hookDef = config.hooks[hookKey];
    if (!hookDef) {
      console.log();
      console.log(import_picocolors18.default.dim("  \u25B8 ") + import_picocolors18.default.yellow(`\u672A\u77E5 Hook: ${hookKey}`));
      continue;
    }
    const success = await executeHook(hookKey, hookDef, projectPath, projectName, templateKey);
    if (success) {
      executedHooks.push(hookKey);
    }
  }
  return executedHooks;
}
async function runHooksByKeys(config, hookKeys, projectPath, projectName) {
  console.log();
  console.log(import_picocolors18.default.dim("  \u6267\u884C Hooks:"));
  const executedHooks = [];
  for (const hookKey of hookKeys) {
    const hookDef = config.hooks[hookKey];
    if (!hookDef) {
      console.log();
      console.log(import_picocolors18.default.dim("  \u25B8 ") + import_picocolors18.default.yellow(`\u672A\u77E5 Hook: ${hookKey}`));
      continue;
    }
    const success = await executeHook(hookKey, hookDef, projectPath, projectName, "");
    if (success) {
      executedHooks.push(hookKey);
    }
  }
  return executedHooks;
}

// src/utils/naming.ts
var KEBAB_RE = /^[a-z][a-z0-9-]*$/;
var MAX_REASON_LEN = 20;
function truncateReason(reason) {
  const t = reason.trim();
  return t.length > MAX_REASON_LEN ? `${t.slice(0, MAX_REASON_LEN)}\u2026` : t;
}
function isDescriptionInput(input) {
  const trimmed = input.trim();
  if (!trimmed)
    return false;
  if (/[^\x20-\x7E]/.test(trimmed))
    return true;
  return /\s/.test(trimmed);
}
var LIST_PREFIX_RE = /^(?:\d+[.)\u3001]\s*|[-*\u2022\u00B7]\s+|>+\s+)/;
var QUOTE_PAIRS = [
  /^`(.*)`$/,
  /^"(.*)"$/,
  /^'(.*)'$/,
  /^\u201C(.*)\u201D$/,
  /^\u300C(.*)\u300D$/,
  /^\u300E(.*)\u300F$/
];
var NAME_REASON_SEP_RE = /^["'`\u2018\u201C\u300C]?([a-z][a-z0-9-]*)["'`'\u201D\u300D]?\s*(?:\u2014|\u2013|:|\uFF1A|\||=>)\s*(.+)$/;
function parseLine(line) {
  let s = line.trim();
  if (!s || s.startsWith("```"))
    return null;
  s = s.replace(LIST_PREFIX_RE, "");
  for (const re of QUOTE_PAIRS) {
    const matched = s.match(re);
    if (matched?.[1]) {
      s = matched[1].trim();
      break;
    }
  }
  if (KEBAB_RE.test(s))
    return { name: s, reason: "" };
  const sep = s.match(NAME_REASON_SEP_RE);
  if (sep?.[1] && KEBAB_RE.test(sep[1])) {
    return { name: sep[1], reason: truncateReason(sep[2] ?? "") };
  }
  const spaced = s.match(/^(\S+)\s+(.+)$/);
  if (spaced?.[1] && KEBAB_RE.test(spaced[1])) {
    return {
      name: spaced[1],
      reason: truncateReason((spaced[2] ?? "").replace(/^[-\u2013\u2014:\uFF1A|\s]+/, ""))
    };
  }
  return null;
}
function parseJsonItem(item) {
  if (typeof item === "string") {
    return KEBAB_RE.test(item) ? { name: item, reason: "" } : null;
  }
  if (item && typeof item === "object" && "name" in item) {
    const { name, reason } = item;
    if (typeof name !== "string" || !KEBAB_RE.test(name))
      return null;
    return {
      name,
      reason: typeof reason === "string" ? truncateReason(reason) : ""
    };
  }
  return null;
}
function dedupe(items, max) {
  const seen = new Set;
  const out = [];
  for (const item of items) {
    if (seen.has(item.name))
      continue;
    seen.add(item.name);
    out.push(item);
    if (out.length >= max)
      break;
  }
  return out;
}
function parseSuggestions(raw, max = 5) {
  const trimmed = raw.trim();
  if (!trimmed)
    return [];
  const withoutFences = trimmed.split(`
`).filter((line) => !line.trim().startsWith("```")).join(`
`);
  try {
    const parsed = JSON.parse(withoutFences);
    if (Array.isArray(parsed)) {
      return dedupe(parsed.map(parseJsonItem).filter((x2) => x2 !== null), max);
    }
  } catch {}
  const items = [];
  for (const line of trimmed.split(`
`)) {
    const item = parseLine(line);
    if (item)
      items.push(item);
  }
  return dedupe(items, max);
}
var NAME_RULES = [
  "- \u53EA\u4F7F\u7528\u5C0F\u5199\u82F1\u6587\u5B57\u6BCD\u3001\u6570\u5B57\u548C\u8FDE\u5B57\u7B26",
  "- \u5FC5\u987B\u4EE5\u5B57\u6BCD\u5F00\u5934",
  "- \u7B80\u6D01\u3001\u6709\u610F\u4E49\u3001\u597D\u8BB0\uFF0C\u4F18\u5148 1-2 \u4E2A\u8BCD",
  "- \u6570\u5B57\u76F4\u63A5\u8DDF\u5728\u5355\u8BCD\u540E\u9762\uFF08\u5982 blog2 \u800C\u975E blog-2\uFF09"
].join(`
`);
function buildNamingPrompt(description, exclude = []) {
  const parts = [
    `\u6839\u636E\u4EE5\u4E0B\u9879\u76EE\u9700\u6C42\u751F\u6210 5 \u4E2A\u9879\u76EE\u540D\u79F0\uFF08kebab-case\uFF09\uFF0C\u5E76\u4E3A\u6BCF\u4E2A\u540D\u79F0\u914D\u4E00\u53E5\u7B80\u77ED\u4E2D\u6587\u89E3\u91CA\uFF08\u4E0D\u8D85\u8FC7 12 \u4E2A\u5B57\uFF0C\u8BF4\u660E\u547D\u540D\u601D\u8DEF\uFF09\uFF1A
${description}`,
    `\u547D\u540D\u89C4\u5219\uFF1A
${NAME_RULES}`,
    '\u8F93\u51FA\u683C\u5F0F\uFF1A\u53EA\u8F93\u51FA\u4E00\u4E2A JSON \u6570\u7EC4\uFF0C\u6BCF\u9879\u5F62\u5982 {"name": "\u9879\u76EE\u540D", "reason": "\u89E3\u91CA"}\uFF0C\u4E0D\u8981 markdown \u4EE3\u7801\u5757\uFF0C\u4E0D\u8981\u7F16\u53F7\uFF0C\u4E0D\u8981\u4EFB\u4F55\u5176\u4ED6\u6587\u5B57\u3002'
  ];
  if (exclude.length > 0) {
    parts.push(`\u4E0D\u8981\u4F7F\u7528\u4EE5\u4E0B\u5DF2\u751F\u6210\u8FC7\u7684\u540D\u79F0\uFF1A
${exclude.join(`
`)}`);
  }
  return parts.join(`

`);
}
async function generateNamesViaClaude(prompt, timeoutMs = 60000) {
  const overflow = await resolveOverflowSettings();
  const args = ["claude", "-p", prompt];
  if (overflow)
    args.push("--settings", overflow.settingsPath);
  const proc = Bun.spawn(args, {
    stdin: "ignore",
    stdout: "pipe",
    stderr: "pipe",
    env: process.env
  });
  let timedOut = false;
  let killTimer;
  const timer = setTimeout(() => {
    timedOut = true;
    proc.kill();
    killTimer = setTimeout(() => proc.kill(9), 2000);
  }, timeoutMs);
  try {
    const [stdout, stderr, exitCode] = await Promise.all([
      new Response(proc.stdout).text(),
      new Response(proc.stderr).text(),
      proc.exited
    ]);
    if (timedOut) {
      return {
        ok: false,
        error: `claude \u547D\u540D\u8D85\u65F6\uFF08${Math.round(timeoutMs / 1000)}s\uFF09`
      };
    }
    if (exitCode !== 0) {
      const tail = stderr.trim().slice(-200);
      return { ok: false, error: tail || `claude \u9000\u51FA\u7801 ${exitCode}` };
    }
    const suggestions = parseSuggestions(stdout);
    if (suggestions.length === 0) {
      return { ok: false, error: "claude \u672A\u751F\u6210\u6709\u6548\u540D\u79F0" };
    }
    return { ok: true, suggestions };
  } catch (error) {
    return { ok: false, error: error.message };
  } finally {
    clearTimeout(timer);
    if (killTimer)
      clearTimeout(killTimer);
  }
}

// src/utils/select-or-input.ts
var import_picocolors19 = __toESM(require_picocolors(), 1);
var import_sisteransi4 = __toESM(require_src(), 1);
import * as readline2 from "readline";
import { Writable as Writable2 } from "stream";
var MAX_VISIBLE2 = 8;
var CANCEL2 = Symbol("select-or-input:cancel");
var CUSTOM_INPUT = Symbol("select-or-input:custom");
async function selectOrInput(opts) {
  const stdin = process.stdin;
  const stdout = process.stdout;
  const interceptStream = new Writable2({
    write(_chunk, _encoding, callback) {
      callback();
    }
  });
  stdin.setRawMode(true);
  stdin.resume();
  stdout.write(import_sisteransi4.cursor.hide);
  const rl = readline2.createInterface({
    input: stdin,
    output: interceptStream,
    terminal: true
  });
  readline2.emitKeypressEvents(stdin, rl);
  const state = {
    query: "",
    cursor: 0,
    selectedIndex: 0,
    scrollOffset: 0,
    mode: "select"
  };
  let blockHeight = 0;
  let resolved = false;
  function render() {
    const parts = [];
    if (blockHeight > 0) {
      parts.push(import_sisteransi4.cursor.up(blockHeight));
    }
    const lines = [];
    lines.push(`  ${brand.secondary("\u25C6")} ${opts.message}`);
    const placeholder = opts.placeholder || "\u76F4\u63A5\u8F93\u5165\u81EA\u5B9A\u4E49\u540D\u79F0...";
    let inputLine;
    if (state.query.length === 0) {
      inputLine = import_picocolors19.default.inverse(placeholder[0]) + import_picocolors19.default.dim(placeholder.slice(1));
    } else {
      const before = state.query.slice(0, state.cursor);
      const at = state.query[state.cursor];
      const after = state.query.slice(state.cursor + 1);
      const cursorChar = at ? import_picocolors19.default.inverse(at) : import_picocolors19.default.inverse(" ");
      inputLine = before + cursorChar + after;
    }
    lines.push(`  ${brand.secondary("\u2502")} ${inputLine}`);
    lines.push(`  ${brand.secondary("\u2502")}`);
    const visibleCount = Math.min(MAX_VISIBLE2, opts.options.length - state.scrollOffset);
    const visible = opts.options.slice(state.scrollOffset, state.scrollOffset + visibleCount);
    if (visible.length === 0) {
      lines.push(`  ${brand.secondary("\u2502")}   ${import_picocolors19.default.dim("\u6CA1\u6709\u9009\u9879")}`);
    } else {
      for (let i = 0;i < visible.length; i++) {
        const idx = state.scrollOffset + i;
        const isSelected = idx === state.selectedIndex && state.mode === "select";
        const item = visible[i];
        if (!item)
          continue;
        const marker = isSelected ? brand.primary("\u25C9") : import_picocolors19.default.dim("\u25CB");
        const label = isSelected ? brand.bold(item.label) : item.label;
        const hint = item.hint ? import_picocolors19.default.dim("  ") + item.hint : "";
        lines.push(`  ${brand.secondary("\u2502")} ${marker} ${label}${hint}`);
      }
    }
    const remaining = opts.options.length - state.scrollOffset - MAX_VISIBLE2;
    if (remaining > 0) {
      lines.push(`  ${brand.secondary("\u2502")}   ${import_picocolors19.default.dim(`... \u8FD8\u6709 ${remaining} \u4E2A`)}`);
    }
    lines.push(`  ${brand.secondary("\u2514")} ${import_picocolors19.default.dim("\u76F4\u63A5\u8F93\u5165 \xB7 \u2191\u2193 \u9009\u62E9 \xB7 Enter \u786E\u8BA4 \xB7 Esc \u53D6\u6D88")}`);
    for (const line of lines) {
      parts.push(`${line}\x1B[K
`);
    }
    if (blockHeight > lines.length) {
      for (let i = lines.length;i < blockHeight; i++) {
        parts.push(`\x1B[K
`);
      }
      parts.push(import_sisteransi4.cursor.up(blockHeight - lines.length));
    }
    stdout.write(parts.join(""));
    blockHeight = lines.length;
  }
  render();
  return new Promise((resolve5) => {
    function cleanup() {
      if (resolved)
        return;
      resolved = true;
      stdin.removeListener("keypress", onKey);
      stdin.setRawMode(false);
      stdin.pause();
      rl.close();
      stdout.write(import_sisteransi4.cursor.show);
    }
    function submit(value, label) {
      const parts = [];
      parts.push(import_sisteransi4.cursor.up(blockHeight));
      for (let i = 0;i < blockHeight; i++) {
        parts.push(`\x1B[K
`);
      }
      parts.push(import_sisteransi4.cursor.up(blockHeight));
      parts.push(`  ${brand.success("\u25C6")} ${opts.message} ${brand.primary(label)}
`);
      stdout.write(parts.join(""));
      cleanup();
      resolve5(value);
    }
    function doCancel() {
      const parts = [];
      parts.push(import_sisteransi4.cursor.up(blockHeight));
      for (let i = 0;i < blockHeight; i++) {
        parts.push(`\x1B[K
`);
      }
      parts.push(import_sisteransi4.cursor.up(blockHeight));
      parts.push(`  ${brand.secondary("\u25C6")} ${opts.message} ${import_picocolors19.default.dim("\u5DF2\u53D6\u6D88")}
`);
      stdout.write(parts.join(""));
      cleanup();
      resolve5(CANCEL2);
    }
    function onKey(_char, key) {
      if (resolved)
        return;
      if (key.sequence === "\x03") {
        doCancel();
        return;
      }
      switch (key.name) {
        case "return": {
          if (state.query.trim()) {
            const trimmed = state.query.trim();
            const validation = opts.validate?.(trimmed);
            if (validation) {
              return;
            }
            submit(trimmed, trimmed);
            return;
          }
          if (opts.options.length === 0)
            return;
          const selected = opts.options[state.selectedIndex];
          if (selected)
            submit(selected.value, selected.label);
          return;
        }
        case "escape": {
          doCancel();
          return;
        }
        case "backspace": {
          if (state.cursor > 0) {
            state.query = state.query.slice(0, state.cursor - 1) + state.query.slice(state.cursor);
            state.cursor--;
          }
          break;
        }
        case "delete": {
          if (state.cursor < state.query.length) {
            state.query = state.query.slice(0, state.cursor) + state.query.slice(state.cursor + 1);
          }
          break;
        }
        case "left": {
          if (state.cursor > 0)
            state.cursor--;
          break;
        }
        case "right": {
          if (state.cursor < state.query.length)
            state.cursor++;
          break;
        }
        case "up": {
          state.mode = "select";
          if (state.selectedIndex > 0) {
            state.selectedIndex--;
            if (state.selectedIndex < state.scrollOffset) {
              state.scrollOffset = state.selectedIndex;
            }
          } else if (opts.options.length > 0) {
            state.selectedIndex = opts.options.length - 1;
            state.scrollOffset = Math.max(0, opts.options.length - MAX_VISIBLE2);
          }
          break;
        }
        case "down": {
          state.mode = "select";
          if (state.selectedIndex < opts.options.length - 1) {
            state.selectedIndex++;
            if (state.selectedIndex >= state.scrollOffset + MAX_VISIBLE2) {
              state.scrollOffset = state.selectedIndex - MAX_VISIBLE2 + 1;
            }
          } else if (opts.options.length > 0) {
            state.selectedIndex = 0;
            state.scrollOffset = 0;
          }
          break;
        }
        default: {
          if (key.sequence && key.sequence.length === 1 && !key.ctrl && !key.meta) {
            state.query = state.query.slice(0, state.cursor) + key.sequence + state.query.slice(state.cursor);
            state.cursor++;
            state.mode = "input";
          }
          break;
        }
      }
      render();
    }
    stdin.on("keypress", onKey);
  });
}

// src/commands/new.ts
async function openExistingProject(projectName, openIde) {
  const projectPath = getProjectPath(projectName);
  printError(`\u9879\u76EE\u5DF2\u5B58\u5728: ${brand.primary(projectName)}${import_picocolors20.default.dim("\uFF0C\u76F4\u63A5\u6253\u5F00")}`);
  if (isTUICommand(openIde)) {
    try {
      await openWithIDE(openIde, projectPath);
    } catch (error) {
      printError(error.message);
      console.log(import_picocolors20.default.dim("  \u9879\u76EE\u8DEF\u5F84: ") + import_picocolors20.default.underline(projectPath));
    }
    return;
  }
  const s = Y2();
  s.start(`\u6B63\u5728\u6253\u5F00 ${openIde}...`);
  try {
    await openWithIDE(openIde, projectPath);
    s.stop(`\u5DF2\u7528 ${openIde} \u6253\u5F00`);
  } catch (error) {
    s.stop(`\u6253\u5F00 ${openIde} \u5931\u8D25`);
    printError(error.message);
    console.log(import_picocolors20.default.dim("  \u9879\u76EE\u8DEF\u5F84: ") + import_picocolors20.default.underline(projectPath));
  }
}
var newCommand = new Command("new").alias("n").alias("create").description("\u521B\u5EFA\u65B0\u9879\u76EE").argument("[name]", "\u9879\u76EE\u540D\u79F0\uFF08\u652F\u6301 #tag \u6DFB\u52A0\u6807\u7B7E\uFF09").option("-t, --template [template]", "\u4F7F\u7528\u6307\u5B9A\u6A21\u677F").option("-i, --ide <ide>", "\u6307\u5B9A\u6253\u5F00\u65B9\u5F0F\uFF08claude, cursor, code \u7B49\uFF09").allowExcessArguments(true).action(async (name, options, command) => {
  const rawArgs = process.argv;
  const ddIdx = rawArgs.indexOf("--");
  const newIdx = rawArgs.lastIndexOf("new");
  if (ddIdx !== -1 && ddIdx > newIdx) {
    let cmd = rawArgs.slice(ddIdx + 1).join(" ");
    if (!cmd) {
      printError("-- \u540E\u9700\u8981\u63D0\u4F9B\u547D\u4EE4");
      process.exit(1);
    }
    const config2 = loadConfig();
    const tokens = rawArgs.slice(ddIdx + 1);
    const firstToken = tokens[0] ?? "";
    const alias = config2.shortcuts?.[firstToken];
    if (alias) {
      const remaining = tokens.slice(1).join(" ");
      cmd = remaining ? `${alias} ${remaining}` : alias;
      console.log();
      console.log(import_picocolors20.default.dim("  \u522B\u540D: ") + brand.primary(firstToken) + import_picocolors20.default.dim(` \u2192 ${alias}`));
      console.log(import_picocolors20.default.dim("  \u914D\u7F6E: ") + import_picocolors20.default.underline(CONFIG_PATH));
    }
    console.log();
    console.log(import_picocolors20.default.dim("  \u5DE5\u4F5C\u76EE\u5F55: ") + import_picocolors20.default.underline(PROJECTS_DIR));
    console.log();
    await import_fs_extra16.default.ensureDir(PROJECTS_DIR);
    const existingProjects = new Set(listProjects().map((p2) => p2.name));
    const result = await execInDir(cmd, PROJECTS_DIR, {
      captureStderr: true
    });
    if (!result.success) {
      let createdDirs = [];
      try {
        const afterAll = await import_fs_extra16.default.readdir(PROJECTS_DIR, {
          withFileTypes: true
        });
        const afterDirNames = afterAll.filter((e2) => e2.isDirectory()).map((e2) => e2.name);
        createdDirs = afterDirNames.filter((name2) => !existingProjects.has(name2));
      } catch {}
      if (result.stderr?.includes("ERR_PNPM_IGNORED_BUILDS") && createdDirs.length > 0) {
        const projectDir = join11(PROJECTS_DIR, createdDirs[0] ?? "");
        console.log();
        const runApprove = await ye({
          message: "\u68C0\u6D4B\u5230 pnpm \u9700\u8981\u6279\u51C6\u6784\u5EFA\u811A\u672C\uFF0C\u662F\u5426\u8FD0\u884C pnpm approve-builds\uFF1F"
        });
        if (!pD(runApprove) && runApprove) {
          console.log();
          await execInDir("pnpm approve-builds", projectDir);
        }
      } else if (createdDirs.length === 0) {
        if (!process.env.GITHUB_TOKEN && result.stderr?.toLowerCase().includes("rate limit") && await commandExists("gh")) {
          const retry = await ye({
            message: "\u68C0\u6D4B\u5230 GitHub API \u901F\u7387\u9650\u5236\uFF0C\u662F\u5426\u4F7F\u7528\u5F53\u524D gh auth \u7684 token \u91CD\u8BD5\uFF1F"
          });
          if (!pD(retry) && retry) {
            const tokenResult = await execAndCapture("gh auth token", process.cwd());
            if (tokenResult.success && tokenResult.output) {
              const token = tokenResult.output.trim();
              process.env.GITHUB_TOKEN = token;
              const patchFile = join11(tmpdir(), "p-github-auth-patch.cjs");
              import_fs_extra16.default.writeFileSync(patchFile, `const _f=globalThis.fetch;globalThis.fetch=async(u,o={})=>{const s=typeof u==="string"?u:u?.url||"";if(s.includes("api.github.com"))o={...o,headers:{...o.headers,Authorization:"Bearer "+process.env.GITHUB_TOKEN}};return _f(u,o)};`);
              const prevNodeOpts = process.env.NODE_OPTIONS || "";
              process.env.NODE_OPTIONS = prevNodeOpts + ` --require ${patchFile.replace(/\\/g, "/")}`;
              console.log();
              console.log(import_picocolors20.default.dim("  \u5DF2\u6CE8\u5165 GITHUB_TOKEN\uFF0C\u6B63\u5728\u91CD\u8BD5..."));
              console.log();
              const retryResult = await execInDir(cmd, PROJECTS_DIR);
              process.env.NODE_OPTIONS = prevNodeOpts || undefined;
              try {
                import_fs_extra16.default.unlinkSync(patchFile);
              } catch {}
              if (!retryResult.success) {
                console.log();
                printError("\u91CD\u8BD5\u4ECD\u7136\u5931\u8D25");
                process.exit(1);
              }
            } else {
              console.log();
              printError("\u83B7\u53D6 gh auth token \u5931\u8D25");
              process.exit(1);
            }
          } else {
            console.log();
            printError("\u547D\u4EE4\u6267\u884C\u5931\u8D25");
            process.exit(1);
          }
        } else {
          console.log();
          printError("\u547D\u4EE4\u6267\u884C\u5931\u8D25");
          process.exit(1);
        }
      }
    }
    const entries = await import_fs_extra16.default.readdir(PROJECTS_DIR, {
      withFileTypes: true
    });
    const newProjects = [];
    for (const entry of entries) {
      if (entry.isDirectory() && !existingProjects.has(entry.name)) {
        saveProjectMeta(entry.name, {});
        newProjects.push(entry.name);
      }
    }
    console.log();
    if (newProjects.length > 0) {
      const config3 = loadConfig();
      for (const n of newProjects) {
        console.log(`  ${brand.success("\u2713")} \u5DF2\u521B\u5EFA\u9879\u76EE: ${brand.primary(n)}`);
      }
      const firstProject = getProjectPath(newProjects[0] ?? "");
      const openIde2 = options?.ide || config3.ide;
      if (isTUICommand(openIde2)) {
        console.log(import_picocolors20.default.dim(`  \u6B63\u5728\u542F\u52A8 ${openIde2}: `) + brand.primary(newProjects[0] ?? ""));
        try {
          await openWithIDE(openIde2, firstProject);
        } catch (error) {
          printError(error.message);
        }
      } else {
        const s2 = Y2();
        s2.start(`\u6B63\u5728\u6253\u5F00 ${openIde2}...`);
        try {
          await openWithIDE(openIde2, firstProject);
          s2.stop(`\u5DF2\u7528 ${openIde2} \u6253\u5F00`);
        } catch (error) {
          s2.stop("\u6253\u5F00\u5931\u8D25");
          printError(error.message);
        }
      }
    } else {
      printInfo("\u672A\u68C0\u6D4B\u5230\u65B0\u9879\u76EE\u76EE\u5F55");
    }
    return;
  }
  const config = loadConfig();
  const allTemplates = await getAllTemplates(config.templates);
  const nameParts = (name || "").split(/\s+/);
  const tags = nameParts.filter((p2) => p2.startsWith("#")).map((t) => t.slice(1).toLowerCase());
  const cleanName = nameParts.filter((p2) => !p2.startsWith("#")).join(" ") || name;
  const rawInput = (command?.args ?? []).filter((token) => !token.startsWith("#")).join(" ").trim();
  const isDesc = isDescriptionInput(rawInput);
  const isQuickMode = !isDesc && cleanName && !options?.template;
  if (isQuickMode) {
    const validation = validateProjectNameFormat(cleanName);
    if (!validation.valid) {
      printError(validation.message ?? "\u9879\u76EE\u540D\u79F0\u65E0\u6548");
      process.exit(1);
    }
    if (projectExists(cleanName)) {
      await openExistingProject(cleanName, options?.ide || config.ide);
      return;
    }
    const projectPath2 = getProjectPath(cleanName);
    try {
      await import_fs_extra16.default.ensureDir(projectPath2);
    } catch (error) {
      const err = error;
      printError(err.message);
      process.exit(1);
    }
    const emptyTemplate = config.templates.empty;
    if (emptyTemplate?.hooks && emptyTemplate.hooks.length > 0) {
      await runHooks(config, "empty", projectPath2, cleanName);
    }
    saveProjectMeta(cleanName, { template: "empty", tags });
    const openIde2 = options?.ide || config.ide;
    if (isTUICommand(openIde2)) {
      console.log(brand.success("\u2713") + " " + brand.primary(name ?? cleanName) + import_picocolors20.default.dim(` \u5DF2\u521B\u5EFA\uFF0C\u542F\u52A8 ${openIde2}...`));
      try {
        await openWithIDE(openIde2, projectPath2);
      } catch (error) {
        printError(error.message);
        console.log(import_picocolors20.default.dim("  \u9879\u76EE\u8DEF\u5F84: ") + import_picocolors20.default.underline(projectPath2));
      }
      return;
    }
    try {
      await openWithIDE(openIde2, projectPath2);
      console.log(brand.success("\u2713") + " " + brand.primary(name ?? cleanName) + import_picocolors20.default.dim(" \u5DF2\u521B\u5EFA\u5E76\u6253\u5F00"));
    } catch (error) {
      console.log();
      printError(error.message);
      console.log();
      console.log(import_picocolors20.default.dim("  \u9879\u76EE\u8DEF\u5F84: ") + import_picocolors20.default.underline(projectPath2));
      console.log();
    }
    return;
  }
  Ie(bgOrange(" \u521B\u5EFA\u65B0\u9879\u76EE "));
  let projectName = isDesc ? "" : cleanName;
  let description = "";
  if (isDesc) {
    description = rawInput;
    const seen = [];
    let suggestions = [];
    const filterSuggestions = (items) => items.filter((s2) => validateProjectNameFormat(s2.name).valid && !projectExists(s2.name));
    let hasClaude = await commandExists("claude");
    if (hasClaude) {
      const sGen = Y2();
      sGen.start("\u6B63\u5728\u751F\u6210\u5019\u9009\u9879\u76EE\u540D\u2026");
      const result = await generateNamesViaClaude(buildNamingPrompt(description));
      if (result.ok) {
        suggestions = filterSuggestions(result.suggestions);
        seen.push(...result.suggestions.map((s2) => s2.name));
        sGen.stop(`\u5DF2\u751F\u6210 ${suggestions.length} \u4E2A\u5019\u9009\u540D`);
      } else {
        hasClaude = false;
        sGen.stop("\u5019\u9009\u540D\u751F\u6210\u5931\u8D25");
        console.log(import_picocolors20.default.dim(`  \u539F\u56E0: ${result.error}\uFF08\u53EF\u76F4\u63A5\u624B\u52A8\u8F93\u5165\uFF09`));
      }
    } else {
      console.log(import_picocolors20.default.dim("  \u672A\u68C0\u6D4B\u5230 claude CLI\uFF0C\u8BF7\u76F4\u63A5\u8F93\u5165\u9879\u76EE\u540D"));
    }
    if (hasClaude) {
      for (;; ) {
        const choice = await selectOrInput({
          message: "\u9009\u62E9\u9879\u76EE\u540D\u79F0:",
          options: [
            ...suggestions.map((s2) => ({
              value: s2.name,
              label: s2.name,
              hint: s2.reason ? import_picocolors20.default.dim(s2.reason) : undefined
            })),
            {
              value: "__regenerate__",
              label: import_picocolors20.default.cyan("\u6362\u4E00\u6279"),
              hint: "\u91CD\u65B0\u751F\u6210"
            }
          ],
          placeholder: "\u76F4\u63A5\u8F93\u5165\u81EA\u5B9A\u4E49\u540D\u79F0...",
          validate: (value) => {
            const validation = validateProjectName(value);
            if (!validation.valid)
              return validation.message;
          }
        });
        if (choice === CANCEL2) {
          Se(import_picocolors20.default.dim("\u5DF2\u53D6\u6D88"));
          process.exit(0);
        }
        if (choice === "__regenerate__") {
          const sRegen = Y2();
          sRegen.start("\u6362\u4E00\u6279\u751F\u6210\u4E2D\u2026");
          const result = await generateNamesViaClaude(buildNamingPrompt(description, seen));
          if (result.ok) {
            suggestions = filterSuggestions(result.suggestions);
            seen.push(...result.suggestions.map((s2) => s2.name));
            sRegen.stop(`\u5DF2\u751F\u6210 ${suggestions.length} \u4E2A\u5019\u9009\u540D`);
          } else {
            sRegen.stop("\u91CD\u65B0\u751F\u6210\u5931\u8D25\uFF0C\u4FDD\u7559\u4E0A\u4E00\u6279");
          }
          continue;
        }
        projectName = choice;
        break;
      }
    }
  }
  if (!projectName) {
    const result = await he({
      message: "\u8BF7\u8F93\u5165\u9879\u76EE\u540D\u79F0:",
      placeholder: "my-awesome-project",
      validate: (value) => {
        const validation = validateProjectName(value);
        if (!validation.valid)
          return validation.message;
      }
    });
    if (pD(result)) {
      Se(import_picocolors20.default.dim("\u5DF2\u53D6\u6D88"));
      process.exit(0);
    }
    projectName = result;
  } else {
    const validation = validateProjectName(projectName);
    if (!validation.valid) {
      if (projectExists(projectName)) {
        Se(import_picocolors20.default.dim("\u76F4\u63A5\u6253\u5F00\u5DF2\u6709\u9879\u76EE"));
        await openExistingProject(projectName, options?.ide || config.ide);
        return;
      }
      printError(validation.message ?? "\u9879\u76EE\u540D\u79F0\u65E0\u6548");
      process.exit(1);
    }
  }
  let templateKey;
  const templateChoices = getTemplateChoices(allTemplates);
  if (options?.template === true || options?.template === "") {
    const result = await ve({
      message: "\u8BF7\u9009\u62E9\u9879\u76EE\u6A21\u677F:",
      options: templateChoices
    });
    if (pD(result)) {
      Se(import_picocolors20.default.dim("\u5DF2\u53D6\u6D88"));
      process.exit(0);
    }
    templateKey = result;
  } else if (options?.template) {
    templateKey = options.template;
    if (!allTemplates[templateKey]) {
      const q2 = templateKey.toLowerCase();
      const keys = Object.keys(allTemplates);
      const matched = keys.filter((k3) => k3.toLowerCase().includes(q2));
      if (matched.length === 1) {
        templateKey = matched[0] ?? templateKey;
      } else if (matched.length > 1) {
        const result = await ve({
          message: `\u6A21\u677F '${options.template}' \u5339\u914D\u5230\u591A\u4E2A:`,
          options: matched.map((k3) => ({
            value: k3,
            label: allTemplates[k3]?.name ?? k3
          }))
        });
        if (pD(result)) {
          Se(import_picocolors20.default.dim("\u5DF2\u53D6\u6D88"));
          process.exit(0);
        }
        templateKey = result;
      } else {
        printError(`\u6A21\u677F\u4E0D\u5B58\u5728: ${templateKey}`);
        console.log(import_picocolors20.default.dim(`\u53EF\u7528\u6A21\u677F: ${keys.join(", ")}`));
        process.exit(1);
      }
    }
  } else if (isDesc) {
    templateKey = "empty";
  } else {
    const result = await ve({
      message: "\u8BF7\u9009\u62E9\u9879\u76EE\u6A21\u677F:",
      options: templateChoices
    });
    if (pD(result)) {
      Se(import_picocolors20.default.dim("\u5DF2\u53D6\u6D88"));
      process.exit(0);
    }
    templateKey = result;
  }
  const template = allTemplates[templateKey];
  if (!template) {
    printError(`\u6A21\u677F\u4E0D\u5B58\u5728: ${templateKey}`);
    process.exit(1);
  }
  const projectPath = getProjectPath(projectName);
  console.log();
  console.log(import_picocolors20.default.dim("  \u9879\u76EE\u540D\u79F0: ") + brand.primary(projectName));
  console.log(import_picocolors20.default.dim("  \u4F7F\u7528\u6A21\u677F: ") + brand.secondary(template.name));
  console.log(import_picocolors20.default.dim("  \u9879\u76EE\u8DEF\u5F84: ") + import_picocolors20.default.dim(projectPath));
  try {
    await import_fs_extra16.default.ensureDir(projectPath);
  } catch (error) {
    const err = error;
    printError(err.message);
    process.exit(1);
  }
  const templateResult = await applyTemplate(template, projectPath);
  if (!templateResult.success) {
    try {
      await import_fs_extra16.default.remove(projectPath);
    } catch {}
    printError(templateResult.message);
    process.exit(1);
  }
  await runHooks(config, templateKey, projectPath, projectName);
  saveProjectMeta(projectName, {
    template: templateKey,
    tags,
    firstPrompt: description || undefined
  });
  const openIde = options?.ide || config.ide;
  console.log();
  if (isTUICommand(openIde) && supportsPromptArg(openIde)) {
    Se(brand.success("\u2728 \u9879\u76EE\u521B\u5EFA\u6210\u529F\uFF01\u8FDB\u5165\u5F00\u53D1\u2026"));
    const watcher = maybeWatchCchiveSync(config.cchiveSync, projectPath);
    const bin = openIde.trim().split(/\s+/)[0] ?? openIde;
    const overflow = isClaudeCommand(bin) ? await resolveOverflowSettings() : null;
    if (overflow) {
      printInfo(`\u9ED8\u8BA4\u6E20\u9053\u5DF2\u6EE1\uFF0C\u6EA2\u51FA\u5230 ${brand.primary(overflow.provider.name)}`);
    }
    const proc = Bun.spawn([
      bin,
      "--dangerously-skip-permissions",
      ...overflow ? ["--settings", overflow.settingsPath] : [],
      description
    ], {
      cwd: projectPath,
      stdin: "inherit",
      stdout: "inherit",
      stderr: "inherit",
      env: { ...process.env }
    });
    try {
      await proc.exited;
    } finally {
      watcher?.stop();
    }
    return;
  }
  if (isTUICommand(openIde)) {
    Se(brand.success("\u2728 \u9879\u76EE\u521B\u5EFA\u6210\u529F\uFF01"));
    try {
      await openWithIDE(openIde, projectPath);
    } catch (error) {
      printError(error.message);
      console.log(import_picocolors20.default.dim("  \u9879\u76EE\u8DEF\u5F84: ") + import_picocolors20.default.underline(projectPath));
    }
    return;
  }
  const s = Y2();
  s.start(`\u6B63\u5728\u6253\u5F00 ${openIde}...`);
  try {
    await openWithIDE(openIde, projectPath);
    s.stop(`\u5DF2\u7528 ${openIde} \u6253\u5F00`);
  } catch (error) {
    s.stop(`\u6253\u5F00 ${openIde} \u5931\u8D25`);
    console.log();
    printError(error.message);
    console.log();
    console.log(import_picocolors20.default.dim("  \u9879\u76EE\u8DEF\u5F84: ") + import_picocolors20.default.underline(projectPath));
  }
  Se(brand.success("\u2728 \u9879\u76EE\u521B\u5EFA\u6210\u529F\uFF01"));
});

// src/commands/open.ts
init_esm();
var import_fs_extra17 = __toESM(require_lib(), 1);
var import_picocolors21 = __toESM(require_picocolors(), 1);
async function searchAndSelect(projects, initialQuery) {
  const options = projects.map((p2) => ({
    value: p2.name,
    label: p2.name,
    hint: projectHint(p2)
  }));
  const result = await liveSearch({
    message: "\u641C\u7D22\u9879\u76EE:",
    placeholder: "\u8F93\u5165\u540D\u79F0\u3001\u6A21\u677F\u6216\u6807\u7B7E\u7B5B\u9009",
    options,
    filterFn: (query) => {
      if (!query)
        return options;
      const filtered = filterProjects(projects, query);
      return filtered.map((p2) => ({
        value: p2.name,
        label: p2.name,
        hint: projectHint(p2)
      }));
    },
    initialQuery,
    multiSelect: true
  });
  if (result === CANCEL) {
    Se(import_picocolors21.default.dim("\u5DF2\u53D6\u6D88"));
    process.exit(0);
  }
  return result;
}
async function resolveOpenIde(config, options) {
  if (options?.ide)
    return options.ide;
  if (config.editor)
    return config.editor;
  for (const cmd of ["cursor", "code", "windsurf", "trae"]) {
    if (await commandExists(cmd))
      return cmd;
  }
  throw new Error("\u672A\u627E\u5230\u53EF\u7528\u7684 GUI IDE\uFF0C\u8BF7\u5728 ~/.p/config.yaml \u4E2D\u914D\u7F6E editor \u5B57\u6BB5\uFF08\u5982 editor: cursor\uFF09");
}
async function selectAndOpenProjects(ide, options, name) {
  const projects = listProjects();
  if (projects.length === 0) {
    console.log();
    printInfo(`\u6682\u65E0\u9879\u76EE\uFF0C\u4F7F\u7528 ${brand.primary("p new")} \u521B\u5EFA\u65B0\u9879\u76EE`);
    console.log();
    return;
  }
  let projectNames;
  if (!name) {
    projectNames = await searchAndSelect(projects);
  } else if (!projectExists(name)) {
    const filtered = filterProjects(projects, name);
    if (filtered.length === 1) {
      const matchedName = filtered[0]?.name ?? name;
      console.log(import_picocolors21.default.dim("  \u5339\u914D\u5230: ") + brand.primary(matchedName));
      projectNames = [matchedName];
    } else if (filtered.length > 1) {
      console.log(import_picocolors21.default.dim(`  \u5339\u914D\u5230 ${filtered.length} \u4E2A\u9879\u76EE`));
      projectNames = await searchAndSelect(projects, name);
    } else {
      printError(`\u9879\u76EE\u4E0D\u5B58\u5728: ${name}`);
      console.log(import_picocolors21.default.dim("\u4F7F\u7528 ") + brand.primary("p ls") + import_picocolors21.default.dim(" \u67E5\u770B\u6240\u6709\u9879\u76EE"));
      process.exit(1);
    }
  } else {
    projectNames = [name];
  }
  if (projectNames.length > 1) {
    for (const pName of projectNames) {
      try {
        await openWithIDE(ide, getProjectPath(pName));
        console.log(`${brand.success("\u2713")} \u5DF2\u6253\u5F00: ${brand.primary(pName)}`);
      } catch (error) {
        printError(`${pName}: ${error.message}`);
      }
    }
    return;
  }
  const projectName = projectNames[0] ?? name ?? "";
  const projectPath = getProjectPath(projectName);
  const currentDir = process.cwd();
  if (projectPath === currentDir) {
    console.log();
    printInfo(`\u5DF2\u5728\u9879\u76EE\u76EE\u5F55: ${brand.primary(projectName)}`);
    console.log();
    return;
  }
  const meta = getProjectMeta(projectName);
  if (meta?.originalPath && import_fs_extra17.default.existsSync(meta.originalPath)) {
    const shouldDelete = await ye({
      message: `\u68C0\u6D4B\u5230\u539F\u59CB\u8DEF\u5F84\u4ECD\u5B58\u5728: ${import_picocolors21.default.underline(meta.originalPath)}
  \u662F\u5426\u5220\u9664\u539F\u59CB\u76EE\u5F55\uFF1F`,
      initialValue: false
    });
    if (!pD(shouldDelete) && shouldDelete) {
      const s2 = Y2();
      s2.start("\u6B63\u5728\u5220\u9664\u539F\u59CB\u76EE\u5F55...");
      try {
        await import_fs_extra17.default.remove(meta.originalPath);
        clearOriginalPath(projectName);
        s2.stop("\u539F\u59CB\u76EE\u5F55\u5DF2\u5220\u9664");
      } catch (error) {
        s2.stop("\u5220\u9664\u539F\u59CB\u76EE\u5F55\u5931\u8D25");
        printError(error.message);
      }
    }
  }
  if (isTUICommand(ide)) {
    try {
      await openWithIDE(ide, projectPath, !!options?.ide);
    } catch (error) {
      console.log();
      printError(error.message);
      console.log();
      console.log(import_picocolors21.default.dim("  \u9879\u76EE\u8DEF\u5F84: ") + import_picocolors21.default.underline(projectPath));
      console.log();
      process.exit(1);
    }
    return;
  }
  const s = Y2();
  s.start(`\u6B63\u5728\u6253\u5F00...`);
  try {
    const { resolved } = await openWithIDE(ide, projectPath, !!options?.ide);
    s.stop(`${brand.success("\u2713")} \u5DF2\u7528 ${brand.primary(resolved)} \u6253\u5F00: ${brand.secondary(projectName)}`);
  } catch (error) {
    s.stop("\u6253\u5F00\u5931\u8D25");
    console.log();
    printError(error.message);
    console.log();
    console.log(import_picocolors21.default.dim("  \u9879\u76EE\u8DEF\u5F84: ") + import_picocolors21.default.underline(projectPath));
    console.log();
    process.exit(1);
  }
}
var openCommand = new Command("open").alias("o").description("\u6253\u5F00\u9879\u76EE\uFF08\u9ED8\u8BA4 GUI IDE \u6253\u5F00\uFF0Cp o :claude \u53EF\u7528 Claude Code \u6253\u5F00\uFF09").argument("[name]", "\u9879\u76EE\u540D\u79F0\u3001\u641C\u7D22\u5173\u952E\u8BCD\uFF0C\u6216 :ide \u5FEB\u901F\u5207\u6362").option("-i, --ide <ide>", "\u6307\u5B9A IDE").action(async (name, options) => {
  const config = loadConfig();
  if (name?.startsWith(":")) {
    const ide2 = name.slice(1);
    if (isTUICommand(ide2)) {
      try {
        await openWithIDE(ide2, process.cwd(), true);
      } catch (error) {
        printError(error.message);
        process.exit(1);
      }
      return;
    }
    const s = Y2();
    s.start(`\u6B63\u5728\u67E5\u627E ${ide2}...`);
    try {
      const { resolved } = await openWithIDE(ide2, process.cwd(), true);
      s.stop(`${brand.success("\u2713")} \u5DF2\u7528 ${brand.primary(resolved)} \u6253\u5F00\u5F53\u524D\u76EE\u5F55`);
    } catch (error) {
      s.stop("\u6253\u5F00\u5931\u8D25");
      printError(error.message);
      process.exit(1);
    }
    return;
  }
  const ide = await resolveOpenIde(config, options).catch((error) => {
    printError(error.message);
    process.exit(1);
  });
  if (name === ".") {
    if (isTUICommand(ide)) {
      try {
        await openWithIDE(ide, process.cwd(), !!options?.ide);
      } catch (error) {
        printError(error.message);
        process.exit(1);
      }
      return;
    }
    const s = Y2();
    s.start(`\u6B63\u5728\u6253\u5F00...`);
    try {
      const { resolved } = await openWithIDE(ide, process.cwd(), !!options?.ide);
      s.stop(`${brand.success("\u2713")} \u5DF2\u7528 ${brand.primary(resolved)} \u6253\u5F00\u5F53\u524D\u76EE\u5F55`);
    } catch (error) {
      s.stop("\u6253\u5F00\u5931\u8D25");
      printError(error.message);
      process.exit(1);
    }
    return;
  }
  await selectAndOpenProjects(ide, options, name);
});

// src/commands/path.ts
init_esm();
var import_picocolors22 = __toESM(require_picocolors(), 1);
var pathCommand = new Command("path").alias("p").alias("pp").description("\u6253\u5370\u9879\u76EE\u7EDD\u5BF9\u8DEF\u5F84\uFF08\u652F\u6301\u6A21\u7CCA\u5339\u914D\uFF09").argument("<name>", "\u9879\u76EE\u540D\u79F0\u6216\u641C\u7D22\u5173\u952E\u8BCD").action((name) => {
  const projects = listProjects();
  if (projects.length === 0) {
    printError("\u6682\u65E0\u9879\u76EE");
    process.exit(1);
  }
  let projectName;
  if (projectExists(name)) {
    projectName = name;
  } else {
    const filtered = filterProjects(projects, name);
    if (filtered.length === 0) {
      printError(`\u9879\u76EE\u4E0D\u5B58\u5728: ${name}`);
      console.error(import_picocolors22.default.dim("\u4F7F\u7528 ") + brand.primary("p ls") + import_picocolors22.default.dim(" \u67E5\u770B\u6240\u6709\u9879\u76EE"));
      process.exit(1);
    }
    if (filtered.length > 1) {
      printError(`\u5339\u914D\u5230 ${filtered.length} \u4E2A\u9879\u76EE\uFF0C\u8BF7\u7CBE\u786E\u6307\u5B9A:`);
      for (const p2 of filtered) {
        console.error(`  ${brand.secondary("\u2022")} ${p2.name} ${projectHint(p2)}`);
      }
      process.exit(1);
    }
    projectName = filtered[0]?.name ?? "";
  }
  process.stdout.write(`${getProjectPath(projectName)}
`);
});

// src/commands/project.ts
init_esm();
var import_fs_extra18 = __toESM(require_lib(), 1);
var import_picocolors23 = __toESM(require_picocolors(), 1);
var projectCommand = new Command("project").alias("projects").description("\u6253\u5F00\u9879\u76EE\u76EE\u5F55").action(async () => {
  const config = loadConfig();
  await import_fs_extra18.default.ensureDir(PROJECTS_DIR);
  if (isTUICommand(config.ide)) {
    try {
      await openWithIDE(config.ide, PROJECTS_DIR);
    } catch (error) {
      printError(error.message);
      console.log(import_picocolors23.default.dim("  \u9879\u76EE\u76EE\u5F55: ") + import_picocolors23.default.underline(PROJECTS_DIR));
      process.exit(1);
    }
    return;
  }
  const s = Y2();
  s.start(`\u6B63\u5728\u7528 ${config.ide} \u6253\u5F00\u9879\u76EE\u76EE\u5F55...`);
  try {
    await openWithIDE(config.ide, PROJECTS_DIR);
    s.stop(`${brand.success("\u2713")} \u5DF2\u6253\u5F00\u9879\u76EE\u76EE\u5F55: ${brand.primary(PROJECTS_DIR)}`);
  } catch (error) {
    s.stop("\u6253\u5F00\u5931\u8D25");
    console.log();
    printError(error.message);
    console.log();
    console.log(import_picocolors23.default.dim("  \u9879\u76EE\u76EE\u5F55: ") + import_picocolors23.default.underline(PROJECTS_DIR));
    console.log();
    process.exit(1);
  }
});

// src/commands/publish.ts
import { homedir as homedir4 } from "os";
import { basename as basename4, join as join13 } from "path";
init_esm();
var import_fs_extra20 = __toESM(require_lib(), 1);
var import_picocolors24 = __toESM(require_picocolors(), 1);

// src/utils/git.ts
var import_fs_extra19 = __toESM(require_lib(), 1);
import { join as join12 } from "path";
async function removeNestedGitDirs(cwd) {
  let count = 0;
  const findResult = await execAndCapture("find . -mindepth 2 -name '.git' -type d", cwd);
  if (findResult.success) {
    const dirs = findResult.output.trim().split(`
`).filter(Boolean);
    for (const d3 of dirs) {
      const parentDir = d3.replace(/^\.\//, "").replace(/\/\.git$/, "");
      await import_fs_extra19.default.remove(join12(cwd, d3));
      await execAndCapture(`git rm --cached "${parentDir}" 2>/dev/null`, cwd);
      count++;
    }
  }
  const lsResult = await execAndCapture("git ls-files -s | grep '^160000'", cwd);
  if (lsResult.success) {
    const gitlinks = lsResult.output.trim().split(`
`).filter(Boolean);
    for (const line of gitlinks) {
      const path = line.split("\t")[1];
      if (path) {
        await execAndCapture(`git rm --cached "${path}" 2>/dev/null`, cwd);
        count++;
      }
    }
  }
  return count;
}

// src/commands/publish.ts
async function git(args, cwd) {
  const proc = Bun.spawn(["git", ...args], {
    cwd,
    stdout: "pipe",
    stderr: "pipe"
  });
  const code = await proc.exited;
  const out = await new Response(proc.stdout).text();
  const err = await new Response(proc.stderr).text();
  return { ok: code === 0, output: err || out };
}
async function getGitRemoteUrl(projectPath) {
  const result = await execAndCapture("git remote get-url origin", projectPath);
  return result.success ? result.output.trim() : null;
}
async function publishWithRemote(projectPath, templateName) {
  const remoteUrl = await getGitRemoteUrl(projectPath);
  if (!remoteUrl)
    return false;
  const match = remoteUrl.match(/github\.com[/:]([^/]+)\/(.+?)(?:\.git)?$/);
  if (!match)
    return false;
  const [, owner = "", repo = ""] = match;
  const cleanRepo = repo.replace(/\.git$/, "");
  Ie(bgOrange(" \u53D1\u5E03\u6A21\u677F "));
  console.log(import_picocolors24.default.dim("  \u4ED3\u5E93: ") + brand.primary(`${owner}/${cleanRepo}`));
  console.log();
  const shouldPublish = await ye({
    message: `\u662F\u5426\u5C06 ${brand.primary(templateName)} \u63A8\u9001\u5230\u8FDC\u7A0B\uFF1F`
  });
  if (pD(shouldPublish) || !shouldPublish) {
    Se(import_picocolors24.default.dim("\u5DF2\u53D6\u6D88"));
    return true;
  }
  const s = Y2();
  s.start("\u6B63\u5728\u63A8\u9001...");
  const removed = await removeNestedGitDirs(projectPath);
  if (removed > 0) {
    console.log(import_picocolors24.default.dim(`  \u5DF2\u6E05\u7406 ${removed} \u4E2A\u5D4C\u5957 .git \u76EE\u5F55`));
  }
  const addResult = await git(["add", "-A"], projectPath);
  if (!addResult.ok) {
    s.stop("git add \u5931\u8D25");
    printError(addResult.output);
    return true;
  }
  await git(["commit", "-m", "Update"], projectPath);
  let pushResult = await git(["push", "origin", "HEAD"], projectPath);
  if (!pushResult.ok) {
    console.log(import_picocolors24.default.dim("  \u26A0 \u666E\u901A\u63A8\u9001\u5931\u8D25\uFF0C\u6B63\u5728\u5F3A\u5236\u63A8\u9001..."));
    pushResult = await git(["push", "--force", "origin", "HEAD"], projectPath);
  }
  if (!pushResult.ok) {
    s.stop("\u63A8\u9001\u5931\u8D25");
    printError(pushResult.output);
    return true;
  }
  const branchResult = await git(["branch", "--show-current"], projectPath);
  const branch = branchResult.output.trim();
  s.stop(`${brand.success("\u2713")} \u5DF2\u63A8\u9001\u5230\u8FDC\u7A0B (${branch})`);
  markTemplatePublished(templateName, owner, cleanRepo);
  console.log();
  console.log(import_picocolors24.default.dim("  \u514B\u9686\u94FE\u63A5: ") + import_picocolors24.default.underline(`https://github.com/${owner}/${cleanRepo}.git`));
  console.log();
  return true;
}
async function publishNewRepo(projectPath, templateName, saveAsLocal) {
  Ie(bgOrange(" \u53D1\u5E03\u6A21\u677F "));
  console.log(import_picocolors24.default.dim("  \u6A21\u677F: ") + brand.primary(templateName));
  console.log();
  const shouldPublish = await ye({
    message: `\u786E\u8BA4\u5C06 ${brand.primary(templateName)} \u53D1\u5E03\u5230 GitHub\uFF1F`
  });
  if (pD(shouldPublish) || !shouldPublish) {
    Se(import_picocolors24.default.dim("\u5DF2\u53D6\u6D88"));
    return;
  }
  const sPrepare = Y2();
  sPrepare.start("\u6B63\u5728\u51C6\u5907...");
  const { success, files, message } = await collectProjectFiles(projectPath);
  if (!success || files.length === 0) {
    sPrepare.stop("\u6536\u96C6\u6587\u4EF6\u5931\u8D25");
    printError(message || "\u9879\u76EE\u6CA1\u6709\u6587\u4EF6");
    return;
  }
  sPrepare.stop(`${brand.success("\u2713")} \u627E\u5230 ${files.length} \u4E2A\u6587\u4EF6`);
  if (saveAsLocal) {
    await import_fs_extra20.default.ensureDir(TEMPLATES_DIR);
    await copyFiles(projectPath, join13(TEMPLATES_DIR, templateName), files);
    Ie(bgOrange(" \u6DFB\u52A0\u6A21\u677F "));
    console.log(import_picocolors24.default.dim(`  \u6A21\u677F\u4F4D\u7F6E: ${TEMPLATES_DIR}/${templateName}`));
    console.log();
  }
  const tmpDir = join13(homedir4(), ".p", ".tmp-publish");
  await import_fs_extra20.default.remove(tmpDir).catch(() => {});
  await import_fs_extra20.default.ensureDir(tmpDir);
  for (const file of files) {
    const src = join13(projectPath, file);
    const dest = join13(tmpDir, file);
    if (await import_fs_extra20.default.pathExists(src)) {
      await import_fs_extra20.default.ensureDir(join13(tmpDir, file.split("/").slice(0, -1).join("/")));
      await import_fs_extra20.default.copyFile(src, dest);
    }
  }
  const sCreate = Y2();
  sCreate.start("\u6B63\u5728\u521B\u5EFA GitHub \u4ED3\u5E93...");
  const proc = Bun.spawn([
    "gh",
    "repo",
    "create",
    templateName,
    "--public",
    "--description",
    `p template: ${templateName}`
  ], { cwd: process.cwd(), stdout: "pipe", stderr: "pipe" });
  const exitCode = await proc.exited;
  const stdout = await new Response(proc.stdout).text();
  const stderr = await new Response(proc.stderr).text();
  const output = stdout + stderr;
  let owner = "";
  const urlMatch = output.match(/https:\/\/github\.com\/([^/]+)\/[^\s/]+/);
  if (urlMatch) {
    owner = urlMatch[1] ?? owner;
  } else {
    const whoami = await execAndCapture("gh api user --jq .login", process.cwd());
    owner = whoami.success ? whoami.output.trim() : "";
  }
  if (!owner) {
    sCreate.stop("\u83B7\u53D6 GitHub \u7528\u6237\u540D\u5931\u8D25");
    printError(output || "\u8BF7\u786E\u8BA4\u5DF2\u5B89\u88C5\u5E76\u767B\u5F55 GitHub CLI (gh)");
    await import_fs_extra20.default.remove(tmpDir).catch(() => {});
    return;
  }
  if (exitCode !== 0 && !output.includes("Name already exists")) {
    sCreate.stop("\u521B\u5EFA\u4ED3\u5E93\u5931\u8D25");
    printError(output);
    await import_fs_extra20.default.remove(tmpDir).catch(() => {});
    return;
  }
  const cloneUrl = `https://github.com/${owner}/${templateName}.git`;
  if (exitCode === 0) {
    sCreate.stop(`${brand.success("\u2713")} \u4ED3\u5E93\u5DF2\u521B\u5EFA: ${brand.primary(`${owner}/${templateName}`)}`);
  } else {
    sCreate.stop(`${brand.success("\u2713")} \u4ED3\u5E93\u5DF2\u5B58\u5728: ${brand.primary(`${owner}/${templateName}`)}`);
  }
  const sPush = Y2();
  sPush.start("\u6B63\u5728\u63A8\u9001\u6587\u4EF6...");
  await git(["init"], tmpDir);
  await git(["remote", "add", "origin", cloneUrl], tmpDir);
  await git(["add", "-A"], tmpDir);
  await git(["commit", "-m", "init: p template"], tmpDir);
  const branchResult = await git(["branch", "--show-current"], tmpDir);
  const branch = branchResult.output.trim() || "main";
  let pushResult = await git(["push", "-u", "--force", "origin", branch], tmpDir);
  if (!pushResult.ok && branch === "main") {
    await git(["branch", "-M", "master"], tmpDir);
    pushResult = await git(["push", "-u", "--force", "origin", "master"], tmpDir);
  }
  if (!pushResult.ok) {
    sPush.stop("\u63A8\u9001\u5931\u8D25");
    printError(pushResult.output);
    await import_fs_extra20.default.remove(tmpDir).catch(() => {});
    return;
  }
  await import_fs_extra20.default.remove(tmpDir).catch(() => {});
  markTemplatePublished(templateName, owner, templateName);
  sPush.stop(`${brand.success("\u2713")} \u5DF2\u63A8\u9001 ${brand.primary(files.length.toString())} \u4E2A\u6587\u4EF6`);
  if (saveAsLocal) {
    const projects = listProjects();
    const currentProject = projects.find((p2) => p2.path === projectPath);
    if (currentProject) {
      saveProjectMeta(currentProject.name, { savedTemplate: templateName });
    }
  }
  console.log();
  console.log(import_picocolors24.default.dim("  \u514B\u9686\u94FE\u63A5: ") + import_picocolors24.default.underline(cloneUrl));
  console.log();
}
var publishCommand = new Command("publish").description("\u53D1\u5E03\u9879\u76EE\u4E3A GitHub \u6A21\u677F\u4ED3\u5E93").argument("[name]", "\u9879\u76EE\u540D\u79F0\u6216 . \u8868\u793A\u5F53\u524D\u76EE\u5F55").argument("[template-name]", "\u6A21\u677F\u540D\u79F0\uFF08\u4E0D\u6307\u5B9A\u5219\u4F7F\u7528\u9879\u76EE\u540D\uFF09").option("--save", "\u540C\u65F6\u4FDD\u5B58\u4E3A\u672C\u5730\u6A21\u677F").action(async (name, templateNameArg, options) => {
  let projectPath;
  let projectName;
  if (name === ".") {
    projectPath = process.cwd();
    projectName = basename4(projectPath);
  } else if (name) {
    const projects = listProjects();
    if (!projects.find((p2) => p2.name === name)) {
      const filtered = filterProjects(projects, name);
      if (filtered.length === 1) {
        projectName = filtered[0]?.name ?? "";
      } else {
        printError(`\u9879\u76EE\u4E0D\u5B58\u5728: ${name}`);
        process.exit(1);
      }
    } else {
      projectName = name;
    }
    projectPath = getProjectPath(projectName);
  } else {
    const projects = listProjects();
    const currentProject = projects.find((p2) => p2.path === process.cwd());
    if (currentProject) {
      projectPath = currentProject.path;
      projectName = currentProject.name;
    } else {
      projectPath = process.cwd();
      projectName = basename4(projectPath);
    }
  }
  const templateName = templateNameArg || projectName;
  const hasRemote = await getGitRemoteUrl(projectPath);
  if (hasRemote) {
    const handled = await publishWithRemote(projectPath, templateName);
    if (handled)
      return;
  }
  await publishNewRepo(projectPath, templateName, !!options?.save);
});

// src/commands/push.ts
import { basename as basename5 } from "path";
init_esm();
var import_picocolors25 = __toESM(require_picocolors(), 1);
async function git2(args, cwd) {
  const proc = Bun.spawn(["git", ...args], {
    cwd,
    stdout: "pipe",
    stderr: "pipe"
  });
  const code = await proc.exited;
  const out = await new Response(proc.stdout).text();
  const err = await new Response(proc.stderr).text();
  return { ok: code === 0, output: err || out };
}
async function ensureRemote(projectPath, projectName, auto) {
  const existing = await execAndCapture("git remote get-url origin", projectPath);
  if (existing.success)
    return existing.output.trim();
  const whoami = await execAndCapture("gh api user --jq .login", process.cwd());
  const owner = whoami.success ? whoami.output.trim() : "";
  if (!owner) {
    printError("\u8BF7\u5148\u5B89\u88C5\u5E76\u767B\u5F55 GitHub CLI (gh)");
    process.exit(1);
  }
  const fullRepo = `${owner}/${projectName}`;
  if (!auto) {
    const should = await ye({
      message: `\u5C06\u521B\u5EFA\u79C1\u6709\u4ED3\u5E93 ${fullRepo}\uFF0C\u662F\u5426\u7EE7\u7EED\uFF1F`,
      initialValue: true
    });
    if (!should)
      return null;
  }
  const s = Y2();
  s.start(`\u6B63\u5728\u521B\u5EFA\u79C1\u6709\u4ED3\u5E93 ${fullRepo}...`);
  const proc = Bun.spawn([
    "gh",
    "repo",
    "create",
    projectName,
    "--private",
    "--description",
    `p: ${projectName}`
  ], { cwd: process.cwd(), stdout: "pipe", stderr: "pipe" });
  await proc.exited;
  const stdout = await new Response(proc.stdout).text();
  const stderr = await new Response(proc.stderr).text();
  const urlMatch = (stdout + stderr).match(/https:\/\/github\.com\/([^/]+)\/[^\s/]+/);
  const repoOwner = urlMatch ? urlMatch[1] : owner;
  const cloneUrl = `https://github.com/${repoOwner}/${projectName}.git`;
  await git2(["remote", "add", "origin", cloneUrl], projectPath);
  s.stop(`${brand.success("\u2713")} \u5DF2\u521B\u5EFA\u79C1\u6709\u4ED3\u5E93: ${brand.primary(`${repoOwner}/${projectName}`)}`);
  console.log();
  return cloneUrl;
}
var pushCommand = new Command("push").alias("pu").description("\u63D0\u4EA4\u5E76\u63A8\u9001\u9879\u76EE\u4EE3\u7801\u5230 remote origin\uFF08\u65E0 remote \u5219\u8BE2\u95EE\u521B\u5EFA\u79C1\u6709\u4ED3\u5E93\uFF09").argument("[name]", "\u9879\u76EE\u540D\u79F0\u6216 . \u8868\u793A\u5F53\u524D\u76EE\u5F55").option("-a, --auto", "\u8DF3\u8FC7\u6240\u6709\u8BE2\u95EE\uFF0C\u6309\u9ED8\u8BA4\u884C\u4E3A\u6267\u884C").action(async (name, options = {}) => {
  let projectPath;
  let projectName;
  if (name === ".") {
    projectPath = process.cwd();
    projectName = basename5(projectPath);
  } else if (name) {
    const projects = listProjects();
    const exact = projects.find((p2) => p2.name === name);
    if (exact) {
      projectName = exact.name;
      projectPath = exact.path;
    } else {
      const filtered = filterProjects(projects, name);
      if (filtered.length === 1) {
        projectName = filtered[0]?.name ?? "";
        projectPath = filtered[0]?.path ?? "";
      } else {
        printError(`\u9879\u76EE\u4E0D\u5B58\u5728: ${name}`);
        process.exit(1);
      }
    }
  } else {
    projectPath = process.cwd();
    const currentProject = listProjects().find((p2) => p2.path === projectPath);
    projectName = currentProject?.name || basename5(projectPath);
  }
  Ie(bgOrange(` Push \xB7 ${projectName} `));
  const inGitRepo = (await git2(["rev-parse", "--is-inside-work-tree"], projectPath)).ok;
  if (!inGitRepo) {
    const initResult = await git2(["init", "-b", "main"], projectPath);
    if (!initResult.ok) {
      printError(`git init \u5931\u8D25: ${initResult.output}`);
      process.exit(1);
    }
    console.log(import_picocolors25.default.dim("  \u5DF2\u521D\u59CB\u5316 git \u4ED3\u5E93 (main)"));
  }
  const remoteUrl = await ensureRemote(projectPath, projectName, options.auto === true);
  if (!remoteUrl) {
    console.log();
    Se(import_picocolors25.default.dim("\u5DF2\u53D6\u6D88"));
    return;
  }
  console.log(import_picocolors25.default.dim("  remote:   ") + import_picocolors25.default.underline(remoteUrl));
  console.log();
  const removed = await removeNestedGitDirs(projectPath);
  if (removed > 0) {
    console.log(import_picocolors25.default.dim(`  \u5DF2\u6E05\u7406 ${removed} \u4E2A\u5D4C\u5957 .git \u76EE\u5F55`));
  }
  const s1 = Y2();
  s1.start("\u6B63\u5728\u6682\u5B58\u6587\u4EF6...");
  const addResult = await git2(["add", "-A"], projectPath);
  if (!addResult.ok) {
    s1.stop("\u6682\u5B58\u5931\u8D25");
    printError(addResult.output);
    process.exit(1);
  }
  s1.stop(`${brand.success("\u2713")} \u5DF2\u6682\u5B58`);
  const stagedCheck = await git2(["diff", "--cached", "--quiet"], projectPath);
  const hasStaged = !stagedCheck.ok;
  if (hasStaged) {
    const s2 = Y2();
    s2.start("\u6B63\u5728\u63D0\u4EA4...");
    const commitResult = await git2(["commit", "-m", "update"], projectPath);
    if (!commitResult.ok) {
      s2.stop("\u63D0\u4EA4\u5931\u8D25");
      printError(commitResult.output);
      process.exit(1);
    }
    s2.stop(`${brand.success("\u2713")} \u5DF2\u63D0\u4EA4`);
  } else {
    console.log(import_picocolors25.default.dim("  \u6CA1\u6709\u53D8\u66F4\u9700\u8981\u63D0\u4EA4"));
  }
  const aheadCheck = await git2(["rev-list", "--count", "@{u}..HEAD"], projectPath);
  const hasUpstream = aheadCheck.ok;
  const aheadCount = hasUpstream ? Number.parseInt(aheadCheck.output.trim(), 10) || 0 : 0;
  if (!hasStaged && hasUpstream && aheadCount === 0) {
    console.log();
    Se(brand.success("\u65E0\u9700\u63A8\u9001"));
    return;
  }
  const s3 = Y2();
  s3.start("\u6B63\u5728\u63A8\u9001...");
  let pushResult = await git2(["push", "origin", "HEAD"], projectPath);
  if (!pushResult.ok) {
    console.log(import_picocolors25.default.dim("  \u666E\u901A\u63A8\u9001\u5931\u8D25\uFF0C\u5C1D\u8BD5\u5F3A\u5236\u63A8\u9001..."));
    pushResult = await git2(["push", "--force", "origin", "HEAD"], projectPath);
  }
  if (!pushResult.ok) {
    s3.stop("\u63A8\u9001\u5931\u8D25");
    printError(pushResult.output);
    process.exit(1);
  }
  const branchResult = await git2(["branch", "--show-current"], projectPath);
  const branch = branchResult.output.trim();
  s3.stop(`${brand.success("\u2713")} \u5DF2\u63A8\u9001\u5230\u8FDC\u7A0B (${branch})`);
  console.log();
  Se(brand.success("\u2728 \u63A8\u9001\u6210\u529F"));
});

// src/commands/recent.ts
init_esm();
var import_fs_extra21 = __toESM(require_lib(), 1);
var import_picocolors26 = __toESM(require_picocolors(), 1);
var import_sisteransi5 = __toESM(require_src(), 1);
import * as readline3 from "readline";
import { Writable as Writable3 } from "stream";
var MAX_VISIBLE3 = 10;
var recentCommand = new Command("recent").alias("re").description("\u67E5\u770B\u6700\u8FD1\u9879\u76EE").action(async () => {
  const config = loadConfig();
  const projects = listProjects();
  if (projects.length === 0) {
    console.log();
    printInfo(`\u6682\u65E0\u9879\u76EE\uFF0C\u4F7F\u7528 ${brand.primary("p new")} \u521B\u5EFA\u65B0\u9879\u76EE`);
    console.log();
    return;
  }
  const recent = projects.slice(0, config.recentCount ?? 5);
  const stdin = process.stdin;
  const stdout = process.stdout;
  const interceptStream = new Writable3({
    write(_chunk, _encoding, callback) {
      callback();
    }
  });
  stdin.setRawMode(true);
  stdin.resume();
  stdout.write(import_sisteransi5.cursor.hide);
  const rl = readline3.createInterface({
    input: stdin,
    output: interceptStream,
    terminal: true
  });
  readline3.emitKeypressEvents(stdin, rl);
  let selectedIndex = 0;
  let scrollOffset = 0;
  let blockHeight = 0;
  let done = false;
  const currentProjects = recent;
  let mode = "list";
  function render() {
    const parts = [];
    if (blockHeight > 0)
      parts.push(import_sisteransi5.cursor.up(blockHeight));
    const lines = [];
    lines.push(`  ${brand.secondary("\u25C6")} \u6700\u8FD1\u9879\u76EE ${import_picocolors26.default.dim(`(${currentProjects.length})`)}`);
    lines.push(`  ${brand.secondary("\u2502")}`);
    const visibleCount = Math.min(MAX_VISIBLE3, currentProjects.length - scrollOffset);
    const visible = currentProjects.slice(scrollOffset, scrollOffset + visibleCount);
    for (let i = 0;i < visible.length; i++) {
      const idx = scrollOffset + i;
      const isSelected = idx === selectedIndex;
      const p2 = visible[i];
      if (!p2)
        continue;
      const marker = isSelected ? brand.primary("\u25C9") : import_picocolors26.default.dim("\u25CB");
      const name = isSelected ? brand.bold(p2.name) : p2.name;
      const time = import_picocolors26.default.dim(`  ${formatRelativeTime(p2.modifiedAt)}`);
      const note = p2.firstPrompt ? import_picocolors26.default.dim(` \u2014 ${truncateByWidth(p2.firstPrompt, 40)}`) : "";
      const tpl = p2.template ? ` ${import_picocolors26.default.cyan(`[${p2.template}]`)}` : "";
      const tags = p2.tags?.length ? ` ${import_picocolors26.default.magenta(p2.tags.map((t) => `#${t}`).join(" "))}` : "";
      lines.push(`  ${brand.secondary("\u2502")} ${marker} ${name}${tpl}${tags}${note}${time}`);
    }
    if (mode === "list") {
      lines.push(`  ${brand.secondary("\u2514")} ${import_picocolors26.default.dim("j/k \u79FB\u52A8 \xB7 o \u6253\u5F00 \xB7 d \u5220\u9664 \xB7 q \u9000\u51FA")}`);
    } else if (mode === "confirm") {
      const p2 = currentProjects[selectedIndex];
      lines.push(`  ${brand.secondary("\u2514")} ${import_picocolors26.default.yellow(`\u786E\u8BA4\u5220\u9664 ${p2?.name}\uFF1F`)} ${import_picocolors26.default.inverse(" Y ")}/n`);
    } else if (mode === "deleting") {
      lines.push(`  ${brand.secondary("\u2514")} ${import_picocolors26.default.dim("\u6B63\u5728\u5220\u9664...")}`);
    }
    for (const line of lines) {
      parts.push(`${line}\x1B[K
`);
    }
    if (blockHeight > lines.length) {
      for (let i = lines.length;i < blockHeight; i++) {
        parts.push(`\x1B[K
`);
      }
      parts.push(import_sisteransi5.cursor.up(blockHeight - lines.length));
    }
    stdout.write(parts.join(""));
    blockHeight = lines.length;
  }
  render();
  function scrollSelectedIntoView() {
    if (selectedIndex < scrollOffset) {
      scrollOffset = selectedIndex;
    } else if (selectedIndex >= scrollOffset + MAX_VISIBLE3) {
      scrollOffset = selectedIndex - MAX_VISIBLE3 + 1;
    }
  }
  function cleanup() {
    if (done)
      return;
    done = true;
    stdin.removeListener("keypress", onKey);
    stdin.setRawMode(false);
    stdin.pause();
    rl.close();
    stdout.write(import_sisteransi5.cursor.show);
  }
  function clearBlock() {
    if (blockHeight === 0)
      return;
    const parts = [];
    parts.push(import_sisteransi5.cursor.up(blockHeight));
    for (let i = 0;i < blockHeight; i++) {
      parts.push(`\x1B[2K
`);
    }
    parts.push(import_sisteransi5.cursor.up(blockHeight));
    stdout.write(parts.join(""));
    blockHeight = 0;
  }
  async function handleOpen() {
    const project = currentProjects[selectedIndex];
    if (!project)
      return;
    clearBlock();
    blockHeight = 0;
    stdout.write(`  ${brand.success("\u2713")} \u6B63\u5728\u6253\u5F00 ${brand.primary(project.name)}...
`);
    cleanup();
    try {
      await openWithIDE(config.ide, project.path);
    } catch (error) {
      stdout.write(`  ${import_picocolors26.default.red("\u2717")} ${error.message}
`);
    }
  }
  async function handleDeleteConfirm() {
    const project = currentProjects[selectedIndex];
    if (!project)
      return;
    mode = "deleting";
    render();
    try {
      await import_fs_extra21.default.remove(project.path);
      deleteProjectMeta(project.name);
      currentProjects.splice(selectedIndex, 1);
      if (selectedIndex >= currentProjects.length) {
        selectedIndex = Math.max(0, currentProjects.length - 1);
      }
      scrollSelectedIntoView();
    } catch (_error) {}
    if (currentProjects.length === 0) {
      clearBlock();
      blockHeight = 0;
      cleanup();
      console.log();
      printInfo("\u5DF2\u65E0\u9879\u76EE");
      console.log();
      return;
    }
    mode = "list";
    render();
  }
  function onKey(_char, key) {
    if (done)
      return;
    if (mode === "confirm") {
      if (key.name === "escape" || key.name === "q" || key.sequence === "\x03") {
        mode = "list";
        render();
        return;
      }
      if (key.name === "return" || key.name === "y") {
        handleDeleteConfirm();
        return;
      }
      if (key.name === "n") {
        mode = "list";
        render();
        return;
      }
      return;
    }
    if (key.sequence === "\x03" || key.name === "q" || key.name === "escape") {
      clearBlock();
      blockHeight = 0;
      cleanup();
      return;
    }
    switch (key.name) {
      case "up":
      case "k":
        if (selectedIndex > 0)
          selectedIndex--;
        scrollSelectedIntoView();
        break;
      case "down":
      case "j":
        if (selectedIndex < currentProjects.length - 1)
          selectedIndex++;
        scrollSelectedIntoView();
        break;
      case "o":
        handleOpen();
        return;
      case "d":
        mode = "confirm";
        break;
      default:
        return;
    }
    render();
  }
  stdin.on("keypress", onKey);
});

// src/commands/rename.ts
init_esm();
var import_fs_extra22 = __toESM(require_lib(), 1);
var import_picocolors27 = __toESM(require_picocolors(), 1);
async function searchAndSelect2(projects, initialQuery) {
  const options = projects.map((p2) => ({
    value: p2.name,
    label: p2.name,
    hint: projectHint(p2)
  }));
  const result = await liveSearch({
    message: "\u641C\u7D22\u8981\u91CD\u547D\u540D\u7684\u9879\u76EE:",
    placeholder: "\u8F93\u5165\u540D\u79F0\u3001\u6A21\u677F\u6216\u6807\u7B7E\u7B5B\u9009",
    options,
    filterFn: (query) => {
      if (!query)
        return options;
      const filtered = filterProjects(projects, query);
      return filtered.map((p2) => ({
        value: p2.name,
        label: p2.name,
        hint: projectHint(p2)
      }));
    },
    initialQuery
  });
  if (result === CANCEL) {
    Se(import_picocolors27.default.dim("\u5DF2\u53D6\u6D88"));
    process.exit(0);
  }
  return result[0] ?? "";
}
function extractRepoSlug(url) {
  let match = url.match(/github\.com[:/]([^/]+\/[^/]+?)(?:\.git)?$/);
  if (match)
    return match[1] ?? null;
  match = url.match(/git@[^:]+:([^/]+\/[^/]+?)(?:\.git)?$/);
  if (match)
    return match[1] ?? null;
  return null;
}
async function getRemoteOrigin(projectPath) {
  const result = await execAndCapture("git remote get-url origin", projectPath);
  if (result.success && result.output.trim()) {
    return result.output.trim();
  }
  return null;
}
async function renameGitHubRepo(oldSlug, newName) {
  const result = await execAndCapture(`gh repo rename ${newName} --repo ${oldSlug} --yes`, process.cwd());
  if (!result.success) {
    return { success: false, error: result.error || result.output };
  }
  return { success: true };
}
async function moveWithTimeout(src, dest, timeoutMs) {
  return new Promise((resolve5) => {
    const timer = setTimeout(() => {
      resolve5({
        success: false,
        error: `\u64CD\u4F5C\u8D85\u65F6\uFF08${timeoutMs / 1000}\u79D2\uFF09\uFF0C\u53EF\u80FD\u6709 IDE \u6B63\u5728\u5360\u7528\u76EE\u5F55\uFF0C\u8BF7\u5173\u95ED\u8BE5\u9879\u76EE\u7A97\u53E3\u540E\u91CD\u8BD5`
      });
    }, timeoutMs);
    import_fs_extra22.default.move(src, dest).then(() => {
      clearTimeout(timer);
      resolve5({ success: true });
    }).catch((error) => {
      clearTimeout(timer);
      resolve5({ success: false, error: error.message });
    });
  });
}
var renameCommand = new Command("rename").alias("mv").description("\u91CD\u547D\u540D\u9879\u76EE").argument("[oldName]", "\u5F53\u524D\u9879\u76EE\u540D\u79F0").argument("[newName]", "\u65B0\u9879\u76EE\u540D\u79F0").action(async (oldName, newName) => {
  const projects = listProjects();
  if (projects.length === 0) {
    console.log();
    printInfo("\u6682\u65E0\u9879\u76EE");
    console.log();
    return;
  }
  let projectName = oldName;
  if (!projectName) {
    projectName = await searchAndSelect2(projects);
  } else if (!projectExists(projectName)) {
    const filtered = filterProjects(projects, projectName);
    if (filtered.length === 1) {
      console.log(import_picocolors27.default.dim("  \u5339\u914D\u5230: ") + brand.primary(filtered[0]?.name ?? ""));
      projectName = filtered[0]?.name ?? "";
    } else if (filtered.length > 1) {
      console.log(import_picocolors27.default.dim(`  \u5339\u914D\u5230 ${filtered.length} \u4E2A\u9879\u76EE`));
      projectName = await searchAndSelect2(projects, projectName);
    } else {
      printError(`\u9879\u76EE\u4E0D\u5B58\u5728: ${projectName}`);
      console.log(import_picocolors27.default.dim("\u4F7F\u7528 ") + brand.primary("p ls") + import_picocolors27.default.dim(" \u67E5\u770B\u6240\u6709\u9879\u76EE"));
      process.exit(1);
    }
  }
  const projectPath = getProjectPath(projectName);
  let newProjectName = newName;
  if (!newProjectName) {
    const result = await he({
      message: "\u8F93\u5165\u65B0\u9879\u76EE\u540D\u79F0:",
      placeholder: projectName,
      initialValue: projectName,
      validate: (value) => {
        const v2 = validateProjectNameFormat(value);
        if (!v2.valid)
          return v2.message;
        if (value === projectName)
          return "\u65B0\u540D\u79F0\u4E0D\u80FD\u4E0E\u5F53\u524D\u540D\u79F0\u76F8\u540C";
        if (projectExists(value))
          return "\u9879\u76EE\u5DF2\u5B58\u5728";
        return;
      }
    });
    if (result === CANCEL) {
      Se(import_picocolors27.default.dim("\u5DF2\u53D6\u6D88"));
      process.exit(0);
    }
    newProjectName = result.trim();
  }
  const nameCheck = validateProjectNameFormat(newProjectName);
  if (!nameCheck.valid) {
    printError(nameCheck.message || "\u9879\u76EE\u540D\u79F0\u65E0\u6548");
    process.exit(1);
  }
  if (newProjectName === projectName) {
    printError("\u65B0\u540D\u79F0\u4E0D\u80FD\u4E0E\u5F53\u524D\u540D\u79F0\u76F8\u540C");
    process.exit(1);
  }
  if (projectExists(newProjectName)) {
    printError(`\u9879\u76EE\u5DF2\u5B58\u5728: ${newProjectName}`);
    process.exit(1);
  }
  Ie(bgOrange(" \u91CD\u547D\u540D\u9879\u76EE "));
  console.log();
  console.log(import_picocolors27.default.dim("  \u5F53\u524D\u540D\u79F0: ") + brand.secondary(projectName));
  console.log(import_picocolors27.default.dim("  \u65B0\u540D\u79F0:   ") + brand.primary(newProjectName));
  console.log();
  const s = Y2();
  s.start("\u6B63\u5728\u91CD\u547D\u540D\u672C\u5730\u76EE\u5F55...");
  const newPath = getProjectPath(newProjectName);
  const moveResult = await moveWithTimeout(projectPath, newPath, 5000);
  if (!moveResult.success) {
    s.stop("\u91CD\u547D\u540D\u5931\u8D25");
    printError(moveResult.error || "\u672A\u77E5\u9519\u8BEF");
    process.exit(1);
  }
  if (await import_fs_extra22.default.pathExists(projectPath)) {
    await import_fs_extra22.default.remove(projectPath);
  }
  const oldMeta = projects.find((p2) => p2.name === projectName);
  deleteProjectMeta(projectName);
  saveProjectMeta(newProjectName, {
    template: oldMeta?.template,
    tags: oldMeta?.tags
  });
  s.stop(`${brand.success("\u2713")} \u5DF2\u91CD\u547D\u540D: ${brand.primary(newProjectName)}`);
  const remoteUrl = await getRemoteOrigin(newPath);
  const repoSlug = remoteUrl ? extractRepoSlug(remoteUrl) : null;
  if (repoSlug) {
    const currentRepoName = repoSlug.split("/")[1];
    console.log();
    console.log(import_picocolors27.default.dim("  \u5F53\u524D\u8FDC\u7A0B\u4ED3\u5E93: ") + import_picocolors27.default.underline(`github.com/${repoSlug}`));
    console.log();
    const remoteName = await he({
      message: "\u8F93\u5165\u65B0\u7684\u8FDC\u7A0B\u4ED3\u5E93\u540D\u79F0\uFF08\u7559\u7A7A\u8DF3\u8FC7\uFF09:",
      placeholder: currentRepoName,
      initialValue: newProjectName
    });
    if (!pD(remoteName) && remoteName.trim()) {
      const finalName = remoteName.trim();
      const renameSpinner = Y2();
      renameSpinner.start("\u6B63\u5728\u91CD\u547D\u540D GitHub \u4ED3\u5E93...");
      const result = await renameGitHubRepo(repoSlug, finalName);
      if (!result.success) {
        renameSpinner.stop("\u91CD\u547D\u540D GitHub \u4ED3\u5E93\u5931\u8D25");
        printError(result.error || "\u672A\u77E5\u9519\u8BEF");
      } else {
        renameSpinner.stop(`${brand.success("\u2713")} GitHub \u4ED3\u5E93\u5DF2\u91CD\u547D\u540D\u4E3A ${brand.primary(finalName)}`);
        const owner = repoSlug.split("/")[0];
        let newRemoteUrl;
        if (remoteUrl?.includes("@")) {
          newRemoteUrl = `git@github.com:${owner}/${finalName}.git`;
        } else {
          const tokenMatch = remoteUrl?.match(/^(https?:\/\/[^@]*@)?github\.com/);
          const prefix = tokenMatch?.[1] ?? "https://github.com/";
          newRemoteUrl = `${prefix}github.com/${owner}/${finalName}.git`;
        }
        await execAndCapture(`git remote set-url origin ${newRemoteUrl}`, newPath);
      }
    }
  }
  console.log();
  Se(brand.success("\u2728 \u91CD\u547D\u540D\u5B8C\u6210\uFF01"));
});

// src/commands/run.ts
init_esm();
var import_picocolors28 = __toESM(require_picocolors(), 1);
var runCommand = new Command("run").alias("r").description("\u5728\u5F53\u524D\u9879\u76EE\u6267\u884C hooks").argument("[hooks...]", "\u8981\u6267\u884C\u7684 hook \u540D\u79F0").action(async (hookKeys) => {
  const config = loadConfig();
  const currentDir = process.cwd();
  const projects = listProjects();
  const currentProject = projects.find((p2) => p2.path === currentDir);
  if (!currentProject) {
    printError("\u5F53\u524D\u76EE\u5F55\u4E0D\u662F p \u7BA1\u7406\u7684\u9879\u76EE");
    console.log(import_picocolors28.default.dim("  \u8BF7\u5728\u9879\u76EE\u76EE\u5F55\u4E2D\u8FD0\u884C\uFF0C\u6216\u4F7F\u7528 ") + brand.primary("p open") + import_picocolors28.default.dim(" \u6253\u5F00\u9879\u76EE"));
    process.exit(1);
  }
  const allHookKeys = Object.keys(config.hooks);
  if (allHookKeys.length === 0) {
    printInfo("\u6682\u65E0\u53EF\u7528 hooks");
    console.log(import_picocolors28.default.dim("  \u5728 ") + brand.primary("~/.p/config.yaml") + import_picocolors28.default.dim(" \u4E2D\u914D\u7F6E hooks"));
    return;
  }
  if (hookKeys.length > 0) {
    const invalid = hookKeys.filter((k3) => !config.hooks[k3]);
    if (invalid.length > 0) {
      printError(`\u672A\u77E5\u7684 hook: ${invalid.join(", ")}`);
      console.log(import_picocolors28.default.dim(`  \u53EF\u7528 hooks: ${allHookKeys.join(", ")}`));
      process.exit(1);
    }
    await runHooksByKeys(config, hookKeys, currentDir, currentProject.name);
    console.log();
    console.log(brand.success("\u2713") + import_picocolors28.default.dim(` \u5DF2\u5728 ${brand.primary(currentProject.name)} \u6267\u884C ${hookKeys.length} \u4E2A hook`));
    return;
  }
  Ie(bgOrange(` \u8FD0\u884C Hooks \xB7 ${currentProject.name} `));
  const result = await fe({
    message: "\u9009\u62E9\u8981\u6267\u884C\u7684 hooks:",
    options: allHookKeys.map((key) => ({
      value: key,
      label: config.hooks[key]?.name ?? key,
      hint: key
    })),
    required: true
  });
  if (pD(result)) {
    Se(import_picocolors28.default.dim("\u5DF2\u53D6\u6D88"));
    process.exit(0);
  }
  const selected = result;
  await runHooksByKeys(config, selected, currentDir, currentProject.name);
  console.log();
  Se(brand.success(`\u2713 \u5DF2\u6267\u884C ${selected.length} \u4E2A hook`));
});

// src/commands/search.ts
init_esm();
var searchCommand = new Command("search").alias("s").description("\u6A21\u7CCA\u641C\u7D22\u9879\u76EE\uFF08\u5B9E\u65F6\u7B5B\u9009\uFF0C\u56DE\u8F66\u6253\u5F00\uFF1B\u652F\u6301\u591A\u9009\u6279\u91CF\uFF09").argument("[name]", "\u641C\u7D22\u5173\u952E\u8BCD\uFF08\u9879\u76EE\u540D/\u6A21\u677F/\u6807\u7B7E\u6A21\u7CCA\u5339\u914D\uFF09").option("-i, --ide <ide>", "\u6307\u5B9A IDE").action(async (name, options) => {
  const config = loadConfig();
  const ide = await resolveOpenIde(config, options).catch((error) => {
    printError(error.message);
    process.exit(1);
  });
  await selectAndOpenProjects(ide, options, name);
});

// src/commands/sync.ts
import { homedir as homedir5 } from "os";
import { basename as basename6, dirname as dirname4, join as join14, resolve as resolve5 } from "path";
init_esm();
var import_adm_zip = __toESM(require_adm_zip(), 1);
var import_fs_extra23 = __toESM(require_lib(), 1);
var import_picocolors29 = __toESM(require_picocolors(), 1);
var DEFAULT_SYNC_EXCLUDES = [
  "node_modules",
  ".next",
  ".nuxt",
  ".output",
  "dist",
  "build",
  "coverage",
  ".vscode",
  ".idea",
  "*.log",
  ".DS_Store",
  "Thumbs.db"
];
function getExcludes() {
  const config = loadConfig();
  return [...DEFAULT_SYNC_EXCLUDES, ...config.sync?.exclude || []];
}
var SYNC_DIR_NAME = "p-sync";
function getSyncDir() {
  return join14(getDownloadsDir(), SYNC_DIR_NAME);
}
function getDownloadsDir() {
  return join14(homedir5(), "Downloads");
}
async function promptDeletePSync() {
  const pSyncDir = join14(getDownloadsDir(), "p-sync");
  const checkResult = await execAndCapture(`test -d "${pSyncDir}" && echo exists || echo missing`, process.cwd());
  if (checkResult.output.trim() !== "exists")
    return;
  const shouldDelete = await ye({
    message: "\u662F\u5426\u5220\u9664 Downloads/p-sync \u76EE\u5F55\uFF1F",
    initialValue: true
  });
  if (!pD(shouldDelete) && shouldDelete) {
    await execAndCapture(`rm -rf "${pSyncDir}"`, process.cwd());
    console.log(import_picocolors29.default.dim("  \u5DF2\u5220\u9664 Downloads/p-sync"));
  }
}
async function searchAndSelect3(projects, initialQuery) {
  const options = projects.map((p2) => ({
    value: p2.name,
    label: p2.name,
    hint: projectHint(p2)
  }));
  const result = await liveSearch({
    message: "\u641C\u7D22\u8981\u5BFC\u51FA\u7684\u9879\u76EE:",
    placeholder: "\u8F93\u5165\u9879\u76EE\u540D\u79F0\u7B5B\u9009",
    options,
    filterFn: (query) => {
      if (!query)
        return options;
      const filtered = filterProjects(projects, query);
      return filtered.map((p2) => ({
        value: p2.name,
        label: p2.name,
        hint: projectHint(p2)
      }));
    },
    initialQuery
  });
  if (result === CANCEL) {
    Se(import_picocolors29.default.dim("\u5DF2\u53D6\u6D88"));
    process.exit(0);
  }
  return result[0] ?? "";
}
async function openInFileManager(targetPath) {
  const platform = process.platform;
  if (platform === "win32") {
    Bun.spawn(["explorer.exe", targetPath], { detached: true });
  } else if (platform === "darwin") {
    await execAndCapture(`open "${targetPath}"`, process.cwd());
  } else {
    await execAndCapture(`xdg-open "${targetPath}"`, process.cwd());
  }
}
async function scanDownloadsDir() {
  const downloadsDir = getDownloadsDir();
  const checkResult = await execAndCapture(`test -d "${downloadsDir}" && echo exists || echo missing`, process.cwd());
  if (!checkResult.success || checkResult.output.trim() !== "exists")
    return [];
  const findResult = await execAndCapture(`find "${downloadsDir}" -maxdepth 2 -name "*.zip" -type f`, process.cwd());
  if (!findResult.success)
    return [];
  const entries = findResult.output.split(`
`).filter((e2) => e2.trim());
  const zips = [];
  for (const fullPath of entries) {
    const statResult = await execAndCapture(`stat -f "%z %m" "${fullPath}"`, process.cwd());
    if (!statResult.success)
      continue;
    const [sizeStr, timeStr] = statResult.output.trim().split(" ");
    const sizeBytes = Number.parseInt(sizeStr || "0", 10);
    const sizeMB = (sizeBytes / 1024 / 1024).toFixed(1);
    zips.push({
      path: fullPath,
      name: basename6(fullPath, ".zip"),
      size: `${sizeMB}MB`,
      mtime: new Date(Number.parseFloat(timeStr || "0") * 1000)
    });
  }
  zips.sort((a, b3) => b3.mtime.getTime() - a.mtime.getTime());
  return zips;
}
function shouldExclude(name, relPath, excludes) {
  for (const pattern of excludes) {
    if (pattern.includes("*")) {
      const regex = new RegExp(`^${pattern.replace(/\*/g, ".*").replace(/\./g, "\\.")}$`);
      if (regex.test(name))
        return true;
    }
    if (name === pattern || relPath.includes(`/${pattern}/`))
      return true;
  }
  return false;
}
async function walkFiles(dir, excludes, relativePath = "") {
  const entries = await import_fs_extra23.default.readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const relPath = relativePath ? `${relativePath}/${entry.name}` : entry.name;
    if (shouldExclude(entry.name, relPath, excludes))
      continue;
    if (entry.isDirectory()) {
      const subFiles = await walkFiles(join14(dir, entry.name), excludes, relPath);
      files.push(...subFiles);
    } else {
      files.push(relPath);
    }
  }
  return files;
}
async function handleExport(name) {
  const projects = listProjects();
  const currentDir = process.cwd();
  if (name === ".") {
    const currentProject = projects.find((p2) => p2.path === currentDir);
    if (!currentProject) {
      printError("\u5F53\u524D\u76EE\u5F55\u4E0D\u662F p \u7BA1\u7406\u7684\u9879\u76EE");
      process.exit(1);
    }
    name = currentProject.name;
  }
  if (projects.length === 0) {
    printInfo("\u6682\u65E0\u9879\u76EE");
    return;
  }
  let projectName = name;
  if (projectName) {
    if (!projectExists(projectName)) {
      const filtered = filterProjects(projects, projectName);
      if (filtered.length === 1) {
        projectName = filtered[0]?.name ?? projectName;
        console.log(import_picocolors29.default.dim("  \u5339\u914D\u5230: ") + brand.primary(projectName));
      } else if (filtered.length > 1) {
        console.log(import_picocolors29.default.dim(`  \u5339\u914D\u5230 ${filtered.length} \u4E2A\u9879\u76EE`));
        projectName = await searchAndSelect3(projects, projectName);
      } else {
        printError(`\u9879\u76EE\u4E0D\u5B58\u5728: ${projectName}`);
        process.exit(1);
      }
    }
  } else {
    const currentProject = projects.find((p2) => p2.path === currentDir);
    if (currentProject) {
      projectName = currentProject.name;
    } else {
      projectName = await searchAndSelect3(projects);
    }
  }
  const projectPath = getProjectPath(projectName);
  const syncDir = getSyncDir();
  const zipPath = join14(syncDir, `${projectName}.zip`);
  Ie(bgOrange(" \u5BFC\u51FA\u9879\u76EE "));
  console.log(import_picocolors29.default.dim("  \u9879\u76EE: ") + brand.primary(projectName));
  console.log(import_picocolors29.default.dim("  \u8F93\u51FA: ") + import_picocolors29.default.underline(zipPath));
  console.log();
  const s = Y2();
  s.start("\u6B63\u5728\u6253\u5305...");
  await (process.platform === "darwin" ? execAndCapture(`rm -f "${zipPath}"`, process.cwd()) : import_fs_extra23.default.remove(zipPath).catch(() => {}));
  const isGit = await import_fs_extra23.default.pathExists(join14(projectPath, ".git"));
  let files;
  if (isGit) {
    const listResult = await execAndCapture("git ls-files --cached --modified --others --exclude-standard", projectPath);
    const gitFiles = listResult.success ? listResult.output.split(`
`).filter((f) => f.trim()) : [];
    const envResult = await execAndCapture("git ls-files --others -- .env*", projectPath);
    const envFiles = envResult.success ? envResult.output.split(`
`).filter((f) => f.trim() && !gitFiles.includes(f)) : [];
    files = [...gitFiles, ...envFiles];
  } else {
    files = await walkFiles(projectPath, getExcludes());
  }
  if (files.length === 0) {
    s.stop("\u6253\u5305\u5931\u8D25");
    printError("\u9879\u76EE\u6CA1\u6709\u53EF\u6253\u5305\u7684\u6587\u4EF6");
    process.exit(1);
  }
  const zip = new import_adm_zip.default;
  for (const file of files) {
    const fullPath = join14(projectPath, file);
    if (await import_fs_extra23.default.pathExists(fullPath)) {
      zip.addLocalFile(fullPath, dirname4(file));
    }
  }
  const tmpZip = join14(PROJECTS_DIR, `.tmp-export-${Date.now()}.zip`);
  zip.writeZip(tmpZip);
  const tmpStat = await import_fs_extra23.default.stat(tmpZip);
  const sizeMB = (tmpStat.size / 1024 / 1024).toFixed(1);
  await (process.platform === "darwin" ? execAndCapture(`mkdir -p "${syncDir}" && mv "${tmpZip}" "${zipPath}"`, process.cwd()) : import_fs_extra23.default.ensureDir(syncDir).then(() => import_fs_extra23.default.move(tmpZip, zipPath, { overwrite: true })));
  s.stop(`${brand.success("\u2713")} \u5DF2\u6253\u5305: ${brand.primary(`${sizeMB}MB`)}`);
  await openInFileManager(getSyncDir());
  console.log();
  Se(brand.success("\u2728 \u5DF2\u6253\u5F00\u540C\u6B65\u76EE\u5F55\uFF0C\u53EF\u901A\u8FC7 LocalSend \u53D1\u9001"));
}
async function importOneZip(zipPath, projectName) {
  const projectPath = getProjectPath(projectName);
  const s = Y2();
  s.start(`\u6B63\u5728\u5BFC\u5165 ${projectName}...`);
  await import_fs_extra23.default.ensureDir(projectPath);
  try {
    const tmpZip = join14(PROJECTS_DIR, `.tmp-import-${Date.now()}.zip`);
    const cpResult = await execAndCapture(`cp "${zipPath}" "${tmpZip}"`, process.cwd());
    if (!cpResult.success) {
      s.stop(`\u5BFC\u5165 ${projectName} \u5931\u8D25`);
      printError(`\u65E0\u6CD5\u8BFB\u53D6\u6587\u4EF6: ${zipPath}`);
      await import_fs_extra23.default.remove(projectPath).catch(() => {});
      return false;
    }
    const zip = new import_adm_zip.default(tmpZip);
    zip.extractAllTo(projectPath, true);
    await import_fs_extra23.default.remove(tmpZip).catch(() => {});
  } catch (error) {
    s.stop(`\u5BFC\u5165 ${projectName} \u5931\u8D25`);
    printError(error.message);
    await import_fs_extra23.default.remove(projectPath).catch(() => {});
    return false;
  }
  s.stop(`${brand.success("\u2713")} \u5DF2\u5BFC\u5165: ${brand.primary(projectName)}`);
  saveProjectMeta(projectName, { template: "sync" });
  return true;
}
async function handleImport(file) {
  if (file) {
    const zipPath = resolve5(file);
    const checkResult = await execAndCapture(`test -f "${zipPath}" && echo exists || echo missing`, process.cwd());
    if (checkResult.output.trim() !== "exists") {
      printError(`\u6587\u4EF6\u4E0D\u5B58\u5728: ${zipPath}`);
      process.exit(1);
    }
    if (!zipPath.endsWith(".zip")) {
      printError("\u8BF7\u6307\u5B9A .zip \u6587\u4EF6");
      process.exit(1);
    }
    const projectName = basename6(zipPath, ".zip");
    if (projectExists(projectName)) {
      printError(`\u9879\u76EE\u5DF2\u5B58\u5728: ${projectName}`);
      console.log(import_picocolors29.default.dim("  \u4F7F\u7528 ") + brand.primary(`p open ${projectName}`) + import_picocolors29.default.dim(" \u6253\u5F00\u5DF2\u6709\u9879\u76EE"));
      process.exit(1);
    }
    Ie(bgOrange(" \u5BFC\u5165\u9879\u76EE "));
    console.log(import_picocolors29.default.dim("  \u6587\u4EF6: ") + import_picocolors29.default.underline(zipPath));
    console.log(import_picocolors29.default.dim("  \u9879\u76EE: ") + brand.primary(projectName));
    console.log();
    const ok = await importOneZip(zipPath, projectName);
    if (ok) {
      console.log();
      await promptDeletePSync();
      Se(brand.success(`\u2728 \u9879\u76EE ${projectName} \u5BFC\u5165\u6210\u529F\uFF01`));
      console.log();
      console.log(import_picocolors29.default.dim("  \u4F7F\u7528 ") + brand.primary(`p open ${projectName}`) + import_picocolors29.default.dim(" \u6253\u5F00\u9879\u76EE"));
      console.log();
    }
    return;
  }
  Ie(bgOrange(" \u5BFC\u5165\u9879\u76EE "));
  const zips = await scanDownloadsDir();
  if (zips.length === 0) {
    printInfo("Downloads/ \u4E2D\u6CA1\u6709\u53EF\u5BFC\u5165\u7684 .zip \u6587\u4EF6");
    console.log(import_picocolors29.default.dim("  \u63D0\u793A\uFF1A\u5148\u5728\u53E6\u4E00\u53F0\u673A\u5668\u4E0A\u8FD0\u884C ") + brand.primary("p sync export") + import_picocolors29.default.dim(" \u5E76\u901A\u8FC7 LocalSend \u53D1\u9001"));
    console.log();
    return;
  }
  if (zips.length === 1) {
    const zip = zips[0];
    if (!zip)
      return;
    console.log(import_picocolors29.default.dim("  \u627E\u5230: ") + brand.primary(zip.name) + import_picocolors29.default.dim(` (${zip.size})`));
    console.log();
    if (projectExists(zip.name)) {
      printError(`\u9879\u76EE\u5DF2\u5B58\u5728: ${zip.name}`);
      console.log(import_picocolors29.default.dim("  \u4F7F\u7528 ") + brand.primary(`p open ${zip.name}`) + import_picocolors29.default.dim(" \u6253\u5F00\u5DF2\u6709\u9879\u76EE"));
      process.exit(1);
    }
    const ok = await importOneZip(zip.path, zip.name);
    if (ok) {
      console.log();
      await promptDeletePSync();
      Se(brand.success(`\u2728 \u9879\u76EE ${zip.name} \u5BFC\u5165\u6210\u529F\uFF01`));
      console.log();
      console.log(import_picocolors29.default.dim("  \u4F7F\u7528 ") + brand.primary(`p open ${zip.name}`) + import_picocolors29.default.dim(" \u6253\u5F00\u9879\u76EE"));
      console.log();
    }
    return;
  }
  console.log(import_picocolors29.default.dim(`  \u627E\u5230 ${zips.length} \u4E2A\u53EF\u5BFC\u5165\u7684\u9879\u76EE:`));
  console.log();
  const available = zips.filter((z2) => !projectExists(z2.name));
  if (available.length === 0) {
    printInfo("\u6240\u6709\u9879\u76EE\u90FD\u5DF2\u5B58\u5728");
    return;
  }
  const options = available.map((z2) => ({
    value: z2.path,
    label: z2.name,
    hint: z2.size
  }));
  const result = await fe({
    message: "\u9009\u62E9\u8981\u5BFC\u5165\u7684\u9879\u76EE:",
    options,
    required: true,
    initialValues: available.map((z2) => z2.path)
  });
  if (pD(result)) {
    Se(import_picocolors29.default.dim("\u5DF2\u53D6\u6D88"));
    return;
  }
  console.log();
  const selected = result;
  let imported = 0;
  for (const path of selected) {
    const zip = available.find((z2) => z2.path === path);
    if (!zip)
      continue;
    const ok = await importOneZip(zip.path, zip.name);
    if (ok)
      imported++;
  }
  console.log();
  if (imported === selected.length) {
    await promptDeletePSync();
    Se(brand.success(`\u2728 \u5DF2\u6210\u529F\u5BFC\u5165 ${imported} \u4E2A\u9879\u76EE`));
  } else {
    await promptDeletePSync();
    Se(`${brand.success("\u2713")} \u5DF2\u5BFC\u5165 ${imported} \u4E2A\uFF0C${selected.length - imported} \u4E2A\u5931\u8D25`);
  }
  console.log();
}
var syncCommand = new Command("sync").description("\u5BFC\u51FA/\u5BFC\u5165\u9879\u76EE\uFF08\u914D\u5408 LocalSend \u7B49\u5DE5\u5177\u5728\u5C40\u57DF\u7F51\u8FC1\u79FB\uFF09").addCommand(new Command("export").description("\u5BFC\u51FA\u9879\u76EE\u4E3A ZIP \u5230 Downloads/p-sync \u76EE\u5F55").argument("[name]", "\u9879\u76EE\u540D\u79F0\u3001. \u8868\u793A\u5F53\u524D\u76EE\u5F55").action(async (name) => {
  await handleExport(name);
})).addCommand(new Command("import").description("\u4ECE ZIP \u6587\u4EF6\u5BFC\u5165\u9879\u76EE\uFF08\u81EA\u52A8\u626B\u63CF Downloads \u76EE\u5F55\uFF09").argument("[file]", "ZIP \u6587\u4EF6\u8DEF\u5F84\uFF08\u4E0D\u6307\u5B9A\u5219\u81EA\u52A8\u626B\u63CF\uFF09").action(async (file) => {
  await handleImport(file);
}));

// src/commands/tag.ts
init_esm();
var import_picocolors30 = __toESM(require_picocolors(), 1);
function getCurrentProjectName() {
  const currentDir = process.cwd();
  const projects = listProjects();
  const current = projects.find((p2) => p2.path === currentDir);
  return current?.name || null;
}
async function addTags(tags) {
  const projectName = getCurrentProjectName();
  if (!projectName) {
    printError("\u5F53\u524D\u76EE\u5F55\u4E0D\u662F p \u7BA1\u7406\u7684\u9879\u76EE");
    process.exit(1);
  }
  let tagList = tags.map((t) => t.toLowerCase());
  if (tagList.length === 0) {
    const result = await he({
      message: "\u8F93\u5165\u6807\u7B7E\uFF08\u7A7A\u683C\u5206\u9694\uFF09:",
      placeholder: "react typescript web"
    });
    if (pD(result)) {
      Se(import_picocolors30.default.dim("\u5DF2\u53D6\u6D88"));
      process.exit(0);
    }
    tagList = result.split(/[\s,\uFF0C]+/).map((t) => t.trim().toLowerCase()).filter(Boolean);
  }
  if (tagList.length === 0) {
    printInfo("\u672A\u63D0\u4F9B\u6807\u7B7E");
    return;
  }
  const meta = getProjectMeta(projectName);
  const existing = meta?.tags || [];
  const merged = [...new Set([...existing, ...tagList])];
  const added = merged.filter((t) => !existing.includes(t));
  saveProjectMeta(projectName, { tags: merged });
  if (added.length > 0) {
    printSuccess(`\u5DF2\u4E3A ${brand.primary(projectName)} \u6DFB\u52A0\u6807\u7B7E: ${added.map((t) => import_picocolors30.default.magenta(`#${t}`)).join(" ")}`);
  } else {
    printInfo("\u6807\u7B7E\u5DF2\u5B58\u5728\uFF0C\u65E0\u65B0\u589E");
  }
}
async function removeTags(tags) {
  const projectName = getCurrentProjectName();
  if (!projectName) {
    printError("\u5F53\u524D\u76EE\u5F55\u4E0D\u662F p \u7BA1\u7406\u7684\u9879\u76EE");
    process.exit(1);
  }
  const meta = getProjectMeta(projectName);
  const existing = meta?.tags || [];
  if (existing.length === 0) {
    printInfo(`${brand.primary(projectName)} \u6CA1\u6709\u6807\u7B7E`);
    return;
  }
  let toRemove;
  if (tags.length === 0) {
    if (existing.length === 1) {
      saveProjectMeta(projectName, { tags: [] });
      printSuccess(`\u5DF2\u4ECE ${brand.primary(projectName)} \u79FB\u9664\u6807\u7B7E: ${import_picocolors30.default.magenta(`#${existing[0]}`)}`);
      return;
    }
    Ie(bgOrange(" \u79FB\u9664\u6807\u7B7E "));
    const result = await fe({
      message: "\u6309\u7A7A\u683C\u9009\u62E9\u8981\u79FB\u9664\u7684\u6807\u7B7E:",
      options: existing.map((t) => ({
        value: t,
        label: `#${t}`
      }))
    });
    if (pD(result)) {
      Se(import_picocolors30.default.dim("\u5DF2\u53D6\u6D88"));
      process.exit(0);
    }
    toRemove = result;
  } else {
    toRemove = tags.map((t) => t.toLowerCase());
  }
  if (toRemove.length === 0) {
    printInfo("\u672A\u9009\u62E9\u6807\u7B7E");
    return;
  }
  const remaining = existing.filter((t) => !toRemove.includes(t));
  saveProjectMeta(projectName, { tags: remaining });
  printSuccess(`\u5DF2\u4ECE ${brand.primary(projectName)} \u79FB\u9664\u6807\u7B7E: ${toRemove.map((t) => import_picocolors30.default.magenta(`#${t}`)).join(" ")}`);
}
async function listAllTags() {
  const projects = listProjects();
  const tagged = projects.filter((p2) => p2.tags && p2.tags.length > 0);
  if (tagged.length === 0) {
    printInfo("\u6682\u65E0\u6807\u7B7E");
    return;
  }
  const allTags = new Map;
  for (const p2 of tagged) {
    for (const tag of p2.tags ?? []) {
      if (!allTags.has(tag))
        allTags.set(tag, []);
      allTags.get(tag)?.push(p2.name);
    }
  }
  console.log();
  console.log(brand.primary("  \uD83C\uDFF7\uFE0F \u6807\u7B7E\u5217\u8868"));
  console.log(import_picocolors30.default.dim("  \u2500".repeat(20)));
  console.log();
  for (const [tag, projectNames] of allTags) {
    console.log(`  ${import_picocolors30.default.magenta(`#${tag}`)}${import_picocolors30.default.dim(` (${projectNames.length})`)}`);
    for (const name of projectNames) {
      console.log(import_picocolors30.default.dim(`    ${name}`));
    }
    console.log();
  }
}
async function showCurrentTags() {
  const projectName = getCurrentProjectName();
  if (!projectName) {
    printError("\u5F53\u524D\u76EE\u5F55\u4E0D\u662F p \u7BA1\u7406\u7684\u9879\u76EE");
    process.exit(1);
  }
  const meta = getProjectMeta(projectName);
  const tags = meta?.tags || [];
  if (tags.length === 0) {
    printInfo(`${brand.primary(projectName)} \u6CA1\u6709\u6807\u7B7E`);
    return;
  }
  console.log();
  console.log(brand.primary(`  ${projectName}`) + import_picocolors30.default.dim(":") + " " + tags.map((t) => import_picocolors30.default.magenta(`#${t}`)).join(" "));
  console.log();
}
var tagCommand = new Command("tag").alias("t").alias("tags").description("\u7BA1\u7406\u5F53\u524D\u9879\u76EE\u6807\u7B7E").action(async () => {
  await showCurrentTags();
}).addCommand(new Command("add").description("\u6DFB\u52A0\u6807\u7B7E\u5230\u5F53\u524D\u9879\u76EE").argument("[tags...]", "\u6807\u7B7E\u540D\u79F0\uFF08\u7A7A\u683C\u5206\u9694\uFF09").action(async (tags) => {
  await addTags(tags || []);
})).addCommand(new Command("rm").alias("remove").description("\u79FB\u9664\u5F53\u524D\u9879\u76EE\u6807\u7B7E").argument("[tags...]", "\u6807\u7B7E\u540D\u79F0").action(async (tags) => {
  await removeTags(tags || []);
})).addCommand(new Command("ls").alias("list").description("\u5217\u51FA\u6240\u6709\u6807\u7B7E").action(async () => {
  await listAllTags();
}));

// src/commands/template.ts
import { resolve as resolve6 } from "path";
init_esm();
var import_fs_extra24 = __toESM(require_lib(), 1);
var import_picocolors31 = __toESM(require_picocolors(), 1);
async function templateExists(templateName) {
  const templatePath = resolve6(TEMPLATES_DIR, templateName);
  return import_fs_extra24.default.pathExists(templatePath);
}
function buildTemplateOptions(projects) {
  return projects.map((p2) => ({
    value: p2.name,
    label: p2.name,
    hint: p2.savedTemplate ? import_picocolors31.default.cyan(p2.savedTemplate) : undefined
  }));
}
var templateCommand = new Command("template").alias("templates").alias("tp").description("\u7BA1\u7406\u672C\u5730\u6A21\u677F").argument("[action]", "\u64CD\u4F5C: add, update, publish").argument("[target]", "\u9879\u76EE\u540D\u79F0\u6216 . \u8868\u793A\u5F53\u524D\u76EE\u5F55").argument("[name]", "\u6A21\u677F\u540D\u79F0").action(async (action, target, name) => {
  if (!action) {
    const config = loadConfig();
    await import_fs_extra24.default.ensureDir(TEMPLATES_DIR);
    if (isTUICommand(config.ide)) {
      try {
        await openWithIDE(config.ide, TEMPLATES_DIR);
      } catch (error) {
        printError(error.message);
        console.log(import_picocolors31.default.dim("  \u6A21\u677F\u76EE\u5F55: ") + import_picocolors31.default.underline(TEMPLATES_DIR));
        process.exit(1);
      }
      return;
    }
    const s = Y2();
    s.start(`\u6B63\u5728\u7528 ${config.ide} \u6253\u5F00\u6A21\u677F\u76EE\u5F55...`);
    try {
      await openWithIDE(config.ide, TEMPLATES_DIR);
      s.stop(`${brand.success("\u2713")} \u5DF2\u6253\u5F00\u6A21\u677F\u76EE\u5F55: ${brand.primary(TEMPLATES_DIR)}`);
    } catch (error) {
      s.stop("\u6253\u5F00\u5931\u8D25");
      console.log();
      printError(error.message);
      console.log();
      console.log(import_picocolors31.default.dim("  \u6A21\u677F\u76EE\u5F55: ") + import_picocolors31.default.underline(TEMPLATES_DIR));
      console.log();
      process.exit(1);
    }
    return;
  }
  if (action === "add") {
    await handleAdd(target, name);
  } else if (action === "update") {
    await handleUpdate(target);
  } else if (action === "publish") {
    await handlePublish(target, name);
  } else {
    printError(`\u672A\u77E5\u64CD\u4F5C: ${action}`);
    console.log(import_picocolors31.default.dim("  \u652F\u6301\u7684\u64CD\u4F5C: add, update, publish"));
    process.exit(1);
  }
});
async function handleAdd(target, templateNameArg) {
  const currentDir = process.cwd();
  const projects = listProjects();
  const currentProject = projects.find((p2) => p2.path === currentDir);
  if (!target && currentProject) {
    const templateName2 = await resolveTemplateName(currentProject, templateNameArg);
    if (!templateName2)
      return;
    await createOrUpdateTemplate(currentDir, templateName2, !!currentProject.savedTemplate && currentProject.savedTemplate === templateName2);
    saveSavedTemplate(currentProject.name, templateName2);
    return;
  }
  if (target === ".") {
    const templateName2 = await resolveTemplateName(currentProject, templateNameArg);
    if (!templateName2)
      return;
    await createOrUpdateTemplate(currentDir, templateName2, !!currentProject?.savedTemplate && currentProject.savedTemplate === templateName2);
    if (currentProject)
      saveSavedTemplate(currentProject.name, templateName2);
    return;
  }
  if (projects.length === 0) {
    console.log();
    printInfo(`\u6682\u65E0\u9879\u76EE\uFF0C\u4F7F\u7528 ${brand.primary("p new")} \u521B\u5EFA\u65B0\u9879\u76EE`);
    console.log();
    return;
  }
  let selectedProject = target ?? "";
  const options = buildTemplateOptions(projects);
  if (!selectedProject) {
    const result = await liveSearch({
      message: "\u641C\u7D22\u8981\u6DFB\u52A0\u4E3A\u6A21\u677F\u7684\u9879\u76EE:",
      placeholder: "\u8F93\u5165\u9879\u76EE\u540D\u79F0\u7B5B\u9009",
      options,
      filterFn: (query) => {
        if (!query)
          return options;
        const filtered = filterProjects(projects, query);
        return filtered.map((p2) => ({
          value: p2.name,
          label: p2.name,
          hint: p2.savedTemplate ? import_picocolors31.default.cyan(p2.savedTemplate) : undefined
        }));
      }
    });
    if (result === CANCEL) {
      Se(import_picocolors31.default.dim("\u5DF2\u53D6\u6D88"));
      process.exit(0);
    }
    selectedProject = result[0] ?? "";
  } else {
    if (!projectExists(selectedProject)) {
      const filtered = filterProjects(projects, selectedProject);
      if (filtered.length === 1) {
        selectedProject = filtered[0]?.name ?? "";
      } else if (filtered.length > 1) {
        const result = await liveSearch({
          message: "\u641C\u7D22\u8981\u6DFB\u52A0\u4E3A\u6A21\u677F\u7684\u9879\u76EE:",
          placeholder: "\u8F93\u5165\u9879\u76EE\u540D\u79F0\u7B5B\u9009",
          options,
          filterFn: (query) => {
            if (!query)
              return options;
            const f = filterProjects(projects, query);
            return f.map((p2) => ({
              value: p2.name,
              label: p2.name,
              hint: p2.savedTemplate ? import_picocolors31.default.cyan(p2.savedTemplate) : undefined
            }));
          },
          initialQuery: selectedProject
        });
        if (pD(result)) {
          Se(import_picocolors31.default.dim("\u5DF2\u53D6\u6D88"));
          process.exit(0);
        }
        selectedProject = result[0] ?? "";
      } else {
        printError(`\u9879\u76EE\u4E0D\u5B58\u5728: ${selectedProject}`);
        console.log(import_picocolors31.default.dim("\u4F7F\u7528 ") + brand.primary("p ls") + import_picocolors31.default.dim(" \u67E5\u770B\u6240\u6709\u9879\u76EE"));
        process.exit(1);
      }
    }
  }
  const sourcePath = getProjectPath(selectedProject);
  const project = projects.find((p2) => p2.name === selectedProject);
  const templateName = await resolveTemplateName(project, templateNameArg);
  if (!templateName)
    return;
  await createOrUpdateTemplate(sourcePath, templateName, !!project?.savedTemplate && project.savedTemplate === templateName);
  if (project)
    saveSavedTemplate(project.name, templateName);
}
function saveSavedTemplate(projectName, templateName) {
  saveProjectMeta(projectName, { savedTemplate: templateName });
}
async function resolveTemplateName(project, templateNameArg) {
  if (templateNameArg) {
    return templateNameArg;
  }
  if (project?.savedTemplate) {
    console.log(import_picocolors31.default.dim("  \u5F53\u524D\u9879\u76EE\u5DF2\u4FDD\u5B58\u4E3A\u6A21\u677F: ") + brand.primary(project.savedTemplate));
    console.log(import_picocolors31.default.dim("  \u4E0B\u6B21\u53EF\u76F4\u63A5\u8FD0\u884C: ") + brand.primary(`p templates update .`));
    console.log();
    const shouldUpdate = await ye({
      message: `\u662F\u5426\u66F4\u65B0\u6A21\u677F ${project.savedTemplate}\uFF1F`
    });
    if (pD(shouldUpdate) || !shouldUpdate) {
      Se(import_picocolors31.default.dim("\u5DF2\u53D6\u6D88"));
      return null;
    }
    return project.savedTemplate;
  }
  const result = await he({
    message: "\u8BF7\u8F93\u5165\u6A21\u677F\u540D\u79F0:",
    placeholder: "my-template"
  });
  if (pD(result)) {
    Se(import_picocolors31.default.dim("\u5DF2\u53D6\u6D88"));
    return null;
  }
  const name = result.trim();
  if (!name) {
    printError("\u6A21\u677F\u540D\u79F0\u4E0D\u80FD\u4E3A\u7A7A");
    return null;
  }
  return name;
}
async function handleUpdate(target) {
  const currentDir = process.cwd();
  const projects = listProjects();
  const currentProject = projects.find((p2) => p2.path === currentDir);
  if (!target && currentProject?.savedTemplate) {
    await createOrUpdateTemplate(currentDir, currentProject.savedTemplate, true);
    return;
  }
  if (target === ".") {
    if (!currentProject?.savedTemplate) {
      printError("\u5F53\u524D\u9879\u76EE\u6CA1\u6709\u5173\u8054\u6A21\u677F");
      console.log(import_picocolors31.default.dim("  \u4F7F\u7528 ") + brand.primary("p templates add . <\u540D\u79F0>") + import_picocolors31.default.dim(" \u6DFB\u52A0\u4E3A\u6A21\u677F"));
      process.exit(1);
    }
    await createOrUpdateTemplate(currentDir, currentProject.savedTemplate, true);
    return;
  }
  const localTemplates = await import_fs_extra24.default.readdir(TEMPLATES_DIR).catch(() => []);
  const updatableTemplates = [];
  for (const name of localTemplates) {
    const templatePath2 = resolve6(TEMPLATES_DIR, name);
    const stat = await import_fs_extra24.default.stat(templatePath2);
    if (stat.isDirectory()) {
      updatableTemplates.push(name);
    }
  }
  if (updatableTemplates.length === 0) {
    printInfo("\u6682\u65E0\u53EF\u66F4\u65B0\u7684\u6A21\u677F");
    console.log(import_picocolors31.default.dim("  \u4F7F\u7528 ") + brand.primary("p templates add <project>") + import_picocolors31.default.dim(" \u6DFB\u52A0\u6A21\u677F"));
    return;
  }
  Ie(bgOrange(" \u66F4\u65B0\u6A21\u677F "));
  const result = await ve({
    message: "\u8BF7\u9009\u62E9\u8981\u66F4\u65B0\u7684\u6A21\u677F:",
    options: updatableTemplates.map((name) => ({
      value: name,
      label: name
    }))
  });
  if (pD(result)) {
    Se(import_picocolors31.default.dim("\u5DF2\u53D6\u6D88"));
    process.exit(0);
  }
  const selectedTemplate = result;
  const templatePath = resolve6(TEMPLATES_DIR, selectedTemplate);
  const allProjects = listProjects();
  const project = allProjects.find((p2) => p2.savedTemplate === selectedTemplate);
  if (project) {
    await createOrUpdateTemplate(project.path, selectedTemplate, true);
  } else {
    printError(`\u627E\u4E0D\u5230\u4F7F\u7528\u6A21\u677F ${selectedTemplate} \u7684\u9879\u76EE`);
    console.log(import_picocolors31.default.dim("  \u6A21\u677F\u76EE\u5F55: ") + import_picocolors31.default.underline(templatePath));
    process.exit(1);
  }
}
async function handlePublish(nameArg, templateNameArg) {
  if (nameArg === ".") {
    const currentDir = process.cwd();
    const projects = listProjects();
    const currentProject = projects.find((p2) => p2.path === currentDir);
    let templateName;
    let needSave = false;
    if (templateNameArg) {
      templateName = templateNameArg;
      needSave = true;
    } else if (currentProject?.savedTemplate) {
      templateName = currentProject.savedTemplate;
      printInfo(`\u5F53\u524D\u9879\u76EE\u5DF2\u5173\u8054\u6A21\u677F: ${brand.primary(templateName)}`);
      const shouldUpdate = await ye({ message: "\u662F\u5426\u66F4\u65B0\u6A21\u677F\uFF1F" });
      if (pD(shouldUpdate)) {
        Se(import_picocolors31.default.dim("\u5DF2\u53D6\u6D88"));
        return;
      }
      if (shouldUpdate)
        needSave = true;
    } else {
      const result = await he({
        message: "\u8BF7\u8F93\u5165\u6A21\u677F\u540D\u79F0:",
        placeholder: "my-template"
      });
      if (pD(result) || !result.trim()) {
        Se(import_picocolors31.default.dim("\u5DF2\u53D6\u6D88"));
        return;
      }
      templateName = result.trim();
      needSave = true;
    }
    if (needSave) {
      await createOrUpdateTemplate(currentDir, templateName, await templateExists(templateName));
      if (currentProject)
        saveSavedTemplate(currentProject.name, templateName);
    }
    await doPublish(templateName);
    return;
  }
  await import_fs_extra24.default.ensureDir(TEMPLATES_DIR);
  const entries = await import_fs_extra24.default.readdir(TEMPLATES_DIR).catch(() => []);
  const localTemplates = [];
  for (const entry of entries) {
    const stat = await import_fs_extra24.default.stat(resolve6(TEMPLATES_DIR, entry));
    if (stat.isDirectory())
      localTemplates.push(entry);
  }
  if (localTemplates.length === 0) {
    printInfo("\u6682\u65E0\u672C\u5730\u6A21\u677F");
    console.log(import_picocolors31.default.dim("  \u4F7F\u7528 ") + brand.primary("p templates add <project>") + import_picocolors31.default.dim(" \u6DFB\u52A0\u6A21\u677F"));
    return;
  }
  let selectedTemplate;
  if (nameArg) {
    const lower = nameArg.toLowerCase();
    const matched = localTemplates.filter((t) => t.toLowerCase().includes(lower));
    if (matched.length === 1) {
      selectedTemplate = matched[0] ?? "";
    } else if (matched.length > 1) {
      printError(`\u591A\u4E2A\u6A21\u677F\u5339\u914D "${nameArg}": ${matched.join(", ")}`);
      process.exit(1);
    } else {
      printError(`\u6A21\u677F\u4E0D\u5B58\u5728: ${nameArg}`);
      process.exit(1);
    }
  } else {
    const options = localTemplates.map((name) => ({
      value: name,
      label: name
    }));
    const result = await liveSearch({
      message: "\u9009\u62E9\u8981\u53D1\u5E03\u7684\u6A21\u677F:",
      placeholder: "\u8F93\u5165\u6A21\u677F\u540D\u79F0\u7B5B\u9009",
      options,
      filterFn: (query) => {
        if (!query)
          return options;
        return options.filter((o2) => o2.label.toLowerCase().includes(query.toLowerCase()));
      }
    });
    if (result === CANCEL) {
      Se(import_picocolors31.default.dim("\u5DF2\u53D6\u6D88"));
      process.exit(0);
    }
    selectedTemplate = result[0] ?? "";
  }
  await doPublish(selectedTemplate);
}
async function doPublish(selectedTemplate) {
  const templatePath = resolve6(TEMPLATES_DIR, selectedTemplate);
  const checkSpinner = Y2();
  checkSpinner.start("\u6B63\u5728\u68C0\u67E5\u8FDC\u7A0B\u4ED3\u5E93...");
  const repoCheck = await execAndCapture(`gh repo view ${selectedTemplate} --json name`, process.cwd());
  const remoteExists = repoCheck.success;
  checkSpinner.stop(`${brand.success("\u2713")} ${remoteExists ? "\u8FDC\u7A0B\u4ED3\u5E93\u5DF2\u5B58\u5728" : "\u65B0\u4ED3\u5E93"}`);
  Ie(remoteExists ? bgOrange(" \u66F4\u65B0\u6A21\u677F ") : bgOrange(" \u53D1\u5E03\u6A21\u677F "));
  const shouldPublish = await ye({
    message: remoteExists ? `\u786E\u8BA4\u5C06\u6A21\u677F ${brand.primary(selectedTemplate)} \u66F4\u65B0\u5230 GitHub\uFF1F` : `\u786E\u8BA4\u5C06\u6A21\u677F ${brand.primary(selectedTemplate)} \u53D1\u5E03\u5230 GitHub\uFF1F`
  });
  if (pD(shouldPublish) || !shouldPublish) {
    Se(import_picocolors31.default.dim("\u5DF2\u53D6\u6D88"));
    return;
  }
  const s = Y2();
  s.start(remoteExists ? "\u6B63\u5728\u63A8\u9001\u5230\u8FDC\u7A0B\u4ED3\u5E93..." : "\u6B63\u5728\u521B\u5EFA GitHub \u4ED3\u5E93...");
  const proc = Bun.spawn([
    "gh",
    "repo",
    "create",
    selectedTemplate,
    "--public",
    "--description",
    `p template: ${selectedTemplate}`
  ], { cwd: process.cwd(), stdout: "pipe", stderr: "pipe" });
  const exitCode = await proc.exited;
  const stdout = await new Response(proc.stdout).text();
  const stderr = await new Response(proc.stderr).text();
  const output = stdout + stderr;
  let owner = "";
  const urlMatch = output.match(/https:\/\/github\.com\/([^/]+)\/[^\s/]+/);
  if (urlMatch) {
    owner = urlMatch[1] ?? "";
  } else {
    const whoami = await execAndCapture("gh api user --jq .login", process.cwd());
    owner = whoami.success ? whoami.output.trim() : "";
  }
  if (!owner) {
    s.stop("\u83B7\u53D6 GitHub \u7528\u6237\u540D\u5931\u8D25");
    console.log();
    printError(output || "\u8BF7\u786E\u8BA4\u5DF2\u5B89\u88C5\u5E76\u767B\u5F55 GitHub CLI (gh)");
    console.log();
    process.exit(1);
  }
  if (exitCode !== 0 && !output.includes("Name already exists")) {
    s.stop("\u521B\u5EFA\u4ED3\u5E93\u5931\u8D25");
    console.log();
    printError(output);
    console.log();
    process.exit(1);
  }
  const cloneUrl = `https://github.com/${owner}/${selectedTemplate}.git`;
  if (exitCode === 0) {
    s.stop(`${brand.success("\u2713")} \u4ED3\u5E93\u5DF2\u521B\u5EFA: ${brand.primary(`${owner}/${selectedTemplate}`)} (public)`);
  } else {
    s.stop(`${brand.success("\u2713")} \u4ED3\u5E93\u5DF2\u5B58\u5728: ${brand.primary(`${owner}/${selectedTemplate}`)}\uFF0C\u5C06\u66F4\u65B0\u5185\u5BB9`);
  }
  const pushSpinner = Y2();
  pushSpinner.start("\u6B63\u5728\u63A8\u9001\u6587\u4EF6...");
  async function git3(args) {
    const proc2 = Bun.spawn(["git", ...args], {
      cwd: templatePath,
      stdout: "pipe",
      stderr: "pipe"
    });
    const code = await proc2.exited;
    const out = await new Response(proc2.stdout).text();
    const err = await new Response(proc2.stderr).text();
    return { ok: code === 0, output: err || out };
  }
  let result = await git3(["init"]);
  if (!result.ok) {
    pushSpinner.stop("git init \u5931\u8D25");
    console.log();
    printError(result.output);
    await cleanupGitDir(templatePath);
    process.exit(1);
  }
  await git3(["remote", "add", "origin", cloneUrl]);
  await git3(["add", "-A"]);
  result = await git3(["commit", "-m", "init: p template"]);
  if (!result.ok) {
    pushSpinner.stop("git commit \u5931\u8D25");
    console.log();
    printError(result.output);
    await cleanupGitDir(templatePath);
    process.exit(1);
  }
  const branchResult = await git3(["branch", "--show-current"]);
  const branch = branchResult.output.trim() || "main";
  result = await git3(["push", "-u", "--force", "origin", branch]);
  if (!result.ok && branch === "main") {
    await git3(["branch", "-M", "master"]);
    result = await git3(["push", "-u", "--force", "origin", "master"]);
  }
  if (!result.ok) {
    pushSpinner.stop("\u63A8\u9001\u5931\u8D25");
    console.log();
    printError(result.output);
    await cleanupGitDir(templatePath);
    process.exit(1);
  }
  await cleanupGitDir(templatePath);
  const fileCount = await countFiles(templatePath);
  pushSpinner.stop(`${brand.success("\u2713")} \u5DF2\u63A8\u9001 ${brand.primary(fileCount.toString())} \u4E2A\u6587\u4EF6`);
  markTemplatePublished(selectedTemplate, owner, selectedTemplate);
  console.log();
  console.log(import_picocolors31.default.dim("  \u514B\u9686\u94FE\u63A5: ") + import_picocolors31.default.underline(cloneUrl));
  console.log();
}
async function createOrUpdateTemplate(sourcePath, templateName, isUpdate) {
  Ie(isUpdate ? bgOrange(" \u66F4\u65B0\u6A21\u677F ") : bgOrange(" \u6DFB\u52A0\u6A21\u677F "));
  const s = Y2();
  s.start("\u6B63\u5728\u5206\u6790\u6587\u4EF6...");
  const { success, files, message } = await collectProjectFiles(sourcePath);
  if (!success) {
    s.stop("\u5206\u6790\u5931\u8D25");
    console.log();
    printError(message || "\u65E0\u6CD5\u83B7\u53D6\u6587\u4EF6\u5217\u8868");
    console.log();
    process.exit(1);
  }
  s.stop(`${brand.success("\u2713")} \u627E\u5230 ${brand.primary(files.length.toString())} \u4E2A\u6587\u4EF6`);
  const targetPath = resolve6(TEMPLATES_DIR, templateName);
  const exists = await import_fs_extra24.default.pathExists(targetPath);
  if (exists) {
    await import_fs_extra24.default.emptyDir(targetPath);
  } else {
    await import_fs_extra24.default.ensureDir(targetPath);
  }
  const copySpinner = Y2();
  copySpinner.start(isUpdate ? "\u6B63\u5728\u66F4\u65B0\u6A21\u677F..." : "\u6B63\u5728\u590D\u5236\u6587\u4EF6\u5230\u6A21\u677F\u76EE\u5F55...");
  try {
    await copyFiles(sourcePath, targetPath, files);
    copySpinner.stop(`${brand.success("\u2713")} \u6A21\u677F${isUpdate ? "\u5DF2\u66F4\u65B0" : "\u5DF2\u521B\u5EFA"}: ${brand.primary(templateName)}`);
  } catch (error) {
    copySpinner.stop("\u64CD\u4F5C\u5931\u8D25");
    console.log();
    printError(error.message);
    console.log();
    process.exit(1);
  }
  console.log();
  Se(brand.success(`\u2713 \u6A21\u677F${isUpdate ? "\u66F4\u65B0" : "\u6DFB\u52A0"}\u6210\u529F: ${brand.primary(templateName)}`));
  console.log();
  console.log(import_picocolors31.default.dim("  \u6A21\u677F\u4F4D\u7F6E: ") + import_picocolors31.default.underline(targetPath));
  console.log();
}
async function cleanupGitDir(dir) {
  const gitDir = resolve6(dir, ".git");
  if (await import_fs_extra24.default.pathExists(gitDir)) {
    await import_fs_extra24.default.remove(gitDir);
  }
}
async function countFiles(dir) {
  let count = 0;
  const entries = await import_fs_extra24.default.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name === ".git")
      continue;
    if (entry.isDirectory()) {
      count += await countFiles(resolve6(dir, entry.name));
    } else {
      count++;
    }
  }
  return count;
}

// src/commands/unzip.ts
import { dirname as dirname5, join as join15, parse } from "path";
init_esm();
var import_adm_zip2 = __toESM(require_adm_zip(), 1);
var import_fs_extra25 = __toESM(require_lib(), 1);

// node_modules/glob/dist/esm/index.min.js
import { fileURLToPath as Wi } from "url";
import { posix as mi, win32 as re } from "path";
import { fileURLToPath as gi } from "url";
import { lstatSync as wi, readdir as yi, readdirSync as bi, readlinkSync as Si, realpathSync as Ei } from "fs";
import * as xi from "fs";
import { lstat as Ci, readdir as Ti, readlink as Ai, realpath as ki } from "fs/promises";
import { EventEmitter as ee } from "events";
import Pe from "stream";
import { StringDecoder as ni } from "string_decoder";
var Gt = (n, t, e2) => {
  let s = n instanceof RegExp ? ce2(n, e2) : n, i = t instanceof RegExp ? ce2(t, e2) : t, r2 = s !== null && i != null && ss(s, i, e2);
  return r2 && { start: r2[0], end: r2[1], pre: e2.slice(0, r2[0]), body: e2.slice(r2[0] + s.length, r2[1]), post: e2.slice(r2[1] + i.length) };
};
var ce2 = (n, t) => {
  let e2 = t.match(n);
  return e2 ? e2[0] : null;
};
var ss = (n, t, e2) => {
  let s, i, r2, o2, h2, a = e2.indexOf(n), l2 = e2.indexOf(t, a + 1), u2 = a;
  if (a >= 0 && l2 > 0) {
    if (n === t)
      return [a, l2];
    for (s = [], r2 = e2.length;u2 >= 0 && !h2; ) {
      if (u2 === a)
        s.push(u2), a = e2.indexOf(n, u2 + 1);
      else if (s.length === 1) {
        let c = s.pop();
        c !== undefined && (h2 = [c, l2]);
      } else
        i = s.pop(), i !== undefined && i < r2 && (r2 = i, o2 = l2), l2 = e2.indexOf(t, u2 + 1);
      u2 = a < l2 && a >= 0 ? a : l2;
    }
    s.length && o2 !== undefined && (h2 = [r2, o2]);
  }
  return h2;
};
var fe2 = "\x00SLASH" + Math.random() + "\x00";
var ue2 = "\x00OPEN" + Math.random() + "\x00";
var qt = "\x00CLOSE" + Math.random() + "\x00";
var de2 = "\x00COMMA" + Math.random() + "\x00";
var pe2 = "\x00PERIOD" + Math.random() + "\x00";
var is = new RegExp(fe2, "g");
var rs = new RegExp(ue2, "g");
var ns = new RegExp(qt, "g");
var os = new RegExp(de2, "g");
var hs = new RegExp(pe2, "g");
var as = /\\\\/g;
var ls = /\\{/g;
var cs = /\\}/g;
var fs = /\\,/g;
var us = /\\./g;
var ds = 1e5;
function Ht(n) {
  return isNaN(n) ? n.charCodeAt(0) : parseInt(n, 10);
}
function ps(n) {
  return n.replace(as, fe2).replace(ls, ue2).replace(cs, qt).replace(fs, de2).replace(us, pe2);
}
function ms(n) {
  return n.replace(is, "\\").replace(rs, "{").replace(ns, "}").replace(os, ",").replace(hs, ".");
}
function me2(n) {
  if (!n)
    return [""];
  let t = [], e2 = Gt("{", "}", n);
  if (!e2)
    return n.split(",");
  let { pre: s, body: i, post: r2 } = e2, o2 = s.split(",");
  o2[o2.length - 1] += "{" + i + "}";
  let h2 = me2(r2);
  return r2.length && (o2[o2.length - 1] += h2.shift(), o2.push.apply(o2, h2)), t.push.apply(t, o2), t;
}
function ge(n, t = {}) {
  if (!n)
    return [];
  let { max: e2 = ds } = t;
  return n.slice(0, 2) === "{}" && (n = "\\{\\}" + n.slice(2)), ht(ps(n), e2, true).map(ms);
}
function gs(n) {
  return "{" + n + "}";
}
function ws(n) {
  return /^-?0\d/.test(n);
}
function ys(n, t) {
  return n <= t;
}
function bs(n, t) {
  return n >= t;
}
function ht(n, t, e2) {
  let s = [], i = Gt("{", "}", n);
  if (!i)
    return [n];
  let r2 = i.pre, o2 = i.post.length ? ht(i.post, t, false) : [""];
  if (/\$$/.test(i.pre))
    for (let h2 = 0;h2 < o2.length && h2 < t; h2++) {
      let a = r2 + "{" + i.body + "}" + o2[h2];
      s.push(a);
    }
  else {
    let h2 = /^-?\d+\.\.-?\d+(?:\.\.-?\d+)?$/.test(i.body), a = /^[a-zA-Z]\.\.[a-zA-Z](?:\.\.-?\d+)?$/.test(i.body), l2 = h2 || a, u2 = i.body.indexOf(",") >= 0;
    if (!l2 && !u2)
      return i.post.match(/,(?!,).*\}/) ? (n = i.pre + "{" + i.body + qt + i.post, ht(n, t, true)) : [n];
    let c;
    if (l2)
      c = i.body.split(/\.\./);
    else if (c = me2(i.body), c.length === 1 && c[0] !== undefined && (c = ht(c[0], t, false).map(gs), c.length === 1))
      return o2.map((f) => i.pre + c[0] + f);
    let d3;
    if (l2 && c[0] !== undefined && c[1] !== undefined) {
      let f = Ht(c[0]), m2 = Ht(c[1]), p2 = Math.max(c[0].length, c[1].length), w2 = c.length === 3 && c[2] !== undefined ? Math.abs(Ht(c[2])) : 1, g2 = ys;
      m2 < f && (w2 *= -1, g2 = bs);
      let E = c.some(ws);
      d3 = [];
      for (let y3 = f;g2(y3, m2); y3 += w2) {
        let b3;
        if (a)
          b3 = String.fromCharCode(y3), b3 === "\\" && (b3 = "");
        else if (b3 = String(y3), E) {
          let z2 = p2 - b3.length;
          if (z2 > 0) {
            let $3 = new Array(z2 + 1).join("0");
            y3 < 0 ? b3 = "-" + $3 + b3.slice(1) : b3 = $3 + b3;
          }
        }
        d3.push(b3);
      }
    } else {
      d3 = [];
      for (let f = 0;f < c.length; f++)
        d3.push.apply(d3, ht(c[f], t, false));
    }
    for (let f = 0;f < d3.length; f++)
      for (let m2 = 0;m2 < o2.length && s.length < t; m2++) {
        let p2 = r2 + d3[f] + o2[m2];
        (!e2 || l2 || p2) && s.push(p2);
      }
  }
  return s;
}
var at = (n) => {
  if (typeof n != "string")
    throw new TypeError("invalid pattern");
  if (n.length > 65536)
    throw new TypeError("pattern is too long");
};
var Ss = { "[:alnum:]": ["\\p{L}\\p{Nl}\\p{Nd}", true], "[:alpha:]": ["\\p{L}\\p{Nl}", true], "[:ascii:]": ["\\x00-\\x7f", false], "[:blank:]": ["\\p{Zs}\\t", true], "[:cntrl:]": ["\\p{Cc}", true], "[:digit:]": ["\\p{Nd}", true], "[:graph:]": ["\\p{Z}\\p{C}", true, true], "[:lower:]": ["\\p{Ll}", true], "[:print:]": ["\\p{C}", true], "[:punct:]": ["\\p{P}", true], "[:space:]": ["\\p{Z}\\t\\r\\n\\v\\f", true], "[:upper:]": ["\\p{Lu}", true], "[:word:]": ["\\p{L}\\p{Nl}\\p{Nd}\\p{Pc}", true], "[:xdigit:]": ["A-Fa-f0-9", false] };
var lt = (n) => n.replace(/[[\]\\-]/g, "\\$&");
var Es = (n) => n.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
var we = (n) => n.join("");
var ye2 = (n, t) => {
  let e2 = t;
  if (n.charAt(e2) !== "[")
    throw new Error("not in a brace expression");
  let s = [], i = [], r2 = e2 + 1, o2 = false, h2 = false, a = false, l2 = false, u2 = e2, c = "";
  t:
    for (;r2 < n.length; ) {
      let p2 = n.charAt(r2);
      if ((p2 === "!" || p2 === "^") && r2 === e2 + 1) {
        l2 = true, r2++;
        continue;
      }
      if (p2 === "]" && o2 && !a) {
        u2 = r2 + 1;
        break;
      }
      if (o2 = true, p2 === "\\" && !a) {
        a = true, r2++;
        continue;
      }
      if (p2 === "[" && !a) {
        for (let [w2, [g2, S2, E]] of Object.entries(Ss))
          if (n.startsWith(w2, r2)) {
            if (c)
              return ["$.", false, n.length - e2, true];
            r2 += w2.length, E ? i.push(g2) : s.push(g2), h2 = h2 || S2;
            continue t;
          }
      }
      if (a = false, c) {
        p2 > c ? s.push(lt(c) + "-" + lt(p2)) : p2 === c && s.push(lt(p2)), c = "", r2++;
        continue;
      }
      if (n.startsWith("-]", r2 + 1)) {
        s.push(lt(p2 + "-")), r2 += 2;
        continue;
      }
      if (n.startsWith("-", r2 + 1)) {
        c = p2, r2 += 2;
        continue;
      }
      s.push(lt(p2)), r2++;
    }
  if (u2 < r2)
    return ["", false, 0, false];
  if (!s.length && !i.length)
    return ["$.", false, n.length - e2, true];
  if (i.length === 0 && s.length === 1 && /^\\?.$/.test(s[0]) && !l2) {
    let p2 = s[0].length === 2 ? s[0].slice(-1) : s[0];
    return [Es(p2), false, u2 - e2, false];
  }
  let d3 = "[" + (l2 ? "^" : "") + we(s) + "]", f = "[" + (l2 ? "" : "^") + we(i) + "]";
  return [s.length && i.length ? "(" + d3 + "|" + f + ")" : s.length ? d3 : f, h2, u2 - e2, true];
};
var W3 = (n, { windowsPathsNoEscape: t = false, magicalBraces: e2 = true } = {}) => e2 ? t ? n.replace(/\[([^\/\\])\]/g, "$1") : n.replace(/((?!\\).|^)\[([^\/\\])\]/g, "$1$2").replace(/\\([^\/])/g, "$1") : t ? n.replace(/\[([^\/\\{}])\]/g, "$1") : n.replace(/((?!\\).|^)\[([^\/\\{}])\]/g, "$1$2").replace(/\\([^\/{}])/g, "$1");
var xs = new Set(["!", "?", "+", "*", "@"]);
var be = (n) => xs.has(n);
var vs = "(?!(?:^|/)\\.\\.?(?:$|/))";
var Ct = "(?!\\.)";
var Cs = new Set(["[", "."]);
var Ts = new Set(["..", "."]);
var As = new Set("().*{}+?[]^$\\!");
var ks = (n) => n.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
var Kt = "[^/]";
var Se2 = Kt + "*?";
var Ee = Kt + "+?";
var Q = class n {
  type;
  #t;
  #s;
  #n = false;
  #r = [];
  #o;
  #S;
  #w;
  #c = false;
  #h;
  #u;
  #f = false;
  constructor(t, e2, s = {}) {
    this.type = t, t && (this.#s = true), this.#o = e2, this.#t = this.#o ? this.#o.#t : this, this.#h = this.#t === this ? s : this.#t.#h, this.#w = this.#t === this ? [] : this.#t.#w, t === "!" && !this.#t.#c && this.#w.push(this), this.#S = this.#o ? this.#o.#r.length : 0;
  }
  get hasMagic() {
    if (this.#s !== undefined)
      return this.#s;
    for (let t of this.#r)
      if (typeof t != "string" && (t.type || t.hasMagic))
        return this.#s = true;
    return this.#s;
  }
  toString() {
    return this.#u !== undefined ? this.#u : this.type ? this.#u = this.type + "(" + this.#r.map((t) => String(t)).join("|") + ")" : this.#u = this.#r.map((t) => String(t)).join("");
  }
  #a() {
    if (this !== this.#t)
      throw new Error("should only call on root");
    if (this.#c)
      return this;
    this.toString(), this.#c = true;
    let t;
    for (;t = this.#w.pop(); ) {
      if (t.type !== "!")
        continue;
      let e2 = t, s = e2.#o;
      for (;s; ) {
        for (let i = e2.#S + 1;!s.type && i < s.#r.length; i++)
          for (let r2 of t.#r) {
            if (typeof r2 == "string")
              throw new Error("string part in extglob AST??");
            r2.copyIn(s.#r[i]);
          }
        e2 = s, s = e2.#o;
      }
    }
    return this;
  }
  push(...t) {
    for (let e2 of t)
      if (e2 !== "") {
        if (typeof e2 != "string" && !(e2 instanceof n && e2.#o === this))
          throw new Error("invalid part: " + e2);
        this.#r.push(e2);
      }
  }
  toJSON() {
    let t = this.type === null ? this.#r.slice().map((e2) => typeof e2 == "string" ? e2 : e2.toJSON()) : [this.type, ...this.#r.map((e2) => e2.toJSON())];
    return this.isStart() && !this.type && t.unshift([]), this.isEnd() && (this === this.#t || this.#t.#c && this.#o?.type === "!") && t.push({}), t;
  }
  isStart() {
    if (this.#t === this)
      return true;
    if (!this.#o?.isStart())
      return false;
    if (this.#S === 0)
      return true;
    let t = this.#o;
    for (let e2 = 0;e2 < this.#S; e2++) {
      let s = t.#r[e2];
      if (!(s instanceof n && s.type === "!"))
        return false;
    }
    return true;
  }
  isEnd() {
    if (this.#t === this || this.#o?.type === "!")
      return true;
    if (!this.#o?.isEnd())
      return false;
    if (!this.type)
      return this.#o?.isEnd();
    let t = this.#o ? this.#o.#r.length : 0;
    return this.#S === t - 1;
  }
  copyIn(t) {
    typeof t == "string" ? this.push(t) : this.push(t.clone(this));
  }
  clone(t) {
    let e2 = new n(this.type, t);
    for (let s of this.#r)
      e2.copyIn(s);
    return e2;
  }
  static #i(t, e2, s, i) {
    let r2 = false, o2 = false, h2 = -1, a = false;
    if (e2.type === null) {
      let f = s, m2 = "";
      for (;f < t.length; ) {
        let p2 = t.charAt(f++);
        if (r2 || p2 === "\\") {
          r2 = !r2, m2 += p2;
          continue;
        }
        if (o2) {
          f === h2 + 1 ? (p2 === "^" || p2 === "!") && (a = true) : p2 === "]" && !(f === h2 + 2 && a) && (o2 = false), m2 += p2;
          continue;
        } else if (p2 === "[") {
          o2 = true, h2 = f, a = false, m2 += p2;
          continue;
        }
        if (!i.noext && be(p2) && t.charAt(f) === "(") {
          e2.push(m2), m2 = "";
          let w2 = new n(p2, e2);
          f = n.#i(t, w2, f, i), e2.push(w2);
          continue;
        }
        m2 += p2;
      }
      return e2.push(m2), f;
    }
    let l2 = s + 1, u2 = new n(null, e2), c = [], d3 = "";
    for (;l2 < t.length; ) {
      let f = t.charAt(l2++);
      if (r2 || f === "\\") {
        r2 = !r2, d3 += f;
        continue;
      }
      if (o2) {
        l2 === h2 + 1 ? (f === "^" || f === "!") && (a = true) : f === "]" && !(l2 === h2 + 2 && a) && (o2 = false), d3 += f;
        continue;
      } else if (f === "[") {
        o2 = true, h2 = l2, a = false, d3 += f;
        continue;
      }
      if (be(f) && t.charAt(l2) === "(") {
        u2.push(d3), d3 = "";
        let m2 = new n(f, u2);
        u2.push(m2), l2 = n.#i(t, m2, l2, i);
        continue;
      }
      if (f === "|") {
        u2.push(d3), d3 = "", c.push(u2), u2 = new n(null, e2);
        continue;
      }
      if (f === ")")
        return d3 === "" && e2.#r.length === 0 && (e2.#f = true), u2.push(d3), d3 = "", e2.push(...c, u2), l2;
      d3 += f;
    }
    return e2.type = null, e2.#s = undefined, e2.#r = [t.substring(s - 1)], l2;
  }
  static fromGlob(t, e2 = {}) {
    let s = new n(null, undefined, e2);
    return n.#i(t, s, 0, e2), s;
  }
  toMMPattern() {
    if (this !== this.#t)
      return this.#t.toMMPattern();
    let t = this.toString(), [e2, s, i, r2] = this.toRegExpSource();
    if (!(i || this.#s || this.#h.nocase && !this.#h.nocaseMagicOnly && t.toUpperCase() !== t.toLowerCase()))
      return s;
    let h2 = (this.#h.nocase ? "i" : "") + (r2 ? "u" : "");
    return Object.assign(new RegExp(`^${e2}$`, h2), { _src: e2, _glob: t });
  }
  get options() {
    return this.#h;
  }
  toRegExpSource(t) {
    let e2 = t ?? !!this.#h.dot;
    if (this.#t === this && this.#a(), !this.type) {
      let a = this.isStart() && this.isEnd() && !this.#r.some((f) => typeof f != "string"), l2 = this.#r.map((f) => {
        let [m2, p2, w2, g2] = typeof f == "string" ? n.#E(f, this.#s, a) : f.toRegExpSource(t);
        return this.#s = this.#s || w2, this.#n = this.#n || g2, m2;
      }).join(""), u2 = "";
      if (this.isStart() && typeof this.#r[0] == "string" && !(this.#r.length === 1 && Ts.has(this.#r[0]))) {
        let m2 = Cs, p2 = e2 && m2.has(l2.charAt(0)) || l2.startsWith("\\.") && m2.has(l2.charAt(2)) || l2.startsWith("\\.\\.") && m2.has(l2.charAt(4)), w2 = !e2 && !t && m2.has(l2.charAt(0));
        u2 = p2 ? vs : w2 ? Ct : "";
      }
      let c = "";
      return this.isEnd() && this.#t.#c && this.#o?.type === "!" && (c = "(?:$|\\/)"), [u2 + l2 + c, W3(l2), this.#s = !!this.#s, this.#n];
    }
    let s = this.type === "*" || this.type === "+", i = this.type === "!" ? "(?:(?!(?:" : "(?:", r2 = this.#d(e2);
    if (this.isStart() && this.isEnd() && !r2 && this.type !== "!") {
      let a = this.toString();
      return this.#r = [a], this.type = null, this.#s = undefined, [a, W3(this.toString()), false, false];
    }
    let o2 = !s || t || e2 || !Ct ? "" : this.#d(true);
    o2 === r2 && (o2 = ""), o2 && (r2 = `(?:${r2})(?:${o2})*?`);
    let h2 = "";
    if (this.type === "!" && this.#f)
      h2 = (this.isStart() && !e2 ? Ct : "") + Ee;
    else {
      let a = this.type === "!" ? "))" + (this.isStart() && !e2 && !t ? Ct : "") + Se2 + ")" : this.type === "@" ? ")" : this.type === "?" ? ")?" : this.type === "+" && o2 ? ")" : this.type === "*" && o2 ? ")?" : `)${this.type}`;
      h2 = i + r2 + a;
    }
    return [h2, W3(r2), this.#s = !!this.#s, this.#n];
  }
  #d(t) {
    return this.#r.map((e2) => {
      if (typeof e2 == "string")
        throw new Error("string type in extglob ast??");
      let [s, i, r2, o2] = e2.toRegExpSource(t);
      return this.#n = this.#n || o2, s;
    }).filter((e2) => !(this.isStart() && this.isEnd()) || !!e2).join("|");
  }
  static #E(t, e2, s = false) {
    let i = false, r2 = "", o2 = false, h2 = false;
    for (let a = 0;a < t.length; a++) {
      let l2 = t.charAt(a);
      if (i) {
        i = false, r2 += (As.has(l2) ? "\\" : "") + l2;
        continue;
      }
      if (l2 === "*") {
        if (h2)
          continue;
        h2 = true, r2 += s && /^[*]+$/.test(t) ? Ee : Se2, e2 = true;
        continue;
      } else
        h2 = false;
      if (l2 === "\\") {
        a === t.length - 1 ? r2 += "\\\\" : i = true;
        continue;
      }
      if (l2 === "[") {
        let [u2, c, d3, f] = ye2(t, a);
        if (d3) {
          r2 += u2, o2 = o2 || c, a += d3 - 1, e2 = e2 || f;
          continue;
        }
      }
      if (l2 === "?") {
        r2 += Kt, e2 = true;
        continue;
      }
      r2 += ks(l2);
    }
    return [r2, W3(t), !!e2, o2];
  }
};
var tt = (n2, { windowsPathsNoEscape: t = false, magicalBraces: e2 = false } = {}) => e2 ? t ? n2.replace(/[?*()[\]{}]/g, "[$&]") : n2.replace(/[?*()[\]\\{}]/g, "\\$&") : t ? n2.replace(/[?*()[\]]/g, "[$&]") : n2.replace(/[?*()[\]\\]/g, "\\$&");
var O2 = (n2, t, e2 = {}) => (at(t), !e2.nocomment && t.charAt(0) === "#" ? false : new D2(t, e2).match(n2));
var Rs = /^\*+([^+@!?\*\[\(]*)$/;
var Os = (n2) => (t) => !t.startsWith(".") && t.endsWith(n2);
var Fs = (n2) => (t) => t.endsWith(n2);
var Ds = (n2) => (n2 = n2.toLowerCase(), (t) => !t.startsWith(".") && t.toLowerCase().endsWith(n2));
var Ms = (n2) => (n2 = n2.toLowerCase(), (t) => t.toLowerCase().endsWith(n2));
var Ns = /^\*+\.\*+$/;
var _s = (n2) => !n2.startsWith(".") && n2.includes(".");
var Ls = (n2) => n2 !== "." && n2 !== ".." && n2.includes(".");
var Ws = /^\.\*+$/;
var Ps = (n2) => n2 !== "." && n2 !== ".." && n2.startsWith(".");
var js = /^\*+$/;
var Is = (n2) => n2.length !== 0 && !n2.startsWith(".");
var zs = (n2) => n2.length !== 0 && n2 !== "." && n2 !== "..";
var Bs = /^\?+([^+@!?\*\[\(]*)?$/;
var Us = ([n2, t = ""]) => {
  let e2 = Ce([n2]);
  return t ? (t = t.toLowerCase(), (s) => e2(s) && s.toLowerCase().endsWith(t)) : e2;
};
var $s = ([n2, t = ""]) => {
  let e2 = Te([n2]);
  return t ? (t = t.toLowerCase(), (s) => e2(s) && s.toLowerCase().endsWith(t)) : e2;
};
var Gs = ([n2, t = ""]) => {
  let e2 = Te([n2]);
  return t ? (s) => e2(s) && s.endsWith(t) : e2;
};
var Hs = ([n2, t = ""]) => {
  let e2 = Ce([n2]);
  return t ? (s) => e2(s) && s.endsWith(t) : e2;
};
var Ce = ([n2]) => {
  let t = n2.length;
  return (e2) => e2.length === t && !e2.startsWith(".");
};
var Te = ([n2]) => {
  let t = n2.length;
  return (e2) => e2.length === t && e2 !== "." && e2 !== "..";
};
var Ae = typeof process == "object" && process ? typeof process.env == "object" && process.env && process.env.__MINIMATCH_TESTING_PLATFORM__ || process.platform : "posix";
var xe = { win32: { sep: "\\" }, posix: { sep: "/" } };
var qs = Ae === "win32" ? xe.win32.sep : xe.posix.sep;
O2.sep = qs;
var A3 = Symbol("globstar **");
O2.GLOBSTAR = A3;
var Ks = "[^/]";
var Vs = Ks + "*?";
var Ys = "(?:(?!(?:\\/|^)(?:\\.{1,2})($|\\/)).)*?";
var Xs = "(?:(?!(?:\\/|^)\\.).)*?";
var Js = (n2, t = {}) => (e2) => O2(e2, n2, t);
O2.filter = Js;
var N2 = (n2, t = {}) => Object.assign({}, n2, t);
var Zs = (n2) => {
  if (!n2 || typeof n2 != "object" || !Object.keys(n2).length)
    return O2;
  let t = O2;
  return Object.assign((s, i, r2 = {}) => t(s, i, N2(n2, r2)), { Minimatch: class extends t.Minimatch {
    constructor(i, r2 = {}) {
      super(i, N2(n2, r2));
    }
    static defaults(i) {
      return t.defaults(N2(n2, i)).Minimatch;
    }
  }, AST: class extends t.AST {
    constructor(i, r2, o2 = {}) {
      super(i, r2, N2(n2, o2));
    }
    static fromGlob(i, r2 = {}) {
      return t.AST.fromGlob(i, N2(n2, r2));
    }
  }, unescape: (s, i = {}) => t.unescape(s, N2(n2, i)), escape: (s, i = {}) => t.escape(s, N2(n2, i)), filter: (s, i = {}) => t.filter(s, N2(n2, i)), defaults: (s) => t.defaults(N2(n2, s)), makeRe: (s, i = {}) => t.makeRe(s, N2(n2, i)), braceExpand: (s, i = {}) => t.braceExpand(s, N2(n2, i)), match: (s, i, r2 = {}) => t.match(s, i, N2(n2, r2)), sep: t.sep, GLOBSTAR: A3 });
};
O2.defaults = Zs;
var ke = (n2, t = {}) => (at(n2), t.nobrace || !/\{(?:(?!\{).)*\}/.test(n2) ? [n2] : ge(n2, { max: t.braceExpandMax }));
O2.braceExpand = ke;
var Qs = (n2, t = {}) => new D2(n2, t).makeRe();
O2.makeRe = Qs;
var ti = (n2, t, e2 = {}) => {
  let s = new D2(t, e2);
  return n2 = n2.filter((i) => s.match(i)), s.options.nonull && !n2.length && n2.push(t), n2;
};
O2.match = ti;
var ve2 = /[?*]|[+@!]\(.*?\)|\[|\]/;
var ei = (n2) => n2.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
var D2 = class {
  options;
  set;
  pattern;
  windowsPathsNoEscape;
  nonegate;
  negate;
  comment;
  empty;
  preserveMultipleSlashes;
  partial;
  globSet;
  globParts;
  nocase;
  isWindows;
  platform;
  windowsNoMagicRoot;
  regexp;
  constructor(t, e2 = {}) {
    at(t), e2 = e2 || {}, this.options = e2, this.pattern = t, this.platform = e2.platform || Ae, this.isWindows = this.platform === "win32";
    let s = "allowWindowsEscape";
    this.windowsPathsNoEscape = !!e2.windowsPathsNoEscape || e2[s] === false, this.windowsPathsNoEscape && (this.pattern = this.pattern.replace(/\\/g, "/")), this.preserveMultipleSlashes = !!e2.preserveMultipleSlashes, this.regexp = null, this.negate = false, this.nonegate = !!e2.nonegate, this.comment = false, this.empty = false, this.partial = !!e2.partial, this.nocase = !!this.options.nocase, this.windowsNoMagicRoot = e2.windowsNoMagicRoot !== undefined ? e2.windowsNoMagicRoot : !!(this.isWindows && this.nocase), this.globSet = [], this.globParts = [], this.set = [], this.make();
  }
  hasMagic() {
    if (this.options.magicalBraces && this.set.length > 1)
      return true;
    for (let t of this.set)
      for (let e2 of t)
        if (typeof e2 != "string")
          return true;
    return false;
  }
  debug(...t) {}
  make() {
    let t = this.pattern, e2 = this.options;
    if (!e2.nocomment && t.charAt(0) === "#") {
      this.comment = true;
      return;
    }
    if (!t) {
      this.empty = true;
      return;
    }
    this.parseNegate(), this.globSet = [...new Set(this.braceExpand())], e2.debug && (this.debug = (...r2) => console.error(...r2)), this.debug(this.pattern, this.globSet);
    let s = this.globSet.map((r2) => this.slashSplit(r2));
    this.globParts = this.preprocess(s), this.debug(this.pattern, this.globParts);
    let i = this.globParts.map((r2, o2, h2) => {
      if (this.isWindows && this.windowsNoMagicRoot) {
        let a = r2[0] === "" && r2[1] === "" && (r2[2] === "?" || !ve2.test(r2[2])) && !ve2.test(r2[3]), l2 = /^[a-z]:/i.test(r2[0]);
        if (a)
          return [...r2.slice(0, 4), ...r2.slice(4).map((u2) => this.parse(u2))];
        if (l2)
          return [r2[0], ...r2.slice(1).map((u2) => this.parse(u2))];
      }
      return r2.map((a) => this.parse(a));
    });
    if (this.debug(this.pattern, i), this.set = i.filter((r2) => r2.indexOf(false) === -1), this.isWindows)
      for (let r2 = 0;r2 < this.set.length; r2++) {
        let o2 = this.set[r2];
        o2[0] === "" && o2[1] === "" && this.globParts[r2][2] === "?" && typeof o2[3] == "string" && /^[a-z]:$/i.test(o2[3]) && (o2[2] = "?");
      }
    this.debug(this.pattern, this.set);
  }
  preprocess(t) {
    if (this.options.noglobstar)
      for (let s = 0;s < t.length; s++)
        for (let i = 0;i < t[s].length; i++)
          t[s][i] === "**" && (t[s][i] = "*");
    let { optimizationLevel: e2 = 1 } = this.options;
    return e2 >= 2 ? (t = this.firstPhasePreProcess(t), t = this.secondPhasePreProcess(t)) : e2 >= 1 ? t = this.levelOneOptimize(t) : t = this.adjascentGlobstarOptimize(t), t;
  }
  adjascentGlobstarOptimize(t) {
    return t.map((e2) => {
      let s = -1;
      for (;(s = e2.indexOf("**", s + 1)) !== -1; ) {
        let i = s;
        for (;e2[i + 1] === "**"; )
          i++;
        i !== s && e2.splice(s, i - s);
      }
      return e2;
    });
  }
  levelOneOptimize(t) {
    return t.map((e2) => (e2 = e2.reduce((s, i) => {
      let r2 = s[s.length - 1];
      return i === "**" && r2 === "**" ? s : i === ".." && r2 && r2 !== ".." && r2 !== "." && r2 !== "**" ? (s.pop(), s) : (s.push(i), s);
    }, []), e2.length === 0 ? [""] : e2));
  }
  levelTwoFileOptimize(t) {
    Array.isArray(t) || (t = this.slashSplit(t));
    let e2 = false;
    do {
      if (e2 = false, !this.preserveMultipleSlashes) {
        for (let i = 1;i < t.length - 1; i++) {
          let r2 = t[i];
          i === 1 && r2 === "" && t[0] === "" || (r2 === "." || r2 === "") && (e2 = true, t.splice(i, 1), i--);
        }
        t[0] === "." && t.length === 2 && (t[1] === "." || t[1] === "") && (e2 = true, t.pop());
      }
      let s = 0;
      for (;(s = t.indexOf("..", s + 1)) !== -1; ) {
        let i = t[s - 1];
        i && i !== "." && i !== ".." && i !== "**" && (e2 = true, t.splice(s - 1, 2), s -= 2);
      }
    } while (e2);
    return t.length === 0 ? [""] : t;
  }
  firstPhasePreProcess(t) {
    let e2 = false;
    do {
      e2 = false;
      for (let s of t) {
        let i = -1;
        for (;(i = s.indexOf("**", i + 1)) !== -1; ) {
          let o2 = i;
          for (;s[o2 + 1] === "**"; )
            o2++;
          o2 > i && s.splice(i + 1, o2 - i);
          let h2 = s[i + 1], a = s[i + 2], l2 = s[i + 3];
          if (h2 !== ".." || !a || a === "." || a === ".." || !l2 || l2 === "." || l2 === "..")
            continue;
          e2 = true, s.splice(i, 1);
          let u2 = s.slice(0);
          u2[i] = "**", t.push(u2), i--;
        }
        if (!this.preserveMultipleSlashes) {
          for (let o2 = 1;o2 < s.length - 1; o2++) {
            let h2 = s[o2];
            o2 === 1 && h2 === "" && s[0] === "" || (h2 === "." || h2 === "") && (e2 = true, s.splice(o2, 1), o2--);
          }
          s[0] === "." && s.length === 2 && (s[1] === "." || s[1] === "") && (e2 = true, s.pop());
        }
        let r2 = 0;
        for (;(r2 = s.indexOf("..", r2 + 1)) !== -1; ) {
          let o2 = s[r2 - 1];
          if (o2 && o2 !== "." && o2 !== ".." && o2 !== "**") {
            e2 = true;
            let a = r2 === 1 && s[r2 + 1] === "**" ? ["."] : [];
            s.splice(r2 - 1, 2, ...a), s.length === 0 && s.push(""), r2 -= 2;
          }
        }
      }
    } while (e2);
    return t;
  }
  secondPhasePreProcess(t) {
    for (let e2 = 0;e2 < t.length - 1; e2++)
      for (let s = e2 + 1;s < t.length; s++) {
        let i = this.partsMatch(t[e2], t[s], !this.preserveMultipleSlashes);
        if (i) {
          t[e2] = [], t[s] = i;
          break;
        }
      }
    return t.filter((e2) => e2.length);
  }
  partsMatch(t, e2, s = false) {
    let i = 0, r2 = 0, o2 = [], h2 = "";
    for (;i < t.length && r2 < e2.length; )
      if (t[i] === e2[r2])
        o2.push(h2 === "b" ? e2[r2] : t[i]), i++, r2++;
      else if (s && t[i] === "**" && e2[r2] === t[i + 1])
        o2.push(t[i]), i++;
      else if (s && e2[r2] === "**" && t[i] === e2[r2 + 1])
        o2.push(e2[r2]), r2++;
      else if (t[i] === "*" && e2[r2] && (this.options.dot || !e2[r2].startsWith(".")) && e2[r2] !== "**") {
        if (h2 === "b")
          return false;
        h2 = "a", o2.push(t[i]), i++, r2++;
      } else if (e2[r2] === "*" && t[i] && (this.options.dot || !t[i].startsWith(".")) && t[i] !== "**") {
        if (h2 === "a")
          return false;
        h2 = "b", o2.push(e2[r2]), i++, r2++;
      } else
        return false;
    return t.length === e2.length && o2;
  }
  parseNegate() {
    if (this.nonegate)
      return;
    let t = this.pattern, e2 = false, s = 0;
    for (let i = 0;i < t.length && t.charAt(i) === "!"; i++)
      e2 = !e2, s++;
    s && (this.pattern = t.slice(s)), this.negate = e2;
  }
  matchOne(t, e2, s = false) {
    let i = this.options;
    if (this.isWindows) {
      let p2 = typeof t[0] == "string" && /^[a-z]:$/i.test(t[0]), w2 = !p2 && t[0] === "" && t[1] === "" && t[2] === "?" && /^[a-z]:$/i.test(t[3]), g2 = typeof e2[0] == "string" && /^[a-z]:$/i.test(e2[0]), S2 = !g2 && e2[0] === "" && e2[1] === "" && e2[2] === "?" && typeof e2[3] == "string" && /^[a-z]:$/i.test(e2[3]), E = w2 ? 3 : p2 ? 0 : undefined, y3 = S2 ? 3 : g2 ? 0 : undefined;
      if (typeof E == "number" && typeof y3 == "number") {
        let [b3, z2] = [t[E], e2[y3]];
        b3.toLowerCase() === z2.toLowerCase() && (e2[y3] = b3, y3 > E ? e2 = e2.slice(y3) : E > y3 && (t = t.slice(E)));
      }
    }
    let { optimizationLevel: r2 = 1 } = this.options;
    r2 >= 2 && (t = this.levelTwoFileOptimize(t)), this.debug("matchOne", this, { file: t, pattern: e2 }), this.debug("matchOne", t.length, e2.length);
    for (var o2 = 0, h2 = 0, a = t.length, l2 = e2.length;o2 < a && h2 < l2; o2++, h2++) {
      this.debug("matchOne loop");
      var u2 = e2[h2], c = t[o2];
      if (this.debug(e2, u2, c), u2 === false)
        return false;
      if (u2 === A3) {
        this.debug("GLOBSTAR", [e2, u2, c]);
        var d3 = o2, f = h2 + 1;
        if (f === l2) {
          for (this.debug("** at the end");o2 < a; o2++)
            if (t[o2] === "." || t[o2] === ".." || !i.dot && t[o2].charAt(0) === ".")
              return false;
          return true;
        }
        for (;d3 < a; ) {
          var m2 = t[d3];
          if (this.debug(`
globstar while`, t, d3, e2, f, m2), this.matchOne(t.slice(d3), e2.slice(f), s))
            return this.debug("globstar found match!", d3, a, m2), true;
          if (m2 === "." || m2 === ".." || !i.dot && m2.charAt(0) === ".") {
            this.debug("dot detected!", t, d3, e2, f);
            break;
          }
          this.debug("globstar swallow a segment, and continue"), d3++;
        }
        return !!(s && (this.debug(`
>>> no match, partial?`, t, d3, e2, f), d3 === a));
      }
      let p2;
      if (typeof u2 == "string" ? (p2 = c === u2, this.debug("string match", u2, c, p2)) : (p2 = u2.test(c), this.debug("pattern match", u2, c, p2)), !p2)
        return false;
    }
    if (o2 === a && h2 === l2)
      return true;
    if (o2 === a)
      return s;
    if (h2 === l2)
      return o2 === a - 1 && t[o2] === "";
    throw new Error("wtf?");
  }
  braceExpand() {
    return ke(this.pattern, this.options);
  }
  parse(t) {
    at(t);
    let e2 = this.options;
    if (t === "**")
      return A3;
    if (t === "")
      return "";
    let s, i = null;
    (s = t.match(js)) ? i = e2.dot ? zs : Is : (s = t.match(Rs)) ? i = (e2.nocase ? e2.dot ? Ms : Ds : e2.dot ? Fs : Os)(s[1]) : (s = t.match(Bs)) ? i = (e2.nocase ? e2.dot ? $s : Us : e2.dot ? Gs : Hs)(s) : (s = t.match(Ns)) ? i = e2.dot ? Ls : _s : (s = t.match(Ws)) && (i = Ps);
    let r2 = Q.fromGlob(t, this.options).toMMPattern();
    return i && typeof r2 == "object" && Reflect.defineProperty(r2, "test", { value: i }), r2;
  }
  makeRe() {
    if (this.regexp || this.regexp === false)
      return this.regexp;
    let t = this.set;
    if (!t.length)
      return this.regexp = false, this.regexp;
    let e2 = this.options, s = e2.noglobstar ? Vs : e2.dot ? Ys : Xs, i = new Set(e2.nocase ? ["i"] : []), r2 = t.map((a) => {
      let l2 = a.map((c) => {
        if (c instanceof RegExp)
          for (let d3 of c.flags.split(""))
            i.add(d3);
        return typeof c == "string" ? ei(c) : c === A3 ? A3 : c._src;
      });
      l2.forEach((c, d3) => {
        let f = l2[d3 + 1], m2 = l2[d3 - 1];
        c !== A3 || m2 === A3 || (m2 === undefined ? f !== undefined && f !== A3 ? l2[d3 + 1] = "(?:\\/|" + s + "\\/)?" + f : l2[d3] = s : f === undefined ? l2[d3 - 1] = m2 + "(?:\\/|\\/" + s + ")?" : f !== A3 && (l2[d3 - 1] = m2 + "(?:\\/|\\/" + s + "\\/)" + f, l2[d3 + 1] = A3));
      });
      let u2 = l2.filter((c) => c !== A3);
      if (this.partial && u2.length >= 1) {
        let c = [];
        for (let d3 = 1;d3 <= u2.length; d3++)
          c.push(u2.slice(0, d3).join("/"));
        return "(?:" + c.join("|") + ")";
      }
      return u2.join("/");
    }).join("|"), [o2, h2] = t.length > 1 ? ["(?:", ")"] : ["", ""];
    r2 = "^" + o2 + r2 + h2 + "$", this.partial && (r2 = "^(?:\\/|" + o2 + r2.slice(1, -1) + h2 + ")$"), this.negate && (r2 = "^(?!" + r2 + ").+$");
    try {
      this.regexp = new RegExp(r2, [...i].join(""));
    } catch {
      this.regexp = false;
    }
    return this.regexp;
  }
  slashSplit(t) {
    return this.preserveMultipleSlashes ? t.split("/") : this.isWindows && /^\/\/[^\/]+/.test(t) ? ["", ...t.split(/\/+/)] : t.split(/\/+/);
  }
  match(t, e2 = this.partial) {
    if (this.debug("match", t, this.pattern), this.comment)
      return false;
    if (this.empty)
      return t === "";
    if (t === "/" && e2)
      return true;
    let s = this.options;
    this.isWindows && (t = t.split("\\").join("/"));
    let i = this.slashSplit(t);
    this.debug(this.pattern, "split", i);
    let r2 = this.set;
    this.debug(this.pattern, "set", r2);
    let o2 = i[i.length - 1];
    if (!o2)
      for (let h2 = i.length - 2;!o2 && h2 >= 0; h2--)
        o2 = i[h2];
    for (let h2 = 0;h2 < r2.length; h2++) {
      let a = r2[h2], l2 = i;
      if (s.matchBase && a.length === 1 && (l2 = [o2]), this.matchOne(l2, a, e2))
        return s.flipNegate ? true : !this.negate;
    }
    return s.flipNegate ? false : this.negate;
  }
  static defaults(t) {
    return O2.defaults(t).Minimatch;
  }
};
O2.AST = Q;
O2.Minimatch = D2;
O2.escape = tt;
O2.unescape = W3;
var si = typeof performance == "object" && performance && typeof performance.now == "function" ? performance : Date;
var Oe = new Set;
var Vt = typeof process == "object" && process ? process : {};
var Fe = (n2, t, e2, s) => {
  typeof Vt.emitWarning == "function" ? Vt.emitWarning(n2, t, e2, s) : console.error(`[${e2}] ${t}: ${n2}`);
};
var At = globalThis.AbortController;
var Re = globalThis.AbortSignal;
if (typeof At > "u") {
  Re = class {
    onabort;
    _onabort = [];
    reason;
    aborted = false;
    addEventListener(e2, s) {
      this._onabort.push(s);
    }
  }, At = class {
    constructor() {
      t();
    }
    signal = new Re;
    abort(e2) {
      if (!this.signal.aborted) {
        this.signal.reason = e2, this.signal.aborted = true;
        for (let s of this.signal._onabort)
          s(e2);
        this.signal.onabort?.(e2);
      }
    }
  };
  let n2 = Vt.env?.LRU_CACHE_IGNORE_AC_WARNING !== "1", t = () => {
    n2 && (n2 = false, Fe("AbortController is not defined. If using lru-cache in node 14, load an AbortController polyfill from the `node-abort-controller` package. A minimal polyfill is provided for use by LRUCache.fetch(), but it should not be relied upon in other contexts (eg, passing it to other APIs that use AbortController/AbortSignal might have undesirable effects). You may disable this with LRU_CACHE_IGNORE_AC_WARNING=1 in the env.", "NO_ABORT_CONTROLLER", "ENOTSUP", t));
  };
}
var ii = (n2) => !Oe.has(n2);
var q2 = (n2) => n2 && n2 === Math.floor(n2) && n2 > 0 && isFinite(n2);
var De = (n2) => q2(n2) ? n2 <= Math.pow(2, 8) ? Uint8Array : n2 <= Math.pow(2, 16) ? Uint16Array : n2 <= Math.pow(2, 32) ? Uint32Array : n2 <= Number.MAX_SAFE_INTEGER ? Tt : null : null;
var Tt = class extends Array {
  constructor(n2) {
    super(n2), this.fill(0);
  }
};
var ri = class ct {
  heap;
  length;
  static #t = false;
  static create(t) {
    let e2 = De(t);
    if (!e2)
      return [];
    ct.#t = true;
    let s = new ct(t, e2);
    return ct.#t = false, s;
  }
  constructor(t, e2) {
    if (!ct.#t)
      throw new TypeError("instantiate Stack using Stack.create(n)");
    this.heap = new e2(t), this.length = 0;
  }
  push(t) {
    this.heap[this.length++] = t;
  }
  pop() {
    return this.heap[--this.length];
  }
};
var ft = class Me {
  #t;
  #s;
  #n;
  #r;
  #o;
  #S;
  #w;
  #c;
  get perf() {
    return this.#c;
  }
  ttl;
  ttlResolution;
  ttlAutopurge;
  updateAgeOnGet;
  updateAgeOnHas;
  allowStale;
  noDisposeOnSet;
  noUpdateTTL;
  maxEntrySize;
  sizeCalculation;
  noDeleteOnFetchRejection;
  noDeleteOnStaleGet;
  allowStaleOnFetchAbort;
  allowStaleOnFetchRejection;
  ignoreFetchAbort;
  #h;
  #u;
  #f;
  #a;
  #i;
  #d;
  #E;
  #b;
  #p;
  #R;
  #m;
  #C;
  #T;
  #g;
  #y;
  #x;
  #A;
  #e;
  #_;
  static unsafeExposeInternals(t) {
    return { starts: t.#T, ttls: t.#g, autopurgeTimers: t.#y, sizes: t.#C, keyMap: t.#f, keyList: t.#a, valList: t.#i, next: t.#d, prev: t.#E, get head() {
      return t.#b;
    }, get tail() {
      return t.#p;
    }, free: t.#R, isBackgroundFetch: (e2) => t.#l(e2), backgroundFetch: (e2, s, i, r2) => t.#U(e2, s, i, r2), moveToTail: (e2) => t.#W(e2), indexes: (e2) => t.#F(e2), rindexes: (e2) => t.#D(e2), isStale: (e2) => t.#v(e2) };
  }
  get max() {
    return this.#t;
  }
  get maxSize() {
    return this.#s;
  }
  get calculatedSize() {
    return this.#u;
  }
  get size() {
    return this.#h;
  }
  get fetchMethod() {
    return this.#S;
  }
  get memoMethod() {
    return this.#w;
  }
  get dispose() {
    return this.#n;
  }
  get onInsert() {
    return this.#r;
  }
  get disposeAfter() {
    return this.#o;
  }
  constructor(t) {
    let { max: e2 = 0, ttl: s, ttlResolution: i = 1, ttlAutopurge: r2, updateAgeOnGet: o2, updateAgeOnHas: h2, allowStale: a, dispose: l2, onInsert: u2, disposeAfter: c, noDisposeOnSet: d3, noUpdateTTL: f, maxSize: m2 = 0, maxEntrySize: p2 = 0, sizeCalculation: w2, fetchMethod: g2, memoMethod: S2, noDeleteOnFetchRejection: E, noDeleteOnStaleGet: y3, allowStaleOnFetchRejection: b3, allowStaleOnFetchAbort: z2, ignoreFetchAbort: $3, perf: J3 } = t;
    if (J3 !== undefined && typeof J3?.now != "function")
      throw new TypeError("perf option must have a now() method if specified");
    if (this.#c = J3 ?? si, e2 !== 0 && !q2(e2))
      throw new TypeError("max option must be a nonnegative integer");
    let Z = e2 ? De(e2) : Array;
    if (!Z)
      throw new Error("invalid max value: " + e2);
    if (this.#t = e2, this.#s = m2, this.maxEntrySize = p2 || this.#s, this.sizeCalculation = w2, this.sizeCalculation) {
      if (!this.#s && !this.maxEntrySize)
        throw new TypeError("cannot set sizeCalculation without setting maxSize or maxEntrySize");
      if (typeof this.sizeCalculation != "function")
        throw new TypeError("sizeCalculation set to non-function");
    }
    if (S2 !== undefined && typeof S2 != "function")
      throw new TypeError("memoMethod must be a function if defined");
    if (this.#w = S2, g2 !== undefined && typeof g2 != "function")
      throw new TypeError("fetchMethod must be a function if specified");
    if (this.#S = g2, this.#A = !!g2, this.#f = new Map, this.#a = new Array(e2).fill(undefined), this.#i = new Array(e2).fill(undefined), this.#d = new Z(e2), this.#E = new Z(e2), this.#b = 0, this.#p = 0, this.#R = ri.create(e2), this.#h = 0, this.#u = 0, typeof l2 == "function" && (this.#n = l2), typeof u2 == "function" && (this.#r = u2), typeof c == "function" ? (this.#o = c, this.#m = []) : (this.#o = undefined, this.#m = undefined), this.#x = !!this.#n, this.#_ = !!this.#r, this.#e = !!this.#o, this.noDisposeOnSet = !!d3, this.noUpdateTTL = !!f, this.noDeleteOnFetchRejection = !!E, this.allowStaleOnFetchRejection = !!b3, this.allowStaleOnFetchAbort = !!z2, this.ignoreFetchAbort = !!$3, this.maxEntrySize !== 0) {
      if (this.#s !== 0 && !q2(this.#s))
        throw new TypeError("maxSize must be a positive integer if specified");
      if (!q2(this.maxEntrySize))
        throw new TypeError("maxEntrySize must be a positive integer if specified");
      this.#G();
    }
    if (this.allowStale = !!a, this.noDeleteOnStaleGet = !!y3, this.updateAgeOnGet = !!o2, this.updateAgeOnHas = !!h2, this.ttlResolution = q2(i) || i === 0 ? i : 1, this.ttlAutopurge = !!r2, this.ttl = s || 0, this.ttl) {
      if (!q2(this.ttl))
        throw new TypeError("ttl must be a positive integer if specified");
      this.#M();
    }
    if (this.#t === 0 && this.ttl === 0 && this.#s === 0)
      throw new TypeError("At least one of max, maxSize, or ttl is required");
    if (!this.ttlAutopurge && !this.#t && !this.#s) {
      let $t = "LRU_CACHE_UNBOUNDED";
      ii($t) && (Oe.add($t), Fe("TTL caching without ttlAutopurge, max, or maxSize can result in unbounded memory consumption.", "UnboundedCacheWarning", $t, Me));
    }
  }
  getRemainingTTL(t) {
    return this.#f.has(t) ? 1 / 0 : 0;
  }
  #M() {
    let t = new Tt(this.#t), e2 = new Tt(this.#t);
    this.#g = t, this.#T = e2;
    let s = this.ttlAutopurge ? new Array(this.#t) : undefined;
    this.#y = s, this.#j = (o2, h2, a = this.#c.now()) => {
      if (e2[o2] = h2 !== 0 ? a : 0, t[o2] = h2, s?.[o2] && (clearTimeout(s[o2]), s[o2] = undefined), h2 !== 0 && s) {
        let l2 = setTimeout(() => {
          this.#v(o2) && this.#O(this.#a[o2], "expire");
        }, h2 + 1);
        l2.unref && l2.unref(), s[o2] = l2;
      }
    }, this.#k = (o2) => {
      e2[o2] = t[o2] !== 0 ? this.#c.now() : 0;
    }, this.#N = (o2, h2) => {
      if (t[h2]) {
        let a = t[h2], l2 = e2[h2];
        if (!a || !l2)
          return;
        o2.ttl = a, o2.start = l2, o2.now = i || r2();
        let u2 = o2.now - l2;
        o2.remainingTTL = a - u2;
      }
    };
    let i = 0, r2 = () => {
      let o2 = this.#c.now();
      if (this.ttlResolution > 0) {
        i = o2;
        let h2 = setTimeout(() => i = 0, this.ttlResolution);
        h2.unref && h2.unref();
      }
      return o2;
    };
    this.getRemainingTTL = (o2) => {
      let h2 = this.#f.get(o2);
      if (h2 === undefined)
        return 0;
      let a = t[h2], l2 = e2[h2];
      if (!a || !l2)
        return 1 / 0;
      let u2 = (i || r2()) - l2;
      return a - u2;
    }, this.#v = (o2) => {
      let h2 = e2[o2], a = t[o2];
      return !!a && !!h2 && (i || r2()) - h2 > a;
    };
  }
  #k = () => {};
  #N = () => {};
  #j = () => {};
  #v = () => false;
  #G() {
    let t = new Tt(this.#t);
    this.#u = 0, this.#C = t, this.#P = (e2) => {
      this.#u -= t[e2], t[e2] = 0;
    }, this.#I = (e2, s, i, r2) => {
      if (this.#l(s))
        return 0;
      if (!q2(i))
        if (r2) {
          if (typeof r2 != "function")
            throw new TypeError("sizeCalculation must be a function");
          if (i = r2(s, e2), !q2(i))
            throw new TypeError("sizeCalculation return invalid (expect positive integer)");
        } else
          throw new TypeError("invalid size value (must be positive integer). When maxSize or maxEntrySize is used, sizeCalculation or size must be set.");
      return i;
    }, this.#L = (e2, s, i) => {
      if (t[e2] = s, this.#s) {
        let r2 = this.#s - t[e2];
        for (;this.#u > r2; )
          this.#B(true);
      }
      this.#u += t[e2], i && (i.entrySize = s, i.totalCalculatedSize = this.#u);
    };
  }
  #P = (t) => {};
  #L = (t, e2, s) => {};
  #I = (t, e2, s, i) => {
    if (s || i)
      throw new TypeError("cannot set size without setting maxSize or maxEntrySize on cache");
    return 0;
  };
  *#F({ allowStale: t = this.allowStale } = {}) {
    if (this.#h)
      for (let e2 = this.#p;!(!this.#z(e2) || ((t || !this.#v(e2)) && (yield e2), e2 === this.#b)); )
        e2 = this.#E[e2];
  }
  *#D({ allowStale: t = this.allowStale } = {}) {
    if (this.#h)
      for (let e2 = this.#b;!(!this.#z(e2) || ((t || !this.#v(e2)) && (yield e2), e2 === this.#p)); )
        e2 = this.#d[e2];
  }
  #z(t) {
    return t !== undefined && this.#f.get(this.#a[t]) === t;
  }
  *entries() {
    for (let t of this.#F())
      this.#i[t] !== undefined && this.#a[t] !== undefined && !this.#l(this.#i[t]) && (yield [this.#a[t], this.#i[t]]);
  }
  *rentries() {
    for (let t of this.#D())
      this.#i[t] !== undefined && this.#a[t] !== undefined && !this.#l(this.#i[t]) && (yield [this.#a[t], this.#i[t]]);
  }
  *keys() {
    for (let t of this.#F()) {
      let e2 = this.#a[t];
      e2 !== undefined && !this.#l(this.#i[t]) && (yield e2);
    }
  }
  *rkeys() {
    for (let t of this.#D()) {
      let e2 = this.#a[t];
      e2 !== undefined && !this.#l(this.#i[t]) && (yield e2);
    }
  }
  *values() {
    for (let t of this.#F())
      this.#i[t] !== undefined && !this.#l(this.#i[t]) && (yield this.#i[t]);
  }
  *rvalues() {
    for (let t of this.#D())
      this.#i[t] !== undefined && !this.#l(this.#i[t]) && (yield this.#i[t]);
  }
  [Symbol.iterator]() {
    return this.entries();
  }
  [Symbol.toStringTag] = "LRUCache";
  find(t, e2 = {}) {
    for (let s of this.#F()) {
      let i = this.#i[s], r2 = this.#l(i) ? i.__staleWhileFetching : i;
      if (r2 !== undefined && t(r2, this.#a[s], this))
        return this.get(this.#a[s], e2);
    }
  }
  forEach(t, e2 = this) {
    for (let s of this.#F()) {
      let i = this.#i[s], r2 = this.#l(i) ? i.__staleWhileFetching : i;
      r2 !== undefined && t.call(e2, r2, this.#a[s], this);
    }
  }
  rforEach(t, e2 = this) {
    for (let s of this.#D()) {
      let i = this.#i[s], r2 = this.#l(i) ? i.__staleWhileFetching : i;
      r2 !== undefined && t.call(e2, r2, this.#a[s], this);
    }
  }
  purgeStale() {
    let t = false;
    for (let e2 of this.#D({ allowStale: true }))
      this.#v(e2) && (this.#O(this.#a[e2], "expire"), t = true);
    return t;
  }
  info(t) {
    let e2 = this.#f.get(t);
    if (e2 === undefined)
      return;
    let s = this.#i[e2], i = this.#l(s) ? s.__staleWhileFetching : s;
    if (i === undefined)
      return;
    let r2 = { value: i };
    if (this.#g && this.#T) {
      let o2 = this.#g[e2], h2 = this.#T[e2];
      if (o2 && h2) {
        let a = o2 - (this.#c.now() - h2);
        r2.ttl = a, r2.start = Date.now();
      }
    }
    return this.#C && (r2.size = this.#C[e2]), r2;
  }
  dump() {
    let t = [];
    for (let e2 of this.#F({ allowStale: true })) {
      let s = this.#a[e2], i = this.#i[e2], r2 = this.#l(i) ? i.__staleWhileFetching : i;
      if (r2 === undefined || s === undefined)
        continue;
      let o2 = { value: r2 };
      if (this.#g && this.#T) {
        o2.ttl = this.#g[e2];
        let h2 = this.#c.now() - this.#T[e2];
        o2.start = Math.floor(Date.now() - h2);
      }
      this.#C && (o2.size = this.#C[e2]), t.unshift([s, o2]);
    }
    return t;
  }
  load(t) {
    this.clear();
    for (let [e2, s] of t) {
      if (s.start) {
        let i = Date.now() - s.start;
        s.start = this.#c.now() - i;
      }
      this.set(e2, s.value, s);
    }
  }
  set(t, e2, s = {}) {
    if (e2 === undefined)
      return this.delete(t), this;
    let { ttl: i = this.ttl, start: r2, noDisposeOnSet: o2 = this.noDisposeOnSet, sizeCalculation: h2 = this.sizeCalculation, status: a } = s, { noUpdateTTL: l2 = this.noUpdateTTL } = s, u2 = this.#I(t, e2, s.size || 0, h2);
    if (this.maxEntrySize && u2 > this.maxEntrySize)
      return a && (a.set = "miss", a.maxEntrySizeExceeded = true), this.#O(t, "set"), this;
    let c = this.#h === 0 ? undefined : this.#f.get(t);
    if (c === undefined)
      c = this.#h === 0 ? this.#p : this.#R.length !== 0 ? this.#R.pop() : this.#h === this.#t ? this.#B(false) : this.#h, this.#a[c] = t, this.#i[c] = e2, this.#f.set(t, c), this.#d[this.#p] = c, this.#E[c] = this.#p, this.#p = c, this.#h++, this.#L(c, u2, a), a && (a.set = "add"), l2 = false, this.#_ && this.#r?.(e2, t, "add");
    else {
      this.#W(c);
      let d3 = this.#i[c];
      if (e2 !== d3) {
        if (this.#A && this.#l(d3)) {
          d3.__abortController.abort(new Error("replaced"));
          let { __staleWhileFetching: f } = d3;
          f !== undefined && !o2 && (this.#x && this.#n?.(f, t, "set"), this.#e && this.#m?.push([f, t, "set"]));
        } else
          o2 || (this.#x && this.#n?.(d3, t, "set"), this.#e && this.#m?.push([d3, t, "set"]));
        if (this.#P(c), this.#L(c, u2, a), this.#i[c] = e2, a) {
          a.set = "replace";
          let f = d3 && this.#l(d3) ? d3.__staleWhileFetching : d3;
          f !== undefined && (a.oldValue = f);
        }
      } else
        a && (a.set = "update");
      this.#_ && this.onInsert?.(e2, t, e2 === d3 ? "update" : "replace");
    }
    if (i !== 0 && !this.#g && this.#M(), this.#g && (l2 || this.#j(c, i, r2), a && this.#N(a, c)), !o2 && this.#e && this.#m) {
      let d3 = this.#m, f;
      for (;f = d3?.shift(); )
        this.#o?.(...f);
    }
    return this;
  }
  pop() {
    try {
      for (;this.#h; ) {
        let t = this.#i[this.#b];
        if (this.#B(true), this.#l(t)) {
          if (t.__staleWhileFetching)
            return t.__staleWhileFetching;
        } else if (t !== undefined)
          return t;
      }
    } finally {
      if (this.#e && this.#m) {
        let t = this.#m, e2;
        for (;e2 = t?.shift(); )
          this.#o?.(...e2);
      }
    }
  }
  #B(t) {
    let e2 = this.#b, s = this.#a[e2], i = this.#i[e2];
    return this.#A && this.#l(i) ? i.__abortController.abort(new Error("evicted")) : (this.#x || this.#e) && (this.#x && this.#n?.(i, s, "evict"), this.#e && this.#m?.push([i, s, "evict"])), this.#P(e2), this.#y?.[e2] && (clearTimeout(this.#y[e2]), this.#y[e2] = undefined), t && (this.#a[e2] = undefined, this.#i[e2] = undefined, this.#R.push(e2)), this.#h === 1 ? (this.#b = this.#p = 0, this.#R.length = 0) : this.#b = this.#d[e2], this.#f.delete(s), this.#h--, e2;
  }
  has(t, e2 = {}) {
    let { updateAgeOnHas: s = this.updateAgeOnHas, status: i } = e2, r2 = this.#f.get(t);
    if (r2 !== undefined) {
      let o2 = this.#i[r2];
      if (this.#l(o2) && o2.__staleWhileFetching === undefined)
        return false;
      if (this.#v(r2))
        i && (i.has = "stale", this.#N(i, r2));
      else
        return s && this.#k(r2), i && (i.has = "hit", this.#N(i, r2)), true;
    } else
      i && (i.has = "miss");
    return false;
  }
  peek(t, e2 = {}) {
    let { allowStale: s = this.allowStale } = e2, i = this.#f.get(t);
    if (i === undefined || !s && this.#v(i))
      return;
    let r2 = this.#i[i];
    return this.#l(r2) ? r2.__staleWhileFetching : r2;
  }
  #U(t, e2, s, i) {
    let r2 = e2 === undefined ? undefined : this.#i[e2];
    if (this.#l(r2))
      return r2;
    let o2 = new At, { signal: h2 } = s;
    h2?.addEventListener("abort", () => o2.abort(h2.reason), { signal: o2.signal });
    let a = { signal: o2.signal, options: s, context: i }, l2 = (p2, w2 = false) => {
      let { aborted: g2 } = o2.signal, S2 = s.ignoreFetchAbort && p2 !== undefined, E = s.ignoreFetchAbort || !!(s.allowStaleOnFetchAbort && p2 !== undefined);
      if (s.status && (g2 && !w2 ? (s.status.fetchAborted = true, s.status.fetchError = o2.signal.reason, S2 && (s.status.fetchAbortIgnored = true)) : s.status.fetchResolved = true), g2 && !S2 && !w2)
        return c(o2.signal.reason, E);
      let y3 = f, b3 = this.#i[e2];
      return (b3 === f || S2 && w2 && b3 === undefined) && (p2 === undefined ? y3.__staleWhileFetching !== undefined ? this.#i[e2] = y3.__staleWhileFetching : this.#O(t, "fetch") : (s.status && (s.status.fetchUpdated = true), this.set(t, p2, a.options))), p2;
    }, u2 = (p2) => (s.status && (s.status.fetchRejected = true, s.status.fetchError = p2), c(p2, false)), c = (p2, w2) => {
      let { aborted: g2 } = o2.signal, S2 = g2 && s.allowStaleOnFetchAbort, E = S2 || s.allowStaleOnFetchRejection, y3 = E || s.noDeleteOnFetchRejection, b3 = f;
      if (this.#i[e2] === f && (!y3 || !w2 && b3.__staleWhileFetching === undefined ? this.#O(t, "fetch") : S2 || (this.#i[e2] = b3.__staleWhileFetching)), E)
        return s.status && b3.__staleWhileFetching !== undefined && (s.status.returnedStale = true), b3.__staleWhileFetching;
      if (b3.__returned === b3)
        throw p2;
    }, d3 = (p2, w2) => {
      let g2 = this.#S?.(t, r2, a);
      g2 && g2 instanceof Promise && g2.then((S2) => p2(S2 === undefined ? undefined : S2), w2), o2.signal.addEventListener("abort", () => {
        (!s.ignoreFetchAbort || s.allowStaleOnFetchAbort) && (p2(undefined), s.allowStaleOnFetchAbort && (p2 = (S2) => l2(S2, true)));
      });
    };
    s.status && (s.status.fetchDispatched = true);
    let f = new Promise(d3).then(l2, u2), m2 = Object.assign(f, { __abortController: o2, __staleWhileFetching: r2, __returned: undefined });
    return e2 === undefined ? (this.set(t, m2, { ...a.options, status: undefined }), e2 = this.#f.get(t)) : this.#i[e2] = m2, m2;
  }
  #l(t) {
    if (!this.#A)
      return false;
    let e2 = t;
    return !!e2 && e2 instanceof Promise && e2.hasOwnProperty("__staleWhileFetching") && e2.__abortController instanceof At;
  }
  async fetch(t, e2 = {}) {
    let { allowStale: s = this.allowStale, updateAgeOnGet: i = this.updateAgeOnGet, noDeleteOnStaleGet: r2 = this.noDeleteOnStaleGet, ttl: o2 = this.ttl, noDisposeOnSet: h2 = this.noDisposeOnSet, size: a = 0, sizeCalculation: l2 = this.sizeCalculation, noUpdateTTL: u2 = this.noUpdateTTL, noDeleteOnFetchRejection: c = this.noDeleteOnFetchRejection, allowStaleOnFetchRejection: d3 = this.allowStaleOnFetchRejection, ignoreFetchAbort: f = this.ignoreFetchAbort, allowStaleOnFetchAbort: m2 = this.allowStaleOnFetchAbort, context: p2, forceRefresh: w2 = false, status: g2, signal: S2 } = e2;
    if (!this.#A)
      return g2 && (g2.fetch = "get"), this.get(t, { allowStale: s, updateAgeOnGet: i, noDeleteOnStaleGet: r2, status: g2 });
    let E = { allowStale: s, updateAgeOnGet: i, noDeleteOnStaleGet: r2, ttl: o2, noDisposeOnSet: h2, size: a, sizeCalculation: l2, noUpdateTTL: u2, noDeleteOnFetchRejection: c, allowStaleOnFetchRejection: d3, allowStaleOnFetchAbort: m2, ignoreFetchAbort: f, status: g2, signal: S2 }, y3 = this.#f.get(t);
    if (y3 === undefined) {
      g2 && (g2.fetch = "miss");
      let b3 = this.#U(t, y3, E, p2);
      return b3.__returned = b3;
    } else {
      let b3 = this.#i[y3];
      if (this.#l(b3)) {
        let Z = s && b3.__staleWhileFetching !== undefined;
        return g2 && (g2.fetch = "inflight", Z && (g2.returnedStale = true)), Z ? b3.__staleWhileFetching : b3.__returned = b3;
      }
      let z2 = this.#v(y3);
      if (!w2 && !z2)
        return g2 && (g2.fetch = "hit"), this.#W(y3), i && this.#k(y3), g2 && this.#N(g2, y3), b3;
      let $3 = this.#U(t, y3, E, p2), J3 = $3.__staleWhileFetching !== undefined && s;
      return g2 && (g2.fetch = z2 ? "stale" : "refresh", J3 && z2 && (g2.returnedStale = true)), J3 ? $3.__staleWhileFetching : $3.__returned = $3;
    }
  }
  async forceFetch(t, e2 = {}) {
    let s = await this.fetch(t, e2);
    if (s === undefined)
      throw new Error("fetch() returned undefined");
    return s;
  }
  memo(t, e2 = {}) {
    let s = this.#w;
    if (!s)
      throw new Error("no memoMethod provided to constructor");
    let { context: i, forceRefresh: r2, ...o2 } = e2, h2 = this.get(t, o2);
    if (!r2 && h2 !== undefined)
      return h2;
    let a = s(t, h2, { options: o2, context: i });
    return this.set(t, a, o2), a;
  }
  get(t, e2 = {}) {
    let { allowStale: s = this.allowStale, updateAgeOnGet: i = this.updateAgeOnGet, noDeleteOnStaleGet: r2 = this.noDeleteOnStaleGet, status: o2 } = e2, h2 = this.#f.get(t);
    if (h2 !== undefined) {
      let a = this.#i[h2], l2 = this.#l(a);
      return o2 && this.#N(o2, h2), this.#v(h2) ? (o2 && (o2.get = "stale"), l2 ? (o2 && s && a.__staleWhileFetching !== undefined && (o2.returnedStale = true), s ? a.__staleWhileFetching : undefined) : (r2 || this.#O(t, "expire"), o2 && s && (o2.returnedStale = true), s ? a : undefined)) : (o2 && (o2.get = "hit"), l2 ? a.__staleWhileFetching : (this.#W(h2), i && this.#k(h2), a));
    } else
      o2 && (o2.get = "miss");
  }
  #$(t, e2) {
    this.#E[e2] = t, this.#d[t] = e2;
  }
  #W(t) {
    t !== this.#p && (t === this.#b ? this.#b = this.#d[t] : this.#$(this.#E[t], this.#d[t]), this.#$(this.#p, t), this.#p = t);
  }
  delete(t) {
    return this.#O(t, "delete");
  }
  #O(t, e2) {
    let s = false;
    if (this.#h !== 0) {
      let i = this.#f.get(t);
      if (i !== undefined)
        if (this.#y?.[i] && (clearTimeout(this.#y?.[i]), this.#y[i] = undefined), s = true, this.#h === 1)
          this.#H(e2);
        else {
          this.#P(i);
          let r2 = this.#i[i];
          if (this.#l(r2) ? r2.__abortController.abort(new Error("deleted")) : (this.#x || this.#e) && (this.#x && this.#n?.(r2, t, e2), this.#e && this.#m?.push([r2, t, e2])), this.#f.delete(t), this.#a[i] = undefined, this.#i[i] = undefined, i === this.#p)
            this.#p = this.#E[i];
          else if (i === this.#b)
            this.#b = this.#d[i];
          else {
            let o2 = this.#E[i];
            this.#d[o2] = this.#d[i];
            let h2 = this.#d[i];
            this.#E[h2] = this.#E[i];
          }
          this.#h--, this.#R.push(i);
        }
    }
    if (this.#e && this.#m?.length) {
      let i = this.#m, r2;
      for (;r2 = i?.shift(); )
        this.#o?.(...r2);
    }
    return s;
  }
  clear() {
    return this.#H("delete");
  }
  #H(t) {
    for (let e2 of this.#D({ allowStale: true })) {
      let s = this.#i[e2];
      if (this.#l(s))
        s.__abortController.abort(new Error("deleted"));
      else {
        let i = this.#a[e2];
        this.#x && this.#n?.(s, i, t), this.#e && this.#m?.push([s, i, t]);
      }
    }
    if (this.#f.clear(), this.#i.fill(undefined), this.#a.fill(undefined), this.#g && this.#T) {
      this.#g.fill(0), this.#T.fill(0);
      for (let e2 of this.#y ?? [])
        e2 !== undefined && clearTimeout(e2);
      this.#y?.fill(undefined);
    }
    if (this.#C && this.#C.fill(0), this.#b = 0, this.#p = 0, this.#R.length = 0, this.#u = 0, this.#h = 0, this.#e && this.#m) {
      let e2 = this.#m, s;
      for (;s = e2?.shift(); )
        this.#o?.(...s);
    }
  }
};
var Ne = typeof process == "object" && process ? process : { stdout: null, stderr: null };
var oi = (n2) => !!n2 && typeof n2 == "object" && (n2 instanceof V3 || n2 instanceof Pe || hi(n2) || ai(n2));
var hi = (n2) => !!n2 && typeof n2 == "object" && n2 instanceof ee && typeof n2.pipe == "function" && n2.pipe !== Pe.Writable.prototype.pipe;
var ai = (n2) => !!n2 && typeof n2 == "object" && n2 instanceof ee && typeof n2.write == "function" && typeof n2.end == "function";
var G3 = Symbol("EOF");
var H2 = Symbol("maybeEmitEnd");
var K3 = Symbol("emittedEnd");
var kt = Symbol("emittingEnd");
var ut = Symbol("emittedError");
var Rt = Symbol("closed");
var _e = Symbol("read");
var Ot = Symbol("flush");
var Le = Symbol("flushChunk");
var P3 = Symbol("encoding");
var et = Symbol("decoder");
var v2 = Symbol("flowing");
var dt = Symbol("paused");
var st = Symbol("resume");
var C2 = Symbol("buffer");
var F2 = Symbol("pipes");
var T2 = Symbol("bufferLength");
var Yt = Symbol("bufferPush");
var Ft = Symbol("bufferShift");
var k3 = Symbol("objectMode");
var x2 = Symbol("destroyed");
var Xt = Symbol("error");
var Jt = Symbol("emitData");
var We = Symbol("emitEnd");
var Zt = Symbol("emitEnd2");
var B2 = Symbol("async");
var Qt = Symbol("abort");
var Dt = Symbol("aborted");
var pt = Symbol("signal");
var Y3 = Symbol("dataListeners");
var M2 = Symbol("discarded");
var mt = (n2) => Promise.resolve().then(n2);
var li = (n2) => n2();
var ci = (n2) => n2 === "end" || n2 === "finish" || n2 === "prefinish";
var fi = (n2) => n2 instanceof ArrayBuffer || !!n2 && typeof n2 == "object" && n2.constructor && n2.constructor.name === "ArrayBuffer" && n2.byteLength >= 0;
var ui = (n2) => !Buffer.isBuffer(n2) && ArrayBuffer.isView(n2);
var Mt = class {
  src;
  dest;
  opts;
  ondrain;
  constructor(t, e2, s) {
    this.src = t, this.dest = e2, this.opts = s, this.ondrain = () => t[st](), this.dest.on("drain", this.ondrain);
  }
  unpipe() {
    this.dest.removeListener("drain", this.ondrain);
  }
  proxyErrors(t) {}
  end() {
    this.unpipe(), this.opts.end && this.dest.end();
  }
};
var te = class extends Mt {
  unpipe() {
    this.src.removeListener("error", this.proxyErrors), super.unpipe();
  }
  constructor(t, e2, s) {
    super(t, e2, s), this.proxyErrors = (i) => this.dest.emit("error", i), t.on("error", this.proxyErrors);
  }
};
var di = (n2) => !!n2.objectMode;
var pi = (n2) => !n2.objectMode && !!n2.encoding && n2.encoding !== "buffer";
var V3 = class extends ee {
  [v2] = false;
  [dt] = false;
  [F2] = [];
  [C2] = [];
  [k3];
  [P3];
  [B2];
  [et];
  [G3] = false;
  [K3] = false;
  [kt] = false;
  [Rt] = false;
  [ut] = null;
  [T2] = 0;
  [x2] = false;
  [pt];
  [Dt] = false;
  [Y3] = 0;
  [M2] = false;
  writable = true;
  readable = true;
  constructor(...t) {
    let e2 = t[0] || {};
    if (super(), e2.objectMode && typeof e2.encoding == "string")
      throw new TypeError("Encoding and objectMode may not be used together");
    di(e2) ? (this[k3] = true, this[P3] = null) : pi(e2) ? (this[P3] = e2.encoding, this[k3] = false) : (this[k3] = false, this[P3] = null), this[B2] = !!e2.async, this[et] = this[P3] ? new ni(this[P3]) : null, e2 && e2.debugExposeBuffer === true && Object.defineProperty(this, "buffer", { get: () => this[C2] }), e2 && e2.debugExposePipes === true && Object.defineProperty(this, "pipes", { get: () => this[F2] });
    let { signal: s } = e2;
    s && (this[pt] = s, s.aborted ? this[Qt]() : s.addEventListener("abort", () => this[Qt]()));
  }
  get bufferLength() {
    return this[T2];
  }
  get encoding() {
    return this[P3];
  }
  set encoding(t) {
    throw new Error("Encoding must be set at instantiation time");
  }
  setEncoding(t) {
    throw new Error("Encoding must be set at instantiation time");
  }
  get objectMode() {
    return this[k3];
  }
  set objectMode(t) {
    throw new Error("objectMode must be set at instantiation time");
  }
  get async() {
    return this[B2];
  }
  set async(t) {
    this[B2] = this[B2] || !!t;
  }
  [Qt]() {
    this[Dt] = true, this.emit("abort", this[pt]?.reason), this.destroy(this[pt]?.reason);
  }
  get aborted() {
    return this[Dt];
  }
  set aborted(t) {}
  write(t, e2, s) {
    if (this[Dt])
      return false;
    if (this[G3])
      throw new Error("write after end");
    if (this[x2])
      return this.emit("error", Object.assign(new Error("Cannot call write after a stream was destroyed"), { code: "ERR_STREAM_DESTROYED" })), true;
    typeof e2 == "function" && (s = e2, e2 = "utf8"), e2 || (e2 = "utf8");
    let i = this[B2] ? mt : li;
    if (!this[k3] && !Buffer.isBuffer(t)) {
      if (ui(t))
        t = Buffer.from(t.buffer, t.byteOffset, t.byteLength);
      else if (fi(t))
        t = Buffer.from(t);
      else if (typeof t != "string")
        throw new Error("Non-contiguous data written to non-objectMode stream");
    }
    return this[k3] ? (this[v2] && this[T2] !== 0 && this[Ot](true), this[v2] ? this.emit("data", t) : this[Yt](t), this[T2] !== 0 && this.emit("readable"), s && i(s), this[v2]) : t.length ? (typeof t == "string" && !(e2 === this[P3] && !this[et]?.lastNeed) && (t = Buffer.from(t, e2)), Buffer.isBuffer(t) && this[P3] && (t = this[et].write(t)), this[v2] && this[T2] !== 0 && this[Ot](true), this[v2] ? this.emit("data", t) : this[Yt](t), this[T2] !== 0 && this.emit("readable"), s && i(s), this[v2]) : (this[T2] !== 0 && this.emit("readable"), s && i(s), this[v2]);
  }
  read(t) {
    if (this[x2])
      return null;
    if (this[M2] = false, this[T2] === 0 || t === 0 || t && t > this[T2])
      return this[H2](), null;
    this[k3] && (t = null), this[C2].length > 1 && !this[k3] && (this[C2] = [this[P3] ? this[C2].join("") : Buffer.concat(this[C2], this[T2])]);
    let e2 = this[_e](t || null, this[C2][0]);
    return this[H2](), e2;
  }
  [_e](t, e2) {
    if (this[k3])
      this[Ft]();
    else {
      let s = e2;
      t === s.length || t === null ? this[Ft]() : typeof s == "string" ? (this[C2][0] = s.slice(t), e2 = s.slice(0, t), this[T2] -= t) : (this[C2][0] = s.subarray(t), e2 = s.subarray(0, t), this[T2] -= t);
    }
    return this.emit("data", e2), !this[C2].length && !this[G3] && this.emit("drain"), e2;
  }
  end(t, e2, s) {
    return typeof t == "function" && (s = t, t = undefined), typeof e2 == "function" && (s = e2, e2 = "utf8"), t !== undefined && this.write(t, e2), s && this.once("end", s), this[G3] = true, this.writable = false, (this[v2] || !this[dt]) && this[H2](), this;
  }
  [st]() {
    this[x2] || (!this[Y3] && !this[F2].length && (this[M2] = true), this[dt] = false, this[v2] = true, this.emit("resume"), this[C2].length ? this[Ot]() : this[G3] ? this[H2]() : this.emit("drain"));
  }
  resume() {
    return this[st]();
  }
  pause() {
    this[v2] = false, this[dt] = true, this[M2] = false;
  }
  get destroyed() {
    return this[x2];
  }
  get flowing() {
    return this[v2];
  }
  get paused() {
    return this[dt];
  }
  [Yt](t) {
    this[k3] ? this[T2] += 1 : this[T2] += t.length, this[C2].push(t);
  }
  [Ft]() {
    return this[k3] ? this[T2] -= 1 : this[T2] -= this[C2][0].length, this[C2].shift();
  }
  [Ot](t = false) {
    do
      ;
    while (this[Le](this[Ft]()) && this[C2].length);
    !t && !this[C2].length && !this[G3] && this.emit("drain");
  }
  [Le](t) {
    return this.emit("data", t), this[v2];
  }
  pipe(t, e2) {
    if (this[x2])
      return t;
    this[M2] = false;
    let s = this[K3];
    return e2 = e2 || {}, t === Ne.stdout || t === Ne.stderr ? e2.end = false : e2.end = e2.end !== false, e2.proxyErrors = !!e2.proxyErrors, s ? e2.end && t.end() : (this[F2].push(e2.proxyErrors ? new te(this, t, e2) : new Mt(this, t, e2)), this[B2] ? mt(() => this[st]()) : this[st]()), t;
  }
  unpipe(t) {
    let e2 = this[F2].find((s) => s.dest === t);
    e2 && (this[F2].length === 1 ? (this[v2] && this[Y3] === 0 && (this[v2] = false), this[F2] = []) : this[F2].splice(this[F2].indexOf(e2), 1), e2.unpipe());
  }
  addListener(t, e2) {
    return this.on(t, e2);
  }
  on(t, e2) {
    let s = super.on(t, e2);
    if (t === "data")
      this[M2] = false, this[Y3]++, !this[F2].length && !this[v2] && this[st]();
    else if (t === "readable" && this[T2] !== 0)
      super.emit("readable");
    else if (ci(t) && this[K3])
      super.emit(t), this.removeAllListeners(t);
    else if (t === "error" && this[ut]) {
      let i = e2;
      this[B2] ? mt(() => i.call(this, this[ut])) : i.call(this, this[ut]);
    }
    return s;
  }
  removeListener(t, e2) {
    return this.off(t, e2);
  }
  off(t, e2) {
    let s = super.off(t, e2);
    return t === "data" && (this[Y3] = this.listeners("data").length, this[Y3] === 0 && !this[M2] && !this[F2].length && (this[v2] = false)), s;
  }
  removeAllListeners(t) {
    let e2 = super.removeAllListeners(t);
    return (t === "data" || t === undefined) && (this[Y3] = 0, !this[M2] && !this[F2].length && (this[v2] = false)), e2;
  }
  get emittedEnd() {
    return this[K3];
  }
  [H2]() {
    !this[kt] && !this[K3] && !this[x2] && this[C2].length === 0 && this[G3] && (this[kt] = true, this.emit("end"), this.emit("prefinish"), this.emit("finish"), this[Rt] && this.emit("close"), this[kt] = false);
  }
  emit(t, ...e2) {
    let s = e2[0];
    if (t !== "error" && t !== "close" && t !== x2 && this[x2])
      return false;
    if (t === "data")
      return !this[k3] && !s ? false : this[B2] ? (mt(() => this[Jt](s)), true) : this[Jt](s);
    if (t === "end")
      return this[We]();
    if (t === "close") {
      if (this[Rt] = true, !this[K3] && !this[x2])
        return false;
      let r2 = super.emit("close");
      return this.removeAllListeners("close"), r2;
    } else if (t === "error") {
      this[ut] = s, super.emit(Xt, s);
      let r2 = !this[pt] || this.listeners("error").length ? super.emit("error", s) : false;
      return this[H2](), r2;
    } else if (t === "resume") {
      let r2 = super.emit("resume");
      return this[H2](), r2;
    } else if (t === "finish" || t === "prefinish") {
      let r2 = super.emit(t);
      return this.removeAllListeners(t), r2;
    }
    let i = super.emit(t, ...e2);
    return this[H2](), i;
  }
  [Jt](t) {
    for (let s of this[F2])
      s.dest.write(t) === false && this.pause();
    let e2 = this[M2] ? false : super.emit("data", t);
    return this[H2](), e2;
  }
  [We]() {
    return this[K3] ? false : (this[K3] = true, this.readable = false, this[B2] ? (mt(() => this[Zt]()), true) : this[Zt]());
  }
  [Zt]() {
    if (this[et]) {
      let e2 = this[et].end();
      if (e2) {
        for (let s of this[F2])
          s.dest.write(e2);
        this[M2] || super.emit("data", e2);
      }
    }
    for (let e2 of this[F2])
      e2.end();
    let t = super.emit("end");
    return this.removeAllListeners("end"), t;
  }
  async collect() {
    let t = Object.assign([], { dataLength: 0 });
    this[k3] || (t.dataLength = 0);
    let e2 = this.promise();
    return this.on("data", (s) => {
      t.push(s), this[k3] || (t.dataLength += s.length);
    }), await e2, t;
  }
  async concat() {
    if (this[k3])
      throw new Error("cannot concat in objectMode");
    let t = await this.collect();
    return this[P3] ? t.join("") : Buffer.concat(t, t.dataLength);
  }
  async promise() {
    return new Promise((t, e2) => {
      this.on(x2, () => e2(new Error("stream destroyed"))), this.on("error", (s) => e2(s)), this.on("end", () => t());
    });
  }
  [Symbol.asyncIterator]() {
    this[M2] = false;
    let t = false, e2 = async () => (this.pause(), t = true, { value: undefined, done: true });
    return { next: () => {
      if (t)
        return e2();
      let i = this.read();
      if (i !== null)
        return Promise.resolve({ done: false, value: i });
      if (this[G3])
        return e2();
      let r2, o2, h2 = (c) => {
        this.off("data", a), this.off("end", l2), this.off(x2, u2), e2(), o2(c);
      }, a = (c) => {
        this.off("error", h2), this.off("end", l2), this.off(x2, u2), this.pause(), r2({ value: c, done: !!this[G3] });
      }, l2 = () => {
        this.off("error", h2), this.off("data", a), this.off(x2, u2), e2(), r2({ done: true, value: undefined });
      }, u2 = () => h2(new Error("stream destroyed"));
      return new Promise((c, d3) => {
        o2 = d3, r2 = c, this.once(x2, u2), this.once("error", h2), this.once("end", l2), this.once("data", a);
      });
    }, throw: e2, return: e2, [Symbol.asyncIterator]() {
      return this;
    }, [Symbol.asyncDispose]: async () => {} };
  }
  [Symbol.iterator]() {
    this[M2] = false;
    let t = false, e2 = () => (this.pause(), this.off(Xt, e2), this.off(x2, e2), this.off("end", e2), t = true, { done: true, value: undefined }), s = () => {
      if (t)
        return e2();
      let i = this.read();
      return i === null ? e2() : { done: false, value: i };
    };
    return this.once("end", e2), this.once(Xt, e2), this.once(x2, e2), { next: s, throw: e2, return: e2, [Symbol.iterator]() {
      return this;
    }, [Symbol.dispose]: () => {} };
  }
  destroy(t) {
    if (this[x2])
      return t ? this.emit("error", t) : this.emit(x2), this;
    this[x2] = true, this[M2] = true, this[C2].length = 0, this[T2] = 0;
    let e2 = this;
    return typeof e2.close == "function" && !this[Rt] && e2.close(), t ? this.emit("error", t) : this.emit(x2), this;
  }
  static get isStream() {
    return oi;
  }
};
var vi = Ei.native;
var wt = { lstatSync: wi, readdir: yi, readdirSync: bi, readlinkSync: Si, realpathSync: vi, promises: { lstat: Ci, readdir: Ti, readlink: Ai, realpath: ki } };
var Ue = (n2) => !n2 || n2 === wt || n2 === xi ? wt : { ...wt, ...n2, promises: { ...wt.promises, ...n2.promises || {} } };
var $e2 = /^\\\\\?\\([a-z]:)\\?$/i;
var Ri = (n2) => n2.replace(/\//g, "\\").replace($e2, "$1\\");
var Oi = /[\\\/]/;
var L3 = 0;
var Ge = 1;
var He = 2;
var U2 = 4;
var qe = 6;
var Ke = 8;
var X2 = 10;
var Ve = 12;
var _3 = 15;
var gt = ~_3;
var se = 16;
var je = 32;
var yt = 64;
var j2 = 128;
var Nt = 256;
var Lt = 512;
var Ie2 = yt | j2 | Lt;
var Fi = 1023;
var ie = (n2) => n2.isFile() ? Ke : n2.isDirectory() ? U2 : n2.isSymbolicLink() ? X2 : n2.isCharacterDevice() ? He : n2.isBlockDevice() ? qe : n2.isSocket() ? Ve : n2.isFIFO() ? Ge : L3;
var ze = new ft({ max: 2 ** 12 });
var bt = (n2) => {
  let t = ze.get(n2);
  if (t)
    return t;
  let e2 = n2.normalize("NFKD");
  return ze.set(n2, e2), e2;
};
var Be = new ft({ max: 2 ** 12 });
var _t = (n2) => {
  let t = Be.get(n2);
  if (t)
    return t;
  let e2 = bt(n2.toLowerCase());
  return Be.set(n2, e2), e2;
};
var Wt = class extends ft {
  constructor() {
    super({ max: 256 });
  }
};
var ne = class extends ft {
  constructor(t = 16 * 1024) {
    super({ maxSize: t, sizeCalculation: (e2) => e2.length + 1 });
  }
};
var Ye = Symbol("PathScurry setAsCwd");
var R2 = class {
  name;
  root;
  roots;
  parent;
  nocase;
  isCWD = false;
  #t;
  #s;
  get dev() {
    return this.#s;
  }
  #n;
  get mode() {
    return this.#n;
  }
  #r;
  get nlink() {
    return this.#r;
  }
  #o;
  get uid() {
    return this.#o;
  }
  #S;
  get gid() {
    return this.#S;
  }
  #w;
  get rdev() {
    return this.#w;
  }
  #c;
  get blksize() {
    return this.#c;
  }
  #h;
  get ino() {
    return this.#h;
  }
  #u;
  get size() {
    return this.#u;
  }
  #f;
  get blocks() {
    return this.#f;
  }
  #a;
  get atimeMs() {
    return this.#a;
  }
  #i;
  get mtimeMs() {
    return this.#i;
  }
  #d;
  get ctimeMs() {
    return this.#d;
  }
  #E;
  get birthtimeMs() {
    return this.#E;
  }
  #b;
  get atime() {
    return this.#b;
  }
  #p;
  get mtime() {
    return this.#p;
  }
  #R;
  get ctime() {
    return this.#R;
  }
  #m;
  get birthtime() {
    return this.#m;
  }
  #C;
  #T;
  #g;
  #y;
  #x;
  #A;
  #e;
  #_;
  #M;
  #k;
  get parentPath() {
    return (this.parent || this).fullpath();
  }
  get path() {
    return this.parentPath;
  }
  constructor(t, e2 = L3, s, i, r2, o2, h2) {
    this.name = t, this.#C = r2 ? _t(t) : bt(t), this.#e = e2 & Fi, this.nocase = r2, this.roots = i, this.root = s || this, this.#_ = o2, this.#g = h2.fullpath, this.#x = h2.relative, this.#A = h2.relativePosix, this.parent = h2.parent, this.parent ? this.#t = this.parent.#t : this.#t = Ue(h2.fs);
  }
  depth() {
    return this.#T !== undefined ? this.#T : this.parent ? this.#T = this.parent.depth() + 1 : this.#T = 0;
  }
  childrenCache() {
    return this.#_;
  }
  resolve(t) {
    if (!t)
      return this;
    let e2 = this.getRootString(t), i = t.substring(e2.length).split(this.splitSep);
    return e2 ? this.getRoot(e2).#N(i) : this.#N(i);
  }
  #N(t) {
    let e2 = this;
    for (let s of t)
      e2 = e2.child(s);
    return e2;
  }
  children() {
    let t = this.#_.get(this);
    if (t)
      return t;
    let e2 = Object.assign([], { provisional: 0 });
    return this.#_.set(this, e2), this.#e &= ~se, e2;
  }
  child(t, e2) {
    if (t === "" || t === ".")
      return this;
    if (t === "..")
      return this.parent || this;
    let s = this.children(), i = this.nocase ? _t(t) : bt(t);
    for (let a of s)
      if (a.#C === i)
        return a;
    let r2 = this.parent ? this.sep : "", o2 = this.#g ? this.#g + r2 + t : undefined, h2 = this.newChild(t, L3, { ...e2, parent: this, fullpath: o2 });
    return this.canReaddir() || (h2.#e |= j2), s.push(h2), h2;
  }
  relative() {
    if (this.isCWD)
      return "";
    if (this.#x !== undefined)
      return this.#x;
    let t = this.name, e2 = this.parent;
    if (!e2)
      return this.#x = this.name;
    let s = e2.relative();
    return s + (!s || !e2.parent ? "" : this.sep) + t;
  }
  relativePosix() {
    if (this.sep === "/")
      return this.relative();
    if (this.isCWD)
      return "";
    if (this.#A !== undefined)
      return this.#A;
    let t = this.name, e2 = this.parent;
    if (!e2)
      return this.#A = this.fullpathPosix();
    let s = e2.relativePosix();
    return s + (!s || !e2.parent ? "" : "/") + t;
  }
  fullpath() {
    if (this.#g !== undefined)
      return this.#g;
    let t = this.name, e2 = this.parent;
    if (!e2)
      return this.#g = this.name;
    let i = e2.fullpath() + (e2.parent ? this.sep : "") + t;
    return this.#g = i;
  }
  fullpathPosix() {
    if (this.#y !== undefined)
      return this.#y;
    if (this.sep === "/")
      return this.#y = this.fullpath();
    if (!this.parent) {
      let i = this.fullpath().replace(/\\/g, "/");
      return /^[a-z]:\//i.test(i) ? this.#y = `//?/${i}` : this.#y = i;
    }
    let t = this.parent, e2 = t.fullpathPosix(), s = e2 + (!e2 || !t.parent ? "" : "/") + this.name;
    return this.#y = s;
  }
  isUnknown() {
    return (this.#e & _3) === L3;
  }
  isType(t) {
    return this[`is${t}`]();
  }
  getType() {
    return this.isUnknown() ? "Unknown" : this.isDirectory() ? "Directory" : this.isFile() ? "File" : this.isSymbolicLink() ? "SymbolicLink" : this.isFIFO() ? "FIFO" : this.isCharacterDevice() ? "CharacterDevice" : this.isBlockDevice() ? "BlockDevice" : this.isSocket() ? "Socket" : "Unknown";
  }
  isFile() {
    return (this.#e & _3) === Ke;
  }
  isDirectory() {
    return (this.#e & _3) === U2;
  }
  isCharacterDevice() {
    return (this.#e & _3) === He;
  }
  isBlockDevice() {
    return (this.#e & _3) === qe;
  }
  isFIFO() {
    return (this.#e & _3) === Ge;
  }
  isSocket() {
    return (this.#e & _3) === Ve;
  }
  isSymbolicLink() {
    return (this.#e & X2) === X2;
  }
  lstatCached() {
    return this.#e & je ? this : undefined;
  }
  readlinkCached() {
    return this.#M;
  }
  realpathCached() {
    return this.#k;
  }
  readdirCached() {
    let t = this.children();
    return t.slice(0, t.provisional);
  }
  canReadlink() {
    if (this.#M)
      return true;
    if (!this.parent)
      return false;
    let t = this.#e & _3;
    return !(t !== L3 && t !== X2 || this.#e & Nt || this.#e & j2);
  }
  calledReaddir() {
    return !!(this.#e & se);
  }
  isENOENT() {
    return !!(this.#e & j2);
  }
  isNamed(t) {
    return this.nocase ? this.#C === _t(t) : this.#C === bt(t);
  }
  async readlink() {
    let t = this.#M;
    if (t)
      return t;
    if (this.canReadlink() && this.parent)
      try {
        let e2 = await this.#t.promises.readlink(this.fullpath()), s = (await this.parent.realpath())?.resolve(e2);
        if (s)
          return this.#M = s;
      } catch (e2) {
        this.#D(e2.code);
        return;
      }
  }
  readlinkSync() {
    let t = this.#M;
    if (t)
      return t;
    if (this.canReadlink() && this.parent)
      try {
        let e2 = this.#t.readlinkSync(this.fullpath()), s = this.parent.realpathSync()?.resolve(e2);
        if (s)
          return this.#M = s;
      } catch (e2) {
        this.#D(e2.code);
        return;
      }
  }
  #j(t) {
    this.#e |= se;
    for (let e2 = t.provisional;e2 < t.length; e2++) {
      let s = t[e2];
      s && s.#v();
    }
  }
  #v() {
    this.#e & j2 || (this.#e = (this.#e | j2) & gt, this.#G());
  }
  #G() {
    let t = this.children();
    t.provisional = 0;
    for (let e2 of t)
      e2.#v();
  }
  #P() {
    this.#e |= Lt, this.#L();
  }
  #L() {
    if (this.#e & yt)
      return;
    let t = this.#e;
    (t & _3) === U2 && (t &= gt), this.#e = t | yt, this.#G();
  }
  #I(t = "") {
    t === "ENOTDIR" || t === "EPERM" ? this.#L() : t === "ENOENT" ? this.#v() : this.children().provisional = 0;
  }
  #F(t = "") {
    t === "ENOTDIR" ? this.parent.#L() : t === "ENOENT" && this.#v();
  }
  #D(t = "") {
    let e2 = this.#e;
    e2 |= Nt, t === "ENOENT" && (e2 |= j2), (t === "EINVAL" || t === "UNKNOWN") && (e2 &= gt), this.#e = e2, t === "ENOTDIR" && this.parent && this.parent.#L();
  }
  #z(t, e2) {
    return this.#U(t, e2) || this.#B(t, e2);
  }
  #B(t, e2) {
    let s = ie(t), i = this.newChild(t.name, s, { parent: this }), r2 = i.#e & _3;
    return r2 !== U2 && r2 !== X2 && r2 !== L3 && (i.#e |= yt), e2.unshift(i), e2.provisional++, i;
  }
  #U(t, e2) {
    for (let s = e2.provisional;s < e2.length; s++) {
      let i = e2[s];
      if ((this.nocase ? _t(t.name) : bt(t.name)) === i.#C)
        return this.#l(t, i, s, e2);
    }
  }
  #l(t, e2, s, i) {
    let r2 = e2.name;
    return e2.#e = e2.#e & gt | ie(t), r2 !== t.name && (e2.name = t.name), s !== i.provisional && (s === i.length - 1 ? i.pop() : i.splice(s, 1), i.unshift(e2)), i.provisional++, e2;
  }
  async lstat() {
    if ((this.#e & j2) === 0)
      try {
        return this.#$(await this.#t.promises.lstat(this.fullpath())), this;
      } catch (t) {
        this.#F(t.code);
      }
  }
  lstatSync() {
    if ((this.#e & j2) === 0)
      try {
        return this.#$(this.#t.lstatSync(this.fullpath())), this;
      } catch (t) {
        this.#F(t.code);
      }
  }
  #$(t) {
    let { atime: e2, atimeMs: s, birthtime: i, birthtimeMs: r2, blksize: o2, blocks: h2, ctime: a, ctimeMs: l2, dev: u2, gid: c, ino: d3, mode: f, mtime: m2, mtimeMs: p2, nlink: w2, rdev: g2, size: S2, uid: E } = t;
    this.#b = e2, this.#a = s, this.#m = i, this.#E = r2, this.#c = o2, this.#f = h2, this.#R = a, this.#d = l2, this.#s = u2, this.#S = c, this.#h = d3, this.#n = f, this.#p = m2, this.#i = p2, this.#r = w2, this.#w = g2, this.#u = S2, this.#o = E;
    let y3 = ie(t);
    this.#e = this.#e & gt | y3 | je, y3 !== L3 && y3 !== U2 && y3 !== X2 && (this.#e |= yt);
  }
  #W = [];
  #O = false;
  #H(t) {
    this.#O = false;
    let e2 = this.#W.slice();
    this.#W.length = 0, e2.forEach((s) => s(null, t));
  }
  readdirCB(t, e2 = false) {
    if (!this.canReaddir()) {
      e2 ? t(null, []) : queueMicrotask(() => t(null, []));
      return;
    }
    let s = this.children();
    if (this.calledReaddir()) {
      let r2 = s.slice(0, s.provisional);
      e2 ? t(null, r2) : queueMicrotask(() => t(null, r2));
      return;
    }
    if (this.#W.push(t), this.#O)
      return;
    this.#O = true;
    let i = this.fullpath();
    this.#t.readdir(i, { withFileTypes: true }, (r2, o2) => {
      if (r2)
        this.#I(r2.code), s.provisional = 0;
      else {
        for (let h2 of o2)
          this.#z(h2, s);
        this.#j(s);
      }
      this.#H(s.slice(0, s.provisional));
    });
  }
  #q;
  async readdir() {
    if (!this.canReaddir())
      return [];
    let t = this.children();
    if (this.calledReaddir())
      return t.slice(0, t.provisional);
    let e2 = this.fullpath();
    if (this.#q)
      await this.#q;
    else {
      let s = () => {};
      this.#q = new Promise((i) => s = i);
      try {
        for (let i of await this.#t.promises.readdir(e2, { withFileTypes: true }))
          this.#z(i, t);
        this.#j(t);
      } catch (i) {
        this.#I(i.code), t.provisional = 0;
      }
      this.#q = undefined, s();
    }
    return t.slice(0, t.provisional);
  }
  readdirSync() {
    if (!this.canReaddir())
      return [];
    let t = this.children();
    if (this.calledReaddir())
      return t.slice(0, t.provisional);
    let e2 = this.fullpath();
    try {
      for (let s of this.#t.readdirSync(e2, { withFileTypes: true }))
        this.#z(s, t);
      this.#j(t);
    } catch (s) {
      this.#I(s.code), t.provisional = 0;
    }
    return t.slice(0, t.provisional);
  }
  canReaddir() {
    if (this.#e & Ie2)
      return false;
    let t = _3 & this.#e;
    return t === L3 || t === U2 || t === X2;
  }
  shouldWalk(t, e2) {
    return (this.#e & U2) === U2 && !(this.#e & Ie2) && !t.has(this) && (!e2 || e2(this));
  }
  async realpath() {
    if (this.#k)
      return this.#k;
    if (!((Lt | Nt | j2) & this.#e))
      try {
        let t = await this.#t.promises.realpath(this.fullpath());
        return this.#k = this.resolve(t);
      } catch {
        this.#P();
      }
  }
  realpathSync() {
    if (this.#k)
      return this.#k;
    if (!((Lt | Nt | j2) & this.#e))
      try {
        let t = this.#t.realpathSync(this.fullpath());
        return this.#k = this.resolve(t);
      } catch {
        this.#P();
      }
  }
  [Ye](t) {
    if (t === this)
      return;
    t.isCWD = false, this.isCWD = true;
    let e2 = new Set([]), s = [], i = this;
    for (;i && i.parent; )
      e2.add(i), i.#x = s.join(this.sep), i.#A = s.join("/"), i = i.parent, s.push("..");
    for (i = t;i && i.parent && !e2.has(i); )
      i.#x = undefined, i.#A = undefined, i = i.parent;
  }
};
var Pt = class n2 extends R2 {
  sep = "\\";
  splitSep = Oi;
  constructor(t, e2 = L3, s, i, r2, o2, h2) {
    super(t, e2, s, i, r2, o2, h2);
  }
  newChild(t, e2 = L3, s = {}) {
    return new n2(t, e2, this.root, this.roots, this.nocase, this.childrenCache(), s);
  }
  getRootString(t) {
    return re.parse(t).root;
  }
  getRoot(t) {
    if (t = Ri(t.toUpperCase()), t === this.root.name)
      return this.root;
    for (let [e2, s] of Object.entries(this.roots))
      if (this.sameRoot(t, e2))
        return this.roots[t] = s;
    return this.roots[t] = new it(t, this).root;
  }
  sameRoot(t, e2 = this.root.name) {
    return t = t.toUpperCase().replace(/\//g, "\\").replace($e2, "$1\\"), t === e2;
  }
};
var jt = class n3 extends R2 {
  splitSep = "/";
  sep = "/";
  constructor(t, e2 = L3, s, i, r2, o2, h2) {
    super(t, e2, s, i, r2, o2, h2);
  }
  getRootString(t) {
    return t.startsWith("/") ? "/" : "";
  }
  getRoot(t) {
    return this.root;
  }
  newChild(t, e2 = L3, s = {}) {
    return new n3(t, e2, this.root, this.roots, this.nocase, this.childrenCache(), s);
  }
};
var It = class {
  root;
  rootPath;
  roots;
  cwd;
  #t;
  #s;
  #n;
  nocase;
  #r;
  constructor(t = process.cwd(), e2, s, { nocase: i, childrenCacheSize: r2 = 16 * 1024, fs: o2 = wt } = {}) {
    this.#r = Ue(o2), (t instanceof URL || t.startsWith("file://")) && (t = gi(t));
    let h2 = e2.resolve(t);
    this.roots = Object.create(null), this.rootPath = this.parseRootPath(h2), this.#t = new Wt, this.#s = new Wt, this.#n = new ne(r2);
    let a = h2.substring(this.rootPath.length).split(s);
    if (a.length === 1 && !a[0] && a.pop(), i === undefined)
      throw new TypeError("must provide nocase setting to PathScurryBase ctor");
    this.nocase = i, this.root = this.newRoot(this.#r), this.roots[this.rootPath] = this.root;
    let l2 = this.root, u2 = a.length - 1, c = e2.sep, d3 = this.rootPath, f = false;
    for (let m2 of a) {
      let p2 = u2--;
      l2 = l2.child(m2, { relative: new Array(p2).fill("..").join(c), relativePosix: new Array(p2).fill("..").join("/"), fullpath: d3 += (f ? "" : c) + m2 }), f = true;
    }
    this.cwd = l2;
  }
  depth(t = this.cwd) {
    return typeof t == "string" && (t = this.cwd.resolve(t)), t.depth();
  }
  childrenCache() {
    return this.#n;
  }
  resolve(...t) {
    let e2 = "";
    for (let r2 = t.length - 1;r2 >= 0; r2--) {
      let o2 = t[r2];
      if (!(!o2 || o2 === ".") && (e2 = e2 ? `${o2}/${e2}` : o2, this.isAbsolute(o2)))
        break;
    }
    let s = this.#t.get(e2);
    if (s !== undefined)
      return s;
    let i = this.cwd.resolve(e2).fullpath();
    return this.#t.set(e2, i), i;
  }
  resolvePosix(...t) {
    let e2 = "";
    for (let r2 = t.length - 1;r2 >= 0; r2--) {
      let o2 = t[r2];
      if (!(!o2 || o2 === ".") && (e2 = e2 ? `${o2}/${e2}` : o2, this.isAbsolute(o2)))
        break;
    }
    let s = this.#s.get(e2);
    if (s !== undefined)
      return s;
    let i = this.cwd.resolve(e2).fullpathPosix();
    return this.#s.set(e2, i), i;
  }
  relative(t = this.cwd) {
    return typeof t == "string" && (t = this.cwd.resolve(t)), t.relative();
  }
  relativePosix(t = this.cwd) {
    return typeof t == "string" && (t = this.cwd.resolve(t)), t.relativePosix();
  }
  basename(t = this.cwd) {
    return typeof t == "string" && (t = this.cwd.resolve(t)), t.name;
  }
  dirname(t = this.cwd) {
    return typeof t == "string" && (t = this.cwd.resolve(t)), (t.parent || t).fullpath();
  }
  async readdir(t = this.cwd, e2 = { withFileTypes: true }) {
    typeof t == "string" ? t = this.cwd.resolve(t) : t instanceof R2 || (e2 = t, t = this.cwd);
    let { withFileTypes: s } = e2;
    if (t.canReaddir()) {
      let i = await t.readdir();
      return s ? i : i.map((r2) => r2.name);
    } else
      return [];
  }
  readdirSync(t = this.cwd, e2 = { withFileTypes: true }) {
    typeof t == "string" ? t = this.cwd.resolve(t) : t instanceof R2 || (e2 = t, t = this.cwd);
    let { withFileTypes: s = true } = e2;
    return t.canReaddir() ? s ? t.readdirSync() : t.readdirSync().map((i) => i.name) : [];
  }
  async lstat(t = this.cwd) {
    return typeof t == "string" && (t = this.cwd.resolve(t)), t.lstat();
  }
  lstatSync(t = this.cwd) {
    return typeof t == "string" && (t = this.cwd.resolve(t)), t.lstatSync();
  }
  async readlink(t = this.cwd, { withFileTypes: e2 } = { withFileTypes: false }) {
    typeof t == "string" ? t = this.cwd.resolve(t) : t instanceof R2 || (e2 = t.withFileTypes, t = this.cwd);
    let s = await t.readlink();
    return e2 ? s : s?.fullpath();
  }
  readlinkSync(t = this.cwd, { withFileTypes: e2 } = { withFileTypes: false }) {
    typeof t == "string" ? t = this.cwd.resolve(t) : t instanceof R2 || (e2 = t.withFileTypes, t = this.cwd);
    let s = t.readlinkSync();
    return e2 ? s : s?.fullpath();
  }
  async realpath(t = this.cwd, { withFileTypes: e2 } = { withFileTypes: false }) {
    typeof t == "string" ? t = this.cwd.resolve(t) : t instanceof R2 || (e2 = t.withFileTypes, t = this.cwd);
    let s = await t.realpath();
    return e2 ? s : s?.fullpath();
  }
  realpathSync(t = this.cwd, { withFileTypes: e2 } = { withFileTypes: false }) {
    typeof t == "string" ? t = this.cwd.resolve(t) : t instanceof R2 || (e2 = t.withFileTypes, t = this.cwd);
    let s = t.realpathSync();
    return e2 ? s : s?.fullpath();
  }
  async walk(t = this.cwd, e2 = {}) {
    typeof t == "string" ? t = this.cwd.resolve(t) : t instanceof R2 || (e2 = t, t = this.cwd);
    let { withFileTypes: s = true, follow: i = false, filter: r2, walkFilter: o2 } = e2, h2 = [];
    (!r2 || r2(t)) && h2.push(s ? t : t.fullpath());
    let a = new Set, l2 = (c, d3) => {
      a.add(c), c.readdirCB((f, m2) => {
        if (f)
          return d3(f);
        let p2 = m2.length;
        if (!p2)
          return d3();
        let w2 = () => {
          --p2 === 0 && d3();
        };
        for (let g2 of m2)
          (!r2 || r2(g2)) && h2.push(s ? g2 : g2.fullpath()), i && g2.isSymbolicLink() ? g2.realpath().then((S2) => S2?.isUnknown() ? S2.lstat() : S2).then((S2) => S2?.shouldWalk(a, o2) ? l2(S2, w2) : w2()) : g2.shouldWalk(a, o2) ? l2(g2, w2) : w2();
      }, true);
    }, u2 = t;
    return new Promise((c, d3) => {
      l2(u2, (f) => {
        if (f)
          return d3(f);
        c(h2);
      });
    });
  }
  walkSync(t = this.cwd, e2 = {}) {
    typeof t == "string" ? t = this.cwd.resolve(t) : t instanceof R2 || (e2 = t, t = this.cwd);
    let { withFileTypes: s = true, follow: i = false, filter: r2, walkFilter: o2 } = e2, h2 = [];
    (!r2 || r2(t)) && h2.push(s ? t : t.fullpath());
    let a = new Set([t]);
    for (let l2 of a) {
      let u2 = l2.readdirSync();
      for (let c of u2) {
        (!r2 || r2(c)) && h2.push(s ? c : c.fullpath());
        let d3 = c;
        if (c.isSymbolicLink()) {
          if (!(i && (d3 = c.realpathSync())))
            continue;
          d3.isUnknown() && d3.lstatSync();
        }
        d3.shouldWalk(a, o2) && a.add(d3);
      }
    }
    return h2;
  }
  [Symbol.asyncIterator]() {
    return this.iterate();
  }
  iterate(t = this.cwd, e2 = {}) {
    return typeof t == "string" ? t = this.cwd.resolve(t) : t instanceof R2 || (e2 = t, t = this.cwd), this.stream(t, e2)[Symbol.asyncIterator]();
  }
  [Symbol.iterator]() {
    return this.iterateSync();
  }
  *iterateSync(t = this.cwd, e2 = {}) {
    typeof t == "string" ? t = this.cwd.resolve(t) : t instanceof R2 || (e2 = t, t = this.cwd);
    let { withFileTypes: s = true, follow: i = false, filter: r2, walkFilter: o2 } = e2;
    (!r2 || r2(t)) && (yield s ? t : t.fullpath());
    let h2 = new Set([t]);
    for (let a of h2) {
      let l2 = a.readdirSync();
      for (let u2 of l2) {
        (!r2 || r2(u2)) && (yield s ? u2 : u2.fullpath());
        let c = u2;
        if (u2.isSymbolicLink()) {
          if (!(i && (c = u2.realpathSync())))
            continue;
          c.isUnknown() && c.lstatSync();
        }
        c.shouldWalk(h2, o2) && h2.add(c);
      }
    }
  }
  stream(t = this.cwd, e2 = {}) {
    typeof t == "string" ? t = this.cwd.resolve(t) : t instanceof R2 || (e2 = t, t = this.cwd);
    let { withFileTypes: s = true, follow: i = false, filter: r2, walkFilter: o2 } = e2, h2 = new V3({ objectMode: true });
    (!r2 || r2(t)) && h2.write(s ? t : t.fullpath());
    let a = new Set, l2 = [t], u2 = 0, c = () => {
      let d3 = false;
      for (;!d3; ) {
        let f = l2.shift();
        if (!f) {
          u2 === 0 && h2.end();
          return;
        }
        u2++, a.add(f);
        let m2 = (w2, g2, S2 = false) => {
          if (w2)
            return h2.emit("error", w2);
          if (i && !S2) {
            let E = [];
            for (let y3 of g2)
              y3.isSymbolicLink() && E.push(y3.realpath().then((b3) => b3?.isUnknown() ? b3.lstat() : b3));
            if (E.length) {
              Promise.all(E).then(() => m2(null, g2, true));
              return;
            }
          }
          for (let E of g2)
            E && (!r2 || r2(E)) && (h2.write(s ? E : E.fullpath()) || (d3 = true));
          u2--;
          for (let E of g2) {
            let y3 = E.realpathCached() || E;
            y3.shouldWalk(a, o2) && l2.push(y3);
          }
          d3 && !h2.flowing ? h2.once("drain", c) : p2 || c();
        }, p2 = true;
        f.readdirCB(m2, true), p2 = false;
      }
    };
    return c(), h2;
  }
  streamSync(t = this.cwd, e2 = {}) {
    typeof t == "string" ? t = this.cwd.resolve(t) : t instanceof R2 || (e2 = t, t = this.cwd);
    let { withFileTypes: s = true, follow: i = false, filter: r2, walkFilter: o2 } = e2, h2 = new V3({ objectMode: true }), a = new Set;
    (!r2 || r2(t)) && h2.write(s ? t : t.fullpath());
    let l2 = [t], u2 = 0, c = () => {
      let d3 = false;
      for (;!d3; ) {
        let f = l2.shift();
        if (!f) {
          u2 === 0 && h2.end();
          return;
        }
        u2++, a.add(f);
        let m2 = f.readdirSync();
        for (let p2 of m2)
          (!r2 || r2(p2)) && (h2.write(s ? p2 : p2.fullpath()) || (d3 = true));
        u2--;
        for (let p2 of m2) {
          let w2 = p2;
          if (p2.isSymbolicLink()) {
            if (!(i && (w2 = p2.realpathSync())))
              continue;
            w2.isUnknown() && w2.lstatSync();
          }
          w2.shouldWalk(a, o2) && l2.push(w2);
        }
      }
      d3 && !h2.flowing && h2.once("drain", c);
    };
    return c(), h2;
  }
  chdir(t = this.cwd) {
    let e2 = this.cwd;
    this.cwd = typeof t == "string" ? this.cwd.resolve(t) : t, this.cwd[Ye](e2);
  }
};
var it = class extends It {
  sep = "\\";
  constructor(t = process.cwd(), e2 = {}) {
    let { nocase: s = true } = e2;
    super(t, re, "\\", { ...e2, nocase: s }), this.nocase = s;
    for (let i = this.cwd;i; i = i.parent)
      i.nocase = this.nocase;
  }
  parseRootPath(t) {
    return re.parse(t).root.toUpperCase();
  }
  newRoot(t) {
    return new Pt(this.rootPath, U2, undefined, this.roots, this.nocase, this.childrenCache(), { fs: t });
  }
  isAbsolute(t) {
    return t.startsWith("/") || t.startsWith("\\") || /^[a-z]:(\/|\\)/i.test(t);
  }
};
var rt = class extends It {
  sep = "/";
  constructor(t = process.cwd(), e2 = {}) {
    let { nocase: s = false } = e2;
    super(t, mi, "/", { ...e2, nocase: s }), this.nocase = s;
  }
  parseRootPath(t) {
    return "/";
  }
  newRoot(t) {
    return new jt(this.rootPath, U2, undefined, this.roots, this.nocase, this.childrenCache(), { fs: t });
  }
  isAbsolute(t) {
    return t.startsWith("/");
  }
};
var St = class extends rt {
  constructor(t = process.cwd(), e2 = {}) {
    let { nocase: s = true } = e2;
    super(t, { ...e2, nocase: s });
  }
};
var Cr = process.platform === "win32" ? Pt : jt;
var Xe = process.platform === "win32" ? it : process.platform === "darwin" ? St : rt;
var Di = (n4) => n4.length >= 1;
var Mi = (n4) => n4.length >= 1;
var Ni = Symbol.for("nodejs.util.inspect.custom");
var nt = class n4 {
  #t;
  #s;
  #n;
  length;
  #r;
  #o;
  #S;
  #w;
  #c;
  #h;
  #u = true;
  constructor(t, e2, s, i) {
    if (!Di(t))
      throw new TypeError("empty pattern list");
    if (!Mi(e2))
      throw new TypeError("empty glob list");
    if (e2.length !== t.length)
      throw new TypeError("mismatched pattern list and glob list lengths");
    if (this.length = t.length, s < 0 || s >= this.length)
      throw new TypeError("index out of range");
    if (this.#t = t, this.#s = e2, this.#n = s, this.#r = i, this.#n === 0) {
      if (this.isUNC()) {
        let [r2, o2, h2, a, ...l2] = this.#t, [u2, c, d3, f, ...m2] = this.#s;
        l2[0] === "" && (l2.shift(), m2.shift());
        let p2 = [r2, o2, h2, a, ""].join("/"), w2 = [u2, c, d3, f, ""].join("/");
        this.#t = [p2, ...l2], this.#s = [w2, ...m2], this.length = this.#t.length;
      } else if (this.isDrive() || this.isAbsolute()) {
        let [r2, ...o2] = this.#t, [h2, ...a] = this.#s;
        o2[0] === "" && (o2.shift(), a.shift());
        let l2 = r2 + "/", u2 = h2 + "/";
        this.#t = [l2, ...o2], this.#s = [u2, ...a], this.length = this.#t.length;
      }
    }
  }
  [Ni]() {
    return "Pattern <" + this.#s.slice(this.#n).join("/") + ">";
  }
  pattern() {
    return this.#t[this.#n];
  }
  isString() {
    return typeof this.#t[this.#n] == "string";
  }
  isGlobstar() {
    return this.#t[this.#n] === A3;
  }
  isRegExp() {
    return this.#t[this.#n] instanceof RegExp;
  }
  globString() {
    return this.#S = this.#S || (this.#n === 0 ? this.isAbsolute() ? this.#s[0] + this.#s.slice(1).join("/") : this.#s.join("/") : this.#s.slice(this.#n).join("/"));
  }
  hasMore() {
    return this.length > this.#n + 1;
  }
  rest() {
    return this.#o !== undefined ? this.#o : this.hasMore() ? (this.#o = new n4(this.#t, this.#s, this.#n + 1, this.#r), this.#o.#h = this.#h, this.#o.#c = this.#c, this.#o.#w = this.#w, this.#o) : this.#o = null;
  }
  isUNC() {
    let t = this.#t;
    return this.#c !== undefined ? this.#c : this.#c = this.#r === "win32" && this.#n === 0 && t[0] === "" && t[1] === "" && typeof t[2] == "string" && !!t[2] && typeof t[3] == "string" && !!t[3];
  }
  isDrive() {
    let t = this.#t;
    return this.#w !== undefined ? this.#w : this.#w = this.#r === "win32" && this.#n === 0 && this.length > 1 && typeof t[0] == "string" && /^[a-z]:$/i.test(t[0]);
  }
  isAbsolute() {
    let t = this.#t;
    return this.#h !== undefined ? this.#h : this.#h = t[0] === "" && t.length > 1 || this.isDrive() || this.isUNC();
  }
  root() {
    let t = this.#t[0];
    return typeof t == "string" && this.isAbsolute() && this.#n === 0 ? t : "";
  }
  checkFollowGlobstar() {
    return !(this.#n === 0 || !this.isGlobstar() || !this.#u);
  }
  markFollowGlobstar() {
    return this.#n === 0 || !this.isGlobstar() || !this.#u ? false : (this.#u = false, true);
  }
};
var _i = typeof process == "object" && process && typeof process.platform == "string" ? process.platform : "linux";
var ot = class {
  relative;
  relativeChildren;
  absolute;
  absoluteChildren;
  platform;
  mmopts;
  constructor(t, { nobrace: e2, nocase: s, noext: i, noglobstar: r2, platform: o2 = _i }) {
    this.relative = [], this.absolute = [], this.relativeChildren = [], this.absoluteChildren = [], this.platform = o2, this.mmopts = { dot: true, nobrace: e2, nocase: s, noext: i, noglobstar: r2, optimizationLevel: 2, platform: o2, nocomment: true, nonegate: true };
    for (let h2 of t)
      this.add(h2);
  }
  add(t) {
    let e2 = new D2(t, this.mmopts);
    for (let s = 0;s < e2.set.length; s++) {
      let i = e2.set[s], r2 = e2.globParts[s];
      if (!i || !r2)
        throw new Error("invalid pattern object");
      for (;i[0] === "." && r2[0] === "."; )
        i.shift(), r2.shift();
      let o2 = new nt(i, r2, 0, this.platform), h2 = new D2(o2.globString(), this.mmopts), a = r2[r2.length - 1] === "**", l2 = o2.isAbsolute();
      l2 ? this.absolute.push(h2) : this.relative.push(h2), a && (l2 ? this.absoluteChildren.push(h2) : this.relativeChildren.push(h2));
    }
  }
  ignored(t) {
    let e2 = t.fullpath(), s = `${e2}/`, i = t.relative() || ".", r2 = `${i}/`;
    for (let o2 of this.relative)
      if (o2.match(i) || o2.match(r2))
        return true;
    for (let o2 of this.absolute)
      if (o2.match(e2) || o2.match(s))
        return true;
    return false;
  }
  childrenIgnored(t) {
    let e2 = t.fullpath() + "/", s = (t.relative() || ".") + "/";
    for (let i of this.relativeChildren)
      if (i.match(s))
        return true;
    for (let i of this.absoluteChildren)
      if (i.match(e2))
        return true;
    return false;
  }
};
var oe2 = class n5 {
  store;
  constructor(t = new Map) {
    this.store = t;
  }
  copy() {
    return new n5(new Map(this.store));
  }
  hasWalked(t, e2) {
    return this.store.get(t.fullpath())?.has(e2.globString());
  }
  storeWalked(t, e2) {
    let s = t.fullpath(), i = this.store.get(s);
    i ? i.add(e2.globString()) : this.store.set(s, new Set([e2.globString()]));
  }
};
var he2 = class {
  store = new Map;
  add(t, e2, s) {
    let i = (e2 ? 2 : 0) | (s ? 1 : 0), r2 = this.store.get(t);
    this.store.set(t, r2 === undefined ? i : i & r2);
  }
  entries() {
    return [...this.store.entries()].map(([t, e2]) => [t, !!(e2 & 2), !!(e2 & 1)]);
  }
};
var ae2 = class {
  store = new Map;
  add(t, e2) {
    if (!t.canReaddir())
      return;
    let s = this.store.get(t);
    s ? s.find((i) => i.globString() === e2.globString()) || s.push(e2) : this.store.set(t, [e2]);
  }
  get(t) {
    let e2 = this.store.get(t);
    if (!e2)
      throw new Error("attempting to walk unknown path");
    return e2;
  }
  entries() {
    return this.keys().map((t) => [t, this.store.get(t)]);
  }
  keys() {
    return [...this.store.keys()].filter((t) => t.canReaddir());
  }
};
var Et = class n6 {
  hasWalkedCache;
  matches = new he2;
  subwalks = new ae2;
  patterns;
  follow;
  dot;
  opts;
  constructor(t, e2) {
    this.opts = t, this.follow = !!t.follow, this.dot = !!t.dot, this.hasWalkedCache = e2 ? e2.copy() : new oe2;
  }
  processPatterns(t, e2) {
    this.patterns = e2;
    let s = e2.map((i) => [t, i]);
    for (let [i, r2] of s) {
      this.hasWalkedCache.storeWalked(i, r2);
      let o2 = r2.root(), h2 = r2.isAbsolute() && this.opts.absolute !== false;
      if (o2) {
        i = i.resolve(o2 === "/" && this.opts.root !== undefined ? this.opts.root : o2);
        let c = r2.rest();
        if (c)
          r2 = c;
        else {
          this.matches.add(i, true, false);
          continue;
        }
      }
      if (i.isENOENT())
        continue;
      let a, l2, u2 = false;
      for (;typeof (a = r2.pattern()) == "string" && (l2 = r2.rest()); )
        i = i.resolve(a), r2 = l2, u2 = true;
      if (a = r2.pattern(), l2 = r2.rest(), u2) {
        if (this.hasWalkedCache.hasWalked(i, r2))
          continue;
        this.hasWalkedCache.storeWalked(i, r2);
      }
      if (typeof a == "string") {
        let c = a === ".." || a === "" || a === ".";
        this.matches.add(i.resolve(a), h2, c);
        continue;
      } else if (a === A3) {
        (!i.isSymbolicLink() || this.follow || r2.checkFollowGlobstar()) && this.subwalks.add(i, r2);
        let c = l2?.pattern(), d3 = l2?.rest();
        if (!l2 || (c === "" || c === ".") && !d3)
          this.matches.add(i, h2, c === "" || c === ".");
        else if (c === "..") {
          let f = i.parent || i;
          d3 ? this.hasWalkedCache.hasWalked(f, d3) || this.subwalks.add(f, d3) : this.matches.add(f, h2, true);
        }
      } else
        a instanceof RegExp && this.subwalks.add(i, r2);
    }
    return this;
  }
  subwalkTargets() {
    return this.subwalks.keys();
  }
  child() {
    return new n6(this.opts, this.hasWalkedCache);
  }
  filterEntries(t, e2) {
    let s = this.subwalks.get(t), i = this.child();
    for (let r2 of e2)
      for (let o2 of s) {
        let h2 = o2.isAbsolute(), a = o2.pattern(), l2 = o2.rest();
        a === A3 ? i.testGlobstar(r2, o2, l2, h2) : a instanceof RegExp ? i.testRegExp(r2, a, l2, h2) : i.testString(r2, a, l2, h2);
      }
    return i;
  }
  testGlobstar(t, e2, s, i) {
    if ((this.dot || !t.name.startsWith(".")) && (e2.hasMore() || this.matches.add(t, i, false), t.canReaddir() && (this.follow || !t.isSymbolicLink() ? this.subwalks.add(t, e2) : t.isSymbolicLink() && (s && e2.checkFollowGlobstar() ? this.subwalks.add(t, s) : e2.markFollowGlobstar() && this.subwalks.add(t, e2)))), s) {
      let r2 = s.pattern();
      if (typeof r2 == "string" && r2 !== ".." && r2 !== "" && r2 !== ".")
        this.testString(t, r2, s.rest(), i);
      else if (r2 === "..") {
        let o2 = t.parent || t;
        this.subwalks.add(o2, s);
      } else
        r2 instanceof RegExp && this.testRegExp(t, r2, s.rest(), i);
    }
  }
  testRegExp(t, e2, s, i) {
    e2.test(t.name) && (s ? this.subwalks.add(t, s) : this.matches.add(t, i, false));
  }
  testString(t, e2, s, i) {
    t.isNamed(e2) && (s ? this.subwalks.add(t, s) : this.matches.add(t, i, false));
  }
};
var Li = (n7, t) => typeof n7 == "string" ? new ot([n7], t) : Array.isArray(n7) ? new ot(n7, t) : n7;
var zt = class {
  path;
  patterns;
  opts;
  seen = new Set;
  paused = false;
  aborted = false;
  #t = [];
  #s;
  #n;
  signal;
  maxDepth;
  includeChildMatches;
  constructor(t, e2, s) {
    if (this.patterns = t, this.path = e2, this.opts = s, this.#n = !s.posix && s.platform === "win32" ? "\\" : "/", this.includeChildMatches = s.includeChildMatches !== false, (s.ignore || !this.includeChildMatches) && (this.#s = Li(s.ignore ?? [], s), !this.includeChildMatches && typeof this.#s.add != "function")) {
      let i = "cannot ignore child matches, ignore lacks add() method.";
      throw new Error(i);
    }
    this.maxDepth = s.maxDepth || 1 / 0, s.signal && (this.signal = s.signal, this.signal.addEventListener("abort", () => {
      this.#t.length = 0;
    }));
  }
  #r(t) {
    return this.seen.has(t) || !!this.#s?.ignored?.(t);
  }
  #o(t) {
    return !!this.#s?.childrenIgnored?.(t);
  }
  pause() {
    this.paused = true;
  }
  resume() {
    if (this.signal?.aborted)
      return;
    this.paused = false;
    let t;
    for (;!this.paused && (t = this.#t.shift()); )
      t();
  }
  onResume(t) {
    this.signal?.aborted || (this.paused ? this.#t.push(t) : t());
  }
  async matchCheck(t, e2) {
    if (e2 && this.opts.nodir)
      return;
    let s;
    if (this.opts.realpath) {
      if (s = t.realpathCached() || await t.realpath(), !s)
        return;
      t = s;
    }
    let r2 = t.isUnknown() || this.opts.stat ? await t.lstat() : t;
    if (this.opts.follow && this.opts.nodir && r2?.isSymbolicLink()) {
      let o2 = await r2.realpath();
      o2 && (o2.isUnknown() || this.opts.stat) && await o2.lstat();
    }
    return this.matchCheckTest(r2, e2);
  }
  matchCheckTest(t, e2) {
    return t && (this.maxDepth === 1 / 0 || t.depth() <= this.maxDepth) && (!e2 || t.canReaddir()) && (!this.opts.nodir || !t.isDirectory()) && (!this.opts.nodir || !this.opts.follow || !t.isSymbolicLink() || !t.realpathCached()?.isDirectory()) && !this.#r(t) ? t : undefined;
  }
  matchCheckSync(t, e2) {
    if (e2 && this.opts.nodir)
      return;
    let s;
    if (this.opts.realpath) {
      if (s = t.realpathCached() || t.realpathSync(), !s)
        return;
      t = s;
    }
    let r2 = t.isUnknown() || this.opts.stat ? t.lstatSync() : t;
    if (this.opts.follow && this.opts.nodir && r2?.isSymbolicLink()) {
      let o2 = r2.realpathSync();
      o2 && (o2?.isUnknown() || this.opts.stat) && o2.lstatSync();
    }
    return this.matchCheckTest(r2, e2);
  }
  matchFinish(t, e2) {
    if (this.#r(t))
      return;
    if (!this.includeChildMatches && this.#s?.add) {
      let r2 = `${t.relativePosix()}/**`;
      this.#s.add(r2);
    }
    let s = this.opts.absolute === undefined ? e2 : this.opts.absolute;
    this.seen.add(t);
    let i = this.opts.mark && t.isDirectory() ? this.#n : "";
    if (this.opts.withFileTypes)
      this.matchEmit(t);
    else if (s) {
      let r2 = this.opts.posix ? t.fullpathPosix() : t.fullpath();
      this.matchEmit(r2 + i);
    } else {
      let r2 = this.opts.posix ? t.relativePosix() : t.relative(), o2 = this.opts.dotRelative && !r2.startsWith(".." + this.#n) ? "." + this.#n : "";
      this.matchEmit(r2 ? o2 + r2 + i : "." + i);
    }
  }
  async match(t, e2, s) {
    let i = await this.matchCheck(t, s);
    i && this.matchFinish(i, e2);
  }
  matchSync(t, e2, s) {
    let i = this.matchCheckSync(t, s);
    i && this.matchFinish(i, e2);
  }
  walkCB(t, e2, s) {
    this.signal?.aborted && s(), this.walkCB2(t, e2, new Et(this.opts), s);
  }
  walkCB2(t, e2, s, i) {
    if (this.#o(t))
      return i();
    if (this.signal?.aborted && i(), this.paused) {
      this.onResume(() => this.walkCB2(t, e2, s, i));
      return;
    }
    s.processPatterns(t, e2);
    let r2 = 1, o2 = () => {
      --r2 === 0 && i();
    };
    for (let [h2, a, l2] of s.matches.entries())
      this.#r(h2) || (r2++, this.match(h2, a, l2).then(() => o2()));
    for (let h2 of s.subwalkTargets()) {
      if (this.maxDepth !== 1 / 0 && h2.depth() >= this.maxDepth)
        continue;
      r2++;
      let a = h2.readdirCached();
      h2.calledReaddir() ? this.walkCB3(h2, a, s, o2) : h2.readdirCB((l2, u2) => this.walkCB3(h2, u2, s, o2), true);
    }
    o2();
  }
  walkCB3(t, e2, s, i) {
    s = s.filterEntries(t, e2);
    let r2 = 1, o2 = () => {
      --r2 === 0 && i();
    };
    for (let [h2, a, l2] of s.matches.entries())
      this.#r(h2) || (r2++, this.match(h2, a, l2).then(() => o2()));
    for (let [h2, a] of s.subwalks.entries())
      r2++, this.walkCB2(h2, a, s.child(), o2);
    o2();
  }
  walkCBSync(t, e2, s) {
    this.signal?.aborted && s(), this.walkCB2Sync(t, e2, new Et(this.opts), s);
  }
  walkCB2Sync(t, e2, s, i) {
    if (this.#o(t))
      return i();
    if (this.signal?.aborted && i(), this.paused) {
      this.onResume(() => this.walkCB2Sync(t, e2, s, i));
      return;
    }
    s.processPatterns(t, e2);
    let r2 = 1, o2 = () => {
      --r2 === 0 && i();
    };
    for (let [h2, a, l2] of s.matches.entries())
      this.#r(h2) || this.matchSync(h2, a, l2);
    for (let h2 of s.subwalkTargets()) {
      if (this.maxDepth !== 1 / 0 && h2.depth() >= this.maxDepth)
        continue;
      r2++;
      let a = h2.readdirSync();
      this.walkCB3Sync(h2, a, s, o2);
    }
    o2();
  }
  walkCB3Sync(t, e2, s, i) {
    s = s.filterEntries(t, e2);
    let r2 = 1, o2 = () => {
      --r2 === 0 && i();
    };
    for (let [h2, a, l2] of s.matches.entries())
      this.#r(h2) || this.matchSync(h2, a, l2);
    for (let [h2, a] of s.subwalks.entries())
      r2++, this.walkCB2Sync(h2, a, s.child(), o2);
    o2();
  }
};
var xt = class extends zt {
  matches = new Set;
  constructor(t, e2, s) {
    super(t, e2, s);
  }
  matchEmit(t) {
    this.matches.add(t);
  }
  async walk() {
    if (this.signal?.aborted)
      throw this.signal.reason;
    return this.path.isUnknown() && await this.path.lstat(), await new Promise((t, e2) => {
      this.walkCB(this.path, this.patterns, () => {
        this.signal?.aborted ? e2(this.signal.reason) : t(this.matches);
      });
    }), this.matches;
  }
  walkSync() {
    if (this.signal?.aborted)
      throw this.signal.reason;
    return this.path.isUnknown() && this.path.lstatSync(), this.walkCBSync(this.path, this.patterns, () => {
      if (this.signal?.aborted)
        throw this.signal.reason;
    }), this.matches;
  }
};
var vt = class extends zt {
  results;
  constructor(t, e2, s) {
    super(t, e2, s), this.results = new V3({ signal: this.signal, objectMode: true }), this.results.on("drain", () => this.resume()), this.results.on("resume", () => this.resume());
  }
  matchEmit(t) {
    this.results.write(t), this.results.flowing || this.pause();
  }
  stream() {
    let t = this.path;
    return t.isUnknown() ? t.lstat().then(() => {
      this.walkCB(t, this.patterns, () => this.results.end());
    }) : this.walkCB(t, this.patterns, () => this.results.end()), this.results;
  }
  streamSync() {
    return this.path.isUnknown() && this.path.lstatSync(), this.walkCBSync(this.path, this.patterns, () => this.results.end()), this.results;
  }
};
var Pi = typeof process == "object" && process && typeof process.platform == "string" ? process.platform : "linux";
var I2 = class {
  absolute;
  cwd;
  root;
  dot;
  dotRelative;
  follow;
  ignore;
  magicalBraces;
  mark;
  matchBase;
  maxDepth;
  nobrace;
  nocase;
  nodir;
  noext;
  noglobstar;
  pattern;
  platform;
  realpath;
  scurry;
  stat;
  signal;
  windowsPathsNoEscape;
  withFileTypes;
  includeChildMatches;
  opts;
  patterns;
  constructor(t, e2) {
    if (!e2)
      throw new TypeError("glob options required");
    if (this.withFileTypes = !!e2.withFileTypes, this.signal = e2.signal, this.follow = !!e2.follow, this.dot = !!e2.dot, this.dotRelative = !!e2.dotRelative, this.nodir = !!e2.nodir, this.mark = !!e2.mark, e2.cwd ? (e2.cwd instanceof URL || e2.cwd.startsWith("file://")) && (e2.cwd = Wi(e2.cwd)) : this.cwd = "", this.cwd = e2.cwd || "", this.root = e2.root, this.magicalBraces = !!e2.magicalBraces, this.nobrace = !!e2.nobrace, this.noext = !!e2.noext, this.realpath = !!e2.realpath, this.absolute = e2.absolute, this.includeChildMatches = e2.includeChildMatches !== false, this.noglobstar = !!e2.noglobstar, this.matchBase = !!e2.matchBase, this.maxDepth = typeof e2.maxDepth == "number" ? e2.maxDepth : 1 / 0, this.stat = !!e2.stat, this.ignore = e2.ignore, this.withFileTypes && this.absolute !== undefined)
      throw new Error("cannot set absolute and withFileTypes:true");
    if (typeof t == "string" && (t = [t]), this.windowsPathsNoEscape = !!e2.windowsPathsNoEscape || e2.allowWindowsEscape === false, this.windowsPathsNoEscape && (t = t.map((a) => a.replace(/\\/g, "/"))), this.matchBase) {
      if (e2.noglobstar)
        throw new TypeError("base matching requires globstar");
      t = t.map((a) => a.includes("/") ? a : `./**/${a}`);
    }
    if (this.pattern = t, this.platform = e2.platform || Pi, this.opts = { ...e2, platform: this.platform }, e2.scurry) {
      if (this.scurry = e2.scurry, e2.nocase !== undefined && e2.nocase !== e2.scurry.nocase)
        throw new Error("nocase option contradicts provided scurry option");
    } else {
      let a = e2.platform === "win32" ? it : e2.platform === "darwin" ? St : e2.platform ? rt : Xe;
      this.scurry = new a(this.cwd, { nocase: e2.nocase, fs: e2.fs });
    }
    this.nocase = this.scurry.nocase;
    let s = this.platform === "darwin" || this.platform === "win32", i = { braceExpandMax: 1e4, ...e2, dot: this.dot, matchBase: this.matchBase, nobrace: this.nobrace, nocase: this.nocase, nocaseMagicOnly: s, nocomment: true, noext: this.noext, nonegate: true, optimizationLevel: 2, platform: this.platform, windowsPathsNoEscape: this.windowsPathsNoEscape, debug: !!this.opts.debug }, r2 = this.pattern.map((a) => new D2(a, i)), [o2, h2] = r2.reduce((a, l2) => (a[0].push(...l2.set), a[1].push(...l2.globParts), a), [[], []]);
    this.patterns = o2.map((a, l2) => {
      let u2 = h2[l2];
      if (!u2)
        throw new Error("invalid pattern object");
      return new nt(a, u2, 0, this.platform);
    });
  }
  async walk() {
    return [...await new xt(this.patterns, this.scurry.cwd, { ...this.opts, maxDepth: this.maxDepth !== 1 / 0 ? this.maxDepth + this.scurry.cwd.depth() : 1 / 0, platform: this.platform, nocase: this.nocase, includeChildMatches: this.includeChildMatches }).walk()];
  }
  walkSync() {
    return [...new xt(this.patterns, this.scurry.cwd, { ...this.opts, maxDepth: this.maxDepth !== 1 / 0 ? this.maxDepth + this.scurry.cwd.depth() : 1 / 0, platform: this.platform, nocase: this.nocase, includeChildMatches: this.includeChildMatches }).walkSync()];
  }
  stream() {
    return new vt(this.patterns, this.scurry.cwd, { ...this.opts, maxDepth: this.maxDepth !== 1 / 0 ? this.maxDepth + this.scurry.cwd.depth() : 1 / 0, platform: this.platform, nocase: this.nocase, includeChildMatches: this.includeChildMatches }).stream();
  }
  streamSync() {
    return new vt(this.patterns, this.scurry.cwd, { ...this.opts, maxDepth: this.maxDepth !== 1 / 0 ? this.maxDepth + this.scurry.cwd.depth() : 1 / 0, platform: this.platform, nocase: this.nocase, includeChildMatches: this.includeChildMatches }).streamSync();
  }
  iterateSync() {
    return this.streamSync()[Symbol.iterator]();
  }
  [Symbol.iterator]() {
    return this.iterateSync();
  }
  iterate() {
    return this.stream()[Symbol.asyncIterator]();
  }
  [Symbol.asyncIterator]() {
    return this.iterate();
  }
};
var le2 = (n7, t = {}) => {
  Array.isArray(n7) || (n7 = [n7]);
  for (let e2 of n7)
    if (new D2(e2, t).hasMagic())
      return true;
  return false;
};
function Bt(n7, t = {}) {
  return new I2(n7, t).streamSync();
}
function Qe(n7, t = {}) {
  return new I2(n7, t).stream();
}
function ts(n7, t = {}) {
  return new I2(n7, t).walkSync();
}
async function Je(n7, t = {}) {
  return new I2(n7, t).walk();
}
function Ut(n7, t = {}) {
  return new I2(n7, t).iterateSync();
}
function es(n7, t = {}) {
  return new I2(n7, t).iterate();
}
var ji = Bt;
var Ii = Object.assign(Qe, { sync: Bt });
var zi = Ut;
var Bi = Object.assign(es, { sync: Ut });
var Ui = Object.assign(ts, { stream: Bt, iterate: Ut });
var Ze = Object.assign(Je, { glob: Je, globSync: ts, sync: Ui, globStream: Qe, stream: Ii, globStreamSync: Bt, streamSync: ji, globIterate: es, iterate: Bi, globIterateSync: Ut, iterateSync: zi, Glob: I2, hasMagic: le2, escape: tt, unescape: W3 });
Ze.glob = Ze;

// src/commands/unzip.ts
var import_picocolors32 = __toESM(require_picocolors(), 1);
var HASH_SUFFIX = /-([a-f0-9]{7,40})$/i;
var MIN_PREFIX_LEN = 3;
function autoClean(name) {
  let cleaned = name;
  let prev = "";
  while (prev !== cleaned) {
    prev = cleaned;
    cleaned = cleaned.replace(HASH_SUFFIX, "").replace(/-template$/i, "");
  }
  return cleaned;
}
function detectCommonPrefixes(names) {
  if (names.length < 2)
    return [];
  const groups = new Map;
  for (const name of names) {
    const tokens = name.split("-");
    if (tokens.length < 2)
      continue;
    const first = tokens[0] ?? "";
    groups.set(first, (groups.get(first) ?? 0) + 1);
  }
  const prefixes = [];
  for (const [token, count] of groups) {
    if (count >= 2 && token.length >= MIN_PREFIX_LEN) {
      prefixes.push(token);
    }
  }
  return prefixes;
}
function stripPrefix(name, prefix) {
  if (name.startsWith(`${prefix}-`)) {
    return name.slice(prefix.length + 1);
  }
  return name;
}
function stripSuffix(name, suffix) {
  if (name.endsWith(`-${suffix}`)) {
    return name.slice(0, name.length - suffix.length - 1);
  }
  return name;
}
function truncateHash(name) {
  return name.replace(/-([a-f0-9]{7,40})$/i, (_m, hash) => `-${hash.slice(0, 8)}\u2026`);
}
var unzipCommand = new Command("unzip").description("\u89E3\u538B\u9879\u76EE\u4E2D\u6240\u6709 zip \u6587\u4EF6").argument("[project]", "\u9879\u76EE\u540D\u79F0\uFF08. \u6216\u7701\u7565\u8868\u793A\u5F53\u524D\u76EE\u5F55\uFF09").option("-a, --auto", "\u8DF3\u8FC7\u6240\u6709\u8BE2\u95EE\uFF0C\u6309\u9ED8\u8BA4\u89C4\u5219\u81EA\u52A8\u6E05\u7406").option("-p, --remove-prefix <prefix>", "\u624B\u52A8\u6307\u5B9A\u8981\u79FB\u9664\u7684\u524D\u7F00\uFF08\u53EF\u591A\u6B21\u4F7F\u7528\uFF0C\u4E0D\u8BE2\u95EE\uFF09", (val, prev) => [...prev, val], []).option("-s, --remove-suffix <suffix>", "\u624B\u52A8\u6307\u5B9A\u8981\u79FB\u9664\u7684\u540E\u7F00\uFF08\u53EF\u591A\u6B21\u4F7F\u7528\uFF0C\u4E0D\u8BE2\u95EE\uFF09", (val, prev) => [...prev, val], []).action(async (project, options = {}) => {
  let cwd;
  if (!project || project === ".") {
    cwd = process.cwd();
  } else if (projectExists(project)) {
    cwd = getProjectPath(project);
  } else {
    printError(`\u9879\u76EE\u4E0D\u5B58\u5728: ${project}`);
    process.exit(1);
  }
  const zipFiles = await Ze("**/*.zip", {
    cwd,
    nodir: true,
    absolute: true
  });
  if (zipFiles.length === 0) {
    console.log();
    printInfo("\u6CA1\u6709\u627E\u5230 zip \u6587\u4EF6");
    console.log();
    return;
  }
  const zipInfos = zipFiles.map((file) => {
    const internalName = parse(file).name;
    const cleaned = autoClean(internalName);
    return { file, internalName, cleaned, finalName: "" };
  });
  const anyCleaned = zipInfos.some((z2) => z2.cleaned !== z2.internalName);
  const manualPrefixes = options.removePrefix ?? [];
  Ie(bgOrange(" \u89E3\u538B zip \u6587\u4EF6 "));
  console.log();
  console.log(import_picocolors32.default.dim(`  \u627E\u5230 ${zipFiles.length} \u4E2A zip \u6587\u4EF6:`));
  for (const info of zipInfos) {
    const display = truncateHash(info.internalName);
    const tail = info.cleaned !== info.internalName ? import_picocolors32.default.dim(` \u2192 ${info.cleaned}`) : "";
    console.log(`  ${brand.secondary("\u2022")} ${display}.zip${tail}`);
  }
  console.log();
  const detectedPrefixes = detectCommonPrefixes(zipInfos.map((z2) => z2.cleaned));
  const prefixesToRemove = new Set(manualPrefixes);
  for (const prefix of detectedPrefixes) {
    if (options.auto) {
      prefixesToRemove.add(prefix);
      continue;
    }
    const should = await ye({
      message: `\u68C0\u6D4B\u5230\u516C\u5171\u524D\u7F00 "${prefix}"\uFF0C\u662F\u5426\u79FB\u9664\uFF1F`,
      initialValue: true
    });
    if (should)
      prefixesToRemove.add(prefix);
  }
  let applyAutoClean;
  if (options.auto) {
    applyAutoClean = anyCleaned;
  } else if (anyCleaned) {
    const c = await ye({
      message: "\u68C0\u6D4B\u5230 -template / \u54C8\u5E0C\u540E\u7F00\uFF0C\u662F\u5426\u79FB\u9664\uFF1F",
      initialValue: true
    });
    applyAutoClean = !pD(c) && c;
  } else {
    applyAutoClean = false;
  }
  console.log();
  const manualSuffixes = options.removeSuffix ?? [];
  for (const info of zipInfos) {
    let name = applyAutoClean ? info.cleaned : info.internalName;
    for (const prefix of prefixesToRemove) {
      name = stripPrefix(name, prefix);
    }
    for (const suffix of manualSuffixes) {
      name = stripSuffix(name, suffix);
    }
    info.finalName = name || info.internalName;
  }
  const s = Y2();
  s.start("\u6B63\u5728\u89E3\u538B...");
  let successCount = 0;
  const errors2 = [];
  for (const { file: zipFile, internalName, finalName } of zipInfos) {
    const relativePath = `${truncateHash(internalName)}.zip`;
    try {
      const destDir = join15(dirname5(zipFile), finalName);
      if (await import_fs_extra25.default.pathExists(destDir)) {
        await import_fs_extra25.default.remove(destDir);
      }
      const zip = new import_adm_zip2.default(zipFile);
      const entries = zip.getEntries();
      const validEntries = entries.filter((entry) => {
        const name = entry.entryName;
        return !name.startsWith("__MACOSX") && !name.includes("/__MACOSX") && !name.endsWith(".DS_Store");
      });
      const rootDirs = new Set(validEntries.filter((e2) => !e2.isDirectory).map((e2) => e2.entryName.split("/")[0]));
      let stripPrefix2 = "";
      if (rootDirs.size === 1) {
        const root = [...rootDirs][0];
        if (root === internalName || root === finalName) {
          stripPrefix2 = `${root}/`;
        }
      }
      for (const entry of validEntries) {
        const entryPath = entry.entryName;
        const targetRelPath = stripPrefix2 ? entryPath.startsWith(stripPrefix2) ? entryPath.slice(stripPrefix2.length) : entryPath : entryPath;
        if (!targetRelPath)
          continue;
        const fullPath = join15(destDir, targetRelPath);
        if (entry.isDirectory) {
          await import_fs_extra25.default.ensureDir(fullPath);
        } else {
          await import_fs_extra25.default.ensureDir(dirname5(fullPath));
          await import_fs_extra25.default.writeFile(fullPath, entry.getData());
        }
      }
      await import_fs_extra25.default.remove(zipFile);
      successCount++;
      console.log(`  ${brand.success("\u2713")} ${relativePath} \u2192 ${finalName}/`);
    } catch (error) {
      const err = error;
      errors2.push(`${relativePath}: ${err.message}`);
      console.log(`  ${brand.error("\u2717")} ${relativePath} - ${err.message}`);
    }
  }
  s.stop();
  console.log();
  if (errors2.length > 0) {
    Se(`${brand.success("\u2713")} \u6210\u529F\u89E3\u538B ${successCount} \u4E2A\uFF0C${brand.error(`${errors2.length} \u4E2A\u5931\u8D25`)}`);
  } else {
    Se(`${brand.success("\u2713")} \u5DF2\u6210\u529F\u89E3\u538B ${successCount} \u4E2A zip \u6587\u4EF6`);
  }
});

// src/commands/update.ts
import { existsSync as existsSync2, readFileSync as readFileSync2 } from "fs";
import { dirname as dirname6, join as join16, resolve as resolve7 } from "path";
import { fileURLToPath } from "url";
init_esm();
var import_picocolors33 = __toESM(require_picocolors(), 1);
function getVersion(dir) {
  try {
    const pkg = JSON.parse(readFileSync2(join16(dir, "package.json"), "utf-8"));
    return pkg.version;
  } catch {
    return "unknown";
  }
}
function findPDir() {
  const currentFile = fileURLToPath(import.meta.url);
  let dir = dirname6(currentFile);
  for (let i = 0;i < 10; i++) {
    const pkgPath = join16(dir, "package.json");
    if (existsSync2(pkgPath)) {
      try {
        const pkg = JSON.parse(readFileSync2(pkgPath, "utf-8"));
        if (pkg.name === "p")
          return dir;
      } catch {}
    }
    const parent = resolve7(dir, "..");
    if (parent === dir)
      break;
    dir = parent;
  }
  return null;
}
var updateCommand = new Command("update").alias("upgrade").description("\u66F4\u65B0 p \u5230\u6700\u65B0\u7248\u672C").action(async () => {
  const pDir = findPDir();
  const currentVersion = pDir ? getVersion(pDir) : "unknown";
  Ie(bgOrange(" \u66F4\u65B0 p "));
  console.log(import_picocolors33.default.dim("  \u5F53\u524D\u7248\u672C: ") + brand.primary(currentVersion));
  console.log();
  const s = Y2();
  s.start("\u6B63\u5728\u66F4\u65B0...");
  await execAndCapture("bun remove -g p", process.cwd());
  const installResult = await execAndCapture("bun install -g tmadamtaylor21217/p", process.cwd());
  if (!installResult.success) {
    s.stop("\u66F4\u65B0\u5931\u8D25");
    console.log();
    printError(`\u66F4\u65B0\u5931\u8D25: ${installResult.error || installResult.output}`);
    console.log();
    printInfo("\u624B\u52A8\u66F4\u65B0: bun remove -g p && bun install -g tmadamtaylor21217/p");
    process.exit(1);
  }
  s.stop("\u66F4\u65B0\u5B8C\u6210");
  const newDir = findPDir();
  const newVersion = newDir ? getVersion(newDir) : "unknown";
  console.log();
  if (newVersion !== "unknown" && newVersion !== currentVersion) {
    Se(brand.success("p \u5DF2\u66F4\u65B0: ") + import_picocolors33.default.dim(currentVersion) + brand.success(" \u2192 ") + brand.primary(newVersion));
  } else {
    Se(brand.success("p \u5DF2\u662F\u6700\u65B0\u7248\u672C"));
  }
});

// src/index.ts
var __dirname2 = dirname7(fileURLToPath2(import.meta.url));
var pkgPath = join17(__dirname2, "..", "package.json");
var pkg = JSON.parse(readFileSync3(pkgPath, "utf-8"));
var program2 = new Command;
await ensureInitialized();
await migrateUserConfig();
program2.name("p").description(`${brand.primary("\u26A1 P")} v${pkg.version} \u2014 \u9879\u76EE\u7BA1\u7406\u5DE5\u5177`).version(pkg.version);
var Help2 = (await Promise.resolve().then(() => (init_esm(), exports_esm))).Help;
Help2.prototype.subcommandTerm = (cmd) => {
  const all = [cmd.name(), ...cmd.aliases()];
  all.sort((a, b3) => b3.length - a.length);
  return all.join("|");
};
var origFormatHelp = Help2.prototype.formatHelp;
Help2.prototype.formatHelp = function(cmd, helper) {
  let output = origFormatHelp.call(this, cmd, helper);
  output += `
  ${import_picocolors34.default.dim("\u67E5\u770B\u5B50\u547D\u4EE4\u8BE6\u60C5:")} p ${import_picocolors34.default.cyan("<command>")} -h
`;
  return output;
};
program2.addCommand(addCommand);
program2.addCommand(claudeCommand);
program2.addCommand(cdCommand);
program2.addCommand(cloneCommand);
program2.addCommand(copyCommand);
program2.addCommand(newCommand);
program2.addCommand(lsCommand);
program2.addCommand(openCommand);
program2.addCommand(searchCommand);
program2.addCommand(pathCommand);
program2.addCommand(deleteCommand);
program2.addCommand(publishCommand);
program2.addCommand(pushCommand);
program2.addCommand(renameCommand);
program2.addCommand(recentCommand);
program2.addCommand(projectCommand);
program2.addCommand(runCommand);
program2.addCommand(importCommand);
program2.addCommand(tagCommand);
program2.addCommand(templateCommand);
program2.addCommand(configCommand);
program2.addCommand(hookCommand);
program2.addCommand(metaCommand);
program2.addCommand(firstPromptCommand);
program2.addCommand(unzipCommand);
program2.addCommand(updateCommand);
program2.addCommand(syncCommand);
program2.parse();
