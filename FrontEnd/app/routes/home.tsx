import { Link } from "react-router";
import { Button } from "~/components/ui/button";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="px-4 lg:px-6 h-14 flex items-center border-b">
        <Link to="/" className="flex items-center justify-center gap-2">
           <img src="/my-logo.png" alt="RoadLiner Logo" className="h-6 w-auto" />
          <span className="font-bold text-xl">RoadLiner</span>
        </Link>
        <nav className="ml-auto flex gap-4 sm:gap-6">
          <Link to="/login" className="text-sm font-medium hover:underline underline-offset-4">
            Login
          </Link>
          <Link to="/register" className="text-sm font-medium hover:underline underline-offset-4">
            Register
          </Link>
        </nav>
      </header>
      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48 bg-gray-50 dark:bg-gray-900">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center space-y-4 text-center">
              <img src="/my-logo.png" alt="RoadLiner Logo" className="h-36 w-auto mb-4" />
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl/none">
                  Smart City-to-City Logistics
                </h1>
                <p className="mx-auto max-w-[700px] text-gray-500 md:text-xl dark:text-gray-400">
                  Reliable parcel delivery across Sri Lanka. Utilizing fixed-route vans and crowdsourced drivers for first & last mile.
                </p>
              </div>
              <div className="space-x-4">
                <Link to="/register">
                    <Button size="lg">Get Started</Button>
                </Link>
                <Link to="/login">
                    <Button variant="outline" size="lg">Log In</Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
        <section className="w-full py-12 md:py-24 lg:py-32 border-t">
          <div className="container px-4 md:px-6">
            <div className="grid gap-10 sm:px-10 md:gap-16 md:grid-cols-2">
              <div className="space-y-4">
                <div className="inline-block rounded-lg bg-gray-100 px-3 py-1 text-sm dark:bg-gray-800">
                  For Senders
                </div>
                <h2 className="lg:leading-tighter text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl xl:text-[3.4rem] 2xl:text-[3.75rem]">
                  Send with ease
                </h2>
                <p className="mx-auto max-w-[700px] text-gray-500 md:text-xl/relaxed dark:text-gray-400">
                  Choose from Station Drop-off, Home Pickup, or On-Route Handover. We adapt to your schedule.
                </p>
              </div>
              <div className="space-y-4">
                <div className="inline-block rounded-lg bg-gray-100 px-3 py-1 text-sm dark:bg-gray-800">
                  For Drivers
                </div>
                <h2 className="lg:leading-tighter text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl xl:text-[3.4rem] 2xl:text-[3.75rem]">
                  Earn on the go
                </h2>
                <p className="mx-auto max-w-[700px] text-gray-500 md:text-xl/relaxed dark:text-gray-400">
                  Join our crowdsourced network. Pick up parcels near you and drop them at our stations.
                </p>
                 <div className="space-x-4">
                    <Link to="/register?role=driver">
                        <Button>Join as Driver</Button>
                    </Link>
                 </div>
              </div>
            </div>
          </div>
        </section>
        <section className="w-full py-12 md:py-24 lg:py-32 bg-gray-50 dark:bg-gray-900 border-t">
            <div className="container px-4 md:px-6 text-center">
                 <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl mb-8">
                  Track Your Parcel
                </h2>
                <div className="flex flex-col items-center gap-4">
                    <input 
                        type="text" 
                        placeholder="Enter Tracking ID" 
                        className="w-full max-w-md flex h-10 rounded-md border border-gray-200 bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        id="tracking-input"
                    />
                    <Button onClick={(e) => {
                        const input = document.getElementById('tracking-input') as HTMLInputElement;
                        if(input.value) window.location.href = `/track/${input.value}`;
                    }}>Track</Button>
                </div>
            </div>
        </section>
      </main>
      <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t">
        <p className="text-xs text-gray-500 dark:text-gray-400">© 2026 RoadLiner. All rights reserved.</p>
        <nav className="sm:ml-auto flex gap-4 sm:gap-6">
          <Link className="text-xs hover:underline underline-offset-4" to="#">
            Terms of Service
          </Link>
          <Link className="text-xs hover:underline underline-offset-4" to="#">
            Privacy
          </Link>
        </nav>
      </footer>
    </div>
  );
}
