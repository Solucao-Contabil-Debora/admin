import * as React from "react"

export const REVEAL_CLASSES =
  "transition-[opacity,transform] duration-500 ease-out data-[reveal=out]:scale-[0.97] data-[reveal=out]:opacity-0 motion-reduce:transition-none motion-reduce:data-[reveal=out]:scale-100 motion-reduce:data-[reveal=out]:opacity-100"

export const REVEAL_ROW_CLASSES =
  "transition-[opacity,transform] duration-500 ease-out data-[reveal=out]:scale-[0.99] data-[reveal=out]:opacity-0 motion-reduce:transition-none motion-reduce:data-[reveal=out]:scale-100 motion-reduce:data-[reveal=out]:opacity-100"

export function canReveal(enabled: boolean): boolean {
  return enabled && typeof IntersectionObserver !== "undefined"
}

type RevealCallback = () => void

const callbacks = new WeakMap<Element, RevealCallback>()
let sharedObserver: IntersectionObserver | null = null

function getObserver(): IntersectionObserver {
  if (!sharedObserver) {
    sharedObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue
          sharedObserver?.unobserve(entry.target)
          callbacks.get(entry.target)?.()
          callbacks.delete(entry.target)
        }
      },
      { threshold: 0.08 }
    )
  }
  return sharedObserver
}

function observeOnce(node: Element, onReveal: RevealCallback): () => void {
  callbacks.set(node, onReveal)
  getObserver().observe(node)
  return () => {
    callbacks.delete(node)
    sharedObserver?.unobserve(node)
  }
}

export function useReveal<T extends HTMLElement>(
  enabled: boolean,
  forwardedRef?: React.ForwardedRef<T>
) {
  const [visible, setVisible] = React.useState(false)
  const nodeRef = React.useRef<T | null>(null)
  const active = canReveal(enabled)

  const setRef = React.useCallback(
    (node: T | null) => {
      nodeRef.current = node
      if (typeof forwardedRef === "function") forwardedRef(node)
      else if (forwardedRef) forwardedRef.current = node
    },
    [forwardedRef]
  )

  React.useEffect(() => {
    const node = nodeRef.current
    if (!active || !node) return
    return observeOnce(node, () => setVisible(true))
  }, [active])

  return {
    setRef,
    active,
    revealState: active ? (visible ? "in" : "out") : undefined,
  }
}
