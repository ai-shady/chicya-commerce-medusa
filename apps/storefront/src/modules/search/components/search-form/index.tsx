import { clx } from "@medusajs/ui"

import { getT } from "@i18n/get-t"

type SearchFormProps = {
  locale: string
  defaultValue?: string
  className?: string
}

/** Plain GET form so search works without JavaScript and for browser agents. */
const SearchForm = async ({
  locale,
  defaultValue,
  className,
}: SearchFormProps) => {
  const { t } = await getT(locale)

  return (
    <form
      role="search"
      method="get"
      action={`/${locale}/search`}
      className={clx("flex gap-2", className)}
      {...{
        toolname: "search_products",
        tooldescription: "Search the store's products by keyword",
      }}
    >
      <label htmlFor="search-q" className="sr-only">
        {t("search.placeholder")}
      </label>
      <input
        id="search-q"
        type="search"
        name="q"
        defaultValue={defaultValue}
        placeholder={t("search.placeholder")}
        className="flex-1 h-10 px-4 border border-ui-border-base bg-ui-bg-field txt-compact-medium"
      />
      <button
        type="submit"
        className="h-10 px-4 bg-black text-white uppercase tracking-[0.2em] text-xs hover:bg-gray-800"
      >
        {t("search.submit")}
      </button>
    </form>
  )
}

export default SearchForm
