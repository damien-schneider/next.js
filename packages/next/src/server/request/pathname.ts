import type { WorkStore } from '../app-render/work-async-storage.external'

import {
  workUnitAsyncStorage,
  type PrerenderStore,
} from '../app-render/work-unit-async-storage.external'
import { makeHangingPromise } from '../dynamic-rendering-utils'
import { InvariantError } from '../../shared/lib/invariant-error'

export function createServerPathnameForMetadata(
  underlyingPathname: string,
  workStore: WorkStore
): Promise<string> {
  const workUnitStore = workUnitAsyncStorage.getStore()
  if (workUnitStore) {
    switch (workUnitStore.type) {
      case 'prerender':
      case 'prerender-client':
      case 'prerender-legacy': {
        return createPrerenderPathname(
          underlyingPathname,
          workStore,
          workUnitStore satisfies PrerenderStore
        )
      }
      case 'request':
      case 'cache':
      case 'unstable-cache':
        break
      default:
        workUnitStore satisfies never
    }
  }
  return createRenderPathname(underlyingPathname)
}

function createPrerenderPathname(
  underlyingPathname: string,
  workStore: WorkStore,
  prerenderStore: PrerenderStore
): Promise<string> {
  const fallbackParams = workStore.fallbackRouteParams
  if (fallbackParams && fallbackParams.size > 0) {
    switch (prerenderStore.type) {
      case 'prerender':
        return makeHangingPromise<string>(
          prerenderStore.renderSignal,
          '`pathname`'
        )
      case 'prerender-client':
        throw new InvariantError(
          'createPrerenderPathname was called inside a client component scope.'
        )
      case 'prerender-legacy':
        // NOTE: This is technically incorrect, but this will be addressed in
        // future work that removes the metadata and transitions this entirely
        // to a client component.
        return Promise.resolve(underlyingPathname)
      default:
        prerenderStore satisfies never
    }
  }

  // We don't have any fallback params so we have an entirely static safe params object
  return Promise.resolve(underlyingPathname)
}

function createRenderPathname(underlyingPathname: string): Promise<string> {
  return Promise.resolve(underlyingPathname)
}
