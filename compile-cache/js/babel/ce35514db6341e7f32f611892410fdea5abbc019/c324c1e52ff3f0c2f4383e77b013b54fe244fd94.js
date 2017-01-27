Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var _child_process = require('child_process');

'use babel';

var fs = require('fs');

var IOUtil = (function () {
  function IOUtil() {
    _classCallCheck(this, IOUtil);
  }

  _createClass(IOUtil, [{
    key: 'readDir',
    value: function readDir(path) {
      return new Promise(function (resolve) {
        fs.readdir(path, function (err, names) {
          if (err) {
            // TODO reject promise on error and notify user about error afterwards
            atom.notifications.addError('autocomplete-java:\n' + err, { dismissable: true });
            resolve([]);
          } else {
            resolve(names);
          }
        });
      });
    }
  }, {
    key: 'readFile',
    value: function readFile(path, noErrorMessage) {
      return new Promise(function (resolve) {
        fs.readFile(path, 'utf8', function (err, data) {
          if (err) {
            // TODO reject promise on error and notify user about error afterwards
            if (!noErrorMessage) {
              atom.notifications.addError('autocomplete-java:\n' + err, { dismissable: true });
            }
            resolve('');
          } else {
            resolve(data);
          }
        });
      });
    }

    // TODO avoid large maxBuffer by using spawn instead
  }, {
    key: 'exec',
    value: function exec(command, ignoreError, noErrorMessage) {
      return new Promise(function (resolve) {
        (0, _child_process.exec)(command, { maxBuffer: 2000 * 1024 }, function (err, stdout) {
          if (err && !ignoreError) {
            // TODO reject promise on error and notify user about error afterwards
            if (!noErrorMessage) {
              atom.notifications.addError('autocomplete-java:\n' + err, { dismissable: true });
            } else {
              console.warn('autocomplete-java: ' + err + '\n' + command);
            }
            resolve('');
          } else {
            resolve(stdout);
          }
        });
      });
    }
  }]);

  return IOUtil;
})();

