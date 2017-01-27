(function() {
  var Emitter, GlobalState, getInitialState;

  Emitter = require('atom').Emitter;

  GlobalState = (function() {
    function GlobalState() {
      this.reset();
      this.emitter = new Emitter;
      this.onDidChange((function(_this) {
        return function(arg) {
          var name, newValue;
          name = arg.name, newValue = arg.newValue;
          if (name === 'lastSearchPattern') {
            return _this.set('highlightSearchPattern', newValue);
          }
        };
      })(this));
    }

    GlobalState.prototype.get = function(name) {
      return this.state[name];
    };

    GlobalState.prototype.set = function(name, newValue) {
      var oldValue;
      oldValue = this.get(name);
      this.state[name] = newValue;
      return this.emitDidChange({
        name: name,
        oldValue: oldValue,
        newValue: newValue
      });
    };

    GlobalState.prototype.onDidChange = function(fn) {
      return this.emitter.on('did-change', fn);
    };

    GlobalState.prototype.emitDidChange = function(event) {
      return this.emitter.emit('did-change', event);
    };

    GlobalState.prototype.reset = function(name) {
      var initialState;
      initialState = getInitialState();
      if (name != null) {
        return this.set(name, initialState[name]);
      } else {
        return this.state = initialState;
      }
    };

    return GlobalState;

  })();

  getInitialState = function() {
    return {
      searchHistory: [],
      currentSearch: null,
      lastSearchPattern: null,
      lastOccurrencePattern: null,
      highlightSearchPattern: null,
      currentFind: null,
      register: {}
    };
  };

  module.exports = new GlobalState();

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL2hvbWUvamFrZS8uYXRvbS9wYWNrYWdlcy92aW0tbW9kZS1wbHVzL2xpYi9nbG9iYWwtc3RhdGUuY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FBQUEsTUFBQTs7RUFBQyxVQUFXLE9BQUEsQ0FBUSxNQUFSOztFQUVOO0lBQ1MscUJBQUE7TUFDWCxJQUFDLENBQUEsS0FBRCxDQUFBO01BQ0EsSUFBQyxDQUFBLE9BQUQsR0FBVyxJQUFJO01BRWYsSUFBQyxDQUFBLFdBQUQsQ0FBYSxDQUFBLFNBQUEsS0FBQTtlQUFBLFNBQUMsR0FBRDtBQUVYLGNBQUE7VUFGYSxpQkFBTTtVQUVuQixJQUFHLElBQUEsS0FBUSxtQkFBWDttQkFDRSxLQUFDLENBQUEsR0FBRCxDQUFLLHdCQUFMLEVBQStCLFFBQS9CLEVBREY7O1FBRlc7TUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBLENBQWI7SUFKVzs7MEJBU2IsR0FBQSxHQUFLLFNBQUMsSUFBRDthQUNILElBQUMsQ0FBQSxLQUFNLENBQUEsSUFBQTtJQURKOzswQkFHTCxHQUFBLEdBQUssU0FBQyxJQUFELEVBQU8sUUFBUDtBQUNILFVBQUE7TUFBQSxRQUFBLEdBQVcsSUFBQyxDQUFBLEdBQUQsQ0FBSyxJQUFMO01BQ1gsSUFBQyxDQUFBLEtBQU0sQ0FBQSxJQUFBLENBQVAsR0FBZTthQUNmLElBQUMsQ0FBQSxhQUFELENBQWU7UUFBQyxNQUFBLElBQUQ7UUFBTyxVQUFBLFFBQVA7UUFBaUIsVUFBQSxRQUFqQjtPQUFmO0lBSEc7OzBCQUtMLFdBQUEsR0FBYSxTQUFDLEVBQUQ7YUFDWCxJQUFDLENBQUEsT0FBTyxDQUFDLEVBQVQsQ0FBWSxZQUFaLEVBQTBCLEVBQTFCO0lBRFc7OzBCQUdiLGFBQUEsR0FBZSxTQUFDLEtBQUQ7YUFDYixJQUFDLENBQUEsT0FBTyxDQUFDLElBQVQsQ0FBYyxZQUFkLEVBQTRCLEtBQTVCO0lBRGE7OzBCQUdmLEtBQUEsR0FBTyxTQUFDLElBQUQ7QUFDTCxVQUFBO01BQUEsWUFBQSxHQUFlLGVBQUEsQ0FBQTtNQUNmLElBQUcsWUFBSDtlQUNFLElBQUMsQ0FBQSxHQUFELENBQUssSUFBTCxFQUFXLFlBQWEsQ0FBQSxJQUFBLENBQXhCLEVBREY7T0FBQSxNQUFBO2VBR0UsSUFBQyxDQUFBLEtBQUQsR0FBUyxhQUhYOztJQUZLOzs7Ozs7RUFPVCxlQUFBLEdBQWtCLFNBQUE7V0FDaEI7TUFBQSxhQUFBLEVBQWUsRUFBZjtNQUNBLGFBQUEsRUFBZSxJQURmO01BRUEsaUJBQUEsRUFBbUIsSUFGbkI7TUFHQSxxQkFBQSxFQUF1QixJQUh2QjtNQUlBLHNCQUFBLEVBQXdCLElBSnhCO01BS0EsV0FBQSxFQUFhLElBTGI7TUFNQSxRQUFBLEVBQVUsRUFOVjs7RUFEZ0I7O0VBU2xCLE1BQU0sQ0FBQyxPQUFQLEdBQXFCLElBQUEsV0FBQSxDQUFBO0FBMUNyQiIsInNvdXJjZXNDb250ZW50IjpbIntFbWl0dGVyfSA9IHJlcXVpcmUgJ2F0b20nXG5cbmNsYXNzIEdsb2JhbFN0YXRlXG4gIGNvbnN0cnVjdG9yOiAtPlxuICAgIEByZXNldCgpXG4gICAgQGVtaXR0ZXIgPSBuZXcgRW1pdHRlclxuXG4gICAgQG9uRGlkQ2hhbmdlICh7bmFtZSwgbmV3VmFsdWV9KSA9PlxuICAgICAgIyBhdXRvIHN5bmMgdmFsdWUsIGJ1dCBoaWdobGlnaHRTZWFyY2hQYXR0ZXJuIGlzIHNvbGVseSBjbGVhcmVkIHRvIGNsZWFyIGhsc2VhcmNoLlxuICAgICAgaWYgbmFtZSBpcyAnbGFzdFNlYXJjaFBhdHRlcm4nXG4gICAgICAgIEBzZXQoJ2hpZ2hsaWdodFNlYXJjaFBhdHRlcm4nLCBuZXdWYWx1ZSlcblxuICBnZXQ6IChuYW1lKSAtPlxuICAgIEBzdGF0ZVtuYW1lXVxuXG4gIHNldDogKG5hbWUsIG5ld1ZhbHVlKSAtPlxuICAgIG9sZFZhbHVlID0gQGdldChuYW1lKVxuICAgIEBzdGF0ZVtuYW1lXSA9IG5ld1ZhbHVlXG4gICAgQGVtaXREaWRDaGFuZ2Uoe25hbWUsIG9sZFZhbHVlLCBuZXdWYWx1ZX0pXG5cbiAgb25EaWRDaGFuZ2U6IChmbikgLT5cbiAgICBAZW1pdHRlci5vbignZGlkLWNoYW5nZScsIGZuKVxuXG4gIGVtaXREaWRDaGFuZ2U6IChldmVudCkgLT5cbiAgICBAZW1pdHRlci5lbWl0KCdkaWQtY2hhbmdlJywgZXZlbnQpXG5cbiAgcmVzZXQ6IChuYW1lKSAtPlxuICAgIGluaXRpYWxTdGF0ZSA9IGdldEluaXRpYWxTdGF0ZSgpXG4gICAgaWYgbmFtZT9cbiAgICAgIEBzZXQobmFtZSwgaW5pdGlhbFN0YXRlW25hbWVdKVxuICAgIGVsc2VcbiAgICAgIEBzdGF0ZSA9IGluaXRpYWxTdGF0ZVxuXG5nZXRJbml0aWFsU3RhdGUgPSAtPlxuICBzZWFyY2hIaXN0b3J5OiBbXVxuICBjdXJyZW50U2VhcmNoOiBudWxsXG4gIGxhc3RTZWFyY2hQYXR0ZXJuOiBudWxsXG4gIGxhc3RPY2N1cnJlbmNlUGF0dGVybjogbnVsbFxuICBoaWdobGlnaHRTZWFyY2hQYXR0ZXJuOiBudWxsXG4gIGN1cnJlbnRGaW5kOiBudWxsXG4gIHJlZ2lzdGVyOiB7fVxuXG5tb2R1bGUuZXhwb3J0cyA9IG5ldyBHbG9iYWxTdGF0ZSgpXG4iXX0=
