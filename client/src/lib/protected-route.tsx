import { Route, RouteComponentProps } from 'wouter';

/**
 * This is a simplified ProtectedRoute component that no longer protects routes
 * It acts as a pass-through to regular Route since authentication has been removed
 */
export function ProtectedRoute(props: {
  path: string;
  component: (props: RouteComponentProps) => React.JSX.Element;
}) {
  return <Route {...props} />;
}