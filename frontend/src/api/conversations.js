import { defaultAvatar, formatRelativeDate } from './adapters.js'
import { apiRequest, buildSearchParams } from './http.js'

const defaultProductImage = '/assets/empty-product.svg'

export function toConversationView(conversation, currentUserId) {
  if (!conversation) return null
  const counterpart = conversation.counterpart || (conversation.buyerId === currentUserId ? conversation.seller : conversation.buyer) || {}
  const product = conversation.product || {}
  return {
    ...conversation,
    counterpart,
    seller: counterpart.fullName || 'Utilisateur Fi Fow',
    avatar: counterpart.avatarUrl || defaultAvatar,
    product: {
      ...product,
      price: Number(product.price || 0),
      image: product.mainImage?.url || defaultProductImage,
      location: [product.quartier, product.commune].filter(Boolean).join(', '),
    },
    productTitle: product.title || 'Annonce',
    productSlug: product.slug || product.id,
    image: product.mainImage?.url || defaultProductImage,
    price: Number(product.price || 0),
    location: [product.quartier, product.commune].filter(Boolean).join(', '),
    lastMessage: conversation.lastMessageText || 'Conversation démarrée',
    time: formatRelativeDate(conversation.lastMessageAt || conversation.updatedAt),
    unread: Number(conversation.unreadCount || 0),
  }
}

export function toMessageView(message, currentUserId) {
  return {
    ...message,
    from: message.senderId === currentUserId ? 'me' : 'other',
    time: new Intl.DateTimeFormat('fr-GN', { hour: '2-digit', minute: '2-digit' }).format(new Date(message.createdAt)),
  }
}

export const conversationsApi = {
  async list({ cursor, limit = 30, userId } = {}) {
    const response = await apiRequest(`/conversations${buildSearchParams({ cursor, limit })}`, { auth: 'required' })
    return {
      items: response.data.map((conversation) => toConversationView(conversation, userId)),
      nextCursor: response.meta?.nextCursor || null,
      unreadCount: Number(response.meta?.unreadCount || 0),
    }
  },
  async create(productId, userId) {
    const response = await apiRequest('/conversations', { method: 'POST', body: { productId }, auth: 'required' })
    return toConversationView(response.data, userId)
  },
  async detail(conversationId, userId) {
    const response = await apiRequest(`/conversations/${conversationId}`, { auth: 'required' })
    return {
      conversation: toConversationView(response.data.conversation, userId),
      messages: response.data.messages.map((message) => toMessageView(message, userId)),
      offers: response.data.offers || [],
    }
  },
  async messages(conversationId, { cursor, limit = 100, userId } = {}) {
    const query = buildSearchParams({ cursor, limit })
    const response = await apiRequest(`/conversations/${conversationId}/messages${query}`, { auth: 'required' })
    return {
      items: response.data.map((message) => toMessageView(message, userId)),
      nextCursor: response.meta?.nextCursor || null,
      hasNextPage: Boolean(response.meta?.hasNextPage),
    }
  },
  async sendText(conversationId, text, clientId, userId) {
    const response = await apiRequest(`/conversations/${conversationId}/messages`, {
      method: 'POST', body: { text, clientId }, auth: 'required',
    })
    return toMessageView(response.data, userId)
  },
  async sendImage(conversationId, file, clientId, userId) {
    const body = new FormData()
    body.append('image', file)
    const query = buildSearchParams({ clientId })
    const response = await apiRequest(`/conversations/${conversationId}/messages/images${query}`, {
      method: 'POST', body, auth: 'required', timeoutMs: 45_000,
    })
    return toMessageView(response.data, userId)
  },
  read(conversationId) {
    return apiRequest(`/conversations/${conversationId}/read`, { method: 'PATCH', auth: 'required' })
  },
  archive(conversationId) {
    return apiRequest(`/conversations/${conversationId}/archive`, { method: 'POST', auth: 'required' })
  },
  async createOffer(conversationId, input) {
    return (await apiRequest(`/conversations/${conversationId}/offers`, {
      method: 'POST', body: input, auth: 'required',
    })).data
  },
  async respondOffer(offerId, input) {
    return (await apiRequest(`/offers/${offerId}`, { method: 'PATCH', body: input, auth: 'required' })).data
  },
}
