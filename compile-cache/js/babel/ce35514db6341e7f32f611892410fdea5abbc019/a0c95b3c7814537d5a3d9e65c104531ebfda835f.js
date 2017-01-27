Object.defineProperty(exports, '__esModule', {
    value: true
});

var _createDecoratedClass = (function () { function defineProperties(target, descriptors, initializers) { for (var i = 0; i < descriptors.length; i++) { var descriptor = descriptors[i]; var decorators = descriptor.decorators; var key = descriptor.key; delete descriptor.key; delete descriptor.decorators; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor || descriptor.initializer) descriptor.writable = true; if (decorators) { for (var f = 0; f < decorators.length; f++) { var decorator = decorators[f]; if (typeof decorator === 'function') { descriptor = decorator(target, key, descriptor) || descriptor; } else { throw new TypeError('The decorator for method ' + descriptor.key + ' is of the invalid type ' + typeof decorator); } } if (descriptor.initializer !== undefined) { initializers[key] = descriptor; continue; } } Object.defineProperty(target, key, descriptor); } } return function (Constructor, protoProps, staticProps, protoInitializers, staticInitializers) { if (protoProps) defineProperties(Constructor.prototype, protoProps, protoInitializers); if (staticProps) defineProperties(Constructor, staticProps, staticInitializers); return Constructor; }; })();

exports.consumeElementIcons = consumeElementIcons;

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj['default'] = obj; return newObj; } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

/** @babel */

var _atom = require('atom');

var _eventKit = require('event-kit');

var _config = require('./config');

var config = _interopRequireWildcard(_config);

var _models = require('./models');

var _utils = require('./utils');

var addIconToElement = null;

/**
 * Consumer for file-icons
 * https://github.com/DanBrooker/file-icons
 */

function consumeElementIcons(cb) {
    addIconToElement = cb;
    return new _atom.Disposable(function () {
        addIconToElement = null;
    });
}

