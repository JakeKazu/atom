(function() {
  var CompositeDisposable, CursorTools, Disposable, Emacs, Mark, _, appendCopy, ref,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  _ = require('underscore-plus');

  ref = require('atom'), CompositeDisposable = ref.CompositeDisposable, Disposable = ref.Disposable;

  Mark = require('./mark');

  CursorTools = require('./cursor-tools');

  appendCopy = require('./selection').appendCopy;

  module.exports = Emacs = (function() {
    var KILL_COMMAND;

    KILL_COMMAND = 'emacs-plus:kill-region';

    Emacs.prototype.destroyed = false;

    function Emacs(editor, globalEmacsState) {
      this.editor = editor;
      this.globalEmacsState = globalEmacsState;
      this.transposeWords = bind(this.transposeWords, this);
      this.transposeLines = bind(this.transposeLines, this);
      this.setMark = bind(this.setMark, this);
      this.recenterTopBottom = bind(this.recenterTopBottom, this);
      this.openLine = bind(this.openLine, this);
      this.killWord = bind(this.killWord, this);
      this.killLine = bind(this.killLine, this);
      this.killWholeLine = bind(this.killWholeLine, this);
      this.killRegion = bind(this.killRegion, this);
      this.justOneSpace = bind(this.justOneSpace, this);
      this.exchangePointAndMark = bind(this.exchangePointAndMark, this);
      this.deleteIndentation = bind(this.deleteIndentation, this);
      this.deleteHorizontalSpace = bind(this.deleteHorizontalSpace, this);
      this.deactivateCursors = bind(this.deactivateCursors, this);
      this.copy = bind(this.copy, this);
      this.capitalizeWord = bind(this.capitalizeWord, this);
      this.backwardKillWord = bind(this.backwardKillWord, this);
      this.appendNextKill = bind(this.appendNextKill, this);
      this.destroy = bind(this.destroy, this);
      this.editorElement = atom.views.getView(this.editor);
      this.mark = Mark["for"](this.editor);
      this.subscriptions = new CompositeDisposable;
      this.subscriptions.add(this.addClass());
      this.subscriptions.add(this.editor.onDidDestroy(this.destroy));
      this.subscriptions.add(this.editor.onDidInsertText((function(_this) {
        return function() {
          return _this.globalEmacsState.logCommand({
            type: 'editor:didInsertText'
          });
        };
      })(this)));
      this.registerCommands();
    }

    Emacs.prototype.destroy = function() {
      var ref1;
      if (this.destroyed) {
        return;
      }
      this.destroyed = true;
      this.subscriptions.dispose();
      this.subscriptions = null;
      if ((ref1 = this.mark) != null) {
        ref1.destroy();
      }
      this.mark = null;
      this.editor = null;
      return this.editorElement = null;
    };

    Emacs.prototype.registerCommands = function() {
      return this.subscriptions.add(atom.commands.add(this.editorElement, {
        'emacs-plus:append-next-kill': this.appendNextKill,
        'emacs-plus:backward-kill-word': this.backwardKillWord,
        'emacs-plus:capitalize-word': this.capitalizeWord,
        'emacs-plus:copy': this.copy,
        'emacs-plus:delete-horizontal-space': this.deleteHorizontalSpace,
        'emacs-plus:delete-indentation': this.deleteIndentation,
        'emacs-plus:exchange-point-and-mark': this.exchangePointAndMark,
        'emacs-plus:just-one-space': this.justOneSpace,
        'emacs-plus:kill-line': this.killLine,
        'emacs-plus:kill-region': this.killRegion,
        'emacs-plus:kill-whole-line': this.killWholeLine,
        'emacs-plus:kill-word': this.killWord,
        'emacs-plus:open-line': this.openLine,
        'emacs-plus:recenter-top-bottom': this.recenterTopBottom,
        'emacs-plus:set-mark': this.setMark,
        'emacs-plus:transpose-lines': this.transposeLines,
        'emacs-plus:transpose-words': this.transposeWords,
        'emacs-plus:close-other-panes': this.closeOtherPanes,
        'core:cancel': this.deactivateCursors
      }));
    };

    Emacs.prototype.addClass = function() {
      var className;
      className = 'emacs-plus';
      this.editorElement.classList.add(className);
      return new Disposable((function(_this) {
        return function() {
          if (_this.editor.isAlive()) {
            return _this.editorElement.classList.remove(className);
          }
        };
      })(this));
    };

    Emacs.prototype.appendNextKill = function() {
      this.globalEmacsState.thisCommand = KILL_COMMAND;
      return atom.notifications.addInfo('If a next command is a kill, it will append');
    };

    Emacs.prototype.backwardKillWord = function() {
      var maintainClipboard;
      this.globalEmacsState.thisCommand = KILL_COMMAND;
      maintainClipboard = false;
      return this.killSelectedText(function(selection) {
        if (selection.isEmpty()) {
          selection.selectToBeginningOfWord();
        }
        if (!selection.isEmpty()) {
          selection.cut(maintainClipboard);
        }
        return maintainClipboard = true;
      }, true);
    };

    Emacs.prototype.capitalizeWord = function() {
      return this.editor.replaceSelectedText({
        selectWordIfEmpty: true
      }, function(text) {
        return _.capitalize(text);
      });
    };

    Emacs.prototype.copy = function() {
      this.editor.copySelectedText();
      return this.deactivateCursors();
    };

    Emacs.prototype.deactivateCursors = function() {
      return this.mark.deactivate();
    };

    Emacs.prototype.deleteHorizontalSpace = function() {
      var cursor, i, len, range, ref1, results, tools;
      ref1 = this.editor.getCursors();
      results = [];
      for (i = 0, len = ref1.length; i < len; i++) {
        cursor = ref1[i];
        tools = new CursorTools(cursor);
        range = tools.horizontalSpaceRange();
        results.push(this.editor.setTextInBufferRange(range, ''));
      }
      return results;
    };

    Emacs.prototype.deleteIndentation = function() {
      return this.editor.transact((function(_this) {
        return function() {
          _this.editor.moveUp();
          return _this.editor.joinLines();
        };
      })(this));
    };

    Emacs.prototype.closeOtherPanes = function() {
      var activePane, i, len, pane, ref1, results;
      activePane = atom.workspace.getActivePane();
      if (!activePane) {
        return;
      }
      ref1 = atom.workspace.getPanes();
      results = [];
      for (i = 0, len = ref1.length; i < len; i++) {
        pane = ref1[i];
        if (pane !== activePane) {
          results.push(pane.close());
        } else {
          results.push(void 0);
        }
      }
      return results;
    };

    Emacs.prototype.exchangePointAndMark = function() {
      return this.mark.exchange();
    };

    Emacs.prototype.justOneSpace = function() {
      var cursor, i, len, range, ref1, results, tools;
      ref1 = this.editor.getCursors();
      results = [];
      for (i = 0, len = ref1.length; i < len; i++) {
        cursor = ref1[i];
        tools = new CursorTools(cursor);
        range = tools.horizontalSpaceRange();
        results.push(this.editor.setTextInBufferRange(range, ' '));
      }
      return results;
    };

    Emacs.prototype.killRegion = function() {
      var maintainClipboard;
      this.globalEmacsState.thisCommand = KILL_COMMAND;
      maintainClipboard = false;
      return this.killSelectedText(function(selection) {
        if (!selection.isEmpty()) {
          selection.cut(maintainClipboard, false);
        }
        return maintainClipboard = true;
      });
    };

    Emacs.prototype.killWholeLine = function() {
      var maintainClipboard;
      this.globalEmacsState.thisCommand = KILL_COMMAND;
      maintainClipboard = false;
      return this.killSelectedText(function(selection) {
        selection.clear();
        selection.selectLine();
        selection.cut(maintainClipboard, true);
        return maintainClipboard = true;
      });
    };

    Emacs.prototype.killLine = function(event) {
      var maintainClipboard;
      this.globalEmacsState.thisCommand = KILL_COMMAND;
      maintainClipboard = false;
      return this.killSelectedText(function(selection) {
        if (selection.isEmpty()) {
          selection.selectToEndOfLine();
        }
        if (selection.isEmpty()) {
          selection.selectRight();
        }
        selection.cut(maintainClipboard, false);
        return maintainClipboard = true;
      });
    };

    Emacs.prototype.killWord = function() {
      var maintainClipboard;
      this.globalEmacsState.thisCommand = KILL_COMMAND;
      maintainClipboard = false;
      return this.killSelectedText(function(selection) {
        if (selection.isEmpty()) {
          selection.selectToEndOfWord();
        }
        if (!selection.isEmpty()) {
          selection.cut(maintainClipboard);
        }
        return maintainClipboard = true;
      });
    };

    Emacs.prototype.openLine = function() {
      this.editor.insertNewline();
      return this.editor.moveUp();
    };

    Emacs.prototype.recenterTopBottom = function() {
      var c, maxOffset, maxRow, minOffset, minRow;
      minRow = Math.min.apply(Math, (function() {
        var i, len, ref1, results;
        ref1 = this.editor.getCursors();
        results = [];
        for (i = 0, len = ref1.length; i < len; i++) {
          c = ref1[i];
          results.push(c.getBufferRow());
        }
        return results;
      }).call(this));
      maxRow = Math.max.apply(Math, (function() {
        var i, len, ref1, results;
        ref1 = this.editor.getCursors();
        results = [];
        for (i = 0, len = ref1.length; i < len; i++) {
          c = ref1[i];
          results.push(c.getBufferRow());
        }
        return results;
      }).call(this));
      minOffset = this.editorElement.pixelPositionForBufferPosition([minRow, 0]);
      maxOffset = this.editorElement.pixelPositionForBufferPosition([maxRow, 0]);
      return this.editorElement.setScrollTop((minOffset.top + maxOffset.top - this.editorElement.getHeight()) / 2);
    };

    Emacs.prototype.setMark = function() {
      return this.mark.activate();
    };

    Emacs.prototype.transposeLines = function() {
      var cursor, row;
      cursor = this.editor.getLastCursor();
      row = cursor.getBufferRow();
      return this.editor.transact((function(_this) {
        return function() {
          var text, tools;
          tools = new CursorTools(cursor);
          if (row === 0) {
            tools.endLineIfNecessary();
            cursor.moveDown();
            row += 1;
          }
          tools.endLineIfNecessary();
          text = _this.editor.getTextInBufferRange([[row, 0], [row + 1, 0]]);
          _this.editor.deleteLine(row);
          return _this.editor.setTextInBufferRange([[row - 1, 0], [row - 1, 0]], text);
        };
      })(this));
    };

    Emacs.prototype.transposeWords = function() {
      return this.editor.transact((function(_this) {
        return function() {
          var cursor, cursorTools, i, len, ref1, results, word1, word1Pos, word2, word2Pos;
          ref1 = _this.editor.getCursors();
          results = [];
          for (i = 0, len = ref1.length; i < len; i++) {
            cursor = ref1[i];
            cursorTools = new CursorTools(cursor);
            cursorTools.skipNonWordCharactersBackward();
            word1 = cursorTools.extractWord();
            word1Pos = cursor.getBufferPosition();
            cursorTools.skipNonWordCharactersForward();
            if (_this.editor.getEofBufferPosition().isEqual(cursor.getBufferPosition())) {
              _this.editor.setTextInBufferRange([word1Pos, word1Pos], word1);
              cursorTools.skipNonWordCharactersBackward();
            } else {
              word2 = cursorTools.extractWord();
              word2Pos = cursor.getBufferPosition();
              _this.editor.setTextInBufferRange([word2Pos, word2Pos], word1);
              _this.editor.setTextInBufferRange([word1Pos, word1Pos], word2);
            }
            results.push(cursor.setBufferPosition(cursor.getBufferPosition()));
          }
          return results;
        };
      })(this));
    };

    Emacs.prototype.killSelectedText = function(fn, reversed) {
      var copyMethods, i, j, len, len1, originalCopy, ref1, ref2, selection;
      if (reversed == null) {
        reversed = false;
      }
      if (this.globalEmacsState.lastCommand !== KILL_COMMAND) {
        return this.editor.mutateSelectedText(fn);
      }
      copyMethods = new WeakMap;
      ref1 = this.editor.getSelections();
      for (i = 0, len = ref1.length; i < len; i++) {
        selection = ref1[i];
        copyMethods.set(selection, selection.copy);
        selection.copy = appendCopy.bind(selection, reversed);
      }
      this.editor.mutateSelectedText(fn);
      ref2 = this.editor.getSelections();
      for (j = 0, len1 = ref2.length; j < len1; j++) {
        selection = ref2[j];
        originalCopy = copyMethods.get(selection);
        if (originalCopy) {
          selection.copy = originalCopy;
        }
      }
    };

    return Emacs;

  })();

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL2hvbWUvamFrZS8uYXRvbS9wYWNrYWdlcy9lbWFjcy1wbHVzL2xpYi9lbWFjcy5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFBQSxNQUFBLDZFQUFBO0lBQUE7O0VBQUEsQ0FBQSxHQUFJLE9BQUEsQ0FBUSxpQkFBUjs7RUFDSixNQUFvQyxPQUFBLENBQVEsTUFBUixDQUFwQyxFQUFDLDZDQUFELEVBQXNCOztFQUN0QixJQUFBLEdBQU8sT0FBQSxDQUFRLFFBQVI7O0VBQ1AsV0FBQSxHQUFjLE9BQUEsQ0FBUSxnQkFBUjs7RUFDYixhQUFjLE9BQUEsQ0FBUSxhQUFSOztFQUVmLE1BQU0sQ0FBQyxPQUFQLEdBQ007QUFDSixRQUFBOztJQUFBLFlBQUEsR0FBZTs7b0JBRWYsU0FBQSxHQUFXOztJQUVFLGVBQUMsTUFBRCxFQUFVLGdCQUFWO01BQUMsSUFBQyxDQUFBLFNBQUQ7TUFBUyxJQUFDLENBQUEsbUJBQUQ7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O01BQ3JCLElBQUMsQ0FBQSxhQUFELEdBQWlCLElBQUksQ0FBQyxLQUFLLENBQUMsT0FBWCxDQUFtQixJQUFDLENBQUEsTUFBcEI7TUFDakIsSUFBQyxDQUFBLElBQUQsR0FBUSxJQUFJLEVBQUMsR0FBRCxFQUFKLENBQVMsSUFBQyxDQUFBLE1BQVY7TUFDUixJQUFDLENBQUEsYUFBRCxHQUFpQixJQUFJO01BQ3JCLElBQUMsQ0FBQSxhQUFhLENBQUMsR0FBZixDQUFtQixJQUFDLENBQUEsUUFBRCxDQUFBLENBQW5CO01BQ0EsSUFBQyxDQUFBLGFBQWEsQ0FBQyxHQUFmLENBQW1CLElBQUMsQ0FBQSxNQUFNLENBQUMsWUFBUixDQUFxQixJQUFDLENBQUEsT0FBdEIsQ0FBbkI7TUFHQSxJQUFDLENBQUEsYUFBYSxDQUFDLEdBQWYsQ0FBbUIsSUFBQyxDQUFBLE1BQU0sQ0FBQyxlQUFSLENBQXlCLENBQUEsU0FBQSxLQUFBO2VBQUEsU0FBQTtp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RCxFQVJGOzt5QkFTQSxNQUFNLENBQUMsaUJBQVAsQ0FBeUIsTUFBTSxDQUFDLGlCQUFQLENBQUEsQ0FBekI7QUFoQkY7O1FBRGU7TUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBLENBQWpCO0lBRGM7O29CQXFCaEIsZ0JBQUEsR0FBa0IsU0FBQyxFQUFELEVBQUssUUFBTDtBQUNoQixVQUFBOztRQURxQixXQUFXOztNQUNoQyxJQUFHLElBQUMsQ0FBQSxnQkFBZ0IsQ0FBQyxXQUFsQixLQUFtQyxZQUF0QztBQUNFLGVBQU8sSUFBQyxDQUFBLE1BQU0sQ0FBQyxrQkFBUixDQUEyQixFQUEzQixFQURUOztNQUdBLFdBQUEsR0FBYyxJQUFJO0FBQ2xCO0FBQUEsV0FBQSxzQ0FBQTs7UUFDRSxXQUFXLENBQUMsR0FBWixDQUFnQixTQUFoQixFQUEyQixTQUFTLENBQUMsSUFBckM7UUFDQSxTQUFTLENBQUMsSUFBVixHQUFpQixVQUFVLENBQUMsSUFBWCxDQUFnQixTQUFoQixFQUEyQixRQUEzQjtBQUZuQjtNQUlBLElBQUMsQ0FBQSxNQUFNLENBQUMsa0JBQVIsQ0FBMkIsRUFBM0I7QUFFQTtBQUFBLFdBQUEsd0NBQUE7O1FBQ0UsWUFBQSxHQUFlLFdBQVcsQ0FBQyxHQUFaLENBQWdCLFNBQWhCO1FBQ2YsSUFBaUMsWUFBakM7VUFBQSxTQUFTLENBQUMsSUFBVixHQUFpQixhQUFqQjs7QUFGRjtJQVhnQjs7Ozs7QUF2TXBCIiwic291cmNlc0NvbnRlbnQiOlsiXyA9IHJlcXVpcmUgJ3VuZGVyc2NvcmUtcGx1cydcbntDb21wb3NpdGVEaXNwb3NhYmxlLCBEaXNwb3NhYmxlfSA9IHJlcXVpcmUgJ2F0b20nXG5NYXJrID0gcmVxdWlyZSAnLi9tYXJrJ1xuQ3Vyc29yVG9vbHMgPSByZXF1aXJlICcuL2N1cnNvci10b29scydcbnthcHBlbmRDb3B5fSA9IHJlcXVpcmUgJy4vc2VsZWN0aW9uJ1xuXG5tb2R1bGUuZXhwb3J0cyA9XG5jbGFzcyBFbWFjc1xuICBLSUxMX0NPTU1BTkQgPSAnZW1hY3MtcGx1czpraWxsLXJlZ2lvbidcblxuICBkZXN0cm95ZWQ6IGZhbHNlXG5cbiAgY29uc3RydWN0b3I6IChAZWRpdG9yLCBAZ2xvYmFsRW1hY3NTdGF0ZSkgLT5cbiAgICBAZWRpdG9yRWxlbWVudCA9IGF0b20udmlld3MuZ2V0VmlldyhAZWRpdG9yKVxuICAgIEBtYXJrID0gTWFyay5mb3IoQGVkaXRvcilcbiAgICBAc3Vic2NyaXB0aW9ucyA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlXG4gICAgQHN1YnNjcmlwdGlvbnMuYWRkKEBhZGRDbGFzcygpKVxuICAgIEBzdWJzY3JpcHRpb25zLmFkZChAZWRpdG9yLm9uRGlkRGVzdHJveShAZGVzdHJveSkpXG5cbiAgICAjIG5lZWQgZm9yIGtpbGwtcmVnaW9uXG4gICAgQHN1YnNjcmlwdGlvbnMuYWRkKEBlZGl0b3Iub25EaWRJbnNlcnRUZXh0KCA9PlxuICAgICAgQGdsb2JhbEVtYWNzU3RhdGUubG9nQ29tbWFuZCh0eXBlOiAnZWRpdG9yOmRpZEluc2VydFRleHQnKVxuICAgICkpXG5cbiAgICBAcmVnaXN0ZXJDb21tYW5kcygpXG5cbiAgZGVzdHJveTogPT5cbiAgICByZXR1cm4gaWYgQGRlc3Ryb3llZFxuICAgIEBkZXN0cm95ZWQgPSB0cnVlXG4gICAgQHN1YnNjcmlwdGlvbnMuZGlzcG9zZSgpXG4gICAgQHN1YnNjcmlwdGlvbnMgPSBudWxsXG4gICAgQG1hcms/LmRlc3Ryb3koKVxuICAgIEBtYXJrID0gbnVsbFxuICAgIEBlZGl0b3IgPSBudWxsXG4gICAgQGVkaXRvckVsZW1lbnQgPSBudWxsXG5cbiAgcmVnaXN0ZXJDb21tYW5kczogLT5cbiAgICBAc3Vic2NyaXB0aW9ucy5hZGQgYXRvbS5jb21tYW5kcy5hZGQgQGVkaXRvckVsZW1lbnQsXG4gICAgICAnZW1hY3MtcGx1czphcHBlbmQtbmV4dC1raWxsJzogQGFwcGVuZE5leHRLaWxsXG4gICAgICAnZW1hY3MtcGx1czpiYWNrd2FyZC1raWxsLXdvcmQnOiBAYmFja3dhcmRLaWxsV29yZFxuICAgICAgJ2VtYWNzLXBsdXM6Y2FwaXRhbGl6ZS13b3JkJzogQGNhcGl0YWxpemVXb3JkXG4gICAgICAnZW1hY3MtcGx1czpjb3B5JzogQGNvcHlcbiAgICAgICdlbWFjcy1wbHVzOmRlbGV0ZS1ob3Jpem9udGFsLXNwYWNlJzogQGRlbGV0ZUhvcml6b250YWxTcGFjZVxuICAgICAgJ2VtYWNzLXBsdXM6ZGVsZXRlLWluZGVudGF0aW9uJzogQGRlbGV0ZUluZGVudGF0aW9uXG4gICAgICAnZW1hY3MtcGx1czpleGNoYW5nZS1wb2ludC1hbmQtbWFyayc6IEBleGNoYW5nZVBvaW50QW5kTWFya1xuICAgICAgJ2VtYWNzLXBsdXM6anVzdC1vbmUtc3BhY2UnOiBAanVzdE9uZVNwYWNlXG4gICAgICAnZW1hY3MtcGx1czpraWxsLWxpbmUnOiBAa2lsbExpbmVcbiAgICAgICdlbWFjcy1wbHVzOmtpbGwtcmVnaW9uJzogQGtpbGxSZWdpb25cbiAgICAgICdlbWFjcy1wbHVzOmtpbGwtd2hvbGUtbGluZSc6IEBraWxsV2hvbGVMaW5lXG4gICAgICAnZW1hY3MtcGx1czpraWxsLXdvcmQnOiBAa2lsbFdvcmRcbiAgICAgICdlbWFjcy1wbHVzOm9wZW4tbGluZSc6IEBvcGVuTGluZVxuICAgICAgJ2VtYWNzLXBsdXM6cmVjZW50ZXItdG9wLWJvdHRvbSc6IEByZWNlbnRlclRvcEJvdHRvbVxuICAgICAgJ2VtYWNzLXBsdXM6c2V0LW1hcmsnOiBAc2V0TWFya1xuICAgICAgJ2VtYWNzLXBsdXM6dHJhbnNwb3NlLWxpbmVzJzogQHRyYW5zcG9zZUxpbmVzXG4gICAgICAnZW1hY3MtcGx1czp0cmFuc3Bvc2Utd29yZHMnOiBAdHJhbnNwb3NlV29yZHNcbiAgICAgICdlbWFjcy1wbHVzOmNsb3NlLW90aGVyLXBhbmVzJzogQGNsb3NlT3RoZXJQYW5lc1xuICAgICAgJ2NvcmU6Y2FuY2VsJzogQGRlYWN0aXZhdGVDdXJzb3JzXG5cbiAgYWRkQ2xhc3M6IC0+XG4gICAgY2xhc3NOYW1lID0gJ2VtYWNzLXBsdXMnXG4gICAgQGVkaXRvckVsZW1lbnQuY2xhc3NMaXN0LmFkZChjbGFzc05hbWUpXG4gICAgbmV3IERpc3Bvc2FibGUgPT5cbiAgICAgIEBlZGl0b3JFbGVtZW50LmNsYXNzTGlzdC5yZW1vdmUoY2xhc3NOYW1lKSBpZiBAZWRpdG9yLmlzQWxpdmUoKVxuXG4gIGFwcGVuZE5leHRLaWxsOiA9PlxuICAgIEBnbG9iYWxFbWFjc1N0YXRlLnRoaXNDb21tYW5kID0gS0lMTF9DT01NQU5EXG4gICAgYXRvbS5ub3RpZmljYXRpb25zLmFkZEluZm8oJ0lmIGEgbmV4dCBjb21tYW5kIGlzIGEga2lsbCwgaXQgd2lsbCBhcHBlbmQnKVxuXG4gIGJhY2t3YXJkS2lsbFdvcmQ6ID0+XG4gICAgQGdsb2JhbEVtYWNzU3RhdGUudGhpc0NvbW1hbmQgPSBLSUxMX0NPTU1BTkRcbiAgICBtYWludGFpbkNsaXBib2FyZCA9IGZhbHNlXG4gICAgQGtpbGxTZWxlY3RlZFRleHQoKHNlbGVjdGlvbikgLT5cbiAgICAgIHNlbGVjdGlvbi5zZWxlY3RUb0JlZ2lubmluZ09mV29yZCgpIGlmIHNlbGVjdGlvbi5pc0VtcHR5KClcbiAgICAgIHNlbGVjdGlvbi5jdXQobWFpbnRhaW5DbGlwYm9hcmQpIHVubGVzcyBzZWxlY3Rpb24uaXNFbXB0eSgpXG4gICAgICBtYWludGFpbkNsaXBib2FyZCA9IHRydWVcbiAgICAsIHRydWUpXG5cbiAgY2FwaXRhbGl6ZVdvcmQ6ID0+XG4gICAgQGVkaXRvci5yZXBsYWNlU2VsZWN0ZWRUZXh0IHNlbGVjdFdvcmRJZkVtcHR5OiB0cnVlLCAodGV4dCkgLT5cbiAgICAgIF8uY2FwaXRhbGl6ZSh0ZXh0KVxuXG4gIGNvcHk6ID0+XG4gICAgQGVkaXRvci5jb3B5U2VsZWN0ZWRUZXh0KClcbiAgICBAZGVhY3RpdmF0ZUN1cnNvcnMoKVxuXG4gIGRlYWN0aXZhdGVDdXJzb3JzOiA9PlxuICAgIEBtYXJrLmRlYWN0aXZhdGUoKVxuXG4gIGRlbGV0ZUhvcml6b250YWxTcGFjZTogPT5cbiAgICBmb3IgY3Vyc29yIGluIEBlZGl0b3IuZ2V0Q3Vyc29ycygpXG4gICAgICB0b29scyA9IG5ldyBDdXJzb3JUb29scyhjdXJzb3IpXG4gICAgICByYW5nZSA9IHRvb2xzLmhvcml6b250YWxTcGFjZVJhbmdlKClcbiAgICAgIEBlZGl0b3Iuc2V0VGV4dEluQnVmZmVyUmFuZ2UocmFuZ2UsICcnKVxuXG4gIGRlbGV0ZUluZGVudGF0aW9uOiA9PlxuICAgIEBlZGl0b3IudHJhbnNhY3QgPT5cbiAgICAgIEBlZGl0b3IubW92ZVVwKClcbiAgICAgIEBlZGl0b3Iuam9pbkxpbmVzKClcblxuICBjbG9zZU90aGVyUGFuZXM6IC0+XG4gICAgYWN0aXZlUGFuZSA9IGF0b20ud29ya3NwYWNlLmdldEFjdGl2ZVBhbmUoKVxuICAgIHJldHVybiB1bmxlc3MgYWN0aXZlUGFuZVxuICAgIGZvciBwYW5lIGluIGF0b20ud29ya3NwYWNlLmdldFBhbmVzKClcbiAgICAgIHBhbmUuY2xvc2UoKSBpZiBwYW5lIGlzbnQgYWN0aXZlUGFuZVxuXG4gIGV4Y2hhbmdlUG9pbnRBbmRNYXJrOiA9PlxuICAgIEBtYXJrLmV4Y2hhbmdlKClcblxuICBqdXN0T25lU3BhY2U6ID0+XG4gICAgZm9yIGN1cnNvciBpbiBAZWRpdG9yLmdldEN1cnNvcnMoKVxuICAgICAgdG9vbHMgPSBuZXcgQ3Vyc29yVG9vbHMoY3Vyc29yKVxuICAgICAgcmFuZ2UgPSB0b29scy5ob3Jpem9udGFsU3BhY2VSYW5nZSgpXG4gICAgICBAZWRpdG9yLnNldFRleHRJbkJ1ZmZlclJhbmdlKHJhbmdlLCAnICcpXG5cbiAga2lsbFJlZ2lvbjogPT5cbiAgICBAZ2xvYmFsRW1hY3NTdGF0ZS50aGlzQ29tbWFuZCA9IEtJTExfQ09NTUFORFxuICAgIG1haW50YWluQ2xpcGJvYXJkID0gZmFsc2VcbiAgICBAa2lsbFNlbGVjdGVkVGV4dCAoc2VsZWN0aW9uKSAtPlxuICAgICAgc2VsZWN0aW9uLmN1dChtYWludGFpbkNsaXBib2FyZCwgZmFsc2UpIHVubGVzcyBzZWxlY3Rpb24uaXNFbXB0eSgpXG4gICAgICBtYWludGFpbkNsaXBib2FyZCA9IHRydWVcblxuICBraWxsV2hvbGVMaW5lOiA9PlxuICAgIEBnbG9iYWxFbWFjc1N0YXRlLnRoaXNDb21tYW5kID0gS0lMTF9DT01NQU5EXG4gICAgbWFpbnRhaW5DbGlwYm9hcmQgPSBmYWxzZVxuICAgIEBraWxsU2VsZWN0ZWRUZXh0IChzZWxlY3Rpb24pIC0+XG4gICAgICBzZWxlY3Rpb24uY2xlYXIoKVxuICAgICAgc2VsZWN0aW9uLnNlbGVjdExpbmUoKVxuICAgICAgc2VsZWN0aW9uLmN1dChtYWludGFpbkNsaXBib2FyZCwgdHJ1ZSlcbiAgICAgIG1haW50YWluQ2xpcGJvYXJkID0gdHJ1ZVxuXG4gIGtpbGxMaW5lOiAoZXZlbnQpID0+XG4gICAgQGdsb2JhbEVtYWNzU3RhdGUudGhpc0NvbW1hbmQgPSBLSUxMX0NPTU1BTkRcbiAgICBtYWludGFpbkNsaXBib2FyZCA9IGZhbHNlXG4gICAgQGtpbGxTZWxlY3RlZFRleHQgKHNlbGVjdGlvbikgLT5cbiAgICAgIHNlbGVjdGlvbi5zZWxlY3RUb0VuZE9mTGluZSgpIGlmIHNlbGVjdGlvbi5pc0VtcHR5KClcbiAgICAgIGlmIHNlbGVjdGlvbi5pc0VtcHR5KClcbiAgICAgICAgc2VsZWN0aW9uLnNlbGVjdFJpZ2h0KClcbiAgICAgIHNlbGVjdGlvbi5jdXQobWFpbnRhaW5DbGlwYm9hcmQsIGZhbHNlKVxuICAgICAgbWFpbnRhaW5DbGlwYm9hcmQgPSB0cnVlXG5cbiAga2lsbFdvcmQ6ID0+XG4gICAgQGdsb2JhbEVtYWNzU3RhdGUudGhpc0NvbW1hbmQgPSBLSUxMX0NPTU1BTkRcbiAgICBtYWludGFpbkNsaXBib2FyZCA9IGZhbHNlXG4gICAgQGtpbGxTZWxlY3RlZFRleHQgKHNlbGVjdGlvbikgLT5cbiAgICAgIHNlbGVjdGlvbi5zZWxlY3RUb0VuZE9mV29yZCgpIGlmIHNlbGVjdGlvbi5pc0VtcHR5KClcbiAgICAgIHNlbGVjdGlvbi5jdXQobWFpbnRhaW5DbGlwYm9hcmQpIHVubGVzcyBzZWxlY3Rpb24uaXNFbXB0eSgpXG4gICAgICBtYWludGFpbkNsaXBib2FyZCA9IHRydWVcblxuICBvcGVuTGluZTogPT5cbiAgICBAZWRpdG9yLmluc2VydE5ld2xpbmUoKVxuICAgIEBlZGl0b3IubW92ZVVwKClcblxuICByZWNlbnRlclRvcEJvdHRvbTogPT5cbiAgICBtaW5Sb3cgPSBNYXRoLm1pbigoYy5nZXRCdWZmZXJSb3coKSBmb3IgYyBpbiBAZWRpdG9yLmdldEN1cnNvcnMoKSkuLi4pXG4gICAgbWF4Um93ID0gTWF0aC5tYXgoKGMuZ2V0QnVmZmVyUm93KCkgZm9yIGMgaW4gQGVkaXRvci5nZXRDdXJzb3JzKCkpLi4uKVxuICAgIG1pbk9mZnNldCA9IEBlZGl0b3JFbGVtZW50LnBpeGVsUG9zaXRpb25Gb3JCdWZmZXJQb3NpdGlvbihbbWluUm93LCAwXSlcbiAgICBtYXhPZmZzZXQgPSBAZWRpdG9yRWxlbWVudC5waXhlbFBvc2l0aW9uRm9yQnVmZmVyUG9zaXRpb24oW21heFJvdywgMF0pXG4gICAgQGVkaXRvckVsZW1lbnQuc2V0U2Nyb2xsVG9wKChtaW5PZmZzZXQudG9wICsgbWF4T2Zmc2V0LnRvcCAtIEBlZGl0b3JFbGVtZW50LmdldEhlaWdodCgpKS8yKVxuXG4gIHNldE1hcms6ID0+XG4gICAgQG1hcmsuYWN0aXZhdGUoKVxuXG4gIHRyYW5zcG9zZUxpbmVzOiA9PlxuICAgIGN1cnNvciA9IEBlZGl0b3IuZ2V0TGFzdEN1cnNvcigpXG4gICAgcm93ID0gY3Vyc29yLmdldEJ1ZmZlclJvdygpXG5cbiAgICBAZWRpdG9yLnRyYW5zYWN0ID0+XG4gICAgICB0b29scyA9IG5ldyBDdXJzb3JUb29scyhjdXJzb3IpXG4gICAgICBpZiByb3cgPT0gMFxuICAgICAgICB0b29scy5lbmRMaW5lSWZOZWNlc3NhcnkoKVxuICAgICAgICBjdXJzb3IubW92ZURvd24oKVxuICAgICAgICByb3cgKz0gMVxuICAgICAgdG9vbHMuZW5kTGluZUlmTmVjZXNzYXJ5KClcblxuICAgICAgdGV4dCA9IEBlZGl0b3IuZ2V0VGV4dEluQnVmZmVyUmFuZ2UoW1tyb3csIDBdLCBbcm93ICsgMSwgMF1dKVxuICAgICAgQGVkaXRvci5kZWxldGVMaW5lKHJvdylcbiAgICAgIEBlZGl0b3Iuc2V0VGV4dEluQnVmZmVyUmFuZ2UoW1tyb3cgLSAxLCAwXSwgW3JvdyAtIDEsIDBdXSwgdGV4dClcblxuICB0cmFuc3Bvc2VXb3JkczogPT5cbiAgICBAZWRpdG9yLnRyYW5zYWN0ID0+XG4gICAgICBmb3IgY3Vyc29yIGluIEBlZGl0b3IuZ2V0Q3Vyc29ycygpXG4gICAgICAgIGN1cnNvclRvb2xzID0gbmV3IEN1cnNvclRvb2xzKGN1cnNvcilcbiAgICAgICAgY3Vyc29yVG9vbHMuc2tpcE5vbldvcmRDaGFyYWN0ZXJzQmFja3dhcmQoKVxuXG4gICAgICAgIHdvcmQxID0gY3Vyc29yVG9vbHMuZXh0cmFjdFdvcmQoKVxuICAgICAgICB3b3JkMVBvcyA9IGN1cnNvci5nZXRCdWZmZXJQb3NpdGlvbigpXG4gICAgICAgIGN1cnNvclRvb2xzLnNraXBOb25Xb3JkQ2hhcmFjdGVyc0ZvcndhcmQoKVxuICAgICAgICBpZiBAZWRpdG9yLmdldEVvZkJ1ZmZlclBvc2l0aW9uKCkuaXNFcXVhbChjdXJzb3IuZ2V0QnVmZmVyUG9zaXRpb24oKSlcbiAgICAgICAgICAjIE5vIHNlY29uZCB3b3JkIC0gcHV0IHRoZSBmaXJzdCB3b3JkIGJhY2suXG4gICAgICAgICAgQGVkaXRvci5zZXRUZXh0SW5CdWZmZXJSYW5nZShbd29yZDFQb3MsIHdvcmQxUG9zXSwgd29yZDEpXG4gICAgICAgICAgY3Vyc29yVG9vbHMuc2tpcE5vbldvcmRDaGFyYWN0ZXJzQmFja3dhcmQoKVxuICAgICAgICBlbHNlXG4gICAgICAgICAgd29yZDIgPSBjdXJzb3JUb29scy5leHRyYWN0V29yZCgpXG4gICAgICAgICAgd29yZDJQb3MgPSBjdXJzb3IuZ2V0QnVmZmVyUG9zaXRpb24oKVxuICAgICAgICAgIEBlZGl0b3Iuc2V0VGV4dEluQnVmZmVyUmFuZ2UoW3dvcmQyUG9zLCB3b3JkMlBvc10sIHdvcmQxKVxuICAgICAgICAgIEBlZGl0b3Iuc2V0VGV4dEluQnVmZmVyUmFuZ2UoW3dvcmQxUG9zLCB3b3JkMVBvc10sIHdvcmQyKVxuICAgICAgICBjdXJzb3Iuc2V0QnVmZmVyUG9zaXRpb24oY3Vyc29yLmdldEJ1ZmZlclBvc2l0aW9uKCkpXG5cbiAgIyBwcml2YXRlXG4gIGtpbGxTZWxlY3RlZFRleHQ6IChmbiwgcmV2ZXJzZWQgPSBmYWxzZSkgLT5cbiAgICBpZiBAZ2xvYmFsRW1hY3NTdGF0ZS5sYXN0Q29tbWFuZCBpc250IEtJTExfQ09NTUFORFxuICAgICAgcmV0dXJuIEBlZGl0b3IubXV0YXRlU2VsZWN0ZWRUZXh0KGZuKVxuXG4gICAgY29weU1ldGhvZHMgPSBuZXcgV2Vha01hcFxuICAgIGZvciBzZWxlY3Rpb24gaW4gQGVkaXRvci5nZXRTZWxlY3Rpb25zKClcbiAgICAgIGNvcHlNZXRob2RzLnNldChzZWxlY3Rpb24sIHNlbGVjdGlvbi5jb3B5KVxuICAgICAgc2VsZWN0aW9uLmNvcHkgPSBhcHBlbmRDb3B5LmJpbmQoc2VsZWN0aW9uLCByZXZlcnNlZClcblxuICAgIEBlZGl0b3IubXV0YXRlU2VsZWN0ZWRUZXh0KGZuKVxuXG4gICAgZm9yIHNlbGVjdGlvbiBpbiBAZWRpdG9yLmdldFNlbGVjdGlvbnMoKVxuICAgICAgb3JpZ2luYWxDb3B5ID0gY29weU1ldGhvZHMuZ2V0KHNlbGVjdGlvbilcbiAgICAgIHNlbGVjdGlvbi5jb3B5ID0gb3JpZ2luYWxDb3B5IGlmIG9yaWdpbmFsQ29weVxuXG4gICAgcmV0dXJuXG4iXX0=
