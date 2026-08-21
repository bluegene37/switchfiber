// The single list of API endpoints this console monitors. The Dashboard KPI
// cards, its health badge, and the Navbar notification bell all derive from
// this list, so a failing endpoint is reported the same way everywhere —
// adding an endpoint here wires it into all three at once.
//
// `probePath` is a lightweight variant used only by health probes. A bare
// collection GET can be very expensive (an unbounded /Applications fetch takes
// minutes and degrades the server), so probes must never download a whole
// table just to learn that the endpoint answers. Data consumers that need the
// actual rows (Dashboard KPI counts and status tallies) keep using `path`.
// Endpoints without a paged backend variant have no `probePath`; probes fall
// back to `path` for those.
export const MONITORED_ENDPOINTS = [
  { key: 'applications', path: '/Applications', probePath: '/Applications/paged?pageNumber=1&pageSize=1', label: 'Applications' },
  { key: 'plans', path: '/Plans', label: 'Active Plans' },
  { key: 'activeSessions', path: '/RadiusSession', label: 'RADIUS Sessions' },
  { key: 'radiusUsers', path: '/RadiusUser', label: 'RADIUS Users' },
  { key: 'routers', path: '/Routers', label: 'Routers' },
  { key: 'vlans', path: '/Vlans', label: 'VLANs' },
  { key: 'jobOrders', path: '/JobOrders', label: 'Job Orders' },
  { key: 'invoices', path: '/Invoices', label: 'Invoices' },
  { key: 'billing', path: '/BillingDetails', label: 'Billing Details' },
  { key: 'lcps', path: '/Lcps', label: 'LCPs' },
  { key: 'lcpnaps', path: '/Lcpnaps', label: 'LCNAPs' },
  { key: 'lcpnapports', path: '/Lcpnapports', label: 'LCNAP Ports' },
  { key: 'naps', path: '/Naps', label: 'NAPs' },
  { key: 'ports', path: '/Ports', label: 'Ports' },
  { key: 'users', path: '/Users', label: 'Users' }
]

export const labelForPath = (path) =>
  MONITORED_ENDPOINTS.find(e => e.path === path)?.label || path

// The request a health probe should issue for an endpoint: the cheap paged
// variant when the backend has one, the plain collection GET otherwise.
export const probePathFor = (endpoint) => endpoint.probePath || endpoint.path
