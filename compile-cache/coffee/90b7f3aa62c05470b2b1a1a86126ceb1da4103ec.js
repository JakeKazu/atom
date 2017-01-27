(function() {
  var CompositeDisposable, Disposable, Ex, ExMode, ExState, GlobalExState, ref;

  GlobalExState = require('./global-ex-state');

  ExState = require('./ex-state');

  Ex = require('./ex');

  ref = require('event-kit'), Disposable = ref.Disposable, CompositeDisposable = ref.CompositeDisposable;

  module.exports = ExMode = {
    activate: function(state) {
      this.globalExState = new GlobalExState;
      this.disposables = new CompositeDisposable;
      this.exStates = new WeakMap;
      return this.disposables.add(atom.workspace.observeTextEditors((function(_this) {
        return function(editor) {
          var element, exState;
          if (editor.mini) {
            return;
          }
          element = atom.views.getView(editor);
          if (!_this.exStates.get(editor)) {
            exState = new ExState(element, _this.globalExState);
            _this.exStates.set(editor, exState);
            return _this.disposables.add(new Disposable(function() {
              return exState.destroy();
            }));
          }
        };
      })(this)));
    },
    deactivate: function() {
      return this.disposables.dispose();
    },
    provideEx: function() {
      return {
        registerCommand: Ex.registerCommand.bind(Ex),
        registerAlias: Ex.registerAlias.bind(Ex)
      };
    },
    consumeVim: function(vim) {
      this.vim = vim;
      return this.globalExState.setVim(vim);
    },
    config: {
      splitbelow: {
        title: 'Split below',
        description: 'when splitting, split from below',
        type: 'boolean',
        "default": 'false'
      },
      splitright: {
        title: 'Split right',
        description: 'when splitting, split from right',
        type: 'boolean',
        "default": 'false'
      }
    }
  };

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL2hvbWUvamFrZS8uYXRvbS9wYWNrYWdlcy9leC1tb2RlL2xpYi9leC1tb2RlLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUFBLE1BQUE7O0VBQUEsYUFBQSxHQUFnQixPQUFBLENBQVEsbUJBQVI7O0VBQ2hCLE9BQUEsR0FBVSxPQUFBLENBQVEsWUFBUjs7RUFDVixFQUFBLEdBQUssT0FBQSxDQUFRLE1BQVI7O0VBQ0wsTUFBb0MsT0FBQSxDQUFRLFdBQVIsQ0FBcEMsRUFBQywyQkFBRCxFQUFhOztFQUViLE1BQU0sQ0FBQyxPQUFQLEdBQWlCLE1BQUEsR0FDZjtJQUFBLFFBQUEsRUFBVSxTQUFDLEtBQUQ7TUFDUixJQUFDLENBQUEsYUFBRCxHQUFpQixJQUFJO01BQ3JCLElBQUMsQ0FBQSxXQUFELEdBQWUsSUFBSTtNQUNuQixJQUFDLENBQUEsUUFBRCxHQUFZLElBQUk7YUFFaEIsSUFBQyxDQUFBLFdBQVcsQ0FBQyxHQUFiLENBQWlCLElBQUksQ0FBQyxTQUFTLENBQUMsa0JBQWYsQ0FBa0MsQ0FBQSxTQUFBLEtBQUE7ZUFBQSxTQUFDLE1BQUQ7QUFDakQsY0FBQTtVQUFBLElBQVUsTUFBTSxDQUFDLElBQWpCO0FBQUEsbUJBQUE7O1VBRUEsT0FBQSxHQUFVLElBQUksQ0FBQyxLQUFLLENBQUMsT0FBWCxDQUFtQixNQUFuQjtVQUVWLElBQUcsQ0FBSSxLQUFDLENBQUEsUUFBUSxDQUFDLEdBQVYsQ0FBYyxNQUFkLENBQVA7WUFDRSxPQUFBLEdBQWMsSUFBQSxPQUFBLENBQ1osT0FEWSxFQUVaLEtBQUMsQ0FBQSxhQUZXO1lBS2QsS0FBQyxDQUFBLFFBQVEsQ0FBQyxHQUFWLENBQWMsTUFBZCxFQUFzQixPQUF0QjttQkFFQSxLQUFDLENBQUEsV0FBVyxDQUFDLEdBQWIsQ0FBcUIsSUFBQSxVQUFBLENBQVcsU0FBQTtxQkFDOUIsT0FBTyxDQUFDLE9BQVIsQ0FBQTtZQUQ4QixDQUFYLENBQXJCLEVBUkY7O1FBTGlEO01BQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxDQUFsQyxDQUFqQjtJQUxRLENBQVY7SUFxQkEsVUFBQSxFQUFZLFNBQUE7YUFDVixJQUFDLENBQUEsV0FBVyxDQUFDLE9BQWIsQ0FBQTtJQURVLENBckJaO0lBd0JBLFNBQUEsRUFBVyxTQUFBO2FBQ1Q7UUFBQSxlQUFBLEVBQWlCLEVBQUUsQ0FBQyxlQUFlLENBQUMsSUFBbkIsQ0FBd0IsRUFBeEIsQ0FBakI7UUFDQSxhQUFBLEVBQWUsRUFBRSxDQUFDLGFBQWEsQ0FBQyxJQUFqQixDQUFzQixFQUF0QixDQURmOztJQURTLENBeEJYO0lBNEJBLFVBQUEsRUFBWSxTQUFDLEdBQUQ7TUFDVixJQUFDLENBQUEsR0FBRCxHQUFPO2FBQ1AsSUFBQyxDQUFBLGFBQWEsQ0FBQyxNQUFmLENBQXNCLEdBQXRCO0lBRlUsQ0E1Qlo7SUFnQ0EsTUFBQSxFQUNFO01BQUEsVUFBQSxFQUNFO1FBQUEsS0FBQSxFQUFPLGFBQVA7UUFDQSxXQUFBLEVBQWEsa0NBRGI7UUFFQSxJQUFBLEVBQU0sU0FGTjtRQUdBLENBQUEsT0FBQSxDQUFBLEVBQVMsT0FIVDtPQURGO01BS0EsVUFBQSxFQUNFO1FBQUEsS0FBQSxFQUFPLGFBQVA7UUFDQSxXQUFBLEVBQWEsa0NBRGI7UUFFQSxJQUFBLEVBQU0sU0FGTjtRQUdBLENBQUEsT0FBQSxDQUFBLEVBQVMsT0FIVDtPQU5GO0tBakNGOztBQU5GIiwic291cmNlc0NvbnRlbnQiOlsiR2xvYmFsRXhTdGF0ZSA9IHJlcXVpcmUgJy4vZ2xvYmFsLWV4LXN0YXRlJ1xuRXhTdGF0ZSA9IHJlcXVpcmUgJy4vZXgtc3RhdGUnXG5FeCA9IHJlcXVpcmUgJy4vZXgnXG57RGlzcG9zYWJsZSwgQ29tcG9zaXRlRGlzcG9zYWJsZX0gPSByZXF1aXJlICdldmVudC1raXQnXG5cbm1vZHVsZS5leHBvcnRzID0gRXhNb2RlID1cbiAgYWN0aXZhdGU6IChzdGF0ZSkgLT5cbiAgICBAZ2xvYmFsRXhTdGF0ZSA9IG5ldyBHbG9iYWxFeFN0YXRlXG4gICAgQGRpc3Bvc2FibGVzID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGVcbiAgICBAZXhTdGF0ZXMgPSBuZXcgV2Vha01hcFxuXG4gICAgQGRpc3Bvc2FibGVzLmFkZCBhdG9tLndvcmtzcGFjZS5vYnNlcnZlVGV4dEVkaXRvcnMgKGVkaXRvcikgPT5cbiAgICAgIHJldHVybiBpZiBlZGl0b3IubWluaVxuXG4gICAgICBlbGVtZW50ID0gYXRvbS52aWV3cy5nZXRWaWV3KGVkaXRvcilcblxuICAgICAgaWYgbm90IEBleFN0YXRlcy5nZXQoZWRpdG9yKVxuICAgICAgICBleFN0YXRlID0gbmV3IEV4U3RhdGUoXG4gICAgICAgICAgZWxlbWVudCxcbiAgICAgICAgICBAZ2xvYmFsRXhTdGF0ZVxuICAgICAgICApXG5cbiAgICAgICAgQGV4U3RhdGVzLnNldChlZGl0b3IsIGV4U3RhdGUpXG5cbiAgICAgICAgQGRpc3Bvc2FibGVzLmFkZCBuZXcgRGlzcG9zYWJsZSA9PlxuICAgICAgICAgIGV4U3RhdGUuZGVzdHJveSgpXG5cbiAgZGVhY3RpdmF0ZTogLT5cbiAgICBAZGlzcG9zYWJsZXMuZGlzcG9zZSgpXG5cbiAgcHJvdmlkZUV4OiAtPlxuICAgIHJlZ2lzdGVyQ29tbWFuZDogRXgucmVnaXN0ZXJDb21tYW5kLmJpbmQoRXgpXG4gICAgcmVnaXN0ZXJBbGlhczogRXgucmVnaXN0ZXJBbGlhcy5iaW5kKEV4KVxuXG4gIGNvbnN1bWVWaW06ICh2aW0pIC0+XG4gICAgQHZpbSA9IHZpbVxuICAgIEBnbG9iYWxFeFN0YXRlLnNldFZpbSh2aW0pXG5cbiAgY29uZmlnOlxuICAgIHNwbGl0YmVsb3c6XG4gICAgICB0aXRsZTogJ1NwbGl0IGJlbG93J1xuICAgICAgZGVzY3JpcHRpb246ICd3aGVuIHNwbGl0dGluZywgc3BsaXQgZnJvbSBiZWxvdydcbiAgICAgIHR5cGU6ICdib29sZWFuJ1xuICAgICAgZGVmYXVsdDogJ2ZhbHNlJ1xuICAgIHNwbGl0cmlnaHQ6XG4gICAgICB0aXRsZTogJ1NwbGl0IHJpZ2h0J1xuICAgICAgZGVzY3JpcHRpb246ICd3aGVuIHNwbGl0dGluZywgc3BsaXQgZnJvbSByaWdodCdcbiAgICAgIHR5cGU6ICdib29sZWFuJ1xuICAgICAgZGVmYXVsdDogJ2ZhbHNlJ1xuIl19
