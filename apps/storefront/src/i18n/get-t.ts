import { Dictionary, t as translate } from "./config"
import { getDictionaryForCode } from "./dictionaries"

export type TFunc = (
  key: string,
  vars?: Record<string, string | number>
) => string

/**
 * `dict` is typed as `any` on purpose: it is a data tree of nested objects and
 * arrays that components index dynamically. `Dictionary` still validates the
 * `en`/`zh` literals, and `t()` is the typed accessor for strings.
 */
export function getT(localeCode: string): { t: TFunc; dict: any } {
  const dict = getDictionaryForCode(localeCode)
  return {
    t: (key, vars) => translate(dict, key, vars),
    dict,
  }
}