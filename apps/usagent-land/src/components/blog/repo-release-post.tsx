"use client";

import { H, P, Pull, PipelineDiagram, ChangesetDiagram } from "./shared";

const GITHUB_URL = "https://github.com/vatsa31/usagent";

export function RepoReleasePost({ cta }: { cta: string }) {
  return (
    <>
      <P>
        useagent started as a single Tauri app. It grew into a small monorepo
        with two packages - the native app itself and a TanStack Start landing
        site - because the two ship on totally different cadences and targets.
        The repo is a pnpm workspace managed by Turborepo, and the interesting
        part is what happens between "commit on main" and "new DMG is somewhere
        on the internet".
      </P>

      <H>The shape of the repo</H>
      <P>
        A <code>pnpm-workspace.yaml</code> with a single <code>apps/*</code>{" "}
        glob, and a <code>turbo.json</code> that knows a build depends on its
        dependencies' builds. Two apps, one install, one task graph. The app
        builds a native bundle; the landing page deploys straight to Cloudflare
        Workers. Keeping them in one repo means a single set of tools and one
        place to coordinate versions.
      </P>
      <ChangesetDiagram />
      <P>
        Versioning is driven by <b>Changesets</b>. You add a small markdown file
        describing a bump, a CI check refuses to merge a PR touching the app
        without one, and on merge a version workflow consumes it. Because the
        native app also carries a version in <code>tauri.conf.json</code>, a
        tiny sync script reads it from the package version and writes it into
        the Tauri config - so one source of truth, nothing drifting.
      </P>

      <H>The release that almost didn't happen</H>
      <P>
        The intent was elegant. Push to main, the version job bumps the version
        and pushes <code>chore: release usagent@vX.Y.Z</code>, then the build
        job runs on a macOS runner, compiles the DMG, and uploads it to R2 while
        attaching it to a GitHub Release.
      </P>
      <PipelineDiagram />
      <P>
        It failed on the very first real run. <em>"Version mismatch: expected
        0.2.2, got 0.2.1."</em> The version job had pushed the bump, but the{" "}
        <i>release</i> workflow, invoked via <code>workflow_call</code>, was
        checking out the commit that triggered it - the pre-bump merge commit -
        then asserting the built version against the wrong tree.
      </P>
      <Pull label="The stale-checkout bug">
        A workflow that runs a few seconds after another has pushed should check
        out the pushed commit, not the original trigger commit.
      </Pull>
      <P>
        The fix is explicit and boring: the version job resolves the bumped
        commit's SHA and passes it as an input, and the release workflow checks
        out exactly that ref. Same as asserting anything else - pin the thing
        you are asserting against. After that, bumps chain automatically and
        the failed-run folklore is a thing of the past.
      </P>

      <H>Then the distribution reality</H>
      <P>
        The pipeline does its job: every merged release compiles, uploads the
        DMG to R2 at <code>s3://usagent/vX.Y.Z/*.dmg</code>, updates a{" "}
        <code>latest.json</code> so the landing page can point at the newest
        build, and attaches the artifact to a GitHub Release for the audit
        trail.
      </P>
      <P>
        The mismatch is Gatekeeper. A free, ad-hoc-signed, un-notarized build
        triggers macOS's "can't verify the developer" warning, and notarization
        requires a paid Apple Developer account. Right-click to Open even
        reports the app "is damaged" because the signature isn't accepted. For
        a tool that reads each user's own local agents, the honest distribution
        path was decided: run it from source.
      </P>
      <Pull>
        The build pipeline still archives every version to R2 - useful later -
        but the primary path for users is the repo, where the app actually runs
        cleanly.
      </Pull>
      <P>
        So the repo does two jobs at once. It is the shipping line for the
        app's own releases, and it is the product's front door - README,
        run-from-source steps, and all. Sometimes the most reliable features
        are the ones the pipeline doesn't have to sign.
      </P>
      <p className="post-cta">
        <a className="button secondary" href={GITHUB_URL} target="_blank" rel="noreferrer">
          {cta} <span>→</span>
        </a>
      </p>
    </>
  );
}
