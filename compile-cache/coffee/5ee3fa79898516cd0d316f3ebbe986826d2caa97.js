(function() {
  var BOB, CLOSERS, CompositeDisposable, EmacsCursor, KillRing, Mark, OPENERS, escapeRegExp;

  KillRing = require('./kill-ring');

  Mark = require('./mark');

  CompositeDisposable = require('atom').CompositeDisposable;

  OPENERS = {
    '(': ')',
    '[': ']',
    '{': '}',
    '\'': '\'',
    '"': '"',
    '`': '`'
  };

  CLOSERS = {
    ')': '(',
    ']': '[',
    '}': '{',
    '\'': '\'',
    '"': '"',
    '`': '`'
  };

  module.exports = EmacsCursor = (function() {
    EmacsCursor["for"] = function(cursor) {
      return cursor._atomicEmacs != null ? cursor._atomicEmacs : cursor._atomicEmacs = new EmacsCursor(cursor);
    };

    function EmacsCursor(cursor1) {
      this.cursor = cursor1;
      this.editor = this.cursor.editor;
      this._mark = null;
      this._localKillRing = null;
      this._yankMarker = null;
      this._disposable = this.cursor.onDidDestroy((function(_this) {
        return function() {
          return _this.destroy();
        };
      })(this));
    }

    EmacsCursor.prototype.mark = function() {
      return this._mark != null ? this._mark : this._mark = new Mark(this.cursor);
    };

    EmacsCursor.prototype.killRing = function() {
      if (this.editor.hasMultipleCursors()) {
        return this.getLocalKillRing();
      } else {
        return KillRing.global;
      }
    };

    EmacsCursor.prototype.getLocalKillRing = function() {
      return this._localKillRing != null ? this._localKillRing : this._localKillRing = KillRing.global.fork();
    };

    EmacsCursor.prototype.clearLocalKillRing = function() {
      return this._localKillRing = null;
    };

    EmacsCursor.prototype.destroy = function() {
      var ref, ref1;
      this._disposable.dispose();
      this._disposable = null;
      if ((ref = this._yankMarker) != null) {
        ref.destroy();
      }
      if ((ref1 = this._mark) != null) {
        ref1.destroy();
      }
      return delete this.cursor._atomicEmacs;
    };

    EmacsCursor.prototype.locateBackward = function(regExp) {
      return this._locateBackwardFrom(this.cursor.getBufferPosition(), regExp);
    };

    EmacsCursor.prototype.locateForward = function(regExp) {
      return this._locateForwardFrom(this.cursor.getBufferPosition(), regExp);
    };

    EmacsCursor.prototype.locateWordCharacterBackward = function() {
      return this.locateBackward(this._getWordCharacterRegExp());
    };

    EmacsCursor.prototype.locateWordCharacterForward = function() {
      return this.locateForward(this._getWordCharacterRegExp());
    };

    EmacsCursor.prototype.locateNonWordCharacterBackward = function() {
      return this.locateBackward(this._getNonWordCharacterRegExp());
    };

    EmacsCursor.prototype.locateNonWordCharacterForward = function() {
      return this.locateForward(this._getNonWordCharacterRegExp());
    };

    EmacsCursor.prototype.goToMatchStartBackward = function(regExp) {
      var ref;
      return this._goTo((ref = this.locateBackward(regExp)) != null ? ref.start : void 0);
    };

    EmacsCursor.prototype.goToMatchStartForward = function(regExp) {
      var ref;
      return this._goTo((ref = this.locateForward(regExp)) != null ? ref.start : void 0);
    };

    EmacsCursor.prototype.goToMatchEndBackward = function(regExp) {
      var ref;
      return this._goTo((ref = this.locateBackward(regExp)) != null ? ref.end : void 0);
    };

    EmacsCursor.prototype.goToMatchEndForward = function(regExp) {
      var ref;
      return this._goTo((ref = this.locateForward(regExp)) != null ? ref.end : void 0);
    };

    EmacsCursor.prototype.skipCharactersBackward = function(characters) {
      var regexp;
      regexp = new RegExp("[^" + (escapeRegExp(characters)) + "]");
      return this.skipBackwardUntil(regexp);
    };

    EmacsCursor.prototype.skipCharactersForward = function(characters) {
      var regexp;
      regexp = new RegExp("[^" + (escapeRegExp(characters)) + "]");
      return this.skipForwardUntil(regexp);
    };

    EmacsCursor.prototype.skipWordCharactersBackward = function() {
      return this.skipBackwardUntil(this._getNonWordCharacterRegExp());
    };

    EmacsCursor.prototype.skipWordCharactersForward = function() {
      return this.skipForwardUntil(this._getNonWordCharacterRegExp());
    };

    EmacsCursor.prototype.skipNonWordCharactersBackward = function() {
      return this.skipBackwardUntil(this._getWordCharacterRegExp());
    };

    EmacsCursor.prototype.skipNonWordCharactersForward = function() {
      return this.skipForwardUntil(this._getWordCharacterRegExp());
    };

    EmacsCursor.prototype.skipBackwardUntil = function(regexp) {
      if (!this.goToMatchEndBackward(regexp)) {
        return this._goTo(BOB);
      }
    };

    EmacsCursor.prototype.skipForwardUntil = function(regexp) {
      if (!this.goToMatchStartForward(regexp)) {
        return this._goTo(this.editor.getEofBufferPosition());
      }
    };

    EmacsCursor.prototype.horizontalSpaceRange = function() {
      var end, start;
      this.skipCharactersBackward(' \t');
      start = this.cursor.getBufferPosition();
      this.skipCharactersForward(' \t');
      end = this.cursor.getBufferPosition();
      return [start, end];
    };

    EmacsCursor.prototype.transformWord = function(transformer) {
      var end, range, start, text;
      this.skipNonWordCharactersForward();
      start = this.cursor.getBufferPosition();
      this.skipWordCharactersForward();
      end = this.cursor.getBufferPosition();
      range = [start, end];
      text = this.editor.getTextInBufferRange(range);
      return this.editor.setTextInBufferRange(range, transformer(text));
    };

    EmacsCursor.prototype.backwardKillWord = function(method) {
      return this._killUnit(method, (function(_this) {
        return function() {
          var end, start;
          end = _this.cursor.getBufferPosition();
          _this.skipNonWordCharactersBackward();
          _this.skipWordCharactersBackward();
          start = _this.cursor.getBufferPosition();
          return [start, end];
        };
      })(this));
    };

    EmacsCursor.prototype.killWord = function(method) {
      return this._killUnit(method, (function(_this) {
        return function() {
          var end, start;
          start = _this.cursor.getBufferPosition();
          _this.skipNonWordCharactersForward();
          _this.skipWordCharactersForward();
          end = _this.cursor.getBufferPosition();
          return [start, end];
        };
      })(this));
    };

    EmacsCursor.prototype.killLine = function(method) {
      return this._killUnit(method, (function(_this) {
        return function() {
          var end, line, start;
          start = _this.cursor.getBufferPosition();
          line = _this.editor.lineTextForBufferRow(start.row);
          if (/^\s*$/.test(line.slice(start.column))) {
            end = [start.row + 1, 0];
          } else {
            end = [start.row, line.length];
          }
          return [start, end];
        };
      })(this));
    };

    EmacsCursor.prototype.killRegion = function(method) {
      return this._killUnit(method, (function(_this) {
        return function() {
          var position;
          position = _this.cursor.selection.getBufferRange();
          return [position, position];
        };
      })(this));
    };

    EmacsCursor.prototype._killUnit = function(method, findRange) {
      var killRing, range, text;
      if (method == null) {
        method = 'push';
      }
      if ((this.cursor.selection != null) && !this.cursor.selection.isEmpty()) {
        range = this.cursor.selection.getBufferRange();
        this.cursor.selection.clear();
      } else {
        range = findRange();
      }
      text = this.editor.getTextInBufferRange(range);
      this.editor.setTextInBufferRange(range, '');
      killRing = this.killRing();
      killRing[method](text);
      return killRing.getCurrentEntry();
    };

    EmacsCursor.prototype.yank = function() {
      var killRing, newRange, position, range;
      killRing = this.killRing();
      if (killRing.isEmpty()) {
        return;
      }
      if (this.cursor.selection) {
        range = this.cursor.selection.getBufferRange();
        this.cursor.selection.clear();
      } else {
        position = this.cursor.getBufferPosition();
        range = [position, position];
      }
      newRange = this.editor.setTextInBufferRange(range, killRing.getCurrentEntry());
      this.cursor.setBufferPosition(newRange.end);
      if (this._yankMarker == null) {
        this._yankMarker = this.editor.markBufferPosition(this.cursor.getBufferPosition());
      }
      return this._yankMarker.setBufferRange(newRange);
    };

    EmacsCursor.prototype.rotateYank = function(n) {
      var entry, range;
      if (this._yankMarker === null) {
        return;
      }
      entry = this.killRing().rotate(n);
      if (entry !== null) {
        range = this.editor.setTextInBufferRange(this._yankMarker.getBufferRange(), entry);
        return this._yankMarker.setBufferRange(range);
      }
    };

    EmacsCursor.prototype.yankComplete = function() {
      var ref;
      if ((ref = this._yankMarker) != null) {
        ref.destroy();
      }
      return this._yankMarker = null;
    };

    EmacsCursor.prototype._nextCharacterFrom = function(position) {
      var lineLength;
      lineLength = this.editor.lineTextForBufferRow(position.row).length;
      if (position.column === lineLength) {
        if (position.row === this.editor.getLastBufferRow()) {
          return null;
        } else {
          return this.editor.getTextInBufferRange([position, [position.row + 1, 0]]);
        }
      } else {
        return this.editor.getTextInBufferRange([position, position.translate([0, 1])]);
      }
    };

    EmacsCursor.prototype._previousCharacterFrom = function(position) {
      var column;
      if (position.column === 0) {
        if (position.row === 0) {
          return null;
        } else {
          column = this.editor.lineTextForBufferRow(position.row - 1).length;
          return this.editor.getTextInBufferRange([[position.row - 1, column], position]);
        }
      } else {
        return this.editor.getTextInBufferRange([position.translate([0, -1]), position]);
      }
    };

    EmacsCursor.prototype.nextCharacter = function() {
      return this._nextCharacterFrom(this.cursor.getBufferPosition());
    };

    EmacsCursor.prototype.previousCharacter = function() {
      return this._nextCharacterFrom(this.cursor.getBufferPosition());
    };

    EmacsCursor.prototype.skipSexpForward = function() {
      var point, target;
      point = this.cursor.getBufferPosition();
      target = this._sexpForwardFrom(point);
      return this.cursor.setBufferPosition(target);
    };

    EmacsCursor.prototype.skipSexpBackward = function() {
      var point, target;
      point = this.cursor.getBufferPosition();
      target = this._sexpBackwardFrom(point);
      return this.cursor.setBufferPosition(target);
    };

    EmacsCursor.prototype.markSexp = function() {
      var mark, newTail, range;
      range = this.cursor.getMarker().getBufferRange();
      newTail = this._sexpForwardFrom(range.end);
      mark = this.mark().set(newTail);
      if (!mark.isActive()) {
        return mark.activate();
      }
    };

    EmacsCursor.prototype.transposeChars = function() {
      var column, line, pair, pairRange, previousLine, ref, row;
      ref = this.cursor.getBufferPosition(), row = ref.row, column = ref.column;
      if (row === 0 && column === 0) {
        return;
      }
      line = this.editor.lineTextForBufferRow(row);
      if (column === 0) {
        previousLine = this.editor.lineTextForBufferRow(row - 1);
        pairRange = [[row - 1, previousLine.length], [row, 1]];
      } else if (column === line.length) {
        pairRange = [[row, column - 2], [row, column]];
      } else {
        pairRange = [[row, column - 1], [row, column + 1]];
      }
      pair = this.editor.getTextInBufferRange(pairRange);
      return this.editor.setTextInBufferRange(pairRange, (pair[1] || '') + pair[0]);
    };

    EmacsCursor.prototype.transposeWords = function() {
      var word1, word1Range, word2, word2Range;
      this.skipNonWordCharactersBackward();
      word1Range = this._wordRange();
      this.skipWordCharactersForward();
      this.skipNonWordCharactersForward();
      if (this.editor.getEofBufferPosition().isEqual(this.cursor.getBufferPosition())) {
        return this.skipNonWordCharactersBackward();
      } else {
        word2Range = this._wordRange();
        word1 = this.editor.getTextInBufferRange(word1Range);
        word2 = this.editor.getTextInBufferRange(word2Range);
        this.editor.setTextInBufferRange(word2Range, word1);
        this.editor.setTextInBufferRange(word1Range, word2);
        return this.cursor.setBufferPosition(word2Range[1]);
      }
    };

    EmacsCursor.prototype.transposeLines = function() {
      var lineRange, row, text;
      row = this.cursor.getBufferRow();
      if (row === 0) {
        this._endLineIfNecessary();
        this.cursor.moveDown();
        row += 1;
      }
      this._endLineIfNecessary();
      lineRange = [[row, 0], [row + 1, 0]];
      text = this.editor.getTextInBufferRange(lineRange);
      this.editor.setTextInBufferRange(lineRange, '');
      return this.editor.setTextInBufferRange([[row - 1, 0], [row - 1, 0]], text);
    };

    EmacsCursor.prototype._wordRange = function() {
      var range, wordEnd, wordStart;
      this.skipWordCharactersBackward();
      range = this.locateNonWordCharacterBackward();
      wordStart = range ? range.end : [0, 0];
      range = this.locateNonWordCharacterForward();
      wordEnd = range ? range.start : this.editor.getEofBufferPosition();
      return [wordStart, wordEnd];
    };

    EmacsCursor.prototype._endLineIfNecessary = function() {
      var length, row;
      row = this.cursor.getBufferPosition().row;
      if (row === this.editor.getLineCount() - 1) {
        length = this.cursor.getCurrentBufferLine().length;
        return this.editor.setTextInBufferRange([[row, length], [row, length]], "\n");
      }
    };

    EmacsCursor.prototype._sexpForwardFrom = function(point) {
      var character, eob, eof, quotes, re, ref, ref1, result, stack;
      eob = this.editor.getEofBufferPosition();
      point = ((ref = this._locateForwardFrom(point, /[\w()[\]{}'"]/i)) != null ? ref.start : void 0) || eob;
      character = this._nextCharacterFrom(point);
      if (OPENERS.hasOwnProperty(character) || CLOSERS.hasOwnProperty(character)) {
        result = null;
        stack = [];
        quotes = 0;
        eof = this.editor.getEofBufferPosition();
        re = /[^()[\]{}"'`\\]+|\\.|[()[\]{}"'`]/g;
        this.editor.scanInBufferRange(re, [point, eof], (function(_this) {
          return function(hit) {
            var closer;
            if (hit.matchText === stack[stack.length - 1]) {
              stack.pop();
              if (stack.length === 0) {
                result = hit.range.end;
                return hit.stop();
              } else if (/^["'`]$/.test(hit.matchText)) {
                return quotes -= 1;
              }
            } else if ((closer = OPENERS[hit.matchText])) {
              if (!(/^["'`]$/.test(closer) && quotes > 0)) {
                stack.push(closer);
                if (/^["'`]$/.test(closer)) {
                  return quotes += 1;
                }
              }
            } else if (CLOSERS[hit.matchText]) {
              if (stack.length === 0) {
                return hit.stop();
              }
            }
          };
        })(this));
        return result || point;
      } else {
        return ((ref1 = this._locateForwardFrom(point, /\W/i)) != null ? ref1.start : void 0) || eob;
      }
    };

    EmacsCursor.prototype._sexpBackwardFrom = function(point) {
      var character, quotes, re, ref, ref1, result, stack;
      point = ((ref = this._locateBackwardFrom(point, /[\w()[\]{}'"]/i)) != null ? ref.end : void 0) || BOB;
      character = this._previousCharacterFrom(point);
      if (OPENERS.hasOwnProperty(character) || CLOSERS.hasOwnProperty(character)) {
        result = null;
        stack = [];
        quotes = 0;
        re = /[^()[\]{}"'`\\]+|\\.|[()[\]{}"'`]/g;
        this.editor.backwardsScanInBufferRange(re, [BOB, point], (function(_this) {
          return function(hit) {
            var opener;
            if (hit.matchText === stack[stack.length - 1]) {
              stack.pop();
              if (stack.length === 0) {
                result = hit.range.start;
                return hit.stop();
              } else if (/^["'`]$/.test(hit.matchText)) {
                return quotes -= 1;
              }
            } else if ((opener = CLOSERS[hit.matchText])) {
              if (!(/^["'`]$/.test(opener) && quotes > 0)) {
                stack.push(opener);
                if (/^["'`]$/.test(opener)) {
                  return quotes += 1;
                }
              }
            } else if (OPENERS[hit.matchText]) {
              if (stack.length === 0) {
                return hit.stop();
              }
            }
          };
        })(this));
        return result || point;
      } else {
        return ((ref1 = this._locateBackwardFrom(point, /\W/i)) != null ? ref1.end : void 0) || BOB;
      }
    };

    EmacsCursor.prototype._locateBackwardFrom = function(point, regExp) {
      var result;
      result = null;
      this.editor.backwardsScanInBufferRange(regExp, [BOB, point], function(hit) {
        return result = hit.range;
      });
      return result;
    };

    EmacsCursor.prototype._locateForwardFrom = function(point, regExp) {
      var eof, result;
      result = null;
      eof = this.editor.getEofBufferPosition();
      this.editor.scanInBufferRange(regExp, [point, eof], function(hit) {
        return result = hit.range;
      });
      return result;
    };

    EmacsCursor.prototype._getWordCharacterRegExp = function() {
      var nonWordCharacters;
      nonWordCharacters = atom.config.get('editor.nonWordCharacters');
      return new RegExp('[^\\s' + escapeRegExp(nonWordCharacters) + ']');
    };

    EmacsCursor.prototype._getNonWordCharacterRegExp = function() {
      var nonWordCharacters;
      nonWordCharacters = atom.config.get('editor.nonWordCharacters');
      return new RegExp('[\\s' + escapeRegExp(nonWordCharacters) + ']');
    };

    EmacsCursor.prototype._goTo = function(point) {
      if (point) {
        this.cursor.setBufferPosition(point);
        return true;
      } else {
        return false;
      }
    };

    return EmacsCursor;

  })();

  escapeRegExp = function(string) {
    if (string) {
      return string.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    } else {
      return '';
    }
  };

  BOB = {
    row: 0,
    column: 0
  };

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL2hvbWUvamFrZS8uYXRvbS9wYWNrYWdlcy9hdG9taWMtZW1hY3MvbGliL2VtYWNzLWN1cnNvci5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFBQSxNQUFBOztFQUFBLFFBQUEsR0FBVyxPQUFBLENBQVEsYUFBUjs7RUFDWCxJQUFBLEdBQU8sT0FBQSxDQUFRLFFBQVI7O0VBQ04sc0JBQXVCLE9BQUEsQ0FBUSxNQUFSOztFQUV4QixPQUFBLEdBQVU7SUFBQyxHQUFBLEVBQUssR0FBTjtJQUFXLEdBQUEsRUFBSyxHQUFoQjtJQUFxQixHQUFBLEVBQUssR0FBMUI7SUFBK0IsSUFBQSxFQUFNLElBQXJDO0lBQTJDLEdBQUEsRUFBSyxHQUFoRDtJQUFxRCxHQUFBLEVBQUssR0FBMUQ7OztFQUNWLE9BQUEsR0FBVTtJQUFDLEdBQUEsRUFBSyxHQUFOO0lBQVcsR0FBQSxFQUFLLEdBQWhCO0lBQXFCLEdBQUEsRUFBSyxHQUExQjtJQUErQixJQUFBLEVBQU0sSUFBckM7SUFBMkMsR0FBQSxFQUFLLEdBQWhEO0lBQXFELEdBQUEsRUFBSyxHQUExRDs7O0VBRVYsTUFBTSxDQUFDLE9BQVAsR0FDTTtJQUNKLFdBQUMsRUFBQSxHQUFBLEVBQUQsR0FBTSxTQUFDLE1BQUQ7MkNBQ0osTUFBTSxDQUFDLGVBQVAsTUFBTSxDQUFDLGVBQW9CLElBQUEsV0FBQSxDQUFZLE1BQVo7SUFEdkI7O0lBR08scUJBQUMsT0FBRDtNQUFDLElBQUMsQ0FBQSxTQUFEO01BQ1osSUFBQyxDQUFBLE1BQUQsR0FBVSxJQUFDLENBQUEsTUFBTSxDQUFDO01BQ2xCLElBQUMsQ0FBQSxLQUFELEdBQVM7TUFDVCxJQUFDLENBQUEsY0FBRCxHQUFrQjtNQUNsQixJQUFDLENBQUEsV0FBRCxHQUFlO01BQ2YsSUFBQyxDQUFBLFdBQUQsR0FBZSxJQUFDLENBQUEsTUFBTSxDQUFDLFlBQVIsQ0FBcUIsQ0FBQSxTQUFBLEtBQUE7ZUFB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QUMsS0FBRDtNQUNMLElBQUcsS0FBSDtRQUNFLElBQUMsQ0FBQSxNQUFNLENBQUMsaUJBQVIsQ0FBMEIsS0FBMUI7ZUFDQSxLQUZGO09BQUEsTUFBQTtlQUlFLE1BSkY7O0lBREs7Ozs7OztFQVNULFlBQUEsR0FBZSxTQUFDLE1BQUQ7SUFDYixJQUFHLE1BQUg7YUFDRSxNQUFNLENBQUMsT0FBUCxDQUFlLHdCQUFmLEVBQXlDLE1BQXpDLEVBREY7S0FBQSxNQUFBO2FBR0UsR0FIRjs7RUFEYTs7RUFNZixHQUFBLEdBQU07SUFBQyxHQUFBLEVBQUssQ0FBTjtJQUFTLE1BQUEsRUFBUSxDQUFqQjs7QUEzYk4iLCJzb3VyY2VzQ29udGVudCI6WyJLaWxsUmluZyA9IHJlcXVpcmUgJy4va2lsbC1yaW5nJ1xuTWFyayA9IHJlcXVpcmUgJy4vbWFyaydcbntDb21wb3NpdGVEaXNwb3NhYmxlfSA9IHJlcXVpcmUgJ2F0b20nXG5cbk9QRU5FUlMgPSB7JygnOiAnKScsICdbJzogJ10nLCAneyc6ICd9JywgJ1xcJyc6ICdcXCcnLCAnXCInOiAnXCInLCAnYCc6ICdgJ31cbkNMT1NFUlMgPSB7JyknOiAnKCcsICddJzogJ1snLCAnfSc6ICd7JywgJ1xcJyc6ICdcXCcnLCAnXCInOiAnXCInLCAnYCc6ICdgJ31cblxubW9kdWxlLmV4cG9ydHMgPVxuY2xhc3MgRW1hY3NDdXJzb3JcbiAgQGZvcjogKGN1cnNvcikgLT5cbiAgICBjdXJzb3IuX2F0b21pY0VtYWNzID89IG5ldyBFbWFjc0N1cnNvcihjdXJzb3IpXG5cbiAgY29uc3RydWN0b3I6IChAY3Vyc29yKSAtPlxuICAgIEBlZGl0b3IgPSBAY3Vyc29yLmVkaXRvclxuICAgIEBfbWFyayA9IG51bGxcbiAgICBAX2xvY2FsS2lsbFJpbmcgPSBudWxsXG4gICAgQF95YW5rTWFya2VyID0gbnVsbFxuICAgIEBfZGlzcG9zYWJsZSA9IEBjdXJzb3Iub25EaWREZXN0cm95ID0+IEBkZXN0cm95KClcblxuICBtYXJrOiAtPlxuICAgIEBfbWFyayA/PSBuZXcgTWFyayhAY3Vyc29yKVxuXG4gIGtpbGxSaW5nOiAtPlxuICAgIGlmIEBlZGl0b3IuaGFzTXVsdGlwbGVDdXJzb3JzKClcbiAgICAgIEBnZXRMb2NhbEtpbGxSaW5nKClcbiAgICBlbHNlXG4gICAgICBLaWxsUmluZy5nbG9iYWxcblxuICBnZXRMb2NhbEtpbGxSaW5nOiAtPlxuICAgIEBfbG9jYWxLaWxsUmluZyA/PSBLaWxsUmluZy5nbG9iYWwuZm9yaygpXG5cbiAgY2xlYXJMb2NhbEtpbGxSaW5nOiAtPlxuICAgIEBfbG9jYWxLaWxsUmluZyA9IG51bGxcblxuICBkZXN0cm95OiAtPlxuICAgIEBfZGlzcG9zYWJsZS5kaXNwb3NlKClcbiAgICBAX2Rpc3Bvc2FibGUgPSBudWxsXG4gICAgQF95YW5rTWFya2VyPy5kZXN0cm95KClcbiAgICBAX21hcms/LmRlc3Ryb3koKVxuICAgIGRlbGV0ZSBAY3Vyc29yLl9hdG9taWNFbWFjc1xuXG4gICMgTG9vayBmb3IgdGhlIHByZXZpb3VzIG9jY3VycmVuY2Ugb2YgdGhlIGdpdmVuIHJlZ2V4cC5cbiAgI1xuICAjIFJldHVybiBhIFJhbmdlIGlmIGZvdW5kLCBudWxsIG90aGVyd2lzZS4gVGhpcyBkb2VzIG5vdCBtb3ZlIHRoZSBjdXJzb3IuXG4gIGxvY2F0ZUJhY2t3YXJkOiAocmVnRXhwKSAtPlxuICAgIEBfbG9jYXRlQmFja3dhcmRGcm9tKEBjdXJzb3IuZ2V0QnVmZmVyUG9zaXRpb24oKSwgcmVnRXhwKVxuXG4gICMgTG9vayBmb3IgdGhlIG5leHQgb2NjdXJyZW5jZSBvZiB0aGUgZ2l2ZW4gcmVnZXhwLlxuICAjXG4gICMgUmV0dXJuIGEgUmFuZ2UgaWYgZm91bmQsIG51bGwgb3RoZXJ3aXNlLiBUaGlzIGRvZXMgbm90IG1vdmUgdGhlIGN1cnNvci5cbiAgbG9jYXRlRm9yd2FyZDogKHJlZ0V4cCkgLT5cbiAgICBAX2xvY2F0ZUZvcndhcmRGcm9tKEBjdXJzb3IuZ2V0QnVmZmVyUG9zaXRpb24oKSwgcmVnRXhwKVxuXG4gICMgTG9vayBmb3IgdGhlIHByZXZpb3VzIHdvcmQgY2hhcmFjdGVyLlxuICAjXG4gICMgUmV0dXJuIGEgUmFuZ2UgaWYgZm91bmQsIG51bGwgb3RoZXJ3aXNlLiBUaGlzIGRvZXMgbm90IG1vdmUgdGhlIGN1cnNvci5cbiAgbG9jYXRlV29yZENoYXJhY3RlckJhY2t3YXJkOiAtPlxuICAgIEBsb2NhdGVCYWNrd2FyZCBAX2dldFdvcmRDaGFyYWN0ZXJSZWdFeHAoKVxuXG4gICMgTG9vayBmb3IgdGhlIG5leHQgd29yZCBjaGFyYWN0ZXIuXG4gICNcbiAgIyBSZXR1cm4gYSBSYW5nZSBpZiBmb3VuZCwgbnVsbCBvdGhlcndpc2UuIFRoaXMgZG9lcyBub3QgbW92ZSB0aGUgY3Vyc29yLlxuICBsb2NhdGVXb3JkQ2hhcmFjdGVyRm9yd2FyZDogLT5cbiAgICBAbG9jYXRlRm9yd2FyZCBAX2dldFdvcmRDaGFyYWN0ZXJSZWdFeHAoKVxuXG4gICMgTG9vayBmb3IgdGhlIHByZXZpb3VzIG5vbndvcmQgY2hhcmFjdGVyLlxuICAjXG4gICMgUmV0dXJuIGEgUmFuZ2UgaWYgZm91bmQsIG51bGwgb3RoZXJ3aXNlLiBUaGlzIGRvZXMgbm90IG1vdmUgdGhlIGN1cnNvci5cbiAgbG9jYXRlTm9uV29yZENoYXJhY3RlckJhY2t3YXJkOiAtPlxuICAgIEBsb2NhdGVCYWNrd2FyZCBAX2dldE5vbldvcmRDaGFyYWN0ZXJSZWdFeHAoKVxuXG4gICMgTG9vayBmb3IgdGhlIG5leHQgbm9ud29yZCBjaGFyYWN0ZXIuXG4gICNcbiAgIyBSZXR1cm4gYSBSYW5nZSBpZiBmb3VuZCwgbnVsbCBvdGhlcndpc2UuIFRoaXMgZG9lcyBub3QgbW92ZSB0aGUgY3Vyc29yLlxuICBsb2NhdGVOb25Xb3JkQ2hhcmFjdGVyRm9yd2FyZDogLT5cbiAgICBAbG9jYXRlRm9yd2FyZCBAX2dldE5vbldvcmRDaGFyYWN0ZXJSZWdFeHAoKVxuXG4gICMgTW92ZSB0byB0aGUgc3RhcnQgb2YgdGhlIHByZXZpb3VzIG9jY3VycmVuY2Ugb2YgdGhlIGdpdmVuIHJlZ2V4cC5cbiAgI1xuICAjIFJldHVybiB0cnVlIGlmIGZvdW5kLCBmYWxzZSBvdGhlcndpc2UuXG4gIGdvVG9NYXRjaFN0YXJ0QmFja3dhcmQ6IChyZWdFeHApIC0+XG4gICAgQF9nb1RvIEBsb2NhdGVCYWNrd2FyZChyZWdFeHApPy5zdGFydFxuXG4gICMgTW92ZSB0byB0aGUgc3RhcnQgb2YgdGhlIG5leHQgb2NjdXJyZW5jZSBvZiB0aGUgZ2l2ZW4gcmVnZXhwLlxuICAjXG4gICMgUmV0dXJuIHRydWUgaWYgZm91bmQsIGZhbHNlIG90aGVyd2lzZS5cbiAgZ29Ub01hdGNoU3RhcnRGb3J3YXJkOiAocmVnRXhwKSAtPlxuICAgIEBfZ29UbyBAbG9jYXRlRm9yd2FyZChyZWdFeHApPy5zdGFydFxuXG4gICMgTW92ZSB0byB0aGUgZW5kIG9mIHRoZSBwcmV2aW91cyBvY2N1cnJlbmNlIG9mIHRoZSBnaXZlbiByZWdleHAuXG4gICNcbiAgIyBSZXR1cm4gdHJ1ZSBpZiBmb3VuZCwgZmFsc2Ugb3RoZXJ3aXNlLlxuICBnb1RvTWF0Y2hFbmRCYWNrd2FyZDogKHJlZ0V4cCkgLT5cbiAgICBAX2dvVG8gQGxvY2F0ZUJhY2t3YXJkKHJlZ0V4cCk/LmVuZFxuXG4gICMgTW92ZSB0byB0aGUgZW5kIG9mIHRoZSBuZXh0IG9jY3VycmVuY2Ugb2YgdGhlIGdpdmVuIHJlZ2V4cC5cbiAgI1xuICAjIFJldHVybiB0cnVlIGlmIGZvdW5kLCBmYWxzZSBvdGhlcndpc2UuXG4gIGdvVG9NYXRjaEVuZEZvcndhcmQ6IChyZWdFeHApIC0+XG4gICAgQF9nb1RvIEBsb2NhdGVGb3J3YXJkKHJlZ0V4cCk/LmVuZFxuXG4gICMgU2tpcCBiYWNrd2FyZHMgb3ZlciB0aGUgZ2l2ZW4gY2hhcmFjdGVycy5cbiAgI1xuICAjIElmIHRoZSBlbmQgb2YgdGhlIGJ1ZmZlciBpcyByZWFjaGVkLCByZW1haW4gdGhlcmUuXG4gIHNraXBDaGFyYWN0ZXJzQmFja3dhcmQ6IChjaGFyYWN0ZXJzKSAtPlxuICAgIHJlZ2V4cCA9IG5ldyBSZWdFeHAoXCJbXiN7ZXNjYXBlUmVnRXhwKGNoYXJhY3RlcnMpfV1cIilcbiAgICBAc2tpcEJhY2t3YXJkVW50aWwocmVnZXhwKVxuXG4gICMgU2tpcCBmb3J3YXJkcyBvdmVyIHRoZSBnaXZlbiBjaGFyYWN0ZXJzLlxuICAjXG4gICMgSWYgdGhlIGVuZCBvZiB0aGUgYnVmZmVyIGlzIHJlYWNoZWQsIHJlbWFpbiB0aGVyZS5cbiAgc2tpcENoYXJhY3RlcnNGb3J3YXJkOiAoY2hhcmFjdGVycykgLT5cbiAgICByZWdleHAgPSBuZXcgUmVnRXhwKFwiW14je2VzY2FwZVJlZ0V4cChjaGFyYWN0ZXJzKX1dXCIpXG4gICAgQHNraXBGb3J3YXJkVW50aWwocmVnZXhwKVxuXG4gICMgU2tpcCBiYWNrd2FyZHMgb3ZlciBhbnkgd29yZCBjaGFyYWN0ZXJzLlxuICAjXG4gICMgSWYgdGhlIGJlZ2lubmluZyBvZiB0aGUgYnVmZmVyIGlzIHJlYWNoZWQsIHJlbWFpbiB0aGVyZS5cbiAgc2tpcFdvcmRDaGFyYWN0ZXJzQmFja3dhcmQ6IC0+XG4gICAgQHNraXBCYWNrd2FyZFVudGlsKEBfZ2V0Tm9uV29yZENoYXJhY3RlclJlZ0V4cCgpKVxuXG4gICMgU2tpcCBmb3J3YXJkcyBvdmVyIGFueSB3b3JkIGNoYXJhY3RlcnMuXG4gICNcbiAgIyBJZiB0aGUgZW5kIG9mIHRoZSBidWZmZXIgaXMgcmVhY2hlZCwgcmVtYWluIHRoZXJlLlxuICBza2lwV29yZENoYXJhY3RlcnNGb3J3YXJkOiAtPlxuICAgIEBza2lwRm9yd2FyZFVudGlsKEBfZ2V0Tm9uV29yZENoYXJhY3RlclJlZ0V4cCgpKVxuXG4gICMgU2tpcCBiYWNrd2FyZHMgb3ZlciBhbnkgbm9uLXdvcmQgY2hhcmFjdGVycy5cbiAgI1xuICAjIElmIHRoZSBiZWdpbm5pbmcgb2YgdGhlIGJ1ZmZlciBpcyByZWFjaGVkLCByZW1haW4gdGhlcmUuXG4gIHNraXBOb25Xb3JkQ2hhcmFjdGVyc0JhY2t3YXJkOiAtPlxuICAgIEBza2lwQmFja3dhcmRVbnRpbChAX2dldFdvcmRDaGFyYWN0ZXJSZWdFeHAoKSlcblxuICAjIFNraXAgZm9yd2FyZHMgb3ZlciBhbnkgbm9uLXdvcmQgY2hhcmFjdGVycy5cbiAgI1xuICAjIElmIHRoZSBlbmQgb2YgdGhlIGJ1ZmZlciBpcyByZWFjaGVkLCByZW1haW4gdGhlcmUuXG4gIHNraXBOb25Xb3JkQ2hhcmFjdGVyc0ZvcndhcmQ6IC0+XG4gICAgQHNraXBGb3J3YXJkVW50aWwoQF9nZXRXb3JkQ2hhcmFjdGVyUmVnRXhwKCkpXG5cbiAgIyBTa2lwIG92ZXIgY2hhcmFjdGVycyB1bnRpbCB0aGUgcHJldmlvdXMgb2NjdXJyZW5jZSBvZiB0aGUgZ2l2ZW4gcmVnZXhwLlxuICAjXG4gICMgSWYgdGhlIGJlZ2lubmluZyBvZiB0aGUgYnVmZmVyIGlzIHJlYWNoZWQsIHJlbWFpbiB0aGVyZS5cbiAgc2tpcEJhY2t3YXJkVW50aWw6IChyZWdleHApIC0+XG4gICAgaWYgbm90IEBnb1RvTWF0Y2hFbmRCYWNrd2FyZChyZWdleHApXG4gICAgICBAX2dvVG8gQk9CXG5cbiAgIyBTa2lwIG92ZXIgY2hhcmFjdGVycyB1bnRpbCB0aGUgbmV4dCBvY2N1cnJlbmNlIG9mIHRoZSBnaXZlbiByZWdleHAuXG4gICNcbiAgIyBJZiB0aGUgZW5kIG9mIHRoZSBidWZmZXIgaXMgcmVhY2hlZCwgcmVtYWluIHRoZXJlLlxuICBza2lwRm9yd2FyZFVudGlsOiAocmVnZXhwKSAtPlxuICAgIGlmIG5vdCBAZ29Ub01hdGNoU3RhcnRGb3J3YXJkKHJlZ2V4cClcbiAgICAgIEBfZ29UbyBAZWRpdG9yLmdldEVvZkJ1ZmZlclBvc2l0aW9uKClcblxuICBob3Jpem9udGFsU3BhY2VSYW5nZTogLT5cbiAgICBAc2tpcENoYXJhY3RlcnNCYWNrd2FyZCgnIFxcdCcpXG4gICAgc3RhcnQgPSBAY3Vyc29yLmdldEJ1ZmZlclBvc2l0aW9uKClcbiAgICBAc2tpcENoYXJhY3RlcnNGb3J3YXJkKCcgXFx0JylcbiAgICBlbmQgPSBAY3Vyc29yLmdldEJ1ZmZlclBvc2l0aW9uKClcbiAgICBbc3RhcnQsIGVuZF1cblxuICB0cmFuc2Zvcm1Xb3JkOiAodHJhbnNmb3JtZXIpIC0+XG4gICAgQHNraXBOb25Xb3JkQ2hhcmFjdGVyc0ZvcndhcmQoKVxuICAgIHN0YXJ0ID0gQGN1cnNvci5nZXRCdWZmZXJQb3NpdGlvbigpXG4gICAgQHNraXBXb3JkQ2hhcmFjdGVyc0ZvcndhcmQoKVxuICAgIGVuZCA9IEBjdXJzb3IuZ2V0QnVmZmVyUG9zaXRpb24oKVxuICAgIHJhbmdlID0gW3N0YXJ0LCBlbmRdXG4gICAgdGV4dCA9IEBlZGl0b3IuZ2V0VGV4dEluQnVmZmVyUmFuZ2UocmFuZ2UpXG4gICAgQGVkaXRvci5zZXRUZXh0SW5CdWZmZXJSYW5nZShyYW5nZSwgdHJhbnNmb3JtZXIodGV4dCkpXG5cbiAgYmFja3dhcmRLaWxsV29yZDogKG1ldGhvZCkgLT5cbiAgICBAX2tpbGxVbml0IG1ldGhvZCwgPT5cbiAgICAgIGVuZCA9IEBjdXJzb3IuZ2V0QnVmZmVyUG9zaXRpb24oKVxuICAgICAgQHNraXBOb25Xb3JkQ2hhcmFjdGVyc0JhY2t3YXJkKClcbiAgICAgIEBza2lwV29yZENoYXJhY3RlcnNCYWNrd2FyZCgpXG4gICAgICBzdGFydCA9IEBjdXJzb3IuZ2V0QnVmZmVyUG9zaXRpb24oKVxuICAgICAgW3N0YXJ0LCBlbmRdXG5cbiAga2lsbFdvcmQ6IChtZXRob2QpIC0+XG4gICAgQF9raWxsVW5pdCBtZXRob2QsID0+XG4gICAgICBzdGFydCA9IEBjdXJzb3IuZ2V0QnVmZmVyUG9zaXRpb24oKVxuICAgICAgQHNraXBOb25Xb3JkQ2hhcmFjdGVyc0ZvcndhcmQoKVxuICAgICAgQHNraXBXb3JkQ2hhcmFjdGVyc0ZvcndhcmQoKVxuICAgICAgZW5kID0gQGN1cnNvci5nZXRCdWZmZXJQb3NpdGlvbigpXG4gICAgICBbc3RhcnQsIGVuZF1cblxuICBraWxsTGluZTogKG1ldGhvZCkgLT5cbiAgICBAX2tpbGxVbml0IG1ldGhvZCwgPT5cbiAgICAgIHN0YXJ0ID0gQGN1cnNvci5nZXRCdWZmZXJQb3NpdGlvbigpXG4gICAgICBsaW5lID0gQGVkaXRvci5saW5lVGV4dEZvckJ1ZmZlclJvdyhzdGFydC5yb3cpXG4gICAgICBpZiAvXlxccyokLy50ZXN0KGxpbmUuc2xpY2Uoc3RhcnQuY29sdW1uKSlcbiAgICAgICAgZW5kID0gW3N0YXJ0LnJvdyArIDEsIDBdXG4gICAgICBlbHNlXG4gICAgICAgIGVuZCA9IFtzdGFydC5yb3csIGxpbmUubGVuZ3RoXVxuICAgICAgW3N0YXJ0LCBlbmRdXG5cbiAga2lsbFJlZ2lvbjogKG1ldGhvZCkgLT5cbiAgICBAX2tpbGxVbml0IG1ldGhvZCwgPT5cbiAgICAgIHBvc2l0aW9uID0gQGN1cnNvci5zZWxlY3Rpb24uZ2V0QnVmZmVyUmFuZ2UoKVxuICAgICAgW3Bvc2l0aW9uLCBwb3NpdGlvbl1cblxuICBfa2lsbFVuaXQ6IChtZXRob2Q9J3B1c2gnLCBmaW5kUmFuZ2UpIC0+XG4gICAgaWYgQGN1cnNvci5zZWxlY3Rpb24/IGFuZCBub3QgQGN1cnNvci5zZWxlY3Rpb24uaXNFbXB0eSgpXG4gICAgICByYW5nZSA9IEBjdXJzb3Iuc2VsZWN0aW9uLmdldEJ1ZmZlclJhbmdlKClcbiAgICAgIEBjdXJzb3Iuc2VsZWN0aW9uLmNsZWFyKClcbiAgICBlbHNlXG4gICAgICByYW5nZSA9IGZpbmRSYW5nZSgpXG5cbiAgICB0ZXh0ID0gQGVkaXRvci5nZXRUZXh0SW5CdWZmZXJSYW5nZShyYW5nZSlcbiAgICBAZWRpdG9yLnNldFRleHRJbkJ1ZmZlclJhbmdlKHJhbmdlLCAnJylcbiAgICBraWxsUmluZyA9IEBraWxsUmluZygpXG4gICAga2lsbFJpbmdbbWV0aG9kXSh0ZXh0KVxuICAgIGtpbGxSaW5nLmdldEN1cnJlbnRFbnRyeSgpXG5cbiAgeWFuazogLT5cbiAgICBraWxsUmluZyA9IEBraWxsUmluZygpXG4gICAgcmV0dXJuIGlmIGtpbGxSaW5nLmlzRW1wdHkoKVxuICAgIGlmIEBjdXJzb3Iuc2VsZWN0aW9uXG4gICAgICByYW5nZSA9IEBjdXJzb3Iuc2VsZWN0aW9uLmdldEJ1ZmZlclJhbmdlKClcbiAgICAgIEBjdXJzb3Iuc2VsZWN0aW9uLmNsZWFyKClcbiAgICBlbHNlXG4gICAgICBwb3NpdGlvbiA9IEBjdXJzb3IuZ2V0QnVmZmVyUG9zaXRpb24oKVxuICAgICAgcmFuZ2UgPSBbcG9zaXRpb24sIHBvc2l0aW9uXVxuICAgIG5ld1JhbmdlID0gQGVkaXRvci5zZXRUZXh0SW5CdWZmZXJSYW5nZShyYW5nZSwga2lsbFJpbmcuZ2V0Q3VycmVudEVudHJ5KCkpXG4gICAgQGN1cnNvci5zZXRCdWZmZXJQb3NpdGlvbihuZXdSYW5nZS5lbmQpXG4gICAgQF95YW5rTWFya2VyID89IEBlZGl0b3IubWFya0J1ZmZlclBvc2l0aW9uKEBjdXJzb3IuZ2V0QnVmZmVyUG9zaXRpb24oKSlcbiAgICBAX3lhbmtNYXJrZXIuc2V0QnVmZmVyUmFuZ2UobmV3UmFuZ2UpXG5cbiAgcm90YXRlWWFuazogKG4pIC0+XG4gICAgcmV0dXJuIGlmIEBfeWFua01hcmtlciA9PSBudWxsXG4gICAgZW50cnkgPSBAa2lsbFJpbmcoKS5yb3RhdGUobilcbiAgICB1bmxlc3MgZW50cnkgaXMgbnVsbFxuICAgICAgcmFuZ2UgPSBAZWRpdG9yLnNldFRleHRJbkJ1ZmZlclJhbmdlKEBfeWFua01hcmtlci5nZXRCdWZmZXJSYW5nZSgpLCBlbnRyeSlcbiAgICAgIEBfeWFua01hcmtlci5zZXRCdWZmZXJSYW5nZShyYW5nZSlcblxuICB5YW5rQ29tcGxldGU6IC0+XG4gICAgQF95YW5rTWFya2VyPy5kZXN0cm95KClcbiAgICBAX3lhbmtNYXJrZXIgPSBudWxsXG5cbiAgX25leHRDaGFyYWN0ZXJGcm9tOiAocG9zaXRpb24pIC0+XG4gICAgbGluZUxlbmd0aCA9IEBlZGl0b3IubGluZVRleHRGb3JCdWZmZXJSb3cocG9zaXRpb24ucm93KS5sZW5ndGhcbiAgICBpZiBwb3NpdGlvbi5jb2x1bW4gPT0gbGluZUxlbmd0aFxuICAgICAgaWYgcG9zaXRpb24ucm93ID09IEBlZGl0b3IuZ2V0TGFzdEJ1ZmZlclJvdygpXG4gICAgICAgIG51bGxcbiAgICAgIGVsc2VcbiAgICAgICAgQGVkaXRvci5nZXRUZXh0SW5CdWZmZXJSYW5nZShbcG9zaXRpb24sIFtwb3NpdGlvbi5yb3cgKyAxLCAwXV0pXG4gICAgZWxzZVxuICAgICAgQGVkaXRvci5nZXRUZXh0SW5CdWZmZXJSYW5nZShbcG9zaXRpb24sIHBvc2l0aW9uLnRyYW5zbGF0ZShbMCwgMV0pXSlcblxuICBfcHJldmlvdXNDaGFyYWN0ZXJGcm9tOiAocG9zaXRpb24pIC0+XG4gICAgaWYgcG9zaXRpb24uY29sdW1uID09IDBcbiAgICAgIGlmIHBvc2l0aW9uLnJvdyA9PSAwXG4gICAgICAgIG51bGxcbiAgICAgIGVsc2VcbiAgICAgICAgY29sdW1uID0gQGVkaXRvci5saW5lVGV4dEZvckJ1ZmZlclJvdyhwb3NpdGlvbi5yb3cgLSAxKS5sZW5ndGhcbiAgICAgICAgQGVkaXRvci5nZXRUZXh0SW5CdWZmZXJSYW5nZShbW3Bvc2l0aW9uLnJvdyAtIDEsIGNvbHVtbl0sIHBvc2l0aW9uXSlcbiAgICBlbHNlXG4gICAgICBAZWRpdG9yLmdldFRleHRJbkJ1ZmZlclJhbmdlKFtwb3NpdGlvbi50cmFuc2xhdGUoWzAsIC0xXSksIHBvc2l0aW9uXSlcblxuICBuZXh0Q2hhcmFjdGVyOiAtPlxuICAgIEBfbmV4dENoYXJhY3RlckZyb20oQGN1cnNvci5nZXRCdWZmZXJQb3NpdGlvbigpKVxuXG4gIHByZXZpb3VzQ2hhcmFjdGVyOiAtPlxuICAgIEBfbmV4dENoYXJhY3RlckZyb20oQGN1cnNvci5nZXRCdWZmZXJQb3NpdGlvbigpKVxuXG4gICMgU2tpcCB0byB0aGUgZW5kIG9mIHRoZSBjdXJyZW50IG9yIG5leHQgc3ltYm9saWMgZXhwcmVzc2lvbi5cbiAgc2tpcFNleHBGb3J3YXJkOiAtPlxuICAgIHBvaW50ID0gQGN1cnNvci5nZXRCdWZmZXJQb3NpdGlvbigpXG4gICAgdGFyZ2V0ID0gQF9zZXhwRm9yd2FyZEZyb20ocG9pbnQpXG4gICAgQGN1cnNvci5zZXRCdWZmZXJQb3NpdGlvbih0YXJnZXQpXG5cbiAgIyBTa2lwIHRvIHRoZSBiZWdpbm5pbmcgb2YgdGhlIGN1cnJlbnQgb3IgcHJldmlvdXMgc3ltYm9saWMgZXhwcmVzc2lvbi5cbiAgc2tpcFNleHBCYWNrd2FyZDogLT5cbiAgICBwb2ludCA9IEBjdXJzb3IuZ2V0QnVmZmVyUG9zaXRpb24oKVxuICAgIHRhcmdldCA9IEBfc2V4cEJhY2t3YXJkRnJvbShwb2ludClcbiAgICBAY3Vyc29yLnNldEJ1ZmZlclBvc2l0aW9uKHRhcmdldClcblxuICAjIEFkZCB0aGUgbmV4dCBzZXhwIHRvIHRoZSBjdXJzb3IncyBzZWxlY3Rpb24uIEFjdGl2YXRlIGlmIG5lY2Vzc2FyeS5cbiAgbWFya1NleHA6IC0+XG4gICAgcmFuZ2UgPSBAY3Vyc29yLmdldE1hcmtlcigpLmdldEJ1ZmZlclJhbmdlKClcbiAgICBuZXdUYWlsID0gQF9zZXhwRm9yd2FyZEZyb20ocmFuZ2UuZW5kKVxuICAgIG1hcmsgPSBAbWFyaygpLnNldChuZXdUYWlsKVxuICAgIG1hcmsuYWN0aXZhdGUoKSB1bmxlc3MgbWFyay5pc0FjdGl2ZSgpXG5cbiAgIyBUcmFuc3Bvc2UgdGhlIHR3byBjaGFyYWN0ZXJzIGFyb3VuZCB0aGUgY3Vyc29yLiBBdCB0aGUgYmVnaW5uaW5nIG9mIGEgbGluZSxcbiAgIyB0cmFuc3Bvc2UgdGhlIG5ld2xpbmUgd2l0aCB0aGUgZmlyc3QgY2hhcmFjdGVyIG9mIHRoZSBsaW5lLiBBdCB0aGUgZW5kIG9mIGFcbiAgIyBsaW5lLCB0cmFuc3Bvc2UgdGhlIGxhc3QgdHdvIGNoYXJhY3RlcnMuIEF0IHRoZSBiZWdpbm5pbmcgb2YgdGhlIGJ1ZmZlciwgZG9cbiAgIyBub3RoaW5nLiBXZWlyZCwgYnV0IHRoYXQncyBFbWFjcyFcbiAgdHJhbnNwb3NlQ2hhcnM6IC0+XG4gICAge3JvdywgY29sdW1ufSA9IEBjdXJzb3IuZ2V0QnVmZmVyUG9zaXRpb24oKVxuICAgIHJldHVybiBpZiByb3cgPT0gMCBhbmQgY29sdW1uID09IDBcblxuICAgIGxpbmUgPSBAZWRpdG9yLmxpbmVUZXh0Rm9yQnVmZmVyUm93KHJvdylcbiAgICBpZiBjb2x1bW4gPT0gMFxuICAgICAgcHJldmlvdXNMaW5lID0gQGVkaXRvci5saW5lVGV4dEZvckJ1ZmZlclJvdyhyb3cgLSAxKVxuICAgICAgcGFpclJhbmdlID0gW1tyb3cgLSAxLCBwcmV2aW91c0xpbmUubGVuZ3RoXSwgW3JvdywgMV1dXG4gICAgZWxzZSBpZiBjb2x1bW4gPT0gbGluZS5sZW5ndGhcbiAgICAgIHBhaXJSYW5nZSA9IFtbcm93LCBjb2x1bW4gLSAyXSwgW3JvdywgY29sdW1uXV1cbiAgICBlbHNlXG4gICAgICBwYWlyUmFuZ2UgPSBbW3JvdywgY29sdW1uIC0gMV0sIFtyb3csIGNvbHVtbiArIDFdXVxuICAgIHBhaXIgPSBAZWRpdG9yLmdldFRleHRJbkJ1ZmZlclJhbmdlKHBhaXJSYW5nZSlcbiAgICBAZWRpdG9yLnNldFRleHRJbkJ1ZmZlclJhbmdlKHBhaXJSYW5nZSwgKHBhaXJbMV0gb3IgJycpICsgcGFpclswXSlcblxuICAjIFRyYW5zcG9zZSB0aGUgd29yZCBhdCB0aGUgY3Vyc29yIHdpdGggdGhlIG5leHQgb25lLiBNb3ZlIHRvIHRoZSBlbmQgb2YgdGhlXG4gICMgbmV4dCB3b3JkLlxuICB0cmFuc3Bvc2VXb3JkczogLT5cbiAgICBAc2tpcE5vbldvcmRDaGFyYWN0ZXJzQmFja3dhcmQoKVxuXG4gICAgd29yZDFSYW5nZSA9IEBfd29yZFJhbmdlKClcbiAgICBAc2tpcFdvcmRDaGFyYWN0ZXJzRm9yd2FyZCgpXG4gICAgQHNraXBOb25Xb3JkQ2hhcmFjdGVyc0ZvcndhcmQoKVxuICAgIGlmIEBlZGl0b3IuZ2V0RW9mQnVmZmVyUG9zaXRpb24oKS5pc0VxdWFsKEBjdXJzb3IuZ2V0QnVmZmVyUG9zaXRpb24oKSlcbiAgICAgICMgTm8gc2Vjb25kIHdvcmQgLSBqdXN0IGdvIGJhY2suXG4gICAgICBAc2tpcE5vbldvcmRDaGFyYWN0ZXJzQmFja3dhcmQoKVxuICAgIGVsc2VcbiAgICAgIHdvcmQyUmFuZ2UgPSBAX3dvcmRSYW5nZSgpXG4gICAgICB3b3JkMSA9IEBlZGl0b3IuZ2V0VGV4dEluQnVmZmVyUmFuZ2Uod29yZDFSYW5nZSlcbiAgICAgIHdvcmQyID0gQGVkaXRvci5nZXRUZXh0SW5CdWZmZXJSYW5nZSh3b3JkMlJhbmdlKVxuXG4gICAgICBAZWRpdG9yLnNldFRleHRJbkJ1ZmZlclJhbmdlKHdvcmQyUmFuZ2UsIHdvcmQxKVxuICAgICAgQGVkaXRvci5zZXRUZXh0SW5CdWZmZXJSYW5nZSh3b3JkMVJhbmdlLCB3b3JkMilcbiAgICAgIEBjdXJzb3Iuc2V0QnVmZmVyUG9zaXRpb24od29yZDJSYW5nZVsxXSlcblxuICAjIFRyYW5zcG9zZSB0aGUgbGluZSBhdCB0aGUgY3Vyc29yIHdpdGggdGhlIG9uZSBhYm92ZSBpdC4gTW92ZSB0byB0aGVcbiAgIyBiZWdpbm5pbmcgb2YgdGhlIG5leHQgbGluZS5cbiAgdHJhbnNwb3NlTGluZXM6IC0+XG4gICAgcm93ID0gQGN1cnNvci5nZXRCdWZmZXJSb3coKVxuICAgIGlmIHJvdyA9PSAwXG4gICAgICBAX2VuZExpbmVJZk5lY2Vzc2FyeSgpXG4gICAgICBAY3Vyc29yLm1vdmVEb3duKClcbiAgICAgIHJvdyArPSAxXG4gICAgQF9lbmRMaW5lSWZOZWNlc3NhcnkoKVxuXG4gICAgbGluZVJhbmdlID0gW1tyb3csIDBdLCBbcm93ICsgMSwgMF1dXG4gICAgdGV4dCA9IEBlZGl0b3IuZ2V0VGV4dEluQnVmZmVyUmFuZ2UobGluZVJhbmdlKVxuICAgIEBlZGl0b3Iuc2V0VGV4dEluQnVmZmVyUmFuZ2UobGluZVJhbmdlLCAnJylcbiAgICBAZWRpdG9yLnNldFRleHRJbkJ1ZmZlclJhbmdlKFtbcm93IC0gMSwgMF0sIFtyb3cgLSAxLCAwXV0sIHRleHQpXG5cbiAgX3dvcmRSYW5nZTogLT5cbiAgICBAc2tpcFdvcmRDaGFyYWN0ZXJzQmFja3dhcmQoKVxuICAgIHJhbmdlID0gQGxvY2F0ZU5vbldvcmRDaGFyYWN0ZXJCYWNrd2FyZCgpXG4gICAgd29yZFN0YXJ0ID0gaWYgcmFuZ2UgdGhlbiByYW5nZS5lbmQgZWxzZSBbMCwgMF1cbiAgICByYW5nZSA9IEBsb2NhdGVOb25Xb3JkQ2hhcmFjdGVyRm9yd2FyZCgpXG4gICAgd29yZEVuZCA9IGlmIHJhbmdlIHRoZW4gcmFuZ2Uuc3RhcnQgZWxzZSBAZWRpdG9yLmdldEVvZkJ1ZmZlclBvc2l0aW9uKClcbiAgICBbd29yZFN0YXJ0LCB3b3JkRW5kXVxuXG4gIF9lbmRMaW5lSWZOZWNlc3Nhcnk6IC0+XG4gICAgcm93ID0gQGN1cnNvci5nZXRCdWZmZXJQb3NpdGlvbigpLnJvd1xuICAgIGlmIHJvdyA9PSBAZWRpdG9yLmdldExpbmVDb3VudCgpIC0gMVxuICAgICAgbGVuZ3RoID0gQGN1cnNvci5nZXRDdXJyZW50QnVmZmVyTGluZSgpLmxlbmd0aFxuICAgICAgQGVkaXRvci5zZXRUZXh0SW5CdWZmZXJSYW5nZShbW3JvdywgbGVuZ3RoXSwgW3JvdywgbGVuZ3RoXV0sIFwiXFxuXCIpXG5cbiAgX3NleHBGb3J3YXJkRnJvbTogKHBvaW50KSAtPlxuICAgIGVvYiA9IEBlZGl0b3IuZ2V0RW9mQnVmZmVyUG9zaXRpb24oKVxuICAgIHBvaW50ID0gQF9sb2NhdGVGb3J3YXJkRnJvbShwb2ludCwgL1tcXHcoKVtcXF17fSdcIl0vaSk/LnN0YXJ0IG9yIGVvYlxuICAgIGNoYXJhY3RlciA9IEBfbmV4dENoYXJhY3RlckZyb20ocG9pbnQpXG4gICAgaWYgT1BFTkVSUy5oYXNPd25Qcm9wZXJ0eShjaGFyYWN0ZXIpIG9yIENMT1NFUlMuaGFzT3duUHJvcGVydHkoY2hhcmFjdGVyKVxuICAgICAgcmVzdWx0ID0gbnVsbFxuICAgICAgc3RhY2sgPSBbXVxuICAgICAgcXVvdGVzID0gMFxuICAgICAgZW9mID0gQGVkaXRvci5nZXRFb2ZCdWZmZXJQb3NpdGlvbigpXG4gICAgICByZSA9IC9bXigpW1xcXXt9XCInYFxcXFxdK3xcXFxcLnxbKClbXFxde31cIidgXS9nXG4gICAgICBAZWRpdG9yLnNjYW5JbkJ1ZmZlclJhbmdlIHJlLCBbcG9pbnQsIGVvZl0sIChoaXQpID0+XG4gICAgICAgIGlmIGhpdC5tYXRjaFRleHQgPT0gc3RhY2tbc3RhY2subGVuZ3RoIC0gMV1cbiAgICAgICAgICBzdGFjay5wb3AoKVxuICAgICAgICAgIGlmIHN0YWNrLmxlbmd0aCA9PSAwXG4gICAgICAgICAgICByZXN1bHQgPSBoaXQucmFuZ2UuZW5kXG4gICAgICAgICAgICBoaXQuc3RvcCgpXG4gICAgICAgICAgZWxzZSBpZiAvXltcIidgXSQvLnRlc3QoaGl0Lm1hdGNoVGV4dClcbiAgICAgICAgICAgIHF1b3RlcyAtPSAxXG4gICAgICAgIGVsc2UgaWYgKGNsb3NlciA9IE9QRU5FUlNbaGl0Lm1hdGNoVGV4dF0pXG4gICAgICAgICAgdW5sZXNzIC9eW1wiJ2BdJC8udGVzdChjbG9zZXIpIGFuZCBxdW90ZXMgPiAwXG4gICAgICAgICAgICBzdGFjay5wdXNoKGNsb3NlcilcbiAgICAgICAgICAgIHF1b3RlcyArPSAxIGlmIC9eW1wiJ2BdJC8udGVzdChjbG9zZXIpXG4gICAgICAgIGVsc2UgaWYgQ0xPU0VSU1toaXQubWF0Y2hUZXh0XVxuICAgICAgICAgIGlmIHN0YWNrLmxlbmd0aCA9PSAwXG4gICAgICAgICAgICBoaXQuc3RvcCgpXG4gICAgICByZXN1bHQgb3IgcG9pbnRcbiAgICBlbHNlXG4gICAgICBAX2xvY2F0ZUZvcndhcmRGcm9tKHBvaW50LCAvXFxXL2kpPy5zdGFydCBvciBlb2JcblxuICBfc2V4cEJhY2t3YXJkRnJvbTogKHBvaW50KSAtPlxuICAgIHBvaW50ID0gQF9sb2NhdGVCYWNrd2FyZEZyb20ocG9pbnQsIC9bXFx3KClbXFxde30nXCJdL2kpPy5lbmQgb3IgQk9CXG4gICAgY2hhcmFjdGVyID0gQF9wcmV2aW91c0NoYXJhY3RlckZyb20ocG9pbnQpXG4gICAgaWYgT1BFTkVSUy5oYXNPd25Qcm9wZXJ0eShjaGFyYWN0ZXIpIG9yIENMT1NFUlMuaGFzT3duUHJvcGVydHkoY2hhcmFjdGVyKVxuICAgICAgcmVzdWx0ID0gbnVsbFxuICAgICAgc3RhY2sgPSBbXVxuICAgICAgcXVvdGVzID0gMFxuICAgICAgcmUgPSAvW14oKVtcXF17fVwiJ2BcXFxcXSt8XFxcXC58WygpW1xcXXt9XCInYF0vZ1xuICAgICAgQGVkaXRvci5iYWNrd2FyZHNTY2FuSW5CdWZmZXJSYW5nZSByZSwgW0JPQiwgcG9pbnRdLCAoaGl0KSA9PlxuICAgICAgICBpZiBoaXQubWF0Y2hUZXh0ID09IHN0YWNrW3N0YWNrLmxlbmd0aCAtIDFdXG4gICAgICAgICAgc3RhY2sucG9wKClcbiAgICAgICAgICBpZiBzdGFjay5sZW5ndGggPT0gMFxuICAgICAgICAgICAgcmVzdWx0ID0gaGl0LnJhbmdlLnN0YXJ0XG4gICAgICAgICAgICBoaXQuc3RvcCgpXG4gICAgICAgICAgZWxzZSBpZiAvXltcIidgXSQvLnRlc3QoaGl0Lm1hdGNoVGV4dClcbiAgICAgICAgICAgIHF1b3RlcyAtPSAxXG4gICAgICAgIGVsc2UgaWYgKG9wZW5lciA9IENMT1NFUlNbaGl0Lm1hdGNoVGV4dF0pXG4gICAgICAgICAgdW5sZXNzIC9eW1wiJ2BdJC8udGVzdChvcGVuZXIpIGFuZCBxdW90ZXMgPiAwXG4gICAgICAgICAgICBzdGFjay5wdXNoKG9wZW5lcilcbiAgICAgICAgICAgIHF1b3RlcyArPSAxIGlmIC9eW1wiJ2BdJC8udGVzdChvcGVuZXIpXG4gICAgICAgIGVsc2UgaWYgT1BFTkVSU1toaXQubWF0Y2hUZXh0XVxuICAgICAgICAgIGlmIHN0YWNrLmxlbmd0aCA9PSAwXG4gICAgICAgICAgICBoaXQuc3RvcCgpXG4gICAgICByZXN1bHQgb3IgcG9pbnRcbiAgICBlbHNlXG4gICAgICBAX2xvY2F0ZUJhY2t3YXJkRnJvbShwb2ludCwgL1xcVy9pKT8uZW5kIG9yIEJPQlxuXG4gIF9sb2NhdGVCYWNrd2FyZEZyb206IChwb2ludCwgcmVnRXhwKSAtPlxuICAgIHJlc3VsdCA9IG51bGxcbiAgICBAZWRpdG9yLmJhY2t3YXJkc1NjYW5JbkJ1ZmZlclJhbmdlIHJlZ0V4cCwgW0JPQiwgcG9pbnRdLCAoaGl0KSAtPlxuICAgICAgcmVzdWx0ID0gaGl0LnJhbmdlXG4gICAgcmVzdWx0XG5cbiAgX2xvY2F0ZUZvcndhcmRGcm9tOiAocG9pbnQsIHJlZ0V4cCkgLT5cbiAgICByZXN1bHQgPSBudWxsXG4gICAgZW9mID0gQGVkaXRvci5nZXRFb2ZCdWZmZXJQb3NpdGlvbigpXG4gICAgQGVkaXRvci5zY2FuSW5CdWZmZXJSYW5nZSByZWdFeHAsIFtwb2ludCwgZW9mXSwgKGhpdCkgLT5cbiAgICAgIHJlc3VsdCA9IGhpdC5yYW5nZVxuICAgIHJlc3VsdFxuXG4gIF9nZXRXb3JkQ2hhcmFjdGVyUmVnRXhwOiAtPlxuICAgIG5vbldvcmRDaGFyYWN0ZXJzID0gYXRvbS5jb25maWcuZ2V0KCdlZGl0b3Iubm9uV29yZENoYXJhY3RlcnMnKVxuICAgIG5ldyBSZWdFeHAoJ1teXFxcXHMnICsgZXNjYXBlUmVnRXhwKG5vbldvcmRDaGFyYWN0ZXJzKSArICddJylcblxuICBfZ2V0Tm9uV29yZENoYXJhY3RlclJlZ0V4cDogLT5cbiAgICBub25Xb3JkQ2hhcmFjdGVycyA9IGF0b20uY29uZmlnLmdldCgnZWRpdG9yLm5vbldvcmRDaGFyYWN0ZXJzJylcbiAgICBuZXcgUmVnRXhwKCdbXFxcXHMnICsgZXNjYXBlUmVnRXhwKG5vbldvcmRDaGFyYWN0ZXJzKSArICddJylcblxuICBfZ29UbzogKHBvaW50KSAtPlxuICAgIGlmIHBvaW50XG4gICAgICBAY3Vyc29yLnNldEJ1ZmZlclBvc2l0aW9uKHBvaW50KVxuICAgICAgdHJ1ZVxuICAgIGVsc2VcbiAgICAgIGZhbHNlXG5cbiMgU3RvbGVuIGZyb20gdW5kZXJzY29yZS1wbHVzLCB3aGljaCB3ZSBjYW4ndCBzZWVtIHRvIHJlcXVpcmUoKSBmcm9tIGEgcGFja2FnZVxuIyB3aXRob3V0IGRlcGVuZGluZyBvbiBhIHNlcGFyYXRlIGNvcHkgb2YgdGhlIHdob2xlIGxpYnJhcnkuXG5lc2NhcGVSZWdFeHAgPSAoc3RyaW5nKSAtPlxuICBpZiBzdHJpbmdcbiAgICBzdHJpbmcucmVwbGFjZSgvWy1cXC9cXFxcXiQqKz8uKCl8W1xcXXt9XS9nLCAnXFxcXCQmJylcbiAgZWxzZVxuICAgICcnXG5cbkJPQiA9IHtyb3c6IDAsIGNvbHVtbjogMH1cbiJdfQ==
