(function() {
  var CompositeDisposable, GlobalEmacsState, Mark,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  CompositeDisposable = require('atom').CompositeDisposable;

  Mark = require('./mark');

  module.exports = GlobalEmacsState = (function() {
    var ignoreCommands;

    ignoreCommands = new Set(['editor:display-updated', 'cursor:moved', 'selection:changed']);

    GlobalEmacsState.prototype.subscriptions = null;

    GlobalEmacsState.prototype.lastCommand = null;

    GlobalEmacsState.prototype.thisCommand = null;

    GlobalEmacsState.prototype.activateMarkCommands = new Set;

    function GlobalEmacsState() {
      this.logCommand = bind(this.logCommand, this);
      this.subscriptions = new CompositeDisposable;
      this.subscriptions.add(atom.commands.onWillDispatch(this.logCommand));
      this.subscriptions.add(atom.config.observe('emacs-plus.activateMarkCommands', (function(_this) {
        return function(value) {
          return _this.activateMarkCommands = new Set(value);
        };
      })(this)));
      this.subscriptions.add(atom.commands.onWillDispatch((function(_this) {
        return function(arg) {
          var command;
          command = arg.type;
          if (_this.activateMarkCommands.has(command)) {
            return Mark["for"](atom.workspace.getActiveTextEditor()).activate();
          }
        };
      })(this)));
    }

    GlobalEmacsState.prototype.destroy = function() {
      var ref;
      if ((ref = this.subscriptions) != null) {
        ref.dispose();
      }
      return this.subscriptions = null;
    };

    GlobalEmacsState.prototype.logCommand = function(arg) {
      var command;
      command = arg.type;
      if (command.indexOf(':') === -1) {
        return;
      }
      if (ignoreCommands.has(command)) {
        return;
      }
      this.lastCommand = this.thisCommand;
      return this.thisCommand = command;
    };

    return GlobalEmacsState;

  })();

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL2hvbWUvamFrZS8uYXRvbS9wYWNrYWdlcy9lbWFjcy1wbHVzL2xpYi9nbG9iYWwtZW1hY3Mtc3RhdGUuY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FBQUEsTUFBQSwyQ0FBQTtJQUFBOztFQUFDLHNCQUF1QixPQUFBLENBQVEsTUFBUjs7RUFDeEIsSUFBQSxHQUFPLE9BQUEsQ0FBUSxRQUFSOztFQUVQLE1BQU0sQ0FBQyxPQUFQLEdBQ007QUFFSixRQUFBOztJQUFBLGNBQUEsR0FBcUIsSUFBQSxHQUFBLENBQUksQ0FDdkIsd0JBRHVCLEVBQ0csY0FESCxFQUNtQixtQkFEbkIsQ0FBSjs7K0JBSXJCLGFBQUEsR0FBZTs7K0JBQ2YsV0FBQSxHQUFhOzsrQkFDYixXQUFBLEdBQWE7OytCQUNiLG9CQUFBLEdBQXNCLElBQUk7O0lBRWIsMEJBQUE7O01BQ1gsSUFBQyxDQUFBLGFBQUQsR0FBaUIsSUFBSTtNQUNyQixJQUFDLENBQUEsYUFBYSxDQUFDLEdBQWYsQ0FBbUIsSUFBSSxDQUFDLFFBQVEsQ0FBQyxjQUFkLENBQTZCLElBQUMsQ0FBQSxVQUE5QixDQUFuQjtNQUNBLElBQUMsQ0FBQSxhQUFhLENBQUMsR0FBZixDQUFtQixJQUFJLENBQUMsTUFBTSxDQUFDLE9BQVosQ0FBb0IsaUNBQXBCLEVBQXVELENBQUEsU0FBQSxLQUFBO2VBQUEsU0FBQyxLQUFEO2lCQUN4RSxLQUFDLENBQUEsb0JBQUQsR0FBNEIsSUFBQSxHQUFBLENBQUksS0FBSjtRQUQ0QztNQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0FBdkQsQ0FBbkI7TUFHQSxJQUFDLENBQUEsYUFBYSxDQUFDLEdBQWYsQ0FBbUIsSUFBSSxDQUFDLFFBQVEsQ0FBQyxjQUFkLENBQTZCLENBQUEsU0FBQSxLQUFBO2VBQUEsU0FBQyxHQUFEO0FBQzlDLGNBQUE7VUFEc0QsVUFBUCxJQUFDO1VBQ2hELElBQUcsS0FBQyxDQUFBLG9CQUFvQixDQUFDLEdBQXRCLENBQTBCLE9BQTFCLENBQUg7bUJBQ0UsSUFBSSxFQUFDLEdBQUQsRUFBSixDQUFTLElBQUksQ0FBQyxTQUFTLENBQUMsbUJBQWYsQ0FBQSxDQUFULENBQThDLENBQUMsUUFBL0MsQ0FBQSxFQURGOztRQUQ4QztNQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0FBN0IsQ0FBbkI7SUFOVzs7K0JBV2IsT0FBQSxHQUFTLFNBQUE7QUFDUCxVQUFBOztXQUFjLENBQUUsT0FBaEIsQ0FBQTs7YUFDQSxJQUFDLENBQUEsYUFBRCxHQUFpQjtJQUZWOzsrQkFJVCxVQUFBLEdBQVksU0FBQyxHQUFEO0FBQ1YsVUFBQTtNQURrQixVQUFQLElBQUM7TUFDWixJQUFVLE9BQU8sQ0FBQyxPQUFSLENBQWdCLEdBQWhCLENBQUEsS0FBd0IsQ0FBQyxDQUFuQztBQUFBLGVBQUE7O01BQ0EsSUFBVSxjQUFjLENBQUMsR0FBZixDQUFtQixPQUFuQixDQUFWO0FBQUEsZUFBQTs7TUFDQSxJQUFDLENBQUEsV0FBRCxHQUFlLElBQUMsQ0FBQTthQUNoQixJQUFDLENBQUEsV0FBRCxHQUFlO0lBSkw7Ozs7O0FBOUJkIiwic291cmNlc0NvbnRlbnQiOlsie0NvbXBvc2l0ZURpc3Bvc2FibGV9ID0gcmVxdWlyZSAnYXRvbSdcbk1hcmsgPSByZXF1aXJlICcuL21hcmsnXG5cbm1vZHVsZS5leHBvcnRzID1cbmNsYXNzIEdsb2JhbEVtYWNzU3RhdGVcbiAgIyBmb3IgU3BlY01vZGVcbiAgaWdub3JlQ29tbWFuZHMgPSBuZXcgU2V0KFtcbiAgICAnZWRpdG9yOmRpc3BsYXktdXBkYXRlZCcsICdjdXJzb3I6bW92ZWQnLCAnc2VsZWN0aW9uOmNoYW5nZWQnXG4gIF0pXG5cbiAgc3Vic2NyaXB0aW9uczogbnVsbFxuICBsYXN0Q29tbWFuZDogbnVsbFxuICB0aGlzQ29tbWFuZDogbnVsbFxuICBhY3RpdmF0ZU1hcmtDb21tYW5kczogbmV3IFNldFxuXG4gIGNvbnN0cnVjdG9yOiAtPlxuICAgIEBzdWJzY3JpcHRpb25zID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGVcbiAgICBAc3Vic2NyaXB0aW9ucy5hZGQoYXRvbS5jb21tYW5kcy5vbldpbGxEaXNwYXRjaChAbG9nQ29tbWFuZCkpXG4gICAgQHN1YnNjcmlwdGlvbnMuYWRkKGF0b20uY29uZmlnLm9ic2VydmUoJ2VtYWNzLXBsdXMuYWN0aXZhdGVNYXJrQ29tbWFuZHMnLCAodmFsdWUpID0+XG4gICAgICBAYWN0aXZhdGVNYXJrQ29tbWFuZHMgPSBuZXcgU2V0KHZhbHVlKVxuICAgICkpXG4gICAgQHN1YnNjcmlwdGlvbnMuYWRkKGF0b20uY29tbWFuZHMub25XaWxsRGlzcGF0Y2goKHt0eXBlOiBjb21tYW5kfSkgPT5cbiAgICAgIGlmIEBhY3RpdmF0ZU1hcmtDb21tYW5kcy5oYXMoY29tbWFuZClcbiAgICAgICAgTWFyay5mb3IoYXRvbS53b3Jrc3BhY2UuZ2V0QWN0aXZlVGV4dEVkaXRvcigpKS5hY3RpdmF0ZSgpXG4gICAgKSlcblxuICBkZXN0cm95OiAtPlxuICAgIEBzdWJzY3JpcHRpb25zPy5kaXNwb3NlKClcbiAgICBAc3Vic2NyaXB0aW9ucyA9IG51bGxcblxuICBsb2dDb21tYW5kOiAoe3R5cGU6IGNvbW1hbmR9KSA9PlxuICAgIHJldHVybiBpZiBjb21tYW5kLmluZGV4T2YoJzonKSBpcyAtMVxuICAgIHJldHVybiBpZiBpZ25vcmVDb21tYW5kcy5oYXMoY29tbWFuZClcbiAgICBAbGFzdENvbW1hbmQgPSBAdGhpc0NvbW1hbmRcbiAgICBAdGhpc0NvbW1hbmQgPSBjb21tYW5kXG4iXX0=
