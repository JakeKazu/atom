(function() {
  var CompositeDisposable, HighlightSearchManager, matchScopes, ref, scanEditor, settings;

  CompositeDisposable = require('atom').CompositeDisposable;

  ref = require('./utils'), scanEditor = ref.scanEditor, matchScopes = ref.matchScopes;

  settings = require('./settings');

  module.exports = HighlightSearchManager = (function() {
    function HighlightSearchManager(vimState) {
      var decorationOptions, ref1;
      this.vimState = vimState;
      ref1 = this.vimState, this.editor = ref1.editor, this.editorElement = ref1.editorElement, this.globalState = ref1.globalState;
      this.disposables = new CompositeDisposable;
      this.markerLayer = this.editor.addMarkerLayer();
      decorationOptions = {
        type: 'highlight',
        "class": 'vim-mode-plus-highlight-search'
      };
      this.decorationLayer = this.editor.decorateMarkerLayer(this.markerLayer, decorationOptions);
      this.disposables.add(this.vimState.onDidDestroy(this.destroy.bind(this)));
      this.disposables = this.globalState.onDidChange((function(_this) {
        return function(arg) {
          var name, newValue;
          name = arg.name, newValue = arg.newValue;
          if (name === 'highlightSearchPattern') {
            if (newValue) {
              return _this.refresh();
            } else {
              return _this.clearMarkers();
            }
          }
        };
      })(this));
    }

    HighlightSearchManager.prototype.destroy = function() {
      this.decorationLayer.destroy();
      this.disposables.dispose();
      return this.markerLayer.destroy();
    };

    HighlightSearchManager.prototype.hasMarkers = function() {
      return this.markerLayer.getMarkerCount() > 0;
    };

    HighlightSearchManager.prototype.getMarkers = function() {
      return this.markerLayer.getMarkers();
    };

    HighlightSearchManager.prototype.clearMarkers = function() {
      var i, len, marker, ref1, results;
      ref1 = this.markerLayer.getMarkers();
      results = [];
      for (i = 0, len = ref1.length; i < len; i++) {
        marker = ref1[i];
        results.push(marker.destroy());
      }
      return results;
    };

    HighlightSearchManager.prototype.refresh = function() {
      var i, len, pattern, range, ref1, results;
      this.clearMarkers();
      if (!settings.get('highlightSearch')) {
        return;
      }
      if (!this.vimState.isVisible()) {
        return;
      }
      if (!(pattern = this.globalState.get('highlightSearchPattern'))) {
        return;
      }
      if (matchScopes(this.editorElement, settings.get('highlightSearchExcludeScopes'))) {
        return;
      }
      ref1 = scanEditor(this.editor, pattern);
      results = [];
      for (i = 0, len = ref1.length; i < len; i++) {
        range = ref1[i];
        results.push(this.markerLayer.markBufferRange(range, {
          invalidate: 'inside'
        }));
      }
      return results;
    };

    return HighlightSearchManager;

  })();

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL2hvbWUvamFrZS8uYXRvbS9wYWNrYWdlcy92aW0tbW9kZS1wbHVzL2xpYi9oaWdobGlnaHQtc2VhcmNoLW1hbmFnZXIuY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FBQUEsTUFBQTs7RUFBQyxzQkFBdUIsT0FBQSxDQUFRLE1BQVI7O0VBQ3hCLE1BQTRCLE9BQUEsQ0FBUSxTQUFSLENBQTVCLEVBQUMsMkJBQUQsRUFBYTs7RUFDYixRQUFBLEdBQVcsT0FBQSxDQUFRLFlBQVI7O0VBR1gsTUFBTSxDQUFDLE9BQVAsR0FDTTtJQUNTLGdDQUFDLFFBQUQ7QUFDWCxVQUFBO01BRFksSUFBQyxDQUFBLFdBQUQ7TUFDWixPQUEwQyxJQUFDLENBQUEsUUFBM0MsRUFBQyxJQUFDLENBQUEsY0FBQSxNQUFGLEVBQVUsSUFBQyxDQUFBLHFCQUFBLGFBQVgsRUFBMEIsSUFBQyxDQUFBLG1CQUFBO01BQzNCLElBQUMsQ0FBQSxXQUFELEdBQWUsSUFBSTtNQUNuQixJQUFDLENBQUEsV0FBRCxHQUFlLElBQUMsQ0FBQSxNQUFNLENBQUMsY0FBUixDQUFBO01BRWYsaUJBQUEsR0FDRTtRQUFBLElBQUEsRUFBTSxXQUFOO1FBQ0EsQ0FBQSxLQUFBLENBQUEsRUFBTyxnQ0FEUDs7TUFFRixJQUFDLENBQUEsZUFBRCxHQUFtQixJQUFDLENBQUEsTUFBTSxDQUFDLG1CQUFSLENBQTRCLElBQUMsQ0FBQSxXQUE3QixFQUEwQyxpQkFBMUM7TUFFbkIsSUFBQyxDQUFBLFdBQVcsQ0FBQyxHQUFiLENBQWlCLElBQUMsQ0FBQSxRQUFRLENBQUMsWUFBVixDQUF1QixJQUFDLENBQUEsT0FBTyxDQUFDLElBQVQsQ0FBYyxJQUFkLENBQXZCLENBQWpCO01BSUEsSUFBQyxDQUFBLFdBQUQsR0FBZSxJQUFDLENBQUEsV0FBVyxDQUFDLFdBQWIsQ0FBeUIsQ0FBQSxTQUFBLEtBQUE7ZUFBQSxTQUFDLEdBQUQ7QUFDdEMsY0FBQTtVQUR3QyxpQkFBTTtVQUM5QyxJQUFHLElBQUEsS0FBUSx3QkFBWDtZQUNFLElBQUcsUUFBSDtxQkFDRSxLQUFDLENBQUEsT0FBRCxDQUFBLEVBREY7YUFBQSxNQUFBO3FCQUdFLEtBQUMsQ0FBQSxZQUFELENBQUEsRUFIRjthQURGOztRQURzQztNQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0FBekI7SUFkSjs7cUNBcUJiLE9BQUEsR0FBUyxTQUFBO01BQ1AsSUFBQyxDQUFBLGVBQWUsQ0FBQyxPQUFqQixDQUFBO01BQ0EsSUFBQyxDQUFBLFdBQVcsQ0FBQyxPQUFiLENBQUE7YUFDQSxJQUFDLENBQUEsV0FBVyxDQUFDLE9BQWIsQ0FBQTtJQUhPOztxQ0FPVCxVQUFBLEdBQVksU0FBQTthQUNWLElBQUMsQ0FBQSxXQUFXLENBQUMsY0FBYixDQUFBLENBQUEsR0FBZ0M7SUFEdEI7O3FDQUdaLFVBQUEsR0FBWSxTQUFBO2FBQ1YsSUFBQyxDQUFBLFdBQVcsQ0FBQyxVQUFiLENBQUE7SUFEVTs7cUNBR1osWUFBQSxHQUFjLFNBQUE7QUFDWixVQUFBO0FBQUE7QUFBQTtXQUFBLHNDQUFBOztxQkFBQSxNQUFNLENBQUMsT0FBUCxDQUFBO0FBQUE7O0lBRFk7O3FDQUdkLE9BQUEsR0FBUyxTQUFBO0FBQ1AsVUFBQTtNQUFBLElBQUMsQ0FBQSxZQUFELENBQUE7TUFFQSxJQUFBLENBQWMsUUFBUSxDQUFDLEdBQVQsQ0FBYSxpQkFBYixDQUFkO0FBQUEsZUFBQTs7TUFDQSxJQUFBLENBQWMsSUFBQyxDQUFBLFFBQVEsQ0FBQyxTQUFWLENBQUEsQ0FBZDtBQUFBLGVBQUE7O01BQ0EsSUFBQSxDQUFjLENBQUEsT0FBQSxHQUFVLElBQUMsQ0FBQSxXQUFXLENBQUMsR0FBYixDQUFpQix3QkFBakIsQ0FBVixDQUFkO0FBQUEsZUFBQTs7TUFDQSxJQUFVLFdBQUEsQ0FBWSxJQUFDLENBQUEsYUFBYixFQUE0QixRQUFRLENBQUMsR0FBVCxDQUFhLDhCQUFiLENBQTVCLENBQVY7QUFBQSxlQUFBOztBQUVBO0FBQUE7V0FBQSxzQ0FBQTs7cUJBQ0UsSUFBQyxDQUFBLFdBQVcsQ0FBQyxlQUFiLENBQTZCLEtBQTdCLEVBQW9DO1VBQUEsVUFBQSxFQUFZLFFBQVo7U0FBcEM7QUFERjs7SUFSTzs7Ozs7QUE1Q1giLCJzb3VyY2VzQ29udGVudCI6WyJ7Q29tcG9zaXRlRGlzcG9zYWJsZX0gPSByZXF1aXJlICdhdG9tJ1xue3NjYW5FZGl0b3IsIG1hdGNoU2NvcGVzfSA9IHJlcXVpcmUgJy4vdXRpbHMnXG5zZXR0aW5ncyA9IHJlcXVpcmUgJy4vc2V0dGluZ3MnXG5cbiMgR2VuZXJhbCBwdXJwb3NlIHV0aWxpdHkgY2xhc3MgdG8gbWFrZSBBdG9tJ3MgbWFya2VyIG1hbmFnZW1lbnQgZWFzaWVyLlxubW9kdWxlLmV4cG9ydHMgPVxuY2xhc3MgSGlnaGxpZ2h0U2VhcmNoTWFuYWdlclxuICBjb25zdHJ1Y3RvcjogKEB2aW1TdGF0ZSkgLT5cbiAgICB7QGVkaXRvciwgQGVkaXRvckVsZW1lbnQsIEBnbG9iYWxTdGF0ZX0gPSBAdmltU3RhdGVcbiAgICBAZGlzcG9zYWJsZXMgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZVxuICAgIEBtYXJrZXJMYXllciA9IEBlZGl0b3IuYWRkTWFya2VyTGF5ZXIoKVxuXG4gICAgZGVjb3JhdGlvbk9wdGlvbnMgPVxuICAgICAgdHlwZTogJ2hpZ2hsaWdodCdcbiAgICAgIGNsYXNzOiAndmltLW1vZGUtcGx1cy1oaWdobGlnaHQtc2VhcmNoJ1xuICAgIEBkZWNvcmF0aW9uTGF5ZXIgPSBAZWRpdG9yLmRlY29yYXRlTWFya2VyTGF5ZXIoQG1hcmtlckxheWVyLCBkZWNvcmF0aW9uT3B0aW9ucylcblxuICAgIEBkaXNwb3NhYmxlcy5hZGQgQHZpbVN0YXRlLm9uRGlkRGVzdHJveShAZGVzdHJveS5iaW5kKHRoaXMpKVxuXG4gICAgIyBSZWZyZXNoIGhpZ2hsaWdodCBiYXNlZCBvbiBnbG9iYWxTdGF0ZS5oaWdobGlnaHRTZWFyY2hQYXR0ZXJuIGNoYW5nZXMuXG4gICAgIyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgQGRpc3Bvc2FibGVzID0gQGdsb2JhbFN0YXRlLm9uRGlkQ2hhbmdlICh7bmFtZSwgbmV3VmFsdWV9KSA9PlxuICAgICAgaWYgbmFtZSBpcyAnaGlnaGxpZ2h0U2VhcmNoUGF0dGVybidcbiAgICAgICAgaWYgbmV3VmFsdWVcbiAgICAgICAgICBAcmVmcmVzaCgpXG4gICAgICAgIGVsc2VcbiAgICAgICAgICBAY2xlYXJNYXJrZXJzKClcblxuICBkZXN0cm95OiAtPlxuICAgIEBkZWNvcmF0aW9uTGF5ZXIuZGVzdHJveSgpXG4gICAgQGRpc3Bvc2FibGVzLmRpc3Bvc2UoKVxuICAgIEBtYXJrZXJMYXllci5kZXN0cm95KClcblxuICAjIE1hcmtlcnNcbiAgIyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIGhhc01hcmtlcnM6IC0+XG4gICAgQG1hcmtlckxheWVyLmdldE1hcmtlckNvdW50KCkgPiAwXG5cbiAgZ2V0TWFya2VyczogLT5cbiAgICBAbWFya2VyTGF5ZXIuZ2V0TWFya2VycygpXG5cbiAgY2xlYXJNYXJrZXJzOiAtPlxuICAgIG1hcmtlci5kZXN0cm95KCkgZm9yIG1hcmtlciBpbiBAbWFya2VyTGF5ZXIuZ2V0TWFya2VycygpXG5cbiAgcmVmcmVzaDogLT5cbiAgICBAY2xlYXJNYXJrZXJzKClcblxuICAgIHJldHVybiB1bmxlc3Mgc2V0dGluZ3MuZ2V0KCdoaWdobGlnaHRTZWFyY2gnKVxuICAgIHJldHVybiB1bmxlc3MgQHZpbVN0YXRlLmlzVmlzaWJsZSgpXG4gICAgcmV0dXJuIHVubGVzcyBwYXR0ZXJuID0gQGdsb2JhbFN0YXRlLmdldCgnaGlnaGxpZ2h0U2VhcmNoUGF0dGVybicpXG4gICAgcmV0dXJuIGlmIG1hdGNoU2NvcGVzKEBlZGl0b3JFbGVtZW50LCBzZXR0aW5ncy5nZXQoJ2hpZ2hsaWdodFNlYXJjaEV4Y2x1ZGVTY29wZXMnKSlcblxuICAgIGZvciByYW5nZSBpbiBzY2FuRWRpdG9yKEBlZGl0b3IsIHBhdHRlcm4pXG4gICAgICBAbWFya2VyTGF5ZXIubWFya0J1ZmZlclJhbmdlKHJhbmdlLCBpbnZhbGlkYXRlOiAnaW5zaWRlJylcbiJdfQ==
