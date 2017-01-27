(function() {
  var CompositeDisposable;

  CompositeDisposable = require('event-kit').CompositeDisposable;

  module.exports = {
    active: false,
    isActive: function() {
      return this.active;
    },
    activate: function(state) {
      return this.subscriptions = new CompositeDisposable;
    },
    consumeMinimapServiceV1: function(minimap1) {
      this.minimap = minimap1;
      return this.minimap.registerPlugin('minimap-autohide', this);
    },
    deactivate: function() {
      this.minimap.unregisterPlugin('minimap-autohide');
      return this.minimap = null;
    },
    activatePlugin: function() {
      if (this.active) {
        return;
      }
      this.active = true;
      return this.minimapsSubscription = this.minimap.observeMinimaps((function(_this) {
        return function(minimap) {
          var editor, minimapElement;
          minimapElement = atom.views.getView(minimap);
          editor = minimap.getTextEditor();
          return _this.subscriptions.add(editor.onDidChangeScrollTop(function() {
            return _this.handleScroll(minimapElement);
          }));
        };
      })(this));
    },
    handleScroll: function(el) {
      el.classList.add('scrolling');
      if (el.timer) {
        clearTimeout(el.timer);
      }
      return el.timer = setTimeout((function() {
        return el.classList.remove('scrolling');
      }), 1500);
    },
    deactivatePlugin: function() {
      if (!this.active) {
        return;
      }
      this.active = false;
      this.minimapsSubscription.dispose();
      return this.subscriptions.dispose();
    }
  };

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL2hvbWUvamFrZS8uYXRvbS9wYWNrYWdlcy9taW5pbWFwLWF1dG9oaWRlL2xpYi9taW5pbWFwLWF1dG9oaWRlLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUFBLE1BQUE7O0VBQUMsc0JBQXVCLE9BQUEsQ0FBUSxXQUFSOztFQUV4QixNQUFNLENBQUMsT0FBUCxHQUNFO0lBQUEsTUFBQSxFQUFRLEtBQVI7SUFFQSxRQUFBLEVBQVUsU0FBQTthQUFHLElBQUMsQ0FBQTtJQUFKLENBRlY7SUFJQSxRQUFBLEVBQVUsU0FBQyxLQUFEO2FBQ1IsSUFBQyxDQUFBLGFBQUQsR0FBaUIsSUFBSTtJQURiLENBSlY7SUFPQSx1QkFBQSxFQUF5QixTQUFDLFFBQUQ7TUFBQyxJQUFDLENBQUEsVUFBRDthQUN4QixJQUFDLENBQUEsT0FBTyxDQUFDLGNBQVQsQ0FBd0Isa0JBQXhCLEVBQTRDLElBQTVDO0lBRHVCLENBUHpCO0lBVUEsVUFBQSxFQUFZLFNBQUE7TUFDVixJQUFDLENBQUEsT0FBTyxDQUFDLGdCQUFULENBQTBCLGtCQUExQjthQUNBLElBQUMsQ0FBQSxPQUFELEdBQVc7SUFGRCxDQVZaO0lBY0EsY0FBQSxFQUFnQixTQUFBO01BQ2QsSUFBVSxJQUFDLENBQUEsTUFBWDtBQUFBLGVBQUE7O01BRUEsSUFBQyxDQUFBLE1BQUQsR0FBVTthQUVWLElBQUMsQ0FBQSxvQkFBRCxHQUF3QixJQUFDLENBQUEsT0FBTyxDQUFDLGVBQVQsQ0FBeUIsQ0FBQSxTQUFBLEtBQUE7ZUFBQSxTQUFDLE9BQUQ7QUFDL0MsY0FBQTtVQUFBLGNBQUEsR0FBaUIsSUFBSSxDQUFDLEtBQUssQ0FBQyxPQUFYLENBQW1CLE9BQW5CO1VBQ2pCLE1BQUEsR0FBUSxPQUFPLENBQUMsYUFBUixDQUFBO2lCQUNSLEtBQUMsQ0FBQSxhQUFhLENBQUMsR0FBZixDQUFtQixNQUFNLENBQUMsb0JBQVAsQ0FBNEIsU0FBQTttQkFDN0MsS0FBQyxDQUFBLFlBQUQsQ0FBYyxjQUFkO1VBRDZDLENBQTVCLENBQW5CO1FBSCtDO01BQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxDQUF6QjtJQUxWLENBZGhCO0lBeUJBLFlBQUEsRUFBYyxTQUFDLEVBQUQ7TUFDWixFQUFFLENBQUMsU0FBUyxDQUFDLEdBQWIsQ0FBaUIsV0FBakI7TUFFQSxJQUFHLEVBQUUsQ0FBQyxLQUFOO1FBQ0UsWUFBQSxDQUFhLEVBQUUsQ0FBQyxLQUFoQixFQURGOzthQUdBLEVBQUUsQ0FBQyxLQUFILEdBQVcsVUFBQSxDQUFXLENBQUUsU0FBQTtlQUN0QixFQUFFLENBQUMsU0FBUyxDQUFDLE1BQWIsQ0FBb0IsV0FBcEI7TUFEc0IsQ0FBRixDQUFYLEVBRVIsSUFGUTtJQU5DLENBekJkO0lBbUNBLGdCQUFBLEVBQWtCLFNBQUE7TUFDaEIsSUFBQSxDQUFjLElBQUMsQ0FBQSxNQUFmO0FBQUEsZUFBQTs7TUFFQSxJQUFDLENBQUEsTUFBRCxHQUFVO01BQ1YsSUFBQyxDQUFBLG9CQUFvQixDQUFDLE9BQXRCLENBQUE7YUFDQSxJQUFDLENBQUEsYUFBYSxDQUFDLE9BQWYsQ0FBQTtJQUxnQixDQW5DbEI7O0FBSEYiLCJzb3VyY2VzQ29udGVudCI6WyJ7Q29tcG9zaXRlRGlzcG9zYWJsZX0gPSByZXF1aXJlICdldmVudC1raXQnXG5cbm1vZHVsZS5leHBvcnRzID1cbiAgYWN0aXZlOiBmYWxzZVxuXG4gIGlzQWN0aXZlOiAtPiBAYWN0aXZlXG5cbiAgYWN0aXZhdGU6IChzdGF0ZSkgLT5cbiAgICBAc3Vic2NyaXB0aW9ucyA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlXG5cbiAgY29uc3VtZU1pbmltYXBTZXJ2aWNlVjE6IChAbWluaW1hcCkgLT5cbiAgICBAbWluaW1hcC5yZWdpc3RlclBsdWdpbiAnbWluaW1hcC1hdXRvaGlkZScsIHRoaXNcblxuICBkZWFjdGl2YXRlOiAtPlxuICAgIEBtaW5pbWFwLnVucmVnaXN0ZXJQbHVnaW4gJ21pbmltYXAtYXV0b2hpZGUnXG4gICAgQG1pbmltYXAgPSBudWxsXG5cbiAgYWN0aXZhdGVQbHVnaW46IC0+XG4gICAgcmV0dXJuIGlmIEBhY3RpdmVcblxuICAgIEBhY3RpdmUgPSB0cnVlXG5cbiAgICBAbWluaW1hcHNTdWJzY3JpcHRpb24gPSBAbWluaW1hcC5vYnNlcnZlTWluaW1hcHMgKG1pbmltYXApID0+XG4gICAgICBtaW5pbWFwRWxlbWVudCA9IGF0b20udmlld3MuZ2V0VmlldyhtaW5pbWFwKVxuICAgICAgZWRpdG9yPSBtaW5pbWFwLmdldFRleHRFZGl0b3IoKVxuICAgICAgQHN1YnNjcmlwdGlvbnMuYWRkIGVkaXRvci5vbkRpZENoYW5nZVNjcm9sbFRvcCA9PlxuICAgICAgICBAaGFuZGxlU2Nyb2xsIG1pbmltYXBFbGVtZW50XG5cbiAgaGFuZGxlU2Nyb2xsOiAoZWwpLT5cbiAgICBlbC5jbGFzc0xpc3QuYWRkKCdzY3JvbGxpbmcnKVxuXG4gICAgaWYgZWwudGltZXJcbiAgICAgIGNsZWFyVGltZW91dCBlbC50aW1lclxuXG4gICAgZWwudGltZXIgPSBzZXRUaW1lb3V0ICggLT5cbiAgICAgIGVsLmNsYXNzTGlzdC5yZW1vdmUoJ3Njcm9sbGluZycpXG4gICAgKSwgMTUwMFxuXG4gIGRlYWN0aXZhdGVQbHVnaW46IC0+XG4gICAgcmV0dXJuIHVubGVzcyBAYWN0aXZlXG5cbiAgICBAYWN0aXZlID0gZmFsc2VcbiAgICBAbWluaW1hcHNTdWJzY3JpcHRpb24uZGlzcG9zZSgpXG4gICAgQHN1YnNjcmlwdGlvbnMuZGlzcG9zZSgpXG4iXX0=
