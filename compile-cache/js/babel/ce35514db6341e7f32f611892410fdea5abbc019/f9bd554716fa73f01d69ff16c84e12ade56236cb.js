Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var _lodash = require('lodash');

var _javaUtil = require('./javaUtil');

var _javaUtil2 = _interopRequireDefault(_javaUtil);

'use babel';

var AtomJavaUtil = (function () {
  function AtomJavaUtil() {
    _classCallCheck(this, AtomJavaUtil);
  }

  _createClass(AtomJavaUtil, [{
    key: 'getCurrentPackageName',
    value: function getCurrentPackageName(editor) {
      return this._lastMatch(editor.getText(), /package ([^;]*);/);
    }
  }, {
    key: 'getCurrentClassSimpleName',
    value: function getCurrentClassSimpleName(editor) {
      return editor.getTitle().split('.')[0];
    }
  }, {
    key: 'getCurrentClassName',
    value: function getCurrentClassName(editor) {
      return this.getCurrentPackageName(editor) + '.' + this.getCurrentClassName(editor);
    }
  }, {
    key: 'getImportedClassName',
    value: function getImportedClassName(editor, classSimpleName) {
      return this._lastMatch(editor.getText(), new RegExp('import (.*' + classSimpleName + ');'));
    }
  }, {
    key: 'getPossibleClassNames',
    value: function getPossibleClassNames(editor, classSimpleName, prefix) {
      var classNames = [];
      var className = this.getImportedClassName(editor, classSimpleName);
      if (className) {
        classNames.push(className);
      } else {
        if (prefix.indexOf('.') === -1) {
          // Use package name of current file or 'java.lang'
          classNames.push(this.getCurrentPackageName(editor) + '.' + classSimpleName);
          classNames.push('java.lang.' + classSimpleName);
        } else {
          // Use the whole prefix as classname
          classNames.push(prefix);
        }
      }
      return classNames;
    }
  }, {
    key: 'getLine',
    value: function getLine(editor, bufferPosition) {
      return editor.getTextInRange([[bufferPosition.row, 0], bufferPosition]);
    }
  }, {
    key: 'getWord',
    value: function getWord(editor, bufferPosition, removeParenthesis) {
      var line = this.getLine(editor, bufferPosition);
      return this.getLastWord(line, removeParenthesis);
    }
  }, {
    key: 'getLastWord',
    value: function getLastWord(line, removeParenthesis) {
      var result = this._lastMatch(line, /[^\s-]+$/);
      return removeParenthesis ? result.replace(/.*\(/, '') : result;
    }
  }, {
    key: 'getPrevWord',
    value: function getPrevWord(editor, bufferPosition) {
      var words = this.getLine(editor, bufferPosition).split(/[\s\(]+/);
      return words.length >= 2 ? words[words.length - 2] : null;
    }
  }, {
    key: 'importClass',
    value: function importClass(editor, className, foldImports) {
      // Add import statement if import does not already exist.
      // But do not import if class belongs in java.lang or current package.
      var packageName = _javaUtil2['default'].getPackageName(className);
      if (!this.getImportedClassName(editor, className) && packageName !== 'java.lang' && packageName !== this.getCurrentPackageName(editor)) {
        this.organizeImports(editor, 'import ' + className + ';', foldImports);
      }
    }
  }, {
    key: 'getImports',
    value: function getImports(editor) {
      var buffer = editor.getBuffer();
      return buffer.getText().match(/import\s.*;/g) || [];
    }
  }, {
    key: 'organizeImports',
    value: function organizeImports(editor, newImport, foldImports) {
      var _this = this;

      var buffer = editor.getBuffer();
      buffer.transact(function () {
        // Get current imports
        var imports = _this.getImports(editor);
        if (newImport) {
          imports.push(newImport);
        }
        // Remove current imports
        buffer.replace(/import\s.*;[\r\n]+/g, '');
        // Add sorted imports
        buffer.insert([1, 0], '\n');
        _lodash._.each(_lodash._.sortBy(imports), function (value, index) {
          buffer.insert([index + 2, 0], value + '\n');
        });

        if (foldImports) {
          _this.foldImports(editor);
        }
      });
    }
  }, {
    key: 'foldImports',
    value: function foldImports(editor) {
      var firstRow = 0;
      var lastRow = 0;
      var buffer = editor.getBuffer();
      buffer.scan(/import\s.*;/g, function (m) {
        lastRow = m.range.end.row;
      });

      if (lastRow) {
        var pos = editor.getCursorBufferPosition();
        editor.setSelectedBufferRange([[firstRow, 0], [lastRow, 0]]);
        editor.foldSelectedLines();
        editor.setCursorBufferPosition(pos);
      }
    }
  }, {
    key: 'determineClassName',
    value: function determineClassName(editor, bufferPosition, text, prefix, suffix, prevReturnType) {
      try {
        var classNames = null;
        var isInstance = /\)$/.test(prefix);

        var classSimpleName = null;

        // Determine class name
        if (!prefix || prefix === 'this') {
          // Use this as class name
          classSimpleName = this.getCurrentClassSimpleName(editor);
          isInstance = true;
        } else if (prefix) {
          // Get class name from prefix
          // Also support '((ClassName)var)' syntax (a quick hack)
          classSimpleName = this.getWord(editor, bufferPosition).indexOf('((') !== -1 ? prefix.match(/[^\)]*/)[0] : prefix;
        }

        if (!this._isValidClassName(classSimpleName) && !/[\.\)]/.test(prefix)) {
          // Find class name by a variable name given as prefix
          // TODO traverse brackets backwards to match correct scope (with regexp)
          // TODO handle 'this.varName' correctly
          classSimpleName = this._lastMatch(editor.getTextInRange([[bufferPosition.row - 25, 0], bufferPosition]), new RegExp('([A-Z][a-zA-Z0-9_]*)(<[A-Z][a-zA-Z0-9_<>, ]*>)?\\s' + prefix + '[,;=\\s\\)]', 'g'));
          classSimpleName = classSimpleName.replace(new RegExp('\\s+' + prefix + '[,;=\\s\\)]$'), '');
          classSimpleName = classSimpleName.replace(/\<.*\>/, '');

          isInstance = true;
        }

        if (this._isValidClassName(classSimpleName)) {
          // Convert simple name to a full class name and use that
          classNames = this.getPossibleClassNames(editor, classSimpleName, prefix);
        } else {
          // Just use return type of previous snippet (a quick hack)
          // TODO determine type using classloader
          classNames = [prevReturnType];
          isInstance = true;
        }

        return { classNames: classNames, isInstance: isInstance };
      } catch (err) {
        console.error(err);
        return {};
      }
    }
  }, {
    key: '_isValidClassName',
    value: function _isValidClassName(text) {
      return (/^[A-Z][^\.\)]*$/.test(text) || /\.[A-Z][^\.\)]*$/.test(text)
      );
    }
  }, {
    key: '_lastMatch',
    value: function _lastMatch(str, regex) {
      var array = str.match(regex) || [''];
      return array[array.length - 1];
    }
  }]);

  return AtomJavaUtil;
})();

