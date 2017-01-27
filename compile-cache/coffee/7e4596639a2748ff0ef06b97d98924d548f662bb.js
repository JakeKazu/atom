(function() {
  var AutoComplete, Ex, ExViewModel, Input, ViewModel, ref,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  ref = require('./view-model'), ViewModel = ref.ViewModel, Input = ref.Input;

  AutoComplete = require('./autocomplete');

  Ex = require('./ex');

  module.exports = ExViewModel = (function(superClass) {
    extend(ExViewModel, superClass);

    function ExViewModel(exCommand, withSelection) {
      this.exCommand = exCommand;
      this.confirm = bind(this.confirm, this);
      this.decreaseHistoryEx = bind(this.decreaseHistoryEx, this);
      this.increaseHistoryEx = bind(this.increaseHistoryEx, this);
      this.tabAutocomplete = bind(this.tabAutocomplete, this);
      ExViewModel.__super__.constructor.call(this, this.exCommand, {
        "class": 'command'
      });
      this.historyIndex = -1;
      if (withSelection) {
        this.view.editorElement.getModel().setText("'<,'>");
      }
      this.view.editorElement.addEventListener('keydown', this.tabAutocomplete);
      atom.commands.add(this.view.editorElement, 'core:move-up', this.increaseHistoryEx);
      atom.commands.add(this.view.editorElement, 'core:move-down', this.decreaseHistoryEx);
      this.autoComplete = new AutoComplete(Ex.getCommands());
    }

    ExViewModel.prototype.restoreHistory = function(index) {
      return this.view.editorElement.getModel().setText(this.history(index).value);
    };

    ExViewModel.prototype.history = function(index) {
      return this.exState.getExHistoryItem(index);
    };

    ExViewModel.prototype.tabAutocomplete = function(event) {
      var completed;
      if (event.keyCode === 9) {
        event.stopPropagation();
        event.preventDefault();
        completed = this.autoComplete.getAutocomplete(this.view.editorElement.getModel().getText());
        if (completed) {
          this.view.editorElement.getModel().setText(completed);
        }
        return false;
      } else {
        return this.autoComplete.resetCompletion();
      }
    };

    ExViewModel.prototype.increaseHistoryEx = function() {
      if (this.history(this.historyIndex + 1) != null) {
        this.historyIndex += 1;
        return this.restoreHistory(this.historyIndex);
      }
    };

    ExViewModel.prototype.decreaseHistoryEx = function() {
      if (this.historyIndex <= 0) {
        this.historyIndex = -1;
        return this.view.editorElement.getModel().setText('');
      } else {
        this.historyIndex -= 1;
        return this.restoreHistory(this.historyIndex);
      }
    };

    ExViewModel.prototype.confirm = function(view) {
      this.value = this.view.value;
      this.exState.pushExHistory(this);
      return ExViewModel.__super__.confirm.call(this, view);
    };

    return ExViewModel;

  })(ViewModel);

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL2hvbWUvamFrZS8uYXRvbS9wYWNrYWdlcy9leC1tb2RlL2xpYi9leC12aWV3LW1vZGVsLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUFBLE1BQUEsb0RBQUE7SUFBQTs7OztFQUFBLE1BQXFCLE9BQUEsQ0FBUSxjQUFSLENBQXJCLEVBQUMseUJBQUQsRUFBWTs7RUFDWixZQUFBLEdBQWUsT0FBQSxDQUFRLGdCQUFSOztFQUNmLEVBQUEsR0FBSyxPQUFBLENBQVEsTUFBUjs7RUFFTCxNQUFNLENBQUMsT0FBUCxHQUNNOzs7SUFDUyxxQkFBQyxTQUFELEVBQWEsYUFBYjtNQUFDLElBQUMsQ0FBQSxZQUFEOzs7OztNQUNaLDZDQUFNLElBQUMsQ0FBQSxTQUFQLEVBQWtCO1FBQUEsQ0FBQSxLQUFBLENBQUEsRUFBTyxTQUFQO09BQWxCO01BQ0EsSUFBQyxDQUFBLFlBQUQsR0FBZ0IsQ0FBQztNQUVqQixJQUFHLGFBQUg7UUFDRSxJQUFDLENBQUEsSUFBSSxDQUFDLGFBQWEsQ0FBQyxRQUFwQixDQUFBLENBQThCLENBQUMsT0FBL0IsQ0FBdUMsT0FBdkMsRUFERjs7TUFHQSxJQUFDLENBQUEsSUFBSSxDQUFDLGFBQWEsQ0FBQyxnQkFBcEIsQ0FBcUMsU0FBckMsRUFBZ0QsSUFBQyxDQUFBLGVBQWpEO01BQ0EsSUFBSSxDQUFDLFFBQVEsQ0FBQyxHQUFkLENBQWtCLElBQUMsQ0FBQSxJQUFJLENBQUMsYUFBeEIsRUFBdUMsY0FBdkMsRUFBdUQsSUFBQyxDQUFBLGlCQUF4RDtNQUNBLElBQUksQ0FBQyxRQUFRLENBQUMsR0FBZCxDQUFrQixJQUFDLENBQUEsSUFBSSxDQUFDLGFBQXhCLEVBQXVDLGdCQUF2QyxFQUF5RCxJQUFDLENBQUEsaUJBQTFEO01BRUEsSUFBQyxDQUFBLFlBQUQsR0FBb0IsSUFBQSxZQUFBLENBQWEsRUFBRSxDQUFDLFdBQUgsQ0FBQSxDQUFiO0lBWFQ7OzBCQWFiLGNBQUEsR0FBZ0IsU0FBQyxLQUFEO2FBQ2QsSUFBQyxDQUFBLElBQUksQ0FBQyxhQUFhLENBQUMsUUFBcEIsQ0FBQSxDQUE4QixDQUFDLE9BQS9CLENBQXVDLElBQUMsQ0FBQSxPQUFELENBQVMsS0FBVCxDQUFlLENBQUMsS0FBdkQ7SUFEYzs7MEJBR2hCLE9BQUEsR0FBUyxTQUFDLEtBQUQ7YUFDUCxJQUFDLENBQUEsT0FBTyxDQUFDLGdCQUFULENBQTBCLEtBQTFCO0lBRE87OzBCQUdULGVBQUEsR0FBaUIsU0FBQyxLQUFEO0FBQ2YsVUFBQTtNQUFBLElBQUcsS0FBSyxDQUFDLE9BQU4sS0FBaUIsQ0FBcEI7UUFDRSxLQUFLLENBQUMsZUFBTixDQUFBO1FBQ0EsS0FBSyxDQUFDLGNBQU4sQ0FBQTtRQUVBLFNBQUEsR0FBWSxJQUFDLENBQUEsWUFBWSxDQUFDLGVBQWQsQ0FBOEIsSUFBQyxDQUFBLElBQUksQ0FBQyxhQUFhLENBQUMsUUFBcEIsQ0FBQSxDQUE4QixDQUFDLE9BQS9CLENBQUEsQ0FBOUI7UUFDWixJQUFHLFNBQUg7VUFDRSxJQUFDLENBQUEsSUFBSSxDQUFDLGFBQWEsQ0FBQyxRQUFwQixDQUFBLENBQThCLENBQUMsT0FBL0IsQ0FBdUMsU0FBdkMsRUFERjs7QUFHQSxlQUFPLE1BUlQ7T0FBQSxNQUFBO2VBVUUsSUFBQyxDQUFBLFlBQVksQ0FBQyxlQUFkLENBQUEsRUFWRjs7SUFEZTs7MEJBYWpCLGlCQUFBLEdBQW1CLFNBQUE7TUFDakIsSUFBRywyQ0FBSDtRQUNFLElBQUMsQ0FBQSxZQUFELElBQWlCO2VBQ2pCLElBQUMsQ0FBQSxjQUFELENBQWdCLElBQUMsQ0FBQSxZQUFqQixFQUZGOztJQURpQjs7MEJBS25CLGlCQUFBLEdBQW1CLFNBQUE7TUFDakIsSUFBRyxJQUFDLENBQUEsWUFBRCxJQUFpQixDQUFwQjtRQUVFLElBQUMsQ0FBQSxZQUFELEdBQWdCLENBQUM7ZUFDakIsSUFBQyxDQUFBLElBQUksQ0FBQyxhQUFhLENBQUMsUUFBcEIsQ0FBQSxDQUE4QixDQUFDLE9BQS9CLENBQXVDLEVBQXZDLEVBSEY7T0FBQSxNQUFBO1FBS0UsSUFBQyxDQUFBLFlBQUQsSUFBaUI7ZUFDakIsSUFBQyxDQUFBLGNBQUQsQ0FBZ0IsSUFBQyxDQUFBLFlBQWpCLEVBTkY7O0lBRGlCOzswQkFTbkIsT0FBQSxHQUFTLFNBQUMsSUFBRDtNQUNQLElBQUMsQ0FBQSxLQUFELEdBQVMsSUFBQyxDQUFBLElBQUksQ0FBQztNQUNmLElBQUMsQ0FBQSxPQUFPLENBQUMsYUFBVCxDQUF1QixJQUF2QjthQUNBLHlDQUFNLElBQU47SUFITzs7OztLQS9DZTtBQUwxQiIsInNvdXJjZXNDb250ZW50IjpbIntWaWV3TW9kZWwsIElucHV0fSA9IHJlcXVpcmUgJy4vdmlldy1tb2RlbCdcbkF1dG9Db21wbGV0ZSA9IHJlcXVpcmUgJy4vYXV0b2NvbXBsZXRlJ1xuRXggPSByZXF1aXJlICcuL2V4J1xuXG5tb2R1bGUuZXhwb3J0cyA9XG5jbGFzcyBFeFZpZXdNb2RlbCBleHRlbmRzIFZpZXdNb2RlbFxuICBjb25zdHJ1Y3RvcjogKEBleENvbW1hbmQsIHdpdGhTZWxlY3Rpb24pIC0+XG4gICAgc3VwZXIoQGV4Q29tbWFuZCwgY2xhc3M6ICdjb21tYW5kJylcbiAgICBAaGlzdG9yeUluZGV4ID0gLTFcblxuICAgIGlmIHdpdGhTZWxlY3Rpb25cbiAgICAgIEB2aWV3LmVkaXRvckVsZW1lbnQuZ2V0TW9kZWwoKS5zZXRUZXh0KFwiJzwsJz5cIilcblxuICAgIEB2aWV3LmVkaXRvckVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcigna2V5ZG93bicsIEB0YWJBdXRvY29tcGxldGUpXG4gICAgYXRvbS5jb21tYW5kcy5hZGQoQHZpZXcuZWRpdG9yRWxlbWVudCwgJ2NvcmU6bW92ZS11cCcsIEBpbmNyZWFzZUhpc3RvcnlFeClcbiAgICBhdG9tLmNvbW1hbmRzLmFkZChAdmlldy5lZGl0b3JFbGVtZW50LCAnY29yZTptb3ZlLWRvd24nLCBAZGVjcmVhc2VIaXN0b3J5RXgpXG5cbiAgICBAYXV0b0NvbXBsZXRlID0gbmV3IEF1dG9Db21wbGV0ZShFeC5nZXRDb21tYW5kcygpKVxuXG4gIHJlc3RvcmVIaXN0b3J5OiAoaW5kZXgpIC0+XG4gICAgQHZpZXcuZWRpdG9yRWxlbWVudC5nZXRNb2RlbCgpLnNldFRleHQoQGhpc3RvcnkoaW5kZXgpLnZhbHVlKVxuXG4gIGhpc3Rvcnk6IChpbmRleCkgLT5cbiAgICBAZXhTdGF0ZS5nZXRFeEhpc3RvcnlJdGVtKGluZGV4KVxuXG4gIHRhYkF1dG9jb21wbGV0ZTogKGV2ZW50KSA9PlxuICAgIGlmIGV2ZW50LmtleUNvZGUgPT0gOVxuICAgICAgZXZlbnQuc3RvcFByb3BhZ2F0aW9uKClcbiAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KClcblxuICAgICAgY29tcGxldGVkID0gQGF1dG9Db21wbGV0ZS5nZXRBdXRvY29tcGxldGUoQHZpZXcuZWRpdG9yRWxlbWVudC5nZXRNb2RlbCgpLmdldFRleHQoKSlcbiAgICAgIGlmIGNvbXBsZXRlZFxuICAgICAgICBAdmlldy5lZGl0b3JFbGVtZW50LmdldE1vZGVsKCkuc2V0VGV4dChjb21wbGV0ZWQpXG5cbiAgICAgIHJldHVybiBmYWxzZVxuICAgIGVsc2VcbiAgICAgIEBhdXRvQ29tcGxldGUucmVzZXRDb21wbGV0aW9uKClcblxuICBpbmNyZWFzZUhpc3RvcnlFeDogPT5cbiAgICBpZiBAaGlzdG9yeShAaGlzdG9yeUluZGV4ICsgMSk/XG4gICAgICBAaGlzdG9yeUluZGV4ICs9IDFcbiAgICAgIEByZXN0b3JlSGlzdG9yeShAaGlzdG9yeUluZGV4KVxuXG4gIGRlY3JlYXNlSGlzdG9yeUV4OiA9PlxuICAgIGlmIEBoaXN0b3J5SW5kZXggPD0gMFxuICAgICAgIyBnZXQgdXMgYmFjayB0byBhIGNsZWFuIHNsYXRlXG4gICAgICBAaGlzdG9yeUluZGV4ID0gLTFcbiAgICAgIEB2aWV3LmVkaXRvckVsZW1lbnQuZ2V0TW9kZWwoKS5zZXRUZXh0KCcnKVxuICAgIGVsc2VcbiAgICAgIEBoaXN0b3J5SW5kZXggLT0gMVxuICAgICAgQHJlc3RvcmVIaXN0b3J5KEBoaXN0b3J5SW5kZXgpXG5cbiAgY29uZmlybTogKHZpZXcpID0+XG4gICAgQHZhbHVlID0gQHZpZXcudmFsdWVcbiAgICBAZXhTdGF0ZS5wdXNoRXhIaXN0b3J5KEApXG4gICAgc3VwZXIodmlldylcbiJdfQ==