var AdvancedOpenFileView = (function () {
    function AdvancedOpenFileView() {
        var _this = this;

        _classCallCheck(this, AdvancedOpenFileView);

        this.emitter = new _eventKit.Emitter();
        this.cursorIndex = null;
        this._updatingPath = false;

        // Element references
        this.pathInput = this.content.querySelector('.path-input');
        this.pathList = this.content.querySelector('.list-group');
        this.parentDirectoryListItem = this.content.querySelector('.parent-directory');

        // Initialize text editor
        this.pathEditor = this.pathInput.getModel();
        this.pathEditor.setPlaceholderText('/path/to/file.txt');
        this.pathEditor.setSoftWrapped(false);

        // Update the path list whenever the path changes.
        this.pathEditor.onDidChange(function () {
            var newPath = new _models.Path(_this.pathEditor.getText());

            _this.parentDirectoryListItem.dataset.fileName = newPath.parent().full;

            _this.setPathList(newPath.matchingPaths(), {
                hideParent: newPath.fragment !== '' || newPath.isRoot(),
                sort: !(config.get('fuzzyMatch') && newPath.fragment !== '')
            });
        });

        this.content.addEventListener('click', function (ev) {
            // Keep focus on the text input and do not propagate so that the
            // outside click handler doesn't pick up the event.
            ev.stopPropagation();
            _this.pathInput.focus();
        });

        this.content.addEventListener('click', function (ev) {
            var _context;

            if ((_context = ev.target, _utils.closest).call(_context, '.add-project-folder') !== null) {
                var _context2;

                var _listItem = (_context2 = ev.target, _utils.closest).call(_context2, '.list-item');
                _this.emitter.emit('did-click-add-project-folder', _listItem.dataset.fileName);
                return; // Don't try to enter the folder too!
            }

            var listItem = (_context = ev.target, _utils.closest).call(_context, '.list-item');
            if (listItem !== null) {
                _this.emitter.emit('did-click-file', listItem.dataset.fileName);
            }
        });
    }

    _createDecoratedClass(AdvancedOpenFileView, [{
        key: 'createPathListItem',
        value: function createPathListItem(path) {
            var icon = path.isDirectory() ? 'icon-file-directory' : 'icon-file-text';
            return '\n            <li class="list-item ' + (path.isDirectory() ? 'directory' : '') + '"\n                data-file-name="' + path.full + '">\n                <span class="filename icon ' + icon + '"\n                      data-name="' + path.fragment + '">\n                    ' + path.fragment + '\n                </span>\n                ' + (path.isDirectory() && !path.isProjectDirectory() ? this.addProjectButton() : '') + '\n            </li>\n        ';
        }
    }, {
        key: 'addProjectButton',
        value: function addProjectButton() {
            return '\n            <span class="add-project-folder icon icon-plus"\n                title="Open as project folder">\n            </span>\n        ';
        }
    }, {
        key: 'createModalPanel',
        value: function createModalPanel() {
            var _this2 = this;

            var panel = atom.workspace.addModalPanel({
                item: this.content
            });

            // Bind the outside click handler and destroy it when the panel is
            // destroyed.
            var outsideClickHandler = function outsideClickHandler(ev) {
                var _context3;

                if ((_context3 = ev.target, _utils.closest).call(_context3, '.advanced-open-file') === null) {
                    _this2.emitter.emit('did-click-outside');
                }
            };

            document.documentElement.addEventListener('click', outsideClickHandler);
            panel.onDidDestroy(function () {
                document.documentElement.removeEventListener('click', outsideClickHandler);
            });

            var modal = this.content.parentNode;
            modal.style.maxHeight = document.body.clientHeight - modal.offsetTop + 'px';
            modal.style.display = 'flex';
            modal.style.flexDirection = 'column';

            this.pathInput.focus();

            return panel;
        }

        /**
         * Re-render list item for the given path, if it exists.
         */
    }, {
        key: 'refreshPathListItem',
        value: function refreshPathListItem(path) {
            var listItem = this.content.querySelector('.list-item[data-file-name="' + path.full + '"]');
            if (listItem) {
                var newListItem = (0, _utils.dom)(this.createPathListItem(path));
                listItem.parentNode.replaceChild(newListItem, listItem);
            }
        }
    }, {
        key: 'onDidClickFile',
        value: function onDidClickFile(callback) {
            this.emitter.on('did-click-file', callback);
        }
    }, {
        key: 'onDidClickAddProjectFolder',
        value: function onDidClickAddProjectFolder(callback) {
            this.emitter.on('did-click-add-project-folder', callback);
        }
    }, {
        key: 'onDidClickOutside',
        value: function onDidClickOutside(callback) {
            this.emitter.on('did-click-outside', callback);
        }

        /**
         * Subscribe to user-initiated changes in the path.
         */
    }, {
        key: 'onDidPathChange',
        value: function onDidPathChange(callback) {
            var _this3 = this;

            this.pathEditor.onDidChange(function () {
                if (!_this3._updatingPath) {
                    callback(new _models.Path(_this3.pathEditor.getText()));
                }
            });
        }
    }, {
        key: 'selectedPath',
        value: function selectedPath() {
            if (this.cursorIndex !== null) {
                var selected = this.pathList.querySelector('.list-item.selected');
                if (selected !== null) {
                    return new _models.Path(selected.dataset.fileName);
                }
            }

            return null;
        }
    }, {
        key: 'firstPath',
        value: function firstPath() {
            var pathItems = this.pathList.querySelectorAll('.list-item:not(.parent-directory)');
            if (pathItems.length > 0) {
                return new _models.Path(pathItems[0].dataset.fileName);
            } else {
                return null;
            }
        }
    }, {
        key: 'pathListLength',
        value: function pathListLength() {
            return this.pathList.querySelectorAll('.list-item:not(.hidden)').length;
        }
    }, {
        key: 'setPath',
        value: function setPath(path) {
            this._updatingPath = true;

            this.pathEditor.setText(path.full);
            this.pathEditor.scrollToCursorPosition();

            this._updatingPath = false;
        }
    }, {
        key: 'forEachListItem',
        value: function forEachListItem(selector, callback) {
            var listItems = this.pathList.querySelectorAll(selector);
            for (var k = 0; k < listItems.length; k++) {
                callback(listItems[k]);
            }
        }
    }, {
        key: 'setPathList',
        value: function setPathList(paths) {
            var _ref = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

            var _ref$hideParent = _ref.hideParent;
            var hideParent = _ref$hideParent === undefined ? false : _ref$hideParent;
            var _ref$sort = _ref.sort;
            var sort = _ref$sort === undefined ? true : _ref$sort;

            this.cursorIndex = null;

            this.forEachListItem('.list-item.selected', function (listItem) {
                listItem.classList.remove('selected');
            });

            this.forEachListItem('.list-item:not(.parent-directory)', function (listItem) {
                listItem.remove();
            });

            if (paths.length === 0 || hideParent) {
                this.parentDirectoryListItem.classList.add('hidden');
            } else {
                this.parentDirectoryListItem.classList.remove('hidden');
            }

            if (paths.length > 0) {
                if (sort) {
                    // Split list into directories and files and sort them.
                    paths = paths.sort(_models.Path.compare);
                    var directoryPaths = paths.filter(function (path) {
                        return path.isDirectory();
                    });
                    var filePaths = paths.filter(function (path) {
                        return path.isFile();
                    });
                    this._appendToPathList(directoryPaths);
                    this._appendToPathList(filePaths);
                } else {
                    this._appendToPathList(paths);
                }
            }
        }
    }, {
        key: '_appendToPathList',
        value: function _appendToPathList(paths) {
            for (path of paths) {
                if (path.exists()) {
                    var listItem = (0, _utils.dom)(this.createPathListItem(path));
                    if (addIconToElement) {
                        var filenameElement = listItem.querySelector('.filename.icon');
                        filenameElement.classList.remove('icon-file-text', 'icon-file-directory');
                        addIconToElement(filenameElement, path.absolute);
                    }
                    this.pathList.appendChild(listItem);
                }
            }
        }
    }, {
        key: 'setCursorIndex',
        value: function setCursorIndex(index) {
            if (index < 0 || index >= this.pathListLength()) {
                index = null;
            }

            this.cursorIndex = index;
            this.forEachListItem('.list-item.selected', function (listItem) {
                listItem.classList.remove('selected');
            });

            if (this.cursorIndex !== null) {
                var listItems = this.pathList.querySelectorAll('.list-item:not(.hidden)');
                if (listItems.length > index) {
                    var selected = listItems[index];
                    selected.classList.add('selected');

                    // If the selected element is out of view, scroll it into view.
                    var parentElement = selected.parentElement;
                    var selectedTop = selected.offsetTop;
                    var parentScrollBottom = parentElement.scrollTop + parentElement.clientHeight;
                    if (selectedTop < parentElement.scrollTop) {
                        parentElement.scrollTop = selectedTop;
                    } else if (selectedTop >= parentScrollBottom) {
                        var selectedBottom = selectedTop + selected.clientHeight;
                        parentElement.scrollTop += selectedBottom - parentScrollBottom;
                    }
                }
            }
        }
    }, {
        key: 'content',
        decorators: [_utils.cachedProperty],
        get: function get() {
            return (0, _utils.dom)('\n            <div class="advanced-open-file">\n                <p class="info-message icon icon-file-add">\n                    Enter the path for the file to open or create.\n                </p>\n                <div class="path-input-container">\n                    <atom-text-editor class="path-input" mini></atom-text-editor>\n                </div>\n                <ul class="list-group">\n                    <li class="list-item parent-directory">\n                        <span class="icon icon-file-directory">..</span>\n                    </li>\n                </ul>\n            </div>\n        ');
        }
    }]);

    return AdvancedOpenFileView;
})();

