(function() {
  var CompositeDisposable, Emitter, Input, ref;

  ref = require('atom'), Emitter = ref.Emitter, CompositeDisposable = ref.CompositeDisposable;

  module.exports = Input = (function() {
    Input.prototype.onDidChange = function(fn) {
      return this.emitter.on('did-change', fn);
    };

    Input.prototype.onDidConfirm = function(fn) {
      return this.emitter.on('did-confirm', fn);
    };

    Input.prototype.onDidCancel = function(fn) {
      return this.emitter.on('did-cancel', fn);
    };

    function Input(vimState) {
      this.vimState = vimState;
      this.editorElement = this.vimState.editorElement;
      this.vimState.onDidFailToPushToOperationStack((function(_this) {
        return function() {
          return _this.cancel();
        };
      })(this));
      this.emitter = new Emitter;
    }

    Input.prototype.destroy = function() {
      var ref1;
      return ref1 = {}, this.vimState = ref1.vimState, ref1;
    };

    Input.prototype.focus = function(charsMax) {
      var chars;
      if (charsMax == null) {
        charsMax = 1;
      }
      chars = [];
      this.disposables = new CompositeDisposable();
      this.disposables.add(this.vimState.swapClassName("vim-mode-plus-input-char-waiting", "is-focused"));
      this.disposables.add(this.vimState.onDidSetInputChar((function(_this) {
        return function(char) {
          var text;
          if (charsMax === 1) {
            return _this.confirm(char);
          } else {
            chars.push(char);
            text = chars.join('');
            _this.emitter.emit('did-change', text);
            if (chars.length >= charsMax) {
              return _this.confirm(text);
            }
          }
        };
      })(this)));
      return this.disposables.add(atom.commands.add(this.editorElement, {
        'core:cancel': (function(_this) {
          return function(event) {
            event.stopImmediatePropagation();
            return _this.cancel();
          };
        })(this),
        'core:confirm': (function(_this) {
          return function(event) {
            event.stopImmediatePropagation();
            return _this.confirm(chars.join(''));
          };
        })(this)
      }));
    };

    Input.prototype.confirm = function(char) {
      var ref1;
      if ((ref1 = this.disposables) != null) {
        ref1.dispose();
      }
      return this.emitter.emit('did-confirm', char);
    };

    Input.prototype.cancel = function() {
      var ref1;
      if ((ref1 = this.disposables) != null) {
        ref1.dispose();
      }
      return this.emitter.emit('did-cancel');
    };

    return Input;

  })();

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL2hvbWUvamFrZS8uYXRvbS9wYWNrYWdlcy92aW0tbW9kZS1wbHVzL2xpYi9pbnB1dC5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFBQSxNQUFBOztFQUFBLE1BQWlDLE9BQUEsQ0FBUSxNQUFSLENBQWpDLEVBQUMscUJBQUQsRUFBVTs7RUFFVixNQUFNLENBQUMsT0FBUCxHQUNNO29CQUNKLFdBQUEsR0FBYSxTQUFDLEVBQUQ7YUFBUSxJQUFDLENBQUEsT0FBTyxDQUFDLEVBQVQsQ0FBWSxZQUFaLEVBQTBCLEVBQTFCO0lBQVI7O29CQUNiLFlBQUEsR0FBYyxTQUFDLEVBQUQ7YUFBUSxJQUFDLENBQUEsT0FBTyxDQUFDLEVBQVQsQ0FBWSxhQUFaLEVBQTJCLEVBQTNCO0lBQVI7O29CQUNkLFdBQUEsR0FBYSxTQUFDLEVBQUQ7YUFBUSxJQUFDLENBQUEsT0FBTyxDQUFDLEVBQVQsQ0FBWSxZQUFaLEVBQTBCLEVBQTFCO0lBQVI7O0lBRUEsZUFBQyxRQUFEO01BQUMsSUFBQyxDQUFBLFdBQUQ7TUFDWCxJQUFDLENBQUEsZ0JBQWlCLElBQUMsQ0FBQSxTQUFsQjtNQUNGLElBQUMsQ0FBQSxRQUFRLENBQUMsK0JBQVYsQ0FBMEMsQ0FBQSxTQUFBLEtBQUE7ZUFBQSxTQUFBO2lCQUN4QyxLQUFDLENBQUEsTUFBRCxDQUFBO1FBRHdDO01BQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxDQUExQztNQUVBLElBQUMsQ0FBQSxPQUFELEdBQVcsSUFBSTtJQUpKOztvQkFNYixPQUFBLEdBQVMsU0FBQTtBQUNQLFVBQUE7YUFBQSxPQUFjLEVBQWQsRUFBQyxJQUFDLENBQUEsZ0JBQUEsUUFBRixFQUFBO0lBRE87O29CQUdULEtBQUEsR0FBTyxTQUFDLFFBQUQ7QUFDTCxVQUFBOztRQURNLFdBQVM7O01BQ2YsS0FBQSxHQUFRO01BRVIsSUFBQyxDQUFBLFdBQUQsR0FBbUIsSUFBQSxtQkFBQSxDQUFBO01BQ25CLElBQUMsQ0FBQSxXQUFXLENBQUMsR0FBYixDQUFpQixJQUFDLENBQUEsUUFBUSxDQUFDLGFBQVYsQ0FBd0Isa0NBQXhCLEVBQTZELFlBQTdELENBQWpCO01BQ0EsSUFBQyxDQUFBLFdBQVcsQ0FBQyxHQUFiLENBQWlCLElBQUMsQ0FBQSxRQUFRLENBQUMsaUJBQVYsQ0FBNEIsQ0FBQSxTQUFBLEtBQUE7ZUFBQSxTQUFDLElBQUQ7QUFDM0MsY0FBQTtVQUFBLElBQUcsUUFBQSxLQUFZLENBQWY7bUJBQ0UsS0FBQyxDQUFBLE9BQUQsQ0FBUyxJQUFULEVBREY7V0FBQSxNQUFBO1lBR0UsS0FBSyxDQUFDLElBQU4sQ0FBVyxJQUFYO1lBQ0EsSUFBQSxHQUFPLEtBQUssQ0FBQyxJQUFOLENBQVcsRUFBWDtZQUNQLEtBQUMsQ0FBQSxPQUFPLENBQUMsSUFBVCxDQUFjLFlBQWQsRUFBNEIsSUFBNUI7WUFDQSxJQUFHLEtBQUssQ0FBQyxNQUFOLElBQWdCLFFBQW5CO3FCQUNFLEtBQUMsQ0FBQSxPQUFELENBQVMsSUFBVCxFQURGO2FBTkY7O1FBRDJDO01BQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxDQUE1QixDQUFqQjthQVVBLElBQUMsQ0FBQSxXQUFXLENBQUMsR0FBYixDQUFpQixJQUFJLENBQUMsUUFBUSxDQUFDLEdBQWQsQ0FBa0IsSUFBQyxDQUFBLGFBQW5CLEVBQ2Y7UUFBQSxhQUFBLEVBQWUsQ0FBQSxTQUFBLEtBQUE7aUJBQUEsU0FBQyxLQUFEO1lBQ2IsS0FBSyxDQUFDLHdCQUFOLENBQUE7bUJBQ0EsS0FBQyxDQUFBLE1BQUQsQ0FBQTtVQUZhO1FBQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxDQUFmO1FBR0EsY0FBQSxFQUFnQixDQUFBLFNBQUEsS0FBQTtpQkFBQSxTQUFDLEtBQUQ7WUFDZCxLQUFLLENBQUMsd0JBQU4sQ0FBQTttQkFDQSxLQUFDLENBQUEsT0FBRCxDQUFTLEtBQUssQ0FBQyxJQUFOLENBQVcsRUFBWCxDQUFUO1VBRmM7UUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBLENBSGhCO09BRGUsQ0FBakI7SUFmSzs7b0JBdUJQLE9BQUEsR0FBUyxTQUFDLElBQUQ7QUFDUCxVQUFBOztZQUFZLENBQUUsT0FBZCxDQUFBOzthQUNBLElBQUMsQ0FBQSxPQUFPLENBQUMsSUFBVCxDQUFjLGFBQWQsRUFBNkIsSUFBN0I7SUFGTzs7b0JBSVQsTUFBQSxHQUFRLFNBQUE7QUFDTixVQUFBOztZQUFZLENBQUUsT0FBZCxDQUFBOzthQUNBLElBQUMsQ0FBQSxPQUFPLENBQUMsSUFBVCxDQUFjLFlBQWQ7SUFGTTs7Ozs7QUE1Q1YiLCJzb3VyY2VzQ29udGVudCI6WyJ7RW1pdHRlciwgQ29tcG9zaXRlRGlzcG9zYWJsZX0gPSByZXF1aXJlICdhdG9tJ1xuXG5tb2R1bGUuZXhwb3J0cyA9XG5jbGFzcyBJbnB1dFxuICBvbkRpZENoYW5nZTogKGZuKSAtPiBAZW1pdHRlci5vbiAnZGlkLWNoYW5nZScsIGZuXG4gIG9uRGlkQ29uZmlybTogKGZuKSAtPiBAZW1pdHRlci5vbiAnZGlkLWNvbmZpcm0nLCBmblxuICBvbkRpZENhbmNlbDogKGZuKSAtPiBAZW1pdHRlci5vbiAnZGlkLWNhbmNlbCcsIGZuXG5cbiAgY29uc3RydWN0b3I6IChAdmltU3RhdGUpIC0+XG4gICAge0BlZGl0b3JFbGVtZW50fSA9IEB2aW1TdGF0ZVxuICAgIEB2aW1TdGF0ZS5vbkRpZEZhaWxUb1B1c2hUb09wZXJhdGlvblN0YWNrID0+XG4gICAgICBAY2FuY2VsKClcbiAgICBAZW1pdHRlciA9IG5ldyBFbWl0dGVyXG5cbiAgZGVzdHJveTogLT5cbiAgICB7QHZpbVN0YXRlfSA9IHt9XG5cbiAgZm9jdXM6IChjaGFyc01heD0xKSAtPlxuICAgIGNoYXJzID0gW11cblxuICAgIEBkaXNwb3NhYmxlcyA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlKClcbiAgICBAZGlzcG9zYWJsZXMuYWRkIEB2aW1TdGF0ZS5zd2FwQ2xhc3NOYW1lKFwidmltLW1vZGUtcGx1cy1pbnB1dC1jaGFyLXdhaXRpbmdcIiwgIFwiaXMtZm9jdXNlZFwiKVxuICAgIEBkaXNwb3NhYmxlcy5hZGQgQHZpbVN0YXRlLm9uRGlkU2V0SW5wdXRDaGFyIChjaGFyKSA9PlxuICAgICAgaWYgY2hhcnNNYXggaXMgMVxuICAgICAgICBAY29uZmlybShjaGFyKVxuICAgICAgZWxzZVxuICAgICAgICBjaGFycy5wdXNoKGNoYXIpXG4gICAgICAgIHRleHQgPSBjaGFycy5qb2luKCcnKVxuICAgICAgICBAZW1pdHRlci5lbWl0KCdkaWQtY2hhbmdlJywgdGV4dClcbiAgICAgICAgaWYgY2hhcnMubGVuZ3RoID49IGNoYXJzTWF4XG4gICAgICAgICAgQGNvbmZpcm0odGV4dClcblxuICAgIEBkaXNwb3NhYmxlcy5hZGQgYXRvbS5jb21tYW5kcy5hZGQgQGVkaXRvckVsZW1lbnQsXG4gICAgICAnY29yZTpjYW5jZWwnOiAoZXZlbnQpID0+XG4gICAgICAgIGV2ZW50LnN0b3BJbW1lZGlhdGVQcm9wYWdhdGlvbigpXG4gICAgICAgIEBjYW5jZWwoKVxuICAgICAgJ2NvcmU6Y29uZmlybSc6IChldmVudCkgPT5cbiAgICAgICAgZXZlbnQuc3RvcEltbWVkaWF0ZVByb3BhZ2F0aW9uKClcbiAgICAgICAgQGNvbmZpcm0oY2hhcnMuam9pbignJykpXG5cbiAgY29uZmlybTogKGNoYXIpIC0+XG4gICAgQGRpc3Bvc2FibGVzPy5kaXNwb3NlKClcbiAgICBAZW1pdHRlci5lbWl0KCdkaWQtY29uZmlybScsIGNoYXIpXG5cbiAgY2FuY2VsOiAtPlxuICAgIEBkaXNwb3NhYmxlcz8uZGlzcG9zZSgpXG4gICAgQGVtaXR0ZXIuZW1pdCgnZGlkLWNhbmNlbCcpXG4iXX0=
