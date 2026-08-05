import { lazy, Suspense, useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Navigate, Route, Routes, useLocation, useParams } from 'react-router-dom'
import AdminRoute from '../auth/AdminRoute.jsx'
import { canAdmin } from '../auth/adminAccess.js'
import { useAuth } from '../auth/AuthContext.jsx'
import { GuestRoute, ProtectedRoute } from '../auth/RouteGuards.jsx'
import AdminShell from '../components/admin/AdminShell.jsx'
import { adminPageRoutes } from '../pages/admin/routes.js'

const HomeGuest = lazy(() => import('../pages/public/HomeGuest.jsx'))
const HomeConnected = lazy(() => import('../pages/public/HomeConnected.jsx'))
const Catalogue = lazy(() => import('../pages/public/Catalogue.jsx'))
const ProductDetail = lazy(() => import('../pages/public/ProductDetail.jsx'))
const Login = lazy(() => import('../pages/auth/Login.jsx'))
const Register = lazy(() => import('../pages/auth/Register.jsx'))
const ForgotPassword = lazy(() => import('../pages/auth/ForgotPassword.jsx'))
const AccountRecovery = lazy(() => import('../pages/auth/AccountRecovery.jsx'))
const VerifyEmail = lazy(() => import('../pages/auth/VerifyEmail.jsx'))
const NewProduct = lazy(() => import('../pages/user/NewProduct.jsx'))
const Profile = lazy(() => import('../pages/user/Profile.jsx'))
const PublicSellerProfile = lazy(() => import('../pages/user/PublicSellerProfile.jsx'))
const MyListings = lazy(() => import('../pages/user/MyListings.jsx'))
const EditListing = lazy(() => import('../pages/user/EditListing.jsx'))
const Favorites = lazy(() => import('../pages/user/Favorites.jsx'))
const Notifications = lazy(() => import('../pages/user/Notifications.jsx'))
const AccountSettings = lazy(() => import('../pages/user/AccountSettings.jsx'))
const ChangePassword = lazy(() => import('../pages/user/ChangePassword.jsx'))
const EditProfile = lazy(() => import('../pages/user/EditProfile.jsx'))
const Messages = lazy(() => import('../pages/messages/Messages.jsx'))
const Conversation = lazy(() => import('../pages/messages/Conversation.jsx'))
const Orders = lazy(() => import('../pages/orders/Orders.jsx'))
const OrderDetail = lazy(() => import('../pages/orders/OrderDetail.jsx'))
const BuyProduct = lazy(() => import('../pages/orders/BuyProduct.jsx'))
const Support = lazy(() => import('../pages/support/Support.jsx'))
const SupportTicket = lazy(() => import('../pages/support/SupportTicket.jsx'))
const ReportListing = lazy(() => import('../pages/support/ReportListing.jsx'))
const Checkout = lazy(() => import('../pages/payment/Checkout.jsx'))
const PaymentProcessing = lazy(() => import('../pages/payment/PaymentProcessing.jsx'))
const PaymentSuccess = lazy(() => import('../pages/payment/PaymentSuccess.jsx'))
const BoostPlans = lazy(() => import('../pages/boost/BoostPlans.jsx'))
const BoostCheckout = lazy(() => import('../pages/boost/BoostCheckout.jsx'))
const MyBoosts = lazy(() => import('../pages/user/MyBoosts.jsx'))
const CreateReview = lazy(() => import('../pages/review/CreateReview.jsx'))
const SellerVerification = lazy(() => import('../pages/user/SellerVerification.jsx'))

