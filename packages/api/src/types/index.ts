import { MonitorStatSummarySchema } from '@httpmon/db'
import Stripe from 'stripe'
import S from 'fluent-json-schema'

export const ParamsSchema = S.object().prop('id', S.string())
export type Params = {
  id: string
}
export const NotificationEmailsParamsSchema = S.object().prop('status', S.string())
export type NotificationEmailsParams = {
  status: string
}

export const PublicStatusPageSchema = S.object()
  .prop('id', S.string())
  .prop('createdAt', S.string())
  .prop('accountId', S.string())
  .prop('name', S.string())
  .prop('url', S.string())
  .prop('logoUrl', S.string())
  .prop('siteUrl', S.string())
  .prop('monitors', S.array().items(MonitorStatSummarySchema))

export const PaymentCardSchema = S.object()
  .prop('id', S.string())
  .prop(
    'card',
    S.object()
      .prop('brand', S.string())
      .prop('type', S.string())
      .prop('country', S.string())
      .prop('exp_month', S.number())
      .prop('exp_year', S.number())
      .prop('last4', S.string())
  )

export const AddPaymentMethodSchema = S.object().prop('paymentMethodId', S.string())

export type AddPaymentMethod = {
  paymentMethodId: string
}

export type CreatePrepaidPlan = {
  amount: number
  limit: number
  plan: Stripe.PriceCreateParams.Recurring.Interval
  billing_start: number
}

export const CreatePrepaidPlanSchema = S.object()
  .prop('amount', S.number())
  .prop('limit', S.number())
  .prop('plan', S.string())
  .prop('billing_start', S.number())
