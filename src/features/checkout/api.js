import { requireSupabase } from '../../lib/supabase'

export const PAYMENT_METHODS = ['bkash', 'nagad', 'rocket', 'bank_card']

export async function placeCustomerOrder({
  addressId,
  paymentMethod,
  paymentAccountReference,
  transactionNumber,
}) {
  if (!PAYMENT_METHODS.includes(paymentMethod)) {
    throw new Error('Choose a valid payment method.')
  }
  const reference = transactionNumber.trim()
  if (!reference || reference.length > 120) {
    throw new Error('Enter a transaction/reference number (up to 120 characters).')
  }
  const accountReference = paymentAccountReference.trim()
  const isBankCard = paymentMethod === 'bank_card'
  if (
    isBankCard
      ? !/^\d{4}$/.test(accountReference)
      : !/^(01[3-9]\d{8}|\+?8801[3-9]\d{8})$/.test(accountReference)
  ) {
    throw new Error(
      isBankCard
        ? 'Enter only the last 4 digits of your card.'
        : 'Enter a valid mobile number used to send the payment.',
    )
  }

  const client = await requireSupabase()
  const { data, error } = await client.rpc('place_customer_order', {
    p_shipping_address_id: addressId,
    p_payment_method: paymentMethod,
    p_transaction_number: reference,
    p_payment_account_reference: accountReference,
  })
  if (error) {
    if (error.code === 'PGRST202') {
      throw new Error(
        'Checkout is not enabled in this Supabase project yet. Run the latest supabase_checkout.sql in its SQL Editor, then retry.',
      )
    }
    throw error
  }
  if (!data?.id || !data?.order_number) {
    throw new Error('Your order could not be confirmed. Please contact support before trying again.')
  }
  return data
}

export async function getCheckoutQuote(addressId = null) {
  const client = await requireSupabase()
  const { data, error } = await client.rpc('get_customer_checkout_quote', {
    p_shipping_address_id: addressId || null,
  })
  if (error) throw error
  return data
}

export async function getCustomerOrderConfirmation(orderId, userId) {
  const client = await requireSupabase()
  const { data: order, error: orderError } = await client
    .from('orders')
    .select('id,order_number,total_amount,discount_amount,shipping_charge,net_amount,status,payment_status,payment_method,payment_account_reference,transaction_number,created_at')
    .eq('id', orderId)
    .eq('user_id', userId)
    .maybeSingle()
  if (orderError) throw orderError
  if (!order) return null

  const [itemsResult, addressResult] = await Promise.all([
    client
      .from('order_items')
      .select('id,product_name,price,quantity,total_amount')
      .eq('order_id', orderId),
    client
      .from('order_shipping_addresses')
      .select('full_address,phone_number,state,city,zip_code')
      .eq('order_id', orderId)
      .maybeSingle(),
  ])
  if (itemsResult.error) throw itemsResult.error
  if (addressResult.error) throw addressResult.error
  return {
    ...order,
    items: itemsResult.data ?? [],
    shippingAddress: addressResult.data,
  }
}