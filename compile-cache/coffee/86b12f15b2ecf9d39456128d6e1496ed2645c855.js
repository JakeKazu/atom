(function() {
  var BlockwiseSelection, CompositeDisposable, CursorStyleManager, Delegato, Disposable, Emitter, FlashManager, HighlightSearchManager, HoverManager, MarkManager, ModeManager, MutationManager, OccurrenceManager, OperationStack, PersistentSelectionManager, Range, RegisterManager, SearchHistoryManager, SearchInputElement, VimState, _, getVisibleEditors, jQuery, matchScopes, packageScope, ref, ref1, semver, settings, swrap,
    slice = [].slice,
    indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  semver = require('semver');

  Delegato = require('delegato');

  jQuery = require('atom-space-pen-views').jQuery;

  _ = require('underscore-plus');

  ref = require('atom'), Emitter = ref.Emitter, Disposable = ref.Disposable, CompositeDisposable = ref.CompositeDisposable, Range = ref.Range;

  settings = require('./settings');

  HoverManager = require('./hover-manager');

  SearchInputElement = require('./search-input');

  ref1 = require('./utils'), getVisibleEditors = ref1.getVisibleEditors, matchScopes = ref1.matchScopes;

  swrap = require('./selection-wrapper');

  OperationStack = require('./operation-stack');

  MarkManager = require('./mark-manager');

  ModeManager = require('./mode-manager');

  RegisterManager = require('./register-manager');

  SearchHistoryManager = require('./search-history-manager');

  CursorStyleManager = require('./cursor-style-manager');

  BlockwiseSelection = require('./blockwise-selection');

  OccurrenceManager = require('./occurrence-manager');

  HighlightSearchManager = require('./highlight-search-manager');

  MutationManager = require('./mutation-manager');

  PersistentSelectionManager = require('./persistent-selection-manager');

  FlashManager = require('./flash-manager');

  packageScope = 'vim-mode-plus';

  module.exports = VimState = (function() {
    VimState.vimStatesByEditor = new Map;

    VimState.getByEditor = function(editor) {
      return this.vimStatesByEditor.get(editor);
    };

    VimState.forEach = function(fn) {
      return this.vimStatesByEditor.forEach(fn);
    };

    VimState.clear = function() {
      return this.vimStatesByEditor.clear();
    };

    Delegato.includeInto(VimState);

    VimState.delegatesProperty('mode', 'submode', {
      toProperty: 'modeManager'
    });

    VimState.delegatesMethods('isMode', 'activate', {
      toProperty: 'modeManager'
    });

    VimState.delegatesMethods('flash', 'flashScreenRange', {
      toProperty: 'flashManager'
    });

    VimState.delegatesMethods('subscribe', 'getCount', 'setCount', 'hasCount', 'addToClassList', {
      toProperty: 'operationStack'
    });

    function VimState(editor1, statusBarManager, globalState) {
      var refreshHighlightSearch;
      this.editor = editor1;
      this.statusBarManager = statusBarManager;
      this.globalState = globalState;
      this.editorElement = this.editor.element;
      this.emitter = new Emitter;
      this.subscriptions = new CompositeDisposable;
      this.modeManager = new ModeManager(this);
      this.mark = new MarkManager(this);
      this.register = new RegisterManager(this);
      this.hover = new HoverManager(this);
      this.hoverSearchCounter = new HoverManager(this);
      this.searchHistory = new SearchHistoryManager(this);
      this.highlightSearch = new HighlightSearchManager(this);
      this.persistentSelection = new PersistentSelectionManager(this);
      this.occurrenceManager = new OccurrenceManager(this);
      this.mutationManager = new MutationManager(this);
      this.flashManager = new FlashManager(this);
      this.searchInput = new SearchInputElement().initialize(this);
      this.operationStack = new OperationStack(this);
      this.cursorStyleManager = new CursorStyleManager(this);
      this.blockwiseSelections = [];
      this.previousSelection = {};
      this.observeSelections();
      refreshHighlightSearch = (function(_this) {
        return function() {
          return _this.highlightSearch.refresh();
        };
      })(this);
      this.subscriptions.add(this.editor.onDidStopChanging(refreshHighlightSearch));
      this.editorElement.classList.add(packageScope);
      if (settings.get('startInInsertMode') || matchScopes(this.editorElement, settings.get('startInInsertModeScopes'))) {
        this.activate('insert');
      } else {
        this.activate('normal');
      }
      this.subscriptions.add(this.editor.onDidDestroy(this.destroy.bind(this)));
      this.constructor.vimStatesByEditor.set(this.editor, this);
    }

    VimState.prototype.getBlockwiseSelections = function() {
      return this.blockwiseSelections;
    };

    VimState.prototype.getLastBlockwiseSelection = function() {
      return _.last(this.blockwiseSelections);
    };

    VimState.prototype.getBlockwiseSelectionsOrderedByBufferPosition = function() {
      return this.getBlockwiseSelections().sort(function(a, b) {
        return a.getStartSelection().compare(b.getStartSelection());
      });
    };

    VimState.prototype.clearBlockwiseSelections = function() {
      return this.blockwiseSelections = [];
    };

    VimState.prototype.selectBlockwiseForSelection = function(selection) {
      return this.blockwiseSelections.push(new BlockwiseSelection(selection));
    };

    VimState.prototype.selectBlockwise = function() {
      var i, len, ref2, selection;
      ref2 = this.editor.getSelections();
      for (i = 0, len = ref2.length; i < len; i++) {
        selection = ref2[i];
        this.selectBlockwiseForSelection(selection);
      }
      return this.getLastBlockwiseSelection().autoscrollIfReversed();
    };

    VimState.prototype.selectLinewise = function() {
      return swrap.applyWise(this.editor, 'linewise');
    };

    VimState.prototype.toggleClassList = function(className, bool) {
      if (bool == null) {
        bool = void 0;
      }
      return this.editorElement.classList.toggle(className, bool);
    };

    VimState.prototype.swapClassName = function() {
      var classNames, oldMode, ref2;
      classNames = 1 <= arguments.length ? slice.call(arguments, 0) : [];
      oldMode = this.mode;
      this.editorElement.classList.remove(oldMode + "-mode");
      this.editorElement.classList.remove('vim-mode-plus');
      (ref2 = this.editorElement.classList).add.apply(ref2, classNames);
      return new Disposable((function(_this) {
        return function() {
          var ref3;
          (ref3 = _this.editorElement.classList).remove.apply(ref3, classNames);
          if (_this.mode === oldMode) {
            _this.editorElement.classList.add(oldMode + "-mode");
          }
          _this.editorElement.classList.add('vim-mode-plus');
          return _this.editorElement.classList.add('is-focused');
        };
      })(this));
    };

    VimState.prototype.onDidChangeSearch = function(fn) {
      return this.subscribe(this.searchInput.onDidChange(fn));
    };

    VimState.prototype.onDidConfirmSearch = function(fn) {
      return this.subscribe(this.searchInput.onDidConfirm(fn));
    };

    VimState.prototype.onDidCancelSearch = function(fn) {
      return this.subscribe(this.searchInput.onDidCancel(fn));
    };

    VimState.prototype.onDidCommandSearch = function(fn) {
      return this.subscribe(this.searchInput.onDidCommand(fn));
    };

    VimState.prototype.onDidSetTarget = function(fn) {
      return this.subscribe(this.emitter.on('did-set-target', fn));
    };

    VimState.prototype.emitDidSetTarget = function(operator) {
      return this.emitter.emit('did-set-target', operator);
    };

    VimState.prototype.onWillSelectTarget = function(fn) {
      return this.subscribe(this.emitter.on('will-select-target', fn));
    };

    VimState.prototype.emitWillSelectTarget = function() {
      return this.emitter.emit('will-select-target');
    };

    VimState.prototype.onDidSelectTarget = function(fn) {
      return this.subscribe(this.emitter.on('did-select-target', fn));
    };

    VimState.prototype.emitDidSelectTarget = function() {
      return this.emitter.emit('did-select-target');
    };

    VimState.prototype.onDidFailSelectTarget = function(fn) {
      return this.subscribe(this.emitter.on('did-fail-select-target', fn));
    };

    VimState.prototype.emitDidFailSelectTarget = function() {
      return this.emitter.emit('did-fail-select-target');
    };

    VimState.prototype.onWillFinishMutation = function(fn) {
      return this.subscribe(this.emitter.on('on-will-finish-mutation', fn));
    };

    VimState.prototype.emitWillFinishMutation = function() {
      return this.emitter.emit('on-will-finish-mutation');
    };

    VimState.prototype.onDidFinishMutation = function(fn) {
      return this.subscribe(this.emitter.on('on-did-finish-mutation', fn));
    };

    VimState.prototype.emitDidFinishMutation = function() {
      return this.emitter.emit('on-did-finish-mutation');
    };

    VimState.prototype.onDidRestoreCursorPositions = function(fn) {
      return this.subscribe(this.emitter.on('did-restore-cursor-positions', fn));
    };

    VimState.prototype.emitDidRestoreCursorPositions = function() {
      return this.emitter.emit('did-restore-cursor-positions');
    };

    VimState.prototype.onDidSetOperatorModifier = function(fn) {
      return this.subscribe(this.emitter.on('did-set-operator-modifier', fn));
    };

    VimState.prototype.emitDidSetOperatorModifier = function(options) {
      return this.emitter.emit('did-set-operator-modifier', options);
    };

    VimState.prototype.onDidFinishOperation = function(fn) {
      return this.subscribe(this.emitter.on('did-finish-operation', fn));
    };

    VimState.prototype.emitDidFinishOperation = function() {
      return this.emitter.emit('did-finish-operation');
    };

    VimState.prototype.onDidResetOperationStack = function(fn) {
      return this.subscribe(this.emitter.on('did-reset-operation-stack', fn));
    };

    VimState.prototype.emitDidResetOperationStack = function() {
      return this.emitter.emit('did-reset-operation-stack');
    };

    VimState.prototype.onDidConfirmSelectList = function(fn) {
      return this.subscribe(this.emitter.on('did-confirm-select-list', fn));
    };

    VimState.prototype.onDidCancelSelectList = function(fn) {
      return this.subscribe(this.emitter.on('did-cancel-select-list', fn));
    };

    VimState.prototype.onWillActivateMode = function(fn) {
      return this.subscribe(this.modeManager.onWillActivateMode(fn));
    };

    VimState.prototype.onDidActivateMode = function(fn) {
      return this.subscribe(this.modeManager.onDidActivateMode(fn));
    };

    VimState.prototype.onWillDeactivateMode = function(fn) {
      return this.subscribe(this.modeManager.onWillDeactivateMode(fn));
    };

    VimState.prototype.preemptWillDeactivateMode = function(fn) {
      return this.subscribe(this.modeManager.preemptWillDeactivateMode(fn));
    };

    VimState.prototype.onDidDeactivateMode = function(fn) {
      return this.subscribe(this.modeManager.onDidDeactivateMode(fn));
    };

    VimState.prototype.onDidFailToPushToOperationStack = function(fn) {
      return this.emitter.on('did-fail-to-push-to-operation-stack', fn);
    };

    VimState.prototype.emitDidFailToPushToOperationStack = function() {
      return this.emitter.emit('did-fail-to-push-to-operation-stack');
    };

    VimState.prototype.onDidDestroy = function(fn) {
      return this.emitter.on('did-destroy', fn);
    };

    VimState.prototype.onDidSetMark = function(fn) {
      return this.emitter.on('did-set-mark', fn);
    };

    VimState.prototype.onDidSetInputChar = function(fn) {
      return this.emitter.on('did-set-input-char', fn);
    };

    VimState.prototype.emitDidSetInputChar = function(char) {
      return this.emitter.emit('did-set-input-char', char);
    };

    VimState.prototype.isAlive = function() {
      return this.constructor.vimStatesByEditor.has(this.editor);
    };

    VimState.prototype.destroy = function() {
      var ref2, ref3, ref4, ref5, ref6, ref7, ref8, ref9;
      if (!this.isAlive()) {
        return;
      }
      this.constructor.vimStatesByEditor["delete"](this.editor);
      this.subscriptions.dispose();
      if (this.editor.isAlive()) {
        this.resetNormalMode();
        this.reset();
        if ((ref2 = this.editorElement.component) != null) {
          ref2.setInputEnabled(true);
        }
        this.editorElement.classList.remove(packageScope, 'normal-mode');
      }
      if ((ref3 = this.hover) != null) {
        if (typeof ref3.destroy === "function") {
          ref3.destroy();
        }
      }
      if ((ref4 = this.hoverSearchCounter) != null) {
        if (typeof ref4.destroy === "function") {
          ref4.destroy();
        }
      }
      if ((ref5 = this.searchHistory) != null) {
        if (typeof ref5.destroy === "function") {
          ref5.destroy();
        }
      }
      if ((ref6 = this.cursorStyleManager) != null) {
        if (typeof ref6.destroy === "function") {
          ref6.destroy();
        }
      }
      if ((ref7 = this.search) != null) {
        if (typeof ref7.destroy === "function") {
          ref7.destroy();
        }
      }
      ((ref8 = this.register) != null ? ref8.destroy : void 0) != null;
      ref9 = {}, this.hover = ref9.hover, this.hoverSearchCounter = ref9.hoverSearchCounter, this.operationStack = ref9.operationStack, this.searchHistory = ref9.searchHistory, this.cursorStyleManager = ref9.cursorStyleManager, this.search = ref9.search, this.modeManager = ref9.modeManager, this.register = ref9.register, this.editor = ref9.editor, this.editorElement = ref9.editorElement, this.subscriptions = ref9.subscriptions, this.occurrenceManager = ref9.occurrenceManager, this.previousSelection = ref9.previousSelection, this.persistentSelection = ref9.persistentSelection;
      return this.emitter.emit('did-destroy');
    };

    VimState.prototype.isInterestingEvent = function(arg) {
      var target, type;
      target = arg.target, type = arg.type;
      if (this.mode === 'insert') {
        return false;
      } else {
        return (this.editor != null) && (target != null ? typeof target.closest === "function" ? target.closest('atom-text-editor') : void 0 : void 0) === this.editorElement && !this.isMode('visual', 'blockwise') && !type.startsWith('vim-mode-plus:');
      }
    };

    VimState.prototype.checkSelection = function(event) {
      var i, len, nonEmptySelecitons, selection, submode;
      if (this.operationStack.isProcessing()) {
        return;
      }
      if (!this.isInterestingEvent(event)) {
        return;
      }
      nonEmptySelecitons = this.editor.getSelections().filter(function(selection) {
        return !selection.isEmpty();
      });
      if (nonEmptySelecitons.length) {
        submode = swrap.detectVisualModeSubmode(this.editor);
        if (this.isMode('visual', submode)) {
          for (i = 0, len = nonEmptySelecitons.length; i < len; i++) {
            selection = nonEmptySelecitons[i];
            if (!swrap(selection).hasProperties()) {
              swrap(selection).saveProperties();
            }
          }
          return this.updateCursorsVisibility();
        } else {
          return this.activate('visual', submode);
        }
      } else {
        if (this.isMode('visual')) {
          return this.activate('normal');
        }
      }
    };

    VimState.prototype.saveProperties = function(event) {
      var i, len, ref2, results, selection;
      if (!this.isInterestingEvent(event)) {
        return;
      }
      ref2 = this.editor.getSelections();
      results = [];
      for (i = 0, len = ref2.length; i < len; i++) {
        selection = ref2[i];
        results.push(swrap(selection).saveProperties());
      }
      return results;
    };

    VimState.prototype.observeSelections = function() {
      var checkSelection;
      checkSelection = this.checkSelection.bind(this);
      this.editorElement.addEventListener('mouseup', checkSelection);
      this.subscriptions.add(new Disposable((function(_this) {
        return function() {
          return _this.editorElement.removeEventListener('mouseup', checkSelection);
        };
      })(this)));
      return this.subscriptions.add(atom.commands.onDidDispatch(checkSelection));
    };

    VimState.prototype.clearSelections = function() {
      return this.editor.setCursorBufferPosition(this.editor.getCursorBufferPosition());
    };

    VimState.prototype.resetNormalMode = function(arg) {
      var userInvocation;
      userInvocation = (arg != null ? arg : {}).userInvocation;
      if (userInvocation != null ? userInvocation : false) {
        if (this.editor.hasMultipleCursors()) {
          this.clearSelections();
        } else if (this.hasPersistentSelections() && settings.get('clearPersistentSelectionOnResetNormalMode')) {
          this.clearPersistentSelections();
        } else if (this.occurrenceManager.hasPatterns()) {
          this.occurrenceManager.resetPatterns();
        }
        if (settings.get('clearHighlightSearchOnResetNormalMode')) {
          this.globalState.set('highlightSearchPattern', null);
        }
      } else {
        this.clearSelections();
      }
      return this.activate('normal');
    };

    VimState.prototype.init = function() {
      return this.saveOriginalCursorPosition();
    };

    VimState.prototype.reset = function() {
      this.register.reset();
      this.searchHistory.reset();
      this.hover.reset();
      this.operationStack.reset();
      return this.mutationManager.reset();
    };

    VimState.prototype.isVisible = function() {
      var ref2;
      return ref2 = this.editor, indexOf.call(getVisibleEditors(), ref2) >= 0;
    };

    VimState.prototype.updateCursorsVisibility = function() {
      return this.cursorStyleManager.refresh();
    };

    VimState.prototype.updatePreviousSelection = function() {
      var head, properties, ref2, tail;
      if (this.isMode('visual', 'blockwise')) {
        properties = (ref2 = this.getLastBlockwiseSelection()) != null ? ref2.getCharacterwiseProperties() : void 0;
      } else {
        properties = swrap(this.editor.getLastSelection()).captureProperties();
      }
      if (properties == null) {
        return;
      }
      head = properties.head, tail = properties.tail;
      if (head.isGreaterThan(tail)) {
        this.mark.setRange('<', '>', [tail, head]);
      } else {
        this.mark.setRange('<', '>', [head, tail]);
      }
      return this.previousSelection = {
        properties: properties,
        submode: this.submode
      };
    };

    VimState.prototype.hasPersistentSelections = function() {
      return this.persistentSelection.hasMarkers();
    };

    VimState.prototype.getPersistentSelectionBufferRanges = function() {
      return this.persistentSelection.getMarkerBufferRanges();
    };

    VimState.prototype.clearPersistentSelections = function() {
      return this.persistentSelection.clearMarkers();
    };

    VimState.prototype.scrollAnimationEffect = null;

    VimState.prototype.requestScrollAnimation = function(from, to, options) {
      return this.scrollAnimationEffect = jQuery(from).animate(to, options);
    };

    VimState.prototype.finishScrollAnimation = function() {
      var ref2;
      if ((ref2 = this.scrollAnimationEffect) != null) {
        ref2.finish();
      }
      return this.scrollAnimationEffect = null;
    };

    VimState.prototype.saveOriginalCursorPosition = function() {
      var options, point, ref2;
      this.originalCursorPosition = null;
      if ((ref2 = this.originalCursorPositionByMarker) != null) {
        ref2.destroy();
      }
      if (this.mode === 'visual') {
        options = {
          fromProperty: true,
          allowFallback: true
        };
        point = swrap(this.editor.getLastSelection()).getBufferPositionFor('head', options);
      } else {
        point = this.editor.getCursorBufferPosition();
      }
      this.originalCursorPosition = point;
      return this.originalCursorPositionByMarker = this.editor.markBufferPosition(point, {
        invalidate: 'never'
      });
    };

    VimState.prototype.restoreOriginalCursorPosition = function() {
      return this.editor.setCursorBufferPosition(this.getOriginalCursorPosition());
    };

    VimState.prototype.getOriginalCursorPosition = function() {
      return this.originalCursorPosition;
    };

    VimState.prototype.getOriginalCursorPositionByMarker = function() {
      return this.originalCursorPositionByMarker.getStartBufferPosition();
    };

    return VimState;

  })();

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL2hvbWUvamFrZS8uYXRvbS9wYWNrYWdlcy92aW0tbW9kZS1wbHVzL2xpYi92aW0tc3RhdGUuY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FBQUEsTUFBQSxpYUFBQTtJQUFBOzs7RUFBQSxNQUFBLEdBQVMsT0FBQSxDQUFRLFFBQVI7O0VBQ1QsUUFBQSxHQUFXLE9BQUEsQ0FBUSxVQUFSOztFQUNWLFNBQVUsT0FBQSxDQUFRLHNCQUFSOztFQUVYLENBQUEsR0FBSSxPQUFBLENBQVEsaUJBQVI7O0VBQ0osTUFBb0QsT0FBQSxDQUFRLE1BQVIsQ0FBcEQsRUFBQyxxQkFBRCxFQUFVLDJCQUFWLEVBQXNCLDZDQUF0QixFQUEyQzs7RUFFM0MsUUFBQSxHQUFXLE9BQUEsQ0FBUSxZQUFSOztFQUNYLFlBQUEsR0FBZSxPQUFBLENBQVEsaUJBQVI7O0VBQ2Ysa0JBQUEsR0FBcUIsT0FBQSxDQUFRLGdCQUFSOztFQUNyQixPQUdJLE9BQUEsQ0FBUSxTQUFSLENBSEosRUFDRSwwQ0FERixFQUVFOztFQUVGLEtBQUEsR0FBUSxPQUFBLENBQVEscUJBQVI7O0VBRVIsY0FBQSxHQUFpQixPQUFBLENBQVEsbUJBQVI7O0VBQ2pCLFdBQUEsR0FBYyxPQUFBLENBQVEsZ0JBQVI7O0VBQ2QsV0FBQSxHQUFjLE9BQUEsQ0FBUSxnQkFBUjs7RUFDZCxlQUFBLEdBQWtCLE9BQUEsQ0FBUSxvQkFBUjs7RUFDbEIsb0JBQUEsR0FBdUIsT0FBQSxDQUFRLDBCQUFSOztFQUN2QixrQkFBQSxHQUFxQixPQUFBLENBQVEsd0JBQVI7O0VBQ3JCLGtCQUFBLEdBQXFCLE9BQUEsQ0FBUSx1QkFBUjs7RUFDckIsaUJBQUEsR0FBb0IsT0FBQSxDQUFRLHNCQUFSOztFQUNwQixzQkFBQSxHQUF5QixPQUFBLENBQVEsNEJBQVI7O0VBQ3pCLGVBQUEsR0FBa0IsT0FBQSxDQUFRLG9CQUFSOztFQUNsQiwwQkFBQSxHQUE2QixPQUFB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QUcvQix5QkFBQSxHQUEyQixTQUFBO2FBQ3pCLElBQUMsQ0FBQTtJQUR3Qjs7dUJBRzNCLGlDQUFBLEdBQW1DLFNBQUE7YUFDakMsSUFBQyxDQUFBLDhCQUE4QixDQUFDLHNCQUFoQyxDQUFBO0lBRGlDOzs7OztBQXBYckMiLCJzb3VyY2VzQ29udGVudCI6WyJzZW12ZXIgPSByZXF1aXJlICdzZW12ZXInXG5EZWxlZ2F0byA9IHJlcXVpcmUgJ2RlbGVnYXRvJ1xue2pRdWVyeX0gPSByZXF1aXJlICdhdG9tLXNwYWNlLXBlbi12aWV3cydcblxuXyA9IHJlcXVpcmUgJ3VuZGVyc2NvcmUtcGx1cydcbntFbWl0dGVyLCBEaXNwb3NhYmxlLCBDb21wb3NpdGVEaXNwb3NhYmxlLCBSYW5nZX0gPSByZXF1aXJlICdhdG9tJ1xuXG5zZXR0aW5ncyA9IHJlcXVpcmUgJy4vc2V0dGluZ3MnXG5Ib3Zlck1hbmFnZXIgPSByZXF1aXJlICcuL2hvdmVyLW1hbmFnZXInXG5TZWFyY2hJbnB1dEVsZW1lbnQgPSByZXF1aXJlICcuL3NlYXJjaC1pbnB1dCdcbntcbiAgZ2V0VmlzaWJsZUVkaXRvcnNcbiAgbWF0Y2hTY29wZXNcbn0gPSByZXF1aXJlICcuL3V0aWxzJ1xuc3dyYXAgPSByZXF1aXJlICcuL3NlbGVjdGlvbi13cmFwcGVyJ1xuXG5PcGVyYXRpb25TdGFjayA9IHJlcXVpcmUgJy4vb3BlcmF0aW9uLXN0YWNrJ1xuTWFya01hbmFnZXIgPSByZXF1aXJlICcuL21hcmstbWFuYWdlcidcbk1vZGVNYW5hZ2VyID0gcmVxdWlyZSAnLi9tb2RlLW1hbmFnZXInXG5SZWdpc3Rlck1hbmFnZXIgPSByZXF1aXJlICcuL3JlZ2lzdGVyLW1hbmFnZXInXG5TZWFyY2hIaXN0b3J5TWFuYWdlciA9IHJlcXVpcmUgJy4vc2VhcmNoLWhpc3RvcnktbWFuYWdlcidcbkN1cnNvclN0eWxlTWFuYWdlciA9IHJlcXVpcmUgJy4vY3Vyc29yLXN0eWxlLW1hbmFnZXInXG5CbG9ja3dpc2VTZWxlY3Rpb24gPSByZXF1aXJlICcuL2Jsb2Nrd2lzZS1zZWxlY3Rpb24nXG5PY2N1cnJlbmNlTWFuYWdlciA9IHJlcXVpcmUgJy4vb2NjdXJyZW5jZS1tYW5hZ2VyJ1xuSGlnaGxpZ2h0U2VhcmNoTWFuYWdlciA9IHJlcXVpcmUgJy4vaGlnaGxpZ2h0LXNlYXJjaC1tYW5hZ2VyJ1xuTXV0YXRpb25NYW5hZ2VyID0gcmVxdWlyZSAnLi9tdXRhdGlvbi1tYW5hZ2VyJ1xuUGVyc2lzdGVudFNlbGVjdGlvbk1hbmFnZXIgPSByZXF1aXJlICcuL3BlcnNpc3RlbnQtc2VsZWN0aW9uLW1hbmFnZXInXG5GbGFzaE1hbmFnZXIgPSByZXF1aXJlICcuL2ZsYXNoLW1hbmFnZXInXG5cbnBhY2thZ2VTY29wZSA9ICd2aW0tbW9kZS1wbHVzJ1xuXG5tb2R1bGUuZXhwb3J0cyA9XG5jbGFzcyBWaW1TdGF0ZVxuICBAdmltU3RhdGVzQnlFZGl0b3I6IG5ldyBNYXBcblxuICBAZ2V0QnlFZGl0b3I6IChlZGl0b3IpIC0+XG4gICAgQHZpbVN0YXRlc0J5RWRpdG9yLmdldChlZGl0b3IpXG5cbiAgQGZvckVhY2g6IChmbikgLT5cbiAgICBAdmltU3RhdGVzQnlFZGl0b3IuZm9yRWFjaChmbilcblxuICBAY2xlYXI6IC0+XG4gICAgQHZpbVN0YXRlc0J5RWRpdG9yLmNsZWFyKClcblxuICBEZWxlZ2F0by5pbmNsdWRlSW50byh0aGlzKVxuXG4gIEBkZWxlZ2F0ZXNQcm9wZXJ0eSgnbW9kZScsICdzdWJtb2RlJywgdG9Qcm9wZXJ0eTogJ21vZGVNYW5hZ2VyJylcbiAgQGRlbGVnYXRlc01ldGhvZHMoJ2lzTW9kZScsICdhY3RpdmF0ZScsIHRvUHJvcGVydHk6ICdtb2RlTWFuYWdlcicpXG4gIEBkZWxlZ2F0ZXNNZXRob2RzKCdmbGFzaCcsICdmbGFzaFNjcmVlblJhbmdlJywgdG9Qcm9wZXJ0eTogJ2ZsYXNoTWFuYWdlcicpXG4gIEBkZWxlZ2F0ZXNNZXRob2RzKCdzdWJzY3JpYmUnLCAnZ2V0Q291bnQnLCAnc2V0Q291bnQnLCAnaGFzQ291bnQnLCAnYWRkVG9DbGFzc0xpc3QnLCB0b1Byb3BlcnR5OiAnb3BlcmF0aW9uU3RhY2snKVxuXG4gIGNvbnN0cnVjdG9yOiAoQGVkaXRvciwgQHN0YXR1c0Jhck1hbmFnZXIsIEBnbG9iYWxTdGF0ZSkgLT5cbiAgICBAZWRpdG9yRWxlbWVudCA9IEBlZGl0b3IuZWxlbWVudFxuICAgIEBlbWl0dGVyID0gbmV3IEVtaXR0ZXJcbiAgICBAc3Vic2NyaXB0aW9ucyA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlXG4gICAgQG1vZGVNYW5hZ2VyID0gbmV3IE1vZGVNYW5hZ2VyKHRoaXMpXG4gICAgQG1hcmsgPSBuZXcgTWFya01hbmFnZXIodGhpcylcbiAgICBAcmVnaXN0ZXIgPSBuZXcgUmVnaXN0ZXJNYW5hZ2VyKHRoaXMpXG4gICAgQGhvdmVyID0gbmV3IEhvdmVyTWFuYWdlcih0aGlzKVxuICAgIEBob3ZlclNlYXJjaENvdW50ZXIgPSBuZXcgSG92ZXJNYW5hZ2VyKHRoaXMpXG4gICAgQHNlYXJjaEhpc3RvcnkgPSBuZXcgU2VhcmNoSGlzdG9yeU1hbmFnZXIodGhpcylcbiAgICBAaGlnaGxpZ2h0U2VhcmNoID0gbmV3IEhpZ2hsaWdodFNlYXJjaE1hbmFnZXIodGhpcylcbiAgICBAcGVyc2lzdGVudFNlbGVjdGlvbiA9IG5ldyBQZXJzaXN0ZW50U2VsZWN0aW9uTWFuYWdlcih0aGlzKVxuICAgIEBvY2N1cnJlbmNlTWFuYWdlciA9IG5ldyBPY2N1cnJlbmNlTWFuYWdlcih0aGlzKVxuICAgIEBtdXRhdGlvbk1hbmFnZXIgPSBuZXcgTXV0YXRpb25NYW5hZ2VyKHRoaXMpXG4gICAgQGZsYXNoTWFuYWdlciA9IG5ldyBGbGFzaE1hbmFnZXIodGhpcylcblxuICAgIEBzZWFyY2hJbnB1dCA9IG5ldyBTZWFyY2hJbnB1dEVsZW1lbnQoKS5pbml0aWFsaXplKHRoaXMpXG5cbiAgICBAb3BlcmF0aW9uU3RhY2sgPSBuZXcgT3BlcmF0aW9uU3RhY2sodGhpcylcbiAgICBAY3Vyc29yU3R5bGVNYW5hZ2VyID0gbmV3IEN1cnNvclN0eWxlTWFuYWdlcih0aGlzKVxuICAgIEBibG9ja3dpc2VTZWxlY3Rpb25zID0gW11cbiAgICBAcHJldmlvdXNTZWxlY3Rpb24gPSB7fVxuICAgIEBvYnNlcnZlU2VsZWN0aW9ucygpXG5cbiAgICByZWZyZXNoSGlnaGxpZ2h0U2VhcmNoID0gPT5cbiAgICAgIEBoaWdobGlnaHRTZWFyY2gucmVmcmVzaCgpXG4gICAgQHN1YnNjcmlwdGlvbnMuYWRkIEBlZGl0b3Iub25EaWRTdG9wQ2hhbmdpbmcocmVmcmVzaEhpZ2hsaWdodFNlYXJjaClcblxuICAgIEBlZGl0b3JFbGVtZW50LmNsYXNzTGlzdC5hZGQocGFja2FnZVNjb3BlKVxuICAgIGlmIHNldHRpbmdzLmdldCgnc3RhcnRJbkluc2VydE1vZGUnKSBvciBtYXRjaFNjb3BlcyhAZWRpdG9yRWxlbWVudCwgc2V0dGluZ3MuZ2V0KCdzdGFydEluSW5zZXJ0TW9kZVNjb3BlcycpKVxuICAgICAgQGFjdGl2YXRlKCdpbnNlcnQnKVxuICAgIGVsc2VcbiAgICAgIEBhY3RpdmF0ZSgnbm9ybWFsJylcblxuICAgIEBzdWJzY3JpcHRpb25zLmFkZCBAZWRpdG9yLm9uRGlkRGVzdHJveShAZGVzdHJveS5iaW5kKHRoaXMpKVxuICAgIEBjb25zdHJ1Y3Rvci52aW1TdGF0ZXNCeUVkaXRvci5zZXQoQGVkaXRvciwgdGhpcylcblxuICAjIEJsb2Nrd2lzZVNlbGVjdGlvbnNcbiAgIyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIGdldEJsb2Nrd2lzZVNlbGVjdGlvbnM6IC0+XG4gICAgQGJsb2Nrd2lzZVNlbGVjdGlvbnNcblxuICBnZXRMYXN0QmxvY2t3aXNlU2VsZWN0aW9uOiAtPlxuICAgIF8ubGFzdChAYmxvY2t3aXNlU2VsZWN0aW9ucylcblxuICBnZXRCbG9ja3dpc2VTZWxlY3Rpb25zT3JkZXJlZEJ5QnVmZmVyUG9zaXRpb246IC0+XG4gICAgQGdldEJsb2Nrd2lzZVNlbGVjdGlvbnMoKS5zb3J0IChhLCBiKSAtPlxuICAgICAgYS5nZXRTdGFydFNlbGVjdGlvbigpLmNvbXBhcmUoYi5nZXRTdGFydFNlbGVjdGlvbigpKVxuXG4gIGNsZWFyQmxvY2t3aXNlU2VsZWN0aW9uczogLT5cbiAgICBAYmxvY2t3aXNlU2VsZWN0aW9ucyA9IFtdXG5cbiAgc2VsZWN0QmxvY2t3aXNlRm9yU2VsZWN0aW9uOiAoc2VsZWN0aW9uKSAtPlxuICAgIEBibG9ja3dpc2VTZWxlY3Rpb25zLnB1c2gobmV3IEJsb2Nrd2lzZVNlbGVjdGlvbihzZWxlY3Rpb24pKVxuXG4gIHNlbGVjdEJsb2Nrd2lzZTogLT5cbiAgICBmb3Igc2VsZWN0aW9uIGluIEBlZGl0b3IuZ2V0U2VsZWN0aW9ucygpXG4gICAgICBAc2VsZWN0QmxvY2t3aXNlRm9yU2VsZWN0aW9uKHNlbGVjdGlvbilcbiAgICBAZ2V0TGFzdEJsb2Nrd2lzZVNlbGVjdGlvbigpLmF1dG9zY3JvbGxJZlJldmVyc2VkKClcblxuICAjIE90aGVyXG4gICMgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBzZWxlY3RMaW5ld2lzZTogLT5cbiAgICBzd3JhcC5hcHBseVdpc2UoQGVkaXRvciwgJ2xpbmV3aXNlJylcblxuICAjIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgdG9nZ2xlQ2xhc3NMaXN0OiAoY2xhc3NOYW1lLCBib29sPXVuZGVmaW5lZCkgLT5cbiAgICBAZWRpdG9yRWxlbWVudC5jbGFzc0xpc3QudG9nZ2xlKGNsYXNzTmFtZSwgYm9vbClcblxuICAjIEZJWE1FOiBJIHdhbnQgdG8gcmVtb3ZlIHRoaXMgZGVuZ2VyaW91cyBhcHByb2FjaCwgYnV0IEkgY291bGRuJ3QgZmluZCB0aGUgYmV0dGVyIHdheS5cbiAgc3dhcENsYXNzTmFtZTogKGNsYXNzTmFtZXMuLi4pIC0+XG4gICAgb2xkTW9kZSA9IEBtb2RlXG5cbiAgICBAZWRpdG9yRWxlbWVudC5jbGFzc0xpc3QucmVtb3ZlKG9sZE1vZGUgKyBcIi1tb2RlXCIpXG4gICAgQGVkaXRvckVsZW1lbnQuY2xhc3NMaXN0LnJlbW92ZSgndmltLW1vZGUtcGx1cycpXG4gICAgQGVkaXRvckVsZW1lbnQuY2xhc3NMaXN0LmFkZChjbGFzc05hbWVzLi4uKVxuXG4gICAgbmV3IERpc3Bvc2FibGUgPT5cbiAgICAgIEBlZGl0b3JFbGVtZW50LmNsYXNzTGlzdC5yZW1vdmUoY2xhc3NOYW1lcy4uLilcbiAgICAgIGlmIEBtb2RlIGlzIG9sZE1vZGVcbiAgICAgICAgQGVkaXRvckVsZW1lbnQuY2xhc3NMaXN0LmFkZChvbGRNb2RlICsgXCItbW9kZVwiKVxuICAgICAgQGVkaXRvckVsZW1lbnQuY2xhc3NMaXN0LmFkZCgndmltLW1vZGUtcGx1cycpXG4gICAgICBAZWRpdG9yRWxlbWVudC5jbGFzc0xpc3QuYWRkKCdpcy1mb2N1c2VkJylcblxuICAjIEFsbCBzdWJzY3JpcHRpb25zIGhlcmUgaXMgY2VsYXJlZCBvbiBlYWNoIG9wZXJhdGlvbiBmaW5pc2hlZC5cbiAgIyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIG9uRGlkQ2hhbmdlU2VhcmNoOiAoZm4pIC0+IEBzdWJzY3JpYmUgQHNlYXJjaElucHV0Lm9uRGlkQ2hhbmdlKGZuKVxuICBvbkRpZENvbmZpcm1TZWFyY2g6IChmbikgLT4gQHN1YnNjcmliZSBAc2VhcmNoSW5wdXQub25EaWRDb25maXJtKGZuKVxuICBvbkRpZENhbmNlbFNlYXJjaDogKGZuKSAtPiBAc3Vic2NyaWJlIEBzZWFyY2hJbnB1dC5vbkRpZENhbmNlbChmbilcbiAgb25EaWRDb21tYW5kU2VhcmNoOiAoZm4pIC0+IEBzdWJzY3JpYmUgQHNlYXJjaElucHV0Lm9uRGlkQ29tbWFuZChmbilcblxuICAjIFNlbGVjdCBhbmQgdGV4dCBtdXRhdGlvbihDaGFuZ2UpXG4gIG9uRGlkU2V0VGFyZ2V0OiAoZm4pIC0+IEBzdWJzY3JpYmUgQGVtaXR0ZXIub24oJ2RpZC1zZXQtdGFyZ2V0JywgZm4pXG4gIGVtaXREaWRTZXRUYXJnZXQ6IChvcGVyYXRvcikgLT4gQGVtaXR0ZXIuZW1pdCgnZGlkLXNldC10YXJnZXQnLCBvcGVyYXRvcilcblxuICBvbldpbGxTZWxlY3RUYXJnZXQ6IChmbikgLT4gQHN1YnNjcmliZSBAZW1pdHRlci5vbignd2lsbC1zZWxlY3QtdGFyZ2V0JywgZm4pXG4gIGVtaXRXaWxsU2VsZWN0VGFyZ2V0OiAtPiBAZW1pdHRlci5lbWl0KCd3aWxsLXNlbGVjdC10YXJnZXQnKVxuXG4gIG9uRGlkU2VsZWN0VGFyZ2V0OiAoZm4pIC0+IEBzdWJzY3JpYmUgQGVtaXR0ZXIub24oJ2RpZC1zZWxlY3QtdGFyZ2V0JywgZm4pXG4gIGVtaXREaWRTZWxlY3RUYXJnZXQ6IC0+IEBlbWl0dGVyLmVtaXQoJ2RpZC1zZWxlY3QtdGFyZ2V0JylcblxuICBvbkRpZEZhaWxTZWxlY3RUYXJnZXQ6IChmbikgLT4gQHN1YnNjcmliZSBAZW1pdHRlci5vbignZGlkLWZhaWwtc2VsZWN0LXRhcmdldCcsIGZuKVxuICBlbWl0RGlkRmFpbFNlbGVjdFRhcmdldDogLT4gQGVtaXR0ZXIuZW1pdCgnZGlkLWZhaWwtc2VsZWN0LXRhcmdldCcpXG5cbiAgb25XaWxsRmluaXNoTXV0YXRpb246IChmbikgLT4gQHN1YnNjcmliZSBAZW1pdHRlci5vbignb24td2lsbC1maW5pc2gtbXV0YXRpb24nLCBmbilcbiAgZW1pdFdpbGxGaW5pc2hNdXRhdGlvbjogLT4gQGVtaXR0ZXIuZW1pdCgnb24td2lsbC1maW5pc2gtbXV0YXRpb24nKVxuXG4gIG9uRGlkRmluaXNoTXV0YXRpb246IChmbikgLT4gQHN1YnNjcmliZSBAZW1pdHRlci5vbignb24tZGlkLWZpbmlzaC1tdXRhdGlvbicsIGZuKVxuICBlbWl0RGlkRmluaXNoTXV0YXRpb246IC0+IEBlbWl0dGVyLmVtaXQoJ29uLWRpZC1maW5pc2gtbXV0YXRpb24nKVxuXG4gIG9uRGlkUmVzdG9yZUN1cnNvclBvc2l0aW9uczogKGZuKSAtPiBAc3Vic2NyaWJlIEBlbWl0dGVyLm9uKCdkaWQtcmVzdG9yZS1jdXJzb3ItcG9zaXRpb25zJywgZm4pXG4gIGVtaXREaWRSZXN0b3JlQ3Vyc29yUG9zaXRpb25zOiAtPiBAZW1pdHRlci5lbWl0KCdkaWQtcmVzdG9yZS1jdXJzb3ItcG9zaXRpb25zJylcblxuICBvbkRpZFNldE9wZXJhdG9yTW9kaWZpZXI6IChmbikgLT4gQHN1YnNjcmliZSBAZW1pdHRlci5vbignZGlkLXNldC1vcGVyYXRvci1tb2RpZmllcicsIGZuKVxuICBlbWl0RGlkU2V0T3BlcmF0b3JNb2RpZmllcjogKG9wdGlvbnMpIC0+IEBlbWl0dGVyLmVtaXQoJ2RpZC1zZXQtb3BlcmF0b3ItbW9kaWZpZXInLCBvcHRpb25zKVxuXG4gIG9uRGlkRmluaXNoT3BlcmF0aW9uOiAoZm4pIC0+IEBzdWJzY3JpYmUgQGVtaXR0ZXIub24oJ2RpZC1maW5pc2gtb3BlcmF0aW9uJywgZm4pXG4gIGVtaXREaWRGaW5pc2hPcGVyYXRpb246IC0+IEBlbWl0dGVyLmVtaXQoJ2RpZC1maW5pc2gtb3BlcmF0aW9uJylcblxuICBvbkRpZFJlc2V0T3BlcmF0aW9uU3RhY2s6IChmbikgLT4gQHN1YnNjcmliZSBAZW1pdHRlci5vbignZGlkLXJlc2V0LW9wZXJhdGlvbi1zdGFjaycsIGZuKVxuICBlbWl0RGlkUmVzZXRPcGVyYXRpb25TdGFjazogLT4gQGVtaXR0ZXIuZW1pdCgnZGlkLXJlc2V0LW9wZXJhdGlvbi1zdGFjaycpXG5cbiAgIyBTZWxlY3QgbGlzdCB2aWV3XG4gIG9uRGlkQ29uZmlybVNlbGVjdExpc3Q6IChmbikgLT4gQHN1YnNjcmliZSBAZW1pdHRlci5vbignZGlkLWNvbmZpcm0tc2VsZWN0LWxpc3QnLCBmbilcbiAgb25EaWRDYW5jZWxTZWxlY3RMaXN0OiAoZm4pIC0+IEBzdWJzY3JpYmUgQGVtaXR0ZXIub24oJ2RpZC1jYW5jZWwtc2VsZWN0LWxpc3QnLCBmbilcblxuICAjIFByb3h5aW5nIG1vZGVNYW5nZXIncyBldmVudCBob29rIHdpdGggc2hvcnQtbGlmZSBzdWJzY3JpcHRpb24uXG4gIG9uV2lsbEFjdGl2YXRlTW9kZTogKGZuKSAtPiBAc3Vic2NyaWJlIEBtb2RlTWFuYWdlci5vbldpbGxBY3RpdmF0ZU1vZGUoZm4pXG4gIG9uRGlkQWN0aXZhdGVNb2RlOiAoZm4pIC0+IEBzdWJzY3JpYmUgQG1vZGVNYW5hZ2VyLm9uRGlkQWN0aXZhdGVNb2RlKGZuKVxuICBvbldpbGxEZWFjdGl2YXRlTW9kZTogKGZuKSAtPiBAc3Vic2NyaWJlIEBtb2RlTWFuYWdlci5vbldpbGxEZWFjdGl2YXRlTW9kZShmbilcbiAgcHJlZW1wdFdpbGxEZWFjdGl2YXRlTW9kZTogKGZuKSAtPiBAc3Vic2NyaWJlIEBtb2RlTWFuYWdlci5wcmVlbXB0V2lsbERlYWN0aXZhdGVNb2RlKGZuKVxuICBvbkRpZERlYWN0aXZhdGVNb2RlOiAoZm4pIC0+IEBzdWJzY3JpYmUgQG1vZGVNYW5hZ2VyLm9uRGlkRGVhY3RpdmF0ZU1vZGUoZm4pXG5cbiAgIyBFdmVudHNcbiAgIyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIG9uRGlkRmFpbFRvUHVzaFRvT3BlcmF0aW9uU3RhY2s6IChmbikgLT4gQGVtaXR0ZXIub24oJ2RpZC1mYWlsLXRvLXB1c2gtdG8tb3BlcmF0aW9uLXN0YWNrJywgZm4pXG4gIGVtaXREaWRGYWlsVG9QdXNoVG9PcGVyYXRpb25TdGFjazogLT4gQGVtaXR0ZXIuZW1pdCgnZGlkLWZhaWwtdG8tcHVzaC10by1vcGVyYXRpb24tc3RhY2snKVxuXG4gIG9uRGlkRGVzdHJveTogKGZuKSAtPiBAZW1pdHRlci5vbignZGlkLWRlc3Ryb3knLCBmbilcblxuICAjICogYGZuYCB7RnVuY3Rpb259IHRvIGJlIGNhbGxlZCB3aGVuIG1hcmsgd2FzIHNldC5cbiAgIyAgICogYG5hbWVgIE5hbWUgb2YgbWFyayBzdWNoIGFzICdhJy5cbiAgIyAgICogYGJ1ZmZlclBvc2l0aW9uYDogYnVmZmVyUG9zaXRpb24gd2hlcmUgbWFyayB3YXMgc2V0LlxuICAjICAgKiBgZWRpdG9yYDogZWRpdG9yIHdoZXJlIG1hcmsgd2FzIHNldC5cbiAgIyBSZXR1cm5zIGEge0Rpc3Bvc2FibGV9IG9uIHdoaWNoIGAuZGlzcG9zZSgpYCBjYW4gYmUgY2FsbGVkIHRvIHVuc3Vic2NyaWJlLlxuICAjXG4gICMgIFVzYWdlOlxuICAjICAgb25EaWRTZXRNYXJrICh7bmFtZSwgYnVmZmVyUG9zaXRpb259KSAtPiBkbyBzb21ldGhpbmcuLlxuICBvbkRpZFNldE1hcms6IChmbikgLT4gQGVtaXR0ZXIub24oJ2RpZC1zZXQtbWFyaycsIGZuKVxuXG4gIG9uRGlkU2V0SW5wdXRDaGFyOiAoZm4pIC0+IEBlbWl0dGVyLm9uKCdkaWQtc2V0LWlucHV0LWNoYXInLCBmbilcbiAgZW1pdERpZFNldElucHV0Q2hhcjogKGNoYXIpIC0+IEBlbWl0dGVyLmVtaXQoJ2RpZC1zZXQtaW5wdXQtY2hhcicsIGNoYXIpXG5cbiAgaXNBbGl2ZTogLT5cbiAgICBAY29uc3RydWN0b3IudmltU3RhdGVzQnlFZGl0b3IuaGFzKEBlZGl0b3IpXG5cbiAgZGVzdHJveTogLT5cbiAgICByZXR1cm4gdW5sZXNzIEBpc0FsaXZlKClcbiAgICBAY29uc3RydWN0b3IudmltU3RhdGVzQnlFZGl0b3IuZGVsZXRlKEBlZGl0b3IpXG5cbiAgICBAc3Vic2NyaXB0aW9ucy5kaXNwb3NlKClcblxuICAgIGlmIEBlZGl0b3IuaXNBbGl2ZSgpXG4gICAgICBAcmVzZXROb3JtYWxNb2RlKClcbiAgICAgIEByZXNldCgpXG4gICAgICBAZWRpdG9yRWxlbWVudC5jb21wb25lbnQ/LnNldElucHV0RW5hYmxlZCh0cnVlKVxuICAgICAgQGVkaXRvckVsZW1lbnQuY2xhc3NMaXN0LnJlbW92ZShwYWNrYWdlU2NvcGUsICdub3JtYWwtbW9kZScpXG5cbiAgICBAaG92ZXI/LmRlc3Ryb3k/KClcbiAgICBAaG92ZXJTZWFyY2hDb3VudGVyPy5kZXN0cm95PygpXG4gICAgQHNlYXJjaEhpc3Rvcnk/LmRlc3Ryb3k/KClcbiAgICBAY3Vyc29yU3R5bGVNYW5hZ2VyPy5kZXN0cm95PygpXG4gICAgQHNlYXJjaD8uZGVzdHJveT8oKVxuICAgIEByZWdpc3Rlcj8uZGVzdHJveT9cbiAgICB7XG4gICAgICBAaG92ZXIsIEBob3ZlclNlYXJjaENvdW50ZXIsIEBvcGVyYXRpb25TdGFjayxcbiAgICAgIEBzZWFyY2hIaXN0b3J5LCBAY3Vyc29yU3R5bGVNYW5hZ2VyXG4gICAgICBAc2VhcmNoLCBAbW9kZU1hbmFnZXIsIEByZWdpc3RlclxuICAgICAgQGVkaXRvciwgQGVkaXRvckVsZW1lbnQsIEBzdWJzY3JpcHRpb25zLFxuICAgICAgQG9jY3VycmVuY2VNYW5hZ2VyXG4gICAgICBAcHJldmlvdXNTZWxlY3Rpb25cbiAgICAgIEBwZXJzaXN0ZW50U2VsZWN0aW9uXG4gICAgfSA9IHt9XG4gICAgQGVtaXR0ZXIuZW1pdCAnZGlkLWRlc3Ryb3knXG5cbiAgaXNJbnRlcmVzdGluZ0V2ZW50OiAoe3RhcmdldCwgdHlwZX0pIC0+XG4gICAgaWYgQG1vZGUgaXMgJ2luc2VydCdcbiAgICAgIGZhbHNlXG4gICAgZWxzZVxuICAgICAgQGVkaXRvcj8gYW5kXG4gICAgICAgIHRhcmdldD8uY2xvc2VzdD8oJ2F0b20tdGV4dC1lZGl0b3InKSBpcyBAZWRpdG9yRWxlbWVudCBhbmRcbiAgICAgICAgbm90IEBpc01vZGUoJ3Zpc3VhbCcsICdibG9ja3dpc2UnKSBhbmRcbiAgICAgICAgbm90IHR5cGUuc3RhcnRzV2l0aCgndmltLW1vZGUtcGx1czonKVxuXG4gIGNoZWNrU2VsZWN0aW9uOiAoZXZlbnQpIC0+XG4gICAgcmV0dXJuIGlmIEBvcGVyYXRpb25TdGFjay5pc1Byb2Nlc3NpbmcoKVxuICAgIHJldHVybiB1bmxlc3MgQGlzSW50ZXJlc3RpbmdFdmVudChldmVudClcblxuICAgIG5vbkVtcHR5U2VsZWNpdG9ucyA9IEBlZGl0b3IuZ2V0U2VsZWN0aW9ucygpLmZpbHRlciAoc2VsZWN0aW9uKSAtPiBub3Qgc2VsZWN0aW9uLmlzRW1wdHkoKVxuICAgIGlmIG5vbkVtcHR5U2VsZWNpdG9ucy5sZW5ndGhcbiAgICAgIHN1Ym1vZGUgPSBzd3JhcC5kZXRlY3RWaXN1YWxNb2RlU3VibW9kZShAZWRpdG9yKVxuICAgICAgaWYgQGlzTW9kZSgndmlzdWFsJywgc3VibW9kZSlcbiAgICAgICAgZm9yIHNlbGVjdGlvbiBpbiBub25FbXB0eVNlbGVjaXRvbnMgd2hlbiBub3Qgc3dyYXAoc2VsZWN0aW9uKS5oYXNQcm9wZXJ0aWVzKClcbiAgICAgICAgICBzd3JhcChzZWxlY3Rpb24pLnNhdmVQcm9wZXJ0aWVzKClcbiAgICAgICAgQHVwZGF0ZUN1cnNvcnNWaXNpYmlsaXR5KClcbiAgICAgIGVsc2VcbiAgICAgICAgQGFjdGl2YXRlKCd2aXN1YWwnLCBzdWJtb2RlKVxuICAgIGVsc2VcbiAgICAgIEBhY3RpdmF0ZSgnbm9ybWFsJykgaWYgQGlzTW9kZSgndmlzdWFsJylcblxuICBzYXZlUHJvcGVydGllczogKGV2ZW50KSAtPlxuICAgIHJldHVybiB1bmxlc3MgQGlzSW50ZXJlc3RpbmdFdmVudChldmVudClcbiAgICBmb3Igc2VsZWN0aW9uIGluIEBlZGl0b3IuZ2V0U2VsZWN0aW9ucygpXG4gICAgICBzd3JhcChzZWxlY3Rpb24pLnNhdmVQcm9wZXJ0aWVzKClcblxuICBvYnNlcnZlU2VsZWN0aW9uczogLT5cbiAgICBjaGVja1NlbGVjdGlvbiA9IEBjaGVja1NlbGVjdGlvbi5iaW5kKHRoaXMpXG4gICAgQGVkaXRvckVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignbW91c2V1cCcsIGNoZWNrU2VsZWN0aW9uKVxuICAgIEBzdWJzY3JpcHRpb25zLmFkZCBuZXcgRGlzcG9zYWJsZSA9PlxuICAgICAgQGVkaXRvckVsZW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcignbW91c2V1cCcsIGNoZWNrU2VsZWN0aW9uKVxuXG4gICAgIyBbRklYTUVdXG4gICAgIyBIb3ZlciBwb3NpdGlvbiBnZXQgd2lyZWQgd2hlbiBmb2N1cy1jaGFuZ2UgYmV0d2VlbiBtb3JlIHRoYW4gdHdvIHBhbmUuXG4gICAgIyBjb21tZW50aW5nIG91dCBpcyBmYXIgYmV0dGVyIHRoYW4gaW50cm9kdWNpbmcgQnVnZ3kgYmVoYXZpb3IuXG4gICAgIyBAc3Vic2NyaXB0aW9ucy5hZGQgYXRvbS5jb21tYW5kcy5vbldpbGxEaXNwYXRjaChzYXZlUHJvcGVydGllcylcbiAgICBAc3Vic2NyaXB0aW9ucy5hZGQgYXRvbS5jb21tYW5kcy5vbkRpZERpc3BhdGNoKGNoZWNrU2VsZWN0aW9uKVxuXG4gICMgV2hhdCdzIHRoaXM/XG4gICMgZWRpdG9yLmNsZWFyU2VsZWN0aW9ucygpIGRvZXNuJ3QgcmVzcGVjdCBsYXN0Q3Vyc29yIHBvc2l0b2luLlxuICAjIFRoaXMgbWV0aG9kIHdvcmtzIGluIHNhbWUgd2F5IGFzIGVkaXRvci5jbGVhclNlbGVjdGlvbnMoKSBidXQgcmVzcGVjdCBsYXN0IGN1cnNvciBwb3NpdGlvbi5cbiAgY2xlYXJTZWxlY3Rpb25zOiAtPlxuICAgIEBlZGl0b3Iuc2V0Q3Vyc29yQnVmZmVyUG9zaXRpb24oQGVkaXRvci5nZXRDdXJzb3JCdWZmZXJQb3NpdGlvbigpKVxuXG4gIHJlc2V0Tm9ybWFsTW9kZTogKHt1c2VySW52b2NhdGlvbn09e30pIC0+XG4gICAgaWYgdXNlckludm9jYXRpb24gPyBmYWxzZVxuICAgICAgaWYgQGVkaXRvci5oYXNNdWx0aXBsZUN1cnNvcnMoKVxuICAgICAgICBAY2xlYXJTZWxlY3Rpb25zKClcblxuICAgICAgZWxzZSBpZiBAaGFzUGVyc2lzdGVudFNlbGVjdGlvbnMoKSBhbmQgc2V0dGluZ3MuZ2V0KCdjbGVhclBlcnNpc3RlbnRTZWxlY3Rpb25PblJlc2V0Tm9ybWFsTW9kZScpXG4gICAgICAgIEBjbGVhclBlcnNpc3RlbnRTZWxlY3Rpb25zKClcbiAgICAgIGVsc2UgaWYgQG9jY3VycmVuY2VNYW5hZ2VyLmhhc1BhdHRlcm5zKClcbiAgICAgICAgQG9jY3VycmVuY2VNYW5hZ2VyLnJlc2V0UGF0dGVybnMoKVxuXG4gICAgICBpZiBzZXR0aW5ncy5nZXQoJ2NsZWFySGlnaGxpZ2h0U2VhcmNoT25SZXNldE5vcm1hbE1vZGUnKVxuICAgICAgICBAZ2xvYmFsU3RhdGUuc2V0KCdoaWdobGlnaHRTZWFyY2hQYXR0ZXJuJywgbnVsbClcbiAgICBlbHNlXG4gICAgICBAY2xlYXJTZWxlY3Rpb25zKClcbiAgICBAYWN0aXZhdGUoJ25vcm1hbCcpXG5cbiAgaW5pdDogLT5cbiAgICBAc2F2ZU9yaWdpbmFsQ3Vyc29yUG9zaXRpb24oKVxuXG4gIHJlc2V0OiAtPlxuICAgIEByZWdpc3Rlci5yZXNldCgpXG4gICAgQHNlYXJjaEhpc3RvcnkucmVzZXQoKVxuICAgIEBob3Zlci5yZXNldCgpXG4gICAgQG9wZXJhdGlvblN0YWNrLnJlc2V0KClcbiAgICBAbXV0YXRpb25NYW5hZ2VyLnJlc2V0KClcblxuICBpc1Zpc2libGU6IC0+XG4gICAgQGVkaXRvciBpbiBnZXRWaXNpYmxlRWRpdG9ycygpXG5cbiAgdXBkYXRlQ3Vyc29yc1Zpc2liaWxpdHk6IC0+XG4gICAgQGN1cnNvclN0eWxlTWFuYWdlci5yZWZyZXNoKClcblxuICB1cGRhdGVQcmV2aW91c1NlbGVjdGlvbjogLT4gIyBGSVhNRTogbmFtaW5nLCB1cGRhdGVMYXN0U2VsZWN0ZWRJbmZvID9cbiAgICBpZiBAaXNNb2RlKCd2aXN1YWwnLCAnYmxvY2t3aXNlJylcbiAgICAgIHByb3BlcnRpZXMgPSBAZ2V0TGFzdEJsb2Nrd2lzZVNlbGVjdGlvbigpPy5nZXRDaGFyYWN0ZXJ3aXNlUHJvcGVydGllcygpXG4gICAgZWxzZVxuICAgICAgcHJvcGVydGllcyA9IHN3cmFwKEBlZGl0b3IuZ2V0TGFzdFNlbGVjdGlvbigpKS5jYXB0dXJlUHJvcGVydGllcygpXG5cbiAgICByZXR1cm4gdW5sZXNzIHByb3BlcnRpZXM/XG5cbiAgICB7aGVhZCwgdGFpbH0gPSBwcm9wZXJ0aWVzXG4gICAgaWYgaGVhZC5pc0dyZWF0ZXJUaGFuKHRhaWwpXG4gICAgICBAbWFyay5zZXRSYW5nZSgnPCcsICc+JywgW3RhaWwsIGhlYWRdKVxuICAgIGVsc2VcbiAgICAgIEBtYXJrLnNldFJhbmdlKCc8JywgJz4nLCBbaGVhZCwgdGFpbF0pXG4gICAgQHByZXZpb3VzU2VsZWN0aW9uID0ge3Byb3BlcnRpZXMsIEBzdWJtb2RlfVxuXG4gICMgUGVyc2lzdGVudCBzZWxlY3Rpb25cbiAgIyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIGhhc1BlcnNpc3RlbnRTZWxlY3Rpb25zOiAtPlxuICAgIEBwZXJzaXN0ZW50U2VsZWN0aW9uLmhhc01hcmtlcnMoKVxuXG4gIGdldFBlcnNpc3RlbnRTZWxlY3Rpb25CdWZmZXJSYW5nZXM6IC0+XG4gICAgQHBlcnNpc3RlbnRTZWxlY3Rpb24uZ2V0TWFya2VyQnVmZmVyUmFuZ2VzKClcblxuICBjbGVhclBlcnNpc3RlbnRTZWxlY3Rpb25zOiAtPlxuICAgIEBwZXJzaXN0ZW50U2VsZWN0aW9uLmNsZWFyTWFya2VycygpXG5cbiAgIyBBbmltYXRpb24gbWFuYWdlbWVudFxuICAjIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgc2Nyb2xsQW5pbWF0aW9uRWZmZWN0OiBudWxsXG4gIHJlcXVlc3RTY3JvbGxBbmltYXRpb246IChmcm9tLCB0bywgb3B0aW9ucykgLT5cbiAgICBAc2Nyb2xsQW5pbWF0aW9uRWZmZWN0ID0galF1ZXJ5KGZyb20pLmFuaW1hdGUodG8sIG9wdGlvbnMpXG5cbiAgZmluaXNoU2Nyb2xsQW5pbWF0aW9uOiAtPlxuICAgIEBzY3JvbGxBbmltYXRpb25FZmZlY3Q/LmZpbmlzaCgpXG4gICAgQHNjcm9sbEFuaW1hdGlvbkVmZmVjdCA9IG51bGxcblxuICAjIE90aGVyXG4gICMgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBzYXZlT3JpZ2luYWxDdXJzb3JQb3NpdGlvbjogLT5cbiAgICBAb3JpZ2luYWxDdXJzb3JQb3NpdGlvbiA9IG51bGxcbiAgICBAb3JpZ2luYWxDdXJzb3JQb3NpdGlvbkJ5TWFya2VyPy5kZXN0cm95KClcblxuICAgIGlmIEBtb2RlIGlzICd2aXN1YWwnXG4gICAgICBvcHRpb25zID0ge2Zyb21Qcm9wZXJ0eTogdHJ1ZSwgYWxsb3dGYWxsYmFjazogdHJ1ZX1cbiAgICAgIHBvaW50ID0gc3dyYXAoQGVkaXRvci5nZXRMYXN0U2VsZWN0aW9uKCkpLmdldEJ1ZmZlclBvc2l0aW9uRm9yKCdoZWFkJywgb3B0aW9ucylcbiAgICBlbHNlXG4gICAgICBwb2ludCA9IEBlZGl0b3IuZ2V0Q3Vyc29yQnVmZmVyUG9zaXRpb24oKVxuICAgIEBvcmlnaW5hbEN1cnNvclBvc2l0aW9uID0gcG9pbnRcbiAgICBAb3JpZ2luYWxDdXJzb3JQb3NpdGlvbkJ5TWFya2VyID0gQGVkaXRvci5tYXJrQnVmZmVyUG9zaXRpb24ocG9pbnQsIGludmFsaWRhdGU6ICduZXZlcicpXG5cbiAgcmVzdG9yZU9yaWdpbmFsQ3Vyc29yUG9zaXRpb246IC0+XG4gICAgQGVkaXRvci5zZXRDdXJzb3JCdWZmZXJQb3NpdGlvbihAZ2V0T3JpZ2luYWxDdXJzb3JQb3NpdGlvbigpKVxuXG4gIGdldE9yaWdpbmFsQ3Vyc29yUG9zaXRpb246IC0+XG4gICAgQG9yaWdpbmFsQ3Vyc29yUG9zaXRpb25cblxuICBnZXRPcmlnaW5hbEN1cnNvclBvc2l0aW9uQnlNYXJrZXI6IC0+XG4gICAgQG9yaWdpbmFsQ3Vyc29yUG9zaXRpb25CeU1hcmtlci5nZXRTdGFydEJ1ZmZlclBvc2l0aW9uKClcbiJdfQ==
