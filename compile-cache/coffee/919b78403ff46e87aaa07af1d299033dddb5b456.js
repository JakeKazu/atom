(function() {
  var BracketFinder, PairFinder, QuoteFinder, Range, ScopeState, TagFinder, _, collectRangeInBufferRow, getCharacterRangeInformation, getEndOfLineForBufferRow, getLineTextToBufferPosition, isEscapedCharRange, ref, scanEditorInDirection,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  Range = require('atom').Range;

  _ = require('underscore-plus');

  ref = require('./utils'), isEscapedCharRange = ref.isEscapedCharRange, getEndOfLineForBufferRow = ref.getEndOfLineForBufferRow, collectRangeInBufferRow = ref.collectRangeInBufferRow, scanEditorInDirection = ref.scanEditorInDirection, getLineTextToBufferPosition = ref.getLineTextToBufferPosition;

  getCharacterRangeInformation = function(editor, point, char) {
    var balanced, left, pattern, ref1, right, total;
    pattern = RegExp("" + (_.escapeRegExp(char)), "g");
    total = collectRangeInBufferRow(editor, point.row, pattern).filter(function(range) {
      return !isEscapedCharRange(editor, range);
    });
    ref1 = _.partition(total, function(arg) {
      var start;
      start = arg.start;
      return start.isLessThan(point);
    }), left = ref1[0], right = ref1[1];
    balanced = (total.length % 2) === 0;
    return {
      total: total,
      left: left,
      right: right,
      balanced: balanced
    };
  };

  ScopeState = (function() {
    function ScopeState(editor1, point) {
      this.editor = editor1;
      this.state = this.getScopeStateForBufferPosition(point);
    }

    ScopeState.prototype.getScopeStateForBufferPosition = function(point) {
      var scopes;
      scopes = this.editor.scopeDescriptorForBufferPosition(point).getScopesArray();
      return {
        inString: scopes.some(function(scope) {
          return scope.startsWith('string.');
        }),
        inComment: scopes.some(function(scope) {
          return scope.startsWith('comment.');
        }),
        inDoubleQuotes: this.isInDoubleQuotes(point)
      };
    };

    ScopeState.prototype.isInDoubleQuotes = function(point) {
      var balanced, left, ref1, total;
      ref1 = getCharacterRangeInformation(this.editor, point, '"'), total = ref1.total, left = ref1.left, balanced = ref1.balanced;
      if (total.length === 0 || !balanced) {
        return false;
      } else {
        return left.length % 2 === 1;
      }
    };

    ScopeState.prototype.isEqual = function(other) {
      return _.isEqual(this.state, other.state);
    };

    ScopeState.prototype.isInNormalCodeArea = function() {
      return !(this.state.inString || this.state.inComment || this.state.inDoubleQuotes);
    };

    return ScopeState;

  })();

  PairFinder = (function() {
    function PairFinder(editor1, options) {
      this.editor = editor1;
      if (options == null) {
        options = {};
      }
      this.allowNextLine = options.allowNextLine, this.allowForwarding = options.allowForwarding, this.pair = options.pair;
      if (this.pair != null) {
        this.setPatternForPair(this.pair);
      }
    }

    PairFinder.prototype.getPattern = function() {
      return this.pattern;
    };

    PairFinder.prototype.filterEvent = function() {
      return true;
    };

    PairFinder.prototype.findPair = function(which, direction, from) {
      var findingNonForwardingClosingQuote, found, scanner, stack;
      stack = [];
      found = null;
      findingNonForwardingClosingQuote = (this instanceof QuoteFinder) && which === 'close' && !this.allowForwarding;
      scanner = scanEditorInDirection.bind(null, this.editor, direction, this.getPattern(), {
        from: from,
        allowNextLine: this.allowNextLine
      });
      scanner((function(_this) {
        return function(event) {
          var eventState, range, stop;
          range = event.range, stop = event.stop;
          if (isEscapedCharRange(_this.editor, range)) {
            return;
          }
          if (!_this.filterEvent(event)) {
            return;
          }
          eventState = _this.getEventState(event);
          if (findingNonForwardingClosingQuote && eventState.state === 'open' && range.start.isGreaterThan(from)) {
            stop();
            return;
          }
          if (eventState.state !== which) {
            return stack.push(eventState);
          } else {
            if (_this.onFound(stack, {
              eventState: eventState,
              from: from
            })) {
              found = range;
              return stop();
            }
          }
        };
      })(this));
      return found;
    };

    PairFinder.prototype.spliceStack = function(stack, eventState) {
      return stack.pop();
    };

    PairFinder.prototype.onFound = function(stack, arg) {
      var eventState, from, openRange, openState;
      eventState = arg.eventState, from = arg.from;
      switch (eventState.state) {
        case 'open':
          this.spliceStack(stack, eventState);
          return stack.length === 0;
        case 'close':
          openState = this.spliceStack(stack, eventState);
          if (openState == null) {
            return true;
          }
          if (stack.length === 0) {
            openRange = openState.range;
            return openRange.start.isEqual(from) || (this.allowForwarding && openRange.start.row === from.row);
          }
      }
    };

    PairFinder.prototype.findCloseForward = function(from) {
      return this.findPair('close', 'forward', from);
    };

    PairFinder.prototype.findOpenBackward = function(from) {
      return this.findPair('open', 'backward', from);
    };

    PairFinder.prototype.find = function(from) {
      var closeRange, openRange;
      closeRange = this.closeRange = this.findCloseForward(from);
      if (closeRange != null) {
        openRange = this.findOpenBackward(closeRange.end);
      }
      if ((closeRange != null) && (openRange != null)) {
        return {
          aRange: new Range(openRange.start, closeRange.end),
          innerRange: new Range(openRange.end, closeRange.start),
          openRange: openRange,
          closeRange: closeRange
        };
      }
    };

    return PairFinder;

  })();

  BracketFinder = (function(superClass) {
    extend(BracketFinder, superClass);

    function BracketFinder() {
      return BracketFinder.__super__.constructor.apply(this, arguments);
    }

    BracketFinder.prototype.retry = false;

    BracketFinder.prototype.setPatternForPair = function(pair) {
      var close, open;
      open = pair[0], close = pair[1];
      return this.pattern = RegExp("(" + (_.escapeRegExp(open)) + ")|(" + (_.escapeRegExp(close)) + ")", "g");
    };

    BracketFinder.prototype.find = function(from) {
      var found, ref1;
      if (this.initialScope == null) {
        this.initialScope = new ScopeState(this.editor, from);
      }
      if (found = BracketFinder.__super__.find.apply(this, arguments)) {
        return found;
      }
      if (!this.retry) {
        this.retry = true;
        ref1 = [], this.closeRange = ref1[0], this.closeRangeScope = ref1[1];
        return this.find(from);
      }
    };

    BracketFinder.prototype.filterEvent = function(arg) {
      var range, scope;
      range = arg.range;
      scope = new ScopeState(this.editor, range.start);
      if (!this.closeRange) {
        if (!this.retry) {
          return this.initialScope.isEqual(scope);
        } else {
          if (this.initialScope.isInNormalCodeArea()) {
            return !scope.isInNormalCodeArea();
          } else {
            return scope.isInNormalCodeArea();
          }
        }
      } else {
        if (this.closeRangeScope == null) {
          this.closeRangeScope = new ScopeState(this.editor, this.closeRange.start);
        }
        return this.closeRangeScope.isEqual(scope);
      }
    };

    BracketFinder.prototype.getEventState = function(arg) {
      var match, range, state;
      match = arg.match, range = arg.range;
      state = (function() {
        switch (false) {
          case !match[1]:
            return 'open';
          case !match[2]:
            return 'close';
        }
      })();
      return {
        state: state,
        range: range
      };
    };

    return BracketFinder;

  })(PairFinder);

  QuoteFinder = (function(superClass) {
    extend(QuoteFinder, superClass);

    function QuoteFinder() {
      return QuoteFinder.__super__.constructor.apply(this, arguments);
    }

    QuoteFinder.prototype.setPatternForPair = function(pair) {
      this.quoteChar = pair[0];
      return this.pattern = RegExp("(" + (_.escapeRegExp(pair[0])) + ")", "g");
    };

    QuoteFinder.prototype.find = function(from) {
      var balanced, left, nextQuoteIsOpen, onQuoteChar, ref1, ref2, right, total;
      ref1 = getCharacterRangeInformation(this.editor, from, this.quoteChar), total = ref1.total, left = ref1.left, right = ref1.right, balanced = ref1.balanced;
      onQuoteChar = (ref2 = right[0]) != null ? ref2.start.isEqual(from) : void 0;
      if (balanced && onQuoteChar) {
        nextQuoteIsOpen = left.length % 2 === 0;
      } else {
        nextQuoteIsOpen = left.length === 0;
      }
      if (nextQuoteIsOpen) {
        this.pairStates = ['open', 'close', 'close', 'open'];
      } else {
        this.pairStates = ['close', 'close', 'open'];
      }
      return QuoteFinder.__super__.find.apply(this, arguments);
    };

    QuoteFinder.prototype.getEventState = function(arg) {
      var range, state;
      range = arg.range;
      state = this.pairStates.shift();
      return {
        state: state,
        range: range
      };
    };

    return QuoteFinder;

  })(PairFinder);

  TagFinder = (function(superClass) {
    extend(TagFinder, superClass);

    function TagFinder() {
      return TagFinder.__super__.constructor.apply(this, arguments);
    }

    TagFinder.prototype.pattern = /<(\/?)([^\s>]+)[^>]*>/g;

    TagFinder.prototype.lineTextToPointContainsNonWhiteSpace = function(point) {
      return /\S/.test(getLineTextToBufferPosition(this.editor, point));
    };

    TagFinder.prototype.find = function(from) {
      var found, tagStart;
      found = TagFinder.__super__.find.apply(this, arguments);
      if ((found != null) && this.allowForwarding) {
        tagStart = found.aRange.start;
        if (tagStart.isGreaterThan(from) && this.lineTextToPointContainsNonWhiteSpace(tagStart)) {
          this.allowForwarding = false;
          return this.find(from);
        }
      }
      return found;
    };

    TagFinder.prototype.getEventState = function(event) {
      var backslash;
      backslash = event.match[1];
      return {
        state: backslash === '' ? 'open' : 'close',
        name: event.match[2],
        range: event.range
      };
    };

    TagFinder.prototype.findPairState = function(stack, arg) {
      var i, name, state;
      name = arg.name;
      for (i = stack.length - 1; i >= 0; i += -1) {
        state = stack[i];
        if (state.name === name) {
          return state;
        }
      }
    };

    TagFinder.prototype.spliceStack = function(stack, eventState) {
      var pairEventState;
      if (pairEventState = this.findPairState(stack, eventState)) {
        stack.splice(stack.indexOf(pairEventState));
      }
      return pairEventState;
    };

    return TagFinder;

  })(PairFinder);

  module.exports = {
    BracketFinder: BracketFinder,
    QuoteFinder: QuoteFinder,
    TagFinder: TagFinder
  };

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL2hvbWUvamFrZS8uYXRvbS9wYWNrYWdlcy92aW0tbW9kZS1wbHVzL2xpYi9wYWlyLWZpbmRlci5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFBQSxNQUFBLHFPQUFBO0lBQUE7OztFQUFDLFFBQVMsT0FBQSxDQUFRLE1BQVI7O0VBQ1YsQ0FBQSxHQUFJLE9BQUEsQ0FBUSxpQkFBUjs7RUFDSixNQU1JLE9BQUEsQ0FBUSxTQUFSLENBTkosRUFDRSwyQ0FERixFQUVFLHVEQUZGLEVBR0UscURBSEYsRUFJRSxpREFKRixFQUtFOztFQUdGLDRCQUFBLEdBQStCLFNBQUMsTUFBRCxFQUFTLEtBQVQsRUFBZ0IsSUFBaEI7QUFDN0IsUUFBQTtJQUFBLE9BQUEsR0FBVSxNQUFBLENBQUEsRUFBQSxHQUFJLENBQUMsQ0FBQyxDQUFDLFlBQUYsQ0FBZSxJQUFmLENBQUQsQ0FBSixFQUE2QixHQUE3QjtJQUNWLEtBQUEsR0FBUSx1QkFBQSxDQUF3QixNQUF4QixFQUFnQyxLQUFLLENBQUMsR0FBdEMsRUFBMkMsT0FBM0MsQ0FBbUQsQ0FBQyxNQUFwRCxDQUEyRCxTQUFDLEtBQUQ7YUFDakUsQ0FBSSxrQkFBQSxDQUFtQixNQUFuQixFQUEyQixLQUEzQjtJQUQ2RCxDQUEzRDtJQUVSLE9BQWdCLENBQUMsQ0FBQyxTQUFGLENBQVksS0FBWixFQUFtQixTQUFDLEdBQUQ7QUFBYSxVQUFBO01BQVgsUUFBRDthQUFZLEtBQUssQ0FBQyxVQUFOLENBQWlCLEtBQWpCO0lBQWIsQ0FBbkIsQ0FBaEIsRUFBQyxjQUFELEVBQU87SUFDUCxRQUFBLEdBQVcsQ0FBQyxLQUFLLENBQUMsTUFBTixHQUFlLENBQWhCLENBQUEsS0FBc0I7V0FDakM7TUFBQyxPQUFBLEtBQUQ7TUFBUSxNQUFBLElBQVI7TUFBYyxPQUFBLEtBQWQ7TUFBcUIsVUFBQSxRQUFyQjs7RUFONkI7O0VBUXpCO0lBQ1Msb0JBQUMsT0FBRCxFQUFV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QyxLQUFELEVBQVEsVUFBUjtBQUNYLFVBQUE7TUFBQSxJQUFHLGNBQUEsR0FBaUIsSUFBQyxDQUFBLGFBQUQsQ0FBZSxLQUFmLEVBQXNCLFVBQXRCLENBQXBCO1FBQ0UsS0FBSyxDQUFDLE1BQU4sQ0FBYSxLQUFLLENBQUMsT0FBTixDQUFjLGNBQWQsQ0FBYixFQURGOzthQUVBO0lBSFc7Ozs7S0E3QlM7O0VBa0N4QixNQUFNLENBQUMsT0FBUCxHQUFpQjtJQUNmLGVBQUEsYUFEZTtJQUVmLGFBQUEsV0FGZTtJQUdmLFdBQUEsU0FIZTs7QUEzTmpCIiwic291cmNlc0NvbnRlbnQiOlsie1JhbmdlfSA9IHJlcXVpcmUgJ2F0b20nXG5fID0gcmVxdWlyZSAndW5kZXJzY29yZS1wbHVzJ1xue1xuICBpc0VzY2FwZWRDaGFyUmFuZ2VcbiAgZ2V0RW5kT2ZMaW5lRm9yQnVmZmVyUm93XG4gIGNvbGxlY3RSYW5nZUluQnVmZmVyUm93XG4gIHNjYW5FZGl0b3JJbkRpcmVjdGlvblxuICBnZXRMaW5lVGV4dFRvQnVmZmVyUG9zaXRpb25cbn0gPSByZXF1aXJlICcuL3V0aWxzJ1xuXG5nZXRDaGFyYWN0ZXJSYW5nZUluZm9ybWF0aW9uID0gKGVkaXRvciwgcG9pbnQsIGNoYXIpIC0+XG4gIHBhdHRlcm4gPSAvLy8je18uZXNjYXBlUmVnRXhwKGNoYXIpfS8vL2dcbiAgdG90YWwgPSBjb2xsZWN0UmFuZ2VJbkJ1ZmZlclJvdyhlZGl0b3IsIHBvaW50LnJvdywgcGF0dGVybikuZmlsdGVyIChyYW5nZSkgLT5cbiAgICBub3QgaXNFc2NhcGVkQ2hhclJhbmdlKGVkaXRvciwgcmFuZ2UpXG4gIFtsZWZ0LCByaWdodF0gPSBfLnBhcnRpdGlvbih0b3RhbCwgKHtzdGFydH0pIC0+IHN0YXJ0LmlzTGVzc1RoYW4ocG9pbnQpKVxuICBiYWxhbmNlZCA9ICh0b3RhbC5sZW5ndGggJSAyKSBpcyAwXG4gIHt0b3RhbCwgbGVmdCwgcmlnaHQsIGJhbGFuY2VkfVxuXG5jbGFzcyBTY29wZVN0YXRlXG4gIGNvbnN0cnVjdG9yOiAoQGVkaXRvciwgcG9pbnQpIC0+XG4gICAgQHN0YXRlID0gQGdldFNjb3BlU3RhdGVGb3JCdWZmZXJQb3NpdGlvbihwb2ludClcblxuICBnZXRTY29wZVN0YXRlRm9yQnVmZmVyUG9zaXRpb246IChwb2ludCkgLT5cbiAgICBzY29wZXMgPSBAZWRpdG9yLnNjb3BlRGVzY3JpcHRvckZvckJ1ZmZlclBvc2l0aW9uKHBvaW50KS5nZXRTY29wZXNBcnJheSgpXG4gICAge1xuICAgICAgaW5TdHJpbmc6IHNjb3Blcy5zb21lIChzY29wZSkgLT4gc2NvcGUuc3RhcnRzV2l0aCgnc3RyaW5nLicpXG4gICAgICBpbkNvbW1lbnQ6IHNjb3Blcy5zb21lIChzY29wZSkgLT4gc2NvcGUuc3RhcnRzV2l0aCgnY29tbWVudC4nKVxuICAgICAgaW5Eb3VibGVRdW90ZXM6IEBpc0luRG91YmxlUXVvdGVzKHBvaW50KVxuICAgIH1cblxuICBpc0luRG91YmxlUXVvdGVzOiAocG9pbnQpIC0+XG4gICAge3RvdGFsLCBsZWZ0LCBiYWxhbmNlZH0gPSBnZXRDaGFyYWN0ZXJSYW5nZUluZm9ybWF0aW9uKEBlZGl0b3IsIHBvaW50LCAnXCInKVxuICAgIGlmIHRvdGFsLmxlbmd0aCBpcyAwIG9yIG5vdCBiYWxhbmNlZFxuICAgICAgZmFsc2VcbiAgICBlbHNlXG4gICAgICBsZWZ0Lmxlbmd0aCAlIDIgaXMgMVxuXG4gIGlzRXF1YWw6IChvdGhlcikgLT5cbiAgICBfLmlzRXF1YWwoQHN0YXRlLCBvdGhlci5zdGF0ZSlcblxuICBpc0luTm9ybWFsQ29kZUFyZWE6IC0+XG4gICAgbm90IChAc3RhdGUuaW5TdHJpbmcgb3IgQHN0YXRlLmluQ29tbWVudCBvciBAc3RhdGUuaW5Eb3VibGVRdW90ZXMpXG5cbmNsYXNzIFBhaXJGaW5kZXJcbiAgY29uc3RydWN0b3I6IChAZWRpdG9yLCBvcHRpb25zPXt9KSAtPlxuICAgIHtAYWxsb3dOZXh0TGluZSwgQGFsbG93Rm9yd2FyZGluZywgQHBhaXJ9ID0gb3B0aW9uc1xuICAgIGlmIEBwYWlyP1xuICAgICAgQHNldFBhdHRlcm5Gb3JQYWlyKEBwYWlyKVxuXG4gIGdldFBhdHRlcm46IC0+XG4gICAgQHBhdHRlcm5cblxuICBmaWx0ZXJFdmVudDogLT5cbiAgICB0cnVlXG5cbiAgZmluZFBhaXI6ICh3aGljaCwgZGlyZWN0aW9uLCBmcm9tKSAtPlxuICAgIHN0YWNrID0gW11cbiAgICBmb3VuZCA9IG51bGxcblxuICAgICMgUXVvdGUgaXMgbm90IG5lc3RhYmxlLiBTbyB3aGVuIHdlIGVuY291bnRlciAnb3Blbicgd2hpbGUgZmluZGluZyAnY2xvc2UnLFxuICAgICMgaXQgaXMgZm9yd2FyZGluZyBwYWlyLCBzbyBzdG9wcGFibGUgaXMgbm90IEBhbGxvd0ZvcndhcmRpbmdcbiAgICBmaW5kaW5nTm9uRm9yd2FyZGluZ0Nsb3NpbmdRdW90ZSA9ICh0aGlzIGluc3RhbmNlb2YgUXVvdGVGaW5kZXIpIGFuZCB3aGljaCBpcyAnY2xvc2UnIGFuZCBub3QgQGFsbG93Rm9yd2FyZGluZ1xuICAgIHNjYW5uZXIgPSBzY2FuRWRpdG9ySW5EaXJlY3Rpb24uYmluZChudWxsLCBAZWRpdG9yLCBkaXJlY3Rpb24sIEBnZXRQYXR0ZXJuKCksIHtmcm9tLCBAYWxsb3dOZXh0TGluZX0pXG4gICAgc2Nhbm5lciAoZXZlbnQpID0+XG4gICAgICB7cmFuZ2UsIHN0b3B9ID0gZXZlbnRcblxuICAgICAgcmV0dXJuIGlmIGlzRXNjYXBlZENoYXJSYW5nZShAZWRpdG9yLCByYW5nZSlcbiAgICAgIHJldHVybiB1bmxlc3MgQGZpbHRlckV2ZW50KGV2ZW50KVxuXG4gICAgICBldmVudFN0YXRlID0gQGdldEV2ZW50U3RhdGUoZXZlbnQpXG5cbiAgICAgIGlmIGZpbmRpbmdOb25Gb3J3YXJkaW5nQ2xvc2luZ1F1b3RlIGFuZCBldmVudFN0YXRlLnN0YXRlIGlzICdvcGVuJyBhbmQgcmFuZ2Uuc3RhcnQuaXNHcmVhdGVyVGhhbihmcm9tKVxuICAgICAgICBzdG9wKClcbiAgICAgICAgcmV0dXJuXG5cbiAgICAgIGlmIGV2ZW50U3RhdGUuc3RhdGUgaXNudCB3aGljaFxuICAgICAgICBzdGFjay5wdXNoKGV2ZW50U3RhdGUpXG4gICAgICBlbHNlXG4gICAgICAgIGlmIEBvbkZvdW5kKHN0YWNrLCB7ZXZlbnRTdGF0ZSwgZnJvbX0pXG4gICAgICAgICAgZm91bmQgPSByYW5nZVxuICAgICAgICAgIHN0b3AoKVxuXG4gICAgcmV0dXJuIGZvdW5kXG5cbiAgc3BsaWNlU3RhY2s6IChzdGFjaywgZXZlbnRTdGF0ZSkgLT5cbiAgICBzdGFjay5wb3AoKVxuXG4gIG9uRm91bmQ6IChzdGFjaywge2V2ZW50U3RhdGUsIGZyb219KSAtPlxuICAgIHN3aXRjaCBldmVudFN0YXRlLnN0YXRlXG4gICAgICB3aGVuICdvcGVuJ1xuICAgICAgICBAc3BsaWNlU3RhY2soc3RhY2ssIGV2ZW50U3RhdGUpXG4gICAgICAgIHN0YWNrLmxlbmd0aCBpcyAwXG4gICAgICB3aGVuICdjbG9zZSdcbiAgICAgICAgb3BlblN0YXRlID0gQHNwbGljZVN0YWNrKHN0YWNrLCBldmVudFN0YXRlKVxuICAgICAgICB1bmxlc3Mgb3BlblN0YXRlP1xuICAgICAgICAgIHJldHVybiB0cnVlXG5cbiAgICAgICAgaWYgc3RhY2subGVuZ3RoIGlzIDBcbiAgICAgICAgICBvcGVuUmFuZ2UgPSBvcGVuU3RhdGUucmFuZ2VcbiAgICAgICAgICBvcGVuUmFuZ2Uuc3RhcnQuaXNFcXVhbChmcm9tKSBvciAoQGFsbG93Rm9yd2FyZGluZyBhbmQgb3BlblJhbmdlLnN0YXJ0LnJvdyBpcyBmcm9tLnJvdylcblxuICBmaW5kQ2xvc2VGb3J3YXJkOiAoZnJvbSkgLT5cbiAgICBAZmluZFBhaXIoJ2Nsb3NlJywgJ2ZvcndhcmQnLCBmcm9tKVxuXG4gIGZpbmRPcGVuQmFja3dhcmQ6IChmcm9tKSAtPlxuICAgIEBmaW5kUGFpcignb3BlbicsICdiYWNrd2FyZCcsIGZyb20pXG5cbiAgZmluZDogKGZyb20pIC0+XG4gICAgY2xvc2VSYW5nZSA9IEBjbG9zZVJhbmdlID0gQGZpbmRDbG9zZUZvcndhcmQoZnJvbSlcbiAgICBvcGVuUmFuZ2UgPSBAZmluZE9wZW5CYWNrd2FyZChjbG9zZVJhbmdlLmVuZCkgaWYgY2xvc2VSYW5nZT9cblxuICAgIGlmIGNsb3NlUmFuZ2U/IGFuZCBvcGVuUmFuZ2U/XG4gICAgICB7XG4gICAgICAgIGFSYW5nZTogbmV3IFJhbmdlKG9wZW5SYW5nZS5zdGFydCwgY2xvc2VSYW5nZS5lbmQpXG4gICAgICAgIGlubmVyUmFuZ2U6IG5ldyBSYW5nZShvcGVuUmFuZ2UuZW5kLCBjbG9zZVJhbmdlLnN0YXJ0KVxuICAgICAgICBvcGVuUmFuZ2U6IG9wZW5SYW5nZVxuICAgICAgICBjbG9zZVJhbmdlOiBjbG9zZVJhbmdlXG4gICAgICB9XG5cbmNsYXNzIEJyYWNrZXRGaW5kZXIgZXh0ZW5kcyBQYWlyRmluZGVyXG4gIHJldHJ5OiBmYWxzZVxuXG4gIHNldFBhdHRlcm5Gb3JQYWlyOiAocGFpcikgLT5cbiAgICBbb3BlbiwgY2xvc2VdID0gcGFpclxuICAgIEBwYXR0ZXJuID0gLy8vKCN7Xy5lc2NhcGVSZWdFeHAob3Blbil9KXwoI3tfLmVzY2FwZVJlZ0V4cChjbG9zZSl9KS8vL2dcblxuICAjIFRoaXMgbWV0aG9kIGNhbiBiZSBjYWxsZWQgcmVjdXJzaXZlbHlcbiAgZmluZDogKGZyb20pIC0+XG4gICAgQGluaXRpYWxTY29wZSA/PSBuZXcgU2NvcGVTdGF0ZShAZWRpdG9yLCBmcm9tKVxuXG4gICAgcmV0dXJuIGZvdW5kIGlmIGZvdW5kID0gc3VwZXJcblxuICAgIGlmIG5vdCBAcmV0cnlcbiAgICAgIEByZXRyeSA9IHRydWVcbiAgICAgIFtAY2xvc2VSYW5nZSwgQGNsb3NlUmFuZ2VTY29wZV0gPSBbXVxuICAgICAgQGZpbmQoZnJvbSlcblxuICBmaWx0ZXJFdmVudDogKHtyYW5nZX0pIC0+XG4gICAgc2NvcGUgPSBuZXcgU2NvcGVTdGF0ZShAZWRpdG9yLCByYW5nZS5zdGFydClcbiAgICBpZiBub3QgQGNsb3NlUmFuZ2VcbiAgICAgICMgTm93IGZpbmRpbmcgY2xvc2VSYW5nZVxuICAgICAgaWYgbm90IEByZXRyeVxuICAgICAgICBAaW5pdGlhbFNjb3BlLmlzRXF1YWwoc2NvcGUpXG4gICAgICBlbHNlXG4gICAgICAgIGlmIEBpbml0aWFsU2NvcGUuaXNJbk5vcm1hbENvZGVBcmVhKClcbiAgICAgICAgICBub3Qgc2NvcGUuaXNJbk5vcm1hbENvZGVBcmVhKClcbiAgICAgICAgZWxzZVxuICAgICAgICAgIHNjb3BlLmlzSW5Ob3JtYWxDb2RlQXJlYSgpXG4gICAgZWxzZVxuICAgICAgIyBOb3cgZmluZGluZyBvcGVuUmFuZ2U6IHNlYXJjaCBmcm9tIHNhbWUgc2NvcGVcbiAgICAgIEBjbG9zZVJhbmdlU2NvcGUgPz0gbmV3IFNjb3BlU3RhdGUoQGVkaXRvciwgQGNsb3NlUmFuZ2Uuc3RhcnQpXG4gICAgICBAY2xvc2VSYW5nZVNjb3BlLmlzRXF1YWwoc2NvcGUpXG5cbiAgZ2V0RXZlbnRTdGF0ZTogKHttYXRjaCwgcmFuZ2V9KSAtPlxuICAgIHN0YXRlID0gc3dpdGNoXG4gICAgICB3aGVuIG1hdGNoWzFdIHRoZW4gJ29wZW4nXG4gICAgICB3aGVuIG1hdGNoWzJdIHRoZW4gJ2Nsb3NlJ1xuICAgIHtzdGF0ZSwgcmFuZ2V9XG5cbmNsYXNzIFF1b3RlRmluZGVyIGV4dGVuZHMgUGFpckZpbmRlclxuICBzZXRQYXR0ZXJuRm9yUGFpcjogKHBhaXIpIC0+XG4gICAgQHF1b3RlQ2hhciA9IHBhaXJbMF1cbiAgICBAcGF0dGVybiA9IC8vLygje18uZXNjYXBlUmVnRXhwKHBhaXJbMF0pfSkvLy9nXG5cbiAgZmluZDogKGZyb20pIC0+XG4gICAgIyBIQUNLOiBDYW50IGRldGVybWluZSBvcGVuL2Nsb3NlIGZyb20gcXVvdGUgY2hhciBpdHNlbGZcbiAgICAjIFNvIHByZXNldCBvcGVuL2Nsb3NlIHN0YXRlIHRvIGdldCBkZXNpYWJsZSByZXN1bHQuXG4gICAge3RvdGFsLCBsZWZ0LCByaWdodCwgYmFsYW5jZWR9ID0gZ2V0Q2hhcmFjdGVyUmFuZ2VJbmZvcm1hdGlvbihAZWRpdG9yLCBmcm9tLCBAcXVvdGVDaGFyKVxuICAgIG9uUXVvdGVDaGFyID0gcmlnaHRbMF0/LnN0YXJ0LmlzRXF1YWwoZnJvbSkgIyBmcm9tIHBvaW50IGlzIG9uIHF1b3RlIGNoYXJcbiAgICBpZiBiYWxhbmNlZCBhbmQgb25RdW90ZUNoYXJcbiAgICAgIG5leHRRdW90ZUlzT3BlbiA9IGxlZnQubGVuZ3RoICUgMiBpcyAwXG4gICAgZWxzZVxuICAgICAgbmV4dFF1b3RlSXNPcGVuID0gbGVmdC5sZW5ndGggaXMgMFxuXG4gICAgaWYgbmV4dFF1b3RlSXNPcGVuXG4gICAgICBAcGFpclN0YXRlcyA9IFsnb3BlbicsICdjbG9zZScsICdjbG9zZScsICdvcGVuJ11cbiAgICBlbHNlXG4gICAgICBAcGFpclN0YXRlcyA9IFsnY2xvc2UnLCAnY2xvc2UnLCAnb3BlbiddXG5cbiAgICBzdXBlclxuXG4gIGdldEV2ZW50U3RhdGU6ICh7cmFuZ2V9KSAtPlxuICAgIHN0YXRlID0gQHBhaXJTdGF0ZXMuc2hpZnQoKVxuICAgIHtzdGF0ZSwgcmFuZ2V9XG5cbmNsYXNzIFRhZ0ZpbmRlciBleHRlbmRzIFBhaXJGaW5kZXJcbiAgcGF0dGVybjogLzwoXFwvPykoW15cXHM+XSspW14+XSo+L2dcblxuICBsaW5lVGV4dFRvUG9pbnRDb250YWluc05vbldoaXRlU3BhY2U6IChwb2ludCkgLT5cbiAgICAvXFxTLy50ZXN0KGdldExpbmVUZXh0VG9CdWZmZXJQb3NpdGlvbihAZWRpdG9yLCBwb2ludCkpXG5cbiAgZmluZDogKGZyb20pIC0+XG4gICAgZm91bmQgPSBzdXBlclxuICAgIGlmIGZvdW5kPyBhbmQgQGFsbG93Rm9yd2FyZGluZ1xuICAgICAgdGFnU3RhcnQgPSBmb3VuZC5hUmFuZ2Uuc3RhcnRcbiAgICAgIGlmIHRhZ1N0YXJ0LmlzR3JlYXRlclRoYW4oZnJvbSkgYW5kIEBsaW5lVGV4dFRvUG9pbnRDb250YWluc05vbldoaXRlU3BhY2UodGFnU3RhcnQpXG4gICAgICAgICMgV2UgZm91bmQgcmFuZ2UgYnV0IGFsc28gZm91bmQgdGhhdCB3ZSBhcmUgSU4gYW5vdGhlciB0YWcsXG4gICAgICAgICMgc28gd2lsbCByZXRyeSBieSBleGNsdWRpbmcgZm9yd2FyZGluZyByYW5nZS5cbiAgICAgICAgQGFsbG93Rm9yd2FyZGluZyA9IGZhbHNlXG4gICAgICAgIHJldHVybiBAZmluZChmcm9tKSAjIHJldHJ5XG4gICAgZm91bmRcblxuICBnZXRFdmVudFN0YXRlOiAoZXZlbnQpIC0+XG4gICAgYmFja3NsYXNoID0gZXZlbnQubWF0Y2hbMV1cbiAgICB7XG4gICAgICBzdGF0ZTogaWYgKGJhY2tzbGFzaCBpcyAnJykgdGhlbiAnb3BlbicgZWxzZSAnY2xvc2UnXG4gICAgICBuYW1lOiBldmVudC5tYXRjaFsyXVxuICAgICAgcmFuZ2U6IGV2ZW50LnJhbmdlXG4gICAgfVxuXG4gIGZpbmRQYWlyU3RhdGU6IChzdGFjaywge25hbWV9KSAtPlxuICAgIGZvciBzdGF0ZSBpbiBzdGFjayBieSAtMSB3aGVuIHN0YXRlLm5hbWUgaXMgbmFtZVxuICAgICAgcmV0dXJuIHN0YXRlXG5cbiAgc3BsaWNlU3RhY2s6IChzdGFjaywgZXZlbnRTdGF0ZSkgLT5cbiAgICBpZiBwYWlyRXZlbnRTdGF0ZSA9IEBmaW5kUGFpclN0YXRlKHN0YWNrLCBldmVudFN0YXRlKVxuICAgICAgc3RhY2suc3BsaWNlKHN0YWNrLmluZGV4T2YocGFpckV2ZW50U3RhdGUpKVxuICAgIHBhaXJFdmVudFN0YXRlXG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICBCcmFja2V0RmluZGVyXG4gIFF1b3RlRmluZGVyXG4gIFRhZ0ZpbmRlclxufVxuIl19
