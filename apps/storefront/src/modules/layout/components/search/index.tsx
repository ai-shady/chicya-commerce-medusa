"use client"

import { MagnifyingGlass } from "@medusajs/icons"
import { useCallback, useEffect, useRef, useState } from "react"
import type { SearchClient } from "instantsearch.js"
import {
  Configure,
  InstantSearch,
  useHits,
  useInstantSearch,
  useSearchBox,
} from "react-instantsearch"

import { useT } from "@i18n/use-t"
import useSearchSettled from "@lib/hooks/use-search-settled"
import useToggleState from "@lib/hooks/use-toggle-state"
import { PRODUCT_INDEX_NAME, searchClient } from "@lib/search-client"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import SearchDrawer from "./drawer"
import SearchHit, { ProductHit } from "./hit"

const HITS_PER_PAGE = 12
const DEBOUNCE_MS = 250

const SearchPanel = ({ onNavigate }: { onNavigate: () => void }) => {
  const { t } = useT()
  const timer = useRef<number | undefined>(undefined)

  const queryHook = useCallback(
    (nextQuery: string, search: (value: string) => void) => {
      window.clearTimeout(timer.current)
      timer.current = window.setTimeout(() => search(nextQuery), DEBOUNCE_MS)
    },
    []
  )

  const { query, refine } = useSearchBox({ queryHook })
  const { items } = useHits<ProductHit>()
  const { status, error } = useInstantSearch()
  const { isSettled } = useSearchSettled()

  const [inputValue, setInputValue] = useState(query)

  useEffect(() => () => window.clearTimeout(timer.current), [])

  const hasInput = Boolean(inputValue.trim())
  const isPending = inputValue.trim() !== query.trim()
  const hasResults = Boolean(query.trim()) && items.length > 0

  return (
    <>
      <div className="flex items-center gap-x-3 border-b border-ui-border-base px-4">
        <MagnifyingGlass className="shrink-0 text-ui-fg-muted" />
        <input
          type="search"
          value={inputValue}
          onChange={(event) => {
            setInputValue(event.target.value)
            refine(event.target.value)
          }}
          placeholder={t("search.placeholder")}
          aria-label={t("search.placeholder")}
          autoFocus
          className="txt-medium w-full bg-transparent py-4 text-ui-fg-base outline-none placeholder:text-ui-fg-muted"
          data-testid="search-input"
        />
      </div>

      <div className="flex-1 overflow-y-auto">
        {!hasInput ? (
          <p
            className="px-4 py-6 text-center text-ui-fg-muted"
            data-testid="search-empty"
          >
            {t("search.startTyping")}
          </p>
        ) : status === "error" ? (
          <p
            className="px-4 py-6 text-center text-ui-fg-error"
            data-testid="search-error"
          >
            {t("search.error")}
            {error?.message ? `: ${error.message}` : "."}
          </p>
        ) : !isSettled || isPending || !query.trim() ? (
          <p
            className="px-4 py-6 text-center text-ui-fg-muted"
            data-testid="search-loading"
          >
            {t("search.searching")}
          </p>
        ) : hasResults ? (
          <ul className="py-2" data-testid="search-results">
            {items.map((hit) => (
              <SearchHit key={hit.objectID} hit={hit} onNavigate={onNavigate} />
            ))}
          </ul>
        ) : (
          <p
            className="px-4 py-6 text-center text-ui-fg-subtle"
            data-testid="search-no-results"
          >
            {t("search.noResults", { query })}
          </p>
        )}
      </div>
    </>
  )
}

const Search = () => {
  const { t } = useT()
  const { state: isOpen, open, close } = useToggleState()

  return (
    <>
      {/* A real link so search works without JavaScript; with JS it opens the drawer instead. */}
      <LocalizedClientLink
        href="/search"
        onClick={(event: React.MouseEvent) => {
          event.preventDefault()
          open()
        }}
        aria-label={t("search.open")}
        className="flex items-center hover:text-ui-fg-base chicya-link"
        data-testid="nav-search-button"
      >
        <MagnifyingGlass />
      </LocalizedClientLink>

      <SearchDrawer isOpen={isOpen} close={close}>
        <InstantSearch
          indexName={PRODUCT_INDEX_NAME}
          searchClient={searchClient as unknown as SearchClient}
          future={{ preserveSharedStateOnUnmount: true }}
        >
          <Configure hitsPerPage={HITS_PER_PAGE} />
          <SearchPanel onNavigate={close} />
        </InstantSearch>
      </SearchDrawer>
    </>
  )
}

export default Search
