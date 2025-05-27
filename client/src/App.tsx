import { Suspense, lazy, ComponentType } from "react";
import { Switch, Route, RouteComponentProps } from "wouter";
import { AppProviders } from "@/providers";
import Layout from "@/components/layout";
import { Loader2 } from "lucide-react";

/* ---------- Lazy‑loaded pages ---------- */

const withRouteWrapper = <P extends {}>(Cmp: ComponentType<P>) =>
  // Wouter expects (props: RouteComponentProps) => JSX.Element
  (props: RouteComponentProps) => <Cmp {...(props as any)} />;

const Landing       = withRouteWrapper(lazy(() => import("@/pages/landing")));
const Home          = withRouteWrapper(lazy(() => import("@/pages/home")));
const TextbookPage  = withRouteWrapper(lazy(() => import("@/pages/textbook")));
const GradesPage    = withRouteWrapper(lazy(() => import("@/pages/grades")));

const BookAddPage   = withRouteWrapper(lazy(() => import("@/pages/books/new")));
const BookDetail    = withRouteWrapper(lazy(() => import("@/pages/books/[id]")));
const BookLibrary   = withRouteWrapper(lazy(() => import("@/pages/books/library")));
// Auth page completely removed
const ExamsPage     = withRouteWrapper(lazy(() => import("@/pages/exams/index")));
const ExamsNewPage  = withRouteWrapper(lazy(() => import("@/pages/exams/new")));
const NotFound      = withRouteWrapper(lazy(() => import("@/pages/not-found")));

/* ---------- Loader while pages are loading ---------- */

const LoadingFallback = () => (
  <div className="flex min-h-[200px] items-center justify-center">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
  </div>
);

/* ---------- Authentication is permanently disabled ---------- */

const SecureRoute = Route;

/* ---------- Router tree ---------- */

function Router() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <Switch>
        {/* Public landing page */}
        <Route path="/" component={Landing} />

        {/* Auth page completely removed */}

        {/* Everything below is protected when auth is on, public otherwise */}
        <SecureRoute path="/course" component={Home} />
        <SecureRoute path="/course#:problemSet" component={Home} />
        <SecureRoute path="/textbook" component={TextbookPage} />
        <SecureRoute path="/grades" component={GradesPage} />

        <SecureRoute path="/books/new" component={BookAddPage} />
        <SecureRoute path="/books/library" component={BookLibrary} />
        <SecureRoute path="/books/:id" component={BookDetail} />
        <Route path="/exams" component={ExamsPage} />
        <Route path="/exams/new" component={ExamsNewPage} />

        {/* Fallback */}
        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

/* ---------- App root ---------- */

export default function App() {
  return (
    <AppProviders>
      <Layout>
        <Router />
      </Layout>
    </AppProviders>
  );
}