exports['default'] = AdvancedOpenFileView;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9ob21lL2pha2UvLmF0b20vcGFja2FnZXMvYWR2YW5jZWQtb3Blbi1maWxlL2xpYi92aWV3LmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7O29CQUN5QixNQUFNOzt3QkFDVCxXQUFXOztzQkFFVCxVQUFVOztJQUF0QixNQUFNOztzQkFDQyxVQUFVOztxQkFDYyxTQUFTOztBQUVwRCxJQUFJLGdCQUFnQixHQUFHLElBQUksQ0FBQzs7Ozs7OztBQU1yQixTQUFTLG1CQUFtQixDQUFDLEVBQUUsRUFBRTtBQUNwQyxvQkFBZ0IsR0FBRyxFQUFFLENBQUM7QUFDdEIsV0FBTyxxQkFBZSxZQUFNO0FBQ3hCLHdCQUFnQixHQUFHLElBQUksQ0FBQztLQUMzQixDQUFDLENBQUM7Q0FDTjs7SUFFb0Isb0JBQW9CO0FBQzFCLGFBRE0sb0JBQW9CLEdBQ3ZCOzs7OEJBREcsb0JBQW9COztBQUVqQyxZQUFJLENBQUMsT0FBTyxHQUFHLHVCQUFhLENBQUM7QUFDN0IsWUFBSSxDQUFDLFdBQVcsR0FBRyxJQUFJLENBQUM7QUFDeEIsWUFBSSxDQUFDLGFBQWEsR0FBRyxLQUFLLENBQUM7OztBQUczQixZQUFJLENBQUMsU0FBUyxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsYUFBYSxDQUFDLGFBQWEsQ0FBQyxDQUFDO0FBQzNELFlBQUksQ0FBQyxRQUFRLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxhQUFhLENBQUMsYUFBYSxDQUFDLENBQUM7QUFDMUQsWUFBSSxDQUFDLHVCQUF1QixHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsYUFBYSxDQUFDLG1CQUFtQixDQUFDLENBQUM7OztBQUcvRSxZQUFJLENBQUMsVUFBVSxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsUUFBUSxFQUFFLENBQUM7QUFDNUMsWUFBSSxDQUFDLFVBQVUsQ0FBQyxrQkFBa0IsQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDO0FBQ3hELFlBQUksQ0FBQyxVQUFVLENBQUMsY0FBYyxDQUFD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O0FBQzFDLDRCQUFJLGNBQWMsR0FBRyxXQUFXLEdBQUcsUUFBUSxDQUFDLFlBQVksQ0FBQztBQUN6RCxxQ0FBYSxDQUFDLFNBQVMsSUFBSSxjQUFjLEdBQUcsa0JBQWtCLENBQUM7cUJBQ2xFO2lCQUNKO2FBQ0o7U0FDSjs7OzthQXpOVSxlQUFHO0FBQ1YsbUJBQU8sdW5CQWNMLENBQUM7U0FDTjs7O1dBbEVnQixvQkFBb0I7OztxQkFBcEIsb0JBQW9CIiwiZmlsZSI6Ii9ob21lL2pha2UvLmF0b20vcGFja2FnZXMvYWR2YW5jZWQtb3Blbi1maWxlL2xpYi92aWV3LmpzIiwic291cmNlc0NvbnRlbnQiOlsiLyoqIEBiYWJlbCAqL1xuaW1wb3J0IHtEaXNwb3NhYmxlfSBmcm9tICdhdG9tJztcbmltcG9ydCB7RW1pdHRlcn0gZnJvbSAnZXZlbnQta2l0JztcblxuaW1wb3J0ICogYXMgY29uZmlnIGZyb20gJy4vY29uZmlnJztcbmltcG9ydCB7UGF0aH0gZnJvbSAnLi9tb2RlbHMnO1xuaW1wb3J0IHtjYWNoZWRQcm9wZXJ0eSwgY2xvc2VzdCwgZG9tfSBmcm9tICcuL3V0aWxzJztcblxubGV0IGFkZEljb25Ub0VsZW1lbnQgPSBudWxsO1xuXG4vKipcbiAqIENvbnN1bWVyIGZvciBmaWxlLWljb25zXG4gKiBodHRwczovL2dpdGh1Yi5jb20vRGFuQnJvb2tlci9maWxlLWljb25zXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjb25zdW1lRWxlbWVudEljb25zKGNiKSB7XG4gICAgYWRkSWNvblRvRWxlbWVudCA9IGNiO1xuICAgIHJldHVybiBuZXcgRGlzcG9zYWJsZSgoKSA9PiB7XG4gICAgICAgIGFkZEljb25Ub0VsZW1lbnQgPSBudWxsO1xuICAgIH0pO1xufVxuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBBZHZhbmNlZE9wZW5GaWxlVmlldyB7XG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIHRoaXMuZW1pdHRlciA9IG5ldyBFbWl0dGVyKCk7XG4gICAgICAgIHRoaXMuY3Vyc29ySW5kZXggPSBudWxsO1xuICAgICAgICB0aGlzLl91cGRhdGluZ1BhdGggPSBmYWxzZTtcblxuICAgICAgICAvLyBFbGVtZW50IHJlZmVyZW5jZXNcbiAgICAgICAgdGhpcy5wYXRoSW5wdXQgPSB0aGlzLmNvbnRlbnQucXVlcnlTZWxlY3RvcignLnBhdGgtaW5wdXQnKTtcbiAgICAgICAgdGhpcy5wYXRoTGlzdCA9IHRoaXMuY29udGVudC5xdWVyeVNlbGVjdG9yKCcubGlzdC1ncm91cCcpO1xuICAgICAgICB0aGlzLnBhcmVudERpcmVjdG9yeUxpc3RJdGVtID0gdGhpcy5jb250ZW50LnF1ZXJ5U2VsZWN0b3IoJy5wYXJlbnQtZGlyZWN0b3J5Jyk7XG5cbiAgICAgICAgLy8gSW5pdGlhbGl6ZSB0ZXh0IGVkaXRvclxuICAgICAgICB0aGlzLnBhdGhFZGl0b3IgPSB0aGlzLnBhdGhJbnB1dC5nZXRNb2RlbCgpO1xuICAgICAgICB0aGlzLnBhdGhFZGl0b3Iuc2V0UGxhY2Vob2xkZXJUZXh0KCcvcGF0aC90by9maWxlLnR4dCcpO1xuICAgICAgICB0aGlzLnBhdGhFZGl0b3Iuc2V0U29mdFdyYXBwZWQoZmFsc2UpO1xuXG4gICAgICAgIC8vIFVwZGF0ZSB0aGUgcGF0aCBsaXN0IHdoZW5ldmVyIHRoZSBwYXRoIGNoYW5nZXMuXG4gICAgICAgIHRoaXMucGF0aEVkaXRvci5vbkRpZENoYW5nZSgoKSA9PiB7XG4gICAgICAgICAgICBsZXQgbmV3UGF0aCA9IG5ldyBQYXRoKHRoaXMucGF0aEVkaXRvci5nZXRUZXh0KCkpO1xuXG4gICAgICAgICAgICB0aGlzLnBhcmVudERpcmVjdG9yeUxpc3RJdGVtLmRhdGFzZXQuZmlsZU5hbWUgPSBuZXdQYXRoLnBhcmVudCgpLmZ1bGw7XG5cbiAgICAgICAgICAgIHRoaXMuc2V0UGF0aExpc3QobmV3UGF0aC5tYXRjaGluZ1BhdGhzKCksIHtcbiAgICAgICAgICAgICAgICBoaWRlUGFyZW50OiBuZXdQYXRoLmZyYWdtZW50ICE9PSAnJyB8fCBuZXdQYXRoLmlzUm9vdCgpLFxuICAgICAgICAgICAgICAgIHNvcnQ6ICEoY29uZmlnLmdldCgnZnV6enlNYXRjaCcpICYmIG5ld1BhdGguZnJhZ21lbnQgIT09ICcnKSxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcblxuICAgICAgICB0aGlzLmNvbnRlbnQuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoZXYpID0+IHtcbiAgICAgICAgICAgIC8vIEtlZXAgZm9jdXMgb24gdGhlIHRleHQgaW5wdXQgYW5kIGRvIG5vdCBwcm9wYWdhdGUgc28gdGhhdCB0aGVcbiAgICAgICAgICAgIC8vIG91dHNpZGUgY2xpY2sgaGFuZGxlciBkb2Vzbid0IHBpY2sgdXAgdGhlIGV2ZW50LlxuICAgICAgICAgICAgZXYuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAgICAgICB0aGlzLnBhdGhJbnB1dC5mb2N1cygpO1xuICAgICAgICB9KTtcblxuICAgICAgICB0aGlzLmNvbnRlbnQuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoZXYpID0+IHtcbiAgICAgICAgICAgIGlmIChldi50YXJnZXQ6OmNsb3Nlc3QoJy5hZGQtcHJvamVjdC1mb2xkZXInKSAhPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIGxldCBsaXN0SXRlbSA9IGV2LnRhcmdldDo6Y2xvc2VzdCgnLmxpc3QtaXRlbScpO1xuICAgICAgICAgICAgICAgIHRoaXMuZW1pdHRlci5lbWl0KCdkaWQtY2xpY2stYWRkLXByb2plY3QtZm9sZGVyJywgbGlzdEl0ZW0uZGF0YXNldC5maWxlTmFtZSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuOyAvLyBEb24ndCB0cnkgdG8gZW50ZXIgdGhlIGZvbGRlciB0b28hXG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGxldCBsaXN0SXRlbSA9IGV2LnRhcmdldDo6Y2xvc2VzdCgnLmxpc3QtaXRlbScpO1xuICAgICAgICAgICAgaWYgKGxpc3RJdGVtICE9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5lbWl0dGVyLmVtaXQoJ2RpZC1jbGljay1maWxlJywgbGlzdEl0ZW0uZGF0YXNldC5maWxlTmFtZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIEBjYWNoZWRQcm9wZXJ0eVxuICAgIGdldCBjb250ZW50KCkge1xuICAgICAgICByZXR1cm4gZG9tKGBcbiAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJhZHZhbmNlZC1vcGVuLWZpbGVcIj5cbiAgICAgICAgICAgICAgICA8cCBjbGFzcz1cImluZm8tbWVzc2FnZSBpY29uIGljb24tZmlsZS1hZGRcIj5cbiAgICAgICAgICAgICAgICAgICAgRW50ZXIgdGhlIHBhdGggZm9yIHRoZSBmaWxlIHRvIG9wZW4gb3IgY3JlYXRlLlxuICAgICAgICAgICAgICAgIDwvcD5cbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwicGF0aC1pbnB1dC1jb250YWluZXJcIj5cbiAgICAgICAgICAgICAgICAgICAgPGF0b20tdGV4dC1lZGl0b3IgY2xhc3M9XCJwYXRoLWlucHV0XCIgbWluaT48L2F0b20tdGV4dC1lZGl0b3I+XG4gICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgPHVsIGNsYXNzPVwibGlzdC1ncm91cFwiPlxuICAgICAgICAgICAgICAgICAgICA8bGkgY2xhc3M9XCJsaXN0LWl0ZW0gcGFyZW50LWRpcmVjdG9yeVwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3M9XCJpY29uIGljb24tZmlsZS1kaXJlY3RvcnlcIj4uLjwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgPC9saT5cbiAgICAgICAgICAgICAgICA8L3VsPlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgIGApO1xuICAgIH1cblxuICAgIGNyZWF0ZVBhdGhMaXN0SXRlbShwYXRoKSB7XG4gICAgICAgIGxldCBpY29uID0gcGF0aC5pc0RpcmVjdG9yeSgpID8gJ2ljb24tZmlsZS1kaXJlY3RvcnknIDogJ2ljb24tZmlsZS10ZXh0JztcbiAgICAgICAgcmV0dXJuIGBcbiAgICAgICAgICAgIDxsaSBjbGFzcz1cImxpc3QtaXRlbSAke3BhdGguaXNEaXJlY3RvcnkoKSA/ICdkaXJlY3RvcnknIDogJyd9XCJcbiAgICAgICAgICAgICAgICBkYXRhLWZpbGUtbmFtZT1cIiR7cGF0aC5mdWxsfVwiPlxuICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzPVwiZmlsZW5hbWUgaWNvbiAke2ljb259XCJcbiAgICAgICAgICAgICAgICAgICAgICBkYXRhLW5hbWU9XCIke3BhdGguZnJhZ21lbnR9XCI+XG4gICAgICAgICAgICAgICAgICAgICR7cGF0aC5mcmFnbWVudH1cbiAgICAgICAgICAgICAgICA8L3NwYW4+XG4gICAgICAgICAgICAgICAgJHtwYXRoLmlzRGlyZWN0b3J5KCkgJiYgIXBhdGguaXNQcm9qZWN0RGlyZWN0b3J5KClcbiAgICAgICAgICAgICAgICAgICAgPyB0aGlzLmFkZFByb2plY3RCdXR0b24oKVxuICAgICAgICAgICAgICAgICAgICA6ICcnfVxuICAgICAgICAgICAgPC9saT5cbiAgICAgICAgYDtcbiAgICB9XG5cbiAgICBhZGRQcm9qZWN0QnV0dG9uKCkge1xuICAgICAgICByZXR1cm4gYFxuICAgICAgICAgICAgPHNwYW4gY2xhc3M9XCJhZGQtcHJvamVjdC1mb2xkZXIgaWNvbiBpY29uLXBsdXNcIlxuICAgICAgICAgICAgICAgIHRpdGxlPVwiT3BlbiBhcyBwcm9qZWN0IGZvbGRlclwiPlxuICAgICAgICAgICAgPC9zcGFuPlxuICAgICAgICBgO1xuICAgIH1cblxuICAgIGNyZWF0ZU1vZGFsUGFuZWwoKSB7XG4gICAgICAgIGxldCBwYW5lbCA9IGF0b20ud29ya3NwYWNlLmFkZE1vZGFsUGFuZWwoe1xuICAgICAgICAgICAgaXRlbTogdGhpcy5jb250ZW50LFxuICAgICAgICB9KTtcblxuICAgICAgICAvLyBCaW5kIHRoZSBvdXRzaWRlIGNsaWNrIGhhbmRsZXIgYW5kIGRlc3Ryb3kgaXQgd2hlbiB0aGUgcGFuZWwgaXNcbiAgICAgICAgLy8gZGVzdHJveWVkLlxuICAgICAgICBsZXQgb3V0c2lkZUNsaWNrSGFuZGxlciA9IChldikgPT4ge1xuICAgICAgICAgICAgaWYgKGV2LnRhcmdldDo6Y2xvc2VzdCgnLmFkdmFuY2VkLW9wZW4tZmlsZScpID09PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5lbWl0dGVyLmVtaXQoJ2RpZC1jbGljay1vdXRzaWRlJyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG5cbiAgICAgICAgZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgb3V0c2lkZUNsaWNrSGFuZGxlcik7XG4gICAgICAgIHBhbmVsLm9uRGlkRGVzdHJveSgoKSA9PiB7XG4gICAgICAgICAgICBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcignY2xpY2snLCBvdXRzaWRlQ2xpY2tIYW5kbGVyKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgbGV0IG1vZGFsID0gdGhpcy5jb250ZW50LnBhcmVudE5vZGU7XG4gICAgICAgIG1vZGFsLnN0eWxlLm1heEhlaWdodCA9IGAke2RvY3VtZW50LmJvZHkuY2xpZW50SGVpZ2h0IC0gbW9kYWwub2Zmc2V0VG9wfXB4YDtcbiAgICAgICAgbW9kYWwuc3R5bGUuZGlzcGxheSA9ICdmbGV4JztcbiAgICAgICAgbW9kYWwuc3R5bGUuZmxleERpcmVjdGlvbiA9ICdjb2x1bW4nO1xuXG4gICAgICAgIHRoaXMucGF0aElucHV0LmZvY3VzKCk7XG5cbiAgICAgICAgcmV0dXJuIHBhbmVsO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFJlLXJlbmRlciBsaXN0IGl0ZW0gZm9yIHRoZSBnaXZlbiBwYXRoLCBpZiBpdCBleGlzdHMuXG4gICAgICovXG4gICAgcmVmcmVzaFBhdGhMaXN0SXRlbShwYXRoKSB7XG4gICAgICAgIGxldCBsaXN0SXRlbSA9IHRoaXMuY29udGVudC5xdWVyeVNlbGVjdG9yKGAubGlzdC1pdGVtW2RhdGEtZmlsZS1uYW1lPVwiJHtwYXRoLmZ1bGx9XCJdYCk7XG4gICAgICAgIGlmIChsaXN0SXRlbSkge1xuICAgICAgICAgICAgbGV0IG5ld0xpc3RJdGVtID0gZG9tKHRoaXMuY3JlYXRlUGF0aExpc3RJdGVtKHBhdGgpKTtcbiAgICAgICAgICAgIGxpc3RJdGVtLnBhcmVudE5vZGUucmVwbGFjZUNoaWxkKG5ld0xpc3RJdGVtLCBsaXN0SXRlbSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBvbkRpZENsaWNrRmlsZShjYWxsYmFjaykge1xuICAgICAgICB0aGlzLmVtaXR0ZXIub24oJ2RpZC1jbGljay1maWxlJywgY2FsbGJhY2spO1xuICAgIH1cblxuICAgIG9uRGlkQ2xpY2tBZGRQcm9qZWN0Rm9sZGVyKGNhbGxiYWNrKSB7XG4gICAgICAgIHRoaXMuZW1pdHRlci5vbignZGlkLWNsaWNrLWFkZC1wcm9qZWN0LWZvbGRlcicsIGNhbGxiYWNrKTtcbiAgICB9XG5cbiAgICBvbkRpZENsaWNrT3V0c2lkZShjYWxsYmFjaykge1xuICAgICAgICB0aGlzLmVtaXR0ZXIub24oJ2RpZC1jbGljay1vdXRzaWRlJywgY2FsbGJhY2spO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFN1YnNjcmliZSB0byB1c2VyLWluaXRpYXRlZCBjaGFuZ2VzIGluIHRoZSBwYXRoLlxuICAgICAqL1xuICAgIG9uRGlkUGF0aENoYW5nZShjYWxsYmFjaykge1xuICAgICAgICB0aGlzLnBhdGhFZGl0b3Iub25EaWRDaGFuZ2UoKCkgPT4ge1xuICAgICAgICAgICAgaWYgKCF0aGlzLl91cGRhdGluZ1BhdGgpIHtcbiAgICAgICAgICAgICAgICBjYWxsYmFjayhuZXcgUGF0aCh0aGlzLnBhdGhFZGl0b3IuZ2V0VGV4dCgpKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIHNlbGVjdGVkUGF0aCgpIHtcbiAgICAgICAgaWYgKHRoaXMuY3Vyc29ySW5kZXggIT09IG51bGwpIHtcbiAgICAgICAgICAgIGxldCBzZWxlY3RlZCA9IHRoaXMucGF0aExpc3QucXVlcnlTZWxlY3RvcignLmxpc3QtaXRlbS5zZWxlY3RlZCcpO1xuICAgICAgICAgICAgaWYgKHNlbGVjdGVkICE9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBQYXRoKHNlbGVjdGVkLmRhdGFzZXQuZmlsZU5hbWUpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG4gICAgZmlyc3RQYXRoKCkge1xuICAgICAgICBsZXQgcGF0aEl0ZW1zID0gdGhpcy5wYXRoTGlzdC5xdWVyeVNlbGVjdG9yQWxsKCcubGlzdC1pdGVtOm5vdCgucGFyZW50LWRpcmVjdG9yeSknKTtcbiAgICAgICAgaWYgKHBhdGhJdGVtcy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICByZXR1cm4gbmV3IFBhdGgocGF0aEl0ZW1zWzBdLmRhdGFzZXQuZmlsZU5hbWUpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBwYXRoTGlzdExlbmd0aCgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMucGF0aExpc3QucXVlcnlTZWxlY3RvckFsbCgnLmxpc3QtaXRlbTpub3QoLmhpZGRlbiknKS5sZW5ndGg7XG4gICAgfVxuXG4gICAgc2V0UGF0aChwYXRoKSB7XG4gICAgICAgIHRoaXMuX3VwZGF0aW5nUGF0aCA9IHRydWU7XG5cbiAgICAgICAgdGhpcy5wYXRoRWRpdG9yLnNldFRleHQocGF0aC5mdWxsKTtcbiAgICAgICAgdGhpcy5wYXRoRWRpdG9yLnNjcm9sbFRvQ3Vyc29yUG9zaXRpb24oKTtcblxuICAgICAgICB0aGlzLl91cGRhdGluZ1BhdGggPSBmYWxzZTtcbiAgICB9XG5cbiAgICBmb3JFYWNoTGlzdEl0ZW0oc2VsZWN0b3IsIGNhbGxiYWNrKSB7XG4gICAgICAgIGxldCBsaXN0SXRlbXMgPSB0aGlzLnBhdGhMaXN0LnF1ZXJ5U2VsZWN0b3JBbGwoc2VsZWN0b3IpO1xuICAgICAgICBmb3IgKGxldCBrID0gMDsgayA8IGxpc3RJdGVtcy5sZW5ndGg7IGsrKykge1xuICAgICAgICAgICAgY2FsbGJhY2sobGlzdEl0ZW1zW2tdKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHNldFBhdGhMaXN0KHBhdGhzLCB7aGlkZVBhcmVudD1mYWxzZSwgc29ydD10cnVlfT17fSkge1xuICAgICAgICB0aGlzLmN1cnNvckluZGV4ID0gbnVsbDtcblxuICAgICAgICB0aGlzLmZvckVhY2hMaXN0SXRlbSgnLmxpc3QtaXRlbS5zZWxlY3RlZCcsIChsaXN0SXRlbSkgPT4ge1xuICAgICAgICAgICAgbGlzdEl0ZW0uY2xhc3NMaXN0LnJlbW92ZSgnc2VsZWN0ZWQnKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgdGhpcy5mb3JFYWNoTGlzdEl0ZW0oJy5saXN0LWl0ZW06bm90KC5wYXJlbnQtZGlyZWN0b3J5KScsIChsaXN0SXRlbSkgPT4ge1xuICAgICAgICAgICAgbGlzdEl0ZW0ucmVtb3ZlKCk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGlmIChwYXRocy5sZW5ndGggPT09IDAgfHwgaGlkZVBhcmVudCkge1xuICAgICAgICAgICAgdGhpcy5wYXJlbnREaXJlY3RvcnlMaXN0SXRlbS5jbGFzc0xpc3QuYWRkKCdoaWRkZW4nKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMucGFyZW50RGlyZWN0b3J5TGlzdEl0ZW0uY2xhc3NMaXN0LnJlbW92ZSgnaGlkZGVuJyk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAocGF0aHMubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgaWYgKHNvcnQpIHtcbiAgICAgICAgICAgICAgICAvLyBTcGxpdCBsaXN0IGludG8gZGlyZWN0b3JpZXMgYW5kIGZpbGVzIGFuZCBzb3J0IHRoZW0uXG4gICAgICAgICAgICAgICAgcGF0aHMgPSBwYXRocy5zb3J0KFBhdGguY29tcGFyZSk7XG4gICAgICAgICAgICAgICAgbGV0IGRpcmVjdG9yeVBhdGhzID0gcGF0aHMuZmlsdGVyKChwYXRoKSA9PiBwYXRoLmlzRGlyZWN0b3J5KCkpO1xuICAgICAgICAgICAgICAgIGxldCBmaWxlUGF0aHMgPSBwYXRocy5maWx0ZXIoKHBhdGgpID0+IHBhdGguaXNGaWxlKCkpO1xuICAgICAgICAgICAgICAgIHRoaXMuX2FwcGVuZFRvUGF0aExpc3QoZGlyZWN0b3J5UGF0aHMpO1xuICAgICAgICAgICAgICAgIHRoaXMuX2FwcGVuZFRvUGF0aExpc3QoZmlsZVBhdGhzKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fYXBwZW5kVG9QYXRoTGlzdChwYXRocyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBfYXBwZW5kVG9QYXRoTGlzdChwYXRocykge1xuICAgICAgICBmb3IgKHBhdGggb2YgcGF0aHMpIHtcbiAgICAgICAgICAgIGlmIChwYXRoLmV4aXN0cygpKSB7XG4gICAgICAgICAgICAgICAgbGV0IGxpc3RJdGVtID0gZG9tKHRoaXMuY3JlYXRlUGF0aExpc3RJdGVtKHBhdGgpKTtcbiAgICAgICAgICAgICAgICBpZiAoYWRkSWNvblRvRWxlbWVudCkge1xuICAgICAgICAgICAgICAgICAgICBsZXQgZmlsZW5hbWVFbGVtZW50ID0gbGlzdEl0ZW0ucXVlcnlTZWxlY3RvcignLmZpbGVuYW1lLmljb24nKTtcbiAgICAgICAgICAgICAgICAgICAgZmlsZW5hbWVFbGVtZW50LmNsYXNzTGlzdC5yZW1vdmUoJ2ljb24tZmlsZS10ZXh0JywgJ2ljb24tZmlsZS1kaXJlY3RvcnknKTtcbiAgICAgICAgICAgICAgICAgICAgYWRkSWNvblRvRWxlbWVudChmaWxlbmFtZUVsZW1lbnQsIHBhdGguYWJzb2x1dGUpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB0aGlzLnBhdGhMaXN0LmFwcGVuZENoaWxkKGxpc3RJdGVtKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIHNldEN1cnNvckluZGV4KGluZGV4KSB7XG4gICAgICAgIGlmIChpbmRleCA8IDAgfHwgaW5kZXggPj0gdGhpcy5wYXRoTGlzdExlbmd0aCgpKSB7XG4gICAgICAgICAgICBpbmRleCA9IG51bGw7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLmN1cnNvckluZGV4ID0gaW5kZXg7XG4gICAgICAgIHRoaXMuZm9yRWFjaExpc3RJdGVtKCcubGlzdC1pdGVtLnNlbGVjdGVkJywgKGxpc3RJdGVtKSA9PiB7XG4gICAgICAgICAgICBsaXN0SXRlbS5jbGFzc0xpc3QucmVtb3ZlKCdzZWxlY3RlZCcpO1xuICAgICAgICB9KTtcblxuICAgICAgICBpZiAodGhpcy5jdXJzb3JJbmRleCAhPT0gbnVsbCkge1xuICAgICAgICAgICAgbGV0IGxpc3RJdGVtcyA9IHRoaXMucGF0aExpc3QucXVlcnlTZWxlY3RvckFsbCgnLmxpc3QtaXRlbTpub3QoLmhpZGRlbiknKTtcbiAgICAgICAgICAgIGlmIChsaXN0SXRlbXMubGVuZ3RoID4gaW5kZXgpIHtcbiAgICAgICAgICAgICAgICBsZXQgc2VsZWN0ZWQgPSBsaXN0SXRlbXNbaW5kZXhdO1xuICAgICAgICAgICAgICAgIHNlbGVjdGVkLmNsYXNzTGlzdC5hZGQoJ3NlbGVjdGVkJyk7XG5cbiAgICAgICAgICAgICAgICAvLyBJZiB0aGUgc2VsZWN0ZWQgZWxlbWVudCBpcyBvdXQgb2Ygdmlldywgc2Nyb2xsIGl0IGludG8gdmlldy5cbiAgICAgICAgICAgICAgICBsZXQgcGFyZW50RWxlbWVudCA9IHNlbGVjdGVkLnBhcmVudEVsZW1lbnQ7XG4gICAgICAgICAgICAgICAgbGV0IHNlbGVjdGVkVG9wID0gc2VsZWN0ZWQub2Zmc2V0VG9wO1xuICAgICAgICAgICAgICAgIGxldCBwYXJlbnRTY3JvbGxCb3R0b20gPSBwYXJlbnRFbGVtZW50LnNjcm9sbFRvcCArIHBhcmVudEVsZW1lbnQuY2xpZW50SGVpZ2h0O1xuICAgICAgICAgICAgICAgIGlmIChzZWxlY3RlZFRvcCA8IHBhcmVudEVsZW1lbnQuc2Nyb2xsVG9wKSB7XG4gICAgICAgICAgICAgICAgICAgIHBhcmVudEVsZW1lbnQuc2Nyb2xsVG9wID0gc2VsZWN0ZWRUb3A7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChzZWxlY3RlZFRvcCA+PSBwYXJlbnRTY3JvbGxCb3R0b20pIHtcbiAgICAgICAgICAgICAgICAgICAgbGV0IHNlbGVjdGVkQm90dG9tID0gc2VsZWN0ZWRUb3AgKyBzZWxlY3RlZC5jbGllbnRIZWlnaHQ7XG4gICAgICAgICAgICAgICAgICAgIHBhcmVudEVsZW1lbnQuc2Nyb2xsVG9wICs9IHNlbGVjdGVkQm90dG9tIC0gcGFyZW50U2Nyb2xsQm90dG9tO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbn1cbiJdfQ==