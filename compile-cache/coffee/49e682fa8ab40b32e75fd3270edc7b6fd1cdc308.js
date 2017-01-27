(function() {
  var EmacsCursor, EmacsEditor, KillRing, Mark, State,
    slice = [].slice;

  EmacsCursor = require('./emacs-cursor');

  KillRing = require('./kill-ring');

  Mark = require('./mark');

  State = require('./state');

  module.exports = EmacsEditor = (function() {
    var capitalize, downcase, upcase;

    EmacsEditor["for"] = function(editor) {
      return editor._atomicEmacs != null ? editor._atomicEmacs : editor._atomicEmacs = new EmacsEditor(editor);
    };

    function EmacsEditor(editor1) {
      this.editor = editor1;
      this.disposable = this.editor.onDidRemoveCursor((function(_this) {
        return function() {
          var cursors;
          cursors = _this.editor.getCursors();
          if (cursors.length === 1) {
            return EmacsCursor["for"](cursors[0]).clearLocalKillRing();
          }
        };
      })(this));
    }

    EmacsEditor.prototype.destroy = function() {
      return this.disposable.dispose();
    };

    EmacsEditor.prototype.getEmacsCursors = function() {
      var c, i, len, ref, results;
      ref = this.editor.getCursors();
      results = [];
      for (i = 0, len = ref.length; i < len; i++) {
        c = ref[i];
        results.push(EmacsCursor["for"](c));
      }
      return results;
    };

    EmacsEditor.prototype.moveEmacsCursors = function(callback) {
      return this.editor.moveCursors(function(cursor) {
        if (cursor.destroyed === true) {
          return;
        }
        return callback(EmacsCursor["for"](cursor), cursor);
      });
    };


    /*
    Section: Navigation
     */

    EmacsEditor.prototype.backwardChar = function() {
      return this.editor.moveCursors(function(cursor) {
        return cursor.moveLeft();
      });
    };

    EmacsEditor.prototype.forwardChar = function() {
      return this.editor.moveCursors(function(cursor) {
        return cursor.moveRight();
      });
    };

    EmacsEditor.prototype.backwardWord = function() {
      return this.moveEmacsCursors(function(emacsCursor) {
        emacsCursor.skipNonWordCharactersBackward();
        return emacsCursor.skipWordCharactersBackward();
      });
    };

    EmacsEditor.prototype.forwardWord = function() {
      return this.moveEmacsCursors(function(emacsCursor) {
        emacsCursor.skipNonWordCharactersForward();
        return emacsCursor.skipWordCharactersForward();
      });
    };

    EmacsEditor.prototype.backwardSexp = function() {
      return this.moveEmacsCursors(function(emacsCursor) {
        return emacsCursor.skipSexpBackward();
      });
    };

    EmacsEditor.prototype.forwardSexp = function() {
      return this.moveEmacsCursors(function(emacsCursor) {
        return emacsCursor.skipSexpForward();
      });
    };

    EmacsEditor.prototype.previousLine = function() {
      return this.editor.moveCursors(function(cursor) {
        return cursor.moveUp();
      });
    };

    EmacsEditor.prototype.nextLine = function() {
      return this.editor.moveCursors(function(cursor) {
        return cursor.moveDown();
      });
    };

    EmacsEditor.prototype.backwardParagraph = function() {
      return this.moveEmacsCursors(function(emacsCursor, cursor) {
        var position;
        position = cursor.getBufferPosition();
        if (position.row !== 0) {
          cursor.setBufferPosition([position.row - 1, 0]);
        }
        return emacsCursor.goToMatchStartBackward(/^\s*$/) || cursor.moveToTop();
      });
    };

    EmacsEditor.prototype.forwardParagraph = function() {
      var lastRow;
      lastRow = this.editor.getLastBufferRow();
      return this.moveEmacsCursors(function(emacsCursor, cursor) {
        var position;
        position = cursor.getBufferPosition();
        if (position.row !== lastRow) {
          cursor.setBufferPosition([position.row + 1, 0]);
        }
        return emacsCursor.goToMatchStartForward(/^\s*$/) || cursor.moveToBottom();
      });
    };

    EmacsEditor.prototype.backToIndentation = function() {
      return this.editor.moveCursors((function(_this) {
        return function(cursor) {
          var line, position, targetColumn;
          position = cursor.getBufferPosition();
          line = _this.editor.lineTextForBufferRow(position.row);
          targetColumn = line.search(/\S/);
          if (targetColumn === -1) {
            targetColumn = line.length;
          }
          if (position.column !== targetColumn) {
            return cursor.setBufferPosition([position.row, targetColumn]);
          }
        };
      })(this));
    };


    /*
    Section: Killing & Yanking
     */

    EmacsEditor.prototype.backwardKillWord = function() {
      var kills, method;
      kills = [];
      method = State.killing ? 'prepend' : 'push';
      this.editor.transact((function(_this) {
        return function() {
          return _this.moveEmacsCursors(function(emacsCursor, cursor) {
            return kills.push(emacsCursor.backwardKillWord(method));
          });
        };
      })(this));
      atom.clipboard.write(kills.join("\n"));
      return State.killed();
    };

    EmacsEditor.prototype.killWord = function() {
      var kills, method;
      kills = [];
      method = State.killing ? 'append' : 'push';
      this.editor.transact((function(_this) {
        return function() {
          return _this.moveEmacsCursors(function(emacsCursor) {
            return kills.push(emacsCursor.killWord(method));
          });
        };
      })(this));
      atom.clipboard.write(kills.join("\n"));
      return State.killed();
    };

    EmacsEditor.prototype.killLine = function() {
      var kills, method;
      kills = [];
      method = State.killing ? 'append' : 'push';
      this.editor.transact((function(_this) {
        return function() {
          return _this.moveEmacsCursors(function(emacsCursor) {
            return kills.push(emacsCursor.killLine(method));
          });
        };
      })(this));
      atom.clipboard.write(kills.join("\n"));
      return State.killed();
    };

    EmacsEditor.prototype.killRegion = function() {
      var kills, method;
      kills = [];
      method = State.killing ? 'append' : 'push';
      this.editor.transact((function(_this) {
        return function() {
          return _this.moveEmacsCursors(function(emacsCursor) {
            return kills.push(emacsCursor.killRegion(method));
          });
        };
      })(this));
      atom.clipboard.write(kills.join("\n"));
      return State.killed();
    };

    EmacsEditor.prototype.copyRegionAsKill = function() {
      var kills, method;
      kills = [];
      method = State.killing ? 'append' : 'push';
      this.editor.transact((function(_this) {
        return function() {
          var emacsCursor, i, len, ref, results, selection;
          ref = _this.editor.getSelections();
          results = [];
          for (i = 0, len = ref.length; i < len; i++) {
            selection = ref[i];
            emacsCursor = EmacsCursor["for"](selection.cursor);
            emacsCursor.killRing()[method](selection.getText());
            kills.push(emacsCursor.killRing().getCurrentEntry());
            results.push(emacsCursor.mark().deactivate());
          }
          return results;
        };
      })(this));
      return atom.clipboard.write(kills.join("\n"));
    };

    EmacsEditor.prototype.yank = function() {
      this.editor.transact((function(_this) {
        return function() {
          var emacsCursor, i, len, ref, results;
          ref = _this.getEmacsCursors();
          results = [];
          for (i = 0, len = ref.length; i < len; i++) {
            emacsCursor = ref[i];
            results.push(emacsCursor.yank());
          }
          return results;
        };
      })(this));
      return State.yanked();
    };

    EmacsEditor.prototype.yankPop = function() {
      if (!State.yanking) {
        return;
      }
      this.editor.transact((function(_this) {
        return function() {
          var emacsCursor, i, len, ref, results;
          ref = _this.getEmacsCursors();
          results = [];
          for (i = 0, len = ref.length; i < len; i++) {
            emacsCursor = ref[i];
            results.push(emacsCursor.rotateYank(-1));
          }
          return results;
        };
      })(this));
      return State.yanked();
    };

    EmacsEditor.prototype.yankShift = function() {
      if (!State.yanking) {
        return;
      }
      this.editor.transact((function(_this) {
        return function() {
          var emacsCursor, i, len, ref, results;
          ref = _this.getEmacsCursors();
          results = [];
          for (i = 0, len = ref.length; i < len; i++) {
            emacsCursor = ref[i];
            results.push(emacsCursor.rotateYank(1));
          }
          return results;
        };
      })(this));
      return State.yanked();
    };


    /*
    Section: Editing
     */

    EmacsEditor.prototype.deleteHorizontalSpace = function() {
      return this.editor.transact((function(_this) {
        return function() {
          return _this.moveEmacsCursors(function(emacsCursor) {
            var range;
            range = emacsCursor.horizontalSpaceRange();
            return _this.editor.setTextInBufferRange(range, '');
          });
        };
      })(this));
    };

    EmacsEditor.prototype.deleteIndentation = function() {
      if (!this.editor) {
        return;
      }
      return this.editor.transact((function(_this) {
        return function() {
          _this.editor.moveUp();
          return _this.editor.joinLines();
        };
      })(this));
    };

    EmacsEditor.prototype.openLine = function() {
      return this.editor.transact((function(_this) {
        return function() {
          _this.editor.insertText("\n");
          return _this.editor.moveLeft();
        };
      })(this));
    };

    EmacsEditor.prototype.justOneSpace = function() {
      return this.editor.transact((function(_this) {
        return function() {
          var emacsCursor, i, len, range, ref, results;
          ref = _this.getEmacsCursors();
          results = [];
          for (i = 0, len = ref.length; i < len; i++) {
            emacsCursor = ref[i];
            range = emacsCursor.horizontalSpaceRange();
            results.push(_this.editor.setTextInBufferRange(range, ' '));
          }
          return results;
        };
      })(this));
    };

    EmacsEditor.prototype.transposeChars = function() {
      return this.editor.transact((function(_this) {
        return function() {
          return _this.moveEmacsCursors(function(emacsCursor) {
            return emacsCursor.transposeChars();
          });
        };
      })(this));
    };

    EmacsEditor.prototype.transposeWords = function() {
      return this.editor.transact((function(_this) {
        return function() {
          return _this.moveEmacsCursors(function(emacsCursor) {
            return emacsCursor.transposeWords();
          });
        };
      })(this));
    };

    EmacsEditor.prototype.transposeLines = function() {
      return this.editor.transact((function(_this) {
        return function() {
          return _this.moveEmacsCursors(function(emacsCursor) {
            return emacsCursor.transposeLines();
          });
        };
      })(this));
    };

    downcase = function(s) {
      return s.toLowerCase();
    };

    upcase = function(s) {
      return s.toUpperCase();
    };

    capitalize = function(s) {
      return s.slice(0, 1).toUpperCase() + s.slice(1).toLowerCase();
    };

    EmacsEditor.prototype.downcaseWordOrRegion = function() {
      return this._transformWordOrRegion(downcase);
    };

    EmacsEditor.prototype.upcaseWordOrRegion = function() {
      return this._transformWordOrRegion(upcase);
    };

    EmacsEditor.prototype.capitalizeWordOrRegion = function() {
      return this._transformWordOrRegion(capitalize, {
        wordAtATime: true
      });
    };

    EmacsEditor.prototype._transformWordOrRegion = function(transformWord, arg) {
      var wordAtATime;
      wordAtATime = (arg != null ? arg : {}).wordAtATime;
      return this.editor.transact((function(_this) {
        return function() {
          var cursor, i, len, ref;
          if (_this.editor.getSelections().filter(function(s) {
            return !s.isEmpty();
          }).length > 0) {
            return _this.editor.mutateSelectedText(function(selection) {
              var range;
              range = selection.getBufferRange();
              if (wordAtATime) {
                return _this.editor.scanInBufferRange(/\w+/g, range, function(hit) {
                  return hit.replace(transformWord(hit.matchText));
                });
              } else {
                return _this.editor.setTextInBufferRange(range, transformWord(selection.getText()));
              }
            });
          } else {
            ref = _this.editor.getCursors();
            for (i = 0, len = ref.length; i < len; i++) {
              cursor = ref[i];
              cursor.emitter.__track = true;
            }
            return _this.moveEmacsCursors(function(emacsCursor) {
              return emacsCursor.transformWord(transformWord);
            });
          }
        };
      })(this));
    };


    /*
    Section: Marking & Selecting
     */

    EmacsEditor.prototype.setMark = function() {
      var emacsCursor, i, len, ref, results;
      ref = this.getEmacsCursors();
      results = [];
      for (i = 0, len = ref.length; i < len; i++) {
        emacsCursor = ref[i];
        results.push(emacsCursor.mark().set().activate());
      }
      return results;
    };

    EmacsEditor.prototype.markSexp = function() {
      return this.moveEmacsCursors(function(emacsCursor) {
        return emacsCursor.markSexp();
      });
    };

    EmacsEditor.prototype.markWholeBuffer = function() {
      var c, emacsCursor, first, i, len, ref, rest;
      ref = this.editor.getCursors(), first = ref[0], rest = 2 <= ref.length ? slice.call(ref, 1) : [];
      for (i = 0, len = rest.length; i < len; i++) {
        c = rest[i];
        c.destroy();
      }
      emacsCursor = EmacsCursor["for"](first);
      first.moveToBottom();
      emacsCursor.mark().set().activate();
      return first.moveToTop();
    };

    EmacsEditor.prototype.exchangePointAndMark = function() {
      return this.moveEmacsCursors(function(emacsCursor) {
        return emacsCursor.mark().exchange();
      });
    };


    /*
    Section: UI
     */

    EmacsEditor.prototype.recenterTopBottom = function() {
      var c, editorElement, maxOffset, maxRow, minOffset, minRow;
      if (!this.editor) {
        return;
      }
      editorElement = atom.views.getView(this.editor);
      minRow = Math.min.apply(Math, (function() {
        var i, len, ref, results;
        ref = this.editor.getCursors();
        results = [];
        for (i = 0, len = ref.length; i < len; i++) {
          c = ref[i];
          results.push(c.getBufferRow());
        }
        return results;
      }).call(this));
      maxRow = Math.max.apply(Math, (function() {
        var i, len, ref, results;
        ref = this.editor.getCursors();
        results = [];
        for (i = 0, len = ref.length; i < len; i++) {
          c = ref[i];
          results.push(c.getBufferRow());
        }
        return results;
      }).call(this));
      minOffset = editorElement.pixelPositionForBufferPosition([minRow, 0]);
      maxOffset = editorElement.pixelPositionForBufferPosition([maxRow, 0]);
      switch (State.recenters) {
        case 0:
          this.editor.setScrollTop((minOffset.top + maxOffset.top - this.editor.getHeight()) / 2);
          break;
        case 1:
          this.editor.setScrollTop(minOffset.top - 2 * this.editor.getLineHeightInPixels());
          break;
        case 2:
          this.editor.setScrollTop(maxOffset.top + 3 * this.editor.getLineHeightInPixels() - this.editor.getHeight());
      }
      return State.recentered();
    };

    EmacsEditor.prototype.scrollUp = function() {
      var currentRow, firstRow, lastRow, rowCount, visibleRowRange;
      if ((visibleRowRange = this.editor.getVisibleRowRange())) {
        firstRow = visibleRowRange[0], lastRow = visibleRowRange[1];
        currentRow = this.editor.cursors[0].getBufferRow();
        rowCount = (lastRow - firstRow) - 2;
        return this.editor.moveDown(rowCount);
      }
    };

    EmacsEditor.prototype.scrollDown = function() {
      var currentRow, firstRow, lastRow, rowCount, visibleRowRange;
      if ((visibleRowRange = this.editor.getVisibleRowRange())) {
        firstRow = visibleRowRange[0], lastRow = visibleRowRange[1];
        currentRow = this.editor.cursors[0].getBufferRow();
        rowCount = (lastRow - firstRow) - 2;
        return this.editor.moveUp(rowCount);
      }
    };


    /*
    Section: Other
     */

    EmacsEditor.prototype.keyboardQuit = function() {
      var emacsCursor, i, len, ref, results;
      ref = this.getEmacsCursors();
      results = [];
      for (i = 0, len = ref.length; i < len; i++) {
        emacsCursor = ref[i];
        results.push(emacsCursor.mark().deactivate());
      }
      return results;
    };

    return EmacsEditor;

  })();

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL2hvbWUvamFrZS8uYXRvbS9wYWNrYWdlcy9hdG9taWMtZW1hY3MvbGliL2VtYWNzLWVkaXRvci5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFBQSxNQUFBLCtDQUFBO0lBQUE7O0VBQUEsV0FBQSxHQUFjLE9BQUEsQ0FBUSxnQkFBUjs7RUFDZCxRQUFBLEdBQVcsT0FBQSxDQUFRLGFBQVI7O0VBQ1gsSUFBQSxHQUFPLE9BQUEsQ0FBUSxRQUFSOztFQUNQLEtBQUEsR0FBUSxPQUFBLENBQVEsU0FBUjs7RUFFUixNQUFNLENBQUMsT0FBUCxHQUNNO0FBQ0osUUFBQTs7SUFBQSxXQUFDLEVBQUEsR0FBQSxFQUFELEdBQU0sU0FBQyxNQUFEOzJDQUNKLE1BQU0sQ0FBQyxlQUFQLE1BQU0sQ0FBQyxlQUFvQixJQUFBLFdBQUEsQ0FBWSxNQUFaO0lBRHZCOztJQUdPLHFCQUFDLE9BQUQ7TUFBQyxJQUFDLENBQUEsU0FBRDtNQUNaLElBQUMsQ0FBQSxVQUFELEdBQWMsSUFBQyxDQUFBLE1BQU0sQ0FBQyxpQkFBUixDQUEwQixDQUFBLFNBQUEsS0FBQTtlQUFBLFNBQUE7QUFDdEMsY0FBQTtVQUFBLE9BQUEsR0FBVSxLQUFDLENBQUEsTUFBTSxDQUFDLFVBQVIsQ0FBQTtVQUNWLElBQUcsT0FBTyxDQUFDLE1BQVIsS0FBa0IsQ0FBckI7bUJBQ0UsV0FBVyxFQUFDLEdBQUQsRUFBWCxDQUFnQixPQUFRLENBQUEsQ0FBQSxDQUF4QixDQUEyQixDQUFDLGtCQUE1QixDQUFBLEVBREY7O1FBRnNDO01BQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxDQUExQjtJQURIOzswQkFNYixPQUFBLEdBQVMsU0FBQTthQUNQLElBQUMsQ0FBQSxVQUFVLENBQUMsT0FBWixDQUFBO0lBRE87OzBCQUdULGVBQUEsR0FBaUIsU0FBQTtBQUNmLFVBQUE7QUFBQTtBQUFBO1dBQUEscUNBQUE7O3FCQUFBLFdBQVcsRUFBQyxH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LEdBQWtCLElBQUMsQ0FBQSxNQUFNLENBQUMsa0JBQVIsQ0FBQSxDQUFuQixDQUFIO1FBQ0csNkJBQUQsRUFBVTtRQUNWLFVBQUEsR0FBYSxJQUFDLENBQUEsTUFBTSxDQUFDLE9BQVEsQ0FBQSxDQUFBLENBQUUsQ0FBQyxZQUFuQixDQUFBO1FBQ2IsUUFBQSxHQUFXLENBQUMsT0FBQSxHQUFVLFFBQVgsQ0FBQSxHQUF1QjtlQUNsQyxJQUFDLENBQUEsTUFBTSxDQUFDLFFBQVIsQ0FBaUIsUUFBakIsRUFKRjs7SUFEUTs7MEJBT1YsVUFBQSxHQUFZLFNBQUE7QUFDVixVQUFBO01BQUEsSUFBRyxDQUFDLGVBQUEsR0FBa0IsSUFBQyxDQUFBLE1BQU0sQ0FBQyxrQkFBUixDQUFBLENBQW5CLENBQUg7UUFDRyw2QkFBRCxFQUFVO1FBQ1YsVUFBQSxHQUFhLElBQUMsQ0FBQSxNQUFNLENBQUMsT0FBUSxDQUFBLENBQUEsQ0FBRSxDQUFDLFlBQW5CLENBQUE7UUFDYixRQUFBLEdBQVcsQ0FBQyxPQUFBLEdBQVUsUUFBWCxDQUFBLEdBQXVCO2VBQ2xDLElBQUMsQ0FBQSxNQUFNLENBQUMsTUFBUixDQUFlLFFBQWYsRUFKRjs7SUFEVTs7O0FBT1o7Ozs7MEJBSUEsWUFBQSxHQUFjLFNBQUE7QUFDWixVQUFBO0FBQUE7QUFBQTtXQUFBLHFDQUFBOztxQkFDRSxXQUFXLENBQUMsSUFBWixDQUFBLENBQWtCLENBQUMsVUFBbkIsQ0FBQTtBQURGOztJQURZOzs7OztBQWpUaEIiLCJzb3VyY2VzQ29udGVudCI6WyJFbWFjc0N1cnNvciA9IHJlcXVpcmUgJy4vZW1hY3MtY3Vyc29yJ1xuS2lsbFJpbmcgPSByZXF1aXJlICcuL2tpbGwtcmluZydcbk1hcmsgPSByZXF1aXJlICcuL21hcmsnXG5TdGF0ZSA9IHJlcXVpcmUgJy4vc3RhdGUnXG5cbm1vZHVsZS5leHBvcnRzID1cbmNsYXNzIEVtYWNzRWRpdG9yXG4gIEBmb3I6IChlZGl0b3IpIC0+XG4gICAgZWRpdG9yLl9hdG9taWNFbWFjcyA/PSBuZXcgRW1hY3NFZGl0b3IoZWRpdG9yKVxuXG4gIGNvbnN0cnVjdG9yOiAoQGVkaXRvcikgLT5cbiAgICBAZGlzcG9zYWJsZSA9IEBlZGl0b3Iub25EaWRSZW1vdmVDdXJzb3IgPT5cbiAgICAgIGN1cnNvcnMgPSBAZWRpdG9yLmdldEN1cnNvcnMoKVxuICAgICAgaWYgY3Vyc29ycy5sZW5ndGggPT0gMVxuICAgICAgICBFbWFjc0N1cnNvci5mb3IoY3Vyc29yc1swXSkuY2xlYXJMb2NhbEtpbGxSaW5nKClcblxuICBkZXN0cm95OiAtPlxuICAgIEBkaXNwb3NhYmxlLmRpc3Bvc2UoKVxuXG4gIGdldEVtYWNzQ3Vyc29yczogKCkgLT5cbiAgICBFbWFjc0N1cnNvci5mb3IoYykgZm9yIGMgaW4gQGVkaXRvci5nZXRDdXJzb3JzKClcblxuICBtb3ZlRW1hY3NDdXJzb3JzOiAoY2FsbGJhY2spIC0+XG4gICAgQGVkaXRvci5tb3ZlQ3Vyc29ycyAoY3Vyc29yKSAtPlxuICAgICAgIyBBdG9tIGJ1ZzogaWYgbW92aW5nIG9uZSBjdXJzb3IgZGVzdHJveXMgYW5vdGhlciwgdGhlIGRlc3Ryb3llZCBvbmUnc1xuICAgICAgIyBlbWl0dGVyIGlzIGRpc3Bvc2VkLCBidXQgY3Vyc29yLmlzRGVzdHJveWVkKCkgaXMgc3RpbGwgZmFsc2UuIEhvd2V2ZXJcbiAgICAgICMgY3Vyc29yLmRlc3Ryb3llZCA9PSB0cnVlLiBUZXh0RWRpdG9yLm1vdmVDdXJzb3JzIHByb2JhYmx5IHNob3VsZG4ndCBldmVuXG4gICAgICAjIHlpZWxkIGl0IGluIHRoaXMgY2FzZS5cbiAgICAgIHJldHVybiBpZiBjdXJzb3IuZGVzdHJveWVkID09IHRydWVcbiAgICAgIGNhbGxiYWNrKEVtYWNzQ3Vyc29yLmZvcihjdXJzb3IpLCBjdXJzb3IpXG5cbiAgIyMjXG4gIFNlY3Rpb246IE5hdmlnYXRpb25cbiAgIyMjXG5cbiAgYmFja3dhcmRDaGFyOiAtPlxuICAgIEBlZGl0b3IubW92ZUN1cnNvcnMgKGN1cnNvcikgLT5cbiAgICAgIGN1cnNvci5tb3ZlTGVmdCgpXG5cbiAgZm9yd2FyZENoYXI6IC0+XG4gICAgQGVkaXRvci5tb3ZlQ3Vyc29ycyAoY3Vyc29yKSAtPlxuICAgICAgY3Vyc29yLm1vdmVSaWdodCgpXG5cbiAgYmFja3dhcmRXb3JkOiAtPlxuICAgIEBtb3ZlRW1hY3NDdXJzb3JzIChlbWFjc0N1cnNvcikgLT5cbiAgICAgIGVtYWNzQ3Vyc29yLnNraXBOb25Xb3JkQ2hhcmFjdGVyc0JhY2t3YXJkKClcbiAgICAgIGVtYWNzQ3Vyc29yLnNraXBXb3JkQ2hhcmFjdGVyc0JhY2t3YXJkKClcblxuICBmb3J3YXJkV29yZDogLT5cbiAgICBAbW92ZUVtYWNzQ3Vyc29ycyAoZW1hY3NDdXJzb3IpIC0+XG4gICAgICBlbWFjc0N1cnNvci5za2lwTm9uV29yZENoYXJhY3RlcnNGb3J3YXJkKClcbiAgICAgIGVtYWNzQ3Vyc29yLnNraXBXb3JkQ2hhcmFjdGVyc0ZvcndhcmQoKVxuXG4gIGJhY2t3YXJkU2V4cDogLT5cbiAgICBAbW92ZUVtYWNzQ3Vyc29ycyAoZW1hY3NDdXJzb3IpIC0+XG4gICAgICBlbWFjc0N1cnNvci5za2lwU2V4cEJhY2t3YXJkKClcblxuICBmb3J3YXJkU2V4cDogLT5cbiAgICBAbW92ZUVtYWNzQ3Vyc29ycyAoZW1hY3NDdXJzb3IpIC0+XG4gICAgICBlbWFjc0N1cnNvci5za2lwU2V4cEZvcndhcmQoKVxuXG4gIHByZXZpb3VzTGluZTogLT5cbiAgICBAZWRpdG9yLm1vdmVDdXJzb3JzIChjdXJzb3IpIC0+XG4gICAgICBjdXJzb3IubW92ZVVwKClcblxuICBuZXh0TGluZTogLT5cbiAgICBAZWRpdG9yLm1vdmVDdXJzb3JzIChjdXJzb3IpIC0+XG4gICAgICBjdXJzb3IubW92ZURvd24oKVxuXG4gIGJhY2t3YXJkUGFyYWdyYXBoOiAtPlxuICAgIEBtb3ZlRW1hY3NDdXJzb3JzIChlbWFjc0N1cnNvciwgY3Vyc29yKSAtPlxuICAgICAgcG9zaXRpb24gPSBjdXJzb3IuZ2V0QnVmZmVyUG9zaXRpb24oKVxuICAgICAgdW5sZXNzIHBvc2l0aW9uLnJvdyA9PSAwXG4gICAgICAgIGN1cnNvci5zZXRCdWZmZXJQb3NpdGlvbihbcG9zaXRpb24ucm93IC0gMSwgMF0pXG5cbiAgICAgIGVtYWNzQ3Vyc29yLmdvVG9NYXRjaFN0YXJ0QmFja3dhcmQoL15cXHMqJC8pIG9yXG4gICAgICAgIGN1cnNvci5tb3ZlVG9Ub3AoKVxuXG4gIGZvcndhcmRQYXJhZ3JhcGg6IC0+XG4gICAgbGFzdFJvdyA9IEBlZGl0b3IuZ2V0TGFzdEJ1ZmZlclJvdygpXG4gICAgQG1vdmVFbWFjc0N1cnNvcnMgKGVtYWNzQ3Vyc29yLCBjdXJzb3IpIC0+XG4gICAgICBwb3NpdGlvbiA9IGN1cnNvci5nZXRCdWZmZXJQb3NpdGlvbigpXG4gICAgICB1bmxlc3MgcG9zaXRpb24ucm93ID09IGxhc3RSb3dcbiAgICAgICAgY3Vyc29yLnNldEJ1ZmZlclBvc2l0aW9uKFtwb3NpdGlvbi5yb3cgKyAxLCAwXSlcblxuICAgICAgZW1hY3NDdXJzb3IuZ29Ub01hdGNoU3RhcnRGb3J3YXJkKC9eXFxzKiQvKSBvclxuICAgICAgICBjdXJzb3IubW92ZVRvQm90dG9tKClcblxuICBiYWNrVG9JbmRlbnRhdGlvbjogLT5cbiAgICBAZWRpdG9yLm1vdmVDdXJzb3JzIChjdXJzb3IpID0+XG4gICAgICBwb3NpdGlvbiA9IGN1cnNvci5nZXRCdWZmZXJQb3NpdGlvbigpXG4gICAgICBsaW5lID0gQGVkaXRvci5saW5lVGV4dEZvckJ1ZmZlclJvdyhwb3NpdGlvbi5yb3cpXG4gICAgICB0YXJnZXRDb2x1bW4gPSBsaW5lLnNlYXJjaCgvXFxTLylcbiAgICAgIHRhcmdldENvbHVtbiA9IGxpbmUubGVuZ3RoIGlmIHRhcmdldENvbHVtbiA9PSAtMVxuXG4gICAgICBpZiBwb3NpdGlvbi5jb2x1bW4gIT0gdGFyZ2V0Q29sdW1uXG4gICAgICAgIGN1cnNvci5zZXRCdWZmZXJQb3NpdGlvbihbcG9zaXRpb24ucm93LCB0YXJnZXRDb2x1bW5dKVxuXG4gICMjI1xuICBTZWN0aW9uOiBLaWxsaW5nICYgWWFua2luZ1xuICAjIyNcblxuICBiYWNrd2FyZEtpbGxXb3JkOiAtPlxuICAgIGtpbGxzID0gW11cbiAgICBtZXRob2QgPSBpZiBTdGF0ZS5raWxsaW5nIHRoZW4gJ3ByZXBlbmQnIGVsc2UgJ3B1c2gnXG4gICAgQGVkaXRvci50cmFuc2FjdCA9PlxuICAgICAgQG1vdmVFbWFjc0N1cnNvcnMgKGVtYWNzQ3Vyc29yLCBjdXJzb3IpID0+XG4gICAgICAgIGtpbGxzLnB1c2ggZW1hY3NDdXJzb3IuYmFja3dhcmRLaWxsV29yZChtZXRob2QpXG4gICAgYXRvbS5jbGlwYm9hcmQud3JpdGUoa2lsbHMuam9pbihcIlxcblwiKSlcbiAgICBTdGF0ZS5raWxsZWQoKVxuXG4gIGtpbGxXb3JkOiAtPlxuICAgIGtpbGxzID0gW11cbiAgICBtZXRob2QgPSBpZiBTdGF0ZS5raWxsaW5nIHRoZW4gJ2FwcGVuZCcgZWxzZSAncHVzaCdcbiAgICBAZWRpdG9yLnRyYW5zYWN0ID0+XG4gICAgICBAbW92ZUVtYWNzQ3Vyc29ycyAoZW1hY3NDdXJzb3IpID0+XG4gICAgICAgIGtpbGxzLnB1c2ggZW1hY3NDdXJzb3Iua2lsbFdvcmQobWV0aG9kKVxuICAgIGF0b20uY2xpcGJvYXJkLndyaXRlKGtpbGxzLmpvaW4oXCJcXG5cIikpXG4gICAgU3RhdGUua2lsbGVkKClcblxuICBraWxsTGluZTogLT5cbiAgICBraWxscyA9IFtdXG4gICAgbWV0aG9kID0gaWYgU3RhdGUua2lsbGluZyB0aGVuICdhcHBlbmQnIGVsc2UgJ3B1c2gnXG4gICAgQGVkaXRvci50cmFuc2FjdCA9PlxuICAgICAgQG1vdmVFbWFjc0N1cnNvcnMgKGVtYWNzQ3Vyc29yKSA9PlxuICAgICAgICBraWxscy5wdXNoIGVtYWNzQ3Vyc29yLmtpbGxMaW5lKG1ldGhvZClcbiAgICBhdG9tLmNsaXBib2FyZC53cml0ZShraWxscy5qb2luKFwiXFxuXCIpKVxuICAgIFN0YXRlLmtpbGxlZCgpXG5cbiAga2lsbFJlZ2lvbjogLT5cbiAgICBraWxscyA9IFtdXG4gICAgbWV0aG9kID0gaWYgU3RhdGUua2lsbGluZyB0aGVuICdhcHBlbmQnIGVsc2UgJ3B1c2gnXG4gICAgQGVkaXRvci50cmFuc2FjdCA9PlxuICAgICAgQG1vdmVFbWFjc0N1cnNvcnMgKGVtYWNzQ3Vyc29yKSA9PlxuICAgICAgICBraWxscy5wdXNoIGVtYWNzQ3Vyc29yLmtpbGxSZWdpb24obWV0aG9kKVxuICAgIGF0b20uY2xpcGJvYXJkLndyaXRlKGtpbGxzLmpvaW4oXCJcXG5cIikpXG4gICAgU3RhdGUua2lsbGVkKClcblxuICBjb3B5UmVnaW9uQXNLaWxsOiAtPlxuICAgIGtpbGxzID0gW11cbiAgICBtZXRob2QgPSBpZiBTdGF0ZS5raWxsaW5nIHRoZW4gJ2FwcGVuZCcgZWxzZSAncHVzaCdcbiAgICBAZWRpdG9yLnRyYW5zYWN0ID0+XG4gICAgICBmb3Igc2VsZWN0aW9uIGluIEBlZGl0b3IuZ2V0U2VsZWN0aW9ucygpXG4gICAgICAgIGVtYWNzQ3Vyc29yID0gRW1hY3NDdXJzb3IuZm9yKHNlbGVjdGlvbi5jdXJzb3IpXG4gICAgICAgIGVtYWNzQ3Vyc29yLmtpbGxSaW5nKClbbWV0aG9kXShzZWxlY3Rpb24uZ2V0VGV4dCgpKVxuICAgICAgICBraWxscy5wdXNoIGVtYWNzQ3Vyc29yLmtpbGxSaW5nKCkuZ2V0Q3VycmVudEVudHJ5KClcbiAgICAgICAgZW1hY3NDdXJzb3IubWFyaygpLmRlYWN0aXZhdGUoKVxuICAgIGF0b20uY2xpcGJvYXJkLndyaXRlKGtpbGxzLmpvaW4oXCJcXG5cIikpXG5cbiAgeWFuazogLT5cbiAgICBAZWRpdG9yLnRyYW5zYWN0ID0+XG4gICAgICBmb3IgZW1hY3NDdXJzb3IgaW4gQGdldEVtYWNzQ3Vyc29ycygpXG4gICAgICAgIGVtYWNzQ3Vyc29yLnlhbmsoKVxuICAgIFN0YXRlLnlhbmtlZCgpXG5cbiAgeWFua1BvcDogLT5cbiAgICByZXR1cm4gaWYgbm90IFN0YXRlLnlhbmtpbmdcbiAgICBAZWRpdG9yLnRyYW5zYWN0ID0+XG4gICAgICBmb3IgZW1hY3NDdXJzb3IgaW4gQGdldEVtYWNzQ3Vyc29ycygpXG4gICAgICAgIGVtYWNzQ3Vyc29yLnJvdGF0ZVlhbmsoLTEpXG4gICAgU3RhdGUueWFua2VkKClcblxuICB5YW5rU2hpZnQ6IC0+XG4gICAgcmV0dXJuIGlmIG5vdCBTdGF0ZS55YW5raW5nXG4gICAgQGVkaXRvci50cmFuc2FjdCA9PlxuICAgICAgZm9yIGVtYWNzQ3Vyc29yIGluIEBnZXRFbWFjc0N1cnNvcnMoKVxuICAgICAgICBlbWFjc0N1cnNvci5yb3RhdGVZYW5rKDEpXG4gICAgU3RhdGUueWFua2VkKClcblxuICAjIyNcbiAgU2VjdGlvbjogRWRpdGluZ1xuICAjIyNcblxuICBkZWxldGVIb3Jpem9udGFsU3BhY2U6IC0+XG4gICAgQGVkaXRvci50cmFuc2FjdCA9PlxuICAgICAgQG1vdmVFbWFjc0N1cnNvcnMgKGVtYWNzQ3Vyc29yKSA9PlxuICAgICAgICByYW5nZSA9IGVtYWNzQ3Vyc29yLmhvcml6b250YWxTcGFjZVJhbmdlKClcbiAgICAgICAgQGVkaXRvci5zZXRUZXh0SW5CdWZmZXJSYW5nZShyYW5nZSwgJycpXG5cbiAgZGVsZXRlSW5kZW50YXRpb246IC0+XG4gICAgcmV0dXJuIHVubGVzcyBAZWRpdG9yXG4gICAgQGVkaXRvci50cmFuc2FjdCA9PlxuICAgICAgQGVkaXRvci5tb3ZlVXAoKVxuICAgICAgQGVkaXRvci5qb2luTGluZXMoKVxuXG4gIG9wZW5MaW5lOiAtPlxuICAgIEBlZGl0b3IudHJhbnNhY3QgPT5cbiAgICAgIEBlZGl0b3IuaW5zZXJ0VGV4dChcIlxcblwiKVxuICAgICAgQGVkaXRvci5tb3ZlTGVmdCgpXG5cbiAganVzdE9uZVNwYWNlOiAtPlxuICAgIEBlZGl0b3IudHJhbnNhY3QgPT5cbiAgICAgIGZvciBlbWFjc0N1cnNvciBpbiBAZ2V0RW1hY3NDdXJzb3JzKClcbiAgICAgICAgcmFuZ2UgPSBlbWFjc0N1cnNvci5ob3Jpem9udGFsU3BhY2VSYW5nZSgpXG4gICAgICAgIEBlZGl0b3Iuc2V0VGV4dEluQnVmZmVyUmFuZ2UocmFuZ2UsICcgJylcblxuICB0cmFuc3Bvc2VDaGFyczogLT5cbiAgICBAZWRpdG9yLnRyYW5zYWN0ID0+XG4gICAgICBAbW92ZUVtYWNzQ3Vyc29ycyAoZW1hY3NDdXJzb3IpID0+XG4gICAgICAgIGVtYWNzQ3Vyc29yLnRyYW5zcG9zZUNoYXJzKClcblxuICB0cmFuc3Bvc2VXb3JkczogLT5cbiAgICBAZWRpdG9yLnRyYW5zYWN0ID0+XG4gICAgICBAbW92ZUVtYWNzQ3Vyc29ycyAoZW1hY3NDdXJzb3IpID0+XG4gICAgICAgIGVtYWNzQ3Vyc29yLnRyYW5zcG9zZVdvcmRzKClcblxuICB0cmFuc3Bvc2VMaW5lczogLT5cbiAgICBAZWRpdG9yLnRyYW5zYWN0ID0+XG4gICAgICBAbW92ZUVtYWNzQ3Vyc29ycyAoZW1hY3NDdXJzb3IpID0+XG4gICAgICAgIGVtYWNzQ3Vyc29yLnRyYW5zcG9zZUxpbmVzKClcblxuICBkb3duY2FzZSA9IChzKSAtPiBzLnRvTG93ZXJDYXNlKClcbiAgdXBjYXNlID0gKHMpIC0+IHMudG9VcHBlckNhc2UoKVxuICBjYXBpdGFsaXplID0gKHMpIC0+IHMuc2xpY2UoMCwgMSkudG9VcHBlckNhc2UoKSArIHMuc2xpY2UoMSkudG9Mb3dlckNhc2UoKVxuXG4gIGRvd25jYXNlV29yZE9yUmVnaW9uOiAtPlxuICAgIEBfdHJhbnNmb3JtV29yZE9yUmVnaW9uKGRvd25jYXNlKVxuXG4gIHVwY2FzZVdvcmRPclJlZ2lvbjogLT5cbiAgICBAX3RyYW5zZm9ybVdvcmRPclJlZ2lvbih1cGNhc2UpXG5cbiAgY2FwaXRhbGl6ZVdvcmRPclJlZ2lvbjogLT5cbiAgICBAX3RyYW5zZm9ybVdvcmRPclJlZ2lvbihjYXBpdGFsaXplLCB3b3JkQXRBVGltZTogdHJ1ZSlcblxuICBfdHJhbnNmb3JtV29yZE9yUmVnaW9uOiAodHJhbnNmb3JtV29yZCwge3dvcmRBdEFUaW1lfT17fSkgLT5cbiAgICBAZWRpdG9yLnRyYW5zYWN0ID0+XG4gICAgICBpZiBAZWRpdG9yLmdldFNlbGVjdGlvbnMoKS5maWx0ZXIoKHMpIC0+IG5vdCBzLmlzRW1wdHkoKSkubGVuZ3RoID4gMFxuICAgICAgICBAZWRpdG9yLm11dGF0ZVNlbGVjdGVkVGV4dCAoc2VsZWN0aW9uKSA9PlxuICAgICAgICAgIHJhbmdlID0gc2VsZWN0aW9uLmdldEJ1ZmZlclJhbmdlKClcbiAgICAgICAgICBpZiB3b3JkQXRBVGltZVxuICAgICAgICAgICAgQGVkaXRvci5zY2FuSW5CdWZmZXJSYW5nZSAvXFx3Ky9nLCByYW5nZSwgKGhpdCkgLT5cbiAgICAgICAgICAgICAgaGl0LnJlcGxhY2UodHJhbnNmb3JtV29yZChoaXQubWF0Y2hUZXh0KSlcbiAgICAgICAgICBlbHNlXG4gICAgICAgICAgICBAZWRpdG9yLnNldFRleHRJbkJ1ZmZlclJhbmdlKHJhbmdlLCB0cmFuc2Zvcm1Xb3JkKHNlbGVjdGlvbi5nZXRUZXh0KCkpKVxuICAgICAgZWxzZVxuICAgICAgICBmb3IgY3Vyc29yIGluIEBlZGl0b3IuZ2V0Q3Vyc29ycygpXG4gICAgICAgICAgY3Vyc29yLmVtaXR0ZXIuX190cmFjayA9IHRydWVcbiAgICAgICAgQG1vdmVFbWFjc0N1cnNvcnMgKGVtYWNzQ3Vyc29yKSA9PlxuICAgICAgICAgIGVtYWNzQ3Vyc29yLnRyYW5zZm9ybVdvcmQodHJhbnNmb3JtV29yZClcblxuICAjIyNcbiAgU2VjdGlvbjogTWFya2luZyAmIFNlbGVjdGluZ1xuICAjIyNcblxuICBzZXRNYXJrOiAtPlxuICAgIGZvciBlbWFjc0N1cnNvciBpbiBAZ2V0RW1hY3NDdXJzb3JzKClcbiAgICAgIGVtYWNzQ3Vyc29yLm1hcmsoKS5zZXQoKS5hY3RpdmF0ZSgpXG5cbiAgbWFya1NleHA6IC0+XG4gICAgQG1vdmVFbWFjc0N1cnNvcnMgKGVtYWNzQ3Vyc29yKSAtPlxuICAgICAgZW1hY3NDdXJzb3IubWFya1NleHAoKVxuXG4gIG1hcmtXaG9sZUJ1ZmZlcjogLT5cbiAgICBbZmlyc3QsIHJlc3QuLi5dID0gQGVkaXRvci5nZXRDdXJzb3JzKClcbiAgICBjLmRlc3Ryb3koKSBmb3IgYyBpbiByZXN0XG4gICAgZW1hY3NDdXJzb3IgPSBFbWFjc0N1cnNvci5mb3IoZmlyc3QpXG4gICAgZmlyc3QubW92ZVRvQm90dG9tKClcbiAgICBlbWFjc0N1cnNvci5tYXJrKCkuc2V0KCkuYWN0aXZhdGUoKVxuICAgIGZpcnN0Lm1vdmVUb1RvcCgpXG5cbiAgZXhjaGFuZ2VQb2ludEFuZE1hcms6IC0+XG4gICAgQG1vdmVFbWFjc0N1cnNvcnMgKGVtYWNzQ3Vyc29yKSAtPlxuICAgICAgZW1hY3NDdXJzb3IubWFyaygpLmV4Y2hhbmdlKClcblxuICAjIyNcbiAgU2VjdGlvbjogVUlcbiAgIyMjXG5cbiAgcmVjZW50ZXJUb3BCb3R0b206IC0+XG4gICAgcmV0dXJuIHVubGVzcyBAZWRpdG9yXG4gICAgZWRpdG9yRWxlbWVudCA9IGF0b20udmlld3MuZ2V0VmlldyhAZWRpdG9yKVxuICAgIG1pblJvdyA9IE1hdGgubWluKChjLmdldEJ1ZmZlclJvdygpIGZvciBjIGluIEBlZGl0b3IuZ2V0Q3Vyc29ycygpKS4uLilcbiAgICBtYXhSb3cgPSBNYXRoLm1heCgoYy5nZXRCdWZmZXJSb3coKSBmb3IgYyBpbiBAZWRpdG9yLmdldEN1cnNvcnMoKSkuLi4pXG4gICAgbWluT2Zmc2V0ID0gZWRpdG9yRWxlbWVudC5waXhlbFBvc2l0aW9uRm9yQnVmZmVyUG9zaXRpb24oW21pblJvdywgMF0pXG4gICAgbWF4T2Zmc2V0ID0gZWRpdG9yRWxlbWVudC5waXhlbFBvc2l0aW9uRm9yQnVmZmVyUG9zaXRpb24oW21heFJvdywgMF0pXG5cbiAgICBzd2l0Y2ggU3RhdGUucmVjZW50ZXJzXG4gICAgICB3aGVuIDBcbiAgICAgICAgQGVkaXRvci5zZXRTY3JvbGxUb3AoKG1pbk9mZnNldC50b3AgKyBtYXhPZmZzZXQudG9wIC0gQGVkaXRvci5nZXRIZWlnaHQoKSkvMilcbiAgICAgIHdoZW4gMVxuICAgICAgICAjIEF0b20gYXBwbGllcyBhIChoYXJkY29kZWQpIDItbGluZSBidWZmZXIgd2hpbGUgc2Nyb2xsaW5nIC0tIGRvIHRoYXQgaGVyZS5cbiAgICAgICAgQGVkaXRvci5zZXRTY3JvbGxUb3AobWluT2Zmc2V0LnRvcCAtIDIqQGVkaXRvci5nZXRMaW5lSGVpZ2h0SW5QaXhlbHMoKSlcbiAgICAgIHdoZW4gMlxuICAgICAgICBAZWRpdG9yLnNldFNjcm9sbFRvcChtYXhPZmZzZXQudG9wICsgMypAZWRpdG9yLmdldExpbmVIZWlnaHRJblBpeGVscygpIC0gQGVkaXRvci5nZXRIZWlnaHQoKSlcblxuICAgIFN0YXRlLnJlY2VudGVyZWQoKVxuXG4gIHNjcm9sbFVwOiAtPlxuICAgIGlmICh2aXNpYmxlUm93UmFuZ2UgPSBAZWRpdG9yLmdldFZpc2libGVSb3dSYW5nZSgpKVxuICAgICAgW2ZpcnN0Um93LGxhc3RSb3ddID0gdmlzaWJsZVJvd1JhbmdlXG4gICAgICBjdXJyZW50Um93ID0gQGVkaXRvci5jdXJzb3JzWzBdLmdldEJ1ZmZlclJvdygpXG4gICAgICByb3dDb3VudCA9IChsYXN0Um93IC0gZmlyc3RSb3cpIC0gMlxuICAgICAgQGVkaXRvci5tb3ZlRG93bihyb3dDb3VudClcblxuICBzY3JvbGxEb3duOiAtPlxuICAgIGlmICh2aXNpYmxlUm93UmFuZ2UgPSBAZWRpdG9yLmdldFZpc2libGVSb3dSYW5nZSgpKVxuICAgICAgW2ZpcnN0Um93LGxhc3RSb3ddID0gdmlzaWJsZVJvd1JhbmdlXG4gICAgICBjdXJyZW50Um93ID0gQGVkaXRvci5jdXJzb3JzWzBdLmdldEJ1ZmZlclJvdygpXG4gICAgICByb3dDb3VudCA9IChsYXN0Um93IC0gZmlyc3RSb3cpIC0gMlxuICAgICAgQGVkaXRvci5tb3ZlVXAocm93Q291bnQpXG5cbiAgIyMjXG4gIFNlY3Rpb246IE90aGVyXG4gICMjI1xuXG4gIGtleWJvYXJkUXVpdDogLT5cbiAgICBmb3IgZW1hY3NDdXJzb3IgaW4gQGdldEVtYWNzQ3Vyc29ycygpXG4gICAgICBlbWFjc0N1cnNvci5tYXJrKCkuZGVhY3RpdmF0ZSgpXG4iXX0=
