Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var _triejs = require('triejs');

'use babel';

function sortTrie() {
  this.sort(function (a, b) {
    var compare = b.lastUsed - a.lastUsed;
    if (compare === 0) {
      compare = a.name.localeCompare(b.name);
    }
    return compare;
  });
}

var Dictionary = (function () {
  function Dictionary() {
    _classCallCheck(this, Dictionary);

    this.tries = new Map();
  }

  _createClass(Dictionary, [{
    key: 'add',
    value: function add(category, name, desc) {
      this._getTrie(category, true).add(name, desc);
    }
  }, {
    key: 'remove',
    value: function remove(category, name) {
      try {
        this._getTrie(category, true).remove(name);
      } catch (err) {
        // OK
      }
    }
  }, {
    key: 'removeCategory',
    value: function removeCategory(category) {
      this.tries['delete'](category);
    }
  }, {
    key: 'find',
    value: function find(category, namePrefix) {
      var trie = this._getTrie(category);
      return trie ? trie.find(namePrefix) : [];
    }
  }, {
    key: 'touch',
    value: function touch(result) {
      result.lastUsed = Date.now();
    }
  }, {
    key: '_getTrie',
    value: function _getTrie(category, create) {
      var trie = this.tries.get(category);
      if (!trie && create) {
        trie = new _triejs.Triejs({
          returnRoot: true,
          sort: sortTrie,
          enableCache: false
        });
        this.tries.set(category, trie);
      }
      return trie;
    }
  }]);

  return Dictionary;
})();

