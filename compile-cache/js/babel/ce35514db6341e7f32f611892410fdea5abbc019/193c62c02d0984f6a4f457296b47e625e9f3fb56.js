Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var _lodash = require('lodash');

var _ioUtil = require('./ioUtil');

var _ioUtil2 = _interopRequireDefault(_ioUtil);

'use babel';

var walk = require('walk');

var JavaClassReader = (function () {
  function JavaClassReader(loadClassMembers, ignoreInnerClasses, javaHome) {
    _classCallCheck(this, JavaClassReader);

    this.loadClassMembers = loadClassMembers;
    this.ignoreInnerClasses = ignoreInnerClasses;
    this.javaHome = javaHome;
  }

  _createClass(JavaClassReader, [{
    key: 'readAllClassesFromClasspath',
    value: function readAllClassesFromClasspath(classpath, skipLibs, callback) {
      var _this = this;

      var serialPromise = Promise.resolve();
      // We split with ; on Windows
      var paths = classpath.split(classpath.indexOf(';') !== -1 ? ';' : ':');
      _lodash._.each(paths, function (path) {
        if (path) {
          // TODO
          serialPromise = serialPromise.then(function () {
            return _this.readAllClassesFromPath(path, skipLibs, callback);
          });
        }
      });
      return serialPromise;
    }
  }, {
    key: 'readAllClassesFromPath',
    value: function readAllClassesFromPath(path, skipLibs, callback) {
      var _this2 = this;

      var promise = null;
      if (skipLibs && (path.endsWith('.jar') || path.endsWith('*'))) {
        return Promise.resolve();
      } else if (path.endsWith('.jar')) {
        // Read classes from a jar file
        promise = this.readAllClassesFromJar(path, callback);
      } else if (path.endsWith('*')) {
        (function () {
          // List jar files and read classes from them
          var dir = path.replace('*', '');
          promise = _ioUtil2['default'].readDir(dir).then(function (names) {
            var serialPromise = Promise.resolve();
            _lodash._.each(names, function (name) {
              if (name.endsWith('.jar')) {
                // TODO
                serialPromise = serialPromise.then(function () {
                  return _this2.readAllClassesFromJar(dir + name, callback);
                });
              }
            });
            return serialPromise;
          });
        })();
      } else {
        var _ret2 = (function () {
          // Gather all class files from a directory and its subdirectories
          var classFilePaths = [];
          promise = new Promise(function (resolve) {
            var walker = walk.walk(path, function () {});
            walker.on('directories', function (root, dirStatsArray, next) {
              next();
            });
            walker.on('file', function (root, fileStats, next) {
              if (fileStats.name.endsWith('.class')) {
                var classFilePath = (root + '/' + fileStats.name).replace(path + '/', '').replace(path + '\\', '');
                classFilePaths.push(classFilePath);
              }
              next();
            });
            walker.on('errors', function (root, nodeStatsArray, next) {
              next();
            });
            walker.on('end', function () {
              resolve();
            });
          });
          // Read classes
          return {
            v: promise.then(function () {
              return _this2.readClassesByName(path, classFilePaths, true, callback);
            })
          };
        })();

        if (typeof _ret2 === 'object') return _ret2.v;
      }
      return promise;
    }
  }, {
    key: 'readAllClassesFromJar',
    value: function readAllClassesFromJar(jarPath, callback) {
      var _this3 = this;

      return _ioUtil2['default'].exec('"' + this.javaBinDir() + 'jar" tf "' + jarPath + '"').then(function (stdout) {
        var filePaths = stdout.match(new RegExp('[\\S]*\\.class', 'g'));
        return _this3.readClassesByName(jarPath, filePaths, false, callback);
      });
    }
  }, {
    key: 'readClassesByName',
    value: function readClassesByName(classpath, cNames, parseArgs, callback) {
      var _this4 = this;

      // Filter and format class names from cNames that can be either
      // class names or file paths
      var classNames = (0, _lodash._)(cNames).filter(function (className) {
        return className && (className.indexOf('$') === -1 || !_this4.ignoreInnerClasses);
      }).map(function (className) {
        return className.replace('.class', '').replace(/[\/\\]/g, '.').trim();
      }).value();

      var promise = null;
      if (this.loadClassMembers) {
        // Read class info with javap
        promise = this.readClassesByNameWithJavap(classpath, classNames, parseArgs, callback);
      } else {
        // Just do callback with class name only
        _lodash._.each(classNames, function (className) {
          callback(classpath, { className: className });
        });
        promise = Promise.resolve();
      }
      return promise;
    }
  }, {
    key: 'readClassesByNameWithJavap',
    value: function readClassesByNameWithJavap(classpath, classNamesArray, parseArgs, callback) {
      var _this5 = this;

      var serialPromise = Promise.resolve();

      // Group array in multiple arrays of limited max length
      _lodash._.each(_lodash._.chunk(classNamesArray, parseArgs ? 20 : 50), function (classNames) {
        // Read classes with javap
        serialPromise = serialPromise.then(function () {
          var classNamesStr = _lodash._.reduce(classNames, function (className, result) {
            return result + ' ' + className;
          }, '');
          return _ioUtil2['default'].exec('"' + _this5.javaBinDir() + 'javap" ' + (parseArgs ? '-verbose -private ' : ' ') + '-classpath "' + classpath + '" ' + classNamesStr, false, true).then(function (stdout) {
            _lodash._.each(stdout.match(/Compiled from [^\}]*\}/gm), function (javapClass) {
              try {
                var classDesc = _this5.parseJavapClass(javapClass, parseArgs);
                callback(classpath, classDesc);
              } catch (err) {
                console.warn(err);
              }
            });
          });
        });
      });

      return serialPromise;
    }

    // TODO: This is a quick and ugly hack. Replace with an separate
    // javap parser module
  }, {
    key: 'parseJavapClass',
    value: function parseJavapClass(javapClass, parseArgs) {
      var desc = null;

      if (!parseArgs) {
        var extend = javapClass.match(/extends ([^\s]+)/);
        desc = {
          className: javapClass.match(/(class|interface)\s(\S*)\s/)[2].replace(/\<.*/g, ''),
          extend: extend ? extend[1] : null,
          members: javapClass.match(/(\S.*);/g)
        };
      } else {
        (function () {
          desc = {
            className: null,
            extend: null,
            members: [],
            members2: []
          };

          var status = 'header';
          var parsingArgs = false;

          _lodash._.each(javapClass.split(/[\r\n]+/), function (l) {
            var line = l.trim();
            var lineIndent = l.match(/^\s*/)[0].length;

            if (status === 'header') {
              if (/class|interface/.test(line)) {
                // Parse class/interface name and extends
                var extend = javapClass.match(/extends ([^\s]+)/);
                desc.extend = extend ? extend[1] : null;
                desc.className = javapClass.match(/(class|interface)\s(\S*)\s/)[2].replace(/\<.*/g, '');
              }
              if (line.indexOf('{') !== -1) {
                // Start parsing class members
                status = 'members';
              }
            } else if (status === 'members') {
              if (lineIndent === 2) {
                // Add new member
                desc.members2.push({
                  prototype: line,
                  args: []
                });
                parsingArgs = false;
              } else if (lineIndent === 4) {
                parsingArgs = /MethodParameters/.test(line);
              } else if (lineIndent === 6 && parsingArgs && line.indexOf(' ') === -1) {
                desc.members2[desc.members2.length - 1].args.push(line);
              } else if (line === '}') {
                status = 'end';
              }
            }
          });

          _lodash._.each(desc.members2, function (member) {
            var tmp = member.prototype;

            // NOTE: quick hack for generics support
            for (var i = 0; i < 5; i++) {
              var t = tmp.replace(/<(.*),\s+(.*)>/, '&lt;$1|comma|$2&gt;');
              tmp = t;
            }

            _lodash._.each(member.args, function (arg) {
              if (tmp.indexOf(',') !== -1) {
                tmp = tmp.replace(',', ' ' + arg + '=');
              } else {
                tmp = tmp.replace(')', ' ' + arg + ')');
              }
            });
            tmp = tmp.replace(/=/g, ',');

            // NOTE: quick hack for generics support
            tmp = tmp.replace(/&lt;/g, '<');
            tmp = tmp.replace(/&gt;/g, '>');
            tmp = tmp.replace(/\|comma\|/g, ',');

            member.prototype = tmp;
            desc.members.push(tmp);
          });
        })();
      }

      return desc;
    }
  }, {
    key: 'javaBinDir',
    value: function javaBinDir() {
      var baseDir = this.javaHome || process.env.JAVA_HOME;
      if (baseDir) {
        return baseDir.replace(/[\/\\]$/, '') + '/bin/';
      }
      return '';
    }
  }]);

  return JavaClassReader;
})();

