"use client"

import {
  Listbox,
  ListboxButton,
  ListboxOption,
  ListboxOptions,
  Transition,
} from "@headlessui/react"
import { Fragment, useEffect, useMemo, useState } from "react"
import ReactCountryFlag from "react-country-flag"

import { StateType } from "@lib/hooks/use-toggle-state"
import { useParams, usePathname } from "next/navigation"
import { HttpTypes } from "@medusajs/types"
import { useT } from "@i18n/use-t"
import {
  DEFAULT_LOCALE_CODE,
  getDefaultLocaleForCountry,
  localeToCountryCode,
} from "@i18n/config"

type CountryOption = {
  country: string
  region: string
  label: string
}

type CountrySelectProps = {
  toggleState: StateType
  regions: HttpTypes.StoreRegion[]
}

const CountrySelect = ({ toggleState, regions }: CountrySelectProps) => {
  const { t } = useT()
  const [current, setCurrent] = useState<CountryOption | undefined>(undefined)

  const params = useParams()
  const locale =
    typeof params?.locale === "string" ? params.locale : DEFAULT_LOCALE_CODE
  const countryCode = localeToCountryCode(locale)
  const currentPath = usePathname().split(`/${locale}`)[1]

  const { state } = toggleState

  const options = useMemo<CountryOption[]>(() => {
    return (regions ?? [])
      .flatMap((region) =>
        (region.countries ?? []).map((country) => ({
          country: country.iso_2 ?? "",
          region: region.id,
          label: country.display_name ?? country.iso_2 ?? "",
        }))
      )
      .filter((option) => option.country)
      .sort((a, b) => a.label.localeCompare(b.label))
  }, [regions])

  useEffect(() => {
    if (countryCode) {
      const option = options?.find((o) => o?.country === countryCode)
      setCurrent(option)
    }
  }, [options, countryCode])

  const handleChange = (option: CountryOption) => {
    window.location.href = `/${getDefaultLocaleForCountry(
      option.country
    )}${currentPath}`
  }

  return (
    <div>
      <Listbox
        as="span"
        onChange={handleChange}
        defaultValue={current}
      >
        <ListboxButton className="py-1 w-full">
          <div className="txt-compact-small flex items-start gap-x-2">
            <span>{t("nav.shippingTo")}</span>
            {current && (
              <span className="txt-compact-small flex items-center gap-x-2">
                {/* @ts-ignore */}
                <ReactCountryFlag
                  svg
                  style={{
                    width: "16px",
                    height: "16px",
                  }}
                  countryCode={current.country ?? ""}
                />
                {current.label}
              </span>
            )}
          </div>
        </ListboxButton>
        <div className="flex relative w-full min-w-[320px]">
          <Transition
            show={state}
            as={Fragment}
            leave="transition ease-in duration-150"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <ListboxOptions
              className="absolute -bottom-[calc(100%-36px)] left-0 xsmall:left-auto xsmall:right-0 max-h-[442px] overflow-y-scroll z-[900] bg-white drop-shadow-md text-small-regular uppercase text-black no-scrollbar rounded-rounded w-full"
              static
            >
              {options?.map((o, index) => {
                return (
                  <ListboxOption
                    key={index}
                    value={o}
                    className="py-2 hover:bg-gray-200 px-3 cursor-pointer flex items-center gap-x-2"
                  >
                    {/* @ts-ignore */}
                    <ReactCountryFlag
                      svg
                      style={{
                        width: "16px",
                        height: "16px",
                      }}
                      countryCode={o?.country ?? ""}
                    />{" "}
                    {o?.label}
                  </ListboxOption>
                )
              })}
            </ListboxOptions>
          </Transition>
        </div>
      </Listbox>
    </div>
  )
}

export default CountrySelect
