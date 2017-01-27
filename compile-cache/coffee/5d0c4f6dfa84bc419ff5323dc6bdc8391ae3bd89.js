(function() {
  var CompositeDisposable, Disposable, Mark, Point, ref,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  ref = require('atom'), Point = ref.Point, CompositeDisposable = ref.CompositeDisposable, Disposable = ref.Disposable;

  Mark = (function() {
    var MARK_MODE_CLASS, _marks;

    MARK_MODE_CLASS = 'mark-mode';

    _marks = new WeakMap;

    Mark["for"] = function(editor) {
      var mark;
      mark = _marks.get(editor);
      if (!mark) {
        mark = new Mark(editor);
        _marks.set(editor, mark);
      }
      return mark;
    };

    function Mark(editor1) {
      this.editor = editor1;
      this._addClickEventListener = bind(this._addClickEventListener, this);
      this._onModified = bind(this._onModified, this);
      this._clearSelection = bind(this._clearSelection, this);
      this._addClass = bind(this._addClass, this);
      this.destroy = bind(this.destroy, this);
      this.deactivate = bind(this.deactivate, this);
      this.activate = bind(this.activate, this);
      this.active = false;
      this.subscriptions = new CompositeDisposable;
      this.subscriptions.add(this.editor.onDidDestroy(this.destroy));
    }

    Mark.prototype.activate = function(keepSelection) {
      if (keepSelection == null) {
        keepSelection = false;
      }
      if (!keepSelection) {
        this._clearSelection();
      }
      if (this.active) {
        return;
      }
      this.activateSubscriptions = new CompositeDisposable;
      this.activateSubscriptions.add(this.editor.getBuffer().onDidChange(this._onModified));
      this.activateSubscriptions.add(this._addClickEventListener());
      this.activateSubscriptions.add(this._addClass());
      return this.active = true;
    };

    Mark.prototype.deactivate = function(options) {
      var ref1;
      if (options == null) {
        options = {};
      }
      this.active = false;
      if ((ref1 = this.activateSubscriptions) != null) {
        ref1.dispose();
      }
      this.activateSubscriptions = null;
      if (options.immediate) {
        return setImmediate(this._clearSelection);
      } else {
        return this._clearSelection();
      }
    };

    Mark.prototype.destroy = function() {
      var ref1;
      if (this.destroyed) {
        return;
      }
      this.destroyed = true;
      if (this.active) {
        this.deactivate();
      }
      if ((ref1 = this.subscriptions) != null) {
        ref1.dispose();
      }
      this.subscriptions = null;
      return this.editor = null;
    };

    Mark.prototype.isActive = function() {
      return this.active;
    };

    Mark.prototype.exchange = function() {
      if (!this.isActive()) {
        return;
      }
      return this.editor.getCursors().forEach(this._exchange);
    };

    Mark.prototype._exchange = function(cursor) {
      var a, b;
      if (cursor.selection == null) {
        return;
      }
      b = cursor.selection.getTailBufferPosition();
      a = cursor.getBufferPosition();
      return cursor.selection.setBufferRange([a, b], {
        reversed: Point.min(a, b) === b,
        autoscroll: false
      });
    };

    Mark.prototype._addClass = function() {
      var editorElement;
      editorElement = atom.views.getView(this.editor);
      editorElement.classList.add(MARK_MODE_CLASS);
      return new Disposable(function() {
        return editorElement.classList.remove(MARK_MODE_CLASS);
      });
    };

    Mark.prototype._clearSelection = function() {
      if (this.editor == null) {
        return;
      }
      if (this.editor.isDestroyed()) {
        return;
      }
      return this.editor.getCursors().forEach(function(cursor) {
        return cursor.clearSelection();
      });
    };

    Mark.prototype._onModified = function(event) {
      if (this._isIndent(event) || this._isOutdent(event)) {
        return;
      }
      return this.deactivate({
        immediate: true
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

    Mark.prototype._addClickEventListener = function() {
      var callback, editorElement;
      callback = (function(_this) {
        return function(arg) {
          var which;
          which = arg.which;
          if (which === 1) {
            return _this.deactivate();
          }
        };
      })(this);
      editorElement = atom.views.getView(this.editor);
      editorElement.addEventListener('mousedown', callback);
      return new Disposable(function() {
        return editorElement.removeEventListener('mousedown', callback);
      });
    };

    return Mark;

  })();

  module.exports = Mark;

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL2hvbWUvamFrZS8uYXRvbS9wYWNrYWdlcy9lbWFjcy1wbHVzL2xpYi9tYXJrLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUFBLE1BQUEsaURBQUE7SUFBQTs7RUFBQSxNQUEyQyxPQUFBLENBQVEsTUFBUixDQUEzQyxFQUFDLGlCQUFELEVBQVEsNkNBQVIsRUFBNkI7O0VBRXZCO0FBQ0osUUFBQTs7SUFBQSxlQUFBLEdBQWtCOztJQUVsQixNQUFBLEdBQVMsSUFBSTs7SUFFYixJQUFDLEVBQUEsR0FBQSxFQUFELEdBQU0sU0FBQyxNQUFEO0FBQ0osVUFBQTtNQUFBLElBQUEsR0FBTyxNQUFNLENBQUMsR0FBUCxDQUFXLE1BQVg7TUFDUCxJQUFBLENBQU8sSUFBUDtRQUNFLElBQUEsR0FBVyxJQUFBLElBQUEsQ0FBSyxNQUFMO1FBQ1gsTUFBTSxDQUFDLEdBQVAsQ0FBVyxNQUFYLEVBQW1CLElBQW5CLEVBRkY7O2FBR0E7SUFMSTs7SUFPTyxjQUFDLE9BQUQ7TUFBQyxJQUFDLENBQUEsU0FBRDs7Ozs7Ozs7TUFDWixJQUFDLENBQUEsTUFBRCxHQUFVO01BQ1YsSUFBQyxDQUFBLGFBQUQsR0FBaUIsSUFBSTtNQUNyQixJQUFDLENBQUEsYUFBYSxDQUFDLEdBQWYsQ0FBbUIsSUFBQyxDQUFBLE1BQU0sQ0FBQyxZQUFSLENBQXFCLElBQUMsQ0FBQSxPQUF0QixDQUFuQjtJQUhXOzttQkFLYixRQUFBLEdBQVUsU0FBQyxhQUFEOztRQUFDLGdCQUFnQjs7TUFDekIsSUFBQSxDQUEwQixhQUExQjtRQUFBLElBQUMsQ0FBQSxlQUFELENBQUEsRUFBQTs7TUFDQSxJQUFVLElBQUMsQ0FBQSxNQUFYO0FBQUEsZUFBQTs7TUFDQSxJQUFDLENBQUEscUJBQUQsR0FBeUIsSUFBSTtNQUM3QixJQUFDLENBQUEscUJBQXFCLENBQUMsR0FBdkIsQ0FBMkIsSUFBQyxDQUFBLE1BQU0sQ0FBQyxTQUFSLENB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O1FBRlM7TUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBO01BR1gsYUFBQSxHQUFnQixJQUFJLENBQUMsS0FBSyxDQUFDLE9BQVgsQ0FBbUIsSUFBQyxDQUFBLE1BQXBCO01BQ2hCLGFBQWEsQ0FBQyxnQkFBZCxDQUErQixXQUEvQixFQUE0QyxRQUE1QzthQUNJLElBQUEsVUFBQSxDQUFXLFNBQUE7ZUFDYixhQUFhLENBQUMsbUJBQWQsQ0FBa0MsV0FBbEMsRUFBK0MsUUFBL0M7TUFEYSxDQUFYO0lBTmtCOzs7Ozs7RUFTMUIsTUFBTSxDQUFDLE9BQVAsR0FBaUI7QUF6R2pCIiwic291cmNlc0NvbnRlbnQiOlsie1BvaW50LCBDb21wb3NpdGVEaXNwb3NhYmxlLCBEaXNwb3NhYmxlfSA9IHJlcXVpcmUoJ2F0b20nKVxuXG5jbGFzcyBNYXJrXG4gIE1BUktfTU9ERV9DTEFTUyA9ICdtYXJrLW1vZGUnXG5cbiAgX21hcmtzID0gbmV3IFdlYWtNYXBcblxuICBAZm9yOiAoZWRpdG9yKSAtPlxuICAgIG1hcmsgPSBfbWFya3MuZ2V0KGVkaXRvcilcbiAgICB1bmxlc3MgbWFya1xuICAgICAgbWFyayA9IG5ldyBNYXJrKGVkaXRvcilcbiAgICAgIF9tYXJrcy5zZXQoZWRpdG9yLCBtYXJrKVxuICAgIG1hcmtcblxuICBjb25zdHJ1Y3RvcjogKEBlZGl0b3IpIC0+XG4gICAgQGFjdGl2ZSA9IGZhbHNlXG4gICAgQHN1YnNjcmlwdGlvbnMgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZVxuICAgIEBzdWJzY3JpcHRpb25zLmFkZChAZWRpdG9yLm9uRGlkRGVzdHJveShAZGVzdHJveSkpXG5cbiAgYWN0aXZhdGU6IChrZWVwU2VsZWN0aW9uID0gZmFsc2UpID0+XG4gICAgQF9jbGVhclNlbGVjdGlvbigpIHVubGVzcyBrZWVwU2VsZWN0aW9uXG4gICAgcmV0dXJuIGlmIEBhY3RpdmVcbiAgICBAYWN0aXZhdGVTdWJzY3JpcHRpb25zID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGVcbiAgICBAYWN0aXZhdGVTdWJzY3JpcHRpb25zLmFkZChAZWRpdG9yLmdldEJ1ZmZlcigpLm9uRGlkQ2hhbmdlKEBfb25Nb2RpZmllZCkpXG4gICAgQGFjdGl2YXRlU3Vic2NyaXB0aW9ucy5hZGQoQF9hZGRDbGlja0V2ZW50TGlzdGVuZXIoKSlcbiAgICBAYWN0aXZhdGVTdWJzY3JpcHRpb25zLmFkZChAX2FkZENsYXNzKCkpXG4gICAgQGFjdGl2ZSA9IHRydWVcblxuICBkZWFjdGl2YXRlOiAob3B0aW9ucyA9IHt9KSA9PlxuICAgIEBhY3RpdmUgPSBmYWxzZVxuICAgIEBhY3RpdmF0ZVN1YnNjcmlwdGlvbnM/LmRpc3Bvc2UoKVxuICAgIEBhY3RpdmF0ZVN1YnNjcmlwdGlvbnMgPSBudWxsXG4gICAgaWYgb3B0aW9ucy5pbW1lZGlhdGVcbiAgICAgIHNldEltbWVkaWF0ZShAX2NsZWFyU2VsZWN0aW9uKVxuICAgIGVsc2VcbiAgICAgIEBfY2xlYXJTZWxlY3Rpb24oKVxuXG4gIGRlc3Ryb3k6ID0+XG4gICAgcmV0dXJuIGlmIEBkZXN0cm95ZWRcbiAgICBAZGVzdHJveWVkID0gdHJ1ZVxuICAgIEBkZWFjdGl2YXRlKCkgaWYgQGFjdGl2ZVxuICAgIEBzdWJzY3JpcHRpb25zPy5kaXNwb3NlKClcbiAgICBAc3Vic2NyaXB0aW9ucyA9IG51bGxcbiAgICBAZWRpdG9yID0gbnVsbFxuXG4gIGlzQWN0aXZlOiAtPlxuICAgIEBhY3RpdmVcblxuICBleGNoYW5nZTogLT5cbiAgICByZXR1cm4gdW5sZXNzIEBpc0FjdGl2ZSgpXG4gICAgQGVkaXRvci5nZXRDdXJzb3JzKCkuZm9yRWFjaChAX2V4Y2hhbmdlKVxuXG4gIF9leGNoYW5nZTogKGN1cnNvcikgLT5cbiAgICByZXR1cm4gdW5sZXNzIGN1cnNvci5zZWxlY3Rpb24/XG4gICAgYiA9IGN1cnNvci5zZWxlY3Rpb24uZ2V0VGFpbEJ1ZmZlclBvc2l0aW9uKClcbiAgICBhID0gY3Vyc29yLmdldEJ1ZmZlclBvc2l0aW9uKClcbiAgICBjdXJzb3Iuc2VsZWN0aW9uLnNldEJ1ZmZlclJhbmdlKFthLCBiXSwge1xuICAgICAgcmV2ZXJzZWQ6IFBvaW50Lm1pbihhLCBiKSBpcyBiXG4gICAgICBhdXRvc2Nyb2xsOiBmYWxzZVxuICAgIH0pXG5cbiAgX2FkZENsYXNzOiA9PlxuICAgIGVkaXRvckVsZW1lbnQgPSBhdG9tLnZpZXdzLmdldFZpZXcoQGVkaXRvcilcbiAgICBlZGl0b3JFbGVtZW50LmNsYXNzTGlzdC5hZGQoTUFSS19NT0RFX0NMQVNTKVxuICAgIG5ldyBEaXNwb3NhYmxlIC0+XG4gICAgICBlZGl0b3JFbGVtZW50LmNsYXNzTGlzdC5yZW1vdmUoTUFSS19NT0RFX0NMQVNTKVxuXG4gIF9jbGVhclNlbGVjdGlvbjogPT5cbiAgICByZXR1cm4gdW5sZXNzIEBlZGl0b3I/XG4gICAgcmV0dXJuIGlmIEBlZGl0b3IuaXNEZXN0cm95ZWQoKVxuICAgIEBlZGl0b3IuZ2V0Q3Vyc29ycygpLmZvckVhY2goKGN1cnNvcikgLT5cbiAgICAgIGN1cnNvci5jbGVhclNlbGVjdGlvbigpXG4gICAgKVxuXG4gIF9vbk1vZGlmaWVkOiAoZXZlbnQpID0+XG4gICAgcmV0dXJuIGlmIEBfaXNJbmRlbnQoZXZlbnQpIG9yIEBfaXNPdXRkZW50KGV2ZW50KVxuICAgIEBkZWFjdGl2YXRlKGltbWVkaWF0ZTogdHJ1ZSlcblxuICBfaXNJbmRlbnQ6IChldmVudCkgLT5cbiAgICBAX2lzSW5kZW50T3V0ZGVudChldmVudC5uZXdSYW5nZSwgZXZlbnQubmV3VGV4dClcblxuICBfaXNPdXRkZW50OiAoZXZlbnQpIC0+XG4gICAgQF9pc0luZGVudE91dGRlbnQoZXZlbnQub2xkUmFuZ2UsIGV2ZW50Lm9sZFRleHQpXG5cbiAgX2lzSW5kZW50T3V0ZGVudDogKHJhbmdlLCB0ZXh0KSAtPlxuICAgIHRhYkxlbmd0aCA9IEBlZGl0b3IuZ2V0VGFiTGVuZ3RoKClcbiAgICBkaWZmID0gcmFuZ2UuZW5kLmNvbHVtbiAtIHJhbmdlLnN0YXJ0LmNvbHVtblxuICAgIHRydWUgaWYgZGlmZiA9PSBAZWRpdG9yLmdldFRhYkxlbmd0aCgpIGFuZCByYW5nZS5zdGFydC5yb3cgPT0gcmFuZ2UuZW5kLnJvdyBhbmQgQF9jaGVja1RleHRGb3JTcGFjZXModGV4dCwgdGFiTGVuZ3RoKVxuXG4gIF9jaGVja1RleHRGb3JTcGFjZXM6ICh0ZXh0LCB0YWJTaXplKSAtPlxuICAgIHJldHVybiBmYWxzZSB1bmxlc3MgdGV4dCBhbmQgdGV4dC5sZW5ndGggaXMgdGFiU2l6ZVxuXG4gICAgZm9yIGNoIGluIHRleHRcbiAgICAgIHJldHVybiBmYWxzZSB1bmxlc3MgY2ggaXMgXCIgXCJcbiAgICB0cnVlXG5cbiAgX2FkZENsaWNrRXZlbnRMaXN0ZW5lcjogPT5cbiAgICBjYWxsYmFjayA9ICh7d2hpY2h9KSA9PlxuICAgICAgIyBsZWZ0IGNsaWNrXG4gICAgICBAZGVhY3RpdmF0ZSgpIGlmIHdoaWNoIGlzIDFcbiAgICBlZGl0b3JFbGVtZW50ID0gYXRvbS52aWV3cy5nZXRWaWV3KEBlZGl0b3IpXG4gICAgZWRpdG9yRWxlbWVudC5hZGRFdmVudExpc3RlbmVyKCdtb3VzZWRvd24nLCBjYWxsYmFjaylcbiAgICBuZXcgRGlzcG9zYWJsZSAtPlxuICAgICAgZWRpdG9yRWxlbWVudC5yZW1vdmVFdmVudExpc3RlbmVyKCdtb3VzZWRvd24nLCBjYWxsYmFjaylcblxubW9kdWxlLmV4cG9ydHMgPSBNYXJrXG4iXX0=
