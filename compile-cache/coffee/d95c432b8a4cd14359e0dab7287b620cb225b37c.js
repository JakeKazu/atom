(function() {
  var Disposable, Point, Range, SelectionWrapper, _, getEndOfLineForBufferRow, getFirstCharacterPositionForBufferRow, getRangeByTranslatePointAndClip, limitNumber, propertyStore, ref, ref1, shrinkRangeEndToBeforeNewLine, swrap, translatePointAndClip;

  _ = require('underscore-plus');

  ref = require('atom'), Range = ref.Range, Point = ref.Point, Disposable = ref.Disposable;

  ref1 = require('./utils'), translatePointAndClip = ref1.translatePointAndClip, getRangeByTranslatePointAndClip = ref1.getRangeByTranslatePointAndClip, shrinkRangeEndToBeforeNewLine = ref1.shrinkRangeEndToBeforeNewLine, getFirstCharacterPositionForBufferRow = ref1.getFirstCharacterPositionForBufferRow, getEndOfLineForBufferRow = ref1.getEndOfLineForBufferRow, limitNumber = ref1.limitNumber;

  propertyStore = new Map;

  SelectionWrapper = (function() {
    function SelectionWrapper(selection1) {
      this.selection = selection1;
    }

    SelectionWrapper.prototype.hasProperties = function() {
      return propertyStore.has(this.selection);
    };

    SelectionWrapper.prototype.getProperties = function() {
      var ref2;
      return (ref2 = propertyStore.get(this.selection)) != null ? ref2 : {};
    };

    SelectionWrapper.prototype.setProperties = function(prop) {
      return propertyStore.set(this.selection, prop);
    };

    SelectionWrapper.prototype.clearProperties = function() {
      return propertyStore["delete"](this.selection);
    };

    SelectionWrapper.prototype.setBufferRangeSafely = function(range, options) {
      if (range) {
        return this.setBufferRange(range, options);
      }
    };

    SelectionWrapper.prototype.getBufferRange = function() {
      return this.selection.getBufferRange();
    };

    SelectionWrapper.prototype.getBufferPositionFor = function(which, arg) {
      var allowFallback, end, fromProperty, head, ref2, ref3, ref4, ref5, ref6, start, tail;
      ref2 = arg != null ? arg : {}, fromProperty = ref2.fromProperty, allowFallback = ref2.allowFallback;
      if (fromProperty == null) {
        fromProperty = false;
      }
      if (allowFallback == null) {
        allowFallback = false;
      }
      if (fromProperty && (!this.hasProperties()) && allowFallback) {
        fromProperty = false;
      }
      if (fromProperty) {
        ref3 = this.getProperties(), head = ref3.head, tail = ref3.tail;
        if (head.isGreaterThanOrEqual(tail)) {
          ref4 = [tail, head], start = ref4[0], end = ref4[1];
        } else {
          ref5 = [head, tail], start = ref5[0], end = ref5[1];
        }
      } else {
        ref6 = this.selection.getBufferRange(), start = ref6.start, end = ref6.end;
        head = this.selection.getHeadBufferPosition();
        tail = this.selection.getTailBufferPosition();
      }
      switch (which) {
        case 'start':
          return start;
        case 'end':
          return end;
        case 'head':
          return head;
        case 'tail':
          return tail;
      }
    };

    SelectionWrapper.prototype.setBufferPositionTo = function(which, options) {
      var point;
      point = this.getBufferPositionFor(which, options);
      return this.selection.cursor.setBufferPosition(point);
    };

    SelectionWrapper.prototype.mergeBufferRange = function(range, option) {
      return this.setBufferRange(this.getBufferRange().union(range), option);
    };

    SelectionWrapper.prototype.extendToEOL = function() {
      var endRow, endRowRange, newRange, ref2, startRow;
      ref2 = this.selection.getBufferRowRange(), startRow = ref2[0], endRow = ref2[1];
      endRowRange = this.selection.editor.bufferRangeForBufferRow(endRow);
      newRange = new Range(this.getBufferRange().start, endRowRange.end);
      return this.setBufferRange(newRange);
    };

    SelectionWrapper.prototype.reverse = function() {
      return this.setReversedState(!this.selection.isReversed());
    };

    SelectionWrapper.prototype.setReversedState = function(reversed) {
      var head, options, ref2, tail;
      if (this.selection.isReversed() === reversed) {
        return;
      }
      ref2 = this.getProperties(), head = ref2.head, tail = ref2.tail;
      if ((head != null) && (tail != null)) {
        this.setProperties({
          head: tail,
          tail: head
        });
      }
      options = {
        autoscroll: true,
        reversed: reversed,
        preserveFolds: true
      };
      return this.setBufferRange(this.getBufferRange(), options);
    };

    SelectionWrapper.prototype.getRows = function() {
      var endRow, i, ref2, results1, startRow;
      ref2 = this.selection.getBufferRowRange(), startRow = ref2[0], endRow = ref2[1];
      return (function() {
        results1 = [];
        for (var i = startRow; startRow <= endRow ? i <= endRow : i >= endRow; startRow <= endRow ? i++ : i--){ results1.push(i); }
        return results1;
      }).apply(this);
    };

    SelectionWrapper.prototype.getRowCount = function() {
      return this.getRows().length;
    };

    SelectionWrapper.prototype.selectRowRange = function(rowRange) {
      var editor, endRange, range, ref2, startRange;
      editor = this.selection.editor;
      ref2 = rowRange.map(function(row) {
        return editor.bufferRangeForBufferRow(row, {
          includeNewline: true
        });
      }), startRange = ref2[0], endRange = ref2[1];
      range = startRange.union(endRange);
      return this.setBufferRange(range, {
        preserveFolds: true
      });
    };

    SelectionWrapper.prototype.expandOverLine = function(arg) {
      var goalColumn, preserveGoalColumn;
      preserveGoalColumn = (arg != null ? arg : {}).preserveGoalColumn;
      if (preserveGoalColumn) {
        goalColumn = this.selection.cursor.goalColumn;
      }
      this.selectRowRange(this.selection.getBufferRowRange());
      if (goalColumn) {
        return this.selection.cursor.goalColumn = goalColumn;
      }
    };

    SelectionWrapper.prototype.getRowFor = function(where) {
      var endRow, headRow, ref2, ref3, ref4, startRow, tailRow;
      ref2 = this.selection.getBufferRowRange(), startRow = ref2[0], endRow = ref2[1];
      if (this.selection.isReversed()) {
        ref3 = [startRow, endRow], headRow = ref3[0], tailRow = ref3[1];
      } else {
        ref4 = [endRow, startRow], headRow = ref4[0], tailRow = ref4[1];
      }
      switch (where) {
        case 'start':
          return startRow;
        case 'end':
          return endRow;
        case 'head':
          return headRow;
        case 'tail':
          return tailRow;
      }
    };

    SelectionWrapper.prototype.getHeadRow = function() {
      return this.getRowFor('head');
    };

    SelectionWrapper.prototype.getTailRow = function() {
      return this.getRowFor('tail');
    };

    SelectionWrapper.prototype.getStartRow = function() {
      return this.getRowFor('start');
    };

    SelectionWrapper.prototype.getEndRow = function() {
      return this.getRowFor('end');
    };

    SelectionWrapper.prototype.getTailBufferRange = function() {
      var editor, point, tailPoint;
      editor = this.selection.editor;
      tailPoint = this.selection.getTailBufferPosition();
      if (this.selection.isReversed()) {
        point = translatePointAndClip(editor, tailPoint, 'backward');
        return new Range(point, tailPoint);
      } else {
        point = translatePointAndClip(editor, tailPoint, 'forward', {
          hello: 'when getting tailRange'
        });
        return new Range(tailPoint, point);
      }
    };

    SelectionWrapper.prototype.saveProperties = function() {
      var endPoint, properties;
      properties = this.captureProperties();
      if (!this.selection.isEmpty()) {
        endPoint = this.selection.getBufferRange().end.translate([0, -1]);
        endPoint = this.selection.editor.clipBufferPosition(endPoint);
        if (this.selection.isReversed()) {
          properties.tail = endPoint;
        } else {
          properties.head = endPoint;
        }
      }
      return this.setProperties(properties);
    };

    SelectionWrapper.prototype.setWise = function(value) {
      var properties;
      if (!this.hasProperties()) {
        this.saveProperties();
      }
      properties = this.getProperties();
      return properties.wise = value;
    };

    SelectionWrapper.prototype.getWise = function() {
      var ref2, ref3;
      return (ref2 = (ref3 = this.getProperties()) != null ? ref3.wise : void 0) != null ? ref2 : 'characterwise';
    };

    SelectionWrapper.prototype.applyWise = function(newWise) {
      switch (newWise) {
        case 'characterwise':
          this.translateSelectionEndAndClip('forward');
          this.saveProperties();
          return this.setWise('characterwise');
        case 'linewise':
          this.complementGoalColumn();
          this.expandOverLine({
            preserveGoalColumn: true
          });
          return this.setWise('linewise');
      }
    };

    SelectionWrapper.prototype.complementGoalColumn = function() {
      var column;
      if (this.selection.cursor.goalColumn == null) {
        column = this.getBufferPositionFor('head', {
          fromProperty: true,
          allowFallback: true
        }).column;
        return this.selection.cursor.goalColumn = column;
      }
    };

    SelectionWrapper.prototype.clipPropertiesTillEndOfLine = function() {
      var editor, headMaxColumn, headRowEOL, properties, tailMaxColumn, tailRowEOL;
      if (!this.hasProperties()) {
        return;
      }
      editor = this.selection.editor;
      headRowEOL = getEndOfLineForBufferRow(editor, this.getHeadRow());
      tailRowEOL = getEndOfLineForBufferRow(editor, this.getTailRow());
      headMaxColumn = limitNumber(headRowEOL.column - 1, {
        min: 0
      });
      tailMaxColumn = limitNumber(tailRowEOL.column - 1, {
        min: 0
      });
      properties = this.getProperties();
      if (properties.head.column > headMaxColumn) {
        properties.head.column = headMaxColumn;
      }
      if (properties.tail.column > tailMaxColumn) {
        return properties.tail.column = tailMaxColumn;
      }
    };

    SelectionWrapper.prototype.captureProperties = function() {
      return {
        head: this.selection.getHeadBufferPosition(),
        tail: this.selection.getTailBufferPosition()
      };
    };

    SelectionWrapper.prototype.selectByProperties = function(arg) {
      var head, tail;
      head = arg.head, tail = arg.tail;
      this.setBufferRange([tail, head]);
      return this.setReversedState(head.isLessThan(tail));
    };

    SelectionWrapper.prototype.isForwarding = function() {
      var head, tail;
      head = this.selection.getHeadBufferPosition();
      tail = this.selection.getTailBufferPosition();
      return head.isGreaterThan(tail);
    };

    SelectionWrapper.prototype.applyColumnFromProperties = function() {
      var end, head, ref2, ref3, ref4, selectionProperties, start, tail;
      selectionProperties = this.getProperties();
      if (selectionProperties == null) {
        return;
      }
      head = selectionProperties.head, tail = selectionProperties.tail;
      if (this.selection.isReversed()) {
        ref2 = [head, tail], start = ref2[0], end = ref2[1];
      } else {
        ref3 = [tail, head], start = ref3[0], end = ref3[1];
      }
      ref4 = this.selection.getBufferRowRange(), start.row = ref4[0], end.row = ref4[1];
      return this.withKeepingGoalColumn((function(_this) {
        return function() {
          _this.setBufferRange([start, end], {
            preserveFolds: true
          });
          return _this.translateSelectionEndAndClip('backward', {
            translate: false
          });
        };
      })(this));
    };

    SelectionWrapper.prototype.setBufferRange = function(range, options) {
      var keepGoalColumn, setBufferRange;
      if (options == null) {
        options = {};
      }
      keepGoalColumn = options.keepGoalColumn;
      delete options.keepGoalColumn;
      if (options.autoscroll == null) {
        options.autoscroll = false;
      }
      setBufferRange = (function(_this) {
        return function() {
          return _this.selection.setBufferRange(range, options);
        };
      })(this);
      if (keepGoalColumn) {
        return this.withKeepingGoalColumn(setBufferRange);
      } else {
        return setBufferRange();
      }
    };

    SelectionWrapper.prototype.replace = function(text) {
      var originalText;
      originalText = this.selection.getText();
      this.selection.insertText(text);
      return originalText;
    };

    SelectionWrapper.prototype.lineTextForBufferRows = function() {
      var editor;
      editor = this.selection.editor;
      return this.getRows().map(function(row) {
        return editor.lineTextForBufferRow(row);
      });
    };

    SelectionWrapper.prototype.mapToLineText = function(fn, arg) {
      var editor, includeNewline, textForRow;
      includeNewline = (arg != null ? arg : {}).includeNewline;
      editor = this.selection.editor;
      textForRow = function(row) {
        var range;
        range = editor.bufferRangeForBufferRow(row, {
          includeNewline: includeNewline
        });
        return editor.getTextInBufferRange(range);
      };
      return this.getRows().map(textForRow).map(fn);
    };

    SelectionWrapper.prototype.translate = function(startDelta, endDelta, options) {
      var newRange;
      if (endDelta == null) {
        endDelta = startDelta;
      }
      newRange = this.getBufferRange().translate(startDelta, endDelta);
      return this.setBufferRange(newRange, options);
    };

    SelectionWrapper.prototype.isSingleRow = function() {
      var endRow, ref2, startRow;
      ref2 = this.selection.getBufferRowRange(), startRow = ref2[0], endRow = ref2[1];
      return startRow === endRow;
    };

    SelectionWrapper.prototype.isLinewise = function() {
      var end, ref2, ref3, start;
      ref2 = this.getBufferRange(), start = ref2.start, end = ref2.end;
      return (start.row !== end.row) && ((start.column === (ref3 = end.column) && ref3 === 0));
    };

    SelectionWrapper.prototype.detectVisualModeSubmode = function() {
      if (this.selection.isEmpty()) {
        return null;
      } else if (this.isLinewise()) {
        return 'linewise';
      } else {
        return 'characterwise';
      }
    };

    SelectionWrapper.prototype.withKeepingGoalColumn = function(fn) {
      var end, goalColumn, ref2, start;
      goalColumn = this.selection.cursor.goalColumn;
      ref2 = this.getBufferRange(), start = ref2.start, end = ref2.end;
      fn();
      if (goalColumn != null) {
        return this.selection.cursor.goalColumn = goalColumn;
      }
    };

    SelectionWrapper.prototype.translateSelectionEndAndClip = function(direction, options) {
      var editor, newRange, range;
      editor = this.selection.editor;
      range = this.getBufferRange();
      newRange = getRangeByTranslatePointAndClip(editor, range, "end", direction, options);
      return this.withKeepingGoalColumn((function(_this) {
        return function() {
          return _this.setBufferRange(newRange, {
            preserveFolds: true
          });
        };
      })(this));
    };

    SelectionWrapper.prototype.translateSelectionHeadAndClip = function(direction, options) {
      var editor, newRange, range, which;
      editor = this.selection.editor;
      which = this.selection.isReversed() ? 'start' : 'end';
      range = this.getBufferRange();
      newRange = getRangeByTranslatePointAndClip(editor, range, which, direction, options);
      return this.withKeepingGoalColumn((function(_this) {
        return function() {
          return _this.setBufferRange(newRange, {
            preserveFolds: true
          });
        };
      })(this));
    };

    SelectionWrapper.prototype.shrinkEndToBeforeNewLine = function() {
      var newRange;
      newRange = shrinkRangeEndToBeforeNewLine(this.getBufferRange());
      return this.setBufferRange(newRange);
    };

    SelectionWrapper.prototype.setStartToFirstCharacterOfLine = function() {
      var end, newRange, newStart, ref2, start;
      ref2 = this.getBufferRange(), start = ref2.start, end = ref2.end;
      newStart = getFirstCharacterPositionForBufferRow(this.selection.editor, start.row);
      newRange = new Range(newStart, end);
      return this.setBufferRange(newRange);
    };

    SelectionWrapper.prototype.getBlockwiseSelectionExtent = function() {
      var head, tail;
      head = this.selection.getHeadBufferPosition();
      tail = this.selection.getTailBufferPosition();
      return new Point(head.row - tail.row, head.column - tail.column);
    };

    SelectionWrapper.prototype.normalize = function() {
      if (!this.selection.isEmpty()) {
        switch (this.getWise()) {
          case 'characterwise':
            this.translateSelectionEndAndClip('backward');
            break;
          case 'linewise':
            this.applyColumnFromProperties();
            break;
          case 'blockwise':
            this.translateSelectionEndAndClip('backward');
        }
      }
      return this.clearProperties();
    };

    return SelectionWrapper;

  })();

  swrap = function(selection) {
    return new SelectionWrapper(selection);
  };

  swrap.setReversedState = function(editor, reversed) {
    return editor.getSelections().forEach(function(selection) {
      return swrap(selection).setReversedState(reversed);
    });
  };

  swrap.expandOverLine = function(editor, options) {
    return editor.getSelections().forEach(function(selection) {
      return swrap(selection).expandOverLine(options);
    });
  };

  swrap.reverse = function(editor) {
    return editor.getSelections().forEach(function(selection) {
      return swrap(selection).reverse();
    });
  };

  swrap.clearProperties = function(editor) {
    return editor.getSelections().forEach(function(selection) {
      return swrap(selection).clearProperties();
    });
  };

  swrap.detectVisualModeSubmode = function(editor) {
    var results, selection, selections;
    selections = editor.getSelections();
    results = (function() {
      var i, len, results1;
      results1 = [];
      for (i = 0, len = selections.length; i < len; i++) {
        selection = selections[i];
        results1.push(swrap(selection).detectVisualModeSubmode());
      }
      return results1;
    })();
    if (results.every(function(r) {
      return r === 'linewise';
    })) {
      return 'linewise';
    } else if (results.some(function(r) {
      return r === 'characterwise';
    })) {
      return 'characterwise';
    } else {
      return null;
    }
  };

  swrap.saveProperties = function(editor) {
    var i, len, ref2, results1, selection;
    ref2 = editor.getSelections();
    results1 = [];
    for (i = 0, len = ref2.length; i < len; i++) {
      selection = ref2[i];
      results1.push(swrap(selection).saveProperties());
    }
    return results1;
  };

  swrap.complementGoalColumn = function(editor) {
    var i, len, ref2, results1, selection;
    ref2 = editor.getSelections();
    results1 = [];
    for (i = 0, len = ref2.length; i < len; i++) {
      selection = ref2[i];
      results1.push(swrap(selection).complementGoalColumn());
    }
    return results1;
  };

  swrap.normalize = function(editor) {
    var i, len, ref2, results1, selection;
    ref2 = editor.getSelections();
    results1 = [];
    for (i = 0, len = ref2.length; i < len; i++) {
      selection = ref2[i];
      results1.push(swrap(selection).normalize());
    }
    return results1;
  };

  swrap.setWise = function(editor, value) {
    var i, len, ref2, results1, selection;
    ref2 = editor.getSelections();
    results1 = [];
    for (i = 0, len = ref2.length; i < len; i++) {
      selection = ref2[i];
      results1.push(swrap(selection).setWise(value));
    }
    return results1;
  };

  swrap.applyWise = function(editor, value) {
    var i, len, ref2, results1, selection;
    ref2 = editor.getSelections();
    results1 = [];
    for (i = 0, len = ref2.length; i < len; i++) {
      selection = ref2[i];
      results1.push(swrap(selection).applyWise(value));
    }
    return results1;
  };

  swrap.clearProperties = function(editor) {
    var i, len, ref2, results1, selection;
    ref2 = editor.getSelections();
    results1 = [];
    for (i = 0, len = ref2.length; i < len; i++) {
      selection = ref2[i];
      results1.push(swrap(selection).clearProperties());
    }
    return results1;
  };

  module.exports = swrap;

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL2hvbWUvamFrZS8uYXRvbS9wYWNrYWdlcy92aW0tbW9kZS1wbHVzL2xpYi9zZWxlY3Rpb24td3JhcHBlci5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFBQSxNQUFBOztFQUFBLENBQUEsR0FBSSxPQUFBLENBQVEsaUJBQVI7O0VBQ0osTUFBNkIsT0FBQSxDQUFRLE1BQVIsQ0FBN0IsRUFBQyxpQkFBRCxFQUFRLGlCQUFSLEVBQWU7O0VBQ2YsT0FPSSxPQUFBLENBQVEsU0FBUixDQVBKLEVBQ0Usa0RBREYsRUFFRSxzRUFGRixFQUdFLGtFQUhGLEVBSUUsa0ZBSkYsRUFLRSx3REFMRixFQU1FOztFQUdGLGFBQUEsR0FBZ0IsSUFBSTs7RUFFZDtJQUNTLDBCQUFDLFVBQUQ7TUFBQyxJQUFDLENBQUEsWUFBRDtJQUFEOzsrQkFFYixhQUFBLEdBQWUsU0FBQTthQUFHLGFBQWEsQ0FBQyxHQUFkLENBQWtCLElBQUMsQ0FBQSxTQUFuQjtJQUFIOzsrQkFDZixhQUFBLEdBQWUsU0FBQTtBQUFHLFVBQUE7eUVBQWdDO0lBQW5DOzsrQkFDZixhQUFBLEdBQWUsU0FBQyxJQUFEO2FBQVUsYUFBYSxDQUFDLEdBQWQsQ0FBa0IsSUFBQyxDQUFBLFNBQW5CLEVBQThCLElBQTlCO0lBQVY7OytCQUNmLGVBQUEsR0FBaUIsU0FBQTthQUFHLGFBQWEsRUFBQyxNQUFELEVBQWIsQ0FBcUIsSUFBQyxDQUFBLFNBQXRCO0lBQUg7OytCQUVqQixvQkFBQSxHQUFzQixTQUFDLEtBQUQsRUFBUSxPQUFSO01BQ3BCLElBQUcsS0FBSDtlQUNFLElBQUMsQ0FBQSxjQUFELENBQWdCLEtBQWhCLEVBQXVCLE9BQXZCLEVBREY7O0lBRG9COzsrQkFJdEIsY0FBQSxHQUFnQixTQUFBO2FBQ2QsSUFBQyxDQUFBLFNBQVMsQ0FBQyxjQUFYLENBQUE7SUFEYzs7K0JBR2hCLG9CQUFBLEdBQXNCLFNBQUMsS0FBRCxFQUFRLEdB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Q0FBZ0IsQ0FBQyxTQUFqQixDQUEyQixLQUEzQjtBQURGOztFQURnQjs7RUFJbEIsS0FBSyxDQUFDLGVBQU4sR0FBd0IsU0FBQyxNQUFEO0FBQ3RCLFFBQUE7QUFBQTtBQUFBO1NBQUEsc0NBQUE7O29CQUNFLEtBQUEsQ0FBTSxTQUFOLENBQWdCLENBQUMsZUFBakIsQ0FBQTtBQURGOztFQURzQjs7RUFJeEIsTUFBTSxDQUFDLE9BQVAsR0FBaUI7QUE3WGpCIiwic291cmNlc0NvbnRlbnQiOlsiXyA9IHJlcXVpcmUgJ3VuZGVyc2NvcmUtcGx1cydcbntSYW5nZSwgUG9pbnQsIERpc3Bvc2FibGV9ID0gcmVxdWlyZSAnYXRvbSdcbntcbiAgdHJhbnNsYXRlUG9pbnRBbmRDbGlwXG4gIGdldFJhbmdlQnlUcmFuc2xhdGVQb2ludEFuZENsaXBcbiAgc2hyaW5rUmFuZ2VFbmRUb0JlZm9yZU5ld0xpbmVcbiAgZ2V0Rmlyc3RDaGFyYWN0ZXJQb3NpdGlvbkZvckJ1ZmZlclJvd1xuICBnZXRFbmRPZkxpbmVGb3JCdWZmZXJSb3dcbiAgbGltaXROdW1iZXJcbn0gPSByZXF1aXJlICcuL3V0aWxzJ1xuXG5wcm9wZXJ0eVN0b3JlID0gbmV3IE1hcFxuXG5jbGFzcyBTZWxlY3Rpb25XcmFwcGVyXG4gIGNvbnN0cnVjdG9yOiAoQHNlbGVjdGlvbikgLT5cblxuICBoYXNQcm9wZXJ0aWVzOiAtPiBwcm9wZXJ0eVN0b3JlLmhhcyhAc2VsZWN0aW9uKVxuICBnZXRQcm9wZXJ0aWVzOiAtPiBwcm9wZXJ0eVN0b3JlLmdldChAc2VsZWN0aW9uKSA/IHt9XG4gIHNldFByb3BlcnRpZXM6IChwcm9wKSAtPiBwcm9wZXJ0eVN0b3JlLnNldChAc2VsZWN0aW9uLCBwcm9wKVxuICBjbGVhclByb3BlcnRpZXM6IC0+IHByb3BlcnR5U3RvcmUuZGVsZXRlKEBzZWxlY3Rpb24pXG5cbiAgc2V0QnVmZmVyUmFuZ2VTYWZlbHk6IChyYW5nZSwgb3B0aW9ucykgLT5cbiAgICBpZiByYW5nZVxuICAgICAgQHNldEJ1ZmZlclJhbmdlKHJhbmdlLCBvcHRpb25zKVxuXG4gIGdldEJ1ZmZlclJhbmdlOiAtPlxuICAgIEBzZWxlY3Rpb24uZ2V0QnVmZmVyUmFuZ2UoKVxuXG4gIGdldEJ1ZmZlclBvc2l0aW9uRm9yOiAod2hpY2gsIHtmcm9tUHJvcGVydHksIGFsbG93RmFsbGJhY2t9PXt9KSAtPlxuICAgIGZyb21Qcm9wZXJ0eSA/PSBmYWxzZVxuICAgIGFsbG93RmFsbGJhY2sgPz0gZmFsc2VcblxuICAgIGlmIGZyb21Qcm9wZXJ0eSBhbmQgKG5vdCBAaGFzUHJvcGVydGllcygpKSBhbmQgYWxsb3dGYWxsYmFja1xuICAgICAgZnJvbVByb3BlcnR5ID0gZmFsc2VcblxuICAgIGlmIGZyb21Qcm9wZXJ0eVxuICAgICAge2hlYWQsIHRhaWx9ID0gQGdldFByb3BlcnRpZXMoKVxuICAgICAgaWYgaGVhZC5pc0dyZWF0ZXJUaGFuT3JFcXVhbCh0YWlsKVxuICAgICAgICBbc3RhcnQsIGVuZF0gPSBbdGFpbCwgaGVhZF1cbiAgICAgIGVsc2VcbiAgICAgICAgW3N0YXJ0LCBlbmRdID0gW2hlYWQsIHRhaWxdXG4gICAgZWxzZVxuICAgICAge3N0YXJ0LCBlbmR9ID0gQHNlbGVjdGlvbi5nZXRCdWZmZXJSYW5nZSgpXG4gICAgICBoZWFkID0gQHNlbGVjdGlvbi5nZXRIZWFkQnVmZmVyUG9zaXRpb24oKVxuICAgICAgdGFpbCA9IEBzZWxlY3Rpb24uZ2V0VGFpbEJ1ZmZlclBvc2l0aW9uKClcblxuICAgIHN3aXRjaCB3aGljaFxuICAgICAgd2hlbiAnc3RhcnQnIHRoZW4gc3RhcnRcbiAgICAgIHdoZW4gJ2VuZCcgdGhlbiBlbmRcbiAgICAgIHdoZW4gJ2hlYWQnIHRoZW4gaGVhZFxuICAgICAgd2hlbiAndGFpbCcgdGhlbiB0YWlsXG5cbiAgIyBvcHRpb25zOiB7ZnJvbVByb3BlcnR5fVxuICBzZXRCdWZmZXJQb3NpdGlvblRvOiAod2hpY2gsIG9wdGlvbnMpIC0+XG4gICAgcG9pbnQgPSBAZ2V0QnVmZmVyUG9zaXRpb25Gb3Iod2hpY2gsIG9wdGlvbnMpXG4gICAgQHNlbGVjdGlvbi5jdXJzb3Iuc2V0QnVmZmVyUG9zaXRpb24ocG9pbnQpXG5cbiAgbWVyZ2VCdWZmZXJSYW5nZTogKHJhbmdlLCBvcHRpb24pIC0+XG4gICAgQHNldEJ1ZmZlclJhbmdlKEBnZXRCdWZmZXJSYW5nZSgpLnVuaW9uKHJhbmdlKSwgb3B0aW9uKVxuXG4gIGV4dGVuZFRvRU9MOiAtPlxuICAgIFtzdGFydFJvdywgZW5kUm93XSA9IEBzZWxlY3Rpb24uZ2V0QnVmZmVyUm93UmFuZ2UoKVxuICAgIGVuZFJvd1JhbmdlID0gQHNlbGVjdGlvbi5lZGl0b3IuYnVmZmVyUmFuZ2VGb3JCdWZmZXJSb3coZW5kUm93KVxuICAgIG5ld1JhbmdlID0gbmV3IFJhbmdlKEBnZXRCdWZmZXJSYW5nZSgpLnN0YXJ0LCBlbmRSb3dSYW5nZS5lbmQpXG4gICAgQHNldEJ1ZmZlclJhbmdlKG5ld1JhbmdlKVxuXG4gIHJldmVyc2U6IC0+XG4gICAgQHNldFJldmVyc2VkU3RhdGUobm90IEBzZWxlY3Rpb24uaXNSZXZlcnNlZCgpKVxuXG4gIHNldFJldmVyc2VkU3RhdGU6IChyZXZlcnNlZCkgLT5cbiAgICByZXR1cm4gaWYgQHNlbGVjdGlvbi5pc1JldmVyc2VkKCkgaXMgcmV2ZXJzZWRcbiAgICB7aGVhZCwgdGFpbH0gPSBAZ2V0UHJvcGVydGllcygpXG4gICAgaWYgaGVhZD8gYW5kIHRhaWw/XG4gICAgICBAc2V0UHJvcGVydGllcyhoZWFkOiB0YWlsLCB0YWlsOiBoZWFkKVxuXG4gICAgb3B0aW9ucyA9IHthdXRvc2Nyb2xsOiB0cnVlLCByZXZlcnNlZCwgcHJlc2VydmVGb2xkczogdHJ1ZX1cbiAgICBAc2V0QnVmZmVyUmFuZ2UoQGdldEJ1ZmZlclJhbmdlKCksIG9wdGlvbnMpXG5cbiAgZ2V0Um93czogLT5cbiAgICBbc3RhcnRSb3csIGVuZFJvd10gPSBAc2VsZWN0aW9uLmdldEJ1ZmZlclJvd1JhbmdlKClcbiAgICBbc3RhcnRSb3cuLmVuZFJvd11cblxuICBnZXRSb3dDb3VudDogLT5cbiAgICBAZ2V0Um93cygpLmxlbmd0aFxuXG4gIHNlbGVjdFJvd1JhbmdlOiAocm93UmFuZ2UpIC0+XG4gICAge2VkaXRvcn0gPSBAc2VsZWN0aW9uXG4gICAgW3N0YXJ0UmFuZ2UsIGVuZFJhbmdlXSA9IHJvd1JhbmdlLm1hcCAocm93KSAtPlxuICAgICAgZWRpdG9yLmJ1ZmZlclJhbmdlRm9yQnVmZmVyUm93KHJvdywgaW5jbHVkZU5ld2xpbmU6IHRydWUpXG4gICAgcmFuZ2UgPSBzdGFydFJhbmdlLnVuaW9uKGVuZFJhbmdlKVxuICAgIEBzZXRCdWZmZXJSYW5nZShyYW5nZSwgcHJlc2VydmVGb2xkczogdHJ1ZSlcblxuICAjIE5hdGl2ZSBzZWxlY3Rpb24uZXhwYW5kT3ZlckxpbmUgaXMgbm90IGF3YXJlIG9mIGFjdHVhbCByb3dSYW5nZSBvZiBzZWxlY3Rpb24uXG4gIGV4cGFuZE92ZXJMaW5lOiAoe3ByZXNlcnZlR29hbENvbHVtbn09e30pIC0+XG4gICAgaWYgcHJlc2VydmVHb2FsQ29sdW1uXG4gICAgICB7Z29hbENvbHVtbn0gPSBAc2VsZWN0aW9uLmN1cnNvclxuXG4gICAgQHNlbGVjdFJvd1JhbmdlKEBzZWxlY3Rpb24uZ2V0QnVmZmVyUm93UmFuZ2UoKSlcbiAgICBAc2VsZWN0aW9uLmN1cnNvci5nb2FsQ29sdW1uID0gZ29hbENvbHVtbiBpZiBnb2FsQ29sdW1uXG5cbiAgZ2V0Um93Rm9yOiAod2hlcmUpIC0+XG4gICAgW3N0YXJ0Um93LCBlbmRSb3ddID0gQHNlbGVjdGlvbi5nZXRCdWZmZXJSb3dSYW5nZSgpXG4gICAgaWYgQHNlbGVjdGlvbi5pc1JldmVyc2VkKClcbiAgICAgIFtoZWFkUm93LCB0YWlsUm93XSA9IFtzdGFydFJvdywgZW5kUm93XVxuICAgIGVsc2VcbiAgICAgIFtoZWFkUm93LCB0YWlsUm93XSA9IFtlbmRSb3csIHN0YXJ0Um93XVxuXG4gICAgc3dpdGNoIHdoZXJlXG4gICAgICB3aGVuICdzdGFydCcgdGhlbiBzdGFydFJvd1xuICAgICAgd2hlbiAnZW5kJyB0aGVuIGVuZFJvd1xuICAgICAgd2hlbiAnaGVhZCcgdGhlbiBoZWFkUm93XG4gICAgICB3aGVuICd0YWlsJyB0aGVuIHRhaWxSb3dcblxuICBnZXRIZWFkUm93OiAtPiBAZ2V0Um93Rm9yKCdoZWFkJylcbiAgZ2V0VGFpbFJvdzogLT4gQGdldFJvd0ZvcigndGFpbCcpXG4gIGdldFN0YXJ0Um93OiAtPiBAZ2V0Um93Rm9yKCdzdGFydCcpXG4gIGdldEVuZFJvdzogLT4gQGdldFJvd0ZvcignZW5kJylcblxuICBnZXRUYWlsQnVmZmVyUmFuZ2U6IC0+XG4gICAge2VkaXRvcn0gPSBAc2VsZWN0aW9uXG4gICAgdGFpbFBvaW50ID0gQHNlbGVjdGlvbi5nZXRUYWlsQnVmZmVyUG9zaXRpb24oKVxuICAgIGlmIEBzZWxlY3Rpb24uaXNSZXZlcnNlZCgpXG4gICAgICBwb2ludCA9IHRyYW5zbGF0ZVBvaW50QW5kQ2xpcChlZGl0b3IsIHRhaWxQb2ludCwgJ2JhY2t3YXJkJylcbiAgICAgIG5ldyBSYW5nZShwb2ludCwgdGFpbFBvaW50KVxuICAgIGVsc2VcbiAgICAgIHBvaW50ID0gdHJhbnNsYXRlUG9pbnRBbmRDbGlwKGVkaXRvciwgdGFpbFBvaW50LCAnZm9yd2FyZCcsIGhlbGxvOiAnd2hlbiBnZXR0aW5nIHRhaWxSYW5nZScpXG4gICAgICBuZXcgUmFuZ2UodGFpbFBvaW50LCBwb2ludClcblxuICBzYXZlUHJvcGVydGllczogLT5cbiAgICBwcm9wZXJ0aWVzID0gQGNhcHR1cmVQcm9wZXJ0aWVzKClcbiAgICB1bmxlc3MgQHNlbGVjdGlvbi5pc0VtcHR5KClcbiAgICAgICMgV2Ugc2VsZWN0IHJpZ2h0ZWQgaW4gdmlzdWFsLW1vZGUsIHRoaXMgdHJhbnNsYXRpb24gZGUtZWZmZWN0IHNlbGVjdC1yaWdodC1lZmZlY3RcbiAgICAgICMgc28gdGhhdCBhZnRlciByZXN0b3JpbmcgcHJlc2VydmVkIHBvcGVydHkgd2UgY2FuIGRvIGFjdGl2YXRlLXZpc3VhbCBtb2RlIHdpdGhvdXRcbiAgICAgICMgc3BlY2lhbCBjYXJlXG4gICAgICBlbmRQb2ludCA9IEBzZWxlY3Rpb24uZ2V0QnVmZmVyUmFuZ2UoKS5lbmQudHJhbnNsYXRlKFswLCAtMV0pXG4gICAgICBlbmRQb2ludCA9IEBzZWxlY3Rpb24uZWRpdG9yLmNsaXBCdWZmZXJQb3NpdGlvbihlbmRQb2ludClcbiAgICAgIGlmIEBzZWxlY3Rpb24uaXNSZXZlcnNlZCgpXG4gICAgICAgIHByb3BlcnRpZXMudGFpbCA9IGVuZFBvaW50XG4gICAgICBlbHNlXG4gICAgICAgIHByb3BlcnRpZXMuaGVhZCA9IGVuZFBvaW50XG4gICAgQHNldFByb3BlcnRpZXMocHJvcGVydGllcylcblxuICBzZXRXaXNlOiAodmFsdWUpIC0+XG4gICAgQHNhdmVQcm9wZXJ0aWVzKCkgdW5sZXNzIEBoYXNQcm9wZXJ0aWVzKClcbiAgICBwcm9wZXJ0aWVzID0gQGdldFByb3BlcnRpZXMoKVxuICAgIHByb3BlcnRpZXMud2lzZSA9IHZhbHVlXG5cbiAgZ2V0V2lzZTogLT5cbiAgICBAZ2V0UHJvcGVydGllcygpPy53aXNlID8gJ2NoYXJhY3Rlcndpc2UnXG5cbiAgYXBwbHlXaXNlOiAobmV3V2lzZSkgLT5cbiAgICAjIE5PVEU6XG4gICAgIyBNdXN0IGNhbGwgYWdhaW5zdCBub3JtYWxpemVkIHNlbGVjdGlvblxuICAgICMgRG9uJ3QgY2FsbCBub24tbm9ybWFsaXplZCBzZWxlY3Rpb25cblxuICAgIHN3aXRjaCBuZXdXaXNlXG4gICAgICB3aGVuICdjaGFyYWN0ZXJ3aXNlJ1xuICAgICAgICBAdHJhbnNsYXRlU2VsZWN0aW9uRW5kQW5kQ2xpcCgnZm9yd2FyZCcpXG4gICAgICAgIEBzYXZlUHJvcGVydGllcygpXG4gICAgICAgIEBzZXRXaXNlKCdjaGFyYWN0ZXJ3aXNlJylcbiAgICAgIHdoZW4gJ2xpbmV3aXNlJ1xuICAgICAgICBAY29tcGxlbWVudEdvYWxDb2x1bW4oKVxuICAgICAgICBAZXhwYW5kT3ZlckxpbmUocHJlc2VydmVHb2FsQ29sdW1uOiB0cnVlKVxuICAgICAgICBAc2V0V2lzZSgnbGluZXdpc2UnKVxuXG4gIGNvbXBsZW1lbnRHb2FsQ29sdW1uOiAtPlxuICAgIHVubGVzcyBAc2VsZWN0aW9uLmN1cnNvci5nb2FsQ29sdW1uP1xuICAgICAgY29sdW1uID0gQGdldEJ1ZmZlclBvc2l0aW9uRm9yKCdoZWFkJywgZnJvbVByb3BlcnR5OiB0cnVlLCBhbGxvd0ZhbGxiYWNrOiB0cnVlKS5jb2x1bW5cbiAgICAgIEBzZWxlY3Rpb24uY3Vyc29yLmdvYWxDb2x1bW4gPSBjb2x1bW5cblxuICAjIFtGSVhNRV1cbiAgIyBXaGVuIGBrZWVwQ29sdW1uT25TZWxlY3RUZXh0T2JqZWN0YCB3YXMgdHJ1ZSxcbiAgIyAgY3Vyc29yIG1hcmtlciBpbiB2TC1tb2RlIGV4Y2VlZCBFT0wgaWYgaW5pdGlhbCByb3cgaXMgbG9uZ2VyIHRoYW4gZW5kUm93IG9mXG4gICMgIHNlbGVjdGVkIHRleHQtb2JqZWN0LlxuICAjIFRvIGF2b2lkIHRoaXMgd2lyZWQgY3Vyc29yIHBvc2l0aW9uIHJlcHJlc2VudGF0aW9uLCB0aGlzIGZ1Y250aW9uIGNsaXBcbiAgIyAgc2VsZWN0aW9uIHByb3BlcnRpZXMgbm90IGV4Y2VlZHMgRU9MLlxuICAjIEJ1dCB0aGlzIHNob3VsZCBiZSB0ZW1wb3JhbCB3b3JrYXJvdW5kLCBkZXBlbmRpbmcgdGhpcyBraW5kIG9mIGFkLWhvYyBhZGp1c3RtZW50IGlzXG4gICMgYmFzaWNhbGx5IGJhZCBpbiB0aGUgbG9uZyBydW4uXG4gIGNsaXBQcm9wZXJ0aWVzVGlsbEVuZE9mTGluZTogLT5cbiAgICByZXR1cm4gdW5sZXNzIEBoYXNQcm9wZXJ0aWVzKClcblxuICAgIGVkaXRvciA9IEBzZWxlY3Rpb24uZWRpdG9yXG4gICAgaGVhZFJvd0VPTCA9IGdldEVuZE9mTGluZUZvckJ1ZmZlclJvdyhlZGl0b3IsIEBnZXRIZWFkUm93KCkpXG4gICAgdGFpbFJvd0VPTCA9IGdldEVuZE9mTGluZUZvckJ1ZmZlclJvdyhlZGl0b3IsIEBnZXRUYWlsUm93KCkpXG4gICAgaGVhZE1heENvbHVtbiA9IGxpbWl0TnVtYmVyKGhlYWRSb3dFT0wuY29sdW1uIC0gMSwgbWluOiAwKVxuICAgIHRhaWxNYXhDb2x1bW4gPSBsaW1pdE51bWJlcih0YWlsUm93RU9MLmNvbHVtbiAtIDEsIG1pbjogMClcblxuICAgIHByb3BlcnRpZXMgPSBAZ2V0UHJvcGVydGllcygpXG4gICAgaWYgcHJvcGVydGllcy5oZWFkLmNvbHVtbiA+IGhlYWRNYXhDb2x1bW5cbiAgICAgIHByb3BlcnRpZXMuaGVhZC5jb2x1bW4gPSBoZWFkTWF4Q29sdW1uXG5cbiAgICBpZiBwcm9wZXJ0aWVzLnRhaWwuY29sdW1uID4gdGFpbE1heENvbHVtblxuICAgICAgcHJvcGVydGllcy50YWlsLmNvbHVtbiA9IHRhaWxNYXhDb2x1bW5cblxuICBjYXB0dXJlUHJvcGVydGllczogLT5cbiAgICBoZWFkOiBAc2VsZWN0aW9uLmdldEhlYWRCdWZmZXJQb3NpdGlvbigpXG4gICAgdGFpbDogQHNlbGVjdGlvbi5nZXRUYWlsQnVmZmVyUG9zaXRpb24oKVxuXG4gIHNlbGVjdEJ5UHJvcGVydGllczogKHtoZWFkLCB0YWlsfSkgLT5cbiAgICAjIE5vIHByb2JsZW0gaWYgaGVhZCBpcyBncmVhdGVyIHRoYW4gdGFpbCwgUmFuZ2UgY29uc3RydWN0b3Igc3dhcCBzdGFydC9lbmQuXG4gICAgQHNldEJ1ZmZlclJhbmdlKFt0YWlsLCBoZWFkXSlcbiAgICBAc2V0UmV2ZXJzZWRTdGF0ZShoZWFkLmlzTGVzc1RoYW4odGFpbCkpXG5cbiAgIyBSZXR1cm4gdHJ1ZSBpZiBzZWxlY3Rpb24gd2FzIG5vbi1lbXB0eSBhbmQgbm9uLXJldmVyc2VkIHNlbGVjdGlvbi5cbiAgIyBFcXVpdmFsZW50IHRvIG5vdCBzZWxlY3Rpb24uaXNFbXB0eSgpIGFuZCBub3Qgc2VsZWN0aW9uLmlzUmV2ZXJzZWQoKVwiXG4gIGlzRm9yd2FyZGluZzogLT5cbiAgICBoZWFkID0gQHNlbGVjdGlvbi5nZXRIZWFkQnVmZmVyUG9zaXRpb24oKVxuICAgIHRhaWwgPSBAc2VsZWN0aW9uLmdldFRhaWxCdWZmZXJQb3NpdGlvbigpXG4gICAgaGVhZC5pc0dyZWF0ZXJUaGFuKHRhaWwpXG5cbiAgYXBwbHlDb2x1bW5Gcm9tUHJvcGVydGllczogLT5cbiAgICBzZWxlY3Rpb25Qcm9wZXJ0aWVzID0gQGdldFByb3BlcnRpZXMoKVxuICAgIHJldHVybiB1bmxlc3Mgc2VsZWN0aW9uUHJvcGVydGllcz9cbiAgICB7aGVhZCwgdGFpbH0gPSBzZWxlY3Rpb25Qcm9wZXJ0aWVzXG5cbiAgICBpZiBAc2VsZWN0aW9uLmlzUmV2ZXJzZWQoKVxuICAgICAgW3N0YXJ0LCBlbmRdID0gW2hlYWQsIHRhaWxdXG4gICAgZWxzZVxuICAgICAgW3N0YXJ0LCBlbmRdID0gW3RhaWwsIGhlYWRdXG4gICAgW3N0YXJ0LnJvdywgZW5kLnJvd10gPSBAc2VsZWN0aW9uLmdldEJ1ZmZlclJvd1JhbmdlKClcbiAgICBAd2l0aEtlZXBpbmdHb2FsQ29sdW1uID0+XG4gICAgICBAc2V0QnVmZmVyUmFuZ2UoW3N0YXJ0LCBlbmRdLCBwcmVzZXJ2ZUZvbGRzOiB0cnVlKVxuICAgICAgQHRyYW5zbGF0ZVNlbGVjdGlvbkVuZEFuZENsaXAoJ2JhY2t3YXJkJywgdHJhbnNsYXRlOiBmYWxzZSlcblxuICAjIE9ubHkgZm9yIHNldHRpbmcgYXV0b3Njcm9sbCBvcHRpb24gdG8gZmFsc2UgYnkgZGVmYXVsdFxuICBzZXRCdWZmZXJSYW5nZTogKHJhbmdlLCBvcHRpb25zPXt9KSAtPlxuICAgIHtrZWVwR29hbENvbHVtbn0gPSBvcHRpb25zXG4gICAgZGVsZXRlIG9wdGlvbnMua2VlcEdvYWxDb2x1bW5cbiAgICBvcHRpb25zLmF1dG9zY3JvbGwgPz0gZmFsc2VcbiAgICBzZXRCdWZmZXJSYW5nZSA9ID0+XG4gICAgICBAc2VsZWN0aW9uLnNldEJ1ZmZlclJhbmdlKHJhbmdlLCBvcHRpb25zKVxuXG4gICAgaWYga2VlcEdvYWxDb2x1bW5cbiAgICAgIEB3aXRoS2VlcGluZ0dvYWxDb2x1bW4oc2V0QnVmZmVyUmFuZ2UpXG4gICAgZWxzZVxuICAgICAgc2V0QnVmZmVyUmFuZ2UoKVxuXG4gICMgUmV0dXJuIG9yaWdpbmFsIHRleHRcbiAgcmVwbGFjZTogKHRleHQpIC0+XG4gICAgb3JpZ2luYWxUZXh0ID0gQHNlbGVjdGlvbi5nZXRUZXh0KClcbiAgICBAc2VsZWN0aW9uLmluc2VydFRleHQodGV4dClcbiAgICBvcmlnaW5hbFRleHRcblxuICBsaW5lVGV4dEZvckJ1ZmZlclJvd3M6IC0+XG4gICAge2VkaXRvcn0gPSBAc2VsZWN0aW9uXG4gICAgQGdldFJvd3MoKS5tYXAgKHJvdykgLT5cbiAgICAgIGVkaXRvci5saW5lVGV4dEZvckJ1ZmZlclJvdyhyb3cpXG5cbiAgbWFwVG9MaW5lVGV4dDogKGZuLCB7aW5jbHVkZU5ld2xpbmV9PXt9KSAtPlxuICAgIHtlZGl0b3J9ID0gQHNlbGVjdGlvblxuICAgIHRleHRGb3JSb3cgPSAocm93KSAtPlxuICAgICAgcmFuZ2UgPSBlZGl0b3IuYnVmZmVyUmFuZ2VGb3JCdWZmZXJSb3cocm93LCB7aW5jbHVkZU5ld2xpbmV9KVxuICAgICAgZWRpdG9yLmdldFRleHRJbkJ1ZmZlclJhbmdlKHJhbmdlKVxuXG4gICAgQGdldFJvd3MoKS5tYXAodGV4dEZvclJvdykubWFwKGZuKVxuXG4gIHRyYW5zbGF0ZTogKHN0YXJ0RGVsdGEsIGVuZERlbHRhPXN0YXJ0RGVsdGEsIG9wdGlvbnMpIC0+XG4gICAgbmV3UmFuZ2UgPSBAZ2V0QnVmZmVyUmFuZ2UoKS50cmFuc2xhdGUoc3RhcnREZWx0YSwgZW5kRGVsdGEpXG4gICAgQHNldEJ1ZmZlclJhbmdlKG5ld1JhbmdlLCBvcHRpb25zKVxuXG4gIGlzU2luZ2xlUm93OiAtPlxuICAgIFtzdGFydFJvdywgZW5kUm93XSA9IEBzZWxlY3Rpb24uZ2V0QnVmZmVyUm93UmFuZ2UoKVxuICAgIHN0YXJ0Um93IGlzIGVuZFJvd1xuXG4gIGlzTGluZXdpc2U6IC0+XG4gICAge3N0YXJ0LCBlbmR9ID0gQGdldEJ1ZmZlclJhbmdlKClcbiAgICAoc3RhcnQucm93IGlzbnQgZW5kLnJvdykgYW5kIChzdGFydC5jb2x1bW4gaXMgZW5kLmNvbHVtbiBpcyAwKVxuXG4gIGRldGVjdFZpc3VhbE1vZGVTdWJtb2RlOiAtPlxuICAgIGlmIEBzZWxlY3Rpb24uaXNFbXB0eSgpXG4gICAgICBudWxsXG4gICAgZWxzZSBpZiBAaXNMaW5ld2lzZSgpXG4gICAgICAnbGluZXdpc2UnXG4gICAgZWxzZVxuICAgICAgJ2NoYXJhY3Rlcndpc2UnXG5cbiAgd2l0aEtlZXBpbmdHb2FsQ29sdW1uOiAoZm4pIC0+XG4gICAge2dvYWxDb2x1bW59ID0gQHNlbGVjdGlvbi5jdXJzb3JcbiAgICB7c3RhcnQsIGVuZH0gPSBAZ2V0QnVmZmVyUmFuZ2UoKVxuICAgIGZuKClcbiAgICBAc2VsZWN0aW9uLmN1cnNvci5nb2FsQ29sdW1uID0gZ29hbENvbHVtbiBpZiBnb2FsQ29sdW1uP1xuXG4gICMgZGlyZWN0aW9uIG11c3QgYmUgb25lIG9mIFsnZm9yd2FyZCcsICdiYWNrd2FyZCddXG4gICMgb3B0aW9uczoge3RyYW5zbGF0ZTogdHJ1ZSBvciBmYWxzZX0gZGVmYXVsdCB0cnVlXG4gIHRyYW5zbGF0ZVNlbGVjdGlvbkVuZEFuZENsaXA6IChkaXJlY3Rpb24sIG9wdGlvbnMpIC0+XG4gICAgZWRpdG9yID0gQHNlbGVjdGlvbi5lZGl0b3JcbiAgICByYW5nZSA9IEBnZXRCdWZmZXJSYW5nZSgpXG4gICAgbmV3UmFuZ2UgPSBnZXRSYW5nZUJ5VHJhbnNsYXRlUG9pbnRBbmRDbGlwKGVkaXRvciwgcmFuZ2UsIFwiZW5kXCIsIGRpcmVjdGlvbiwgb3B0aW9ucylcbiAgICBAd2l0aEtlZXBpbmdHb2FsQ29sdW1uID0+XG4gICAgICBAc2V0QnVmZmVyUmFuZ2UobmV3UmFuZ2UsIHByZXNlcnZlRm9sZHM6IHRydWUpXG5cbiAgdHJhbnNsYXRlU2VsZWN0aW9uSGVhZEFuZENsaXA6IChkaXJlY3Rpb24sIG9wdGlvbnMpIC0+XG4gICAgZWRpdG9yID0gQHNlbGVjdGlvbi5lZGl0b3JcbiAgICB3aGljaCAgPSBpZiBAc2VsZWN0aW9uLmlzUmV2ZXJzZWQoKSB0aGVuICdzdGFydCcgZWxzZSAnZW5kJ1xuXG4gICAgcmFuZ2UgPSBAZ2V0QnVmZmVyUmFuZ2UoKVxuICAgIG5ld1JhbmdlID0gZ2V0UmFuZ2VCeVRyYW5zbGF0ZVBvaW50QW5kQ2xpcChlZGl0b3IsIHJhbmdlLCB3aGljaCwgZGlyZWN0aW9uLCBvcHRpb25zKVxuICAgIEB3aXRoS2VlcGluZ0dvYWxDb2x1bW4gPT5cbiAgICAgIEBzZXRCdWZmZXJSYW5nZShuZXdSYW5nZSwgcHJlc2VydmVGb2xkczogdHJ1ZSlcblxuICBzaHJpbmtFbmRUb0JlZm9yZU5ld0xpbmU6IC0+XG4gICAgbmV3UmFuZ2UgPSBzaHJpbmtSYW5nZUVuZFRvQmVmb3JlTmV3TGluZShAZ2V0QnVmZmVyUmFuZ2UoKSlcbiAgICBAc2V0QnVmZmVyUmFuZ2UobmV3UmFuZ2UpXG5cbiAgc2V0U3RhcnRUb0ZpcnN0Q2hhcmFjdGVyT2ZMaW5lOiAtPlxuICAgIHtzdGFydCwgZW5kfSA9IEBnZXRCdWZmZXJSYW5nZSgpXG4gICAgbmV3U3RhcnQgPSBnZXRGaXJzdENoYXJhY3RlclBvc2l0aW9uRm9yQnVmZmVyUm93KEBzZWxlY3Rpb24uZWRpdG9yLCBzdGFydC5yb3cpXG4gICAgbmV3UmFuZ2UgPSBuZXcgUmFuZ2UobmV3U3RhcnQsIGVuZClcbiAgICBAc2V0QnVmZmVyUmFuZ2UobmV3UmFuZ2UpXG5cbiAgIyBSZXR1cm4gc2VsZWN0aW9uIGV4dGVudCB0byByZXBsYXkgYmxvY2t3aXNlIHNlbGVjdGlvbiBvbiBgLmAgcmVwZWF0aW5nLlxuICBnZXRCbG9ja3dpc2VTZWxlY3Rpb25FeHRlbnQ6IC0+XG4gICAgaGVhZCA9IEBzZWxlY3Rpb24uZ2V0SGVhZEJ1ZmZlclBvc2l0aW9uKClcbiAgICB0YWlsID0gQHNlbGVjdGlvbi5nZXRUYWlsQnVmZmVyUG9zaXRpb24oKVxuICAgIG5ldyBQb2ludChoZWFkLnJvdyAtIHRhaWwucm93LCBoZWFkLmNvbHVtbiAtIHRhaWwuY29sdW1uKVxuXG4gIG5vcm1hbGl6ZTogLT5cbiAgICB1bmxlc3MgQHNlbGVjdGlvbi5pc0VtcHR5KClcbiAgICAgIHN3aXRjaCBAZ2V0V2lzZSgpXG4gICAgICAgIHdoZW4gJ2NoYXJhY3Rlcndpc2UnXG4gICAgICAgICAgQHRyYW5zbGF0ZVNlbGVjdGlvbkVuZEFuZENsaXAoJ2JhY2t3YXJkJylcbiAgICAgICAgd2hlbiAnbGluZXdpc2UnXG4gICAgICAgICAgQGFwcGx5Q29sdW1uRnJvbVByb3BlcnRpZXMoKVxuICAgICAgICB3aGVuICdibG9ja3dpc2UnXG4gICAgICAgICAgQHRyYW5zbGF0ZVNlbGVjdGlvbkVuZEFuZENsaXAoJ2JhY2t3YXJkJylcbiAgICBAY2xlYXJQcm9wZXJ0aWVzKClcblxuc3dyYXAgPSAoc2VsZWN0aW9uKSAtPlxuICBuZXcgU2VsZWN0aW9uV3JhcHBlcihzZWxlY3Rpb24pXG5cbnN3cmFwLnNldFJldmVyc2VkU3RhdGUgPSAoZWRpdG9yLCByZXZlcnNlZCkgLT5cbiAgZWRpdG9yLmdldFNlbGVjdGlvbnMoKS5mb3JFYWNoIChzZWxlY3Rpb24pIC0+XG4gICAgc3dyYXAoc2VsZWN0aW9uKS5zZXRSZXZlcnNlZFN0YXRlKHJldmVyc2VkKVxuXG5zd3JhcC5leHBhbmRPdmVyTGluZSA9IChlZGl0b3IsIG9wdGlvbnMpIC0+XG4gIGVkaXRvci5nZXRTZWxlY3Rpb25zKCkuZm9yRWFjaCAoc2VsZWN0aW9uKSAtPlxuICAgIHN3cmFwKHNlbGVjdGlvbikuZXhwYW5kT3ZlckxpbmUob3B0aW9ucylcblxuc3dyYXAucmV2ZXJzZSA9IChlZGl0b3IpIC0+XG4gIGVkaXRvci5nZXRTZWxlY3Rpb25zKCkuZm9yRWFjaCAoc2VsZWN0aW9uKSAtPlxuICAgIHN3cmFwKHNlbGVjdGlvbikucmV2ZXJzZSgpXG5cbnN3cmFwLmNsZWFyUHJvcGVydGllcyA9IChlZGl0b3IpIC0+XG4gIGVkaXRvci5nZXRTZWxlY3Rpb25zKCkuZm9yRWFjaCAoc2VsZWN0aW9uKSAtPlxuICAgIHN3cmFwKHNlbGVjdGlvbikuY2xlYXJQcm9wZXJ0aWVzKClcblxuc3dyYXAuZGV0ZWN0VmlzdWFsTW9kZVN1Ym1vZGUgPSAoZWRpdG9yKSAtPlxuICBzZWxlY3Rpb25zID0gZWRpdG9yLmdldFNlbGVjdGlvbnMoKVxuICByZXN1bHRzID0gKHN3cmFwKHNlbGVjdGlvbikuZGV0ZWN0VmlzdWFsTW9kZVN1Ym1vZGUoKSBmb3Igc2VsZWN0aW9uIGluIHNlbGVjdGlvbnMpXG5cbiAgaWYgcmVzdWx0cy5ldmVyeSgocikgLT4gciBpcyAnbGluZXdpc2UnKVxuICAgICdsaW5ld2lzZSdcbiAgZWxzZSBpZiByZXN1bHRzLnNvbWUoKHIpIC0+IHIgaXMgJ2NoYXJhY3Rlcndpc2UnKVxuICAgICdjaGFyYWN0ZXJ3aXNlJ1xuICBlbHNlXG4gICAgbnVsbFxuXG5zd3JhcC5zYXZlUHJvcGVydGllcyA9IChlZGl0b3IpIC0+XG4gIGZvciBzZWxlY3Rpb24gaW4gZWRpdG9yLmdldFNlbGVjdGlvbnMoKVxuICAgIHN3cmFwKHNlbGVjdGlvbikuc2F2ZVByb3BlcnRpZXMoKVxuXG5zd3JhcC5jb21wbGVtZW50R29hbENvbHVtbiA9IChlZGl0b3IpIC0+XG4gIGZvciBzZWxlY3Rpb24gaW4gZWRpdG9yLmdldFNlbGVjdGlvbnMoKVxuICAgIHN3cmFwKHNlbGVjdGlvbikuY29tcGxlbWVudEdvYWxDb2x1bW4oKVxuXG5zd3JhcC5ub3JtYWxpemUgPSAoZWRpdG9yKSAtPlxuICBmb3Igc2VsZWN0aW9uIGluIGVkaXRvci5nZXRTZWxlY3Rpb25zKClcbiAgICBzd3JhcChzZWxlY3Rpb24pLm5vcm1hbGl6ZSgpXG5cbnN3cmFwLnNldFdpc2UgPSAoZWRpdG9yLCB2YWx1ZSkgLT5cbiAgZm9yIHNlbGVjdGlvbiBpbiBlZGl0b3IuZ2V0U2VsZWN0aW9ucygpXG4gICAgc3dyYXAoc2VsZWN0aW9uKS5zZXRXaXNlKHZhbHVlKVxuXG5zd3JhcC5hcHBseVdpc2UgPSAoZWRpdG9yLCB2YWx1ZSkgLT5cbiAgZm9yIHNlbGVjdGlvbiBpbiBlZGl0b3IuZ2V0U2VsZWN0aW9ucygpXG4gICAgc3dyYXAoc2VsZWN0aW9uKS5hcHBseVdpc2UodmFsdWUpXG5cbnN3cmFwLmNsZWFyUHJvcGVydGllcyA9IChlZGl0b3IpIC0+XG4gIGZvciBzZWxlY3Rpb24gaW4gZWRpdG9yLmdldFNlbGVjdGlvbnMoKVxuICAgIHN3cmFwKHNlbGVjdGlvbikuY2xlYXJQcm9wZXJ0aWVzKClcblxubW9kdWxlLmV4cG9ydHMgPSBzd3JhcFxuIl19
