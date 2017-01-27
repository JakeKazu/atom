(function() {
  var CompositeDisposable, Mutation, MutationManager, Point, ref, swrap;

  ref = require('atom'), Point = ref.Point, CompositeDisposable = ref.CompositeDisposable;

  swrap = require('./selection-wrapper');

  module.exports = MutationManager = (function() {
    function MutationManager(vimState) {
      this.vimState = vimState;
      this.editor = this.vimState.editor;
      this.disposables = new CompositeDisposable;
      this.disposables.add(this.vimState.onDidDestroy(this.destroy.bind(this)));
      this.markerLayer = this.editor.addMarkerLayer();
      this.mutationsBySelection = new Map;
      this.bufferRangesForCustomCheckpoint = [];
    }

    MutationManager.prototype.destroy = function() {
      var ref1, ref2;
      this.reset();
      ref1 = {}, this.mutationsBySelection = ref1.mutationsBySelection, this.editor = ref1.editor, this.vimState = ref1.vimState;
      return ref2 = {}, this.bufferRangesForCustomCheckpoint = ref2.bufferRangesForCustomCheckpoint, ref2;
    };

    MutationManager.prototype.init = function(options1) {
      this.options = options1;
      return this.reset();
    };

    MutationManager.prototype.reset = function() {
      this.clearMarkers();
      this.mutationsBySelection.clear();
      return this.bufferRangesForCustomCheckpoint = [];
    };

    MutationManager.prototype.clearMarkers = function(pattern) {
      var i, len, marker, ref1, results;
      ref1 = this.markerLayer.getMarkers();
      results = [];
      for (i = 0, len = ref1.length; i < len; i++) {
        marker = ref1[i];
        results.push(marker.destroy());
      }
      return results;
    };

    MutationManager.prototype.getInitialPointForSelection = function(selection, options) {
      var ref1;
      return (ref1 = this.getMutationForSelection(selection)) != null ? ref1.getInitialPoint(options) : void 0;
    };

    MutationManager.prototype.setCheckpoint = function(checkpoint) {
      var i, initialPoint, len, options, ref1, results, selection, useMarker;
      ref1 = this.editor.getSelections();
      results = [];
      for (i = 0, len = ref1.length; i < len; i++) {
        selection = ref1[i];
        if (this.mutationsBySelection.has(selection)) {
          results.push(this.mutationsBySelection.get(selection).update(checkpoint));
        } else {
          initialPoint = this.vimState.isMode('visual') ? swrap(selection).getBufferPositionFor('head', {
            fromProperty: true,
            allowFallback: true
          }) : !this.options.isSelect ? swrap(selection).getBufferPositionFor('head') : void 0;
          useMarker = this.options.useMarker;
          options = {
            selection: selection,
            initialPoint: initialPoint,
            checkpoint: checkpoint,
            markerLayer: this.markerLayer,
            useMarker: useMarker
          };
          results.push(this.mutationsBySelection.set(selection, new Mutation(options)));
        }
      }
      return results;
    };

    MutationManager.prototype.getMutationForSelection = function(selection) {
      return this.mutationsBySelection.get(selection);
    };

    MutationManager.prototype.getMarkerBufferRanges = function() {
      var ranges;
      ranges = [];
      this.mutationsBySelection.forEach(function(mutation, selection) {
        var range, ref1;
        if (range = (ref1 = mutation.marker) != null ? ref1.getBufferRange() : void 0) {
          return ranges.push(range);
        }
      });
      return ranges;
    };

    MutationManager.prototype.getBufferRangesForCheckpoint = function(checkpoint) {
      var ranges;
      if (checkpoint === 'custom') {
        return this.bufferRangesForCustomCheckpoint;
      }
      ranges = [];
      this.mutationsBySelection.forEach(function(mutation) {
        var range;
        if (range = mutation.getBufferRangeForCheckpoint(checkpoint)) {
          return ranges.push(range);
        }
      });
      return ranges;
    };

    MutationManager.prototype.setBufferRangesForCustomCheckpoint = function(ranges) {
      return this.bufferRangesForCustomCheckpoint = ranges;
    };

    MutationManager.prototype.restoreInitialPositions = function() {
      var i, len, point, ref1, results, selection;
      ref1 = this.editor.getSelections();
      results = [];
      for (i = 0, len = ref1.length; i < len; i++) {
        selection = ref1[i];
        if (point = this.getInitialPointForSelection(selection)) {
          results.push(selection.cursor.setBufferPosition(point));
        }
      }
      return results;
    };

    MutationManager.prototype.restoreCursorPositions = function(options) {
      var i, isBlockwise, j, len, len1, mutation, occurrenceSelected, point, points, ref1, ref2, ref3, results, results1, selection, stay;
      stay = options.stay, occurrenceSelected = options.occurrenceSelected, isBlockwise = options.isBlockwise;
      if (isBlockwise) {
        points = [];
        this.mutationsBySelection.forEach(function(mutation, selection) {
          var ref1;
          return points.push((ref1 = mutation.bufferRangeByCheckpoint['will-select']) != null ? ref1.start : void 0);
        });
        points = points.sort(function(a, b) {
          return a.compare(b);
        });
        points = points.filter(function(point) {
          return point != null;
        });
        if (this.vimState.isMode('visual', 'blockwise')) {
          if (point = points[0]) {
            return (ref1 = this.vimState.getLastBlockwiseSelection()) != null ? ref1.setHeadBufferPosition(point) : void 0;
          }
        } else {
          if (point = points[0]) {
            return this.editor.setCursorBufferPosition(point);
          } else {
            ref2 = this.editor.getSelections();
            results = [];
            for (i = 0, len = ref2.length; i < len; i++) {
              selection = ref2[i];
              if (!selection.isLastSelection()) {
                results.push(selection.destroy());
              } else {
                results.push(void 0);
              }
            }
            return results;
          }
        }
      } else {
        ref3 = this.editor.getSelections();
        results1 = [];
        for (j = 0, len1 = ref3.length; j < len1; j++) {
          selection = ref3[j];
          if (!(mutation = this.mutationsBySelection.get(selection))) {
            continue;
          }
          if (occurrenceSelected && !mutation.isCreatedAt('will-select')) {
            selection.destroy();
          }
          if (occurrenceSelected && stay) {
            point = this.clipToMutationEndIfSomeMutationContainsPoint(this.vimState.getOriginalCursorPosition());
            results1.push(selection.cursor.setBufferPosition(point));
          } else if (point = mutation.getRestorePoint({
            stay: stay
          })) {
            results1.push(selection.cursor.setBufferPosition(point));
          } else {
            results1.push(void 0);
          }
        }
        return results1;
      }
    };

    MutationManager.prototype.clipToMutationEndIfSomeMutationContainsPoint = function(point) {
      var mutation;
      if (mutation = this.findMutationContainsPointAtCheckpoint(point, 'did-select-occurrence')) {
        return Point.min(mutation.getEndBufferPosition(), point);
      } else {
        return point;
      }
    };

    MutationManager.prototype.findMutationContainsPointAtCheckpoint = function(point, checkpoint) {
      var entry, iterator, mutation;
      iterator = this.mutationsBySelection.values();
      while ((entry = iterator.next()) && !entry.done) {
        mutation = entry.value;
        if (mutation.getBufferRangeForCheckpoint(checkpoint).containsPoint(point)) {
          return mutation;
        }
      }
    };

    return MutationManager;

  })();

  Mutation = (function() {
    function Mutation(options) {
      var checkpoint;
      this.selection = options.selection, this.initialPoint = options.initialPoint, checkpoint = options.checkpoint, this.markerLayer = options.markerLayer, this.useMarker = options.useMarker;
      this.createdAt = checkpoint;
      if (this.useMarker) {
        this.initialPointMarker = this.markerLayer.markBufferPosition(this.initialPoint, {
          invalidate: 'never'
        });
      }
      this.bufferRangeByCheckpoint = {};
      this.marker = null;
      this.update(checkpoint);
    }

    Mutation.prototype.isCreatedAt = function(timing) {
      return this.createdAt === timing;
    };

    Mutation.prototype.update = function(checkpoint) {
      var ref1;
      if (!this.selection.getBufferRange().isEmpty()) {
        if ((ref1 = this.marker) != null) {
          ref1.destroy();
        }
        this.marker = null;
      }
      if (this.marker == null) {
        this.marker = this.markerLayer.markBufferRange(this.selection.getBufferRange(), {
          invalidate: 'never'
        });
      }
      return this.bufferRangeByCheckpoint[checkpoint] = this.marker.getBufferRange();
    };

    Mutation.prototype.getStartBufferPosition = function() {
      return this.marker.getBufferRange().start;
    };

    Mutation.prototype.getEndBufferPosition = function() {
      var end, point, ref1, start;
      ref1 = this.marker.getBufferRange(), start = ref1.start, end = ref1.end;
      point = Point.max(start, end.translate([0, -1]));
      return this.selection.editor.clipBufferPosition(point);
    };

    Mutation.prototype.getInitialPoint = function(arg) {
      var clip, point, ref1, ref2;
      clip = (arg != null ? arg : {}).clip;
      point = (ref1 = (ref2 = this.initialPointMarker) != null ? ref2.getHeadBufferPosition() : void 0) != null ? ref1 : this.initialPoint;
      if (clip) {
        return Point.min(this.getEndBufferPosition(), point);
      } else {
        return point;
      }
    };

    Mutation.prototype.getBufferRangeForCheckpoint = function(checkpoint) {
      return this.bufferRangeByCheckpoint[checkpoint];
    };

    Mutation.prototype.getRestorePoint = function(arg) {
      var ref1, ref2, ref3, stay;
      stay = (arg != null ? arg : {}).stay;
      if (stay) {
        return this.getInitialPoint({
          clip: true
        });
      } else {
        return (ref1 = (ref2 = this.bufferRangeByCheckpoint['did-move']) != null ? ref2.start : void 0) != null ? ref1 : (ref3 = this.bufferRangeByCheckpoint['did-select']) != null ? ref3.start : void 0;
      }
    };

    return Mutation;

  })();

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL2hvbWUvamFrZS8uYXRvbS9wYWNrYWdlcy92aW0tbW9kZS1wbHVzL2xpYi9tdXRhdGlvbi1tYW5hZ2VyLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUFBLE1BQUE7O0VBQUEsTUFBK0IsT0FBQSxDQUFRLE1BQVIsQ0FBL0IsRUFBQyxpQkFBRCxFQUFROztFQUNSLEtBQUEsR0FBUSxPQUFBLENBQVEscUJBQVI7O0VBYVIsTUFBTSxDQUFDLE9BQVAsR0FDTTtJQUNTLHlCQUFDLFFBQUQ7TUFBQyxJQUFDLENBQUEsV0FBRDtNQUNYLElBQUMsQ0FBQSxTQUFVLElBQUMsQ0FBQSxTQUFYO01BRUYsSUFBQyxDQUFBLFdBQUQsR0FBZSxJQUFJO01BQ25CLElBQUMsQ0FBQSxXQUFXLENBQUMsR0FBYixDQUFpQixJQUFDLENBQUEsUUFBUSxDQUFDLFlBQVYsQ0FBdUIsSUFBQyxDQUFBLE9BQU8sQ0FBQyxJQUFULENBQWMsSUFBZCxDQUF2QixDQUFqQjtNQUVBLElBQUMsQ0FBQSxXQUFELEdBQWUsSUFBQyxDQUFBLE1BQU0sQ0FBQyxjQUFSLENBQUE7TUFDZixJQUFDLENBQUEsb0JBQUQsR0FBd0IsSUFBSTtNQUM1QixJQUFDLENBQUEsK0JBQUQsR0FBbUM7SUFSeEI7OzhCQVViLE9BQUEsR0FBUyxTQUFBO0FBQ1AsVUFBQTtNQUFBLElBQUMsQ0FBQSxLQUFELENBQUE7TUFDQSxPQUE4QyxFQUE5QyxFQUFDLElBQUMsQ0FBQSw0QkFBQSxvQkFBRixFQUF3QixJQUFDLENBQUEsY0FBQSxNQUF6QixFQUFpQyxJQUFDLENBQUEsZ0JBQUE7YUFDbEMsT0FBcUMsRUFBckMsRUFBQyxJQUFDLENBQUEsdUNBQUEsK0JBQUYsRUFBQTtJQUhPOzs4QkFLVCxJQUFBLEdBQU0sU0FBQyxRQUFEO01BQUMsSUFBQyxDQUFBLFVBQUQ7YUFDTCxJQUFDLENBQUEsS0FBRCxDQUFBO0lBREk7OzhCQUdOLEtBQUEsR0FB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LE9BQWUsSUFBQyxDQUFBLE1BQU0sQ0FBQyxjQUFSLENBQUEsQ0FBZixFQUFDLGtCQUFELEVBQVE7TUFDUixLQUFBLEdBQVEsS0FBSyxDQUFDLEdBQU4sQ0FBVSxLQUFWLEVBQWlCLEdBQUcsQ0FBQyxTQUFKLENBQWMsQ0FBQyxDQUFELEVBQUksQ0FBQyxDQUFMLENBQWQsQ0FBakI7YUFDUixJQUFDLENBQUEsU0FBUyxDQUFDLE1BQU0sQ0FBQyxrQkFBbEIsQ0FBcUMsS0FBckM7SUFIb0I7O3VCQUt0QixlQUFBLEdBQWlCLFNBQUMsR0FBRDtBQUNmLFVBQUE7TUFEaUIsc0JBQUQsTUFBTztNQUN2QixLQUFBLDhHQUF1RCxJQUFDLENBQUE7TUFDeEQsSUFBRyxJQUFIO2VBQ0UsS0FBSyxDQUFDLEdBQU4sQ0FBVSxJQUFDLENBQUEsb0JBQUQsQ0FBQSxDQUFWLEVBQW1DLEtBQW5DLEVBREY7T0FBQSxNQUFBO2VBR0UsTUFIRjs7SUFGZTs7dUJBT2pCLDJCQUFBLEdBQTZCLFNBQUMsVUFBRDthQUMzQixJQUFDLENBQUEsdUJBQXdCLENBQUEsVUFBQTtJQURFOzt1QkFHN0IsZUFBQSxHQUFpQixTQUFDLEdBQUQ7QUFDZixVQUFBO01BRGlCLHNCQUFELE1BQU87TUFDdkIsSUFBRyxJQUFIO2VBQ0UsSUFBQyxDQUFBLGVBQUQsQ0FBaUI7VUFBQSxJQUFBLEVBQU0sSUFBTjtTQUFqQixFQURGO09BQUEsTUFBQTsyTEFHc0YsQ0FBRSxlQUh4Rjs7SUFEZTs7Ozs7QUF2TG5CIiwic291cmNlc0NvbnRlbnQiOlsie1BvaW50LCBDb21wb3NpdGVEaXNwb3NhYmxlfSA9IHJlcXVpcmUgJ2F0b20nXG5zd3JhcCA9IHJlcXVpcmUgJy4vc2VsZWN0aW9uLXdyYXBwZXInXG5cbiMga2VlcCBtdXRhdGlvbiBzbmFwc2hvdCBuZWNlc3NhcnkgZm9yIE9wZXJhdG9yIHByb2Nlc3NpbmcuXG4jIG11dGF0aW9uIHN0b3JlZCBieSBlYWNoIFNlbGVjdGlvbiBoYXZlIGZvbGxvd2luZyBmaWVsZFxuIyAgbWFya2VyOlxuIyAgICBtYXJrZXIgdG8gdHJhY2sgbXV0YXRpb24uIG1hcmtlciBpcyBjcmVhdGVkIHdoZW4gYHNldENoZWNrcG9pbnRgXG4jICBjcmVhdGVkQXQ6XG4jICAgICdzdHJpbmcnIHJlcHJlc2VudGluZyB3aGVuIG1hcmtlciB3YXMgY3JlYXRlZC5cbiMgIGNoZWNrcG9pbnQ6IHt9XG4jICAgIGtleSBpcyBbJ3dpbGwtc2VsZWN0JywgJ2RpZC1zZWxlY3QnLCAnd2lsbC1tdXRhdGUnLCAnZGlkLW11dGF0ZSddXG4jICAgIGtleSBpcyBjaGVja3BvaW50LCB2YWx1ZSBpcyBidWZmZXJSYW5nZSBmb3IgbWFya2VyIGF0IHRoYXQgY2hlY2twb2ludFxuIyAgc2VsZWN0aW9uOlxuIyAgICBTZWxlY3Rpb24gYmVlaW5nIHRyYWNrZWRcbm1vZHVsZS5leHBvcnRzID1cbmNsYXNzIE11dGF0aW9uTWFuYWdlclxuICBjb25zdHJ1Y3RvcjogKEB2aW1TdGF0ZSkgLT5cbiAgICB7QGVkaXRvcn0gPSBAdmltU3RhdGVcblxuICAgIEBkaXNwb3NhYmxlcyA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlXG4gICAgQGRpc3Bvc2FibGVzLmFkZCBAdmltU3RhdGUub25EaWREZXN0cm95KEBkZXN0cm95LmJpbmQodGhpcykpXG5cbiAgICBAbWFya2VyTGF5ZXIgPSBAZWRpdG9yLmFkZE1hcmtlckxheWVyKClcbiAgICBAbXV0YXRpb25zQnlTZWxlY3Rpb24gPSBuZXcgTWFwXG4gICAgQGJ1ZmZlclJhbmdlc0ZvckN1c3RvbUNoZWNrcG9pbnQgPSBbXVxuXG4gIGRlc3Ryb3k6IC0+XG4gICAgQHJlc2V0KClcbiAgICB7QG11dGF0aW9uc0J5U2VsZWN0aW9uLCBAZWRpdG9yLCBAdmltU3RhdGV9ID0ge31cbiAgICB7QGJ1ZmZlclJhbmdlc0ZvckN1c3RvbUNoZWNrcG9pbnR9ID0ge31cblxuICBpbml0OiAoQG9wdGlvbnMpIC0+XG4gICAgQHJlc2V0KClcblxuICByZXNldDogLT5cbiAgICBAY2xlYXJNYXJrZXJzKClcbiAgICBAbXV0YXRpb25zQnlTZWxlY3Rpb24uY2xlYXIoKVxuICAgIEBidWZmZXJSYW5nZXNGb3JDdXN0b21DaGVja3BvaW50ID0gW11cblxuICBjbGVhck1hcmtlcnM6IChwYXR0ZXJuKSAtPlxuICAgIGZvciBtYXJrZXIgaW4gQG1hcmtlckxheWVyLmdldE1hcmtlcnMoKVxuICAgICAgbWFya2VyLmRlc3Ryb3koKVxuXG4gIGdldEluaXRpYWxQb2ludEZvclNlbGVjdGlvbjogKHNlbGVjdGlvbiwgb3B0aW9ucykgLT5cbiAgICBAZ2V0TXV0YXRpb25Gb3JTZWxlY3Rpb24oc2VsZWN0aW9uKT8uZ2V0SW5pdGlhbFBvaW50KG9wdGlvbnMpXG5cbiAgc2V0Q2hlY2twb2ludDogKGNoZWNrcG9pbnQpIC0+XG4gICAgZm9yIHNlbGVjdGlvbiBpbiBAZWRpdG9yLmdldFNlbGVjdGlvbnMoKVxuICAgICAgaWYgQG11dGF0aW9uc0J5U2VsZWN0aW9uLmhhcyhzZWxlY3Rpb24pXG4gICAgICAgIEBtdXRhdGlvbnNCeVNlbGVjdGlvbi5nZXQoc2VsZWN0aW9uKS51cGRhdGUoY2hlY2twb2ludClcblxuICAgICAgZWxzZVxuICAgICAgICBpbml0aWFsUG9pbnQgPVxuICAgICAgICAgIGlmIEB2aW1TdGF0ZS5pc01vZGUoJ3Zpc3VhbCcpXG4gICAgICAgICAgICBzd3JhcChzZWxlY3Rpb24pLmdldEJ1ZmZlclBvc2l0aW9uRm9yKCdoZWFkJywgZnJvbVByb3BlcnR5OiB0cnVlLCBhbGxvd0ZhbGxiYWNrOiB0cnVlKVxuICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICMgW0ZJWE1FXSBpbnZlc3RpZ2F0ZSBXSFkgSSBkaWQ6IGluaXRpYWxQb2ludCBjYW4gYmUgbnVsbCB3aGVuIGlzU2VsZWN0IHdhcyB0cnVlXG4gICAgICAgICAgICBzd3JhcChzZWxlY3Rpb24pLmdldEJ1ZmZlclBvc2l0aW9uRm9yKCdoZWFkJykgdW5sZXNzIEBvcHRpb25zLmlzU2VsZWN0XG5cbiAgICAgICAge3VzZU1hcmtlcn0gPSBAb3B0aW9uc1xuICAgICAgICBvcHRpb25zID0ge3NlbGVjdGlvbiwgaW5pdGlhbFBvaW50LCBjaGVja3BvaW50LCBAbWFya2VyTGF5ZXIsIHVzZU1hcmtlcn1cbiAgICAgICAgQG11dGF0aW9uc0J5U2VsZWN0aW9uLnNldChzZWxlY3Rpb24sIG5ldyBNdXRhdGlvbihvcHRpb25zKSlcblxuICBnZXRNdXRhdGlvbkZvclNlbGVjdGlvbjogKHNlbGVjdGlvbikgLT5cbiAgICBAbXV0YXRpb25zQnlTZWxlY3Rpb24uZ2V0KHNlbGVjdGlvbilcblxuICBnZXRNYXJrZXJCdWZmZXJSYW5nZXM6IC0+XG4gICAgcmFuZ2VzID0gW11cbiAgICBAbXV0YXRpb25zQnlTZWxlY3Rpb24uZm9yRWFjaCAobXV0YXRpb24sIHNlbGVjdGlvbikgLT5cbiAgICAgIGlmIHJhbmdlID0gbXV0YXRpb24ubWFya2VyPy5nZXRCdWZmZXJSYW5nZSgpXG4gICAgICAgIHJhbmdlcy5wdXNoKHJhbmdlKVxuICAgIHJhbmdlc1xuXG4gIGdldEJ1ZmZlclJhbmdlc0ZvckNoZWNrcG9pbnQ6IChjaGVja3BvaW50KSAtPlxuICAgICMgW0ZJWE1FXSBkaXJ0eSB3b3JrYXJvdW5kIGp1c3QgdXNpbmcgbXV0YXRpb25NYW5hZ2VyIGFzIG1lcmVseSBzdGF0ZSByZWdpc3RyeVxuICAgIGlmIGNoZWNrcG9pbnQgaXMgJ2N1c3RvbSdcbiAgICAgIHJldHVybiBAYnVmZmVyUmFuZ2VzRm9yQ3VzdG9tQ2hlY2twb2ludFxuXG4gICAgcmFuZ2VzID0gW11cbiAgICBAbXV0YXRpb25zQnlTZWxlY3Rpb24uZm9yRWFjaCAobXV0YXRpb24pIC0+XG4gICAgICBpZiByYW5nZSA9IG11dGF0aW9uLmdldEJ1ZmZlclJhbmdlRm9yQ2hlY2twb2ludChjaGVja3BvaW50KVxuICAgICAgICByYW5nZXMucHVzaChyYW5nZSlcbiAgICByYW5nZXNcblxuICAjIFtGSVhNRV0gZGlydHkgd29ya2Fyb3VuZCBqdXN0IHVzaW5nIG11dGF0aW9ubWFuYWdlciBmb3Igc3RhdGUgcmVnaXN0cnlcbiAgc2V0QnVmZmVyUmFuZ2VzRm9yQ3VzdG9tQ2hlY2twb2ludDogKHJhbmdlcykgLT5cbiAgICBAYnVmZmVyUmFuZ2VzRm9yQ3VzdG9tQ2hlY2twb2ludCA9IHJhbmdlc1xuXG4gIHJlc3RvcmVJbml0aWFsUG9zaXRpb25zOiAtPlxuICAgIGZvciBzZWxlY3Rpb24gaW4gQGVkaXRvci5nZXRTZWxlY3Rpb25zKCkgd2hlbiBwb2ludCA9IEBnZXRJbml0aWFsUG9pbnRGb3JTZWxlY3Rpb24oc2VsZWN0aW9uKVxuICAgICAgc2VsZWN0aW9uLmN1cnNvci5zZXRCdWZmZXJQb3NpdGlvbihwb2ludClcblxuICByZXN0b3JlQ3Vyc29yUG9zaXRpb25zOiAob3B0aW9ucykgLT5cbiAgICB7c3RheSwgb2NjdXJyZW5jZVNlbGVjdGVkLCBpc0Jsb2Nrd2lzZX0gPSBvcHRpb25zXG4gICAgaWYgaXNCbG9ja3dpc2VcbiAgICAgICMgW0ZJWE1FXSB3aHkgSSBuZWVkIHRoaXMgZGlyZWN0IG1hbnVwaWxhdGlvbj9cbiAgICAgICMgQmVjYXVzZSB0aGVyZSdzIGJ1ZyB0aGF0IGJsb2Nrd2lzZSBzZWxlY2N0aW9uIGlzIG5vdCBhZGRlcyB0byBlYWNoXG4gICAgICAjIGJzSW5zdGFuY2Uuc2VsZWN0aW9uLiBOZWVkIGludmVzdGlnYXRpb24uXG4gICAgICBwb2ludHMgPSBbXVxuICAgICAgQG11dGF0aW9uc0J5U2VsZWN0aW9uLmZvckVhY2ggKG11dGF0aW9uLCBzZWxlY3Rpb24pIC0+XG4gICAgICAgIHBvaW50cy5wdXNoKG11dGF0aW9uLmJ1ZmZlclJhbmdlQnlDaGVja3BvaW50Wyd3aWxsLXNlbGVjdCddPy5zdGFydClcbiAgICAgIHBvaW50cyA9IHBvaW50cy5zb3J0IChhLCBiKSAtPiBhLmNvbXBhcmUoYilcbiAgICAgIHBvaW50cyA9IHBvaW50cy5maWx0ZXIgKHBvaW50KSAtPiBwb2ludD9cbiAgICAgIGlmIEB2aW1TdGF0ZS5pc01vZGUoJ3Zpc3VhbCcsICdibG9ja3dpc2UnKVxuICAgICAgICBpZiBwb2ludCA9IHBvaW50c1swXVxuICAgICAgICAgIEB2aW1TdGF0ZS5nZXRMYXN0QmxvY2t3aXNlU2VsZWN0aW9uKCk/LnNldEhlYWRCdWZmZXJQb3NpdGlvbihwb2ludClcbiAgICAgIGVsc2VcbiAgICAgICAgaWYgcG9pbnQgPSBwb2ludHNbMF1cbiAgICAgICAgICBAZWRpdG9yLnNldEN1cnNvckJ1ZmZlclBvc2l0aW9uKHBvaW50KVxuICAgICAgICBlbHNlXG4gICAgICAgICAgZm9yIHNlbGVjdGlvbiBpbiBAZWRpdG9yLmdldFNlbGVjdGlvbnMoKVxuICAgICAgICAgICAgc2VsZWN0aW9uLmRlc3Ryb3koKSB1bmxlc3Mgc2VsZWN0aW9uLmlzTGFzdFNlbGVjdGlvbigpXG4gICAgZWxzZVxuICAgICAgZm9yIHNlbGVjdGlvbiBpbiBAZWRpdG9yLmdldFNlbGVjdGlvbnMoKSB3aGVuIG11dGF0aW9uID0gQG11dGF0aW9uc0J5U2VsZWN0aW9uLmdldChzZWxlY3Rpb24pXG4gICAgICAgIGlmIG9jY3VycmVuY2VTZWxlY3RlZCBhbmQgbm90IG11dGF0aW9uLmlzQ3JlYXRlZEF0KCd3aWxsLXNlbGVjdCcpXG4gICAgICAgICAgc2VsZWN0aW9uLmRlc3Ryb3koKVxuXG4gICAgICAgIGlmIG9jY3VycmVuY2VTZWxlY3RlZCBhbmQgc3RheVxuICAgICAgICAgICMgVGhpcyBpcyBlc3NlbmNpYWxseSB0byBjbGlwVG9NdXRhdGlvbkVuZCB3aGVuIGBkIG8gZmAsIGBkIG8gcGAgY2FzZS5cbiAgICAgICAgICBwb2ludCA9IEBjbGlwVG9NdXRhdGlvbkVuZElmU29tZU11dGF0aW9uQ29udGFpbnNQb2ludChAdmltU3RhdGUuZ2V0T3JpZ2luYWxDdXJzb3JQb3NpdGlvbigpKVxuICAgICAgICAgIHNlbGVjdGlvbi5jdXJzb3Iuc2V0QnVmZmVyUG9zaXRpb24ocG9pbnQpXG4gICAgICAgIGVsc2UgaWYgcG9pbnQgPSBtdXRhdGlvbi5nZXRSZXN0b3JlUG9pbnQoe3N0YXl9KVxuICAgICAgICAgIHNlbGVjdGlvbi5jdXJzb3Iuc2V0QnVmZmVyUG9zaXRpb24ocG9pbnQpXG5cbiAgY2xpcFRvTXV0YXRpb25FbmRJZlNvbWVNdXRhdGlvbkNvbnRhaW5zUG9pbnQ6IChwb2ludCkgLT5cbiAgICBpZiBtdXRhdGlvbiA9IEBmaW5kTXV0YXRpb25Db250YWluc1BvaW50QXRDaGVja3BvaW50KHBvaW50LCAnZGlkLXNlbGVjdC1vY2N1cnJlbmNlJylcbiAgICAgIFBvaW50Lm1pbihtdXRhdGlvbi5nZXRFbmRCdWZmZXJQb3NpdGlvbigpLCBwb2ludClcbiAgICBlbHNlXG4gICAgICBwb2ludFxuXG4gIGZpbmRNdXRhdGlvbkNvbnRhaW5zUG9pbnRBdENoZWNrcG9pbnQ6IChwb2ludCwgY2hlY2twb2ludCkgLT5cbiAgICAjIENvZmZlZXNjcmlwdCBjYW5ub3QgaXRlcmF0ZSBvdmVyIGl0ZXJhdG9yIGJ5IEphdmFTY3JpcHQncyAnb2YnIGJlY2F1c2Ugb2Ygc3ludGF4IGNvbmZsaWN0cy5cbiAgICBpdGVyYXRvciA9IEBtdXRhdGlvbnNCeVNlbGVjdGlvbi52YWx1ZXMoKVxuICAgIHdoaWxlIChlbnRyeSA9IGl0ZXJhdG9yLm5leHQoKSkgYW5kIG5vdCBlbnRyeS5kb25lXG4gICAgICBtdXRhdGlvbiA9IGVudHJ5LnZhbHVlXG4gICAgICBpZiBtdXRhdGlvbi5nZXRCdWZmZXJSYW5nZUZvckNoZWNrcG9pbnQoY2hlY2twb2ludCkuY29udGFpbnNQb2ludChwb2ludClcbiAgICAgICAgcmV0dXJuIG11dGF0aW9uXG5cbiMgTXV0YXRpb24gaW5mb3JtYXRpb24gaXMgY3JlYXRlZCBldmVuIGlmIHNlbGVjdGlvbi5pc0VtcHR5KClcbiMgU28gdGhhdCB3ZSBjYW4gZmlsdGVyIHNlbGVjdGlvbiBieSB3aGVuIGl0IHdhcyBjcmVhdGVkLlxuIyAgZS5nLiBTb21lIHNlbGVjdGlvbiBpcyBjcmVhdGVkIGF0ICd3aWxsLXNlbGVjdCcgY2hlY2twb2ludCwgb3RoZXJzIGF0ICdkaWQtc2VsZWN0JyBvciAnZGlkLXNlbGVjdC1vY2N1cnJlbmNlJ1xuY2xhc3MgTXV0YXRpb25cbiAgY29uc3RydWN0b3I6IChvcHRpb25zKSAtPlxuICAgIHtAc2VsZWN0aW9uLCBAaW5pdGlhbFBvaW50LCBjaGVja3BvaW50LCBAbWFya2VyTGF5ZXIsIEB1c2VNYXJrZXJ9ID0gb3B0aW9uc1xuXG4gICAgQGNyZWF0ZWRBdCA9IGNoZWNrcG9pbnRcbiAgICBpZiBAdXNlTWFya2VyXG4gICAgICBAaW5pdGlhbFBvaW50TWFya2VyID0gQG1hcmtlckxheWVyLm1hcmtCdWZmZXJQb3NpdGlvbihAaW5pdGlhbFBvaW50LCBpbnZhbGlkYXRlOiAnbmV2ZXInKVxuICAgIEBidWZmZXJSYW5nZUJ5Q2hlY2twb2ludCA9IHt9XG4gICAgQG1hcmtlciA9IG51bGxcbiAgICBAdXBkYXRlKGNoZWNrcG9pbnQpXG5cbiAgaXNDcmVhdGVkQXQ6ICh0aW1pbmcpIC0+XG4gICAgQGNyZWF0ZWRBdCBpcyB0aW1pbmdcblxuICB1cGRhdGU6IChjaGVja3BvaW50KSAtPlxuICAgICMgQ3VycmVudCBub24tZW1wdHkgc2VsZWN0aW9uIGlzIHByaW9yaXRpemVkIG92ZXIgZXhpc3RpbmcgbWFya2VyJ3MgcmFuZ2UuXG4gICAgIyBXZSBpbnZhbGlkYXRlIG9sZCBtYXJrZXIgdG8gcmUtdHJhY2sgZnJvbSBjdXJyZW50IHNlbGVjdGlvbi5cbiAgICB1bmxlc3MgQHNlbGVjdGlvbi5nZXRCdWZmZXJSYW5nZSgpLmlzRW1wdHkoKVxuICAgICAgQG1hcmtlcj8uZGVzdHJveSgpXG4gICAgICBAbWFya2VyID0gbnVsbFxuXG4gICAgQG1hcmtlciA/PSBAbWFya2VyTGF5ZXIubWFya0J1ZmZlclJhbmdlKEBzZWxlY3Rpb24uZ2V0QnVmZmVyUmFuZ2UoKSwgaW52YWxpZGF0ZTogJ25ldmVyJylcbiAgICBAYnVmZmVyUmFuZ2VCeUNoZWNrcG9pbnRbY2hlY2twb2ludF0gPSBAbWFya2VyLmdldEJ1ZmZlclJhbmdlKClcblxuICBnZXRTdGFydEJ1ZmZlclBvc2l0aW9uOiAtPlxuICAgIEBtYXJrZXIuZ2V0QnVmZmVyUmFuZ2UoKS5zdGFydFxuXG4gIGdldEVuZEJ1ZmZlclBvc2l0aW9uOiAtPlxuICAgIHtzdGFydCwgZW5kfSA9IEBtYXJrZXIuZ2V0QnVmZmVyUmFuZ2UoKVxuICAgIHBvaW50ID0gUG9pbnQubWF4KHN0YXJ0LCBlbmQudHJhbnNsYXRlKFswLCAtMV0pKVxuICAgIEBzZWxlY3Rpb24uZWRpdG9yLmNsaXBCdWZmZXJQb3NpdGlvbihwb2ludClcblxuICBnZXRJbml0aWFsUG9pbnQ6ICh7Y2xpcH09e30pIC0+XG4gICAgcG9pbnQgPSBAaW5pdGlhbFBvaW50TWFya2VyPy5nZXRIZWFkQnVmZmVyUG9zaXRpb24oKSA/IEBpbml0aWFsUG9pbnRcbiAgICBpZiBjbGlwXG4gICAgICBQb2ludC5taW4oQGdldEVuZEJ1ZmZlclBvc2l0aW9uKCksIHBvaW50KVxuICAgIGVsc2VcbiAgICAgIHBvaW50XG5cbiAgZ2V0QnVmZmVyUmFuZ2VGb3JDaGVja3BvaW50OiAoY2hlY2twb2ludCkgLT5cbiAgICBAYnVmZmVyUmFuZ2VCeUNoZWNrcG9pbnRbY2hlY2twb2ludF1cblxuICBnZXRSZXN0b3JlUG9pbnQ6ICh7c3RheX09e30pIC0+XG4gICAgaWYgc3RheVxuICAgICAgQGdldEluaXRpYWxQb2ludChjbGlwOiB0cnVlKVxuICAgIGVsc2VcbiAgICAgIEBidWZmZXJSYW5nZUJ5Q2hlY2twb2ludFsnZGlkLW1vdmUnXT8uc3RhcnQgPyBAYnVmZmVyUmFuZ2VCeUNoZWNrcG9pbnRbJ2RpZC1zZWxlY3QnXT8uc3RhcnRcbiJdfQ==
