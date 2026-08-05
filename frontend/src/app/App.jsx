import { lazy, Suspense, useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'

const HomeGuest = lazy(() => import('../pages/public/HomeGuest.jsx'))
const HomeConnected = lazy(() => import('../pages/public/HomeConnected.jsx'))
const Catalogue = lazy(() => import('../pages/public/Catalogue.jsx'))
const ProductDetail = lazy(() => import('../pages/public/ProductDetail.jsx'))
const Login = lazy(() => import('../pages/auth/Login.jsx'))
const Register = lazy(() => import('../pages/auth/Register.jsx'))
const ForgotPassword = lazy(() => import('../pages/auth/ForgotPassword.jsx'))
const AccountRecovery = lazy(() => import('../pages/auth/AccountRecovery.jsx'))
const NewProduct = lazy(() => import('../pages/user/NewProduct.jsx'))
const Profile = lazy(() => import('../pages/user/Profile.jsx'))
const PublicSellerProfile = lazy(() => import('../pages/user/PublicSellerProfile.jsx'))
const MyListings = lazy(() => import('../pages/user/MyListings.jsx'))
const EditListing = lazy(() => import('../pages/user/EditListing.jsx'))
const Favorites = lazy(() => import('../pages/user/Favorites.jsx'))
const Notifications = lazy(() => import('../pages/user/Notifications.jsx'))
const AccountSettings = lazy(() => import('../pages/user/AccountSettings.jsx'))
const EditProfile = lazy(() => import('../pages/user/EditProfile.jsx'))
const Messages = lazy(() => import('../pages/messages/Messages.jsx'))
const Conversation = lazy(() => import('../pages/messages/Conversation.jsx'))
const Orders = lazy(() => import('../pages/orders/Orders.jsx'))
const OrderDetail = lazy(() => import('../pages/orders/OrderDetail.jsx'))
const Support = lazy(() => import('../pages/support/Support.jsx'))
const ReportListing = lazy(() => import('../pages/support/ReportListing.jsx'))
const Checkout = lazy(() => import('../pages/payment/Checkout.jsx'))
const PaymentProcessing = lazy(() => import('../pages/payment/PaymentProcessing.jsx'))
const PaymentSuccess = lazy(() => import('../pages/payment/PaymentSuccess.jsx'))
const BoostPlans = lazy(() => import('../pages/boost/BoostPlans.jsx'))
const BoostCheckout = lazy(() => import('../pages/boost/BoostCheckout.jsx'))
const MyBoosts = lazy(() => import('../pages/user/MyBoosts.jsx'))
const CreateReview = lazy(() => import('../pages/review/CreateReview.jsx'))

export default function App() {
  const location = useLocation()

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' })
  }, [location.pathname])

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.16, ease: 'easeOut' }}
      >
        <Suspense fallback={<PageLoader />}>
          <Routes location={location}>
          <Route path="/" element={<HomeGuest />} />
          <Route path="/home" element={<HomeGuest />} />
          <Route path="/connected" element={<HomeConnected />} />
          <Route path="/products" element={<Catalogue />} />
          <Route path="/products/new" element={<NewProduct />} />
          <Route path="/products/:id/edit" element={<EditListing />} />
          <Route path="/products/:id" element={<ProductDetail />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/profile/edit" element={<EditProfile />} />
          <Route path="/profile/listings" element={<MyListings />} />
          <Route path="/profile/boosts" element={<MyBoosts />} />
          <Route path="/seller/:id" element={<PublicSellerProfile />} />
          <Route path="/favorites" element={<Favorites />} />
          <Route path="/messages" element={<Messages />} />
          <Route path="/messages/:id" element={<Conversation />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/orders/:id" element={<OrderDetail />} />
          <Route path="/settings" element={<AccountSettings />} />
          <Route path="/support" element={<Support />} />
          <Route path="/report/:id" element={<ReportListing />} />
          <Route path="/checkout/:orderId" element={<Checkout />} />
          <Route path="/checkout/:orderId/processing" element={<PaymentProcessing />} />
          <Route path="/checkout/:orderId/success" element={<PaymentSuccess />} />
          <Route path="/boost/plans" element={<BoostPlans />} />
          <Route path="/products/:id/boost/checkout" element={<BoostCheckout />} />
          <Route path="/orders/:id/review" element={<CreateReview />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/account-recovery" element={<AccountRecovery />} />
          <Route path="/menu" element={<Navigate to="/products" replace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </motion.div>
    </AnimatePresence>
  )
}

function PageLoader() {
  return (
    <div className="grid min-h-screen place-items-center bg-fifow-bg" role="status" aria-label="Chargement">
      <span className="h-9 w-9 animate-spin rounded-full border-4 border-violet-100 border-t-fifow-primary" />
    </div>
  )
}
