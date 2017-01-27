(function() {
  var FlashManager, _, flashTypes, isNotEmpty,
    slice = [].slice;

  _ = require('underscore-plus');

  isNotEmpty = require('./utils').isNotEmpty;

  flashTypes = {
    operator: {
      allowMultiple: true,
      decorationOptions: {
        type: 'highlight',
        "class": 'vim-mode-plus-flash operator'
      }
    },
    'operator-long': {
      allowMultiple: true,
      decorationOptions: {
        type: 'highlight',
        "class": 'vim-mode-plus-flash operator-long'
      }
    },
    'operator-occurrence': {
      allowMultiple: true,
      decorationOptions: {
        type: 'highlight',
        "class": 'vim-mode-plus-flash operator-occurrence'
      }
    },
    'operator-remove-occurrence': {
      allowMultiple: true,
      decorationOptions: {
        type: 'highlight',
        "class": 'vim-mode-plus-flash operator-remove-occurrence'
      }
    },
    search: {
      allowMultiple: false,
      decorationOptions: {
        type: 'highlight',
        "class": 'vim-mode-plus-flash search'
      }
    },
    screen: {
      allowMultiple: true,
      decorationOptions: {
        type: 'highlight',
        "class": 'vim-mode-plus-flash screen'
      }
    },
    'undo-redo': {
      allowMultiple: true,
      decorationOptions: {
        type: 'highlight',
        "class": 'vim-mode-plus-flash undo-redo'
      }
    },
    'undo-redo-multiple-changes': {
      allowMultiple: true,
      decorationOptions: {
        type: 'highlight',
        "class": 'vim-mode-plus-flash undo-redo-multiple-changes'
      }
    },
    'undo-redo-multiple-delete': {
      allowMultiple: true,
      decorationOptions: {
        type: 'highlight',
        "class": 'vim-mode-plus-flash undo-redo-multiple-delete'
      }
    },
    'screen-line': {
      allowMultiple: false,
      decorationOptions: {
        type: 'line',
        "class": 'vim-mode-plus-flash-screen-line'
      }
    }
  };

  module.exports = FlashManager = (function() {
    function FlashManager(vimState) {
      this.vimState = vimState;
      this.editor = this.vimState.editor;
      this.markersByType = new Map;
      this.vimState.onDidDestroy(this.destroy.bind(this));
    }

    FlashManager.prototype.destroy = function() {
      this.markersByType.forEach(function(markers) {
        var i, len, marker, results;
        results = [];
        for (i = 0, len = markers.length; i < len; i++) {
          marker = markers[i];
          results.push(marker.destroy());
        }
        return results;
      });
      return this.markersByType.clear();
    };

    FlashManager.prototype.flash = function(ranges, options, rangeType) {
      var allowMultiple, decorationOptions, i, j, len, len1, marker, markerOptions, markers, range, ref, ref1, timeout, type;
      if (rangeType == null) {
        rangeType = 'buffer';
      }
      if (!_.isArray(ranges)) {
        ranges = [ranges];
      }
      ranges = ranges.filter(isNotEmpty);
      if (!ranges.length) {
        return null;
      }
      type = options.type, timeout = options.timeout;
      if (timeout == null) {
        timeout = 1000;
      }
      ref = flashTypes[type], allowMultiple = ref.allowMultiple, decorationOptions = ref.decorationOptions;
      markerOptions = {
        invalidate: 'touch'
      };
      switch (rangeType) {
        case 'buffer':
          markers = (function() {
            var i, len, results;
            results = [];
            for (i = 0, len = ranges.length; i < len; i++) {
              range = ranges[i];
              results.push(this.editor.markBufferRange(range, markerOptions));
            }
            return results;
          }).call(this);
          break;
        case 'screen':
          markers = (function() {
            var i, len, results;
            results = [];
            for (i = 0, len = ranges.length; i < len; i++) {
              range = ranges[i];
              results.push(this.editor.markScreenRange(range, markerOptions));
            }
            return results;
          }).call(this);
      }
      if (!allowMultiple) {
        if (this.markersByType.has(type)) {
          ref1 = this.markersByType.get(type);
          for (i = 0, len = ref1.length; i < len; i++) {
            marker = ref1[i];
            marker.destroy();
          }
        }
        this.markersByType.set(type, markers);
      }
      for (j = 0, len1 = markers.length; j < len1; j++) {
        marker = markers[j];
        this.editor.decorateMarker(marker, decorationOptions);
      }
      return setTimeout(function() {
        var k, len2, results;
        results = [];
        for (k = 0, len2 = markers.length; k < len2; k++) {
          marker = markers[k];
          results.push(marker.destroy());
        }
        return results;
      }, timeout);
    };

    FlashManager.prototype.flashScreenRange = function() {
      var args;
      args = 1 <= arguments.length ? slice.call(arguments, 0) : [];
      return this.flash.apply(this, args.concat('screen'));
    };

    return FlashManager;

  })();

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL2hvbWUvamFrZS8uYXRvbS9wYWNrYWdlcy92aW0tbW9kZS1wbHVzL2xpYi9mbGFzaC1tYW5hZ2VyLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUFBLE1BQUEsdUNBQUE7SUFBQTs7RUFBQSxDQUFBLEdBQUksT0FBQSxDQUFRLGlCQUFSOztFQUNILGFBQWMsT0FBQSxDQUFRLFNBQVI7O0VBRWYsVUFBQSxHQUNFO0lBQUEsUUFBQSxFQUNFO01BQUEsYUFBQSxFQUFlLElBQWY7TUFDQSxpQkFBQSxFQUNFO1FBQUEsSUFBQSxFQUFNLFdBQU47UUFDQSxDQUFBLEtBQUEsQ0FBQSxFQUFPLDhCQURQO09BRkY7S0FERjtJQUtBLGVBQUEsRUFDRTtNQUFBLGFBQUEsRUFBZSxJQUFmO01BQ0EsaUJBQUEsRUFDRTtRQUFBLElBQUEsRUFBTSxXQUFOO1FBQ0EsQ0FBQSxLQUFBLENBQUEsRUFBTyxtQ0FEUDtPQUZGO0tBTkY7SUFVQSxxQkFBQSxFQUNFO01BQUEsYUFBQSxFQUFlLElBQWY7TUFDQSxpQkFBQSxFQUNFO1FBQUEsSUFBQSxFQUFNLFdBQU47UUFDQSxDQUFBLEtBQUEsQ0FBQSxFQUFPLHlDQURQO09BRkY7S0FYRjtJQWVBLDRCQUFBLEVBQ0U7TUFBQSxhQUFBLEVBQWUsSUFBZjtNQUNBLGlCQUFBLEVBQ0U7UUFBQSxJQUFBLEVBQU0sV0FBTjtRQUNBLENBQUEsS0FBQSxDQUFBLEVBQU8sZ0RBRFA7T0FGRjtLQWhCRjtJQW9CQSxNQUFBLEVBQ0U7TUFBQSxhQUFBLEVBQWUsS0FBZjtNQUNBLGlCQUFBLEVBQ0U7UUFBQSxJQUFBLEVBQU0sV0FBTjtRQUNBLENBQUEsS0FBQSxDQUFBLEVBQU8sNEJBRFA7T0FGRjtLQXJCRjtJQXlCQSxNQUFBLEVBQ0U7TUFBQSxhQUFBLEVBQWUsSUFBZjtNQUNBLGlCQUFBLEVBQ0U7UUFBQSxJQUFBLEVBQU0sV0FBTjtRQUNBLENBQUEsS0FBQSxDQUFBLEVB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QUE7QUFERjs7TUFEUyxDQUFYLEVBR0UsT0FIRjtJQXhCSzs7MkJBNkJQLGdCQUFBLEdBQWtCLFNBQUE7QUFDaEIsVUFBQTtNQURpQjthQUNqQixJQUFDLENBQUEsS0FBRCxhQUFPLElBQUksQ0FBQyxNQUFMLENBQVksUUFBWixDQUFQO0lBRGdCOzs7OztBQWpHcEIiLCJzb3VyY2VzQ29udGVudCI6WyJfID0gcmVxdWlyZSAndW5kZXJzY29yZS1wbHVzJ1xue2lzTm90RW1wdHl9ID0gcmVxdWlyZSAnLi91dGlscydcblxuZmxhc2hUeXBlcyA9XG4gIG9wZXJhdG9yOlxuICAgIGFsbG93TXVsdGlwbGU6IHRydWVcbiAgICBkZWNvcmF0aW9uT3B0aW9uczpcbiAgICAgIHR5cGU6ICdoaWdobGlnaHQnXG4gICAgICBjbGFzczogJ3ZpbS1tb2RlLXBsdXMtZmxhc2ggb3BlcmF0b3InXG4gICdvcGVyYXRvci1sb25nJzpcbiAgICBhbGxvd011bHRpcGxlOiB0cnVlXG4gICAgZGVjb3JhdGlvbk9wdGlvbnM6XG4gICAgICB0eXBlOiAnaGlnaGxpZ2h0J1xuICAgICAgY2xhc3M6ICd2aW0tbW9kZS1wbHVzLWZsYXNoIG9wZXJhdG9yLWxvbmcnXG4gICdvcGVyYXRvci1vY2N1cnJlbmNlJzpcbiAgICBhbGxvd011bHRpcGxlOiB0cnVlXG4gICAgZGVjb3JhdGlvbk9wdGlvbnM6XG4gICAgICB0eXBlOiAnaGlnaGxpZ2h0J1xuICAgICAgY2xhc3M6ICd2aW0tbW9kZS1wbHVzLWZsYXNoIG9wZXJhdG9yLW9jY3VycmVuY2UnXG4gICdvcGVyYXRvci1yZW1vdmUtb2NjdXJyZW5jZSc6XG4gICAgYWxsb3dNdWx0aXBsZTogdHJ1ZVxuICAgIGRlY29yYXRpb25PcHRpb25zOlxuICAgICAgdHlwZTogJ2hpZ2hsaWdodCdcbiAgICAgIGNsYXNzOiAndmltLW1vZGUtcGx1cy1mbGFzaCBvcGVyYXRvci1yZW1vdmUtb2NjdXJyZW5jZSdcbiAgc2VhcmNoOlxuICAgIGFsbG93TXVsdGlwbGU6IGZhbHNlXG4gICAgZGVjb3JhdGlvbk9wdGlvbnM6XG4gICAgICB0eXBlOiAnaGlnaGxpZ2h0J1xuICAgICAgY2xhc3M6ICd2aW0tbW9kZS1wbHVzLWZsYXNoIHNlYXJjaCdcbiAgc2NyZWVuOlxuICAgIGFsbG93TXVsdGlwbGU6IHRydWVcbiAgICBkZWNvcmF0aW9uT3B0aW9uczpcbiAgICAgIHR5cGU6ICdoaWdobGlnaHQnXG4gICAgICBjbGFzczogJ3ZpbS1tb2RlLXBsdXMtZmxhc2ggc2NyZWVuJ1xuICAndW5kby1yZWRvJzpcbiAgICBhbGxvd011bHRpcGxlOiB0cnVlXG4gICAgZGVjb3JhdGlvbk9wdGlvbnM6XG4gICAgICB0eXBlOiAnaGlnaGxpZ2h0J1xuICAgICAgY2xhc3M6ICd2aW0tbW9kZS1wbHVzLWZsYXNoIHVuZG8tcmVkbydcbiAgJ3VuZG8tcmVkby1tdWx0aXBsZS1jaGFuZ2VzJzpcbiAgICBhbGxvd011bHRpcGxlOiB0cnVlXG4gICAgZGVjb3JhdGlvbk9wdGlvbnM6XG4gICAgICB0eXBlOiAnaGlnaGxpZ2h0J1xuICAgICAgY2xhc3M6ICd2aW0tbW9kZS1wbHVzLWZsYXNoIHVuZG8tcmVkby1tdWx0aXBsZS1jaGFuZ2VzJ1xuICAndW5kby1yZWRvLW11bHRpcGxlLWRlbGV0ZSc6XG4gICAgYWxsb3dNdWx0aXBsZTogdHJ1ZVxuICAgIGRlY29yYXRpb25PcHRpb25zOlxuICAgICAgdHlwZTogJ2hpZ2hsaWdodCdcbiAgICAgIGNsYXNzOiAndmltLW1vZGUtcGx1cy1mbGFzaCB1bmRvLXJlZG8tbXVsdGlwbGUtZGVsZXRlJ1xuICAnc2NyZWVuLWxpbmUnOiAjIHVudXNlZC5cbiAgICBhbGxvd011bHRpcGxlOiBmYWxzZVxuICAgIGRlY29yYXRpb25PcHRpb25zOlxuICAgICAgdHlwZTogJ2xpbmUnXG4gICAgICBjbGFzczogJ3ZpbS1tb2RlLXBsdXMtZmxhc2gtc2NyZWVuLWxpbmUnXG5cbm1vZHVsZS5leHBvcnRzID1cbmNsYXNzIEZsYXNoTWFuYWdlclxuICBjb25zdHJ1Y3RvcjogKEB2aW1TdGF0ZSkgLT5cbiAgICB7QGVkaXRvcn0gPSBAdmltU3RhdGVcbiAgICBAbWFya2Vyc0J5VHlwZSA9IG5ldyBNYXBcbiAgICBAdmltU3RhdGUub25EaWREZXN0cm95KEBkZXN0cm95LmJpbmQodGhpcykpXG5cbiAgZGVzdHJveTogLT5cbiAgICBAbWFya2Vyc0J5VHlwZS5mb3JFYWNoIChtYXJrZXJzKSAtPlxuICAgICAgbWFya2VyLmRlc3Ryb3koKSBmb3IgbWFya2VyIGluIG1hcmtlcnNcbiAgICBAbWFya2Vyc0J5VHlwZS5jbGVhcigpXG5cblxuICBmbGFzaDogKHJhbmdlcywgb3B0aW9ucywgcmFuZ2VUeXBlPSdidWZmZXInKSAtPlxuICAgIHJhbmdlcyA9IFtyYW5nZXNdIHVubGVzcyBfLmlzQXJyYXkocmFuZ2VzKVxuICAgIHJhbmdlcyA9IHJhbmdlcy5maWx0ZXIoaXNOb3RFbXB0eSlcbiAgICByZXR1cm4gbnVsbCB1bmxlc3MgcmFuZ2VzLmxlbmd0aFxuXG4gICAge3R5cGUsIHRpbWVvdXR9ID0gb3B0aW9uc1xuICAgIHRpbWVvdXQgPz0gMTAwMFxuXG4gICAge2FsbG93TXVsdGlwbGUsIGRlY29yYXRpb25PcHRpb25zfSA9IGZsYXNoVHlwZXNbdHlwZV1cbiAgICBtYXJrZXJPcHRpb25zID0ge2ludmFsaWRhdGU6ICd0b3VjaCd9XG5cbiAgICBzd2l0Y2ggcmFuZ2VUeXBlXG4gICAgICB3aGVuICdidWZmZXInXG4gICAgICAgIG1hcmtlcnMgPSAoQGVkaXRvci5tYXJrQnVmZmVyUmFuZ2UocmFuZ2UsIG1hcmtlck9wdGlvbnMpIGZvciByYW5nZSBpbiByYW5nZXMpXG4gICAgICB3aGVuICdzY3JlZW4nXG4gICAgICAgIG1hcmtlcnMgPSAoQGVkaXRvci5tYXJrU2NyZWVuUmFuZ2UocmFuZ2UsIG1hcmtlck9wdGlvbnMpIGZvciByYW5nZSBpbiByYW5nZXMpXG5cbiAgICB1bmxlc3MgYWxsb3dNdWx0aXBsZVxuICAgICAgaWYgQG1hcmtlcnNCeVR5cGUuaGFzKHR5cGUpXG4gICAgICAgIG1hcmtlci5kZXN0cm95KCkgZm9yIG1hcmtlciBpbiBAbWFya2Vyc0J5VHlwZS5nZXQodHlwZSlcbiAgICAgIEBtYXJrZXJzQnlUeXBlLnNldCh0eXBlLCBtYXJrZXJzKVxuXG4gICAgQGVkaXRvci5kZWNvcmF0ZU1hcmtlcihtYXJrZXIsIGRlY29yYXRpb25PcHRpb25zKSBmb3IgbWFya2VyIGluIG1hcmtlcnNcblxuICAgIHNldFRpbWVvdXQgLT5cbiAgICAgIGZvciBtYXJrZXIgaW4gbWFya2Vyc1xuICAgICAgICBtYXJrZXIuZGVzdHJveSgpXG4gICAgLCB0aW1lb3V0XG5cbiAgZmxhc2hTY3JlZW5SYW5nZTogKGFyZ3MuLi4pIC0+XG4gICAgQGZsYXNoKGFyZ3MuY29uY2F0KCdzY3JlZW4nKS4uLilcbiJdfQ==
