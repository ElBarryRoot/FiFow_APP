import { Prisma, type HandoverMode } from '@prisma/client';
import { prisma } from '../../config/prisma.js';
import { ApiError } from '../../shared/errors/api-error.js';
import { createNotification } from '../notifications/notification.service.js';

const OFFER_DURATION_MS = 48 * 60 * 60_000;

export type CreateOfferInput = {
  amount: string;
  handoverMode: HandoverMode;
  message?: string;
};

export type RespondToOfferInput = {
  action: 'ACCEPT' | 'REJECT' | 'COUNTER';
  amount?: string;
  handoverMode?: HandoverMode;
  message?: string;
};

export type OfferServiceDependencies = {
  findOfferConversation(offerId: string): Promise<{ conversationId: string } | null>;
  runInTransaction<T>(callback: (transaction: Prisma.TransactionClient) => Promise<T>): Promise<T>;
  now(): Date;
};

const offerServiceDependencies: OfferServiceDependencies = {
  findOfferConversation(offerId) {
    return prisma.offer.findUnique({
      where: { id: offerId },
      select: { conversationId: true }
    });
  },
  runInTransaction(callback) {
    return prisma.$transaction(callback);
  },
  now() {
    return new Date();
  }
};

async function lockConversation(transaction: Prisma.TransactionClient, conversationId: string) {
  await transaction.$queryRaw<Array<{ id: string }>>`
    SELECT id
    FROM conversations
    WHERE id = ${conversationId}::uuid
    FOR UPDATE
  `;
}

async function assertNotBlocked(transaction: Prisma.TransactionClient, firstUserId: string, secondUserId: string) {
  const block = await transaction.userBlock.findFirst({
    where: {
      OR: [
        { blockerId: firstUserId, blockedId: secondUserId },
        { blockerId: secondUserId, blockedId: firstUserId }
      ]
    },
    select: { id: true }
  });

  if (block) {
    throw new ApiError(403, 'Interaction impossible.', 'USER_BLOCKED');
  }
}

function assertOfferAmount(amount: bigint, productPrice: bigint, errorCode: string) {
  if (amount < productPrice / 5n || amount > productPrice * 2n) {
    throw new ApiError(400, 'Montant invalide.', errorCode);
  }
}

function pendingOfferConflict(error: unknown): never {
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
    throw new ApiError(409, 'Une offre est déjà en attente.', 'PENDING_OFFER_EXISTS');
  }

  throw error;
}

