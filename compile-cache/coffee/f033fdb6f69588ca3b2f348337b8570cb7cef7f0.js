(function() {
  var KillRing;

  module.exports = KillRing = (function() {
    function KillRing() {
      this.currentIndex = -1;
      this.entries = [];
      this.limit = 500;
    }

    KillRing.prototype.fork = function() {
      var fork;
      fork = new KillRing;
      fork.setEntries(this.entries);
      fork.currentIndex = this.currentIndex;
      return fork;
    };

    KillRing.prototype.isEmpty = function() {
      return this.entries.length === 0;
    };

    KillRing.prototype.reset = function() {
      return this.entries = [];
    };

    KillRing.prototype.getEntries = function() {
      return this.entries.slice();
    };

    KillRing.prototype.setEntries = function(entries) {
      this.entries = entries.slice();
      this.currentIndex = this.entries.length - 1;
      return this;
    };

    KillRing.prototype.push = function(text) {
      this.entries.push(text);
      if (this.entries.length > this.limit) {
        this.entries.shift();
      }
      return this.currentIndex = this.entries.length - 1;
    };

    KillRing.prototype.append = function(text) {
      var index;
      if (this.entries.length === 0) {
        return this.push(text);
      } else {
        index = this.entries.length - 1;
        this.entries[index] += text;
        return this.currentIndex = this.entries.length - 1;
      }
    };

    KillRing.prototype.prepend = function(text) {
      var index;
      if (this.entries.length === 0) {
        return this.push(text);
      } else {
        index = this.entries.length - 1;
        this.entries[index] = "" + text + this.entries[index];
        return this.currentIndex = this.entries.length - 1;
      }
    };

    KillRing.prototype.getCurrentEntry = function() {
      if (this.entries.length === 0) {
        return null;
      } else {
        return this.entries[this.currentIndex];
      }
    };

    KillRing.prototype.rotate = function(n) {
      if (this.entries.length === 0) {
        return null;
      }
      this.currentIndex = (this.currentIndex + n) % this.entries.length;
      if (this.currentIndex < 0) {
        this.currentIndex += this.entries.length;
      }
      return this.entries[this.currentIndex];
    };

    KillRing.global = new KillRing;

    return KillRing;

  })();

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL2hvbWUvamFrZS8uYXRvbS9wYWNrYWdlcy9hdG9taWMtZW1hY3MvbGliL2tpbGwtcmluZy5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFBQSxNQUFBOztFQUFBLE1BQU0sQ0FBQyxPQUFQLEdBQ007SUFDUyxrQkFBQTtNQUNYLElBQUMsQ0FBQSxZQUFELEdBQWdCLENBQUM7TUFDakIsSUFBQyxDQUFBLE9BQUQsR0FBVztNQUNYLElBQUMsQ0FBQSxLQUFELEdBQVM7SUFIRTs7dUJBS2IsSUFBQSxHQUFNLFNBQUE7QUFDSixVQUFBO01BQUEsSUFBQSxHQUFPLElBQUk7TUFDWCxJQUFJLENBQUMsVUFBTCxDQUFnQixJQUFDLENBQUEsT0FBakI7TUFDQSxJQUFJLENBQUMsWUFBTCxHQUFvQixJQUFDLENBQUE7YUFDckI7SUFKSTs7dUJBTU4sT0FBQSxHQUFTLFNBQUE7YUFDUCxJQUFDLENBQUEsT0FBTyxDQUFDLE1BQVQsS0FBbUI7SUFEWjs7dUJBR1QsS0FBQSxHQUFPLFNBQUE7YUFDTCxJQUFDLENBQUEsT0FBRCxHQUFXO0lBRE47O3VCQUdQLFVBQUEsR0FBWSxTQUFBO2FBQ1YsSUFBQyxDQUFBLE9BQU8sQ0FBQyxLQUFULENBQUE7SUFEVTs7dUJBR1osVUFBQSxHQUFZLFNBQUMsT0FBRDtNQUNWLElBQUMsQ0FBQSxPQUFELEdBQVcsT0FBTyxDQUFDLEtBQVIsQ0FBQTtNQUNYLElBQUMsQ0FBQSxZQUFELEdBQWdCLElBQUMsQ0FBQSxPQUFPLENBQUMsTUFBVCxHQUFrQjthQUNsQztJQUhVOzt1QkFLWixJQUFBLEdBQU0sU0FBQyxJQUFEO01BQ0osSUFBQyxDQUFBLE9BQU8sQ0FBQyxJQUFULENBQWMsSUFBZDtNQUNBLElBQUcsSUFBQyxDQUFBLE9BQU8sQ0FBQyxNQUFULEdBQWtCLElBQUMsQ0FBQSxLQUF0QjtRQUNFLElBQUMsQ0FBQSxPQUFPLENBQUMsS0FBVCxDQUFBLEVBREY7O2FBRUEsSUFBQyxDQUFBLFlBQUQsR0FBZ0IsSUFBQyxDQUFBLE9BQU8sQ0FBQyxNQUFULEdBQWtCO0lBSjlCOzt1QkFNTixNQUFBLEdBQVEsU0FBQyxJQUFEO0FBQ04sVUFBQTtNQUFBLElBQUcsSUFBQyxDQUFBLE9BQU8sQ0FBQyxNQUFULEtBQW1CLENBQXRCO2VBQ0UsSUFBQyxDQUFBLElBQUQsQ0FBTSxJQUFOLEVBREY7T0FBQSxNQUFBO1FBR0UsS0FBQSxHQUFRLElBQUMsQ0FBQSxPQUFPLENBQUMsTUFBVCxHQUFrQjtRQUMxQixJQUFDLENBQUEsT0FBUSxDQUFBLEtBQUEsQ0FBVCxJQUFtQjtlQUNuQixJQUFDLENBQUEsWUFBRCxHQUFnQixJQUFDLENBQUEsT0FBTyxDQUFDLE1BQVQsR0FBa0IsRUFMcEM7O0lBRE07O3VCQVFSLE9BQUEsR0FBUyxTQUFDLElBQUQ7QUFDUCxVQUFBO01BQUEsSUFBRyxJQUFDLENBQUEsT0FBTyxDQUFDLE1BQVQsS0FBbUIsQ0FBdEI7ZUFDRSxJQUFDLENBQUEsSUFBRCxDQUFNLElBQU4sRUFERjtPQUFBLE1BQUE7UUFHRSxLQUFBLEdBQVEsSUFBQyxDQUFBLE9BQU8sQ0FBQyxNQUFULEdBQWtCO1FBQzFCLElBQUMsQ0FBQSxPQUFRLENBQUEsS0FBQSxDQUFULEdBQWtCLEVBQUEsR0FBRyxJQUFILEdBQVUsSUFBQyxDQUFBLE9BQVEsQ0FBQSxLQUFBO2VBQ3JDLElBQUMsQ0FBQSxZQUFELEdBQWdCLElBQUMsQ0FBQSxPQUFPLENBQUMsTUFBVCxHQUFrQixFQUxwQzs7SUFETzs7dUJBUVQsZUFBQSxHQUFpQixTQUFBO01BQ2YsSUFBRyxJQUFDLENBQUEsT0FBTyxDQUFDLE1BQVQsS0FBbUIsQ0FBdEI7QUFDRSxlQUFPLEtBRFQ7T0FBQSxNQUFBO2VBR0UsSUFBQyxDQUFBLE9BQVEsQ0FBQSxJQUFDLENBQUEsWUFBRCxFQUhYOztJQURlOzt1QkFNakIsTUFBQSxHQUFRLFNBQUMsQ0FBRDtNQUNOLElBQWUsSUFBQyxDQUFBLE9BQU8sQ0FBQyxNQUFULEtBQW1CLENBQWxDO0FBQUEsZUFBTyxLQUFQOztNQUNBLElBQUMsQ0FBQSxZQUFELEdBQWdCLENBQUMsSUFBQyxDQUFBLFlBQUQsR0FBZ0IsQ0FBakIsQ0FBQSxHQUFzQixJQUFDLENBQUEsT0FBTyxDQUFDO01BQy9DLElBQW9DLElBQUMsQ0FBQSxZQUFELEdBQWdCLENBQXBEO1FBQUEsSUFBQyxDQUFBLFlBQUQsSUFBaUIsSUFBQyxDQUFBLE9BQU8sQ0FBQyxPQUExQjs7QUFDQSxhQUFPLElBQUMsQ0FBQSxPQUFRLENBQUEsSUFBQyxDQUFBLFlBQUQ7SUFKVjs7SUFNUixRQUFDLENBQUEsTUFBRCxHQUFVLElBQUk7Ozs7O0FBN0RoQiIsInNvdXJjZXNDb250ZW50IjpbIm1vZHVsZS5leHBvcnRzID1cbmNsYXNzIEtpbGxSaW5nXG4gIGNvbnN0cnVjdG9yOiAtPlxuICAgIEBjdXJyZW50SW5kZXggPSAtMVxuICAgIEBlbnRyaWVzID0gW11cbiAgICBAbGltaXQgPSA1MDBcblxuICBmb3JrOiAtPlxuICAgIGZvcmsgPSBuZXcgS2lsbFJpbmdcbiAgICBmb3JrLnNldEVudHJpZXMoQGVudHJpZXMpXG4gICAgZm9yay5jdXJyZW50SW5kZXggPSBAY3VycmVudEluZGV4XG4gICAgZm9ya1xuXG4gIGlzRW1wdHk6IC0+XG4gICAgQGVudHJpZXMubGVuZ3RoID09IDBcblxuICByZXNldDogLT5cbiAgICBAZW50cmllcyA9IFtdXG5cbiAgZ2V0RW50cmllczogLT5cbiAgICBAZW50cmllcy5zbGljZSgpXG5cbiAgc2V0RW50cmllczogKGVudHJpZXMpIC0+XG4gICAgQGVudHJpZXMgPSBlbnRyaWVzLnNsaWNlKClcbiAgICBAY3VycmVudEluZGV4ID0gQGVudHJpZXMubGVuZ3RoIC0gMVxuICAgIHRoaXNcblxuICBwdXNoOiAodGV4dCkgLT5cbiAgICBAZW50cmllcy5wdXNoKHRleHQpXG4gICAgaWYgQGVudHJpZXMubGVuZ3RoID4gQGxpbWl0XG4gICAgICBAZW50cmllcy5zaGlmdCgpXG4gICAgQGN1cnJlbnRJbmRleCA9IEBlbnRyaWVzLmxlbmd0aCAtIDFcblxuICBhcHBlbmQ6ICh0ZXh0KSAtPlxuICAgIGlmIEBlbnRyaWVzLmxlbmd0aCA9PSAwXG4gICAgICBAcHVzaCh0ZXh0KVxuICAgIGVsc2VcbiAgICAgIGluZGV4ID0gQGVudHJpZXMubGVuZ3RoIC0gMVxuICAgICAgQGVudHJpZXNbaW5kZXhdICs9IHRleHRcbiAgICAgIEBjdXJyZW50SW5kZXggPSBAZW50cmllcy5sZW5ndGggLSAxXG5cbiAgcHJlcGVuZDogKHRleHQpIC0+XG4gICAgaWYgQGVudHJpZXMubGVuZ3RoID09IDBcbiAgICAgIEBwdXNoKHRleHQpXG4gICAgZWxzZVxuICAgICAgaW5kZXggPSBAZW50cmllcy5sZW5ndGggLSAxXG4gICAgICBAZW50cmllc1tpbmRleF0gPSBcIiN7dGV4dH0je0BlbnRyaWVzW2luZGV4XX1cIlxuICAgICAgQGN1cnJlbnRJbmRleCA9IEBlbnRyaWVzLmxlbmd0aCAtIDFcblxuICBnZXRDdXJyZW50RW50cnk6IC0+XG4gICAgaWYgQGVudHJpZXMubGVuZ3RoID09IDBcbiAgICAgIHJldHVybiBudWxsXG4gICAgZWxzZVxuICAgICAgQGVudHJpZXNbQGN1cnJlbnRJbmRleF1cblxuICByb3RhdGU6IChuKSAtPlxuICAgIHJldHVybiBudWxsIGlmIEBlbnRyaWVzLmxlbmd0aCA9PSAwXG4gICAgQGN1cnJlbnRJbmRleCA9IChAY3VycmVudEluZGV4ICsgbikgJSBAZW50cmllcy5sZW5ndGhcbiAgICBAY3VycmVudEluZGV4ICs9IEBlbnRyaWVzLmxlbmd0aCBpZiBAY3VycmVudEluZGV4IDwgMFxuICAgIHJldHVybiBAZW50cmllc1tAY3VycmVudEluZGV4XVxuXG4gIEBnbG9iYWwgPSBuZXcgS2lsbFJpbmdcbiJdfQ==
