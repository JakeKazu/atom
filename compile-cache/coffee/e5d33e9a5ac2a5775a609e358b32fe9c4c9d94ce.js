(function() {
  var CompositeDisposable, Mark, Point, State, ref;

  ref = require('atom'), CompositeDisposable = ref.CompositeDisposable, Point = ref.Point;

  State = require('./state');

  Mark = (function() {
    Mark.deactivatable = [];

    Mark.deactivatePending = function() {
      var i, len, mark, ref1;
      ref1 = this.deactivatable;
      for (i = 0, len = ref1.length; i < len; i++) {
        mark = ref1[i];
        mark.deactivate();
      }
      return this.deactivatable.length = 0;
    };

    function Mark(cursor) {
      this.cursor = cursor;
      this.editor = cursor.editor;
      this.marker = this.editor.markBufferPosition(cursor.getBufferPosition());
      this.active = false;
      this.updating = false;
    }

    Mark.prototype.destroy = function() {
      if (this.active) {
        this.deactivate();
      }
      return this.marker.destroy();
    };

    Mark.prototype.set = function(point) {
      if (point == null) {
        point = this.cursor.getBufferPosition();
      }
      this.deactivate();
      this.marker.setHeadBufferPosition(point);
      this._updateSelection();
      return this;
    };

    Mark.prototype.getBufferPosition = function() {
      return this.marker.getHeadBufferPosition();
    };

    Mark.prototype.activate = function() {
      if (!this.active) {
        this.activeSubscriptions = new CompositeDisposable;
        this.activeSubscriptions.add(this.cursor.onDidChangePosition((function(_this) {
          return function(event) {
            return _this._updateSelection(event);
          };
        })(this)));
        this.activeSubscriptions.add(atom.commands.onDidDispatch((function(_this) {
          return function(event) {
            return _this._updateSelection(event);
          };
        })(this)));
        this.activeSubscriptions.add(this.editor.getBuffer().onDidChange((function(_this) {
          return function(event) {
            if (!(_this._isIndent(event) || _this._isOutdent(event))) {
              if (State.isDuringCommand) {
                return Mark.deactivatable.push(_this);
              } else {
                return _this.deactivate();
              }
            }
          };
        })(this)));
        return this.active = true;
      }
    };

    Mark.prototype.deactivate = function() {
      if (this.active) {
        this.activeSubscriptions.dispose();
        this.active = false;
      }
      return this.cursor.clearSelection();
    };

    Mark.prototype.isActive = function() {
      return this.active;
    };

    Mark.prototype.exchange = function() {
      var position;
      position = this.marker.getHeadBufferPosition();
      this.set().activate();
      return this.cursor.setBufferPosition(position);
    };

    Mark.prototype._updateSelection = function(event) {
      var head, tail;
      if (!this.updating) {
        this.updating = true;
        try {
          head = this.cursor.getBufferPosition();
          tail = this.marker.getHeadBufferPosition();
          return this.setSelectionRange(head, tail);
        } finally {
          this.updating = false;
        }
      }
    };

    Mark.prototype.getSelectionRange = function() {
      return this.cursor.selection.getBufferRange();
    };

    Mark.prototype.setSelectionRange = function(head, tail) {
      var reversed;
      reversed = Point.min(head, tail) === head;
      return this.cursor.selection.setBufferRange([head, tail], {
        reversed: reversed
      });
    };

    Mark.prototype._isIndent = function(event) {
      return this._isIndentOutdent(event.newRange, event.newText);
    };

    Mark.prototype._isOutdent = function(event) {
      return this._isIndentOutdent(event.oldRange, event.oldText);
    };

    Mark.prototype._isIndentOutdent = function(range, text) {
      var diff, tabLength;
      tabLength = this.editor.getTabLength();
      diff = range.end.column - range.start.column;
      if (diff === this.editor.getTabLength() && range.start.row === range.end.row && this._checkTextForSpaces(text, tabLength)) {
        return true;
      }
    };

    Mark.prototype._checkTextForSpaces = function(text, tabSize) {
      var ch, i, len;
      if (!(text && text.length === tabSize)) {
        return false;
      }
      for (i = 0, len = text.length; i < len; i++) {
        ch = text[i];
        if (ch !== " ") {
          return false;
        }
      }
      return true;
    };

    return Mark;

  })();

  module.exports = Mark;

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL2hvbWUvamFrZS8uYXRvbS9wYWNrYWdlcy9hdG9taWMtZW1hY3MvbGliL21hcmsuY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FBQUEsTUFBQTs7RUFBQSxNQUErQixPQUFBLENBQVEsTUFBUixDQUEvQixFQUFDLDZDQUFELEVBQXNCOztFQUN0QixLQUFBLEdBQVEsT0FBQSxDQUFRLFNBQVI7O0VBYUY7SUFDSixJQUFDLENBQUEsYUFBRCxHQUFpQjs7SUFFakIsSUFBQyxDQUFBLGlCQUFELEdBQW9CLFNBQUE7QUFDbEIsVUFBQTtBQUFBO0FBQUEsV0FBQSxzQ0FBQTs7UUFDRSxJQUFJLENBQUMsVUFBTCxDQUFBO0FBREY7YUFFQSxJQUFDLENBQUEsYUFBYSxDQUFDLE1BQWYsR0FBd0I7SUFITjs7SUFLUCxjQUFDLE1BQUQ7TUFDWCxJQUFDLENBQUEsTUFBRCxHQUFVO01BQ1YsSUFBQyxDQUFBLE1BQUQsR0FBVSxNQUFNLENBQUM7TUFDakIsSUFBQyxDQUFBLE1BQUQsR0FBVSxJQUFDLENBQUEsTUFBTSxDQUFDLGtCQUFSLENBQTJCLE1BQU0sQ0FBQyxpQkFBUCxDQUFBLENBQTNCO01BQ1YsSUFBQyxDQUFBLE1BQUQsR0FBVTtNQUNWLElBQUMsQ0FBQSxRQUFELEdBQVk7SUFMRDs7bUJBT2IsT0FBQSxHQUFTLFNBQUE7TUFDUCxJQUFpQixJQUFDLENBQUEsTUFBbEI7UUFBQSxJQUFDLENBQUEsVUFBRCxDQUFBLEVBQUE7O2FBQ0EsSUFBQyxDQUFBLE1BQU0sQ0FBQyxPQUFSLENBQUE7SUFGTzs7bUJBSVQsR0FBQSxHQUFLLFNBQUMsS0FBRDs7UUFBQyxRQUFNLElBQUMsQ0FBQSxNQUFNLENBQUMsaUJBQVIsQ0FBQTs7TUFDVixJQUFDLENBQUEsVUFBRCxDQUFBO01BQ0EsSUFBQyxDQUFBLE1BQU0sQ0FBQyxxQkFBUixDQUE4QixLQUE5QjtNQUNBLElBQUMsQ0FBQSxnQkFBRCxDQUFBO2FB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b250ZW50IjpbIntDb21wb3NpdGVEaXNwb3NhYmxlLCBQb2ludH0gPSByZXF1aXJlICdhdG9tJ1xuU3RhdGUgPSByZXF1aXJlICcuL3N0YXRlJ1xuXG4jIFJlcHJlc2VudHMgYW4gRW1hY3Mtc3R5bGUgbWFyay5cbiNcbiMgRWFjaCBjdXJzb3IgbWF5IGhhdmUgYSBNYXJrLiBPbiBjb25zdHJ1Y3Rpb24sIHRoZSBtYXJrIGlzIGF0IHRoZSBjdXJzb3Inc1xuIyBwb3NpdGlvbi5cbiNcbiMgVGhlIGNhbiB0aGVuIGJlIHNldCgpIGF0IGFueSB0aW1lLCB3aGljaCB3aWxsIG1vdmUgdG8gd2hlcmUgdGhlIGN1cnNvciBpcy5cbiNcbiMgSXQgY2FuIGFsc28gYmUgYWN0aXZhdGUoKWQgYW5kIGRlYWN0aXZhdGUoKWQuIFdoaWxlIGFjdGl2ZSwgdGhlIHJlZ2lvbiBiZXR3ZWVuXG4jIHRoZSBtYXJrIGFuZCB0aGUgY3Vyc29yIGlzIHNlbGVjdGVkLCBhbmQgdGhpcyBzZWxlY3Rpb24gaXMgdXBkYXRlZCBhcyB0aGVcbiMgY3Vyc29yIGlzIG1vdmVkLiBJZiB0aGUgYnVmZmVyIGlzIGVkaXRlZCwgdGhlIG1hcmsgaXMgYXV0b21hdGljYWxseVxuIyBkZWFjdGl2YXRlZC5cbmNsYXNzIE1hcmtcbiAgQGRlYWN0aXZhdGFibGUgPSBbXVxuXG4gIEBkZWFjdGl2YXRlUGVuZGluZzogLT5cbiAgICBmb3IgbWFyayBpbiBAZGVhY3RpdmF0YWJsZVxuICAgICAgbWFyay5kZWFjdGl2YXRlKClcbiAgICBAZGVhY3RpdmF0YWJsZS5sZW5ndGggPSAwXG5cbiAgY29uc3RydWN0b3I6IChjdXJzb3IpIC0+XG4gICAgQGN1cnNvciA9IGN1cnNvclxuICAgIEBlZGl0b3IgPSBjdXJzb3IuZWRpdG9yXG4gICAgQG1hcmtlciA9IEBlZGl0b3IubWFya0J1ZmZlclBvc2l0aW9uKGN1cnNvci5nZXRCdWZmZXJQb3NpdGlvbigpKVxuICAgIEBhY3RpdmUgPSBmYWxzZVxuICAgIEB1cGRhdGluZyA9IGZhbHNlXG5cbiAgZGVzdHJveTogLT5cbiAgICBAZGVhY3RpdmF0ZSgpIGlmIEBhY3RpdmVcbiAgICBAbWFya2VyLmRlc3Ryb3koKVxuXG4gIHNldDogKHBvaW50PUBjdXJzb3IuZ2V0QnVmZmVyUG9zaXRpb24oKSkgLT5cbiAgICBAZGVhY3RpdmF0ZSgpXG4gICAgQG1hcmtlci5zZXRIZWFkQnVmZmVyUG9zaXRpb24ocG9pbnQpXG4gICAgQF91cGRhdGVTZWxlY3Rpb24oKVxuICAgIEBcblxuICBnZXRCdWZmZXJQb3NpdGlvbjogLT5cbiAgICBAbWFya2VyLmdldEhlYWRCdWZmZXJQb3NpdGlvbigpXG5cbiAgYWN0aXZhdGU6IC0+XG4gICAgaWYgbm90IEBhY3RpdmVcbiAgICAgIEBhY3RpdmVTdWJzY3JpcHRpb25zID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGVcbiAgICAgIEBhY3RpdmVTdWJzY3JpcHRpb25zLmFkZCBAY3Vyc29yLm9uRGlkQ2hhbmdlUG9zaXRpb24gKGV2ZW50KSA9PlxuICAgICAgICBAX3VwZGF0ZVNlbGVjdGlvbihldmVudClcbiAgICAgICMgQ3Vyc29yIG1vdmVtZW50IGNvbW1hbmRzIGxpa2UgY3Vyc29yLm1vdmVEb3duIGRlYWN0aXZhdGUgdGhlIHNlbGVjdGlvblxuICAgICAgIyB1bmNvbmRpdGlvbmFsbHksIGJ1dCBkb24ndCB0cmlnZ2VyIG9uRGlkQ2hhbmdlUG9zaXRpb24gaWYgdGhlIHBvc2l0aW9uXG4gICAgICAjIGRvZXNuJ3QgY2hhbmdlIChlLmcuIGF0IEVPRikuIFNvIHdlIGFsc28gdXBkYXRlIHRoZSBzZWxlY3Rpb24gYWZ0ZXIgYW55XG4gICAgICAjIGNvbW1hbmQuXG4gICAgICBAYWN0aXZlU3Vic2NyaXB0aW9ucy5hZGQgYXRvbS5jb21tYW5kcy5vbkRpZERpc3BhdGNoIChldmVudCkgPT5cbiAgICAgICAgQF91cGRhdGVTZWxlY3Rpb24oZXZlbnQpXG4gICAgICBAYWN0aXZlU3Vic2NyaXB0aW9ucy5hZGQgQGVkaXRvci5nZXRCdWZmZXIoKS5vbkRpZENoYW5nZSAoZXZlbnQpID0+XG4gICAgICAgIHVubGVzcyBAX2lzSW5kZW50KGV2ZW50KSBvciBAX2lzT3V0ZGVudChldmVudClcbiAgICAgICAgICAjIElmIHdlJ3JlIGluIGEgY29tbWFuZCAoYXMgb3Bwb3NlZCB0byBhIHNpbXBsZSBjaGFyYWN0ZXIgaW5zZXJ0KSxcbiAgICAgICAgICAjIGRlbGF5IHRoZSBkZWFjdGl2YXRpb24gdW50aWwgdGhlIGVuZCBvZiB0aGUgY29tbWFuZC4gT3RoZXJ3aXNlXG4gICAgICAgICAgIyB1cGRhdGluZyBvbmUgc2VsZWN0aW9uIG1heSBwcmVtYXR1cmVseSBkZWFjdGl2YXRlIHRoZSBtYXJrIGFuZCBjbGVhclxuICAgICAgICAgICMgYSBzZWNvbmQgc2VsZWN0aW9uIGJlZm9yZSBpdCBoYXMgYSBjaGFuY2UgdG8gYmUgdXBkYXRlZC5cbiAgICAgICAgICBpZiBTdGF0ZS5pc0R1cmluZ0NvbW1hbmRcbiAgICAgICAgICAgIE1hcmsuZGVhY3RpdmF0YWJsZS5wdXNoKHRoaXMpXG4gICAgICAgICAgZWxzZVxuICAgICAgICAgICAgQGRlYWN0aXZhdGUoKVxuICAgICAgQGFjdGl2ZSA9IHRydWVcblxuICBkZWFjdGl2YXRlOiAtPlxuICAgIGlmIEBhY3RpdmVcbiAgICAgIEBhY3RpdmVTdWJzY3JpcHRpb25zLmRpc3Bvc2UoKVxuICAgICAgQGFjdGl2ZSA9IGZhbHNlXG4gICAgQGN1cnNvci5jbGVhclNlbGVjdGlvbigpXG5cbiAgaXNBY3RpdmU6IC0+XG4gICAgQGFjdGl2ZVxuXG4gIGV4Y2hhbmdlOiAtPlxuICAgIHBvc2l0aW9uID0gQG1hcmtlci5nZXRIZWFkQnVmZmVyUG9zaXRpb24oKVxuICAgIEBzZXQoKS5hY3RpdmF0ZSgpXG4gICAgQGN1cnNvci5zZXRCdWZmZXJQb3NpdGlvbihwb3NpdGlvbilcblxuICBfdXBkYXRlU2VsZWN0aW9uOiAoZXZlbnQpIC0+XG4gICAgIyBVcGRhdGluZyB0aGUgc2VsZWN0aW9uIHVwZGF0ZXMgdGhlIGN1cnNvciBtYXJrZXIsIHNvIGd1YXJkIGFnYWluc3QgdGhlXG4gICAgIyBuZXN0ZWQgaW52b2NhdGlvbi5cbiAgICBpZiAhQHVwZGF0aW5nXG4gICAgICBAdXBkYXRpbmcgPSB0cnVlXG4gICAgICB0cnlcbiAgICAgICAgaGVhZCA9IEBjdXJzb3IuZ2V0QnVmZmVyUG9zaXRpb24oKVxuICAgICAgICB0YWlsID0gQG1hcmtlci5nZXRIZWFkQnVmZmVyUG9zaXRpb24oKVxuICAgICAgICBAc2V0U2VsZWN0aW9uUmFuZ2UoaGVhZCwgdGFpbClcbiAgICAgIGZpbmFsbHlcbiAgICAgICAgQHVwZGF0aW5nID0gZmFsc2VcblxuICBnZXRTZWxlY3Rpb25SYW5nZTogLT5cbiAgICBAY3Vyc29yLnNlbGVjdGlvbi5nZXRCdWZmZXJSYW5nZSgpXG5cbiAgc2V0U2VsZWN0aW9uUmFuZ2U6IChoZWFkLCB0YWlsKSAtPlxuICAgIHJldmVyc2VkID0gUG9pbnQubWluKGhlYWQsIHRhaWwpIGlzIGhlYWRcbiAgICBAY3Vyc29yLnNlbGVjdGlvbi5zZXRCdWZmZXJSYW5nZShbaGVhZCwgdGFpbF0sIHJldmVyc2VkOiByZXZlcnNlZClcblxuICBfaXNJbmRlbnQ6IChldmVudCktPlxuICAgIEBfaXNJbmRlbnRPdXRkZW50KGV2ZW50Lm5ld1JhbmdlLCBldmVudC5uZXdUZXh0KVxuXG4gIF9pc091dGRlbnQ6IChldmVudCktPlxuICAgIEBfaXNJbmRlbnRPdXRkZW50KGV2ZW50Lm9sZFJhbmdlLCBldmVudC5vbGRUZXh0KVxuXG4gIF9pc0luZGVudE91dGRlbnQ6IChyYW5nZSwgdGV4dCktPlxuICAgIHRhYkxlbmd0aCA9IEBlZGl0b3IuZ2V0VGFiTGVuZ3RoKClcbiAgICBkaWZmID0gcmFuZ2UuZW5kLmNvbHVtbiAtIHJhbmdlLnN0YXJ0LmNvbHVtblxuICAgIHRydWUgaWYgZGlmZiA9PSBAZWRpdG9yLmdldFRhYkxlbmd0aCgpIGFuZCByYW5nZS5zdGFydC5yb3cgPT0gcmFuZ2UuZW5kLnJvdyBhbmQgQF9jaGVja1RleHRGb3JTcGFjZXModGV4dCwgdGFiTGVuZ3RoKVxuXG4gIF9jaGVja1RleHRGb3JTcGFjZXM6ICh0ZXh0LCB0YWJTaXplKS0+XG4gICAgcmV0dXJuIGZhbHNlIHVubGVzcyB0ZXh0IGFuZCB0ZXh0Lmxlbmd0aCBpcyB0YWJTaXplXG5cbiAgICBmb3IgY2ggaW4gdGV4dFxuICAgICAgcmV0dXJuIGZhbHNlIHVubGVzcyBjaCBpcyBcIiBcIlxuICAgIHRydWVcblxubW9kdWxlLmV4cG9ydHMgPSBNYXJrXG4iXX0=
