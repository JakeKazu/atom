(function() {
  var SearchHistoryManager, _, settings;

  _ = require('underscore-plus');

  settings = require('./settings');

  module.exports = SearchHistoryManager = (function() {
    SearchHistoryManager.prototype.idx = null;

    function SearchHistoryManager(vimState) {
      this.vimState = vimState;
      this.globalState = this.vimState.globalState;
      this.idx = -1;
    }

    SearchHistoryManager.prototype.get = function(direction) {
      var ref;
      switch (direction) {
        case 'prev':
          if ((this.idx + 1) !== this.getSize()) {
            this.idx += 1;
          }
          break;
        case 'next':
          if (!(this.idx === -1)) {
            this.idx -= 1;
          }
      }
      return (ref = this.globalState.get('searchHistory')[this.idx]) != null ? ref : '';
    };

    SearchHistoryManager.prototype.save = function(entry) {
      var entries;
      if (_.isEmpty(entry)) {
        return;
      }
      entries = _.uniq([entry].concat(this.getEntries()));
      if (this.getSize() > settings.get('historySize')) {
        entries.splice(settings.get('historySize'));
      }
      return this.globalState.set('searchHistory', entries);
    };

    SearchHistoryManager.prototype.reset = function() {
      return this.idx = -1;
    };

    SearchHistoryManager.prototype.clear = function() {
      return this.globalState.reset('searchHistory');
    };

    SearchHistoryManager.prototype.getSize = function() {
      return this.getEntries().length;
    };

    SearchHistoryManager.prototype.getEntries = function() {
      return this.globalState.get('searchHistory');
    };

    SearchHistoryManager.prototype.destroy = function() {
      return this.idx = null;
    };

    return SearchHistoryManager;

  })();

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL2hvbWUvamFrZS8uYXRvbS9wYWNrYWdlcy92aW0tbW9kZS1wbHVzL2xpYi9zZWFyY2gtaGlzdG9yeS1tYW5hZ2VyLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUFBLE1BQUE7O0VBQUEsQ0FBQSxHQUFJLE9BQUEsQ0FBUSxpQkFBUjs7RUFDSixRQUFBLEdBQVcsT0FBQSxDQUFRLFlBQVI7O0VBRVgsTUFBTSxDQUFDLE9BQVAsR0FDTTttQ0FDSixHQUFBLEdBQUs7O0lBRVEsOEJBQUMsUUFBRDtNQUFDLElBQUMsQ0FBQSxXQUFEO01BQ1gsSUFBQyxDQUFBLGNBQWUsSUFBQyxDQUFBLFNBQWhCO01BQ0YsSUFBQyxDQUFBLEdBQUQsR0FBTyxDQUFDO0lBRkc7O21DQUliLEdBQUEsR0FBSyxTQUFDLFNBQUQ7QUFDSCxVQUFBO0FBQUEsY0FBTyxTQUFQO0FBQUEsYUFDTyxNQURQO1VBQ21CLElBQWlCLENBQUMsSUFBQyxDQUFBLEdBQUQsR0FBTyxDQUFSLENBQUEsS0FBYyxJQUFDLENBQUEsT0FBRCxDQUFBLENBQS9CO1lBQUEsSUFBQyxDQUFBLEdBQUQsSUFBUSxFQUFSOztBQUFaO0FBRFAsYUFFTyxNQUZQO1VBRW1CLElBQUEsQ0FBaUIsQ0FBQyxJQUFDLENBQUEsR0FBRCxLQUFRLENBQUMsQ0FBVixDQUFqQjtZQUFBLElBQUMsQ0FBQSxHQUFELElBQVEsRUFBUjs7QUFGbkI7cUZBRzBDO0lBSnZDOzttQ0FNTCxJQUFBLEdBQU0sU0FBQyxLQUFEO0FBQ0osVUFBQTtNQUFBLElBQVUsQ0FBQyxDQUFDLE9BQUYsQ0FBVSxLQUFWLENBQVY7QUFBQSxlQUFBOztNQUNBLE9BQUEsR0FBVSxDQUFDLENBQUMsSUFBRixDQUFPLENBQUMsS0FBRCxDQUFPLENBQUMsTUFBUixDQUFlLElBQUMsQ0FBQSxVQUFELENBQUEsQ0FBZixDQUFQO01BQ1YsSUFBRyxJQUFDLENBQUEsT0FBRCxDQUFBLENBQUEsR0FBYSxRQUFRLENBQUMsR0FBVCxDQUFhLGFBQWIsQ0FBaEI7UUFDRSxPQUFPLENBQUMsTUFBUixDQUFlLFFBQVEsQ0FBQyxHQUFULENBQWEsYUFBYixDQUFmLEVBREY7O2FBRUEsSUFBQyxDQUFBLFdBQVcsQ0FBQyxHQUFiLENBQWlCLGVBQWpCLEVBQWtDLE9BQWxDO0lBTEk7O21DQU9OLEtBQUEsR0FBTyxTQUFBO2FBQ0wsSUFBQyxDQUFBLEdBQUQsR0FBTyxDQUFDO0lBREg7O21DQUdQLEtBQUEsR0FBTyxTQUFBO2FBQ0wsSUFBQyxDQUFBLFdBQVcsQ0FBQyxLQUFiLENBQW1CLGVBQW5CO0lBREs7O21DQUdQLE9BQUEsR0FBUyxTQUFBO2FBQ1AsSUFBQyxDQUFBLFVBQUQsQ0FBQSxDQUFhLENBQUM7SUFEUDs7bUNBR1QsVUFBQSxHQUFZLFNBQUE7YUFDVixJQUFDLENBQUEsV0FBVyxDQUFDLEdBQWIsQ0FBaUIsZUFBakI7SUFEVTs7bUNBR1osT0FBQSxHQUFTLFNBQUE7YUFDUCxJQUFDLENBQUEsR0FBRCxHQUFPO0lBREE7Ozs7O0FBcENYIiwic291cmNlc0NvbnRlbnQiOlsiXyA9IHJlcXVpcmUgJ3VuZGVyc2NvcmUtcGx1cydcbnNldHRpbmdzID0gcmVxdWlyZSAnLi9zZXR0aW5ncydcblxubW9kdWxlLmV4cG9ydHMgPVxuY2xhc3MgU2VhcmNoSGlzdG9yeU1hbmFnZXJcbiAgaWR4OiBudWxsXG5cbiAgY29uc3RydWN0b3I6IChAdmltU3RhdGUpIC0+XG4gICAge0BnbG9iYWxTdGF0ZX0gPSBAdmltU3RhdGVcbiAgICBAaWR4ID0gLTFcblxuICBnZXQ6IChkaXJlY3Rpb24pIC0+XG4gICAgc3dpdGNoIGRpcmVjdGlvblxuICAgICAgd2hlbiAncHJldicgdGhlbiBAaWR4ICs9IDEgdW5sZXNzIChAaWR4ICsgMSkgaXMgQGdldFNpemUoKVxuICAgICAgd2hlbiAnbmV4dCcgdGhlbiBAaWR4IC09IDEgdW5sZXNzIChAaWR4IGlzIC0xKVxuICAgIEBnbG9iYWxTdGF0ZS5nZXQoJ3NlYXJjaEhpc3RvcnknKVtAaWR4XSA/ICcnXG5cbiAgc2F2ZTogKGVudHJ5KSAtPlxuICAgIHJldHVybiBpZiBfLmlzRW1wdHkoZW50cnkpXG4gICAgZW50cmllcyA9IF8udW5pcShbZW50cnldLmNvbmNhdChAZ2V0RW50cmllcygpKSlcbiAgICBpZiBAZ2V0U2l6ZSgpID4gc2V0dGluZ3MuZ2V0KCdoaXN0b3J5U2l6ZScpXG4gICAgICBlbnRyaWVzLnNwbGljZShzZXR0aW5ncy5nZXQoJ2hpc3RvcnlTaXplJykpXG4gICAgQGdsb2JhbFN0YXRlLnNldCgnc2VhcmNoSGlzdG9yeScsIGVudHJpZXMpXG5cbiAgcmVzZXQ6IC0+XG4gICAgQGlkeCA9IC0xXG5cbiAgY2xlYXI6IC0+XG4gICAgQGdsb2JhbFN0YXRlLnJlc2V0KCdzZWFyY2hIaXN0b3J5JylcblxuICBnZXRTaXplOiAtPlxuICAgIEBnZXRFbnRyaWVzKCkubGVuZ3RoXG5cbiAgZ2V0RW50cmllczogLT5cbiAgICBAZ2xvYmFsU3RhdGUuZ2V0KCdzZWFyY2hIaXN0b3J5JylcblxuICBkZXN0cm95OiAtPlxuICAgIEBpZHggPSBudWxsXG4iXX0=