exports.JavaClassReader = JavaClassReader;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9ob21lL2pha2UvLmF0b20vcGFja2FnZXMvYXV0b2NvbXBsZXRlLWphdmEvbGliL0phdmFDbGFzc1JlYWRlci5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7O3NCQUVrQixRQUFROztzQkFDUCxVQUFVOzs7O0FBSDdCLFdBQVcsQ0FBQzs7QUFJWixJQUFNLElBQUksR0FBRyxPQUFPLENBQUMsTUFBTSxDQUFDLENBQUM7O0lBRWhCLGVBQWU7QUFFZixXQUZBLGVBQWUsQ0FFZCxnQkFBZ0IsRUFBRSxrQkFBa0IsRUFBRSxRQUFRLEVBQUU7MEJBRmpELGVBQWU7O0FBR3hCLFFBQUksQ0FBQyxnQkFBZ0IsR0FBRyxnQkFBZ0IsQ0FBQztBQUN6QyxRQUFJLENBQUMsa0JBQWtCLEdBQUcsa0JBQWtCLENBQUM7QUFDN0MsUUFBSSxDQUFDLFFBQVEsR0FBRyxRQUFRLENBQUM7R0FDMUI7O2VBTlUsZUFBZTs7V0FRQyxxQ0FBQyxTQUFTLEVBQUUsUUFBUSxFQUFFLFFBQVEsRUFBRTs7O0FBQ3pELFVBQUksYUFBYSxHQUFHLE9BQU8sQ0FBQyxPQUFPLEVBQUUsQ0FBQzs7QUFFdEMsVUFBTSxLQUFLLEdBQUcsU0FBUyxDQUFDLEtBQUssQ0FBQyxTQUFTLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsQ0FBQyxHQUFHLEdBQUcsR0FBRyxHQUFHLENBQUMsQ0FBQztBQUN6RSxnQkFBRSxJQUFJLENBQUMsS0FBSyxFQUFFLFVBQUEsSUFBSSxFQUFJO0FBQ3BCLFlBQUksSUFBSSxFQUFFOztBQUVSLHVCQUFhLEdBQUcsYUFBYSxDQUFDLElBQUksQ0FBQyxZQUFNO0FBQ3ZDLG1CQUFPLE1BQUssc0JBQXNCLENBQUMsSUFBSSxFQUFFLFFBQVEsRUFBRSxRQUFRLENBQUMsQ0FBQztXQUM5RCxDQUFDLENBQUM7U0FDSjtPQUNGLENBQUMsQ0FBQztBQUNILGFBQU8sYUFBYSxDQUFDO0tBQ3RCOzs7V0FFcUIsZ0NBQUMsSUFBSSxFQUFFLFFBQVEs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QUMsT0FBTyxDQUFDLE9BQU8sRUFBRSxHQUFHLENBQUMsQ0FBQztBQUNoQyxlQUFHLEdBQUcsR0FBRyxDQUFDLE9BQU8sQ0FBQyxPQUFPLEVBQUUsR0FBRyxDQUFDLENBQUM7QUFDaEMsZUFBRyxHQUFHLEdBQUcsQ0FBQyxPQUFPLENBQUMsWUFBWSxFQUFFLEdBQUcsQ0FBQyxDQUFDOztBQUVyQyxrQkFBTSxDQUFDLFNBQVMsR0FBRyxHQUFHLENBQUM7QUFDdkIsZ0JBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1dBQ3hCLENBQUMsQ0FBQzs7T0FDSjs7QUFFRCxhQUFPLElBQUksQ0FBQztLQUNiOzs7V0FFUyxzQkFBRztBQUNYLFVBQU0sT0FBTyxHQUFHLElBQUksQ0FBQyxRQUFRLElBQUksT0FBTyxDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUM7QUFDdkQsVUFBSSxPQUFPLEVBQUU7QUFDWCxlQUFPLE9BQU8sQ0FBQyxPQUFPLENBQUMsU0FBUyxFQUFFLEVBQUUsQ0FBQyxHQUFHLE9BQU8sQ0FBQztPQUNqRDtBQUNELGFBQU8sRUFBRSxDQUFDO0tBQ1g7OztTQTVPVSxlQUFlIiwiZmlsZSI6Ii9ob21lL2pha2UvLmF0b20vcGFja2FnZXMvYXV0b2NvbXBsZXRlLWphdmEvbGliL0phdmFDbGFzc1JlYWRlci5qcyIsInNvdXJjZXNDb250ZW50IjpbIid1c2UgYmFiZWwnO1xuXG5pbXBvcnQgeyBfIH0gZnJvbSAnbG9kYXNoJztcbmltcG9ydCBpb1V0aWwgZnJvbSAnLi9pb1V0aWwnO1xuY29uc3Qgd2FsayA9IHJlcXVpcmUoJ3dhbGsnKTtcblxuZXhwb3J0IGNsYXNzIEphdmFDbGFzc1JlYWRlciB7XG5cbiAgY29uc3RydWN0b3IobG9hZENsYXNzTWVtYmVycywgaWdub3JlSW5uZXJDbGFzc2VzLCBqYXZhSG9tZSkge1xuICAgIHRoaXMubG9hZENsYXNzTWVtYmVycyA9IGxvYWRDbGFzc01lbWJlcnM7XG4gICAgdGhpcy5pZ25vcmVJbm5lckNsYXNzZXMgPSBpZ25vcmVJbm5lckNsYXNzZXM7XG4gICAgdGhpcy5qYXZhSG9tZSA9IGphdmFIb21lO1xuICB9XG5cbiAgcmVhZEFsbENsYXNzZXNGcm9tQ2xhc3NwYXRoKGNsYXNzcGF0aCwgc2tpcExpYnMsIGNhbGxiYWNrKSB7XG4gICAgbGV0IHNlcmlhbFByb21pc2UgPSBQcm9taXNlLnJlc29sdmUoKTtcbiAgICAvLyBXZSBzcGxpdCB3aXRoIDsgb24gV2luZG93c1xuICAgIGNvbnN0IHBhdGhzID0gY2xhc3NwYXRoLnNwbGl0KGNsYXNzcGF0aC5pbmRleE9mKCc7JykgIT09IC0xID8gJzsnIDogJzonKTtcbiAgICBfLmVhY2gocGF0aHMsIHBhdGggPT4ge1xuICAgICAgaWYgKHBhdGgpIHtcbiAgICAgICAgLy8gVE9ET1xuICAgICAgICBzZXJpYWxQcm9taXNlID0gc2VyaWFsUHJvbWlzZS50aGVuKCgpID0+IHtcbiAgICAgICAgICByZXR1cm4gdGhpcy5yZWFkQWxsQ2xhc3Nlc0Zyb21QYXRoKHBhdGgsIHNraXBMaWJzLCBjYWxsYmFjayk7XG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH0pO1xuICAgIHJldHVybiBzZXJpYWxQcm9taXNlO1xuICB9XG5cbiAgcmVhZEFsbENsYXNzZXNGcm9tUGF0aChwYXRoLCBza2lwTGlicywgY2FsbGJhY2spIHtcbiAgICBsZXQgcHJvbWlzZSA9IG51bGw7XG4gICAgaWYgKHNraXBMaWJzICYmIChwYXRoLmVuZHNXaXRoKCcuamFyJykgfHwgcGF0aC5lbmRzV2l0aCgnKicpKSkge1xuICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xuICAgIH0gZWxzZSBpZiAocGF0aC5lbmRzV2l0aCgnLmphcicpKSB7XG4gICAgICAvLyBSZWFkIGNsYXNzZXMgZnJvbSBhIGphciBmaWxlXG4gICAgICBwcm9taXNlID0gdGhpcy5yZWFkQWxsQ2xhc3Nlc0Zyb21KYXIocGF0aCwgY2FsbGJhY2spO1xuICAgIH0gZWxzZSBpZiAocGF0aC5lbmRzV2l0aCgnKicpKSB7XG4gICAgICAvLyBMaXN0IGphciBmaWxlcyBhbmQgcmVhZCBjbGFzc2VzIGZyb20gdGhlbVxuICAgICAgY29uc3QgZGlyID0gcGF0aC5yZXBsYWNlKCcqJywgJycpO1xuICAgICAgcHJvbWlzZSA9IGlvVXRpbC5yZWFkRGlyKGRpcikudGhlbihuYW1lcyA9PiB7XG4gICAgICAgIGxldCBzZXJpYWxQcm9taXNlID0gUHJvbWlzZS5yZXNvbHZlKCk7XG4gICAgICAgIF8uZWFjaChuYW1lcywgbmFtZSA9PiB7XG4gICAgICAgICAgaWYgKG5hbWUuZW5kc1dpdGgoJy5qYXInKSkge1xuICAgICAgICAgICAgLy8gVE9ET1xuICAgICAgICAgICAgc2VyaWFsUHJvbWlzZSA9IHNlcmlhbFByb21pc2UudGhlbigoKSA9PiB7XG4gICAgICAgICAgICAgIHJldHVybiB0aGlzLnJlYWRBbGxDbGFzc2VzRnJvbUphcihkaXIgKyBuYW1lLCBjYWxsYmFjayk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gc2VyaWFsUHJvbWlzZTtcbiAgICAgIH0pO1xuICAgIH0gZWxzZSB7XG4gICAgICAvLyBHYXRoZXIgYWxsIGNsYXNzIGZpbGVzIGZyb20gYSBkaXJlY3RvcnkgYW5kIGl0cyBzdWJkaXJlY3Rvcmllc1xuICAgICAgY29uc3QgY2xhc3NGaWxlUGF0aHMgPSBbXTtcbiAgICAgIHByb21pc2UgPSBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4ge1xuICAgICAgICBjb25zdCB3YWxrZXIgPSB3YWxrLndhbGsocGF0aCwgKCkgPT4geyB9KTtcbiAgICAgICAgd2Fsa2VyLm9uKCdkaXJlY3RvcmllcycsIChyb290LCBkaXJTdGF0c0FycmF5LCBuZXh0KSA9PiB7XG4gICAgICAgICAgbmV4dCgpO1xuICAgICAgICB9KTtcbiAgICAgICAgd2Fsa2VyLm9uKCdmaWxlJywgKHJvb3QsIGZpbGVTdGF0cywgbmV4dCkgPT4ge1xuICAgICAgICAgIGlmIChmaWxlU3RhdHMubmFtZS5lbmRzV2l0aCgnLmNsYXNzJykpIHtcbiAgICAgICAgICAgIGNvbnN0IGNsYXNzRmlsZVBhdGggPSAocm9vdCArICcvJyArIGZpbGVTdGF0cy5uYW1lKVxuICAgICAgICAgICAgICAucmVwbGFjZShwYXRoICsgJy8nLCAnJykucmVwbGFjZShwYXRoICsgJ1xcXFwnLCAnJyk7XG4gICAgICAgICAgICBjbGFzc0ZpbGVQYXRocy5wdXNoKGNsYXNzRmlsZVBhdGgpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBuZXh0KCk7XG4gICAgICAgIH0pO1xuICAgICAgICB3YWxrZXIub24oJ2Vycm9ycycsIChyb290LCBub2RlU3RhdHNBcnJheSwgbmV4dCkgPT4ge1xuICAgICAgICAgIG5leHQoKTtcbiAgICAgICAgfSk7XG4gICAgICAgIHdhbGtlci5vbignZW5kJywgKCkgPT4ge1xuICAgICAgICAgIHJlc29sdmUoKTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICAgIC8vIFJlYWQgY2xhc3Nlc1xuICAgICAgcmV0dXJuIHByb21pc2UudGhlbigoKSA9PiB7XG4gICAgICAgIHJldHVybiB0aGlzLnJlYWRDbGFzc2VzQnlOYW1lKHBhdGgsIGNsYXNzRmlsZVBhdGhzLCB0cnVlLCBjYWxsYmFjayk7XG4gICAgICB9KTtcbiAgICB9XG4gICAgcmV0dXJuIHByb21pc2U7XG4gIH1cblxuICByZWFkQWxsQ2xhc3Nlc0Zyb21KYXIoamFyUGF0aCwgY2FsbGJhY2spIHtcbiAgICByZXR1cm4gaW9VdGlsLmV4ZWMoJ1wiJyArIHRoaXMuamF2YUJpbkRpcigpICsgJ2phclwiIHRmIFwiJyArIGphclBhdGggKyAnXCInKVxuICAgIC50aGVuKHN0ZG91dCA9PiB7XG4gICAgICBjb25zdCBmaWxlUGF0aHMgPSBzdGRvdXQubWF0Y2gobmV3IFJlZ0V4cCgnW1xcXFxTXSpcXFxcLmNsYXNzJywgJ2cnKSk7XG4gICAgICByZXR1cm4gdGhpcy5yZWFkQ2xhc3Nlc0J5TmFtZShqYXJQYXRoLCBmaWxlUGF0aHMsIGZhbHNlLCBjYWxsYmFjayk7XG4gICAgfSk7XG4gIH1cblxuICByZWFkQ2xhc3Nlc0J5TmFtZShjbGFzc3BhdGgsIGNOYW1lcywgcGFyc2VBcmdzLCBjYWxsYmFjaykge1xuICAgIC8vIEZpbHRlciBhbmQgZm9ybWF0IGNsYXNzIG5hbWVzIGZyb20gY05hbWVzIHRoYXQgY2FuIGJlIGVpdGhlclxuICAgIC8vIGNsYXNzIG5hbWVzIG9yIGZpbGUgcGF0aHNcbiAgICBjb25zdCBjbGFzc05hbWVzID0gXyhjTmFtZXMpLmZpbHRlcigoY2xhc3NOYW1lKSA9PiB7XG4gICAgICByZXR1cm4gY2xhc3NOYW1lICYmIChjbGFzc05hbWUuaW5kZXhPZignJCcpID09PSAtMSB8fFxuICAgICAgICAhdGhpcy5pZ25vcmVJbm5lckNsYXNzZXMpO1xuICAgIH0pLm1hcCgoY2xhc3NOYW1lKSA9PiB7XG4gICAgICByZXR1cm4gY2xhc3NOYW1lLnJlcGxhY2UoJy5jbGFzcycsICcnKS5yZXBsYWNlKC9bXFwvXFxcXF0vZywgJy4nKS50cmltKCk7XG4gICAgfSkudmFsdWUoKTtcblxuICAgIGxldCBwcm9taXNlID0gbnVsbDtcbiAgICBpZiAodGhpcy5sb2FkQ2xhc3NNZW1iZXJzKSB7XG4gICAgICAvLyBSZWFkIGNsYXNzIGluZm8gd2l0aCBqYXZhcFxuICAgICAgcHJvbWlzZSA9IHRoaXMucmVhZENsYXNzZXNCeU5hbWVXaXRoSmF2YXAoXG4gICAgICAgIGNsYXNzcGF0aCwgY2xhc3NOYW1lcywgcGFyc2VBcmdzLCBjYWxsYmFjayk7XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIEp1c3QgZG8gY2FsbGJhY2sgd2l0aCBjbGFzcyBuYW1lIG9ubHlcbiAgICAgIF8uZWFjaChjbGFzc05hbWVzLCAoY2xhc3NOYW1lKSA9PiB7XG4gICAgICAgIGNhbGxiYWNrKGNsYXNzcGF0aCwgeyBjbGFzc05hbWU6IGNsYXNzTmFtZSB9KTtcbiAgICAgIH0pO1xuICAgICAgcHJvbWlzZSA9IFByb21pc2UucmVzb2x2ZSgpO1xuICAgIH1cbiAgICByZXR1cm4gcHJvbWlzZTtcbiAgfVxuXG4gIHJlYWRDbGFzc2VzQnlOYW1lV2l0aEphdmFwKGNsYXNzcGF0aCwgY2xhc3NOYW1lc0FycmF5LCBwYXJzZUFyZ3MsIGNhbGxiYWNrKSB7XG4gICAgbGV0IHNlcmlhbFByb21pc2UgPSBQcm9taXNlLnJlc29sdmUoKTtcblxuICAgIC8vIEdyb3VwIGFycmF5IGluIG11bHRpcGxlIGFycmF5cyBvZiBsaW1pdGVkIG1heCBsZW5ndGhcbiAgICBfLmVhY2goXy5jaHVuayhjbGFzc05hbWVzQXJyYXksIHBhcnNlQXJncyA/IDIwIDogNTApLCBjbGFzc05hbWVzID0+IHtcbiAgICAgIC8vIFJlYWQgY2xhc3NlcyB3aXRoIGphdmFwXG4gICAgICBzZXJpYWxQcm9taXNlID0gc2VyaWFsUHJvbWlzZS50aGVuKCgpID0+IHtcbiAgICAgICAgY29uc3QgY2xhc3NOYW1lc1N0ciA9IF8ucmVkdWNlKGNsYXNzTmFtZXMsIChjbGFzc05hbWUsIHJlc3VsdCkgPT4ge1xuICAgICAgICAgIHJldHVybiByZXN1bHQgKyAnICcgKyBjbGFzc05hbWU7XG4gICAgICAgIH0sICcnKTtcbiAgICAgICAgcmV0dXJuIGlvVXRpbC5leGVjKCdcIicgKyB0aGlzLmphdmFCaW5EaXIoKVxuICAgICAgICAgICsgJ2phdmFwXCIgJ1xuICAgICAgICAgICsgKHBhcnNlQXJncyA/ICctdmVyYm9zZSAtcHJpdmF0ZSAnIDogJyAnKVxuICAgICAgICAgICsgJy1jbGFzc3BhdGggXCInXG4gICAgICAgICAgKyBjbGFzc3BhdGggKyAnXCIgJyArIGNsYXNzTmFtZXNTdHIsIGZhbHNlLCB0cnVlKVxuICAgICAgICAudGhlbihzdGRvdXQgPT4ge1xuICAgICAgICAgIF8uZWFjaChzdGRvdXQubWF0Y2goL0NvbXBpbGVkIGZyb20gW15cXH1dKlxcfS9nbSksIGphdmFwQ2xhc3MgPT4ge1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgY29uc3QgY2xhc3NEZXNjID0gdGhpcy5wYXJzZUphdmFwQ2xhc3MoamF2YXBDbGFzcywgcGFyc2VBcmdzKTtcbiAgICAgICAgICAgICAgY2FsbGJhY2soY2xhc3NwYXRoLCBjbGFzc0Rlc2MpO1xuICAgICAgICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgICAgIGNvbnNvbGUud2FybihlcnIpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH0pO1xuXG4gICAgcmV0dXJuIHNlcmlhbFByb21pc2U7XG4gIH1cblxuICAvLyBUT0RPOiBUaGlzIGlzIGEgcXVpY2sgYW5kIHVnbHkgaGFjay4gUmVwbGFjZSB3aXRoIGFuIHNlcGFyYXRlXG4gIC8vIGphdmFwIHBhcnNlciBtb2R1bGVcbiAgcGFyc2VKYXZhcENsYXNzKGphdmFwQ2xhc3MsIHBhcnNlQXJncykge1xuICAgIGxldCBkZXNjID0gbnVsbDtcblxuICAgIGlmICghcGFyc2VBcmdzKSB7XG4gICAgICBjb25zdCBleHRlbmQgPSBqYXZhcENsYXNzLm1hdGNoKC9leHRlbmRzIChbXlxcc10rKS8pO1xuICAgICAgZGVzYyA9IHtcbiAgICAgICAgY2xhc3NOYW1lOiBqYXZhcENsYXNzLm1hdGNoKC8oY2xhc3N8aW50ZXJmYWNlKVxccyhcXFMqKVxccy8pWzJdXG4gICAgICAgICAgLnJlcGxhY2UoL1xcPC4qL2csICcnKSxcbiAgICAgICAgZXh0ZW5kOiBleHRlbmQgPyBleHRlbmRbMV0gOiBudWxsLFxuICAgICAgICBtZW1iZXJzOiBqYXZhcENsYXNzLm1hdGNoKC8oXFxTLiopOy9nKSxcbiAgICAgIH07XG4gICAgfSBlbHNlIHtcbiAgICAgIGRlc2MgPSB7XG4gICAgICAgIGNsYXNzTmFtZTogbnVsbCxcbiAgICAgICAgZXh0ZW5kOiBudWxsLFxuICAgICAgICBtZW1iZXJzOiBbXSxcbiAgICAgICAgbWVtYmVyczI6IFtdLFxuICAgICAgfTtcblxuICAgICAgbGV0IHN0YXR1cyA9ICdoZWFkZXInO1xuICAgICAgbGV0IHBhcnNpbmdBcmdzID0gZmFsc2U7XG5cbiAgICAgIF8uZWFjaChqYXZhcENsYXNzLnNwbGl0KC9bXFxyXFxuXSsvKSwgbCA9PiB7XG4gICAgICAgIGNvbnN0IGxpbmUgPSBsLnRyaW0oKTtcbiAgICAgICAgY29uc3QgbGluZUluZGVudCA9IGwubWF0Y2goL15cXHMqLylbMF0ubGVuZ3RoO1xuXG4gICAgICAgIGlmIChzdGF0dXMgPT09ICdoZWFkZXInKSB7XG4gICAgICAgICAgaWYgKC9jbGFzc3xpbnRlcmZhY2UvLnRlc3QobGluZSkpIHtcbiAgICAgICAgICAgIC8vIFBhcnNlIGNsYXNzL2ludGVyZmFjZSBuYW1lIGFuZCBleHRlbmRzXG4gICAgICAgICAgICBjb25zdCBleHRlbmQgPSBqYXZhcENsYXNzLm1hdGNoKC9leHRlbmRzIChbXlxcc10rKS8pO1xuICAgICAgICAgICAgZGVzYy5leHRlbmQgPSBleHRlbmQgPyBleHRlbmRbMV0gOiBudWxsO1xuICAgICAgICAgICAgZGVzYy5jbGFzc05hbWUgPSBqYXZhcENsYXNzLm1hdGNoKC8oY2xhc3N8aW50ZXJmYWNlKVxccyhcXFMqKVxccy8pWzJdXG4gICAgICAgICAgICAgIC5yZXBsYWNlKC9cXDwuKi9nLCAnJyk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmIChsaW5lLmluZGV4T2YoJ3snKSAhPT0gLTEpIHtcbiAgICAgICAgICAgIC8vIFN0YXJ0IHBhcnNpbmcgY2xhc3MgbWVtYmVyc1xuICAgICAgICAgICAgc3RhdHVzID0gJ21lbWJlcnMnO1xuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIGlmIChzdGF0dXMgPT09ICdtZW1iZXJzJykge1xuICAgICAgICAgIGlmIChsaW5lSW5kZW50ID09PSAyKSB7XG4gICAgICAgICAgICAvLyBBZGQgbmV3IG1lbWJlclxuICAgICAgICAgICAgZGVzYy5tZW1iZXJzMi5wdXNoKHtcbiAgICAgICAgICAgICAgcHJvdG90eXBlOiBsaW5lLFxuICAgICAgICAgICAgICBhcmdzOiBbXSxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgcGFyc2luZ0FyZ3MgPSBmYWxzZTtcbiAgICAgICAgICB9IGVsc2UgaWYgKGxpbmVJbmRlbnQgPT09IDQpIHtcbiAgICAgICAgICAgIHBhcnNpbmdBcmdzID0gL01ldGhvZFBhcmFtZXRlcnMvLnRlc3QobGluZSk7XG4gICAgICAgICAgfSBlbHNlIGlmIChsaW5lSW5kZW50ID09PSA2ICYmIHBhcnNpbmdBcmdzICYmXG4gICAgICAgICAgICAgIGxpbmUuaW5kZXhPZignICcpID09PSAtMSkge1xuICAgICAgICAgICAgZGVzYy5tZW1iZXJzMltkZXNjLm1lbWJlcnMyLmxlbmd0aCAtIDFdLmFyZ3MucHVzaChsaW5lKTtcbiAgICAgICAgICB9IGVsc2UgaWYgKGxpbmUgPT09ICd9Jykge1xuICAgICAgICAgICAgc3RhdHVzID0gJ2VuZCc7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9KTtcblxuICAgICAgXy5lYWNoKGRlc2MubWVtYmVyczIsIG1lbWJlciA9PiB7XG4gICAgICAgIGxldCB0bXAgPSBtZW1iZXIucHJvdG90eXBlO1xuXG4gICAgICAgIC8vIE5PVEU6IHF1aWNrIGhhY2sgZm9yIGdlbmVyaWNzIHN1cHBvcnRcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCA1OyBpKyspIHtcbiAgICAgICAgICBjb25zdCB0ID0gdG1wLnJlcGxhY2UoLzwoLiopLFxccysoLiopPi8sICcmbHQ7JDF8Y29tbWF8JDImZ3Q7Jyk7XG4gICAgICAgICAgdG1wID0gdDtcbiAgICAgICAgfVxuXG4gICAgICAgIF8uZWFjaChtZW1iZXIuYXJncywgYXJnID0+IHtcbiAgICAgICAgICBpZiAodG1wLmluZGV4T2YoJywnKSAhPT0gLTEpIHtcbiAgICAgICAgICAgIHRtcCA9IHRtcC5yZXBsYWNlKCcsJywgJyAnICsgYXJnICsgJz0nKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdG1wID0gdG1wLnJlcGxhY2UoJyknLCAnICcgKyBhcmcgKyAnKScpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIHRtcCA9IHRtcC5yZXBsYWNlKC89L2csICcsJyk7XG5cbiAgICAgICAgLy8gTk9URTogcXVpY2sgaGFjayBmb3IgZ2VuZXJpY3Mgc3VwcG9ydFxuICAgICAgICB0bXAgPSB0bXAucmVwbGFjZSgvJmx0Oy9nLCAnPCcpO1xuICAgICAgICB0bXAgPSB0bXAucmVwbGFjZSgvJmd0Oy9nLCAnPicpO1xuICAgICAgICB0bXAgPSB0bXAucmVwbGFjZSgvXFx8Y29tbWFcXHwvZywgJywnKTtcblxuICAgICAgICBtZW1iZXIucHJvdG90eXBlID0gdG1wO1xuICAgICAgICBkZXNjLm1lbWJlcnMucHVzaCh0bXApO1xuICAgICAgfSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIGRlc2M7XG4gIH1cblxuICBqYXZhQmluRGlyKCkge1xuICAgIGNvbnN0IGJhc2VEaXIgPSB0aGlzLmphdmFIb21lIHx8IHByb2Nlc3MuZW52LkpBVkFfSE9NRTtcbiAgICBpZiAoYmFzZURpcikge1xuICAgICAgcmV0dXJuIGJhc2VEaXIucmVwbGFjZSgvW1xcL1xcXFxdJC8sICcnKSArICcvYmluLyc7XG4gICAgfVxuICAgIHJldHVybiAnJztcbiAgfVxuXG59XG4iXX0=