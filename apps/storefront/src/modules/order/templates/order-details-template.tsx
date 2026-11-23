"use client"

import { XMark } from "@medusajs/icons"
import { HttpTypes } from "@medusajs/types"
import { useT } from "@i18n/use-t"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import Help from "@modules/order/components/help"
import Items from "@modules/order/components/items"
import OrderDetails from "@modules/order/components/order-details"
import OrderSummary from "@modules/order/components/order-summary"
import ShippingDetails from "@modules/order/components/shipping-details"
import React from "react"

type OrderDetailsTemplateProps = {
  order: HttpTypes.StoreOrder
  locale: string
}

const OrderDetailsTemplate: React.FC<OrderDetailsTemplateProps> = ({
  order,
  locale,
}) => {
  const { t } = useT()

  return (
    <div className="flex flex-col justify-center gap-y-4">
      <div className="flex gap-2 justify-between items-center">
        <h1 className="text-2xl-semi">{t("order.orderDetails")}</h1>
        <LocalizedClientLink
          href="/account/orders"
          className="flex gap-2 items-center text-ui-fg-subtle hover:text-ui-fg-base"
          data-testid="back-to-overview-button"
        >
          <XMark /> {t("order.backToOverview")}
        </LocalizedClientLink>
      </div>
      <div
        className="flex flex-col gap-4 h-full bg-white w-full"
        data-testid="order-details-container"
      >
        <OrderDetails order={order} showStatus locale={locale} />
        <Items order={order} />
        <ShippingDetails order={order} locale={locale} />
        <OrderSummary order={order} locale={locale} />
        <Help locale={locale} />
      </div>
    </div>
  )
}

export default OrderDetailsTemplate
