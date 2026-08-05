import mongoose from 'mongoose';
import { Payment } from './payment.model.js';
import { Boost } from '../boosts/boost.model.js';
import { Product } from '../products/product.model.js';
import { createAdminLog } from '../auditLogs/adminLog.service.js';
import { createNotification } from '../notifications/notification.service.js';

export async function applySuccessfulPayment(payment, actorId = null) {
  if (payment.status === 'SUCCESS' && payment.paidAt) return payment;

  const session = await mongoose.startSession();
  let updatedPayment;

  await session.withTransaction(async () => {
    const current = await Payment.findById(payment._id).session(session);
    if (!current || current.status === 'SUCCESS') {
      updatedPayment = current;
      return;
    }

    current.status = 'SUCCESS';
    current.paidAt = new Date();
    current.failedAt = null;
    current.failureReason = null;
    updatedPayment = await current.save({ session });

    if (current.relatedModel === 'Boost' && current.relatedId) {
      const boost = await Boost.findById(current.relatedId).session(session);
      if (boost && boost.status === 'PENDING_PAYMENT') {
        const startsAt = new Date();
        const durationHours = Number(current.metadata?.durationHours || 0);
        boost.status = 'ACTIVE';
        boost.startsAt = startsAt;
        boost.endsAt = durationHours > 0 ? new Date(startsAt.getTime() + durationHours * 60 * 60 * 1000) : boost.endsAt;
        await boost.save({ session });

        await Product.updateOne(
          { _id: boost.productId },
          { $set: { isBoosted: true, activeBoostId: boost._id, boostedUntil: boost.endsAt } },
          { session }
        );
      }
    }
  });

  await session.endSession();

  if (updatedPayment) {
    await createNotification({
      userId: updatedPayment.userId,
      type: 'PAYMENT_SUCCESS',
      title: 'Paiement confirmé',
      body: 'Votre paiement a été confirmé avec succès.',
      data: { paymentId: updatedPayment._id, relatedModel: updatedPayment.relatedModel, relatedId: updatedPayment.relatedId }
    });

    if (updatedPayment.relatedModel === 'Boost') {
      await createNotification({
        userId: updatedPayment.userId,
        type: 'BOOST_ACTIVATED',
        title: 'Boost activé',
        body: 'Votre boost est maintenant actif.',
        data: { boostId: updatedPayment.relatedId, paymentId: updatedPayment._id }
      });
    }

    if (actorId) {
      await createAdminLog({
        adminId: actorId,
        action: 'PAYMENT_VALIDATED',
        targetType: 'PAYMENT',
        targetId: updatedPayment._id,
        after: { status: 'SUCCESS', internalReference: updatedPayment.internalReference }
      });
    }
  }

  return updatedPayment;
}

export async function applyFailedPayment(payment, status, failureReason = null, actorId = null) {
  payment.status = status;
  payment.failedAt = new Date();
  payment.failureReason = failureReason || `Paiement ${status.toLowerCase()}`;
  const updatedPayment = await payment.save();

  await createNotification({
    userId: updatedPayment.userId,
    type: 'PAYMENT_FAILED',
    title: 'Paiement non confirmé',
    body: updatedPayment.failureReason,
    data: { paymentId: updatedPayment._id, status: updatedPayment.status }
  });

  if (actorId) {
    await createAdminLog({
      adminId: actorId,
      action: 'PAYMENT_FAILED',
      targetType: 'PAYMENT',
      targetId: updatedPayment._id,
      after: { status: updatedPayment.status, failureReason: updatedPayment.failureReason }
    });
  }

  return updatedPayment;
}
