(function() {
  var Base, CompositeDisposable, Disposable, MoveToRelativeLine, OperationAbortedError, OperationStack, Select, moveCursorLeft, ref, ref1, settings, swrap;

  ref = require('atom'), Disposable = ref.Disposable, CompositeDisposable = ref.CompositeDisposable;

  Base = require('./base');

  moveCursorLeft = require('./utils').moveCursorLeft;

  settings = require('./settings');

  ref1 = {}, Select = ref1.Select, MoveToRelativeLine = ref1.MoveToRelativeLine;

  OperationAbortedError = require('./errors').OperationAbortedError;

  swrap = require('./selection-wrapper');

  OperationStack = (function() {
    Object.defineProperty(OperationStack.prototype, 'mode', {
      get: function() {
        return this.modeManager.mode;
      }
    });

    Object.defineProperty(OperationStack.prototype, 'submode', {
      get: function() {
        return this.modeManager.submode;
      }
    });

    function OperationStack(vimState) {
      var ref2;
      this.vimState = vimState;
      ref2 = this.vimState, this.editor = ref2.editor, this.editorElement = ref2.editorElement, this.modeManager = ref2.modeManager;
      this.subscriptions = new CompositeDisposable;
      this.subscriptions.add(this.vimState.onDidDestroy(this.destroy.bind(this)));
      if (Select == null) {
        Select = Base.getClass('Select');
      }
      if (MoveToRelativeLine == null) {
        MoveToRelativeLine = Base.getClass('MoveToRelativeLine');
      }
      this.reset();
    }

    OperationStack.prototype.subscribe = function(handler) {
      this.operationSubscriptions.add(handler);
      return handler;
    };

    OperationStack.prototype.reset = function() {
      var ref2;
      this.resetCount();
      this.stack = [];
      this.processing = false;
      this.vimState.emitDidResetOperationStack();
      if ((ref2 = this.operationSubscriptions) != null) {
        ref2.dispose();
      }
      return this.operationSubscriptions = new CompositeDisposable;
    };

    OperationStack.prototype.destroy = function() {
      var ref2, ref3;
      this.subscriptions.dispose();
      if ((ref2 = this.operationSubscriptions) != null) {
        ref2.dispose();
      }
      return ref3 = {}, this.stack = ref3.stack, this.operationSubscriptions = ref3.operationSubscriptions, ref3;
    };

    OperationStack.prototype.peekTop = function() {
      return this.stack[this.stack.length - 1];
    };

    OperationStack.prototype.isEmpty = function() {
      return this.stack.length === 0;
    };

    OperationStack.prototype.run = function(klass, properties) {
      var error, operation, ref2, type;
      try {
        if (this.isEmpty()) {
          this.vimState.init();
        }
        type = typeof klass;
        if (type === 'object') {
          operation = klass;
        } else {
          if (type === 'string') {
            klass = Base.getClass(klass);
          }
          if (((ref2 = this.peekTop()) != null ? ref2.constructor : void 0) === klass) {
            operation = new MoveToRelativeLine(this.vimState);
          } else {
            operation = new klass(this.vimState, properties);
          }
        }
        if (operation.isTextObject() && this.mode !== 'operator-pending' || operation.isMotion() && this.mode === 'visual') {
          operation = new Select(this.vimState).setTarget(operation);
        }
        if (this.isEmpty() || (this.peekTop().isOperator() && operation.isTarget())) {
          this.stack.push(operation);
          return this.process();
        } else {
          this.vimState.emitDidFailToPushToOperationStack();
          return this.vimState.resetNormalMode();
        }
      } catch (error1) {
        error = error1;
        return this.handleError(error);
      }
    };

    OperationStack.prototype.runRecorded = function() {
      var count, operation, ref2;
      if (operation = this.recordedOperation) {
        operation.setRepeated();
        if (this.hasCount()) {
          count = this.getCount();
          operation.count = count;
          if ((ref2 = operation.target) != null) {
            ref2.count = count;
          }
        }
        operation.subscribeResetOccurrencePatternIfNeeded();
        return this.run(operation);
      }
    };

    OperationStack.prototype.runRecordedMotion = function(key, arg) {
      var operation, reverse;
      reverse = (arg != null ? arg : {}).reverse;
      if (!(operation = this.vimState.globalState.get(key))) {
        return;
      }
      operation = operation.clone(this.vimState);
      operation.setRepeated();
      operation.resetCount();
      if (reverse) {
        operation.backwards = !operation.backwards;
      }
      return this.run(operation);
    };

    OperationStack.prototype.runCurrentFind = function(options) {
      return this.runRecordedMotion('currentFind', options);
    };

    OperationStack.prototype.runCurrentSearch = function(options) {
      return this.runRecordedMotion('currentSearch', options);
    };

    OperationStack.prototype.handleError = function(error) {
      this.vimState.reset();
      if (!(error instanceof OperationAbortedError)) {
        throw error;
      }
    };

    OperationStack.prototype.isProcessing = function() {
      return this.processing;
    };

    OperationStack.prototype.process = function() {
      var base, commandName, operation, top;
      this.processing = true;
      if (this.stack.length === 2) {
        if (!this.peekTop().isComplete()) {
          return;
        }
        operation = this.stack.pop();
        this.peekTop().setTarget(operation);
      }
      top = this.peekTop();
      if (top.isComplete()) {
        return this.execute(this.stack.pop());
      } else {
        if (this.mode === 'normal' && top.isOperator()) {
          this.modeManager.activate('operator-pending');
        }
        if (commandName = typeof (base = top.constructor).getCommandNameWithoutPrefix === "function" ? base.getCommandNameWithoutPrefix() : void 0) {
          return this.addToClassList(commandName + "-pending");
        }
      }
    };

    OperationStack.prototype.execute = function(operation) {
      var execution;
      if (this.mode === 'visual') {
        this.vimState.updatePreviousSelection();
      }
      execution = operation.execute();
      if (execution instanceof Promise) {
        return execution.then((function(_this) {
          return function() {
            return _this.finish(operation);
          };
        })(this))["catch"]((function(_this) {
          return function() {
            return _this.handleError();
          };
        })(this));
      } else {
        return this.finish(operation);
      }
    };

    OperationStack.prototype.cancel = function() {
      var ref2;
      if ((ref2 = this.mode) !== 'visual' && ref2 !== 'insert') {
        this.vimState.resetNormalMode();
        this.vimState.restoreOriginalCursorPosition();
      }
      return this.finish();
    };

    OperationStack.prototype.finish = function(operation) {
      if (operation == null) {
        operation = null;
      }
      if (operation != null ? operation.isRecordable() : void 0) {
        this.recordedOperation = operation;
      }
      this.vimState.emitDidFinishOperation();
      if (operation != null ? operation.isOperator() : void 0) {
        operation.resetState();
      }
      if (this.mode === 'normal') {
        swrap.clearProperties(this.editor);
        this.ensureAllSelectionsAreEmpty(operation);
        this.ensureAllCursorsAreNotAtEndOfLine();
      } else if (this.mode === 'visual') {
        this.modeManager.updateNarrowedState();
        this.vimState.updatePreviousSelection();
      }
      this.vimState.updateCursorsVisibility();
      return this.vimState.reset();
    };

    OperationStack.prototype.ensureAllSelectionsAreEmpty = function(operation) {
      this.vimState.clearBlockwiseSelections();
      if (!this.editor.getLastSelection().isEmpty()) {
        if (settings.get('throwErrorOnNonEmptySelectionInNormalMode')) {
          throw new Error("Selection is not empty in normal-mode: " + (operation.toString()));
        } else {
          return this.vimState.clearSelections();
        }
      }
    };

    OperationStack.prototype.ensureAllCursorsAreNotAtEndOfLine = function() {
      var cursor, i, len, ref2, results;
      ref2 = this.editor.getCursors();
      results = [];
      for (i = 0, len = ref2.length; i < len; i++) {
        cursor = ref2[i];
        if (cursor.isAtEndOfLine()) {
          results.push(moveCursorLeft(cursor, {
            preserveGoalColumn: true
          }));
        }
      }
      return results;
    };

    OperationStack.prototype.addToClassList = function(className) {
      this.editorElement.classList.add(className);
      return this.subscribe(new Disposable((function(_this) {
        return function() {
          return _this.editorElement.classList.remove(className);
        };
      })(this)));
    };

    OperationStack.prototype.hasCount = function() {
      return (this.count['normal'] != null) || (this.count['operator-pending'] != null);
    };

    OperationStack.prototype.getCount = function() {
      var ref2, ref3;
      if (this.hasCount()) {
        return ((ref2 = this.count['normal']) != null ? ref2 : 1) * ((ref3 = this.count['operator-pending']) != null ? ref3 : 1);
      } else {
        return null;
      }
    };

    OperationStack.prototype.setCount = function(number) {
      var base, mode;
      mode = 'normal';
      if (this.mode === 'operator-pending') {
        mode = this.mode;
      }
      if ((base = this.count)[mode] == null) {
        base[mode] = 0;
      }
      this.count[mode] = (this.count[mode] * 10) + number;
      this.vimState.hover.set(this.buildCountString());
      return this.vimState.toggleClassList('with-count', true);
    };

    OperationStack.prototype.buildCountString = function() {
      return [this.count['normal'], this.count['operator-pending']].filter(function(count) {
        return count != null;
      }).map(function(count) {
        return String(count);
      }).join('x');
    };

    OperationStack.prototype.resetCount = function() {
      this.count = {};
      return this.vimState.toggleClassList('with-count', false);
    };

    return OperationStack;

  })();

  module.exports = OperationStack;

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL2hvbWUvamFrZS8uYXRvbS9wYWNrYWdlcy92aW0tbW9kZS1wbHVzL2xpYi9vcGVyYXRpb24tc3RhY2suY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FBQUEsTUFBQTs7RUFBQSxNQUFvQyxPQUFBLENBQVEsTUFBUixDQUFwQyxFQUFDLDJCQUFELEVBQWE7O0VBQ2IsSUFBQSxHQUFPLE9BQUEsQ0FBUSxRQUFSOztFQUNOLGlCQUFrQixPQUFBLENBQVEsU0FBUjs7RUFDbkIsUUFBQSxHQUFXLE9BQUEsQ0FBUSxZQUFSOztFQUNYLE9BQStCLEVBQS9CLEVBQUMsb0JBQUQsRUFBUzs7RUFDUix3QkFBeUIsT0FBQSxDQUFRLFVBQVI7O0VBQzFCLEtBQUEsR0FBUSxPQUFBLENBQVEscUJBQVI7O0VBWUY7SUFDSixNQUFNLENBQUMsY0FBUCxDQUFzQixjQUFDLENBQUEsU0FBdkIsRUFBa0MsTUFBbEMsRUFBMEM7TUFBQSxHQUFBLEVBQUssU0FBQTtlQUFHLElBQUMsQ0FBQSxXQUFXLENBQUM7TUFBaEIsQ0FBTDtLQUExQzs7SUFDQSxNQUFNLENBQUMsY0FBUCxDQUFzQixjQUFDLENBQUEsU0FBdkIsRUFBa0MsU0FBbEMsRUFBNkM7TUFBQSxHQUFBLEVBQUssU0FBQTtlQUFHLElBQUMsQ0FBQSxXQUFXLENBQUM7TUFBaEIsQ0FBTDtLQUE3Qzs7SUFFYSx3QkFBQyxRQUFEO0FBQ1gsVUFBQTtNQURZLElBQUMsQ0FBQSxXQUFEO01BQ1osT0FBMEMsSUFBQyxDQUFBLFFBQTNDLEVBQUMsSUFBQyxDQUFBLGNBQUEsTUFBRixFQUFVLElBQUMsQ0FBQSxxQkFBQSxhQUFYLEVBQTBCLElBQUMsQ0FBQSxtQkFBQTtNQUUzQixJQUFDLENBQUEsYUFBRCxHQUFpQixJQUFJO01BQ3JCLElBQUMsQ0FBQSxhQUFhLENBQUMsR0FBZixDQUFtQixJQUFDLENBQUEsUUFBUSxDQUFDLFlBQVYsQ0FBdUIsSUFBQyxDQUFB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b21wb3NpdGVEaXNwb3NhYmxlfSA9IHJlcXVpcmUgJ2F0b20nXG5CYXNlID0gcmVxdWlyZSAnLi9iYXNlJ1xue21vdmVDdXJzb3JMZWZ0fSA9IHJlcXVpcmUgJy4vdXRpbHMnXG5zZXR0aW5ncyA9IHJlcXVpcmUgJy4vc2V0dGluZ3MnXG57U2VsZWN0LCBNb3ZlVG9SZWxhdGl2ZUxpbmV9ID0ge31cbntPcGVyYXRpb25BYm9ydGVkRXJyb3J9ID0gcmVxdWlyZSAnLi9lcnJvcnMnXG5zd3JhcCA9IHJlcXVpcmUgJy4vc2VsZWN0aW9uLXdyYXBwZXInXG5cbiMgb3ByYXRpb24gbGlmZSBpbiBvcGVyYXRpb25TdGFja1xuIyAxLiBydW5cbiMgICAgaW5zdGFudGlhdGVkIGJ5IG5ldy5cbiMgICAgY29tcGxpbWVudCBpbXBsaWNpdCBPcGVyYXRvci5TZWxlY3Qgb3BlcmF0b3IgaWYgbmVjZXNzYXJ5LlxuIyAgICBwdXNoIG9wZXJhdGlvbiB0byBzdGFjay5cbiMgMi4gcHJvY2Vzc1xuIyAgICByZWR1Y2Ugc3RhY2sgYnksIHBvcHBpbmcgdG9wIG9mIHN0YWNrIHRoZW4gc2V0IGl0IGFzIHRhcmdldCBvZiBuZXcgdG9wLlxuIyAgICBjaGVjayBpZiByZW1haW5pbmcgdG9wIG9mIHN0YWNrIGlzIGV4ZWN1dGFibGUgYnkgY2FsbGluZyBpc0NvbXBsZXRlKClcbiMgICAgaWYgZXhlY3V0YWJsZSwgdGhlbiBwb3Agc3RhY2sgdGhlbiBleGVjdXRlKHBvcHBlZE9wZXJhdGlvbilcbiMgICAgaWYgbm90IGV4ZWN1dGFibGUsIGVudGVyIFwib3BlcmF0b3ItcGVuZGluZy1tb2RlXCJcbmNsYXNzIE9wZXJhdGlvblN0YWNrXG4gIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSBAcHJvdG90eXBlLCAnbW9kZScsIGdldDogLT4gQG1vZGVNYW5hZ2VyLm1vZGVcbiAgT2JqZWN0LmRlZmluZVByb3BlcnR5IEBwcm90b3R5cGUsICdzdWJtb2RlJywgZ2V0OiAtPiBAbW9kZU1hbmFnZXIuc3VibW9kZVxuXG4gIGNvbnN0cnVjdG9yOiAoQHZpbVN0YXRlKSAtPlxuICAgIHtAZWRpdG9yLCBAZWRpdG9yRWxlbWVudCwgQG1vZGVNYW5hZ2VyfSA9IEB2aW1TdGF0ZVxuXG4gICAgQHN1YnNjcmlwdGlvbnMgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZVxuICAgIEBzdWJzY3JpcHRpb25zLmFkZCBAdmltU3RhdGUub25EaWREZXN0cm95KEBkZXN0cm95LmJpbmQodGhpcykpXG5cbiAgICBTZWxlY3QgPz0gQmFzZS5nZXRDbGFzcygnU2VsZWN0JylcbiAgICBNb3ZlVG9SZWxhdGl2ZUxpbmUgPz0gQmFzZS5nZXRDbGFzcygnTW92ZVRvUmVsYXRpdmVMaW5lJylcblxuICAgIEByZXNldCgpXG5cbiAgIyBSZXR1cm4gaGFuZGxlclxuICBzdWJzY3JpYmU6IChoYW5kbGVyKSAtPlxuICAgIEBvcGVyYXRpb25TdWJzY3JpcHRpb25zLmFkZChoYW5kbGVyKVxuICAgIGhhbmRsZXIgIyBET05UIFJFTU9WRVxuXG4gIHJlc2V0OiAtPlxuICAgIEByZXNldENvdW50KClcbiAgICBAc3RhY2sgPSBbXVxuICAgIEBwcm9jZXNzaW5nID0gZmFsc2VcblxuICAgICMgdGhpcyBoYXMgdG8gYmUgQkVGT1JFIEBvcGVyYXRpb25TdWJzY3JpcHRpb25zLmRpc3Bvc2UoKVxuICAgIEB2aW1TdGF0ZS5lbWl0RGlkUmVzZXRPcGVyYXRpb25TdGFjaygpXG5cbiAgICBAb3BlcmF0aW9uU3Vic2NyaXB0aW9ucz8uZGlzcG9zZSgpXG4gICAgQG9wZXJhdGlvblN1YnNjcmlwdGlvbnMgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZVxuXG4gIGRlc3Ryb3k6IC0+XG4gICAgQHN1YnNjcmlwdGlvbnMuZGlzcG9zZSgpXG4gICAgQG9wZXJhdGlvblN1YnNjcmlwdGlvbnM/LmRpc3Bvc2UoKVxuICAgIHtAc3RhY2ssIEBvcGVyYXRpb25TdWJzY3JpcHRpb25zfSA9IHt9XG5cbiAgcGVla1RvcDogLT5cbiAgICBAc3RhY2tbQHN0YWNrLmxlbmd0aCAtIDFdXG5cbiAgaXNFbXB0eTogLT5cbiAgICBAc3RhY2subGVuZ3RoIGlzIDBcblxuICAjIE1haW5cbiAgIyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIHJ1bjogKGtsYXNzLCBwcm9wZXJ0aWVzKSAtPlxuICAgIHRyeVxuICAgICAgQHZpbVN0YXRlLmluaXQoKSBpZiBAaXNFbXB0eSgpXG4gICAgICB0eXBlID0gdHlwZW9mKGtsYXNzKVxuICAgICAgaWYgdHlwZSBpcyAnb2JqZWN0JyAjIC4gcmVwZWF0IGNhc2Ugd2UgY2FuIGV4ZWN1dGUgYXMtaXQtaXMuXG4gICAgICAgIG9wZXJhdGlvbiA9IGtsYXNzXG4gICAgICBlbHNlXG4gICAgICAgIGtsYXNzID0gQmFzZS5nZXRDbGFzcyhrbGFzcykgaWYgdHlwZSBpcyAnc3RyaW5nJ1xuICAgICAgICAjIFJlcGxhY2Ugb3BlcmF0b3Igd2hlbiBpZGVudGljYWwgb25lIHJlcGVhdGVkLCBlLmcuIGBkZGAsIGBjY2AsIGBnVWdVYFxuICAgICAgICBpZiBAcGVla1RvcCgpPy5jb25zdHJ1Y3RvciBpcyBrbGFzc1xuICAgICAgICAgIG9wZXJhdGlvbiA9IG5ldyBNb3ZlVG9SZWxhdGl2ZUxpbmUoQHZpbVN0YXRlKVxuICAgICAgICBlbHNlXG4gICAgICAgICAgb3BlcmF0aW9uID0gbmV3IGtsYXNzKEB2aW1TdGF0ZSwgcHJvcGVydGllcylcblxuICAgICAgIyBDb21wbGltZW50IGltcGxpY2l0IFNlbGVjdCBvcGVyYXRvclxuICAgICAgaWYgb3BlcmF0aW9uLmlzVGV4dE9iamVjdCgpIGFuZCBAbW9kZSBpc250ICdvcGVyYXRvci1wZW5kaW5nJyBvciBvcGVyYXRpb24uaXNNb3Rpb24oKSBhbmQgQG1vZGUgaXMgJ3Zpc3VhbCdcbiAgICAgICAgb3BlcmF0aW9uID0gbmV3IFNlbGVjdChAdmltU3RhdGUpLnNldFRhcmdldChvcGVyYXRpb24pXG5cbiAgICAgIGlmIEBpc0VtcHR5KCkgb3IgKEBwZWVrVG9wKCkuaXNPcGVyYXRvcigpIGFuZCBvcGVyYXRpb24uaXNUYXJnZXQoKSlcbiAgICAgICAgQHN0YWNrLnB1c2gob3BlcmF0aW9uKVxuICAgICAgICBAcHJvY2VzcygpXG4gICAgICBlbHNlXG4gICAgICAgIEB2aW1TdGF0ZS5lbWl0RGlkRmFpbFRvUHVzaFRvT3BlcmF0aW9uU3RhY2soKVxuICAgICAgICBAdmltU3RhdGUucmVzZXROb3JtYWxNb2RlKClcbiAgICBjYXRjaCBlcnJvclxuICAgICAgQGhhbmRsZUVycm9yKGVycm9yKVxuXG4gIHJ1blJlY29yZGVkOiAtPlxuICAgIGlmIG9wZXJhdGlvbiA9IEByZWNvcmRlZE9wZXJhdGlvblxuICAgICAgb3BlcmF0aW9uLnNldFJlcGVhdGVkKClcbiAgICAgIGlmIEBoYXNDb3VudCgpXG4gICAgICAgIGNvdW50ID0gQGdldENvdW50KClcbiAgICAgICAgb3BlcmF0aW9uLmNvdW50ID0gY291bnRcbiAgICAgICAgb3BlcmF0aW9uLnRhcmdldD8uY291bnQgPSBjb3VudCAjIFNvbWUgb3BlYXJ0b3IgaGF2ZSBubyB0YXJnZXQgbGlrZSBjdHJsLWEoaW5jcmVhc2UpLlxuXG4gICAgICBvcGVyYXRpb24uc3Vic2NyaWJlUmVzZXRPY2N1cnJlbmNlUGF0dGVybklmTmVlZGVkKClcbiAgICAgIEBydW4ob3BlcmF0aW9uKVxuXG4gIHJ1blJlY29yZGVkTW90aW9uOiAoa2V5LCB7cmV2ZXJzZX09e30pIC0+XG4gICAgcmV0dXJuIHVubGVzcyBvcGVyYXRpb24gPSBAdmltU3RhdGUuZ2xvYmFsU3RhdGUuZ2V0KGtleSlcblxuICAgIG9wZXJhdGlvbiA9IG9wZXJhdGlvbi5jbG9uZShAdmltU3RhdGUpXG4gICAgb3BlcmF0aW9uLnNldFJlcGVhdGVkKClcbiAgICBvcGVyYXRpb24ucmVzZXRDb3VudCgpXG4gICAgaWYgcmV2ZXJzZVxuICAgICAgb3BlcmF0aW9uLmJhY2t3YXJkcyA9IG5vdCBvcGVyYXRpb24uYmFja3dhcmRzXG4gICAgQHJ1bihvcGVyYXRpb24pXG5cbiAgcnVuQ3VycmVudEZpbmQ6IChvcHRpb25zKSAtPlxuICAgIEBydW5SZWNvcmRlZE1vdGlvbignY3VycmVudEZpbmQnLCBvcHRpb25zKVxuXG4gIHJ1bkN1cnJlbnRTZWFyY2g6IChvcHRpb25zKSAtPlxuICAgIEBydW5SZWNvcmRlZE1vdGlvbignY3VycmVudFNlYXJjaCcsIG9wdGlvbnMpXG5cbiAgaGFuZGxlRXJyb3I6IChlcnJvcikgLT5cbiAgICBAdmltU3RhdGUucmVzZXQoKVxuICAgIHVubGVzcyBlcnJvciBpbnN0YW5jZW9mIE9wZXJhdGlvbkFib3J0ZWRFcnJvclxuICAgICAgdGhyb3cgZXJyb3JcblxuICBpc1Byb2Nlc3Npbmc6IC0+XG4gICAgQHByb2Nlc3NpbmdcblxuICBwcm9jZXNzOiAtPlxuICAgIEBwcm9jZXNzaW5nID0gdHJ1ZVxuICAgIGlmIEBzdGFjay5sZW5ndGggaXMgMlxuICAgICAgIyBbRklYTUUgaWRlYWxseV1cbiAgICAgICMgSWYgdGFyZ2V0IGlzIG5vdCBjb21wbGV0ZSwgd2UgcG9zdHBvbmUgY29tcHNpbmcgdGFyZ2V0IHdpdGggb3BlcmF0b3IgdG8ga2VlcCBzaXR1YXRpb24gc2ltcGxlLlxuICAgICAgIyBTbyB0aGF0IHdlIGNhbiBhc3N1bWUgd2hlbiB0YXJnZXQgaXMgc2V0IHRvIG9wZXJhdG9yIGl0J3MgY29tcGxldGUuXG4gICAgICAjIGUuZy4gYHkgcyB0IGEnKHN1cnJvdW5kIGZvciByYW5nZSBmcm9tIGhlcmUgdG8gdGlsbCBhKVxuICAgICAgcmV0dXJuIHVubGVzcyBAcGVla1RvcCgpLmlzQ29tcGxldGUoKVxuXG4gICAgICBvcGVyYXRpb24gPSBAc3RhY2sucG9wKClcbiAgICAgIEBwZWVrVG9wKCkuc2V0VGFyZ2V0KG9wZXJhdGlvbilcblxuICAgIHRvcCA9IEBwZWVrVG9wKClcblxuICAgIGlmIHRvcC5pc0NvbXBsZXRlKClcbiAgICAgIEBleGVjdXRlKEBzdGFjay5wb3AoKSlcbiAgICBlbHNlXG4gICAgICBpZiBAbW9kZSBpcyAnbm9ybWFsJyBhbmQgdG9wLmlzT3BlcmF0b3IoKVxuICAgICAgICBAbW9kZU1hbmFnZXIuYWN0aXZhdGUoJ29wZXJhdG9yLXBlbmRpbmcnKVxuXG4gICAgICAjIFRlbXBvcmFyeSBzZXQgd2hpbGUgY29tbWFuZCBpcyBydW5uaW5nXG4gICAgICBpZiBjb21tYW5kTmFtZSA9IHRvcC5jb25zdHJ1Y3Rvci5nZXRDb21tYW5kTmFtZVdpdGhvdXRQcmVmaXg/KClcbiAgICAgICAgQGFkZFRvQ2xhc3NMaXN0KGNvbW1hbmROYW1lICsgXCItcGVuZGluZ1wiKVxuXG4gIGV4ZWN1dGU6IChvcGVyYXRpb24pIC0+XG4gICAgQHZpbVN0YXRlLnVwZGF0ZVByZXZpb3VzU2VsZWN0aW9uKCkgaWYgQG1vZGUgaXMgJ3Zpc3VhbCdcbiAgICBleGVjdXRpb24gPSBvcGVyYXRpb24uZXhlY3V0ZSgpXG4gICAgaWYgZXhlY3V0aW9uIGluc3RhbmNlb2YgUHJvbWlzZVxuICAgICAgZXhlY3V0aW9uXG4gICAgICAgIC50aGVuID0+IEBmaW5pc2gob3BlcmF0aW9uKVxuICAgICAgICAuY2F0Y2ggPT4gQGhhbmRsZUVycm9yKClcbiAgICBlbHNlXG4gICAgICBAZmluaXNoKG9wZXJhdGlvbilcblxuICBjYW5jZWw6IC0+XG4gICAgaWYgQG1vZGUgbm90IGluIFsndmlzdWFsJywgJ2luc2VydCddXG4gICAgICBAdmltU3RhdGUucmVzZXROb3JtYWxNb2RlKClcbiAgICAgIEB2aW1TdGF0ZS5yZXN0b3JlT3JpZ2luYWxDdXJzb3JQb3NpdGlvbigpXG4gICAgQGZpbmlzaCgpXG5cbiAgZmluaXNoOiAob3BlcmF0aW9uPW51bGwpIC0+XG4gICAgQHJlY29yZGVkT3BlcmF0aW9uID0gb3BlcmF0aW9uIGlmIG9wZXJhdGlvbj8uaXNSZWNvcmRhYmxlKClcbiAgICBAdmltU3RhdGUuZW1pdERpZEZpbmlzaE9wZXJhdGlvbigpXG4gICAgaWYgb3BlcmF0aW9uPy5pc09wZXJhdG9yKClcbiAgICAgIG9wZXJhdGlvbi5yZXNldFN0YXRlKClcblxuICAgIGlmIEBtb2RlIGlzICdub3JtYWwnXG4gICAgICBzd3JhcC5jbGVhclByb3BlcnRpZXMoQGVkaXRvcilcbiAgICAgIEBlbnN1cmVBbGxTZWxlY3Rpb25zQXJlRW1wdHkob3BlcmF0aW9uKVxuICAgICAgQGVuc3VyZUFsbEN1cnNvcnNBcmVOb3RBdEVuZE9mTGluZSgpXG4gICAgZWxzZSBpZiBAbW9kZSBpcyAndmlzdWFsJ1xuICAgICAgQG1vZGVNYW5hZ2VyLnVwZGF0ZU5hcnJvd2VkU3RhdGUoKVxuICAgICAgQHZpbVN0YXRlLnVwZGF0ZVByZXZpb3VzU2VsZWN0aW9uKClcbiAgICBAdmltU3RhdGUudXBkYXRlQ3Vyc29yc1Zpc2liaWxpdHkoKVxuICAgIEB2aW1TdGF0ZS5yZXNldCgpXG5cbiAgZW5zdXJlQWxsU2VsZWN0aW9uc0FyZUVtcHR5OiAob3BlcmF0aW9uKSAtPlxuICAgICMgV2hlbiBAdmltU3RhdGUuc2VsZWN0QmxvY2t3aXNlKCkgaXMgY2FsbGVkIGluIG5vbi12aXN1YWwtbW9kZS5cbiAgICAjIGUuZy4gYC5gIHJlcGVhdCBvZiBvcGVyYXRpb24gdGFyZ2V0ZWQgYmxvY2t3aXNlIGBDdXJyZW50U2VsZWN0aW9uYC5cbiAgICAjIFdlIG5lZWQgdG8gbWFudWFsbHkgY2xlYXIgYmxvY2t3aXNlU2VsZWN0aW9uLlxuICAgICMgU2VlICM2NDdcbiAgICBAdmltU3RhdGUuY2xlYXJCbG9ja3dpc2VTZWxlY3Rpb25zKClcblxuICAgIHVubGVzcyBAZWRpdG9yLmdldExhc3RTZWxlY3Rpb24oKS5pc0VtcHR5KClcbiAgICAgIGlmIHNldHRpbmdzLmdldCgndGhyb3dFcnJvck9uTm9uRW1wdHlTZWxlY3Rpb25Jbk5vcm1hbE1vZGUnKVxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJTZWxlY3Rpb24gaXMgbm90IGVtcHR5IGluIG5vcm1hbC1tb2RlOiAje29wZXJhdGlvbi50b1N0cmluZygpfVwiKVxuICAgICAgZWxzZVxuICAgICAgICBAdmltU3RhdGUuY2xlYXJTZWxlY3Rpb25zKClcblxuICBlbnN1cmVBbGxDdXJzb3JzQXJlTm90QXRFbmRPZkxpbmU6IC0+XG4gICAgZm9yIGN1cnNvciBpbiBAZWRpdG9yLmdldEN1cnNvcnMoKSB3aGVuIGN1cnNvci5pc0F0RW5kT2ZMaW5lKClcbiAgICAgIG1vdmVDdXJzb3JMZWZ0KGN1cnNvciwge3ByZXNlcnZlR29hbENvbHVtbjogdHJ1ZX0pXG5cbiAgYWRkVG9DbGFzc0xpc3Q6IChjbGFzc05hbWUpIC0+XG4gICAgQGVkaXRvckVsZW1lbnQuY2xhc3NMaXN0LmFkZChjbGFzc05hbWUpXG4gICAgQHN1YnNjcmliZSBuZXcgRGlzcG9zYWJsZSA9PlxuICAgICAgQGVkaXRvckVsZW1lbnQuY2xhc3NMaXN0LnJlbW92ZShjbGFzc05hbWUpXG5cbiAgIyBDb3VudFxuICAjIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgIyBrZXlzdHJva2UgYDNkMndgIGRlbGV0ZSA2KDMqMikgd29yZHMuXG4gICMgIDJuZCBudW1iZXIoMiBpbiB0aGlzIGNhc2UpIGlzIGFsd2F5cyBlbnRlcmQgaW4gb3BlcmF0b3ItcGVuZGluZy1tb2RlLlxuICAjICBTbyBjb3VudCBoYXZlIHR3byB0aW1pbmcgdG8gYmUgZW50ZXJlZC4gdGhhdCdzIHdoeSBoZXJlIHdlIG1hbmFnZSBjb3VudGVyIGJ5IG1vZGUuXG4gIGhhc0NvdW50OiAtPlxuICAgIEBjb3VudFsnbm9ybWFsJ10/IG9yIEBjb3VudFsnb3BlcmF0b3ItcGVuZGluZyddP1xuXG4gIGdldENvdW50OiAtPlxuICAgIGlmIEBoYXNDb3VudCgpXG4gICAgICAoQGNvdW50Wydub3JtYWwnXSA/IDEpICogKEBjb3VudFsnb3BlcmF0b3ItcGVuZGluZyddID8gMSlcbiAgICBlbHNlXG4gICAgICBudWxsXG5cbiAgc2V0Q291bnQ6IChudW1iZXIpIC0+XG4gICAgbW9kZSA9ICdub3JtYWwnXG4gICAgbW9kZSA9IEBtb2RlIGlmIEBtb2RlIGlzICdvcGVyYXRvci1wZW5kaW5nJ1xuICAgIEBjb3VudFttb2RlXSA/PSAwXG4gICAgQGNvdW50W21vZGVdID0gKEBjb3VudFttb2RlXSAqIDEwKSArIG51bWJlclxuICAgIEB2aW1TdGF0ZS5ob3Zlci5zZXQoQGJ1aWxkQ291bnRTdHJpbmcoKSlcbiAgICBAdmltU3RhdGUudG9nZ2xlQ2xhc3NMaXN0KCd3aXRoLWNvdW50JywgdHJ1ZSlcblxuICBidWlsZENvdW50U3RyaW5nOiAtPlxuICAgIFtAY291bnRbJ25vcm1hbCddLCBAY291bnRbJ29wZXJhdG9yLXBlbmRpbmcnXV1cbiAgICAgIC5maWx0ZXIgKGNvdW50KSAtPiBjb3VudD9cbiAgICAgIC5tYXAgKGNvdW50KSAtPiBTdHJpbmcoY291bnQpXG4gICAgICAuam9pbigneCcpXG5cbiAgcmVzZXRDb3VudDogLT5cbiAgICBAY291bnQgPSB7fVxuICAgIEB2aW1TdGF0ZS50b2dnbGVDbGFzc0xpc3QoJ3dpdGgtY291bnQnLCBmYWxzZSlcblxubW9kdWxlLmV4cG9ydHMgPSBPcGVyYXRpb25TdGFja1xuIl19