exports['default'] = new AtomJavaUtil();
module.exports = exports['default'];
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9ob21lL2pha2UvLmF0b20vcGFja2FnZXMvYXV0b2NvbXBsZXRlLWphdmEvbGliL2F0b21KYXZhVXRpbC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7O3NCQUVrQixRQUFROzt3QkFDTCxZQUFZOzs7O0FBSGpDLFdBQVcsQ0FBQzs7SUFLTixZQUFZO1dBQVosWUFBWTswQkFBWixZQUFZOzs7ZUFBWixZQUFZOztXQUVLLCtCQUFDLE1BQU0sRUFBRTtBQUM1QixhQUFPLElBQUksQ0FBQyxVQUFVLENBQUMsTUFBTSxDQUFDLE9BQU8sRUFBRSxFQUFFLGtCQUFrQixDQUFDLENBQUM7S0FDOUQ7OztXQUV3QixtQ0FBQyxNQUFNLEVBQUU7QUFDaEMsYUFBTyxNQUFNLENBQUMsUUFBUSxFQUFFLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0tBQ3hDOzs7V0FFa0IsNkJBQUMsTUFBTSxFQUFFO0FBQzFCLGFBQU8sSUFBSSxDQUFDLHFCQUFxQixDQUFDLE1BQU0sQ0FBQyxHQUFHLEdBQUcsR0FDM0MsSUFBSSxDQUFDLG1CQUFtQixDQUFDLE1BQU0sQ0FBQyxDQUFDO0tBQ3RDOzs7V0FFbUIsOEJBQUMsTUFBTSxFQUFFLGVBQWUsRUFBRTtBQUM1QyxhQUFPLElBQUksQ0FBQyxVQUFVLENBQUMsTUFBTSxDQUFDLE9BQU8sRUFBRSxFQUNyQyxJQUFJLE1BQU0sQ0FBQyxZQUFZLEdBQUcsZUFBZSxHQUFHLElBQUksQ0FBQyxDQUFDLENBQUM7S0FDdEQ7OztXQUVvQiwrQkFBQyxNQUFNLEVBQUUsZUFBZSxFQUFFLE1BQU0sRUFBRTtBQUNyRCxVQUFNLFVBQVUsR0FBRyxFQUFFLENBQUM7QUFDdEIsVUFBTSxTQUFTLEdBQUcsSUFBSSxDQUFDLG9CQUFvQixDQUFDLE1BQU0sRUFBRSxlQUFlLENBQUMsQ0FBQztBQUNyRSxVQUFJLFNBQVMsRUFBRTtBQUNiLGtCQUFVLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFD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T0FBTyxDQUFDLFFBQVEsRUFBRSxFQUFFLENBQUMsQ0FBQzs7QUFFeEQsb0JBQVUsR0FBRyxJQUFJLENBQUM7U0FDbkI7O0FBRUQsWUFBSSxJQUFJLENBQUMsaUJBQWlCLENBQUMsZUFBZSxDQUFDLEVBQUU7O0FBRTNDLG9CQUFVLEdBQUcsSUFBSSxDQUFDLHFCQUFxQixDQUFDLE1BQU0sRUFBRSxlQUFlLEVBQzdELE1BQU0sQ0FBQyxDQUFDO1NBQ1gsTUFBTTs7O0FBR0wsb0JBQVUsR0FBRyxDQUFFLGNBQWMsQ0FBRSxDQUFDO0FBQ2hDLG9CQUFVLEdBQUcsSUFBSSxDQUFDO1NBQ25COztBQUVELGVBQU8sRUFBRSxVQUFVLEVBQVYsVUFBVSxFQUFFLFVBQVUsRUFBVixVQUFVLEVBQUUsQ0FBQztPQUNuQyxDQUFDLE9BQU8sR0FBRyxFQUFFO0FBQ1osZUFBTyxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQztBQUNuQixlQUFPLEVBQUUsQ0FBQztPQUNYO0tBQ0Y7OztXQUVnQiwyQkFBQyxJQUFJLEVBQUU7QUFDdEIsYUFBTyxrQkFBaUIsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksa0JBQWtCLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQztRQUFDO0tBQ3RFOzs7V0FFUyxvQkFBQyxHQUFHLEVBQUUsS0FBSyxFQUFFO0FBQ3JCLFVBQU0sS0FBSyxHQUFHLEdBQUcsQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQztBQUN2QyxhQUFPLEtBQUssQ0FBQyxLQUFLLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxDQUFDO0tBQ2hDOzs7U0E3S0csWUFBWTs7O3FCQWlMSCxJQUFJLFlBQVksRUFBRSIsImZpbGUiOiIvaG9tZS9qYWtlLy5hdG9tL3BhY2thZ2VzL2F1dG9jb21wbGV0ZS1qYXZhL2xpYi9hdG9tSmF2YVV0aWwuanMiLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIGJhYmVsJztcblxuaW1wb3J0IHsgXyB9IGZyb20gJ2xvZGFzaCc7XG5pbXBvcnQgamF2YVV0aWwgZnJvbSAnLi9qYXZhVXRpbCc7XG5cbmNsYXNzIEF0b21KYXZhVXRpbCB7XG5cbiAgZ2V0Q3VycmVudFBhY2thZ2VOYW1lKGVkaXRvcikge1xuICAgIHJldHVybiB0aGlzLl9sYXN0TWF0Y2goZWRpdG9yLmdldFRleHQoKSwgL3BhY2thZ2UgKFteO10qKTsvKTtcbiAgfVxuXG4gIGdldEN1cnJlbnRDbGFzc1NpbXBsZU5hbWUoZWRpdG9yKSB7XG4gICAgcmV0dXJuIGVkaXRvci5nZXRUaXRsZSgpLnNwbGl0KCcuJylbMF07XG4gIH1cblxuICBnZXRDdXJyZW50Q2xhc3NOYW1lKGVkaXRvcikge1xuICAgIHJldHVybiB0aGlzLmdldEN1cnJlbnRQYWNrYWdlTmFtZShlZGl0b3IpICsgJy4nXG4gICAgICArIHRoaXMuZ2V0Q3VycmVudENsYXNzTmFtZShlZGl0b3IpO1xuICB9XG5cbiAgZ2V0SW1wb3J0ZWRDbGFzc05hbWUoZWRpdG9yLCBjbGFzc1NpbXBsZU5hbWUpIHtcbiAgICByZXR1cm4gdGhpcy5fbGFzdE1hdGNoKGVkaXRvci5nZXRUZXh0KCksXG4gICAgICBuZXcgUmVnRXhwKCdpbXBvcnQgKC4qJyArIGNsYXNzU2ltcGxlTmFtZSArICcpOycpKTtcbiAgfVxuXG4gIGdldFBvc3NpYmxlQ2xhc3NOYW1lcyhlZGl0b3IsIGNsYXNzU2ltcGxlTmFtZSwgcHJlZml4KSB7XG4gICAgY29uc3QgY2xhc3NOYW1lcyA9IFtdO1xuICAgIGNvbnN0IGNsYXNzTmFtZSA9IHRoaXMuZ2V0SW1wb3J0ZWRDbGFzc05hbWUoZWRpdG9yLCBjbGFzc1NpbXBsZU5hbWUpO1xuICAgIGlmIChjbGFzc05hbWUpIHtcbiAgICAgIGNsYXNzTmFtZXMucHVzaChjbGFzc05hbWUpO1xuICAgIH0gZWxzZSB7XG4gICAgICBpZiAocHJlZml4LmluZGV4T2YoJy4nKSA9PT0gLTEpIHtcbiAgICAgICAgLy8gVXNlIHBhY2thZ2UgbmFtZSBvZiBjdXJyZW50IGZpbGUgb3IgJ2phdmEubGFuZydcbiAgICAgICAgY2xhc3NOYW1lcy5wdXNoKHRoaXMuZ2V0Q3VycmVudFBhY2thZ2VOYW1lKGVkaXRvcikgK1xuICAgICAgICAgICcuJyArIGNsYXNzU2ltcGxlTmFtZSk7XG4gICAgICAgIGNsYXNzTmFtZXMucHVzaCgnamF2YS5sYW5nLicgKyBjbGFzc1NpbXBsZU5hbWUpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgLy8gVXNlIHRoZSB3aG9sZSBwcmVmaXggYXMgY2xhc3NuYW1lXG4gICAgICAgIGNsYXNzTmFtZXMucHVzaChwcmVmaXgpO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gY2xhc3NOYW1lcztcbiAgfVxuXG4gIGdldExpbmUoZWRpdG9yLCBidWZmZXJQb3NpdGlvbikge1xuICAgIHJldHVybiBlZGl0b3IuZ2V0VGV4dEluUmFuZ2UoW1tidWZmZXJQb3NpdGlvbi5yb3csIDBdLCBidWZmZXJQb3NpdGlvbl0pO1xuICB9XG5cbiAgZ2V0V29yZChlZGl0b3IsIGJ1ZmZlclBvc2l0aW9uLCByZW1vdmVQYXJlbnRoZXNpcykge1xuICAgIGNvbnN0IGxpbmUgPSB0aGlzLmdldExpbmUoZWRpdG9yLCBidWZmZXJQb3NpdGlvbik7XG4gICAgcmV0dXJuIHRoaXMuZ2V0TGFzdFdvcmQobGluZSwgcmVtb3ZlUGFyZW50aGVzaXMpO1xuICB9XG5cbiAgZ2V0TGFzdFdvcmQobGluZSwgcmVtb3ZlUGFyZW50aGVzaXMpIHtcbiAgICBjb25zdCByZXN1bHQgPSB0aGlzLl9sYXN0TWF0Y2gobGluZSwgL1teXFxzLV0rJC8pO1xuICAgIHJldHVybiByZW1vdmVQYXJlbnRoZXNpcyA/IHJlc3VsdC5yZXBsYWNlKC8uKlxcKC8sICcnKSA6IHJlc3VsdDtcbiAgfVxuXG4gIGdldFByZXZXb3JkKGVkaXRvciwgYnVmZmVyUG9zaXRpb24pIHtcbiAgICBjb25zdCB3b3JkcyA9IHRoaXMuZ2V0TGluZShlZGl0b3IsIGJ1ZmZlclBvc2l0aW9uKS5zcGxpdCgvW1xcc1xcKF0rLyk7XG4gICAgcmV0dXJuIHdvcmRzLmxlbmd0aCA+PSAyID8gd29yZHNbd29yZHMubGVuZ3RoIC0gMl0gOiBudWxsO1xuICB9XG5cbiAgaW1wb3J0Q2xhc3MoZWRpdG9yLCBjbGFzc05hbWUsIGZvbGRJbXBvcnRzKSB7XG4gICAgLy8gQWRkIGltcG9ydCBzdGF0ZW1lbnQgaWYgaW1wb3J0IGRvZXMgbm90IGFscmVhZHkgZXhpc3QuXG4gICAgLy8gQnV0IGRvIG5vdCBpbXBvcnQgaWYgY2xhc3MgYmVsb25ncyBpbiBqYXZhLmxhbmcgb3IgY3VycmVudCBwYWNrYWdlLlxuICAgIGNvbnN0IHBhY2thZ2VOYW1lID0gamF2YVV0aWwuZ2V0UGFja2FnZU5hbWUoY2xhc3NOYW1lKTtcbiAgICBpZiAoIXRoaXMuZ2V0SW1wb3J0ZWRDbGFzc05hbWUoZWRpdG9yLCBjbGFzc05hbWUpICYmXG4gICAgICAgIHBhY2thZ2VOYW1lICE9PSAnamF2YS5sYW5nJyAmJlxuICAgICAgICBwYWNrYWdlTmFtZSAhPT0gdGhpcy5nZXRDdXJyZW50UGFja2FnZU5hbWUoZWRpdG9yKSkge1xuICAgICAgdGhpcy5vcmdhbml6ZUltcG9ydHMoZWRpdG9yLCAnaW1wb3J0ICcgKyBjbGFzc05hbWUgKyAnOycsIGZvbGRJbXBvcnRzKTtcbiAgICB9XG4gIH1cblxuICBnZXRJbXBvcnRzKGVkaXRvcikge1xuICAgIGNvbnN0IGJ1ZmZlciA9IGVkaXRvci5nZXRCdWZmZXIoKTtcbiAgICByZXR1cm4gYnVmZmVyLmdldFRleHQoKS5tYXRjaCgvaW1wb3J0XFxzLio7L2cpIHx8IFtdO1xuICB9XG5cbiAgb3JnYW5pemVJbXBvcnRzKGVkaXRvciwgbmV3SW1wb3J0LCBmb2xkSW1wb3J0cykge1xuICAgIGNvbnN0IGJ1ZmZlciA9IGVkaXRvci5nZXRCdWZmZXIoKTtcbiAgICBidWZmZXIudHJhbnNhY3QoKCkgPT4ge1xuICAgICAgLy8gR2V0IGN1cnJlbnQgaW1wb3J0c1xuICAgICAgY29uc3QgaW1wb3J0cyA9IHRoaXMuZ2V0SW1wb3J0cyhlZGl0b3IpO1xuICAgICAgaWYgKG5ld0ltcG9ydCkge1xuICAgICAgICBpbXBvcnRzLnB1c2gobmV3SW1wb3J0KTtcbiAgICAgIH1cbiAgICAgIC8vIFJlbW92ZSBjdXJyZW50IGltcG9ydHNcbiAgICAgIGJ1ZmZlci5yZXBsYWNlKC9pbXBvcnRcXHMuKjtbXFxyXFxuXSsvZywgJycpO1xuICAgICAgLy8gQWRkIHNvcnRlZCBpbXBvcnRzXG4gICAgICBidWZmZXIuaW5zZXJ0KFsxLCAwXSwgJ1xcbicpO1xuICAgICAgXy5lYWNoKF8uc29ydEJ5KGltcG9ydHMpLCAodmFsdWUsIGluZGV4KSA9PiB7XG4gICAgICAgIGJ1ZmZlci5pbnNlcnQoW2luZGV4ICsgMiwgMF0sIHZhbHVlICsgJ1xcbicpO1xuICAgICAgfSk7XG5cbiAgICAgIGlmIChmb2xkSW1wb3J0cykge1xuICAgICAgICB0aGlzLmZvbGRJbXBvcnRzKGVkaXRvcik7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxuICBmb2xkSW1wb3J0cyhlZGl0b3IpIHtcbiAgICBjb25zdCBmaXJzdFJvdyA9IDA7XG4gICAgbGV0IGxhc3RSb3cgPSAwO1xuICAgIGNvbnN0IGJ1ZmZlciA9IGVkaXRvci5nZXRCdWZmZXIoKTtcbiAgICBidWZmZXIuc2NhbigvaW1wb3J0XFxzLio7L2csIChtKSA9PiB7XG4gICAgICBsYXN0Um93ID0gbS5yYW5nZS5lbmQucm93O1xuICAgIH0pO1xuXG4gICAgaWYgKGxhc3RSb3cpIHtcbiAgICAgIGNvbnN0IHBvcyA9IGVkaXRvci5nZXRDdXJzb3JCdWZmZXJQb3NpdGlvbigpO1xuICAgICAgZWRpdG9yLnNldFNlbGVjdGVkQnVmZmVyUmFuZ2UoW1tmaXJzdFJvdywgMF0sIFtsYXN0Um93LCAwXV0pO1xuICAgICAgZWRpdG9yLmZvbGRTZWxlY3RlZExpbmVzKCk7XG4gICAgICBlZGl0b3Iuc2V0Q3Vyc29yQnVmZmVyUG9zaXRpb24ocG9zKTtcbiAgICB9XG4gIH1cblxuICBkZXRlcm1pbmVDbGFzc05hbWUoZWRpdG9yLCBidWZmZXJQb3NpdGlvbiwgdGV4dCwgcHJlZml4LCBzdWZmaXgsXG4gICAgICBwcmV2UmV0dXJuVHlwZSkge1xuICAgIHRyeSB7XG4gICAgICBsZXQgY2xhc3NOYW1lcyA9IG51bGw7XG4gICAgICBsZXQgaXNJbnN0YW5jZSA9IC9cXCkkLy50ZXN0KHByZWZpeCk7XG5cbiAgICAgIGxldCBjbGFzc1NpbXBsZU5hbWUgPSBudWxsO1xuXG4gICAgICAvLyBEZXRlcm1pbmUgY2xhc3MgbmFtZVxuICAgICAgaWYgKCFwcmVmaXggfHwgcHJlZml4ID09PSAndGhpcycpIHtcbiAgICAgICAgLy8gVXNlIHRoaXMgYXMgY2xhc3MgbmFtZVxuICAgICAgICBjbGFzc1NpbXBsZU5hbWUgPSB0aGlzLmdldEN1cnJlbnRDbGFzc1NpbXBsZU5hbWUoZWRpdG9yKTtcbiAgICAgICAgaXNJbnN0YW5jZSA9IHRydWU7XG4gICAgICB9IGVsc2UgaWYgKHByZWZpeCkge1xuICAgICAgICAvLyBHZXQgY2xhc3MgbmFtZSBmcm9tIHByZWZpeFxuICAgICAgICAvLyBBbHNvIHN1cHBvcnQgJygoQ2xhc3NOYW1lKXZhciknIHN5bnRheCAoYSBxdWljayBoYWNrKVxuICAgICAgICBjbGFzc1NpbXBsZU5hbWUgPSB0aGlzLmdldFdvcmQoZWRpdG9yLCBidWZmZXJQb3NpdGlvbilcbiAgICAgICAgICAuaW5kZXhPZignKCgnKSAhPT0gLTEgPyBwcmVmaXgubWF0Y2goL1teXFwpXSovKVswXSA6IHByZWZpeDtcbiAgICAgIH1cblxuICAgICAgaWYgKCF0aGlzLl9pc1ZhbGlkQ2xhc3NOYW1lKGNsYXNzU2ltcGxlTmFtZSkgJiZcbiAgICAgICAgICAhL1tcXC5cXCldLy50ZXN0KHByZWZpeCkpIHtcbiAgICAgICAgLy8gRmluZCBjbGFzcyBuYW1lIGJ5IGEgdmFyaWFibGUgbmFtZSBnaXZlbiBhcyBwcmVmaXhcbiAgICAgICAgLy8gVE9ETyB0cmF2ZXJzZSBicmFja2V0cyBiYWNrd2FyZHMgdG8gbWF0Y2ggY29ycmVjdCBzY29wZSAod2l0aCByZWdleHApXG4gICAgICAgIC8vIFRPRE8gaGFuZGxlICd0aGlzLnZhck5hbWUnIGNvcnJlY3RseVxuICAgICAgICBjbGFzc1NpbXBsZU5hbWUgPSB0aGlzLl9sYXN0TWF0Y2goXG4gICAgICAgICAgZWRpdG9yLmdldFRleHRJblJhbmdlKFtbYnVmZmVyUG9zaXRpb24ucm93IC0gMjUsIDBdLCBidWZmZXJQb3NpdGlvbl0pLFxuICAgICAgICAgIG5ldyBSZWdFeHAoJyhbQS1aXVthLXpBLVowLTlfXSopKDxbQS1aXVthLXpBLVowLTlfPD4sIF0qPik/XFxcXHMnICtcbiAgICAgICAgICAgIHByZWZpeCArICdbLDs9XFxcXHNcXFxcKV0nLCAnZycpKTtcbiAgICAgICAgY2xhc3NTaW1wbGVOYW1lID0gY2xhc3NTaW1wbGVOYW1lLnJlcGxhY2UoXG4gICAgICAgICAgbmV3IFJlZ0V4cCgnXFxcXHMrJyArIHByZWZpeCArICdbLDs9XFxcXHNcXFxcKV0kJyksICcnKTtcbiAgICAgICAgY2xhc3NTaW1wbGVOYW1lID0gY2xhc3NTaW1wbGVOYW1lLnJlcGxhY2UoL1xcPC4qXFw+LywgJycpO1xuXG4gICAgICAgIGlzSW5zdGFuY2UgPSB0cnVlO1xuICAgICAgfVxuXG4gICAgICBpZiAodGhpcy5faXNWYWxpZENsYXNzTmFtZShjbGFzc1NpbXBsZU5hbWUpKSB7XG4gICAgICAgIC8vIENvbnZlcnQgc2ltcGxlIG5hbWUgdG8gYSBmdWxsIGNsYXNzIG5hbWUgYW5kIHVzZSB0aGF0XG4gICAgICAgIGNsYXNzTmFtZXMgPSB0aGlzLmdldFBvc3NpYmxlQ2xhc3NOYW1lcyhlZGl0b3IsIGNsYXNzU2ltcGxlTmFtZSxcbiAgICAgICAgICBwcmVmaXgpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgLy8gSnVzdCB1c2UgcmV0dXJuIHR5cGUgb2YgcHJldmlvdXMgc25pcHBldCAoYSBxdWljayBoYWNrKVxuICAgICAgICAvLyBUT0RPIGRldGVybWluZSB0eXBlIHVzaW5nIGNsYXNzbG9hZGVyXG4gICAgICAgIGNsYXNzTmFtZXMgPSBbIHByZXZSZXR1cm5UeXBlIF07XG4gICAgICAgIGlzSW5zdGFuY2UgPSB0cnVlO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4geyBjbGFzc05hbWVzLCBpc0luc3RhbmNlIH07XG4gICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICBjb25zb2xlLmVycm9yKGVycik7XG4gICAgICByZXR1cm4ge307XG4gICAgfVxuICB9XG5cbiAgX2lzVmFsaWRDbGFzc05hbWUodGV4dCkge1xuICAgIHJldHVybiAvXltBLVpdW15cXC5cXCldKiQvLnRlc3QodGV4dCkgfHwgL1xcLltBLVpdW15cXC5cXCldKiQvLnRlc3QodGV4dCk7XG4gIH1cblxuICBfbGFzdE1hdGNoKHN0ciwgcmVnZXgpIHtcbiAgICBjb25zdCBhcnJheSA9IHN0ci5tYXRjaChyZWdleCkgfHwgWycnXTtcbiAgICByZXR1cm4gYXJyYXlbYXJyYXkubGVuZ3RoIC0gMV07XG4gIH1cblxufVxuXG5leHBvcnQgZGVmYXVsdCBuZXcgQXRvbUphdmFVdGlsKCk7XG4iXX0=