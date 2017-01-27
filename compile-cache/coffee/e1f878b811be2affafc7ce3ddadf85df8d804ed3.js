(function() {
  var BOB, CursorTools, escapeRegExp;

  CursorTools = (function() {
    function CursorTools(cursor) {
      this.cursor = cursor;
      this.editor = this.cursor.editor;
    }

    CursorTools.prototype.locateBackward = function(regExp) {
      var result;
      result = null;
      this.editor.backwardsScanInBufferRange(regExp, [BOB, this.cursor.getBufferPosition()], function(hit) {
        return result = hit.range;
      });
      return result;
    };

    CursorTools.prototype.locateForward = function(regExp) {
      var eof, result;
      result = null;
      eof = this.editor.getEofBufferPosition();
      this.editor.scanInBufferRange(regExp, [this.cursor.getBufferPosition(), eof], function(hit) {
        return result = hit.range;
      });
      return result;
    };

    CursorTools.prototype.locateWordCharacterBackward = function() {
      return this.locateBackward(this._getWordCharacterRegExp());
    };

    CursorTools.prototype.locateWordCharacterForward = function() {
      return this.locateForward(this._getWordCharacterRegExp());
    };

    CursorTools.prototype.locateNonWordCharacterBackward = function() {
      return this.locateBackward(this._getNonWordCharacterRegExp());
    };

    CursorTools.prototype.locateNonWordCharacterForward = function() {
      return this.locateForward(this._getNonWordCharacterRegExp());
    };

    CursorTools.prototype.goToMatchStartBackward = function(regExp) {
      var ref;
      return this._goTo((ref = this.locateBackward(regExp)) != null ? ref.start : void 0);
    };

    CursorTools.prototype.goToMatchStartForward = function(regExp) {
      var ref;
      return this._goTo((ref = this.locateForward(regExp)) != null ? ref.start : void 0);
    };

    CursorTools.prototype.goToMatchEndBackward = function(regExp) {
      var ref;
      return this._goTo((ref = this.locateBackward(regExp)) != null ? ref.end : void 0);
    };

    CursorTools.prototype.goToMatchEndForward = function(regExp) {
      var ref;
      return this._goTo((ref = this.locateForward(regExp)) != null ? ref.end : void 0);
    };

    CursorTools.prototype.skipCharactersBackward = function(characters) {
      var regexp;
      regexp = new RegExp("[^" + (escapeRegExp(characters)) + "]");
      return this.skipBackwardUntil(regexp);
    };

    CursorTools.prototype.skipCharactersForward = function(characters) {
      var regexp;
      regexp = new RegExp("[^" + (escapeRegExp(characters)) + "]");
      return this.skipForwardUntil(regexp);
    };

    CursorTools.prototype.skipWordCharactersBackward = function() {
      return this.skipBackwardUntil(this._getNonWordCharacterRegExp());
    };

    CursorTools.prototype.skipWordCharactersForward = function() {
      return this.skipForwardUntil(this._getNonWordCharacterRegExp());
    };

    CursorTools.prototype.skipNonWordCharactersBackward = function() {
      return this.skipBackwardUntil(this._getWordCharacterRegExp());
    };

    CursorTools.prototype.skipNonWordCharactersForward = function() {
      return this.skipForwardUntil(this._getWordCharacterRegExp());
    };

    CursorTools.prototype.skipBackwardUntil = function(regexp) {
      if (!this.goToMatchEndBackward(regexp)) {
        return this._goTo(BOB);
      }
    };

    CursorTools.prototype.skipForwardUntil = function(regexp) {
      if (!this.goToMatchStartForward(regexp)) {
        return this._goTo(this.editor.getEofBufferPosition());
      }
    };

    CursorTools.prototype.extractWord = function(cursorTools) {
      var range, word, wordEnd, wordRange;
      this.skipWordCharactersBackward();
      range = this.locateNonWordCharacterForward();
      wordEnd = range ? range.start : this.editor.getEofBufferPosition();
      wordRange = [this.cursor.getBufferPosition(), wordEnd];
      word = this.editor.getTextInBufferRange(wordRange);
      this.editor.setTextInBufferRange(wordRange, '');
      return word;
    };

    CursorTools.prototype.horizontalSpaceRange = function() {
      var end, start;
      this.skipCharactersBackward(' \t');
      start = this.cursor.getBufferPosition();
      this.skipCharactersForward(' \t');
      end = this.cursor.getBufferPosition();
      return [start, end];
    };

    CursorTools.prototype.endLineIfNecessary = function() {
      var length, row;
      row = this.cursor.getBufferPosition().row;
      if (row === this.editor.getLineCount() - 1) {
        length = this.cursor.getCurrentBufferLine().length;
        return this.editor.setTextInBufferRange([[row, length], [row, length]], "\n");
      }
    };

    CursorTools.prototype._getWordCharacterRegExp = function() {
      var nonWordCharacters;
      nonWordCharacters = atom.config.get('editor.nonWordCharacters');
      return new RegExp('[^\\s' + escapeRegExp(nonWordCharacters) + ']');
    };

    CursorTools.prototype._getNonWordCharacterRegExp = function() {
      var nonWordCharacters;
      nonWordCharacters = atom.config.get('editor.nonWordCharacters');
      return new RegExp('[\\s' + escapeRegExp(nonWordCharacters) + ']');
    };

    CursorTools.prototype._goTo = function(point) {
      if (point) {
        this.cursor.setBufferPosition(point);
        return true;
      } else {
        return false;
      }
    };

    return CursorTools;

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

  module.exports = CursorTools;

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL2hvbWUvamFrZS8uYXRvbS9wYWNrYWdlcy9lbWFjcy1wbHVzL2xpYi9jdXJzb3ItdG9vbHMuY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUNBO0FBQUEsTUFBQTs7RUFBTTtJQUNTLHFCQUFDLE1BQUQ7TUFBQyxJQUFDLENBQUEsU0FBRDtNQUNaLElBQUMsQ0FBQSxNQUFELEdBQVUsSUFBQyxDQUFBLE1BQU0sQ0FBQztJQURQOzswQkFNYixjQUFBLEdBQWdCLFNBQUMsTUFBRDtBQUNkLFVBQUE7TUFBQSxNQUFBLEdBQVM7TUFDVCxJQUFDLENBQUEsTUFBTSxDQUFDLDBCQUFSLENBQW1DLE1BQW5DLEVBQTJDLENBQUMsR0FBRCxFQUFNLElBQUMsQ0FBQSxNQUFNLENBQUMsaUJBQVIsQ0FBQSxDQUFOLENBQTNDLEVBQStFLFNBQUMsR0FBRDtlQUM3RSxNQUFBLEdBQVMsR0FBRyxDQUFDO01BRGdFLENBQS9FO2FBRUE7SUFKYzs7MEJBU2hCLGFBQUEsR0FBZSxTQUFDLE1BQUQ7QUFDYixVQUFBO01BQUEsTUFBQSxHQUFTO01BQ1QsR0FBQSxHQUFNLElBQUMsQ0FBQSxNQUFNLENBQUMsb0JBQVIsQ0FBQTtNQUNOLElBQUMsQ0FBQSxNQUFNLENBQUMsaUJBQVIsQ0FBMEIsTUFBMUIsRUFBa0MsQ0FBQyxJQUFDLENBQUEsTUFBTSxDQUFDLGlCQUFSLENBQUEsQ0FBRCxFQUE4QixHQUE5QixDQUFsQyxFQUFzRSxTQUFDLEdBQUQ7ZUFDcEUsTUFBQSxHQUFTLEdBQUcsQ0FBQztNQUR1RCxDQUF0RTthQUVBO0lBTGE7OzBCQVVmLDJCQUFBLEdBQTZCLFNBQUE7YUFDM0IsSUFBQyxDQUFBLGNBQUQsQ0FBZ0IsSUFBQyxDQUFBLHVCQUFELENBQUEsQ0FBaEI7SUFEMkI7OzBCQU03QiwwQkFBQSxHQUE0QixTQUFBO2FBQzFCLElBQUMsQ0FBQSxhQUFELENBQWUsSUFBQyxDQUFBLHVCQUFELENBQUEsQ0FBZjtJQUQwQjs7MEJBTTVCLDhCQUFBLEdBQWdDLFNBQUE7YUFDOUIsSUFBQyxDQUFBLGNBQUQsQ0FBZ0IsSUFBQyxDQUFBLDBCQUFELENBQUEsQ0FBaEI7SUFEOEI7OzBCQU1oQyw2QkFBQSxHQUErQixTQUFBO2FBQzdCLElBQUMsQ0FBQSxhQUFELENBQWUsSUFBQyxDQUFBLDBCQUFELENBQUEsQ0FBZjtJQUQ2Qjs7MEJBTS9CLHNCQUFBLEdBQXdCLFNBQUMsTUFBRDtBQUN0QixVQUFBO2FBQUEsSUFBQyxDQUFBLEtBQUQsa0RBQThCLENBQUUsY0FBaEM7SUFEc0I7OzBCQU14QixxQkFBQSxHQUF1QixTQUFDLE1BQUQ7QUFDckIsVUFBQTthQUFBLElBQUMsQ0FBQSxLQUFELGlEQUE2QixDQUFFLGNBQS9CO0lBRHFCOzswQkFNdkIsb0JBQUEsR0FBc0IsU0FBQyxNQUFEO0FBQ3BCLFVBQUE7YUFBQSxJQUFDLENBQUEsS0FBRCxrREFBOEIsQ0FBRSxZQUFoQztJQURvQjs7MEJBTXRCLG1CQUFBLEdBQXFCLFNBQUMsTUFBRDtBQUNuQixVQUFBO2FBQUEsSUFBQyxDQUFBLEtBQUQsaURBQTZCLENBQUUsWUFBL0I7SUFEbUI7OzBCQU1yQixzQkFBQSxHQUF3QixTQUFDLFVBQUQ7QUFDdEIsVUFBQTtNQUFBLE1BQUEsR0FBYSxJQUFBLE1BQUEsQ0FBTyxJQUFBLEdBQUksQ0FBQyxZQUFBLENBQWEsVUFBYixDQUFELENBQUosR0FBOEIsR0FBckM7YUFDYixJQUFDLENBQUEsaUJBQUQsQ0FBbUIsTUFBbkI7SUFGc0I7OzBCQU94QixxQkFBQSxHQUF1QixTQUFDLFVBQUQ7QUFDckIsVUFBQTtNQUFBLE1BQUEsR0FBYSxJQUFBLE1BQUEsQ0FBTyxJQUFBLEdBQUksQ0FBQyxZQUFBLENBQWEsVUFBYixDQUFELENBQUosR0FBOEIsR0FBckM7YUFDYixJQUFDLENBQUEsZ0JBQUQsQ0FBa0IsTUFBbEI7SUFGcUI7OzBCQU92QiwwQkFBQSxHQUE0QixTQUFBO2FBQzFCLElBQUMsQ0FBQSxpQkFBRCxDQUFtQixJQUFDLENBQUEsMEJBQUQsQ0FBQSxDQUFuQjtJQUQwQjs7MEJBTTVCLHlCQUFBLEdBQTJCLFNBQUE7YUFDekIsSUFBQyxDQUFBLGdCQUFELENBQWtCLElBQUMsQ0FBQSwwQkFBRCxDQUFBLENBQWxCO0lBRHlCOzswQkFNM0IsNkJBQUEsR0FBK0IsU0FBQTthQUM3QixJQUFDLENBQUEsaUJBQUQsQ0FBbUIsSUFBQyxDQUFBLHVCQUFELENBQUEsQ0FBbkI7SUFENkI7OzBCQU0vQiw0QkFBQSxHQUE4QixTQUFBO2FBQzVCLElBQUMsQ0FBQSxnQkFBRCxDQUFrQixJQUFDLENBQUEsdUJBQUQsQ0FBQSxDQUFsQjtJQUQ0Qjs7MEJBTTlCLGlCQUFBLEdBQW1CLFNBQUMsTUFBRDtNQUNqQixJQUFHLENBQUksSUFBQyxDQUFBLG9CQUFELENBQXNCLE1BQXRCLENBQVA7ZUFDRSxJQUFDLENBQUEsS0FBRCxDQUFPLEdBQVAsRUFERjs7SUFEaUI7OzBCQU9uQixnQkFBQSxHQUFrQixTQUFDLE1BQUQ7TUFDaEIsSUFBRyxDQUFJLElBQUMsQ0FBQSxxQkFBRCxDQUF1QixNQUF2QixDQUFQO2VBQ0UsSUFBQyxDQUFBLEtBQUQsQ0FBTyxJQUFDLENBQUEsTUFBTSxDQUFDLG9CQUFSLENBQUEsQ0FBUCxFQURGOztJQURnQjs7MEJBUWxCLFdBQUEsR0FBYSxTQUFDLFdBQUQ7QUFDWCxVQUFBO01BQUEsSUFBQyxDQUFBLDBCQUFELENBQUE7TUFDQSxLQUFBLEdBQVEsSUFBQyxDQUFBLDZCQUFELENBQUE7TUFDUixPQUFBLEdBQWEsS0FBSCxHQUFjLEtBQUssQ0FBQyxLQUFwQixHQUErQixJQUFDLENBQUEsTUFBTSxDQUFDLG9CQUFSLENBQUE7TUFDekMsU0FBQSxHQUFZLENBQUMsSUFBQyxDQUFBLE1BQU0sQ0FBQyxpQkFBUixDQUFBLENBQUQsRUFBOEIsT0FBOUI7TUFDWixJQUFBLEdBQU8sSUFBQyxDQUFBLE1BQU0sQ0FBQyxvQkFBUixDQUE2QixTQUE3QjtNQUNQLElBQUMsQ0FBQSxNQUFNLENBQUMsb0JBQVIsQ0FBNkIsU0FBN0IsRUFBd0MsRUFBeEM7YUFDQTtJQVBXOzswQkFTYixvQkFBQSxHQUFzQixTQUFBO0FBQ3BCLFVBQUE7TUFBQSxJQUFDLENBQUEsc0JBQUQsQ0FBd0IsS0FBeEI7TUFDQSxLQUFBLEdBQVEsSUFBQyxDQUFBLE1BQU0sQ0FBQyxpQkFBUixDQUFBO01BQ1IsSUFBQyxDQUFBLHFCQUFELENBQXVCLEtBQXZCO01BQ0EsR0FBQSxHQUFNLElBQUMsQ0FBQSxNQUFNLENBQUMsaUJBQVIsQ0FBQTthQUNOLENBQUMsS0FBRCxFQUFRLEdBQVI7SUFMb0I7OzBCQU90QixrQkFBQSxHQUFvQixTQUFBO0FBQ2xCLFVBQUE7TUFBQSxHQUFBLEdBQU0sSUFBQyxDQUFBLE1BQU0sQ0FBQyxpQkFBUixDQUFBLENBQTJCLENBQUM7TUFDbEMsSUFBRyxHQUFBLEtBQU8sSUFBQyxDQUFBLE1BQU0sQ0FBQyxZQUFSLENBQUEsQ0FBQSxHQUF5QixDQUFuQztRQUNFLE1BQUEsR0FBUyxJQUFDLENBQUEsTUFBTSxDQUFDLG9CQUFSLENBQUEsQ0FBOEIsQ0FBQztlQUN4QyxJQUFDLENBQUEsTUFBTSxDQUFDLG9CQUFSLENBQTZCLENBQUMsQ0FBQyxHQUFELEVBQU0sTUFBTixDQUFELEVBQWdCLENBQUMsR0FBRCxFQUFNLE1BQU4sQ0FBaEIsQ0FBN0IsRUFBNkQsSUFBN0QsRUFGRjs7SUFGa0I7OzBCQU1wQix1QkFBQSxHQUF5QixTQUFBO0FBQ3ZCLFVBQUE7TUFBQSxpQkFBQSxHQUFvQixJQUFJLENBQUMsTUFBTSxDQUFDLEdBQVosQ0FBZ0IsMEJBQWhCO2FBQ2hCLElBQUEsTUFBQSxDQUFPLE9BQUEsR0FBVSxZQUFBLENBQWEsaUJBQWIsQ0FBVixHQUE0QyxHQUFuRDtJQUZtQjs7MEJBSXpCLDBCQUFBLEdBQTRCLFNBQUE7QUFDMUIsVUFBQTtNQUFBLGlCQUFBLEdBQW9CLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBWixDQUFnQiwwQkFBaEI7YUFDaEIsSUFBQSxNQUFBLENBQU8sTUFBQSxHQUFTLFlBQUEsQ0FBYSxpQkFBYixDQUFULEdBQTJDLEdBQWxEO0lBRnNCOzswQkFJNUIsS0FBQSxHQUFPLFNBQUMsS0FBRDtNQUNMLElBQUcsS0FBSDtRQUNFLElBQUMsQ0FBQSxNQUFNLENBQUMsaUJBQVIsQ0FBMEIsS0FBMUI7ZUFDQSxLQUZGO09BQUEsTUFBQTtlQUlFLE1BSkY7O0lBREs7Ozs7OztFQVNULFlBQUEsR0FBZSxTQUFDLE1BQUQ7SUFDYixJQUFHLE1BQUg7YUFDRSxNQUFNLENBQUMsT0FBUCxDQUFlLHdCQUFmLEVBQXlDLE1BQXpDLEVBREY7S0FBQSxNQUFBO2FBR0UsR0FIRjs7RUFEYTs7RUFNZixHQUFBLEdBQU07SUFBQyxHQUFBLEVBQUssQ0FBTjtJQUFTLE1BQUEsRUFBUSxDQUFqQjs7O0VBRU4sTUFBTSxDQUFDLE9BQVAsR0FBaUI7QUE5S2pCIiwic291cmNlc0NvbnRlbnQiOlsiIyBXcmFwcyBhIEN1cnNvciB0byBwcm92aWRlIGEgbmljZXIgQVBJIGZvciBjb21tb24gb3BlcmF0aW9ucy5cbmNsYXNzIEN1cnNvclRvb2xzXG4gIGNvbnN0cnVjdG9yOiAoQGN1cnNvcikgLT5cbiAgICBAZWRpdG9yID0gQGN1cnNvci5lZGl0b3JcblxuICAjIExvb2sgZm9yIHRoZSBwcmV2aW91cyBvY2N1cnJlbmNlIG9mIHRoZSBnaXZlbiByZWdleHAuXG4gICNcbiAgIyBSZXR1cm4gYSBSYW5nZSBpZiBmb3VuZCwgbnVsbCBvdGhlcndpc2UuIFRoaXMgZG9lcyBub3QgbW92ZSB0aGUgY3Vyc29yLlxuICBsb2NhdGVCYWNrd2FyZDogKHJlZ0V4cCkgLT5cbiAgICByZXN1bHQgPSBudWxsXG4gICAgQGVkaXRvci5iYWNrd2FyZHNTY2FuSW5CdWZmZXJSYW5nZSByZWdFeHAsIFtCT0IsIEBjdXJzb3IuZ2V0QnVmZmVyUG9zaXRpb24oKV0sIChoaXQpIC0+XG4gICAgICByZXN1bHQgPSBoaXQucmFuZ2VcbiAgICByZXN1bHRcblxuICAjIExvb2sgZm9yIHRoZSBuZXh0IG9jY3VycmVuY2Ugb2YgdGhlIGdpdmVuIHJlZ2V4cC5cbiAgI1xuICAjIFJldHVybiBhIFJhbmdlIGlmIGZvdW5kLCBudWxsIG90aGVyd2lzZS4gVGhpcyBkb2VzIG5vdCBtb3ZlIHRoZSBjdXJzb3IuXG4gIGxvY2F0ZUZvcndhcmQ6IChyZWdFeHApIC0+XG4gICAgcmVzdWx0ID0gbnVsbFxuICAgIGVvZiA9IEBlZGl0b3IuZ2V0RW9mQnVmZmVyUG9zaXRpb24oKVxuICAgIEBlZGl0b3Iuc2NhbkluQnVmZmVyUmFuZ2UgcmVnRXhwLCBbQGN1cnNvci5nZXRCdWZmZXJQb3NpdGlvbigpLCBlb2ZdLCAoaGl0KSAtPlxuICAgICAgcmVzdWx0ID0gaGl0LnJhbmdlXG4gICAgcmVzdWx0XG5cbiAgIyBMb29rIGZvciB0aGUgcHJldmlvdXMgd29yZCBjaGFyYWN0ZXIuXG4gICNcbiAgIyBSZXR1cm4gYSBSYW5nZSBpZiBmb3VuZCwgbnVsbCBvdGhlcndpc2UuIFRoaXMgZG9lcyBub3QgbW92ZSB0aGUgY3Vyc29yLlxuICBsb2NhdGVXb3JkQ2hhcmFjdGVyQmFja3dhcmQ6IC0+XG4gICAgQGxvY2F0ZUJhY2t3YXJkIEBfZ2V0V29yZENoYXJhY3RlclJlZ0V4cCgpXG5cbiAgIyBMb29rIGZvciB0aGUgbmV4dCB3b3JkIGNoYXJhY3Rlci5cbiAgI1xuICAjIFJldHVybiBhIFJhbmdlIGlmIGZvdW5kLCBudWxsIG90aGVyd2lzZS4gVGhpcyBkb2VzIG5vdCBtb3ZlIHRoZSBjdXJzb3IuXG4gIGxvY2F0ZVdvcmRDaGFyYWN0ZXJGb3J3YXJkOiAtPlxuICAgIEBsb2NhdGVGb3J3YXJkIEBfZ2V0V29yZENoYXJhY3RlclJlZ0V4cCgpXG5cbiAgIyBMb29rIGZvciB0aGUgcHJldmlvdXMgbm9ud29yZCBjaGFyYWN0ZXIuXG4gICNcbiAgIyBSZXR1cm4gYSBSYW5nZSBpZiBmb3VuZCwgbnVsbCBvdGhlcndpc2UuIFRoaXMgZG9lcyBub3QgbW92ZSB0aGUgY3Vyc29yLlxuICBsb2NhdGVOb25Xb3JkQ2hhcmFjdGVyQmFja3dhcmQ6IC0+XG4gICAgQGxvY2F0ZUJhY2t3YXJkIEBfZ2V0Tm9uV29yZENoYXJhY3RlclJlZ0V4cCgpXG5cbiAgIyBMb29rIGZvciB0aGUgbmV4dCBub253b3JkIGNoYXJhY3Rlci5cbiAgI1xuICAjIFJldHVybiBhIFJhbmdlIGlmIGZvdW5kLCBudWxsIG90aGVyd2lzZS4gVGhpcyBkb2VzIG5vdCBtb3ZlIHRoZSBjdXJzb3IuXG4gIGxvY2F0ZU5vbldvcmRDaGFyYWN0ZXJGb3J3YXJkOiAtPlxuICAgIEBsb2NhdGVGb3J3YXJkIEBfZ2V0Tm9uV29yZENoYXJhY3RlclJlZ0V4cCgpXG5cbiAgIyBNb3ZlIHRvIHRoZSBzdGFydCBvZiB0aGUgcHJldmlvdXMgb2NjdXJyZW5jZSBvZiB0aGUgZ2l2ZW4gcmVnZXhwLlxuICAjXG4gICMgUmV0dXJuIHRydWUgaWYgZm91bmQsIGZhbHNlIG90aGVyd2lzZS5cbiAgZ29Ub01hdGNoU3RhcnRCYWNrd2FyZDogKHJlZ0V4cCkgLT5cbiAgICBAX2dvVG8gQGxvY2F0ZUJhY2t3YXJkKHJlZ0V4cCk/LnN0YXJ0XG5cbiAgIyBNb3ZlIHRvIHRoZSBzdGFydCBvZiB0aGUgbmV4dCBvY2N1cnJlbmNlIG9mIHRoZSBnaXZlbiByZWdleHAuXG4gICNcbiAgIyBSZXR1cm4gdHJ1ZSBpZiBmb3VuZCwgZmFsc2Ugb3RoZXJ3aXNlLlxuICBnb1RvTWF0Y2hTdGFydEZvcndhcmQ6IChyZWdFeHApIC0+XG4gICAgQF9nb1RvIEBsb2NhdGVGb3J3YXJkKHJlZ0V4cCk/LnN0YXJ0XG5cbiAgIyBNb3ZlIHRvIHRoZSBlbmQgb2YgdGhlIHByZXZpb3VzIG9jY3VycmVuY2Ugb2YgdGhlIGdpdmVuIHJlZ2V4cC5cbiAgI1xuICAjIFJldHVybiB0cnVlIGlmIGZvdW5kLCBmYWxzZSBvdGhlcndpc2UuXG4gIGdvVG9NYXRjaEVuZEJhY2t3YXJkOiAocmVnRXhwKSAtPlxuICAgIEBfZ29UbyBAbG9jYXRlQmFja3dhcmQocmVnRXhwKT8uZW5kXG5cbiAgIyBNb3ZlIHRvIHRoZSBlbmQgb2YgdGhlIG5leHQgb2NjdXJyZW5jZSBvZiB0aGUgZ2l2ZW4gcmVnZXhwLlxuICAjXG4gICMgUmV0dXJuIHRydWUgaWYgZm91bmQsIGZhbHNlIG90aGVyd2lzZS5cbiAgZ29Ub01hdGNoRW5kRm9yd2FyZDogKHJlZ0V4cCkgLT5cbiAgICBAX2dvVG8gQGxvY2F0ZUZvcndhcmQocmVnRXhwKT8uZW5kXG5cbiAgIyBTa2lwIGJhY2t3YXJkcyBvdmVyIHRoZSBnaXZlbiBjaGFyYWN0ZXJzLlxuICAjXG4gICMgSWYgdGhlIGVuZCBvZiB0aGUgYnVmZmVyIGlzIHJlYWNoZWQsIHJlbWFpbiB0aGVyZS5cbiAgc2tpcENoYXJhY3RlcnNCYWNrd2FyZDogKGNoYXJhY3RlcnMpIC0+XG4gICAgcmVnZXhwID0gbmV3IFJlZ0V4cChcIlteI3tlc2NhcGVSZWdFeHAoY2hhcmFjdGVycyl9XVwiKVxuICAgIEBza2lwQmFja3dhcmRVbnRpbChyZWdleHApXG5cbiAgIyBTa2lwIGZvcndhcmRzIG92ZXIgdGhlIGdpdmVuIGNoYXJhY3RlcnMuXG4gICNcbiAgIyBJZiB0aGUgZW5kIG9mIHRoZSBidWZmZXIgaXMgcmVhY2hlZCwgcmVtYWluIHRoZXJlLlxuICBza2lwQ2hhcmFjdGVyc0ZvcndhcmQ6IChjaGFyYWN0ZXJzKSAtPlxuICAgIHJlZ2V4cCA9IG5ldyBSZWdFeHAoXCJbXiN7ZXNjYXBlUmVnRXhwKGNoYXJhY3RlcnMpfV1cIilcbiAgICBAc2tpcEZvcndhcmRVbnRpbChyZWdleHApXG5cbiAgIyBTa2lwIGJhY2t3YXJkcyBvdmVyIGFueSB3b3JkIGNoYXJhY3RlcnMuXG4gICNcbiAgIyBJZiB0aGUgYmVnaW5uaW5nIG9mIHRoZSBidWZmZXIgaXMgcmVhY2hlZCwgcmVtYWluIHRoZXJlLlxuICBza2lwV29yZENoYXJhY3RlcnNCYWNrd2FyZDogLT5cbiAgICBAc2tpcEJhY2t3YXJkVW50aWwoQF9nZXROb25Xb3JkQ2hhcmFjdGVyUmVnRXhwKCkpXG5cbiAgIyBTa2lwIGZvcndhcmRzIG92ZXIgYW55IHdvcmQgY2hhcmFjdGVycy5cbiAgI1xuICAjIElmIHRoZSBlbmQgb2YgdGhlIGJ1ZmZlciBpcyByZWFjaGVkLCByZW1haW4gdGhlcmUuXG4gIHNraXBXb3JkQ2hhcmFjdGVyc0ZvcndhcmQ6IC0+XG4gICAgQHNraXBGb3J3YXJkVW50aWwoQF9nZXROb25Xb3JkQ2hhcmFjdGVyUmVnRXhwKCkpXG5cbiAgIyBTa2lwIGJhY2t3YXJkcyBvdmVyIGFueSBub24td29yZCBjaGFyYWN0ZXJzLlxuICAjXG4gICMgSWYgdGhlIGJlZ2lubmluZyBvZiB0aGUgYnVmZmVyIGlzIHJlYWNoZWQsIHJlbWFpbiB0aGVyZS5cbiAgc2tpcE5vbldvcmRDaGFyYWN0ZXJzQmFja3dhcmQ6IC0+XG4gICAgQHNraXBCYWNrd2FyZFVudGlsKEBfZ2V0V29yZENoYXJhY3RlclJlZ0V4cCgpKVxuXG4gICMgU2tpcCBmb3J3YXJkcyBvdmVyIGFueSBub24td29yZCBjaGFyYWN0ZXJzLlxuICAjXG4gICMgSWYgdGhlIGVuZCBvZiB0aGUgYnVmZmVyIGlzIHJlYWNoZWQsIHJlbWFpbiB0aGVyZS5cbiAgc2tpcE5vbldvcmRDaGFyYWN0ZXJzRm9yd2FyZDogLT5cbiAgICBAc2tpcEZvcndhcmRVbnRpbChAX2dldFdvcmRDaGFyYWN0ZXJSZWdFeHAoKSlcblxuICAjIFNraXAgb3ZlciBjaGFyYWN0ZXJzIHVudGlsIHRoZSBwcmV2aW91cyBvY2N1cnJlbmNlIG9mIHRoZSBnaXZlbiByZWdleHAuXG4gICNcbiAgIyBJZiB0aGUgYmVnaW5uaW5nIG9mIHRoZSBidWZmZXIgaXMgcmVhY2hlZCwgcmVtYWluIHRoZXJlLlxuICBza2lwQmFja3dhcmRVbnRpbDogKHJlZ2V4cCkgLT5cbiAgICBpZiBub3QgQGdvVG9NYXRjaEVuZEJhY2t3YXJkKHJlZ2V4cClcbiAgICAgIEBfZ29UbyBCT0JcblxuICAjIFNraXAgb3ZlciBjaGFyYWN0ZXJzIHVudGlsIHRoZSBuZXh0IG9jY3VycmVuY2Ugb2YgdGhlIGdpdmVuIHJlZ2V4cC5cbiAgI1xuICAjIElmIHRoZSBlbmQgb2YgdGhlIGJ1ZmZlciBpcyByZWFjaGVkLCByZW1haW4gdGhlcmUuXG4gIHNraXBGb3J3YXJkVW50aWw6IChyZWdleHApIC0+XG4gICAgaWYgbm90IEBnb1RvTWF0Y2hTdGFydEZvcndhcmQocmVnZXhwKVxuICAgICAgQF9nb1RvIEBlZGl0b3IuZ2V0RW9mQnVmZmVyUG9zaXRpb24oKVxuXG4gICMgRGVsZXRlIGFuZCByZXR1cm4gdGhlIHdvcmQgYXQgdGhlIGN1cnNvci5cbiAgI1xuICAjIElmIG5vdCBpbiBvciBhdCB0aGUgc3RhcnQgb3IgZW5kIG9mIGEgd29yZCwgcmV0dXJuIHRoZSBlbXB0eSBzdHJpbmcgYW5kXG4gICMgbGVhdmUgdGhlIGJ1ZmZlciB1bm1vZGlmaWVkLlxuICBleHRyYWN0V29yZDogKGN1cnNvclRvb2xzKSAtPlxuICAgIEBza2lwV29yZENoYXJhY3RlcnNCYWNrd2FyZCgpXG4gICAgcmFuZ2UgPSBAbG9jYXRlTm9uV29yZENoYXJhY3RlckZvcndhcmQoKVxuICAgIHdvcmRFbmQgPSBpZiByYW5nZSB0aGVuIHJhbmdlLnN0YXJ0IGVsc2UgQGVkaXRvci5nZXRFb2ZCdWZmZXJQb3NpdGlvbigpXG4gICAgd29yZFJhbmdlID0gW0BjdXJzb3IuZ2V0QnVmZmVyUG9zaXRpb24oKSwgd29yZEVuZF1cbiAgICB3b3JkID0gQGVkaXRvci5nZXRUZXh0SW5CdWZmZXJSYW5nZSh3b3JkUmFuZ2UpXG4gICAgQGVkaXRvci5zZXRUZXh0SW5CdWZmZXJSYW5nZSh3b3JkUmFuZ2UsICcnKVxuICAgIHdvcmRcblxuICBob3Jpem9udGFsU3BhY2VSYW5nZTogLT5cbiAgICBAc2tpcENoYXJhY3RlcnNCYWNrd2FyZCgnIFxcdCcpXG4gICAgc3RhcnQgPSBAY3Vyc29yLmdldEJ1ZmZlclBvc2l0aW9uKClcbiAgICBAc2tpcENoYXJhY3RlcnNGb3J3YXJkKCcgXFx0JylcbiAgICBlbmQgPSBAY3Vyc29yLmdldEJ1ZmZlclBvc2l0aW9uKClcbiAgICBbc3RhcnQsIGVuZF1cblxuICBlbmRMaW5lSWZOZWNlc3Nhcnk6IC0+XG4gICAgcm93ID0gQGN1cnNvci5nZXRCdWZmZXJQb3NpdGlvbigpLnJvd1xuICAgIGlmIHJvdyA9PSBAZWRpdG9yLmdldExpbmVDb3VudCgpIC0gMVxuICAgICAgbGVuZ3RoID0gQGN1cnNvci5nZXRDdXJyZW50QnVmZmVyTGluZSgpLmxlbmd0aFxuICAgICAgQGVkaXRvci5zZXRUZXh0SW5CdWZmZXJSYW5nZShbW3JvdywgbGVuZ3RoXSwgW3JvdywgbGVuZ3RoXV0sIFwiXFxuXCIpXG5cbiAgX2dldFdvcmRDaGFyYWN0ZXJSZWdFeHA6IC0+XG4gICAgbm9uV29yZENoYXJhY3RlcnMgPSBhdG9tLmNvbmZpZy5nZXQoJ2VkaXRvci5ub25Xb3JkQ2hhcmFjdGVycycpXG4gICAgbmV3IFJlZ0V4cCgnW15cXFxccycgKyBlc2NhcGVSZWdFeHAobm9uV29yZENoYXJhY3RlcnMpICsgJ10nKVxuXG4gIF9nZXROb25Xb3JkQ2hhcmFjdGVyUmVnRXhwOiAtPlxuICAgIG5vbldvcmRDaGFyYWN0ZXJzID0gYXRvbS5jb25maWcuZ2V0KCdlZGl0b3Iubm9uV29yZENoYXJhY3RlcnMnKVxuICAgIG5ldyBSZWdFeHAoJ1tcXFxccycgKyBlc2NhcGVSZWdFeHAobm9uV29yZENoYXJhY3RlcnMpICsgJ10nKVxuXG4gIF9nb1RvOiAocG9pbnQpIC0+XG4gICAgaWYgcG9pbnRcbiAgICAgIEBjdXJzb3Iuc2V0QnVmZmVyUG9zaXRpb24ocG9pbnQpXG4gICAgICB0cnVlXG4gICAgZWxzZVxuICAgICAgZmFsc2VcblxuIyBTdG9sZW4gZnJvbSB1bmRlcnNjb3JlLXBsdXMsIHdoaWNoIHdlIGNhbid0IHNlZW0gdG8gcmVxdWlyZSgpIGZyb20gYSBwYWNrYWdlXG4jIHdpdGhvdXQgZGVwZW5kaW5nIG9uIGEgc2VwYXJhdGUgY29weSBvZiB0aGUgd2hvbGUgbGlicmFyeS5cbmVzY2FwZVJlZ0V4cCA9IChzdHJpbmcpIC0+XG4gIGlmIHN0cmluZ1xuICAgIHN0cmluZy5yZXBsYWNlKC9bLVxcL1xcXFxeJCorPy4oKXxbXFxde31dL2csICdcXFxcJCYnKVxuICBlbHNlXG4gICAgJydcblxuQk9CID0ge3JvdzogMCwgY29sdW1uOiAwfVxuXG5tb2R1bGUuZXhwb3J0cyA9IEN1cnNvclRvb2xzXG4iXX0=
