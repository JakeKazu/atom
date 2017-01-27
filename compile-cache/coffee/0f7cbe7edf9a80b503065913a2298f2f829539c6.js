(function() {
  var PathsProvider, Range, fs, fuzzaldrin, path,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  Range = require('atom').Range;

  fuzzaldrin = require('fuzzaldrin');

  path = require('path');

  fs = require('fs');

  module.exports = PathsProvider = (function() {
    function PathsProvider() {
      this.dispose = bind(this.dispose, this);
      this.prefixForCursor = bind(this.prefixForCursor, this);
      this.requestHandler = bind(this.requestHandler, this);
    }

    PathsProvider.prototype.id = 'autocomplete-paths-pathsprovider';

    PathsProvider.prototype.selector = '*';

    PathsProvider.prototype.wordRegex = /(?:[a-zA-Z]:)?[a-zA-Z0-9.\/\\_-]*(?:\/|\\\\?)[a-zA-Z0-9.\/\\_-]*/g;

    PathsProvider.prototype.cache = [];

    PathsProvider.prototype.requestHandler = function(options) {
      var basePath, editorPath, prefix, ref, suggestions;
      if (options == null) {
        options = {};
      }
      if (!((options.editor != null) && (options.buffer != null) && (options.cursor != null))) {
        return [];
      }
      editorPath = (ref = options.editor) != null ? ref.getPath() : void 0;
      if (!(editorPath != null ? editorPath.length : void 0)) {
        return [];
      }
      basePath = path.dirname(editorPath);
      if (basePath == null) {
        return [];
      }
      prefix = this.prefixForCursor(options.editor, options.buffer, options.cursor, options.position);
      if (!(prefix.length > atom.config.get('autocomplete-plus.minimumWordLength'))) {
        return [];
      }
      suggestions = this.findSuggestionsForPrefix(options.editor, basePath, prefix);
      if (!suggestions.length) {
        return [];
      }
      return suggestions;
    };

    PathsProvider.prototype.prefixForCursor = function(editor, buffer, cursor, position) {
      var end, start;
      if (!((buffer != null) && (cursor != null))) {
        return '';
      }
      start = this.getBeginningOfCurrentWordBufferPosition(editor, position, {
        wordRegex: this.wordRegex
      });
      end = cursor.getBufferPosition();
      if (!((start != null) && (end != null))) {
        return '';
      }
      return buffer.getTextInRange(new Range(start, end));
    };

    PathsProvider.prototype.getBeginningOfCurrentWordBufferPosition = function(editor, position, options) {
      var allowPrevious, beginningOfWordPosition, currentBufferPosition, ref, scanRange;
      if (options == null) {
        options = {};
      }
      if (position == null) {
        return;
      }
      allowPrevious = (ref = options.allowPrevious) != null ? ref : true;
      currentBufferPosition = position;
      scanRange = [[currentBufferPosition.row, 0], currentBufferPosition];
      beginningOfWordPosition = null;
      editor.backwardsScanInBufferRange(options.wordRegex, scanRange, function(arg) {
        var range, stop;
        range = arg.range, stop = arg.stop;
        if (range.end.isGreaterThanOrEqual(currentBufferPosition) || allowPrevious) {
          beginningOfWordPosition = range.start;
        }
        if (!(beginningOfWordPosition != null ? beginningOfWordPosition.isEqual(currentBufferPosition) : void 0)) {
          return stop();
        }
      });
      if (beginningOfWordPosition != null) {
        return beginningOfWordPosition;
      } else if (allowPrevious) {
        return [currentBufferPosition.row, 0];
      } else {
        return currentBufferPosition;
      }
    };

    PathsProvider.prototype.findSuggestionsForPrefix = function(editor, basePath, prefix) {
      var directory, e, files, label, prefixPath, result, resultPath, results, stat, suggestion, suggestions;
      if (basePath == null) {
        return [];
      }
      prefixPath = path.resolve(basePath, prefix);
      if (prefix.match(/[\/\\]$/)) {
        directory = prefixPath;
        prefix = '';
      } else {
        if (basePath === prefixPath) {
          directory = prefixPath;
        } else {
          directory = path.dirname(prefixPath);
        }
        prefix = path.basename(prefix);
      }
      try {
        stat = fs.statSync(directory);
        if (!stat.isDirectory()) {
          return [];
        }
      } catch (error) {
        e = error;
        return [];
      }
      try {
        files = fs.readdirSync(directory);
      } catch (error) {
        e = error;
        return [];
      }
      results = fuzzaldrin.filter(files, prefix);
      suggestions = (function() {
        var i, len, results1;
        results1 = [];
        for (i = 0, len = results.length; i < len; i++) {
          result = results[i];
          resultPath = path.resolve(directory, result);
          try {
            stat = fs.statSync(resultPath);
          } catch (error) {
            e = error;
            continue;
          }
          if (stat.isDirectory()) {
            label = 'Dir';
          } else if (stat.isFile()) {
            label = 'File';
          } else {
            continue;
          }
          suggestion = {
            word: result,
            prefix: prefix,
            label: label,
            data: {
              body: result
            }
          };
          if (suggestion.label !== 'File') {
            suggestion.onDidConfirm = function() {
              return atom.commands.dispatch(atom.views.getView(editor), 'autocomplete-plus:activate');
            };
          }
          results1.push(suggestion);
        }
        return results1;
      })();
      return suggestions;
    };

    PathsProvider.prototype.dispose = function() {
      this.editor = null;
      return this.basePath = null;
    };

    return PathsProvider;

  })();

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL2hvbWUvamFrZS8uYXRvbS9wYWNrYWdlcy9hdXRvY29tcGxldGUtcGF0aHMvbGliL3BhdGhzLXByb3ZpZGVyLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUFBLE1BQUEsMENBQUE7SUFBQTs7RUFBQyxRQUFVLE9BQUEsQ0FBUSxNQUFSOztFQUNYLFVBQUEsR0FBYSxPQUFBLENBQVEsWUFBUjs7RUFDYixJQUFBLEdBQU8sT0FBQSxDQUFRLE1BQVI7O0VBQ1AsRUFBQSxHQUFLLE9BQUEsQ0FBUSxJQUFSOztFQUVMLE1BQU0sQ0FBQyxPQUFQLEdBQ007Ozs7Ozs7NEJBQ0osRUFBQSxHQUFJOzs0QkFDSixRQUFBLEdBQVU7OzRCQUNWLFNBQUEsR0FBVzs7NEJBQ1gsS0FBQSxHQUFPOzs0QkFFUCxjQUFBLEdBQWdCLFNBQUMsT0FBRDtBQUNkLFVBQUE7O1FBRGUsVUFBVTs7TUFDekIsSUFBQSxDQUFBLENBQWlCLHdCQUFBLElBQW9CLHdCQUFwQixJQUF3Qyx3QkFBekQsQ0FBQTtBQUFBLGVBQU8sR0FBUDs7TUFDQSxVQUFBLHVDQUEyQixDQUFFLE9BQWhCLENBQUE7TUFDYixJQUFBLHVCQUFpQixVQUFVLENBQUUsZ0JBQTdCO0FBQUEsZUFBTyxHQUFQOztNQUNBLFFBQUEsR0FBVyxJQUFJLENBQUMsT0FBTCxDQUFhLFVBQWI7TUFDWCxJQUFpQixnQkFBakI7QUFBQSxlQUFPLEdBQVA7O01BRUEsTUFBQSxHQUFTLElBQUMsQ0FBQSxlQUFELENBQWlCLE9BQU8sQ0FBQyxNQUF6QixFQUFpQyxPQUFPLENBQUMsTUFBekMsRUFBaUQsT0FBTyxDQUFDLE1BQXpELEVBQWlFLE9BQU8sQ0FBQyxRQUF6RTtNQUVULElBQUEsQ0FBQSxDQUFpQixNQUFNLENBQUMsTUFBUCxHQUFnQixJQUFJLENBQUMsTUFBTSxDQUFDLEdBQVosQ0FBZ0IscUNBQWhCLENBQWpDLENBQUE7QUFBQSxlQUFPLEdBQVA7O01B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QUFsQixFQUF5QixNQUF6QjtNQUVWLFdBQUE7O0FBQWM7YUFBQSx5Q0FBQTs7VUFDWixVQUFBLEdBQWEsSUFBSSxDQUFDLE9BQUwsQ0FBYSxTQUFiLEVBQXdCLE1BQXhCO0FBR2I7WUFDRSxJQUFBLEdBQU8sRUFBRSxDQUFDLFFBQUgsQ0FBWSxVQUFaLEVBRFQ7V0FBQSxhQUFBO1lBRU07QUFDSixxQkFIRjs7VUFJQSxJQUFHLElBQUksQ0FBQyxXQUFMLENBQUEsQ0FBSDtZQUNFLEtBQUEsR0FBUSxNQURWO1dBQUEsTUFFSyxJQUFHLElBQUksQ0FBQyxNQUFMLENBQUEsQ0FBSDtZQUNILEtBQUEsR0FBUSxPQURMO1dBQUEsTUFBQTtBQUdILHFCQUhHOztVQUtMLFVBQUEsR0FDRTtZQUFBLElBQUEsRUFBTSxNQUFOO1lBQ0EsTUFBQSxFQUFRLE1BRFI7WUFFQSxLQUFBLEVBQU8sS0FGUDtZQUdBLElBQUEsRUFDRTtjQUFBLElBQUEsRUFBTSxNQUFOO2FBSkY7O1VBS0YsSUFBRyxVQUFVLENBQUMsS0FBWCxLQUFzQixNQUF6QjtZQUNFLFVBQVUsQ0FBQyxZQUFYLEdBQTBCLFNBQUE7cUJBQ3hCLElBQUksQ0FBQyxRQUFRLENBQUMsUUFBZCxDQUF1QixJQUFJLENBQUMsS0FBSyxDQUFDLE9BQVgsQ0FBbUIsTUFBbkIsQ0FBdkIsRUFBbUQsNEJBQW5EO1lBRHdCLEVBRDVCOzt3QkFJQTtBQXpCWTs7O0FBMEJkLGFBQU87SUF2RGlCOzs0QkF5RDFCLE9BQUEsR0FBUyxTQUFBO01BQ1AsSUFBQyxDQUFBLE1BQUQsR0FBVTthQUNWLElBQUMsQ0FBQSxRQUFELEdBQVk7SUFGTDs7Ozs7QUE5R1giLCJzb3VyY2VzQ29udGVudCI6WyJ7UmFuZ2V9ICA9IHJlcXVpcmUoJ2F0b20nKVxuZnV6emFsZHJpbiA9IHJlcXVpcmUoJ2Z1enphbGRyaW4nKVxucGF0aCA9IHJlcXVpcmUoJ3BhdGgnKVxuZnMgPSByZXF1aXJlKCdmcycpXG5cbm1vZHVsZS5leHBvcnRzID1cbmNsYXNzIFBhdGhzUHJvdmlkZXJcbiAgaWQ6ICdhdXRvY29tcGxldGUtcGF0aHMtcGF0aHNwcm92aWRlcidcbiAgc2VsZWN0b3I6ICcqJ1xuICB3b3JkUmVnZXg6IC8oPzpbYS16QS1aXTopP1thLXpBLVowLTkuL1xcXFxfLV0qKD86XFwvfFxcXFxcXFxcPylbYS16QS1aMC05Li9cXFxcXy1dKi9nXG4gIGNhY2hlOiBbXVxuXG4gIHJlcXVlc3RIYW5kbGVyOiAob3B0aW9ucyA9IHt9KSA9PlxuICAgIHJldHVybiBbXSB1bmxlc3Mgb3B0aW9ucy5lZGl0b3I/IGFuZCBvcHRpb25zLmJ1ZmZlcj8gYW5kIG9wdGlvbnMuY3Vyc29yP1xuICAgIGVkaXRvclBhdGggPSBvcHRpb25zLmVkaXRvcj8uZ2V0UGF0aCgpXG4gICAgcmV0dXJuIFtdIHVubGVzcyBlZGl0b3JQYXRoPy5sZW5ndGhcbiAgICBiYXNlUGF0aCA9IHBhdGguZGlybmFtZShlZGl0b3JQYXRoKVxuICAgIHJldHVybiBbXSB1bmxlc3MgYmFzZVBhdGg/XG5cbiAgICBwcmVmaXggPSBAcHJlZml4Rm9yQ3Vyc29yKG9wdGlvbnMuZWRpdG9yLCBvcHRpb25zLmJ1ZmZlciwgb3B0aW9ucy5jdXJzb3IsIG9wdGlvbnMucG9zaXRpb24pXG5cbiAgICByZXR1cm4gW10gdW5sZXNzIHByZWZpeC5sZW5ndGggPiBhdG9tLmNvbmZpZy5nZXQoJ2F1dG9jb21wbGV0ZS1wbHVzLm1pbmltdW1Xb3JkTGVuZ3RoJylcblxuICAgIHN1Z2dlc3Rpb25zID0gQGZpbmRTdWdnZXN0aW9uc0ZvclByZWZpeChvcHRpb25zLmVkaXRvciwgYmFzZVBhdGgsIHByZWZpeClcbiAgICByZXR1cm4gW10gdW5sZXNzIHN1Z2dlc3Rpb25zLmxlbmd0aFxuICAgIHJldHVybiBzdWdnZXN0aW9uc1xuXG4gIHByZWZpeEZvckN1cnNvcjogKGVkaXRvciwgYnVmZmVyLCBjdXJzb3IsIHBvc2l0aW9uKSA9PlxuICAgIHJldHVybiAnJyB1bmxlc3MgYnVmZmVyPyBhbmQgY3Vyc29yP1xuICAgIHN0YXJ0ID0gQGdldEJlZ2lubmluZ09mQ3VycmVudFdvcmRCdWZmZXJQb3NpdGlvbihlZGl0b3IsIHBvc2l0aW9uLCB7d29yZFJlZ2V4OiBAd29yZFJlZ2V4fSlcbiAgICBlbmQgPSBjdXJzb3IuZ2V0QnVmZmVyUG9zaXRpb24oKVxuICAgIHJldHVybiAnJyB1bmxlc3Mgc3RhcnQ/IGFuZCBlbmQ/XG4gICAgYnVmZmVyLmdldFRleHRJblJhbmdlKG5ldyBSYW5nZShzdGFydCwgZW5kKSlcblxuICBnZXRCZWdpbm5pbmdPZkN1cnJlbnRXb3JkQnVmZmVyUG9zaXRpb246IChlZGl0b3IsIHBvc2l0aW9uLCBvcHRpb25zID0ge30pIC0+XG4gICAgcmV0dXJuIHVubGVzcyBwb3NpdGlvbj9cbiAgICBhbGxvd1ByZXZpb3VzID0gb3B0aW9ucy5hbGxvd1ByZXZpb3VzID8gdHJ1ZVxuICAgIGN1cnJlbnRCdWZmZXJQb3NpdGlvbiA9IHBvc2l0aW9uXG4gICAgc2NhblJhbmdlID0gW1tjdXJyZW50QnVmZmVyUG9zaXRpb24ucm93LCAwXSwgY3VycmVudEJ1ZmZlclBvc2l0aW9uXVxuICAgIGJlZ2lubmluZ09mV29yZFBvc2l0aW9uID0gbnVsbFxuICAgIGVkaXRvci5iYWNrd2FyZHNTY2FuSW5CdWZmZXJSYW5nZSAob3B0aW9ucy53b3JkUmVnZXgpLCBzY2FuUmFuZ2UsICh7cmFuZ2UsIHN0b3B9KSAtPlxuICAgICAgaWYgcmFuZ2UuZW5kLmlzR3JlYXRlclRoYW5PckVxdWFsKGN1cnJlbnRCdWZmZXJQb3NpdGlvbikgb3IgYWxsb3dQcmV2aW91c1xuICAgICAgICBiZWdpbm5pbmdPZldvcmRQb3NpdGlvbiA9IHJhbmdlLnN0YXJ0XG4gICAgICBpZiBub3QgYmVnaW5uaW5nT2ZXb3JkUG9zaXRpb24/LmlzRXF1YWwoY3VycmVudEJ1ZmZlclBvc2l0aW9uKVxuICAgICAgICBzdG9wKClcblxuICAgIGlmIGJlZ2lubmluZ09mV29yZFBvc2l0aW9uP1xuICAgICAgYmVnaW5uaW5nT2ZXb3JkUG9zaXRpb25cbiAgICBlbHNlIGlmIGFsbG93UHJldmlvdXNcbiAgICAgIFtjdXJyZW50QnVmZmVyUG9zaXRpb24ucm93LCAwXVxuICAgIGVsc2VcbiAgICAgIGN1cnJlbnRCdWZmZXJQb3NpdGlvblxuXG4gIGZpbmRTdWdnZXN0aW9uc0ZvclByZWZpeDogKGVkaXRvciwgYmFzZVBhdGgsIHByZWZpeCkgLT5cbiAgICByZXR1cm4gW10gdW5sZXNzIGJhc2VQYXRoP1xuXG4gICAgcHJlZml4UGF0aCA9IHBhdGgucmVzb2x2ZShiYXNlUGF0aCwgcHJlZml4KVxuXG4gICAgaWYgcHJlZml4Lm1hdGNoKC9bL1xcXFxdJC8pXG4gICAgICBkaXJlY3RvcnkgPSBwcmVmaXhQYXRoXG4gICAgICBwcmVmaXggPSAnJ1xuICAgIGVsc2VcbiAgICAgIGlmIGJhc2VQYXRoIGlzIHByZWZpeFBhdGhcbiAgICAgICAgZGlyZWN0b3J5ID0gcHJlZml4UGF0aFxuICAgICAgZWxzZVxuICAgICAgICBkaXJlY3RvcnkgPSBwYXRoLmRpcm5hbWUocHJlZml4UGF0aClcbiAgICAgIHByZWZpeCA9IHBhdGguYmFzZW5hbWUocHJlZml4KVxuXG4gICAgIyBJcyB0aGlzIGFjdHVhbGx5IGEgZGlyZWN0b3J5P1xuICAgIHRyeVxuICAgICAgc3RhdCA9IGZzLnN0YXRTeW5jKGRpcmVjdG9yeSlcbiAgICAgIHJldHVybiBbXSB1bmxlc3Mgc3RhdC5pc0RpcmVjdG9yeSgpXG4gICAgY2F0Y2ggZVxuICAgICAgcmV0dXJuIFtdXG5cbiAgICAjIEdldCBmaWxlc1xuICAgIHRyeVxuICAgICAgZmlsZXMgPSBmcy5yZWFkZGlyU3luYyhkaXJlY3RvcnkpXG4gICAgY2F0Y2ggZVxuICAgICAgcmV0dXJuIFtdXG4gICAgcmVzdWx0cyA9IGZ1enphbGRyaW4uZmlsdGVyKGZpbGVzLCBwcmVmaXgpXG5cbiAgICBzdWdnZXN0aW9ucyA9IGZvciByZXN1bHQgaW4gcmVzdWx0c1xuICAgICAgcmVzdWx0UGF0aCA9IHBhdGgucmVzb2x2ZShkaXJlY3RvcnksIHJlc3VsdClcblxuICAgICAgIyBDaGVjayBmb3IgdHlwZVxuICAgICAgdHJ5XG4gICAgICAgIHN0YXQgPSBmcy5zdGF0U3luYyhyZXN1bHRQYXRoKVxuICAgICAgY2F0Y2ggZVxuICAgICAgICBjb250aW51ZVxuICAgICAgaWYgc3RhdC5pc0RpcmVjdG9yeSgpXG4gICAgICAgIGxhYmVsID0gJ0RpcidcbiAgICAgIGVsc2UgaWYgc3RhdC5pc0ZpbGUoKVxuICAgICAgICBsYWJlbCA9ICdGaWxlJ1xuICAgICAgZWxzZVxuICAgICAgICBjb250aW51ZVxuXG4gICAgICBzdWdnZXN0aW9uID1cbiAgICAgICAgd29yZDogcmVzdWx0XG4gICAgICAgIHByZWZpeDogcHJlZml4XG4gICAgICAgIGxhYmVsOiBsYWJlbFxuICAgICAgICBkYXRhOlxuICAgICAgICAgIGJvZHk6IHJlc3VsdFxuICAgICAgaWYgc3VnZ2VzdGlvbi5sYWJlbCBpc250ICdGaWxlJ1xuICAgICAgICBzdWdnZXN0aW9uLm9uRGlkQ29uZmlybSA9IC0+XG4gICAgICAgICAgYXRvbS5jb21tYW5kcy5kaXNwYXRjaChhdG9tLnZpZXdzLmdldFZpZXcoZWRpdG9yKSwgJ2F1dG9jb21wbGV0ZS1wbHVzOmFjdGl2YXRlJylcblxuICAgICAgc3VnZ2VzdGlvblxuICAgIHJldHVybiBzdWdnZXN0aW9uc1xuXG4gIGRpc3Bvc2U6ID0+XG4gICAgQGVkaXRvciA9IG51bGxcbiAgICBAYmFzZVBhdGggPSBudWxsXG4iXX0=