exports.Dictionary = Dictionary;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9ob21lL2pha2UvLmF0b20vcGFja2FnZXMvYXV0b2NvbXBsZXRlLWphdmEvbGliL0RpY3Rpb25hcnkuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7c0JBRXVCLFFBQVE7O0FBRi9CLFdBQVcsQ0FBQzs7QUFJWixTQUFTLFFBQVEsR0FBRztBQUNsQixNQUFJLENBQUMsSUFBSSxDQUFDLFVBQUMsQ0FBQyxFQUFFLENBQUMsRUFBSztBQUNsQixRQUFJLE9BQU8sR0FBRyxDQUFDLENBQUMsUUFBUSxHQUFHLENBQUMsQ0FBQyxRQUFRLENBQUM7QUFDdEMsUUFBSSxPQUFPLEtBQUssQ0FBQyxFQUFFO0FBQ2pCLGFBQU8sR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUM7S0FDeEM7QUFDRCxXQUFPLE9BQU8sQ0FBQztHQUNoQixDQUFDLENBQUM7Q0FDSjs7SUFFWSxVQUFVO0FBRVYsV0FGQSxVQUFVLEdBRVA7MEJBRkgsVUFBVTs7QUFHbkIsUUFBSSxDQUFDLEtBQUssR0FBRyxJQUFJLEdBQUcsRUFBRSxDQUFDO0dBQ3hCOztlQUpVLFVBQVU7O1dBTWxCLGFBQUMsUUFBUSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUU7QUFDeEIsVUFBSSxDQUFDLFFBQVEsQ0FBQyxRQUFRLEVBQUUsSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQztLQUMvQzs7O1dBRUssZ0JBQUMsUUFBUSxFQUFFLElBQUksRUFBRTtBQUNyQixVQUFJO0FBQ0YsWUFBSSxDQUFDLFFBQVEsQ0FBQyxRQUFRLEVBQUUsSUFBSSxDQUFDLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDO09BQzVDLENBQUMsT0FBTyxHQUFHLEVBQUU7O09BRWI7S0FDRjs7O1dBRWEsd0JBQUMsUUFBUSxFQUFFO0FBQ3ZCLFVBQUksQ0FBQyxLQUFLLFVBQU8sQ0FBQyxRQUFRLENBQUMsQ0FBQztLQUM3Qjs7O1dBRUcsY0FBQyxRQUFRLEVBQUUsVUFBVSxFQUFFO0FBQ3pCLFVBQU0sSUFBSSxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUMsUUFBUSxDQUFDLENBQUM7QUFDckMsYUFBTyxJQUFJLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsR0FBRyxFQUFFLENBQUM7S0FDMUM7OztXQUVJLGVBQUMsTUFBTSxFQUFFO0FBQ1osWUFBTSxDQUFDLFFBQVEsR0FBRyxJQUFJLENBQUMsR0FBRyxFQUFFLENBQUM7S0FDOUI7OztXQUVPLGtCQUFDLFFBQVEsRUFBRSxNQUFNLEVBQUU7QUFDekIsVUFBSSxJQUFJLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLENBQUM7QUFDcEMsVUFBSSxDQUFDLElBQUksSUFBSSxNQUFNLEVBQUU7QUFDbkIsWUFBSSxHQUFHLG1CQUFXO0FBQ2hCLG9CQUFVLEVBQUUsSUFBSTtBQUNoQixjQUFJLEVBQUUsUUFBUTtBQUNkLHFCQUFXLEVBQUUsS0FBSztTQUNuQixDQUFDLENBQUM7QUFDSCxZQUFJLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxRQUFRLEVBQUUsSUFBSSxDQUFDLENBQUM7T0FDaEM7QUFDRCxhQUFPLElBQUksQ0FBQztLQUNiOzs7U0ExQ1UsVUFBVSIsImZpbGUiOiIvaG9tZS9qYWtlLy5hdG9tL3BhY2thZ2VzL2F1dG9jb21wbGV0ZS1qYXZhL2xpYi9EaWN0aW9uYXJ5LmpzIiwic291cmNlc0NvbnRlbnQiOlsiJ3VzZSBiYWJlbCc7XG5cbmltcG9ydCB7IFRyaWVqcyB9IGZyb20gJ3RyaWVqcyc7XG5cbmZ1bmN0aW9uIHNvcnRUcmllKCkge1xuICB0aGlzLnNvcnQoKGEsIGIpID0+IHtcbiAgICBsZXQgY29tcGFyZSA9IGIubGFzdFVzZWQgLSBhLmxhc3RVc2VkO1xuICAgIGlmIChjb21wYXJlID09PSAwKSB7XG4gICAgICBjb21wYXJlID0gYS5uYW1lLmxvY2FsZUNvbXBhcmUoYi5uYW1lKTtcbiAgICB9XG4gICAgcmV0dXJuIGNvbXBhcmU7XG4gIH0pO1xufVxuXG5leHBvcnQgY2xhc3MgRGljdGlvbmFyeSB7XG5cbiAgY29uc3RydWN0b3IoKSB7XG4gICAgdGhpcy50cmllcyA9IG5ldyBNYXAoKTtcbiAgfVxuXG4gIGFkZChjYXRlZ29yeSwgbmFtZSwgZGVzYykge1xuICAgIHRoaXMuX2dldFRyaWUoY2F0ZWdvcnksIHRydWUpLmFkZChuYW1lLCBkZXNjKTtcbiAgfVxuXG4gIHJlbW92ZShjYXRlZ29yeSwgbmFtZSkge1xuICAgIHRyeSB7XG4gICAgICB0aGlzLl9nZXRUcmllKGNhdGVnb3J5LCB0cnVlKS5yZW1vdmUobmFtZSk7XG4gICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAvLyBPS1xuICAgIH1cbiAgfVxuXG4gIHJlbW92ZUNhdGVnb3J5KGNhdGVnb3J5KSB7XG4gICAgdGhpcy50cmllcy5kZWxldGUoY2F0ZWdvcnkpO1xuICB9XG5cbiAgZmluZChjYXRlZ29yeSwgbmFtZVByZWZpeCkge1xuICAgIGNvbnN0IHRyaWUgPSB0aGlzLl9nZXRUcmllKGNhdGVnb3J5KTtcbiAgICByZXR1cm4gdHJpZSA/IHRyaWUuZmluZChuYW1lUHJlZml4KSA6IFtdO1xuICB9XG5cbiAgdG91Y2gocmVzdWx0KSB7XG4gICAgcmVzdWx0Lmxhc3RVc2VkID0gRGF0ZS5ub3coKTtcbiAgfVxuXG4gIF9nZXRUcmllKGNhdGVnb3J5LCBjcmVhdGUpIHtcbiAgICBsZXQgdHJpZSA9IHRoaXMudHJpZXMuZ2V0KGNhdGVnb3J5KTtcbiAgICBpZiAoIXRyaWUgJiYgY3JlYXRlKSB7XG4gICAgICB0cmllID0gbmV3IFRyaWVqcyh7XG4gICAgICAgIHJldHVyblJvb3Q6IHRydWUsXG4gICAgICAgIHNvcnQ6IHNvcnRUcmllLFxuICAgICAgICBlbmFibGVDYWNoZTogZmFsc2UsXG4gICAgICB9KTtcbiAgICAgIHRoaXMudHJpZXMuc2V0KGNhdGVnb3J5LCB0cmllKTtcbiAgICB9XG4gICAgcmV0dXJuIHRyaWU7XG4gIH1cblxufVxuIl19