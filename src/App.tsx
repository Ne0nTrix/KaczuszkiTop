import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { AppLayout } from './routes/AppLayout';
import { CertificateDetailPage } from './pages/CertificateDetailPage'
import { LandingPage } from './pages/LandingPage'
import { CertificatesPage } from './pages/CertificatesPage';
import { DashboardPage } from './pages/DashboardPage';   
import { LoginPage } from './pages/LoginPage';
import { MapPage } from './pages/MapPage';
import { MessagesPage } from './pages/MessagesPage';
import { MicrogridPage } from './pages/MicrogridPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { OnboardingPage } from './pages/OnboardingPage'
	import { PrintCertificatePage } from './pages/PrintCertificatePage';
import { PrintReportPage } from './pages/PrintReportPage';
import { ProfilePage } from './pages/ProfilePage';
import { RegisterPage } from './pages/RegisterPage';   
import { RewardsPage } from './pages/RewardsPage';
import { TradePage } from './pages/TradePage';
import { VerifyPage } from './pages/VerifyPage';
import { WalletPage } from './pages/WalletPage';
import { AppStateProvider } from './state/AppStateProvider';
import { MarketProvider } from './state/MarketProvider'
import { SessionProvider } from './state/SessionProvider'
import { SunBotProvider } from './state/SunBotProvider'
import { ThemeProvider } from './state/ThemeProvider';
import { ToastProvider } from './state/ToastProvider';

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
      <SessionProvider>
        <ToastProvider>
          <MarketProvider>
            <AppStateProvider>
            <SunBotProvider>
              <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/onboarding" element={<OnboardingPage />} />
                <Route path="/verify" element={<VerifyPage />} />
                <Route path="/verify/:id" element={<VerifyPage />} />
                <Route path="/print/report" element={<PrintReportPage />} />
                <Route path="/print/certificate/:id" element={<PrintCertificatePage />} />
                <Route element={<AppLayout />}>
                  <Route path="/map" element={<MapPage />} />
                  <Route path="/users/:id" element={<ProfilePage />} />
                  <Route path="/trade" element={<TradePage />} />
                  <Route path="/wallet" element={<WalletPage />} />
                  <Route path="/messages" element={<MessagesPage />} />
                  <Route path="/dashboard" element={<DashboardPage />} />
                  <Route path="/certificates" element={<CertificatesPage />} />
                  <Route path="/certificates/:id" element={<CertificateDetailPage />} />
                  <Route path="/microgrid" element={<MicrogridPage />} />
                  <Route path="/rewards" element={<RewardsPage />} /> 
                </Route>
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </SunBotProvider>
            </AppStateProvider>
          </MarketProvider>
        </ToastProvider>
      </SessionProvider>
      </ThemeProvider>
    </BrowserRouter>
  )
}
