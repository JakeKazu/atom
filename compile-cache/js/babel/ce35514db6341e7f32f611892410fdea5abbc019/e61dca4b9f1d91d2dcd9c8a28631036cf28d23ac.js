Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var _lodash = require('lodash');

var _Dictionary = require('./Dictionary');

var _JavaClassReader = require('./JavaClassReader');

var _ioUtil = require('./ioUtil');

var _ioUtil2 = _interopRequireDefault(_ioUtil);

var _javaUtil = require('./javaUtil');

var _javaUtil2 = _interopRequireDefault(_javaUtil);

'use babel';

var JavaClassLoader = (function () {
  function JavaClassLoader(javaHome) {
    _classCallCheck(this, JavaClassLoader);

    this.javaHome = javaHome;
    this.dict = new _Dictionary.Dictionary();
  }

  _createClass(JavaClassLoader, [{
    key: 'setJavaHome',
    value: function setJavaHome(javaHome) {
      this.javaHome = javaHome;
    }
  }, {
    key: 'findClass',
    value: function findClass(namePrefix) {
      return this.dict.find('class', namePrefix);
    }
  }, {
    key: 'findSuperClassName',
    value: function findSuperClassName(className) {
      var classes = this.findClass(className);
      var clazz = _lodash._.find(classes, function (c) {
        return c.className === className;
      });
      return clazz ? clazz.extend : null;
    }
  }, {
    key: 'findClassMember',
    value: function findClassMember(className, namePrefix) {
      return this.dict.find(className, namePrefix);
    }
  }, {
    key: 'touchClass',
    value: function touchClass(className) {
      var classDescs = this.findClass(className);
      if (classDescs.length) {
        this.touch(classDescs[0]);
      }
    }
  }, {
    key: 'touch',
    value: function touch(classDesc) {
      this.dict.touch(classDesc);
    }
  }, {
    key: 'loadClass',
    value: function loadClass(className, classpath, loadClassMembers) {
      var _this = this;

      console.log('autocomplete-java load class: ' + className);
      var classReader = new _JavaClassReader.JavaClassReader(loadClassMembers, true, this.javaHome);
      return classReader.readClassesByName(classpath, [className], true, function (cp, classDesc) {
        return _this._addClass(classDesc, Date.now());
      });
    }
  }, {
    key: 'loadClasses',
    value: function loadClasses(classpath, loadClassMembers, fullRefresh) {
      var _this2 = this;

      var promise = null;
      if (fullRefresh && this.fullRefreshOngoing) {
        // TODO reject promise on warning and notify about warning afterwards
        atom.notifications.addWarning('autocomplete-java:\n ' + 'Full refresh already in progress. Execute normal refresh or ' + 'try full refresh again later.', { dismissable: true });
        promise = Promise.resolve();
      } else {
        console.log('autocomplete-java load start, full refresh: ' + fullRefresh);
        if (fullRefresh) {
          this.fullRefreshOngoing = true;
          this.dict = new _Dictionary.Dictionary();
        }

        // First load basic class descriptions
        promise = this._loadClassesImpl(classpath, false, fullRefresh).then(function () {
          // Then, optionally, load also class members
          if (loadClassMembers) {
            return _this2._loadClassesImpl(classpath, true, fullRefresh);
          }
        }).then(function () {
          // Loading finished
          if (fullRefresh) {
            _this2.fullRefreshOngoing = false;
          }
          console.log('autocomplete-java load end, full refresh: ' + fullRefresh);
        });
      }
      return promise;
    }
  }, {
    key: '_loadClassesImpl',
    value: function _loadClassesImpl(classpath, loadClassMembers, fullRefresh) {
      var _this3 = this;

      var classReader = new _JavaClassReader.JavaClassReader(loadClassMembers, true, this.javaHome);

      // First load project classes
      console.log('autocomplete-java loading project classes. loadMembers: ' + loadClassMembers);
      return classReader.readAllClassesFromClasspath(classpath, !fullRefresh, function (cp, className, classMembers) {
        // Add class
        // 0 / 2 = class files have a priority over jars among suggestions
        return _this3._addClass(className, classMembers, cp.indexOf('.jar') !== -1 ? 0 : 2);
      }).then(function () {
        // Then load system libs
        return fullRefresh ? _this3._loadSystemLibsImpl(classReader) : Promise.resolve();
      });
    }
  }, {
    key: '_loadSystemLibsImpl',
    value: function _loadSystemLibsImpl(classReader) {
      var _this4 = this;

      // Read java system info
      return _ioUtil2['default'].exec('"' + classReader.javaBinDir() + 'java" -verbose', true).then(function (javaSystemInfo) {
        // Load system classes from rt.jar
        var promise = null;
        console.log('autocomplete-java loading system classes.');
        var rtJarPath = (javaSystemInfo.match(/Opened (.*jar)/) || [])[1];
        if (rtJarPath) {
          promise = classReader.readAllClassesFromJar(rtJarPath, function (cp, className, classMembers) {
            return _this4._addClass(className, classMembers, 1);
          });
        } else {
          // TODO reject promise on error and notify about error afterwards
          atom.notifications.addError('autocomplete-java:\njava rt.jar not found', { dismissable: true });
          promise = Promise.resolve();
        }
        return promise;
      });
    }
  }, {
    key: '_addClass',
    value: function _addClass(desc, lastUsed) {
      var _this5 = this;

      var simpleName = _javaUtil2['default'].getSimpleName(desc.className);
      var inverseName = _javaUtil2['default'].getInverseName(desc.className);
      var classDesc = {
        type: 'class',
        name: simpleName,
        simpleName: simpleName,
        className: desc.className,
        extend: desc.extend,
        packageName: _javaUtil2['default'].getPackageName(desc.className),
        lastUsed: lastUsed || 0,
        constructors: [],
        members: []
      };
      this.dict.remove('class', desc.className);
      this.dict.remove('class', inverseName);
      this.dict.add('class', desc.className, classDesc);
      this.dict.add('class', inverseName, classDesc);
      if (desc.members) {
        this.dict.removeCategory(desc.className);
        _lodash._.each(desc.members, function (prototype) {
          _this5._addClassMember(classDesc, prototype, lastUsed);
        });
      }
      return Promise.resolve();
    }
  }, {
    key: '_addClassMember',
    value: function _addClassMember(classDesc, member, lastUsed) {
      try {
        var simpleName = _javaUtil2['default'].getSimpleName(classDesc.className);
        var prototype = member.replace(/\).*/, ');').replace(/,\s/g, ',').trim();
        if (prototype.indexOf('{') !== -1) {
          // console.log('?? ' + prototype);
        } else {
            var type = null;
            if (prototype.indexOf(classDesc.className + '(') !== -1) {
              type = 'constructor';
            } else if (prototype.indexOf('(') !== -1) {
              type = 'method';
            } else {
              type = 'property';
            }

            var _name = type !== 'constructor' ? prototype.match(/\s([^\(\s]*)[\(;]/)[1] : classDesc.simpleName;
            var paramStr = type !== 'property' ? prototype.match(/\((.*)\)/)[1] : null;
            var key = _name + (type !== 'property' ? '(' + paramStr + ')' : '');

            var memberDesc = {
              type: type,
              name: _name,
              simpleName: simpleName,
              className: classDesc.className,
              packageName: classDesc.packageName,
              lastUsed: lastUsed || 0,
              classDesc: classDesc,
              member: {
                name: _name,
                returnType: type !== 'constructor' ? _lodash._.last(prototype.replace(/\(.*\)/, '').match(/([^\s]+)\s/g)).trim() : classDesc.className,
                visibility: this._determineVisibility(prototype),
                params: paramStr ? paramStr.split(',') : null,
                prototype: prototype
              }
            };
            if (type === 'constructor') {
              classDesc.constructors.push(memberDesc);
            } else {
              // const key = (prototype.match(/\s([^\s]*\(.*\));/) ||
              //   prototype.match(/\s([^\s]*);/))[1];
              this.dict.add(classDesc.className, key, memberDesc);
              classDesc.members.push(memberDesc);
            }
          }
      } catch (err) {
        // console.warn(err);
      }
    }
  }, {
    key: '_determineVisibility',
    value: function _determineVisibility(prototype) {
      var v = prototype.split(/\s/)[0];
      return (/public|private|protected/.test(v) ? v : 'package'
      );
    }
  }]);

  return JavaClassLoader;
})();

exports.JavaClassLoader = JavaClassLoader;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9ob21lL2pha2UvLmF0b20vcGFja2FnZXMvYXV0b2NvbXBsZXRlLWphdmEvbGliL0phdmFDbGFzc0xvYWRlci5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7O3NCQUVrQixRQUFROzswQkFDQyxjQUFjOzsrQkFDVCxtQkFBbUI7O3NCQUNoQyxVQUFVOzs7O3dCQUNSLFlBQVk7Ozs7QUFOakMsV0FBVyxDQUFDOztJQVFDLGVBQWU7QUFFZixXQUZBLGVBQWUsQ0FFZCxRQUFRLEVBQUU7MEJBRlgsZUFBZTs7QUFHeEIsUUFBSSxDQUFDLFFBQVEsR0FBRyxRQUFRLENBQUM7QUFDekIsUUFBSSxDQUFDLElBQUksR0FBRyw0QkFBZ0IsQ0FBQztHQUM5Qjs7ZUFMVSxlQUFlOztXQU9mLHFCQUFDLFFBQVEsRUFBRTtBQUNwQixVQUFJLENBQUMsUUFBUSxHQUFHLFFBQVEsQ0FBQztLQUMxQjs7O1dBRVEsbUJBQUMsVUFBVSxFQUFFO0FBQ3BCLGFBQU8sSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsT0FBTyxFQUFFLFVBQVUsQ0FBQyxDQUFDO0tBQzVDOzs7V0FFaUIsNEJBQUMsU0FBUyxFQUFFO0FBQzVCLFVBQU0sT0FBTyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsU0FBUyxDQUFDLENBQUM7QUFDMUMsVUFBTSxLQUFLLEdBQUcsVUFBRSxJQUFJLENBQUMsT0FBTyxFQUFFLFVBQUEsQ0FBQyxFQUFJO0FBQ2pDLGVBQU8sQ0FBQyxDQUFDLFNBQVMsS0FBSyxTQUFTLENBQUM7T0FDbEMsQ0FBQyxDQUFDO0FBQ0gsYUFBTyxLQUFLLEdBQUcsS0FBSyxDQUFDLE1BQU0sR0FBRyxJQUFJLENBQUM7S0FDcEM7OztXQUVjLHlCQUFDLFNBQVMsRUFBRSxVQUFVLEVBQUU7QUFDckMsYUFBTyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxTQUFTLEVBQUUsVUFBVSxDQUFDLENBQUM7S0FDOUM7OztXQUVTLG9CQUFDLFNBQVMsRUFBRTtBQUNw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QUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUNuQyxhQUFPLDJCQUEwQixDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLEdBQUcsU0FBUztRQUFDO0tBQzNEOzs7U0FsTlUsZUFBZSIsImZpbGUiOiIvaG9tZS9qYWtlLy5hdG9tL3BhY2thZ2VzL2F1dG9jb21wbGV0ZS1qYXZhL2xpYi9KYXZhQ2xhc3NMb2FkZXIuanMiLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIGJhYmVsJztcblxuaW1wb3J0IHsgXyB9IGZyb20gJ2xvZGFzaCc7XG5pbXBvcnQgeyBEaWN0aW9uYXJ5IH0gZnJvbSAnLi9EaWN0aW9uYXJ5JztcbmltcG9ydCB7IEphdmFDbGFzc1JlYWRlciB9IGZyb20gJy4vSmF2YUNsYXNzUmVhZGVyJztcbmltcG9ydCBpb1V0aWwgZnJvbSAnLi9pb1V0aWwnO1xuaW1wb3J0IGphdmFVdGlsIGZyb20gJy4vamF2YVV0aWwnO1xuXG5leHBvcnQgY2xhc3MgSmF2YUNsYXNzTG9hZGVyIHtcblxuICBjb25zdHJ1Y3RvcihqYXZhSG9tZSkge1xuICAgIHRoaXMuamF2YUhvbWUgPSBqYXZhSG9tZTtcbiAgICB0aGlzLmRpY3QgPSBuZXcgRGljdGlvbmFyeSgpO1xuICB9XG5cbiAgc2V0SmF2YUhvbWUoamF2YUhvbWUpIHtcbiAgICB0aGlzLmphdmFIb21lID0gamF2YUhvbWU7XG4gIH1cblxuICBmaW5kQ2xhc3MobmFtZVByZWZpeCkge1xuICAgIHJldHVybiB0aGlzLmRpY3QuZmluZCgnY2xhc3MnLCBuYW1lUHJlZml4KTtcbiAgfVxuXG4gIGZpbmRTdXBlckNsYXNzTmFtZShjbGFzc05hbWUpIHtcbiAgICBjb25zdCBjbGFzc2VzID0gdGhpcy5maW5kQ2xhc3MoY2xhc3NOYW1lKTtcbiAgICBjb25zdCBjbGF6eiA9IF8uZmluZChjbGFzc2VzLCBjID0+IHtcbiAgICAgIHJldHVybiBjLmNsYXNzTmFtZSA9PT0gY2xhc3NOYW1lO1xuICAgIH0pO1xuICAgIHJldHVybiBjbGF6eiA/IGNsYXp6LmV4dGVuZCA6IG51bGw7XG4gIH1cblxuICBmaW5kQ2xhc3NNZW1iZXIoY2xhc3NOYW1lLCBuYW1lUHJlZml4KSB7XG4gICAgcmV0dXJuIHRoaXMuZGljdC5maW5kKGNsYXNzTmFtZSwgbmFtZVByZWZpeCk7XG4gIH1cblxuICB0b3VjaENsYXNzKGNsYXNzTmFtZSkge1xuICAgIGNvbnN0IGNsYXNzRGVzY3MgPSB0aGlzLmZpbmRDbGFzcyhjbGFzc05hbWUpO1xuICAgIGlmIChjbGFzc0Rlc2NzLmxlbmd0aCkge1xuICAgICAgdGhpcy50b3VjaChjbGFzc0Rlc2NzWzBdKTtcbiAgICB9XG4gIH1cblxuICB0b3VjaChjbGFzc0Rlc2MpIHtcbiAgICB0aGlzLmRpY3QudG91Y2goY2xhc3NEZXNjKTtcbiAgfVxuXG4gIGxvYWRDbGFzcyhjbGFzc05hbWUsIGNsYXNzcGF0aCwgbG9hZENsYXNzTWVtYmVycykge1xuICAgIGNvbnNvbGUubG9nKCdhdXRvY29tcGxldGUtamF2YSBsb2FkIGNsYXNzOiAnICsgY2xhc3NOYW1lKTtcbiAgICBjb25zdCBjbGFzc1JlYWRlciA9IG5ldyBKYXZhQ2xhc3NSZWFkZXIobG9hZENsYXNzTWVtYmVycywgdHJ1ZSxcbiAgICAgIHRoaXMuamF2YUhvbWUpO1xuICAgIHJldHVybiBjbGFzc1JlYWRlci5yZWFkQ2xhc3Nlc0J5TmFtZShjbGFzc3BhdGgsIFsgY2xhc3NOYW1lIF0sIHRydWUsXG4gICAgKGNwLCBjbGFzc0Rlc2MpID0+IHtcbiAgICAgIHJldHVybiB0aGlzLl9hZGRDbGFzcyhjbGFzc0Rlc2MsIERhdGUubm93KCkpO1xuICAgIH0pO1xuICB9XG5cbiAgbG9hZENsYXNzZXMoY2xhc3NwYXRoLCBsb2FkQ2xhc3NNZW1iZXJzLCBmdWxsUmVmcmVzaCkge1xuICAgIGxldCBwcm9taXNlID0gbnVsbDtcbiAgICBpZiAoZnVsbFJlZnJlc2ggJiYgdGhpcy5mdWxsUmVmcmVzaE9uZ29pbmcpIHtcbiAgICAgIC8vIFRPRE8gcmVqZWN0IHByb21pc2Ugb24gd2FybmluZyBhbmQgbm90aWZ5IGFib3V0IHdhcm5pbmcgYWZ0ZXJ3YXJkc1xuICAgICAgYXRvbS5ub3RpZmljYXRpb25zLmFkZFdhcm5pbmcoJ2F1dG9jb21wbGV0ZS1qYXZhOlxcbiAnICtcbiAgICAgICAgJ0Z1bGwgcmVmcmVzaCBhbHJlYWR5IGluIHByb2dyZXNzLiBFeGVjdXRlIG5vcm1hbCByZWZyZXNoIG9yICcgK1xuICAgICAgICAndHJ5IGZ1bGwgcmVmcmVzaCBhZ2FpbiBsYXRlci4nLCB7IGRpc21pc3NhYmxlOiB0cnVlIH0pO1xuICAgICAgcHJvbWlzZSA9IFByb21pc2UucmVzb2x2ZSgpO1xuICAgIH0gZWxzZSB7XG4gICAgICBjb25zb2xlLmxvZygnYXV0b2NvbXBsZXRlLWphdmEgbG9hZCBzdGFydCwgZnVsbCByZWZyZXNoOiAnICsgZnVsbFJlZnJlc2gpO1xuICAgICAgaWYgKGZ1bGxSZWZyZXNoKSB7XG4gICAgICAgIHRoaXMuZnVsbFJlZnJlc2hPbmdvaW5nID0gdHJ1ZTtcbiAgICAgICAgdGhpcy5kaWN0ID0gbmV3IERpY3Rpb25hcnkoKTtcbiAgICAgIH1cblxuICAgICAgLy8gRmlyc3QgbG9hZCBiYXNpYyBjbGFzcyBkZXNjcmlwdGlvbnNcbiAgICAgIHByb21pc2UgPSB0aGlzLl9sb2FkQ2xhc3Nlc0ltcGwoY2xhc3NwYXRoLCBmYWxzZSwgZnVsbFJlZnJlc2gpXG4gICAgICAudGhlbigoKSA9PiB7XG4gICAgICAgIC8vIFRoZW4sIG9wdGlvbmFsbHksIGxvYWQgYWxzbyBjbGFzcyBtZW1iZXJzXG4gICAgICAgIGlmIChsb2FkQ2xhc3NNZW1iZXJzKSB7XG4gICAgICAgICAgcmV0dXJuIHRoaXMuX2xvYWRDbGFzc2VzSW1wbChjbGFzc3BhdGgsIHRydWUsIGZ1bGxSZWZyZXNoKTtcbiAgICAgICAgfVxuICAgICAgfSkudGhlbigoKSA9PiB7XG4gICAgICAgIC8vIExvYWRpbmcgZmluaXNoZWRcbiAgICAgICAgaWYgKGZ1bGxSZWZyZXNoKSB7XG4gICAgICAgICAgdGhpcy5mdWxsUmVmcmVzaE9uZ29pbmcgPSBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgICBjb25zb2xlLmxvZygnYXV0b2NvbXBsZXRlLWphdmEgbG9hZCBlbmQsIGZ1bGwgcmVmcmVzaDogJyArIGZ1bGxSZWZyZXNoKTtcbiAgICAgIH0pO1xuICAgIH1cbiAgICByZXR1cm4gcHJvbWlzZTtcbiAgfVxuXG4gIF9sb2FkQ2xhc3Nlc0ltcGwoY2xhc3NwYXRoLCBsb2FkQ2xhc3NNZW1iZXJzLCBmdWxsUmVmcmVzaCkge1xuICAgIGNvbnN0IGNsYXNzUmVhZGVyID0gbmV3IEphdmFDbGFzc1JlYWRlcihsb2FkQ2xhc3NNZW1iZXJzLCB0cnVlLFxuICAgICAgdGhpcy5qYXZhSG9tZSk7XG5cbiAgICAvLyBGaXJzdCBsb2FkIHByb2plY3QgY2xhc3Nlc1xuICAgIGNvbnNvbGUubG9nKCdhdXRvY29tcGxldGUtamF2YSBsb2FkaW5nIHByb2plY3QgY2xhc3Nlcy4gbG9hZE1lbWJlcnM6ICcgK1xuICAgICAgbG9hZENsYXNzTWVtYmVycyk7XG4gICAgcmV0dXJuIGNsYXNzUmVhZGVyLnJlYWRBbGxDbGFzc2VzRnJvbUNsYXNzcGF0aChjbGFzc3BhdGgsICFmdWxsUmVmcmVzaCxcbiAgICAoY3AsIGNsYXNzTmFtZSwgY2xhc3NNZW1iZXJzKSA9PiB7XG4gICAgICAvLyBBZGQgY2xhc3NcbiAgICAgIC8vIDAgLyAyID0gY2xhc3MgZmlsZXMgaGF2ZSBhIHByaW9yaXR5IG92ZXIgamFycyBhbW9uZyBzdWdnZXN0aW9uc1xuICAgICAgcmV0dXJuIHRoaXMuX2FkZENsYXNzKGNsYXNzTmFtZSwgY2xhc3NNZW1iZXJzLFxuICAgICAgICBjcC5pbmRleE9mKCcuamFyJykgIT09IC0xID8gMCA6IDIpO1xuICAgIH0pLnRoZW4oKCkgPT4ge1xuICAgICAgLy8gVGhlbiBsb2FkIHN5c3RlbSBsaWJzXG4gICAgICByZXR1cm4gZnVsbFJlZnJlc2ggPyB0aGlzLl9sb2FkU3lzdGVtTGlic0ltcGwoY2xhc3NSZWFkZXIpIDpcbiAgICAgICAgUHJvbWlzZS5yZXNvbHZlKCk7XG4gICAgfSk7XG4gIH1cblxuICBfbG9hZFN5c3RlbUxpYnNJbXBsKGNsYXNzUmVhZGVyKSB7XG4gICAgLy8gUmVhZCBqYXZhIHN5c3RlbSBpbmZvXG4gICAgcmV0dXJuIGlvVXRpbC5leGVjKCdcIicgKyBjbGFzc1JlYWRlci5qYXZhQmluRGlyKCkgKyAnamF2YVwiIC12ZXJib3NlJywgdHJ1ZSlcbiAgICAudGhlbigoamF2YVN5c3RlbUluZm8pID0+IHtcbiAgICAgIC8vIExvYWQgc3lzdGVtIGNsYXNzZXMgZnJvbSBydC5qYXJcbiAgICAgIGxldCBwcm9taXNlID0gbnVsbDtcbiAgICAgIGNvbnNvbGUubG9nKCdhdXRvY29tcGxldGUtamF2YSBsb2FkaW5nIHN5c3RlbSBjbGFzc2VzLicpO1xuICAgICAgY29uc3QgcnRKYXJQYXRoID0gKGphdmFTeXN0ZW1JbmZvLm1hdGNoKC9PcGVuZWQgKC4qamFyKS8pIHx8IFtdKVsxXTtcbiAgICAgIGlmIChydEphclBhdGgpIHtcbiAgICAgICAgcHJvbWlzZSA9IGNsYXNzUmVhZGVyLnJlYWRBbGxDbGFzc2VzRnJvbUphcihydEphclBhdGgsXG4gICAgICAgIChjcCwgY2xhc3NOYW1lLCBjbGFzc01lbWJlcnMpID0+IHtcbiAgICAgICAgICByZXR1cm4gdGhpcy5fYWRkQ2xhc3MoY2xhc3NOYW1lLCBjbGFzc01lbWJlcnMsIDEpO1xuICAgICAgICB9KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIFRPRE8gcmVqZWN0IHByb21pc2Ugb24gZXJyb3IgYW5kIG5vdGlmeSBhYm91dCBlcnJvciBhZnRlcndhcmRzXG4gICAgICAgIGF0b20ubm90aWZpY2F0aW9ucy5hZGRFcnJvcignYXV0b2NvbXBsZXRlLWphdmE6XFxuamF2YSBydC5qYXIgbm90IGZvdW5kJyxcbiAgICAgICAgICB7IGRpc21pc3NhYmxlOiB0cnVlIH0pO1xuICAgICAgICBwcm9taXNlID0gUHJvbWlzZS5yZXNvbHZlKCk7XG4gICAgICB9XG4gICAgICByZXR1cm4gcHJvbWlzZTtcbiAgICB9KTtcbiAgfVxuXG4gIF9hZGRDbGFzcyhkZXNjLCBsYXN0VXNlZCkge1xuICAgIGNvbnN0IHNpbXBsZU5hbWUgPSBqYXZhVXRpbC5nZXRTaW1wbGVOYW1lKGRlc2MuY2xhc3NOYW1lKTtcbiAgICBjb25zdCBpbnZlcnNlTmFtZSA9IGphdmFVdGlsLmdldEludmVyc2VOYW1lKGRlc2MuY2xhc3NOYW1lKTtcbiAgICBjb25zdCBjbGFzc0Rlc2MgPSB7XG4gICAgICB0eXBlOiAnY2xhc3MnLFxuICAgICAgbmFtZTogc2ltcGxlTmFtZSxcbiAgICAgIHNpbXBsZU5hbWU6IHNpbXBsZU5hbWUsXG4gICAgICBjbGFzc05hbWU6IGRlc2MuY2xhc3NOYW1lLFxuICAgICAgZXh0ZW5kOiBkZXNjLmV4dGVuZCxcbiAgICAgIHBhY2thZ2VOYW1lOiBqYXZhVXRpbC5nZXRQYWNrYWdlTmFtZShkZXNjLmNsYXNzTmFtZSksXG4gICAgICBsYXN0VXNlZDogbGFzdFVzZWQgfHwgMCxcbiAgICAgIGNvbnN0cnVjdG9yczogW10sXG4gICAgICBtZW1iZXJzOiBbXSxcbiAgICB9O1xuICAgIHRoaXMuZGljdC5yZW1vdmUoJ2NsYXNzJywgZGVzYy5jbGFzc05hbWUpO1xuICAgIHRoaXMuZGljdC5yZW1vdmUoJ2NsYXNzJywgaW52ZXJzZU5hbWUpO1xuICAgIHRoaXMuZGljdC5hZGQoJ2NsYXNzJywgZGVzYy5jbGFzc05hbWUsIGNsYXNzRGVzYyk7XG4gICAgdGhpcy5kaWN0LmFkZCgnY2xhc3MnLCBpbnZlcnNlTmFtZSwgY2xhc3NEZXNjKTtcbiAgICBpZiAoZGVzYy5tZW1iZXJzKSB7XG4gICAgICB0aGlzLmRpY3QucmVtb3ZlQ2F0ZWdvcnkoZGVzYy5jbGFzc05hbWUpO1xuICAgICAgXy5lYWNoKGRlc2MubWVtYmVycywgcHJvdG90eXBlID0+IHtcbiAgICAgICAgdGhpcy5fYWRkQ2xhc3NNZW1iZXIoY2xhc3NEZXNjLCBwcm90b3R5cGUsIGxhc3RVc2VkKTtcbiAgICAgIH0pO1xuICAgIH1cbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XG4gIH1cblxuICBfYWRkQ2xhc3NNZW1iZXIoY2xhc3NEZXNjLCBtZW1iZXIsIGxhc3RVc2VkKSB7XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IHNpbXBsZU5hbWUgPSBqYXZhVXRpbC5nZXRTaW1wbGVOYW1lKGNsYXNzRGVzYy5jbGFzc05hbWUpO1xuICAgICAgY29uc3QgcHJvdG90eXBlID0gbWVtYmVyLnJlcGxhY2UoL1xcKS4qLywgJyk7JylcbiAgICAgICAgLnJlcGxhY2UoLyxcXHMvZywgJywnKS50cmltKCk7XG4gICAgICBpZiAocHJvdG90eXBlLmluZGV4T2YoJ3snKSAhPT0gLTEpIHtcbiAgICAgICAgLy8gY29uc29sZS5sb2coJz8/ICcgKyBwcm90b3R5cGUpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgbGV0IHR5cGUgPSBudWxsO1xuICAgICAgICBpZiAocHJvdG90eXBlLmluZGV4T2YoY2xhc3NEZXNjLmNsYXNzTmFtZSArICcoJykgIT09IC0xKSB7XG4gICAgICAgICAgdHlwZSA9ICdjb25zdHJ1Y3Rvcic7XG4gICAgICAgIH0gZWxzZSBpZiAocHJvdG90eXBlLmluZGV4T2YoJygnKSAhPT0gLTEpIHtcbiAgICAgICAgICB0eXBlID0gJ21ldGhvZCc7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdHlwZSA9ICdwcm9wZXJ0eSc7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBuYW1lID0gdHlwZSAhPT0gJ2NvbnN0cnVjdG9yJyA/XG4gICAgICAgICAgcHJvdG90eXBlLm1hdGNoKC9cXHMoW15cXChcXHNdKilbXFwoO10vKVsxXSA6IGNsYXNzRGVzYy5zaW1wbGVOYW1lO1xuICAgICAgICBjb25zdCBwYXJhbVN0ciA9IHR5cGUgIT09ICdwcm9wZXJ0eScgP1xuICAgICAgICAgIHByb3RvdHlwZS5tYXRjaCgvXFwoKC4qKVxcKS8pWzFdIDogbnVsbDtcbiAgICAgICAgY29uc3Qga2V5ID0gbmFtZSArICh0eXBlICE9PSAncHJvcGVydHknID8gJygnICsgcGFyYW1TdHIgKyAnKScgOiAnJyk7XG5cbiAgICAgICAgY29uc3QgbWVtYmVyRGVzYyA9IHtcbiAgICAgICAgICB0eXBlOiB0eXBlLFxuICAgICAgICAgIG5hbWU6IG5hbWUsXG4gICAgICAgICAgc2ltcGxlTmFtZTogc2ltcGxlTmFtZSxcbiAgICAgICAgICBjbGFzc05hbWU6IGNsYXNzRGVzYy5jbGFzc05hbWUsXG4gICAgICAgICAgcGFja2FnZU5hbWU6IGNsYXNzRGVzYy5wYWNrYWdlTmFtZSxcbiAgICAgICAgICBsYXN0VXNlZDogbGFzdFVzZWQgfHwgMCxcbiAgICAgICAgICBjbGFzc0Rlc2M6IGNsYXNzRGVzYyxcbiAgICAgICAgICBtZW1iZXI6IHtcbiAgICAgICAgICAgIG5hbWU6IG5hbWUsXG4gICAgICAgICAgICByZXR1cm5UeXBlOiB0eXBlICE9PSAnY29uc3RydWN0b3InXG4gICAgICAgICAgICAgID8gXy5sYXN0KHByb3RvdHlwZS5yZXBsYWNlKC9cXCguKlxcKS8sICcnKVxuICAgICAgICAgICAgICAgICAgLm1hdGNoKC8oW15cXHNdKylcXHMvZykpLnRyaW0oKVxuICAgICAgICAgICAgICA6IGNsYXNzRGVzYy5jbGFzc05hbWUsXG4gICAgICAgICAgICB2aXNpYmlsaXR5OiB0aGlzLl9kZXRlcm1pbmVWaXNpYmlsaXR5KHByb3RvdHlwZSksXG4gICAgICAgICAgICBwYXJhbXM6IHBhcmFtU3RyID8gcGFyYW1TdHIuc3BsaXQoJywnKSA6IG51bGwsXG4gICAgICAgICAgICBwcm90b3R5cGU6IHByb3RvdHlwZSxcbiAgICAgICAgICB9LFxuICAgICAgICB9O1xuICAgICAgICBpZiAodHlwZSA9PT0gJ2NvbnN0cnVjdG9yJykge1xuICAgICAgICAgIGNsYXNzRGVzYy5jb25zdHJ1Y3RvcnMucHVzaChtZW1iZXJEZXNjKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAvLyBjb25zdCBrZXkgPSAocHJvdG90eXBlLm1hdGNoKC9cXHMoW15cXHNdKlxcKC4qXFwpKTsvKSB8fFxuICAgICAgICAgIC8vICAgcHJvdG90eXBlLm1hdGNoKC9cXHMoW15cXHNdKik7LykpWzFdO1xuICAgICAgICAgIHRoaXMuZGljdC5hZGQoY2xhc3NEZXNjLmNsYXNzTmFtZSwga2V5LCBtZW1iZXJEZXNjKTtcbiAgICAgICAgICBjbGFzc0Rlc2MubWVtYmVycy5wdXNoKG1lbWJlckRlc2MpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAvLyBjb25zb2xlLndhcm4oZXJyKTtcbiAgICB9XG4gIH1cblxuICBfZGV0ZXJtaW5lVmlzaWJpbGl0eShwcm90b3R5cGUpIHtcbiAgICBjb25zdCB2ID0gcHJvdG90eXBlLnNwbGl0KC9cXHMvKVswXTtcbiAgICByZXR1cm4gL3B1YmxpY3xwcml2YXRlfHByb3RlY3RlZC8udGVzdCh2KSA/IHYgOiAncGFja2FnZSc7XG4gIH1cblxufVxuIl19