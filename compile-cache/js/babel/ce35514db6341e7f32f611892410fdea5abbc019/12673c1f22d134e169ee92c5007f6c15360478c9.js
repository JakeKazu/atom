Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var _lodash = require('lodash');

'use babel';

var JavaUtil = (function () {
  function JavaUtil() {
    _classCallCheck(this, JavaUtil);
  }

  _createClass(JavaUtil, [{
    key: 'getSimpleName',
    value: function getSimpleName(className) {
      return className.replace(/[a-z]*\./g, '');
    }
  }, {
    key: 'getPackageName',
    value: function getPackageName(className) {
      return className.replace('.' + this.getSimpleName(className), '');
    }
  }, {
    key: 'getInverseName',
    value: function getInverseName(className) {
      return _lodash._.reduceRight(className.split('.'), function (result, next) {
        return result + next;
      }, '');
    }
  }]);

  return JavaUtil;
})();

exports['default'] = new JavaUtil();
module.exports = exports['default'];
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9ob21lL2pha2UvLmF0b20vcGFja2FnZXMvYXV0b2NvbXBsZXRlLWphdmEvbGliL2phdmFVdGlsLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7O3NCQUVrQixRQUFROztBQUYxQixXQUFXLENBQUM7O0lBSU4sUUFBUTtXQUFSLFFBQVE7MEJBQVIsUUFBUTs7O2VBQVIsUUFBUTs7V0FFQyx1QkFBQyxTQUFTLEVBQUU7QUFDdkIsYUFBTyxTQUFTLENBQUMsT0FBTyxDQUFDLFdBQVcsRUFBRSxFQUFFLENBQUMsQ0FBQztLQUMzQzs7O1dBRWEsd0JBQUMsU0FBUyxFQUFFO0FBQ3hCLGFBQU8sU0FBUyxDQUFDLE9BQU8sQ0FBQyxHQUFHLEdBQUcsSUFBSSxDQUFDLGFBQWEsQ0FBQyxTQUFTLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQztLQUNuRTs7O1dBRWEsd0JBQUMsU0FBUyxFQUFFO0FBQ3hCLGFBQU8sVUFBRSxXQUFXLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsRUFBRSxVQUFDLE1BQU0sRUFBRSxJQUFJLEVBQUs7QUFDM0QsZUFBTyxNQUFNLEdBQUcsSUFBSSxDQUFDO09BQ3RCLEVBQUUsRUFBRSxDQUFDLENBQUM7S0FDUjs7O1NBZEcsUUFBUTs7O3FCQWtCQyxJQUFJLFFBQVEsRUFBRSIsImZpbGUiOiIvaG9tZS9qYWtlLy5hdG9tL3BhY2thZ2VzL2F1dG9jb21wbGV0ZS1qYXZhL2xpYi9qYXZhVXRpbC5qcyIsInNvdXJjZXNDb250ZW50IjpbIid1c2UgYmFiZWwnO1xuXG5pbXBvcnQgeyBfIH0gZnJvbSAnbG9kYXNoJztcblxuY2xhc3MgSmF2YVV0aWwge1xuXG4gIGdldFNpbXBsZU5hbWUoY2xhc3NOYW1lKSB7XG4gICAgcmV0dXJuIGNsYXNzTmFtZS5yZXBsYWNlKC9bYS16XSpcXC4vZywgJycpO1xuICB9XG5cbiAgZ2V0UGFja2FnZU5hbWUoY2xhc3NOYW1lKSB7XG4gICAgcmV0dXJuIGNsYXNzTmFtZS5yZXBsYWNlKCcuJyArIHRoaXMuZ2V0U2ltcGxlTmFtZShjbGFzc05hbWUpLCAnJyk7XG4gIH1cblxuICBnZXRJbnZlcnNlTmFtZShjbGFzc05hbWUpIHtcbiAgICByZXR1cm4gXy5yZWR1Y2VSaWdodChjbGFzc05hbWUuc3BsaXQoJy4nKSwgKHJlc3VsdCwgbmV4dCkgPT4ge1xuICAgICAgcmV0dXJuIHJlc3VsdCArIG5leHQ7XG4gICAgfSwgJycpO1xuICB9XG5cbn1cblxuZXhwb3J0IGRlZmF1bHQgbmV3IEphdmFVdGlsKCk7XG4iXX0=