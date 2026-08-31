"use client";

import { H, P, Pull, TrayBugDiagram, FocusDiagram } from "./shared";

export function MacosTrayPost() {
  return (
    <>
      <P>
        useagent is a menu-bar app. Its entire job is to put your agent usage
        one click away. So it was a problem that the one thing it had to do -
        open a little popover on click - simply did not happen. The tray icon
        sat there. Clicking it did nothing. Even the debug logs stayed silent.
      </P>
      <P>
        The first suspect was my code. It wasn't. The second was the toolchain.
        It wasn't either. The bug lived somewhere in the collision between a
        native API, a menu, and the operating system.
      </P>

      <H>The menu swallows the click</H>
      <P>
        The naive setup is: build a tray icon, attach a menu to it, and listen
        for click events so the popover opens on left-click. On most platforms
        this is fine. On macOS, the tray is an{" "}
        <code>NSStatusItem</code>, and AppKit decides that a status item with an
        attached menu should handle all mouse interaction itself.
      </P>
      <P>
        The click never reaches your handler. The menu pops instead. Every{" "}
        <code>on_tray_icon_event</code> callback stays dead - which is why my
        "click the icon and I'll read the log" plan produced rows of nothing.
      </P>
      <TrayBugDiagram />
      <Pull label="The real finding">
        On macOS, attaching a menu makes the status item intercept all mouse
        events. Setting <code>show_menu_on_left_click(false)</code> does not
        help.
      </Pull>
      <P>
        The fix was to stop fighting the platform. No native menu at all;{" "}
        <code>Quit</code> and <code>Refresh</code> moved into the popover UI. It
        added a command and a button instead of a contradiction.
      </P>

      <H>The popover flashes and dies</H>
      <P>
        With the menu gone, the click registered and the popover opened - for
        about a frame. It would appear and instantly vanish. The log told the
        story: <code>show_popover</code> followed by <code>Focused(true)</code>,
        then <code>Focused(false)</code>, then my own blur handler calling{" "}
        <code>hide</code>.
      </P>
      <P>
        A menu-bar app runs as an <em>Accessory</em> app - no Dock icon, no
        activation rights. macOS simply won't let a window from an accessory
        app hold focus, so the window blur fired immediately, and the "hide on
        blur" handler (correct in every other edge case) closed it before
        anyone saw it.
      </P>
      <FocusDiagram />
      <Pull>
        The window showed, lost focus, and closed - all before a single frame.
        The blur-to-hide handler was right; the app's activation policy was the
        problem.
      </Pull>
      <P>
        The fix is a temporary promotion. Open the popover and briefly switch
        to the <code>Regular</code> activation policy so the window can stay
        frontmost; on close, drop back to <code>Accessory</code>. A Dock icon
        does flash while the popover is open - that is the mechanism, on
        purpose, and it disappears on close.
      </P>

      <H>Why the same code worked on one Mac and not another</H>
      <P>
        After fixing it on my machine, the original code ran fine on a second
        MacBook. Identical toolchain. Identical tauri, tao, and wry versions.
        The difference was the macOS major version - 26 vs 27 - and how each
        release treats a status item with an attached menu.
      </P>
      <P>
        There was no single fix that made one codebase behave identically
        everywhere. The honest answer is the popover-only approach, which works
        on both, and a brief note in the repo about the behavior difference.
        The lesson: a "portable" API is only portable up to the point the
        platform decides otherwise.
      </P>
      <Pull label="Lesson">
        When a native API stops behaving, look at the layer underneath you are
        leaning on - policy, tracking, activation - before you rewrite your own
        code.
      </Pull>
      <P>
        Months later the opening fix is still the unglamorous one: ship fewer
        moving parts, put the controls where the user is, and let the platform
        have the corner it insists on owning.
      </P>
    </>
  );
}
