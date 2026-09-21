-- Donation listings never enter the payment or cart flow.
ALTER TYPE "ListingMode" ADD VALUE IF NOT EXISTS 'DONATION';
