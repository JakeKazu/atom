Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) arr2[i] = arr[i]; return arr2; } else { return Array.from(arr); } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var _lodash = require('lodash');

var _atomJavaUtil = require('./atomJavaUtil');

var _atomJavaUtil2 = _interopRequireDefault(_atomJavaUtil);

var _javaUtil = require('./javaUtil');

var _javaUtil2 = _interopRequireDefault(_javaUtil);

'use babel';

var AtomAutocompleteProvider = (function () {
  function AtomAutocompleteProvider(classLoader) {
    _classCallCheck(this, AtomAutocompleteProvider);

    this.classLoader = classLoader;

    // settings for autocomplete-plus
    this.selector = '.source.java';
    this.disableForSelector = '.source.java .comment';
  }

  _createClass(AtomAutocompleteProvider, [{
    key: 'configure',
    value: function configure(config) {
      // settings for autocomplete-plus
      this.inclusionPriority = config.inclusionPriority;
      this.excludeLowerPriority = config.excludeLowerPriority;
      this.foldImports = config.foldImports;
    }

    // autocomplete-plus
  }, {
    key: 'getSuggestions',
    value: function getSuggestions(_ref) {
      var _this = this;

      var editor = _ref.editor;
      var bufferPosition = _ref.bufferPosition;
      var origPrefix = _ref.prefix;

      // text: 'package.Class.me', prefix: 'package.Class', suffix: 'me'
      // text: 'package.Cla', prefix: 'package', suffix: 'Cla'
      // text: 'Cla', prefix: '', suffix: 'Cla'
      // line: 'new Cla', text: 'Cla', prevWord: 'new'
      var line = _atomJavaUtil2['default'].getLine(editor, bufferPosition);
      var prevWord = _atomJavaUtil2['default'].getPrevWord(editor, bufferPosition);
      var text = _atomJavaUtil2['default'].getWord(editor, bufferPosition, true).replace('@', '');
      var prefix = text.substring(0, text.lastIndexOf('.'));
      var suffix = origPrefix.replace('.', '');
      var couldBeClass = /^[A-Z]/.test(suffix) || prefix;
      var isInstance = false;

      var results = null;
      if (couldBeClass) {
        var classes = this.classLoader.findClass(text);
        if (prevWord === 'new' && classes && classes.length) {
          // Class constructor suggestions
          results = [];
          _lodash._.each(classes, function (classDesc) {
            _lodash._.each(classDesc.constructors, function (constructor) {
              results.push(constructor);
            });
          });
        } else {
          // Class suggestions
          results = classes;
        }
      }

      if (!results || !results.length) {
        // Find member of a class
        // TODO ugly. refactor.
        var stat = _atomJavaUtil2['default'].determineClassName(editor, bufferPosition, text, prefix, suffix, this.prevReturnType);
        isInstance = stat.isInstance;
        _lodash._.every(stat.classNames, function (className) {
          // methods of this class
          results = _this.classLoader.findClassMember(className, suffix) || [];
          // methods of extending classes
          var superClass = _this.classLoader.findSuperClassName(className);
          while (superClass) {
            var r = _this.classLoader.findClassMember(superClass, suffix);
            if (r) {
              var _results;

              (_results = results).push.apply(_results, _toConsumableArray(r));
            }
            superClass = _this.classLoader.findSuperClassName(superClass);
          }
          return !results.length;
        });
      }

      // Autocomplete-plus filters all duplicates. This is a workaround for that.
      var duplicateWorkaround = {};

      // Map results to autocomplete-plus suggestions
      return _lodash._.map(results, function (desc) {
        var snippet = _this._createSnippet(desc, line, prefix, !isInstance && desc.type !== 'constructor');
        if (!duplicateWorkaround[snippet]) {
          duplicateWorkaround[snippet] = 1;
        }
        var counter = duplicateWorkaround[snippet]++;
        var typeName = couldBeClass ? desc.className : desc.simpleName;
        return {
          snippet: snippet + (counter > 1 ? ' (' + counter + ')' : ''),
          replacementPrefix: isInstance ? suffix : text,
          leftLabel: desc.member ? _this._getFormattedReturnType(desc.member) : typeName,
          type: desc.type !== 'constructor' ? desc.type : 'method',
          desc: desc
        };
      });
    }
  }, {
    key: '_getFormattedReturnType',
    value: function _getFormattedReturnType(member) {
      return member.visibility + ' ' + _javaUtil2['default'].getSimpleName(member.returnType);
    }
  }, {
    key: '_createSnippet',
    value: function _createSnippet(desc, line, prefix, addMemberClass) {
      // TODO use full class name in case of a name conflict
      // Use full class name in case of class import or method with long prefix
      var useFullClassName = desc.type === 'class' ? /^import/.test(line) : prefix.indexOf('.') !== -1;
      var text = useFullClassName ? desc.className : desc.simpleName;
      if (desc.member) {
        text = (addMemberClass ? '${1:' + text + '}.' : '') + this._createMemberSnippet(desc.member, desc.type);
      }
      return text;
    }
  }, {
    key: '_createMemberSnippet',
    value: function _createMemberSnippet(member, type) {
      var snippet = null;
      if (!member.params) {
        snippet = type === 'property' ? member.name : member.name + '()';
      } else {
        (function () {
          var index = 2;
          var params = _lodash._.map(member.params, function (param) {
            return '${' + index++ + ':' + _javaUtil2['default'].getSimpleName(param) + '}';
          });
          snippet = _lodash._.reduce(params, function (result, param) {
            return result + param + ', ';
          }, member.name + '(').replace(/, $/, ')');
          snippet = snippet + '${' + index + ':}';
        })();
      }
      return snippet;
    }

    // autocomplete-plus
  }, {
    key: 'onDidInsertSuggestion',
    value: function onDidInsertSuggestion(_ref2) {
      var editor = _ref2.editor;
      var suggestion = _ref2.suggestion;

      if (suggestion.type === 'class') {
        // Add import statement if simple class name was used as a completion text
        if (suggestion.snippet.indexOf('.') === -1) {
          _atomJavaUtil2['default'].importClass(editor, suggestion.desc.className, this.foldImports);
        }
      } else if (suggestion.desc.member) {
        // Save snippet return type for later use (type determination)
        this.prevReturnType = suggestion.desc.member.returnType;
      }
      this.classLoader.touch(suggestion.desc);
    }
  }]);

  return AtomAutocompleteProvider;
})();

