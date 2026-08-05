import { lazy } from 'react'

const AdminDashboard = lazy(() => import('./Dashboard.jsx'))
const AdminReports = lazy(() => import('./Reports.jsx'))
const AdminReportDetail = lazy(() => import('./ReportDetail.jsx'))
const AdminVerifications = lazy(() => import('./Verifications.jsx'))
const AdminUsers = lazy(() => import('./Users.jsx'))
const AdminProducts = lazy(() => import('./Products.jsx'))
const AdminOrders = lazy(() => import('./Orders.jsx'))
const AdminOrderDetail = lazy(() => import('./OrderDetail.jsx'))
const AdminReviews = lazy(() => import('./Reviews.jsx'))
const AdminConversations = lazy(() => import('./Conversations.jsx'))
const AdminSupport = lazy(() => import('./Support.jsx'))
const AdminSupportDetail = lazy(() => import('./SupportDetail.jsx'))
const AdminPayments = lazy(() => import('./Payments.jsx'))
const AdminPayouts = lazy(() => import('./Payouts.jsx'))
const AdminBoosts = lazy(() => import('./Boosts.jsx'))
const AdminCategories = lazy(() => import('./Categories.jsx'))
const AdminSettings = lazy(() => import('./Settings.jsx'))
const AdminLogs = lazy(() => import('./Logs.jsx'))

export const adminPageRoutes = [
  { index: true, Component: AdminDashboard },
  { path: 'reports', Component: AdminReports },
  { path: 'reports/:id', Component: AdminReportDetail },
  { path: 'verifications', Component: AdminVerifications },
  { path: 'users', Component: AdminUsers },
  { path: 'products', Component: AdminProducts },
  { path: 'orders', Component: AdminOrders },
  { path: 'orders/:id', Component: AdminOrderDetail },
  { path: 'reviews', Component: AdminReviews },
  { path: 'conversations', Component: AdminConversations },
  { path: 'support', Component: AdminSupport },
  { path: 'support/:id', Component: AdminSupportDetail },
  { path: 'payments', Component: AdminPayments, capability: 'manageFinance' },
  { path: 'payouts', Component: AdminPayouts, capability: 'manageFinance' },
  { path: 'boosts', Component: AdminBoosts, capability: 'manageFinance' },
  { path: 'categories', Component: AdminCategories, capability: 'manageCatalogue' },
  { path: 'settings', Component: AdminSettings, capability: 'manageSettings' },
  { path: 'logs', Component: AdminLogs, capability: 'manageCatalogue' },
]
