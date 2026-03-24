/** View Transitions API — not always present in TypeScript's DOM lib */
export type ViewTransition = {
  finished: Promise<void>
  ready: Promise<void>
  updateCallbackDone: Promise<void>
  skipTransition: () => void
}

type DocumentWithViewTransition = Document & {
  startViewTransition?: (
    updateCallback: () => void | Promise<unknown>
  ) => ViewTransition
}

export function startViewTransitionIfSupported(
  updateCallback: () => void | Promise<unknown>
): ViewTransition | undefined {
  const doc = document as DocumentWithViewTransition
  return doc.startViewTransition?.(updateCallback)
}
