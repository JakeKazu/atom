(function() {
  var BlockwiseSelection, Range, _, getBufferRows, isEmpty, ref, sortRanges, swrap;

  Range = require('atom').Range;

  _ = require('underscore-plus');

  ref = require('./utils'), sortRanges = ref.sortRanges, getBufferRows = ref.getBufferRows, isEmpty = ref.isEmpty;

  swrap = require('./selection-wrapper');

  BlockwiseSelection = (function() {
    BlockwiseSelection.prototype.editor = null;

    BlockwiseSelection.prototype.selections = null;

    BlockwiseSelection.prototype.goalColumn = null;

    BlockwiseSelection.prototype.reversed = false;

    function BlockwiseSelection(selection) {
      var i, len, memberSelection, ref1;
      this.editor = selection.editor;
      this.initialize(selection);
      ref1 = this.getSelections();
      for (i = 0, len = ref1.length; i < len; i++) {
        memberSelection = ref1[i];
        swrap(memberSelection).saveProperties();
        swrap(memberSelection).setWise('blockwise');
      }
    }

    BlockwiseSelection.prototype.getSelections = function() {
      return this.selections;
    };

    BlockwiseSelection.prototype.isBlockwise = function() {
      return true;
    };

    BlockwiseSelection.prototype.isEmpty = function() {
      return this.getSelections().every(isEmpty);
    };

    BlockwiseSelection.prototype.initialize = function(selection) {
      var end, i, j, len, range, ranges, ref1, ref2, results, reversed, start, wasReversed;
      this.goalColumn = selection.cursor.goalColumn;
      this.selections = [selection];
      wasReversed = reversed = selection.isReversed();
      range = selection.getBufferRange();
      if (range.end.column === 0) {
        range.end.row -= 1;
      }
      if (this.goalColumn != null) {
        if (wasReversed) {
          range.start.column = this.goalColumn;
        } else {
          range.end.column = this.goalColumn + 1;
        }
      }
      if (range.start.column >= range.end.column) {
        reversed = !reversed;
        range = range.translate([0, 1], [0, -1]);
      }
      start = range.start, end = range.end;
      ranges = (function() {
        results = [];
        for (var i = ref1 = start.row, ref2 = end.row; ref1 <= ref2 ? i <= ref2 : i >= ref2; ref1 <= ref2 ? i++ : i--){ results.push(i); }
        return results;
      }).apply(this).map(function(row) {
        return [[row, start.column], [row, end.column]];
      });
      selection.setBufferRange(ranges.shift(), {
        reversed: reversed
      });
      for (j = 0, len = ranges.length; j < len; j++) {
        range = ranges[j];
        this.selections.push(this.editor.addSelectionForBufferRange(range, {
          reversed: reversed
        }));
      }
      if (wasReversed) {
        this.reverse();
      }
      return this.updateGoalColumn();
    };

    BlockwiseSelection.prototype.isReversed = function() {
      return this.reversed;
    };

    BlockwiseSelection.prototype.reverse = function() {
      return this.reversed = !this.reversed;
    };

    BlockwiseSelection.prototype.updateGoalColumn = function() {
      var i, len, ref1, results, selection;
      if (this.goalColumn != null) {
        ref1 = this.selections;
        results = [];
        for (i = 0, len = ref1.length; i < len; i++) {
          selection = ref1[i];
          results.push(selection.cursor.goalColumn = this.goalColumn);
        }
        return results;
      }
    };

    BlockwiseSelection.prototype.isSingleRow = function() {
      return this.selections.length === 1;
    };

    BlockwiseSelection.prototype.getHeight = function() {
      var endRow, ref1, startRow;
      ref1 = this.getBufferRowRange(), startRow = ref1[0], endRow = ref1[1];
      return (endRow - startRow) + 1;
    };

    BlockwiseSelection.prototype.getStartSelection = function() {
      return this.selections[0];
    };

    BlockwiseSelection.prototype.getEndSelection = function() {
      return _.last(this.selections);
    };

    BlockwiseSelection.prototype.getHeadSelection = function() {
      if (this.isReversed()) {
        return this.getStartSelection();
      } else {
        return this.getEndSelection();
      }
    };

    BlockwiseSelection.prototype.getTailSelection = function() {
      if (this.isReversed()) {
        return this.getEndSelection();
      } else {
        return this.getStartSelection();
      }
    };

    BlockwiseSelection.prototype.getHeadBufferPosition = function() {
      return this.getHeadSelection().getHeadBufferPosition();
    };

    BlockwiseSelection.prototype.getTailBufferPosition = function() {
      return this.getTailSelection().getTailBufferPosition();
    };

    BlockwiseSelection.prototype.getStartBufferPosition = function() {
      return this.getStartSelection().getBufferRange().start;
    };

    BlockwiseSelection.prototype.getEndBufferPosition = function() {
      return this.getEndSelection().getBufferRange().end;
    };

    BlockwiseSelection.prototype.getBufferRowRange = function() {
      var endRow, startRow;
      startRow = this.getStartSelection().getBufferRowRange()[0];
      endRow = this.getEndSelection().getBufferRowRange()[0];
      return [startRow, endRow];
    };

    BlockwiseSelection.prototype.headReversedStateIsInSync = function() {
      return this.isReversed() === this.getHeadSelection().isReversed();
    };

    BlockwiseSelection.prototype.setSelectedBufferRanges = function(ranges, arg) {
      var i, len, range, reversed;
      reversed = arg.reversed;
      sortRanges(ranges);
      range = ranges.shift();
      this.setHeadBufferRange(range, {
        reversed: reversed
      });
      for (i = 0, len = ranges.length; i < len; i++) {
        range = ranges[i];
        this.selections.push(this.editor.addSelectionForBufferRange(range, {
          reversed: reversed
        }));
      }
      return this.updateGoalColumn();
    };

    BlockwiseSelection.prototype.setPositionForSelections = function(which) {
      var i, len, ref1, results, selection;
      ref1 = this.selections;
      results = [];
      for (i = 0, len = ref1.length; i < len; i++) {
        selection = ref1[i];
        results.push(swrap(selection).setBufferPositionTo(which));
      }
      return results;
    };

    BlockwiseSelection.prototype.clearSelections = function(arg) {
      var except, i, len, ref1, results, selection;
      except = (arg != null ? arg : {}).except;
      ref1 = this.selections.slice();
      results = [];
      for (i = 0, len = ref1.length; i < len; i++) {
        selection = ref1[i];
        if (selection !== except) {
          results.push(this.removeSelection(selection));
        }
      }
      return results;
    };

    BlockwiseSelection.prototype.setHeadBufferPosition = function(point) {
      var head;
      head = this.getHeadSelection();
      this.clearSelections({
        except: head
      });
      return head.cursor.setBufferPosition(point);
    };

    BlockwiseSelection.prototype.removeEmptySelections = function() {
      var i, len, ref1, results, selection;
      ref1 = this.selections.slice();
      results = [];
      for (i = 0, len = ref1.length; i < len; i++) {
        selection = ref1[i];
        if (selection.isEmpty()) {
          results.push(this.removeSelection(selection));
        }
      }
      return results;
    };

    BlockwiseSelection.prototype.removeSelection = function(selection) {
      _.remove(this.selections, selection);
      return selection.destroy();
    };

    BlockwiseSelection.prototype.setHeadBufferRange = function(range, options) {
      var base, goalColumn, head;
      head = this.getHeadSelection();
      this.clearSelections({
        except: head
      });
      goalColumn = head.cursor.goalColumn;
      head.setBufferRange(range, options);
      if (goalColumn != null) {
        return (base = head.cursor).goalColumn != null ? base.goalColumn : base.goalColumn = goalColumn;
      }
    };

    BlockwiseSelection.prototype.getCharacterwiseProperties = function() {
      var end, head, ref1, ref2, start, tail;
      head = this.getHeadBufferPosition();
      tail = this.getTailBufferPosition();
      if (this.isReversed()) {
        ref1 = [head, tail], start = ref1[0], end = ref1[1];
      } else {
        ref2 = [tail, head], start = ref2[0], end = ref2[1];
      }
      if (!(this.isSingleRow() || this.headReversedStateIsInSync())) {
        start.column -= 1;
        end.column += 1;
      }
      return {
        head: head,
        tail: tail
      };
    };

    BlockwiseSelection.prototype.getBufferRange = function() {
      var end, start;
      if (this.headReversedStateIsInSync()) {
        start = this.getStartSelection.getBufferrange().start;
        end = this.getEndSelection.getBufferrange().end;
      } else {
        start = this.getStartSelection.getBufferrange().end.translate([0, -1]);
        end = this.getEndSelection.getBufferrange().start.translate([0, +1]);
      }
      return {
        start: start,
        end: end
      };
    };

    BlockwiseSelection.prototype.restoreCharacterwise = function() {
      var base, goalColumn, head, properties;
      if (this.isEmpty()) {
        return;
      }
      properties = this.getCharacterwiseProperties();
      head = this.getHeadSelection();
      this.clearSelections({
        except: head
      });
      goalColumn = head.cursor.goalColumn;
      swrap(head).selectByProperties(properties);
      if (head.getBufferRange().end.column === 0) {
        swrap(head).translateSelectionEndAndClip('forward');
      }
      if (goalColumn != null) {
        return (base = head.cursor).goalColumn != null ? base.goalColumn : base.goalColumn = goalColumn;
      }
    };

    BlockwiseSelection.prototype.autoscroll = function(options) {
      return this.getHeadSelection().autoscroll(options);
    };

    BlockwiseSelection.prototype.autoscrollIfReversed = function(options) {
      if (this.isReversed()) {
        return this.autoscroll(options);
      }
    };

    return BlockwiseSelection;

  })();

  module.exports = BlockwiseSelection;

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL2hvbWUvamFrZS8uYXRvbS9wYWNrYWdlcy92aW0tbW9kZS1wbHVzL2xpYi9ibG9ja3dpc2Utc2VsZWN0aW9uLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUFBLE1BQUE7O0VBQUMsUUFBUyxPQUFBLENBQVEsTUFBUjs7RUFDVixDQUFBLEdBQUksT0FBQSxDQUFRLGlCQUFSOztFQUVKLE1BQXVDLE9BQUEsQ0FBUSxTQUFSLENBQXZDLEVBQUMsMkJBQUQsRUFBYSxpQ0FBYixFQUE0Qjs7RUFDNUIsS0FBQSxHQUFRLE9BQUEsQ0FBUSxxQkFBUjs7RUFFRjtpQ0FDSixNQUFBLEdBQVE7O2lDQUNSLFVBQUEsR0FBWTs7aUNBQ1osVUFBQSxHQUFZOztpQ0FDWixRQUFBLEdBQVU7O0lBRUcsNEJBQUMsU0FBRDtBQUNYLFVBQUE7TUFBQyxJQUFDLENBQUEsU0FBVSxVQUFWO01BQ0YsSUFBQyxDQUFBLFVBQUQsQ0FBWSxTQUFaO0FBRUE7QUFBQSxXQUFBLHNDQUFBOztRQUNFLEtBQUEsQ0FBTSxlQUFOLENBQXNCLENBQUMsY0FBdkIsQ0FBQTtRQUNBLEtBQUEsQ0FBTSxlQUFOLENBQXNCLENBQUMsT0FBdkIsQ0FBK0IsV0FBL0I7QUFGRjtJQUpXOztpQ0FRYixhQUFBLEdBQWUsU0FBQTthQUNiLElBQUMsQ0FBQTtJQURZOztpQ0FHZixXQUFBLEdBQWEsU0FBQTthQUNYO0lBRFc7O2lDQUdiLE9BQUEsR0FBUyxTQUFBO2FBQ1AsSUFBQyxDQUFBLGFBQUQsQ0FBQSxDQUFnQixDQUFDLEtBQWpCLENBQXVCLE9BQXZCO0lBRE87O2lDQUdULFVBQUEsR0FBWSxTQUFDLFNBQUQ7QUFDVixVQUFBO01BQUMsSUFBQyxDQUFBLGFBQWMsU0FBUyxDQUFDLE9BQXhCO01BQ0YsSUFBQyxDQUFBLFVBQUQsR0FBYyxDQUFDLFNBQUQ7TUFDZCxXQUFBLEdBQWMsUUFBQSxHQUFXLFNBQVMsQ0FBQyxVQUFWLENBQUE7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ID0gcmVxdWlyZSAndW5kZXJzY29yZS1wbHVzJ1xuXG57c29ydFJhbmdlcywgZ2V0QnVmZmVyUm93cywgaXNFbXB0eX0gPSByZXF1aXJlICcuL3V0aWxzJ1xuc3dyYXAgPSByZXF1aXJlICcuL3NlbGVjdGlvbi13cmFwcGVyJ1xuXG5jbGFzcyBCbG9ja3dpc2VTZWxlY3Rpb25cbiAgZWRpdG9yOiBudWxsXG4gIHNlbGVjdGlvbnM6IG51bGxcbiAgZ29hbENvbHVtbjogbnVsbFxuICByZXZlcnNlZDogZmFsc2VcblxuICBjb25zdHJ1Y3RvcjogKHNlbGVjdGlvbikgLT5cbiAgICB7QGVkaXRvcn0gPSBzZWxlY3Rpb25cbiAgICBAaW5pdGlhbGl6ZShzZWxlY3Rpb24pXG5cbiAgICBmb3IgbWVtYmVyU2VsZWN0aW9uIGluIEBnZXRTZWxlY3Rpb25zKClcbiAgICAgIHN3cmFwKG1lbWJlclNlbGVjdGlvbikuc2F2ZVByb3BlcnRpZXMoKVxuICAgICAgc3dyYXAobWVtYmVyU2VsZWN0aW9uKS5zZXRXaXNlKCdibG9ja3dpc2UnKVxuXG4gIGdldFNlbGVjdGlvbnM6IC0+XG4gICAgQHNlbGVjdGlvbnNcblxuICBpc0Jsb2Nrd2lzZTogLT5cbiAgICB0cnVlXG5cbiAgaXNFbXB0eTogLT5cbiAgICBAZ2V0U2VsZWN0aW9ucygpLmV2ZXJ5KGlzRW1wdHkpXG5cbiAgaW5pdGlhbGl6ZTogKHNlbGVjdGlvbikgLT5cbiAgICB7QGdvYWxDb2x1bW59ID0gc2VsZWN0aW9uLmN1cnNvclxuICAgIEBzZWxlY3Rpb25zID0gW3NlbGVjdGlvbl1cbiAgICB3YXNSZXZlcnNlZCA9IHJldmVyc2VkID0gc2VsZWN0aW9uLmlzUmV2ZXJzZWQoKVxuXG4gICAgcmFuZ2UgPSBzZWxlY3Rpb24uZ2V0QnVmZmVyUmFuZ2UoKVxuICAgIGlmIHJhbmdlLmVuZC5jb2x1bW4gaXMgMFxuICAgICAgcmFuZ2UuZW5kLnJvdyAtPSAxXG5cbiAgICBpZiBAZ29hbENvbHVtbj9cbiAgICAgIGlmIHdhc1JldmVyc2VkXG4gICAgICAgIHJhbmdlLnN0YXJ0LmNvbHVtbiA9IEBnb2FsQ29sdW1uXG4gICAgICBlbHNlXG4gICAgICAgIHJhbmdlLmVuZC5jb2x1bW4gPSBAZ29hbENvbHVtbiArIDFcblxuICAgIGlmIHJhbmdlLnN0YXJ0LmNvbHVtbiA+PSByYW5nZS5lbmQuY29sdW1uXG4gICAgICByZXZlcnNlZCA9IG5vdCByZXZlcnNlZFxuICAgICAgcmFuZ2UgPSByYW5nZS50cmFuc2xhdGUoWzAsIDFdLCBbMCwgLTFdKVxuXG4gICAge3N0YXJ0LCBlbmR9ID0gcmFuZ2VcbiAgICByYW5nZXMgPSBbc3RhcnQucm93Li5lbmQucm93XS5tYXAgKHJvdykgLT5cbiAgICAgIFtbcm93LCBzdGFydC5jb2x1bW5dLCBbcm93LCBlbmQuY29sdW1uXV1cblxuICAgIHNlbGVjdGlvbi5zZXRCdWZmZXJSYW5nZShyYW5nZXMuc2hpZnQoKSwge3JldmVyc2VkfSlcbiAgICBmb3IgcmFuZ2UgaW4gcmFuZ2VzXG4gICAgICBAc2VsZWN0aW9ucy5wdXNoKEBlZGl0b3IuYWRkU2VsZWN0aW9uRm9yQnVmZmVyUmFuZ2UocmFuZ2UsIHtyZXZlcnNlZH0pKVxuICAgIEByZXZlcnNlKCkgaWYgd2FzUmV2ZXJzZWRcbiAgICBAdXBkYXRlR29hbENvbHVtbigpXG5cbiAgaXNSZXZlcnNlZDogLT5cbiAgICBAcmV2ZXJzZWRcblxuICByZXZlcnNlOiAtPlxuICAgIEByZXZlcnNlZCA9IG5vdCBAcmV2ZXJzZWRcblxuICB1cGRhdGVHb2FsQ29sdW1uOiAtPlxuICAgIGlmIEBnb2FsQ29sdW1uP1xuICAgICAgZm9yIHNlbGVjdGlvbiBpbiBAc2VsZWN0aW9uc1xuICAgICAgICBzZWxlY3Rpb24uY3Vyc29yLmdvYWxDb2x1bW4gPSBAZ29hbENvbHVtblxuXG4gIGlzU2luZ2xlUm93OiAtPlxuICAgIEBzZWxlY3Rpb25zLmxlbmd0aCBpcyAxXG5cbiAgZ2V0SGVpZ2h0OiAtPlxuICAgIFtzdGFydFJvdywgZW5kUm93XSA9IEBnZXRCdWZmZXJSb3dSYW5nZSgpXG4gICAgKGVuZFJvdyAtIHN0YXJ0Um93KSArIDFcblxuICBnZXRTdGFydFNlbGVjdGlvbjogLT5cbiAgICBAc2VsZWN0aW9uc1swXVxuXG4gIGdldEVuZFNlbGVjdGlvbjogLT5cbiAgICBfLmxhc3QoQHNlbGVjdGlvbnMpXG5cbiAgZ2V0SGVhZFNlbGVjdGlvbjogLT5cbiAgICBpZiBAaXNSZXZlcnNlZCgpXG4gICAgICBAZ2V0U3RhcnRTZWxlY3Rpb24oKVxuICAgIGVsc2VcbiAgICAgIEBnZXRFbmRTZWxlY3Rpb24oKVxuXG4gIGdldFRhaWxTZWxlY3Rpb246IC0+XG4gICAgaWYgQGlzUmV2ZXJzZWQoKVxuICAgICAgQGdldEVuZFNlbGVjdGlvbigpXG4gICAgZWxzZVxuICAgICAgQGdldFN0YXJ0U2VsZWN0aW9uKClcblxuICBnZXRIZWFkQnVmZmVyUG9zaXRpb246IC0+XG4gICAgQGdldEhlYWRTZWxlY3Rpb24oKS5nZXRIZWFkQnVmZmVyUG9zaXRpb24oKVxuXG4gIGdldFRhaWxCdWZmZXJQb3NpdGlvbjogLT5cbiAgICBAZ2V0VGFpbFNlbGVjdGlvbigpLmdldFRhaWxCdWZmZXJQb3NpdGlvbigpXG5cbiAgZ2V0U3RhcnRCdWZmZXJQb3NpdGlvbjogLT5cbiAgICBAZ2V0U3RhcnRTZWxlY3Rpb24oKS5nZXRCdWZmZXJSYW5nZSgpLnN0YXJ0XG5cbiAgZ2V0RW5kQnVmZmVyUG9zaXRpb246IC0+XG4gICAgQGdldEVuZFNlbGVjdGlvbigpLmdldEJ1ZmZlclJhbmdlKCkuZW5kXG5cbiAgZ2V0QnVmZmVyUm93UmFuZ2U6IC0+XG4gICAgc3RhcnRSb3cgPSBAZ2V0U3RhcnRTZWxlY3Rpb24oKS5nZXRCdWZmZXJSb3dSYW5nZSgpWzBdXG4gICAgZW5kUm93ID0gQGdldEVuZFNlbGVjdGlvbigpLmdldEJ1ZmZlclJvd1JhbmdlKClbMF1cbiAgICBbc3RhcnRSb3csIGVuZFJvd11cblxuICBoZWFkUmV2ZXJzZWRTdGF0ZUlzSW5TeW5jOiAtPlxuICAgIEBpc1JldmVyc2VkKCkgaXMgQGdldEhlYWRTZWxlY3Rpb24oKS5pc1JldmVyc2VkKClcblxuICAjIFtOT1RFXSBVc2VkIGJ5IHBsdWdpbiBwYWNrYWdlIHZtcDptb3ZlLXNlbGVjdGVkLXRleHRcbiAgc2V0U2VsZWN0ZWRCdWZmZXJSYW5nZXM6IChyYW5nZXMsIHtyZXZlcnNlZH0pIC0+XG4gICAgc29ydFJhbmdlcyhyYW5nZXMpXG4gICAgcmFuZ2UgPSByYW5nZXMuc2hpZnQoKVxuICAgIEBzZXRIZWFkQnVmZmVyUmFuZ2UocmFuZ2UsIHtyZXZlcnNlZH0pXG4gICAgZm9yIHJhbmdlIGluIHJhbmdlc1xuICAgICAgQHNlbGVjdGlvbnMucHVzaCBAZWRpdG9yLmFkZFNlbGVjdGlvbkZvckJ1ZmZlclJhbmdlKHJhbmdlLCB7cmV2ZXJzZWR9KVxuICAgIEB1cGRhdGVHb2FsQ29sdW1uKClcblxuICAjIHdoaWNoIG11c3Qgb25lIG9mIFsnc3RhcnQnLCAnZW5kJywgJ2hlYWQnLCAndGFpbCddXG4gIHNldFBvc2l0aW9uRm9yU2VsZWN0aW9uczogKHdoaWNoKSAtPlxuICAgIGZvciBzZWxlY3Rpb24gaW4gQHNlbGVjdGlvbnNcbiAgICAgIHN3cmFwKHNlbGVjdGlvbikuc2V0QnVmZmVyUG9zaXRpb25Ubyh3aGljaClcblxuICBjbGVhclNlbGVjdGlvbnM6ICh7ZXhjZXB0fT17fSkgLT5cbiAgICBmb3Igc2VsZWN0aW9uIGluIEBzZWxlY3Rpb25zLnNsaWNlKCkgd2hlbiAoc2VsZWN0aW9uIGlzbnQgZXhjZXB0KVxuICAgICAgQHJlbW92ZVNlbGVjdGlvbihzZWxlY3Rpb24pXG5cbiAgc2V0SGVhZEJ1ZmZlclBvc2l0aW9uOiAocG9pbnQpIC0+XG4gICAgaGVhZCA9IEBnZXRIZWFkU2VsZWN0aW9uKClcbiAgICBAY2xlYXJTZWxlY3Rpb25zKGV4Y2VwdDogaGVhZClcbiAgICBoZWFkLmN1cnNvci5zZXRCdWZmZXJQb3NpdGlvbihwb2ludClcblxuICByZW1vdmVFbXB0eVNlbGVjdGlvbnM6IC0+XG4gICAgZm9yIHNlbGVjdGlvbiBpbiBAc2VsZWN0aW9ucy5zbGljZSgpIHdoZW4gc2VsZWN0aW9uLmlzRW1wdHkoKVxuICAgICAgQHJlbW92ZVNlbGVjdGlvbihzZWxlY3Rpb24pXG5cbiAgcmVtb3ZlU2VsZWN0aW9uOiAoc2VsZWN0aW9uKSAtPlxuICAgIF8ucmVtb3ZlKEBzZWxlY3Rpb25zLCBzZWxlY3Rpb24pXG4gICAgc2VsZWN0aW9uLmRlc3Ryb3koKVxuXG4gIHNldEhlYWRCdWZmZXJSYW5nZTogKHJhbmdlLCBvcHRpb25zKSAtPlxuICAgIGhlYWQgPSBAZ2V0SGVhZFNlbGVjdGlvbigpXG4gICAgQGNsZWFyU2VsZWN0aW9ucyhleGNlcHQ6IGhlYWQpXG4gICAge2dvYWxDb2x1bW59ID0gaGVhZC5jdXJzb3JcbiAgICAjIFdoZW4gcmV2ZXJzZWQgc3RhdGUgb2Ygc2VsZWN0aW9uIGNoYW5nZSwgZ29hbENvbHVtbiBpcyBjbGVhcmVkLlxuICAgICMgQnV0IGhlcmUgZm9yIGJsb2Nrd2lzZSwgSSB3YW50IHRvIGtlZXAgZ29hbENvbHVtbiB1bmNoYW5nZWQuXG4gICAgIyBUaGlzIGJlaGF2aW9yIGlzIG5vdCBpZGVudGljYWwgdG8gcHVyZSBWaW0gSSBrbm93LlxuICAgICMgQnV0IEkgYmVsaWV2ZSB0aGlzIGlzIG1vcmUgdW5ub2lzeSBhbmQgbGVzcyBjb25mdXNpb24gd2hpbGUgbW92aW5nXG4gICAgIyBjdXJzb3IgaW4gdmlzdWFsLWJsb2NrIG1vZGUuXG4gICAgaGVhZC5zZXRCdWZmZXJSYW5nZShyYW5nZSwgb3B0aW9ucylcbiAgICBoZWFkLmN1cnNvci5nb2FsQ29sdW1uID89IGdvYWxDb2x1bW4gaWYgZ29hbENvbHVtbj9cblxuICBnZXRDaGFyYWN0ZXJ3aXNlUHJvcGVydGllczogLT5cbiAgICBoZWFkID0gQGdldEhlYWRCdWZmZXJQb3NpdGlvbigpXG4gICAgdGFpbCA9IEBnZXRUYWlsQnVmZmVyUG9zaXRpb24oKVxuXG4gICAgaWYgQGlzUmV2ZXJzZWQoKVxuICAgICAgW3N0YXJ0LCBlbmRdID0gW2hlYWQsIHRhaWxdXG4gICAgZWxzZVxuICAgICAgW3N0YXJ0LCBlbmRdID0gW3RhaWwsIGhlYWRdXG5cbiAgICB1bmxlc3MgKEBpc1NpbmdsZVJvdygpIG9yIEBoZWFkUmV2ZXJzZWRTdGF0ZUlzSW5TeW5jKCkpXG4gICAgICBzdGFydC5jb2x1bW4gLT0gMVxuICAgICAgZW5kLmNvbHVtbiArPSAxXG4gICAge2hlYWQsIHRhaWx9XG5cbiAgZ2V0QnVmZmVyUmFuZ2U6IC0+XG4gICAgaWYgQGhlYWRSZXZlcnNlZFN0YXRlSXNJblN5bmMoKVxuICAgICAgc3RhcnQgPSBAZ2V0U3RhcnRTZWxlY3Rpb24uZ2V0QnVmZmVycmFuZ2UoKS5zdGFydFxuICAgICAgZW5kID0gQGdldEVuZFNlbGVjdGlvbi5nZXRCdWZmZXJyYW5nZSgpLmVuZFxuICAgIGVsc2VcbiAgICAgIHN0YXJ0ID0gQGdldFN0YXJ0U2VsZWN0aW9uLmdldEJ1ZmZlcnJhbmdlKCkuZW5kLnRyYW5zbGF0ZShbMCwgLTFdKVxuICAgICAgZW5kID0gQGdldEVuZFNlbGVjdGlvbi5nZXRCdWZmZXJyYW5nZSgpLnN0YXJ0LnRyYW5zbGF0ZShbMCwgKzFdKVxuICAgIHtzdGFydCwgZW5kfVxuXG4gICMgW0ZJWE1FXSBkdXBsaWNhdGUgY29kZXMgd2l0aCBzZXRIZWFkQnVmZmVyUmFuZ2VcbiAgcmVzdG9yZUNoYXJhY3Rlcndpc2U6IC0+XG4gICAgIyBXaGVuIGFsbCBzZWxlY3Rpb24gaXMgZW1wdHksIHdlIGRvbid0IHdhbnQgdG8gbG9vc2UgbXVsdGktY3Vyc29yXG4gICAgIyBieSByZXN0b3JlaW5nIGNoYXJhY3Rlcndpc2UgcmFuZ2UuXG4gICAgcmV0dXJuIGlmIEBpc0VtcHR5KClcblxuICAgIHByb3BlcnRpZXMgPSBAZ2V0Q2hhcmFjdGVyd2lzZVByb3BlcnRpZXMoKVxuICAgIGhlYWQgPSBAZ2V0SGVhZFNlbGVjdGlvbigpXG4gICAgQGNsZWFyU2VsZWN0aW9ucyhleGNlcHQ6IGhlYWQpXG4gICAge2dvYWxDb2x1bW59ID0gaGVhZC5jdXJzb3JcbiAgICBzd3JhcChoZWFkKS5zZWxlY3RCeVByb3BlcnRpZXMocHJvcGVydGllcylcblxuICAgIGlmIGhlYWQuZ2V0QnVmZmVyUmFuZ2UoKS5lbmQuY29sdW1uIGlzIDBcbiAgICAgIHN3cmFwKGhlYWQpLnRyYW5zbGF0ZVNlbGVjdGlvbkVuZEFuZENsaXAoJ2ZvcndhcmQnKVxuXG4gICAgaGVhZC5jdXJzb3IuZ29hbENvbHVtbiA/PSBnb2FsQ29sdW1uIGlmIGdvYWxDb2x1bW4/XG5cbiAgYXV0b3Njcm9sbDogKG9wdGlvbnMpIC0+XG4gICAgQGdldEhlYWRTZWxlY3Rpb24oKS5hdXRvc2Nyb2xsKG9wdGlvbnMpXG5cbiAgYXV0b3Njcm9sbElmUmV2ZXJzZWQ6IChvcHRpb25zKSAtPlxuICAgICMgU2VlICM1NDYgY3Vyc29yIG91dC1vZi1zY3JlZW4gaXNzdWUgaGFwcGVucyBvbmx5IGluIHJldmVyc2VkLlxuICAgICMgU28gc2tpcCBoZXJlIGZvciBwZXJmb3JtYW5jZShidXQgZG9uJ3Qga25vdyBpZiBpdCdzIHdvcnRoKVxuICAgIEBhdXRvc2Nyb2xsKG9wdGlvbnMpIGlmIEBpc1JldmVyc2VkKClcblxubW9kdWxlLmV4cG9ydHMgPSBCbG9ja3dpc2VTZWxlY3Rpb25cbiJdfQ==
