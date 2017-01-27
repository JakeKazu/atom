Object.defineProperty(exports, '__esModule', {
    value: true
});

var _createDecoratedClass = (function () { function defineProperties(target, descriptors, initializers) { for (var i = 0; i < descriptors.length; i++) { var descriptor = descriptors[i]; var decorators = descriptor.decorators; var key = descriptor.key; delete descriptor.key; delete descriptor.decorators; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor || descriptor.initializer) descriptor.writable = true; if (decorators) { for (var f = 0; f < decorators.length; f++) { var decorator = decorators[f]; if (typeof decorator === 'function') { descriptor = decorator(target, key, descriptor) || descriptor; } else { throw new TypeError('The decorator for method ' + descriptor.key + ' is of the invalid type ' + typeof decorator); } } if (descriptor.initializer !== undefined) { initializers[key] = descriptor; continue; } } Object.defineProperty(target, key, descriptor); } } return function (Constructor, protoProps, staticProps, protoInitializers, staticInitializers) { if (protoProps) defineProperties(Constructor.prototype, protoProps, protoInitializers); if (staticProps) defineProperties(Constructor, staticProps, staticInitializers); return Constructor; }; })();

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj['default'] = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

/** @babel */

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _fuzzaldrinPlus = require('fuzzaldrin-plus');

var _fuzzaldrinPlus2 = _interopRequireDefault(_fuzzaldrinPlus);

var _mkdirp = require('mkdirp');

var _mkdirp2 = _interopRequireDefault(_mkdirp);

var _touch = require('touch');

var _touch2 = _interopRequireDefault(_touch);

var _config = require('./config');

var config = _interopRequireWildcard(_config);

var _utils = require('./utils');

/**
 * Wrapper for dealing with filesystem paths.
 */

