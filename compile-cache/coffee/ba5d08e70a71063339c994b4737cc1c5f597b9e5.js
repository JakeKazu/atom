(function() {
  module.exports = {
    provider: null,
    ready: false,
    activate: function() {
      return this.ready = true;
    },
    deactivate: function() {
      return this.provider = null;
    },
    getProvider: function() {
      var PathsProvider;
      if (this.provider != null) {
        return this.provider;
      }
      PathsProvider = require('./paths-provider');
      this.provider = new PathsProvider();
      return this.provider;
    },
    provide: function() {
      return {
        provider: this.getProvider()
      };
    }
  };

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL2hvbWUvamFrZS8uYXRvbS9wYWNrYWdlcy9hdXRvY29tcGxldGUtcGF0aHMvbGliL2F1dG9jb21wbGV0ZS1wYXRocy5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7RUFBQSxNQUFNLENBQUMsT0FBUCxHQUNFO0lBQUEsUUFBQSxFQUFVLElBQVY7SUFDQSxLQUFBLEVBQU8sS0FEUDtJQUdBLFFBQUEsRUFBVSxTQUFBO2FBQ1IsSUFBQyxDQUFBLEtBQUQsR0FBUztJQURELENBSFY7SUFNQSxVQUFBLEVBQVksU0FBQTthQUNWLElBQUMsQ0FBQSxRQUFELEdBQVk7SUFERixDQU5aO0lBU0EsV0FBQSxFQUFhLFNBQUE7QUFDWCxVQUFBO01BQUEsSUFBb0IscUJBQXBCO0FBQUEsZUFBTyxJQUFDLENBQUEsU0FBUjs7TUFDQSxhQUFBLEdBQWdCLE9BQUEsQ0FBUSxrQkFBUjtNQUNoQixJQUFDLENBQUEsUUFBRCxHQUFnQixJQUFBLGFBQUEsQ0FBQTtBQUNoQixhQUFPLElBQUMsQ0FBQTtJQUpHLENBVGI7SUFlQSxPQUFBLEVBQVMsU0FBQTtBQUNQLGFBQU87UUFBQyxRQUFBLEVBQVUsSUFBQyxDQUFBLFdBQUQsQ0FBQSxDQUFYOztJQURBLENBZlQ7O0FBREYiLCJzb3VyY2VzQ29udGVudCI6WyJtb2R1bGUuZXhwb3J0cyA9XG4gIHByb3ZpZGVyOiBudWxsXG4gIHJlYWR5OiBmYWxzZVxuXG4gIGFjdGl2YXRlOiAtPlxuICAgIEByZWFkeSA9IHRydWVcblxuICBkZWFjdGl2YXRlOiAtPlxuICAgIEBwcm92aWRlciA9IG51bGxcblxuICBnZXRQcm92aWRlcjogLT5cbiAgICByZXR1cm4gQHByb3ZpZGVyIGlmIEBwcm92aWRlcj9cbiAgICBQYXRoc1Byb3ZpZGVyID0gcmVxdWlyZSgnLi9wYXRocy1wcm92aWRlcicpXG4gICAgQHByb3ZpZGVyID0gbmV3IFBhdGhzUHJvdmlkZXIoKVxuICAgIHJldHVybiBAcHJvdmlkZXJcblxuICBwcm92aWRlOiAtPlxuICAgIHJldHVybiB7cHJvdmlkZXI6IEBnZXRQcm92aWRlcigpfVxuIl19
