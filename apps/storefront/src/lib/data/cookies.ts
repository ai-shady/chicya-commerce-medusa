import "server-only"
import { cookies as nextCookies } from "next/headers"

export const getAuthHeaders = async (): Promise<
  { authorization: string } | {}
> => {
  try {
    const cookies = await nextCookies()
    const token = cookies.get("_medusa_jwt")?.value

    if (!token) {
      return {}
    }

    return { authorization: `Bearer ${token}` }
  } catch {
    return {}
  }
}

export const getCacheTag = async (tag: string): Promise<string> => {
  try {
    const cookies = await nextCookies()
    const cacheId = cookies.get("_medusa_cache_id")?.value

    if (!cacheId) {
      return ""
    }

    return `${tag}-${cacheId}`
  } catch (error) {
    return ""
  }
}

export const getCacheOptions = async (
  tag: string
): Promise<{ tags: string[]; revalidate: number } | { revalidate: number }> => {
  if (typeof window !== "undefined") {
    return { revalidate: 300 }
  }

  const cacheTag = await getCacheTag(tag)

  if (!cacheTag) {
    return { revalidate: 300 }
  }

  return { tags: [`${cacheTag}`], revalidate: 300 }
}

// `sameSite: "lax"` rather than `"strict"`: the customer returns from a
// redirect-based payment method (iDEAL, Bancontact, ...) via a cross-site
// top-level navigation. A "strict" cookie is withheld on that navigation, so
// the storefront would see a logged-out, cartless visitor and render a 404 for
// the checkout page instead of resuming the order. "lax" is sent on top-level
// GET navigations while still blocking cross-site subrequests.
export const setAuthToken = async (token: string) => {
  const cookies = await nextCookies()
  cookies.set("_medusa_jwt", token, {
    maxAge: 60 * 60 * 24 * 7,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  })
}

export const removeAuthToken = async () => {
  const cookies = await nextCookies()
  cookies.set("_medusa_jwt", "", {
    maxAge: -1,
  })
}

export const getCartId = async () => {
  const cookies = await nextCookies()
  return cookies.get("_medusa_cart_id")?.value
}

// See the note on `setAuthToken`: `sameSite: "lax"` so the cart cookie survives
// the cross-site return navigation from a redirect-based payment method.
export const setCartId = async (cartId: string) => {
  const cookies = await nextCookies()
  cookies.set("_medusa_cart_id", cartId, {
    maxAge: 60 * 60 * 24 * 7,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  })
}

export const removeCartId = async () => {
  const cookies = await nextCookies()
  cookies.set("_medusa_cart_id", "", {
    maxAge: -1,
  })
}