var Path = (function () {
    function Path() {
        var path = arguments.length <= 0 || arguments[0] === undefined ? '' : arguments[0];

        _classCallCheck(this, Path);

        // The last path segment is the "fragment". Paths that end in a
        // separator have a blank fragment.
        var sep = (0, _utils.preferredSeparatorFor)(path);
        var parts = path.split(sep);
        var fragment = parts[parts.length - 1];
        var directory = path.substring(0, path.length - fragment.length);

        // Set non-writable properties.
        (0, _utils.defineImmutable)(this, 'directory', directory);
        (0, _utils.defineImmutable)(this, 'fragment', fragment);
        (0, _utils.defineImmutable)(this, 'full', path);
        (0, _utils.defineImmutable)(this, 'sep', sep);
    }

    /**
     * Return whether the filename matches the given path fragment.
     */

    _createDecoratedClass(Path, [{
        key: 'isDirectory',
        value: function isDirectory() {
            return this.stat ? this.stat.isDirectory() : null;
        }
    }, {
        key: 'isFile',
        value: function isFile() {
            return this.stat ? !this.stat.isDirectory() : null;
        }
    }, {
        key: 'isProjectDirectory',
        value: function isProjectDirectory() {
            return atom.project.getPaths().indexOf(this.absolute) !== -1;
        }
    }, {
        key: 'isRoot',
        value: function isRoot() {
            return _path2['default'].dirname(this.absolute) === this.absolute;
        }
    }, {
        key: 'hasCaseSensitiveFragment',
        value: function hasCaseSensitiveFragment() {
            return this.fragment !== '' && this.fragment !== this.fragment.toLowerCase();
        }
    }, {
        key: 'exists',
        value: function exists() {
            return this.stat !== null;
        }
    }, {
        key: 'asDirectory',
        value: function asDirectory() {
            return new Path(this.full + (this.fragment ? this.sep : ''));
        }
    }, {
        key: 'parent',
        value: function parent() {
            if (this.isRoot()) {
                return this;
            } else if (this.fragment) {
                return new Path(this.directory);
            } else {
                return new Path(_path2['default'].dirname(this.directory) + this.sep);
            }
        }

        /**
         * Return path for the root directory for the drive this path is on.
         */
    }, {
        key: 'root',
        value: function root() {
            var last = null;
            var current = this.absolute;
            while (current !== last) {
                last = current;
                current = _path2['default'].dirname(current);
            }

            return new Path(current);
        }

        /**
         * Create an empty file at the given path if it doesn't already exist.
         */
    }, {
        key: 'createFile',
        value: function createFile() {
            _touch2['default'].sync(this.absolute);
        }

        /**
         * Create directories for the file this path points to, or do nothing
         * if they already exist.
         */
    }, {
        key: 'createDirectories',
        value: function createDirectories() {
            try {
                _mkdirp2['default'].sync((0, _utils.absolutify)(this.directory));
            } catch (err) {
                if (err.code !== 'ENOENT') {
                    throw err;
                }
            }
        }
    }, {
        key: 'matchingPaths',
        value: function matchingPaths() {
            var _this = this;

            var caseSensitive = arguments.length <= 0 || arguments[0] === undefined ? null : arguments[0];

            var absoluteDir = (0, _utils.absolutify)(this.directory);
            var filenames = null;

            try {
                filenames = _fs2['default'].readdirSync(absoluteDir);
            } catch (err) {
                return []; // TODO: Catch permissions error and display a message.
            }

            if (this.fragment) {
                if (config.get('fuzzyMatch')) {
                    filenames = _fuzzaldrinPlus2['default'].filter(filenames, this.fragment);
                } else {
                    if (caseSensitive === null) {
                        caseSensitive = this.hasCaseSensitiveFragment();
                    }

                    filenames = filenames.filter(function (fn) {
                        return matchFragment(_this.fragment, fn, caseSensitive);
                    });
                }
            }

            return filenames.map(function (fn) {
                return new Path(_this.directory + fn);
            });
        }

        /**
         * Check if the last path fragment in this path is equal to the given
         * shortcut string, and the path ends in a separator.
         *
         * For example, ':/' and '/foo/bar/:/' have the ':' shortcut, but
         * '/foo/bar:/' and '/blah/:' do not.
         */
    }, {
        key: 'hasShortcut',
        value: function hasShortcut(shortcut) {
            shortcut = shortcut + this.sep;
            return !this.fragment && (this.directory.endsWith(this.sep + shortcut) || this.directory === shortcut);
        }
    }, {
        key: 'equals',
        value: function equals(otherPath) {
            return this.full === otherPath.full;
        }

        /**
         * Return the path to show initially in the path input.
         */
    }, {
        key: 'absolute',
        decorators: [_utils.cachedProperty],
        get: function get() {
            return (0, _utils.absolutify)(this.full);
        }
    }, {
        key: 'stat',
        decorators: [_utils.cachedProperty],
        get: function get() {
            try {
                return _fs2['default'].statSync(this.absolute);
            } catch (err) {
                return null;
            }
        }
    }], [{
        key: 'initial',
        value: function initial() {
            switch (config.get('defaultInputValue')) {
                case config.DEFAULT_ACTIVE_FILE_DIR:
                    var editor = atom.workspace.getActiveTextEditor();
                    if (editor && editor.getPath()) {
                        return new Path(_path2['default'].dirname(editor.getPath()) + _path2['default'].sep);
                    }
                // No break so that we fall back to project root.
                case config.DEFAULT_PROJECT_ROOT:
                    var projectPath = (0, _utils.getProjectPath)();
                    if (projectPath) {
                        return new Path(projectPath + _path2['default'].sep);
                    }
            }

            return new Path('');
        }

        /**
         * Compare two paths lexicographically.
         */
    }, {
        key: 'compare',
        value: function compare(path1, path2) {
            return path1.full.localeCompare(path2.full);
        }

        /**
         * Return a new path instance with the common prefix of all the
         * given paths.
         */
    }, {
        key: 'commonPrefix',
        value: function commonPrefix(paths) {
            var caseSensitive = arguments.length <= 1 || arguments[1] === undefined ? false : arguments[1];

            if (paths.length < 2) {
                throw new Error('Cannot find common prefix for lists shorter than two elements.');
            }

            paths = paths.map(function (path) {
                return path.full;
            }).sort();
            var first = paths[0];
            var last = paths[paths.length - 1];

            var prefix = '';
            var prefixMaxLength = Math.min(first.length, last.length);
            for (var k = 0; k < prefixMaxLength; k++) {
                if (first[k] === last[k]) {
                    prefix += first[k];
                } else if (!caseSensitive && first[k].toLowerCase() === last[k].toLowerCase()) {
                    prefix += first[k].toLowerCase();
                } else {
                    break;
                }
            }

            return new Path(prefix);
        }
    }]);

    return Path;
})();

