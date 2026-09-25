import { Suspense, useEffect, type ReactNode } from 'react'
import { Navigate, Outlet, Route, Routes, useLocation } from 'react-router'
import { Toaster } from '@/components/ui/Toaster'
import { isActiveSession } from '@/domain/types'
import { isSupabaseConfigured } from '@/lib/supabase'
import { useActiveBaby, useBabies } from '@/stores/babies'
import { useEvents } from '@/stores/events'
import { useSession } from '@/stores/session'
import { AppLayout } from './AppLayout'
import { lazyPage, preloadWhenIdle } from './navTransition'
import { FullScreenLoader, SetupMissing } from './Screens'
import { SwipeBack } from './SwipeBack'
import { UpdatePrompt } from './UpdatePrompt'
import { LoginPage } from '@/features/auth/LoginPage'
import { SignupPage } from '@/features/auth/SignupPage'
import { ForgotPasswordPage } from '@/features/auth/ForgotPasswordPage'
import { ResetPasswordPage } from '@/features/auth/ResetPasswordPage'
import { HomePage } from '@/features/home/HomePage'

const WelcomePage = lazyPage(() => import('@/features/babies/WelcomePage'))
const BabyFormPage = lazyPage(() => import('@/features/babies/BabyFormPage'))
const InvitePage = lazyPage(() => import('@/features/babies/InvitePage'))
const DiaryPage = lazyPage(() => import('@/features/diary/DiaryPage'))
const StatsPage = lazyPage(() => import('@/features/stats/StatsPage'))
const MorePage = lazyPage(() => import('@/features/more/MorePage'))
const MembersPage = lazyPage(() => import('@/features/more/MembersPage'))
const BreastfeedingPage = lazyPage(() => import('@/features/breastfeeding/BreastfeedingPage'))
const FeedingDetailPage = lazyPage(() => import('@/features/breastfeeding/FeedingDetailPage'))
const DiaperPage = lazyPage(() => import('@/features/diaper/DiaperPage'))
const BottlePage = lazyPage(() => import('@/features/bottle/BottlePage'))
const PumpingPage = lazyPage(() => import('@/features/pumping/PumpingPage'))
const MedicationsPage = lazyPage(() => import('@/features/medication/MedicationsPage'))
const VaccinationsPage = lazyPage(() => import('@/features/vaccination/VaccinationsPage'))
const GrowthPage = lazyPage(() => import('@/features/growth/GrowthPage'))
const BathPage = lazyPage(() => import('@/features/bath/BathPage'))
const DoctorVisitsPage = lazyPage(() => import('@/features/doctorVisit/DoctorVisitsPage'))

const LAZY_PAGES = [
  WelcomePage,
  BabyFormPage,
  InvitePage,
  DiaryPage,
  StatsPage,
  MorePage,
  MembersPage,
  BreastfeedingPage,
  FeedingDetailPage,
  DiaperPage,
  BottlePage,
  PumpingPage,
  MedicationsPage,
  VaccinationsPage,
  GrowthPage,
  BathPage,
  DoctorVisitsPage,
]

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
  return (
    <div className="vt-page mx-auto min-h-dvh w-full max-w-lg px-4 pb-safe">{children}</div>
  )
}

/** Velo di colore in cima a ogni schermata; si scalda mentre una sessione è in corso. */
function Ambient() {
  const babyId = useActiveBaby()?.id
  const live = useEvents((s) => !!babyId && Object.values(s.byId).some((e) => e.baby_id === babyId && isActiveSession(e)))
  return <div aria-hidden className="ambient" data-live={live || undefined} />
}

export function App() {
  useEffect(() => preloadWhenIdle(LAZY_PAGES), [])
  if (!isSupabaseConfigured) return <SetupMissing />
  return (
    <>
      <Ambient />
      <Toaster />
      <UpdatePrompt />
      <SwipeBack />
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
              <Route path="/breastfeeding/:id" element={<Page><FeedingDetailPage /></Page>} />
              <Route path="/diaper" element={<Page><DiaperPage /></Page>} />
              <Route path="/bottle" element={<Page><BottlePage /></Page>} />
              <Route path="/pumping" element={<Page><PumpingPage /></Page>} />
              <Route path="/medications" element={<Page><MedicationsPage /></Page>} />
              <Route path="/vaccinations" element={<Page><VaccinationsPage /></Page>} />
              <Route path="/growth" element={<Page><GrowthPage /></Page>} />
              <Route path="/bath" element={<Page><BathPage /></Page>} />
              <Route path="/doctor-visit" element={<Page><DoctorVisitsPage /></Page>} />
            </Route>
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </>
  )
}
