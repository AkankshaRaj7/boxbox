/**
 * Page-change speed wipe. It is a CSS animation, so content is visible without
 * JavaScript, and the wipe replays whenever the template remounts on navigation.
 */
export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="page-wipe">{children}</div>;
}
