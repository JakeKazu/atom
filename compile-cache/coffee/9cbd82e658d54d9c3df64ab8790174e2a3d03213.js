(function() {
  var appendCopy;

  appendCopy = function(reversed, maintainClipboard, fullLine) {
    var _fullLine, _indentBasis, _text, appendTo, clipboardText, end, indentBasis, index, metadata, newMetadata, newText, precedingText, ref, ref1, ref2, ref3, ref4, ref5, selectionData, selectionText, start, startLevel;
    if (reversed == null) {
      reversed = false;
    }
    if (maintainClipboard == null) {
      maintainClipboard = false;
    }
    if (fullLine == null) {
      fullLine = false;
    }
    if (this.isEmpty()) {
      return;
    }
    ref = atom.clipboard.readWithMetadata(), clipboardText = ref.text, metadata = ref.metadata;
    if (metadata == null) {
      return;
    }
    if (((ref1 = metadata.selections) != null ? ref1.length : void 0) > 1) {
      if (((ref2 = metadata.selections) != null ? ref2.length : void 0) !== this.editor.getSelections().length) {
        return;
      }
      maintainClipboard = true;
    }
    ref3 = this.getBufferRange(), start = ref3.start, end = ref3.end;
    selectionText = this.editor.getTextInRange([start, end]);
    precedingText = this.editor.getTextInRange([[start.row, 0], start]);
    startLevel = this.editor.indentLevelForLine(precedingText);
    appendTo = function(_text, _indentBasis) {
      if (reversed) {
        _text = selectionText + _text;
        _indentBasis = startLevel;
      } else {
        _text = _text + selectionText;
      }
      return {
        text: _text,
        indentBasis: _indentBasis,
        fullLine: false
      };
    };
    if (maintainClipboard) {
      index = this.editor.getSelections().indexOf(this);
      ref4 = metadata.selections[index], _text = ref4.text, _indentBasis = ref4.indentBasis, _fullLine = ref4.fullLine;
      selectionData = appendTo(_text, _indentBasis);
      newMetadata = metadata;
      newMetadata.selections[index] = selectionData;
      newText = newMetadata.selections.map(function(selection) {
        return selection.text;
      }).join("\n");
    } else {
      _indentBasis = metadata.indentBasis, _fullLine = metadata.fullLine;
      ref5 = appendTo(clipboardText, _indentBasis), newText = ref5.text, indentBasis = ref5.indentBasis, fullLine = ref5.fullLine;
      newMetadata = {
        indentBasis: indentBasis,
        fullLine: fullLine
      };
    }
    newMetadata.replace = true;
    return atom.clipboard.write(newText, newMetadata);
  };

  module.exports = {
    appendCopy: appendCopy
  };

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL2hvbWUvamFrZS8uYXRvbS9wYWNrYWdlcy9lbWFjcy1wbHVzL2xpYi9zZWxlY3Rpb24uY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUNBO0FBQUEsTUFBQTs7RUFBQSxVQUFBLEdBQWEsU0FBQyxRQUFELEVBQW1CLGlCQUFuQixFQUE0QyxRQUE1QztBQUNYLFFBQUE7O01BRFksV0FBVzs7O01BQU8sb0JBQWtCOzs7TUFBTyxXQUFTOztJQUNoRSxJQUFVLElBQUMsQ0FBQSxPQUFELENBQUEsQ0FBVjtBQUFBLGFBQUE7O0lBRUEsTUFBa0MsSUFBSSxDQUFDLFNBQVMsQ0FBQyxnQkFBZixDQUFBLENBQWxDLEVBQU8sb0JBQU4sSUFBRCxFQUFzQjtJQUN0QixJQUFjLGdCQUFkO0FBQUEsYUFBQTs7SUFDQSxnREFBc0IsQ0FBRSxnQkFBckIsR0FBOEIsQ0FBakM7TUFDRSxnREFBNkIsQ0FBRSxnQkFBckIsS0FBaUMsSUFBQyxDQUFBLE1BQU0sQ0FBQyxhQUFSLENBQUEsQ0FBdUIsQ0FBQyxNQUFuRTtBQUFBLGVBQUE7O01BQ0EsaUJBQUEsR0FBb0IsS0FGdEI7O0lBSUEsT0FBZSxJQUFDLENBQUEsY0FBRCxDQUFBLENBQWYsRUFBQyxrQkFBRCxFQUFRO0lBQ1IsYUFBQSxHQUFnQixJQUFDLENBQUEsTUFBTSxDQUFDLGNBQVIsQ0FBdUIsQ0FBQyxLQUFELEVBQVEsR0FBUixDQUF2QjtJQUNoQixhQUFBLEdBQWdCLElBQUMsQ0FBQSxNQUFNLENBQUMsY0FBUixDQUF1QixDQUFDLENBQUMsS0FBSyxDQUFDLEdBQVAsRUFBWSxDQUFaLENBQUQsRUFBaUIsS0FBakIsQ0FBdkI7SUFDaEIsVUFBQSxHQUFhLElBQUMsQ0FBQSxNQUFNLENBQUMsa0JBQVIsQ0FBMkIsYUFBM0I7SUFFYixRQUFBLEdBQVcsU0FBQyxLQUFELEVBQVEsWUFBUjtNQUNULElBQUcsUUFBSDtRQUNFLEtBQUEsR0FBUSxhQUFBLEdBQWdCO1FBQ3hCLFlBQUEsR0FBZSxXQUZqQjtPQUFBLE1BQUE7UUFJRSxLQUFBLEdBQVEsS0FBQSxHQUFRLGNBSmxCOzthQU1BO1FBQ0UsSUFBQSxFQUFNLEtBRFI7UUFFRSxXQUFBLEVBQWEsWUFGZjtRQUdFLFFBQUEsRUFBVSxLQUhaOztJQVBTO0lBYVgsSUFBRyxpQkFBSDtNQUNFLEtBQUEsR0FBUSxJQUFDLENBQUEsTUFBTSxDQUFDLGFBQVIsQ0FBQSxDQUF1QixDQUFDLE9BQXhCLENBQWdDLElBQWhDO01BQ1IsT0FBZ0UsUUFBUSxDQUFDLFVBQVcsQ0FBQSxLQUFBLENBQXBGLEVBQU8sYUFBTixJQUFELEVBQTJCLG9CQUFiLFdBQWQsRUFBbUQsaUJBQVY7TUFDekMsYUFBQSxHQUFnQixRQUFBLENBQVMsS0FBVCxFQUFnQixZQUFoQjtNQUNoQixXQUFBLEdBQWM7TUFDZCxXQUFXLENBQUMsVUFBVyxDQUFBLEtBQUEsQ0FBdkIsR0FBZ0M7TUFDaEMsT0FBQSxHQUFVLFdBQVcsQ0FBQyxVQUFVLENBQUMsR0FBdkIsQ0FBMkIsU0FBQyxTQUFEO2VBQWUsU0FBUyxDQUFDO01BQXpCLENBQTNCLENBQXlELENBQUMsSUFBMUQsQ0FBK0QsSUFBL0QsRUFOWjtLQUFBLE1BQUE7TUFRZ0Isd0JBQWIsV0FBRCxFQUFzQyxxQkFBVjtNQUM1QixPQUF5QyxRQUFBLENBQVMsYUFBVCxFQUF3QixZQUF4QixDQUF6QyxFQUFPLGVBQU4sSUFBRCxFQUFnQiw4QkFBaEIsRUFBNkI7TUFDN0IsV0FBQSxHQUFjO1FBQUMsYUFBQSxXQUFEO1FBQWMsVUFBQSxRQUFkO1FBVmhCOztJQWFBLFdBQVcsQ0FBQyxPQUFaLEdBQXNCO1dBQ3RCLElBQUksQ0FBQyxTQUFTLENBQUMsS0FBZixDQUFxQixPQUFyQixFQUE4QixXQUE5QjtFQXpDVzs7RUEyQ2IsTUFBTSxDQUFDLE9BQVAsR0FBaUI7SUFBQyxZQUFBLFVBQUQ7O0FBM0NqQiIsInNvdXJjZXNDb250ZW50IjpbIiMgVE9ETzogUmVmYWN0b3JcbmFwcGVuZENvcHkgPSAocmV2ZXJzZWQgPSBmYWxzZSwgbWFpbnRhaW5DbGlwYm9hcmQ9ZmFsc2UsIGZ1bGxMaW5lPWZhbHNlKSAtPlxuICByZXR1cm4gaWYgQGlzRW1wdHkoKVxuXG4gIHt0ZXh0OiBjbGlwYm9hcmRUZXh0LCBtZXRhZGF0YX0gPSBhdG9tLmNsaXBib2FyZC5yZWFkV2l0aE1ldGFkYXRhKClcbiAgcmV0dXJuIHVubGVzcyBtZXRhZGF0YT9cbiAgaWYgbWV0YWRhdGEuc2VsZWN0aW9ucz8ubGVuZ3RoID4gMVxuICAgIHJldHVybiBpZiBtZXRhZGF0YS5zZWxlY3Rpb25zPy5sZW5ndGggaXNudCBAZWRpdG9yLmdldFNlbGVjdGlvbnMoKS5sZW5ndGhcbiAgICBtYWludGFpbkNsaXBib2FyZCA9IHRydWVcblxuICB7c3RhcnQsIGVuZH0gPSBAZ2V0QnVmZmVyUmFuZ2UoKVxuICBzZWxlY3Rpb25UZXh0ID0gQGVkaXRvci5nZXRUZXh0SW5SYW5nZShbc3RhcnQsIGVuZF0pXG4gIHByZWNlZGluZ1RleHQgPSBAZWRpdG9yLmdldFRleHRJblJhbmdlKFtbc3RhcnQucm93LCAwXSwgc3RhcnRdKVxuICBzdGFydExldmVsID0gQGVkaXRvci5pbmRlbnRMZXZlbEZvckxpbmUocHJlY2VkaW5nVGV4dClcblxuICBhcHBlbmRUbyA9IChfdGV4dCwgX2luZGVudEJhc2lzKSAtPlxuICAgIGlmIHJldmVyc2VkXG4gICAgICBfdGV4dCA9IHNlbGVjdGlvblRleHQgKyBfdGV4dFxuICAgICAgX2luZGVudEJhc2lzID0gc3RhcnRMZXZlbFxuICAgIGVsc2VcbiAgICAgIF90ZXh0ID0gX3RleHQgKyBzZWxlY3Rpb25UZXh0XG5cbiAgICB7XG4gICAgICB0ZXh0OiBfdGV4dFxuICAgICAgaW5kZW50QmFzaXM6IF9pbmRlbnRCYXNpc1xuICAgICAgZnVsbExpbmU6IGZhbHNlXG4gICAgfVxuXG4gIGlmIG1haW50YWluQ2xpcGJvYXJkXG4gICAgaW5kZXggPSBAZWRpdG9yLmdldFNlbGVjdGlvbnMoKS5pbmRleE9mKHRoaXMpXG4gICAge3RleHQ6IF90ZXh0LCBpbmRlbnRCYXNpczogX2luZGVudEJhc2lzLCBmdWxsTGluZTogX2Z1bGxMaW5lfSA9IG1ldGFkYXRhLnNlbGVjdGlvbnNbaW5kZXhdXG4gICAgc2VsZWN0aW9uRGF0YSA9IGFwcGVuZFRvKF90ZXh0LCBfaW5kZW50QmFzaXMpXG4gICAgbmV3TWV0YWRhdGEgPSBtZXRhZGF0YVxuICAgIG5ld01ldGFkYXRhLnNlbGVjdGlvbnNbaW5kZXhdID0gc2VsZWN0aW9uRGF0YVxuICAgIG5ld1RleHQgPSBuZXdNZXRhZGF0YS5zZWxlY3Rpb25zLm1hcCgoc2VsZWN0aW9uKSAtPiBzZWxlY3Rpb24udGV4dCkuam9pbihcIlxcblwiKVxuICBlbHNlXG4gICAge2luZGVudEJhc2lzOiBfaW5kZW50QmFzaXMsIGZ1bGxMaW5lOiBfZnVsbExpbmV9ID0gbWV0YWRhdGFcbiAgICB7dGV4dDogbmV3VGV4dCwgaW5kZW50QmFzaXMsIGZ1bGxMaW5lfSA9IGFwcGVuZFRvKGNsaXBib2FyZFRleHQsIF9pbmRlbnRCYXNpcylcbiAgICBuZXdNZXRhZGF0YSA9IHtpbmRlbnRCYXNpcywgZnVsbExpbmV9XG5cbiAgIyBzdXBwb3J0IGNsaXBib2FyZC1wbHVzXG4gIG5ld01ldGFkYXRhLnJlcGxhY2UgPSB0cnVlXG4gIGF0b20uY2xpcGJvYXJkLndyaXRlKG5ld1RleHQsIG5ld01ldGFkYXRhKVxuXG5tb2R1bGUuZXhwb3J0cyA9IHthcHBlbmRDb3B5fVxuIl19
