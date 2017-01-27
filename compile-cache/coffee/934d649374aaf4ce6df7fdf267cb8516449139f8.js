(function() {
  var Base, CompositeDisposable, Disposable, Emitter, ModeManager, Range, _, moveCursorLeft, ref, settings, swrap,
    indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  _ = require('underscore-plus');

  ref = require('atom'), Emitter = ref.Emitter, Range = ref.Range, CompositeDisposable = ref.CompositeDisposable, Disposable = ref.Disposable;

  Base = require('./base');

  swrap = require('./selection-wrapper');

  moveCursorLeft = require('./utils').moveCursorLeft;

  settings = require('./settings');

  ModeManager = (function() {
    ModeManager.prototype.mode = 'insert';

    ModeManager.prototype.submode = null;

    ModeManager.prototype.replacedCharsBySelection = null;

    function ModeManager(vimState) {
      var ref1;
      this.vimState = vimState;
      ref1 = this.vimState, this.editor = ref1.editor, this.editorElement = ref1.editorElement;
      this.mode = 'insert';
      this.emitter = new Emitter;
      this.subscriptions = new CompositeDisposable;
      this.subscriptions.add(this.vimState.onDidDestroy(this.destroy.bind(this)));
    }

    ModeManager.prototype.destroy = function() {
      return this.subscriptions.dispose();
    };

    ModeManager.prototype.isMode = function(mode, submodes) {
      var ref1;
      if (submodes != null) {
        return (this.mode === mode) && (ref1 = this.submode, indexOf.call([].concat(submodes), ref1) >= 0);
      } else {
        return this.mode === mode;
      }
    };

    ModeManager.prototype.onWillActivateMode = function(fn) {
      return this.emitter.on('will-activate-mode', fn);
    };

    ModeManager.prototype.onDidActivateMode = function(fn) {
      return this.emitter.on('did-activate-mode', fn);
    };

    ModeManager.prototype.onWillDeactivateMode = function(fn) {
      return this.emitter.on('will-deactivate-mode', fn);
    };

    ModeManager.prototype.preemptWillDeactivateMode = function(fn) {
      return this.emitter.preempt('will-deactivate-mode', fn);
    };

    ModeManager.prototype.onDidDeactivateMode = function(fn) {
      return this.emitter.on('did-deactivate-mode', fn);
    };

    ModeManager.prototype.activate = function(newMode, newSubmode) {
      var ref1, ref2;
      if (newSubmode == null) {
        newSubmode = null;
      }
      if ((newMode === 'visual') && this.editor.isEmpty()) {
        return;
      }
      this.emitter.emit('will-activate-mode', {
        mode: newMode,
        submode: newSubmode
      });
      if ((newMode === 'visual') && (newSubmode === this.submode)) {
        ref1 = ['normal', null], newMode = ref1[0], newSubmode = ref1[1];
      }
      if (newMode !== this.mode) {
        this.deactivate();
      }
      this.deactivator = (function() {
        switch (newMode) {
          case 'normal':
            return this.activateNormalMode();
          case 'operator-pending':
            return this.activateOperatorPendingMode();
          case 'insert':
            return this.activateInsertMode(newSubmode);
          case 'visual':
            return this.activateVisualMode(newSubmode);
        }
      }).call(this);
      this.editorElement.classList.remove(this.mode + "-mode");
      this.editorElement.classList.remove(this.submode);
      ref2 = [newMode, newSubmode], this.mode = ref2[0], this.submode = ref2[1];
      this.editorElement.classList.add(this.mode + "-mode");
      if (this.submode != null) {
        this.editorElement.classList.add(this.submode);
      }
      if (this.mode === 'visual') {
        this.updateNarrowedState();
        this.vimState.updatePreviousSelection();
      }
      this.vimState.statusBarManager.update(this.mode, this.submode);
      this.vimState.updateCursorsVisibility();
      return this.emitter.emit('did-activate-mode', {
        mode: this.mode,
        submode: this.submode
      });
    };

    ModeManager.prototype.deactivate = function() {
      var ref1, ref2;
      if (!((ref1 = this.deactivator) != null ? ref1.disposed : void 0)) {
        this.emitter.emit('will-deactivate-mode', {
          mode: this.mode,
          submode: this.submode
        });
        if ((ref2 = this.deactivator) != null) {
          ref2.dispose();
        }
        this.editorElement.classList.remove(this.mode + "-mode");
        this.editorElement.classList.remove(this.submode);
        return this.emitter.emit('did-deactivate-mode', {
          mode: this.mode,
          submode: this.submode
        });
      }
    };

    ModeManager.prototype.activateNormalMode = function() {
      var ref1;
      this.vimState.reset();
      if ((ref1 = this.editorElement.component) != null) {
        ref1.setInputEnabled(false);
      }
      return new Disposable;
    };

    ModeManager.prototype.activateOperatorPendingMode = function() {
      return new Disposable;
    };

    ModeManager.prototype.activateInsertMode = function(submode) {
      var replaceModeDeactivator;
      if (submode == null) {
        submode = null;
      }
      this.editorElement.component.setInputEnabled(true);
      if (submode === 'replace') {
        replaceModeDeactivator = this.activateReplaceMode();
      }
      return new Disposable((function(_this) {
        return function() {
          var cursor, i, len, needSpecialCareToPreventWrapLine, ref1, ref2, results;
          if (replaceModeDeactivator != null) {
            replaceModeDeactivator.dispose();
          }
          replaceModeDeactivator = null;
          needSpecialCareToPreventWrapLine = (ref1 = atom.config.get('editor.atomicSoftTabs')) != null ? ref1 : true;
          ref2 = _this.editor.getCursors();
          results = [];
          for (i = 0, len = ref2.length; i < len; i++) {
            cursor = ref2[i];
            results.push(moveCursorLeft(cursor, {
              needSpecialCareToPreventWrapLine: needSpecialCareToPreventWrapLine
            }));
          }
          return results;
        };
      })(this));
    };

    ModeManager.prototype.activateReplaceMode = function() {
      var subs;
      this.replacedCharsBySelection = {};
      subs = new CompositeDisposable;
      subs.add(this.editor.onWillInsertText((function(_this) {
        return function(arg) {
          var cancel, text;
          text = arg.text, cancel = arg.cancel;
          cancel();
          return _this.editor.getSelections().forEach(function(selection) {
            var base, char, i, len, name, ref1, ref2, results;
            ref2 = (ref1 = text.split('')) != null ? ref1 : [];
            results = [];
            for (i = 0, len = ref2.length; i < len; i++) {
              char = ref2[i];
              if ((char !== "\n") && (!selection.cursor.isAtEndOfLine())) {
                selection.selectRight();
              }
              if ((base = _this.replacedCharsBySelection)[name = selection.id] == null) {
                base[name] = [];
              }
              results.push(_this.replacedCharsBySelection[selection.id].push(swrap(selection).replace(char)));
            }
            return results;
          });
        };
      })(this)));
      subs.add(new Disposable((function(_this) {
        return function() {
          return _this.replacedCharsBySelection = null;
        };
      })(this)));
      return subs;
    };

    ModeManager.prototype.getReplacedCharForSelection = function(selection) {
      var ref1;
      return (ref1 = this.replacedCharsBySelection[selection.id]) != null ? ref1.pop() : void 0;
    };

    ModeManager.prototype.activateVisualMode = function(newSubmode) {
      this.normalizeSelections();
      swrap.applyWise(this.editor, 'characterwise');
      switch (newSubmode) {
        case 'linewise':
          swrap.applyWise(this.editor, 'linewise');
          break;
        case 'blockwise':
          this.vimState.selectBlockwise();
      }
      return new Disposable((function(_this) {
        return function() {
          var i, len, ref1, selection;
          _this.normalizeSelections();
          ref1 = _this.editor.getSelections();
          for (i = 0, len = ref1.length; i < len; i++) {
            selection = ref1[i];
            selection.clear({
              autoscroll: false
            });
          }
          return _this.updateNarrowedState(false);
        };
      })(this));
    };

    ModeManager.prototype.normalizeSelections = function() {
      var bs, i, len, ref1;
      if (this.submode === 'blockwise') {
        ref1 = this.vimState.getBlockwiseSelections();
        for (i = 0, len = ref1.length; i < len; i++) {
          bs = ref1[i];
          bs.restoreCharacterwise();
        }
        this.vimState.clearBlockwiseSelections();
      }
      return swrap.normalize(this.editor);
    };

    ModeManager.prototype.hasMultiLineSelection = function() {
      var ref1;
      if (this.isMode('visual', 'blockwise')) {
        return !((ref1 = this.vimState.getLastBlockwiseSelection()) != null ? ref1.isSingleRow() : void 0);
      } else {
        return !swrap(this.editor.getLastSelection()).isSingleRow();
      }
    };

    ModeManager.prototype.updateNarrowedState = function(value) {
      if (value == null) {
        value = null;
      }
      return this.editorElement.classList.toggle('is-narrowed', value != null ? value : this.hasMultiLineSelection());
    };

    ModeManager.prototype.isNarrowed = function() {
      return this.editorElement.classList.contains('is-narrowed');
    };

    return ModeManager;

  })();

  module.exports = ModeManager;

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL2hvbWUvamFrZS8uYXRvbS9wYWNrYWdlcy92aW0tbW9kZS1wbHVzL2xpYi9tb2RlLW1hbmFnZXIuY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FBQUEsTUFBQSwyR0FBQTtJQUFBOztFQUFBLENBQUEsR0FBSSxPQUFBLENBQVEsaUJBQVI7O0VBQ0osTUFBb0QsT0FBQSxDQUFRLE1BQVIsQ0FBcEQsRUFBQyxxQkFBRCxFQUFVLGlCQUFWLEVBQWlCLDZDQUFqQixFQUFzQzs7RUFDdEMsSUFBQSxHQUFPLE9BQUEsQ0FBUSxRQUFSOztFQUNQLEtBQUEsR0FBUSxPQUFBLENBQVEscUJBQVI7O0VBQ1AsaUJBQWtCLE9BQUEsQ0FBUSxTQUFSOztFQUNuQixRQUFBLEdBQVcsT0FBQSxDQUFRLFlBQVI7O0VBRUw7MEJBQ0osSUFBQSxHQUFNOzswQkFDTixPQUFBLEdBQVM7OzBCQUNULHdCQUFBLEdBQTBCOztJQUViLHFCQUFDLFFBQUQ7QUFDWCxVQUFBO01BRFksSUFBQyxDQUFBLFdBQUQ7TUFDWixPQUE0QixJQUFDLENBQUEsUUFBN0IsRUFBQyxJQUFDLENBQUEsY0FBQSxNQUFGLEVBQVUsSUFBQyxDQUFBLHFCQUFBO01BQ1gsSUFBQyxDQUFBLElBQUQsR0FBUTtNQUNSLElBQUMsQ0FBQSxPQUFELEdBQVcsSUFBSTtNQUNmLElBQUMsQ0FBQSxhQUFELEdBQWlCLElBQUk7TUFDckIsSUFBQyxDQUFBLGFBQWEsQ0FBQyxHQUFmLENBQW1CLElBQUMsQ0FBQSxRQUFRLENBQUMsWUFBVixDQUF1QixJQUFDLENBQUEsT0FBTyxDQUFDLElBQVQsQ0FBYyxJQUFkLENBQXZCLENBQW5CO0lBTFc7OzBCQU9iLE9BQUEsR0FBUyxTQUFBO2FBQ1AsSUFBQyxDQUFBLGFBQWEsQ0FBQyxPQUFmLENBQUE7SUFETzs7MEJBR1QsTUFBQSxHQUFRLFNBQUMsSUFBRCxFQUFPLFFBQVA7QUFDTixVQUFBO01BQUEsSUFBRyxn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QUFBLEVBSEY7O2FBS0EsS0FBSyxDQUFDLFNBQU4sQ0FBZ0IsSUFBQyxDQUFBLE1BQWpCO0lBTm1COzswQkFVckIscUJBQUEsR0FBdUIsU0FBQTtBQUNyQixVQUFBO01BQUEsSUFBRyxJQUFDLENBQUEsTUFBRCxDQUFRLFFBQVIsRUFBa0IsV0FBbEIsQ0FBSDtlQUVFLG1FQUF5QyxDQUFFLFdBQXZDLENBQUEsWUFGTjtPQUFBLE1BQUE7ZUFJRSxDQUFJLEtBQUEsQ0FBTSxJQUFDLENBQUEsTUFBTSxDQUFDLGdCQUFSLENBQUEsQ0FBTixDQUFpQyxDQUFDLFdBQWxDLENBQUEsRUFKTjs7SUFEcUI7OzBCQU92QixtQkFBQSxHQUFxQixTQUFDLEtBQUQ7O1FBQUMsUUFBTTs7YUFDMUIsSUFBQyxDQUFBLGFBQWEsQ0FBQyxTQUFTLENBQUMsTUFBekIsQ0FBZ0MsYUFBaEMsa0JBQStDLFFBQVEsSUFBQyxDQUFBLHFCQUFELENBQUEsQ0FBdkQ7SUFEbUI7OzBCQUdyQixVQUFBLEdBQVksU0FBQTthQUNWLElBQUMsQ0FBQSxhQUFhLENBQUMsU0FBUyxDQUFDLFFBQXpCLENBQWtDLGFBQWxDO0lBRFU7Ozs7OztFQUdkLE1BQU0sQ0FBQyxPQUFQLEdBQWlCO0FBeExqQiIsInNvdXJjZXNDb250ZW50IjpbIl8gPSByZXF1aXJlICd1bmRlcnNjb3JlLXBsdXMnXG57RW1pdHRlciwgUmFuZ2UsIENvbXBvc2l0ZURpc3Bvc2FibGUsIERpc3Bvc2FibGV9ID0gcmVxdWlyZSAnYXRvbSdcbkJhc2UgPSByZXF1aXJlICcuL2Jhc2UnXG5zd3JhcCA9IHJlcXVpcmUgJy4vc2VsZWN0aW9uLXdyYXBwZXInXG57bW92ZUN1cnNvckxlZnR9ID0gcmVxdWlyZSAnLi91dGlscydcbnNldHRpbmdzID0gcmVxdWlyZSAnLi9zZXR0aW5ncydcblxuY2xhc3MgTW9kZU1hbmFnZXJcbiAgbW9kZTogJ2luc2VydCcgIyBOYXRpdmUgYXRvbSBpcyBub3QgbW9kYWwgZWRpdG9yIGFuZCBpdHMgZGVmYXVsdCBpcyAnaW5zZXJ0J1xuICBzdWJtb2RlOiBudWxsXG4gIHJlcGxhY2VkQ2hhcnNCeVNlbGVjdGlvbjogbnVsbFxuXG4gIGNvbnN0cnVjdG9yOiAoQHZpbVN0YXRlKSAtPlxuICAgIHtAZWRpdG9yLCBAZWRpdG9yRWxlbWVudH0gPSBAdmltU3RhdGVcbiAgICBAbW9kZSA9ICdpbnNlcnQnXG4gICAgQGVtaXR0ZXIgPSBuZXcgRW1pdHRlclxuICAgIEBzdWJzY3JpcHRpb25zID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGVcbiAgICBAc3Vic2NyaXB0aW9ucy5hZGQgQHZpbVN0YXRlLm9uRGlkRGVzdHJveShAZGVzdHJveS5iaW5kKHRoaXMpKVxuXG4gIGRlc3Ryb3k6IC0+XG4gICAgQHN1YnNjcmlwdGlvbnMuZGlzcG9zZSgpXG5cbiAgaXNNb2RlOiAobW9kZSwgc3VibW9kZXMpIC0+XG4gICAgaWYgc3VibW9kZXM/XG4gICAgICAoQG1vZGUgaXMgbW9kZSkgYW5kIChAc3VibW9kZSBpbiBbXS5jb25jYXQoc3VibW9kZXMpKVxuICAgIGVsc2VcbiAgICAgIEBtb2RlIGlzIG1vZGVcblxuICAjIEV2ZW50XG4gICMgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBvbldpbGxBY3RpdmF0ZU1vZGU6IChmbikgLT4gQGVtaXR0ZXIub24oJ3dpbGwtYWN0aXZhdGUtbW9kZScsIGZuKVxuICBvbkRpZEFjdGl2YXRlTW9kZTogKGZuKSAtPiBAZW1pdHRlci5vbignZGlkLWFjdGl2YXRlLW1vZGUnLCBmbilcbiAgb25XaWxsRGVhY3RpdmF0ZU1vZGU6IChmbikgLT4gQGVtaXR0ZXIub24oJ3dpbGwtZGVhY3RpdmF0ZS1tb2RlJywgZm4pXG4gIHByZWVtcHRXaWxsRGVhY3RpdmF0ZU1vZGU6IChmbikgLT4gQGVtaXR0ZXIucHJlZW1wdCgnd2lsbC1kZWFjdGl2YXRlLW1vZGUnLCBmbilcbiAgb25EaWREZWFjdGl2YXRlTW9kZTogKGZuKSAtPiBAZW1pdHRlci5vbignZGlkLWRlYWN0aXZhdGUtbW9kZScsIGZuKVxuXG4gICMgYWN0aXZhdGU6IFB1YmxpY1xuICAjICBVc2UgdGhpcyBtZXRob2QgdG8gY2hhbmdlIG1vZGUsIERPTlQgdXNlIG90aGVyIGRpcmVjdCBtZXRob2QuXG4gICMgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBhY3RpdmF0ZTogKG5ld01vZGUsIG5ld1N1Ym1vZGU9bnVsbCkgLT5cbiAgICAjIEF2b2lkIG9kZCBzdGF0ZSg9dmlzdWFsLW1vZGUgYnV0IHNlbGVjdGlvbiBpcyBlbXB0eSlcbiAgICByZXR1cm4gaWYgKG5ld01vZGUgaXMgJ3Zpc3VhbCcpIGFuZCBAZWRpdG9yLmlzRW1wdHkoKVxuXG4gICAgQGVtaXR0ZXIuZW1pdCgnd2lsbC1hY3RpdmF0ZS1tb2RlJywgbW9kZTogbmV3TW9kZSwgc3VibW9kZTogbmV3U3VibW9kZSlcblxuICAgIGlmIChuZXdNb2RlIGlzICd2aXN1YWwnKSBhbmQgKG5ld1N1Ym1vZGUgaXMgQHN1Ym1vZGUpXG4gICAgICBbbmV3TW9kZSwgbmV3U3VibW9kZV0gPSBbJ25vcm1hbCcsIG51bGxdXG5cbiAgICBAZGVhY3RpdmF0ZSgpIGlmIChuZXdNb2RlIGlzbnQgQG1vZGUpXG5cbiAgICBAZGVhY3RpdmF0b3IgPSBzd2l0Y2ggbmV3TW9kZVxuICAgICAgd2hlbiAnbm9ybWFsJyB0aGVuIEBhY3RpdmF0ZU5vcm1hbE1vZGUoKVxuICAgICAgd2hlbiAnb3BlcmF0b3ItcGVuZGluZycgdGhlbiBAYWN0aXZhdGVPcGVyYXRvclBlbmRpbmdNb2RlKClcbiAgICAgIHdoZW4gJ2luc2VydCcgdGhlbiBAYWN0aXZhdGVJbnNlcnRNb2RlKG5ld1N1Ym1vZGUpXG4gICAgICB3aGVuICd2aXN1YWwnIHRoZW4gQGFjdGl2YXRlVmlzdWFsTW9kZShuZXdTdWJtb2RlKVxuXG4gICAgQGVkaXRvckVsZW1lbnQuY2xhc3NMaXN0LnJlbW92ZShcIiN7QG1vZGV9LW1vZGVcIilcbiAgICBAZWRpdG9yRWxlbWVudC5jbGFzc0xpc3QucmVtb3ZlKEBzdWJtb2RlKVxuXG4gICAgW0Btb2RlLCBAc3VibW9kZV0gPSBbbmV3TW9kZSwgbmV3U3VibW9kZV1cblxuICAgIEBlZGl0b3JFbGVtZW50LmNsYXNzTGlzdC5hZGQoXCIje0Btb2RlfS1tb2RlXCIpXG4gICAgQGVkaXRvckVsZW1lbnQuY2xhc3NMaXN0LmFkZChAc3VibW9kZSkgaWYgQHN1Ym1vZGU/XG5cbiAgICBpZiBAbW9kZSBpcyAndmlzdWFsJ1xuICAgICAgQHVwZGF0ZU5hcnJvd2VkU3RhdGUoKVxuICAgICAgQHZpbVN0YXRlLnVwZGF0ZVByZXZpb3VzU2VsZWN0aW9uKClcblxuICAgIEB2aW1TdGF0ZS5zdGF0dXNCYXJNYW5hZ2VyLnVwZGF0ZShAbW9kZSwgQHN1Ym1vZGUpXG4gICAgQHZpbVN0YXRlLnVwZGF0ZUN1cnNvcnNWaXNpYmlsaXR5KClcblxuICAgIEBlbWl0dGVyLmVtaXQoJ2RpZC1hY3RpdmF0ZS1tb2RlJywge0Btb2RlLCBAc3VibW9kZX0pXG5cbiAgZGVhY3RpdmF0ZTogLT5cbiAgICB1bmxlc3MgQGRlYWN0aXZhdG9yPy5kaXNwb3NlZFxuICAgICAgQGVtaXR0ZXIuZW1pdCgnd2lsbC1kZWFjdGl2YXRlLW1vZGUnLCB7QG1vZGUsIEBzdWJtb2RlfSlcbiAgICAgIEBkZWFjdGl2YXRvcj8uZGlzcG9zZSgpXG4gICAgICAjIFJlbW92ZSBjc3MgY2xhc3MgaGVyZSBpbi1jYXNlIEBkZWFjdGl2YXRlKCkgY2FsbGVkIHNvbGVseShvY2N1cnJlbmNlIGluIHZpc3VhbC1tb2RlKVxuICAgICAgQGVkaXRvckVsZW1lbnQuY2xhc3NMaXN0LnJlbW92ZShcIiN7QG1vZGV9LW1vZGVcIilcbiAgICAgIEBlZGl0b3JFbGVtZW50LmNsYXNzTGlzdC5yZW1vdmUoQHN1Ym1vZGUpXG5cbiAgICAgIEBlbWl0dGVyLmVtaXQoJ2RpZC1kZWFjdGl2YXRlLW1vZGUnLCB7QG1vZGUsIEBzdWJtb2RlfSlcblxuICAjIE5vcm1hbFxuICAjIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgYWN0aXZhdGVOb3JtYWxNb2RlOiAtPlxuICAgIEB2aW1TdGF0ZS5yZXNldCgpXG4gICAgIyBbRklYTUVdIENvbXBvbmVudCBpcyBub3QgbmVjZXNzYXJ5IGF2YWlhYmxlIHNlZSAjOTguXG4gICAgQGVkaXRvckVsZW1lbnQuY29tcG9uZW50Py5zZXRJbnB1dEVuYWJsZWQoZmFsc2UpXG4gICAgbmV3IERpc3Bvc2FibGVcblxuICAjIE9wZXJhdG9yIFBlbmRpbmdcbiAgIyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIGFjdGl2YXRlT3BlcmF0b3JQZW5kaW5nTW9kZTogLT5cbiAgICBuZXcgRGlzcG9zYWJsZVxuXG4gICMgSW5zZXJ0XG4gICMgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBhY3RpdmF0ZUluc2VydE1vZGU6IChzdWJtb2RlPW51bGwpIC0+XG4gICAgQGVkaXRvckVsZW1lbnQuY29tcG9uZW50LnNldElucHV0RW5hYmxlZCh0cnVlKVxuICAgIHJlcGxhY2VNb2RlRGVhY3RpdmF0b3IgPSBAYWN0aXZhdGVSZXBsYWNlTW9kZSgpIGlmIHN1Ym1vZGUgaXMgJ3JlcGxhY2UnXG5cbiAgICBuZXcgRGlzcG9zYWJsZSA9PlxuICAgICAgcmVwbGFjZU1vZGVEZWFjdGl2YXRvcj8uZGlzcG9zZSgpXG4gICAgICByZXBsYWNlTW9kZURlYWN0aXZhdG9yID0gbnVsbFxuXG4gICAgICAjIFdoZW4gZXNjYXBlIGZyb20gaW5zZXJ0LW1vZGUsIGN1cnNvciBtb3ZlIExlZnQuXG4gICAgICBuZWVkU3BlY2lhbENhcmVUb1ByZXZlbnRXcmFwTGluZSA9IGF0b20uY29uZmlnLmdldCgnZWRpdG9yLmF0b21pY1NvZnRUYWJzJykgPyB0cnVlXG4gICAgICBmb3IgY3Vyc29yIGluIEBlZGl0b3IuZ2V0Q3Vyc29ycygpXG4gICAgICAgIG1vdmVDdXJzb3JMZWZ0KGN1cnNvciwge25lZWRTcGVjaWFsQ2FyZVRvUHJldmVudFdyYXBMaW5lfSlcblxuICBhY3RpdmF0ZVJlcGxhY2VNb2RlOiAtPlxuICAgIEByZXBsYWNlZENoYXJzQnlTZWxlY3Rpb24gPSB7fVxuICAgIHN1YnMgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZVxuICAgIHN1YnMuYWRkIEBlZGl0b3Iub25XaWxsSW5zZXJ0VGV4dCAoe3RleHQsIGNhbmNlbH0pID0+XG4gICAgICBjYW5jZWwoKVxuICAgICAgQGVkaXRvci5nZXRTZWxlY3Rpb25zKCkuZm9yRWFjaCAoc2VsZWN0aW9uKSA9PlxuICAgICAgICBmb3IgY2hhciBpbiB0ZXh0LnNwbGl0KCcnKSA/IFtdXG4gICAgICAgICAgaWYgKGNoYXIgaXNudCBcIlxcblwiKSBhbmQgKG5vdCBzZWxlY3Rpb24uY3Vyc29yLmlzQXRFbmRPZkxpbmUoKSlcbiAgICAgICAgICAgIHNlbGVjdGlvbi5zZWxlY3RSaWdodCgpXG4gICAgICAgICAgQHJlcGxhY2VkQ2hhcnNCeVNlbGVjdGlvbltzZWxlY3Rpb24uaWRdID89IFtdXG4gICAgICAgICAgQHJlcGxhY2VkQ2hhcnNCeVNlbGVjdGlvbltzZWxlY3Rpb24uaWRdLnB1c2goc3dyYXAoc2VsZWN0aW9uKS5yZXBsYWNlKGNoYXIpKVxuXG4gICAgc3Vicy5hZGQgbmV3IERpc3Bvc2FibGUgPT5cbiAgICAgIEByZXBsYWNlZENoYXJzQnlTZWxlY3Rpb24gPSBudWxsXG4gICAgc3Vic1xuXG4gIGdldFJlcGxhY2VkQ2hhckZvclNlbGVjdGlvbjogKHNlbGVjdGlvbikgLT5cbiAgICBAcmVwbGFjZWRDaGFyc0J5U2VsZWN0aW9uW3NlbGVjdGlvbi5pZF0/LnBvcCgpXG5cbiAgIyBWaXN1YWxcbiAgIyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICMgV2UgdHJlYXQgYWxsIHNlbGVjdGlvbiBpcyBpbml0aWFsbHkgTk9UIG5vcm1hbGl6ZWRcbiAgI1xuICAjIDEuIEZpcnN0IHdlIG5vcm1hbGl6ZSBzZWxlY3Rpb25cbiAgIyAyLiBUaGVuIHVwZGF0ZSBzZWxlY3Rpb24gb3JpZW50YXRpb24oPXdpc2UpLlxuICAjXG4gICMgUmVnYXJkbGVzcyBvZiBzZWxlY3Rpb24gaXMgbW9kaWZpZWQgYnkgdm1wLWNvbW1hbmQgb3Igb3V0ZXItdm1wLWNvbW1hbmQgbGlrZSBgY21kLWxgLlxuICAjIFdoZW4gbm9ybWFsaXplLCB3ZSBtb3ZlIGN1cnNvciB0byBsZWZ0KHNlbGVjdExlZnQgZXF1aXZhbGVudCkuXG4gICMgU2luY2UgVmltJ3MgdmlzdWFsLW1vZGUgaXMgYWx3YXlzIHNlbGVjdFJpZ2h0ZWQuXG4gICNcbiAgIyAtIHVuLW5vcm1hbGl6ZWQgc2VsZWN0aW9uOiBUaGlzIGlzIHRoZSByYW5nZSB3ZSBzZWUgaW4gdmlzdWFsLW1vZGUuKCBTbyBub3JtYWwgdmlzdWFsLW1vZGUgcmFuZ2UgaW4gdXNlciBwZXJzcGVjdGl2ZSApLlxuICAjIC0gbm9ybWFsaXplZCBzZWxlY3Rpb246IE9uZSBjb2x1bW4gbGVmdCBzZWxjdGVkIGF0IHNlbGVjdGlvbiBlbmQgcG9zaXRpb25cbiAgIyAtIFdoZW4gc2VsZWN0UmlnaHQgYXQgZW5kIHBvc2l0aW9uIG9mIG5vcm1hbGl6ZWQtc2VsZWN0aW9uLCBpdCBiZWNvbWUgdW4tbm9ybWFsaXplZCBzZWxlY3Rpb25cbiAgIyAgIHdoaWNoIGlzIHRoZSByYW5nZSBpbiB2aXN1YWwtbW9kZS5cbiAgI1xuICBhY3RpdmF0ZVZpc3VhbE1vZGU6IChuZXdTdWJtb2RlKSAtPlxuICAgIEBub3JtYWxpemVTZWxlY3Rpb25zKClcbiAgICBzd3JhcC5hcHBseVdpc2UoQGVkaXRvciwgJ2NoYXJhY3Rlcndpc2UnKVxuXG4gICAgc3dpdGNoIG5ld1N1Ym1vZGVcbiAgICAgIHdoZW4gJ2xpbmV3aXNlJ1xuICAgICAgICBzd3JhcC5hcHBseVdpc2UoQGVkaXRvciwgJ2xpbmV3aXNlJylcbiAgICAgIHdoZW4gJ2Jsb2Nrd2lzZSdcbiAgICAgICAgQHZpbVN0YXRlLnNlbGVjdEJsb2Nrd2lzZSgpXG5cbiAgICBuZXcgRGlzcG9zYWJsZSA9PlxuICAgICAgQG5vcm1hbGl6ZVNlbGVjdGlvbnMoKVxuICAgICAgc2VsZWN0aW9uLmNsZWFyKGF1dG9zY3JvbGw6IGZhbHNlKSBmb3Igc2VsZWN0aW9uIGluIEBlZGl0b3IuZ2V0U2VsZWN0aW9ucygpXG4gICAgICBAdXBkYXRlTmFycm93ZWRTdGF0ZShmYWxzZSlcblxuICBub3JtYWxpemVTZWxlY3Rpb25zOiAtPlxuICAgIGlmIEBzdWJtb2RlIGlzICdibG9ja3dpc2UnXG4gICAgICBmb3IgYnMgaW4gQHZpbVN0YXRlLmdldEJsb2Nrd2lzZVNlbGVjdGlvbnMoKVxuICAgICAgICBicy5yZXN0b3JlQ2hhcmFjdGVyd2lzZSgpXG4gICAgICBAdmltU3RhdGUuY2xlYXJCbG9ja3dpc2VTZWxlY3Rpb25zKClcblxuICAgIHN3cmFwLm5vcm1hbGl6ZShAZWRpdG9yKVxuXG4gICMgTmFycm93IHRvIHNlbGVjdGlvblxuICAjIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgaGFzTXVsdGlMaW5lU2VsZWN0aW9uOiAtPlxuICAgIGlmIEBpc01vZGUoJ3Zpc3VhbCcsICdibG9ja3dpc2UnKVxuICAgICAgIyBbRklYTUVdIHdoeSBJIG5lZWQgbnVsbCBndWFyZCBoZXJlXG4gICAgICBub3QgQHZpbVN0YXRlLmdldExhc3RCbG9ja3dpc2VTZWxlY3Rpb24oKT8uaXNTaW5nbGVSb3coKVxuICAgIGVsc2VcbiAgICAgIG5vdCBzd3JhcChAZWRpdG9yLmdldExhc3RTZWxlY3Rpb24oKSkuaXNTaW5nbGVSb3coKVxuXG4gIHVwZGF0ZU5hcnJvd2VkU3RhdGU6ICh2YWx1ZT1udWxsKSAtPlxuICAgIEBlZGl0b3JFbGVtZW50LmNsYXNzTGlzdC50b2dnbGUoJ2lzLW5hcnJvd2VkJywgdmFsdWUgPyBAaGFzTXVsdGlMaW5lU2VsZWN0aW9uKCkpXG5cbiAgaXNOYXJyb3dlZDogLT5cbiAgICBAZWRpdG9yRWxlbWVudC5jbGFzc0xpc3QuY29udGFpbnMoJ2lzLW5hcnJvd2VkJylcblxubW9kdWxlLmV4cG9ydHMgPSBNb2RlTWFuYWdlclxuIl19
