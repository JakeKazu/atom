(function() {
  var CompositeDisposable, Disposable, Emitter, SearchInput, ref, registerElement,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty,
    indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  ref = require('atom'), Emitter = ref.Emitter, Disposable = ref.Disposable, CompositeDisposable = ref.CompositeDisposable;

  registerElement = require('./utils').registerElement;

  SearchInput = (function(superClass) {
    extend(SearchInput, superClass);

    function SearchInput() {
      return SearchInput.__super__.constructor.apply(this, arguments);
    }

    SearchInput.prototype.literalModeDeactivator = null;

    SearchInput.prototype.onDidChange = function(fn) {
      return this.emitter.on('did-change', fn);
    };

    SearchInput.prototype.onDidConfirm = function(fn) {
      return this.emitter.on('did-confirm', fn);
    };

    SearchInput.prototype.onDidCancel = function(fn) {
      return this.emitter.on('did-cancel', fn);
    };

    SearchInput.prototype.onDidCommand = function(fn) {
      return this.emitter.on('did-command', fn);
    };

    SearchInput.prototype.createdCallback = function() {
      var editorContainer, optionsContainer, ref1;
      this.className = "vim-mode-plus-search-container";
      this.emitter = new Emitter;
      this.innerHTML = "<div class='options-container'>\n  <span class='inline-block-tight btn btn-primary'>.*</span>\n</div>\n<div class='editor-container'>\n  <atom-text-editor mini class='editor vim-mode-plus-search'></atom-text-editor>\n</div>";
      ref1 = this.getElementsByTagName('div'), optionsContainer = ref1[0], editorContainer = ref1[1];
      this.regexSearchStatus = optionsContainer.firstElementChild;
      this.editorElement = editorContainer.firstElementChild;
      this.editor = this.editorElement.getModel();
      this.editor.setMini(true);
      this.editor.onDidChange((function(_this) {
        return function() {
          if (_this.finished) {
            return;
          }
          return _this.emitter.emit('did-change', _this.editor.getText());
        };
      })(this));
      this.panel = atom.workspace.addBottomPanel({
        item: this,
        visible: false
      });
      return this;
    };

    SearchInput.prototype.destroy = function() {
      var ref1, ref2;
      this.disposables.dispose();
      this.editor.destroy();
      if ((ref1 = this.panel) != null) {
        ref1.destroy();
      }
      ref2 = {}, this.editor = ref2.editor, this.panel = ref2.panel, this.editorElement = ref2.editorElement, this.vimState = ref2.vimState;
      return this.remove();
    };

    SearchInput.prototype.handleEvents = function() {
      return atom.commands.add(this.editorElement, {
        'core:confirm': (function(_this) {
          return function() {
            return _this.confirm();
          };
        })(this),
        'core:cancel': (function(_this) {
          return function() {
            return _this.cancel();
          };
        })(this),
        'core:backspace': (function(_this) {
          return function() {
            return _this.backspace();
          };
        })(this),
        'vim-mode-plus:input-cancel': (function(_this) {
          return function() {
            return _this.cancel();
          };
        })(this)
      });
    };

    SearchInput.prototype.focus = function(options1) {
      var cancel, ref1;
      this.options = options1 != null ? options1 : {};
      this.finished = false;
      if (this.options.classList != null) {
        (ref1 = this.editorElement.classList).add.apply(ref1, this.options.classList);
      }
      this.panel.show();
      this.editorElement.focus();
      this.focusSubscriptions = new CompositeDisposable;
      this.focusSubscriptions.add(this.handleEvents());
      cancel = this.cancel.bind(this);
      this.vimState.editorElement.addEventListener('click', cancel);
      this.focusSubscriptions.add(new Disposable((function(_this) {
        return function() {
          return _this.vimState.editorElement.removeEventListener('click', cancel);
        };
      })(this)));
      return this.focusSubscriptions.add(atom.workspace.onDidChangeActivePaneItem(cancel));
    };

    SearchInput.prototype.unfocus = function() {
      var ref1, ref2, ref3, ref4, ref5;
      this.finished = true;
      if (((ref1 = this.options) != null ? ref1.classList : void 0) != null) {
        (ref2 = this.editorElement.classList).remove.apply(ref2, this.options.classList);
      }
      this.regexSearchStatus.classList.add('btn-primary');
      if ((ref3 = this.literalModeDeactivator) != null) {
        ref3.dispose();
      }
      if ((ref4 = this.focusSubscriptions) != null) {
        ref4.dispose();
      }
      atom.workspace.getActivePane().activate();
      this.editor.setText('');
      return (ref5 = this.panel) != null ? ref5.hide() : void 0;
    };

    SearchInput.prototype.updateOptionSettings = function(arg) {
      var useRegexp;
      useRegexp = (arg != null ? arg : {}).useRegexp;
      return this.regexSearchStatus.classList.toggle('btn-primary', useRegexp);
    };

    SearchInput.prototype.setCursorWord = function() {
      return this.editor.insertText(this.vimState.editor.getWordUnderCursor());
    };

    SearchInput.prototype.activateLiteralMode = function() {
      if (this.literalModeDeactivator != null) {
        return this.literalModeDeactivator.dispose();
      } else {
        this.literalModeDeactivator = new CompositeDisposable();
        this.editorElement.classList.add('literal-mode');
        return this.literalModeDeactivator.add(new Disposable((function(_this) {
          return function() {
            _this.editorElement.classList.remove('literal-mode');
            return _this.literalModeDeactivator = null;
          };
        })(this)));
      }
    };

    SearchInput.prototype.isVisible = function() {
      var ref1;
      return (ref1 = this.panel) != null ? ref1.isVisible() : void 0;
    };

    SearchInput.prototype.cancel = function() {
      if (this.finished) {
        return;
      }
      this.emitter.emit('did-cancel');
      return this.unfocus();
    };

    SearchInput.prototype.backspace = function() {
      if (this.editor.getText().length === 0) {
        return this.cancel();
      }
    };

    SearchInput.prototype.confirm = function(landingPoint) {
      if (landingPoint == null) {
        landingPoint = null;
      }
      this.emitter.emit('did-confirm', {
        input: this.editor.getText(),
        landingPoint: landingPoint
      });
      return this.unfocus();
    };

    SearchInput.prototype.stopPropagation = function(oldCommands) {
      var fn, fn1, name, newCommands;
      newCommands = {};
      fn1 = function(fn) {
        var commandName;
        if (indexOf.call(name, ':') >= 0) {
          commandName = name;
        } else {
          commandName = "vim-mode-plus:" + name;
        }
        return newCommands[commandName] = function(event) {
          event.stopImmediatePropagation();
          return fn(event);
        };
      };
      for (name in oldCommands) {
        fn = oldCommands[name];
        fn1(fn);
      }
      return newCommands;
    };

    SearchInput.prototype.initialize = function(vimState) {
      this.vimState = vimState;
      this.vimState.onDidFailToPushToOperationStack((function(_this) {
        return function() {
          return _this.cancel();
        };
      })(this));
      this.disposables = new CompositeDisposable;
      this.disposables.add(this.vimState.onDidDestroy(this.destroy.bind(this)));
      this.registerCommands();
      return this;
    };

    SearchInput.prototype.emitDidCommand = function(name, options) {
      if (options == null) {
        options = {};
      }
      options.name = name;
      options.input = this.editor.getText();
      return this.emitter.emit('did-command', options);
    };

    SearchInput.prototype.registerCommands = function() {
      return atom.commands.add(this.editorElement, this.stopPropagation({
        "search-confirm": (function(_this) {
          return function() {
            return _this.confirm();
          };
        })(this),
        "search-land-to-start": (function(_this) {
          return function() {
            return _this.confirm();
          };
        })(this),
        "search-land-to-end": (function(_this) {
          return function() {
            return _this.confirm('end');
          };
        })(this),
        "search-cancel": (function(_this) {
          return function() {
            return _this.cancel();
          };
        })(this),
        "search-visit-next": (function(_this) {
          return function() {
            return _this.emitDidCommand('visit', {
              direction: 'next'
            });
          };
        })(this),
        "search-visit-prev": (function(_this) {
          return function() {
            return _this.emitDidCommand('visit', {
              direction: 'prev'
            });
          };
        })(this),
        "select-occurrence-from-search": (function(_this) {
          return function() {
            return _this.emitDidCommand('occurrence', {
              operation: 'SelectOccurrence'
            });
          };
        })(this),
        "change-occurrence-from-search": (function(_this) {
          return function() {
            return _this.emitDidCommand('occurrence', {
              operation: 'ChangeOccurrence'
            });
          };
        })(this),
        "add-occurrence-pattern-from-search": (function(_this) {
          return function() {
            return _this.emitDidCommand('occurrence');
          };
        })(this),
        "project-find-from-search": (function(_this) {
          return function() {
            return _this.emitDidCommand('project-find');
          };
        })(this),
        "search-insert-wild-pattern": (function(_this) {
          return function() {
            return _this.editor.insertText('.*?');
          };
        })(this),
        "search-activate-literal-mode": (function(_this) {
          return function() {
            return _this.activateLiteralMode();
          };
        })(this),
        "search-set-cursor-word": (function(_this) {
          return function() {
            return _this.setCursorWord();
          };
        })(this),
        'core:move-up': (function(_this) {
          return function() {
            return _this.editor.setText(_this.vimState.searchHistory.get('prev'));
          };
        })(this),
        'core:move-down': (function(_this) {
          return function() {
            return _this.editor.setText(_this.vimState.searchHistory.get('next'));
          };
        })(this)
      }));
    };

    return SearchInput;

  })(HTMLElement);

  module.exports = registerElement('vim-mode-plus-search-input', {
    prototype: SearchInput.prototype
  });

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL2hvbWUvamFrZS8uYXRvbS9wYWNrYWdlcy92aW0tbW9kZS1wbHVzL2xpYi9zZWFyY2gtaW5wdXQuY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FBQUEsTUFBQSwyRUFBQTtJQUFBOzs7O0VBQUEsTUFBNkMsT0FBQSxDQUFRLE1BQVIsQ0FBN0MsRUFBQyxxQkFBRCxFQUFVLDJCQUFWLEVBQXNCOztFQUNyQixrQkFBbUIsT0FBQSxDQUFRLFNBQVI7O0VBRWQ7Ozs7Ozs7MEJBQ0osc0JBQUEsR0FBd0I7OzBCQUV4QixXQUFBLEdBQWEsU0FBQyxFQUFEO2FBQVEsSUFBQyxDQUFBLE9BQU8sQ0FBQyxFQUFULENBQVksWUFBWixFQUEwQixFQUExQjtJQUFSOzswQkFDYixZQUFBLEdBQWMsU0FBQyxFQUFEO2FBQVEsSUFBQyxDQUFBLE9BQU8sQ0FBQyxFQUFULENBQVksYUFBWixFQUEyQixFQUEzQjtJQUFSOzswQkFDZCxXQUFBLEdBQWEsU0FBQyxFQUFEO2FBQVEsSUFBQyxDQUFBLE9BQU8sQ0FBQyxFQUFULENBQVksWUFBWixFQUEwQixFQUExQjtJQUFSOzswQkFDYixZQUFBLEdBQWMsU0FBQyxFQUFEO2FBQVEsSUFBQyxDQUFBLE9BQU8sQ0FBQyxFQUFULENBQVksYUFBWixFQUEyQixFQUEzQjtJQUFSOzswQkFFZCxlQUFBLEdBQWlCLFNBQUE7QUFDZixVQUFBO01BQUEsSUFBQyxDQUFBLFNBQUQsR0FBYTtNQUNiLElBQUMsQ0FBQSxPQUFELEdBQVcsSUFBSTtNQUVmLElBQUMsQ0FBQSxTQUFELEdBQWE7TUFRYixPQUFzQyxJQUFDLENBQUEsb0JBQUQsQ0FBc0IsS0FBdEIsQ0FBdEMsRUFBQywwQkFBRCxFQUFtQjtNQUNuQixJQUFDLENBQUEsaUJBQUQsR0FBcUIsZ0JBQWdCLENBQUM7TUFDdEMsSUFBQyxDQUFBLGFBQUQsR0FBaUIsZUFBZSxDQUFDO01BQ2pDLElBQUMsQ0FBQSxNQUFELEdB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QXhCLENBQTRCLE1BQTVCLENBQWhCO1VBQUg7UUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBLENBakJsQjtPQURnQyxDQUFsQztJQURnQjs7OztLQXhJTTs7RUE4SjFCLE1BQU0sQ0FBQyxPQUFQLEdBQWlCLGVBQUEsQ0FBZ0IsNEJBQWhCLEVBQ2Y7SUFBQSxTQUFBLEVBQVcsV0FBVyxDQUFDLFNBQXZCO0dBRGU7QUFqS2pCIiwic291cmNlc0NvbnRlbnQiOlsie0VtaXR0ZXIsIERpc3Bvc2FibGUsIENvbXBvc2l0ZURpc3Bvc2FibGV9ID0gcmVxdWlyZSAnYXRvbSdcbntyZWdpc3RlckVsZW1lbnR9ID0gcmVxdWlyZSAnLi91dGlscydcblxuY2xhc3MgU2VhcmNoSW5wdXQgZXh0ZW5kcyBIVE1MRWxlbWVudFxuICBsaXRlcmFsTW9kZURlYWN0aXZhdG9yOiBudWxsXG5cbiAgb25EaWRDaGFuZ2U6IChmbikgLT4gQGVtaXR0ZXIub24gJ2RpZC1jaGFuZ2UnLCBmblxuICBvbkRpZENvbmZpcm06IChmbikgLT4gQGVtaXR0ZXIub24gJ2RpZC1jb25maXJtJywgZm5cbiAgb25EaWRDYW5jZWw6IChmbikgLT4gQGVtaXR0ZXIub24gJ2RpZC1jYW5jZWwnLCBmblxuICBvbkRpZENvbW1hbmQ6IChmbikgLT4gQGVtaXR0ZXIub24gJ2RpZC1jb21tYW5kJywgZm5cblxuICBjcmVhdGVkQ2FsbGJhY2s6IC0+XG4gICAgQGNsYXNzTmFtZSA9IFwidmltLW1vZGUtcGx1cy1zZWFyY2gtY29udGFpbmVyXCJcbiAgICBAZW1pdHRlciA9IG5ldyBFbWl0dGVyXG5cbiAgICBAaW5uZXJIVE1MID0gXCJcIlwiXG4gICAgPGRpdiBjbGFzcz0nb3B0aW9ucy1jb250YWluZXInPlxuICAgICAgPHNwYW4gY2xhc3M9J2lubGluZS1ibG9jay10aWdodCBidG4gYnRuLXByaW1hcnknPi4qPC9zcGFuPlxuICAgIDwvZGl2PlxuICAgIDxkaXYgY2xhc3M9J2VkaXRvci1jb250YWluZXInPlxuICAgICAgPGF0b20tdGV4dC1lZGl0b3IgbWluaSBjbGFzcz0nZWRpdG9yIHZpbS1tb2RlLXBsdXMtc2VhcmNoJz48L2F0b20tdGV4dC1lZGl0b3I+XG4gICAgPC9kaXY+XG4gICAgXCJcIlwiXG4gICAgW29wdGlvbnNDb250YWluZXIsIGVkaXRvckNvbnRhaW5lcl0gPSBAZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ2RpdicpXG4gICAgQHJlZ2V4U2VhcmNoU3RhdHVzID0gb3B0aW9uc0NvbnRhaW5lci5maXJzdEVsZW1lbnRDaGlsZFxuICAgIEBlZGl0b3JFbGVtZW50ID0gZWRpdG9yQ29udGFpbmVyLmZpcnN0RWxlbWVudENoaWxkXG4gICAgQGVkaXRvciA9IEBlZGl0b3JFbGVtZW50LmdldE1vZGVsKClcbiAgICBAZWRpdG9yLnNldE1pbmkodHJ1ZSlcblxuICAgIEBlZGl0b3Iub25EaWRDaGFuZ2UgPT5cbiAgICAgIHJldHVybiBpZiBAZmluaXNoZWRcbiAgICAgIEBlbWl0dGVyLmVtaXQoJ2RpZC1jaGFuZ2UnLCBAZWRpdG9yLmdldFRleHQoKSlcblxuICAgIEBwYW5lbCA9IGF0b20ud29ya3NwYWNlLmFkZEJvdHRvbVBhbmVsKGl0ZW06IHRoaXMsIHZpc2libGU6IGZhbHNlKVxuICAgIHRoaXNcblxuICBkZXN0cm95OiAtPlxuICAgIEBkaXNwb3NhYmxlcy5kaXNwb3NlKClcbiAgICBAZWRpdG9yLmRlc3Ryb3koKVxuICAgIEBwYW5lbD8uZGVzdHJveSgpXG4gICAge0BlZGl0b3IsIEBwYW5lbCwgQGVkaXRvckVsZW1lbnQsIEB2aW1TdGF0ZX0gPSB7fVxuICAgIEByZW1vdmUoKVxuXG4gIGhhbmRsZUV2ZW50czogLT5cbiAgICBhdG9tLmNvbW1hbmRzLmFkZCBAZWRpdG9yRWxlbWVudCxcbiAgICAgICdjb3JlOmNvbmZpcm0nOiA9PiBAY29uZmlybSgpXG4gICAgICAnY29yZTpjYW5jZWwnOiA9PiBAY2FuY2VsKClcbiAgICAgICdjb3JlOmJhY2tzcGFjZSc6ID0+IEBiYWNrc3BhY2UoKVxuICAgICAgJ3ZpbS1tb2RlLXBsdXM6aW5wdXQtY2FuY2VsJzogPT4gQGNhbmNlbCgpXG5cbiAgZm9jdXM6IChAb3B0aW9ucz17fSkgLT5cbiAgICBAZmluaXNoZWQgPSBmYWxzZVxuXG4gICAgQGVkaXRvckVsZW1lbnQuY2xhc3NMaXN0LmFkZChAb3B0aW9ucy5jbGFzc0xpc3QuLi4pIGlmIEBvcHRpb25zLmNsYXNzTGlzdD9cbiAgICBAcGFuZWwuc2hvdygpXG4gICAgQGVkaXRvckVsZW1lbnQuZm9jdXMoKVxuXG4gICAgQGZvY3VzU3Vic2NyaXB0aW9ucyA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlXG4gICAgQGZvY3VzU3Vic2NyaXB0aW9ucy5hZGQgQGhhbmRsZUV2ZW50cygpXG4gICAgY2FuY2VsID0gQGNhbmNlbC5iaW5kKHRoaXMpXG4gICAgQHZpbVN0YXRlLmVkaXRvckVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBjYW5jZWwpXG4gICAgIyBDYW5jZWwgb24gbW91c2UgY2xpY2tcbiAgICBAZm9jdXNTdWJzY3JpcHRpb25zLmFkZCBuZXcgRGlzcG9zYWJsZSA9PlxuICAgICAgQHZpbVN0YXRlLmVkaXRvckVsZW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcignY2xpY2snLCBjYW5jZWwpXG5cbiAgICAjIENhbmNlbCBvbiB0YWIgc3dpdGNoXG4gICAgQGZvY3VzU3Vic2NyaXB0aW9ucy5hZGQoYXRvbS53b3Jrc3BhY2Uub25EaWRDaGFuZ2VBY3RpdmVQYW5lSXRlbShjYW5jZWwpKVxuXG4gIHVuZm9jdXM6IC0+XG4gICAgQGZpbmlzaGVkID0gdHJ1ZVxuICAgIEBlZGl0b3JFbGVtZW50LmNsYXNzTGlzdC5yZW1vdmUoQG9wdGlvbnMuY2xhc3NMaXN0Li4uKSBpZiBAb3B0aW9ucz8uY2xhc3NMaXN0P1xuICAgIEByZWdleFNlYXJjaFN0YXR1cy5jbGFzc0xpc3QuYWRkICdidG4tcHJpbWFyeSdcbiAgICBAbGl0ZXJhbE1vZGVEZWFjdGl2YXRvcj8uZGlzcG9zZSgpXG5cbiAgICBAZm9jdXNTdWJzY3JpcHRpb25zPy5kaXNwb3NlKClcbiAgICBhdG9tLndvcmtzcGFjZS5nZXRBY3RpdmVQYW5lKCkuYWN0aXZhdGUoKVxuICAgIEBlZGl0b3Iuc2V0VGV4dCAnJ1xuICAgIEBwYW5lbD8uaGlkZSgpXG5cbiAgdXBkYXRlT3B0aW9uU2V0dGluZ3M6ICh7dXNlUmVnZXhwfT17fSkgLT5cbiAgICBAcmVnZXhTZWFyY2hTdGF0dXMuY2xhc3NMaXN0LnRvZ2dsZSgnYnRuLXByaW1hcnknLCB1c2VSZWdleHApXG5cbiAgc2V0Q3Vyc29yV29yZDogLT5cbiAgICBAZWRpdG9yLmluc2VydFRleHQoQHZpbVN0YXRlLmVkaXRvci5nZXRXb3JkVW5kZXJDdXJzb3IoKSlcblxuICBhY3RpdmF0ZUxpdGVyYWxNb2RlOiAtPlxuICAgIGlmIEBsaXRlcmFsTW9kZURlYWN0aXZhdG9yP1xuICAgICAgQGxpdGVyYWxNb2RlRGVhY3RpdmF0b3IuZGlzcG9zZSgpXG4gICAgZWxzZVxuICAgICAgQGxpdGVyYWxNb2RlRGVhY3RpdmF0b3IgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZSgpXG4gICAgICBAZWRpdG9yRWxlbWVudC5jbGFzc0xpc3QuYWRkKCdsaXRlcmFsLW1vZGUnKVxuXG4gICAgICBAbGl0ZXJhbE1vZGVEZWFjdGl2YXRvci5hZGQgbmV3IERpc3Bvc2FibGUgPT5cbiAgICAgICAgQGVkaXRvckVsZW1lbnQuY2xhc3NMaXN0LnJlbW92ZSgnbGl0ZXJhbC1tb2RlJylcbiAgICAgICAgQGxpdGVyYWxNb2RlRGVhY3RpdmF0b3IgPSBudWxsXG5cbiAgaXNWaXNpYmxlOiAtPlxuICAgIEBwYW5lbD8uaXNWaXNpYmxlKClcblxuICBjYW5jZWw6IC0+XG4gICAgcmV0dXJuIGlmIEBmaW5pc2hlZFxuICAgIEBlbWl0dGVyLmVtaXQoJ2RpZC1jYW5jZWwnKVxuICAgIEB1bmZvY3VzKClcblxuICBiYWNrc3BhY2U6IC0+XG4gICAgQGNhbmNlbCgpIGlmIEBlZGl0b3IuZ2V0VGV4dCgpLmxlbmd0aCBpcyAwXG5cbiAgY29uZmlybTogKGxhbmRpbmdQb2ludD1udWxsKSAtPlxuICAgIEBlbWl0dGVyLmVtaXQoJ2RpZC1jb25maXJtJywge2lucHV0OiBAZWRpdG9yLmdldFRleHQoKSwgbGFuZGluZ1BvaW50fSlcbiAgICBAdW5mb2N1cygpXG5cbiAgc3RvcFByb3BhZ2F0aW9uOiAob2xkQ29tbWFuZHMpIC0+XG4gICAgbmV3Q29tbWFuZHMgPSB7fVxuICAgIGZvciBuYW1lLCBmbiBvZiBvbGRDb21tYW5kc1xuICAgICAgZG8gKGZuKSAtPlxuICAgICAgICBpZiAnOicgaW4gbmFtZVxuICAgICAgICAgIGNvbW1hbmROYW1lID0gbmFtZVxuICAgICAgICBlbHNlXG4gICAgICAgICAgY29tbWFuZE5hbWUgPSBcInZpbS1tb2RlLXBsdXM6I3tuYW1lfVwiXG4gICAgICAgIG5ld0NvbW1hbmRzW2NvbW1hbmROYW1lXSA9IChldmVudCkgLT5cbiAgICAgICAgICBldmVudC5zdG9wSW1tZWRpYXRlUHJvcGFnYXRpb24oKVxuICAgICAgICAgIGZuKGV2ZW50KVxuICAgIG5ld0NvbW1hbmRzXG5cbiAgaW5pdGlhbGl6ZTogKEB2aW1TdGF0ZSkgLT5cbiAgICBAdmltU3RhdGUub25EaWRGYWlsVG9QdXNoVG9PcGVyYXRpb25TdGFjayA9PlxuICAgICAgQGNhbmNlbCgpXG5cbiAgICBAZGlzcG9zYWJsZXMgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZVxuICAgIEBkaXNwb3NhYmxlcy5hZGQgQHZpbVN0YXRlLm9uRGlkRGVzdHJveShAZGVzdHJveS5iaW5kKHRoaXMpKVxuXG4gICAgQHJlZ2lzdGVyQ29tbWFuZHMoKVxuICAgIHRoaXNcblxuICBlbWl0RGlkQ29tbWFuZDogKG5hbWUsIG9wdGlvbnM9e30pIC0+XG4gICAgb3B0aW9ucy5uYW1lID0gbmFtZVxuICAgIG9wdGlvbnMuaW5wdXQgPSBAZWRpdG9yLmdldFRleHQoKVxuICAgIEBlbWl0dGVyLmVtaXQoJ2RpZC1jb21tYW5kJywgb3B0aW9ucylcblxuICByZWdpc3RlckNvbW1hbmRzOiAtPlxuICAgIGF0b20uY29tbWFuZHMuYWRkIEBlZGl0b3JFbGVtZW50LCBAc3RvcFByb3BhZ2F0aW9uKFxuICAgICAgXCJzZWFyY2gtY29uZmlybVwiOiA9PiBAY29uZmlybSgpXG4gICAgICBcInNlYXJjaC1sYW5kLXRvLXN0YXJ0XCI6ID0+IEBjb25maXJtKClcbiAgICAgIFwic2VhcmNoLWxhbmQtdG8tZW5kXCI6ID0+IEBjb25maXJtKCdlbmQnKVxuICAgICAgXCJzZWFyY2gtY2FuY2VsXCI6ID0+IEBjYW5jZWwoKVxuXG4gICAgICBcInNlYXJjaC12aXNpdC1uZXh0XCI6ID0+IEBlbWl0RGlkQ29tbWFuZCgndmlzaXQnLCBkaXJlY3Rpb246ICduZXh0JylcbiAgICAgIFwic2VhcmNoLXZpc2l0LXByZXZcIjogPT4gQGVtaXREaWRDb21tYW5kKCd2aXNpdCcsIGRpcmVjdGlvbjogJ3ByZXYnKVxuXG4gICAgICBcInNlbGVjdC1vY2N1cnJlbmNlLWZyb20tc2VhcmNoXCI6ID0+IEBlbWl0RGlkQ29tbWFuZCgnb2NjdXJyZW5jZScsIG9wZXJhdGlvbjogJ1NlbGVjdE9jY3VycmVuY2UnKVxuICAgICAgXCJjaGFuZ2Utb2NjdXJyZW5jZS1mcm9tLXNlYXJjaFwiOiA9PiBAZW1pdERpZENvbW1hbmQoJ29jY3VycmVuY2UnLCBvcGVyYXRpb246ICdDaGFuZ2VPY2N1cnJlbmNlJylcbiAgICAgIFwiYWRkLW9jY3VycmVuY2UtcGF0dGVybi1mcm9tLXNlYXJjaFwiOiA9PiBAZW1pdERpZENvbW1hbmQoJ29jY3VycmVuY2UnKVxuICAgICAgXCJwcm9qZWN0LWZpbmQtZnJvbS1zZWFyY2hcIjogPT4gQGVtaXREaWRDb21tYW5kKCdwcm9qZWN0LWZpbmQnKVxuXG4gICAgICBcInNlYXJjaC1pbnNlcnQtd2lsZC1wYXR0ZXJuXCI6ID0+IEBlZGl0b3IuaW5zZXJ0VGV4dCgnLio/JylcbiAgICAgIFwic2VhcmNoLWFjdGl2YXRlLWxpdGVyYWwtbW9kZVwiOiA9PiBAYWN0aXZhdGVMaXRlcmFsTW9kZSgpXG4gICAgICBcInNlYXJjaC1zZXQtY3Vyc29yLXdvcmRcIjogPT4gQHNldEN1cnNvcldvcmQoKVxuICAgICAgJ2NvcmU6bW92ZS11cCc6ID0+IEBlZGl0b3Iuc2V0VGV4dCBAdmltU3RhdGUuc2VhcmNoSGlzdG9yeS5nZXQoJ3ByZXYnKVxuICAgICAgJ2NvcmU6bW92ZS1kb3duJzogPT4gQGVkaXRvci5zZXRUZXh0IEB2aW1TdGF0ZS5zZWFyY2hIaXN0b3J5LmdldCgnbmV4dCcpXG4gICAgKVxuXG5tb2R1bGUuZXhwb3J0cyA9IHJlZ2lzdGVyRWxlbWVudCAndmltLW1vZGUtcGx1cy1zZWFyY2gtaW5wdXQnLFxuICBwcm90b3R5cGU6IFNlYXJjaElucHV0LnByb3RvdHlwZVxuIl19
