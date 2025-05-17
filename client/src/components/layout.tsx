import Header from "@/components/header";
import Footer from "@/components/footer";
import { useLocation } from "wouter";
import { useEffect } from "react";

export default function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const isLandingPage = location === "/";
  
  // Add landing-page class to the html element when on landing page
  useEffect(() => {
    const htmlElement = document.documentElement;
    
    if (isLandingPage) {
      htmlElement.classList.add('landing-page');
    } else {
      htmlElement.classList.remove('landing-page');
    }
    
    // Cleanup on unmount
    return () => {
      htmlElement.classList.remove('landing-page');
    };
  }, [isLandingPage]);
  
  return (
    <div className={`flex min-h-screen flex-col bg-gray-50 dark:bg-gray-900 ${isLandingPage ? 'overflow-hidden' : 'overflow-auto'}`}>
      <Header />
      {/* Main content area with proper overflow behavior */}
      <main className={`flex-1 ${isLandingPage ? 'overflow-hidden' : 'overflow-visible'}`}>{children}</main>
      <Footer />
    </div>
  );
}