exports['default'] = new IOUtil();
module.exports = exports['default'];
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9ob21lL2pha2UvLmF0b20vcGFja2FnZXMvYXV0b2NvbXBsZXRlLWphdmEvbGliL2lvVXRpbC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs2QkFFcUIsZUFBZTs7QUFGcEMsV0FBVyxDQUFDOztBQUdaLElBQU0sRUFBRSxHQUFHLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQzs7SUFFbkIsTUFBTTtXQUFOLE1BQU07MEJBQU4sTUFBTTs7O2VBQU4sTUFBTTs7V0FFSCxpQkFBQyxJQUFJLEVBQUU7QUFDWixhQUFPLElBQUksT0FBTyxDQUFDLFVBQUMsT0FBTyxFQUFLO0FBQzlCLFVBQUUsQ0FBQyxPQUFPLENBQUMsSUFBSSxFQUFFLFVBQUMsR0FBRyxFQUFFLEtBQUssRUFBSztBQUMvQixjQUFJLEdBQUcsRUFBRTs7QUFFUCxnQkFBSSxDQUFDLGFBQWEsQ0FBQyxRQUFRLENBQUMsc0JBQXNCLEdBQUcsR0FBRyxFQUN0RCxFQUFFLFdBQVcsRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDO0FBQ3pCLG1CQUFPLENBQUMsRUFBRSxDQUFDLENBQUM7V0FDYixNQUFNO0FBQ0wsbUJBQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQztXQUNoQjtTQUNGLENBQUMsQ0FBQztPQUNKLENBQUMsQ0FBQztLQUNKOzs7V0FFTyxrQkFBQyxJQUFJLEVBQUUsY0FBYyxFQUFFO0FBQzdCLGFBQU8sSUFBSSxPQUFPLENBQUMsVUFBQyxPQUFPLEVBQUs7QUFDOUIsVUFBRSxDQUFDLFFBQVEsQ0FBQyxJQUFJLEVBQUUsTUFBTSxFQUFFLFVBQUMsR0FBRyxFQUFFLElBQUksRUFBSztBQUN2QyxjQUFJLEdBQUcsRUFBRTs7QUFFUCxnQkFBSSxDQUFDLGNBQWMsRUFBRTtBQUNuQixrQkFBSSxDQUFDLGFBQWEsQ0FBQyxRQUFRLENBQUMsc0JBQXNCLEdBQUcsR0FBRyxFQUN0RCxFQUFFLFdBQVcsRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDO2FBQzFCO0FBQ0QsbUJBQU8sQ0FBQyxFQUFFLENBQUMsQ0FBQztXQUNiLE1BQU07QUFDTCxtQkFBTyxDQUFDLElBQUksQ0FBQyxDQUFDO1dBQ2Y7U0FDRixDQUFDLENBQUM7T0FDSixDQUFDLENBQUM7S0FDSjs7Ozs7V0FHRyxjQUFDLE9BQU8sRUFBRSxXQUFXLEVBQUUsY0FBYyxFQUFFO0FBQ3pDLGFBQU8sSUFBSSxPQUFPLENBQUMsVUFBQyxPQUFPLEVBQUs7QUFDOUIsaUNBQUssT0FBTyxFQUFFLEVBQUUsU0FBUyxFQUFFLElBQUksR0FBRyxJQUFJLEVBQUUsRUFBRSxVQUFDLEdBQUcsRUFBRSxNQUFNLEVBQUs7QUFDekQsY0FBSSxHQUFHLElBQUksQ0FBQyxXQUFXLEVBQUU7O0FBRXZCLGdCQUFJLENBQUMsY0FBYyxFQUFFO0FBQ25CLGtCQUFJLENBQUMsYUFBYSxDQUFDLFFBQVEsQ0FBQyxzQkFBc0IsR0FBRyxHQUFHLEVBQ3RELEVBQUUsV0FBVyxFQUFFLElBQUksRUFBRSxDQUFDLENBQUM7YUFDMUIsTUFBTTtBQUNMLHFCQUFPLENBQUMsSUFBSSxDQUFDLHFCQUFxQixHQUFHLEdBQUcsR0FBRyxJQUFJLEdBQUcsT0FBTyxDQUFDLENBQUM7YUFDNUQ7QUFDRCxtQkFBTyxDQUFDLEVBQUUsQ0FBQyxDQUFDO1dBQ2IsTUFBTTtBQUNMLG1CQUFPLENBQUMsTUFBTSxDQUFDLENBQUM7V0FDakI7U0FDRixDQUFDLENBQUM7T0FDSixDQUFDLENBQUM7S0FDSjs7O1NBcERHLE1BQU07OztxQkF3REcsSUFBSSxNQUFNLEVBQUUiLCJmaWxlIjoiL2hvbWUvamFrZS8uYXRvbS9wYWNrYWdlcy9hdXRvY29tcGxldGUtamF2YS9saWIvaW9VdGlsLmpzIiwic291cmNlc0NvbnRlbnQiOlsiJ3VzZSBiYWJlbCc7XG5cbmltcG9ydCB7IGV4ZWMgfSBmcm9tICdjaGlsZF9wcm9jZXNzJztcbmNvbnN0IGZzID0gcmVxdWlyZSgnZnMnKTtcblxuY2xhc3MgSU9VdGlsIHtcblxuICByZWFkRGlyKHBhdGgpIHtcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHtcbiAgICAgIGZzLnJlYWRkaXIocGF0aCwgKGVyciwgbmFtZXMpID0+IHtcbiAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgIC8vIFRPRE8gcmVqZWN0IHByb21pc2Ugb24gZXJyb3IgYW5kIG5vdGlmeSB1c2VyIGFib3V0IGVycm9yIGFmdGVyd2FyZHNcbiAgICAgICAgICBhdG9tLm5vdGlmaWNhdGlvbnMuYWRkRXJyb3IoJ2F1dG9jb21wbGV0ZS1qYXZhOlxcbicgKyBlcnIsXG4gICAgICAgICAgICB7IGRpc21pc3NhYmxlOiB0cnVlIH0pO1xuICAgICAgICAgIHJlc29sdmUoW10pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJlc29sdmUobmFtZXMpO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuXG4gIHJlYWRGaWxlKHBhdGgsIG5vRXJyb3JNZXNzYWdlKSB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiB7XG4gICAgICBmcy5yZWFkRmlsZShwYXRoLCAndXRmOCcsIChlcnIsIGRhdGEpID0+IHtcbiAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgIC8vIFRPRE8gcmVqZWN0IHByb21pc2Ugb24gZXJyb3IgYW5kIG5vdGlmeSB1c2VyIGFib3V0IGVycm9yIGFmdGVyd2FyZHNcbiAgICAgICAgICBpZiAoIW5vRXJyb3JNZXNzYWdlKSB7XG4gICAgICAgICAgICBhdG9tLm5vdGlmaWNhdGlvbnMuYWRkRXJyb3IoJ2F1dG9jb21wbGV0ZS1qYXZhOlxcbicgKyBlcnIsXG4gICAgICAgICAgICAgIHsgZGlzbWlzc2FibGU6IHRydWUgfSk7XG4gICAgICAgICAgfVxuICAgICAgICAgIHJlc29sdmUoJycpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJlc29sdmUoZGF0YSk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG5cbiAgLy8gVE9ETyBhdm9pZCBsYXJnZSBtYXhCdWZmZXIgYnkgdXNpbmcgc3Bhd24gaW5zdGVhZFxuICBleGVjKGNvbW1hbmQsIGlnbm9yZUVycm9yLCBub0Vycm9yTWVzc2FnZSkge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4ge1xuICAgICAgZXhlYyhjb21tYW5kLCB7IG1heEJ1ZmZlcjogMjAwMCAqIDEwMjQgfSwgKGVyciwgc3Rkb3V0KSA9PiB7XG4gICAgICAgIGlmIChlcnIgJiYgIWlnbm9yZUVycm9yKSB7XG4gICAgICAgICAgLy8gVE9ETyByZWplY3QgcHJvbWlzZSBvbiBlcnJvciBhbmQgbm90aWZ5IHVzZXIgYWJvdXQgZXJyb3IgYWZ0ZXJ3YXJkc1xuICAgICAgICAgIGlmICghbm9FcnJvck1lc3NhZ2UpIHtcbiAgICAgICAgICAgIGF0b20ubm90aWZpY2F0aW9ucy5hZGRFcnJvcignYXV0b2NvbXBsZXRlLWphdmE6XFxuJyArIGVycixcbiAgICAgICAgICAgICAgeyBkaXNtaXNzYWJsZTogdHJ1ZSB9KTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY29uc29sZS53YXJuKCdhdXRvY29tcGxldGUtamF2YTogJyArIGVyciArICdcXG4nICsgY29tbWFuZCk7XG4gICAgICAgICAgfVxuICAgICAgICAgIHJlc29sdmUoJycpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJlc29sdmUoc3Rkb3V0KTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cblxufVxuXG5leHBvcnQgZGVmYXVsdCBuZXcgSU9VdGlsKCk7XG4iXX0=