export default function App() {
  const location = useLocation()
  const transitionKey = location.pathname.startsWith('/admin') ? 'admin-shell' : location.pathname

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' })
  }, [location.pathname])

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={transitionKey}
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.16, ease: 'easeOut' }}
      >
        <Suspense fallback={<PageLoader />}>
          <Routes location={location}>
          <Route path="/" element={<HomeEntry />} />
          <Route path="/home" element={<HomeGuest />} />
          <Route path="/connected" element={<ProtectedRoute><HomeConnected /></ProtectedRoute>} />
          <Route path="/products" element={<Catalogue />} />
          <Route path="/products/new" element={<ProtectedRoute><NewProduct /></ProtectedRoute>} />
          <Route path="/products/:id/edit" element={<ProtectedRoute><EditListing /></ProtectedRoute>} />
          <Route path="/products/:id/buy" element={<ProtectedRoute><BuyProduct /></ProtectedRoute>} />
          <Route path="/products/:id" element={<ProductDetail />} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/profile/edit" element={<ProtectedRoute><EditProfile /></ProtectedRoute>} />
          <Route path="/profile/listings" element={<ProtectedRoute><MyListings /></ProtectedRoute>} />
          <Route path="/profile/boosts" element={<ProtectedRoute><MyBoosts /></ProtectedRoute>} />
          <Route path="/seller/:id" element={<PublicSellerProfile />} />
          <Route path="/favorites" element={<ProtectedRoute><Favorites /></ProtectedRoute>} />
          <Route path="/messages" element={<ProtectedRoute><Messages /></ProtectedRoute>} />
          <Route path="/messages/:id" element={<ProtectedRoute><Conversation /></ProtectedRoute>} />
          <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
          <Route path="/orders" element={<ProtectedRoute><Orders /></ProtectedRoute>} />
          <Route path="/orders/:id" element={<ProtectedRoute><OrderDetail /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><AccountSettings /></ProtectedRoute>} />
          <Route path="/settings/password" element={<ProtectedRoute><ChangePassword /></ProtectedRoute>} />
          <Route path="/support" element={<ProtectedRoute><Support /></ProtectedRoute>} />
          <Route path="/support/:ticketId" element={<ProtectedRoute><SupportTicket /></ProtectedRoute>} />
          <Route path="/seller-verification" element={<ProtectedRoute><SellerVerification /></ProtectedRoute>} />
          <Route path="/report/:id" element={<ProtectedRoute><ReportListing /></ProtectedRoute>} />
          <Route path="/checkout/:orderId" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
          <Route path="/payments/:paymentId/processing" element={<ProtectedRoute><PaymentProcessing /></ProtectedRoute>} />
          <Route path="/payments/:paymentId/success" element={<ProtectedRoute><PaymentSuccess /></ProtectedRoute>} />
          <Route path="/checkout/:orderId/processing" element={<ProtectedRoute><LegacyCheckoutRoute /></ProtectedRoute>} />
          <Route path="/checkout/:orderId/success" element={<ProtectedRoute><LegacyOrderRoute /></ProtectedRoute>} />
          <Route path="/boost/plans" element={<ProtectedRoute><BoostPlans /></ProtectedRoute>} />
          <Route path="/products/:id/boost/checkout" element={<ProtectedRoute><BoostCheckout /></ProtectedRoute>} />
          <Route path="/orders/:id/review" element={<ProtectedRoute><CreateReview /></ProtectedRoute>} />
          <Route path="/admin" element={<AdminRoute><AdminShell /></AdminRoute>}>
            {adminPageRoutes.map(({ index, path, Component, capability }) => (
              <Route
                key={path || 'dashboard'}
                index={index || undefined}
                path={path}
                element={<AdminPageAccess capability={capability}><Component /></AdminPageAccess>}
              />
            ))}
          </Route>
          <Route path="/login" element={<GuestRoute><Login /></GuestRoute>} />
          <Route path="/register" element={<GuestRoute><Register /></GuestRoute>} />
          <Route path="/forgot-password" element={<GuestRoute><ForgotPassword /></GuestRoute>} />
          <Route path="/reset-password" element={<AccountRecovery />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/account-recovery" element={<AccountRecovery />} />
          <Route path="/menu" element={<Navigate to="/products" replace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </motion.div>
    </AnimatePresence>
  )
}

function AdminPageAccess({ capability, children }) {
  const auth = useAuth()
  if (capability && !canAdmin(auth.user, capability)) return <Navigate to="/admin" replace />
  return children
}

function LegacyCheckoutRoute() {
  const { orderId } = useParams()
  return <Navigate to={`/checkout/${orderId}`} replace />
}

function LegacyOrderRoute() {
  const { orderId } = useParams()
  return <Navigate to={`/orders/${orderId}`} replace />
}

function HomeEntry() {
  const auth = useAuth()
  if (auth.status === 'booting') return <PageLoader />
  return auth.isAuthenticated ? <HomeConnected /> : <HomeGuest />
}

function PageLoader() {
  return (
    <div className="grid min-h-screen place-items-center bg-fifow-bg" role="status" aria-label="Chargement">
      <span className="h-9 w-9 animate-spin rounded-full border-4 border-violet-100 border-t-fifow-primary" />
    </div>
  )
}