export const offerService = {
  async create(
    userId: string,
    conversationId: string,
    input: CreateOfferInput,
    dependencies: OfferServiceDependencies = offerServiceDependencies
  ) {
    return dependencies.runInTransaction(async (transaction) => {
      // Every offer mutation locks the conversation first. This ordering avoids
      // deadlocks and serializes the complete negotiation chain.
      await lockConversation(transaction, conversationId);

      const conversation = await transaction.conversation.findFirst({
        where: { id: conversationId, buyerId: userId, status: 'ACTIVE' },
        include: {
          product: {
            select: {
              price: true,
              isNegotiable: true,
              handoverModes: true,
              status: true
            }
          }
        }
      });

      if (!conversation || conversation.product.status !== 'AVAILABLE') {
        throw new ApiError(404, 'Conversation indisponible.', 'CONVERSATION_NOT_FOUND');
      }

      await assertNotBlocked(transaction, conversation.buyerId, conversation.sellerId);

      if (!conversation.product.isNegotiable) {
        throw new ApiError(409, 'Prix non négociable.', 'PRODUCT_NOT_NEGOTIABLE');
      }
      if (!conversation.product.handoverModes.includes(input.handoverMode)) {
        throw new ApiError(400, 'Mode de remise indisponible.', 'INVALID_HANDOVER_MODE');
      }

      const offeredAmount = BigInt(input.amount);
      assertOfferAmount(offeredAmount, conversation.product.price, 'INVALID_OFFER_AMOUNT');

      const now = dependencies.now();
      await transaction.offer.updateMany({
        where: {
          conversationId,
          status: 'PENDING',
          expiresAt: { lte: now }
        },
        data: { status: 'EXPIRED', respondedAt: now }
      });

      const pendingOffer = await transaction.offer.findFirst({
        where: { conversationId, status: 'PENDING' },
        select: { id: true }
      });
      if (pendingOffer) {
        throw new ApiError(409, 'Une offre est déjà en attente.', 'PENDING_OFFER_EXISTS');
      }

      let offer;
      try {
        offer = await transaction.offer.create({
          data: {
            productId: conversation.productId,
            conversationId,
            creatorId: userId,
            recipientId: conversation.sellerId,
            amount: offeredAmount,
            handoverMode: input.handoverMode,
            ...(input.message ? { message: input.message } : {}),
            expiresAt: new Date(now.getTime() + OFFER_DURATION_MS)
          }
        });
      } catch (error) {
        pendingOfferConflict(error);
      }

      const notification = await createNotification(
        {
          userId: conversation.sellerId,
          type: 'OFFER_RECEIVED',
          title: 'Nouvelle offre',
          body: `Offre de ${input.amount} GNF`,
          data: { offerId: offer.id, conversationId }
        },
        transaction
      );

      return {
        offer,
        notification,
        conversationId,
        notifyUserId: conversation.sellerId
      };
    });
  },

  async respond(
    userId: string,
    offerId: string,
    input: RespondToOfferInput,
    dependencies: OfferServiceDependencies = offerServiceDependencies
  ) {
    const reference = await dependencies.findOfferConversation(offerId);
    if (!reference) {
      throw new ApiError(404, 'Offre introuvable.', 'OFFER_NOT_FOUND');
    }

    return dependencies.runInTransaction(async (transaction) => {
      // Resolve the conversation before entering the transaction, then lock it
      // before the offer row so every mutation follows the same lock order.
      await lockConversation(transaction, reference.conversationId);

      const offer = await transaction.offer.findFirst({
        where: { id: offerId, conversationId: reference.conversationId },
        include: {
          product: {
            select: { price: true, status: true, handoverModes: true }
          },
          conversation: {
            select: { buyerId: true, sellerId: true, status: true }
          }
        }
      });

      if (!offer || offer.recipientId !== userId) {
        throw new ApiError(404, 'Offre introuvable.', 'OFFER_NOT_FOUND');
      }
      if (offer.conversation.status !== 'ACTIVE') {
        throw new ApiError(409, 'Conversation inactive.', 'CONVERSATION_NOT_ACTIVE');
      }

      await assertNotBlocked(transaction, offer.conversation.buyerId, offer.conversation.sellerId);

      const now = dependencies.now();
      if (offer.status !== 'PENDING' || offer.expiresAt <= now) {
        throw new ApiError(409, 'Offre inactive.', 'OFFER_NOT_ACTIVE');
      }

      if (input.action !== 'COUNTER') {
        if (input.action === 'ACCEPT' && offer.product.status !== 'AVAILABLE') {
          throw new ApiError(409, 'Annonce indisponible.', 'PRODUCT_NOT_AVAILABLE');
        }

        const status = input.action === 'ACCEPT' ? 'ACCEPTED' : 'REJECTED';
        const update = await transaction.offer.updateMany({
          where: { id: offer.id, status: 'PENDING', expiresAt: { gt: now } },
          data: { status, respondedAt: now }
        });
        if (update.count !== 1) {
          throw new ApiError(409, 'Offre inactive.', 'OFFER_NOT_ACTIVE');
        }

        const updated = await transaction.offer.findUniqueOrThrow({
          where: { id: offer.id }
        });
        const accepted = input.action === 'ACCEPT';
        const notification = await createNotification(
          {
            userId: offer.creatorId,
            type: accepted ? 'OFFER_ACCEPTED' : 'OFFER_REJECTED',
            title: accepted ? 'Offre acceptée' : 'Offre refusée',
            body: accepted ? 'Vous pouvez confirmer la commande.' : 'Votre offre a été refusée.',
            data: { offerId: offer.id, conversationId: offer.conversationId }
          },
          transaction
        );

        return {
          offer: updated,
          notification,
          conversationId: offer.conversationId,
          notifyUserId: offer.creatorId
        };
      }

      const counterAmount = BigInt(input.amount!);
      assertOfferAmount(counterAmount, offer.product.price, 'INVALID_COUNTER_OFFER');
      if (!offer.product.handoverModes.includes(input.handoverMode!)) {
        throw new ApiError(400, 'Contre-proposition invalide.', 'INVALID_COUNTER_OFFER');
      }

      const update = await transaction.offer.updateMany({
        where: { id: offer.id, status: 'PENDING', expiresAt: { gt: now } },
        data: { status: 'COUNTERED', respondedAt: now }
      });
      if (update.count !== 1) {
        throw new ApiError(409, 'Offre inactive.', 'OFFER_NOT_ACTIVE');
      }

      let counterOffer;
      try {
        counterOffer = await transaction.offer.create({
          data: {
            productId: offer.productId,
            conversationId: offer.conversationId,
            creatorId: userId,
            recipientId: offer.creatorId,
            parentOfferId: offer.id,
            amount: counterAmount,
            handoverMode: input.handoverMode!,
            ...(input.message ? { message: input.message } : {}),
            expiresAt: new Date(now.getTime() + OFFER_DURATION_MS)
          }
        });
      } catch (error) {
        pendingOfferConflict(error);
      }

      const notification = await createNotification(
        {
          userId: offer.creatorId,
          type: 'OFFER_RECEIVED',
          title: 'Contre-proposition reçue',
          body: `Contre-proposition de ${input.amount} GNF`,
          data: { offerId: counterOffer.id, conversationId: offer.conversationId }
        },
        transaction
      );

      return {
        offer: counterOffer,
        notification,
        conversationId: offer.conversationId,
        notifyUserId: offer.creatorId
      };
    });
  }
};
