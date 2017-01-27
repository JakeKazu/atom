(function() {
  var CommandError, Ex, VimOption, _, defer, fs, getFullPath, getSearchTerm, path, replaceGroups, saveAs, trySave,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  path = require('path');

  CommandError = require('./command-error');

  fs = require('fs-plus');

  VimOption = require('./vim-option');

  _ = require('underscore-plus');

  defer = function() {
    var deferred;
    deferred = {};
    deferred.promise = new Promise(function(resolve, reject) {
      deferred.resolve = resolve;
      return deferred.reject = reject;
    });
    return deferred;
  };

  trySave = function(func) {
    var deferred, error, errorMatch, fileName, ref;
    deferred = defer();
    try {
      func();
      deferred.resolve();
    } catch (error1) {
      error = error1;
      if (error.message.endsWith('is a directory')) {
        atom.notifications.addWarning("Unable to save file: " + error.message);
      } else if (error.path != null) {
        if (error.code === 'EACCES') {
          atom.notifications.addWarning("Unable to save file: Permission denied '" + error.path + "'");
        } else if ((ref = error.code) === 'EPERM' || ref === 'EBUSY' || ref === 'UNKNOWN' || ref === 'EEXIST') {
          atom.notifications.addWarning("Unable to save file '" + error.path + "'", {
            detail: error.message
          });
        } else if (error.code === 'EROFS') {
          atom.notifications.addWarning("Unable to save file: Read-only file system '" + error.path + "'");
        }
      } else if ((errorMatch = /ENOTDIR, not a directory '([^']+)'/.exec(error.message))) {
        fileName = errorMatch[1];
        atom.notifications.addWarning("Unable to save file: A directory in the " + ("path '" + fileName + "' could not be written to"));
      } else {
        throw error;
      }
    }
    return deferred.promise;
  };

  saveAs = function(filePath, editor) {
    return fs.writeFileSync(filePath, editor.getText());
  };

  getFullPath = function(filePath) {
    filePath = fs.normalize(filePath);
    if (path.isAbsolute(filePath)) {
      return filePath;
    } else if (atom.project.getPaths().length === 0) {
      return path.join(fs.normalize('~'), filePath);
    } else {
      return path.join(atom.project.getPaths()[0], filePath);
    }
  };

  replaceGroups = function(groups, string) {
    var char, escaped, group, replaced;
    replaced = '';
    escaped = false;
    while ((char = string[0]) != null) {
      string = string.slice(1);
      if (char === '\\' && !escaped) {
        escaped = true;
      } else if (/\d/.test(char) && escaped) {
        escaped = false;
        group = groups[parseInt(char)];
        if (group == null) {
          group = '';
        }
        replaced += group;
      } else {
        escaped = false;
        replaced += char;
      }
    }
    return replaced;
  };

  getSearchTerm = function(term, modifiers) {
    var char, escaped, hasC, hasc, i, len, modFlags, term_;
    if (modifiers == null) {
      modifiers = {
        'g': true
      };
    }
    escaped = false;
    hasc = false;
    hasC = false;
    term_ = term;
    term = '';
    for (i = 0, len = term_.length; i < len; i++) {
      char = term_[i];
      if (char === '\\' && !escaped) {
        escaped = true;
        term += char;
      } else {
        if (char === 'c' && escaped) {
          hasc = true;
          term = term.slice(0, -1);
        } else if (char === 'C' && escaped) {
          hasC = true;
          term = term.slice(0, -1);
        } else if (char !== '\\') {
          term += char;
        }
        escaped = false;
      }
    }
    if (hasC) {
      modifiers['i'] = false;
    }
    if ((!hasC && !term.match('[A-Z]') && atom.config.get('vim-mode.useSmartcaseForSearch')) || hasc) {
      modifiers['i'] = true;
    }
    modFlags = Object.keys(modifiers).filter(function(key) {
      return modifiers[key];
    }).join('');
    try {
      return new RegExp(term, modFlags);
    } catch (error1) {
      return new RegExp(_.escapeRegExp(term), modFlags);
    }
  };

  Ex = (function() {
    function Ex() {
      this.vsp = bind(this.vsp, this);
      this.s = bind(this.s, this);
      this.sp = bind(this.sp, this);
      this.xit = bind(this.xit, this);
      this.saveas = bind(this.saveas, this);
      this.xa = bind(this.xa, this);
      this.xall = bind(this.xall, this);
      this.wqa = bind(this.wqa, this);
      this.wqall = bind(this.wqall, this);
      this.wa = bind(this.wa, this);
      this.wq = bind(this.wq, this);
      this.w = bind(this.w, this);
      this.e = bind(this.e, this);
      this.tabp = bind(this.tabp, this);
      this.tabn = bind(this.tabn, this);
      this.tabc = bind(this.tabc, this);
      this.tabclose = bind(this.tabclose, this);
      this.tabnew = bind(this.tabnew, this);
      this.tabe = bind(this.tabe, this);
      this.tabedit = bind(this.tabedit, this);
      this.qall = bind(this.qall, this);
      this.q = bind(this.q, this);
    }

    Ex.singleton = function() {
      return Ex.ex || (Ex.ex = new Ex);
    };

    Ex.registerCommand = function(name, func) {
      return Ex.singleton()[name] = func;
    };

    Ex.registerAlias = function(alias, name) {
      return Ex.singleton()[alias] = function(args) {
        return Ex.singleton()[name](args);
      };
    };

    Ex.getCommands = function() {
      return Object.keys(Ex.singleton()).concat(Object.keys(Ex.prototype)).filter(function(cmd, index, list) {
        return list.indexOf(cmd) === index;
      });
    };

    Ex.prototype.quit = function() {
      return atom.workspace.getActivePane().destroyActiveItem();
    };

    Ex.prototype.quitall = function() {
      return atom.close();
    };

    Ex.prototype.q = function() {
      return this.quit();
    };

    Ex.prototype.qall = function() {
      return this.quitall();
    };

    Ex.prototype.tabedit = function(args) {
      if (args.args.trim() !== '') {
        return this.edit(args);
      } else {
        return this.tabnew(args);
      }
    };

    Ex.prototype.tabe = function(args) {
      return this.tabedit(args);
    };

    Ex.prototype.tabnew = function(args) {
      if (args.args.trim() === '') {
        return atom.workspace.open();
      } else {
        return this.tabedit(args);
      }
    };

    Ex.prototype.tabclose = function(args) {
      return this.quit(args);
    };

    Ex.prototype.tabc = function() {
      return this.tabclose();
    };

    Ex.prototype.tabnext = function() {
      var pane;
      pane = atom.workspace.getActivePane();
      return pane.activateNextItem();
    };

    Ex.prototype.tabn = function() {
      return this.tabnext();
    };

    Ex.prototype.tabprevious = function() {
      var pane;
      pane = atom.workspace.getActivePane();
      return pane.activatePreviousItem();
    };

    Ex.prototype.tabp = function() {
      return this.tabprevious();
    };

    Ex.prototype.edit = function(arg) {
      var args, editor, filePath, force, fullPath, range;
      range = arg.range, args = arg.args, editor = arg.editor;
      filePath = args.trim();
      if (filePath[0] === '!') {
        force = true;
        filePath = filePath.slice(1).trim();
      } else {
        force = false;
      }
      if (editor.isModified() && !force) {
        throw new CommandError('No write since last change (add ! to override)');
      }
      if (filePath.indexOf(' ') !== -1) {
        throw new CommandError('Only one file name allowed');
      }
      if (filePath.length !== 0) {
        fullPath = getFullPath(filePath);
        if (fullPath === editor.getPath()) {
          return editor.getBuffer().reload();
        } else {
          return atom.workspace.open(fullPath);
        }
      } else {
        if (editor.getPath() != null) {
          return editor.getBuffer().reload();
        } else {
          throw new CommandError('No file name');
        }
      }
    };

    Ex.prototype.e = function(args) {
      return this.edit(args);
    };

    Ex.prototype.enew = function() {
      var buffer;
      buffer = atom.workspace.getActiveTextEditor().buffer;
      buffer.setPath(void 0);
      return buffer.load();
    };

    Ex.prototype.write = function(arg) {
      var args, deferred, editor, filePath, force, fullPath, range, saveas, saved;
      range = arg.range, args = arg.args, editor = arg.editor, saveas = arg.saveas;
      if (saveas == null) {
        saveas = false;
      }
      filePath = args;
      if (filePath[0] === '!') {
        force = true;
        filePath = filePath.slice(1);
      } else {
        force = false;
      }
      filePath = filePath.trim();
      if (filePath.indexOf(' ') !== -1) {
        throw new CommandError('Only one file name allowed');
      }
      deferred = defer();
      editor = atom.workspace.getActiveTextEditor();
      saved = false;
      if (filePath.length !== 0) {
        fullPath = getFullPath(filePath);
      }
      if ((editor.getPath() != null) && ((fullPath == null) || editor.getPath() === fullPath)) {
        if (saveas) {
          throw new CommandError("Argument required");
        } else {
          trySave(function() {
            return editor.save();
          }).then(deferred.resolve);
          saved = true;
        }
      } else if (fullPath == null) {
        fullPath = atom.showSaveDialogSync();
      }
      if (!saved && (fullPath != null)) {
        if (!force && fs.existsSync(fullPath)) {
          throw new CommandError("File exists (add ! to override)");
        }
        if (saveas || editor.getFileName() === null) {
          editor = atom.workspace.getActiveTextEditor();
          trySave(function() {
            return editor.saveAs(fullPath, editor);
          }).then(deferred.resolve);
        } else {
          trySave(function() {
            return saveAs(fullPath, editor);
          }).then(deferred.resolve);
        }
      }
      return deferred.promise;
    };

    Ex.prototype.wall = function() {
      return atom.workspace.saveAll();
    };

    Ex.prototype.w = function(args) {
      return this.write(args);
    };

    Ex.prototype.wq = function(args) {
      return this.write(args).then((function(_this) {
        return function() {
          return _this.quit();
        };
      })(this));
    };

    Ex.prototype.wa = function() {
      return this.wall();
    };

    Ex.prototype.wqall = function() {
      this.wall();
      return this.quitall();
    };

    Ex.prototype.wqa = function() {
      return this.wqall();
    };

    Ex.prototype.xall = function() {
      return this.wqall();
    };

    Ex.prototype.xa = function() {
      return this.wqall();
    };

    Ex.prototype.saveas = function(args) {
      args.saveas = true;
      return this.write(args);
    };

    Ex.prototype.xit = function(args) {
      return this.wq(args);
    };

    Ex.prototype.split = function(arg) {
      var args, file, filePaths, i, j, len, len1, newPane, pane, range, results, results1;
      range = arg.range, args = arg.args;
      args = args.trim();
      filePaths = args.split(' ');
      if (filePaths.length === 1 && filePaths[0] === '') {
        filePaths = void 0;
      }
      pane = atom.workspace.getActivePane();
      if (atom.config.get('ex-mode.splitbelow')) {
        if ((filePaths != null) && filePaths.length > 0) {
          newPane = pane.splitDown();
          results = [];
          for (i = 0, len = filePaths.length; i < len; i++) {
            file = filePaths[i];
            results.push((function() {
              return atom.workspace.openURIInPane(file, newPane);
            })());
          }
          return results;
        } else {
          return pane.splitDown({
            copyActiveItem: true
          });
        }
      } else {
        if ((filePaths != null) && filePaths.length > 0) {
          newPane = pane.splitUp();
          results1 = [];
          for (j = 0, len1 = filePaths.length; j < len1; j++) {
            file = filePaths[j];
            results1.push((function() {
              return atom.workspace.openURIInPane(file, newPane);
            })());
          }
          return results1;
        } else {
          return pane.splitUp({
            copyActiveItem: true
          });
        }
      }
    };

    Ex.prototype.sp = function(args) {
      return this.split(args);
    };

    Ex.prototype.substitute = function(arg) {
      var args, args_, char, delim, e, editor, escapeChars, escaped, flags, flagsObj, parsed, parsing, pattern, patternRE, range, substition, vimState;
      range = arg.range, args = arg.args, editor = arg.editor, vimState = arg.vimState;
      args_ = args.trimLeft();
      delim = args_[0];
      if (/[a-z1-9\\"|]/i.test(delim)) {
        throw new CommandError("Regular expressions can't be delimited by alphanumeric characters, '\\', '\"' or '|'");
      }
      args_ = args_.slice(1);
      escapeChars = {
        t: '\t',
        n: '\n',
        r: '\r'
      };
      parsed = ['', '', ''];
      parsing = 0;
      escaped = false;
      while ((char = args_[0]) != null) {
        args_ = args_.slice(1);
        if (char === delim) {
          if (!escaped) {
            parsing++;
            if (parsing > 2) {
              throw new CommandError('Trailing characters');
            }
          } else {
            parsed[parsing] = parsed[parsing].slice(0, -1);
          }
        } else if (char === '\\' && !escaped) {
          parsed[parsing] += char;
          escaped = true;
        } else if (parsing === 1 && escaped && (escapeChars[char] != null)) {
          parsed[parsing] += escapeChars[char];
          escaped = false;
        } else {
          escaped = false;
          parsed[parsing] += char;
        }
      }
      pattern = parsed[0], substition = parsed[1], flags = parsed[2];
      if (pattern === '') {
        pattern = vimState.getSearchHistoryItem();
        if (pattern == null) {
          atom.beep();
          throw new CommandError('No previous regular expression');
        }
      } else {
        vimState.pushSearchHistory(pattern);
      }
      try {
        flagsObj = {};
        flags.split('').forEach(function(flag) {
          return flagsObj[flag] = true;
        });
        patternRE = getSearchTerm(pattern, flagsObj);
      } catch (error1) {
        e = error1;
        if (e.message.indexOf('Invalid flags supplied to RegExp constructor') === 0) {
          throw new CommandError("Invalid flags: " + e.message.slice(45));
        } else if (e.message.indexOf('Invalid regular expression: ') === 0) {
          throw new CommandError("Invalid RegEx: " + e.message.slice(27));
        } else {
          throw e;
        }
      }
      return editor.transact(function() {
        var i, line, ref, ref1, results;
        results = [];
        for (line = i = ref = range[0], ref1 = range[1]; ref <= ref1 ? i <= ref1 : i >= ref1; line = ref <= ref1 ? ++i : --i) {
          results.push(editor.scanInBufferRange(patternRE, [[line, 0], [line + 1, 0]], function(arg1) {
            var match, replace;
            match = arg1.match, replace = arg1.replace;
            return replace(replaceGroups(match.slice(0), substition));
          }));
        }
        return results;
      });
    };

    Ex.prototype.s = function(args) {
      return this.substitute(args);
    };

    Ex.prototype.vsplit = function(arg) {
      var args, file, filePaths, i, j, len, len1, newPane, pane, range, results, results1;
      range = arg.range, args = arg.args;
      args = args.trim();
      filePaths = args.split(' ');
      if (filePaths.length === 1 && filePaths[0] === '') {
        filePaths = void 0;
      }
      pane = atom.workspace.getActivePane();
      if (atom.config.get('ex-mode.splitright')) {
        if ((filePaths != null) && filePaths.length > 0) {
          newPane = pane.splitRight();
          results = [];
          for (i = 0, len = filePaths.length; i < len; i++) {
            file = filePaths[i];
            results.push((function() {
              return atom.workspace.openURIInPane(file, newPane);
            })());
          }
          return results;
        } else {
          return pane.splitRight({
            copyActiveItem: true
          });
        }
      } else {
        if ((filePaths != null) && filePaths.length > 0) {
          newPane = pane.splitLeft();
          results1 = [];
          for (j = 0, len1 = filePaths.length; j < len1; j++) {
            file = filePaths[j];
            results1.push((function() {
              return atom.workspace.openURIInPane(file, newPane);
            })());
          }
          return results1;
        } else {
          return pane.splitLeft({
            copyActiveItem: true
          });
        }
      }
    };

    Ex.prototype.vsp = function(args) {
      return this.vsplit(args);
    };

    Ex.prototype["delete"] = function(arg) {
      var editor, range, text;
      range = arg.range;
      range = [[range[0], 0], [range[1] + 1, 0]];
      editor = atom.workspace.getActiveTextEditor();
      text = editor.getTextInBufferRange(range);
      atom.clipboard.write(text);
      return editor.buffer.setTextInRange(range, '');
    };

    Ex.prototype.yank = function(arg) {
      var range, txt;
      range = arg.range;
      range = [[range[0], 0], [range[1] + 1, 0]];
      txt = atom.workspace.getActiveTextEditor().getTextInBufferRange(range);
      return atom.clipboard.write(txt);
    };

    Ex.prototype.set = function(arg) {
      var args, i, len, option, options, range, results;
      range = arg.range, args = arg.args;
      args = args.trim();
      if (args === "") {
        throw new CommandError("No option specified");
      }
      options = args.split(' ');
      results = [];
      for (i = 0, len = options.length; i < len; i++) {
        option = options[i];
        results.push((function() {
          var nameValPair, optionName, optionProcessor, optionValue;
          if (option.includes("=")) {
            nameValPair = option.split("=");
            if (nameValPair.length !== 2) {
              throw new CommandError("Wrong option format. [name]=[value] format is expected");
            }
            optionName = nameValPair[0];
            optionValue = nameValPair[1];
            optionProcessor = VimOption.singleton()[optionName];
            if (optionProcessor == null) {
              throw new CommandError("No such option: " + optionName);
            }
            return optionProcessor(optionValue);
          } else {
            optionProcessor = VimOption.singleton()[option];
            if (optionProcessor == null) {
              throw new CommandError("No such option: " + option);
            }
            return optionProcessor();
          }
        })());
      }
      return results;
    };

    return Ex;

  })();

  module.exports = Ex;

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL2hvbWUvamFrZS8uYXRvbS9wYWNrYWdlcy9leC1tb2RlL2xpYi9leC5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFBQSxNQUFBLDJHQUFBO0lBQUE7O0VBQUEsSUFBQSxHQUFPLE9BQUEsQ0FBUSxNQUFSOztFQUNQLFlBQUEsR0FBZSxPQUFBLENBQVEsaUJBQVI7O0VBQ2YsRUFBQSxHQUFLLE9BQUEsQ0FBUSxTQUFSOztFQUNMLFNBQUEsR0FBWSxPQUFBLENBQVEsY0FBUjs7RUFDWixDQUFBLEdBQUksT0FBQSxDQUFRLGlCQUFSOztFQUVKLEtBQUEsR0FBUSxTQUFBO0FBQ04sUUFBQTtJQUFBLFFBQUEsR0FBVztJQUNYLFFBQVEsQ0FBQyxPQUFULEdBQXVCLElBQUEsT0FBQSxDQUFRLFNBQUMsT0FBRCxFQUFVLE1BQVY7TUFDN0IsUUFBUSxDQUFDLE9BQVQsR0FBbUI7YUFDbkIsUUFBUSxDQUFDLE1BQVQsR0FBa0I7SUFGVyxDQUFSO0FBSXZCLFdBQU87RUFORDs7RUFTUixPQUFBLEdBQVUsU0FBQyxJQUFEO0FBQ1IsUUFBQTtJQUFBLFFBQUEsR0FBVyxLQUFBLENBQUE7QUFFWDtNQUNFLElBQUEsQ0FBQTtNQUNBLFFBQVEsQ0FBQyxPQUFULENBQUEsRUFGRjtLQUFBLGNBQUE7TUFHTTtNQUNKLElBQUcsS0FBSyxDQUFDLE9BQU8sQ0FBQyxRQUFkLENBQXVCLGdCQUF2QixDQUFIO1FBQ0UsSUFBSSxDQUFDLGFBQWEsQ0FBQyxVQUFuQixDQUE4Qix1QkFBQSxHQUF3QixLQUFLLENBQUMsT0FBNUQsRUFERjtPQUFBLE1BRUssSUFBRyxrQkFBSDtRQUNILElBQUcsS0FBSyxDQUFDLElBQU4sS0FBYyxRQUFqQjtVQUNFLElBQUksQ0FBQyxhQUNILENBQUMsVUFESCxDQUNjLDBDQUFBLEdBQTJDLEtBQUssQ0FBQyxJQUFqRCxHQUFzRCxHQURwRSxFQURGO1NBQUEsTUFHSyxXQUFHLEtBQUss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R0FBSyxTQUFDLEdBQUQ7QUFDSCxVQUFBO01BRE0sbUJBQU87TUFDYixJQUFBLEdBQU8sSUFBSSxDQUFDLElBQUwsQ0FBQTtNQUNQLElBQUcsSUFBQSxLQUFRLEVBQVg7QUFDRSxjQUFVLElBQUEsWUFBQSxDQUFhLHFCQUFiLEVBRFo7O01BRUEsT0FBQSxHQUFVLElBQUksQ0FBQyxLQUFMLENBQVcsR0FBWDtBQUNWO1dBQUEseUNBQUE7O3FCQUNLLENBQUEsU0FBQTtBQUNELGNBQUE7VUFBQSxJQUFHLE1BQU0sQ0FBQyxRQUFQLENBQWdCLEdBQWhCLENBQUg7WUFDRSxXQUFBLEdBQWMsTUFBTSxDQUFDLEtBQVAsQ0FBYSxHQUFiO1lBQ2QsSUFBSSxXQUFXLENBQUMsTUFBWixLQUFzQixDQUExQjtBQUNFLG9CQUFVLElBQUEsWUFBQSxDQUFhLHdEQUFiLEVBRFo7O1lBRUEsVUFBQSxHQUFhLFdBQVksQ0FBQSxDQUFBO1lBQ3pCLFdBQUEsR0FBYyxXQUFZLENBQUEsQ0FBQTtZQUMxQixlQUFBLEdBQWtCLFNBQVMsQ0FBQyxTQUFWLENBQUEsQ0FBc0IsQ0FBQSxVQUFBO1lBQ3hDLElBQU8sdUJBQVA7QUFDRSxvQkFBVSxJQUFBLFlBQUEsQ0FBYSxrQkFBQSxHQUFtQixVQUFoQyxFQURaOzttQkFFQSxlQUFBLENBQWdCLFdBQWhCLEVBVEY7V0FBQSxNQUFBO1lBV0UsZUFBQSxHQUFrQixTQUFTLENBQUMsU0FBVixDQUFBLENBQXNCLENBQUEsTUFBQTtZQUN4QyxJQUFPLHVCQUFQO0FBQ0Usb0JBQVUsSUFBQSxZQUFBLENBQWEsa0JBQUEsR0FBbUIsTUFBaEMsRUFEWjs7bUJBRUEsZUFBQSxDQUFBLEVBZEY7O1FBREMsQ0FBQSxDQUFILENBQUE7QUFERjs7SUFMRzs7Ozs7O0VBdUJQLE1BQU0sQ0FBQyxPQUFQLEdBQWlCO0FBamFqQiIsInNvdXJjZXNDb250ZW50IjpbInBhdGggPSByZXF1aXJlICdwYXRoJ1xuQ29tbWFuZEVycm9yID0gcmVxdWlyZSAnLi9jb21tYW5kLWVycm9yJ1xuZnMgPSByZXF1aXJlICdmcy1wbHVzJ1xuVmltT3B0aW9uID0gcmVxdWlyZSAnLi92aW0tb3B0aW9uJ1xuXyA9IHJlcXVpcmUgJ3VuZGVyc2NvcmUtcGx1cydcblxuZGVmZXIgPSAoKSAtPlxuICBkZWZlcnJlZCA9IHt9XG4gIGRlZmVycmVkLnByb21pc2UgPSBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSAtPlxuICAgIGRlZmVycmVkLnJlc29sdmUgPSByZXNvbHZlXG4gICAgZGVmZXJyZWQucmVqZWN0ID0gcmVqZWN0XG4gIClcbiAgcmV0dXJuIGRlZmVycmVkXG5cblxudHJ5U2F2ZSA9IChmdW5jKSAtPlxuICBkZWZlcnJlZCA9IGRlZmVyKClcblxuICB0cnlcbiAgICBmdW5jKClcbiAgICBkZWZlcnJlZC5yZXNvbHZlKClcbiAgY2F0Y2ggZXJyb3JcbiAgICBpZiBlcnJvci5tZXNzYWdlLmVuZHNXaXRoKCdpcyBhIGRpcmVjdG9yeScpXG4gICAgICBhdG9tLm5vdGlmaWNhdGlvbnMuYWRkV2FybmluZyhcIlVuYWJsZSB0byBzYXZlIGZpbGU6ICN7ZXJyb3IubWVzc2FnZX1cIilcbiAgICBlbHNlIGlmIGVycm9yLnBhdGg/XG4gICAgICBpZiBlcnJvci5jb2RlIGlzICdFQUNDRVMnXG4gICAgICAgIGF0b20ubm90aWZpY2F0aW9uc1xuICAgICAgICAgIC5hZGRXYXJuaW5nKFwiVW5hYmxlIHRvIHNhdmUgZmlsZTogUGVybWlzc2lvbiBkZW5pZWQgJyN7ZXJyb3IucGF0aH0nXCIpXG4gICAgICBlbHNlIGlmIGVycm9yLmNvZGUgaW4gWydFUEVSTScsICdFQlVTWScsICdVTktOT1dOJywgJ0VFWElTVCddXG4gICAgICAgIGF0b20ubm90aWZpY2F0aW9ucy5hZGRXYXJuaW5nKFwiVW5hYmxlIHRvIHNhdmUgZmlsZSAnI3tlcnJvci5wYXRofSdcIixcbiAgICAgICAgICBkZXRhaWw6IGVycm9yLm1lc3NhZ2UpXG4gICAgICBlbHNlIGlmIGVycm9yLmNvZGUgaXMgJ0VST0ZTJ1xuICAgICAgICBhdG9tLm5vdGlmaWNhdGlvbnMuYWRkV2FybmluZyhcbiAgICAgICAgICBcIlVuYWJsZSB0byBzYXZlIGZpbGU6IFJlYWQtb25seSBmaWxlIHN5c3RlbSAnI3tlcnJvci5wYXRofSdcIilcbiAgICBlbHNlIGlmIChlcnJvck1hdGNoID1cbiAgICAgICAgL0VOT1RESVIsIG5vdCBhIGRpcmVjdG9yeSAnKFteJ10rKScvLmV4ZWMoZXJyb3IubWVzc2FnZSkpXG4gICAgICBmaWxlTmFtZSA9IGVycm9yTWF0Y2hbMV1cbiAgICAgIGF0b20ubm90aWZpY2F0aW9ucy5hZGRXYXJuaW5nKFwiVW5hYmxlIHRvIHNhdmUgZmlsZTogQSBkaXJlY3RvcnkgaW4gdGhlIFwiK1xuICAgICAgICBcInBhdGggJyN7ZmlsZU5hbWV9JyBjb3VsZCBub3QgYmUgd3JpdHRlbiB0b1wiKVxuICAgIGVsc2VcbiAgICAgIHRocm93IGVycm9yXG5cbiAgZGVmZXJyZWQucHJvbWlzZVxuXG5zYXZlQXMgPSAoZmlsZVBhdGgsIGVkaXRvcikgLT5cbiAgZnMud3JpdGVGaWxlU3luYyhmaWxlUGF0aCwgZWRpdG9yLmdldFRleHQoKSlcblxuZ2V0RnVsbFBhdGggPSAoZmlsZVBhdGgpIC0+XG4gIGZpbGVQYXRoID0gZnMubm9ybWFsaXplKGZpbGVQYXRoKVxuXG4gIGlmIHBhdGguaXNBYnNvbHV0ZShmaWxlUGF0aClcbiAgICBmaWxlUGF0aFxuICBlbHNlIGlmIGF0b20ucHJvamVjdC5nZXRQYXRocygpLmxlbmd0aCA9PSAwXG4gICAgcGF0aC5qb2luKGZzLm5vcm1hbGl6ZSgnficpLCBmaWxlUGF0aClcbiAgZWxzZVxuICAgIHBhdGguam9pbihhdG9tLnByb2plY3QuZ2V0UGF0aHMoKVswXSwgZmlsZVBhdGgpXG5cbnJlcGxhY2VHcm91cHMgPSAoZ3JvdXBzLCBzdHJpbmcpIC0+XG4gIHJlcGxhY2VkID0gJydcbiAgZXNjYXBlZCA9IGZhbHNlXG4gIHdoaWxlIChjaGFyID0gc3RyaW5nWzBdKT9cbiAgICBzdHJpbmcgPSBzdHJpbmdbMS4uXVxuICAgIGlmIGNoYXIgaXMgJ1xcXFwnIGFuZCBub3QgZXNjYXBlZFxuICAgICAgZXNjYXBlZCA9IHRydWVcbiAgICBlbHNlIGlmIC9cXGQvLnRlc3QoY2hhcikgYW5kIGVzY2FwZWRcbiAgICAgIGVzY2FwZWQgPSBmYWxzZVxuICAgICAgZ3JvdXAgPSBncm91cHNbcGFyc2VJbnQoY2hhcildXG4gICAgICBncm91cCA/PSAnJ1xuICAgICAgcmVwbGFjZWQgKz0gZ3JvdXBcbiAgICBlbHNlXG4gICAgICBlc2NhcGVkID0gZmFsc2VcbiAgICAgIHJlcGxhY2VkICs9IGNoYXJcblxuICByZXBsYWNlZFxuXG5nZXRTZWFyY2hUZXJtID0gKHRlcm0sIG1vZGlmaWVycyA9IHsnZyc6IHRydWV9KSAtPlxuXG4gIGVzY2FwZWQgPSBmYWxzZVxuICBoYXNjID0gZmFsc2VcbiAgaGFzQyA9IGZhbHNlXG4gIHRlcm1fID0gdGVybVxuICB0ZXJtID0gJydcbiAgZm9yIGNoYXIgaW4gdGVybV9cbiAgICBpZiBjaGFyIGlzICdcXFxcJyBhbmQgbm90IGVzY2FwZWRcbiAgICAgIGVzY2FwZWQgPSB0cnVlXG4gICAgICB0ZXJtICs9IGNoYXJcbiAgICBlbHNlXG4gICAgICBpZiBjaGFyIGlzICdjJyBhbmQgZXNjYXBlZFxuICAgICAgICBoYXNjID0gdHJ1ZVxuICAgICAgICB0ZXJtID0gdGVybVsuLi4tMV1cbiAgICAgIGVsc2UgaWYgY2hhciBpcyAnQycgYW5kIGVzY2FwZWRcbiAgICAgICAgaGFzQyA9IHRydWVcbiAgICAgICAgdGVybSA9IHRlcm1bLi4uLTFdXG4gICAgICBlbHNlIGlmIGNoYXIgaXNudCAnXFxcXCdcbiAgICAgICAgdGVybSArPSBjaGFyXG4gICAgICBlc2NhcGVkID0gZmFsc2VcblxuICBpZiBoYXNDXG4gICAgbW9kaWZpZXJzWydpJ10gPSBmYWxzZVxuICBpZiAobm90IGhhc0MgYW5kIG5vdCB0ZXJtLm1hdGNoKCdbQS1aXScpIGFuZCBcXFxuICAgICAgYXRvbS5jb25maWcuZ2V0KCd2aW0tbW9kZS51c2VTbWFydGNhc2VGb3JTZWFyY2gnKSkgb3IgaGFzY1xuICAgIG1vZGlmaWVyc1snaSddID0gdHJ1ZVxuXG4gIG1vZEZsYWdzID0gT2JqZWN0LmtleXMobW9kaWZpZXJzKS5maWx0ZXIoKGtleSkgLT4gbW9kaWZpZXJzW2tleV0pLmpvaW4oJycpXG5cbiAgdHJ5XG4gICAgbmV3IFJlZ0V4cCh0ZXJtLCBtb2RGbGFncylcbiAgY2F0Y2hcbiAgICBuZXcgUmVnRXhwKF8uZXNjYXBlUmVnRXhwKHRlcm0pLCBtb2RGbGFncylcblxuY2xhc3MgRXhcbiAgQHNpbmdsZXRvbjogPT5cbiAgICBAZXggfHw9IG5ldyBFeFxuXG4gIEByZWdpc3RlckNvbW1hbmQ6IChuYW1lLCBmdW5jKSA9PlxuICAgIEBzaW5nbGV0b24oKVtuYW1lXSA9IGZ1bmNcblxuICBAcmVnaXN0ZXJBbGlhczogKGFsaWFzLCBuYW1lKSA9PlxuICAgIEBzaW5nbGV0b24oKVthbGlhc10gPSAoYXJncykgPT4gQHNpbmdsZXRvbigpW25hbWVdKGFyZ3MpXG5cbiAgQGdldENvbW1hbmRzOiAoKSA9PlxuICAgIE9iamVjdC5rZXlzKEV4LnNpbmdsZXRvbigpKS5jb25jYXQoT2JqZWN0LmtleXMoRXgucHJvdG90eXBlKSkuZmlsdGVyKChjbWQsIGluZGV4LCBsaXN0KSAtPlxuICAgICAgbGlzdC5pbmRleE9mKGNtZCkgPT0gaW5kZXhcbiAgICApXG5cbiAgcXVpdDogLT5cbiAgICBhdG9tLndvcmtzcGFjZS5nZXRBY3RpdmVQYW5lKCkuZGVzdHJveUFjdGl2ZUl0ZW0oKVxuXG4gIHF1aXRhbGw6IC0+XG4gICAgYXRvbS5jbG9zZSgpXG5cbiAgcTogPT4gQHF1aXQoKVxuXG4gIHFhbGw6ID0+IEBxdWl0YWxsKClcblxuICB0YWJlZGl0OiAoYXJncykgPT5cbiAgICBpZiBhcmdzLmFyZ3MudHJpbSgpIGlzbnQgJydcbiAgICAgIEBlZGl0KGFyZ3MpXG4gICAgZWxzZVxuICAgICAgQHRhYm5ldyhhcmdzKVxuXG4gIHRhYmU6IChhcmdzKSA9PiBAdGFiZWRpdChhcmdzKVxuXG4gIHRhYm5ldzogKGFyZ3MpID0+XG4gICAgaWYgYXJncy5hcmdzLnRyaW0oKSBpcyAnJ1xuICAgICAgYXRvbS53b3Jrc3BhY2Uub3BlbigpXG4gICAgZWxzZVxuICAgICAgQHRhYmVkaXQoYXJncylcblxuICB0YWJjbG9zZTogKGFyZ3MpID0+IEBxdWl0KGFyZ3MpXG5cbiAgdGFiYzogPT4gQHRhYmNsb3NlKClcblxuICB0YWJuZXh0OiAtPlxuICAgIHBhbmUgPSBhdG9tLndvcmtzcGFjZS5nZXRBY3RpdmVQYW5lKClcbiAgICBwYW5lLmFjdGl2YXRlTmV4dEl0ZW0oKVxuXG4gIHRhYm46ID0+IEB0YWJuZXh0KClcblxuICB0YWJwcmV2aW91czogLT5cbiAgICBwYW5lID0gYXRvbS53b3Jrc3BhY2UuZ2V0QWN0aXZlUGFuZSgpXG4gICAgcGFuZS5hY3RpdmF0ZVByZXZpb3VzSXRlbSgpXG5cbiAgdGFicDogPT4gQHRhYnByZXZpb3VzKClcblxuICBlZGl0OiAoeyByYW5nZSwgYXJncywgZWRpdG9yIH0pIC0+XG4gICAgZmlsZVBhdGggPSBhcmdzLnRyaW0oKVxuICAgIGlmIGZpbGVQYXRoWzBdIGlzICchJ1xuICAgICAgZm9yY2UgPSB0cnVlXG4gICAgICBmaWxlUGF0aCA9IGZpbGVQYXRoWzEuLl0udHJpbSgpXG4gICAgZWxzZVxuICAgICAgZm9yY2UgPSBmYWxzZVxuXG4gICAgaWYgZWRpdG9yLmlzTW9kaWZpZWQoKSBhbmQgbm90IGZvcmNlXG4gICAgICB0aHJvdyBuZXcgQ29tbWFuZEVycm9yKCdObyB3cml0ZSBzaW5jZSBsYXN0IGNoYW5nZSAoYWRkICEgdG8gb3ZlcnJpZGUpJylcbiAgICBpZiBmaWxlUGF0aC5pbmRleE9mKCcgJykgaXNudCAtMVxuICAgICAgdGhyb3cgbmV3IENvbW1hbmRFcnJvcignT25seSBvbmUgZmlsZSBuYW1lIGFsbG93ZWQnKVxuXG4gICAgaWYgZmlsZVBhdGgubGVuZ3RoIGlzbnQgMFxuICAgICAgZnVsbFBhdGggPSBnZXRGdWxsUGF0aChmaWxlUGF0aClcbiAgICAgIGlmIGZ1bGxQYXRoIGlzIGVkaXRvci5nZXRQYXRoKClcbiAgICAgICAgZWRpdG9yLmdldEJ1ZmZlcigpLnJlbG9hZCgpXG4gICAgICBlbHNlXG4gICAgICAgIGF0b20ud29ya3NwYWNlLm9wZW4oZnVsbFBhdGgpXG4gICAgZWxzZVxuICAgICAgaWYgZWRpdG9yLmdldFBhdGgoKT9cbiAgICAgICAgZWRpdG9yLmdldEJ1ZmZlcigpLnJlbG9hZCgpXG4gICAgICBlbHNlXG4gICAgICAgIHRocm93IG5ldyBDb21tYW5kRXJyb3IoJ05vIGZpbGUgbmFtZScpXG5cbiAgZTogKGFyZ3MpID0+IEBlZGl0KGFyZ3MpXG5cbiAgZW5ldzogLT5cbiAgICBidWZmZXIgPSBhdG9tLndvcmtzcGFjZS5nZXRBY3RpdmVUZXh0RWRpdG9yKCkuYnVmZmVyXG4gICAgYnVmZmVyLnNldFBhdGgodW5kZWZpbmVkKVxuICAgIGJ1ZmZlci5sb2FkKClcblxuICB3cml0ZTogKHsgcmFuZ2UsIGFyZ3MsIGVkaXRvciwgc2F2ZWFzIH0pIC0+XG4gICAgc2F2ZWFzID89IGZhbHNlXG4gICAgZmlsZVBhdGggPSBhcmdzXG4gICAgaWYgZmlsZVBhdGhbMF0gaXMgJyEnXG4gICAgICBmb3JjZSA9IHRydWVcbiAgICAgIGZpbGVQYXRoID0gZmlsZVBhdGhbMS4uXVxuICAgIGVsc2VcbiAgICAgIGZvcmNlID0gZmFsc2VcblxuICAgIGZpbGVQYXRoID0gZmlsZVBhdGgudHJpbSgpXG4gICAgaWYgZmlsZVBhdGguaW5kZXhPZignICcpIGlzbnQgLTFcbiAgICAgIHRocm93IG5ldyBDb21tYW5kRXJyb3IoJ09ubHkgb25lIGZpbGUgbmFtZSBhbGxvd2VkJylcblxuICAgIGRlZmVycmVkID0gZGVmZXIoKVxuXG4gICAgZWRpdG9yID0gYXRvbS53b3Jrc3BhY2UuZ2V0QWN0aXZlVGV4dEVkaXRvcigpXG4gICAgc2F2ZWQgPSBmYWxzZVxuICAgIGlmIGZpbGVQYXRoLmxlbmd0aCBpc250IDBcbiAgICAgIGZ1bGxQYXRoID0gZ2V0RnVsbFBhdGgoZmlsZVBhdGgpXG4gICAgaWYgZWRpdG9yLmdldFBhdGgoKT8gYW5kIChub3QgZnVsbFBhdGg/IG9yIGVkaXRvci5nZXRQYXRoKCkgPT0gZnVsbFBhdGgpXG4gICAgICBpZiBzYXZlYXNcbiAgICAgICAgdGhyb3cgbmV3IENvbW1hbmRFcnJvcihcIkFyZ3VtZW50IHJlcXVpcmVkXCIpXG4gICAgICBlbHNlXG4gICAgICAgICMgVXNlIGVkaXRvci5zYXZlIHdoZW4gbm8gcGF0aCBpcyBnaXZlbiBvciB0aGUgcGF0aCB0byB0aGUgZmlsZSBpcyBnaXZlblxuICAgICAgICB0cnlTYXZlKC0+IGVkaXRvci5zYXZlKCkpLnRoZW4oZGVmZXJyZWQucmVzb2x2ZSlcbiAgICAgICAgc2F2ZWQgPSB0cnVlXG4gICAgZWxzZSBpZiBub3QgZnVsbFBhdGg/XG4gICAgICBmdWxsUGF0aCA9IGF0b20uc2hvd1NhdmVEaWFsb2dTeW5jKClcblxuICAgIGlmIG5vdCBzYXZlZCBhbmQgZnVsbFBhdGg/XG4gICAgICBpZiBub3QgZm9yY2UgYW5kIGZzLmV4aXN0c1N5bmMoZnVsbFBhdGgpXG4gICAgICAgIHRocm93IG5ldyBDb21tYW5kRXJyb3IoXCJGaWxlIGV4aXN0cyAoYWRkICEgdG8gb3ZlcnJpZGUpXCIpXG4gICAgICBpZiBzYXZlYXMgb3IgZWRpdG9yLmdldEZpbGVOYW1lKCkgPT0gbnVsbFxuICAgICAgICBlZGl0b3IgPSBhdG9tLndvcmtzcGFjZS5nZXRBY3RpdmVUZXh0RWRpdG9yKClcbiAgICAgICAgdHJ5U2F2ZSgtPiBlZGl0b3Iuc2F2ZUFzKGZ1bGxQYXRoLCBlZGl0b3IpKS50aGVuKGRlZmVycmVkLnJlc29sdmUpXG4gICAgICBlbHNlXG4gICAgICAgIHRyeVNhdmUoLT4gc2F2ZUFzKGZ1bGxQYXRoLCBlZGl0b3IpKS50aGVuKGRlZmVycmVkLnJlc29sdmUpXG5cbiAgICBkZWZlcnJlZC5wcm9taXNlXG5cbiAgd2FsbDogLT5cbiAgICBhdG9tLndvcmtzcGFjZS5zYXZlQWxsKClcblxuICB3OiAoYXJncykgPT5cbiAgICBAd3JpdGUoYXJncylcblxuICB3cTogKGFyZ3MpID0+XG4gICAgQHdyaXRlKGFyZ3MpLnRoZW4gPT4gQHF1aXQoKVxuXG4gIHdhOiA9PlxuICAgIEB3YWxsKClcblxuICB3cWFsbDogPT5cbiAgICBAd2FsbCgpXG4gICAgQHF1aXRhbGwoKVxuXG4gIHdxYTogPT5cbiAgICBAd3FhbGwoKVxuXG4gIHhhbGw6ID0+XG4gICAgQHdxYWxsKClcblxuICB4YTogPT5cbiAgICBAd3FhbGwoKVxuXG4gIHNhdmVhczogKGFyZ3MpID0+XG4gICAgYXJncy5zYXZlYXMgPSB0cnVlXG4gICAgQHdyaXRlKGFyZ3MpXG5cbiAgeGl0OiAoYXJncykgPT4gQHdxKGFyZ3MpXG5cblxuICBzcGxpdDogKHsgcmFuZ2UsIGFyZ3MgfSkgLT5cbiAgICBhcmdzID0gYXJncy50cmltKClcbiAgICBmaWxlUGF0aHMgPSBhcmdzLnNwbGl0KCcgJylcbiAgICBmaWxlUGF0aHMgPSB1bmRlZmluZWQgaWYgZmlsZVBhdGhzLmxlbmd0aCBpcyAxIGFuZCBmaWxlUGF0aHNbMF0gaXMgJydcbiAgICBwYW5lID0gYXRvbS53b3Jrc3BhY2UuZ2V0QWN0aXZlUGFuZSgpXG4gICAgaWYgYXRvbS5jb25maWcuZ2V0KCdleC1tb2RlLnNwbGl0YmVsb3cnKVxuICAgICAgaWYgZmlsZVBhdGhzPyBhbmQgZmlsZVBhdGhzLmxlbmd0aCA+IDBcbiAgICAgICAgbmV3UGFuZSA9IHBhbmUuc3BsaXREb3duKClcbiAgICAgICAgZm9yIGZpbGUgaW4gZmlsZVBhdGhzXG4gICAgICAgICAgZG8gLT5cbiAgICAgICAgICAgIGF0b20ud29ya3NwYWNlLm9wZW5VUklJblBhbmUgZmlsZSwgbmV3UGFuZVxuICAgICAgZWxzZVxuICAgICAgICBwYW5lLnNwbGl0RG93bihjb3B5QWN0aXZlSXRlbTogdHJ1ZSlcbiAgICBlbHNlXG4gICAgICBpZiBmaWxlUGF0aHM/IGFuZCBmaWxlUGF0aHMubGVuZ3RoID4gMFxuICAgICAgICBuZXdQYW5lID0gcGFuZS5zcGxpdFVwKClcbiAgICAgICAgZm9yIGZpbGUgaW4gZmlsZVBhdGhzXG4gICAgICAgICAgZG8gLT5cbiAgICAgICAgICAgIGF0b20ud29ya3NwYWNlLm9wZW5VUklJblBhbmUgZmlsZSwgbmV3UGFuZVxuICAgICAgZWxzZVxuICAgICAgICBwYW5lLnNwbGl0VXAoY29weUFjdGl2ZUl0ZW06IHRydWUpXG5cblxuICBzcDogKGFyZ3MpID0+IEBzcGxpdChhcmdzKVxuXG4gIHN1YnN0aXR1dGU6ICh7IHJhbmdlLCBhcmdzLCBlZGl0b3IsIHZpbVN0YXRlIH0pIC0+XG4gICAgYXJnc18gPSBhcmdzLnRyaW1MZWZ0KClcbiAgICBkZWxpbSA9IGFyZ3NfWzBdXG4gICAgaWYgL1thLXoxLTlcXFxcXCJ8XS9pLnRlc3QoZGVsaW0pXG4gICAgICB0aHJvdyBuZXcgQ29tbWFuZEVycm9yKFxuICAgICAgICBcIlJlZ3VsYXIgZXhwcmVzc2lvbnMgY2FuJ3QgYmUgZGVsaW1pdGVkIGJ5IGFscGhhbnVtZXJpYyBjaGFyYWN0ZXJzLCAnXFxcXCcsICdcXFwiJyBvciAnfCdcIilcbiAgICBhcmdzXyA9IGFyZ3NfWzEuLl1cbiAgICBlc2NhcGVDaGFycyA9IHt0OiAnXFx0JywgbjogJ1xcbicsIHI6ICdcXHInfVxuICAgIHBhcnNlZCA9IFsnJywgJycsICcnXVxuICAgIHBhcnNpbmcgPSAwXG4gICAgZXNjYXBlZCA9IGZhbHNlXG4gICAgd2hpbGUgKGNoYXIgPSBhcmdzX1swXSk/XG4gICAgICBhcmdzXyA9IGFyZ3NfWzEuLl1cbiAgICAgIGlmIGNoYXIgaXMgZGVsaW1cbiAgICAgICAgaWYgbm90IGVzY2FwZWRcbiAgICAgICAgICBwYXJzaW5nKytcbiAgICAgICAgICBpZiBwYXJzaW5nID4gMlxuICAgICAgICAgICAgdGhyb3cgbmV3IENvbW1hbmRFcnJvcignVHJhaWxpbmcgY2hhcmFjdGVycycpXG4gICAgICAgIGVsc2VcbiAgICAgICAgICBwYXJzZWRbcGFyc2luZ10gPSBwYXJzZWRbcGFyc2luZ11bLi4uLTFdXG4gICAgICBlbHNlIGlmIGNoYXIgaXMgJ1xcXFwnIGFuZCBub3QgZXNjYXBlZFxuICAgICAgICBwYXJzZWRbcGFyc2luZ10gKz0gY2hhclxuICAgICAgICBlc2NhcGVkID0gdHJ1ZVxuICAgICAgZWxzZSBpZiBwYXJzaW5nID09IDEgYW5kIGVzY2FwZWQgYW5kIGVzY2FwZUNoYXJzW2NoYXJdP1xuICAgICAgICBwYXJzZWRbcGFyc2luZ10gKz0gZXNjYXBlQ2hhcnNbY2hhcl1cbiAgICAgICAgZXNjYXBlZCA9IGZhbHNlXG4gICAgICBlbHNlXG4gICAgICAgIGVzY2FwZWQgPSBmYWxzZVxuICAgICAgICBwYXJzZWRbcGFyc2luZ10gKz0gY2hhclxuXG4gICAgW3BhdHRlcm4sIHN1YnN0aXRpb24sIGZsYWdzXSA9IHBhcnNlZFxuICAgIGlmIHBhdHRlcm4gaXMgJydcbiAgICAgIHBhdHRlcm4gPSB2aW1TdGF0ZS5nZXRTZWFyY2hIaXN0b3J5SXRlbSgpXG4gICAgICBpZiBub3QgcGF0dGVybj9cbiAgICAgICAgYXRvbS5iZWVwKClcbiAgICAgICAgdGhyb3cgbmV3IENvbW1hbmRFcnJvcignTm8gcHJldmlvdXMgcmVndWxhciBleHByZXNzaW9uJylcbiAgICBlbHNlXG4gICAgICB2aW1TdGF0ZS5wdXNoU2VhcmNoSGlzdG9yeShwYXR0ZXJuKVxuXG4gICAgdHJ5XG4gICAgICBmbGFnc09iaiA9IHt9XG4gICAgICBmbGFncy5zcGxpdCgnJykuZm9yRWFjaCgoZmxhZykgLT4gZmxhZ3NPYmpbZmxhZ10gPSB0cnVlKVxuICAgICAgcGF0dGVyblJFID0gZ2V0U2VhcmNoVGVybShwYXR0ZXJuLCBmbGFnc09iailcbiAgICBjYXRjaCBlXG4gICAgICBpZiBlLm1lc3NhZ2UuaW5kZXhPZignSW52YWxpZCBmbGFncyBzdXBwbGllZCB0byBSZWdFeHAgY29uc3RydWN0b3InKSBpcyAwXG4gICAgICAgIHRocm93IG5ldyBDb21tYW5kRXJyb3IoXCJJbnZhbGlkIGZsYWdzOiAje2UubWVzc2FnZVs0NS4uXX1cIilcbiAgICAgIGVsc2UgaWYgZS5tZXNzYWdlLmluZGV4T2YoJ0ludmFsaWQgcmVndWxhciBleHByZXNzaW9uOiAnKSBpcyAwXG4gICAgICAgIHRocm93IG5ldyBDb21tYW5kRXJyb3IoXCJJbnZhbGlkIFJlZ0V4OiAje2UubWVzc2FnZVsyNy4uXX1cIilcbiAgICAgIGVsc2VcbiAgICAgICAgdGhyb3cgZVxuXG4gICAgZWRpdG9yLnRyYW5zYWN0IC0+XG4gICAgICBmb3IgbGluZSBpbiBbcmFuZ2VbMF0uLnJhbmdlWzFdXVxuICAgICAgICBlZGl0b3Iuc2NhbkluQnVmZmVyUmFuZ2UoXG4gICAgICAgICAgcGF0dGVyblJFLFxuICAgICAgICAgIFtbbGluZSwgMF0sIFtsaW5lICsgMSwgMF1dLFxuICAgICAgICAgICh7bWF0Y2gsIHJlcGxhY2V9KSAtPlxuICAgICAgICAgICAgcmVwbGFjZShyZXBsYWNlR3JvdXBzKG1hdGNoWy4uXSwgc3Vic3RpdGlvbikpXG4gICAgICAgIClcblxuICBzOiAoYXJncykgPT4gQHN1YnN0aXR1dGUoYXJncylcblxuICB2c3BsaXQ6ICh7IHJhbmdlLCBhcmdzIH0pIC0+XG4gICAgYXJncyA9IGFyZ3MudHJpbSgpXG4gICAgZmlsZVBhdGhzID0gYXJncy5zcGxpdCgnICcpXG4gICAgZmlsZVBhdGhzID0gdW5kZWZpbmVkIGlmIGZpbGVQYXRocy5sZW5ndGggaXMgMSBhbmQgZmlsZVBhdGhzWzBdIGlzICcnXG4gICAgcGFuZSA9IGF0b20ud29ya3NwYWNlLmdldEFjdGl2ZVBhbmUoKVxuICAgIGlmIGF0b20uY29uZmlnLmdldCgnZXgtbW9kZS5zcGxpdHJpZ2h0JylcbiAgICAgIGlmIGZpbGVQYXRocz8gYW5kIGZpbGVQYXRocy5sZW5ndGggPiAwXG4gICAgICAgIG5ld1BhbmUgPSBwYW5lLnNwbGl0UmlnaHQoKVxuICAgICAgICBmb3IgZmlsZSBpbiBmaWxlUGF0aHNcbiAgICAgICAgICBkbyAtPlxuICAgICAgICAgICAgYXRvbS53b3Jrc3BhY2Uub3BlblVSSUluUGFuZSBmaWxlLCBuZXdQYW5lXG4gICAgICBlbHNlXG4gICAgICAgIHBhbmUuc3BsaXRSaWdodChjb3B5QWN0aXZlSXRlbTogdHJ1ZSlcbiAgICBlbHNlXG4gICAgICBpZiBmaWxlUGF0aHM/IGFuZCBmaWxlUGF0aHMubGVuZ3RoID4gMFxuICAgICAgICBuZXdQYW5lID0gcGFuZS5zcGxpdExlZnQoKVxuICAgICAgICBmb3IgZmlsZSBpbiBmaWxlUGF0aHNcbiAgICAgICAgICBkbyAtPlxuICAgICAgICAgICAgYXRvbS53b3Jrc3BhY2Uub3BlblVSSUluUGFuZSBmaWxlLCBuZXdQYW5lXG4gICAgICBlbHNlXG4gICAgICAgIHBhbmUuc3BsaXRMZWZ0KGNvcHlBY3RpdmVJdGVtOiB0cnVlKVxuXG4gIHZzcDogKGFyZ3MpID0+IEB2c3BsaXQoYXJncylcblxuICBkZWxldGU6ICh7IHJhbmdlIH0pIC0+XG4gICAgcmFuZ2UgPSBbW3JhbmdlWzBdLCAwXSwgW3JhbmdlWzFdICsgMSwgMF1dXG4gICAgZWRpdG9yID0gYXRvbS53b3Jrc3BhY2UuZ2V0QWN0aXZlVGV4dEVkaXRvcigpXG5cbiAgICB0ZXh0ID0gZWRpdG9yLmdldFRleHRJbkJ1ZmZlclJhbmdlKHJhbmdlKVxuICAgIGF0b20uY2xpcGJvYXJkLndyaXRlKHRleHQpXG5cbiAgICBlZGl0b3IuYnVmZmVyLnNldFRleHRJblJhbmdlKHJhbmdlLCAnJylcblxuICB5YW5rOiAoeyByYW5nZSB9KSAtPlxuICAgIHJhbmdlID0gW1tyYW5nZVswXSwgMF0sIFtyYW5nZVsxXSArIDEsIDBdXVxuICAgIHR4dCA9IGF0b20ud29ya3NwYWNlLmdldEFjdGl2ZVRleHRFZGl0b3IoKS5nZXRUZXh0SW5CdWZmZXJSYW5nZShyYW5nZSlcbiAgICBhdG9tLmNsaXBib2FyZC53cml0ZSh0eHQpO1xuXG4gIHNldDogKHsgcmFuZ2UsIGFyZ3MgfSkgLT5cbiAgICBhcmdzID0gYXJncy50cmltKClcbiAgICBpZiBhcmdzID09IFwiXCJcbiAgICAgIHRocm93IG5ldyBDb21tYW5kRXJyb3IoXCJObyBvcHRpb24gc3BlY2lmaWVkXCIpXG4gICAgb3B0aW9ucyA9IGFyZ3Muc3BsaXQoJyAnKVxuICAgIGZvciBvcHRpb24gaW4gb3B0aW9uc1xuICAgICAgZG8gLT5cbiAgICAgICAgaWYgb3B0aW9uLmluY2x1ZGVzKFwiPVwiKVxuICAgICAgICAgIG5hbWVWYWxQYWlyID0gb3B0aW9uLnNwbGl0KFwiPVwiKVxuICAgICAgICAgIGlmIChuYW1lVmFsUGFpci5sZW5ndGggIT0gMilcbiAgICAgICAgICAgIHRocm93IG5ldyBDb21tYW5kRXJyb3IoXCJXcm9uZyBvcHRpb24gZm9ybWF0LiBbbmFtZV09W3ZhbHVlXSBmb3JtYXQgaXMgZXhwZWN0ZWRcIilcbiAgICAgICAgICBvcHRpb25OYW1lID0gbmFtZVZhbFBhaXJbMF1cbiAgICAgICAgICBvcHRpb25WYWx1ZSA9IG5hbWVWYWxQYWlyWzFdXG4gICAgICAgICAgb3B0aW9uUHJvY2Vzc29yID0gVmltT3B0aW9uLnNpbmdsZXRvbigpW29wdGlvbk5hbWVdXG4gICAgICAgICAgaWYgbm90IG9wdGlvblByb2Nlc3Nvcj9cbiAgICAgICAgICAgIHRocm93IG5ldyBDb21tYW5kRXJyb3IoXCJObyBzdWNoIG9wdGlvbjogI3tvcHRpb25OYW1lfVwiKVxuICAgICAgICAgIG9wdGlvblByb2Nlc3NvcihvcHRpb25WYWx1ZSlcbiAgICAgICAgZWxzZVxuICAgICAgICAgIG9wdGlvblByb2Nlc3NvciA9IFZpbU9wdGlvbi5zaW5nbGV0b24oKVtvcHRpb25dXG4gICAgICAgICAgaWYgbm90IG9wdGlvblByb2Nlc3Nvcj9cbiAgICAgICAgICAgIHRocm93IG5ldyBDb21tYW5kRXJyb3IoXCJObyBzdWNoIG9wdGlvbjogI3tvcHRpb259XCIpXG4gICAgICAgICAgb3B0aW9uUHJvY2Vzc29yKClcblxubW9kdWxlLmV4cG9ydHMgPSBFeFxuIl19