exports.Path = Path;
function matchFragment(fragment, filename) {
    var caseSensitive = arguments.length <= 2 || arguments[2] === undefined ? false : arguments[2];

    if (!caseSensitive) {
        fragment = fragment.toLowerCase();
        filename = filename.toLowerCase();
    }

    return filename.startsWith(fragment);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9ob21lL2pha2UvLmF0b20vcGFja2FnZXMvYWR2YW5jZWQtb3Blbi1maWxlL2xpYi9tb2RlbHMuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7a0JBRWUsSUFBSTs7OztvQkFDQyxNQUFNOzs7OzhCQUVILGlCQUFpQjs7OztzQkFDckIsUUFBUTs7OztxQkFDVCxPQUFPOzs7O3NCQUVELFVBQVU7O0lBQXRCLE1BQU07O3FCQU9YLFNBQVM7Ozs7OztJQU1ILElBQUk7QUFDRixhQURGLElBQUksR0FDUTtZQUFULElBQUkseURBQUMsRUFBRTs7OEJBRFYsSUFBSTs7OztBQUlULFlBQUksR0FBRyxHQUFHLGtDQUFzQixJQUFJLENBQUMsQ0FBQztBQUN0QyxZQUFJLEtBQUssR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDO0FBQzVCLFlBQUksUUFBUSxHQUFHLEtBQUssQ0FBQyxLQUFLLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxDQUFDO0FBQ3ZDLFlBQUksU0FBUyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxNQUFNLEdBQUcsUUFBUSxDQUFDLE1BQU0sQ0FBQyxDQUFDOzs7QUFHakUsb0NBQWdCLElBQUksRUFBRSxXQUFXLEVBQUUsU0FBUyxDQUFDLENBQUM7QUFDOUMsb0NBQWdCLElBQUksRUFBRSxVQUFVLEVBQUUsUUFBUSxDQUFDLENBQUM7QUFDNUMsb0NBQWdCLElBQUksRUFBRSxNQUFNLEVBQUUsSUFBSSxDQUFDLENBQUM7QUFDcEMsb0NBQWdCLElBQUksRUFBRSxLQUFLLEVBQUUsR0FBRyxDQUFDLENBQUM7S0FDckM7Ozs7OzswQkFkUSxJQUFJOztlQThCRix1QkFBRztBQUNWLG1CQUFPLElBQUksQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxXQUFXLEVBQUUsR0FBRyxJQUFJLENBQUM7U0FDckQ7OztlQUVLLGtCQUFHO0FBQ0wsbUJBQU8sSUFB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QixnQkFBSSxlQUFlLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsTUFBTSxFQUFFLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQztBQUMxRCxpQkFBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLGVBQWUsRUFBRSxDQUFDLEVBQUUsRUFBRTtBQUN0QyxvQkFBSSxLQUFLLENBQUMsQ0FBQyxDQUFDLEtBQUssSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUFFO0FBQ3RCLDBCQUFNLElBQUksS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO2lCQUN0QixNQUFNLElBQUksQ0FBQyxhQUFhLElBQUksS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLFdBQVcsRUFBRSxLQUFLLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxXQUFXLEVBQUUsRUFBRTtBQUMzRSwwQkFBTSxJQUFJLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxXQUFXLEVBQUUsQ0FBQztpQkFDcEMsTUFBTTtBQUNILDBCQUFNO2lCQUNUO2FBQ0o7O0FBRUQsbUJBQU8sSUFBSSxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUM7U0FDM0I7OztXQTdNUSxJQUFJOzs7O0FBbU5qQixTQUFTLGFBQWEsQ0FBQyxRQUFRLEVBQUUsUUFBUSxFQUF1QjtRQUFyQixhQUFhLHlEQUFDLEtBQUs7O0FBQzFELFFBQUksQ0FBQyxhQUFhLEVBQUU7QUFDaEIsZ0JBQVEsR0FBRyxRQUFRLENBQUMsV0FBVyxFQUFFLENBQUM7QUFDbEMsZ0JBQVEsR0FBRyxRQUFRLENBQUMsV0FBVyxFQUFFLENBQUM7S0FDckM7O0FBRUQsV0FBTyxRQUFRLENBQUMsVUFBVSxDQUFDLFFBQVEsQ0FBQyxDQUFDO0NBQ3hDIiwiZmlsZSI6Ii9ob21lL2pha2UvLmF0b20vcGFja2FnZXMvYWR2YW5jZWQtb3Blbi1maWxlL2xpYi9tb2RlbHMuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvKiogQGJhYmVsICovXG5cbmltcG9ydCBmcyBmcm9tICdmcyc7XG5pbXBvcnQgc3RkUGF0aCBmcm9tICdwYXRoJztcblxuaW1wb3J0IGZ1enphbGRyaW4gZnJvbSAnZnV6emFsZHJpbi1wbHVzJztcbmltcG9ydCBta2RpcnAgZnJvbSAnbWtkaXJwJztcbmltcG9ydCB0b3VjaCBmcm9tICd0b3VjaCc7XG5cbmltcG9ydCAqIGFzIGNvbmZpZyBmcm9tICcuL2NvbmZpZyc7XG5pbXBvcnQge1xuICAgIGFic29sdXRpZnksXG4gICAgY2FjaGVkUHJvcGVydHksXG4gICAgZGVmaW5lSW1tdXRhYmxlLFxuICAgIGdldFByb2plY3RQYXRoLFxuICAgIHByZWZlcnJlZFNlcGFyYXRvckZvclxufSBmcm9tICcuL3V0aWxzJztcblxuXG4vKipcbiAqIFdyYXBwZXIgZm9yIGRlYWxpbmcgd2l0aCBmaWxlc3lzdGVtIHBhdGhzLlxuICovXG5leHBvcnQgY2xhc3MgUGF0aCB7XG4gICAgY29uc3RydWN0b3IocGF0aD0nJykge1xuICAgICAgICAvLyBUaGUgbGFzdCBwYXRoIHNlZ21lbnQgaXMgdGhlIFwiZnJhZ21lbnRcIi4gUGF0aHMgdGhhdCBlbmQgaW4gYVxuICAgICAgICAvLyBzZXBhcmF0b3IgaGF2ZSBhIGJsYW5rIGZyYWdtZW50LlxuICAgICAgICBsZXQgc2VwID0gcHJlZmVycmVkU2VwYXJhdG9yRm9yKHBhdGgpO1xuICAgICAgICBsZXQgcGFydHMgPSBwYXRoLnNwbGl0KHNlcCk7XG4gICAgICAgIGxldCBmcmFnbWVudCA9IHBhcnRzW3BhcnRzLmxlbmd0aCAtIDFdO1xuICAgICAgICBsZXQgZGlyZWN0b3J5ID0gcGF0aC5zdWJzdHJpbmcoMCwgcGF0aC5sZW5ndGggLSBmcmFnbWVudC5sZW5ndGgpO1xuXG4gICAgICAgIC8vIFNldCBub24td3JpdGFibGUgcHJvcGVydGllcy5cbiAgICAgICAgZGVmaW5lSW1tdXRhYmxlKHRoaXMsICdkaXJlY3RvcnknLCBkaXJlY3RvcnkpO1xuICAgICAgICBkZWZpbmVJbW11dGFibGUodGhpcywgJ2ZyYWdtZW50JywgZnJhZ21lbnQpO1xuICAgICAgICBkZWZpbmVJbW11dGFibGUodGhpcywgJ2Z1bGwnLCBwYXRoKTtcbiAgICAgICAgZGVmaW5lSW1tdXRhYmxlKHRoaXMsICdzZXAnLCBzZXApO1xuICAgIH1cblxuICAgIEBjYWNoZWRQcm9wZXJ0eVxuICAgIGdldCBhYnNvbHV0ZSgpIHtcbiAgICAgICAgcmV0dXJuIGFic29sdXRpZnkodGhpcy5mdWxsKTtcbiAgICB9XG5cbiAgICBAY2FjaGVkUHJvcGVydHlcbiAgICBnZXQgc3RhdCgpIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIHJldHVybiBmcy5zdGF0U3luYyh0aGlzLmFic29sdXRlKTtcbiAgICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGlzRGlyZWN0b3J5KCkge1xuICAgICAgICByZXR1cm4gdGhpcy5zdGF0ID8gdGhpcy5zdGF0LmlzRGlyZWN0b3J5KCkgOiBudWxsO1xuICAgIH1cblxuICAgIGlzRmlsZSgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuc3RhdCA/ICF0aGlzLnN0YXQuaXNEaXJlY3RvcnkoKSA6IG51bGw7XG4gICAgfVxuXG4gICAgaXNQcm9qZWN0RGlyZWN0b3J5KCkge1xuICAgICAgICByZXR1cm4gYXRvbS5wcm9qZWN0LmdldFBhdGhzKCkuaW5kZXhPZih0aGlzLmFic29sdXRlKSAhPT0gLTE7XG4gICAgfVxuXG4gICAgaXNSb290KCkge1xuICAgICAgICByZXR1cm4gc3RkUGF0aC5kaXJuYW1lKHRoaXMuYWJzb2x1dGUpID09PSB0aGlzLmFic29sdXRlO1xuICAgIH1cblxuICAgIGhhc0Nhc2VTZW5zaXRpdmVGcmFnbWVudCgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZnJhZ21lbnQgIT09ICcnICYmIHRoaXMuZnJhZ21lbnQgIT09IHRoaXMuZnJhZ21lbnQudG9Mb3dlckNhc2UoKTtcbiAgICB9XG5cbiAgICBleGlzdHMoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnN0YXQgIT09IG51bGw7XG4gICAgfVxuXG4gICAgYXNEaXJlY3RvcnkoKSB7XG4gICAgICAgIHJldHVybiBuZXcgUGF0aCh0aGlzLmZ1bGwgKyAodGhpcy5mcmFnbWVudCA/IHRoaXMuc2VwIDogJycpKTtcbiAgICB9XG5cbiAgICBwYXJlbnQoKSB7XG4gICAgICAgIGlmICh0aGlzLmlzUm9vdCgpKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgfSBlbHNlIGlmICh0aGlzLmZyYWdtZW50KSB7XG4gICAgICAgICAgICByZXR1cm4gbmV3IFBhdGgodGhpcy5kaXJlY3RvcnkpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIG5ldyBQYXRoKHN0ZFBhdGguZGlybmFtZSh0aGlzLmRpcmVjdG9yeSkgKyB0aGlzLnNlcCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBSZXR1cm4gcGF0aCBmb3IgdGhlIHJvb3QgZGlyZWN0b3J5IGZvciB0aGUgZHJpdmUgdGhpcyBwYXRoIGlzIG9uLlxuICAgICAqL1xuICAgIHJvb3QoKSB7XG4gICAgICAgIGxldCBsYXN0ID0gbnVsbDtcbiAgICAgICAgbGV0IGN1cnJlbnQgPSB0aGlzLmFic29sdXRlO1xuICAgICAgICB3aGlsZSAoY3VycmVudCAhPT0gbGFzdCkge1xuICAgICAgICAgICAgbGFzdCA9IGN1cnJlbnQ7XG4gICAgICAgICAgICBjdXJyZW50ID0gc3RkUGF0aC5kaXJuYW1lKGN1cnJlbnQpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIG5ldyBQYXRoKGN1cnJlbnQpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENyZWF0ZSBhbiBlbXB0eSBmaWxlIGF0IHRoZSBnaXZlbiBwYXRoIGlmIGl0IGRvZXNuJ3QgYWxyZWFkeSBleGlzdC5cbiAgICAgKi9cbiAgICBjcmVhdGVGaWxlKCkge1xuICAgICAgICB0b3VjaC5zeW5jKHRoaXMuYWJzb2x1dGUpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENyZWF0ZSBkaXJlY3RvcmllcyBmb3IgdGhlIGZpbGUgdGhpcyBwYXRoIHBvaW50cyB0bywgb3IgZG8gbm90aGluZ1xuICAgICAqIGlmIHRoZXkgYWxyZWFkeSBleGlzdC5cbiAgICAgKi9cbiAgICBjcmVhdGVEaXJlY3RvcmllcygpIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIG1rZGlycC5zeW5jKGFic29sdXRpZnkodGhpcy5kaXJlY3RvcnkpKTtcbiAgICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgICBpZiAoZXJyLmNvZGUgIT09ICdFTk9FTlQnKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgZXJyO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgbWF0Y2hpbmdQYXRocyhjYXNlU2Vuc2l0aXZlPW51bGwpIHtcbiAgICAgICAgbGV0IGFic29sdXRlRGlyID0gYWJzb2x1dGlmeSh0aGlzLmRpcmVjdG9yeSk7XG4gICAgICAgIGxldCBmaWxlbmFtZXMgPSBudWxsO1xuXG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBmaWxlbmFtZXMgPSBmcy5yZWFkZGlyU3luYyhhYnNvbHV0ZURpcik7XG4gICAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICAgICAgcmV0dXJuIFtdOyAvLyBUT0RPOiBDYXRjaCBwZXJtaXNzaW9ucyBlcnJvciBhbmQgZGlzcGxheSBhIG1lc3NhZ2UuXG4gICAgICAgIH1cblxuICAgICAgICBpZiAodGhpcy5mcmFnbWVudCkge1xuICAgICAgICAgICAgaWYgKGNvbmZpZy5nZXQoJ2Z1enp5TWF0Y2gnKSkge1xuICAgICAgICAgICAgICAgIGZpbGVuYW1lcyA9IGZ1enphbGRyaW4uZmlsdGVyKGZpbGVuYW1lcywgdGhpcy5mcmFnbWVudCk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGlmIChjYXNlU2Vuc2l0aXZlID09PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgICAgIGNhc2VTZW5zaXRpdmUgPSB0aGlzLmhhc0Nhc2VTZW5zaXRpdmVGcmFnbWVudCgpO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGZpbGVuYW1lcyA9IGZpbGVuYW1lcy5maWx0ZXIoXG4gICAgICAgICAgICAgICAgICAgIChmbikgPT4gbWF0Y2hGcmFnbWVudCh0aGlzLmZyYWdtZW50LCBmbiwgY2FzZVNlbnNpdGl2ZSlcbiAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGZpbGVuYW1lcy5tYXAoKGZuKSA9PiBuZXcgUGF0aCh0aGlzLmRpcmVjdG9yeSArIGZuKSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQ2hlY2sgaWYgdGhlIGxhc3QgcGF0aCBmcmFnbWVudCBpbiB0aGlzIHBhdGggaXMgZXF1YWwgdG8gdGhlIGdpdmVuXG4gICAgICogc2hvcnRjdXQgc3RyaW5nLCBhbmQgdGhlIHBhdGggZW5kcyBpbiBhIHNlcGFyYXRvci5cbiAgICAgKlxuICAgICAqIEZvciBleGFtcGxlLCAnOi8nIGFuZCAnL2Zvby9iYXIvOi8nIGhhdmUgdGhlICc6JyBzaG9ydGN1dCwgYnV0XG4gICAgICogJy9mb28vYmFyOi8nIGFuZCAnL2JsYWgvOicgZG8gbm90LlxuICAgICAqL1xuICAgIGhhc1Nob3J0Y3V0KHNob3J0Y3V0KSB7XG4gICAgICAgIHNob3J0Y3V0ID0gc2hvcnRjdXQgKyB0aGlzLnNlcDtcbiAgICAgICAgcmV0dXJuICF0aGlzLmZyYWdtZW50ICYmIChcbiAgICAgICAgICAgIHRoaXMuZGlyZWN0b3J5LmVuZHNXaXRoKHRoaXMuc2VwICsgc2hvcnRjdXQpXG4gICAgICAgICAgICB8fCB0aGlzLmRpcmVjdG9yeSA9PT0gc2hvcnRjdXRcbiAgICAgICAgKVxuICAgIH1cblxuICAgIGVxdWFscyhvdGhlclBhdGgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZnVsbCA9PT0gb3RoZXJQYXRoLmZ1bGw7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogUmV0dXJuIHRoZSBwYXRoIHRvIHNob3cgaW5pdGlhbGx5IGluIHRoZSBwYXRoIGlucHV0LlxuICAgICAqL1xuICAgIHN0YXRpYyBpbml0aWFsKCkge1xuICAgICAgICBzd2l0Y2ggKGNvbmZpZy5nZXQoJ2RlZmF1bHRJbnB1dFZhbHVlJykpIHtcbiAgICAgICAgICAgIGNhc2UgY29uZmlnLkRFRkFVTFRfQUNUSVZFX0ZJTEVfRElSOlxuICAgICAgICAgICAgICAgIGxldCBlZGl0b3IgPSBhdG9tLndvcmtzcGFjZS5nZXRBY3RpdmVUZXh0RWRpdG9yKCk7XG4gICAgICAgICAgICAgICAgaWYgKGVkaXRvciAmJiBlZGl0b3IuZ2V0UGF0aCgpKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBuZXcgUGF0aChzdGRQYXRoLmRpcm5hbWUoZWRpdG9yLmdldFBhdGgoKSkgKyBzdGRQYXRoLnNlcCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIC8vIE5vIGJyZWFrIHNvIHRoYXQgd2UgZmFsbCBiYWNrIHRvIHByb2plY3Qgcm9vdC5cbiAgICAgICAgICAgIGNhc2UgY29uZmlnLkRFRkFVTFRfUFJPSkVDVF9ST09UOlxuICAgICAgICAgICAgICAgIGxldCBwcm9qZWN0UGF0aCA9IGdldFByb2plY3RQYXRoKCk7XG4gICAgICAgICAgICAgICAgaWYgKHByb2plY3RQYXRoKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBuZXcgUGF0aChwcm9qZWN0UGF0aCArIHN0ZFBhdGguc2VwKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gbmV3IFBhdGgoJycpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENvbXBhcmUgdHdvIHBhdGhzIGxleGljb2dyYXBoaWNhbGx5LlxuICAgICAqL1xuICAgIHN0YXRpYyBjb21wYXJlKHBhdGgxLCBwYXRoMikge1xuICAgICAgICByZXR1cm4gcGF0aDEuZnVsbC5sb2NhbGVDb21wYXJlKHBhdGgyLmZ1bGwpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFJldHVybiBhIG5ldyBwYXRoIGluc3RhbmNlIHdpdGggdGhlIGNvbW1vbiBwcmVmaXggb2YgYWxsIHRoZVxuICAgICAqIGdpdmVuIHBhdGhzLlxuICAgICAqL1xuICAgIHN0YXRpYyBjb21tb25QcmVmaXgocGF0aHMsIGNhc2VTZW5zaXRpdmU9ZmFsc2UpIHtcbiAgICAgICAgaWYgKHBhdGhzLmxlbmd0aCA8IDIpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgICAgICAgICAgICAnQ2Fubm90IGZpbmQgY29tbW9uIHByZWZpeCBmb3IgbGlzdHMgc2hvcnRlciB0aGFuIHR3byBlbGVtZW50cy4nXG4gICAgICAgICAgICApO1xuICAgICAgICB9XG5cbiAgICAgICAgcGF0aHMgPSBwYXRocy5tYXAoKHBhdGgpID0+IHBhdGguZnVsbCkuc29ydCgpO1xuICAgICAgICBsZXQgZmlyc3QgPSBwYXRoc1swXTtcbiAgICAgICAgbGV0IGxhc3QgPSBwYXRoc1twYXRocy5sZW5ndGggLSAxXTtcblxuICAgICAgICBsZXQgcHJlZml4ID0gJyc7XG4gICAgICAgIGxldCBwcmVmaXhNYXhMZW5ndGggPSBNYXRoLm1pbihmaXJzdC5sZW5ndGgsIGxhc3QubGVuZ3RoKTtcbiAgICAgICAgZm9yIChsZXQgayA9IDA7IGsgPCBwcmVmaXhNYXhMZW5ndGg7IGsrKykge1xuICAgICAgICAgICAgaWYgKGZpcnN0W2tdID09PSBsYXN0W2tdKSB7XG4gICAgICAgICAgICAgICAgcHJlZml4ICs9IGZpcnN0W2tdO1xuICAgICAgICAgICAgfSBlbHNlIGlmICghY2FzZVNlbnNpdGl2ZSAmJiBmaXJzdFtrXS50b0xvd2VyQ2FzZSgpID09PSBsYXN0W2tdLnRvTG93ZXJDYXNlKCkpIHtcbiAgICAgICAgICAgICAgICBwcmVmaXggKz0gZmlyc3Rba10udG9Mb3dlckNhc2UoKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gbmV3IFBhdGgocHJlZml4KTtcbiAgICB9XG59XG5cbi8qKlxuICogUmV0dXJuIHdoZXRoZXIgdGhlIGZpbGVuYW1lIG1hdGNoZXMgdGhlIGdpdmVuIHBhdGggZnJhZ21lbnQuXG4gKi9cbmZ1bmN0aW9uIG1hdGNoRnJhZ21lbnQoZnJhZ21lbnQsIGZpbGVuYW1lLCBjYXNlU2Vuc2l0aXZlPWZhbHNlKSB7XG4gICAgaWYgKCFjYXNlU2Vuc2l0aXZlKSB7XG4gICAgICAgIGZyYWdtZW50ID0gZnJhZ21lbnQudG9Mb3dlckNhc2UoKTtcbiAgICAgICAgZmlsZW5hbWUgPSBmaWxlbmFtZS50b0xvd2VyQ2FzZSgpO1xuICAgIH1cblxuICAgIHJldHVybiBmaWxlbmFtZS5zdGFydHNXaXRoKGZyYWdtZW50KTtcbn1cbiJdfQ==