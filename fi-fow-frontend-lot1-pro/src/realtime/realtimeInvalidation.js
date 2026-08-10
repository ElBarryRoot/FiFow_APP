import { queryKeys } from '../api/queryKeys.js'

const resourceAliases = {
  seller_verification: 'verification',
  seller_verifications: 'verification',
  verification: 'verification',
  verifications: 'verification',
  boost_plan: 'boost-plan',
  boost_plans: 'boost-plan',
  boostplan: 'boost-plan',
  support_ticket: 'support',
  support_tickets: 'support',
  ticket: 'support',
  tickets: 'support',
  conversations: 'conversation',
  messages: 'conversation',
  offers: 'conversation',
  reviews: 'review',
  categories: 'category',
  settings: 'setting',
  payments: 'payment',
  payouts: 'payout',
  boosts: 'boost',
  orders: 'order',
  products: 'product',
  users: 'user',
  reports: 'report',
}

const adminKeysByResource = {
  user: [queryKeys.admin.usersRoot, queryKeys.admin.dashboard],
  product: [queryKeys.admin.productsRoot, queryKeys.admin.dashboard],
  order: [queryKeys.admin.ordersRoot, queryKeys.admin.dashboard],
  payment: [queryKeys.admin.paymentsRoot, queryKeys.admin.ordersRoot, queryKeys.admin.payoutsRoot, queryKeys.admin.dashboard],
  payout: [queryKeys.admin.payoutsRoot, queryKeys.admin.ordersRoot, queryKeys.admin.dashboard],
  boost: [queryKeys.admin.boostsRoot, queryKeys.admin.dashboard],
  'boost-plan': [queryKeys.admin.boostPlansRoot],
  report: [queryKeys.admin.reportsRoot, queryKeys.admin.dashboard],
  review: [queryKeys.admin.reviewsRoot],
  verification: [queryKeys.admin.verificationsRoot, queryKeys.admin.usersRoot, queryKeys.admin.dashboard],
  conversation: [queryKeys.admin.conversationsRoot, queryKeys.admin.dashboard],
  support: [queryKeys.admin.supportRoot],
  category: [queryKeys.admin.categoriesRoot],
  setting: [queryKeys.admin.settings],
}

const clientKeysByResource = {
  order: [queryKeys.orders],
  payment: [queryKeys.payments],
  payout: [queryKeys.orders],
  boost: [queryKeys.boosts, queryKeys.myBoosts()],
  product: [queryKeys.products()],
  verification: [queryKeys.sellerVerification],
  support: [queryKeys.supportTickets()],
}

export const realtimeEvents = [
  'message:new',
  'message:read',
  'offer:new',
  'offer:updated',
  'notification:new',
  'order:updated',
  'payment:updated',
  'payout:updated',
  'boost:updated',
  'admin:resource-updated',
  'admin:dashboard-updated',
]

export function initialRealtimeQueryKeys() {
  return [
    queryKeys.conversationList,
    queryKeys.notificationList,
    queryKeys.notificationPages,
  ]
}

export function queryKeysForRealtimeEvent(event, payload) {
  const keys = []
  const add = (key) => {
    if (Array.isArray(key)) keys.push(key)
  }
  const addMany = (values) => values.forEach(add)
  const data = objectValue(payload?.data)
  const eventResource = resourceFromEvent(event)
  const payloadResources = [
    payload?.resource,
    payload?.entity,
    payload?.entityType,
    payload?.targetType,
    data.resource,
    data.entity,
    data.entityType,
    data.targetType,
    ...resourcesFromIdentifiers(payload, data),
  ]
    .map(normalizeResource)
    .filter(Boolean)

  if (event.startsWith('message:') || event.startsWith('offer:')) {
    add(queryKeys.conversationList)
    addConversationKeys(keys, payload, data)
  }

  if (event === 'notification:new') {
    add(queryKeys.notificationList)
    add(queryKeys.notificationPages)
    addConversationKeys(keys, payload, data)
  }

  if (['order:updated', 'payment:updated', 'payout:updated', 'boost:updated'].includes(event)) {
    add(queryKeys.notificationList)
    add(queryKeys.notificationPages)
  }

  const resources = new Set([eventResource, ...payloadResources].filter(Boolean))
  for (const resource of resources) {
    addMany(adminKeysByResource[resource] || [])
    addMany(clientKeysByResource[resource] || [])
    addResourceDetailKeys(keys, resource, payload, data)
  }

  if (event === 'admin:dashboard-updated') add(queryKeys.admin.dashboard)
  if (event === 'admin:resource-updated' && !resources.size) add(queryKeys.admin.root)

  return uniqueQueryKeys(keys)
}

function addConversationKeys(keys, payload, data) {
  const conversationId = firstString(
    payload?.conversationId,
    payload?.id && isConversationEvent(payload) ? payload.id : undefined,
    data.conversationId,
  )
  if (!conversationId) return
  keys.push(queryKeys.conversation(conversationId), queryKeys.conversationMessages(conversationId))
}

function addResourceDetailKeys(keys, resource, payload, data) {
  const idFieldByResource = {
    order: 'orderId',
    payment: 'paymentId',
    payout: 'payoutId',
    boost: 'boostId',
    support: 'supportTicketId',
  }
  const idField = idFieldByResource[resource] || `${resource}Id`
  const id = firstString(
    payload?.id,
    payload?.[idField],
    data.id,
    data[idField],
  )

  if (resource === 'order' && id) keys.push(queryKeys.order(id))
  if (resource === 'payment' && id) keys.push(queryKeys.payment(id))
  if (resource === 'support' && id) keys.push(queryKeys.supportTicket(id))
}

function resourcesFromIdentifiers(payload, data) {
  const sources = [payload || {}, data || {}]
  const resourceIds = {
    order: 'orderId',
    payment: 'paymentId',
    payout: 'payoutId',
    boost: 'boostId',
    support: 'supportTicketId',
    verification: 'sellerVerificationId',
    review: 'reviewId',
    product: 'productId',
  }
  return Object.entries(resourceIds)
    .filter(([, key]) => sources.some((source) => firstString(source[key])))
    .map(([resource]) => resource)
}

function resourceFromEvent(event) {
  if (event === 'admin:dashboard-updated') return 'dashboard'
  const [resource] = String(event || '').split(':')
  return normalizeResource(resource)
}

function normalizeResource(value) {
  if (!value) return ''
  const normalized = String(value)
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, '_')
  return resourceAliases[normalized] || normalized
}

function objectValue(value) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {}
}

function firstString(...values) {
  return values.find((value) => typeof value === 'string' && value.trim()) || ''
}

function isConversationEvent(payload) {
  return Boolean(payload?.productId || payload?.participantIds || payload?.unreadCount !== undefined)
}

function uniqueQueryKeys(keys) {
  const seen = new Set()
  return keys.filter((key) => {
    const serialized = JSON.stringify(key)
    if (seen.has(serialized)) return false
    seen.add(serialized)
    return true
  })
}
