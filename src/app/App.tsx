import { lazy, Suspense, type ReactNode } from 'react'
import { Navigate, Outlet, Route, Routes, useLocation } from 'react-router'
import { Toaster } from '@/components/ui/Toaster'
import { isSupabaseConfigured } from '@/lib/supabase'
import { useBabies } from '@/stores/babies'
import { useSession } from '@/stores/session'
import { AppLayout } from './AppLayout'
import { FullScreenLoader, SetupMissing } from './Screens'
import { UpdatePrompt } from './UpdatePrompt'
import { LoginPage } from '@/features/auth/LoginPage'
import { SignupPage } from '@/features/auth/SignupPage'
import { ForgotPasswordPage } from '@/features/auth/ForgotPasswordPage'
import { ResetPasswordPage } from '@/features/auth/ResetPasswordPage'
import { HomePage } from '@/features/home/HomePage'

const WelcomePage = lazy(() => import('@/features/babies/WelcomePage'))
const BabyFormPage = lazy(() => import('@/features/babies/BabyFormPage'))
const InvitePage = lazy(() => import('@/features/babies/InvitePage'))
const DiaryPage = lazy(() => import('@/features/diary/DiaryPage'))
const StatsPage = lazy(() => import('@/features/stats/StatsPage'))
const MorePage = lazy(() => import('@/features/more/MorePage'))
const MembersPage = lazy(() => import('@/features/more/MembersPage'))
const BreastfeedingPage = lazy(() => import('@/features/breastfeeding/BreastfeedingPage'))
const DiaperPage = lazy(() => import('@/features/diaper/DiaperPage'))
const BottlePage = lazy(() => import('@/features/bottle/BottlePage'))
const PumpingPage = lazy(() => import('@/features/pumping/PumpingPage'))
const MedicationsPage = lazy(() => import('@/features/medication/MedicationsPage'))
const VaccinationsPage = lazy(() => import('@/features/vaccination/VaccinationsPage'))
const GrowthPage = lazy(() => import('@/features/growth/GrowthPage'))

function RequireAuth() {
  const { session, ready, recovering } = useSession()
  const location = useLocation()
  if (!ready) return <FullScreenLoader />
  if (recovering) return <Navigate to="/reset-password" replace />
  if (!session) return <Navigate to={`/login?next=${encodeURIComponent(location.pathname + location.search)}`} replace />
  return <Outlet />
}

function PublicOnly() {
  const { session, ready } = useSession()
  const location = useLocation()
  if (!ready) return <FullScreenLoader />
  if (session) {
    const next = new URLSearchParams(location.search).get('next')
    return <Navigate to={next && next.startsWith('/') ? next : '/'} replace />
  }
  return <Outlet />
}

function RequireBaby() {
  const { babies, loaded } = useBabies()
  if (!loaded) return <FullScreenLoader label="Sincronizzazione…" />
  if (babies.length === 0) return <Navigate to="/welcome" replace />
  return <Outlet />
}

function Page({ children }: { children: ReactNode }) {
  return <div className="mx-auto min-h-dvh w-full max-w-lg px-4 pb-safe">{children}</div>
}

export function App() {
  if (!isSupabaseConfigured) return <SetupMissing />
  return (
    <>
      <Toaster />
      <UpdatePrompt />
      <Suspense fallback={<FullScreenLoader />}>
        <Routes>
          <Route element={<PublicOnly />}>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          </Route>
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route element={<RequireAuth />}>
            <Route path="/invite/:code" element={<Page><InvitePage /></Page>} />
            <Route path="/welcome" element={<Page><WelcomePage /></Page>} />
            <Route path="/babies/new" element={<Page><BabyFormPage /></Page>} />
            <Route element={<RequireBaby />}>
              <Route element={<AppLayout />}>
                <Route index element={<HomePage />} />
                <Route path="/diary" element={<DiaryPage />} />
                <Route path="/stats" element={<StatsPage />} />
                <Route path="/more" element={<MorePage />} />
              </Route>
              <Route path="/babies/:id/edit" element={<Page><BabyFormPage /></Page>} />
              <Route path="/members" element={<Page><MembersPage /></Page>} />
              <Route path="/breastfeeding" element={<Page><BreastfeedingPage /></Page>} />
              <Route path="/diaper" element={<Page><DiaperPage /></Page>} />
              <Route path="/bottle" element={<Page><BottlePage /></Page>} />
              <Route path="/pumping" element={<Page><PumpingPage /></Page>} />
              <Route path="/medications" element={<Page><MedicationsPage /></Page>} />
              <Route path="/vaccinations" element={<Page><VaccinationsPage /></Page>} />
              <Route path="/growth" element={<Page><GrowthPage /></Page>} />
            </Route>
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </>
  )
}
