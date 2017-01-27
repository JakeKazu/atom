(function() {
  var CompositeDisposable, Emacs, GlobalEmacsState, packageDeps;

  CompositeDisposable = require('atom').CompositeDisposable;

  packageDeps = require('atom-package-deps');

  Emacs = require('./emacs');

  GlobalEmacsState = require('./global-emacs-state');

  module.exports = {
    activate: function() {
      this.subscriptions = new CompositeDisposable;
      this.emacsObjects = new WeakMap;
      this.globalEmacsState = new GlobalEmacsState;
      this.subscriptions.add(atom.workspace.observeTextEditors((function(_this) {
        return function(editor) {
          if (editor.mini) {
            return;
          }
          if (!_this.emacsObjects.get(editor)) {
            return _this.emacsObjects.set(editor, new Emacs(editor, _this.globalEmacsState));
          }
        };
      })(this)));
      return packageDeps.install('emacs-plus');
    },
    deactivate: function() {
      var editor, i, len, ref, ref1, ref2, ref3;
      if ((ref = this.subscriptions) != null) {
        ref.dispose();
      }
      this.subscriptions = null;
      ref1 = atom.workspace.getTextEditors();
      for (i = 0, len = ref1.length; i < len; i++) {
        editor = ref1[i];
        if ((ref2 = this.emacsObjects.get(editor)) != null) {
          ref2.destroy();
        }
      }
      this.emacsObjects = null;
      if ((ref3 = this.globalEmacsState) != null) {
        ref3.destroy();
      }
      return this.globalEmacsState = null;
    }
  };

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL2hvbWUvamFrZS8uYXRvbS9wYWNrYWdlcy9lbWFjcy1wbHVzL2xpYi9tYWluLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUFBLE1BQUE7O0VBQUMsc0JBQXVCLE9BQUEsQ0FBUSxNQUFSOztFQUN4QixXQUFBLEdBQWMsT0FBQSxDQUFRLG1CQUFSOztFQUNkLEtBQUEsR0FBUSxPQUFBLENBQVEsU0FBUjs7RUFDUixnQkFBQSxHQUFtQixPQUFBLENBQVEsc0JBQVI7O0VBRW5CLE1BQU0sQ0FBQyxPQUFQLEdBQ0U7SUFBQSxRQUFBLEVBQVUsU0FBQTtNQUNSLElBQUMsQ0FBQSxhQUFELEdBQWlCLElBQUk7TUFDckIsSUFBQyxDQUFBLFlBQUQsR0FBZ0IsSUFBSTtNQUNwQixJQUFDLENBQUEsZ0JBQUQsR0FBb0IsSUFBSTtNQUN4QixJQUFDLENBQUEsYUFBYSxDQUFDLEdBQWYsQ0FBbUIsSUFBSSxDQUFDLFNBQVMsQ0FBQyxrQkFBZixDQUFrQyxDQUFBLFNBQUEsS0FBQTtlQUFBLFNBQUMsTUFBRDtVQUNuRCxJQUFVLE1BQU0sQ0FBQyxJQUFqQjtBQUFBLG1CQUFBOztVQUNBLElBQUEsQ0FBTyxLQUFDLENBQUEsWUFBWSxDQUFDLEdBQWQsQ0FBa0IsTUFBbEIsQ0FBUDttQkFDRSxLQUFDLENBQUEsWUFBWSxDQUFDLEdBQWQsQ0FBa0IsTUFBbEIsRUFBOEIsSUFBQSxLQUFBLENBQU0sTUFBTixFQUFjLEtBQUMsQ0FBQSxnQkFBZixDQUE5QixFQURGOztRQUZtRDtNQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0FBbEMsQ0FBbkI7YUFJQSxXQUFXLENBQUMsT0FBWixDQUFvQixZQUFwQjtJQVJRLENBQVY7SUFVQSxVQUFBLEVBQVksU0FBQTtBQUNWLFVBQUE7O1dBQWMsQ0FBRSxPQUFoQixDQUFBOztNQUNBLElBQUMsQ0FBQSxhQUFELEdBQWlCO0FBRWpCO0FBQUEsV0FBQSxzQ0FBQTs7O2NBQzJCLENBQUUsT0FBM0IsQ0FBQTs7QUFERjtNQUVBLElBQUMsQ0FBQSxZQUFELEdBQWdCOztZQUVDLENBQUUsT0FBbkIsQ0FBQTs7YUFDQSxJQUFDLENBQUEsZ0JBQUQsR0FBb0I7SUFUVixDQVZaOztBQU5GIiwic291cmNlc0NvbnRlbnQiOlsie0NvbXBvc2l0ZURpc3Bvc2FibGV9ID0gcmVxdWlyZSAnYXRvbSdcbnBhY2thZ2VEZXBzID0gcmVxdWlyZSAnYXRvbS1wYWNrYWdlLWRlcHMnXG5FbWFjcyA9IHJlcXVpcmUgJy4vZW1hY3MnXG5HbG9iYWxFbWFjc1N0YXRlID0gcmVxdWlyZSAnLi9nbG9iYWwtZW1hY3Mtc3RhdGUnXG5cbm1vZHVsZS5leHBvcnRzID1cbiAgYWN0aXZhdGU6IC0+XG4gICAgQHN1YnNjcmlwdGlvbnMgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZVxuICAgIEBlbWFjc09iamVjdHMgPSBuZXcgV2Vha01hcFxuICAgIEBnbG9iYWxFbWFjc1N0YXRlID0gbmV3IEdsb2JhbEVtYWNzU3RhdGVcbiAgICBAc3Vic2NyaXB0aW9ucy5hZGQgYXRvbS53b3Jrc3BhY2Uub2JzZXJ2ZVRleHRFZGl0b3JzIChlZGl0b3IpID0+XG4gICAgICByZXR1cm4gaWYgZWRpdG9yLm1pbmlcbiAgICAgIHVubGVzcyBAZW1hY3NPYmplY3RzLmdldChlZGl0b3IpXG4gICAgICAgIEBlbWFjc09iamVjdHMuc2V0KGVkaXRvciwgbmV3IEVtYWNzKGVkaXRvciwgQGdsb2JhbEVtYWNzU3RhdGUpKVxuICAgIHBhY2thZ2VEZXBzLmluc3RhbGwoJ2VtYWNzLXBsdXMnKVxuXG4gIGRlYWN0aXZhdGU6IC0+XG4gICAgQHN1YnNjcmlwdGlvbnM/LmRpc3Bvc2UoKVxuICAgIEBzdWJzY3JpcHRpb25zID0gbnVsbFxuXG4gICAgZm9yIGVkaXRvciBpbiBhdG9tLndvcmtzcGFjZS5nZXRUZXh0RWRpdG9ycygpXG4gICAgICBAZW1hY3NPYmplY3RzLmdldChlZGl0b3IpPy5kZXN0cm95KClcbiAgICBAZW1hY3NPYmplY3RzID0gbnVsbFxuXG4gICAgQGdsb2JhbEVtYWNzU3RhdGU/LmRlc3Ryb3koKVxuICAgIEBnbG9iYWxFbWFjc1N0YXRlID0gbnVsbFxuIl19
