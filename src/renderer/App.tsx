import { useState } from "react";
import { RouterProvider, createHashRouter } from "react-router-dom";
import { AppShell } from "../shared/layout/AppShell";
import { DashboardPage } from "../features/dashboard/DashboardPage";
import { DevicesPage } from "../features/devices/DevicesPage";
import { DeviceDetailsPage } from "../features/devices/DeviceDetailsPage";
import { NotificationsPage } from "../features/notifications/NotificationsPage";
import { ClipboardPage } from "../features/clipboard/ClipboardPage";
import { TransferPage } from "../features/transfer/TransferPage";
import { SettingsPage } from "../features/settings/SettingsPage";
import { PairingPage } from "../features/pairing/PairingPage";
import { TermsPage } from "../features/terms/TermsPage";
import { hasAcceptedTerms } from "../features/terms/termsStorage";

const router = createHashRouter([
  {
    path: "/",
    element: <AppShell />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: "devices", element: <DevicesPage /> },
      { path: "devices/:id", element: <DeviceDetailsPage /> },
      { path: "notifications", element: <NotificationsPage /> },
      { path: "clipboard", element: <ClipboardPage /> },
      { path: "transfer", element: <TransferPage /> },
      { path: "settings", element: <SettingsPage /> },
      { path: "pair", element: <PairingPage /> },
    ],
  },
]);

export function Root() {
  const [termsAccepted, setTermsAccepted] = useState(hasAcceptedTerms());

  if (!termsAccepted) {
    return <TermsPage onAccept={() => setTermsAccepted(true)} />;
  }

  return <RouterProvider router={router} />;
}
