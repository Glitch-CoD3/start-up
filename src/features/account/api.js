import { requireSupabase } from '../../lib/supabase'

export async function getUserOrders(userId) {
  const client = await requireSupabase()
  const { data: orders, error: ordersError } = await client
    .from('orders')
    .select('id,order_number,total_amount,discount_amount,shipping_charge,net_amount,status,payment_status,payment_method,transaction_number,cancellation_request_status,cancellation_requested_at,created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (ordersError) throw ordersError
  if (!orders?.length) return []
  

  const orderIds = orders.map((order) => order.id)
  const [itemsResult, addressesResult] = await Promise.all([
    client
      .from('order_items')
      .select('id,order_id,product_name,price,discount_amount,quantity,total_amount')
      .in('order_id', orderIds),
    client
      .from('order_shipping_addresses')
      .select('order_id,full_address,phone_number,state,city,zip_code')
      .in('order_id', orderIds),
  ])
  if (itemsResult.error) throw itemsResult.error
  if (addressesResult.error) throw addressesResult.error

  const itemsByOrder = new Map()
  for (const item of itemsResult.data ?? []) {
    const orderItems = itemsByOrder.get(item.order_id) ?? []
    orderItems.push(item)
    itemsByOrder.set(item.order_id, orderItems)
  }

  const addressesByOrder = new Map(
    (addressesResult.data ?? []).map((address) => [address.order_id, address]),
  )

  return orders.map((order) => ({
    ...order,
    items: itemsByOrder.get(order.id) ?? [],
    shippingAddress: addressesByOrder.get(order.id) ?? null,
  }))
}

export async function requestOrderCancellation(orderId) {
  const client = await requireSupabase()
  const { data, error } = await client.rpc('request_order_cancellation', {
    p_order_id: orderId,
  })
  if (error) throw error
  return data
}



export async function getUserAddresses(userId) {
  const client = await requireSupabase()
  const { data, error } = await client
    .from('shipping_addresses')
    .select('id,full_address,phone_number,city,state,zip_code,is_default,created_at')
    .eq('user_id', userId)
    .order('is_default', { ascending: false })
    .order('created_at', { ascending: false })

  if (error) throw error
  return data ?? []
}



export async function saveUserAddress(userId, address) {
  const client = await requireSupabase()
  const { id, ...fields } = address
  const request = id
    ? client.from('shipping_addresses').update(fields).eq('id', id).eq('user_id', userId)
    : client.from('shipping_addresses').insert({ ...fields, user_id: userId })
  const { data, error } = await request
    .select('id,full_address,phone_number,city,state,zip_code,is_default,created_at')
    .single()

  if (error) throw error
  return data
}


export async function deleteUserAddress(userId, addressId) {
  const client = await requireSupabase()
  const { error } = await client
    .from('shipping_addresses')
    .delete()
    .eq('id', addressId)
    .eq('user_id', userId)

  if (error) throw error
}

export async function getCustomerQueries() {
  const client = await requireSupabase()
  const { data, error } = await client.rpc('get_my_customer_queries')
  if (error) throw error
  return data ?? []
}

export async function submitCustomerQuery(subject, message) {
  const cleanSubject = subject.trim()
  const cleanMessage = message.trim()
  if (!cleanSubject || cleanSubject.length > 160) {
    throw new Error('Subject must contain 1 to 160 characters.')
  }
  if (!cleanMessage || cleanMessage.length > 5000) {
    throw new Error('Message must contain 1 to 5000 characters.')
  }

  const client = await requireSupabase()
  const { data, error } = await client.rpc('submit_customer_query', {
    p_subject: cleanSubject,
    p_message: cleanMessage,
  })
  if (error) throw error
  return data
}