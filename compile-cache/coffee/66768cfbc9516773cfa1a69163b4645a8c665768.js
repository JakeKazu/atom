(function() {
  var CompositeDisposable, EmacsCursor, EmacsEditor, KillRing, Mark, State, afterCommand, beforeCommand, closeOtherPanes, getEditor;

  CompositeDisposable = require('atom').CompositeDisposable;

  EmacsCursor = require('./emacs-cursor');

  EmacsEditor = require('./emacs-editor');

  KillRing = require('./kill-ring');

  Mark = require('./mark');

  State = require('./state');

  beforeCommand = function(event) {
    return State.beforeCommand(event);
  };

  afterCommand = function(event) {
    var emacsCursor, emacsEditor, i, len, ref;
    Mark.deactivatePending();
    if (State.yankComplete()) {
      emacsEditor = getEditor(event);
      ref = emacsEditor.getEmacsCursors();
      for (i = 0, len = ref.length; i < len; i++) {
        emacsCursor = ref[i];
        emacsCursor.yankComplete();
      }
    }
    return State.afterCommand(event);
  };

  getEditor = function(event) {
    var editor, ref;
    if ((ref = event.target) != null ? ref.getModel : void 0) {
      editor = event.target.getModel();
    } else {
      editor = atom.workspace.getActiveTextEditor();
    }
    return EmacsEditor["for"](editor);
  };

  closeOtherPanes = function(event) {
    var activePane, i, len, pane, ref, results;
    activePane = atom.workspace.getActivePane();
    if (!activePane) {
      return;
    }
    ref = atom.workspace.getPanes();
    results = [];
    for (i = 0, len = ref.length; i < len; i++) {
      pane = ref[i];
      if (pane !== activePane) {
        results.push(pane.close());
      } else {
        results.push(void 0);
      }
    }
    return results;
  };

  module.exports = {
    EmacsCursor: EmacsCursor,
    EmacsEditor: EmacsEditor,
    KillRing: KillRing,
    Mark: Mark,
    State: State,
    activate: function() {
      var ref, ref1;
      State.initialize();
      if ((ref = document.getElementsByTagName('atom-workspace')[0]) != null) {
        if ((ref1 = ref.classList) != null) {
          ref1.add('atomic-emacs');
        }
      }
      this.disposable = new CompositeDisposable;
      this.disposable.add(atom.commands.onWillDispatch(function(event) {
        return beforeCommand(event);
      }));
      this.disposable.add(atom.commands.onDidDispatch(function(event) {
        return afterCommand(event);
      }));
      return this.disposable.add(atom.commands.add('atom-text-editor', {
        "atomic-emacs:backward-char": function(event) {
          return getEditor(event).backwardChar();
        },
        "atomic-emacs:forward-char": function(event) {
          return getEditor(event).forwardChar();
        },
        "atomic-emacs:backward-word": function(event) {
          return getEditor(event).backwardWord();
        },
        "atomic-emacs:forward-word": function(event) {
          return getEditor(event).forwardWord();
        },
        "atomic-emacs:backward-sexp": function(event) {
          return getEditor(event).backwardSexp();
        },
        "atomic-emacs:forward-sexp": function(event) {
          return getEditor(event).forwardSexp();
        },
        "atomic-emacs:previous-line": function(event) {
          return getEditor(event).previousLine();
        },
        "atomic-emacs:next-line": function(event) {
          return getEditor(event).nextLine();
        },
        "atomic-emacs:backward-paragraph": function(event) {
          return getEditor(event).backwardParagraph();
        },
        "atomic-emacs:forward-paragraph": function(event) {
          return getEditor(event).forwardParagraph();
        },
        "atomic-emacs:back-to-indentation": function(event) {
          return getEditor(event).backToIndentation();
        },
        "atomic-emacs:backward-kill-word": function(event) {
          return getEditor(event).backwardKillWord();
        },
        "atomic-emacs:kill-word": function(event) {
          return getEditor(event).killWord();
        },
        "atomic-emacs:kill-line": function(event) {
          return getEditor(event).killLine();
        },
        "atomic-emacs:kill-region": function(event) {
          return getEditor(event).killRegion();
        },
        "atomic-emacs:copy-region-as-kill": function(event) {
          return getEditor(event).copyRegionAsKill();
        },
        "atomic-emacs:append-next-kill": function(event) {
          return State.killed();
        },
        "atomic-emacs:yank": function(event) {
          return getEditor(event).yank();
        },
        "atomic-emacs:yank-pop": function(event) {
          return getEditor(event).yankPop();
        },
        "atomic-emacs:yank-shift": function(event) {
          return getEditor(event).yankShift();
        },
        "atomic-emacs:delete-horizontal-space": function(event) {
          return getEditor(event).deleteHorizontalSpace();
        },
        "atomic-emacs:delete-indentation": function(event) {
          return getEditor(event).deleteIndentation();
        },
        "atomic-emacs:open-line": function(event) {
          return getEditor(event).openLine();
        },
        "atomic-emacs:just-one-space": function(event) {
          return getEditor(event).justOneSpace();
        },
        "atomic-emacs:transpose-chars": function(event) {
          return getEditor(event).transposeChars();
        },
        "atomic-emacs:transpose-lines": function(event) {
          return getEditor(event).transposeLines();
        },
        "atomic-emacs:transpose-words": function(event) {
          return getEditor(event).transposeWords();
        },
        "atomic-emacs:downcase-word-or-region": function(event) {
          return getEditor(event).downcaseWordOrRegion();
        },
        "atomic-emacs:upcase-word-or-region": function(event) {
          return getEditor(event).upcaseWordOrRegion();
        },
        "atomic-emacs:capitalize-word-or-region": function(event) {
          return getEditor(event).capitalizeWordOrRegion();
        },
        "atomic-emacs:set-mark": function(event) {
          return getEditor(event).setMark();
        },
        "atomic-emacs:mark-sexp": function(event) {
          return getEditor(event).markSexp();
        },
        "atomic-emacs:mark-whole-buffer": function(event) {
          return getEditor(event).markWholeBuffer();
        },
        "atomic-emacs:exchange-point-and-mark": function(event) {
          return getEditor(event).exchangePointAndMark();
        },
        "atomic-emacs:recenter-top-bottom": function(event) {
          return getEditor(event).recenterTopBottom();
        },
        "atomic-emacs:scroll-down": function(event) {
          return getEditor(event).scrollDown();
        },
        "atomic-emacs:scroll-up": function(event) {
          return getEditor(event).scrollUp();
        },
        "atomic-emacs:close-other-panes": function(event) {
          return closeOtherPanes(event);
        },
        "core:cancel": function(event) {
          return getEditor(event).keyboardQuit();
        }
      }));
    },
    deactivate: function() {
      var ref, ref1, ref2;
      if ((ref = document.getElementsByTagName('atom-workspace')[0]) != null) {
        if ((ref1 = ref.classList) != null) {
          ref1.remove('atomic-emacs');
        }
      }
      if ((ref2 = this.disposable) != null) {
        ref2.dispose();
      }
      this.disposable = null;
      return KillRing.global.reset();
    }
  };

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL2hvbWUvamFrZS8uYXRvbS9wYWNrYWdlcy9hdG9taWMtZW1hY3MvbGliL2F0b21pYy1lbWFjcy5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFBQSxNQUFBOztFQUFDLHNCQUF1QixPQUFBLENBQVEsTUFBUjs7RUFDeEIsV0FBQSxHQUFjLE9BQUEsQ0FBUSxnQkFBUjs7RUFDZCxXQUFBLEdBQWMsT0FBQSxDQUFRLGdCQUFSOztFQUNkLFFBQUEsR0FBVyxPQUFBLENBQVEsYUFBUjs7RUFDWCxJQUFBLEdBQU8sT0FBQSxDQUFRLFFBQVI7O0VBQ1AsS0FBQSxHQUFRLE9BQUEsQ0FBUSxTQUFSOztFQUVSLGFBQUEsR0FBZ0IsU0FBQyxLQUFEO1dBQ2QsS0FBSyxDQUFDLGFBQU4sQ0FBb0IsS0FBcEI7RUFEYzs7RUFHaEIsWUFBQSxHQUFlLFNBQUMsS0FBRDtBQUNiLFFBQUE7SUFBQSxJQUFJLENBQUMsaUJBQUwsQ0FBQTtJQUVBLElBQUcsS0FBSyxDQUFDLFlBQU4sQ0FBQSxDQUFIO01BQ0UsV0FBQSxHQUFjLFNBQUEsQ0FBVSxLQUFWO0FBQ2Q7QUFBQSxXQUFBLHFDQUFBOztRQUNFLFdBQVcsQ0FBQyxZQUFaLENBQUE7QUFERixPQUZGOztXQUtBLEtBQUssQ0FBQyxZQUFOLENBQW1CLEtBQW5CO0VBUmE7O0VBVWYsU0FBQSxHQUFZLFNBQUMsS0FBRDtBQUVWLFFBQUE7SUFBQSxzQ0FBZSxDQUFFLGlCQUFqQjtNQUNFLE1BQUEsR0FBUyxLQUFLLENBQUMsTUFBTSxDQUFDLFFBQWIsQ0FBQSxFQURYO0tBQUEsTUFBQTtNQUdFLE1BQUEsR0FBUyxJQUFJLENBQUMsU0FBUyxDQUFDLG1CQUFmLENBQUEsRUFIWDs7V0FJQSxXQUFXLEVBQUMsR0FBRCxFQUFYLENBQWdCLE1BQWhCO0VBTlU7O0VBUVosZUFBQSxHQUFrQixTQUFDLEtBQUQ7QUFDaEIsUUFBQTtJQUFBLFVBQUEsR0FBYSxJQUFJLENB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QTRCLFNBQUMsS0FBRDtpQkFBVyxTQUFBLENBQVUsS0FBVixDQUFnQixDQUFDLFVBQWpCLENBQUE7UUFBWCxDQTNDNUI7UUE0Q0Esd0JBQUEsRUFBMEIsU0FBQyxLQUFEO2lCQUFXLFNBQUEsQ0FBVSxLQUFWLENBQWdCLENBQUMsUUFBakIsQ0FBQTtRQUFYLENBNUMxQjtRQStDQSxnQ0FBQSxFQUFrQyxTQUFDLEtBQUQ7aUJBQVcsZUFBQSxDQUFnQixLQUFoQjtRQUFYLENBL0NsQztRQWdEQSxhQUFBLEVBQWUsU0FBQyxLQUFEO2lCQUFXLFNBQUEsQ0FBVSxLQUFWLENBQWdCLENBQUMsWUFBakIsQ0FBQTtRQUFYLENBaERmO09BRmMsQ0FBaEI7SUFOUSxDQU5WO0lBZ0VBLFVBQUEsRUFBWSxTQUFBO0FBQ1YsVUFBQTs7O2NBQTZELENBQUUsTUFBL0QsQ0FBc0UsY0FBdEU7Ozs7WUFDVyxDQUFFLE9BQWIsQ0FBQTs7TUFDQSxJQUFDLENBQUEsVUFBRCxHQUFjO2FBQ2QsUUFBUSxDQUFDLE1BQU0sQ0FBQyxLQUFoQixDQUFBO0lBSlUsQ0FoRVo7O0FBcENGIiwic291cmNlc0NvbnRlbnQiOlsie0NvbXBvc2l0ZURpc3Bvc2FibGV9ID0gcmVxdWlyZSAnYXRvbSdcbkVtYWNzQ3Vyc29yID0gcmVxdWlyZSAnLi9lbWFjcy1jdXJzb3InXG5FbWFjc0VkaXRvciA9IHJlcXVpcmUgJy4vZW1hY3MtZWRpdG9yJ1xuS2lsbFJpbmcgPSByZXF1aXJlICcuL2tpbGwtcmluZydcbk1hcmsgPSByZXF1aXJlICcuL21hcmsnXG5TdGF0ZSA9IHJlcXVpcmUgJy4vc3RhdGUnXG5cbmJlZm9yZUNvbW1hbmQgPSAoZXZlbnQpIC0+XG4gIFN0YXRlLmJlZm9yZUNvbW1hbmQoZXZlbnQpXG5cbmFmdGVyQ29tbWFuZCA9IChldmVudCkgLT5cbiAgTWFyay5kZWFjdGl2YXRlUGVuZGluZygpXG5cbiAgaWYgU3RhdGUueWFua0NvbXBsZXRlKClcbiAgICBlbWFjc0VkaXRvciA9IGdldEVkaXRvcihldmVudClcbiAgICBmb3IgZW1hY3NDdXJzb3IgaW4gZW1hY3NFZGl0b3IuZ2V0RW1hY3NDdXJzb3JzKClcbiAgICAgIGVtYWNzQ3Vyc29yLnlhbmtDb21wbGV0ZSgpXG5cbiAgU3RhdGUuYWZ0ZXJDb21tYW5kKGV2ZW50KVxuXG5nZXRFZGl0b3IgPSAoZXZlbnQpIC0+XG4gICMgR2V0IGVkaXRvciBmcm9tIHRoZSBldmVudCBpZiBwb3NzaWJsZSBzbyB3ZSBjYW4gdGFyZ2V0IG1pbmktZWRpdG9ycy5cbiAgaWYgZXZlbnQudGFyZ2V0Py5nZXRNb2RlbFxuICAgIGVkaXRvciA9IGV2ZW50LnRhcmdldC5nZXRNb2RlbCgpXG4gIGVsc2VcbiAgICBlZGl0b3IgPSBhdG9tLndvcmtzcGFjZS5nZXRBY3RpdmVUZXh0RWRpdG9yKClcbiAgRW1hY3NFZGl0b3IuZm9yKGVkaXRvcilcblxuY2xvc2VPdGhlclBhbmVzID0gKGV2ZW50KSAtPlxuICBhY3RpdmVQYW5lID0gYXRvbS53b3Jrc3BhY2UuZ2V0QWN0aXZlUGFuZSgpXG4gIHJldHVybiBpZiBub3QgYWN0aXZlUGFuZVxuICBmb3IgcGFuZSBpbiBhdG9tLndvcmtzcGFjZS5nZXRQYW5lcygpXG4gICAgdW5sZXNzIHBhbmUgaXMgYWN0aXZlUGFuZVxuICAgICAgcGFuZS5jbG9zZSgpXG5cbm1vZHVsZS5leHBvcnRzID1cbiAgRW1hY3NDdXJzb3I6IEVtYWNzQ3Vyc29yXG4gIEVtYWNzRWRpdG9yOiBFbWFjc0VkaXRvclxuICBLaWxsUmluZzogS2lsbFJpbmdcbiAgTWFyazogTWFya1xuICBTdGF0ZTogU3RhdGVcblxuICBhY3RpdmF0ZTogLT5cbiAgICBTdGF0ZS5pbml0aWFsaXplKClcbiAgICBkb2N1bWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZSgnYXRvbS13b3Jrc3BhY2UnKVswXT8uY2xhc3NMaXN0Py5hZGQoJ2F0b21pYy1lbWFjcycpXG4gICAgQGRpc3Bvc2FibGUgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZVxuICAgIEBkaXNwb3NhYmxlLmFkZCBhdG9tLmNvbW1hbmRzLm9uV2lsbERpc3BhdGNoIChldmVudCkgLT4gYmVmb3JlQ29tbWFuZChldmVudClcbiAgICBAZGlzcG9zYWJsZS5hZGQgYXRvbS5jb21tYW5kcy5vbkRpZERpc3BhdGNoIChldmVudCkgLT4gYWZ0ZXJDb21tYW5kKGV2ZW50KVxuICAgIEBkaXNwb3NhYmxlLmFkZCBhdG9tLmNvbW1hbmRzLmFkZCAnYXRvbS10ZXh0LWVkaXRvcicsXG4gICAgICAjIE5hdmlnYXRpb25cbiAgICAgIFwiYXRvbWljLWVtYWNzOmJhY2t3YXJkLWNoYXJcIjogKGV2ZW50KSAtPiBnZXRFZGl0b3IoZXZlbnQpLmJhY2t3YXJkQ2hhcigpXG4gICAgICBcImF0b21pYy1lbWFjczpmb3J3YXJkLWNoYXJcIjogKGV2ZW50KSAtPiBnZXRFZGl0b3IoZXZlbnQpLmZvcndhcmRDaGFyKClcbiAgICAgIFwiYXRvbWljLWVtYWNzOmJhY2t3YXJkLXdvcmRcIjogKGV2ZW50KSAtPiBnZXRFZGl0b3IoZXZlbnQpLmJhY2t3YXJkV29yZCgpXG4gICAgICBcImF0b21pYy1lbWFjczpmb3J3YXJkLXdvcmRcIjogKGV2ZW50KSAtPiBnZXRFZGl0b3IoZXZlbnQpLmZvcndhcmRXb3JkKClcbiAgICAgIFwiYXRvbWljLWVtYWNzOmJhY2t3YXJkLXNleHBcIjogKGV2ZW50KSAtPiBnZXRFZGl0b3IoZXZlbnQpLmJhY2t3YXJkU2V4cCgpXG4gICAgICBcImF0b21pYy1lbWFjczpmb3J3YXJkLXNleHBcIjogKGV2ZW50KSAtPiBnZXRFZGl0b3IoZXZlbnQpLmZvcndhcmRTZXhwKClcbiAgICAgIFwiYXRvbWljLWVtYWNzOnByZXZpb3VzLWxpbmVcIjogKGV2ZW50KSAtPiBnZXRFZGl0b3IoZXZlbnQpLnByZXZpb3VzTGluZSgpXG4gICAgICBcImF0b21pYy1lbWFjczpuZXh0LWxpbmVcIjogKGV2ZW50KSAtPiBnZXRFZGl0b3IoZXZlbnQpLm5leHRMaW5lKClcbiAgICAgIFwiYXRvbWljLWVtYWNzOmJhY2t3YXJkLXBhcmFncmFwaFwiOiAoZXZlbnQpIC0+IGdldEVkaXRvcihldmVudCkuYmFja3dhcmRQYXJhZ3JhcGgoKVxuICAgICAgXCJhdG9taWMtZW1hY3M6Zm9yd2FyZC1wYXJhZ3JhcGhcIjogKGV2ZW50KSAtPiBnZXRFZGl0b3IoZXZlbnQpLmZvcndhcmRQYXJhZ3JhcGgoKVxuICAgICAgXCJhdG9taWMtZW1hY3M6YmFjay10by1pbmRlbnRhdGlvblwiOiAoZXZlbnQpIC0+IGdldEVkaXRvcihldmVudCkuYmFja1RvSW5kZW50YXRpb24oKVxuXG4gICAgICAjIEtpbGxpbmcgJiBZYW5raW5nXG4gICAgICBcImF0b21pYy1lbWFjczpiYWNrd2FyZC1raWxsLXdvcmRcIjogKGV2ZW50KSAtPiBnZXRFZGl0b3IoZXZlbnQpLmJhY2t3YXJkS2lsbFdvcmQoKVxuICAgICAgXCJhdG9taWMtZW1hY3M6a2lsbC13b3JkXCI6IChldmVudCkgLT4gZ2V0RWRpdG9yKGV2ZW50KS5raWxsV29yZCgpXG4gICAgICBcImF0b21pYy1lbWFjczpraWxsLWxpbmVcIjogKGV2ZW50KSAtPiBnZXRFZGl0b3IoZXZlbnQpLmtpbGxMaW5lKClcbiAgICAgIFwiYXRvbWljLWVtYWNzOmtpbGwtcmVnaW9uXCI6IChldmVudCkgLT4gZ2V0RWRpdG9yKGV2ZW50KS5raWxsUmVnaW9uKClcbiAgICAgIFwiYXRvbWljLWVtYWNzOmNvcHktcmVnaW9uLWFzLWtpbGxcIjogKGV2ZW50KSAtPiBnZXRFZGl0b3IoZXZlbnQpLmNvcHlSZWdpb25Bc0tpbGwoKVxuICAgICAgXCJhdG9taWMtZW1hY3M6YXBwZW5kLW5leHQta2lsbFwiOiAoZXZlbnQpIC0+IFN0YXRlLmtpbGxlZCgpXG4gICAgICBcImF0b21pYy1lbWFjczp5YW5rXCI6IChldmVudCkgLT4gZ2V0RWRpdG9yKGV2ZW50KS55YW5rKClcbiAgICAgIFwiYXRvbWljLWVtYWNzOnlhbmstcG9wXCI6IChldmVudCkgLT4gZ2V0RWRpdG9yKGV2ZW50KS55YW5rUG9wKClcbiAgICAgIFwiYXRvbWljLWVtYWNzOnlhbmstc2hpZnRcIjogKGV2ZW50KSAtPiBnZXRFZGl0b3IoZXZlbnQpLnlhbmtTaGlmdCgpXG5cbiAgICAgICMgRWRpdGluZ1xuICAgICAgXCJhdG9taWMtZW1hY3M6ZGVsZXRlLWhvcml6b250YWwtc3BhY2VcIjogKGV2ZW50KSAtPiBnZXRFZGl0b3IoZXZlbnQpLmRlbGV0ZUhvcml6b250YWxTcGFjZSgpXG4gICAgICBcImF0b21pYy1lbWFjczpkZWxldGUtaW5kZW50YXRpb25cIjogKGV2ZW50KSAtPiBnZXRFZGl0b3IoZXZlbnQpLmRlbGV0ZUluZGVudGF0aW9uKClcbiAgICAgIFwiYXRvbWljLWVtYWNzOm9wZW4tbGluZVwiOiAoZXZlbnQpIC0+IGdldEVkaXRvcihldmVudCkub3BlbkxpbmUoKVxuICAgICAgXCJhdG9taWMtZW1hY3M6anVzdC1vbmUtc3BhY2VcIjogKGV2ZW50KSAtPiBnZXRFZGl0b3IoZXZlbnQpLmp1c3RPbmVTcGFjZSgpXG4gICAgICBcImF0b21pYy1lbWFjczp0cmFuc3Bvc2UtY2hhcnNcIjogKGV2ZW50KSAtPiBnZXRFZGl0b3IoZXZlbnQpLnRyYW5zcG9zZUNoYXJzKClcbiAgICAgIFwiYXRvbWljLWVtYWNzOnRyYW5zcG9zZS1saW5lc1wiOiAoZXZlbnQpIC0+IGdldEVkaXRvcihldmVudCkudHJhbnNwb3NlTGluZXMoKVxuICAgICAgXCJhdG9taWMtZW1hY3M6dHJhbnNwb3NlLXdvcmRzXCI6IChldmVudCkgLT4gZ2V0RWRpdG9yKGV2ZW50KS50cmFuc3Bvc2VXb3JkcygpXG4gICAgICBcImF0b21pYy1lbWFjczpkb3duY2FzZS13b3JkLW9yLXJlZ2lvblwiOiAoZXZlbnQpIC0+IGdldEVkaXRvcihldmVudCkuZG93bmNhc2VXb3JkT3JSZWdpb24oKVxuICAgICAgXCJhdG9taWMtZW1hY3M6dXBjYXNlLXdvcmQtb3ItcmVnaW9uXCI6IChldmVudCkgLT4gZ2V0RWRpdG9yKGV2ZW50KS51cGNhc2VXb3JkT3JSZWdpb24oKVxuICAgICAgXCJhdG9taWMtZW1hY3M6Y2FwaXRhbGl6ZS13b3JkLW9yLXJlZ2lvblwiOiAoZXZlbnQpIC0+IGdldEVkaXRvcihldmVudCkuY2FwaXRhbGl6ZVdvcmRPclJlZ2lvbigpXG5cbiAgICAgICMgTWFya2luZyAmIFNlbGVjdGluZ1xuICAgICAgXCJhdG9taWMtZW1hY3M6c2V0LW1hcmtcIjogKGV2ZW50KSAtPiBnZXRFZGl0b3IoZXZlbnQpLnNldE1hcmsoKVxuICAgICAgXCJhdG9taWMtZW1hY3M6bWFyay1zZXhwXCI6IChldmVudCkgLT4gZ2V0RWRpdG9yKGV2ZW50KS5tYXJrU2V4cCgpXG4gICAgICBcImF0b21pYy1lbWFjczptYXJrLXdob2xlLWJ1ZmZlclwiOiAoZXZlbnQpIC0+IGdldEVkaXRvcihldmVudCkubWFya1dob2xlQnVmZmVyKClcbiAgICAgIFwiYXRvbWljLWVtYWNzOmV4Y2hhbmdlLXBvaW50LWFuZC1tYXJrXCI6IChldmVudCkgLT4gZ2V0RWRpdG9yKGV2ZW50KS5leGNoYW5nZVBvaW50QW5kTWFyaygpXG5cbiAgICAgICMgU2Nyb2xsaW5nXG4gICAgICBcImF0b21pYy1lbWFjczpyZWNlbnRlci10b3AtYm90dG9tXCI6IChldmVudCkgLT4gZ2V0RWRpdG9yKGV2ZW50KS5yZWNlbnRlclRvcEJvdHRvbSgpXG4gICAgICBcImF0b21pYy1lbWFjczpzY3JvbGwtZG93blwiOiAoZXZlbnQpIC0+IGdldEVkaXRvcihldmVudCkuc2Nyb2xsRG93bigpXG4gICAgICBcImF0b21pYy1lbWFjczpzY3JvbGwtdXBcIjogKGV2ZW50KSAtPiBnZXRFZGl0b3IoZXZlbnQpLnNjcm9sbFVwKClcblxuICAgICAgIyBVSVxuICAgICAgXCJhdG9taWMtZW1hY3M6Y2xvc2Utb3RoZXItcGFuZXNcIjogKGV2ZW50KSAtPiBjbG9zZU90aGVyUGFuZXMoZXZlbnQpXG4gICAgICBcImNvcmU6Y2FuY2VsXCI6IChldmVudCkgLT4gZ2V0RWRpdG9yKGV2ZW50KS5rZXlib2FyZFF1aXQoKVxuXG4gIGRlYWN0aXZhdGU6IC0+XG4gICAgZG9jdW1lbnQuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ2F0b20td29ya3NwYWNlJylbMF0/LmNsYXNzTGlzdD8ucmVtb3ZlKCdhdG9taWMtZW1hY3MnKVxuICAgIEBkaXNwb3NhYmxlPy5kaXNwb3NlKClcbiAgICBAZGlzcG9zYWJsZSA9IG51bGxcbiAgICBLaWxsUmluZy5nbG9iYWwucmVzZXQoKVxuIl19
