(function() {
  var CompositeDisposable, Input, REGISTERS, RegisterManager, settings,
    slice = [].slice;

  settings = require('./settings');

  CompositeDisposable = require('atom').CompositeDisposable;

  Input = require('./input');

  REGISTERS = /(?:[a-zA-Z*+%_".])/;

  RegisterManager = (function() {
    function RegisterManager(vimState) {
      var ref;
      this.vimState = vimState;
      ref = this.vimState, this.editor = ref.editor, this.editorElement = ref.editorElement, this.globalState = ref.globalState;
      this.data = this.globalState.get('register');
      this.subscriptionBySelection = new Map;
      this.clipboardBySelection = new Map;
    }

    RegisterManager.prototype.reset = function() {
      this.name = null;
      return this.vimState.toggleClassList('with-register', this.hasName());
    };

    RegisterManager.prototype.destroy = function() {
      var ref;
      this.subscriptionBySelection.forEach(function(disposable) {
        return disposable.dispose();
      });
      this.subscriptionBySelection.clear();
      this.clipboardBySelection.clear();
      return ref = {}, this.subscriptionBySelection = ref.subscriptionBySelection, this.clipboardBySelection = ref.clipboardBySelection, ref;
    };

    RegisterManager.prototype.isValidName = function(name) {
      return REGISTERS.test(name);
    };

    RegisterManager.prototype.getText = function(name, selection) {
      var ref;
      return (ref = this.get(name, selection).text) != null ? ref : '';
    };

    RegisterManager.prototype.readClipboard = function(selection) {
      if (selection == null) {
        selection = null;
      }
      if ((selection != null ? selection.editor.hasMultipleCursors() : void 0) && this.clipboardBySelection.has(selection)) {
        return this.clipboardBySelection.get(selection);
      } else {
        return atom.clipboard.read();
      }
    };

    RegisterManager.prototype.writeClipboard = function(selection, text) {
      var disposable;
      if (selection == null) {
        selection = null;
      }
      if ((selection != null ? selection.editor.hasMultipleCursors() : void 0) && !this.clipboardBySelection.has(selection)) {
        disposable = selection.onDidDestroy((function(_this) {
          return function() {
            _this.subscriptionBySelection["delete"](selection);
            return _this.clipboardBySelection["delete"](selection);
          };
        })(this));
        this.subscriptionBySelection.set(selection, disposable);
      }
      if ((selection === null) || selection.isLastSelection()) {
        atom.clipboard.write(text);
      }
      if (selection != null) {
        return this.clipboardBySelection.set(selection, text);
      }
    };

    RegisterManager.prototype.get = function(name, selection) {
      var ref, ref1, text, type;
      if (name == null) {
        name = this.getName();
      }
      if (name === '"') {
        name = settings.get('defaultRegister');
      }
      switch (name) {
        case '*':
        case '+':
          text = this.readClipboard(selection);
          break;
        case '%':
          text = this.editor.getURI();
          break;
        case '_':
          text = '';
          break;
        default:
          ref1 = (ref = this.data[name.toLowerCase()]) != null ? ref : {}, text = ref1.text, type = ref1.type;
      }
      if (type == null) {
        type = this.getCopyType(text != null ? text : '');
      }
      return {
        text: text,
        type: type
      };
    };

    RegisterManager.prototype.set = function() {
      var args, name, ref, selection, value;
      args = 1 <= arguments.length ? slice.call(arguments, 0) : [];
      ref = [], name = ref[0], value = ref[1];
      switch (args.length) {
        case 1:
          value = args[0];
          break;
        case 2:
          name = args[0], value = args[1];
      }
      if (name == null) {
        name = this.getName();
      }
      if (!this.isValidName(name)) {
        return;
      }
      if (name === '"') {
        name = settings.get('defaultRegister');
      }
      if (value.type == null) {
        value.type = this.getCopyType(value.text);
      }
      selection = value.selection;
      delete value.selection;
      switch (name) {
        case '*':
        case '+':
          return this.writeClipboard(selection, value.text);
        case '_':
        case '%':
          return null;
        default:
          if (/^[A-Z]$/.test(name)) {
            return this.append(name.toLowerCase(), value);
          } else {
            return this.data[name] = value;
          }
      }
    };

    RegisterManager.prototype.append = function(name, value) {
      var register;
      if (!(register = this.data[name])) {
        this.data[name] = value;
        return;
      }
      if ('linewise' === register.type || 'linewise' === value.type) {
        if (register.type !== 'linewise') {
          register.text += '\n';
          register.type = 'linewise';
        }
        if (value.type !== 'linewise') {
          value.text += '\n';
        }
      }
      return register.text += value.text;
    };

    RegisterManager.prototype.getName = function() {
      var ref;
      return (ref = this.name) != null ? ref : settings.get('defaultRegister');
    };

    RegisterManager.prototype.isDefaultName = function() {
      return this.getName() === settings.get('defaultRegister');
    };

    RegisterManager.prototype.hasName = function() {
      return this.name != null;
    };

    RegisterManager.prototype.setName = function(name) {
      var inputUI;
      if (name == null) {
        name = null;
      }
      if (name != null) {
        if (this.isValidName(name)) {
          return this.name = name;
        }
      } else {
        this.vimState.hover.set('"');
        inputUI = new Input(this.vimState);
        inputUI.onDidConfirm((function(_this) {
          return function(name1) {
            _this.name = name1;
            _this.vimState.toggleClassList('with-register', true);
            return _this.vimState.hover.set('"' + _this.name);
          };
        })(this));
        inputUI.onDidCancel((function(_this) {
          return function() {
            return _this.vimState.hover.reset();
          };
        })(this));
        return inputUI.focus(1);
      }
    };

    RegisterManager.prototype.getCopyType = function(text) {
      if (text.lastIndexOf("\n") === text.length - 1) {
        return 'linewise';
      } else if (text.lastIndexOf("\r") === text.length - 1) {
        return 'linewise';
      } else {
        return 'characterwise';
      }
    };

    return RegisterManager;

  })();

  module.exports = RegisterManager;

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL2hvbWUvamFrZS8uYXRvbS9wYWNrYWdlcy92aW0tbW9kZS1wbHVzL2xpYi9yZWdpc3Rlci1tYW5hZ2VyLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUFBLE1BQUEsZ0VBQUE7SUFBQTs7RUFBQSxRQUFBLEdBQVcsT0FBQSxDQUFRLFlBQVI7O0VBQ1Ysc0JBQXVCLE9BQUEsQ0FBUSxNQUFSOztFQUN4QixLQUFBLEdBQVEsT0FBQSxDQUFRLFNBQVI7O0VBRVIsU0FBQSxHQUFZOztFQWlCTjtJQUNTLHlCQUFDLFFBQUQ7QUFDWCxVQUFBO01BRFksSUFBQyxDQUFBLFdBQUQ7TUFDWixNQUEwQyxJQUFDLENBQUEsUUFBM0MsRUFBQyxJQUFDLENBQUEsYUFBQSxNQUFGLEVBQVUsSUFBQyxDQUFBLG9CQUFBLGFBQVgsRUFBMEIsSUFBQyxDQUFBLGtCQUFBO01BQzNCLElBQUMsQ0FBQSxJQUFELEdBQVEsSUFBQyxDQUFBLFdBQVcsQ0FBQyxHQUFiLENBQWlCLFVBQWpCO01BQ1IsSUFBQyxDQUFBLHVCQUFELEdBQTJCLElBQUk7TUFDL0IsSUFBQyxDQUFBLG9CQUFELEdBQXdCLElBQUk7SUFKakI7OzhCQU1iLEtBQUEsR0FBTyxTQUFBO01BQ0wsSUFBQyxDQUFBLElBQUQsR0FBUTthQUNSLElBQUMsQ0FBQSxRQUFRLENBQUMsZUFBVixDQUEwQixlQUExQixFQUEyQyxJQUFDLENBQUEsT0FBRCxDQUFBLENBQTNDO0lBRks7OzhCQUlQLE9BQUEsR0FBUyxTQUFBO0FBQ1AsVUFBQTtNQUFBLElBQUMsQ0FBQSx1QkFBdUIsQ0FBQyxPQUF6QixDQUFpQyxTQUFDLFVBQUQ7ZUFDL0IsVUFBVSxDQUFDLE9BQVgsQ0FBQTtNQUQrQixDQUFqQztNQUVBLElBQUMsQ0FBQSx1QkFBdUIsQ0FBQyxLQUF6QixDQUFBO01BQ0EsSUFBQyxDQUFBLG9CQUFvQixDQUFDLEtBQXRCLENBQUE7YUFDQSxNQUFvRCxFQUFw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RE87OzhCQWNULFdBQUEsR0FBYSxTQUFDLElBQUQ7TUFDWCxJQUFHLElBQUksQ0FBQyxXQUFMLENBQWlCLElBQWpCLENBQUEsS0FBMEIsSUFBSSxDQUFDLE1BQUwsR0FBYyxDQUEzQztlQUNFLFdBREY7T0FBQSxNQUVLLElBQUcsSUFBSSxDQUFDLFdBQUwsQ0FBaUIsSUFBakIsQ0FBQSxLQUEwQixJQUFJLENBQUMsTUFBTCxHQUFjLENBQTNDO2VBQ0gsV0FERztPQUFBLE1BQUE7ZUFHSCxnQkFIRzs7SUFITTs7Ozs7O0VBUWYsTUFBTSxDQUFDLE9BQVAsR0FBaUI7QUF2SmpCIiwic291cmNlc0NvbnRlbnQiOlsic2V0dGluZ3MgPSByZXF1aXJlICcuL3NldHRpbmdzJ1xue0NvbXBvc2l0ZURpc3Bvc2FibGV9ID0gcmVxdWlyZSAnYXRvbSdcbklucHV0ID0gcmVxdWlyZSAnLi9pbnB1dCdcblxuUkVHSVNURVJTID0gLy8vIChcbiAgPzogW2EtekEtWiorJV9cIi5dXG4pIC8vL1xuXG4jIFRPRE86IFZpbSBzdXBwb3J0IGZvbGxvd2luZyByZWdpc3RlcnMuXG4jIHg6IGNvbXBsZXRlLCAtOiBwYXJ0aWFsbHlcbiMgIFt4XSAxLiBUaGUgdW5uYW1lZCByZWdpc3RlciBcIlwiXG4jICBbIF0gMi4gMTAgbnVtYmVyZWQgcmVnaXN0ZXJzIFwiMCB0byBcIjlcbiMgIFsgXSAzLiBUaGUgc21hbGwgZGVsZXRlIHJlZ2lzdGVyIFwiLVxuIyAgW3hdIDQuIDI2IG5hbWVkIHJlZ2lzdGVycyBcImEgdG8gXCJ6IG9yIFwiQSB0byBcIlpcbiMgIFstXSA1LiB0aHJlZSByZWFkLW9ubHkgcmVnaXN0ZXJzIFwiOiwgXCIuLCBcIiVcbiMgIFsgXSA2LiBhbHRlcm5hdGUgYnVmZmVyIHJlZ2lzdGVyIFwiI1xuIyAgWyBdIDcuIHRoZSBleHByZXNzaW9uIHJlZ2lzdGVyIFwiPVxuIyAgWyBdIDguIFRoZSBzZWxlY3Rpb24gYW5kIGRyb3AgcmVnaXN0ZXJzIFwiKiwgXCIrIGFuZCBcIn5cbiMgIFt4XSA5LiBUaGUgYmxhY2sgaG9sZSByZWdpc3RlciBcIl9cbiMgIFsgXSAxMC4gTGFzdCBzZWFyY2ggcGF0dGVybiByZWdpc3RlciBcIi9cblxuY2xhc3MgUmVnaXN0ZXJNYW5hZ2VyXG4gIGNvbnN0cnVjdG9yOiAoQHZpbVN0YXRlKSAtPlxuICAgIHtAZWRpdG9yLCBAZWRpdG9yRWxlbWVudCwgQGdsb2JhbFN0YXRlfSA9IEB2aW1TdGF0ZVxuICAgIEBkYXRhID0gQGdsb2JhbFN0YXRlLmdldCgncmVnaXN0ZXInKVxuICAgIEBzdWJzY3JpcHRpb25CeVNlbGVjdGlvbiA9IG5ldyBNYXBcbiAgICBAY2xpcGJvYXJkQnlTZWxlY3Rpb24gPSBuZXcgTWFwXG5cbiAgcmVzZXQ6IC0+XG4gICAgQG5hbWUgPSBudWxsXG4gICAgQHZpbVN0YXRlLnRvZ2dsZUNsYXNzTGlzdCgnd2l0aC1yZWdpc3RlcicsIEBoYXNOYW1lKCkpXG5cbiAgZGVzdHJveTogLT5cbiAgICBAc3Vic2NyaXB0aW9uQnlTZWxlY3Rpb24uZm9yRWFjaCAoZGlzcG9zYWJsZSkgLT5cbiAgICAgIGRpc3Bvc2FibGUuZGlzcG9zZSgpXG4gICAgQHN1YnNjcmlwdGlvbkJ5U2VsZWN0aW9uLmNsZWFyKClcbiAgICBAY2xpcGJvYXJkQnlTZWxlY3Rpb24uY2xlYXIoKVxuICAgIHtAc3Vic2NyaXB0aW9uQnlTZWxlY3Rpb24sIEBjbGlwYm9hcmRCeVNlbGVjdGlvbn0gPSB7fVxuXG4gIGlzVmFsaWROYW1lOiAobmFtZSkgLT5cbiAgICBSRUdJU1RFUlMudGVzdChuYW1lKVxuXG4gIGdldFRleHQ6IChuYW1lLCBzZWxlY3Rpb24pIC0+XG4gICAgQGdldChuYW1lLCBzZWxlY3Rpb24pLnRleHQgPyAnJ1xuXG4gIHJlYWRDbGlwYm9hcmQ6IChzZWxlY3Rpb249bnVsbCkgLT5cbiAgICBpZiBzZWxlY3Rpb24/LmVkaXRvci5oYXNNdWx0aXBsZUN1cnNvcnMoKSBhbmQgQGNsaXBib2FyZEJ5U2VsZWN0aW9uLmhhcyhzZWxlY3Rpb24pXG4gICAgICBAY2xpcGJvYXJkQnlTZWxlY3Rpb24uZ2V0KHNlbGVjdGlvbilcbiAgICBlbHNlXG4gICAgICBhdG9tLmNsaXBib2FyZC5yZWFkKClcblxuICB3cml0ZUNsaXBib2FyZDogKHNlbGVjdGlvbj1udWxsLCB0ZXh0KSAtPlxuICAgIGlmIHNlbGVjdGlvbj8uZWRpdG9yLmhhc011bHRpcGxlQ3Vyc29ycygpIGFuZCBub3QgQGNsaXBib2FyZEJ5U2VsZWN0aW9uLmhhcyhzZWxlY3Rpb24pXG4gICAgICBkaXNwb3NhYmxlID0gc2VsZWN0aW9uLm9uRGlkRGVzdHJveSA9PlxuICAgICAgICBAc3Vic2NyaXB0aW9uQnlTZWxlY3Rpb24uZGVsZXRlKHNlbGVjdGlvbilcbiAgICAgICAgQGNsaXBib2FyZEJ5U2VsZWN0aW9uLmRlbGV0ZShzZWxlY3Rpb24pXG4gICAgICBAc3Vic2NyaXB0aW9uQnlTZWxlY3Rpb24uc2V0KHNlbGVjdGlvbiwgZGlzcG9zYWJsZSlcblxuICAgIGlmIChzZWxlY3Rpb24gaXMgbnVsbCkgb3Igc2VsZWN0aW9uLmlzTGFzdFNlbGVjdGlvbigpXG4gICAgICBhdG9tLmNsaXBib2FyZC53cml0ZSh0ZXh0KVxuICAgIEBjbGlwYm9hcmRCeVNlbGVjdGlvbi5zZXQoc2VsZWN0aW9uLCB0ZXh0KSBpZiBzZWxlY3Rpb24/XG5cbiAgZ2V0OiAobmFtZSwgc2VsZWN0aW9uKSAtPlxuICAgIG5hbWUgPz0gQGdldE5hbWUoKVxuICAgIG5hbWUgPSBzZXR0aW5ncy5nZXQoJ2RlZmF1bHRSZWdpc3RlcicpIGlmIG5hbWUgaXMgJ1wiJ1xuXG4gICAgc3dpdGNoIG5hbWVcbiAgICAgIHdoZW4gJyonLCAnKycgdGhlbiB0ZXh0ID0gQHJlYWRDbGlwYm9hcmQoc2VsZWN0aW9uKVxuICAgICAgd2hlbiAnJScgdGhlbiB0ZXh0ID0gQGVkaXRvci5nZXRVUkkoKVxuICAgICAgd2hlbiAnXycgdGhlbiB0ZXh0ID0gJycgIyBCbGFja2hvbGUgYWx3YXlzIHJldHVybnMgbm90aGluZ1xuICAgICAgZWxzZVxuICAgICAgICB7dGV4dCwgdHlwZX0gPSBAZGF0YVtuYW1lLnRvTG93ZXJDYXNlKCldID8ge31cbiAgICB0eXBlID89IEBnZXRDb3B5VHlwZSh0ZXh0ID8gJycpXG4gICAge3RleHQsIHR5cGV9XG5cbiAgIyBQcml2YXRlOiBTZXRzIHRoZSB2YWx1ZSBvZiBhIGdpdmVuIHJlZ2lzdGVyLlxuICAjXG4gICMgbmFtZSAgLSBUaGUgbmFtZSBvZiB0aGUgcmVnaXN0ZXIgdG8gZmV0Y2guXG4gICMgdmFsdWUgLSBUaGUgdmFsdWUgdG8gc2V0IHRoZSByZWdpc3RlciB0bywgd2l0aCBmb2xsb3dpbmcgcHJvcGVydGllcy5cbiAgIyAgdGV4dDogdGV4dCB0byBzYXZlIHRvIHJlZ2lzdGVyLlxuICAjICB0eXBlOiAob3B0aW9uYWwpIGlmIG9tbWl0ZWQgYXV0b21hdGljYWxseSBzZXQgZnJvbSB0ZXh0LlxuICAjXG4gICMgUmV0dXJucyBub3RoaW5nLlxuICBzZXQ6IChhcmdzLi4uKSAtPlxuICAgIFtuYW1lLCB2YWx1ZV0gPSBbXVxuICAgIHN3aXRjaCBhcmdzLmxlbmd0aFxuICAgICAgd2hlbiAxIHRoZW4gW3ZhbHVlXSA9IGFyZ3NcbiAgICAgIHdoZW4gMiB0aGVuIFtuYW1lLCB2YWx1ZV0gPSBhcmdzXG5cbiAgICBuYW1lID89IEBnZXROYW1lKClcbiAgICByZXR1cm4gdW5sZXNzIEBpc1ZhbGlkTmFtZShuYW1lKVxuICAgIG5hbWUgPSBzZXR0aW5ncy5nZXQoJ2RlZmF1bHRSZWdpc3RlcicpIGlmIG5hbWUgaXMgJ1wiJ1xuICAgIHZhbHVlLnR5cGUgPz0gQGdldENvcHlUeXBlKHZhbHVlLnRleHQpXG5cbiAgICBzZWxlY3Rpb24gPSB2YWx1ZS5zZWxlY3Rpb25cbiAgICBkZWxldGUgdmFsdWUuc2VsZWN0aW9uXG4gICAgc3dpdGNoIG5hbWVcbiAgICAgIHdoZW4gJyonLCAnKycgdGhlbiBAd3JpdGVDbGlwYm9hcmQoc2VsZWN0aW9uLCB2YWx1ZS50ZXh0KVxuICAgICAgd2hlbiAnXycsICclJyB0aGVuIG51bGxcbiAgICAgIGVsc2VcbiAgICAgICAgaWYgL15bQS1aXSQvLnRlc3QobmFtZSlcbiAgICAgICAgICBAYXBwZW5kKG5hbWUudG9Mb3dlckNhc2UoKSwgdmFsdWUpXG4gICAgICAgIGVsc2VcbiAgICAgICAgICBAZGF0YVtuYW1lXSA9IHZhbHVlXG5cbiAgIyBQcml2YXRlOiBhcHBlbmQgYSB2YWx1ZSBpbnRvIGEgZ2l2ZW4gcmVnaXN0ZXJcbiAgIyBsaWtlIHNldFJlZ2lzdGVyLCBidXQgYXBwZW5kcyB0aGUgdmFsdWVcbiAgYXBwZW5kOiAobmFtZSwgdmFsdWUpIC0+XG4gICAgdW5sZXNzIHJlZ2lzdGVyID0gQGRhdGFbbmFtZV1cbiAgICAgIEBkYXRhW25hbWVdID0gdmFsdWVcbiAgICAgIHJldHVyblxuXG4gICAgaWYgJ2xpbmV3aXNlJyBpbiBbcmVnaXN0ZXIudHlwZSwgdmFsdWUudHlwZV1cbiAgICAgIGlmIHJlZ2lzdGVyLnR5cGUgaXNudCAnbGluZXdpc2UnXG4gICAgICAgIHJlZ2lzdGVyLnRleHQgKz0gJ1xcbidcbiAgICAgICAgcmVnaXN0ZXIudHlwZSA9ICdsaW5ld2lzZSdcbiAgICAgIGlmIHZhbHVlLnR5cGUgaXNudCAnbGluZXdpc2UnXG4gICAgICAgIHZhbHVlLnRleHQgKz0gJ1xcbidcbiAgICByZWdpc3Rlci50ZXh0ICs9IHZhbHVlLnRleHRcblxuICBnZXROYW1lOiAtPlxuICAgIEBuYW1lID8gc2V0dGluZ3MuZ2V0KCdkZWZhdWx0UmVnaXN0ZXInKVxuXG4gIGlzRGVmYXVsdE5hbWU6IC0+XG4gICAgQGdldE5hbWUoKSBpcyBzZXR0aW5ncy5nZXQoJ2RlZmF1bHRSZWdpc3RlcicpXG5cbiAgaGFzTmFtZTogLT5cbiAgICBAbmFtZT9cblxuICBzZXROYW1lOiAobmFtZT1udWxsKSAtPlxuICAgIGlmIG5hbWU/XG4gICAgICBAbmFtZSA9IG5hbWUgaWYgQGlzVmFsaWROYW1lKG5hbWUpXG4gICAgZWxzZVxuICAgICAgQHZpbVN0YXRlLmhvdmVyLnNldCgnXCInKVxuXG4gICAgICBpbnB1dFVJID0gbmV3IElucHV0KEB2aW1TdGF0ZSlcbiAgICAgIGlucHV0VUkub25EaWRDb25maXJtIChAbmFtZSkgPT5cbiAgICAgICAgQHZpbVN0YXRlLnRvZ2dsZUNsYXNzTGlzdCgnd2l0aC1yZWdpc3RlcicsIHRydWUpXG4gICAgICAgIEB2aW1TdGF0ZS5ob3Zlci5zZXQoJ1wiJyArIEBuYW1lKVxuICAgICAgaW5wdXRVSS5vbkRpZENhbmNlbCA9PlxuICAgICAgICBAdmltU3RhdGUuaG92ZXIucmVzZXQoKVxuICAgICAgaW5wdXRVSS5mb2N1cygxKVxuXG4gIGdldENvcHlUeXBlOiAodGV4dCkgLT5cbiAgICBpZiB0ZXh0Lmxhc3RJbmRleE9mKFwiXFxuXCIpIGlzIHRleHQubGVuZ3RoIC0gMVxuICAgICAgJ2xpbmV3aXNlJ1xuICAgIGVsc2UgaWYgdGV4dC5sYXN0SW5kZXhPZihcIlxcclwiKSBpcyB0ZXh0Lmxlbmd0aCAtIDFcbiAgICAgICdsaW5ld2lzZSdcbiAgICBlbHNlXG4gICAgICAnY2hhcmFjdGVyd2lzZSdcblxubW9kdWxlLmV4cG9ydHMgPSBSZWdpc3Rlck1hbmFnZXJcbiJdfQ==