exports.AtomAutocompleteProvider = AtomAutocompleteProvider;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9ob21lL2pha2UvLmF0b20vcGFja2FnZXMvYXV0b2NvbXBsZXRlLWphdmEvbGliL0F0b21BdXRvY29tcGxldGVQcm92aWRlci5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7c0JBRWtCLFFBQVE7OzRCQUNELGdCQUFnQjs7Ozt3QkFDcEIsWUFBWTs7OztBQUpqQyxXQUFXLENBQUM7O0lBTUMsd0JBQXdCO0FBRXhCLFdBRkEsd0JBQXdCLENBRXZCLFdBQVcsRUFBRTswQkFGZCx3QkFBd0I7O0FBR2pDLFFBQUksQ0FBQyxXQUFXLEdBQUcsV0FBVyxDQUFDOzs7QUFHL0IsUUFBSSxDQUFDLFFBQVEsR0FBRyxjQUFjLENBQUM7QUFDL0IsUUFBSSxDQUFDLGtCQUFrQixHQUFHLHVCQUF1QixDQUFDO0dBQ25EOztlQVJVLHdCQUF3Qjs7V0FVMUIsbUJBQUMsTUFBTSxFQUFFOztBQUVoQixVQUFJLENBQUMsaUJBQWlCLEdBQUcsTUFBTSxDQUFDLGlCQUFpQixDQUFDO0FBQ2xELFVBQUksQ0FBQyxvQkFBb0IsR0FBRyxNQUFNLENBQUMsb0JBQW9CLENBQUM7QUFDeEQsVUFBSSxDQUFDLFdBQVcsR0FBRyxNQUFNLENBQUMsV0FBVyxDQUFDO0tBQ3ZDOzs7OztXQUdhLHdCQUFDLElBQTRDLEVBQUU7OztVQUE3QyxNQUFNLEdBQVAsSUFBNEMsQ0FBM0MsTUFBTTtVQUFFLGNBQWMsR0FBdkIsSUFBNEMsQ0FBbkMsY0FBYztVQUFVLFVBQVUsR0FBM0MsSUFBNEMsQ0FBbkIsTUFBTTs7Ozs7O0FBSzVDLFVBQU0sSUFBSSxHQUFHLDBCQUFhLE9BQU8sQ0FBQyxNQUFNLEVBQUUsY0FBYyxDQUFDLENBQUM7QUFDMUQsVUFBTSxRQUFRLEdBQUcsMEJBQWEsV0FBVyxDQUFDLE1BQU0sRUFBRSxjQUFjLENBQUMsQ0FBQztBQUNsRSxVQUFNLElBQUksR0FBRywwQkFBYSxPQUFPLENBQUMsTUFBTSxFQUFFLGNBQWMsRUFBRSxJQUFJLENBQUMsQ0FDOUQsT0FB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LEVBQUU7O0FBRS9CLFlBQUksVUFBVSxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUU7QUFDMUMsb0NBQWEsV0FBVyxDQUFDLE1BQU0sRUFBRSxVQUFVLENBQUMsSUFBSSxDQUFDLFNBQVMsRUFDeEQsSUFBSSxDQUFDLFdBQVcsQ0FBQyxDQUFDO1NBQ3JCO09BQ0YsTUFBTSxJQUFJLFVBQVUsQ0FBQyxJQUFJLENBQUMsTUFBTSxFQUFFOztBQUVqQyxZQUFJLENBQUMsY0FBYyxHQUFHLFVBQVUsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLFVBQVUsQ0FBQztPQUN6RDtBQUNELFVBQUksQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsQ0FBQztLQUN6Qzs7O1NBL0lVLHdCQUF3QiIsImZpbGUiOiIvaG9tZS9qYWtlLy5hdG9tL3BhY2thZ2VzL2F1dG9jb21wbGV0ZS1qYXZhL2xpYi9BdG9tQXV0b2NvbXBsZXRlUHJvdmlkZXIuanMiLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIGJhYmVsJztcblxuaW1wb3J0IHsgXyB9IGZyb20gJ2xvZGFzaCc7XG5pbXBvcnQgYXRvbUphdmFVdGlsIGZyb20gJy4vYXRvbUphdmFVdGlsJztcbmltcG9ydCBqYXZhVXRpbCBmcm9tICcuL2phdmFVdGlsJztcblxuZXhwb3J0IGNsYXNzIEF0b21BdXRvY29tcGxldGVQcm92aWRlciB7XG5cbiAgY29uc3RydWN0b3IoY2xhc3NMb2FkZXIpIHtcbiAgICB0aGlzLmNsYXNzTG9hZGVyID0gY2xhc3NMb2FkZXI7XG5cbiAgICAvLyBzZXR0aW5ncyBmb3IgYXV0b2NvbXBsZXRlLXBsdXNcbiAgICB0aGlzLnNlbGVjdG9yID0gJy5zb3VyY2UuamF2YSc7XG4gICAgdGhpcy5kaXNhYmxlRm9yU2VsZWN0b3IgPSAnLnNvdXJjZS5qYXZhIC5jb21tZW50JztcbiAgfVxuXG4gIGNvbmZpZ3VyZShjb25maWcpIHtcbiAgICAvLyBzZXR0aW5ncyBmb3IgYXV0b2NvbXBsZXRlLXBsdXNcbiAgICB0aGlzLmluY2x1c2lvblByaW9yaXR5ID0gY29uZmlnLmluY2x1c2lvblByaW9yaXR5O1xuICAgIHRoaXMuZXhjbHVkZUxvd2VyUHJpb3JpdHkgPSBjb25maWcuZXhjbHVkZUxvd2VyUHJpb3JpdHk7XG4gICAgdGhpcy5mb2xkSW1wb3J0cyA9IGNvbmZpZy5mb2xkSW1wb3J0cztcbiAgfVxuXG4gIC8vIGF1dG9jb21wbGV0ZS1wbHVzXG4gIGdldFN1Z2dlc3Rpb25zKHtlZGl0b3IsIGJ1ZmZlclBvc2l0aW9uLCBwcmVmaXg6IG9yaWdQcmVmaXh9KSB7XG4gICAgLy8gdGV4dDogJ3BhY2thZ2UuQ2xhc3MubWUnLCBwcmVmaXg6ICdwYWNrYWdlLkNsYXNzJywgc3VmZml4OiAnbWUnXG4gICAgLy8gdGV4dDogJ3BhY2thZ2UuQ2xhJywgcHJlZml4OiAncGFja2FnZScsIHN1ZmZpeDogJ0NsYSdcbiAgICAvLyB0ZXh0OiAnQ2xhJywgcHJlZml4OiAnJywgc3VmZml4OiAnQ2xhJ1xuICAgIC8vIGxpbmU6ICduZXcgQ2xhJywgdGV4dDogJ0NsYScsIHByZXZXb3JkOiAnbmV3J1xuICAgIGNvbnN0IGxpbmUgPSBhdG9tSmF2YVV0aWwuZ2V0TGluZShlZGl0b3IsIGJ1ZmZlclBvc2l0aW9uKTtcbiAgICBjb25zdCBwcmV2V29yZCA9IGF0b21KYXZhVXRpbC5nZXRQcmV2V29yZChlZGl0b3IsIGJ1ZmZlclBvc2l0aW9uKTtcbiAgICBjb25zdCB0ZXh0ID0gYXRvbUphdmFVdGlsLmdldFdvcmQoZWRpdG9yLCBidWZmZXJQb3NpdGlvbiwgdHJ1ZSlcbiAgICAucmVwbGFjZSgnQCcsICcnKTtcbiAgICBjb25zdCBwcmVmaXggPSB0ZXh0LnN1YnN0cmluZygwLCB0ZXh0Lmxhc3RJbmRleE9mKCcuJykpO1xuICAgIGNvbnN0IHN1ZmZpeCA9IG9yaWdQcmVmaXgucmVwbGFjZSgnLicsICcnKTtcbiAgICBjb25zdCBjb3VsZEJlQ2xhc3MgPSAvXltBLVpdLy50ZXN0KHN1ZmZpeCkgfHwgcHJlZml4O1xuICAgIGxldCBpc0luc3RhbmNlID0gZmFsc2U7XG5cbiAgICBsZXQgcmVzdWx0cyA9IG51bGw7XG4gICAgaWYgKGNvdWxkQmVDbGFzcykge1xuICAgICAgY29uc3QgY2xhc3NlcyA9IHRoaXMuY2xhc3NMb2FkZXIuZmluZENsYXNzKHRleHQpO1xuICAgICAgaWYgKHByZXZXb3JkID09PSAnbmV3JyAmJiBjbGFzc2VzICYmIGNsYXNzZXMubGVuZ3RoKSB7XG4gICAgICAgIC8vIENsYXNzIGNvbnN0cnVjdG9yIHN1Z2dlc3Rpb25zXG4gICAgICAgIHJlc3VsdHMgPSBbXTtcbiAgICAgICAgXy5lYWNoKGNsYXNzZXMsIGNsYXNzRGVzYyA9PiB7XG4gICAgICAgICAgXy5lYWNoKGNsYXNzRGVzYy5jb25zdHJ1Y3RvcnMsIGNvbnN0cnVjdG9yID0+IHtcbiAgICAgICAgICAgIHJlc3VsdHMucHVzaChjb25zdHJ1Y3Rvcik7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgLy8gQ2xhc3Mgc3VnZ2VzdGlvbnNcbiAgICAgICAgcmVzdWx0cyA9IGNsYXNzZXM7XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKCghcmVzdWx0cyB8fCAhcmVzdWx0cy5sZW5ndGgpKSB7XG4gICAgICAvLyBGaW5kIG1lbWJlciBvZiBhIGNsYXNzXG4gICAgICAvLyBUT0RPIHVnbHkuIHJlZmFjdG9yLlxuICAgICAgY29uc3Qgc3RhdCA9IGF0b21KYXZhVXRpbC5kZXRlcm1pbmVDbGFzc05hbWUoZWRpdG9yLCBidWZmZXJQb3NpdGlvbixcbiAgICAgICAgdGV4dCwgcHJlZml4LCBzdWZmaXgsIHRoaXMucHJldlJldHVyblR5cGUpO1xuICAgICAgaXNJbnN0YW5jZSA9IHN0YXQuaXNJbnN0YW5jZTtcbiAgICAgIF8uZXZlcnkoc3RhdC5jbGFzc05hbWVzLCBjbGFzc05hbWUgPT4ge1xuICAgICAgICAvLyBtZXRob2RzIG9mIHRoaXMgY2xhc3NcbiAgICAgICAgcmVzdWx0cyA9IHRoaXMuY2xhc3NMb2FkZXIuZmluZENsYXNzTWVtYmVyKGNsYXNzTmFtZSwgc3VmZml4KSB8fCBbXTtcbiAgICAgICAgLy8gbWV0aG9kcyBvZiBleHRlbmRpbmcgY2xhc3Nlc1xuICAgICAgICBsZXQgc3VwZXJDbGFzcyA9IHRoaXMuY2xhc3NMb2FkZXIuZmluZFN1cGVyQ2xhc3NOYW1lKGNsYXNzTmFtZSk7XG4gICAgICAgIHdoaWxlIChzdXBlckNsYXNzKSB7XG4gICAgICAgICAgY29uc3QgciA9IHRoaXMuY2xhc3NMb2FkZXIuZmluZENsYXNzTWVtYmVyKHN1cGVyQ2xhc3MsIHN1ZmZpeCk7XG4gICAgICAgICAgaWYgKHIpIHtcbiAgICAgICAgICAgIHJlc3VsdHMucHVzaCguLi5yKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgc3VwZXJDbGFzcyA9IHRoaXMuY2xhc3NMb2FkZXIuZmluZFN1cGVyQ2xhc3NOYW1lKHN1cGVyQ2xhc3MpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiAhcmVzdWx0cy5sZW5ndGg7XG4gICAgICB9KTtcbiAgICB9XG5cbiAgICAvLyBBdXRvY29tcGxldGUtcGx1cyBmaWx0ZXJzIGFsbCBkdXBsaWNhdGVzLiBUaGlzIGlzIGEgd29ya2Fyb3VuZCBmb3IgdGhhdC5cbiAgICBjb25zdCBkdXBsaWNhdGVXb3JrYXJvdW5kID0ge307XG5cbiAgICAvLyBNYXAgcmVzdWx0cyB0byBhdXRvY29tcGxldGUtcGx1cyBzdWdnZXN0aW9uc1xuICAgIHJldHVybiBfLm1hcChyZXN1bHRzLCAoZGVzYykgPT4ge1xuICAgICAgY29uc3Qgc25pcHBldCA9IHRoaXMuX2NyZWF0ZVNuaXBwZXQoZGVzYywgbGluZSwgcHJlZml4LFxuICAgICAgICAhaXNJbnN0YW5jZSAmJiBkZXNjLnR5cGUgIT09ICdjb25zdHJ1Y3RvcicpO1xuICAgICAgaWYgKCFkdXBsaWNhdGVXb3JrYXJvdW5kW3NuaXBwZXRdKSB7XG4gICAgICAgIGR1cGxpY2F0ZVdvcmthcm91bmRbc25pcHBldF0gPSAxO1xuICAgICAgfVxuICAgICAgY29uc3QgY291bnRlciA9IGR1cGxpY2F0ZVdvcmthcm91bmRbc25pcHBldF0rKztcbiAgICAgIGNvbnN0IHR5cGVOYW1lID0gKGNvdWxkQmVDbGFzcyA/IGRlc2MuY2xhc3NOYW1lIDogZGVzYy5zaW1wbGVOYW1lKTtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIHNuaXBwZXQ6IHNuaXBwZXQgKyAoY291bnRlciA+IDEgPyAnICgnICsgY291bnRlciArICcpJyA6ICcnKSxcbiAgICAgICAgcmVwbGFjZW1lbnRQcmVmaXg6IGlzSW5zdGFuY2UgPyBzdWZmaXggOiB0ZXh0LFxuICAgICAgICBsZWZ0TGFiZWw6IGRlc2MubWVtYmVyXG4gICAgICAgID8gdGhpcy5fZ2V0Rm9ybWF0dGVkUmV0dXJuVHlwZShkZXNjLm1lbWJlcilcbiAgICAgICAgOiB0eXBlTmFtZSxcbiAgICAgICAgdHlwZTogZGVzYy50eXBlICE9PSAnY29uc3RydWN0b3InID8gZGVzYy50eXBlIDogJ21ldGhvZCcsXG4gICAgICAgIGRlc2M6IGRlc2MsXG4gICAgICB9O1xuICAgIH0pO1xuICB9XG5cbiAgX2dldEZvcm1hdHRlZFJldHVyblR5cGUobWVtYmVyKSB7XG4gICAgcmV0dXJuIG1lbWJlci52aXNpYmlsaXR5ICsgJyAnICsgamF2YVV0aWwuZ2V0U2ltcGxlTmFtZShtZW1iZXIucmV0dXJuVHlwZSk7XG4gIH1cblxuICBfY3JlYXRlU25pcHBldChkZXNjLCBsaW5lLCBwcmVmaXgsIGFkZE1lbWJlckNsYXNzKSB7XG4gICAgLy8gVE9ETyB1c2UgZnVsbCBjbGFzcyBuYW1lIGluIGNhc2Ugb2YgYSBuYW1lIGNvbmZsaWN0XG4gICAgLy8gVXNlIGZ1bGwgY2xhc3MgbmFtZSBpbiBjYXNlIG9mIGNsYXNzIGltcG9ydCBvciBtZXRob2Qgd2l0aCBsb25nIHByZWZpeFxuICAgIGNvbnN0IHVzZUZ1bGxDbGFzc05hbWUgPVxuICAgICAgZGVzYy50eXBlID09PSAnY2xhc3MnID8gL15pbXBvcnQvLnRlc3QobGluZSkgOiBwcmVmaXguaW5kZXhPZignLicpICE9PSAtMTtcbiAgICBsZXQgdGV4dCA9IHVzZUZ1bGxDbGFzc05hbWUgPyBkZXNjLmNsYXNzTmFtZSA6IGRlc2Muc2ltcGxlTmFtZTtcbiAgICBpZiAoZGVzYy5tZW1iZXIpIHtcbiAgICAgIHRleHQgPSAoYWRkTWVtYmVyQ2xhc3MgPyAnJHsxOicgKyB0ZXh0ICsgJ30uJyA6ICcnKSArXG4gICAgICAgIHRoaXMuX2NyZWF0ZU1lbWJlclNuaXBwZXQoZGVzYy5tZW1iZXIsIGRlc2MudHlwZSk7XG4gICAgfVxuICAgIHJldHVybiB0ZXh0O1xuICB9XG5cbiAgX2NyZWF0ZU1lbWJlclNuaXBwZXQobWVtYmVyLCB0eXBlKSB7XG4gICAgbGV0IHNuaXBwZXQgPSBudWxsO1xuICAgIGlmICghbWVtYmVyLnBhcmFtcykge1xuICAgICAgc25pcHBldCA9ICh0eXBlID09PSAncHJvcGVydHknKVxuICAgICAgICA/IG1lbWJlci5uYW1lIDogbWVtYmVyLm5hbWUgKyAnKCknO1xuICAgIH0gZWxzZSB7XG4gICAgICBsZXQgaW5kZXggPSAyO1xuICAgICAgY29uc3QgcGFyYW1zID0gXy5tYXAobWVtYmVyLnBhcmFtcywgKHBhcmFtKSA9PiB7XG4gICAgICAgIHJldHVybiAnJHsnICsgKGluZGV4KyspICsgJzonICsgamF2YVV0aWwuZ2V0U2ltcGxlTmFtZShwYXJhbSkgKyAnfSc7XG4gICAgICB9KTtcbiAgICAgIHNuaXBwZXQgPSBfLnJlZHVjZShwYXJhbXMsIChyZXN1bHQsIHBhcmFtKSA9PiB7XG4gICAgICAgIHJldHVybiByZXN1bHQgKyBwYXJhbSArICcsICc7XG4gICAgICB9LCBtZW1iZXIubmFtZSArICcoJykucmVwbGFjZSgvLCAkLywgJyknKTtcbiAgICAgIHNuaXBwZXQgPSBzbmlwcGV0ICsgJyR7JyArIGluZGV4ICsgJzp9JztcbiAgICB9XG4gICAgcmV0dXJuIHNuaXBwZXQ7XG4gIH1cblxuICAvLyBhdXRvY29tcGxldGUtcGx1c1xuICBvbkRpZEluc2VydFN1Z2dlc3Rpb24oe2VkaXRvciwgc3VnZ2VzdGlvbn0pIHtcbiAgICBpZiAoc3VnZ2VzdGlvbi50eXBlID09PSAnY2xhc3MnKSB7XG4gICAgICAvLyBBZGQgaW1wb3J0IHN0YXRlbWVudCBpZiBzaW1wbGUgY2xhc3MgbmFtZSB3YXMgdXNlZCBhcyBhIGNvbXBsZXRpb24gdGV4dFxuICAgICAgaWYgKHN1Z2dlc3Rpb24uc25pcHBldC5pbmRleE9mKCcuJykgPT09IC0xKSB7XG4gICAgICAgIGF0b21KYXZhVXRpbC5pbXBvcnRDbGFzcyhlZGl0b3IsIHN1Z2dlc3Rpb24uZGVzYy5jbGFzc05hbWUsXG4gICAgICAgICAgdGhpcy5mb2xkSW1wb3J0cyk7XG4gICAgICB9XG4gICAgfSBlbHNlIGlmIChzdWdnZXN0aW9uLmRlc2MubWVtYmVyKSB7XG4gICAgICAvLyBTYXZlIHNuaXBwZXQgcmV0dXJuIHR5cGUgZm9yIGxhdGVyIHVzZSAodHlwZSBkZXRlcm1pbmF0aW9uKVxuICAgICAgdGhpcy5wcmV2UmV0dXJuVHlwZSA9IHN1Z2dlc3Rpb24uZGVzYy5tZW1iZXIucmV0dXJuVHlwZTtcbiAgICB9XG4gICAgdGhpcy5jbGFzc0xvYWRlci50b3VjaChzdWdnZXN0aW9uLmRlc2MpO1xuICB9XG5cbn1cbiJdfQ==