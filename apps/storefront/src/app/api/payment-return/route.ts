import { sdk } from "@lib/config"
import { placeOrder } from "@lib/data/cart"
import { getAuthHeaders, setCartId } from "@lib/data/cookies"
import { HttpTypes } from "@medusajs/types"
import { unstable_rethrow } from "next/navigation"
import { NextRequest, NextResponse } from "next/server"

// The storefront is locale-prefixed (`/en-US/...`), so the return URL carries
// the active locale. Only accept a plain locale-looking value: it is spliced
// into the redirect target below.
const isLocale = (value: string) => /^[a-z]{2,3}(-[A-Za-z]{2,4})?$/.test(value)

export async function GET(req: NextRequest) {
  const { origin, searchParams } = req.nextUrl

  const cartId = searchParams.get("cart_id")
  const locale = searchParams.get("locale")
  const paymentIntent = searchParams.get("payment_intent")
  const paymentIntentClientSecret = searchParams.get(
    "payment_intent_client_secret"
  )
  const redirectStatus = searchParams.get("redirect_status")

  // Every redirect below stays on this origin; a missing locale falls back to
  // the unprefixed path so the middleware can resolve the visitor's locale.
  const prefix = locale && isLocale(locale) ? `/${locale}` : ""
  const rejected = () =>
    NextResponse.redirect(`${origin}${prefix}/cart?error=payment_failed`)

  if (!cartId || !paymentIntent || !paymentIntentClientSecret) {
    return rejected()
  }

  const cart = await sdk.client
    .fetch<HttpTypes.StoreCartResponse>(`/store/carts/${cartId}`, {
      method: "GET",
      query: { fields: "payment_collection.payment_sessions.data" },
      headers: { ...(await getAuthHeaders()) },
      cache: "no-store",
    })
    .then(({ cart }) => cart)
    .catch(() => null)

  const paymentSession = cart?.payment_collection?.payment_sessions?.find(
    (session) => session.data?.id === paymentIntent
  )

  if (
    !paymentSession ||
    paymentSession.data?.client_secret !== paymentIntentClientSecret
  ) {
    return rejected()
  }

  await setCartId(cartId)

  // The customer backed out or the bank declined. Stripe puts the PaymentIntent
  // back into `requires_payment_method`, so the Payment Element can mount
  // against it again — return to the payment step and let them retry.
  if (redirectStatus === "failed") {
    const params = new URLSearchParams({ step: "payment" })

    // Forward Stripe's own return parameters so the checkout step can tell how
    // the off-site authorization ended.
    for (const key of [
      "payment_intent",
      "payment_intent_client_secret",
      "redirect_status",
    ]) {
      const value = searchParams.get(key)

      if (value) {
        params.set(key, value)
      }
    }

    return NextResponse.redirect(`${origin}${prefix}/checkout?${params}`)
  }

  try {
    // `placeOrder` redirects to the confirmation page on success, so the code
    // below only runs when the cart did not convert into an order.
    await placeOrder(cartId)
  } catch (error) {
    unstable_rethrow(error)

    return NextResponse.redirect(`${origin}${prefix}/cart?error=order_failed`)
  }

  return NextResponse.redirect(`${origin}${prefix}/cart?error=order_failed`)
}
